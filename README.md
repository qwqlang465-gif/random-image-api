# Nyaovo Random Image API

Nyaovo Random Image API 是一个自托管随机图片 API，适合个人图床后台、多图库随机图、PC 横屏壁纸和 mobile 竖屏壁纸管理。不使用数据库，图片直接存放在 `public/images` 目录中，既可以通过后台上传，也可以手动把图片放进服务器目录。

## 功能特性

- Node.js 20 + Express。
- 无数据库，启动时扫描图片目录并使用内存缓存。
- 多图库结构：`public/images/{gallery}/pc` 和 `public/images/{gallery}/mobile`。
- 公开随机图 API，支持返回图片本体、JSON 或 redirect。
- 后台登录管理，支持创建图库、上传多图、筛选、复制 URL、删除图片。
- 上传校验读取真实文件头，不允许 SVG、HTML、JS、PHP、EXE 等危险文件。
- Cookie Session、CSRF、Helmet、限流、CORS 配置。
- Dockerfile 与 `docker-compose.yml`，适合 1Panel / Docker Compose 部署。

## 目录结构

```text
.
├── src
│   ├── index.js
│   ├── config.js
│   ├── imageStore.js
│   ├── routes
│   │   ├── publicRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware
│   │   ├── auth.js
│   │   ├── csrf.js
│   │   └── upload.js
│   └── utils
│       ├── file.js
│       └── response.js
├── public
│   ├── images
│   └── assets
├── views
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env.example
└── README.md
```

## 本地运行

```bash
npm install
cp .env.example .env
npm start
```

访问：

- 首页：`http://localhost:3000/`
- 后台：`http://localhost:3000/admin`
- 默认账号：`admin`
- 默认密码：`changeme`

首次运行后请立即修改 `.env` 中的 `ADMIN_PASSWORD` 和 `SESSION_SECRET`。

## Docker Compose 部署

```bash
docker compose up -d --build
```

默认会把宿主机 `./images` 挂载到容器内 `/app/public/images`：

```yaml
volumes:
  - ./images:/app/public/images
```

后台需要上传和删除图片，所以这个 volume 不能加 `:ro`，并且 `images` 目录需要可写。

## 1Panel 部署教程

1. 在 1Panel 新建应用或使用“编排 / Docker Compose”。
2. 上传本项目文件，或把仓库拉取到服务器目录。
3. 确认 `docker-compose.yml` 中端口和环境变量符合你的域名。
4. 把 `PUBLIC_BASE_URL` 改为你的公网访问地址，例如 `https://api.example.com`。
5. 把 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`SESSION_SECRET` 改为强随机值。
6. 启动编排。
7. 在反向代理中绑定域名，并建议额外给后台路径加 IP 白名单、Basic Auth 或访问规则。

## 如何创建图库

后台进入 `/admin` 后，在“创建图库”输入图库名，例如：

```text
luotianyi
miku
anime
```

图库名只能包含小写字母、数字、短横线和下划线。不支持中文目录名。

也可以手动创建：

```text
public/images/luotianyi/pc
public/images/luotianyi/mobile
```

程序会定期扫描目录并刷新缓存。

## 如何上传 PC 图片

进入后台上传区域：

1. 选择图库。
2. 类型选择 `pc 横屏图`。
3. 选择一张或多张图片上传。

`pc` 适合横屏壁纸、电脑背景。

## 如何上传 mobile 图片

进入后台上传区域：

1. 选择图库。
2. 类型选择 `mobile 竖屏图`。
3. 选择一张或多张图片上传。

`mobile` 适合竖屏壁纸、手机背景。

支持格式：`jpg`、`jpeg`、`png`、`webp`、`gif`、`avif`。默认单文件最大 10MB，每次最多上传 20 张，可用环境变量调整。

## API 文档

### GET `/`

返回 API 首页，展示项目名、总图片数、图库数量、每个图库的 pc/mobile 数量、调用示例和一张随机预览图。

### GET `/health`

```json
{
  "status": "ok",
  "imageCount": 0,
  "galleryCount": 3,
  "uptime": 12,
  "timestamp": "2026-05-03T12:00:00.000Z"
}
```

### GET `/api/random`

默认随机返回任意图库、任意设备类型的一张图片本体。

参数：

- `gallery`：指定图库，例如 `luotianyi`。
- `device`：`pc`、`mobile`、`all`。
- `type`：`image`、`json`、`redirect`。

示例：

```text
/api/random
/api/random?gallery=luotianyi
/api/random?gallery=luotianyi&device=pc
/api/random?gallery=luotianyi&device=mobile
/api/random?gallery=luotianyi&device=pc&type=json
/api/random?gallery=luotianyi&device=mobile&type=redirect
```

JSON 返回格式：

```json
{
  "url": "https://api.example.com/images/luotianyi/pc/001.webp",
  "gallery": "luotianyi",
  "device": "pc",
  "filename": "001.webp",
  "size": 123456,
  "type": "webp",
  "total": 12
}
```

### GET `/api/:gallery`

指定图库快捷接口：

```text
/api/luotianyi
/api/luotianyi?device=pc
/api/luotianyi?device=mobile&type=json
```

### GET `/api/galleries`

返回所有图库统计：

```json
{
  "galleries": [
    {
      "name": "luotianyi",
      "total": 20,
      "pc": 12,
      "mobile": 8
    }
  ]
}
```

### GET `/api/list`

返回图片列表，不返回服务器绝对路径。

参数：

- `gallery=luotianyi`
- `device=pc`
- `limit=100`

默认最多返回 100 条。

### GET `/api/stats`

返回完整统计信息，包括图片总数、图库数量、各图库统计和缓存生成时间。

## 后台管理说明

- 后台路径默认是 `/admin`，可通过 `ADMIN_PATH` 改成不明显路径。
- 必须登录后才能访问后台。
- 不提供公开上传接口。
- 所有后台 POST 操作都有 CSRF 防护。
- 登录失败有限流，防止爆破。
- 创建图库后自动创建 `pc` 和 `mobile` 目录。
- 上传后自动重命名为 `时间戳-随机字符串.扩展名`。
- 删除图片前浏览器会弹出确认框。

## 环境变量说明

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 服务监听端口 |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | JSON 中返回的公开 URL 前缀 |
| `IMAGE_ROOT` | `public/images` | 图片根目录 |
| `CACHE_TTL_SECONDS` | `60` | 图片缓存刷新间隔 |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 通用限流窗口 |
| `RATE_LIMIT_MAX` | `120` | 通用限流最大请求数 |
| `ADMIN_USERNAME` | `admin` | 管理员用户名 |
| `ADMIN_PASSWORD` | `changeme` | 管理员密码 |
| `SESSION_SECRET` | `please-change-this` | Session 密钥 |
| `ADMIN_PATH` | `/admin` | 后台路径 |
| `MAX_FILE_SIZE_MB` | `10` | 单文件最大大小 |
| `MAX_UPLOAD_FILES` | `20` | 单次最大上传数量 |
| `CORS_ORIGIN` | `*` | CORS 来源，多个来源用逗号分隔 |

## 安全建议

- 部署前必须修改 `ADMIN_PASSWORD` 和 `SESSION_SECRET`。
- 建议把 `ADMIN_PATH` 改成不明显路径。
- 反向代理时建议给后台路径额外加访问限制，例如 IP 白名单或 Basic Auth。
- 不要把图片目录挂载为只读，因为后台需要上传和删除图片。
- 不要开放任何额外的匿名上传入口。
- 定期备份 `images` 目录。

## 版权提醒

不要上传未授权图片用于公开服务。推荐使用自己拥有版权、AI 自生成、官方允许使用或已经获得授权的图片。
