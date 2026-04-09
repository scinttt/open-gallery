import { getGallerySummaries, getGalleryImageByIndex } from "@/lib/gallery";
import { buildCacheKey, getCachedMedia, setCachedMedia } from "@/lib/media-cache";
import { sharpTransform } from "@/lib/sharp-pool";

const WARM_CONCURRENCY = 2;

// Cover variants used by the app
const COVER_VARIANTS = [
  { width: 560, quality: 70 },   // gallery-card.js
  { width: 280, quality: 62 },   // gallery-group-card.js
];

export async function warmCoverCache() {
  const galleries = await getGallerySummaries();
  let warmed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < galleries.length; i += WARM_CONCURRENCY) {
    const batch = galleries.slice(i, i + WARM_CONCURRENCY);

    const results = await Promise.allSettled(
      batch.flatMap((gallery) =>
        COVER_VARIANTS.map(async ({ width, quality }) => {
          const cacheKey = buildCacheKey({
            slug: gallery.slug,
            index: gallery.coverIndex,
            mode: "cover",
            width,
            quality,
          });

          const image = await getGalleryImageByIndex(gallery.slug, gallery.coverIndex);

          if (!image) {
            return "skip";
          }

          const cached = await getCachedMedia(cacheKey, image.absolutePath);

          if (cached) {
            return "skip";
          }

          const transformed = await sharpTransform(image.absolutePath, {
            resize: { width, fit: "cover", withoutEnlargement: true },
            jpeg: { quality, mozjpeg: true, progressive: true },
          });

          await setCachedMedia(cacheKey, transformed);
          return "warmed";
        }),
      ),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        failed += 1;
      } else if (result.value === "warmed") {
        warmed += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { total: galleries.length, warmed, skipped, failed };
}
