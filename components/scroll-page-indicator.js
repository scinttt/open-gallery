"use client";

import { useEffect, useRef, useState } from "react";

const FADE_DELAY_MS = 1500;

export default function ScrollPageIndicator({ currentIndex, totalCount }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex === prevIndexRef.current && !visible) {
      return;
    }

    prevIndexRef.current = currentIndex;
    setVisible(true);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), FADE_DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, visible]);

  if (totalCount <= 1) {
    return null;
  }

  return (
    <div
      className="scroll-page-indicator"
      aria-live="polite"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {currentIndex + 1} / {totalCount}
    </div>
  );
}
