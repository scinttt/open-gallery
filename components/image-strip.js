"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import RetryImage from "@/components/retry-image";
import ScrollPageIndicator from "@/components/scroll-page-indicator";

const INITIAL_BATCH = 3;
const BATCH_SIZE = 6;

export default function ImageStrip({ gallery }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [currentIndex, setCurrentIndex] = useState(0);
  const anchorRef = useRef(null);
  const stripRef = useRef(null);
  const indexObserverRef = useRef(null);

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

  // Shared IntersectionObserver to track which image is currently visible
  useEffect(() => {
    const strip = stripRef.current;

    if (!strip) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);

            if (!Number.isNaN(index)) {
              setCurrentIndex(index);
            }
          }
        }
      },
      { threshold: 0.5 },
    );

    indexObserverRef.current = observer;

    const figures = strip.querySelectorAll("[data-index]");

    for (const figure of figures) {
      observer.observe(figure);
    }

    return () => observer.disconnect();
  }, [visibleCount]);

  const figureRef = useCallback(
    (node) => {
      if (node && indexObserverRef.current) {
        indexObserverRef.current.observe(node);
      }
    },
    [],
  );

  const visibleImages = gallery.images.slice(0, visibleCount);

  return (
    <section
      className="image-strip"
      aria-label={`${gallery.title} image strip`}
      ref={stripRef}
    >
      <ScrollPageIndicator
        currentIndex={currentIndex}
        totalCount={gallery.images.length}
      />

      {visibleImages.map((image, index) => (
        <figure
          className="image-section"
          key={image.id}
          data-index={index}
          ref={figureRef}
        >
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
