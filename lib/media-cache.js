import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
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

  let cacheStat;
  try {
    cacheStat = await stat(cacheFilePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const sourceStat = await stat(sourcePath);

  if (cacheStat.mtimeMs < sourceStat.mtimeMs) {
    return null;
  }

  return readFile(cacheFilePath);
}

export async function setCachedMedia(cacheKey, buffer) {
  const cacheFilePath = getCacheFilePath(cacheKey);
  const tmpPath = `${cacheFilePath}.${randomBytes(4).toString("hex")}.tmp`;
  await mkdir(path.dirname(cacheFilePath), { recursive: true });
  await writeFile(tmpPath, buffer);
  await rename(tmpPath, cacheFilePath);
}
