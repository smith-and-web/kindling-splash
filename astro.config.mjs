import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const analyticsScript = readFileSync(new URL('./public/analytics.js', import.meta.url), 'utf8');

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
      ],
    }),
    svelte(),
    sitemap({
      filter: (page) => !['/download/thanks/', '/welcome/'].includes(new URL(page).pathname),
    }),
  ],
});
