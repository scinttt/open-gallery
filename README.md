# open-gallery

English | [简体中文](#简体中文)

`open-gallery` is a local-first web gallery for image folders on your disk. It scans your gallery root directly, builds grouped cover views, and serves a long-scroll reading experience that works well on both phones and desktop browsers.

## Highlights

- Reads image folders directly from the local filesystem
- Supports both home-page grouping and artist-based browsing
- Optimized long-scroll gallery detail pages for mobile and desktop
- Moves deleted galleries to Trash instead of hard-deleting them
- Uses `sharp` for image compression and disk-cached covers
- Works without auth by default for local use
- Can optionally enable Clerk and invite-based access for public deployments

## Requirements

- Node.js `20+`
- `npm`
- A local gallery root directory that contains your image folders

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create `.env.local`.

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

3. Start the development server.

```bash
npm run dev -- --hostname 0.0.0.0 --port 4317
```

4. Open the app.

```text
http://localhost:4317
```

### Production start

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 4317
```

### Optional public access with Cloudflare Tunnel

If you already have your own named Cloudflare Tunnel and `cloudflared` installed:

```bash
TUNNEL_NAME=your-tunnel-name npm run serve:public
```

If your tunnel name is `gallery`, you can also run:

```bash
npm run serve:public
```

### Optional auth and invite flow

Local mode works without auth. If you want sign-in protection and invite management, configure Clerk plus the admin and invite secrets below:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
ADMIN_USER_ID=user_xxx
INVITE_COOKIE_SECRET=replace-with-a-random-secret
```

Clerk is enabled only when both Clerk keys are present.

## Gallery Layout

Two folder layouts are supported.

### Recommended: artist folders

```text
gallery-root/
├── artist-a/
│   ├── set-001/
│   │   ├── 001.jpg
│   │   └── 002.jpg
│   └── set-002/
└── artist-b/
    └── set-003/
```

### Also supported: a single flat artist root

```text
gallery-root/
├── set-001/
│   ├── 001.jpg
│   └── 002.jpg
└── set-002/
```

Notes:

- One gallery equals one folder
- Images are sorted with numeric-aware filename ordering
- Non-image files are ignored
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.avif`

## Environment Variables

### Required

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

### Common optional settings

```env
GALLERY_TRASH_DIR=/absolute/path/to/trash-dir
GALLERY_CACHE_TTL_MS=300000
GALLERY_MEDIA_CACHE_DIR=/absolute/path/to/media-cache
ALLOWED_DEV_ORIGIN=http://192.168.x.x:4317
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png
```

What they do:

- `GALLERY_TRASH_DIR`: custom Trash target for gallery deletion
- `GALLERY_CACHE_TTL_MS`: gallery metadata cache TTL in milliseconds
- `GALLERY_MEDIA_CACHE_DIR`: disk cache directory for generated cover images
- `ALLOWED_DEV_ORIGIN`: extra dev origin for phone or LAN access in development
- `ICON_SOURCE_PATH`: source image used by the icon generation script

## Deletion Behavior

Gallery deletion is not a hard delete.

- The gallery folder is moved to Trash
- The default Trash target is macOS `~/.Trash`
- Set `GALLERY_TRASH_DIR` explicitly if you want a different location or a non-macOS setup

The app also invalidates gallery metadata across Next.js workers after deletion, so artist and group pages do not need to wait for the cache TTL to expire.

## Caching

There are two main cache layers:

1. Gallery metadata cache
   Uses in-memory cache with a configurable TTL, plus a cross-process invalidation token for deletion consistency.
2. Cover image disk cache
   Stores generated cover outputs on disk and rebuilds them automatically when the source image changes.

To manually clear the default media cache:

```bash
rm -rf .next/cache/gallery-media
```

## Icon Generation

Regenerate the default icon assets:

```bash
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png node scripts/generate-icon-assets.mjs
```

Generate a local private icon override:

```bash
ICON_SOURCE_PATH=/absolute/path/to/personal-icon.png ICON_OUTPUT_DIR=public/local-icons node scripts/generate-icon-assets.mjs
```

`public/local-icons/` is ignored by Git and is intended for local-only overrides.

## Tests

Run the test suite:

```bash
npm test
```

Recommended before publishing:

```bash
npm test
npm run build
```

---

## 简体中文

[Back to English](#open-gallery)

`open-gallery` 是一个本地优先的图片图集 Web 应用，直接读取你磁盘上的图片目录，把它们整理成适合手机和桌面浏览器使用的封面流与长图阅读体验。

## 功能特点

- 直接读取本地文件系统中的图片目录
- 同时支持首页分组浏览和按画师浏览
- 图集详情页适合手机和桌面的连续长图阅读
- 删除图集时移动到 Trash，而不是硬删除
- 使用 `sharp` 压缩图片，并为封面提供磁盘缓存
- 默认本地模式无需登录
- 需要公网访问时，可选启用 Clerk 和邀请码流程

## 运行要求

- Node.js `20+`
- `npm`
- 一个本地图库根目录

## Quick Start Guide

1. 安装依赖。

```bash
npm install
```

2. 创建 `.env.local`。

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

3. 启动开发环境。

```bash
npm run dev -- --hostname 0.0.0.0 --port 4317
```

4. 打开应用。

```text
http://localhost:4317
```

### 生产环境启动

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 4317
```

### 可选：通过 Cloudflare Tunnel 对外访问

如果你已经有自己的 named tunnel，并且装好了 `cloudflared`：

```bash
TUNNEL_NAME=your-tunnel-name npm run serve:public
```

如果 tunnel 名称就是 `gallery`，也可以直接运行：

```bash
npm run serve:public
```

### 可选：启用鉴权和邀请码流程

本地模式默认不需要登录。如果你要启用登录保护和邀请码管理，请配置 Clerk 以及下面这些环境变量：

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
ADMIN_USER_ID=user_xxx
INVITE_COOKIE_SECRET=replace-with-a-random-secret
```

只有同时配置了两条 Clerk key，Clerk 才会启用。

## 图库目录结构

支持两种目录结构。

### 推荐：按画师分层

```text
gallery-root/
├── artist-a/
│   ├── set-001/
│   │   ├── 001.jpg
│   │   └── 002.jpg
│   └── set-002/
└── artist-b/
    └── set-003/
```

### 也支持：单画师平铺根目录

```text
gallery-root/
├── set-001/
│   ├── 001.jpg
│   └── 002.jpg
└── set-002/
```

说明：

- 一个图集就是一个文件夹
- 图片会按带数字感知的文件名顺序排序
- 非图片文件会被忽略
- 支持扩展名：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`

## 环境变量

### 必填

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

### 常用可选项

```env
GALLERY_TRASH_DIR=/absolute/path/to/trash-dir
GALLERY_CACHE_TTL_MS=300000
GALLERY_MEDIA_CACHE_DIR=/absolute/path/to/media-cache
ALLOWED_DEV_ORIGIN=http://192.168.x.x:4317
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png
```

含义：

- `GALLERY_TRASH_DIR`：删除图集时使用的 Trash 目录
- `GALLERY_CACHE_TTL_MS`：图集元数据缓存 TTL，单位毫秒
- `GALLERY_MEDIA_CACHE_DIR`：封面图磁盘缓存目录
- `ALLOWED_DEV_ORIGIN`：开发环境下给手机或局域网访问增加允许来源
- `ICON_SOURCE_PATH`：图标生成脚本使用的源图片

## 删除语义

图集删除不是硬删除。

- 图集目录会被移动到 Trash
- 默认 Trash 目录是 macOS 的 `~/.Trash`
- 如果你用的是其他环境，建议显式设置 `GALLERY_TRASH_DIR`

删除后应用还会在 Next.js 多 worker 之间同步失效 gallery 元数据缓存，所以 artist 页和 group 页不需要再等到缓存 TTL 自然过期。

## 缓存行为

主要有两层缓存：

1. 图集元数据缓存
   使用可配置 TTL 的内存缓存，并带有跨进程失效 token 来保证删除后一致性。
2. 封面图磁盘缓存
   生成后的封面会落盘缓存，源图变化后会自动重建。

手动清理默认媒体缓存：

```bash
rm -rf .next/cache/gallery-media
```

## 图标生成

重新生成默认图标资源：

```bash
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png node scripts/generate-icon-assets.mjs
```

生成本地私有图标覆盖：

```bash
ICON_SOURCE_PATH=/absolute/path/to/personal-icon.png ICON_OUTPUT_DIR=public/local-icons node scripts/generate-icon-assets.mjs
```

`public/local-icons/` 已被 Git 忽略，适合放本地私有图标覆盖。

## 测试

运行测试：

```bash
npm test
```

发布前建议至少执行：

```bash
npm test
npm run build
```
