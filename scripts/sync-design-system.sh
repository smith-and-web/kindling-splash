#!/usr/bin/env bash
# Sync the Press design system into this repo (one-way, read-only copies).
#
# tokens.css, components.css and DESIGN_GUIDE.md are OWNED by
# ../brand-assets/design-system and are the single source of truth for the brand.
# This mirrors the app's one-way token sync: CI builds from the committed copies
# here, so we vendor them rather than importing across repos.
#
# NEVER hand-edit src/styles/tokens.css, src/styles/components.css, or
# DESIGN_GUIDE.md — change them in the design system and re-run this script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/../brand-assets/design-system"
DEST="$REPO_ROOT/src/styles"

if [ ! -d "$SRC" ]; then
  echo "error: design system not found at $SRC" >&2
  echo "       clone brand-assets as a sibling of this repo, then re-run." >&2
  exit 1
fi

for f in tokens.css components.css; do
  cp "$SRC/$f" "$DEST/$f"
  echo "synced src/styles/$f"
done

# The guide is prose, not stylesheet — it mirrors to the repo root so it is the
# first thing found in the repo (and by CLAUDE.md) rather than buried in styles.
cp "$SRC/DESIGN_GUIDE.md" "$REPO_ROOT/DESIGN_GUIDE.md"
echo "synced DESIGN_GUIDE.md"

echo "done. remember: these are read-only mirrors — edit them in brand-assets."
