# Nyaovo Random Image API

[中文](./README.md) | [English](./README_en.md)

Nyaovo Random Image API 是一个轻量、自托管、无数据库的随机图片 API 与个人图床后台。它适合部署在自己的服务器、NAS、1Panel 或 Docker Compose 环境中，用于管理多图库图片，并按图库与设备类型（电脑/手机）随机返回图片。

项目定位：**自己可控的图片后台 + 多图库随机图接口**。后台必须登录，不提供匿名上传接口；图片直接保存在文件系统中，可通过后台界面上传，也可直接把图片放入服务器目录。

## 🌟 功能特性

- **轻量高效**：基于 Node.js 20 + Express 构建。
- **无数据库**：启动时扫描图片目录，运行时使用内存缓存，定期自动刷新。
- **多图库 & 多终端**：支持 `public/images/{gallery}/pc`（横屏/电脑壁纸）与 `public/images/{gallery}/mobile`（竖屏/手机壁纸）分类。
- **多样化 API**：公开随机图 API 支持返回图片本体（重定向/流输出）或 JSON 数据。
- **强大后台**：提供简洁的 HTML/CSS/JS 管理界面（无前端构建要求），支持图库创建、批量上传、类型分类、重命名、预览、筛选、排序、复制 URL 及批量删除等。
- **安全验证**：上传时读取真实文件头识别图片类型，防范虚假后缀格式；拒绝 SVG/HTML/PHP/EXE 等危险文件。
- **基础安全**：内置 Cookie Session, CSRF 防护, Helmet 安全头, 接口限流 (Rate Limiting) 以及 CORS 配置。
- **易于部署**：提供 `Dockerfile` 和 `docker-compose.yml`，一键部署。

## 🗺️ 路径约定

项目统一挂载在 `/image` 子路径下（根路径 `/` 留空）：

- **API 首页**：`/image`
- **管理后台**：`/image/admin`
- **图片静态访问**：`/image/images/...`
- **API 接口**：`/image/api/...`

## 📁 目录结构

```text
.
├── src
│   ├── index.js          # 入口文件
│   ├── config.js         # 配置管理
│   ├── imageStore.js     # 图片内存缓存与扫描
│   ├── routes/           # 路由目录
│   ├── middleware/       # 中间件 (Auth, Upload, Security)
│   └── utils/            # 工具类
├── public
│   ├── images/           # 图片存储根目录
│   │   ├── luotianyi/    # 图库名
│   │   │   ├── pc/       # 电脑端图片
│   │   │   └── mobile/   # 手机端图片
│   │   └── ...
│   └── assets/           # 静态资源 (CSS, JS)
├── views/                # EJS / HTML 模板视图
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env.example
```

## 🚀 快速启动

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 复制配置并修改
cp .env.example .env

# 3. 启动服务
npm start
# 或者使用 npm run dev 进行热更新开发
```

本地默认访问地址：
- API 首页：`http://localhost:3000/image`
- 后台管理：`http://localhost:3000/image/admin`
- 默认账号：`admin`
- 默认密码：`changeme`

> ⚠️ **警告**：首次运行后请立即在 `.env` 中修改 `ADMIN_PASSWORD` 和 `SESSION_SECRET`！

### Docker Compose 部署

```bash
docker compose up -d --build
```

Docker Compose 默认对外暴露 `3400` 端口（容器内仍为 `3000`），挂载 `./images` 目录到容器 `/app/public/images`。

```yaml
ports:
  - "3400:3000"
volumes:
  - ./images:/app/public/images
```

> **注意**：挂载的 `images` 目录必须具有写权限，否则后台无法正常上传和删除图片。请勿添加 `:ro` 只读标志。

### 1Panel 部署

1. 在 1Panel 新建 Docker Compose 编排。
2. 上传项目文件或使用 Git 拉取。
3. 使用项目自带的 `docker-compose.yml`。
4. 修改环境变量（设置安全的强密码、正确的 `PUBLIC_BASE_URL` 等）。
5. 启动编排并在 1Panel 的 OpenResty / Nginx 反向代理中绑定域名。
6. **强烈建议**：在反代层额外为 `/image/admin` 添加 IP 白名单或 Basic Auth 以增强安全性。

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 容器内服务监听端口 |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | JSON 返回的公开 URL 前缀。Docker 下默认为 `http://localhost:3400` |
| `IMAGE_ROOT` | `public/images` | 图片存放根目录 |
| `CACHE_TTL_SECONDS` | `60` | 目录扫描及缓存刷新间隔（秒） |
| `RATE_LIMIT_WINDOW_MS`| `60000` | 全局限流时间窗口（毫秒） |
| `RATE_LIMIT_MAX` | `120` | 时间窗口内的最大请求次数 |
| `ADMIN_USERNAME` | `admin` | 后台登录用户名 |
| `ADMIN_PASSWORD` | `changeme` | 后台登录密码 |
| `SESSION_SECRET` | `please-change-this`| Session 加密密钥 |
| `ADMIN_PATH` | `/image/admin` | 后台管理路径前缀 |
| `MAX_FILE_SIZE_MB` | `10` | 单个上传图片的最大大小 (MB) |
| `MAX_UPLOAD_FILES` | `20` | 单次批量上传的最大图片数量 |
| `CORS_ORIGIN` | `*` | CORS 允许来源（多个用逗号分隔） |

## 📦 图库与图片管理

**创建图库**：
进入管理后台的“图库”页，输入名称创建（仅支持小写字母、数字、下划线、短横线，不支持中文名及路径穿越）。也可直接在服务器下新建文件夹，如 `public/images/anime/pc`。程序会自动定期扫描，后台操作则会立即刷新缓存。

**上传图片**：
- 支持格式：`jpg, jpeg, png, webp, gif, avif`。
- 上传方式支持：自动随机命名、保留原名或自定义前缀命名。
- 即使扩展名错误，也会根据真实文件头解析保存（如伪装成 jpg 的 webp 会被正确保存为 `.webp`）。

## 📡 API 文档

### `GET /image/api/random`
随机返回一张图片，默认直接返回图片本体（可能重定向或流）。

**可选查询参数**：
- `gallery`：图库名称（如 `luotianyi`）。
- `device`：设备类型，`pc`、`mobile` 或 `all`。
- `type`：返回格式，可选 `image`、`json` 或 `redirect`。

**请求示例**：
```text
/image/api/random?gallery=luotianyi
/image/api/random?gallery=anime&device=pc
/image/api/random?gallery=anime&device=mobile&type=json
```

**JSON 响应示例**：
```json
{
  "url": "https://api.example.com/image/images/luotianyi/pc/001.webp",
  "gallery": "luotianyi",
  "device": "pc",
  "filename": "001.webp",
  "size": 123456,
  "width": 1920,
  "height": 1080,
  "type": "webp",
  "total": 12
}
```

### 指定图库快捷接口 `GET /image/api/:gallery`
相当于 `random?gallery=:gallery`：
```text
/image/api/luotianyi?device=pc&type=json
```

### 获取所有图库统计 `GET /image/api/galleries`
```json
{
  "galleries": [
    { "name": "luotianyi", "total": 20, "pc": 12, "mobile": 8 }
  ]
}
```

### 其他接口
- `GET /image`：获取 API 首页信息（统计信息及展示）。
- `GET /image/health`：获取服务健康状态及运行时间。
- `GET /image/api/list`：分页获取图片列表（仅用于 API 查询，不含服务器绝对路径）。
- `GET /image/api/stats`：获取全局统计信息。

## 🛡️ 安全与免责声明

- **安全要求**：上线前务必修改默认密码及 Session 密钥。建议将 `ADMIN_PATH` 修改为不易被猜到的路径，并在反代中进一步限制访问。
- **版权提醒**：请勿上传或提供未授权图片的公开服务，建议仅使用个人拥有版权、AI 生成或授权发布的图片资源。
- **免责条款**：由于未授权内容产生的任何纠纷，本项目概不负责。

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。欢迎提交 Issue 探讨或 Pull Request 贡献代码。
