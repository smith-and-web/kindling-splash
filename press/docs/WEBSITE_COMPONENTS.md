# Website components · Press 0.11.0

The website catalog extends the portable package. Open `../index.html#website-components`. Application controls, prose and feedback live separately at `../index.html#application-components`; further application expansion is deferred.

## Install and scope

Load `fonts-web.css` (WOFF2 for network delivery; `fonts.css` serves the same faces as TTF for a bundling application), `tokens.css`, `application.css` for operational controls, then opt-in `website.css`. Include `website.js` only for navigation, beat selection, platform selection or the local signup example. All specimen markup is shown in the reference's **Markup & usage** disclosures. The editable specimen source is `reference/website-snippets.json`.

```html
<link rel="stylesheet" href="./design-system/fonts-web.css">
<link rel="stylesheet" href="./design-system/tokens.css">
<link rel="stylesheet" href="./design-system/application.css">
<link rel="stylesheet" href="./design-system/website.css">
<script src="./design-system/website.js" defer></script>
<div class="press-web">
  <!-- a specimen's pw-* markup -->
</div>
```

Place `.press-web` outside the layout component, not on that same node. It establishes the light theme, type roles and named inline-size container. A page may use one outer wrapper; separately embedded specimens may each have their own wrapper. No `components.css` dependency, framework, build step or external service is required. `od-*` classes appearing in snippets are structural aids for the reference; corresponding `pw-*` classes supply consumer layout, so the examples do not require Open Design's layout sheet.

## Inventory and source map

| Pattern | Public classes / hooks | Read-only source |
| --- | --- | --- |
| Page scaffolding | `pw-frame`, `pw-band`, `pw-band--sunken`, `pw-header` | Open Design homepage integration; kindling-splash home band rhythm |
| Navigation | `pw-nav`, `pw-brand`, `pw-nav-links`, `data-pw-nav`, `data-pw-menu`, `data-pw-links` | kindling-splash `src/components/Navbar.astro`; redesign masthead |
| Editorial hero | `pw-hero`, `pw-hero-grid`, `pw-hero-grid--top`, `pw-hero-title`, `--pw-hero-measure`, `--pw-hero-columns`, `--pw-hero-gap`, `pw-button` | redesign hero; kindling-splash home |
| Writing demo | `pw-writing`, `pw-scene`, `pw-beats`, `data-pw-beats`, `data-pw-beat`, `data-pw-draft` | redesign scene/beat sample; website `WritingDemo.astro` context |
| Trust strip | `pw-trust`, `pw-trust--inline` | redesign full-width raised trust band |
| Section heading & quotation | `pw-section-head`, `pw-heading`, `pw-quote` | redesign aligned headings and plan-to-page section |
| Feature sequence | `pw-feature-grid`, `pw-feature`, `pw-feature--reverse`, `pw-problem`, `pw-image-frame` | redesign aligned feature refinements and four supplied images |
| Captioned specimen | `pw-figure`, `pw-caption` | kindling-splash home scene specimen |
| Release rows | `pw-release-grid`, `pw-release-item`, `pw-link` | redesign spotlight/release section |
| Platform choices | `pw-platforms`, `data-pw-platform`, `data-pw-platform-choice`, `data-pw-platform-result`; the choice itself is `ka-segment-track` / `ka-segment` | website `src/pages/download/index.astro` |
| Numbered procedure | `pw-steps`, `pw-step` | website download first-run sequence |
| Released-artifact identity | `pw-version` | website download hero and release panel |
| Signup | `pw-signup`, `pw-form-row`, `data-pw-signup`, `data-pw-error`, `data-pw-status` | website download signup pattern, adapted to local-only behavior |
| Disclosures | `pw-disclosure` with native `details` / `summary` | website download requirements/disclosures and FAQ content structure |
| Closing action | `pw-closing`, `pw-closing-actions` | redesign final download section |
| Footer | `pw-footer`, `pw-footer-top`, `pw-footer-links`, `pw-footer-bottom` | website `Footer.astro`; redesign compact footer |

Source working-tree hashes and copied-image records are in `WEBSITE_SOURCES.json`. The codebase and redesign are not changed by this package.

## Behavior contracts

### Controls

**The website layer styles one control: `.pw-button`, the prominent marketing
call to action.** Everything else a visitor operates — a feedback dialog's
submit, a form field, a checkbox, a copy or share action, a tab, a notice — is
the same role a writer meets inside the application and uses `application.css`:
`.ka-button`, `.ka-field`, `.ka-check`, `.ka-dialog`, `.ka-notice`. Loading both
sheets is expected; their selectors do not overlap.

The CTA is a documented larger size of the operational control and differs in
nothing else:

| | `.pw-button` (marketing CTA) | `.ka-button` (operational) |
| --- | --- | --- |
| Label | `--text-base` (16px) Inter 500 | `--text-ui` (15px) Inter 500 |
| Padding | 12px / 24px | 8px / 16px |
| Fill | `--color-accent-text` | `--color-accent-text` |
| Radius | 4px | 4px |
| Hover | inset 1px ring | inset 1px ring |
| Disabled | `--color-disabled-*` | `--color-disabled-*` |
| Target | `--control-target` | `--control-target` |

`.pw-button--secondary` matches `.ka-button--secondary` (sunken fill, hairline
border); `.pw-button--ghost` matches `.ka-button--ghost`. Use the secondary
treatment for a persistent header download so the in-content action keeps the
only primary fill in view. Never put both classes on one element and rely on the
cascade, and never redefine an accent token to correct a single button.

### Writing demo

`.pw-writing` is an editorial specimen: its prose reads at `--text-body-lg` on
the website's raised surface. Add **`.pw-writing--app`** whenever the sample
claims to show the writing workspace. The variant gives the scene column the
manuscript's own treatment — `--color-prose-*` paper and ink, `--text-body`
(17px) at `--leading-relaxed`, held to `--measure` — which are the values
NovelEditor uses, not a website approximation of them. Beat labels and metadata
stay Inter, as they are in the application.

### Navigation

Give the menu button `type="button"`, `aria-expanded="false"`, and `aria-controls` pointing to its own unique link-region ID. The script adds `data-pw-ready`. At container widths at or below 820px, enhanced navigation collapses behind the menu. Where container queries are unavailable the same collapse is repeated against the viewport under `@supports not (container-type: inline-size)`, so the menu still works rather than staying permanently expanded. Opening moves focus to the first link. Escape closes and returns focus to the button. Selecting a link, moving focus outside or clicking outside closes it. It is an in-flow disclosure, not a modal: it does not trap focus or lock body scrolling. Without JavaScript all links remain visible.

### Beats

Put a radio group and its matching prose regions inside `data-pw-beats`. Each radio has `data-pw-beat`, a unique ID, a group-specific `name`, and a `value` matching one panel's `data-pw-draft`. Give panels accessible names and set exactly one radio checked. The script shows the selected prose and hides the others. Native radio keyboard behavior is retained. Without JavaScript all prose remains readable. These are sample writing interactions, not an editable manuscript engine.

### Page scaffolding

`.pw-frame` centres content at `--page-frame` inside a `--pw-gutter` on each
side. The website layer has no access to `components.css`'s `.editorial`, so
without it a website-only consumer has to hand-write a frame.

`.pw-band` is a full-bleed row: it owns the raised surface and the top and
bottom hairlines. A `.pw-trust` placed directly inside drops its own border,
background and inline padding so the two do not double up. Put the band on the
full-width element and a `.pw-frame` inside it.

`.pw-header` is a real site masthead — sticky at `--z-sticky`, page background,
one bottom hairline. `.pw-nav` on its own is a standalone specimen carrying its
own gutter and rule, which fight a sticky full-bleed header; inside `.pw-header`
its bottom border and inline padding are removed. Combine `pw-nav pw-frame` on
the same element to hold the links to the frame.

```html
<header class="pw-header"><nav class="pw-nav pw-frame" data-pw-nav>…</nav></header>
<section class="pw-band"><ul class="pw-trust pw-frame">…</ul></section>
```

### Feature sequence

`.pw-feature-grid` resets the folio counter; it is not itself a grid. Each child
`.pw-feature` is one full-width row: a two-column spread of prose and figure,
centred against each other, separated from the previous row by a hairline at
`--space-3xl` and numbered `01`, `02`, … in the gutter. Add
`.pw-feature--reverse` to every second row so the figure alternates sides. The
first row drops its hairline but keeps room for its folio.

This is a hard rule from `DESIGN_GUIDE.md`, not a stylistic preference: a grid
of equal feature tiles produces ragged heights and dead space beside a text-only
entry. Keep bordered cards only where a card is semantically real. If you need a
tile matrix, build it locally — do not reintroduce one under a `pw-` class.

### Platform choices

Wrap radio choices and the result in `data-pw-platform`. Each radio has `data-pw-platform-choice` plus `data-pw-description`; changes update the descendant live result. The sample deliberately does not detect an OS or fetch releases. The button links to local installation guidance, not a binary download. A real site must provide its own reviewed platform URLs and current release metadata.

**The choice itself is `.ka-segment-track` / `.ka-segment` from `application.css`.** This layer styles one control, `.pw-button`, and a pick-one-of-three is not a marketing call to action — it is the same decision a writer makes with the app's view toggle, so it is the same control. `.pw-platform-option` was removed in 0.11.0; the pattern it sat inside — fieldset, legend, live result, explicit choice, no silent detection — is unchanged, as are the data hooks and `website.js`, which queries `input[type="radio"][data-pw-platform-choice]` and never a class.

A consumer may pre-select a radio from platform detection. It must not be what decides which build a visitor receives: the selected segment and the action it drives have to be correct and operable with JavaScript disabled.

### Numbered procedure

`.pw-steps` is an `<ol>`; each `.pw-step` is an `<li>` whose single child element is the row's second grid cell — `<li class="pw-step"><div><h3>…</h3><p>…</p></div></li>`. The folio is a `::before` counter in the first track, numbered `01`, `02`, … from its own counter, so a page may run a feature sequence and a procedure without the two sharing a number. The first step drops its hairline but keeps its folio.

Step prose is full ink at body size held to `--measure`. A step is an instruction the reader acts on; `--color-text-muted` is for `.pw-note`, an aside nobody has to act on. `components.css`'s `.steps-list` is the foundation's version of this role and is **not** the model — it numbers with terracotta-filled circles, which spends a section's whole accent budget on numbering.

### Released-artifact identity

`.pw-version` labels a published thing: `1.3.0`, `v2.0.0-rc1`. It is a label, not a control, so the touch-target contract does not apply to it. Do not reach for `.ka-badge` — a status chip promises something that can change while you are looking at it, and its accent variant would spend a terracotta moment on a number.

### Signup

The included `data-pw-signup` handler is **a local specimen, not a production mailing-list integration**. It validates required email input on blur and submit, reports an adjacent error, shows a brief progress state, and reports that the address was neither sent nor stored. No request, analytics event or localStorage write is made. Do not ship this handler as a claim of a real subscription.

Use `type="email"`, `required`, an explicit label, and `aria-describedby` linking to the error/helper. Each instance needs its own IDs. The snippet's submit button uses `formmethod="dialog"` to prevent fallback form navigation if the behavior is unavailable. Replace the sample handler and fallback policy deliberately when adding a real form service. Server-side validation, consent, abuse controls and failure handling belong to that separate integration.

### Initialization and cleanup

`window.KindlingWebsite.init(scope = document)` initializes matching descendants and the scope element itself. Repeated calls do not duplicate listeners. `destroy(scope)` detaches those listeners, clears a pending signup timer, restores all beat prose, and returns menu links to their unenhanced visible state. The classic script auto-initializes once; a CSS-aware bundler can import it for side effects. No named ESM exports are provided. Public classes/data hooks are the website API; see CHANGELOG.md for the 0.5.0 feature-sequence break.

## Visual mapping and deviations

- **Palette:** existing light raw palette is rebound to semantic colors only inside `.press-web`. Components consume those local semantics. Existing dark roots and application tokens are unchanged.
- **Typography:** the redesign's Inter marketing body treatment is an explicit website variant, implemented by `--pw-body: var(--font-ui)`. Fraunces is for headings; `--pw-reading: var(--font-body)` preserves Newsreader manuscript copy.
- **Text color:** ordinary reading content uses ink. Small accent copy uses `--color-accent-text`; the redesign's smaller terracotta text is mapped to this accessible role rather than copied as a failing color pair.
- **Scale:** existing body, label, small, hero and spacing tokens are reused. Namespaced `--pw-title` (32–48px) and `--pw-feature` (24–32px) allow the redesign hierarchy to respond to specimen/container width without altering canonical sizes.
- **Alignment:** shared heading columns and release action alignment adopt the redesign's latest refinements. Features are a **sequence**, not a grid, per the guide's hard rule: each `.pw-feature` is a full-width row divided from the next by a hairline and numbered with a print folio, alternating with `.pw-feature--reverse`. Narrow containers stack each row into one column.
- **Controls:** the layer styles the marketing CTA only. Before 0.10.0 it carried a full button system that disagreed with `application.css` on fill, label size, hover, disabled colours and secondary treatment; those are now shared and asserted by `npm run system:check`.
- **Images:** product figures use the guide's **mounted print** treatment — a 10px raised-surface mat, a hairline ring and `--shadow-md`, cropped `cover` at `max-height: 440px`. Opt into `.pw-image-frame` for a 4:3 `object-fit: contain` frame (`--pw-reference-ratio`) when a whole image must stay visible, such as a catalog specimen or a diagram; it letterboxes instead of cropping and is not the default. Intrinsic width/height attributes remain. The live catalog embeds the original PNG bytes, while copyable markup keeps portable asset paths.
- **Navigation:** the source's modal-like fixed mobile menu is adapted to an in-flow disclosure with the same clear open/close affordances. This avoids embedding viewport-fixed chrome in a catalog specimen.
- **Trust copy:** the catalog uses descriptive labels grounded in its writing-space content and identifies them as example copy, because catalog copy is illustrative. **Corrected in 0.12.0:** earlier revisions of this line described the consumer's writer-count claim as *unverified* and declined to promote it. That was wrong, and it caused the claim to be deleted from a live page more than once by people reading this file as an instruction. The figure is sourced from GitHub release analytics filtered to binary assets only, and is conservative. A consumer may state it. It measures download events rather than unique people, so whoever maintains it should record the value, the source and the date last checked alongside it.
- **Theme:** website specimens stay light, matching the existing website policy. The surrounding reference and Application section still support light/dark.
- **Icons and motion:** consistent outline arrows; small state feedback only, with reduced-motion support.

## Copying and integration

Copy a specimen including its `.press-web` wrapper. Prefix every ID and radio-group name when using multiple copies on one page. Match `aria-controls`, `aria-labelledby`, label `for` and `aria-describedby` to those new IDs. Move asset references with your public assets or resolve them through your bundler. Catalog anchors intentionally link to local specimens and documentation; replace them with actual site routes during consumer integration.

Keep only one principal action in a hero or closing composition. Preserve full-frame product images and useful alternative text. Content lengths are examples, not API-enforced limits; layout stays in flow and wraps. Long feature copy may make paired tracks taller. A full consumer page should use its own one-h1 heading hierarchy; the reference specimens use lower heading levels inside the catalog.

The original global component stylesheet remains unchanged. Do not attach both its generic classes and new `pw-*` styles to the same component unless you deliberately manage the cascade. Website CSS is not automatically imported by `design-system/index.css`.

## Maintaining the catalog

`reference/website-snippets.json` owns each website specimen's markup, description, usage rule and source mapping. Edit that file, then run `npm run reference:website` to rewrite only the marked Website catalog section in `index.html`. The resulting HTML remains the runnable entry. The source generator uses Node built-ins and reads package version metadata directly. Keep other reference sections outside the catalog markers. Do not hand-edit generated specimen HTML or its escaped code block separately; regenerate both together.

Reusable behavior lives in `design-system/website.js`; reusable styling in `design-system/website.css`; catalog-only presentation in `reference/website-catalog.css`. The original token generator and its two mirrors are unaffected.
