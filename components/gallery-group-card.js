import Link from "next/link";

export function GalleryGroupCard({ group, hrefPrefix = "/groups" }) {
  return (
    <article className="gallery-card gallery-group-card">
      <Link href={`${hrefPrefix}/${group.slug}`}>
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
        </div>
        <div className="gallery-info">
          <h3 className="gallery-title">{group.title}</h3>
        </div>
      </Link>
    </article>
  );
}
