import { ClerkProvider } from "@clerk/nextjs";
import GallerySyncListener from "@/components/gallery-sync-listener";
import { ICON_BASE_PATH, RESOLVED_ICON_VERSION } from "../lib/icon-assets";
import { CLERK_ENABLED } from "../lib/auth-config";
import "./globals.css";

export const metadata = {
  title: "Open Gallery",
  description: "Anime-style local gallery browser",
  applicationName: "Open Gallery",
  manifest: `/manifest.webmanifest?v=${RESOLVED_ICON_VERSION}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Gallery",
  },
  icons: {
    icon: [
      {
        url: `${ICON_BASE_PATH}/favicon-32.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: `${ICON_BASE_PATH}/icon-192.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${ICON_BASE_PATH}/icon-512.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `${ICON_BASE_PATH}/apple-touch-icon.png?v=${RESOLVED_ICON_VERSION}`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  const body = CLERK_ENABLED ? <ClerkProvider>{children}</ClerkProvider> : children;

  return (
    <html lang="en">
      <body>
        <GallerySyncListener />
        {body}
      </body>
    </html>
  );
}
