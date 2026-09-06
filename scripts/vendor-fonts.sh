#!/usr/bin/env bash
# Vendor the Press web fonts (latin, variable) into public/fonts as self-hosted
# woff2 — no CDN at runtime (local-first brand). Source is the @fontsource-variable
# packages pinned in devDependencies. The `opsz` files carry both the optical-size
# and weight axes, so a single file per family covers our whole weight range.
#
# Re-run after bumping the @fontsource-variable/* versions. Inter is vendored
# separately (static weights) and is untouched here.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MODULES="$REPO_ROOT/node_modules/@fontsource-variable"
DEST="$REPO_ROOT/public/fonts"

if [ ! -d "$MODULES/fraunces" ] || [ ! -d "$MODULES/newsreader" ]; then
  echo "error: @fontsource-variable/{fraunces,newsreader} not installed — run npm install." >&2
  exit 1
fi

cp "$MODULES/fraunces/files/fraunces-latin-opsz-normal.woff2"    "$DEST/Fraunces-Variable-latin.woff2"
cp "$MODULES/newsreader/files/newsreader-latin-opsz-normal.woff2" "$DEST/Newsreader-Variable-latin.woff2"
cp "$MODULES/newsreader/files/newsreader-latin-opsz-italic.woff2" "$DEST/Newsreader-Variable-Italic-latin.woff2"

echo "vendored Fraunces + Newsreader (normal + italic) into public/fonts/"
