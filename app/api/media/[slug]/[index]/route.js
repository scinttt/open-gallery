import { readFile, stat } from "node:fs/promises";
import { auth } from "@clerk/nextjs/server";
import { CLERK_ENABLED } from "@/lib/auth-config";
import { getGalleryImageByIndex } from "@/lib/gallery";
import { buildCacheKey, getCachedMedia, setCachedMedia } from "@/lib/media-cache";
import { sharpTransform } from "@/lib/sharp-pool";

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

    try {
      const transformed = await sharpTransform(image.absolutePath, {
        resize: { width, fit: "cover", withoutEnlargement: true },
        jpeg: { quality, mozjpeg: true, progressive: true },
      });

      setCachedMedia(cacheKey, transformed).catch((err) => {
        console.error("[media-cache] Failed to write cover cache:", err);
      });

      return new Response(transformed, {
        headers: {
          "Content-Length": String(transformed.byteLength),
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        },
      });
    } catch (err) {
      console.error(`[media] sharp cover failed for ${slug}/${index}:`, err.message);
      return new Response("Image processing failed", { status: 502 });
    }
  }

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

  try {
    const transformed = await sharpTransform(image.absolutePath, {
      resize: { width, fit: "inside", withoutEnlargement: true },
      jpeg: { quality, mozjpeg: true, progressive: true },
    });

    return new Response(transformed, {
      headers: {
        "Content-Length": String(transformed.byteLength),
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error(`[media] sharp detail failed for ${slug}/${index}:`, err.message);
    return new Response("Image processing failed", { status: 502 });
  }
}
