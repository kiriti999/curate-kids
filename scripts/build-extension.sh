#!/bin/bash
# Package the browser extension for download from the site.
# Output: public/downloads/curatedreels-safe-browsing-extension.zip
set -e
cd "$(dirname "$0")/.."
OUT=public/downloads/curatedreels-safe-browsing-extension.zip
rm -f "$OUT"
mkdir -p public/downloads
(cd packages/chrome-extension && zip -qr "../../$OUT" . -x "_metadata/*" "README.md" ".DS_Store" "*/.DS_Store")
echo "Built $OUT ($(du -h "$OUT" | cut -f1))"
