# Nyaovo Random Image API

[中文](./README.md) | [English](./README_en.md)

A self-hosted random image API with an admin panel. Built on Node.js + Express, no database required. Images are stored on the local filesystem. Suitable for personal image hosting and wallpaper sites.

## Features

- Multi-gallery management with `pc` (landscape) and `mobile` (portrait) categories
- Random image API returning raw image or JSON
- Admin panel: upload, preview, filter, sort, batch delete
- File header validation on upload, rejects dangerous file types
- Cookie Session, CSRF, Helmet, Rate Limiting, CORS

## Routing

The app is mounted under the `/image` subpath:

| Path | Purpose |
|------|---------|
| `/image` | Home |
| `/image/admin` | Admin panel |
| `/image/images/...` | Static image access |
| `/image/api/...` | API endpoints |

## Deployment

### Docker (Recommended)

**docker compose (Recommended)**

```bash
git clone https://github.com/user/nyaovo-random-image-api.git
cd nyaovo-random-image-api

# Edit environment variables
cp .env.example .env
# At minimum, change ADMIN_PASSWORD and SESSION_SECRET

docker compose up -d --build
```

Access at `http://localhost:3400/image`, admin at `http://localhost:3400/image/admin`.

**docker run**

```bash
docker build -t nyaovo-random-image-api .

docker run -d \
  --name nyaovo \
  -p 3400:3000 \
  -v ./images:/app/public/images \
  -e ADMIN_PASSWORD=your-password \
  -e SESSION_SECRET=your-secret \
  -e PUBLIC_BASE_URL=http://localhost:3400 \
  nyaovo-random-image-api
```

> The `images` volume must be writable. Do not use `:ro`.

**1Panel**

1. Create a Docker Compose stack, upload project or clone via Git
2. Use the included `docker-compose.yml`, edit environment variables
3. After starting, configure a reverse proxy in OpenResty / Nginx to bind your domain

### Local

```bash
npm install
cp .env.example .env   # edit config
npm start               # or npm run dev for hot reload
```

Default credentials: `admin` / `changeme`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Internal server port |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | URL prefix for JSON responses |
| `IMAGE_ROOT` | `public/images` | Image storage directory |
| `CACHE_TTL_SECONDS` | `60` | Cache refresh interval (seconds) |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `120` | Max requests per window |
| `ADMIN_USERNAME` | `admin` | Admin username |
| `ADMIN_PASSWORD` | `changeme` | Admin password |
| `SESSION_SECRET` | `please-change-this` | Session secret key |
| `ADMIN_PATH` | `/image/admin` | Admin panel path |
| `MAX_FILE_SIZE_MB` | `10` | Max file size per upload (MB) |
| `MAX_UPLOAD_FILES` | `20` | Max files per batch upload |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

## Project Structure

```text
.
├── src
│   ├── index.js
│   ├── config.js
│   ├── imageStore.js
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── public
│   ├── images/           # Image storage
│   │   └── {gallery}/
│   │       ├── pc/
│   │       └── mobile/
│   └── assets/           # CSS, JS
├── views/                # HTML templates
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API

### `GET /image/api/random`

Returns a random image.

Parameters:
- `gallery` — Gallery name
- `device` — `pc` / `mobile` / `all`
- `type` — `image` (default) / `json` / `redirect`

```
/image/api/random?gallery=anime&device=pc&type=json
```

JSON response:
```json
{
  "url": "https://example.com/image/images/anime/pc/001.webp",
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

### Other Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /image/api/:gallery` | Gallery shortcut |
| `GET /image/api/galleries` | Gallery statistics |
| `GET /image/api/list` | Paginated image list |
| `GET /image/api/stats` | Global statistics |
| `GET /image/health` | Health check |

## Image Management

- Supported formats: jpg, jpeg, png, webp, gif, avif
- Real file format is detected on upload; wrong extensions are corrected
- Gallery names: lowercase letters, numbers, underscores, hyphens only
- You can also drop images into `public/images/{gallery}/pc` or `mobile` directly; the app will pick them up automatically

## Security

- Change `ADMIN_PASSWORD` and `SESSION_SECRET` before deploying
- Consider using a custom `ADMIN_PATH` that is hard to guess
- Add IP whitelist or Basic Auth for the admin path in your reverse proxy
- Do not host unauthorized images for public access

## License

[MIT License](./LICENSE)
