import path from 'node:path';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeBaseUrl = (url) => String(url || 'http://localhost:3000').replace(/\/+$/, '');
const normalizeAdminPath = (value) => {
  const raw = String(value || '/admin').trim();
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, '') || '/admin';
};

const imageRootInput = process.env.IMAGE_ROOT || 'public/images';

export const config = {
  port: toInt(process.env.PORT, 3000),
  publicBaseUrl: normalizeBaseUrl(process.env.PUBLIC_BASE_URL || 'http://localhost:3000'),
  imageRoot: path.resolve(process.cwd(), imageRootInput),
  imageRootPublic: imageRootInput.replace(/\\/g, '/'),
  cacheTtlSeconds: toInt(process.env.CACHE_TTL_SECONDS, 60),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60000),
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 120),
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'changeme',
  sessionSecret: process.env.SESSION_SECRET || 'please-change-this',
  adminPath: normalizeAdminPath(process.env.ADMIN_PATH || '/admin'),
  maxFileSizeMb: toInt(process.env.MAX_FILE_SIZE_MB, 10),
  maxUploadFiles: toInt(process.env.MAX_UPLOAD_FILES, 20),
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

export const deviceNames = ['pc', 'mobile'];
export const allowedImageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
export const galleryNamePattern = /^[a-z0-9_-]+$/;
