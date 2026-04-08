import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kindlingwriter.com',
  trailingSlash: 'always',

  integrations: [
    starlight({
      title: 'Kindling Docs',
      disable404Route: true,
      logo: {
        src: './src/assets/kindling-logo.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/smith-and-web/kindling' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/g7bkj4kY8w' },
      ],
      editLink: {
        baseUrl: 'https://github.com/smith-and-web/kindling-splash/edit/main/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'docs/getting-started' },
            { label: 'Installation', slug: 'docs/installation' },
          ],
        },
        {
          label: 'Using Kindling',
          items: [
            { label: 'Importing Projects', slug: 'docs/importing-projects' },
            { label: 'Scene Workflow', slug: 'docs/scene-workflow' },
            { label: 'References', slug: 'docs/references' },
            { label: 'Exporting Projects', slug: 'docs/exporting-projects' },
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
          tag: 'script',
          attrs: { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=G-VJQ72G87FE' },
        },
        {
          tag: 'script',
          content: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-VJQ72G87FE');`,
        },
      ],
    }),
    svelte(),
    sitemap(),
  ],
});
