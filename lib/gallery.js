import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const DEFAULT_CACHE_TTL_MS = 300_000;
const STAT_CONCURRENCY = 20;
const GROUP_SIZE = 10;
const TITLE_TRANSLATIONS = new Map([
  ["Brandish μ Fairy Tail WITH TEXT", "妖精的尾巴 布兰缇什"],
  ["Carmilla WITH TEXT", "卡米拉"],
  ["Do-S One Punch Man WITH TEXT", "一拳超人 性感囚犯"],
  ["EXTRAS Makima Green Elf WITH TEXT", "玛奇玛 绿精灵"],
  ["Eliza Tekken WITH TEXT", "铁拳 伊丽莎"],
  ["Fern Goth", "芙莉莲 芙恩 哥特风"],
  ["Flare Corona WITH TEXT Fairy Tail", "妖精的尾巴 芙蕾亚"],
  ["Fuka Naruto", "火影忍者 风花"],
  ["Grayfia Lucifuge WITH TEXT", "格雷菲亚"],
  ["Hinageshi Love Hotel WITH TEXT", "雏罂粟 爱情旅馆"],
  ["Ingrid Taimanin WITH TEXT", "对魔忍 英格丽德"],
  ["Iuno WW WITH TEXT", "伊乌诺"],
  ["Juri Han Gym Outfit", "韩蛛俐 健身装"],
  ["Kakyoin Love Hotel WITH TEXT", "花京院 爱情旅馆"],
  ["Kazuki Mikadono WITH TEXT", "御门和树"],
  ["Lusamine String Bikini ALL TIERS", "露莎米奈 系带比基尼"],
  ["Lusamine String Bikini WITH TEXT", "露莎米奈 系带比基尼"],
  ["Makima NSFW WITH TEXT", "玛奇玛"],
  ["Miao Ying Warhammer WITH TEXT", "战锤 妙影"],
  ["Mikoto Love Hotel WITH TEXT", "美琴 爱情旅馆"],
  ["Mirko String Bikini Nightclub NSFW", "米尔科 夜店比基尼"],
  ["Missha Karlstein - Surviving the Game as a Barbarian WITH TEXT", "米莎·卡尔斯坦"],
  ["Mori Calliope Back Stage WITH TEXT", "森美声 后台时刻"],
  ["Morrigan Aensland TEXT", "莫莉卡"],
  ["Nami Sportswear WITH TEXT", "娜美 运动装"],
  ["Niko Mikadono", "御门宁子"],
  ["Nol - Youkoso! WITH TEXT", "诺尔 欢迎光临"],
  ["Olga Discordia Dark Elf", "奥尔加 暗精灵"],
  ["Orihime KAMITSUBAKI STUDIO", "织姬 神椿工作室"],
  ["Priscilla Barielle WITH TEXT", "普莉希拉·巴里艾尔"],
  ["Rimuru Tempest Barista NSFW", "利姆露 咖啡师"],
  ["Rimuru Tempest Barista WITH TEXT", "利姆露 咖啡师"],
  ["Rimuru Tempest Blue Lingerie WITH TEXT", "利姆露 蓝色内衣"],
  ["Rimuru Tempest Gothic Outfit NSFW", "利姆露 哥特装"],
  ["Satsuki Kiryuin WITH TEXT", "鬼龙院皋月"],
  ["Scarlet El Vandimion WITH TEXT", "史卡雷特·艾尔·凡迪米昂"],
  ["Scathach Bikini WITH TEXT", "斯卡哈 比基尼"],
  ["Tsunade Night Out WITH TEXT", "纲手 夜出"],
  ["Urd Oh My Goddess WITH TEXT", "我的女神 乌璐德"],
  ["Yamato Christmas One Piece", "海贼王 大和 圣诞"],
  ["Yor Forger Lingerie NSFW", "约尔 内衣"],
  ["Yor Forger Lingerie WITH TEXT", "约尔 内衣"],
  ["Yor Forger Pantyhose WITH TEXT", "约尔 黑丝"],
  ["Yoruichi Sauna WITH TEXT", "夜一 桑拿"],
  ["Yuzuriha Dominatrix WITH TEXT", "结缘 主导风"],
  ["Zero Two Goth WITH TEXT", "02 哥特风"],
  ["Zero Two WITH TEXT", "02"],
]);

let galleryCache = {
  expiresAt: 0,
  layout: null,
  flatCache: new Map(),
  artistCaches: new Map(),
  items: [],
};
let galleryCacheGeneration = 0;
let galleryCachePromise = null;
let galleryInvalidationToken = null;

function getSourceRoot() {
  return process.env.GALLERY_SOURCE_DIR || null;
}

function getTrashRoot() {
  return process.env.GALLERY_TRASH_DIR || path.join(os.homedir(), ".Trash");
}

function getGalleryCacheTtlMs() {
  const configuredValue = Number(process.env.GALLERY_CACHE_TTL_MS);

  if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
    return DEFAULT_CACHE_TTL_MS;
  }

  return Math.floor(configuredValue);
}

function getGalleryInvalidationFilePath() {
  const sourceRoot = getSourceRoot() || "default";
  const sourceHash = createHash("sha1").update(sourceRoot).digest("hex");

  return path.join(
    os.tmpdir(),
    "open-gallery-cache",
    sourceHash,
    "gallery-invalidation-token",
  );
}

async function readGalleryInvalidationToken() {
  try {
    const token = await readFile(getGalleryInvalidationFilePath(), "utf8");
    return token.trim() || null;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeGalleryInvalidationToken() {
  const token = `${Date.now()}`;
  const invalidationFilePath = getGalleryInvalidationFilePath();
  await mkdir(path.dirname(invalidationFilePath), { recursive: true });
  await writeFile(invalidationFilePath, token, "utf8");
  galleryInvalidationToken = token;
  return token;
}

async function syncGalleryCacheInvalidation() {
  const latestToken = await readGalleryInvalidationToken();

  if (latestToken === galleryInvalidationToken) {
    return;
  }

  galleryInvalidationToken = latestToken;

  if (latestToken !== null) {
    invalidateGalleryCache();
  }
}

function toSlug(name) {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s/-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\/\s]+/g, "-")
    .replace(/-+/g, "-");
  const hash = createHash("sha1").update(name).digest("hex").slice(0, 8);
  return `${base || "gallery"}-${hash}`;
}

function numericAwareSort(left, right) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getContentType(extension) {
  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    default:
      return "image/jpeg";
  }
}

function cleanGalleryTitle(directoryName) {
  const translatedTitle = TITLE_TRANSLATIONS.get(directoryName);

  if (translatedTitle) {
    return translatedTitle;
  }

  return directoryName
    .replace(/\bWITH TEXT\b/gi, "")
    .replace(/\bTEXT\b/gi, "")
    .replace(/\bALL TIERS\b/gi, "")
    .replace(/\bNSFW\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toGallerySummary(gallery) {
  return {
    slug: gallery.slug,
    title: gallery.title,
    originalTitle: gallery.originalTitle,
    sourceType: gallery.sourceType,
    sourcePath: gallery.sourcePath,
    dirCreatedAt: gallery.dirCreatedAt,
    updatedAt: gallery.updatedAt,
    imageCount: gallery.imageCount,
    coverIndex: gallery.coverIndex,
    previewShape: gallery.previewShape,
    artistName: gallery.artistName,
    artistSlug: gallery.artistSlug,
    artistPath: gallery.artistPath,
  };
}

async function readGalleryImageRecords(absoluteDirectory, slug) {
  const files = await readdir(absoluteDirectory, { withFileTypes: true });
  const imageNames = files
    .filter(
      (entry) =>
        entry.isFile() &&
        !entry.name.startsWith("._") &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort(numericAwareSort);

  if (imageNames.length === 0) {
    return [];
  }

  // Limit concurrent stat calls to avoid overwhelming external/slow drives
  const results = [];
  for (let i = 0; i < imageNames.length; i += STAT_CONCURRENCY) {
    const batch = imageNames.slice(i, i + STAT_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (imageName, batchIndex) => {
        const index = i + batchIndex;
        const absolutePath = path.join(absoluteDirectory, imageName);
        const imageStats = await stat(absolutePath);

        return {
          id: `${slug}-${index}`,
          index,
          fileName: imageName,
          absolutePath,
          extension: path.extname(imageName).toLowerCase(),
          createdAt:
            imageStats.birthtimeMs && imageStats.birthtimeMs > 0
              ? imageStats.birthtimeMs
              : imageStats.mtimeMs,
          fileSize: imageStats.size,
        };
      }),
    );
    results.push(...batchResults);
  }

  return results;
}

async function buildFlatGalleryRecord(sourceRoot, galleryDirectoryName, dirCreatedAt) {
  const artistName = path.basename(sourceRoot);
  const artistSlug = toSlug(artistName);
  const artistPath = sourceRoot;
  const absoluteDirectory = path.join(sourceRoot, galleryDirectoryName);
  const relativeGalleryPath = galleryDirectoryName;
  const slug = toSlug(`${artistName}/${relativeGalleryPath}`);
  const images = await readGalleryImageRecords(absoluteDirectory, slug);

  if (images.length === 0) {
    return null;
  }

  const firstImage = images[0];
  const updatedAt = images.reduce((latest, image) => Math.max(latest, image.createdAt), 0);

  return {
    slug,
    title: cleanGalleryTitle(galleryDirectoryName),
    originalTitle: galleryDirectoryName,
    sourceType: "folder",
    sourcePath: absoluteDirectory,
    relativePath: relativeGalleryPath,
    dirCreatedAt,
    updatedAt,
    imageCount: images.length,
    coverIndex: 0,
    previewShape: firstImage.fileSize > 2_000_000 ? "HD set" : "Quick read",
    artistName,
    artistSlug,
    artistPath,
    images,
  };
}

async function buildNestedGalleryRecord(sourceRoot, artistDirectoryName, galleryDirectoryName, dirCreatedAt) {
  const artistPath = path.join(sourceRoot, artistDirectoryName);
  const artistSlug = toSlug(artistDirectoryName);
  const absoluteDirectory = path.join(artistPath, galleryDirectoryName);
  const relativeGalleryPath = path.relative(sourceRoot, absoluteDirectory);
  const slug = toSlug(relativeGalleryPath);
  const images = await readGalleryImageRecords(absoluteDirectory, slug);

  if (images.length === 0) {
    return null;
  }

  const firstImage = images[0];
  const updatedAt = images.reduce((latest, image) => Math.max(latest, image.createdAt), 0);

  return {
    slug,
    title: cleanGalleryTitle(galleryDirectoryName),
    originalTitle: galleryDirectoryName,
    sourceType: "folder",
    sourcePath: absoluteDirectory,
    relativePath: relativeGalleryPath,
    dirCreatedAt,
    updatedAt,
    imageCount: images.length,
    coverIndex: 0,
    previewShape: firstImage.fileSize > 2_000_000 ? "HD set" : "Quick read",
    artistName: artistDirectoryName,
    artistSlug,
    artistPath,
    images,
  };
}

async function readFlatGalleryDirectories(sourceRoot, layoutHints) {
  if (galleryCache.layout !== "flat") {
    galleryCache.flatCache = new Map();
    galleryCache.artistCaches = new Map();
  }

  const nextFlatCache = new Map();
  const galleries = [];

  for (const entry of layoutHints.filter((item) => item.hasImages)) {
    const absoluteDirectory = path.join(sourceRoot, entry.directoryName);
    const directoryStat = await stat(absoluteDirectory);
    const cachedEntry = galleryCache.flatCache.get(entry.directoryName);

    let gallery = cachedEntry?.gallery ?? null;
    if (!cachedEntry || cachedEntry.directoryMtimeMs !== directoryStat.mtimeMs) {
      const dirCreatedAt = directoryStat.birthtimeMs > 0 ? directoryStat.birthtimeMs : directoryStat.mtimeMs;
      gallery = await buildFlatGalleryRecord(sourceRoot, entry.directoryName, dirCreatedAt);
    }

    if (!gallery) {
      continue;
    }

    nextFlatCache.set(entry.directoryName, {
      directoryMtimeMs: directoryStat.mtimeMs,
      gallery,
    });
    galleries.push(gallery);
  }

  galleryCache.layout = "flat";
  galleryCache.flatCache = nextFlatCache;
  galleryCache.artistCaches = new Map();

  return galleries.sort((left, right) => right.dirCreatedAt - left.dirCreatedAt);
}

async function readNestedGalleryDirectories(sourceRoot, rootDirectories) {
  if (galleryCache.layout !== "nested") {
    galleryCache.flatCache = new Map();
    galleryCache.artistCaches = new Map();
  }

  const nextArtistCaches = new Map();
  const allGalleries = [];

  for (const artistDirectoryName of rootDirectories) {
    const artistPath = path.join(sourceRoot, artistDirectoryName);
    const artistStat = await stat(artistPath);
    const cachedArtist = galleryCache.artistCaches.get(artistDirectoryName);

    let galleryDirectories = cachedArtist?.galleryDirectories ?? [];
    if (!cachedArtist || cachedArtist.artistMtimeMs !== artistStat.mtimeMs) {
      const galleryEntries = await readdir(artistPath, { withFileTypes: true });
      galleryDirectories = galleryEntries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("._"))
        .map((entry) => entry.name)
        .sort(numericAwareSort);
    }

    const nextGalleryCaches = new Map();
    const artistGalleries = [];

    for (const galleryDirectoryName of galleryDirectories) {
      const absoluteDirectory = path.join(artistPath, galleryDirectoryName);
      const directoryStat = await stat(absoluteDirectory);
      const cachedGallery = cachedArtist?.galleryCaches?.get(galleryDirectoryName);

      let gallery = cachedGallery?.gallery ?? null;
      if (!cachedGallery || cachedGallery.directoryMtimeMs !== directoryStat.mtimeMs) {
        const dirCreatedAt = directoryStat.birthtimeMs > 0 ? directoryStat.birthtimeMs : directoryStat.mtimeMs;
        gallery = await buildNestedGalleryRecord(
          sourceRoot,
          artistDirectoryName,
          galleryDirectoryName,
          dirCreatedAt,
        );
      }

      if (!gallery) {
        continue;
      }

      nextGalleryCaches.set(galleryDirectoryName, {
        directoryMtimeMs: directoryStat.mtimeMs,
        gallery,
      });
      artistGalleries.push(gallery);
      allGalleries.push(gallery);
    }

    nextArtistCaches.set(artistDirectoryName, {
      artistMtimeMs: artistStat.mtimeMs,
      galleryDirectories,
      galleryCaches: nextGalleryCaches,
      galleries: artistGalleries,
    });
  }

  galleryCache.layout = "nested";
  galleryCache.flatCache = new Map();
  galleryCache.artistCaches = nextArtistCaches;

  return allGalleries.sort((left, right) => right.dirCreatedAt - left.dirCreatedAt);
}

async function readGalleryDirectories() {
  const sourceRoot = getSourceRoot();

  if (!sourceRoot) {
    return [];
  }

  const rootEntries = await readdir(sourceRoot, { withFileTypes: true });
  const rootDirectories = rootEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("._"))
    .map((entry) => entry.name)
    .sort(numericAwareSort);

  const layoutHints = await Promise.all(
    rootDirectories.map(async (directoryName) => {
      const absoluteDirectory = path.join(sourceRoot, directoryName);
      const files = await readdir(absoluteDirectory, { withFileTypes: true });

      return {
        directoryName,
        hasImages: files.some(
          (entry) =>
            entry.isFile() &&
            !entry.name.startsWith("._") &&
            IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
        ),
      };
    }),
  );

  const isFlatLayout = layoutHints.some((entry) => entry.hasImages);

  if (isFlatLayout) {
    return readFlatGalleryDirectories(sourceRoot, layoutHints);
  }

  return readNestedGalleryDirectories(sourceRoot, rootDirectories);
}

async function loadGalleries() {
  await syncGalleryCacheInvalidation();

  if (Date.now() < galleryCache.expiresAt) {
    return galleryCache.items;
  }

  if (galleryCachePromise) {
    return galleryCachePromise;
  }

  const generation = galleryCacheGeneration;

  galleryCachePromise = (async () => {
    try {
      const items = await readGalleryDirectories();

      if (galleryCacheGeneration === generation) {
        galleryCache = {
          ...galleryCache,
          expiresAt: Date.now() + getGalleryCacheTtlMs(),
          items,
        };
      }
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }

      if (galleryCacheGeneration === generation) {
        galleryCache = {
          expiresAt: Date.now() + getGalleryCacheTtlMs(),
          layout: null,
          flatCache: new Map(),
          artistCaches: new Map(),
          items: [],
        };
      }
    } finally {
      galleryCachePromise = null;
    }

    return galleryCache.items;
  })();

  return galleryCachePromise;
}

export function invalidateGalleryCache() {
  galleryCacheGeneration += 1;
  galleryCache = {
    expiresAt: 0,
    layout: null,
    flatCache: new Map(),
    artistCaches: new Map(),
    items: [],
  };
  galleryCachePromise = null;
}

export function isPathInsideDirectory(rootPath, targetPath) {
  const normalizedRoot = path.resolve(rootPath);
  const normalizedTarget = path.resolve(targetPath);
  const relativePath = path.relative(normalizedRoot, normalizedTarget);

  return (
    relativePath.length > 0 &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
}

function buildTrashDirectoryName(directoryName, slug) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${directoryName}--${slug}--${timestamp}`;
}

async function findGalleryRecordBySlug(slug) {
  const galleries = await loadGalleries();
  return galleries.find((item) => item.slug === slug) || null;
}

function toGroupSlug(groupIndex) {
  return `group-${String(groupIndex + 1).padStart(3, "0")}`;
}

export function groupGallerySummaries(galleries) {
  const groups = [];

  for (let groupIndex = 0; groupIndex * GROUP_SIZE < galleries.length; groupIndex += 1) {
    const startIndex = groupIndex * GROUP_SIZE;
    const items = galleries.slice(startIndex, startIndex + GROUP_SIZE);

    groups.push({
      slug: toGroupSlug(groupIndex),
      title: `Sets ${startIndex + 1}-${startIndex + items.length}`,
      startIndex: startIndex + 1,
      endIndex: startIndex + items.length,
      galleryCount: items.length,
      imageCount: items.reduce((total, gallery) => total + gallery.imageCount, 0),
      galleries: items,
    });
  }

  return groups;
}

export async function getGallerySummaries() {
  const galleries = await loadGalleries();
  return galleries.map(toGallerySummary);
}

export async function getGalleryGroups() {
  const galleries = await getGallerySummaries();
  return groupGallerySummaries(galleries);
}

export async function getGalleryGroupBySlug(slug) {
  const groups = await getGalleryGroups();
  return groups.find((group) => group.slug === slug) || null;
}

export async function getArtistSummaries() {
  const galleries = await loadGalleries();
  const artists = new Map();

  for (const gallery of galleries) {
    const current = artists.get(gallery.artistSlug);

    if (!current) {
      artists.set(gallery.artistSlug, {
        slug: gallery.artistSlug,
        title: gallery.artistName,
        artistName: gallery.artistName,
        artistPath: gallery.artistPath,
        galleryCount: 1,
        imageCount: gallery.imageCount,
        latestDirCreatedAt: gallery.dirCreatedAt,
        updatedAt: gallery.updatedAt,
        previewGalleries: [toGallerySummary(gallery)],
      });
      continue;
    }

    current.galleryCount += 1;
    current.imageCount += gallery.imageCount;
    current.latestDirCreatedAt = Math.max(current.latestDirCreatedAt, gallery.dirCreatedAt);
    current.updatedAt = Math.max(current.updatedAt, gallery.updatedAt);

    if (current.previewGalleries.length < 4) {
      current.previewGalleries.push(toGallerySummary(gallery));
    }
  }

  return Array.from(artists.values()).sort((left, right) => right.latestDirCreatedAt - left.latestDirCreatedAt);
}

export async function getArtistBySlug(slug) {
  const artists = await getArtistSummaries();
  const artist = artists.find((item) => item.slug === slug);

  if (!artist) {
    return null;
  }

  const galleries = await getGallerySummaries();
  const artistGalleries = galleries.filter((gallery) => gallery.artistSlug === slug);

  return {
    ...artist,
    galleries: artistGalleries,
    groups: artistGalleries.length > GROUP_SIZE
      ? groupGallerySummaries(artistGalleries)
      : null,
  };
}

export async function getArtistGroupBySlug(artistSlug, groupSlug) {
  const artist = await getArtistBySlug(artistSlug);

  if (!artist || !artist.groups) {
    return null;
  }

  return artist.groups.find((group) => group.slug === groupSlug) || null;
}

export async function getGalleryBySlug(slug) {
  const gallery = await findGalleryRecordBySlug(slug);

  if (!gallery) {
    return null;
  }

  return {
    ...toGallerySummary(gallery),
    images: gallery.images.map((image) => ({
      id: image.id,
      index: image.index,
    })),
  };
}

export async function getGalleryImageByIndex(slug, indexParam) {
  const gallery = await findGalleryRecordBySlug(slug);

  if (!gallery) {
    return null;
  }

  const imageIndex = Number(indexParam);

  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return null;
  }

  const image = gallery.images[imageIndex];

  if (!image) {
    return null;
  }

  return {
    ...image,
    contentType: getContentType(image.extension),
  };
}

export async function moveGalleryToTrashBySlug(slug) {
  const sourceRoot = getSourceRoot();

  if (!sourceRoot) {
    const error = new Error("Gallery source directory is not configured.");
    error.status = 500;
    throw error;
  }

  const gallery = await findGalleryRecordBySlug(slug);

  if (!gallery) {
    return null;
  }

  const normalizedSourceRoot = path.resolve(sourceRoot);
  const normalizedArtistPath = path.resolve(gallery.artistPath);

  if (
    normalizedArtistPath !== normalizedSourceRoot &&
    !isPathInsideDirectory(sourceRoot, gallery.artistPath)
  ) {
    const error = new Error("Artist path is outside the configured source root.");
    error.status = 400;
    throw error;
  }

  if (!isPathInsideDirectory(gallery.artistPath, gallery.sourcePath)) {
    const error = new Error("Gallery path is outside the configured artist directory.");
    error.status = 400;
    throw error;
  }

  const trashRoot = getTrashRoot();

  if (
    path.resolve(trashRoot) === path.resolve(sourceRoot) ||
    isPathInsideDirectory(sourceRoot, trashRoot)
  ) {
    const error = new Error("Trash directory must be outside the gallery source root.");
    error.status = 500;
    throw error;
  }

  const trashPath = path.join(
    trashRoot,
    buildTrashDirectoryName(gallery.originalTitle, gallery.slug),
  );

  try {
    await access(gallery.sourcePath);
  } catch {
    const error = new Error("Gallery directory no longer exists on disk.");
    error.status = 404;
    throw error;
  }

  await mkdir(trashRoot, { recursive: true });

  try {
    await rename(gallery.sourcePath, trashPath);
  } catch (renameError) {
    if (renameError.code === "EXDEV") {
      // Cross-device rename: fall back to copy + remove
      await execFileAsync("cp", ["-R", gallery.sourcePath, trashPath]);
      await rm(gallery.sourcePath, { recursive: true, force: true });
    } else if (renameError.code === "ENOENT") {
      const error = new Error("Gallery directory was removed during deletion.");
      error.status = 404;
      throw error;
    } else if (renameError.code === "EPERM" || renameError.code === "EACCES") {
      const error = new Error(
        "Permission denied. Check that the app has access to both the gallery and trash directories.",
      );
      error.status = 403;
      throw error;
    } else {
      throw renameError;
    }
  }

  await writeGalleryInvalidationToken();
  invalidateGalleryCache();

  return {
    slug: gallery.slug,
    title: gallery.title,
    originalTitle: gallery.originalTitle,
    artistName: gallery.artistName,
    trashPath,
  };
}
