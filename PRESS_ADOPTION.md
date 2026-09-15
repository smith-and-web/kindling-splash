# Press adoption — handoff

Implements `../press/docs/KINDLING_SPLASH_ADOPTION.md`.

Branch **`press/adopt-press-0.9.0`**, cut from `press/editorial-restructure`
(kindling-splash#1, HEAD `4ad4778`) on 14 Sep 2026, carrying that branch's
uncommitted launch work forward untouched — nothing was reset, stashed or
reverted. The matching Press work is on **`press/website-control-consolidation`**,
cut from `press` `main` (`bac49b0`) with the owner's uncommitted 0.9.0
consolidation carried forward the same way.

---

## 1. The Press snapshot

```
@kindling/design-system 0.10.0
commit  bac49b063855d70a8c6e00b7436576082f2b7219
snapshot working-tree            ← the version and commit do NOT identify these bytes
```

`../press` had uncommitted 0.9.0 consolidation work in its tree when this began;
the 0.10.0 changes sit on top of it. **The 49 SHA-256 values in
`src/vendor/press/MANIFEST.json` are the only identity this snapshot has.** The
manifest records that explicitly, with the package version, the source commit,
a source path and digest per file, and every intentional exclusion with its
reason.

```bash
npm run sync:design-system    # re-copy from ../press, rewrite the manifest
npm run check:design-system   # verify — needs no ../press checkout and no network
```

`check:design-system` runs first in `npm run test:launch`, so a hand-edited
mirror fails the build rather than drifting quietly. The old `PRESS_VERSION`
timestamp file could not detect a modified mirror at all; it is gone.

**Before merging: commit the Press branch, tag a release, and re-sync.** The
manifest will then read `snapshot: commit` and a rollback restores a coherent,
identifiable pair.

### What is vendored, and where

| Destination | From | Why there |
| --- | --- | --- |
| `src/vendor/press/design-system/` | `design-system/` | tokens, components, application, website, fonts-web, website.js |
| `src/vendor/press/assets/fonts/web/` | `assets/fonts/web/` | five WOFF2 faces + their build manifest |
| `src/vendor/press/assets/svg/` | `assets/svg/` | brand artwork for build-time importers (the Starlight logo) |
| `src/vendor/press/licenses/` | `licenses/` | OFL notices, kept with the distribution |
| `public/brand/` | `assets/svg/` | stable URLs for standalone HTML outside the Astro build |
| `public/favicon*`, `icon-*`, `apple-touch-icon`, `site.webmanifest` | `assets/favicon/` | already-published URLs; not renamed |
| `public/og-image.png` | `assets/social/` | already-published URL; not renamed |
| `press/DESIGN.md`, `press/docs/*.md` | `DESIGN.md`, `docs/` | the contract keeps its relative links |

`design-system/` and `assets/` must stay siblings: `fonts-web.css` resolves
`../assets/fonts/web/` relative to itself.

Exclusions (each recorded in the manifest with its reason): `reference/`,
`ui_kits/`, `preview/`, the catalog HTML, `design-system/svelte/`,
`design-system/fonts.css` and the ~3.1MB of canonical TTFs, `assets/png/`,
the social avatars, artwork sources and build scripts, and the Press maintenance
docs `DESIGN.md` names but does not need beside it.

Vendoring the subset rather than installing the tarball is unchanged and still
deliberate: `npm pack` produces ~33MB because `reference/` carries 31MB of QA
baseline images no CSS consumer reads. The vendored subset is **1.6MB**.

---

## 2. Shared changes made in Press

Press went 0.9.0 → **0.10.0**. Full detail in `../press/CHANGELOG.md`.

### One implementation per control role

`.pw-button` and `.ka-button` were two button systems wearing the same palette —
different fill (`--color-accent` vs `--color-accent-text`), label size, hover (a
colour swap vs an inset ring), disabled colours and secondary treatment. A
visitor crossing from the site into the app met both.

The website layer now styles **one** control, the marketing call to action.
Operational controls on a website — a dialog's submit, a field, a copy or share
action, a toggle — use `application.css`, because they are the same role a
writer meets in the workspace. The CTA is a documented larger size of that same
family (16px label, 12/24px padding against 15px and 8/16px) and differs in
nothing else.

`components.css` turned out to hold a **third** button system in `.download-btn`
and `.navbar-cta`, and a **fourth** in `.signup-form`'s field and subscribe
button. All are now the shared treatment.

`npm run system:check` in Press asserts the website CTA and the application
control still agree on fill, radius and hover.

**Breaking for other consumers:** the website CTA's fill moves `#B5532E` →
`#9E3D1B` (4.69:1 → 6.30:1 against `--color-on-accent`), the hover colour swap
becomes an inset ring, `.pw-button--secondary` becomes a sunken fill,
`.pw-button--ghost` is added, website focus rings move to a 3px offset, and
foundation consumers get a visibly different `.download-btn`.

### Application-fidelity writing sample

`.pw-writing--app` gives a website writing sample the application's manuscript:
`--color-prose-*` paper and ink, `--text-body` (17px) at `--leading-relaxed`,
held to `--measure`. Those are `NovelEditor.svelte`'s own values.

While checking that, **`.ka-manuscript-prose` was found to disagree with the
editor it depicts** — `--text-body-lg`/1.75 over 65ch against the editor's
`--text-body`/`--leading-relaxed` over `--measure`. The reference was wrong, not
the product; it now matches. Application consumers get slightly smaller, narrower
read-only manuscript prose.

### Web font delivery

`npm run fonts:build` in Press losslessly encodes the canonical variable TTFs to
WOFF2 in `assets/fonts/web/`, writes `design-system/fonts-web.css` declaring the
same five faces, and records source and published digests. No subsetting: every
axis, weight, italic and glyph survives. `npm run fonts:check` and
`npm run system:check` verify freshness.

### Gaps found by building a real consumer

- `.pw-feature` prose had no vertical rhythm — a row's label, heading, problem
  and answer ran together as one block.
- `.pw-image-frame`'s contained image treatment was scoped to
  `.pw-feature .pw-image-frame img`, so it did nothing anywhere else: a
  full-frame specimen outside a feature row got the mat and the ratio with an
  unconstrained image inside them.
- `.pw-footer-links` never reset the UA underline it adds only on hover.
- `.press-web` had no mono role, so a `<code>` in website copy fell back to the
  UA's generic monospace.
- The `web-features` catalog snippet gave each row five direct children of a
  two-column grid; each row now has the two the CSS assumes.
- **Button labels used `overflow-wrap: anywhere`** (added in 0.9.0). That is
  also a break opportunity when the browser computes min-content width, so a
  button in a content-sized grid track collapsed and split its label mid-word —
  `macOS` rendered as `ma / cO / S` on the post-install download card.
  `break-word` wraps only when it has to and leaves intrinsic sizing alone;
  fixed for `.pw-button`, `.download-btn` and `.ka-button` together.
- **`.page-hero` and `.content-section` were two different frames** — 960px and
  900px — so a page's hero sat 30px left of its own sections, on every editorial
  page. Both now use a new `--page-frame-editorial` token, and
  `.content-section.alt`'s re-centred column derives from it instead of the
  hard-coded `852px` that kept the sunken bands 30px right of the paper ones.
  **`.content-section` is 60px wider on upgrade**; prose inside is already held
  to `--measure`, so it affects tables, lists and figures, not reading width.
- **`.pw-section-head` placed its children by source order.** Written without a
  running label it put the `<h2>` in the narrow 1fr track, where a short title
  wrapped to three lines while the stand-first beside it kept the full 2fr —
  which is exactly what `/features/` shipped. Children are now placed
  explicitly: label in the narrow track, everything else in the wide one. The
  label is optional furniture; the alignment is the device.
- **`.pw-button svg` had no size.** An inline glyph with only a viewBox has no
  intrinsic size inside a flex container and collapsed to nothing. The
  foundation's `.download-btn svg` had always sized it; the website layer had
  not, so the platform icons vanished the moment the site moved to `.pw-button`.

Press was rebuilt and validated after each change:
`tokens:generate`, `reference:website`, `reference:application`,
`open-design:build`, `fonts:check`, `system:check` — all green at 0.10.0.

**Not run: `npm run open-design:sync`.** That publishes to an external service,
and nothing in this task required it. Run it deliberately when the Press branch
is committed.

---

## 3. What changed on the site

### Shell

- `MarketingLayout.astro` wraps header, `<main>` and footer in a single
  `.press-web` boundary. It is **not** on `<body>` or `<main>`:
  `container-type: inline-size` applies layout containment, which would make the
  element the containing block for `position: fixed` descendants and trap the
  paper grain `body::before` paints. `FeedbackWidget` sits outside it for the
  same reason and draws its controls from `application.css`, which is unscoped.
- `Navbar.astro` is `.pw-header` + `.pw-nav` with Press's in-flow disclosure
  from the vendored `website.js`. Its ~180 lines of local fixed positioning,
  stacking values, blur, breakpoint and hamburger are gone. Verified: opens,
  moves focus to the first link, `aria-expanded` tracks, Escape closes and
  returns focus to the button, and every link stays visible without JavaScript.
- Both the navbar and footer read the wordmark's dimensions **from the asset**.
  The old navbar hard-coded width `6790`, which described the previous lettering
  and silently stopped matching when the lowercase wordmark was recut to `6445`.
- `Footer.astro` is `.pw-footer`. Routes, legal links, external destinations and
  the `<footer>` element analytics keys off are unchanged.
- `src/styles/global.css` is now five vendored imports plus site adapters. It
  declares no font faces — the site used to redeclare Fraunces, Newsreader and
  Inter against narrower Fontsource subsets under the same family names.
- Deleted: `src/styles/{tokens,components,website}.css`, `src/styles/PRESS_VERSION`,
  `src/scripts/press-website.js`, `scripts/vendor-fonts.sh`, `public/fonts/`,
  root `DESIGN_GUIDE.md`, `src/assets/kindling-logo.svg` (a cropped viewBox of
  the brand original, which the contract forbids). The
  `@fontsource-variable/*` and `@fontsource/inter` packages are uninstalled.

### Components

| Component | Now |
| --- | --- |
| `WritingDemo.astro` | `.pw-writing.pw-writing--app` with `data-pw-beats`. ~140 lines of local styling gone. Ids, radio group name and no-JS readability preserved; a `:has()` fallback keeps exactly one draft open without JavaScript. |
| `SmartDownloadButton.svelte` | `.pw-button` for the download, `.ka-button` for share, `.ka-field` for the manual link. Platform detection, `requestDownload`, desktop/mobile branches, native sharing, cancellation and the clipboard-failure fallback are untouched. |
| `FeedbackWidget.astro` | `.ka-dialog` / `.ka-field` / `.ka-check` / `.ka-segment` / `.ka-notice` / `.ka-button`. Endpoint, payload, honeypot, `formOpenedAt`, lazy Turnstile, error handling and Escape/focus behaviour unchanged. Its style block is placement only. |
| `SectionLead.astro` | New. Composes `.pw-section-head` so a lead cannot be miscomposed by hand. A design check fails if a heading lands in the label's track. |
| `ProductFigure.astro` | New. Wraps a capture in `.pw-image-frame` with `--pw-reference-ratio` set from the image's own intrinsic dimensions — no crop, no letterbox, at any width. |

### Pages

`/` and `/features/` are fully on the website layer: `.pw-hero-grid`,
`.pw-band` + `.pw-trust`, `.pw-section-head`, `.pw-feature-grid`,
`.pw-release-grid`, `.pw-closing`, `.pw-disclosure`. `/feedback/` lost its
entire local form language (tabs, fields, radio pills, submit, status colours)
to `application.css`. `/download/` moved its disclosures to `.pw-disclosure` and
its copy/share actions to `.ka-button`. `/compare/`, `/open-source/`,
`/plottr-vs-scrivener/` and `/story-outlining-software/` lost their inline
colour and size overrides.

**Legacy foundation styles still in use, deliberately.** The long reading pages
— `/faq/`, `/compare/`, `/privacy/`, `/terms/`, `/code-signing-policy/`,
`/free-scrivener-alternative/`, `/plottr-vs-scrivener/`,
`/story-outlining-software/`, the blog — still use `components.css`'s
`.page-hero`, `.content-section`, `.callout` and `.editorial`. That is not
unfinished work: `components.css` is Press's **editorial** layer (Newsreader
reading copy) and `website.css` is its **product-website** layer (Inter product
copy), and the contract assigns those roles by surface. What was wrong before
was two pages rendering *the same pattern* in different fonts; `/` and
`/features/` now share one sequence.

### Branding

669 displayed occurrences lowercased across templates, Markdown content, docs,
`llms.txt`, `llms-full.txt`, titles, Open Graph, JSON-LD and alt text. Three
identifiers were deliberately preserved and are asserted by the checks:

- `Kindling_<version>_universal.dmg` / `_x64-setup.exe` / `_amd64.AppImage` —
  these must keep matching the actual GitHub release assets.
- `@KindlingWriter` — the registered account handle.
- `window.KindlingWebsite` — a browser API identifier the brand decision does
  not authorise breaking.

`public/welcome.html` and `public/getting-started.html` were audited: both are
meta-refresh redirect stubs with no chrome to migrate.

### Starlight

`src/styles/starlight-overrides.css` is an adapter and nothing else. It declares
no colour, no font file and no type scale of its own; every `--sl-*` colour
Starlight uses maps to a Press semantic role. Type is assigned by role —
Fraunces for the page title and prose headings, Newsreader for reading, Inter
for navigation, search, table headings and operated disclosures, mono for code
— replacing a blanket `summary`/`.group-label` Fraunces rule that put a display
serif on controls. `components.css` is deliberately not loaded into the docs.
Config: title `kindling Docs`, lowercase sidebar labels, and the approved
book-and-flame emblem.

Two roles were re-judged rather than mapped blindly: the 24px masthead title was
`--sl-color-text-accent` (terracotta) and is now ink, and the current sidebar
item keeps its fill because that is the same selected-navigation treatment
`.ka-tree-selected` uses in the app.

---

## 4. Verification

```bash
npm run check:design-system   # 49 vendored files match their recorded hashes
npm run test:launch           # 13 behaviour checks
npm run test:design           # 13 visual-contract checks
```

All green — 13 behaviour checks and 14 design checks.
**`scripts/check-design.mjs` is new** — the brief's point that a
successful Astro build is not evidence of visual adoption. It runs a real
browser over 13 routes at 375/768/820/1024/1440 and at 200% zoom, and asserts:

- computed type roles per route (Fraunces headings, Inter controls, Newsreader
  reading and manuscript, mono code);
- semantic colours, and that the CTA fill matches `.ka-button`;
- the writing sample is 17px/1.7 within `--measure` — the application's reading
  role, not the website's larger editorial one;
- exactly five `@font-face` rules (one authority per family), all three families
  actually loaded, and both preloads being files a `@font-face` uses;
- displayed text, alt text, accessible names, `<title>` and the web manifest use
  lowercase `kindling`, and no CSS uppercases it;
- no product figure renders with `object-fit: cover`, and each keeps its
  intrinsic proportions;
- no horizontal overflow or broken image at any tested width or at 200% zoom;
- the site and docs stay light under a dark OS preference, **including first
  paint** (read at `commit`, not after load, so a dark flash cannot hide);
- no icon inside a control collapses to nothing — an invisible glyph takes no
  space, so nothing else about the page looks wrong, which is why it needs a
  check rather than an eye;
- every standalone control reaches 44px, focus is visible, 13 brand and social
  assets resolve, and an unknown path serves the site's own 404.

Expected values are read from the vendored `tokens.css`, so a token change in
Press moves the expectation with it rather than silently passing.

`check-launch.mjs` kept every assertion; only the selectors markup changed moved
with it. It still covers event counts, platform downloads, thanks-page replay
protection, mobile sharing, no-JS downloads, feedback handling, internal links,
article metadata, completion `noindex` and the sitemap.

Evidence in `/tmp/press-adoption/`: after-screenshots for home, features,
download, feedback, docs and an article at 1440px and 390px, plus isolated
captures of the marketing CTA, the dialog with its fields, and the manuscript
sample for app comparison.

**Caveat on the before-screenshots.** `before-*.png` are built from HEAD
`4ad4778`, which is the last *commit* — not the tree this branch started from.
The starting state was uncommitted work on top of that commit and was edited in
place, so it is not recoverable. The before-shots show the direction of travel
honestly but are not a pixel baseline for this diff. Capturing one at branch
creation is the thing to do next time.

---

## 5. Open items

1. **Commit the Press branch and re-sync.** The vendored snapshot is from a
   dirty working tree. Until that is a committed release, `MANIFEST.json`'s
   hashes are the only thing identifying it, and a rollback cannot restore a
   named version.

2. **Fonts got heavier: ~418KB → ~1.01MB over the wire** (Fraunces 206K,
   Newsreader 215K, Newsreader italic 239K, Inter 350K; Inter italic 386K is
   vendored but unused on any current route). That is the brief's explicit
   instruction — one font authority, "preserve the required axes, weights,
   italics and glyph coverage", retire the Fontsource sync — and it buys full
   glyph coverage, the wider Fraunces weight range and Inter italic that the
   latin subsets did not have. It is still a real regression on first paint.
   `font-display: swap` and two preloads limit the damage. **If the byte cost
   matters more than coverage, the fix belongs in Press**: a subsetting mode on
   `npm run fonts:build` that publishes both a full and a latin distribution,
   with the dropped coverage stated. Do not re-add a site-local subset.

3. **`npm run open-design:sync` was not run** — it publishes to an external
   service. Run it deliberately after committing the Press branch, using the
   existing project and system identifiers, and verify the registered brief.

4. **Application-side follow-up, clearly separate from this website work:**
   - `../kindling/src/styles/press/tokens.css` is a stale copy. It lacks
     `--control-target`, has `--text-hero` at 48px against Press's 60px, and
     still carries the title-case comment header. Re-sync it from Press.
   - The About dialog still spells the brand title-case (noted in the brief).
   - `.ka-manuscript-prose` changing to 17px/1.7/`--measure` will move the
     read-only manuscript surface wherever the app uses it. It now agrees with
     `NovelEditor.svelte`; check the surfaces that render it.

5. **`npm run shots` is not re-run, and does not need to be.** The twenty-eight
   captures are current as of 6 Sep 2026 against the reskinned app. The
   `minAspect` contract in `scripts/capture-screenshots.mjs` no longer binds the
   marketing figures — it existed because the mounted print cropped `cover`, and
   nothing crops now. Its assertions are harmless and still catch a soft or
   mis-framed capture, so they were left alone rather than loosened.

6. **Not changed, flagged only:** the homepage trust band still claims "Trusted
   by 2000+ writers". `WEBSITE_COMPONENTS.md` declined to promote that number to
   a shared fact, and `DESIGN.md`'s voice section forbids unsupported metrics.
   Substantiate it or cut it — a copy decision, not a design one, so it was left
   alone.

7. **Unchanged and still true:** GA4 stays, the privacy policy documents it, and
   there is no consent gate. That remains a known, accepted open risk.
