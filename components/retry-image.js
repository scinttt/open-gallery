"use client";

import { useCallback, useRef, useState } from "react";

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000];

export default function RetryImage({ src, alt, ...props }) {
  const [retrySuffix, setRetrySuffix] = useState("");
  const retryCountRef = useRef(0);
  const timerRef = useRef(null);

  const handleError = useCallback(() => {
    const attempt = retryCountRef.current;

    if (attempt >= MAX_RETRIES) {
      return;
    }

    const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    retryCountRef.current = attempt + 1;

    timerRef.current = setTimeout(() => {
      // Append a cache-busting parameter to force a new request
      setRetrySuffix(`&_retry=${attempt + 1}`);
    }, delay);
  }, []);

  const handleLoad = useCallback(() => {
    // Reset retry count on successful load
    retryCountRef.current = 0;
  }, []);

  const resolvedSrc = retrySuffix ? `${src}${retrySuffix}` : src;

  return (
    <img
      alt={alt}
      src={resolvedSrc}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}
