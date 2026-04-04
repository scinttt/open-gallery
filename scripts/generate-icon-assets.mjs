import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

const projectRoot = process.cwd();
const defaultOutputDir = path.join(projectRoot, "public");
const outputDir = path.isAbsolute(process.env.ICON_OUTPUT_DIR || "")
  ? process.env.ICON_OUTPUT_DIR
  : path.join(projectRoot, process.env.ICON_OUTPUT_DIR || "public");
const iconVersionPath = path.join(projectRoot, "lib", "icon-version.js");
const downloadsDir = path.join(os.homedir(), "Downloads");
const explicitSourcePath = process.env.ICON_SOURCE_PATH || process.argv[2];

async function getLatestScreenshotPath() {
  if (!explicitSourcePath) {
    throw new Error(
      "Missing icon source. Pass a file path as ICON_SOURCE_PATH or the first CLI argument.",
    );
  }

  const absolutePath = path.isAbsolute(explicitSourcePath)
    ? explicitSourcePath
    : path.join(downloadsDir, explicitSourcePath);
  const stats = await fs.stat(absolutePath);
  return {
    absolutePath,
    mtimeMs: stats.mtimeMs,
    fileName: path.basename(absolutePath),
  };
}

async function writePng(sourcePath, name, size) {
  const { data } = await sharp(sourcePath)
    .resize(8, 8, {
      fit: "fill",
    })
    .extract({
      left: 7,
      top: 0,
      width: 1,
      height: 1,
    })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = {
    r: data[0] ?? 255,
    g: data[1] ?? 255,
    b: data[2] ?? 255,
  };

  await sharp(sourcePath)
    .resize(size, size, {
      fit: "fill",
    })
    .flatten({ background })
    .removeAlpha()
    .png()
    .toFile(path.join(outputDir, name));
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const source = await getLatestScreenshotPath();
  const safeName = source.fileName.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  const iconVersion = `${safeName}-${Math.floor(source.mtimeMs)}`;

  await writePng(source.absolutePath, "icon-512.png", 512);
  await writePng(source.absolutePath, "icon-192.png", 192);
  await writePng(source.absolutePath, "apple-touch-icon.png", 180);
  await writePng(source.absolutePath, "favicon-32.png", 32);
  if (outputDir === defaultOutputDir) {
    await fs.writeFile(
      iconVersionPath,
      `export const ICON_VERSION = "${iconVersion}";\n`,
      "utf8"
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
