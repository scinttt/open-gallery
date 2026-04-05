import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function getMediaCacheRoot() {
  return process.env.GALLERY_MEDIA_CACHE_DIR || path.join(process.cwd(), ".next/cache/gallery-media");
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? Math.floor(value) : "default";
}

export function buildCacheKey({ slug, index, mode, width, quality }) {
  const rawKey = JSON.stringify({
    slug,
    index,
    mode,
    width: normalizeNumber(width),
    quality: normalizeNumber(quality),
  });

  return createHash("sha1").update(rawKey).digest("hex");
}

function getCacheFilePath(cacheKey) {
  return path.join(getMediaCacheRoot(), `${cacheKey}.jpg`);
}

export async function getCachedMedia(cacheKey, sourcePath) {
  const cacheFilePath = getCacheFilePath(cacheKey);

  try {
    const [cacheStat, sourceStat] = await Promise.all([
      stat(cacheFilePath),
      stat(sourcePath),
    ]);

    if (cacheStat.mtimeMs < sourceStat.mtimeMs) {
      return null;
    }

    return readFile(cacheFilePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function setCachedMedia(cacheKey, buffer) {
  const cacheFilePath = getCacheFilePath(cacheKey);
  await mkdir(path.dirname(cacheFilePath), { recursive: true });
  await writeFile(cacheFilePath, buffer);
}
