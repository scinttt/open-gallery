# open-gallery

A local-first, mobile-friendly gallery browser for folder-based image sets.

## What It Does

- Scans a local folder of gallery directories
- Shows a cover wall on the home page
- Opens each gallery as a long vertical reading page
- Works locally without auth by default
- Optionally protects pages and media endpoints with Clerk auth
- Supports public access behind your own domain or tunnel

## Current Stack

- Next.js App Router
- React
- Clerk (optional)
- sharp
- Local filesystem as source of truth

## Requirements

- Node.js 20+
- A local gallery source directory
- Optional: Clerk application keys
- Optional: Cloudflare Tunnel for public access

## Environment Variables

Create `.env.local`:

```env
GALLERY_SOURCE_DIR=/absolute/path/to/gallery/extracted
ALLOWED_DEV_ORIGIN=http://192.168.x.x:4317
```

Optional Clerk auth:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

Optional icon regeneration:

```env
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png
```

Optional local-only icon override:

```env
ICON_OUTPUT_DIR=public/local-icons
```

## Local Development

```bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 4317
```

Open `http://localhost:4317`.

If Clerk keys are not configured, the app runs in local no-auth mode.

## Production Build

```bash
npm run build
npm run start -- --hostname 0.0.0.0 --port 4317
```

## Optional Public Access

If you want a stable public URL, set up your own Cloudflare named tunnel first.
This project does not require Cloudflare for normal local use.

By default the script uses `TUNNEL_NAME=gallery`, but you can override it:

```bash
TUNNEL_NAME=your-tunnel-name npm run serve:public
```

If your tunnel is already named `gallery`, this also works:

```bash
npm run serve:public
```

This script builds the app, starts the app on port `4317`, and runs `cloudflared tunnel run $TUNNEL_NAME`.

If you expose the app publicly, configure Clerk before doing so.

## Regenerate Icons

```bash
ICON_SOURCE_PATH=/absolute/path/to/square-icon.png node scripts/generate-icon-assets.mjs
```

For a local-only icon that should not be committed:

```bash
ICON_SOURCE_PATH=/absolute/path/to/personal-icon.png ICON_OUTPUT_DIR=public/local-icons node scripts/generate-icon-assets.mjs
```

## Tests

```bash
npm test
```

## Notes

- The app degrades gracefully when `GALLERY_SOURCE_DIR` is missing; it shows an empty gallery instead of failing the build.
- Clerk is optional; if not configured, sign-in is disabled and protected routes stay open for local use.
- Authenticated media responses use private cache headers when Clerk is enabled.
- `npm run serve:public` is an optional deployment helper for users who already have their own Cloudflare Tunnel setup.
- If `public/local-icons/` exists, the app prefers those personal icons over the repository defaults.
- For iPhone home-screen icon refreshes, remove the old icon and add the site again after changing icon assets.
