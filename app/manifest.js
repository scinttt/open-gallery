import { ICON_BASE_PATH, RESOLVED_ICON_VERSION } from "../lib/icon-assets";

export default function manifest() {
  return {
    name: "Open Gallery",
    short_name: "Gallery",
    description: "Anime-style local gallery browser",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7fb",
    theme_color: "#f59ac4",
    icons: [
      {
        src: `${ICON_BASE_PATH}/icon-192.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${ICON_BASE_PATH}/icon-512.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${ICON_BASE_PATH}/apple-touch-icon.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
