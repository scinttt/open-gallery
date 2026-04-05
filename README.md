# open-gallery

`open-gallery` 是一个本地优先的图集浏览器：直接读取你磁盘上的图片文件夹，把它们整理成适合手机和桌面浏览器使用的长图阅读体验。

项目默认面向“本地自用”场景设计：

- 默认不依赖数据库
- 默认不依赖登录
- 默认直接把本地文件系统作为真源
- 只有在你主动公网暴露时，才建议启用 Clerk 鉴权

## 功能概览

- 首页按每 `10` 套图集分组，避免无限滚动
- 支持按画师目录浏览
- 图集详情页支持长图连续阅读
- 封面图通过 `sharp` 压缩，并支持本地磁盘缓存
- 详情页图片使用懒加载，减少首屏请求压力
- 分组页支持删除图集，删除动作会把目录移动到 Trash，而不是硬删除
- Clerk 为可选项；未配置时默认本地无鉴权
- 可选配合自己的 Cloudflare Tunnel 做公网访问

## 运行要求

- Node.js `20+`
- 一个位于本机磁盘上的图库目录
- `npm`

可选依赖：

- Clerk：如果你要公网暴露并加登录
- `cloudflared`：如果你要通过 Cloudflare Tunnel 暴露公网

## 快速开始

1. 安装依赖

```bash
npm install
```

2. 复制环境变量文件

```bash
cp .env.example .env.local
```

3. 修改 `.env.local`，至少配置：

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

4. 启动开发环境

```bash
npm run dev -- --hostname 0.0.0.0 --port 4317
```

5. 打开浏览器访问：

```text
http://localhost:4317
```

如果你只是本地自用，到这里就够了。

## 图库目录结构

当前支持两种结构。

### 1. 推荐：按画师分层

这是最完整的结构，首页分组浏览和画师页都会工作得更自然。

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

### 2. 兼容：单画师平铺

如果你的根目录本身就是某一个画师目录，也可以直接这样使用：

```text
gallery-root/
├── set-001/
│   ├── 001.jpg
│   └── 002.jpg
└── set-002/
```

说明：

- 一个“图集”就是一个目录
- 图集内的图片会按文件名自然排序
- 非图片文件会被忽略
- 支持的图片扩展名：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.avif`

## 环境变量

### 必填

```env
GALLERY_SOURCE_DIR=/absolute/path/to/your/gallery-root
```

### 常用可选项

```env
ALLOWED_DEV_ORIGIN=http://192.168.x.x:4317
GALLERY_TRASH_DIR=/absolute/path/to/trash-dir
GALLERY_CACHE_TTL_MS=300000
GALLERY_MEDIA_CACHE_DIR=/absolute/path/to/media-cache
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png
```

说明：

- `ALLOWED_DEV_ORIGIN`
  用于手机或局域网设备访问开发环境时，补充允许的 dev origin
- `GALLERY_TRASH_DIR`
  删除图集时的目标目录；未配置时默认使用 macOS 的 `~/.Trash`
- `GALLERY_CACHE_TTL_MS`
  图库列表内存缓存 TTL，默认 `300000` 毫秒
- `GALLERY_MEDIA_CACHE_DIR`
  封面磁盘缓存目录；未配置时默认使用 `.next/cache/gallery-media`
- `ICON_SOURCE_PATH`
  用于重新生成项目图标

### 可选：启用 Clerk 鉴权

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
CLERK_SECRET_KEY=sk_test_replace_me
```

只有当这两个变量都存在时，Clerk 才会启用。未配置时，应用默认为本地无鉴权模式。

## 本地部署

如果你不是开发，而是想在本机长期使用，可以直接跑 production build：

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 4317
```

然后访问：

```text
http://localhost:4317
```

这已经是可用的本地部署方式，不需要 Cloudflare，也不需要 Clerk。

## 公网暴露（可选）

如果你确实要从公网访问，再考虑这一步。

先自行准备好：

- 一个可用的 Cloudflare named tunnel
- `cloudflared`
- 建议同时配置 Clerk

启动命令：

```bash
TUNNEL_NAME=your-tunnel-name npm run serve:public
```

如果你的 tunnel 名称就是 `gallery`，也可以直接：

```bash
npm run serve:public
```

这个脚本会：

1. 执行 `npm run build`
2. 在本地启动 Next.js production server
3. 执行 `cloudflared tunnel run $TUNNEL_NAME`

注意：

- Cloudflare Tunnel 只是可选 helper，不是本项目运行前提
- 如果你要公网暴露，建议先启用 Clerk

## 删除语义

分组页里的删除不是硬删除。

- 当前实现会把图集目录移动到 Trash
- 默认目标是 macOS 的 `~/.Trash`
- 如果你不是 macOS，建议显式设置 `GALLERY_TRASH_DIR`

这意味着：

- 本地误删时更容易恢复
- 但跨平台行为目前仍以 macOS 语义为默认假设

## 缓存行为

当前有两类缓存：

1. 图库列表缓存
   基于内存，默认 TTL 是 `5` 分钟；重启进程后会清空
2. 封面磁盘缓存
   默认写到 `.next/cache/gallery-media`；如果源图更新，会自动失效并重建

如果你要手动清理封面缓存：

```bash
rm -rf .next/cache/gallery-media
```

如果你自定义了 `GALLERY_MEDIA_CACHE_DIR`，就删除你自定义的目录。

## 图标生成

重新生成仓库默认图标：

```bash
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png node scripts/generate-icon-assets.mjs
```

生成本地私有图标覆盖：

```bash
ICON_SOURCE_PATH=/absolute/path/to/personal-icon.png ICON_OUTPUT_DIR=public/local-icons node scripts/generate-icon-assets.mjs
```

说明：

- `public/local-icons/` 已被 `.gitignore` 忽略
- 它适合放你自己的本地私有图标，不会进入版本控制

## 测试

运行测试：

```bash
npm test
```

本地发布前，建议至少执行：

```bash
npm test
npm run build
```

## 开源使用注意事项

当前仓库已经适合开源使用，但有几个边界需要明确：

- 默认使用本地文件系统，不提供云存储同步能力
- 删除流程默认按 macOS Trash 设计；非 macOS 环境建议配置 `GALLERY_TRASH_DIR`
- 公网暴露不是默认路径，只有你明确需要时才建议启用
- Clerk 完全可选，本地使用不需要任何第三方鉴权服务
- 封面磁盘缓存默认写入 `.next/cache/gallery-media`，属于可重建缓存，不应提交

## 常见问题

### 1. 没配置 `GALLERY_SOURCE_DIR` 能启动吗？

能。应用会显示空库，而不是直接崩掉。

### 2. 为什么手机访问开发环境失败？

通常需要把 `ALLOWED_DEV_ORIGIN` 配成你手机实际访问的地址，例如：

```env
ALLOWED_DEV_ORIGIN=http://192.168.1.10:4317
```

### 3. 不想开放公网，是否还需要 Clerk？

不需要。只要你本地使用，完全可以不配 Clerk。
