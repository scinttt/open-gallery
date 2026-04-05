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

async function createFlatGalleryDirectory(rootPath, directoryName, imageNames) {
  const galleryPath = path.join(rootPath, directoryName);
  await fs.mkdir(galleryPath, { recursive: true });

  for (const imageName of imageNames) {
    await fs.writeFile(path.join(galleryPath, imageName), "image");
  }
}

test("getArtistSummaries aggregates nested artist directories and filters empty sets", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-artists-"));
  const sourceRoot = path.join(tempRoot, "source");
  await fs.mkdir(sourceRoot, { recursive: true });
  await createGalleryDirectory(sourceRoot, "artist-a", "Set 01", ["1.jpg", "2.jpg"]);
  await createGalleryDirectory(sourceRoot, "artist-a", "Set 02", ["1.jpg"]);
  await createGalleryDirectory(sourceRoot, "artist-b-123", "Set 01", ["1.jpg", "2.jpg", "3.jpg"]);
  await fs.mkdir(path.join(sourceRoot, "artist-empty", "No Images"), { recursive: true });

  process.env.GALLERY_SOURCE_DIR = sourceRoot;
  delete process.env.GALLERY_TRASH_DIR;

  const galleryModule = await loadGalleryModule(`artists-${Date.now()}`);
  const artists = await galleryModule.getArtistSummaries();
  const artistA = artists.find((artist) => artist.title === "artist-a");
  const artistB = artists.find((artist) => artist.title === "artist-b-123");

  assert.equal(artists.length, 2);
  assert.ok(artistA);
  assert.ok(artistB);
  assert.equal(artistA.galleryCount, 2);
  assert.equal(artistA.imageCount, 3);
  assert.equal(artistA.previewGalleries.length, 2);
  assert.equal(artistB.galleryCount, 1);
  assert.equal(artistB.imageCount, 3);
});

test("flat single-artist layout is still supported and uses source folder name as artist", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-flat-"));
  const sourceRoot = path.join(tempRoot, "CrewdCreations");
  await fs.mkdir(sourceRoot, { recursive: true });
  await createFlatGalleryDirectory(sourceRoot, "Set A", ["1.jpg", "2.jpg"]);
  await createFlatGalleryDirectory(sourceRoot, "Set B", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;

  const galleryModule = await loadGalleryModule(`flat-${Date.now()}`);
  const artists = await galleryModule.getArtistSummaries();
  const galleries = await galleryModule.getGallerySummaries();

  assert.equal(artists.length, 1);
  assert.equal(artists[0].title, "CrewdCreations");
  assert.equal(artists[0].galleryCount, 2);
  assert.equal(galleries.length, 2);
  assert.equal(galleries.every((gallery) => gallery.artistName === "CrewdCreations"), true);
});

test("different artists can contain same gallery directory name without slug collision", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-slugs-"));
  const sourceRoot = path.join(tempRoot, "source");
  await fs.mkdir(sourceRoot, { recursive: true });
  await createGalleryDirectory(sourceRoot, "artist-a", "Shared Set", ["1.jpg"]);
  await createGalleryDirectory(sourceRoot, "artist-b", "Shared Set", ["1.jpg"]);

  process.env.GALLERY_SOURCE_DIR = sourceRoot;

  const galleryModule = await loadGalleryModule(`slug-${Date.now()}`);
  const galleries = await galleryModule.getGallerySummaries();

  assert.equal(galleries.length, 2);
  assert.notEqual(galleries[0].slug, galleries[1].slug);
  assert.deepEqual(
    galleries.map((gallery) => gallery.artistName).sort(),
    ["artist-a", "artist-b"],
  );
});
