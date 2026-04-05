import { readFile, stat } from "node:fs/promises";
import { auth } from "@clerk/nextjs/server";
import sharp from "sharp";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { getGalleryImageByIndex } from "@/lib/gallery";
import { buildCacheKey, getCachedMedia, setCachedMedia } from "@/lib/media-cache";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  if (CLERK_ENABLED) {
    await auth.protect();
  }
  const { slug, index } = await params;
  const image = await getGalleryImageByIndex(slug, index);

  if (!image) {
    return new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "detail";
  const requestedWidth = Number(url.searchParams.get("w"));
  const requestedQuality = Number(url.searchParams.get("q"));
  const width = Number.isFinite(requestedWidth)
    ? Math.min(Math.max(Math.floor(requestedWidth), 64), 2400)
    : mode === "cover"
      ? 560
      : 1440;
  const quality = Number.isFinite(requestedQuality)
    ? Math.min(Math.max(Math.floor(requestedQuality), 40), 90)
    : mode === "cover"
      ? 72
      : 82;
  const fileStat = await stat(image.absolutePath);

  if (fileStat.size < 400_000 && image.contentType !== "image/png") {
    const buffer = await readFile(image.absolutePath);

    return new Response(buffer, {
      headers: {
        "Content-Length": String(buffer.byteLength),
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  if (mode === "cover") {
    const cacheKey = buildCacheKey({
      slug,
      index: Number(index),
      mode,
      width,
      quality,
    });
    const cachedMedia = await getCachedMedia(cacheKey, image.absolutePath);

    if (cachedMedia) {
      return new Response(cachedMedia, {
        headers: {
          "Content-Length": String(cachedMedia.byteLength),
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        },
      });
    }

    const transformed = await sharp(image.absolutePath)
      .rotate()
      .resize({
        width,
        fit: "cover",
        withoutEnlargement: true,
      })
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      })
      .toBuffer();

    await setCachedMedia(cacheKey, transformed);

    return new Response(transformed, {
      headers: {
        "Content-Length": String(transformed.byteLength),
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  }

  const transformed = await sharp(image.absolutePath)
    .rotate()
    .resize({
      width,
      fit: mode === "cover" ? "cover" : "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer();

  return new Response(transformed, {
    headers: {
      "Content-Length": String(transformed.byteLength),
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
