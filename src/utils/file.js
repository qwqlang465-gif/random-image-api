import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { allowedImageExtensions, deviceNames, galleryNamePattern } from '../config.js';

const mimeByExt = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif'
};

export function isValidGalleryName(name) {
  return typeof name === 'string' && galleryNamePattern.test(name);
}

export function isValidDevice(device) {
  return deviceNames.includes(device);
}

export function assertSafeGallery(name) {
  if (!isValidGalleryName(name)) {
    throw new Error('图库名只能包含小写字母、数字、短横线和下划线');
  }
}

export function assertSafeDevice(device) {
  if (!isValidDevice(device)) {
    throw new Error('设备类型只能是 pc 或 mobile');
  }
}

export function safeJoin(root, ...segments) {
  const target = path.resolve(root, ...segments);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('非法路径');
  }
  return target;
}

export function getOriginalExtension(filename) {
  return path.extname(filename || '').replace('.', '').toLowerCase();
}

export function normalizeDetectedExtension(ext) {
  return ext === 'jpeg' ? 'jpg' : ext;
}

export async function detectImageType(buffer, originalName) {
  const originalExt = getOriginalExtension(originalName);
  if (!allowedImageExtensions.has(originalExt)) {
    throw new Error('不支持的文件扩展名');
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected) {
    throw new Error('无法识别真实图片类型');
  }

  const detectedExt = normalizeDetectedExtension(detected.ext);
  const expectedMime = mimeByExt[detectedExt];
  if (!allowedImageExtensions.has(detectedExt) || detected.mime !== expectedMime) {
    throw new Error('不支持的真实图片类型');
  }

  const allowedOriginalExts = detectedExt === 'jpg' ? ['jpg', 'jpeg'] : [detectedExt];
  if (!allowedOriginalExts.includes(originalExt)) {
    throw new Error('文件扩展名与真实图片类型不匹配');
  }

  return { ext: detectedExt, mime: detected.mime };
}

export function createSafeFilename(ext) {
  return `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
}

export function publicImagePath(gallery, device, filename) {
  return `/images/${encodeURIComponent(gallery)}/${encodeURIComponent(device)}/${encodeURIComponent(filename)}`;
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
