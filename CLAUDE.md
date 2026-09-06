# kindling-splash

The Kindling marketing + docs site. Astro, static, deployed to GitHub Pages at
**kindlingwriter.com**.

---

## Read `DESIGN_GUIDE.md` before writing any markup or CSS

`DESIGN_GUIDE.md` (repo root) is the Press design specification: the commitment,
the composition rules, the named devices, 12 numbered hard rules and a banlist.
**It is authoritative.** If anything here disagrees with it, the guide wins.

It is a read-only mirror — see *Design system sync* below.

### The rules broken most often

Restated here because these are the ones that get violated by reflex, not the
full set:

- Reading prose is capped at `--measure` (42rem ≈ 66ch) and set in
  `--color-text`, never `--color-text-muted`.
- **Never centre a paragraph longer than one line.** Centring is for one-line
  ceremonial moments only.
- Terracotta appears **at most twice per viewport**. Not an eyebrow on every card.
- No raw hex, no raw px font sizes. Everything resolves to a token.
- Shadow only on a mounted-print figure or the closing CTA panel. Otherwise
  hairlines.
- Sequence, not grid: `.feature-seq` / `.spotlight-list` over card matrices.
- No emoji as icons. No gradients or glows. No typewriter effects. No autoplay
  looping product video.
- Fraunces for headings, Newsreader for reading, Inter for controls. Never a
  system sans.

**The test:** if a page could be dropped onto another product's site without
looking out of place, it isn't Press yet.

---

## Architecture

- **Astro 6**, static output, `trailingSlash: 'always'`, `site: https://kindlingwriter.com`.
- **Starlight** mounted for `/docs` (sidebar configured in `astro.config.mjs`).
- **Svelte** for the single interactive island: `SmartDownloadButton` (OS detection).
  There is no other client-side framework use — keep it that way.
- **GA4** via `src/components/Analytics.astro` and a Starlight `head` entry.
- **Sitemap** via `@astrojs/sitemap`.
- Deploy: `.github/workflows/deploy.yml`, `withastro/action@v6`, on push to `main`.

```bash
npm run dev      # local dev
npm run build    # static build to dist/ — run this before claiming a change works
npm run preview  # serve the built output
```

### Layout

```
src/pages/          route-per-directory .astro pages
src/layouts/        MarketingLayout.astro — head, meta, OG, JSON-LD, nav + footer
src/components/     Navbar, Footer, Logo, Analytics, SmartDownloadButton.svelte
src/content/        blog/ (markdown) + docs/ (Starlight)
src/styles/         tokens.css + components.css (MIRRORS), global.css (site-only)
src/data/           downloads.ts — version + platform download metadata
```

---

## Design system sync

`src/styles/tokens.css`, `src/styles/components.css` and `DESIGN_GUIDE.md` are
**read-only mirrors** of `../brand-assets/design-system/`.

- **Never hand-edit them here.** Change them in `brand-assets` and run
  `npm run sync:design-system`.
- Site-only styling goes in `src/styles/global.css` or a page-scoped `<style>`
  block in the `.astro` file.
- If you find yourself overriding a design-system rule in `global.css`, that is
  the signal the design system is wrong. Fix it upstream and re-sync — do not
  patch it here. (This exact drift is what the composition layer promotion fixed;
  don't reintroduce it.)
- Fonts are self-hosted, no CDN. Re-vendor with `npm run sync:fonts` after
  bumping `@fontsource-variable/*`.

---

## Locked — do not change without being asked

- **All copy, heading text, and heading levels.** Restructure presentation, never
  rewrite the words.
- **All `<meta>`, Open Graph, Twitter Card, canonical links, and JSON-LD**,
  including the `SoftwareApplication` and `FAQPage` structured data. SEO work is
  deliberate here; don't casually "improve" it.
- **Astro / static / GitHub Pages architecture.** No SSR, no server runtime, no
  React.
- **Navbar structure** — translucent paper blur, Fraunces wordmark beside the
  flame mark, terracotta active underline, single terracotta CTA. Download is
  intentionally *not* in the link row; the CTA is the sole download affordance.
- **Download page structure** — platform cards, detail table, trust callouts,
  numbered steps, OS detection. Cards are semantically real here, so they belong.
- **`.callout` pull-quotes and the italic footer tagline.** These are the two
  elements already doing the Press job correctly. Use them *more*; don't alter
  them.

---

## Decisions on record

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

## Current state — the held PR

The editorial restructure and everything after it lives on
**`press/editorial-restructure`** as **kindling-splash#1**, open and unmerged.
The working tree is clean.

**The desktop app reskin is done.** The only remaining gate is regenerating the
product screenshots against the new app UI.

### Screenshots to regenerate

| File | Used on | Renders at | Ratio |
|---|---|---|---|
| `src/assets/scene-panel.png` | home hero **and** `/features/` row 1 | 477×560 hero, 530×440 features | 0.85 / 1.20 |
| `src/assets/beat-with-prose.png` | home row 1 | 498×440 | 1.13 |
| `src/assets/references-panel.png` | home row 2, `/features/` row 2 | 498×440, 530×440 | 1.13 / 1.20 |
| `public/docs/app-settings.png` | `docs/settings` | — | — |
| `public/docs/project-settings.png` | `docs/settings` | — | — |
| `public/docs/command-palette.png` | `docs/getting-started`, `docs/scene-workflow` | — | — |
| `public/docs/view-toggle.png` | docs | — | — |

**Don't forget the four docs images.** Missing them ships new UI on the
marketing pages and the old UI in the documentation.

### Capture at the display aspect

Both figure treatments use `object-fit: cover` against a fixed `max-height`, so
a portrait source is cropped from the bottom and the lower half is never seen.
The current sources are ~0.63 ratio against display ratios of 0.85–1.20, so
**~24% of the hero and ~44% of each feature figure is discarded.**

Capture at roughly 2× the rendered size, at the rendered aspect:

- **Hero** — target 477×560 (ratio 0.85) → capture ~**960×1120**
- **Feature rows** — target 530×440 (ratio 1.20) → capture ~**1060×880**

`scene-panel.png` serves both a 0.85 hero and a 1.20 feature slot. Either
capture it twice (adding e.g. `scene-panel-hero.png`) or accept cropping in one
of them.

Once the aspects are settled, revisit `.hero-figure img { max-height: 560px }`
in `src/pages/index.astro` and `.feature-figure img { max-height: 440px }` in
the design system so `cover` crops nothing.

**Merge upstream first.** `brand-assets` may have an open PR; merge it and
re-run `npm run sync:design-system` before trusting the mirrors here.

*Delete this section once the PR is merged.*

## Before you finish a change

1. `npm run build` passes.
2. The change obeys the hard rules in `DESIGN_GUIDE.md` — especially measure,
   prose colour, centring, and the terracotta count.
3. No new raw hex or raw px font size.
4. No design-system rule overridden in `global.css`.
5. Copy, headings and structured data are untouched unless that was the task.
