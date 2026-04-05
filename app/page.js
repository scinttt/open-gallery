import AuthUserButton from "@/components/auth-user-button";
import { GalleryGroupCard } from "@/components/gallery-group-card";
import { getGalleryGroups } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const groups = await getGalleryGroups();
  const totalSets = groups.reduce((total, group) => total + group.galleryCount, 0);

  return (
    <main className="page-shell home-page">
      <div className="topbar">
        <span className="topbar-mark">Open Gallery</span>
        <AuthUserButton />
      </div>

      <header className="section-heading">
        <div>
          <p className="eyebrow">Grouped Library</p>
          <h2>Every 10 sets in one block</h2>
        </div>
        <p className="detail-description">
          {totalSets} sets are now grouped into {groups.length} blocks, so older
          galleries are easier to reach without endless scrolling.
        </p>
      </header>

      <section className="gallery-grid" aria-label="Gallery group grid">
        {groups.map((group) => (
          <GalleryGroupCard group={group} key={group.slug} />
        ))}
      </section>
    </main>
  );
}
