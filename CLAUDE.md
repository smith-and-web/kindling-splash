# kindling-splash

The Kindling marketing + docs site. Astro, static, deployed to GitHub Pages at
**kindlingwriter.com**.

---
## Read `press/DESIGN.md` before writing any markup or CSS

`press/DESIGN.md` is the Press design contract: the surfaces, the type roles,
the palette, the control language, the brand rules and the anti-patterns.
**It is authoritative.** If anything here disagrees with it, the contract wins.
`press/docs/DESIGN_GUIDE.md` is the extended rule set it defers to, including
the numbered hard rules and the banlist.

Both are read-only mirrors — see *Design system sync* below. The old root
`DESIGN_GUIDE.md` was a copy of one supporting document; it is gone, because the
contract's own links (`docs/CONSOLIDATION.md`, `docs/WEBSITE_COMPONENTS.md`)
could not resolve beside it.

### The rules broken most often

Restated here because these are the ones that get violated by reflex, not the
full set:

- Reading prose is capped at `--measure` (36rem ≈ 68ch) and set in
  `--color-text`, never `--color-text-muted`.
- **Never centre a paragraph longer than one line.** Centring is for one-line
  ceremonial moments only.
- Terracotta appears **at most twice per viewport** on an editorial page. Not an
  eyebrow on every card. Application selection and status are exempt.
- No raw hex, no raw px font sizes. Everything resolves to a token.
- Shadow only on a mounted-print figure, the closing CTA panel, or a floating
  overlay. Otherwise hairlines.
- Sequence, not grid: `.pw-feature-grid` over card matrices.
- No emoji as icons. No gradients or glows. No typewriter effects. No autoplay
  looping product video.
  **One recorded exception:** the home-page demo's workspace tour
  (`src/scripts/writing-demo.ts`), whose terms are in `press/DESIGN.md` under
  *Interaction, motion and accessibility*. It is not a precedent — nothing else
  on the site may autoplay or loop by pointing to it.
- Fraunces for headings, Newsreader for reading, Inter for controls and website
  product copy. Never a system sans.

### One implementation per control role

This is the rule the 0.10.0 adoption existed to fix, and it is the easiest one
to undo by accident.

- **Operational controls come from `application.css`** — `.ka-button`,
  `.ka-field`, `.ka-check`, `.ka-segment`, `.ka-tablist`, `.ka-notice`,
  `.ka-dialog`. A feedback dialog's submit, a form field, a copy or share
  action, a toggle: these are the same controls a writer operates inside
  kindling, and the site uses the same implementation.
- **`.pw-button` is the marketing call to action, and nothing else.** It is a
  documented larger size of `.ka-button` (16px label, 12/24px padding) and
  differs in nothing else.
- **Never write a fifth one.** Before this pass the site carried its own button
  in `.download-btn`, its own field in `.form-group`, its own dialog in
  `.fw-dialog`, its own tabs in `.feedback-tabs` and its own status colours in
  two places. If a page needs a control, reach for the `.ka-*` class; if the
  role is missing, add it in `../press`.
- Never stack `.pw-button` and `.ka-button` on one element and let the cascade
  decide, and never redefine an accent token to correct a single button.

**The test:** if a page could be dropped onto another product's site without
looking out of place, it isn't Press yet. And if a visitor moving from the site
into the app meets a different button, it isn't finished.

## Architecture

- **Astro 6**, static output, `trailingSlash: 'always'`, `site: https://kindlingwriter.com`.
- **Starlight** mounted for `/docs` (sidebar configured in `astro.config.mjs`).
- **Svelte** for the single interactive island: `SmartDownloadButton` (OS detection).
  There is no other client-side framework use — keep it that way.
- **GA4** via `src/components/Analytics.astro` and a Starlight `head` entry.
- **Sitemap** via `@astrojs/sitemap`.
- Deploy: `.github/workflows/deploy.yml`, `withastro/action@v6`, on push to `main`.
  Full-history checkout, because sitemap `<lastmod>` is each page's last commit
  date (`astro.config.mjs`). After each deploy it submits changed URLs to
  IndexNow (`scripts/indexnow.mjs`; key file `public/adada06e….txt`).
- **`/llms.txt` and `/llms-full.txt` are generated** from `src/data/llms.ts`
  (endpoints in `src/pages/`). Docs and blog listings come from the
  collections; version and sizes from `src/data/downloads.ts`. Never recreate
  them in `public/`. The hand-kept copies drifted to v1.1 with wrong prices and
  privacy claims. `test:launch` fails if a sitemap URL is missing from
  `llms.txt` or a listed URL doesn't resolve.
- **Two classic scripts are inlined at the top of `<head>`** in
  `MarketingLayout.astro`, so the first frame is laid out for the visitor's
  device:
  - `src/scripts/platform-detect.js`, the one platform detection, records
    `data-device` and `data-os` on `<html>`. `detectPlatform()` in
    `platform.ts` only reads them. `/download/` shows its mobile notice from
    CSS on `data-device`, and pre-selects the OS in an inline script right after
    the fieldset.
  - Press's `website-early.js` sets `data-pw-js`, so the mobile nav is collapsed
    before paint, and keeps the Menu button working until `website.js` binds.

  Before these, a late page bundle revealed the notice and collapsed the nav
  after paint: CLS 0.268 on `/download/`. `test:launch` fails over 0.05 with
  slowed scripts and fonts. Don't move either script into a module or the
  page bundle.
- **Structured data comes from `src/data/schema.ts`.** Pages pass only their
  own description (and `/features/` its feature list) to
  `softwareApplication()`; the home page adds `organization()` and `website()`;
  blog posts get `BlogPosting` plus a breadcrumb; docs get `TechArticle` plus a
  breadcrumb through the Starlight `Head` override
  (`src/components/docs/Head.astro`). Don't hand-write a `SoftwareApplication`
  on a page again. The copies drifted. `test:launch` validates every page's
  JSON-LD.
- Download sizes live in `src/data/downloads.ts` alone. Re-measure them from the
  release assets (`gh release view`) when a release changes the bundle.

```bash
npm run dev                  # local dev
npm run build                # static build to dist/
npm run preview              # serve the built output
npm run sync:design-system   # re-vendor Press from ../press
npm run check:design-system  # verify the vendored copies (no ../press needed)
npm run test:launch          # build + behaviour checks
npm run test:design          # build + visual-contract checks in a browser
npm run shots                # regenerate product screenshots from the app
```

### Product screenshots — `npm run shots`

`scripts/capture-screenshots.mjs` regenerates all twenty-eight product screenshots
from the running Kindling desktop app — seven marketing figures in `src/assets/`
and twenty-one docs figures in `public/docs/`. The v1.3 targets include unified
Settings areas, keyboard shortcuts, start-screen actions, Writing statistics,
Previously, editorial review, and reference copying. Settings targets select the
area in the window's sidebar without changing its values.

```bash
npm run shots -- --dry-run             # inspect HiDPI selection; no display/app changes
npm run shots                          # all targets, optimise, install, then `npm run build`
npm run shots -- --only beat-with-prose  # one target
npm run shots -- --keep                # write to the work dir, don't touch the repo
```

**Prerequisites:** Kindling running in dev with the demo fixture loaded, and
`brew install cliclick imagemagick oxipng`. `cliclick` needs Accessibility
permission — without it the ⌘K palette shots fail. Set the fixture up per
`../kindling/qa/demo/README.md`:

```bash
cd ../kindling
KINDLING_DATA_DIR="$(mktemp -d /tmp/kindling-demo.XXXXXX)" npm run tauri dev
# click "Sample Project", then in the app console:
#   await window.__KINDLING_TEST__.invoke("create_demo_fixture")
```

`create_demo_fixture` is debug-only and adds the screenplay and source-backed
projects that the `sync-preview` target needs. It mints new project ids on every
call, so the outline's `demo-outline-<uuid>.md` path changes each time — the
script looks it up rather than hardcoding it.

**Leave the machine alone during the capture pass.** It steals window focus and
moves the pointer, because `screencapture -R` grabs a screen rect rather than a
window. It also leaves the Kindling window resized.

It drives the app over the Tauri MCP plugin's unix socket (`/tmp/kindling-mcp.sock`,
newline-delimited JSON) and takes the picture with macOS `screencapture -R`, which
is lossless PNG at 2× on a retina display. The plugin's own `take_screenshot` is
deliberately unused — it writes lossy JPEG and has returned stale frames.

`npm run shots` now uses `scripts/capture-hidpi.sh` to select a temporary 2×
HiDPI mode on the main display, preserving its physical resolution and refresh
rate. It restores the original mode on completion, failure, or interruption.
Xcode Command Line Tools are required to compile the CoreGraphics helper.
Every capture must contain at least two pixels per screen point; do not upscale
1× images to pass. Keep Kindling on the main display.

See [the screenshot process](scripts/SCREENSHOTS.md) for the 3840×2160 →
1920×1080-at-2× example, mode selection, and force-quit recovery instructions.

**Why the aspect ratios in the script matter.** Every figure slot is
`width:100%; height:auto` with a `max-height` and `object-fit: cover`, so the
*source ratio alone* decides whether the bottom of a shot is silently discarded.

Since Press 0.7.1 the cap is **released below 768px**, where rows stack and there
is no adjacent column left to balance against — it was cropping 127px off three
of four screenshots there. The ratios below therefore bind at two-column widths
only; don't assume a shot that clears them is safe when stacked, or vice versa:

- `.hero-figure img` → needs ratio **≥ 0.85** (477px slot, 560px max-height)
- `.feature-figure img` in a `.feature-seq` → needs ratio **≥ 1.204** (530px slot)
- `.feature-figure img` inside a `.content-section` → needs ratio **≥ 1.94**, because
  that column is 852px wide against the same 440px max-height. This is why
  `planning-states.png` is 1.95 and not 1.25: one wide asset clears both slots.
  `/story-outlining-software` has no scoped styles, so supplying the right ratio
  is the fix — not overriding the figure CSS.

Each target carries its `minAspect` and a `minWidthPx`, and the run fails rather
than installing a shot that would crop or render soft. It also asserts mean
luminance: `screencapture -R` grabs a screen *rect*, not a window, so anything
overlapping it (your terminal) lands in the PNG — the check catches that.

To change what a screenshot shows, edit its entry in the `TARGETS` array; the
capture rect is derived from a measured DOM element, not hardcoded.

Three app behaviours the script has to work around, all commented in place:

- **Never dismiss suggestions.** `dismiss_suggestion` writes to the database, so
  dismissing the smart-detection block permanently strips it from the fixture and
  breaks the `reference-suggestions` shot on every later run. Collapse the
  "Suggested N" header instead.
- **Chapters are an accordion** — opening one closes the others, so there is no
  "expand all". `selectScene` opens the chapter its scene lives in.
- **Short labels repeat across the app.** "Tags" exists both in Project Settings
  and in the scene panel behind it, so text lookups inside a dialog are scoped to
  `.app-dialog-surface`. Control lookups use a real `elementFromPoint` hit test,
  because the app keeps both "Collapse sidebar" and "Expand sidebar" in the DOM.

### Layout

```
src/pages/          route-per-directory .astro pages
src/layouts/        MarketingLayout.astro — head, meta, OG, JSON-LD, .press-web boundary
src/components/     Navbar, Footer, Analytics, FeedbackWidget, WritingDemo,
                    ProductFigure, SmartDownloadButton.svelte
src/content/        blog/ (markdown) + docs/ (Starlight)
src/vendor/press/   VENDORED PRESS — design-system/, assets/, licenses/, MANIFEST.json
src/styles/         global.css (Press imports + site adapters),
                    starlight-overrides.css (Starlight -> Press adapter),
                    animations.css (site-only)
src/data/           downloads.ts — version + platform download metadata
press/              VENDORED — DESIGN.md and the supporting docs it links to
scripts/            sync + check-design-system, check-launch, check-design,
                    capture-screenshots
```

---
## Docs live in two places and have diverged

The site's docs (`src/content/docs/docs/`) and the app repo's (`../kindling/docs/`)
are **separate, hand-maintained copies with no sync script**, and they have drifted
in both directions:

- The app repo had the entire authored **novelWriter** section while the site had
  no mention of the format at all. It was ported here on 6 Sep 2026.
- The site has a `## Scrivener (.scriv)` import section the app repo lacks, and its
  `references.md`, `scene-workflow.md` and `settings.md` are all substantially
  longer.

**Before writing new docs copy, check `../kindling/docs/` for an authored version**
— porting beats inventing, and the app repo is where feature work lands first.
`prds/*.implementation.md` in that repo also points at doc anchors it expects to
exist (novelWriter's notes link
`docs/importing-projects.md#novelwriter-project-folder`), so keep those headings
stable.

For behaviour documented in neither copy, read the Rust command rather than a PRD
narrative. Find and replace, for instance: the searchable set is defined once in
`documents()` in `src-tauri/src/commands/search.rs` — Fixed planning status only,
the active editor representation only, `locked` inherited from the chapter.

---
## Design system sync

Everything under **`src/vendor/press/`**, **`public/brand/`**, the root favicon
family, `public/og-image.png`, `public/site.webmanifest` and the root **`press/`**
directory is a read-only snapshot of **`../press`** — the
`@kindling/design-system` package (smith-and-web/press).

```bash
npm run sync:design-system     # re-copy from ../press and rewrite the manifest
npm run check:design-system    # verify the committed copies against it
```

- **Never hand-edit a copy.** Change it in `../press` and re-sync.
  `npm run check:design-system` fails the build if a copy's SHA-256 moved, and
  it runs first in `npm run test:launch`. It needs nothing but this repository —
  no `../press` checkout, no network — so CI can prove the committed files are
  the ones that were synced.
- **`src/vendor/press/MANIFEST.json`** records the package version, the source
  commit, whether that working tree was dirty, a SHA-256 and source path for
  every consumed file, and every intentional exclusion with its reason. A
  version label alone cannot identify a snapshot taken from a dirty tree; when
  `snapshot` reads `working-tree`, the hashes are the only identity it has.
  Re-sync from a committed Press release before shipping a build you might need
  to roll back.
- **The layout is load-bearing.** `fonts-web.css` resolves
  `../assets/fonts/web/` relative to itself, so `design-system/` and `assets/`
  must stay siblings under `src/vendor/press/`.
- We vendor the consumed subset rather than installing Press's packed tarball.
  `npm pack` produces ~33MB because `reference/` carries 31MB of QA baseline
  images no CSS consumer reads. This is a deliberate deviation from step 3 of
  `../press/docs/MIGRATION.md`, recorded in the sync script and the manifest.
- **`brand-assets` is retired as the authority** (14 Sep 2026). Do not sync from
  it again.
- Site-only styling goes in `src/styles/global.css` (adapters) or a page-scoped
  `<style>` block. Nothing there may redefine a palette value, a font family or
  a control's appearance.
- If you find yourself overriding a design-system rule, that is the signal the
  design system is wrong. Fix it upstream and re-sync — do not patch it here.

### Fonts

**Press owns the font files and their `@font-face` declarations.** The site
serves `src/vendor/press/design-system/fonts-web.css` and nothing else; there is
exactly one authority per family name, and `npm run test:design` asserts the
count: five faces, each split into a Latin and a Rest file by `unicode-range`,
ten rules in all. They are produced by Press's own `npm run fonts:build` from
its canonical variable TTFs (Press 0.14.0):

- **Website weight contract.** Fraunces 500–600; Newsreader and Inter 400–700,
  roman and italic. The web files are instanced to those ranges, so a weight
  outside them is clamped or synthesized, never rendered. `npm run test:design`
  fails any rendered text outside the contract. It caught the 404 numeral at
  Fraunces 700. A page that needs another weight changes the contract in
  `../press` first.
- **Latin and Rest files.** Every glyph ships; a page downloads Rest only if it
  sets a character outside Latin. The Latin set includes arrows and keyboard
  keys, because one "→" or Starlight's "⌘" hint would otherwise pull a Rest
  file. Preload the `-Latin` files, never `-Rest`.

This is what took mobile lab LCP down 2–3 s on every template (24 Sep 2026):
blocking the web fonts entirely had taken it from 5–7 s to 1.5 s.

The previous `npm run sync:fonts` step, which vendored narrower latin subsets
from `@fontsource-variable/*` under the same family names, is **retired**. The
Fontsource packages are uninstalled. Do not reintroduce a second set of
declarations; if the site needs a subset, add the subsetting step in `../press`
so every consumer gets the same files.

Preloads are resolved through the bundler (`?url` imports in
`MarketingLayout.astro`), because the emitted filenames are content-hashed. A
literal `/fonts/...` path would preload nothing and cost a round trip;
`npm run test:design` asserts each preload is a file a `@font-face` actually
uses.

### Astro scoped styles have zero specificity

Astro compiles a component `<style>` selector to `.foo:where(.astro-xxxx)`, and
`:where()` adds nothing. A bare `.fw-dialog` therefore only *ties* with the
`.ka-dialog` rule it means to adjust, and loses on source order. Qualify with
the element name — `dialog.fw-dialog`, `button.fw-submit` — when a scoped rule
has to win against a shared class. This cost an hour once; it will again.

### One content edge per page

Editorial pages are framed by `--page-frame-editorial` (960px): `.page-hero`,
`.content-section`, its full-bleed `.alt` band and any page-local list frame all
start their content in the same place. Composed pages (`/`, `/features/`) use
`.pw-frame` at `--page-frame` (1120px), which the navbar and footer share.

Do not write a frame width by hand. Three separate bugs came from exactly that:
`.page-hero` at 960 against `.content-section` at 900; `.content-section.alt`
re-centring on a hard-coded `852px` derived from the old 900; and the blog list
on the wider marketing frame, which put three left edges on one page.
`npm run test:design` fails if a page has more than one content edge.

### Section headings

Two forms, and they are not interchangeable.

**A section lead** — a heading that introduces full-width content below it (the
homepage's bands, `/features/`'s sequences) — uses `SectionLead.astro`, which
composes Press's `.pw-section-head`: an optional running label in the narrow
track, the heading and its stand-first in the wide one. Use the component, not
hand-written `.pw-section-head` markup: it is a two-track grid, and composed by
hand the stand-first escapes the heading block. `npm run test:design` fails if a
heading ever lands in the label's track.

**A reading-page heading** — `/open-source/`, `/compare/`, the comparison
landing pages — stays full width in its `.content-section`, with the running
label as a plain `.pw-label` directly above it. Do **not** give these the
two-track head: their section *is* the prose, so aligning it strands the whole
section in the right column under an empty one. This was tried and reverted.

**Running labels** (`04 / Scrivener`) number from `02` — the page opener is `01`
and carries none, as on the homepage — and closing CTA panels stay unlabelled.
A label orients the reader in the page's structure. It never restates the
heading beneath it and never makes a claim the page does not already make.
`/faq/` has none: its headings are questions in a list, not sections. Nor do the
legal pages, which are documents.

### The `.press-web` boundary

`MarketingLayout.astro` wraps the header, `<main>` and the footer in a single
`.press-web` element. That boundary is what makes every `pw-*` class live: it
establishes the light theme, rebinds the semantic `--color-*` names, sets Inter
as website product copy through `--pw-body`, and names the inline-size container
every responsive `pw-*` rule queries.

**It cannot go on `<body>` or `<main>`.** `container-type: inline-size` applies
layout containment, which would make the element the containing block for
`position: fixed` descendants and trap the paper grain `body::before` paints
behind the page. `FeedbackWidget` is deliberately *outside* it for the same
reason — it is floating chrome, and it draws its dialog, fields and buttons from
`application.css`, which is not scoped to the boundary.

Inside it, both layers are available and both are Press:

- **`website.css` (`pw-*`)** is the product-website layer: `.pw-frame`,
  `.pw-header`, `.pw-nav`, `.pw-band`, `.pw-hero-grid`, `.pw-section-head`,
  `.pw-feature-grid`, `.pw-release-grid`, `.pw-disclosure`, `.pw-closing`,
  `.pw-footer`, `.pw-image-frame`. Inter product copy. **Prefer these.**
- **`components.css`** is the editorial foundation: the page reset, the paper
  grain, `.page-hero`, `.content-section`, `.callout`, `.editorial`. Newsreader
  reading copy. Still used by the long reading pages (`/faq/`, `/compare/`,
  `/privacy/`, `/terms/`, the comparison landing pages), which are editorial
  surfaces rather than product-website ones.

The two agree on palette, spacing and control language; they differ on reading
type by surface, which is the contract's own distinction. What is **not**
acceptable is one page using `.feature-seq` and another `.pw-feature-grid` for
the same job — that was the state before this pass, and the two rendered the
same pattern in different fonts. `/`, `/features/` and `/story-outlining-software/`
all use the website sequence now.

`src/scripts/press-website.js` is gone; the disclosure controller is imported
straight from the vendored `website.js` by `Navbar.astro`. Press's
`data-pw-signup` and `data-pw-platform` handlers are explicit local demos —
the real `SmartDownloadButton` and the real feedback service beat both. Do not
ship either.

### Screenshots and figures

Product figures use `ProductFigure.astro`, which puts the capture in
`.pw-image-frame` with `--pw-reference-ratio` set from the image's own intrinsic
dimensions. The frame contains rather than crops, and matching the ratio to the
image means no crop and no letterbox at any width.

**The `minAspect` contract in `scripts/capture-screenshots.mjs` no longer binds
the marketing figures.** It existed because `.feature-figure img` was
`object-fit: cover` at `max-height: 440px`, which made the capture's aspect ratio
decide how much of the interface a visitor saw — and once cut 127px off three of
four figures at stacked widths. A figure that cannot crop needs no ratio
contract. The script's ratio assertions are harmless and still catch a soft or
mis-framed capture, so they stay; just do not treat a ratio as a layout
requirement any more. `npm run test:design` asserts that no product figure
renders with `object-fit: cover` and that every one keeps its intrinsic
proportions.

Docs figures keep their full frame too — see the `.sl-markdown-content img` rule
in `src/styles/starlight-overrides.css`.

## Starlight

`src/styles/starlight-overrides.css` is an **adapter and nothing else**. It
imports the vendored fonts and tokens (Starlight does not load `global.css`),
maps every `--sl-*` colour Starlight uses onto a Press semantic role, and
assigns type by role: Fraunces for the page title and prose headings, Newsreader
for reading paragraphs and lists, Inter for navigation, search, table headings
and operated disclosures, the mono role for code.

It declares **no colour, no font file and no type scale of its own**. If a role
is missing, add it in `../press` — do not invent a literal here. The previous
version repeated six `@font-face` blocks and a hand-typed palette, and put
Fraunces on every `summary` and sidebar group label, which are controls.

`components.css` is deliberately **not** imported into the docs: its global
reset would fight Starlight's layout, and the docs need none of its page
compositions.

The docs are light-only by design (`src/components/docs/ThemeSelect.astro`
renders nothing). `npm run test:design` checks that both the site and the docs
stay light under a dark OS preference, including first paint.

## Constraints

The former **"Locked — do not change without being asked"** list was retired on
14 Sep 2026. It described the `brand-assets` era and outlived it: it protected a
navbar signature that turned out to crop a brand original, a single terracotta
CTA that competed with the hero's, and copy the editorial rework was meant to
revisit. Treating it as binding sent two passes of work in the wrong direction.
The redesign is not frozen — nothing on this site is off-limits by default.

What genuinely still constrains work here:

- **Astro / static / GitHub Pages.** No SSR, no server runtime, no React. Svelte
  stays limited to `SmartDownloadButton`.
- **`press/DESIGN.md` wins.** It is a Press mirror; see *Design system sync*. If
  a change means overriding a design-system rule locally, fix it upstream in
  `../press` and re-sync instead.
- **The brand is lowercase `kindling`**, everywhere it is displayed: sentence
  starts, headings, navigation, alt text, accessible names, `<title>`, Open
  Graph, JSON-LD, the web manifest and native share text. Never uppercase it
  with CSS. Three identifiers are case-sensitive and stay as they are: the
  `Kindling_<version>_*` release filenames (they must match the actual GitHub
  release assets), the `@KindlingWriter` account handle, and the
  `window.KindlingWebsite` browser global.
- **SEO is deliberate, not frozen.** `<meta>`, Open Graph, canonical links and
  the `SoftwareApplication` / `FAQPage` structured data exist for a reason, so
  change them knowingly and say what the trade is — don't casually "improve"
  them, and don't treat them as untouchable either.
- **`.callout` pull-quotes and the italic footer tagline** already do the Press
  job correctly. Use them more; there is rarely a reason to alter them.

---

## Decisions on record

**The marketing name is "kindling Writer"** (25 Sep 2026). Lowercase k, as
the brand rule requires. It's the #1 search query ("kindling writer"), so titles
carry it:

- **Titles:** " — kindling Writer" is added to pages that don't already name the
  brand, only when the title stays at 60 characters or less. Commercial pages
  keep their keyword-first titles, and blog posts show their bare headline.
- **Docs:** the docs are "kindling Writer Docs". On the narrowest phones the
  header drops "Writer" (`src/components/docs/SiteTitle.astro`), because
  Starlight clips the full name silently; page titles keep it at every width.
- **Limits:** indexable marketing pages hold titles to 60 characters and
  descriptions to 120–160. `test:launch` enforces both, and `test:design`
  fails if the docs site title clips.


**GA4 stays; the privacy policy documents it; there is no consent gate.**
(4 Sep 2026.) The policy previously claimed "We don't run Google Analytics or
any third-party tracking scripts" and "No cookies for tracking" while GA4 was
loaded on every marketing page and in the Starlight docs head. Both statements
were false and are now corrected: the website section describes GA4 plainly,
states that it is website-only, and points at Google's opt-out.

Deliberately *not* done: a consent gate. GA4 sets `_ga` cookies, which for
UK/EU visitors likely requires prior consent under PECR/GDPR. That is a known,
accepted open risk — not an oversight. Don't re-raise it as a defect, and
don't add a consent banner without asking.

The desktop app remains analytics-free. Keep that distinction explicit
wherever "no tracking" appears.

## Current state

The editorial restructure and the Press adoption shipped to `main` in
kindling-splash#1 and deployed on 24 Sep 2026 alongside kindling v1.3.

**The vendored snapshot is a commit snapshot of merged Press.**
`src/vendor/press/MANIFEST.json` points at Press 0.15.1 @ `061e42a` (press#10,
on Press `main`) with a clean working tree. Keep it that way: re-sync only from
a commit that is on Press `main`.

### Local-only notes

Working notes live in **`local-only/`**, which is gitignored. They are the
operator's own record and are not part of the site. Read them for context, but
never commit them or link them from tracked files. Moved there from the repo
root on 24 Sep 2026:

- `PRESS_ADOPTION.md`: what the Press adoption changed here, what was resolved
  upstream in `../press`, and the open items at the time
- `LAUNCH_NOTES.md`: launch-fix notes from 12 Sep 2026
- `SEO_PLAN.md`: the April 2026 SEO plan, superseded by
  `local-only/SEO_LAUNCH_PLAN.md` (the post-launch audit and plan, 24 Sep 2026)

Other files there include `RELEASE-v1.3-followups.md`, `v1.3-copy.draft.md`,
`website-ux-review.md` and the dated `seo-audit-*` / `launch-fixes-*` folders.

### Screenshots

All thirty-seven product screenshots were regenerated 24 Sep 2026 against the
Press reskin of the app (kindling#343, v1.3): the twenty-eight `npm run shots`
targets and the nine export-workspace crops from the app's QA runner, whose
source run and coordinates are in `scripts/SCREENSHOTS.md`. None shows the
pre-Press interface. The unreferenced pre-Press demo videos and
`hero-poster.jpg` that still shipped from `public/` were removed then.
Every file in `public/docs/` is referenced by at least one docs page; keep it
that way. `src/assets/scene-panel.png` is captured but no page uses it.

Docs and blog references to `/docs/*.png` are `<img>` tags sized at half the
PNG's pixels, so a 2× capture displays at the interface's real size. Run
`node scripts/size-docs-images.mjs` after any recapture; `--check` fails if a
size is stale. A bare Markdown `![]()` would render the interface at double
scale.

The old per-figure ratio table is gone along with the cropping it tracked — see
*Screenshots and figures* above. Marketing figures are now contained at their
own intrinsic ratio, so there is no slot to measure a capture against.


---

## Before you finish a change

```bash
npm run check:design-system   # vendored copies match their recorded hashes
npm run test:launch           # build + behaviour: events, downloads, no-JS, SEO
npm run test:design           # build + visual contract in a real browser
```

`test:launch` covers event counts, platform downloads, thanks-page replay
protection, mobile sharing, no-JS behaviour, feedback handling, internal links
and the sitemap. `test:design` covers computed type roles, semantic colours,
brand case, font authority and preloads, figure integrity, standalone target
sizes, focus, narrow layout at 375/768/820/1024/1440, 200% zoom, dark-OS first
paint and asset resolution. **A successful build is not evidence of visual
adoption** — that is why the second script exists.

When markup changes, update the selectors those scripts address. Do not weaken
an assertion to make it pass.

Then:

1. The change obeys `press/DESIGN.md` and the hard rules in
   `press/docs/DESIGN_GUIDE.md` — especially measure, prose colour, centring
   and the terracotta count.
2. No new raw hex, no new raw px font size.
3. No design-system rule overridden in `global.css` or a page `<style>`.
4. No new control implementation. Reach for a `.ka-*` class, or `.pw-button`
   for a marketing call to action.
5. The brand reads lowercase `kindling` everywhere it is displayed, and the
   three case-sensitive identifiers are untouched.
6. Copy, headings and structured data are untouched unless that was the task.
