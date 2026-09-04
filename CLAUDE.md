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

## Current state — the held commit

The editorial restructure is **complete in the working tree but intentionally
uncommitted.** It is waiting on two things:

1. the desktop app reskin landing, and
2. the site product screenshots being regenerated to match the new app UI.

Josh wants the site changes and refreshed screenshots in the same commit. The
screenshots to replace live in `src/assets/` — `scene-panel.png`,
`beat-with-prose.png`, `references-panel.png` (used on home + features), plus
whatever `/download/` and `/compare/` show.

**Do not commit the restructure until told the reskin is done.** Additive work
(docs, config, tooling) can still land as its own commit.

*Delete this section once the restructure is committed.*

---

## Before you finish a change

1. `npm run build` passes.
2. The change obeys the hard rules in `DESIGN_GUIDE.md` — especially measure,
   prose colour, centring, and the terracotta count.
3. No new raw hex or raw px font size.
4. No design-system rule overridden in `global.css`.
5. Copy, headings and structured data are untouched unless that was the task.
