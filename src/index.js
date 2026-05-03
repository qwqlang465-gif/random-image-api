import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { appBasePath, config } from './config.js';
import { ImageStore } from './imageStore.js';
import { attachAdminPath } from './middleware/auth.js';
import { csrfProtection } from './middleware/csrf.js';
import { createPublicRouter } from './routes/publicRoutes.js';
import { createAdminRouter } from './routes/adminRoutes.js';

const app = express();
const store = new ImageStore();

await store.init();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(',').map((item) => item.trim()),
    credentials: config.corsOrigin !== '*'
  })
);

app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(`${appBasePath}/assets`, express.static(path.resolve(process.cwd(), 'public/assets'), { index: false }));
app.use(
  `${appBasePath}/images`,
  express.static(config.imageRoot, {
    index: false,
    dotfiles: 'ignore',
    setHeaders(res) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'nyaovo.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use(attachAdminPath(config.adminPath));
app.use(config.adminPath, csrfProtection, createAdminRouter(store));
app.use(appBasePath, createPublicRouter(store));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(config.port, () => {
  console.log(`Nyaovo Random Image API listening on http://0.0.0.0:${config.port}`);
  console.log(`Admin path: ${config.adminPath}`);
});
