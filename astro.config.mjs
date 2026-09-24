import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const analyticsScript = readFileSync(new URL('./public/analytics.js', import.meta.url), 'utf8');

/*
 * Sitemap <lastmod>. Without it Google has no freshness signal for any URL,
 * and on a small site that leaves new pages sitting in "Discovered – currently
 * not indexed".
 *
 * Blog posts use their own frontmatter (`modifiedDate`, else `publishedDate`),
 * the dates the post already shows. Every other page uses the last commit that
 * touched its source file. That needs full history in CI: a shallow checkout
 * would give every page the deploy date, which is worse than no lastmod at
 * all. See `fetch-depth: 0` in `.github/workflows/deploy.yml`.
 */
const blogDir = new URL('./src/content/blog/', import.meta.url);
const blogDates = new Map(
  readdirSync(blogDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => [name, readFileSync(new URL(name, blogDir), 'utf8')])
    .filter(([, source]) => !/^draft:\s*true\b/m.test(source))
    .map(([name, source]) => {
      const field = (key) => source.match(new RegExp(`^${key}:\\s*"?([\\d-]+)"?`, 'm'))?.[1];
      return [name.replace(/\.md$/, ''), field('modifiedDate') ?? field('publishedDate')];
    }),
);

function lastCommitDate(file) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { encoding: 'utf8' }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function lastModified(pathname) {
  const route = pathname.replace(/^\/|\/$/g, '');
  const post = route.match(/^blog\/([^/]+)$/);
  if (post) return blogDates.get(post[1]);
  if (route === 'blog') return [...blogDates.values()].sort().at(-1);
  const candidates = route.startsWith('docs')
    ? [`src/content/docs/${route === 'docs' ? 'docs/index' : route}.md`, `src/content/docs/${route}.mdx`]
    : [route ? `src/pages/${route}/index.astro` : 'src/pages/index.astro', `src/pages/${route}.astro`];
  const source = candidates.find((file) => existsSync(file));
  return source ? lastCommitDate(source) : undefined;
}

export default defineConfig({
  site: 'https://kindlingwriter.com',
  trailingSlash: 'always',

  integrations: [
    starlight({
      title: 'kindling Docs',
      disable404Route: true,
      logo: {
        // The approved book-and-flame emblem at its original geometry. The
        // asset this replaced was a cropped viewBox of the same original,
        // which the design contract forbids; it is also verified by
        // `npm run check:design-system`, which a hand-copy would not be.
        src: './src/vendor/press/assets/svg/kindling-mark.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/smith-and-web/kindling' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/g7bkj4kY8w' },
      ],
      editLink: {
        baseUrl: 'https://github.com/smith-and-web/kindling-splash/edit/main/',
      },
      components: {
        // Docs are light-only; see the component for why.
        ThemeSelect: './src/components/docs/ThemeSelect.astro',
        // Starlight's head plus per-page TechArticle and breadcrumb JSON-LD.
        Head: './src/components/docs/Head.astro',
      },
      sidebar: [
        {
          label: 'kindling',
          items: [
            { label: 'Back to kindlingwriter.com', link: '/' },
            { label: 'Download kindling', link: '/download/' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'docs/getting-started' },
            { label: 'Installation', slug: 'docs/installation' },
          ],
        },
        {
          label: 'Using kindling',
          items: [
            { label: 'Importing Projects', slug: 'docs/importing-projects' },
            { label: 'Scene Workflow', slug: 'docs/scene-workflow' },
            { label: 'Writing Goals & Statistics', slug: 'docs/writing-progress' },
            { label: 'Editorial Review', slug: 'docs/editorial-review' },
            { label: 'References', slug: 'docs/references' },
            { label: 'Exporting Projects', slug: 'docs/exporting-projects' },
            { label: 'Export Workspace', slug: 'docs/export-workspace' },
            { label: 'Sync & Reimport', slug: 'docs/sync-and-reimport' },
            { label: 'Settings', slug: 'docs/settings' },
            { label: 'Troubleshooting', slug: 'docs/troubleshooting' },
          ],
        },
        {
          label: 'Contributing',
          collapsed: true,
          items: [
            { label: 'Architecture', slug: 'docs/contributing/architecture' },
          ],
        },
      ],
      customCss: [
        './src/styles/starlight-overrides.css',
      ],
      head: [
        {
          // Pin the docs to the Press light theme. Written to localStorage as
          // well as the attribute so it holds whichever order this runs in
          // relative to Starlight's own theme script.
          tag: 'script',
          content: `try{localStorage.setItem('starlight-theme','light')}catch(e){};document.documentElement.dataset.theme='light';`,
        },
        {
          tag: 'script',
          content: analyticsScript,
        },
        // Starlight declares a large-image Twitter card but ships no image, so
        // shared docs links rendered blank. The marketing pages' card, absolute.
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://kindlingwriter.com/og-image.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://kindlingwriter.com/og-image.png' } },
      ],
    }),
    svelte(),
    sitemap({
      // Every noindex page stays out: a sitemap URL marked noindex is a contradiction.
      filter: (page) => !['/download/thanks/', '/welcome/', '/feedback/'].includes(new URL(page).pathname),
      serialize(item) {
        const lastmod = lastModified(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
