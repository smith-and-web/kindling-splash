import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import path from 'node:path';
import { chromium, devices } from 'playwright';

// Exercise built pages with an isolated browser. Every production-domain request
// is served from the local preview; analytics, forms, and binaries never go live.
const root = process.cwd();
const probe = net.createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const local = `http://127.0.0.1:${port}`;
const production = 'https://kindlingwriter.com';
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'pipe' });
let serverOutput = '';
server.stdout.on('data', (data) => { serverOutput += data; });
server.stderr.on('data', (data) => { serverOutput += data; });
let browser;
let checks = 0;
const pass = (label) => { checks++; console.log(`PASS ${label}`); };

try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(local)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Preview did not start: ${serverOutput}`);
  let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (!executablePath && process.platform === 'darwin') {
    const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    try { await access(chrome); executablePath = chrome; } catch { /* use Playwright's installed browser */ }
  }
  browser = await chromium.launch({ executablePath });

  async function context(options = {}) {
    const ctx = await browser.newContext(options);
    const events = [], binaries = [], tags = [], errors = [];
    await ctx.exposeBinding('recordAuditEvent', (_, args) => { if (args[0] === 'event') events.push(args); });
    await ctx.addInitScript(() => {
      const layer = [];
      const push = layer.push.bind(layer);
      layer.push = (...items) => {
        for (const item of items) window.recordAuditEvent(Array.from(item));
        return push(...items);
      };
      window.dataLayer = layer;
    });
    await ctx.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'kindlingwriter.com' || url.origin === local || url.hostname.endsWith('.example')) {
        const response = await route.fetch({ url: local + url.pathname + url.search });
        return route.fulfill({ response });
      }
      if (url.hostname === 'www.googletagmanager.com') {
        tags.push(url.href);
        return route.fulfill({ contentType: 'application/javascript', body: '' });
      }
      if (url.hostname === 'github.com' && url.pathname.includes('/download/')) {
        binaries.push(url.href);
        return route.fulfill({ status: 204, body: '' });
      }
      return route.abort();
    });
    ctx.on('page', (page) => page.on('pageerror', (error) => errors.push(error.message)));
    return { ctx, events, binaries, tags, errors };
  }
  const state = await context({ viewport: { width: 1440, height: 1000 } });
  const page = await state.ctx.newPage();
  const go = async (pathname) => { await page.goto(production + pathname, { waitUntil: 'networkidle' }); };
  const count = (name) => state.events.filter((event) => event[1] === name).length;

  await page.goto(local, { waitUntil: 'networkidle' });
  await page.goto(local + '/docs/getting-started/', { waitUntil: 'networkidle' });
  await page.goto('https://preview.example/', { waitUntil: 'networkidle' });
  assert.equal(state.tags.length, 0);
  assert.equal(await page.evaluate(() => typeof window.gtag), 'undefined');
  pass('local marketing/docs and preview hosts do not load production analytics');

  await go('/');
  assert.equal(state.tags.length, 1);
  assert.equal(count('demo_interaction'), 0);
  await page.locator('label[for="sample-beat-2"]').click();
  await page.waitForTimeout(50);
  assert.equal(count('demo_interaction'), 1);
  await page.locator('label[for="sample-beat-2"]').click();
  await page.waitForTimeout(50);
  assert.equal(count('demo_interaction'), 1);
  pass('demo records a changed beat once, never its initial selection');

  state.events.length = 0;
  await page.locator('.navbar-cta').click();
  await page.waitForLoadState('networkidle');
  assert.equal(count('download_cta_click'), 1);
  assert.equal(state.events.find((e) => e[1] === 'download_cta_click')[2].cta_location, 'navbar');
  pass('navbar CTA is tracked once');

  for (const [url, selector, location] of [
    ['/features/', '[data-cta-location="features_hero"]', 'features_hero'],
    ['/', '.smart-download .alt-platforms', 'hero_all_platforms'],
    ['/docs/getting-started/', 'a[href="/download/"]', 'docs'],
    ['/blog/best-plottr-alternatives-for-fiction-writers/', '.article-content a[href="/download/"]', 'blog_inline'],
    ['/', 'footer a[href="/download/"]', 'footer'],
  ]) {
    await go(url); state.events.length = 0;
    await page.locator(selector).first().click(); await page.waitForLoadState('networkidle');
    assert.equal(count('download_cta_click'), 1, `${url} duplicate/missing CTA`);
    assert.equal(state.events[0][2].cta_location, location);
  }
  pass('existing inline, all-platform, docs, article, and footer CTAs keep distinct single events');

  for (const os of ['mac', 'windows', 'linux']) {
    await go('/download/'); state.events.length = 0; state.binaries.length = 0;
    /* Every platform's installer is rendered; the checked radio reveals one.
       Select, then assert exactly one action is operable and it is that one. */
    await page.locator(`#platform-${os}`).check();
    assert.equal(await page.locator('a[data-platform]:visible').count(), 1, `${os} must expose one action`);
    assert.equal(await page.locator(`a[data-platform="${os}"]`).getAttribute('href'),
      `https://github.com/smith-and-web/kindling/releases/latest/download/${{mac:'Kindling_1.3.0_universal.dmg',windows:'Kindling_1.3.0_x64-setup.exe',linux:'Kindling_1.3.0_amd64.AppImage'}[os]}`);
    await page.locator(`a[data-platform="${os}"]`).click(); await page.waitForLoadState('networkidle');
    assert.equal(count('download_click'), 1);
    assert.equal(count('download_cta_click'), 1);
    assert.equal(count('download_initiated'), 1);
    assert.equal(state.events.find((e) => e[1] === 'download_initiated')[2].os_platform, os);
    assert.equal(state.binaries.length, 1);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(count('download_initiated'), 1);
    assert.equal(state.binaries.length, 1);
  }
  pass('all platform actions dispatch once; refreshing thanks cannot repeat downloads or initiation');

  await go('/'); state.events.length = 0; state.binaries.length = 0;
  await page.locator('.smart-download .download-btn').first().click(); await page.waitForLoadState('networkidle');
  assert.equal(count('download_click'), 1); assert.equal(count('download_cta_click'), 1);
  assert.equal(count('download_initiated'), 1); assert.equal(state.binaries.length, 1);
  pass('hydrated desktop hero completes the instrumented download path');

  for (const suffix of ['', '?os=mac', '?os=invalid']) {
    state.events.length = 0; state.binaries.length = 0;
    await go('/download/thanks/' + suffix);
    assert.equal(count('download_initiated'), 0); assert.equal(state.binaries.length, 0);
  }
  await page.evaluate(() => sessionStorage.setItem('kindling:pending-download', JSON.stringify({ os: 'mac', location: 'hero', createdAt: Date.now() - 600000 })));
  await go('/download/thanks/?os=mac');
  assert.equal(count('download_initiated'), 0); assert.equal(state.binaries.length, 0);
  pass('direct, invalid, and stale thank-you visits cannot claim or trigger a download');

  await go('/welcome/');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(count('email_signup_confirmed'), 0);
  state.events.length = 0;
  await page.locator('a[data-platform="windows"]').click(); await page.waitForLoadState('networkidle');
  assert.equal(count('download_click'), 1); assert.equal(count('download_initiated'), 1);
  await page.locator('#newsletter-email').fill('test@example.invalid');
  await page.locator('form[data-newsletter-form]').evaluate((form) => form.addEventListener('submit', (event) => event.preventDefault()));
  await page.locator('form[data-newsletter-form] button').click(); await page.waitForTimeout(50);
  assert.equal(count('newsletter_submit'), 1); assert.equal(count('email_signup_confirmed'), 0);
  assert.ok(!JSON.stringify(state.events).includes('test@example.invalid'));
  pass('newsletter records submission without email data or unverified signup confirmation');

  await go('/download/'); state.events.length = 0; state.binaries.length = 0;
  await page.evaluate(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('storage denied'); }, configurable: true }));
  await page.locator('#platform-mac').check();
  await page.locator('a[data-platform="mac"]').click(); await page.waitForTimeout(250);
  assert.equal(state.binaries.length, 1); assert.equal(count('download_click'), 1);
  assert.equal(count('download_initiated'), 0);
  pass('storage-denied visitors retain the direct installer fallback');

  const mobile = await context({ ...devices['iPhone 13'] });
  await mobile.ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  const mp = await mobile.ctx.newPage();
  for (const [pathname, selector] of [['/', '.smart-download .share-btn'], ['/download/', '[data-copy-link]']]) {
    await mp.goto(production + pathname, { waitUntil: 'networkidle' }); mobile.events.length = 0;
    await mp.locator(selector).first().click(); await mp.waitForTimeout(50);
    assert.equal(mobile.events.filter((e) => e[1] === 'mobile_share').length, 1);
    assert.equal(mobile.events.find((e) => e[1] === 'mobile_share')[2].method, 'clipboard');
    assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await mp.goto(production, { waitUntil: 'networkidle' }); mobile.events.length = 0;
  await mp.evaluate(() => Object.defineProperty(navigator, 'share', { value: async () => { throw new DOMException('cancelled', 'AbortError'); }, configurable: true }));
  await mp.locator('.smart-download .share-btn').first().click(); await mp.waitForTimeout(50);
  assert.equal(mobile.events.filter((e) => e[1] === 'mobile_share').length, 0);
  await mp.evaluate(() => Object.defineProperty(navigator, 'share', { value: async () => {}, configurable: true }));
  await mp.locator('.smart-download .share-btn').first().click(); await mp.waitForTimeout(50);
  assert.equal(mobile.events.filter((e) => e[1] === 'mobile_share').length, 1);
  pass('mobile copy and native-share success are tracked; cancelled shares are not');

  const noJS = await context({ javaScriptEnabled: false });
  const np = await noJS.ctx.newPage();
  await np.goto(production + '/download/');
  /* The platform choice is CSS-driven precisely so it survives here: check the
     radio, and the matching installer — a real anchor to a real binary — is
     what becomes visible. Every platform, not just the one checked in markup. */
  for (const os of ['linux', 'windows', 'mac']) {
    noJS.binaries.length = 0;
    await np.locator(`#platform-${os}`).check();
    assert.equal(await np.locator('a[data-platform]:visible').count(), 1, `no-JS ${os} must expose one action`);
    await np.locator(`a[data-platform="${os}"]`).click(); await np.waitForTimeout(200);
    assert.equal(noJS.binaries.length, 1, `no-JS ${os} must reach a binary`);
  }
  pass('downloads work without JavaScript, for every platform the visitor can choose');

  async function htmlFiles(dir) {
    const files = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const filename = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...await htmlFiles(filename));
      else if (filename.endsWith('.html')) files.push(filename);
    }
    return files;
  }
  const files = await htmlFiles(path.join(root, 'dist'));
  const pages = [];
  for (const filename of files) {
    const pathname = '/' + path.relative(path.join(root, 'dist'), filename).split(path.sep).join('/').replace(/index\.html$/, '');
    const html = await readFile(filename, 'utf8');
    const parsed = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return {
        canonical: doc.querySelector('link[rel=canonical]')?.getAttribute('href'),
        robots: doc.querySelector('meta[name=robots]')?.getAttribute('content'),
        published: doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content'),
        links: [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
      };
    }, html);
    pages.push({ pathname, ...parsed });
    for (const href of parsed.links) {
      const target = new URL(href, production + pathname);
      if (target.origin !== production) continue;
      const disk = path.join(root, 'dist', decodeURIComponent(target.pathname));
      try { await access(disk); } catch {
        try { await access(path.join(disk, 'index.html')); } catch { assert.fail(`Broken link: ${pathname} -> ${href}`); }
      }
    }
  }
  for (const pathname of ['/download/thanks/', '/welcome/']) {
    assert.match(pages.find((p) => p.pathname === pathname).robots, /noindex/);
  }
  for (const p of pages.filter((p) => p.pathname.startsWith('/blog/') && p.pathname.endsWith('/') && p.pathname !== '/blog/')) {
    assert.ok(p.published, `${p.pathname} missing article head slot`);
    assert.equal(p.canonical, production + p.pathname);
  }
  const incoming = pages.filter((p) => p.links.includes('/free-scrivener-alternative/'));
  assert.ok(incoming.length >= 3, 'Scrivener landing page needs contextual referring pages');
  const sitemap = await readFile('dist/sitemap-0.xml', 'utf8');
  assert.ok(!sitemap.includes('/download/thanks/') && !sitemap.includes('/welcome/'));
  assert.ok(sitemap.includes('/free-scrivener-alternative/'));
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.match(robots, /Sitemap: https:\/\/kindlingwriter\.com\/sitemap-index\.xml/);
  assert.equal((await fetch(local + '/sitemap-index.xml')).status, 200);
  pass(`${pages.length} HTML files: internal targets, article metadata, completion noindex, sitemap and contextual inlinks`);
  assert.deepEqual([...state.errors, ...mobile.errors, ...noJS.errors], []);
  pass('no browser JavaScript errors');
  console.log(`\n${checks} launch checks passed. No analytics collection, real downloads, or external form submissions.`);
} finally {
  await browser?.close();
  server.kill();
}
