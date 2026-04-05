import Link from "next/link";
import AuthUserButton from "@/components/auth-user-button";
import { GalleryCard } from "@/components/gallery-card";
import { getGalleryGroupBySlug } from "@/lib/gallery";

export const dynamic = "force-dynamic";

export default async function GalleryGroupPage({ params }) {
  const { groupSlug } = await params;
  const group = await getGalleryGroupBySlug(groupSlug);

  if (!group) {
    return (
      <main className="page-shell detail-page">
        <div className="missing-state">
          <p className="eyebrow">Missing Group</p>
          <h1>This group could not be found.</h1>
          <Link className="back-link" href="/">
            Return home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell detail-page group-page">
      <div className="topbar">
        <span className="topbar-mark">Private Library</span>
        <AuthUserButton />
      </div>

      <div className="detail-body">
        <header className="detail-hero">
          <div>
            <Link className="back-link" href="/">
              Back to groups
            </Link>
            <p className="eyebrow">Gallery Group</p>
            <h1>{group.title}</h1>
            <p className="detail-description">
              This block contains sets {group.startIndex} to {group.endIndex}.
              Open any card below to enter the original long-scroll reader.
            </p>
          </div>

          <dl className="detail-facts">
            <div>
              <dt>Sets</dt>
              <dd>{group.galleryCount}</dd>
            </div>
            <div>
              <dt>Images</dt>
              <dd>{group.imageCount}</dd>
            </div>
            <div>
              <dt>Range</dt>
              <dd>
                {group.startIndex}-{group.endIndex}
              </dd>
            </div>
          </dl>
        </header>

        <section className="gallery-grid" aria-label={`${group.title} galleries`}>
          {group.galleries.map((gallery) => (
            <GalleryCard gallery={gallery} key={gallery.slug} />
          ))}
        </section>
      </div>
    </main>
  );
}
