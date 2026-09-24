# Integration

## Public entries

| Import | Purpose |
| --- | --- |
| `@kindling/design-system` | Aggregate CSS: fonts, tokens, then components |
| `@kindling/design-system/fonts.css` | Local font faces only |
| `@kindling/design-system/tokens.css` | Canonical raw and semantic custom properties |
| `@kindling/design-system/tokens.json` | Generated resolved light/dark map |
| `@kindling/design-system/components.css` | Existing global and component styles |
| `@kindling/design-system/assets/*` | Brand files and fonts, preserving family directories |
| `@kindling/design-system/licenses/*` | Font notices |
| `@kindling/design-system/package.json` | Version metadata |

Exports make package paths explicit; they do not teach browsers to resolve bare npm names. Use a CSS-aware bundler for package imports. Never import the root CSS entry as executable Node JavaScript.

## Plain HTML and CSS

Copy the package into a site-owned `vendor/kindling-design-system` directory. Preserve the `design-system`, `assets`, and `licenses` relative structure. Do not copy CSS alone: font URLs are relative to `fonts.css`.

```html
<link rel="stylesheet" href="./vendor/kindling-design-system/design-system/fonts.css">
<link rel="stylesheet" href="./vendor/kindling-design-system/design-system/tokens.css">
<link rel="stylesheet" href="./vendor/kindling-design-system/design-system/components.css">
<img src="./vendor/kindling-design-system/assets/svg/kindling-mark.svg"
     width="740" height="420" alt="kindling" style="width:64px;height:auto">
```

Load application-specific styles after the foundation. A bundler-free stylesheet can equivalently `@import` the aggregate entry using a relative URL. No CDN, sibling checkout, or absolute workstation path is involved.

## Package-based consumption

Run `npm pack` at the package root, commit or distribute the resulting local archive through your existing internal process, and install it from a consumer-owned `vendor/` directory as described in the root README. Commit the consumer lockfile. Avoid a `file:../brand-assets` dependency, which recreates the sibling checkout coupling.

```css
@import "@kindling/design-system/fonts.css";
@import "@kindling/design-system/tokens.css";
@import "@kindling/design-system/components.css";
```

Importing from CSS requires a bundler that resolves package exports. If yours does not, copy the distributed files to its static assets directory and use the plain-HTML form. Do not inject package `node_modules` URLs into a deployed page unless your build explicitly serves them.

For JSON-consuming Node tooling, this avoids relying on import-assertion syntax:

```js
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const tokens = JSON.parse(readFileSync(
  require.resolve('@kindling/design-system/tokens.json'), 'utf8'
));
console.log(tokens.light['--color-text']);
```

Values are resolved strings, including units, `clamp()` expressions and data URIs. This is the existing flat schema, not DTCG. Do not assume every value is numeric or that aliases remain in JSON.

For assets, resolve the exported path through your build tool's asset mechanism, or copy the needed files to your public directory. For Node copy tooling:

```js
const markPath = require.resolve('@kindling/design-system/assets/svg/kindling-mark.svg');
```

All asset imports retain their extensions. Font URLs use percent-encoded brackets and commas where appropriate; keep filenames unchanged.

## Incremental adoption and global CSS

`components.css` is intentionally unchanged. It includes a universal margin/padding reset, body and heading styles, form controls, selection, scrollbars, and a body grain layer. Loading it can change an existing application's layout. It is not CSS Modules or Shadow DOM isolation.

Adopt `fonts.css` and `tokens.css` first if your app already owns its global styles. Write your own components against semantic tokens, then opt into the shared stylesheet in a reviewed change. There is no newly invented scoped variant in 0.1.0.

```css
.manuscript {
  font-family: var(--font-body);
  font-size: var(--text-body);
  color: var(--color-text);
  max-width: var(--measure);
}
```

Shared controls define styling, not behavior. Your app must supply labels, validation, dialogs, focus management, feedback, and disabled behavior. The reference demonstrates these responsibilities with small local examples.

## Themes and surfaces

Light is the default. Set `data-theme="dark"` on `document.documentElement` to opt into dark; set `data-theme="light"` or remove the attribute for light. Tokens do not themselves select OS preference. An app's system option should resolve `matchMedia('(prefers-color-scheme: dark)')`, subscribe to changes, and set the root attribute. Put portals under the same themed root.

The website and docs remain light-only under the existing Press decision. The reference's theme control exercises the shared palette; it does not change that policy. Desktop supports light, dark, and system. `.app-prose-sheet` intentionally remains warm light paper inside dark chrome.

Use semantic `--color-*` tokens for themed rendering. Persist user-authored tag choices with stable light `--tag-*` values as the existing guide specifies. Never persist a computed dark color as a canonical tag identifier.

## Typography and assets

Fraunces titles; Newsreader reading prose; Inter controls and metadata. All are local TTFs with `font-display: swap` and canonical fallbacks. Full variable TTFs favor fidelity and broad character coverage over minimum download size; no WOFF2 transformation or subset was added. Serve fonts from the same origin (and allow them in your CSP). Fraunces italic is not bundled; display examples use upright headings.

Use original SVGs without CSS recoloring or cropping. Stacked lockup minimum is 140px; emblem minimum 32px; below 32px use the flame favicon. Use reversed files for dark backgrounds. Copy favicon files together because their manifest references neighboring images. Platform icon packaging belongs to the consumer; the supplied masters are portable inputs.

## Optional website layer — 0.2.0

The public entries `@kindling/design-system/website.css` and `@kindling/design-system/website.js` are additive. They do not change the full foundation entry or require `components.css`. Load fonts and tokens before website.css; opt out of the original global stylesheet if your consumer already owns base styles.

For plain HTML, after fonts and tokens:

```html
<link rel="stylesheet" href="./vendor/kindling-design-system/design-system/website.css">
<script src="./vendor/kindling-design-system/design-system/website.js" defer></script>
<div class="press-web"><!-- website component markup --></div>
```

For a bundler, import website.js for side effects. It is included in `package.json`'s sideEffects allowlist and installs `window.KindlingWebsite`; it has no named ESM exports. It is also a classic script, which keeps local-file reference use possible. On a server without `window` or `document`, it does nothing.

The script auto-initializes existing markup once. For client-side navigation, call `window.KindlingWebsite.init(container)` after mounting new content, and `window.KindlingWebsite.destroy(container)` before unmounting. Initialization is idempotent. Each initialized component owns abortable listeners; destroy removes them and clears its pending form timer. Native disclosures need no script.

Website samples intentionally stay light even when the reference chrome is dark. This does not add a theme setting to the actual website. Copy markup, CSS and behavior hooks together; update sample anchors, image paths, IDs and radio-group names for each instance. See WEBSITE_COMPONENTS.md for the complete contract.

## Svelte application layer (0.3.0)

`@kindling/design-system/svelte` exports typed Svelte 5 UI components. `@kindling/design-system/application.css` is an optional scoped component layer; it does not replace canonical tokens or the existing app stylesheet. Import existing fonts and tokens once. Svelte is an optional peer for CSS-only consumers.

[Application components](APPLICATION_COMPONENTS.md) documents exact props and incremental adapters for the current kindling source. Keep existing stores, APIs, Tiptap, native dialogs, autosave, and file operations in the consuming application. The source package requires a Svelte-aware bundler; the distributed HTML reference uses its already-compiled local bundle.
