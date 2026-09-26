/*
 * The source for /llms.txt and /llms-full.txt, built from the site itself.
 *
 * Both used to be hand-kept files in public/. By the v1.3 launch they
 * described v1.1, linked every blog post through its `.html` redirect stub,
 * omitted six pages, priced Scrivener at $49, gave "~10MB" for an app whose
 * Linux download is 86MB, and said the app "doesn't phone home" when it
 * checks for updates. ChatGPT was the third-largest source of downloads at the
 * time, so these are the pages written for a channel that converts.
 *
 * Blog posts and docs come from their collections; version, platforms and
 * sizes come from data/downloads.ts. The only hand-kept parts are the summary,
 * the facts and the key-page descriptions below. Keep them to what the site
 * states elsewhere. `check-launch.mjs` asserts that every sitemap URL is
 * listed and that every listed URL resolves.
 */
import { getCollection } from 'astro:content';
import { APP_VERSION, DOWNLOADS } from './downloads';

export const SITE = 'https://kindlingwriter.com';

const SUMMARY =
  'kindling is a free, open-source (MIT) desktop writing app for fiction writers who outline. ' +
  'It keeps your outline beside the draft: each scene opens with its beats, characters and notes close at hand, ' +
  'so you draft from the plan instead of a blank page. It runs offline on macOS, Windows and Linux, ' +
  'needs no account, and does not use AI to write or analyse your work.';

/* The marketing pages, in the order a reader would want them. Docs and blog
   posts are listed from their collections, not here. */
const KEY_PAGES: { path: string; title: string; note: string }[] = [
  { path: '/', title: 'Home', note: 'What kindling is, a working demo of a scene with its outline, and what is new in this release' },
  { path: '/features/', title: 'Features', note: 'Outline-aware drafting, rolling outlines, references, editorial review, writing goals, import and export' },
  { path: '/download/', title: 'Download', note: `Free installers for macOS, Windows and Linux, version ${APP_VERSION}, with checksums` },
  { path: '/compare/', title: 'Compare', note: 'kindling compared with Scrivener, Plottr, Obsidian, Dabble, Novelcrafter, Campfire, Atticus and Wavemaker' },
  { path: '/plottr-vs-scrivener/', title: 'Plottr vs Scrivener', note: 'An honest comparison of the two, and where kindling fits between outlining and drafting' },
  { path: '/free-scrivener-alternative/', title: 'Free Scrivener alternative', note: 'kindling as a free Scrivener alternative, including on Linux, where Scrivener has no version; what Scrivener still does better' },
  { path: '/story-outlining-software/', title: 'Story outlining software', note: 'Outlining that carries into the draft: scene beats as drafting prompts, and planning at your own pace' },
  { path: '/open-source/', title: 'Open source', note: 'The MIT licence, the source code, the technology stack and how to contribute' },
  { path: '/blog/', title: 'Blog', note: 'Release notes, tool comparisons and drafting guides for writers who outline' },
  { path: '/faq/', title: 'FAQ', note: 'Pricing, platforms, imports and exports, privacy, AI policy and technology' },
  { path: '/privacy/', title: 'Privacy policy', note: 'What the desktop app and the website each collect; the app has no analytics or telemetry' },
];

const SECONDARY_PAGES: { path: string; title: string; note: string }[] = [
  { path: '/feedback/', title: 'Send feedback', note: 'Report a bug, request a feature or rate the app' },
  { path: '/code-signing-policy/', title: 'Code signing policy', note: 'macOS builds are signed and notarized by Apple; Windows builds are not yet code-signed' },
  { path: '/terms/', title: 'Terms of service', note: 'Terms of service for the free, MIT-licensed software' },
];

function facts(): string {
  const sizes = Object.values(DOWNLOADS)
    .map((d) => `${d.label} ${d.format} ${d.size} (${d.sysReq})`)
    .join('; ');
  return [
    `- **Current version:** ${APP_VERSION}`,
    '- **Price:** free. No premium tier, subscription or account. MIT licensed.',
    `- **Platforms and downloads:** ${sizes}. Under 100 MB installed.`,
    '- **Imports:** Plottr (.pltr), Scrivener 3 (.scriv), yWriter (.yw7), Obsidian Longform, novelWriter, Markdown outlines.',
    '- **Exports:** DOCX (Standard Manuscript Format), EPUB, HTML, plain text, Markdown, treatments, and back to Scrivener 3, Obsidian Longform and novelWriter. Custom exports use saved profiles.',
    `- **New in ${APP_VERSION.replace(/\.0$/, '')}:** editorial review (send a manuscript to an editor and work through their comments and suggestions), an export workspace with saved profiles, writing goals and statistics, customizable keyboard shortcuts, unified Settings, and the Press design.`,
    '- **Planning:** Rolling Outline gives each scene a planning state (Fixed, Flexible or Undefined), so it suits plotters, plantsers and discovery writers.',
    '- **Project types:** novels and screenplays.',
    '- **Privacy:** the desktop app stores projects locally as SQLite files and contains no analytics, telemetry or usage tracking. It uses the internet only for automatic updates and optional feedback. The website (kindlingwriter.com) uses Google Analytics 4; that is separate from the app.',
    '- **AI:** kindling does not generate, suggest or autocomplete prose, and does not use AI to analyse your writing.',
    '- **What it does not do:** no research folder like Scrivener\'s, no mobile or iPad app, and a simpler compile than Scrivener\'s for precise print formatting.',
    '- **Built with:** Rust and Tauri 2, Svelte 5, SQLite.',
    '- **Source:** https://github.com/smith-and-web/kindling',
    '- **Community:** Discord https://discord.gg/g7bkj4kY8w',
  ].join('\n');
}

const link = (path: string, title: string, note?: string) =>
  `- [${title}](${SITE}${path})${note ? `: ${note}` : ''}`;

async function posts() {
  return (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => new Date(b.data.publishedDate).getTime() - new Date(a.data.publishedDate).getTime());
}

async function docs() {
  const entries = await getCollection('docs');
  const path = (id: string) => `/${id.replace(/\/index$/, '')}/`;
  const rank = (p: string) => (p === '/docs/' ? 0 : p.startsWith('/docs/contributing/') ? 2 : 1);
  return entries
    .map((entry) => ({ entry, path: path(entry.id) }))
    // The docs index first and contributor pages last; guides alphabetically between.
    .sort((a, b) => rank(a.path) - rank(b.path) || a.path.localeCompare(b.path));
}

/* Markdown bodies, made readable outside the site: screenshots become their
   alt text, root-relative links become absolute, and headings drop one level
   so each page's sections sit under its `##` title. Code fences are left
   alone: a `#` there is a comment, not a heading. */
function portable(markdown: string): string {
  let fenced = false;
  return markdown
    .replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/g, '[Screenshot: $1]')
    .replace(/\]\(\//g, `](${SITE}/`)
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
      return !fenced && /^#{1,5} /.test(line) ? `#${line}` : line;
    })
    .join('\n')
    .trim();
}

export async function llmsTxt(): Promise<string> {
  const blog = await posts();
  const guides = await docs();
  return [
    '# kindling',
    '',
    `> ${SUMMARY}`,
    '',
    facts(),
    '',
    '## Key pages',
    '',
    ...KEY_PAGES.map((p) => link(p.path, p.title, p.note)),
    '',
    '## Documentation',
    '',
    ...guides.map(({ entry, path }) => link(path, entry.data.title, entry.data.description)),
    '',
    '## Blog',
    '',
    ...blog.map((post) => link(`/blog/${post.id}/`, post.data.title, post.data.description)),
    '',
    '## Full text',
    '',
    link('/llms-full.txt', 'llms-full.txt', 'these facts plus the full text of every documentation page and blog post'),
    '',
    '## Optional',
    '',
    ...SECONDARY_PAGES.map((p) => link(p.path, p.title, p.note)),
    '',
  ].join('\n');
}

export async function llmsFullTxt(): Promise<string> {
  const blog = await posts();
  const guides = await docs();
  return [
    '# kindling — full reference',
    '',
    `> ${SUMMARY}`,
    '',
    facts(),
    '',
    '## Key pages',
    '',
    ...KEY_PAGES.map((p) => link(p.path, p.title, p.note)),
    ...SECONDARY_PAGES.map((p) => link(p.path, p.title, p.note)),
    '',
    '---',
    '',
    '# Documentation',
    '',
    ...guides.flatMap(({ entry, path }) => [
      `## ${entry.data.title}`,
      '',
      `URL: ${SITE}${path}`,
      '',
      portable(entry.body ?? ''),
      '',
    ]),
    '---',
    '',
    '# Blog',
    '',
    ...blog.flatMap((post) => [
      `## ${post.data.title}`,
      '',
      `URL: ${SITE}/blog/${post.id}/`,
      `Published: ${post.data.publishedDate}${post.data.modifiedDate ? ` (updated ${post.data.modifiedDate})` : ''}`,
      '',
      portable(post.body ?? ''),
      '',
    ]),
  ].join('\n');
}
