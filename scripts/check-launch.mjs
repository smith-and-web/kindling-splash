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

  /* The demo tours itself when it is on screen. These checks drive it as a
     visitor would, so they run with reduced motion — which keeps the tour
     from starting and makes every transition instant — and wait for each
     state rather than for a fixed interval. The tour has its own checks
     below, in a context with motion. */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await go('/');
  assert.equal(state.tags.length, 1);
  /* Every beat starts closed, as the application rests. Nothing counts on load. */
  assert.equal(count('demo_interaction'), 0);
  const beat = (n) => page.locator(`#sample-beat-${n}`);
  const isOpen = (n, open) => page.waitForFunction(([id, want]) => document.getElementById(id).open === want, [`sample-beat-${n}`, open], { timeout: 3000 });
  assert.equal(await beat(1).evaluate((el) => el.open), false, 'beats must start closed');
  await beat(2).locator('> summary').click();
  await isOpen(2, true);
  assert.equal(count('demo_interaction'), 1);
  const opened = state.events.find((e) => e[1] === 'demo_interaction')[2];
  assert.equal(opened.interaction_type, 'open_beat');
  assert.equal(opened.beat_id, 'sample-beat-2');
  await beat(2).locator('> summary').click();
  await isOpen(2, false);
  assert.equal(count('demo_interaction'), 1, 'closing a beat must not count');
  /* The preview strip is inside the summary, so choosing it opens the beat. */
  await beat(1).locator('.ka-beat-preview').click();
  await isOpen(1, true);
  assert.equal(count('demo_interaction'), 2);
  pass('demo records a visitor opening a beat, from its row or its preview, never a close');

  /* Scenes switch from the outline. The chosen scene's column replaces the
     first's, and the choice is recorded once. The Seventh Step is in the
     chapter that starts open. */
  state.events.length = 0;
  const visibleSceneTitle = (p = page) => p.evaluate(() =>
    [...document.querySelectorAll('.ka-scene-header h3')].find((h) => h.getClientRects().length)?.textContent.trim());
  const showsScene = (title, p = page) => p.waitForFunction((want) =>
    [...document.querySelectorAll('.ka-scene-header h3')].find((h) => h.getClientRects().length)?.textContent.trim() === want, title, { timeout: 3000 });
  assert.equal(await visibleSceneTitle(), 'On the Cliff');
  await page.locator('.ka-tree label:has(input[value="seventh-step"])').click();
  await showsScene('The Seventh Step');
  assert.equal(count('demo_interaction'), 1);
  const chosen = state.events.find((e) => e[1] === 'demo_interaction')[2];
  assert.equal(chosen.interaction_type, 'select_scene');
  assert.equal(chosen.scene_id, 'seventh-step');
  /* A closed chapter expands to its own scenes. */
  await page.locator('.ka-tree details:has(input[value="low-tide"]) > summary').click();
  await page.locator('.ka-tree label:has(input[value="low-tide"])').click();
  await showsScene('Low Tide');
  assert.equal(count('demo_interaction'), 2);
  pass('demo switches scenes and expands chapters from the outline, recording each choice once');

  /* The tour, with motion. It starts once the demo is on screen and moves
     the workspace on its own; the tour fires no analytics. */
  const tour = await context({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const tp = await tour.ctx.newPage();
  const demoState = () => tp.evaluate(() => {
    const vis = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length);
    return JSON.stringify({
      scene: document.querySelector('input[name="sample-scene"]:checked').value,
      view: document.querySelector('input[name="sample-scene-view"]:checked').value,
      beats: vis('.ka-beat[open]').map((d) => d.id),
      refs: vis('.ka-reference[open]').length,
      chapters: [...document.querySelectorAll('.ka-tree > .ka-tree-list > li > details')].map((d) => d.open),
      scroll: Math.round(document.querySelector('.scene-body').scrollTop),
    });
  });
  await tp.goto(production + '/', { waitUntil: 'networkidle' });
  const atRest = await demoState();
  await tp.locator('#workspace').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await tp.waitForFunction(() => document.getElementById('workspace').dataset.tour === 'playing', null, { timeout: 5000 });
  await tp.waitForFunction(() => document.getElementById('sample-beat-1').open, null, { timeout: 10000 });
  assert.notEqual(await demoState(), atRest, 'the tour must move the workspace on its own');
  assert.equal(tour.events.filter((e) => e[1] === 'demo_interaction').length, 0, 'the tour must not record analytics');
  pass('the demo tours itself once on screen, without recording analytics');

  /* A click inside the demo stops the tour where it is: nothing resets to
     the start, and nothing moves afterwards. The badge is visible and inert,
     so the click itself changes nothing. */
  await tp.locator('.scene-bar .ka-badge').click();
  await tp.waitForFunction(() => document.getElementById('workspace').dataset.tour === 'stopped', null, { timeout: 3000 });
  await tp.waitForTimeout(600);
  const stoppedAt = await demoState();
  assert.notEqual(stoppedAt, atRest, 'stopping must not reset the demo to its start');
  await tp.waitForTimeout(7000);
  assert.equal(await demoState(), stoppedAt, 'a stopped tour must not move again');
  assert.equal((await tp.locator('.demo-tour-toggle').textContent()).trim(), 'Play tour', 'the control must offer to play again');
  pass('a click stops the tour in place, with no reset and no further motion');

  /* Play resumes from where it stopped, not from the start. */
  await tp.locator('.demo-tour-toggle').click();
  await tp.waitForFunction(() => document.getElementById('workspace').dataset.tour === 'playing', null, { timeout: 3000 });
  await tp.waitForFunction((was) => {
    const vis = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length);
    return JSON.stringify(vis('.ka-beat[open]').map((d) => d.id)) !== JSON.stringify(JSON.parse(was).beats)
      || document.querySelector('input[name="sample-scene-view"]:checked').value !== JSON.parse(was).view;
  }, stoppedAt, { timeout: 15000 });
  pass('Play resumes the tour from where it stopped');

  /* Reduced motion: the tour never starts on its own. */
  await tp.emulateMedia({ reducedMotion: 'reduce' });
  await tp.goto(production + '/', { waitUntil: 'networkidle' });
  await tp.locator('#workspace').evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const reducedStart = await demoState();
  await tp.waitForTimeout(5000);
  assert.equal(await demoState(), reducedStart, 'with reduced motion the tour must not start on its own');
  assert.notEqual(await tp.evaluate(() => document.getElementById('workspace').dataset.tour), 'playing');
  pass('with reduced motion the tour waits for the visitor');
  assert.deepEqual(tour.errors, [], `tour: ${tour.errors.join('; ')}`);
  await tour.ctx.close();

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

  /* The phone layout is decided before first paint (platform-detect.js). The
     /download/ notice used to be revealed by a module script after paint,
     pushing the platform picker down: PageSpeed measured CLS up to 0.15. The
     page's module scripts and web fonts are slowed here so it paints before
     they arrive, as on a slow phone. Measured against that old code under
     these conditions: CLS 0.268. Slowing only the fonts gives 0.018 either
     way, so both must be slowed for this to catch a regression. */
  const shifting = await context({ ...devices['iPhone 13'] });
  const slow = async (route) => { await new Promise((r) => setTimeout(r, 800)); return route.fallback(); };
  await shifting.ctx.route('**/*.woff2', slow);
  await shifting.ctx.route('**/_astro/*.js', slow);
  await shifting.ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
  });
  const sp = await shifting.ctx.newPage();
  await sp.goto(production + '/download/', { waitUntil: 'networkidle' });
  await sp.evaluate(() => document.fonts.ready); await sp.waitForTimeout(300);
  const phone = await sp.evaluate(() => {
    const notice = document.querySelector('[data-mobile-notice]');
    return { device: document.documentElement.dataset.device, shown: getComputedStyle(notice).display !== 'none',
      first: notice.parentElement.firstElementChild === notice || getComputedStyle(notice).order === '-1', cls: window.__cls };
  });
  assert.equal(phone.device, 'mobile');
  assert.ok(phone.shown && phone.first, 'phone: the desktop-app notice must lead the download stack');
  assert.ok(phone.cls < 0.05, `phone /download/ layout shift ${phone.cls.toFixed(3)} (budget 0.05)`);
  /* The collapsed nav's button works before website.js arrives (Press's
     website-early.js): with the page bundle held back, Menu still opens. */
  const early = await context({ ...devices['iPhone 13'] });
  await early.ctx.route('**/_astro/*.js', async (route) => { await new Promise((r) => setTimeout(r, 4000)); return route.fallback(); });
  const ep = await early.ctx.newPage();
  await ep.goto(production + '/download/', { waitUntil: 'commit' });
  await ep.locator('[data-pw-menu]').waitFor({ state: 'visible', timeout: 3000 });
  assert.equal(await ep.locator('[data-pw-nav]').getAttribute('data-pw-ready'), null, 'website.js should not have bound yet');
  assert.equal(await ep.locator('[data-pw-links]').isVisible(), false, 'phone: the nav must be collapsed in the first frame');
  await ep.locator('[data-pw-menu]').click();
  assert.equal(await ep.locator('[data-pw-links]').isVisible(), true, 'phone: Menu must open before website.js binds');
  assert.equal(await ep.locator('[data-pw-menu]').getAttribute('aria-expanded'), 'true');
  await early.ctx.close();
  await page.goto(production + '/download/', { waitUntil: 'networkidle' });
  const desktop = await page.evaluate(() => ({
    device: document.documentElement.dataset.device, os: document.documentElement.dataset.os,
    shown: getComputedStyle(document.querySelector('[data-mobile-notice]')).display !== 'none',
    checked: document.querySelector('input[name="platform"]:checked')?.value,
  }));
  assert.equal(desktop.device, 'desktop');
  assert.equal(desktop.shown, false, 'desktop: the mobile notice must not render');
  assert.equal(desktop.checked, desktop.os ?? 'mac', 'desktop: the detected OS is pre-selected');
  pass(`phone layout is decided before first paint: /download/ CLS ${phone.cls.toFixed(3)} with slow scripts and fonts; Menu works before website.js; desktop pre-selects ${desktop.checked}`);

  const noJS = await context({ javaScriptEnabled: false });
  const np = await noJS.ctx.newPage();
  await np.goto(production + '/download/');
  assert.equal(await np.locator('[data-mobile-notice]').isVisible(), false, 'no-JS: the mobile notice must stay hidden');
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

  /* The demo is native radios and `<details>`; the tour is an enhancement.
     Without JavaScript every part still works, and the tour control — which
     would pause nothing — stays hidden. */
  await np.goto(production + '/');
  await np.locator('.ka-tree label:has(input[value="seventh-step"])').click();
  assert.equal(await visibleSceneTitle(np), 'The Seventh Step', 'no-JS: a scene must switch from the outline');
  await np.locator('#sample-beat-4 > summary').click();
  assert.equal(await np.locator('#sample-beat-4').evaluate((el) => el.open), true, 'no-JS: a beat must open');
  await np.locator('label.ka-segment:has(input[value="page"])').click();
  assert.equal(await np.locator('[data-scene="seventh-step"] .scene-page').isVisible(), true, 'no-JS: the Page view must show');
  assert.equal(await np.locator('.demo-tour-toggle').isVisible(), false, 'no-JS: there is no tour to pause');
  pass('the demo works without JavaScript: scenes, beats and the Page view');

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
        title: doc.querySelector('title')?.textContent.trim(),
        description: doc.querySelector('meta[name=description]')?.getAttribute('content'),
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
  // No page marked noindex may be listed in the sitemap: that is a contradiction.
  for (const p of pages.filter((p) => /noindex/.test(p.robots ?? '') && p.pathname.endsWith('/'))) {
    assert.ok(!sitemap.includes(`<loc>${production}${p.pathname}</loc>`), `${p.pathname} is noindex but listed in the sitemap`);
  }
  assert.ok(sitemap.includes('/free-scrivener-alternative/'));
  // Every URL carries a freshness date, and they are not all one date: a
  // shallow checkout would stamp every page with the build day.
  const entries = [...sitemap.matchAll(/<url>(.*?)<\/url>/g)].map(([, body]) => body);
  for (const body of entries) {
    const lastmod = body.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    assert.ok(lastmod && !Number.isNaN(Date.parse(lastmod)), `sitemap entry without a valid <lastmod>: ${body.slice(0, 80)}`);
  }
  const days = new Set(entries.map((body) => body.match(/<lastmod>(\d{4}-\d{2}-\d{2})/)?.[1]));
  assert.ok(days.size > 1, 'every sitemap <lastmod> is the same day; is the checkout shallow?');
  // The comparison and landing pages are one click from everywhere (Footer.astro `guides`).
  const guides = ['/plottr-vs-scrivener/', '/free-scrivener-alternative/', '/story-outlining-software/',
    '/blog/best-plottr-alternatives-for-fiction-writers/', '/blog/best-scrivener-alternatives-for-plotters/',
    '/blog/best-story-outlining-software-2026/'];
  for (const p of pages.filter((p) => p.pathname.endsWith('/') && !p.pathname.startsWith('/docs/') && !/noindex/.test(p.robots ?? ''))) {
    for (const guide of guides) assert.ok(p.links.includes(guide), `${p.pathname} does not link ${guide}`);
  }
  for (const p of pages.filter((p) => p.pathname.startsWith('/blog/') && p.pathname.endsWith('/') && p.pathname !== '/blog/')) {
    const related = p.links.filter((href) => href.startsWith('/blog/') && href !== '/blog/' && href !== p.pathname);
    assert.ok(new Set(related).size >= 3, `${p.pathname} links fewer than 3 other posts`);
  }
  assert.ok(pages.find((p) => p.pathname === '/').links.includes('/plottr-vs-scrivener/'));
  // llms.txt and llms-full.txt are generated (src/data/llms.ts). Every page
  // the site wants found is listed, every listed URL resolves to a built page,
  // and none is a `.html` redirect stub — the state the hand-kept files drifted into.
  const llms = await readFile('dist/llms.txt', 'utf8');
  const llmsFull = await readFile('dist/llms-full.txt', 'utf8');
  for (const [name, text] of [['llms.txt', llms], ['llms-full.txt', llmsFull]]) {
    const listed = [...text.matchAll(/\]\((https:\/\/kindlingwriter\.com[^)\s]*)\)/g)].map(([, url]) => new URL(url).pathname);
    assert.ok(listed.length > 0, `${name} lists no site URLs`);
    for (const pathname of listed) {
      assert.ok(!pathname.endsWith('.html'), `${name} links a .html stub: ${pathname}`);
      const disk = path.join(root, 'dist', decodeURIComponent(pathname));
      try { await access(disk); } catch {
        try { await access(path.join(disk, 'index.html')); } catch { assert.fail(`${name} links a missing page: ${pathname}`); }
      }
    }
    assert.ok(!/\]\(\/[^)]/.test(text), `${name} contains a root-relative link`);
  }
  for (const body of entries) {
    const loc = body.match(/<loc>([^<]+)<\/loc>/)[1];
    assert.ok(llms.includes(`](${loc})`), `llms.txt does not list ${loc}`);
  }
  // Titles and descriptions: the marketing name is "kindling Writer", suffixed
  // only where it fits (CLAUDE.md, Decisions on record). Indexable marketing
  // pages hold titles to 60 characters and descriptions to 120-160; blog posts
  // show their bare headline; docs titles end "| kindling Writer Docs".
  for (const p of pages.filter((p) => p.pathname.endsWith('/') && !/noindex/.test(p.robots ?? ''))) {
    assert.ok(p.title && !/kindling (Blog|Docs)\b/.test(p.title), `${p.pathname}: retired title suffix in "${p.title}"`);
    if (p.pathname.startsWith('/docs/')) {
      assert.ok(p.title.endsWith('| kindling Writer Docs'), `${p.pathname}: docs title "${p.title}"`);
    } else if (!/^\/blog\/[^/]+\/$/.test(p.pathname)) {
      assert.ok(p.title.length <= 60, `${p.pathname}: title is ${p.title.length} characters: "${p.title}"`);
    }
    const d = p.description ?? '';
    assert.ok(d.length >= 120 && d.length <= 160, `${p.pathname}: description is ${d.length} characters`);
  }

  // Structured data (src/data/schema.ts): valid JSON, typed nodes, absolute
  // URLs, the organisation on the home page, and an article plus a breadcrumb
  // ending at the page itself on every blog post and docs page.
  const typesOn = new Map();
  for (const filename of files) {
    const pathname = '/' + path.relative(path.join(root, 'dist'), filename).split(path.sep).join('/').replace(/index\.html$/, '');
    if (!pathname.endsWith('/')) continue;
    const blocks = [...(await readFile(filename, 'utf8')).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
    const nodes = blocks.flatMap(([, json]) => {
      let doc; try { doc = JSON.parse(json); } catch { assert.fail(`${pathname}: invalid JSON-LD`); }
      return doc['@graph'] ?? [doc];
    });
    for (const node of nodes) assert.ok(node['@type'], `${pathname}: JSON-LD node without @type`);
    const urls = JSON.stringify(nodes).match(/"(?:url|item|@id)":"[^"]*"/g) ?? [];
    for (const u of urls) assert.match(u, /:"https:\/\//, `${pathname}: relative URL in JSON-LD ${u}`);
    const types = nodes.map((n) => n['@type']);
    typesOn.set(pathname, types);
    assert.ok(types.filter((t) => t === 'SoftwareApplication').length <= 1, `${pathname}: more than one SoftwareApplication`);
    const app = nodes.find((n) => n['@type'] === 'SoftwareApplication');
    if (app) {
      const shot = new URL(app.screenshot.url).pathname;
      await access(path.join(root, 'dist', shot)).catch(() => assert.fail(`${pathname}: screenshot ${shot} is not in the build`));
    }
    const article = /^\/blog\/[^/]+\/$/.test(pathname) ? 'BlogPosting' : pathname.startsWith('/docs/') ? 'TechArticle' : null;
    if (article) {
      const node = nodes.find((n) => n['@type'] === article);
      assert.ok(node, `${pathname}: no ${article}`);
      if (article === 'BlogPosting') assert.ok(node.image, `${pathname}: BlogPosting without an image`);
      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList')?.itemListElement;
      assert.ok(crumbs?.length >= 2, `${pathname}: no breadcrumb`);
      assert.equal(crumbs.at(-1).item, production + pathname, `${pathname}: breadcrumb must end at the page`);
    }
  }
  for (const type of ['Organization', 'WebSite', 'SoftwareApplication']) {
    assert.ok(typesOn.get('/').includes(type), `home page JSON-LD has no ${type}`);
  }

  // The blog feed lists every published post, each linking a built page, and
  // every marketing page advertises it.
  const feed = await readFile('dist/blog/rss.xml', 'utf8');
  const feedLinks = [...feed.matchAll(/<item>.*?<link>([^<]+)<\/link>/g)].map(([, url]) => new URL(url).pathname);
  const postPages = pages.filter((p) => /^\/blog\/[^/]+\/$/.test(p.pathname)).map((p) => p.pathname);
  assert.deepEqual([...feedLinks].sort(), [...postPages].sort(), 'blog/rss.xml must list exactly the published posts');
  assert.match(await readFile('dist/index.html', 'utf8'), /<link rel="alternate" type="application\/rss\+xml"[^>]*href="\/blog\/rss\.xml"/);
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.match(robots, /Sitemap: https:\/\/kindlingwriter\.com\/sitemap-index\.xml/);
  assert.equal((await fetch(local + '/sitemap-index.xml')).status, 200);
  pass(`${pages.length} HTML files: internal targets, article metadata, completion noindex, sitemap lastmod, guide and related-post links, contextual inlinks, llms.txt coverage, structured data, titles and descriptions`);
  assert.deepEqual([...state.errors, ...mobile.errors, ...shifting.errors, ...noJS.errors], []);
  pass('no browser JavaScript errors');
  console.log(`\n${checks} launch checks passed. No analytics collection, real downloads, or external form submissions.`);
} finally {
  await browser?.close();
  server.kill();
}
