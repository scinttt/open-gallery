import AuthUserButton from "@/components/auth-user-button";
import { GalleryCard } from "@/components/gallery-card";
import { getGallerySummaries } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const galleries = await getGallerySummaries();

  return (
    <main className="page-shell home-page">
      <div className="topbar">
        <span className="topbar-mark">Open Gallery</span>
        <AuthUserButton />
      </div>

      <section className="gallery-grid" aria-label="Gallery grid">
        {galleries.map((gallery) => (
          <GalleryCard gallery={gallery} key={gallery.slug} />
        ))}
      </section>
    </main>
  );
}
