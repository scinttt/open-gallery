import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadMediaCacheModule(cacheKey) {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "lib/media-cache.js")).href;
  return import(`${moduleUrl}?${cacheKey}`);
}

test("media cache returns cached bytes and invalidates when the source file becomes newer", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-media-cache-"));
  const cacheRoot = path.join(tempRoot, "cache");
  const sourcePath = path.join(tempRoot, "cover.jpg");

  process.env.GALLERY_MEDIA_CACHE_DIR = cacheRoot;

  await fs.writeFile(sourcePath, "source-v1");

  const mediaCacheModule = await loadMediaCacheModule(`media-cache-${Date.now()}`);
  const cacheKey = mediaCacheModule.buildCacheKey({
    slug: "sample-gallery",
    index: 0,
    mode: "cover",
    width: 560,
    quality: 70,
  });

  assert.equal(await mediaCacheModule.getCachedMedia(cacheKey, sourcePath), null);

  const transformed = Buffer.from("cached-cover");
  await mediaCacheModule.setCachedMedia(cacheKey, transformed);

  const cached = await mediaCacheModule.getCachedMedia(cacheKey, sourcePath);
  assert.equal(cached?.toString(), "cached-cover");

  const nextTimestamp = new Date(Date.now() + 1_000);
  await fs.utimes(sourcePath, nextTimestamp, nextTimestamp);

  assert.equal(await mediaCacheModule.getCachedMedia(cacheKey, sourcePath), null);
});
