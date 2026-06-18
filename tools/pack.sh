#!/usr/bin/env bash
# Build distributable artifacts:
#   dist/yt-gemini-summary.zip  — upload this to the Chrome Web Store
#   dist/yt-gemini-summary.crx  — signed package for self-distribution (if Chrome is present)
# The signing key is kept at key.pem (gitignored) so the extension ID stays stable
# across rebuilds. Run from anywhere:  bash tools/pack.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
STAGE="$DIST/yt-gemini-summary"
KEY="$ROOT/key.pem"

# Only the files the extension actually needs at runtime.
RUNTIME=(
  manifest.json lib.js background.js content-gemini.js content-youtube.js
  options.html options.js options.css welcome.html
)

rm -rf "$DIST"
mkdir -p "$STAGE/icons"
for f in "${RUNTIME[@]}"; do cp "$ROOT/$f" "$STAGE/"; done
cp "$ROOT"/icons/*.png "$STAGE/icons/"

# .zip — zip the CONTENTS of the staging dir (manifest must be at the zip root).
( cd "$STAGE" && zip -qr -X "$DIST/yt-gemini-summary.zip" . )
echo "built dist/yt-gemini-summary.zip"

# .crx — needs a real Chrome. First run generates key.pem; later runs reuse it.
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ -x "$CHROME" ]; then
  PROFILE="$(mktemp -d)"
  if [ -f "$KEY" ]; then
    "$CHROME" --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check \
      --pack-extension="$STAGE" --pack-extension-key="$KEY" >/dev/null 2>&1 || true
  else
    "$CHROME" --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check \
      --pack-extension="$STAGE" >/dev/null 2>&1 || true
    [ -f "$STAGE.pem" ] && mv "$STAGE.pem" "$KEY"
  fi
  rm -rf "$PROFILE"
  if [ -f "$STAGE.crx" ]; then
    mv "$STAGE.crx" "$DIST/yt-gemini-summary.crx"
    echo "built dist/yt-gemini-summary.crx (key: key.pem, keep it safe + out of git)"
  else
    echo "note: .crx not produced (Chrome pack skipped/failed); .zip is ready regardless"
  fi
else
  echo "note: Chrome not found; built .zip only. Use chrome://extensions → Pack extension for a .crx."
fi

# Tidy the staging dir; keep only the artifacts.
rm -rf "$STAGE"
echo "done. artifacts in dist/:"
ls -1 "$DIST"
