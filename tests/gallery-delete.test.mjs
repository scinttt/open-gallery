import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
}

test("moveGalleryToTrashBySlug moves a gallery folder into trash and invalidates cache", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-delete-"));
  const sourceRoot = path.join(tempRoot, "source");
  const trashRoot = path.join(tempRoot, "trash");
  await fs.mkdir(sourceRoot, { recursive: true });
  await createGalleryDirectory(sourceRoot, "artist-a", "Alpha Set", ["1.jpg", "2.jpg"]);
  await createGalleryDirectory(sourceRoot, "artist-a", "Beta Set", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  process.env.GALLERY_TRASH_DIR = trashRoot;

  const galleryModule = await loadGalleryModule(`delete-${Date.now()}`);
  const beforeDelete = await galleryModule.getGallerySummaries();
  const alpha = beforeDelete.find((gallery) => gallery.title === "Alpha Set");

  assert.ok(alpha, "expected Alpha Set to be discoverable before deletion");

  const result = await galleryModule.moveGalleryToTrashBySlug(alpha.slug);

  assert.equal(result.title, "Alpha Set");
  assert.equal(result.artistName, "artist-a");
  await assert.rejects(fs.access(path.join(sourceRoot, "artist-a", "Alpha Set")));

  const trashEntries = await fs.readdir(trashRoot);
  assert.equal(trashEntries.length, 1);
  assert.match(trashEntries[0], /^Alpha Set--/);

  const afterDelete = await galleryModule.getGallerySummaries();
  assert.equal(afterDelete.some((gallery) => gallery.slug === alpha.slug), false);
  assert.equal(afterDelete.length, 1);
});

test("moveGalleryToTrashBySlug works for flat gallery structure (sourceRoot == artistPath)", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-delete-flat-"));
  const sourceRoot = path.join(tempRoot, "artist-folder");
  const trashRoot = path.join(tempRoot, "trash");
  await fs.mkdir(sourceRoot, { recursive: true });

  // Flat structure: galleries are direct children of sourceRoot
  const galleryPath = path.join(sourceRoot, "Alpha Set");
  await fs.mkdir(galleryPath, { recursive: true });
  await fs.writeFile(path.join(galleryPath, "1.jpg"), "image");
  await fs.writeFile(path.join(galleryPath, "2.jpg"), "image");

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  process.env.GALLERY_TRASH_DIR = trashRoot;

  const galleryModule = await loadGalleryModule(`delete-flat-${Date.now()}`);
  const beforeDelete = await galleryModule.getGallerySummaries();
  const alpha = beforeDelete.find((gallery) => gallery.title === "Alpha Set");

  assert.ok(alpha, "expected Alpha Set to be discoverable before deletion");
  // In flat mode, artistPath should equal sourceRoot
  assert.equal(path.resolve(alpha.artistPath), path.resolve(sourceRoot));

  const result = await galleryModule.moveGalleryToTrashBySlug(alpha.slug);

  assert.equal(result.title, "Alpha Set");
  await assert.rejects(fs.access(galleryPath));

  const trashEntries = await fs.readdir(trashRoot);
  assert.equal(trashEntries.length, 1);
  assert.match(trashEntries[0], /^Alpha Set--/);

  const afterDelete = await galleryModule.getGallerySummaries();
  assert.equal(afterDelete.some((gallery) => gallery.slug === alpha.slug), false);
});

test("moveGalleryToTrashBySlug invalidates cached gallery data across module instances", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-delete-shared-"));
  const sourceRoot = path.join(tempRoot, "source");
  const trashRoot = path.join(tempRoot, "trash");
  await fs.mkdir(sourceRoot, { recursive: true });
  await createGalleryDirectory(sourceRoot, "artist-a", "Alpha Set", ["1.jpg", "2.jpg"]);
  await createGalleryDirectory(sourceRoot, "artist-a", "Beta Set", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  process.env.GALLERY_TRASH_DIR = trashRoot;
  process.env.GALLERY_CACHE_TTL_MS = "300000";

  const readerModule = await loadGalleryModule(`reader-${Date.now()}`);
  const writerModule = await loadGalleryModule(`writer-${Date.now()}`);

  const beforeDelete = await readerModule.getArtistSummaries();
  assert.equal(beforeDelete.length, 1);
  assert.equal(beforeDelete[0].galleryCount, 2);

  const alpha = (await writerModule.getGallerySummaries()).find(
    (gallery) => gallery.title === "Alpha Set",
  );
  assert.ok(alpha, "expected Alpha Set to be discoverable before deletion");

  await writerModule.moveGalleryToTrashBySlug(alpha.slug);

  const afterDelete = await readerModule.getArtistSummaries();
  assert.equal(afterDelete.length, 1);
  assert.equal(afterDelete[0].galleryCount, 1);
});

test("isPathInsideDirectory only allows child paths under the configured root", async () => {
  const galleryModule = await loadGalleryModule(`path-${Date.now()}`);

  assert.equal(
    galleryModule.isPathInsideDirectory("/tmp/library", "/tmp/library/set-a"),
    true,
  );
  assert.equal(
    galleryModule.isPathInsideDirectory("/tmp/library", "/tmp/library"),
    false,
  );
  assert.equal(
    galleryModule.isPathInsideDirectory("/tmp/library", "/tmp/library/../escape"),
    false,
  );
  assert.equal(
    galleryModule.isPathInsideDirectory("/tmp/library", "/tmp/library-two/set-a"),
    false,
  );
});
