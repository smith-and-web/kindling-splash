# Press design guide

Press in this repository is the definitive kindling system. Read [DESIGN.md](../DESIGN.md) for the complete contract and [the consolidation decisions](CONSOLIDATION.md) for how the legacy material was resolved. Historical wording is preserved in [BASELINE_DESIGN_GUIDE.md](BASELINE_DESIGN_GUIDE.md); it does not govern new work.

## Creative direction

A writing desk translated into an interface: warm paper, dark ink, expressive titles and tools that leave room for a sentence. The flame gives kindling recognition; typography gives it character. Keep the original artwork, restrained terracotta, paper grain and the distinction between manuscript and controls.

### Three type roles

Fraunces titles; Newsreader reading and manuscript prose; Inter controls, navigation and website product copy. `.press-web` is the explicit product-copy variant. Long editorial articles still use Newsreader. Never use Newsreader for UI controls or silently redefine `--font-body` to Inter. Preserve local font files and fallback stacks.

### Color and state

Use semantic variables from `design-system/tokens.css`. Dark application chrome uses the canonical dark palette; the manuscript stays light through `--color-prose-*`. Website and documentation surfaces remain light. Use `--color-accent-text` for small links. Inner-flame ember belongs to the artwork. Success, warning, error and info describe genuine application state with a label or icon; green is not ambient brand decoration. Stable `--tag-*` values store user choices; `--color-tag-*` renders them in the current theme.

### Editorial composition

- Use the 1120px frame, 32px default gutter and 36rem reading measure. Keep reading prose left-aligned and in full ink.
- One dominant display heading per page. A persistent header action is secondary when the page's main invitation is visible.
- At most two deliberate terracotta moments in an editorial viewport, excluding inline links and original brand artwork. Application state has no numeric accent budget, including inside an interactive `.press-app` workspace embedded in an editorial page; decoration and calls to action inside that workspace still count against the page.
- Prefer figure-and-prose sequences to repeated decorative card grids. Bands span the available surface; cards group actual content.
- Use 80px editorial bands and 120–140px opening space when appropriate; reduce gutters before shrinking type on narrow screens.

### Named devices

| Device | Use |
| --- | --- |
| Paper grain | Token-driven stock texture behind content; never over text |
| Mounted print | Raised mat, hairline and restrained shadow around a meaningful figure |
| Print folio | Quiet sequence number aligned with the reading edge |
| Running section label | Muted Inter kicker numbering major sections |
| Aligned section head | `.section-lead--aligned` or `.pw-section-head`; shared label and heading columns |
| Trust band | Short factual statements between full-width hairlines; no shadow or rounded card |
| Shared action edge | `.spotlight-action`; trailing links align across items |
| Accent rule | One short terracotta rule per section at most |
| Pull-quote | Italic Newsreader with a terracotta left rule and raised paper |

Use the existing scoped classes for the chosen surface; these devices do not require loading both foundation and website styles. Shadows belong to mounted prints, closing action panels and floating layers. In-flow groups use hairlines. Full-frame product screenshots use `.pw-image-frame`; a detail capture must be authored intentionally and retain the context needed to understand it.

### Application composition

The app is denser and stateful. Use the supplied Svelte controls and the `--z-*` stacking scale; keep stores, persistence and file operations in the consumer. Menus, dialogs and other floating layers use overlay tokens. Inputs have distinct normal, hover, focus, invalid and disabled states. Disabled tokens replace opacity. Standalone controls target 44px in both dimensions; inline links are exempt. This target is a requirement for adoption, not a claim that every inherited control has passed a size audit.

The manuscript is a light paper sheet in both themes. Newsreader prose uses the 36rem measure. Rich editing uses NovelEditor; ManuscriptSurface is read-only, and a Field textarea serves plain notes. Keep mounted editor state when preserving selection and undo history matters.

### Interaction and imagery

Use real product screenshots and supplied logos. Keep intrinsic proportions. Use reversed artwork on dark surfaces and the flame below emblem size. See [the asset guide](../assets/README.md).

Website outline icons use 16px/1px stroke; application icons default to 20px/1.75px stroke. Preserve Lucide geometry and accessible control names. Foundation motion is 100/200ms and application motion is 160ms; respect reduced motion. Hover preserves contrast and focus stays visible. Avoid gradients, glow, emoji controls, per-character typing and looping promotional animation. The one exception — the home-page workspace tour — and the terms it must keep are in `DESIGN.md`, under *Interaction, motion and accessibility*.

## Implementation and maintenance

Edit tokens only in `design-system/tokens.css`. Use [website APIs](WEBSITE_COMPONENTS.md), [application APIs](APPLICATION_COMPONENTS.md) and [integration guidance](INTEGRATION.md). New shared patterns return here. Rebuild generated entries, run `npm run system:check`, and synchronize the existing Open Design system using [the handoff instructions](OPEN_DESIGN.md). Never sync from the retired sibling folder.
