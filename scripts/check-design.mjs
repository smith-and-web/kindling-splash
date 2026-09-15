/* Check the visual contract in a real browser.
 *
 * `npm run build` proves the site compiles. It proves nothing about whether the
 * site adopted Press: a page can build perfectly with the wrong font, a stale
 * preload, a cropped screenshot or an uppercase brand name. This asserts the
 * things `scripts/check-launch.mjs` deliberately does not — computed type
 * roles, semantic colours, brand case, asset resolution, target sizes, focus,
 * figure integrity and narrow layout.
 *
 *   npm run test:design            build, then check
 *   node scripts/check-design.mjs  check an already-built dist/
 *
 * Every expected value below is read from the vendored token file rather than
 * typed in, so a token change in Press moves the expectation with it.
 */
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { chromium } from 'playwright';

const root = process.cwd();
const tokens = await readFile('src/vendor/press/design-system/tokens.css', 'utf8');
const token = (name) => {
  const match = tokens.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `Token --${name} not found in the vendored tokens.`);
  return match[1].trim();
};
const hex = (value) => {
  const [, r, g, b] = value.match(/^#(\w\w)(\w\w)(\w\w)$/);
  return `rgb(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)})`;
};

const PAPER = hex(token('paper'));
const INK = hex(token('ink'));
const ACCENT_TEXT = hex(token('accent-text'));
const ON_ACCENT = hex(token('raised'));
const TARGET = parseInt(token('control-target'), 10);

/* Routes worth checking, and what each one is evidence for. */
const ROUTES = [
  ['/', 'home: hero, writing demo, feature sequence, closing action'],
  ['/features/', 'feature sequence and product figures'],
  ['/compare/', 'comparison tables'],
  ['/download/', 'platform actions and disclosures'],
  ['/download/thanks/', 'completion page'],
  ['/feedback/', 'the full form'],
  ['/faq/', 'long reading page'],
  ['/blog/best-plottr-alternatives-for-fiction-writers/', 'an article'],
  ['/docs/getting-started/', 'docs'],
  ['/docs/settings/', 'a docs page with screenshots and tables'],
  ['/welcome/', 'post-install'],
  ['/privacy/', 'a legal page'],
  ['/404/', 'the not-found page'],
];
const WIDTHS = [375, 768, 820, 1024, 1440];

const probe = net.createServer();
probe.listen(0, '127.0.0.1');
await once(probe, 'listening');
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const local = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'pipe' });
let log = '';
server.stdout.on('data', (d) => { log += d; });
server.stderr.on('data', (d) => { log += d; });

let browser;
let checks = 0;
const failures = [];
const pass = (label) => { checks++; console.log(`PASS ${label}`); };
const check = (condition, message) => { if (!condition) failures.push(message); };

try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(local)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, `Preview did not start: ${log}`);

  let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (!executablePath && process.platform === 'darwin') {
    const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    try { await access(chrome); executablePath = chrome; } catch { /* Playwright's own */ }
  }
  browser = await chromium.launch({ executablePath });

  /* Nothing here should reach the network. A missing local asset must fail;
     a third-party request is a finding in its own right. */
  const external = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    /* Turnstile is the one deliberate third party, and only on /feedback/ and
       the feedback dialog. It is never contacted during this check. */
    if (url.hostname === 'challenges.cloudflare.com') return route.abort();
    if (url.origin !== local) { external.push(url.href); return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage();
  const go = async (path) => {
    const response = await page.goto(local + path, { waitUntil: 'load' });
    check(response.ok(), `${path}: responded ${response.status()}`);
    await page.waitForTimeout(250);
  };

  /* ---- 1. Type roles ---------------------------------------------------- */
  for (const [path] of ROUTES) {
    await go(path);
    const roles = await page.evaluate(() => {
      const family = (el) => el && getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '');
      const visible = (el) => el && el.getClientRects().length > 0;
      const pick = (selector) => [...document.querySelectorAll(selector)].find(visible);
      return {
        heading: family(pick('h1')) ?? family(pick('h2')),
        docsProse: family(pick('.sl-markdown-content p')),
        articleProse: family(pick('.article-content p')),
        navLink: family(pick('.pw-nav-links a, .sidebar-content a')),
        action: family(pick('.pw-button, .ka-button, .download-btn')),
        manuscript: family(pick('.pw-writing--app .pw-draft p')),
        code: family(pick('code')),
      };
    });
    check(roles.heading === 'Fraunces', `${path}: headings are ${roles.heading}, not Fraunces`);
    check(!roles.navLink || roles.navLink === 'Inter', `${path}: navigation is ${roles.navLink}, not Inter`);
    check(!roles.action || roles.action === 'Inter', `${path}: actions are ${roles.action}, not Inter`);
    check(!roles.docsProse || roles.docsProse === 'Newsreader', `${path}: docs prose is ${roles.docsProse}, not Newsreader`);
    check(!roles.articleProse || roles.articleProse === 'Newsreader', `${path}: article prose is ${roles.articleProse}, not Newsreader`);
    check(!roles.manuscript || roles.manuscript === 'Newsreader', `${path}: manuscript sample is ${roles.manuscript}, not Newsreader`);
    check(!roles.code || roles.code === 'Monaco', `${path}: code is ${roles.code}, not the mono role`);
  }
  pass(`${ROUTES.length} routes: Fraunces headings, Inter controls, Newsreader reading, mono code`);

  /* `/404/` is a real built route; an unknown path is what visitors actually
     hit, and it must serve that page rather than the server's own default. */
  const missing = await page.goto(local + '/no-such-page/', { waitUntil: 'load' });
  check(missing.status() === 404, `An unknown path responded ${missing.status()}, not 404`);
  check(await page.evaluate(() => getComputedStyle(document.body).backgroundColor) === PAPER,
    'The served not-found page is not the site\'s own');
  pass('an unknown path serves the site\'s not-found page with a 404');

  /* ---- 2. Fonts actually loaded, and preloads are the files used --------- */
  await go('/');
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].map((f) => `${f.family} ${f.style} ${f.weight}`);
    const preloads = [...document.querySelectorAll('link[rel=preload][as=font]')].map((l) => l.href);
    const faces = [...document.styleSheets].flatMap((sheet) => {
      try { return [...sheet.cssRules]; } catch { return []; }
    }).filter((r) => r.constructor.name === 'CSSFontFaceRule').map((r) => r.style.getPropertyValue('src'));
    return { loaded, preloads, faces, used: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family) };
  });
  for (const family of ['Fraunces', 'Newsreader', 'Inter']) {
    check(fonts.used.includes(family), `Home: ${family} did not load; the page fell back to a system face`);
  }
  check(fonts.preloads.length === 2, `Home: expected 2 font preloads, found ${fonts.preloads.length}`);
  for (const href of fonts.preloads) {
    const response = await fetch(href);
    check(response.ok, `Stale preload: ${href} responded ${response.status}`);
    check(fonts.faces.some((src) => src.includes(new URL(href).pathname.split('/').pop())),
      `Preloaded ${href} is not the file any @font-face uses — a wasted round trip`);
  }
  /* One authority per family: Press's fonts-web.css and nothing else. */
  const families = fonts.faces.length;
  check(families === 5, `Expected Press's five @font-face rules, found ${families} — a second font authority is present`);
  pass('fonts load from one authority, and both preloads are files the page uses');

  /* ---- 3. Semantic colour ------------------------------------------------ */
  await go('/');
  const colours = await page.evaluate(() => {
    const cs = (sel) => { const el = document.querySelector(sel); return el && getComputedStyle(el); };
    const body = getComputedStyle(document.body);
    /* The hero's own action, not the header's secondary copy of it. */
    const cta = cs('main .pw-button:not(.pw-button--secondary)');
    const prose = cs('.pw-writing--app .pw-draft p');
    return {
      bg: body.backgroundColor,
      text: body.color,
      ctaBg: cta?.backgroundColor,
      ctaText: cta?.color,
      proseColour: prose?.color,
      proseSize: prose?.fontSize,
      proseLeading: prose?.lineHeight,
      proseMeasure: prose?.maxWidth,
    };
  });
  check(colours.bg === PAPER, `Home background is ${colours.bg}, not paper ${PAPER}`);
  check(colours.text === INK, `Home text is ${colours.text}, not ink ${INK}`);
  check(colours.ctaBg === ACCENT_TEXT, `The CTA fill is ${colours.ctaBg}, not ${ACCENT_TEXT} — it must match .ka-button`);
  check(colours.ctaText === ON_ACCENT, `The CTA label is ${colours.ctaText}, not ${ON_ACCENT}`);
  /* The manuscript sample must be the application's reading role, not the
     website's larger editorial one: 17px Newsreader at 1.7 over --measure. */
  check(colours.proseSize === '17px', `The writing sample reads at ${colours.proseSize}, not the application's 17px`);
  check(colours.proseLeading === '28.9px', `The writing sample's leading is ${colours.proseLeading}, not 1.7`);
  check(parseFloat(colours.proseMeasure) <= 576, `The writing sample runs to ${colours.proseMeasure}, past the 36rem measure`);
  pass('paper, ink, one accent fill, and an application-fidelity manuscript sample');

  /* ---- 4. Brand case ----------------------------------------------------- */
  for (const [path] of ROUTES) {
    await go(path);
    const brand = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const bad = [];
      const uppercased = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('script, style, code, pre, kbd')) continue;
        if (!parent.getClientRects().length) continue;
        const text = node.nodeValue;
        /* Kindling_1.3.0_universal.dmg and @KindlingWriter are identifiers. */
        if (/Kindling(?!_|Writer\b)/.test(text)) bad.push(text.trim().slice(0, 70));
        if (/kindling/i.test(text) && getComputedStyle(parent).textTransform === 'uppercase') {
          uppercased.push(parent.className || parent.tagName);
        }
      }
      const alt = [...document.images].map((i) => i.alt).filter((a) => /Kindling(?!_|Writer\b)/.test(a));
      const names = [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label'))
        .filter((a) => /Kindling(?!_|Writer\b)/.test(a));
      return { bad, uppercased, alt, names, title: document.title };
    });
    check(brand.bad.length === 0, `${path}: displayed text still title-cases the brand — ${brand.bad.slice(0, 3).join(' | ')}`);
    check(brand.alt.length === 0, `${path}: alt text still title-cases the brand — ${brand.alt.join(' | ')}`);
    check(brand.names.length === 0, `${path}: an accessible name still title-cases the brand — ${brand.names.join(' | ')}`);
    check(brand.uppercased.length === 0, `${path}: CSS uppercases the brand name in ${brand.uppercased.join(', ')}`);
    check(!/Kindling(?!_|Writer\b)/.test(brand.title), `${path}: <title> still title-cases the brand — ${brand.title}`);
  }
  pass(`${ROUTES.length} routes: displayed text, alt text, accessible names and titles use lowercase kindling`);

  /* A `.pw-section-head` is a two-track grid: the running label in the narrow
     one, the heading block in the wide one. Composed without the wrapping
     element the stand-first escapes the heading, and a short title dropped into
     the narrow track wraps to three lines — both invisible in markup review. */
  for (const [path] of ROUTES) {
    await go(path);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.pw-section-head')]
      .filter((head) => head.getClientRects().length)
      .map((head) => {
        const heading = head.querySelector('h1, h2, h3');
        if (!heading) return null;
        const wide = head.getBoundingClientRect().width;
        const own = heading.getBoundingClientRect().width;
        /* Stacked below 768px, where one track is the whole width. */
        return wide > 700 && own > 0 && own / wide > 0.55 ? null : (wide > 700 ? heading.textContent.trim().slice(0, 40) : null);
      }).filter(Boolean));
    check(heads.length === 0, `${path}: a section heading sits in the label's narrow track — ${heads.join(', ')}`);
  }
  pass('every aligned section head puts its heading in the wide track');

  /* One left edge per page. A hero, a paper section, a full-bleed sunken band
     and a page's own list frame are four different boxes, and each has been
     wrong at least once: 960 against 900, an alt band re-centred on a
     hard-coded 852, and a blog list on the wider marketing frame — three edges
     on one page. Their *content* must start in the same place. */
  for (const [path] of ROUTES) {
    await go(path);
    const edges = await page.evaluate(() => {
      const seen = new Map();
      for (const el of document.querySelectorAll('.page-hero, .content-section, .blog-listing, .article-content')) {
        if (!el.getClientRects().length) continue;
        const box = el.getBoundingClientRect();
        const left = Math.round(box.left + parseFloat(getComputedStyle(el).paddingLeft));
        seen.set(left, (seen.get(left) ?? '') + ' ' + (el.className.toString().split(' ')[0] || el.tagName));
      }
      return [...seen.entries()];
    });
    check(edges.length <= 1, `${path}: ${edges.length} different content left edges — ${edges.map(([x, who]) => x + 'px:' + who).join(', ')}`);
  }
  pass('hero, sections, bands and list frames share one content edge per page');

  /* ---- 5. Screenshots keep their whole frame ----------------------------- */
  for (const path of ['/', '/features/', '/story-outlining-software/', '/docs/settings/']) {
    await go(path);
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);
    const figures = await page.evaluate(() => [...document.images]
      .filter((img) => img.naturalWidth > 400 && img.getClientRects().length)
      .map((img) => {
        const box = img.getBoundingClientRect();
        const fit = getComputedStyle(img).objectFit;
        return {
          src: img.currentSrc.split('/').pop(),
          fit,
          intrinsic: img.naturalWidth / img.naturalHeight,
          rendered: box.width / box.height,
        };
      }));
    for (const figure of figures) {
      /* `cover` crops whatever does not fit. `contain` and `fill` do not, and
         a box at the intrinsic ratio cannot letterbox either. */
      check(figure.fit !== 'cover',
        `${path}: ${figure.src} renders with object-fit: cover — part of the interface is cropped away`);
      if (figure.fit === 'contain') continue;
      check(Math.abs(figure.intrinsic - figure.rendered) < 0.02,
        `${path}: ${figure.src} renders at ${figure.rendered.toFixed(2)} against an intrinsic ${figure.intrinsic.toFixed(2)}`);
    }
    check(figures.length > 0, `${path}: no product figure found to check`);
  }
  pass('product figures keep their intrinsic proportions and their whole frame');

  /* ---- 6. Narrow layout and zoom ----------------------------------------- */
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path] of ROUTES) {
      await go(path);
      const layout = await page.evaluate(() => {
        const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        const culprits = overflow > 1 ? [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
          .slice(0, 3).map((el) => el.tagName + '.' + (el.className.toString().split(' ')[0] || '')) : [];
        const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src);
        return { overflow, culprits, broken };
      });
      check(layout.overflow <= 1, `${path} at ${width}px: ${layout.overflow}px of horizontal overflow (${layout.culprits.join(', ')})`);
      check(layout.broken.length === 0, `${path} at ${width}px: broken images — ${layout.broken.join(', ')}`);
    }
  }
  pass(`no horizontal overflow or broken image on ${ROUTES.length} routes at ${WIDTHS.join(', ')}px`);

  /* 200% zoom is a 720px-wide layout on a 1440px screen. Emulate it the way a
     browser does — halve the CSS viewport at the same device pixel ratio. */
  const zoomed = await browser.newContext({ viewport: { width: 720, height: 500 }, deviceScaleFactor: 2 });
  const zoomPage = await zoomed.newPage();
  for (const [path] of ROUTES) {
    await zoomPage.goto(local + path, { waitUntil: 'load' });
    const overflow = await zoomPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `${path} at 200% zoom: ${overflow}px of horizontal overflow`);
  }
  await zoomed.close();
  pass('no horizontal overflow at 200% browser zoom');

  /* ---- 7. Light surfaces under a dark OS preference ---------------------- */
  const dark = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const darkPage = await dark.newPage();
  for (const path of ['/', '/docs/getting-started/', '/feedback/']) {
    /* Read before the load event: a first paint that flashes dark chrome is
       the defect, and waiting for idle would hide it. */
    await darkPage.goto(local + path, { waitUntil: 'commit' });
    await darkPage.waitForTimeout(200);
    const first = await darkPage.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await darkPage.waitForLoadState('load');
    const settled = await darkPage.evaluate(() => ({
      bg: getComputedStyle(document.body).backgroundColor,
      text: getComputedStyle(document.body).color,
    }));
    check(first === PAPER || first === 'rgba(0, 0, 0, 0)', `${path} under a dark OS preference: first paint was ${first}`);
    check(settled.bg === PAPER, `${path} under a dark OS preference: background settled at ${settled.bg}`);
    check(settled.text === INK, `${path} under a dark OS preference: text settled at ${settled.text}`);
  }
  await dark.close();
  pass('website and docs stay light under a dark OS preference, including first paint');

  /* ---- 8. Targets and focus ---------------------------------------------- */
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [path] of ROUTES) {
    await go(path);
    const controls = await page.evaluate((target) => {
      const small = [];
      /* Standalone controls only. Inline prose links are exempt by contract. */
      const selector = '.pw-button, .ka-button, .pw-nav-links a, .pw-footer-links a, .pw-menu, button:not([tabindex="-1"]), summary, input:not([type=radio]):not([type=checkbox]):not([tabindex="-1"]), select';
      for (const el of document.querySelectorAll(selector)) {
        if (!el.getClientRects().length) continue;
        if (el.closest('.sl-markdown-content p, .article-content p')) continue;
        const box = el.getBoundingClientRect();
        if (box.height < target - 0.5 || box.width < 16) {
          small.push(`${el.tagName.toLowerCase()}.${(el.className.toString().split(' ')[0] || '?')} ${Math.round(box.width)}x${Math.round(box.height)}`);
        }
      }
      return small;
    }, TARGET);
    check(controls.length === 0, `${path}: standalone controls under ${TARGET}px — ${controls.slice(0, 4).join(', ')}`);
  }
  pass(`every standalone control reaches ${TARGET}px on ${ROUTES.length} routes`);

  /* An inline <svg> with only a viewBox has no intrinsic size inside a flex
     container. A collapsed glyph is invisible but takes no space, so nothing
     else about the page looks wrong — which is exactly why it needs a check. */
  for (const [path] of ROUTES) {
    await go(path);
    const collapsed = await page.evaluate(() => [...document.querySelectorAll('.pw-button svg, .ka-button svg, .pw-link svg, .download-card-large svg')]
      /* Only controls that are on screen. A closed <dialog>'s contents have no
         boxes at all, which is not the defect being looked for. */
      .filter((svg) => svg.closest('a, button')?.getClientRects().length)
      .filter((svg) => svg.getBoundingClientRect().width < 8)
      .map((svg) => svg.closest('a, button')?.textContent.trim().slice(0, 30) || '(unlabelled)'));
    check(collapsed.length === 0, `${path}: an icon inside a control renders at no size — ${collapsed.join(', ')}`);
  }
  pass('no icon inside a control collapses to nothing');

  await go('/download/');
  const focus = await page.evaluate(() => {
    const el = document.querySelector('.download-card-large, .pw-button, a[href]');
    el.focus();
    const cs = getComputedStyle(el);
    return { outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, shadow: cs.boxShadow };
  });
  check(focus.outlineStyle !== 'none' || focus.shadow !== 'none',
    `Focus is not visible on the first download control (outline ${focus.outlineStyle}, shadow ${focus.shadow})`);
  pass('keyboard focus is visible on a representative control');

  /* ---- 9. Brand and social assets resolve -------------------------------- */
  const assets = ['/favicon.svg', '/favicon-32.png', '/favicon-16.png', '/favicon.ico',
    '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/site.webmanifest', '/og-image.png',
    '/brand/kindling-wordmark.svg', '/brand/kindling-mark.svg', '/brand/kindling-lockup-stacked.svg',
    '/brand/kindling-favicon.svg'];
  for (const asset of assets) {
    const response = await fetch(local + asset);
    check(response.ok, `${asset} responded ${response.status}`);
  }
  const manifest = await (await fetch(local + '/site.webmanifest')).json();
  check(!/Kindling(?!_|Writer\b)/.test(JSON.stringify(manifest)),
    `site.webmanifest still title-cases the brand: ${JSON.stringify(manifest)}`);
  pass(`${assets.length} brand, favicon and social assets resolve, and the web manifest is lowercase`);

  check(external.length === 0, `Requests left the site during the check: ${[...new Set(external)].join(', ')}`);
  pass('no third-party request was needed to render any checked route');
} finally {
  await browser?.close();
  server.kill();
}

if (failures.length) {
  console.error(`\n${failures.length} design check(s) failed:`);
  for (const failure of failures) console.error(`  FAIL ${failure}`);
  process.exit(1);
}
console.log(`\n${checks} design checks passed across ${ROUTES.length} routes and ${WIDTHS.length} widths.`);
