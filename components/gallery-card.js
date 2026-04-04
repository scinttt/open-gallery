import Link from "next/link";

export function GalleryCard({ gallery }) {
  return (
    <article className="gallery-card">
      <Link href={`/gallery/${gallery.slug}`}>
        <div className="cover-frame">
          <img
            alt={gallery.title}
            loading="lazy"
            src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=560&q=70`}
          />
          <div className="cover-overlay">
            <span className="cover-chip">{gallery.imageCount} pics</span>
          </div>
        </div>
        <div className="gallery-info">
          <h3 className="gallery-title">{gallery.title}</h3>
        </div>
      </Link>
    </article>
  );
}
