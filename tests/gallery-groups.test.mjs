import test from "node:test";
import assert from "node:assert/strict";

import { groupGallerySummaries } from "../lib/gallery.js";

function createGallery(index, imageCount = 12) {
  return {
    slug: `gallery-${index}`,
    title: `Gallery ${index}`,
    sourceType: "folder",
    sourcePath: `/tmp/gallery-${index}`,
    updatedAt: 1_000 - index,
    imageCount,
    coverIndex: 0,
    previewShape: "Quick read",
  };
}

test("groupGallerySummaries chunks galleries into blocks of ten", () => {
  const galleries = Array.from({ length: 20 }, (_, index) => createGallery(index + 1));
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].slug, "group-001");
  assert.equal(groups[0].title, "Sets 1-10");
  assert.equal(groups[0].galleryCount, 10);
  assert.equal(groups[0].imageCount, 120);
  assert.equal(groups[0].galleries[0].slug, "gallery-1");
  assert.equal(groups[1].slug, "group-002");
  assert.equal(groups[1].title, "Sets 11-20");
  assert.equal(groups[1].galleryCount, 10);
});

test("groupGallerySummaries keeps the final partial block", () => {
  const galleries = Array.from({ length: 13 }, (_, index) =>
    createGallery(index + 1, index < 10 ? 10 : 5),
  );
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 2);
  assert.equal(groups[1].slug, "group-002");
  assert.equal(groups[1].title, "Sets 11-13");
  assert.equal(groups[1].startIndex, 11);
  assert.equal(groups[1].endIndex, 13);
  assert.equal(groups[1].galleryCount, 3);
  assert.equal(groups[1].imageCount, 15);
  assert.deepEqual(
    groups[1].galleries.map((gallery) => gallery.slug),
    ["gallery-11", "gallery-12", "gallery-13"],
  );
});
