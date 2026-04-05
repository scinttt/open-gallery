import Link from "next/link";

export function GalleryCard({
  gallery,
  href = `/gallery/${gallery.slug}`,
  interactive = true,
  overlayAction = null,
}) {
  const cardBody = (
    <>
      <div className="cover-frame">
        <img
          alt={gallery.title}
          loading="lazy"
          src={`/api/media/${gallery.slug}/${gallery.coverIndex}?mode=cover&w=560&q=70`}
        />
        {overlayAction ? (
          <div className="gallery-card-action">{overlayAction}</div>
        ) : null}
        <div className="cover-overlay">
          <span className="cover-chip">{gallery.imageCount} pics</span>
        </div>
      </div>
      <div className="gallery-info">
        <h3 className="gallery-title">{gallery.title}</h3>
      </div>
    </>
  );

  return (
    <article className={`gallery-card${interactive ? "" : " gallery-card-static"}`}>
      {interactive ? <Link href={href}>{cardBody}</Link> : cardBody}
    </article>
  );
}
