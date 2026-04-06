export const GALLERY_INVALIDATION_EVENT = "gallery:changed";
export const GALLERY_INVALIDATION_STORAGE_KEY = "open-gallery:gallery-invalidation";

export function buildGalleryRefreshSignature(token, pathname) {
  if (!token || !pathname) {
    return null;
  }

  return `${token}:${pathname}`;
}

export function markGalleryInvalidated() {
  if (typeof window === "undefined") {
    return null;
  }

  const token = `${Date.now()}`;
  window.sessionStorage.setItem(GALLERY_INVALIDATION_STORAGE_KEY, token);
  window.dispatchEvent(
    new CustomEvent(GALLERY_INVALIDATION_EVENT, {
      detail: { token },
    }),
  );

  return token;
}

export function readGalleryInvalidationToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(GALLERY_INVALIDATION_STORAGE_KEY);
}
