import test from "node:test";
import assert from "node:assert/strict";

import { buildGalleryRefreshSignature } from "../lib/gallery-sync.js";

test("buildGalleryRefreshSignature combines invalidation token with pathname", () => {
  assert.equal(
    buildGalleryRefreshSignature("123456", "/artists/demo"),
    "123456:/artists/demo",
  );
});

test("buildGalleryRefreshSignature returns null for incomplete inputs", () => {
  assert.equal(buildGalleryRefreshSignature(null, "/artists"), null);
  assert.equal(buildGalleryRefreshSignature("123456", ""), null);
});
