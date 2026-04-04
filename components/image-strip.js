"use client";

import { useEffect, useRef, useState } from "react";

const INITIAL_BATCH = 12;
const BATCH_SIZE = 10;

export default function ImageStrip({ gallery }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const anchorRef = useRef(null);

  useEffect(() => {
    const target = anchorRef.current;

    if (!target) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(current + BATCH_SIZE, gallery.images.length),
          );
        }
      },
      { rootMargin: "1200px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [gallery.images.length]);

  const visibleImages = gallery.images.slice(0, visibleCount);

  return (
    <section className="image-strip" aria-label={`${gallery.title} image strip`}>
      {visibleImages.map((image, index) => (
        <figure className="image-section" key={image.id}>
          <img
            alt={`${gallery.title} ${index + 1}`}
            loading={index < 3 ? "eager" : "lazy"}
            src={`/api/media/${gallery.slug}/${image.index}?mode=detail&w=1440&q=82`}
          />
        </figure>
      ))}

      {visibleCount < gallery.images.length ? (
        <div aria-hidden="true" className="image-placeholder" ref={anchorRef} />
      ) : null}
    </section>
  );
}
