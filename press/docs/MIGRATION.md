# Migrating to the unified Press system

## Authority resolved in 0.9.0

Press is now the sole editing authority. Do not run a sync from `brand-assets`. Original logos, rasters, fonts and source geometry are already preserved in `press/assets`; shared tokens retain their existing names and values. The approved typography split is Fraunces headings, Newsreader reading/manuscripts and Inter UI plus scoped website product copy. See [CONSOLIDATION.md](CONSOLIDATION.md).

0.9.0 brings the Open Design button wrapping, contrast-preserving hover and full-frame screenshot fixes into the package. Long button labels may now wrap; reversed feature figures return to natural order on narrow screens. Review those states when upgrading. No tokens or selectors are removed.

## Historical starting point (0.1.0)

The source guide says `brand-assets/design-system/` syncs one-way into `kindling-splash/src/styles/` through `npm run sync:design-system`. This task did not inspect or modify that consumer, run its sync, or edit the separate homepage prototype. Consumer-specific file lists and overrides still need inventory in those repositories.

## Adoption sequence

1. Adopt this package source into the chosen maintainer repository through a reviewed change. Preserve the working-tree provenance; do not mistake the recorded HEAD for a commit containing all bundled input changes.
2. Inventory each consumer's synced files, import sites, font loading, theme selection and local overrides. Compare local edits with canonical CSS before deleting anything.
3. Build a local archive with `npm pack`. Store the archive within each consumer's `vendor/` directory or an existing approved internal artifact store, and install the exact version. Do not use a sibling-path dependency or symlink.
4. Replace CSS imports in order: fonts, tokens, optional components. Start with tokens-only where the existing global reset would be disruptive. Replace remote font CSS and logo paths with package assets.
5. Map existing light/dark selection to the root data attribute. Leave website/docs light-only unless their policy is explicitly changed. Preserve the desktop paper sheet and stable tag values.
6. Once imports have moved, remove the old sync command and stale copied styles in that consumer's reviewed change. Do not run the old sync after migration.
7. Commit the consumer's exact dependency and lockfile together. Record its first package version and retain the previous styles or release for rollback.

There must be one editing authority after adoption: package source. Consumer adaptations stay local only when genuinely surface-specific; shared changes return to the package and ship as a new version.

## Historical discrepancies at 0.1.0 (resolved direction above)

| Context | Canonical baseline | Treatment in 0.1.0 |
| --- | --- | --- |
| Homepage body copy | Newsreader for reading; Inter for operated UI | User describes Inter body/UI in a separate prototype. Record as a consumer exception requiring an explicit typography decision; do not change `--font-body`. |
| Heading and manuscript fonts | Fraunces titles, Newsreader prose | Consistent with the described prototype. Retained. |
| Section alignment and restraint | Asymmetric columns, shared rhythm, sparse terracotta | Compatible refinements; apply to the reference without adding competing tokens. |
| Body default | Components set `body` to Inter; prose classes set Newsreader | Global default is a functional fallback, not permission to set reading prose in Inter. Document explicitly. |
| Website theme | Website/docs light-only; desktop supports dark | Reference offers both palettes to demonstrate the API, not to change consumer policy. |
| Font delivery | Existing reference uses Google Fonts; only Fraunces local | All required font roles now local with notices. |
| Python dependencies | Source documentation says pinned; file is unpinned | Record the mismatch, list Pillow explicitly, require a reviewed maintenance environment. |
| Component dimensions | Some existing sizes and layout constants are literals | Preserve stylesheet compatibility; a broad tokenization refactor is outside this packaging release. |
| Figure cropping | Existing `.feature-figure img` is a decorative crop treatment | Use full-frame images for content-bearing artwork in the reference; no global selector change. |
| Fraunces notices | Embedded copyright 2020, current upstream notice 2018 | Retain both notices and disclose their provenance; do not replace the original font. |

The Press paper palette, smaller metadata sizes, 36rem reading measure and named pull-quote treatment remain brand choices. The generic reference baseline does not override them.

## 0.1.0 → 0.2.0

No canonical tokens, JSON keys, existing exports or original shared component selectors are removed or changed. Pin 0.2.0 and keep your existing imports to retain the old foundation. Add `website.css` and, where needed, `website.js` only to opted-in website surfaces.

The new `pw-*` classes intentionally differ from the linked site's generic `.navbar`, `.feature-row`, `.spotlight-item` and `.cta-section` selectors. Migrate one region at a time using the component mapping; do not globally rename selectors or load competing old and new behavior on the same node.

The approved website variant uses Inter for marketing copy inside `.press-web` and Newsreader for `.pw-prose`. It does not redefine `--font-body`. Existing consumers using the canonical prose rule remain unchanged. The current reference's application content has moved under `#application-components`; the original `#components` anchor remains as an entry immediately before the component catalogs.

The linked website and redesign were inspected as working-tree references. Neither consumer was migrated or edited during this expansion. The actual app release number and user-count claim in the redesign were not adopted as fresh facts in reusable specimens.
