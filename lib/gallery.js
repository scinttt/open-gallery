import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const SOURCE_ROOT =
  process.env.GALLERY_SOURCE_DIR || null;
const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const CACHE_TTL_MS = 15_000;
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
  items: [],
};

function toSlug(name) {
  const base = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
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

async function readGalleryDirectories() {
  if (!SOURCE_ROOT) {
    return [];
  }

  const entries = await readdir(SOURCE_ROOT, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const galleries = await Promise.all(
    directories.map(async (directoryName) => {
      const absoluteDirectory = path.join(SOURCE_ROOT, directoryName);
      const files = await readdir(absoluteDirectory, { withFileTypes: true });
      const imageNames = files
        .filter(
          (entry) =>
            entry.isFile() &&
            IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
        )
        .map((entry) => entry.name)
        .sort(numericAwareSort);

      if (imageNames.length === 0) {
        return null;
      }

      const slug = toSlug(directoryName);
      const images = await Promise.all(
        imageNames.map(async (imageName, index) => {
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
      const firstImageStats = images[0];
      const updatedAt = images.reduce(
        (latest, image) => Math.max(latest, image.createdAt),
        0,
      );

      return {
        slug,
        title: cleanGalleryTitle(directoryName),
        originalTitle: directoryName,
        sourceType: "folder",
        sourcePath: absoluteDirectory,
        updatedAt,
        imageCount: images.length,
        coverIndex: 0,
        previewShape:
          firstImageStats.fileSize > 2_000_000 ? "HD set" : "Quick read",
        images,
      };
    }),
  );

  return galleries
    .filter(Boolean)
    .sort((left, right) => right.updatedAt - left.updatedAt);
}

async function loadGalleries() {
  if (Date.now() < galleryCache.expiresAt) {
    return galleryCache.items;
  }

  let items = [];

  try {
    items = await readGalleryDirectories();
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  galleryCache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    items,
  };
  return items;
}

export async function getGallerySummaries() {
  const galleries = await loadGalleries();
  return galleries.map((gallery) => ({
    slug: gallery.slug,
    title: gallery.title,
    sourceType: gallery.sourceType,
    sourcePath: gallery.sourcePath,
    updatedAt: gallery.updatedAt,
    imageCount: gallery.imageCount,
    coverIndex: gallery.coverIndex,
    previewShape: gallery.previewShape,
  }));
}

export async function getGalleryBySlug(slug) {
  const galleries = await loadGalleries();
  const gallery = galleries.find((item) => item.slug === slug);

  if (!gallery) {
    return null;
  }

  return {
    ...gallery,
    images: gallery.images.map((image) => ({
      id: image.id,
      index: image.index,
    })),
  };
}

export async function getGalleryImageByIndex(slug, indexParam) {
  const galleries = await loadGalleries();
  const gallery = galleries.find((item) => item.slug === slug);

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
