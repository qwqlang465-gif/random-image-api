# Nyaovo Random Image API

[中文](./README.md) | [English](./README_en.md)

Nyaovo Random Image API is a lightweight, self-hosted random image API with a private admin panel. It is designed for personal image hosting, multi-gallery random image endpoints, and easy deployment via Docker or 1Panel.

Project focus: **A private, fully controllable image backend + public multi-gallery random APIs**. It requires authentication to access the admin panel, providing no anonymous upload capabilities. Images are stored natively in the file system and can be managed either via the admin UI or manually in the server directory.

## 🌟 Features

- **Lightweight & Efficient**: Built on Node.js 20 and Express.
- **No Database Needed**: Scans the image directory into an in-memory cache at startup, and auto-refreshes periodically.
- **Gallery & Device Layout**: Supports structured storage via `public/images/{gallery}/pc` (desktop/landscape) and `public/images/{gallery}/mobile` (mobile/portrait).
- **Flexible API**: The public random API can return the raw image (stream/redirect) or JSON metadata.
- **Powerful Admin UI**: Built with plain HTML/CSS/JS (no build steps). Features include multi-file upload, gallery creation, image preview, filtering, sorting, renaming, and batch deletion.
- **Security Check**: Reads true file headers during uploads to validate image types and blocks dangerous files like SVG/HTML/PHP/EXE.
- **Hardened**: Includes Cookie Session, CSRF protection, Helmet, Rate Limiting, and CORS configurations.
- **Deployment Ready**: Comes with a `Dockerfile` and `docker-compose.yml`.

## 🗺️ Routing

The entire application is mounted under the `/image` subpath:

- **Home**: `/image`
- **Admin Panel**: `/image/admin`
- **Static Images**: `/image/images/...`
- **API Endpoints**: `/image/api/...`

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env

# 3. Start server
npm start
```

Default access URLs:
- Home: `http://localhost:3000/image`
- Admin: `http://localhost:3000/image/admin`
- Default Username: `admin`
- Default Password: `changeme`

> ⚠️ **Warning**: Change `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env` before deploying!

### Docker Compose

```bash
docker compose up -d --build
```

The application maps internal port `3000` to host port `3400` by default.

```yaml
ports:
  - "3400:3000"
volumes:
  - ./images:/app/public/images
```

> **Note**: The `./images` volume must be writable for the admin panel to upload or delete files. Do not mount it as read-only (`:ro`).

## ⚙️ Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | Internal server port |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Public URL prefix used in JSON responses (Docker default is `:3400`) |
| `IMAGE_ROOT` | `public/images` | Path to the image directory |
| `CACHE_TTL_SECONDS` | `60` | Background cache refresh interval |
| `RATE_LIMIT_WINDOW_MS`| `60000` | Global rate limit window |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `ADMIN_USERNAME` | `admin` | Admin username |
| `ADMIN_PASSWORD` | `changeme` | Admin password |
| `SESSION_SECRET` | `please-change-this`| Session secret key |
| `ADMIN_PATH` | `/image/admin` | Custom admin path |
| `MAX_FILE_SIZE_MB` | `10` | Max file size per upload |
| `MAX_UPLOAD_FILES` | `20` | Max files per batch upload |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

## 📦 API Reference

### `GET /image/api/random`
Returns a random image.

**Query Parameters:**
- `gallery`: Gallery name (e.g., `anime`).
- `device`: Device type (`pc`, `mobile`, `all`).
- `type`: Response format (`image`, `json`, `redirect`).

**Examples:**
```text
/image/api/random?gallery=anime
/image/api/random?gallery=anime&device=pc&type=json
```

**JSON Example:**
```json
{
  "url": "https://api.example.com/image/images/anime/pc/001.webp",
  "gallery": "anime",
  "device": "pc",
  "filename": "001.webp",
  "size": 123456,
  "width": 1920,
  "height": 1080,
  "type": "webp",
  "total": 12
}
```

### Gallery Shortcut `GET /image/api/:gallery`
```text
/image/api/anime?device=mobile&type=json
```

### Other Endpoints
- `GET /image/api/galleries`: Get gallery statistics.
- `GET /image/health`: Server health check and uptime.
- `GET /image/api/list`: Paginated image list.
- `GET /image/api/stats`: Overall image and gallery stats.

## 🛡️ Security Notes

- Change default passwords and session secrets before deployment.
- Consider hiding `ADMIN_PATH` to a custom obscure string.
- Never mount the `public/images` directory as read-only.
- Back up your image directory regularly.

## 📄 License & Copyright

Released under the [MIT License](./LICENSE).

Please do not use unauthorized images for public-facing services. You are responsible for ensuring that you have the right to distribute the images hosted on your instance.
