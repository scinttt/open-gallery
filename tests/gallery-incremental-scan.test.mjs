import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadGalleryModule(cacheKey) {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "lib/gallery.js")).href;
  return import(`${moduleUrl}?${cacheKey}`);
}

async function createGalleryDirectory(rootPath, artistName, directoryName, imageNames) {
  const galleryPath = path.join(rootPath, artistName, directoryName);
  await fs.mkdir(galleryPath, { recursive: true });

  for (const imageName of imageNames) {
    await fs.writeFile(path.join(galleryPath, imageName), "image");
  }

  return galleryPath;
}

test("incremental scan refreshes a changed nested gallery without a full cache reset", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-incremental-"));
  const sourceRoot = path.join(tempRoot, "source");
  const galleryPath = await createGalleryDirectory(sourceRoot, "artist-a", "Set 01", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  process.env.GALLERY_CACHE_TTL_MS = "5";

  const galleryModule = await loadGalleryModule(`incremental-${Date.now()}`);
  const beforeUpdate = await galleryModule.getGallerySummaries();

  assert.equal(beforeUpdate.length, 1);
  assert.equal(beforeUpdate[0].imageCount, 1);

  await sleep(20);
  await fs.writeFile(path.join(galleryPath, "2.jpg"), "image");
  const nextTimestamp = new Date(Date.now() + 1_000);
  await fs.utimes(galleryPath, nextTimestamp, nextTimestamp);

  await sleep(20);
  const afterUpdate = await galleryModule.getGallerySummaries();

  assert.equal(afterUpdate.length, 1);
  assert.equal(afterUpdate[0].imageCount, 2);
  assert.ok(afterUpdate[0].updatedAt >= beforeUpdate[0].updatedAt);
});

test("incremental scan discovers a newly added artist directory after ttl expiry", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-incremental-artist-"));
  const sourceRoot = path.join(tempRoot, "source");
  await createGalleryDirectory(sourceRoot, "artist-a", "Set 01", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  process.env.GALLERY_CACHE_TTL_MS = "5";

  const galleryModule = await loadGalleryModule(`incremental-artist-${Date.now()}`);
  const initialArtists = await galleryModule.getArtistSummaries();

  assert.equal(initialArtists.length, 1);

  await sleep(20);
  await createGalleryDirectory(sourceRoot, "artist-b", "Set 01", ["1.jpg", "2.jpg"]);

  await sleep(20);
  const updatedArtists = await galleryModule.getArtistSummaries();

  assert.equal(updatedArtists.length, 2);
  assert.deepEqual(
    updatedArtists.map((artist) => artist.title).sort(),
    ["artist-a", "artist-b"],
  );
});
