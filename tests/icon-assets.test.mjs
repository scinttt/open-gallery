import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const projectRoot = process.cwd();

test("icon asset generator outputs opaque png files", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-icon-"));
  const sourcePath = path.join(tempDir, "source.png");

  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 255, g: 140, b: 180, alpha: 0.45 },
    },
  })
    .png()
    .toFile(sourcePath);

  await execFileAsync(
    "node",
    ["scripts/generate-icon-assets.mjs", sourcePath],
    {
      cwd: projectRoot,
      env: process.env,
    },
  );

  for (const fileName of [
    "icon-512.png",
    "icon-192.png",
    "apple-touch-icon.png",
    "favicon-32.png",
  ]) {
    const metadata = await sharp(path.join(projectRoot, "public", fileName)).metadata();
    assert.equal(metadata.hasAlpha, false, `${fileName} should be opaque`);
    assert.equal(metadata.channels, 3, `${fileName} should be RGB`);
  }
});
