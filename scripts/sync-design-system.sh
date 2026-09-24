#!/usr/bin/env bash
# Vendor a Press snapshot into this repo. One-way, read-only copies.
#
# SOURCE OF TRUTH IS ../press (the @kindling/design-system package). Change a
# stylesheet, a token, a font or a brand asset THERE and re-run this. Nothing
# under src/vendor/press/, public/brand/ or the root press/ directory may be
# hand-edited; `npm run check:design-system` fails the build if it is.
#
# WHY VENDOR RATHER THAN INSTALL THE TARBALL
# `npm pack` on Press produces a ~33MB archive, because reference/ carries 31MB
# of QA baseline images no consumer reads. Committing that per release would
# more than double this repository's history for bytes the site cannot use. We
# copy the subset we consume and record a SHA-256 for every file, which buys the
# same property the tarball would — a clean checkout builds and verifies with no
# sibling checkout present. This is a deliberate deviation from step 3 of
# ../press/docs/MIGRATION.md.
#
# WHAT IS NOT COPIED, AND WHY
#   reference/, ui_kits/, preview/, index.html   QA and catalog surfaces
#   design-system/svelte/                        the app's components; no Svelte
#                                                consumer here but the download
#                                                button island
#   design-system/fonts.css                      serves the canonical TTFs for a
#                                                bundling application; the site
#                                                takes fonts-web.css instead
#   assets/fonts/*.ttf                           ditto, ~3.1MB of sources
#   assets/png/, assets/social/avatar-*          print and social exports
# Every exclusion is recorded in the generated manifest.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$REPO_ROOT/../press"

if [ ! -d "$SRC/design-system" ]; then
  echo "error: Press not found at $SRC" >&2
  echo "       clone smith-and-web/press as a sibling of this repo, then re-run." >&2
  exit 1
fi

VENDOR="$REPO_ROOT/src/vendor/press"
rm -rf "$VENDOR"
mkdir -p "$VENDOR/design-system" "$VENDOR/assets/fonts/web" "$VENDOR/assets/svg" "$VENDOR/licenses"

# --- Stylesheets and behaviour -----------------------------------------------
# tokens defines the custom properties. components is the editorial foundation.
# application owns every operational control (buttons, fields, dialogs) on every
# surface including this one. website is the opt-in .press-web marketing layer,
# which since Press 0.10.0 styles exactly one control, the marketing CTA.
# website-early.js (0.15.0) is inlined in <head> so the mobile nav is collapsed
# in the first frame rather than when website.js arrives.
for f in tokens.css components.css application.css website.css fonts-web.css website.js website-early.js; do
  cp "$SRC/design-system/$f" "$VENDOR/design-system/$f"
done

# --- Fonts -------------------------------------------------------------------
# fonts-web.css resolves ../assets/fonts/web/ relative to itself, so this layout
# is load-bearing: keep design-system/ and assets/ siblings. These are lossless
# WOFF2 encodings of Press's canonical variable TTFs, produced by Press's own
# `npm run fonts:build` — same axes, weights, italics and glyph coverage. The
# site previously vendored narrower Fontsource subsets under the same family
# names; that second declaration authority is retired.
cp "$SRC"/assets/fonts/web/*.woff2 "$VENDOR/assets/fonts/web/"
cp "$SRC/assets/fonts/web/MANIFEST.json" "$VENDOR/assets/fonts/web/MANIFEST.json"
cp -R "$SRC/licenses/fraunces" "$SRC/licenses/inter" "$SRC/licenses/newsreader" "$VENDOR/licenses/"

# --- Brand artwork -----------------------------------------------------------
# Approved lowercase originals at their intrinsic ratios. Never redraw, recolour
# or crop one; below the stacked lockup's 140px minimum, choose another asset.
# Two destinations, both verified. public/brand/ keeps the stable URLs that
# standalone HTML outside the Astro build (public/welcome.html) and existing
# shares already point at; src/vendor/press/assets/svg/ is what build-time
# importers resolve — Starlight's logo, and anything passed to <Image>.
mkdir -p "$REPO_ROOT/public/brand"
for f in kindling-favicon.svg kindling-favicon-reversed.svg kindling-wordmark.svg \
         kindling-wordmark-reversed.svg kindling-mark.svg kindling-mark-reversed.svg \
         kindling-lockup-stacked.svg kindling-lockup-stacked-reversed.svg; do
  cp "$SRC/assets/svg/$f" "$REPO_ROOT/public/brand/$f"
  cp "$SRC/assets/svg/$f" "$VENDOR/assets/svg/$f"
done

# Favicon family, web manifest and the Open Graph card, at the URLs already
# published in <head> and in existing shares. Do not rename these.
for f in favicon.svg favicon-16.png favicon-32.png favicon.ico apple-touch-icon.png \
         icon-192.png icon-512.png site.webmanifest; do
  cp "$SRC/assets/favicon/$f" "$REPO_ROOT/public/$f"
done
cp "$SRC/assets/social/og-image.png" "$REPO_ROOT/public/og-image.png"

# --- Guidance ----------------------------------------------------------------
# DESIGN.md is the authoritative contract and links to docs/ beside it, so the
# two keep their relative structure. Read press/DESIGN.md, not a copy of an
# older guide: docs/DESIGN_GUIDE.md is the extended rule set it defers to.
rm -rf "$REPO_ROOT/press"
mkdir -p "$REPO_ROOT/press/docs"
cp "$SRC/DESIGN.md" "$REPO_ROOT/press/DESIGN.md"
for f in DESIGN_GUIDE.md CONSOLIDATION.md WEBSITE_COMPONENTS.md APPLICATION_COMPONENTS.md \
         INTEGRATION.md MIGRATION.md GOVERNANCE.md; do
  cp "$SRC/docs/$f" "$REPO_ROOT/press/docs/$f"
done

# --- Manifest ----------------------------------------------------------------
# Version and commit alone cannot identify a working-tree snapshot, and the old
# timestamp file could not detect a modified mirror at all. Record a SHA-256 for
# every consumed file with its source path.
node "$SCRIPT_DIR/check-design-system.mjs" --write

echo "done. these are read-only copies — edit them in ../press and re-run this."
