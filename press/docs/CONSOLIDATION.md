# One kindling system: Press

## Decision

The owner designated `press` as the definitive design system on 2026-09-14. Press owns the design contract, tokens, component implementations, original assets and generated handoffs. Open Design is a downstream working copy. The sibling `brand-assets` is retired input.

## Creative review

Both systems already share the strongest identity elements: the book-and-flame signature, warm paper and dark ink, terracotta, Fraunces headings and Newsreader reading. Press has the more complete implementation: local fonts, scoped website patterns, working Svelte controls and a paper-based rich editor. A new palette or logo would discard continuity without solving the actual conflict.

The legacy style guide is also stale as a visual specification: its displayed success swatch says `#3E7C5A`, while both token sources use `#356B4D`. Its typography prohibitions conflict with the approved Inter website-copy variant. Its centered introductory prose and muted reading copy conflict with its own editorial rules. These examples are historical reference, not patterns to copy.

The chosen direction is a literary identity with practical interface typography. Preserve the legacy identity and editorial devices; retain Press’s newer website and application architecture. Make each surface's role explicit within one system.

## Resolved conflicts

| Concern | Decision |
| --- | --- |
| Editing authority | `press/DESIGN.md` for design decisions; `press/design-system/tokens.css` for values. Stop editing or syncing from `brand-assets`. |
| Brand vs system name | kindling is the product identity. Press names the system; it does not need a separate logo. |
| Artwork | All 45 legacy production files were retained at consolidation. The owner subsequently approved lowercase kindling: wordmarks, lockups, related rasters and text metadata are regenerated; source geometry, font and icon artwork remain. Original and current digests are in CONSOLIDATION_ASSETS.json. |
| Type | Fraunces headings; Newsreader manuscripts and editorial reading; Inter controls and scoped website product copy. |
| Palette | Keep all current semantic values, both themes and stable tag colors. Ember belongs inside the flame. |
| Target size | Preserve Press’s newer `--control-target:44px`; make website/application aliases read it. |
| Editorial layout | Keep grain, mounted prints, folios, running labels, aligned heads, trust bands, accent rules and pull-quotes. |
| App state | Dense layouts, multiple selection/focus signals and true status colors are valid. Marketing accent-count and page-composition rules do not govern workspace state. |
| Screenshots | Preserve full content frames; retain Open Design’s corrected `.pw-image-frame` height/shadow resets. Deliberate detail captures are allowed. |
| Narrow layouts | Correct responsive selector specificity so the writing demo and other columns actually stack, and gutters reduce. |
| Buttons | Bring Open Design’s label wrapping and contrast-preserving hover treatment into the maintained CSS. |
| Icon stroke | Website: 16px/1px stroke. App default: 20px/1.75px stroke on 24px viewBox. Retire the blanket 1px rule. |
| Motion | Foundation/website 100ms/200ms, application 160ms; reduced motion in all surfaces. |
| Open Design memory | Reading and UI are separate roles. Replace the saved instruction that assigned Newsreader to both. |

## What changed in 0.9.0

- Consolidated the current guide, governance, migration instructions, portable skill and catalog copy around one editing authority.
- Added the original asset maintenance instructions and a light/dark identity reference at `preview/brand-assets.html`.
- Regenerated Open Design tokens, font entry, previews, component manifest and bundles; the root token copies had missed Press’s newer 44px token.
- Added `npm run system:check` to check generated token copies, reference versions, manifest targets and original asset integrity.
- Retained the original legacy folder as historical input with retirement notices. Consumer application and website imports still need their own migration; this change does not alter their releases.

## Ongoing workflow

1. Make shared edits in Press. If an improvement starts in Open Design, port it here first.
2. Run `npm run tokens:generate`, rebuild affected references and `npm run open-design:build`.
3. Run `npm run system:check` and inspect affected surfaces in both themes and at narrow widths.
4. Sync the existing Open Design system and project; verify the files and saved typography guidance. See [OPEN_DESIGN.md](OPEN_DESIGN.md).
5. Release a pinned package to consumers; never revive a sibling-folder sync.

The `BASELINE_*` records and earlier changelog sections remain historical evidence. They describe previous deliveries and do not override this decision.

## Validation

See [CONSOLIDATION_VALIDATION.md](CONSOLIDATION_VALIDATION.md) for the completed source, browser and runtime checks.
