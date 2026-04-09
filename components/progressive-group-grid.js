"use client";

import { useEffect, useRef, useState } from "react";
import { GalleryGroupCard } from "@/components/gallery-group-card";

const INITIAL_BATCH = 2;
const BATCH_SIZE = 2;

export default function ProgressiveGroupGrid({ groups, hrefPrefix = "/groups" }) {
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
            Math.min(current + BATCH_SIZE, groups.length),
          );
        }
      },
      { rootMargin: "400px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount, groups.length]);

  const visibleGroups = groups.slice(0, visibleCount);

  return (
    <section className="gallery-grid" aria-label="Gallery group grid">
      {visibleGroups.map((group) => (
        <GalleryGroupCard group={group} hrefPrefix={hrefPrefix} key={group.slug} />
      ))}

      {visibleCount < groups.length ? (
        <div aria-hidden="true" className="gallery-grid-anchor" ref={anchorRef} />
      ) : null}
    </section>
  );
}
