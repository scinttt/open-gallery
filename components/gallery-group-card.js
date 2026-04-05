import Link from "next/link";

export function GalleryGroupCard({ group }) {
  return (
    <article className="gallery-card gallery-group-card">
      <Link href={`/groups/${group.slug}`}>
        <div className="cover-frame group-cover-frame">
          <div className="group-cover-grid">
            {group.galleries.map((gallery) => (
              <img
                alt={gallery.title}
                className="group-cover-tile"
                key={gallery.slug}
                loading="lazy"
                src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=280&q=62`}
              />
            ))}
          </div>
          <div className="cover-overlay">
            <span className="cover-chip">{group.galleryCount} sets</span>
            <span className="cover-chip">{group.imageCount} pics</span>
          </div>
        </div>
        <div className="gallery-info">
          <h3 className="gallery-title">{group.title}</h3>
          <p className="gallery-meta">
            Browse sets {group.startIndex} to {group.endIndex}
          </p>
        </div>
      </Link>
    </article>
  );
}
