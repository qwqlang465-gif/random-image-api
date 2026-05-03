import crypto from 'node:crypto';

export function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  return req.session.csrfToken;
}

export function csrfProtection(req, res, next) {
  ensureCsrfToken(req);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const submitted = req.body?._csrf || req.query?._csrf || req.get('x-csrf-token');
  if (!submitted || submitted !== req.session.csrfToken) {
    return res.status(403).send('CSRF token invalid');
  }
  next();
}
