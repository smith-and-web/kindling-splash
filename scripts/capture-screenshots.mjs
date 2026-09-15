#!/usr/bin/env node
/**
 * Regenerate the product screenshots from the running Kindling desktop app.
 *
 *   npm run shots                       # all targets, optimise, install
 *   npm run shots -- --only scene-panel # one target
 *   npm run shots -- --keep             # write to the work dir, don't install
 *   npm run shots -- --no-optimize      # skip oxipng
 *
 * Requires: Kindling running in dev (`npm run tauri dev` in ../kindling) with the
 * demo database loaded, plus `cliclick`, `oxipng` and ImageMagick on PATH.
 * `npm run shots` wraps this script in capture-hidpi.sh to select a 2x display
 * mode and restore the original mode afterward. See scripts/SCREENSHOTS.md.
 *
 * How it works
 * ------------
 * The Tauri MCP plugin listens on a unix socket with a newline-delimited JSON
 * protocol ({command,payload,id} -> {success,data,error,id}). We drive the app
 * over that socket directly and take the picture with macOS `screencapture -R`,
 * which is lossless PNG and emits 2 physical pixels per CSS pixel on a retina
 * display. The plugin's own take_screenshot is deliberately not used: it writes
 * lossy JPEG and has returned stale frames.
 *
 * Aspect ratios matter. Every figure slot on the site is
 * `width:100%; height:auto` with a `max-height` and `object-fit: cover`, so the
 * source ratio alone decides whether the bottom of a shot is silently binned.
 * Each target carries the minimum ratio its slot needs and the run fails if a
 * capture comes in under it.
 */

import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOCKET = process.env.KINDLING_MCP_SOCK || '/tmp/kindling-mcp.sock';
const WORK = process.env.SHOT_WORKDIR || path.join(os.homedir(), 'Library/Caches/kindling-shots');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n) => {
  const i = argv.indexOf(n);
  return i > -1 ? argv[i + 1] : undefined;
};
const ONLY = (opt('--only') || '').split(',').filter(Boolean);
const INSTALL = !flag('--keep');
const OPTIMIZE = !flag('--no-optimize');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).trim();

/* ------------------------------------------------------------------ app link */

class App {
  #sock = null;
  #buf = '';
  #pending = new Map();

  async connect() {
    if (!fs.existsSync(SOCKET)) {
      throw new Error(
        `No Kindling socket at ${SOCKET}. Start the app in dev mode first ` +
          `(cd ../kindling && npm run tauri dev), or set KINDLING_MCP_SOCK.`
      );
    }
    const tokenFile = `${SOCKET}.token`;
    this.token = fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, 'utf8').trim() : undefined;

    await new Promise((resolve, reject) => {
      this.#sock = net.createConnection({ path: SOCKET }, resolve);
      this.#sock.on('error', reject);
      this.#sock.on('data', (d) => this.#onData(d));
    });
  }

  #onData(d) {
    this.#buf += d.toString();
    let i;
    while ((i = this.#buf.indexOf('\n')) !== -1) {
      const line = this.#buf.slice(0, i);
      this.#buf = this.#buf.slice(i + 1);
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      const cb = this.#pending.get(msg.id);
      if (!cb) continue;
      this.#pending.delete(msg.id);
      msg.success ? cb.resolve(msg.data) : cb.reject(new Error(msg.error || 'command failed'));
    }
  }

  rpc(command, payload = {}) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      this.#sock.write(
        JSON.stringify({ command, payload, id, ...(this.token ? { authToken: this.token } : {}) }) + '\n'
      );
      setTimeout(() => {
        if (this.#pending.delete(id)) reject(new Error(`${command} timed out`));
      }, 15000);
    });
  }

  close() {
    this.#sock?.end();
  }

  /** Run JS in the webview; returns the stringified result. */
  async js(code) {
    const out = await this.rpc('execute_js', { code, window_label: 'main', timeout_ms: 10000 });
    return out && typeof out === 'object' && 'result' in out ? out.result : out;
  }

  /** Run an expression and JSON.parse the result. */
  async jsJSON(expr) {
    const raw = await this.js(`(function(){try{return JSON.stringify(${expr})}catch(e){return 'null'}})()`);
    return JSON.parse(raw ?? 'null');
  }

  /**
   * Invoke a Tauri command through the app's own test bridge and await it.
   * execute_js does not await promises, so the result is stashed on `window`
   * and polled. Used to read real app state instead of scraping the DOM.
   */
  async inv(command, args = {}) {
    await this.js(`(function(){
      window.__inv=undefined; window.__invErr=undefined;
      var b=(window.__KINDLING_TEST__&&window.__KINDLING_TEST__.invoke)
          ||(window.__TAURI_INTERNALS__&&window.__TAURI_INTERNALS__.invoke);
      if(!b){window.__invErr='no invoke bridge on window';return '0';}
      b(${JSON.stringify(command)}, ${JSON.stringify(args)})
        .then(function(r){window.__inv=JSON.stringify(r===undefined?null:r)})
        .catch(function(e){window.__invErr=String((e&&e.message)||e)});
      return '1';
    })()`);
    for (let i = 0; i < 60; i++) {
      const g = await this.js(
        `(function(){return window.__inv!==undefined?('OK'+window.__inv)
          :(window.__invErr!==undefined?('ERR'+window.__invErr):'')})()`
      );
      if (g && g.startsWith('OK')) return JSON.parse(g.slice(2));
      if (g && g.startsWith('ERR')) throw new Error(`${command}: ${g.slice(3)}`);
      await sleep(120);
    }
    throw new Error(`${command} timed out`);
  }

  async truthy(expr) {
    return (await this.js(`(function(){try{return (${expr})?'1':'0'}catch(e){return '0'}})()`)) === '1';
  }

  async waitFor(expr, { timeout = 10000, interval = 120, what = expr } = {}) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      if (await this.truthy(expr)) return;
      await sleep(interval);
    }
    throw new Error(`timed out waiting for: ${what}`);
  }

  async window() {
    const { windows } = await this.rpc('list_windows', {});
    const w = windows.find((x) => x.label === 'main') || windows[0];
    if (!w) throw new Error('no Kindling window');
    return w;
  }

  async viewport() {
    return this.jsJSON('{iw:innerWidth,ih:innerHeight}');
  }

  /**
   * Screen-point origin of the webview content area.
   *
   * list_windows reports innerSize === outerSize, which is wrong, so the real
   * inner size has to come from the webview. Window chrome on macOS is entirely
   * at the top. This must be re-derived after every resize: the window moves.
   */
  async origin() {
    const w = await this.window();
    const s = w.scaleFactor;
    const outerW = w.outerSize.width / s;
    const outerH = w.outerSize.height / s;
    const { iw, ih } = await this.viewport();
    return {
      ox: Math.round(w.position.x / s + (outerW - iw) / 2),
      oy: Math.round(w.position.y / s + (outerH - ih)),
      iw,
      ih,
    };
  }

  async setSize(width, height) {
    const before = await this.viewport();
    if (before.iw === width && before.ih === height - 32) return;
    await this.rpc('manage_window', { operation: 'setSize', window_label: 'main', width, height });
    // The app snaps back to its default size if the request is out of bounds,
    // so confirm rather than assume.
    for (let i = 0; i < 20; i++) {
      const v = await this.viewport();
      if (v.iw === width) return v;
      await sleep(100);
    }
    const v = await this.viewport();
    throw new Error(`window refused ${width}x${height}; settled at ${v.iw}x${v.ih} (height >1000 CSS snaps back)`);
  }

  focus() {
    return this.rpc('manage_window', { operation: 'focus', window_label: 'main' });
  }

  /**
   * Bring Kindling to the front and confirm it got there.
   *
   * `screencapture -R` grabs the composited screen at a rect, not a window, so
   * anything overlapping it (the terminal running this script, for one) ends up
   * in the PNG. Without this the geometry checks all pass and you ship a picture
   * of your terminal.
   */
  async raise() {
    await this.focus();
    for (let i = 0; i < 25; i++) {
      if ((await this.window()).focused) return;
      await sleep(80);
    }
    throw new Error('Kindling would not come to the front');
  }

  /**
   * Click the first *genuinely hittable* control whose accessible name contains
   * `label`. The hit test matters: the app keeps both "Collapse sidebar" and
   * "Expand sidebar" in the DOM simultaneously (one inside the collapsed rail),
   * so a plain text match silently clicks an inert button.
   */
  async clickLabel(label, { required = true } = {}) {
    const hit = await this.js(`(function(){
      var t=${JSON.stringify(label)};
      function hittable(el){
        var r=el.getBoundingClientRect();
        if(r.width<2||r.height<2) return false;
        var s=getComputedStyle(el);
        if(s.visibility==='hidden'||s.display==='none'||s.opacity==='0') return false;
        var cx=r.x+r.width/2, cy=r.y+r.height/2;
        if(cx<0||cy<0||cx>innerWidth||cy>innerHeight) return false;
        var top=document.elementFromPoint(cx,cy);
        return !!top && (el.contains(top)||top.contains(el));
      }
      function named(b){
        var s=((b.getAttribute('aria-label')||'')+' '+(b.title||'')+' '+(b.textContent||'')).replace(/\\s+/g,' ').trim();
        return s.indexOf(t)>-1;
      }
      var all=Array.prototype.filter.call(document.querySelectorAll('button,[role=button]'), named);
      if(!all.length) return '0';
      var a=all.filter(hittable);
      if(a.length){ a[0].click(); return '1'; }
      // Nothing hittable: a match may be below the fold of a scroll container
      // (e.g. the command palette's list). Try scrolling each one in — the first
      // candidate is often an inert duplicate in a collapsed rail.
      for (var i=0;i<all.length;i++){
        all[i].scrollIntoView({block:'center'});
        if(hittable(all[i])){ all[i].click(); return '1'; }
      }
      return '0';
    })()`);
    if (hit !== '1' && required) throw new Error(`no hittable element matching "${label}"`);
    return hit === '1';
  }

  rectOf(selector) {
    return this.jsJSON(`(function(){
      var e=document.querySelector(${JSON.stringify(selector)});
      if(!e) return null;
      var r=e.getBoundingClientRect();
      return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)];
    })()`);
  }

  resetScroll() {
    return this.js(
      `(function(){document.querySelectorAll('*').forEach(function(e){if(e.scrollTop)e.scrollTop=0;});scrollTo(0,0);return '1'})()`
    );
  }

  /**
   * Scroll `selector` so its top edge sits `top` px below the viewport top.
   * Without this a target deep in the page leaves too little room beneath it and
   * fitAspect shrinks the capture to fit, silently yielding a tiny image.
   */
  async scrollTo(selector, top = 16) {
    const ok = await this.js(`(function(){
      var e=document.querySelector(${JSON.stringify(selector)}); if(!e) return '0';
      var sc=e.parentElement;
      while(sc && !(sc.scrollHeight > sc.clientHeight + 4 && sc.clientHeight > 120
        && /^(auto|scroll|overlay)$/.test(getComputedStyle(sc).overflowY))) sc=sc.parentElement;
      if(!sc) return '0';
      sc.scrollTop += Math.round(e.getBoundingClientRect().y - ${top});
      return '1';
    })()`);
    await sleep(200);
    return ok === '1';
  }

  /**
   * Capture-time cosmetics, as a stylesheet so they survive React re-renders
   * (inline styles get clobbered). Removed again by `unstyle()`.
   */
  style(css) {
    return this.js(`(function(){
      var s=document.getElementById('__shotstyle')||document.createElement('style');
      s.id='__shotstyle'; s.textContent=${JSON.stringify(css)};
      document.head.appendChild(s); return '1';
    })()`);
  }

  unstyle() {
    return this.js(`(function(){var s=document.getElementById('__shotstyle'); if(s)s.remove(); return '1'})()`);
  }

  /** Park the pointer off the window so hover state can't alter the layout. */
  async parkCursor() {
    const w = await this.window();
    const s = w.scaleFactor;
    const wx = w.position.x / s;
    const wy = w.position.y / s;
    const ww = w.outerSize.width / s;
    const wh = w.outerSize.height / s;
    const x = wx >= 14 ? Math.max(2, Math.round(wx - 10)) : Math.round(wx + ww + 10);
    const y = Math.round(wy + wh / 2);
    sh('cliclick', [`m:${x},${y}`]);
  }

  /** A real key chord, via the OS — synthetic KeyboardEvents don't reach Tauri. */
  async chord(keys, char) {
    await this.focus();
    await sleep(120);
    sh('cliclick', ['-w', '40', ...keys.map((k) => `kd:${k}`), `t:${char}`, ...keys.reverse().map((k) => `ku:${k}`)]);
  }
}

/* ---------------------------------------------------------------- app states */

const HIDE_EXPAND_TABS = `
  button[aria-label="Expand sidebar"],
  button[aria-label="Expand references panel"] { visibility: hidden !important; }
`;

const pinRefs = (px) =>
  px == null
    ? ''
    : `main > .writing-surface > aside[class*="border-l"]{width:${px}px !important;min-width:${px}px !important;max-width:${px}px !important;flex:0 0 ${px}px !important;}`;

const AT_PICKER = `(document.querySelector('main h1')||{}).textContent.trim()==='kindling'`;
const PROJECT_TITLE = `(function(){var p=document.querySelector('main > aside[class*="border-r"] p');return p?p.textContent.trim():''})()`;

/**
 * Guarantee `name` is the open project, switching away from another one if
 * needed. The demo fixture ships three projects whose names share a prefix, so
 * the picker row is matched on `<name> (` to avoid opening a sibling.
 */
async function ensureProject(app, name = 'The Letter') {
  if ((await app.js(PROJECT_TITLE)) === name) return;
  if (!(await app.truthy(AT_PICKER))) {
    // "All Projects" lives in the sidebar header, so it is unclickable while the
    // sidebar is collapsed by a previous target.
    await setSidebar(app, true);
    await app.clickLabel('All Projects');
    await app.waitFor(AT_PICKER, { what: 'the project picker' });
  }
  const texts = await app.jsJSON(
    `Array.prototype.map.call(document.querySelectorAll('button'),function(b){return (b.textContent||'').replace(/\\s+/g,' ').trim()})`
  );
  const idx = texts.findIndex((t) => t.startsWith(name + ' ('));
  if (idx < 0) throw new Error(`project "${name}" is not on the picker — run create_demo_fixture in the app`);
  await app.js(`(function(){document.querySelectorAll('button')[${idx}].click();return '1'})()`);
  await app.waitFor(`${PROJECT_TITLE} === ${JSON.stringify(name)}`, { what: `project "${name}"` });
  // The sidebar title updates before the saved scene/position finishes restoring.
  // Let that restore settle before a target chooses its own scene.
  await sleep(750);
}

/** Open the demo project and select a scene. Idempotent — survives HMR reloads. */
async function ensureScene(app, project = 'The Letter', scene = 'On the Cliff') {
  await ensureProject(app, project);
  const openAlready = `(document.querySelector('main > .writing-surface h1')||{}).textContent.trim()===${JSON.stringify(scene)}`;
  if (await app.truthy(openAlready)) return;
  // Scene rows are inside the sidebar and its chapter groups, both of which a
  // previous target may have closed.
  await setSidebar(app, true);
  await selectScene(app, scene);
  await app.waitFor(openAlready, { what: `scene "${scene}"` });
}

// The project sidebar is the border-r aside; the references panel is border-l.
const SIDEBAR = 'main > aside[class*="border-r"]';
const REFS = 'main > .writing-surface > aside[class*="border-l"]';

const widthOf = (sel) =>
  `(function(){var a=document.querySelector(${JSON.stringify(sel)});return a?Math.round(a.getBoundingClientRect().width):-1})()`;

async function setSidebar(app, open) {
  const isCollapsed = () => app.truthy(`(function(){var w=${widthOf(SIDEBAR)};return w>=0 && w<10})()`);
  for (let i = 0; i < 4; i++) {
    if ((await isCollapsed()) === !open) return;
    await app.clickLabel(open ? 'Expand sidebar' : 'Collapse sidebar', { required: false });
    await sleep(350);
  }
  if ((await isCollapsed()) !== !open) throw new Error(`could not ${open ? 'expand' : 'collapse'} the sidebar`);
}

/** `px === null` collapses the references panel; otherwise pin it to that width. */
async function setRefs(app, px) {
  const visible = () => app.truthy(`${widthOf(REFS)} > 10`);

  if (px == null) {
    for (let i = 0; i < 4 && (await visible()); i++) {
      await app.clickLabel('Collapse references panel', { required: false });
      await sleep(350);
    }
    if (await visible()) throw new Error('could not collapse the references panel');
  } else {
    for (let i = 0; i < 4 && !(await visible()); i++) {
      await app.clickLabel('Expand references panel', { required: false });
      await sleep(350);
    }
    if (!(await visible())) throw new Error('could not expand the references panel');
  }
  await app.style(HIDE_EXPAND_TABS + pinRefs(px));
  // The pin is a stylesheet rule, so confirm it actually took.
  if (px != null) {
    await app.waitFor(`${widthOf(REFS)} === ${px}`, { timeout: 3000, what: `references panel at ${px}px` });
  }
  await sleep(150);
}

const BEAT_OPEN = `!!document.querySelector('main > .writing-surface .novel-pages-container')`;

function beatHeaderClick(nth) {
  return `(function(){
    var arts=document.querySelectorAll('main > .writing-surface section article');
    var a=arts[${nth}]; if(!a) return '0';
    var bs=Array.prototype.filter.call(a.querySelectorAll('button'),function(b){return b.getBoundingClientRect().width>120;});
    if(!bs.length) return '0';
    bs[0].click(); return '1';
  })()`;
}

async function setBeatOpen(app, open) {
  for (let i = 0; i < 4; i++) {
    if ((await app.truthy(BEAT_OPEN)) === open) return;
    await app.js(beatHeaderClick(0));
    await sleep(350);
  }
  if ((await app.truthy(BEAT_OPEN)) !== open) throw new Error(`could not ${open ? 'expand' : 'collapse'} beat 1`);
}

async function collapseRefRows(app) {
  await app.clickLabel('Collapse all', { required: false });
  await sleep(250);
}

/**
 * Open the command palette with a real ⌘K. Synthetic KeyboardEvents don't reach
 * the Tauri shortcut handler, and the chord occasionally lands before the window
 * has focus, so retry rather than fail the whole run.
 */
async function openPalette(app) {
  await closeDialog(app);
  for (let i = 0; i < 4; i++) {
    await app.chord(['cmd'], 'k');
    try {
      await app.waitFor(`!!document.querySelector('[role=dialog]')`, { timeout: 1500, what: 'command palette' });
      await sleep(250);
      return;
    } catch {
      /* retry */
    }
  }
  throw new Error('command palette did not open after 4 attempts (is cliclick allowed under Accessibility?)');
}

async function openDialog(app, label, panelSelector) {
  await openPalette(app);
  await app.clickLabel(label);
  await app.waitFor(`!!document.querySelector(${JSON.stringify(panelSelector)})`, { what: `${label} dialog` });
  await sleep(300);
}

/** Open one area of the unified Settings window without changing its values. */
async function openSettingsArea(app, label) {
  await openDialog(app, 'Settings', '[data-testid="settings-dialog"]');
  await app.js(`(function(){
    var nav=document.querySelector('nav[aria-label="Settings areas"]');
    var button=Array.from(nav.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)});
    if(!button) throw new Error('Settings area missing');
    button.click();
  })()`);
  await app.waitFor(`Array.from(document.querySelectorAll('nav[aria-label="Settings areas"] button')).some(b=>b.textContent.trim()===${JSON.stringify(label)} && b.getAttribute('aria-current')==='page')`, { what: label });
  await sleep(350);
}

/** Expand one reference row in the panel by name. */
async function expandRefRow(app, name) {
  const hit = await app.js(`(function(){
    var a=document.querySelector('main > .writing-surface > aside[class*="border-l"]'); if(!a) return '0';
    var b=Array.prototype.find.call(a.querySelectorAll('button'),function(x){
      var t=(x.textContent||''); return t.indexOf(${JSON.stringify(name)})>-1 && t.length>${name.length + 8};});
    if(!b) return '0';
    if(b.getAttribute('aria-expanded')==='true') return '1';
    b.click(); return '1';
  })()`);
  if (hit !== '1') throw new Error(`no reference row for "${name}"`);
  await sleep(400);
}

const SUGGESTION_ROW = `!!document.querySelector('main > .writing-surface > aside[class*="border-l"] button[aria-label^="Dismiss suggestion"]')`;

/**
 * Show or hide the smart-detection block. Toggles the "Suggested N" header —
 * never "Dismiss": `dismiss_suggestion` writes to the database, so dismissing
 * would permanently strip suggestions from the fixture and silently break the
 * reference-suggestions shot on every later run.
 */
async function setSuggestionsOpen(app, open) {
  for (let i = 0; i < 3; i++) {
    if ((await app.truthy(SUGGESTION_ROW)) === open) return true;
    if (!(await app.clickLabel('Suggested', { required: false }))) break;
    await sleep(350);
  }
  return (await app.truthy(SUGGESTION_ROW)) === open;
}

/** sceneId -> suggestion count for the whole project, in one detection pass. */
async function suggestionCounts(app, projectName = 'The Letter') {
  const projects = await app.inv('get_all_projects');
  const proj = projects.find((p) => p.name === projectName);
  if (!proj) throw new Error(`project "${projectName}" is not in the fixture`);
  const map = await app.inv('detect_all_references', { projectId: proj.id });
  const scenes = [];
  for (const ch of await app.inv('get_chapters', { projectId: proj.id }))
    for (const sc of await app.inv('get_scenes', { chapterId: ch.id }))
      scenes.push({ id: sc.id, title: sc.title, chapter: ch.title, n: (map[sc.id] || []).length });
  return scenes;
}

/** Every scene in a project with its chapter, editor mode, type and planning state. */
async function sceneList(app, projectName = 'The Letter') {
  const projects = await app.inv('get_all_projects');
  const proj = projects.find((p) => p.name === projectName);
  if (!proj) throw new Error(`project "${projectName}" is not in the fixture`);
  const out = [];
  for (const ch of await app.inv('get_chapters', { projectId: proj.id }))
    for (const sc of await app.inv('get_scenes', { chapterId: ch.id }))
      out.push({
        id: sc.id,
        title: sc.title,
        chapter: ch.title,
        mode: sc.editor_mode,
        type: sc.scene_type,
        plan: sc.planning_status,
      });
  return out;
}

/**
 * Select a scene from the sidebar, opening its chapter first if the row isn't
 * showing. Rows are matched on a prefix because long titles truncate.
 */
async function selectScene(app, title, chapter) {
  const prefix = title.slice(0, 14);
  const clickRow = `(function(){
    var p=${JSON.stringify(prefix)};
    var side=document.querySelector('main > aside[class*="border-r"]')||document;
    var b=Array.prototype.find.call(side.querySelectorAll('button'),function(x){
      return (x.textContent||'').replace(/\\s+/g,' ').trim().indexOf(p)===0;});
    if(!b) return '0';
    b.click(); return '1';
  })()`;

  if (chapter) await openChapter(app, chapter.slice(0, 14));
  if ((await app.js(clickRow)) === '1') {
    await sleep(500);
    return;
  }
  // No chapter given, or the wrong one — walk the closed chapters.
  const headers = await app.jsJSON(`Array.prototype.map.call(
    (document.querySelector('main > aside[class*="border-r"]')||document).querySelectorAll('button[aria-expanded]'),
    function(b){return (b.textContent||'').replace(/\\s+/g,' ').trim()})`);
  for (const h of headers) {
    if (!(await openChapter(app, h.slice(0, 14)))) continue;
    if ((await app.js(clickRow)) === '1') {
      await sleep(500);
      return;
    }
  }
  throw new Error(`could not reach scene "${title}" in the sidebar`);
}

/**
 * Find a leaf element by exact text. `scope` matters: short labels like "Tags"
 * also occur in the scene panel *behind* an open dialog, and DOM order would
 * otherwise pick that one.
 */
const findLeaf = (text, scope) => `(function(){
  var t=${JSON.stringify(text)};
  var root=${scope ? `document.querySelector(${JSON.stringify(scope)})` : 'document'};
  if(!root) return null;
  return Array.prototype.find.call(root.querySelectorAll('h2,h3,h4,p,span,div,label,legend'),
    function(e){return e.children.length===0 && (e.textContent||'').trim()===t;}) || null;
})()`;

/** Viewport y of the first leaf element in `scope` whose text equals `text`. */
function yOfText(app, text, scope) {
  return app.jsJSON(`(function(){
    var el=${findLeaf(text, scope)};
    return el?Math.round(el.getBoundingClientRect().y):null;
  })()`);
}

/** Scroll the container holding `text` so that text sits `top` px from its top. */
async function scrollTextToTop(app, text, top = 16, scope) {
  const ok = await app.js(`(function(){
    var el=${findLeaf(text, scope)};
    if(!el) return '0';
    var sc=el.parentElement;
    while(sc && !(sc.scrollHeight>sc.clientHeight+4 && sc.clientHeight>100)) sc=sc.parentElement;
    if(!sc) return '0';
    sc.scrollTop += Math.round(el.getBoundingClientRect().y - sc.getBoundingClientRect().y - ${top});
    return '1';
  })()`);
  if (ok !== '1') throw new Error(`could not scroll "${text}" into view`);
  await sleep(350);
}

/** The dialog's panel rect — `.app-dialog-surface` if present, else its biggest child. */
async function dialogSurface(app) {
  const direct = await app.rectOf('dialog[open], .app-dialog-surface');
  if (direct) return direct;
  const r = await app.jsJSON(`(function(){
    var d=document.querySelector('[role=dialog]'); if(!d) return null;
    var best=null;
    d.querySelectorAll('*').forEach(function(e){
      var b=e.getBoundingClientRect();
      if(b.width>320 && b.width<innerWidth-40 && b.height>240 && (!best||b.height>best[3]))
        best=[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];
    });
    return best;
  })()`);
  if (!r) throw new Error('no dialog on screen');
  return r;
}

/**
 * Open the chapter group whose header starts with `prefix`.
 *
 * Chapters behave as an accordion — opening one closes the others — so there is
 * deliberately no "expand all": trying to do that just oscillates.
 */
async function openChapter(app, prefix) {
  const ok = await app.js(`(function(){
    var p=${JSON.stringify(prefix)};
    var side=document.querySelector('main > aside[class*="border-r"]')||document;
    var b=Array.prototype.find.call(side.querySelectorAll('button[aria-expanded]'),function(x){
      return (x.textContent||'').replace(/\\s+/g,' ').trim().indexOf(p)===0;});
    if(!b) return '0';
    if(b.getAttribute('aria-expanded')!=='true') b.click();
    return '1';
  })()`);
  await sleep(350);
  return ok === '1';
}

/**
 * Make sure the source-backed project actually has something to sync, so the
 * preview dialog isn't empty. Appends a scene to its Markdown source if not.
 */
async function ensureSourceDrift(app) {
  const projects = await app.inv('get_all_projects');
  const p = projects.find((x) => x.name === 'The Letter — Source Outline' && x.source_path);
  if (!p) throw new Error('no source-backed project — run create_demo_fixture in the app');
  const pre = await app.inv('get_sync_preview', { projectId: p.id });
  if ((pre.additions?.length || 0) + (pre.changes?.length || 0) > 0) return p;
  if (!fs.existsSync(p.source_path)) throw new Error(`source file missing: ${p.source_path}`);
  fs.appendFileSync(p.source_path, `\n## Beneath the Tower\n\n- Eleanor turns the key\n`);
  await sleep(400);
  return p;
}

const ANY_DIALOG = `!!document.querySelector('dialog[open], [role=dialog], .app-dialog-surface')`;

/**
 * Dismiss whatever dialog is open. Find and Replace is a native `<dialog>` with a
 * "Close" button and no "Cancel", and it has to actually go away — a dialog left
 * open makes the next target's palette items unclickable behind it.
 */
async function closeDialog(app) {
  if (await app.truthy(`!!document.querySelector('.editorial-workspace.active')`)) {
    await app.clickLabel('Return to writing', { required: false }) ||
      await app.clickLabel('Close review', { required: false });
    await sleep(300);
  }
  for (let i = 0; i < 4; i++) {
    if (!(await app.truthy(ANY_DIALOG))) return;
    const clicked =
      (await app.clickLabel('Cancel', { required: false })) ||
      (await app.clickLabel('Close', { required: false }));
    if (!clicked) {
      await app.focus();
      await sleep(120);
      sh('cliclick', ['kp:esc']);
    }
    await sleep(350);
  }
  if (await app.truthy(ANY_DIALOG)) throw new Error('a dialog would not close');
}

/* -------------------------------------------------------------------- geometry */

const pad = ([x, y, w, h], p) => [x - p, y - p, w + p * 2, h + p * 2];

/**
 * Force a rect to `aspect`, anchored at its top edge (the site uses
 * `object-position: top center`, so the top is what must be preserved).
 */
function fitAspect(rect, aspect, vp) {
  let [x, y, w, h] = rect.map(Math.round);
  x = Math.max(0, x);
  y = Math.max(0, y);
  w = Math.min(w, vp.iw - x);
  if (aspect) {
    h = Math.round(w / aspect);
    if (y + h > vp.ih) {
      h = vp.ih - y;
      w = Math.round(h * aspect);
    }
  } else {
    h = Math.min(h, vp.ih - y);
  }
  return [x, y, w, Math.min(h, vp.ih - y)];
}

/* --------------------------------------------------------------------- targets */

const TARGETS = [
  {
    name: 'start-screen',
    dest: 'public/docs/start-screen.png',
    note: 'docs/getting-started — new project, sample, and review entry points',
    win: [1200, 952],
    async setup(app) {
      if (!(await app.truthy(AT_PICKER))) {
        await setSidebar(app, true);
        await app.clickLabel('All Projects');
        await app.waitFor(AT_PICKER, { what: 'start screen' });
      }
      await app.waitFor(`!!document.querySelector('[data-testid="new-project-button"]')`, { what: 'start screen actions' });
      await app.resetScroll();
    },
    async rect(app) {
      const r = await app.jsJSON(`(function(){
        var actions=document.querySelector('[data-testid="new-project-button"]').parentElement;
        var r=actions.getBoundingClientRect();
        return [r.x,r.y,r.width,r.height];
      })()`);
      return pad(r, 16);
    },
  },
  {
    name: 'keyboard-shortcuts',
    dest: 'public/docs/keyboard-shortcuts.png',
    note: 'docs/settings + release article — command bindings and reset controls',
    win: [920, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Keyboard Shortcuts');
      await app.waitFor(`!!document.querySelector('button[aria-label^="Shortcut for "]:not([disabled])')`, { what: 'keyboard bindings loaded' });
      await app.js(`(function(){
        var input=document.querySelector('[data-testid="settings-dialog"] input[type="search"]');
        input.value='Find'; input.dispatchEvent(new Event('input',{bubbles:true}));
      })()`);
      await app.waitFor(`document.querySelectorAll('button[aria-label^="Shortcut for "]').length===3`, { what: 'filtered search commands' });
    },
    async rect(app) {
      // Other Settings figures show the navigation. This detail keeps the
      // actual bindings legible on mobile instead of shrinking another window.
      return app.jsJSON(`(function(){
        var input=document.querySelector('[data-testid="settings-dialog"] input[type="search"]');
        var controls=input.closest('label').parentElement;
        var list=controls.parentElement.querySelector('ul');
        var a=controls.getBoundingClientRect(), b=list.getBoundingClientRect();
        return [a.x-12,a.y-12,a.width+24,b.bottom-a.y+24];
      })()`);
    },
  },
  {
    name: 'editorial-package',
    dest: 'public/docs/editorial-package.png',
    note: 'docs/editorial-review — prepare a manuscript package',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await openDialog(app, 'Editorial review and packages', '.editorial-workspace.active');
      await app.waitFor(`!!document.querySelector('.package-form')`, { what: 'Review package form' });
    },
    async rect(app) {
      return pad(await app.rectOf('.package-form'), 16);
    },
  },
  {
    name: 'editorial-review',
    dest: 'public/docs/editorial-review.png',
    note: 'docs/editorial-review — manuscript markup and feedback',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await app.clickLabel('Revisions');
      await app.waitFor(`!!document.querySelector('.editorial-workspace.active .review-sidebar article')`, { what: 'Sample feedback' });
      await app.js(`(function(){
        var s=document.querySelector('select[aria-label="Markup view"]');
        s.value='all'; s.dispatchEvent(new Event('change',{bubbles:true}));
      })()`);
      await sleep(300);
      await app.js(`document.querySelector('.review-sidebar article .thread-header, .review-sidebar article button').click()`);
      await sleep(300);
    },
    async rect(app) {
      const r = await app.rectOf('.editorial-workspace.active');
      return [r[0],r[1],r[2],Math.min(r[3],740)];
    },
  },
  {
    name: 'copy-references',
    dest: 'public/docs/copy-references.png',
    note: 'docs/references — select references and review the copy preview',
    win: [1200, 952],
    async setup(app) {
      await ensureProject(app, 'The Letter — Screenplay');
      await setRefs(app, 440);
      await app.clickLabel('Copy references from project');
      await app.waitFor(`document.querySelector('#copy-source')?.options.length > 1`, { what: 'Source projects' });
      await app.js(`(function(){
        var s=document.querySelector('#copy-source');
        var option=Array.from(s.options).find(o=>o.textContent.trim().startsWith('The Letter ·'));
        if(!option) throw new Error('The Letter source missing');
        s.value=option.value; s.dispatchEvent(new Event('change',{bubbles:true}));
      })()`);
      await app.waitFor(`!!document.querySelector('#copy-search') && !document.body.innerText.includes('Updating preview…')`, { what: 'Reference copy preview' });
      await app.clickLabel('Clear selection');
      await app.js(`(function(){
        var search=document.querySelector('#copy-search');
        search.value='Eleanor'; search.dispatchEvent(new Event('input',{bubbles:true}));
      })()`);
      await sleep(300);
      await app.js(`(function(){
        var label=Array.from(document.querySelectorAll('dialog[open] fieldset label')).find(l=>l.textContent.includes('Eleanor Blackwood'));
        if(!label) throw new Error('Sample character missing');
        label.querySelector('input').click();
      })()`);
      await app.waitFor(`document.body.innerText.includes('1 to copy') && !document.body.innerText.includes('Updating preview…')`, { what: 'Single-reference preview' });
    },
    async rect(app) {
      return pad(await dialogSurface(app),16);
    },
  },

  {
    name: 'writing-statistics',
    dest: 'public/docs/writing-statistics.png',
    note: 'docs/writing-progress — manuscript statistics and chapter counts',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, null);
      if (!(await app.truthy(`!!document.querySelector('#writing-statistics-panel')`))) {
        await app.clickLabel('Writing statistics');
      }
      await app.waitFor(`!!document.querySelector('#writing-statistics-panel')`, { what: 'Writing statistics' });
    },
    async rect(app) {
      const r = await app.rectOf('#writing-statistics-panel');
      if (!r) throw new Error('Statistics panel missing');
      return pad(r, 12);
    },
  },
  {
    name: 'previously',
    dest: 'public/docs/previously.png',
    note: 'docs/scene-workflow — previous scene title, synopsis and closing prose',
    win: [1200, 952],
    async setup(app) {
      if (await app.truthy(`!!document.querySelector('#writing-statistics-panel')`)) {
        await app.clickLabel('Hide statistics');
      }
      await ensureScene(app, 'The Letter', 'The Seventh Step');
      await app.resetScroll();
      if (!(await app.truthy(`!!document.querySelector('[data-testid="previously"]')`))) {
        await app.clickLabel('Previously');
      }
      await app.waitFor(`!!document.querySelector('[data-testid="previously"]')`, { what: 'Previous scene context' });
    },
    async rect(app) {
      const r = await app.rectOf('[data-testid="previously"]');
      if (!r) throw new Error('Previous scene context missing');
      return [r[0] - 12, r[1] - 44, r[2] + 24, r[3] + 56];
    },
  },

  {
    name: 'scene-panel',
    dest: 'src/assets/scene-panel.png',
    note: 'home hero — editor column: synopsis, beats, and prose under an open beat',
    // Portrait crop of the editor column alone, not the whole two-pane window.
    // The hero slot is 564x640 (taller than wide); a full window scaled into it
    // renders the app UI at ~26%, which is the illegible-shrunk-window case
    // DESIGN_GUIDE.md section 8 prohibits. Both side panels are collapsed so the
    // shot is the one thing the hero has to say: the outline sits above the
    // prose you write into it.
    //
    // The window is sized so the editor column alone comes out at ~760pt, which
    // keeps its 704px max-width content column intact so beat titles don't
    // truncate — the same reason beat-with-prose uses 1200.
    //
    // Crop the writing column rather than including the reference panel.
    win: [1020, 940],
    aspect: 0.89,
    minAspect: 0.881, // .hero-figure: max-height 640px at 564px wide
    minWidthPx: 1128, // 2x the 564px slot
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setBeatOpen(app, true);
      // Normally applied by setRefs(); this target doesn't call it, so the
      // collapsed sidebar's "»" tab would otherwise sit in the left margin.
      // The scrollbar is hidden for the same reason — the crop is a print, and
      // a scroll position is chrome that dates it.
      await app.style(
        HIDE_EXPAND_TABS + `*::-webkit-scrollbar { width:0 !important; height:0 !important; }`
      );
      await app.resetScroll();
      // Scroll the revisions chrome off the top so the frame starts on the
      // scene title. Without this the 0.89 frame ends exactly where the prose
      // begins, and the hero shows an outline with nothing written under it.
      //
      // Done against the editor column's own scroller rather than via
      // scrollTextToTop: the scene title also exists in the collapsed sidebar's
      // chapter tree, so a document-wide text lookup finds that copy first and
      // then fails, having walked up an ancestor chain with no scroller in it.
      const scrolled = await app.js(`(function(){
        var col=document.querySelector('main > div.writing-surface > div');
        var sc=col&&col.querySelector('.overflow-y-auto');
        var h1=col&&col.querySelector('h1');
        if(!sc||!h1) return '0';
        sc.scrollTop += Math.round(
          h1.getBoundingClientRect().top - sc.getBoundingClientRect().top - 24
        );
        return '1';
      })()`);
      if (scrolled !== '1') throw new Error('could not scroll the scene title to the top');
      await sleep(350);
    },
    async rect(app) {
      const r = await app.rectOf('main > div.writing-surface > div');
      if (!r) throw new Error('editor column not found');
      return r;
    },
  },
  {
    name: 'beat-with-prose',
    dest: 'src/assets/beat-with-prose.png',
    note: 'home row 1 — beat expanded with toolbar + prose',
    // Wide enough that the editor's 704px max-width content column is reached
    // (so the beat title isn't truncated) while the references panel stays put.
    // Collapsing the panel is deliberately avoided: it currently leaves a 460px
    // dead gutter instead of giving the space back.
    win: [1200, 952],
    aspect: 1.25,
    minAspect: 1.204, // .feature-figure: max-height 440px at up to 530px wide
    minWidthPx: 996, // 2x the 498px slot on the home page
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, 400);
      await setBeatOpen(app, true);
      await app.resetScroll();
      await app.scrollTo('main section article', 16);
    },
    async rect(app) {
      const r = await app.rectOf('main section article');
      if (!r) throw new Error('no beat article found');
      return pad(r, 16);
    },
  },
  {
    name: 'references-panel',
    dest: 'src/assets/references-panel.png',
    note: 'home row 2 + /features row 2 — the panel itself',
    win: [1200, 952],
    aspect: 1.25,
    minAspect: 1.204,
    minWidthPx: 1060, // 2x the 530px slot on /features
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, 640);
      await collapseRefRows(app);
      // The figure's copy promises descriptions, notes and custom fields, so put
      // an expanded character in shot. Suggestions are collapsed rather than
      // dismissed: they'd otherwise lead the image and push the roster out.
      await setSuggestionsOpen(app, false);
      await expandRefRow(app, 'Eleanor Blackwood');
      await setBeatOpen(app, true);
      await app.resetScroll();
    },
    async rect(app) {
      const r = await app.rectOf('main > .writing-surface > aside[class*="border-l"]');
      if (!r) throw new Error('references panel not found');
      return r;
    },
  },
  {
    name: 'command-palette',
    dest: 'public/docs/command-palette.png',
    note: 'docs — palette over the blurred app',
    win: [1200, 952],
    aspect: 1.25,
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, 600);
      await openPalette(app);
    },
    async rect(app) {
      const r = await app.rectOf('[role=dialog]');
      if (!r) throw new Error('palette not open');
      return pad(r, 64);
    },
  },
  {
    name: 'app-settings',
    dest: 'public/docs/app-settings.png',
    note: 'docs/settings — Appearance & Guidance',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Appearance & Guidance');
    },
    async rect(app) {
      const r = await app.rectOf('.app-dialog-surface');
      if (!r) throw new Error('settings panel not on screen');
      return pad(r, 16);
    },
  },
  {
    name: 'project-settings',
    dest: 'public/docs/project-settings.png',
    note: 'docs/settings — Project Details',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Project Details');
    },
    async rect(app) {
      const r = await app.rectOf('.app-dialog-surface');
      if (!r) throw new Error('settings panel not on screen');
      return pad(r, 16);
    },
  },
  {
    name: 'view-toggle',
    dest: 'public/docs/view-toggle.png',
    note: 'docs — scene metadata row + Beats/Page toggle',
    win: [920, 952],
    async setup(app) {
      await ensureScene(app);
      await closeDialog(app);
      await setSidebar(app, false);
      await setRefs(app, 400);
      await setBeatOpen(app, false);
      await app.resetScroll();
    },
    async rect(app) {
      // From the project subtitle down through the Beats/Page control.
      const box = await app.jsJSON(`(function(){
        var h=document.querySelector('main header'); if(!h) return null;
        var sub=h.children[1]||h.children[0];
        var beats=Array.prototype.find.call(document.querySelectorAll('button'),function(b){return (b.textContent||'').trim()==='Beats';});
        if(!beats) return null;
        var a=sub.getBoundingClientRect(), b=beats.getBoundingClientRect(), hr=h.getBoundingClientRect();
        return [Math.round(hr.x), Math.round(a.y), Math.round(hr.width), Math.round(b.bottom-a.y)];
      })()`);
      if (!box) throw new Error('scene header not found');
      return pad(box, 12);
    },
  },

  /* ---- marketing: v1.2 differentiators ---------------------------------- */
  {
    name: 'page-view',
    dest: 'src/assets/page-view.png',
    note: '/features v1.2 — full-page prose editing, Page toggle active',
    win: [1200, 952],
    aspect: 1.25,
    minAspect: 1.204,
    minWidthPx: 1060,
    async setup(app) {
      await ensureScene(app);
      const pageScene = (await sceneList(app)).find((x) => x.mode === 'page' && x.type === 'normal');
      if (!pageScene) throw new Error('no page-mode scene in the fixture');
      await setSidebar(app, true);
      await selectScene(app, pageScene.title, pageScene.chapter);
      await setSidebar(app, false);
      await setRefs(app, null);
      await app.resetScroll();
      // The point of this figure is the prose surface, so bring it up with just
      // enough of the SCENE PROSE header and toolbar above it for context.
      await app.scrollTo('.novel-pages-container', 150);
    },
    async rect(app) {
      const h = await app.rectOf('main header');
      if (!h) throw new Error('scene header not found');
      return [h[0] - 24, 0, h[2] + 48, 0];
    },
  },
  {
    name: 'screenplay',
    dest: 'src/assets/screenplay.png',
    note: '/features v1.2 — slugline input, page estimator, ACT sequences',
    win: [1200, 952],
    aspect: 1.25,
    minAspect: 1.204,
    minWidthPx: 1060,
    async setup(app) {
      await closeDialog(app);
      await ensureProject(app, 'The Letter \u2014 Screenplay');
      await setSidebar(app, true);
      const scenes = await sceneList(app, 'The Letter \u2014 Screenplay');
      const slug = scenes.find((x) => /^(INT|EXT)\./.test(x.title)) || scenes[0];
      if (!slug) throw new Error('no screenplay scenes in the fixture');
      await selectScene(app, slug.title, slug.chapter);
      await setRefs(app, null); // the screenplay fixture carries no references
      await app.resetScroll();
    },
    async rect(app) {
      // Run to the right edge of the editor's content column so the slugline row
      // isn't sliced mid-field.
      const h = await app.rectOf('main header');
      const vp = await app.viewport();
      if (!h) throw new Error('scene header not found');
      return [0, 0, Math.min(h[0] + h[2] + 28, vp.iw), 0];
    },
  },
  {
    name: 'planning-states',
    dest: 'src/assets/planning-states.png',
    note: 'home + /story-outlining-software — planning marks in the tree beside the Planning control',
    win: [1200, 952],
    // Wider than the other feature figures on purpose: this one also sits in a
    // `.content-section` on /story-outlining-software, which is 852px of content
    // against the same 440px max-height, so that slot needs ratio >= 1.94. One
    // wide asset clears both slots; a 1.25 crop would lose a third of its height
    // on the SEO page.
    aspect: 1.95,
    minAspect: 1.94,
    minWidthPx: 1704, // 2x the 852px content-section width
    async setup(app) {
      await closeDialog(app);
      await ensureScene(app);
      await setSidebar(app, true);
      const scenes = await sceneList(app);
      const flexible = scenes.find((x) => x.plan !== 'fixed') || scenes[scenes.length - 1];
      await selectScene(app, flexible.title, flexible.chapter);
      await setRefs(app, null);
      await app.resetScroll();
    },
    async rect(app) {
      const h = await app.rectOf('main header');
      const vp = await app.viewport();
      if (!h) throw new Error('scene header not found');
      return [0, 0, Math.min(h[0] + h[2] + 28, vp.iw), 0];
    },
  },

  {
    name: 'import-formats',
    dest: 'src/assets/import-formats.png',
    note: 'home — the import formats offered on the project picker',
    win: [1440, 1000],
    aspect: 1.25,
    minAspect: 1.204,
    minWidthPx: 1060,
    async setup(app) {
      await closeDialog(app);
      if (!(await app.truthy(AT_PICKER))) {
        await setSidebar(app, true);
        await app.clickLabel('All Projects');
        await app.waitFor(AT_PICKER, { what: 'the project picker' });
      }
      await app.resetScroll();
      await app.scrollTo('[data-testid="import-section"]', 16);
    },
    async rect(app) {
      const c = await app.rectOf('[data-testid="import-section"]');
      if (!c) throw new Error('import panel not found on the picker');
      // Include the entire format grid and enough native pixels for its widest
      // marketing slot. The current picker has six formats in a two-column grid.
      const w = Math.max(530, c[2] + 32, Math.ceil((c[3] + 32) * 1.25));
      const h = Math.ceil(w / 1.25);
      const vp = await app.viewport();
      // Keep the adjacent Recent Projects column outside the frame.
      const x = Math.max(0, Math.min(c[0] + c[2] + 16 - w, vp.iw - w));
      const y = Math.max(0, Math.min(c[1] - 16, vp.ih - h));
      return [x, y, w, h];
    },
  },

  /* ---- docs: references ------------------------------------------------- */
  {
    name: 'reference-detail',
    dest: 'public/docs/reference-detail.png',
    note: 'docs/references — panel structure + expanded card: typed fields and tag pills',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, 600);
      await collapseRefRows(app);
      await setSuggestionsOpen(app, false);
      await expandRefRow(app, 'Eleanor Blackwood');
    },
    async rect(app) {
      const r = await app.rectOf(REFS);
      return [r[0], 0, r[2], 780];
    },
  },
  {
    name: 'reference-suggestions',
    dest: 'public/docs/reference-suggestions.png',
    note: 'docs/references — smart detection: Suggested block with confidence',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await setSidebar(app, true);
      // Suggestions are per scene and can have been dismissed, so pick whichever
      // scene currently has the most rather than assuming a particular one.
      const counts = await suggestionCounts(app);
      const best = counts.slice().sort((a, b) => b.n - a.n)[0];
      if (!best || best.n === 0) {
        throw new Error('no scene has reference suggestions — recreate the demo fixture (dismissals persist)');
      }
      await selectScene(app, best.title, best.chapter);
      await setSidebar(app, false);
      await setRefs(app, 600);
      await collapseRefRows(app);
      if (!(await setSuggestionsOpen(app, true))) throw new Error('could not open the suggestion block');
    },
    async rect(app) {
      const r = await app.rectOf(REFS);
      // Anchor on the suggestion rows themselves: the scene with the most
      // suggestions may have no linked references, so no divider to measure to.
      const bottom = await app.jsJSON(`(function(){
        var a=document.querySelector('main > .writing-surface > aside[class*="border-l"]'); if(!a) return null;
        var rows=a.querySelectorAll('button[aria-label^="Dismiss suggestion"]');
        if(!rows.length) return null;
        var max=0;
        rows.forEach(function(b){var y=b.getBoundingClientRect().bottom; if(y>max) max=y;});
        return Math.round(max);
      })()`);
      if (bottom == null) throw new Error('no suggestion rows on screen');
      return [r[0], 0, r[2], bottom + 24];
    },
  },

  /* ---- docs: project settings sections ---------------------------------- */
  {
    name: 'tag-manager',
    dest: 'public/docs/tag-manager.png',
    note: 'docs — Tags in unified Settings',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Tags');
    },
    async rect(app) {
      return pad(await dialogSurface(app), 16);
    },
  },
  {
    name: 'custom-fields',
    dest: 'public/docs/custom-fields.png',
    note: 'docs — Custom Fields in unified Settings',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Custom Fields');
    },
    async rect(app) {
      return pad(await dialogSurface(app), 16);
    },
  },
  {
    name: 'reference-types',
    dest: 'public/docs/reference-types.png',
    note: 'docs — Reference Types in unified Settings',
    win: [1200, 952],
    async setup(app) {
      await ensureScene(app);
      await openSettingsArea(app, 'Reference Types');
    },
    async rect(app) {
      return pad(await dialogSurface(app), 16);
    },
  },

  /* ---- docs: find & replace, export ------------------------------------- */
  {
    name: 'find-replace',
    dest: 'public/docs/find-replace.png',
    note: 'docs/scene-workflow — Find and Replace with project-wide results',
    win: [1200, 952],
    async setup(app) {
      await closeDialog(app);
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, null);
      await openDialog(app, 'Find and replace in project', '.find-dialog');
      // An empty dialog shows "No matches found", which documents nothing. Seed a
      // term that appears throughout the fixture's prose.
      const typed = await app.js(`(function(){
        var d=document.querySelector('.find-dialog');
        var inp=d && d.querySelector('input[type=text], input:not([type])');
        if(!inp) return '0';
        inp.focus(); inp.value='Eleanor';
        inp.dispatchEvent(new Event('input',{bubbles:true}));
        return '1';
      })()`);
      if (typed !== '1') throw new Error('could not reach the Find field');
      await app.waitFor(
        `(function(){var t=document.querySelector('.find-dialog').innerText;
          return /\\d+ match/.test(t) && !/No matches found/.test(t)})()`,
        { what: 'search results' }
      );
    },
    async rect(app) {
      const r = await app.rectOf('.find-dialog');
      if (!r) throw new Error('Find and Replace dialog not open');
      return pad(r, 16);
    },
  },
  {
    name: 'export-dialog',
    dest: 'public/docs/export-dialog.png',
    note: 'docs/exporting-projects — format list including novelWriter',
    win: [1200, 952],
    async setup(app) {
      await closeDialog(app);
      await ensureScene(app);
      await openDialog(app, 'Export project', '.app-dialog-surface');
    },
    async rect(app) {
      return pad(await dialogSurface(app), 16);
    },
  },

  /* ---- docs: scene workflow --------------------------------------------- */
  {
    name: 'beats-list',
    dest: 'public/docs/beats-list.png',
    note: 'docs/scene-workflow — beats as collapsible cards with word counts',
    win: [1200, 952],
    async setup(app) {
      await closeDialog(app);
      await ensureScene(app);
      await setSidebar(app, false);
      await setRefs(app, null);
      await setBeatOpen(app, false);
      await app.resetScroll();
      // `main section` alone matches the synopsis block, so scroll by the first
      // beat card and leave room above it for the BEATS heading.
      await app.scrollTo('main section article', 96);
    },
    async rect(app) {
      const box = await app.jsJSON(`(function(){
        var sec=Array.prototype.find.call(document.querySelectorAll('main section'),
          function(x){return !!x.querySelector('article')});
        if(!sec) return null;
        var arts=sec.querySelectorAll('article');
        var last=arts[arts.length-1].getBoundingClientRect();
        var b=sec.getBoundingClientRect();
        return [Math.round(b.x),Math.round(b.width),Math.round(Math.min(last.bottom+20,innerHeight))];
      })()`);
      if (!box) throw new Error('no beats section with cards');
      const [x, w, bottom] = box;
      return [x - 24, 0, w + 48, bottom];
    },
  },
  {
    name: 'scene-sidebar',
    dest: 'public/docs/scene-sidebar.png',
    note: 'docs/scene-workflow — chapter tree with scene type, status and planning marks',
    win: [1200, 952],
    async setup(app) {
      await closeDialog(app);
      await ensureScene(app);
      await setSidebar(app, true);
      // Only one chapter opens at a time; pick the one carrying the notes-type
      // and flexible-planning scenes so their marks are in shot.
      const scenes = await suggestionCounts(app);
      const last = scenes[scenes.length - 1];
      await selectScene(app, last.title, last.chapter);
      await app.resetScroll();
    },
    async rect(app) {
      const r = await app.rectOf(SIDEBAR);
      if (!r) throw new Error('sidebar not open');
      // Leave room for the session statistics now above the chapter tree.
      return [r[0], r[1], r[2], Math.min(r[3], 640)];
    },
  },

  /* ---- docs: sync ------------------------------------------------------- */
  {
    name: 'sync-preview',
    dest: 'public/docs/sync-preview.png',
    note: 'docs/sync-and-reimport — new items plus a prose diff, awaiting selection',
    win: [1200, 952],
    async setup(app) {
      await closeDialog(app);
      await ensureProject(app, 'The Letter \u2014 Source Outline');
      await ensureSourceDrift(app);
      const ok = await app.js(
        `(function(){var b=document.querySelector('[data-testid="sync-button"]'); if(!b) return '0'; b.click(); return '1'})()`
      );
      if (ok !== '1') throw new Error('no sync button — is the source-backed project open?');
      await app.waitFor(`!!document.querySelector('[role=dialog]')`, { what: 'sync preview dialog' });
      await sleep(700);
    },
    async rect(app) {
      return pad(await dialogSurface(app), 14);
    },
  },
];

/* ------------------------------------------------------------------- pipeline */

async function capture(app, t) {
  process.stdout.write(`  ${t.name.padEnd(17)}`);
  // Drop the previous target's capture CSS: it hides the expand tabs, which the
  // next target may need to click.
  await app.unstyle();
  await closeDialog(app);
  await app.setSize(...t.win);
  await app.raise();
  await t.setup(app);

  const vp = await app.viewport();
  const rect = fitAspect(await t.rect(app), t.aspect, vp);
  const [x, y, w, h] = rect;
  if (w < 40 || h < 40) throw new Error(`degenerate rect ${rect.join(',')}`);

  await app.raise();
  await app.parkCursor();
  await sleep(200);
  const { ox, oy } = await app.origin();
  const out = path.join(WORK, `${t.name}.png`);
  sh('/usr/sbin/screencapture', ['-x', `-R${ox + x},${oy + y},${w},${h}`, out]);

  if (OPTIMIZE) sh('oxipng', ['-o', '2', '--strip', 'safe', '-q', out]);

  const [pw, ph] = sh('magick', ['identify', '-format', '%w %h', out]).split(/\s+/).map(Number);
  if (pw < w * 2 || ph < h * 2) {
    throw new Error(`capture is ${pw}x${ph}; need at least ${w * 2}x${h * 2} for 2x. Keep Kindling on the HiDPI main display`);
  }
  const ratio = pw / ph;
  // Kindling's UI is light paper; real captures measure 0.74-0.94 mean. Anything
  // dark means we photographed a different window sitting on top.
  const mean = Number(sh('magick', ['identify', '-format', '%[fx:mean]', out]));
  if (mean < 0.55) {
    throw new Error(`captured another window (mean brightness ${mean.toFixed(2)}) — Kindling was not frontmost`);
  }
  if (t.minAspect && ratio < t.minAspect - 0.002) {
    throw new Error(`ratio ${ratio.toFixed(3)} below ${t.minAspect} — this slot would crop`);
  }
  // Guards against fitAspect quietly shrinking a capture that had too little
  // room beneath it: the source must still cover the slot at 2x.
  if (t.minWidthPx && pw < t.minWidthPx) {
    throw new Error(`only ${pw}px wide, need >=${t.minWidthPx} for a crisp 2x render`);
  }
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(
    `${String(pw).padStart(5)}x${String(ph).padEnd(5)} r=${ratio.toFixed(2)}  ` +
      `${String(kb).padStart(4)} KB  lum=${mean.toFixed(2)}`
  );
  return { ...t, out, pw, ph, ratio, kb };
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  for (const bin of ['cliclick', 'magick', ...(OPTIMIZE ? ['oxipng'] : [])]) {
    try {
      sh('command', ['-v', bin]);
    } catch {
      try {
        sh('/usr/bin/which', [bin]);
      } catch {
        console.error(`missing required tool: ${bin}  (brew install ${bin === 'magick' ? 'imagemagick' : bin})`);
        process.exit(1);
      }
    }
  }

  const app = new App();
  await app.connect();

  const targets = TARGETS.filter((t) => !ONLY.length || ONLY.includes(t.name));
  if (!targets.length) {
    console.error(`no targets matched --only ${ONLY.join(',')}`);
    console.error(`available: ${TARGETS.map((t) => t.name).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nCapturing ${targets.length} target(s) into ${WORK}\n`);
  const done = [];
  let failed = 0;
  for (const t of targets) {
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        done.push(await capture(app, t));
        ok = true;
      } catch (e) {
        if (attempt === 1) {
          process.stdout.write(`retrying (${e.message})\n  ${''.padEnd(17)}`);
          await closeDialog(app);
          await app.unstyle();
          await sleep(400);
        } else {
          failed++;
          console.log(`FAILED — ${e.message}`);
        }
      }
    }
  }

  await closeDialog(app);
  await app.unstyle();
  app.close();

  if (INSTALL && done.length) {
    console.log('');
    for (const d of done) {
      fs.copyFileSync(d.out, path.join(REPO, d.dest));
      console.log(`  installed  ${d.dest}`);
    }
    console.log(`\nNow run: npm run build`);
  } else if (done.length) {
    console.log(`\n--keep: left in ${WORK}, nothing installed.`);
  }

  if (failed) {
    console.error(`\n${failed} target(s) failed.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`\n${e.stack || e.message}`);
  process.exit(1);
});
