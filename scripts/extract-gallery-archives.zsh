#!/bin/zsh
set -euo pipefail

SOURCE_DIR="${1:-$HOME/Downloads/Gallery}"
TARGET_DIR="${2:-$SOURCE_DIR/extracted}"

mkdir -p "$TARGET_DIR"

find "$SOURCE_DIR" -maxdepth 1 -type f \
  \( -iname "*.zip" -o -iname "*.cbz" -o -iname "*.rar" -o -iname "*.cbr" \) \
  -print0 | while IFS= read -r -d '' archive; do
  base="$(basename "$archive")"
  name="${base%.*}"
  output_dir="$TARGET_DIR/$name"

  mkdir -p "$output_dir"
  unar -quiet -force-overwrite -output-directory "$output_dir" "$archive"
done
