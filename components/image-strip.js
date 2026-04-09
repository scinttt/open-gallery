"use client";

import { useEffect, useRef, useState } from "react";
import RetryImage from "@/components/retry-image";

const INITIAL_BATCH = 3;
const BATCH_SIZE = 6;

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
      { rootMargin: "600px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount, gallery.images.length]);

  const visibleImages = gallery.images.slice(0, visibleCount);

  return (
    <section
      className="image-strip"
      aria-label={`${gallery.title} image strip`}
    >
      {visibleImages.map((image, index) => (
        <figure className="image-section" key={image.id}>
          <RetryImage
            alt={`${gallery.title} ${index + 1}`}
            loading={index < 2 ? "eager" : "lazy"}
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
