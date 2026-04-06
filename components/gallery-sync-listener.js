"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildGalleryRefreshSignature,
  GALLERY_INVALIDATION_EVENT,
  readGalleryInvalidationToken,
} from "@/lib/gallery-sync";

export default function GallerySyncListener() {
  const router = useRouter();
  const pathname = usePathname();
  const hasInitializedRef = useRef(false);
  const lastRefreshSignatureRef = useRef(null);

  function refreshPathForToken(token, currentPathname) {
    const signature = buildGalleryRefreshSignature(token, currentPathname);

    if (!signature || lastRefreshSignatureRef.current === signature) {
      return;
    }

    lastRefreshSignatureRef.current = signature;
    router.refresh();
  }

  useEffect(() => {
    const token = readGalleryInvalidationToken();

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      lastRefreshSignatureRef.current = buildGalleryRefreshSignature(token, pathname);
      return;
    }

    refreshPathForToken(token, pathname);
  }, [pathname, router]);

  useEffect(() => {
    function handleInvalidation(event) {
      const token = event.detail?.token || readGalleryInvalidationToken();
      refreshPathForToken(token, pathname);
    }

    window.addEventListener(GALLERY_INVALIDATION_EVENT, handleInvalidation);

    return () => {
      window.removeEventListener(GALLERY_INVALIDATION_EVENT, handleInvalidation);
    };
  }, [pathname, router]);

  return null;
}
