import fs from 'node:fs/promises';
import path from 'node:path';

const viewRoot = path.resolve(process.cwd(), 'views');

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function renderView(filename, data = {}) {
  const filePath = path.resolve(viewRoot, filename);
  let html = await fs.readFile(filePath, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, String(value ?? ''));
  }
  return html;
}

export function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
}

export function jsonError(res, status, message, extra = {}) {
  return res.status(status).json({ error: message, ...extra });
}
