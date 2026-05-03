import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import rateLimit from 'express-rate-limit';
import { config, deviceNames } from '../config.js';
import { requireAdmin } from '../middleware/auth.js';
import { ensureCsrfToken } from '../middleware/csrf.js';
import { runUpload } from '../middleware/upload.js';
import {
  assertSafeDevice,
  assertSafeGallery,
  createSafeFilename,
  detectImageType,
  ensureDir,
  formatBytes,
  publicImagePath,
  safeJoin
} from '../utils/file.js';
import { escapeHtml, renderView } from '../utils/response.js';

const loginLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: '登录尝试过于频繁，请稍后再试'
});

function statusBanner(req) {
  const message = req.session.flash;
  delete req.session.flash;
  if (!message) return '';
  return `<div class="notice ${escapeHtml(message.type || 'info')}">${escapeHtml(message.text)}</div>`;
}

function galleryOptions(galleries, selected = '') {
  if (galleries.length === 0) return '<option value="">请先创建图库</option>';
  return galleries
    .map((gallery) => {
      const active = gallery.name === selected ? 'selected' : '';
      return `<option value="${escapeHtml(gallery.name)}" ${active}>${escapeHtml(gallery.name)}</option>`;
    })
    .join('');
}

function galleryCards(galleries, csrfToken, adminPath) {
  if (galleries.length === 0) {
    return '<div class="empty-state">还没有图库。</div>';
  }
  return galleries
    .map((gallery) => {
      const deleteButton =
        gallery.total === 0
          ? `<form method="post" action="${adminPath}/galleries/delete" class="inline-form confirm-form" data-confirm="确定删除空图库 ${escapeHtml(gallery.name)} 吗？">
              <input type="hidden" name="_csrf" value="${csrfToken}">
              <input type="hidden" name="gallery" value="${escapeHtml(gallery.name)}">
              <button class="danger" type="submit">删除空图库</button>
            </form>`
          : '<span class="muted">非空图库不可删除</span>';
      return `<article class="stat-card">
        <h3>${escapeHtml(gallery.name)}</h3>
        <p><strong>${gallery.total}</strong> 张图片</p>
        <p>PC：${gallery.pc} / Mobile：${gallery.mobile}</p>
        ${deleteButton}
      </article>`;
    })
    .join('');
}

function recentImages(images) {
  if (images.length === 0) return '<div class="empty-state">暂无最近上传图片。</div>';
  return images
    .slice(0, 8)
    .map(
      (image) => `<article class="thumb-card compact">
        <img src="${escapeHtml(image.path)}" alt="${escapeHtml(image.filename)}" loading="lazy">
        <div>
          <strong>${escapeHtml(image.filename)}</strong>
          <span>${escapeHtml(image.gallery)} / ${escapeHtml(image.device)}</span>
        </div>
      </article>`
    )
    .join('');
}

function imageCards(images, csrfToken, adminPath) {
  if (images.length === 0) return '<div class="empty-state">当前筛选下没有图片。</div>';
  return images
    .map((image) => {
      const url = `${config.publicBaseUrl}${publicImagePath(image.gallery, image.device, image.filename)}`;
      return `<article class="image-card">
        <img src="${escapeHtml(image.path)}" alt="${escapeHtml(image.filename)}" loading="lazy">
        <div class="image-meta">
          <strong title="${escapeHtml(image.filename)}">${escapeHtml(image.filename)}</strong>
          <span>${escapeHtml(image.gallery)} / ${escapeHtml(image.device)}</span>
          <span>${formatBytes(image.size)}</span>
        </div>
        <div class="card-actions">
          <button type="button" class="copy-button" data-copy="${escapeHtml(url)}">复制 URL</button>
          <form method="post" action="${adminPath}/images/delete" class="confirm-form" data-confirm="确定删除 ${escapeHtml(image.filename)} 吗？">
            <input type="hidden" name="_csrf" value="${csrfToken}">
            <input type="hidden" name="gallery" value="${escapeHtml(image.gallery)}">
            <input type="hidden" name="device" value="${escapeHtml(image.device)}">
            <input type="hidden" name="filename" value="${escapeHtml(image.filename)}">
            <button class="danger" type="submit">删除</button>
          </form>
        </div>
      </article>`;
    })
    .join('');
}

function filterLinks(galleries, currentGallery, currentDevice, adminPath) {
  const galleryLinks = ['all', ...galleries.map((gallery) => gallery.name)]
    .map((gallery) => {
      const value = gallery === 'all' ? '' : gallery;
      const active = (currentGallery || '') === value ? 'active' : '';
      const label = gallery === 'all' ? '全部图库' : gallery;
      const url = `${adminPath}?gallery=${encodeURIComponent(value)}&device=${encodeURIComponent(currentDevice || 'all')}`;
      return `<a class="${active}" href="${url}">${escapeHtml(label)}</a>`;
    })
    .join('');
  const deviceLinks = ['all', ...deviceNames]
    .map((device) => {
      const active = (currentDevice || 'all') === device ? 'active' : '';
      const url = `${adminPath}?gallery=${encodeURIComponent(currentGallery || '')}&device=${device}`;
      return `<a class="${active}" href="${url}">${device === 'all' ? '全部类型' : escapeHtml(device)}</a>`;
    })
    .join('');
  return `<div class="filter-row">${galleryLinks}</div><div class="filter-row">${deviceLinks}</div>`;
}

function apiExamples(adminPath) {
  const examples = [
    '/image/api/random',
    '/image/api/random?gallery=luotianyi',
    '/image/api/random?gallery=luotianyi&device=pc',
    '/image/api/random?gallery=luotianyi&device=mobile&type=json',
    '/image/api/galleries',
    '/image/api/list?limit=100'
  ];
  return examples
    .map((example) => `<a href="${escapeHtml(example)}" target="_blank" rel="noreferrer">${escapeHtml(example)}</a>`)
    .join('');
}

export function createAdminRouter(store) {
  const router = express.Router();

  router.get('/login', async (req, res, next) => {
    try {
      const html = await renderView('admin-login.html', {
        adminPath: escapeHtml(config.adminPath),
        csrfToken: ensureCsrfToken(req),
        message: statusBanner(req)
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    if (username === config.adminUsername && password === config.adminPassword) {
      req.session.regenerate((error) => {
        if (error) return res.status(500).send('登录失败');
        req.session.isAdmin = true;
        req.session.csrfToken = undefined;
        res.redirect(config.adminPath);
      });
      return;
    }
    req.session.flash = { type: 'error', text: '用户名或密码错误' };
    res.redirect(`${config.adminPath}/login`);
  });

  router.post('/logout', requireAdmin, (req, res) => {
    req.session.destroy(() => {
      res.redirect(`${config.adminPath}/login`);
    });
  });

  router.get('/', requireAdmin, async (req, res, next) => {
    try {
      const stats = await store.getStats();
      const csrfToken = ensureCsrfToken(req);
      const currentGallery = req.query.gallery || '';
      const currentDevice = deviceNames.includes(req.query.device) ? req.query.device : 'all';
      const filtered = await store.listImages({
        gallery: currentGallery || undefined,
        device: currentDevice,
        limit: 200
      });
      const html = await renderView('admin-dashboard.html', {
        adminPath: escapeHtml(config.adminPath),
        csrfToken,
        message: statusBanner(req),
        imageCount: stats.imageCount,
        galleryCount: stats.galleryCount,
        galleryOptions: galleryOptions(stats.galleries, currentGallery),
        galleryCards: galleryCards(stats.galleries, csrfToken, config.adminPath),
        recentImages: recentImages(stats.images),
        imageCards: imageCards(filtered, csrfToken, config.adminPath),
        filterLinks: filterLinks(stats.galleries, currentGallery, currentDevice, config.adminPath),
        apiExamples: apiExamples(config.adminPath),
        maxFileSizeMb: config.maxFileSizeMb,
        maxUploadFiles: config.maxUploadFiles
      });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  });

  router.post('/galleries', requireAdmin, async (req, res) => {
    try {
      const gallery = String(req.body.gallery || '').trim();
      await store.ensureGallery(gallery);
      req.session.flash = { type: 'success', text: `图库 ${gallery} 已创建` };
    } catch (error) {
      req.session.flash = { type: 'error', text: error.message };
    }
    res.redirect(config.adminPath);
  });

  router.post('/galleries/delete', requireAdmin, async (req, res) => {
    try {
      await store.deleteEmptyGallery(String(req.body.gallery || ''));
      req.session.flash = { type: 'success', text: '图库已删除' };
    } catch (error) {
      req.session.flash = { type: 'error', text: error.message };
    }
    res.redirect(config.adminPath);
  });

  router.post('/upload', requireAdmin, runUpload, async (req, res) => {
    const results = { success: [], failed: [] };
    try {
      const gallery = String(req.body.gallery || '').trim();
      const device = String(req.body.device || '').trim();
      assertSafeGallery(gallery);
      assertSafeDevice(device);
      await store.ensureGallery(gallery);
      const targetDir = safeJoin(config.imageRoot, gallery, device);
      await ensureDir(targetDir);

      for (const file of req.files || []) {
        try {
          const detected = await detectImageType(file.buffer, file.originalname);
          const filename = createSafeFilename(detected.ext);
          const target = safeJoin(targetDir, filename);
          await fs.writeFile(target, file.buffer, { flag: 'wx', mode: 0o644 });
          results.success.push(filename);
        } catch (error) {
          results.failed.push(`${file.originalname}: ${error.message}`);
        }
      }

      await store.refresh();
      const messages = [];
      if (results.success.length) messages.push(`成功上传 ${results.success.length} 张：${results.success.join('、')}`);
      if (results.failed.length) messages.push(`失败 ${results.failed.length} 张：${results.failed.join('；')}`);
      req.session.flash = {
        type: results.failed.length ? 'error' : 'success',
        text: messages.join('。') || '没有收到上传文件'
      };
      res.redirect(config.adminPath);
    } catch (error) {
      req.session.flash = { type: 'error', text: error.message };
      res.redirect(config.adminPath);
    }
  });

  router.post('/images/delete', requireAdmin, async (req, res) => {
    try {
      await store.deleteImage({
        gallery: String(req.body.gallery || ''),
        device: String(req.body.device || ''),
        filename: path.basename(String(req.body.filename || ''))
      });
      req.session.flash = { type: 'success', text: '图片已删除' };
    } catch (error) {
      req.session.flash = { type: 'error', text: error.message };
    }
    res.redirect(config.adminPath);
  });

  return router;
}
