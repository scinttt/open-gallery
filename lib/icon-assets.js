import fs from "node:fs";
import path from "node:path";
import { ICON_VERSION as DEFAULT_ICON_VERSION } from "./icon-version";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const LOCAL_ICON_DIR = path.join(PUBLIC_DIR, "local-icons");
const REQUIRED_ICON_FILES = [
  "favicon-32.png",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
];

function getLocalIconVersion() {
  const mtimes = REQUIRED_ICON_FILES.map((file) =>
    fs.statSync(path.join(LOCAL_ICON_DIR, file)).mtimeMs,
  );
  return `local-${Math.max(...mtimes).toFixed(0)}`;
}

export const HAS_LOCAL_ICONS = REQUIRED_ICON_FILES.every((file) =>
  fs.existsSync(path.join(LOCAL_ICON_DIR, file)),
);

export const ICON_BASE_PATH = HAS_LOCAL_ICONS ? "/local-icons" : "";
export const RESOLVED_ICON_VERSION = HAS_LOCAL_ICONS
  ? getLocalIconVersion()
  : DEFAULT_ICON_VERSION;
