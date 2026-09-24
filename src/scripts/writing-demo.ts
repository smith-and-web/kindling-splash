/*
 * The home-page writing demo, brought to life.
 *
 * Two jobs, one set of motions:
 *
 * 1. A tour. While the demo is on screen, it walks through the scene
 *    workspace unprompted — opening a beat, reading down its draft, turning
 *    to the Page view and back, expanding a reference, moving to another
 *    scene and chapter, and returning — slowly, with long eased transitions,
 *    so the product reads as calm and complete rather than busy.
 *
 * 2. The visitor's own clicks. Every beat, reference, chapter, scene, view
 *    and region change a visitor makes runs through the same functions the
 *    tour uses, so their interactions move exactly as the tour does.
 *
 * The first click, keypress, wheel or touch-scroll inside the workspace (or
 * keyboard focus arriving in it) stops the tour where it is. Nothing resets:
 * any transition already in flight is quickened to its end state, and the
 * demo stays exactly as the visitor found it. The Pause/Play control beside
 * the caption stops and resumes it too — WCAG 2.2.2 asks for one for any
 * motion that starts on its own and runs longer than five seconds — and
 * resuming continues from the current step, not the start.
 *
 * Everything here is an enhancement. The demo is native radios, `<details>`
 * and `:has()`, and works with this script absent. Under
 * `prefers-reduced-motion: reduce` the tour does not start on its own and
 * every transition is instant; the Play control still offers it.
 *
 * Analytics stay the visitor's alone: the tour sets state directly and fires
 * no events. A visitor's click on a beat reaches analytics.js before this
 * script changes anything (the change runs on the next frame), and a
 * visitor's scene choice re-dispatches `change` so `select_scene` records.
 */

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';
const EASE_EXIT = 'cubic-bezier(0.55, 0, 0.75, 0.3)';

/* Deliberately long. The application's own motion token is 160ms; a tour
   that is meant to be watched needs the eye to follow each change. These
   are Press's documented exception for this demo (DESIGN.md, "Motion"):
   transitions up to 560ms, reading glides up to 1.7s. */
const D = {
  expand: 560,
  fadeOut: 240,
  fadeIn: 540,
  stagger: 60,
  shift: 440,
  glide: 1100,
  read: 1700,
};

/* How long the tour rests on each state — long enough to read it. */
const DWELL = { settle: 1600, look: 2000, read: 2200, beat: 1000 };

type Region = 'outline' | 'main' | 'inspector';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reduceMotion.matches;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

class Aborted extends Error {}

export function initWritingDemo(root: HTMLElement, toggle: HTMLButtonElement | null) {
  const $ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector<T>(sel);
  const $$ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => [...from.querySelectorAll<T>(sel)];

  const sceneBody = $('.scene-body')!;
  const inspectorBody = $('#sample-references .ka-workspace-body')!;
  const outlineBody = $('#sample-outline .ka-workspace-body')!;
  const panes = $('.ka-workspace-panes')!;
  const sceneInputs = $$<HTMLInputElement>('input[name="sample-scene"]');
  const viewInputs = $$<HTMLInputElement>('input[name="sample-scene-view"]');
  const regionInputs = $$<HTMLInputElement>('input[name="sample-workspace-region"]');
  const regionEl: Record<Region, HTMLElement> = {
    outline: $('.ka-workspace-outline')!,
    main: $('.ka-workspace-main')!,
    inspector: $('.ka-workspace-inspector')!,
  };
  const regionOrder: Region[] = ['outline', 'main', 'inspector'];

  /* ---- Motion primitives ------------------------------------------------ */

  const running = new Set<Animation>();
  function animate(el: Element, frames: Keyframe[], o: { duration: number; easing?: string; delay?: number; fill?: FillMode }) {
    const a = el.animate(frames, {
      duration: reduced() ? 0 : o.duration,
      delay: reduced() ? 0 : o.delay ?? 0,
      easing: o.easing ?? EASE_OUT,
      fill: o.fill ?? 'none',
    });
    running.add(a);
    const done = () => running.delete(a);
    a.finished.then(done, done);
    return a;
  }
  const finished = (list: Animation[]) => Promise.all(list.map((a) => a.finished.catch(() => undefined)));

  /* Quicken whatever is in flight to its end state — never jump back. */
  function settle() {
    const list = [...running];
    for (const a of list) {
      try { a.updatePlaybackRate(6); } catch { /* already finished */ }
    }
    return finished(list);
  }

  /* A scroll that eases, for the tour's reading and for revealing what a
     visitor just opened. Cancelled — left where it is — by any interaction. */
  let glideFrame = 0;
  let glideDone: (() => void) | null = null;
  function cancelGlide() {
    cancelAnimationFrame(glideFrame);
    glideDone?.();
    glideDone = null;
  }
  function glide(el: HTMLElement, top: number, duration = D.glide) {
    cancelGlide();
    const from = el.scrollTop;
    const to = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
    if (reduced() || Math.abs(to - from) < 1) { el.scrollTop = to; return Promise.resolve(); }
    return new Promise<void>((resolve) => {
      glideDone = resolve;
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        el.scrollTop = from + (to - from) * easeInOut(t);
        if (t < 1) glideFrame = requestAnimationFrame(frame);
        else { glideDone = null; resolve(); }
      };
      glideFrame = requestAnimationFrame(frame);
    });
  }
  const offsetIn = (el: Element, scroller: HTMLElement) =>
    el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  const scrollerOf = (el: Element) => el.closest<HTMLElement>('.ka-workspace-body');

  /* ---- Disclosures ------------------------------------------------------ */

  const busy = new WeakMap<HTMLDetailsElement, Promise<void>>();

  /* Open or close a `<details>` with its height, its content and its
     chevron moving together. Opening grows the element to its natural
     height while the content rises into place; closing fades the content
     and draws the element back to its summary, and only then closes it —
     so a closed beat's preview returns into view rather than popping. */
  async function setOpen(d: HTMLDetailsElement, open: boolean, { reveal = true } = {}) {
    const pending = busy.get(d);
    if (pending) await pending;
    if (d.open === open) return;
    /* Not on screen — another scene's beat, another region at a narrow
       width: there is nothing to watch, so just set it. */
    if (!d.getClientRects().length) { d.open = open; return; }
    const run = (async () => {
      const content = [...d.children].filter((c) => c.tagName !== 'SUMMARY');
      const preview = $('.ka-beat-preview', d.querySelector(':scope > summary')!);
      /* A closed beat's preview goes before the beat grows — otherwise, in
         the frame the preview disappears and the draft has yet to arrive,
         the beat shows an empty band of paper. */
      if (open && preview) await finished([animate(preview, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: EASE_EXIT, fill: 'forwards' })]);
      const from = d.getBoundingClientRect().height;
      let to: number;
      if (open) {
        d.open = true;
        to = d.getBoundingClientRect().height;
      } else {
        d.open = false;
        to = d.getBoundingClientRect().height;
        d.open = true;
        d.classList.add('is-closing');
      }
      d.style.overflow = 'clip';
      const motions = [animate(d, [{ height: `${from}px` }, { height: `${to}px` }], { duration: D.expand, easing: EASE_IN_OUT })];
      if (open) {
        for (const c of content) {
          motions.push(animate(c, [{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'none' }], { duration: D.expand, fill: 'backwards' }));
        }
        preview?.getAnimations().forEach((a) => a.cancel());
        if (reveal) revealWithin(d, to);
      } else {
        for (const c of content) {
          motions.push(animate(c, [{ opacity: 1 }, { opacity: 0 }], { duration: D.expand * 0.55, easing: EASE_EXIT, fill: 'forwards' }));
        }
      }
      await finished(motions.slice(0, 1));
      if (!open) {
        d.open = false;
        d.classList.remove('is-closing');
        for (const c of content) c.getAnimations().forEach((a) => a.cancel());
        if (preview) animate(preview, [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: D.fadeIn });
      }
      d.style.overflow = '';
    })();
    busy.set(d, run);
    try { await run; } finally { busy.delete(d); }
  }

  /* After opening something, ease its scroller so the whole of it is in
     view — or, if it is taller than the view, so it starts near the top. */
  function revealWithin(el: Element, finalHeight: number) {
    const scroller = scrollerOf(el);
    if (!scroller) return;
    const top = offsetIn(el, scroller);
    const view = scroller.clientHeight;
    const inset = 16;
    const visibleTop = scroller.scrollTop;
    if (top - inset >= visibleTop && top + finalHeight <= visibleTop + view) return;
    const target = finalHeight + inset * 2 > view ? top - inset : top + finalHeight + inset - view;
    glide(scroller, target, D.expand + 200);
  }

  /* ---- Radio-driven views ----------------------------------------------- */

  const currentScene = () => sceneInputs.find((i) => i.checked)!.value;
  /* A scene lives in three regions. Each region's parts cascade on their
     own, starting together, so the whole workspace turns as one rather
     than one region waiting at the end of another's stagger. */
  const sceneGroups = (key: string) => [
    $$(`.scene-body [data-scene="${key}"] > .ka-scene-column > *`),
    $$(`#sample-references [data-scene="${key}"] .reference-list > *`),
    $$(`.ka-statusbar [data-scene="${key}"] > *`),
  ];
  const sceneUnits = (key: string) => sceneGroups(key).flat();
  const regionNow = (): Region => (regionInputs.find((i) => i.checked)?.value as Region) ?? 'main';
  const panesShown = () => getComputedStyle(panes).display !== 'none';

  type Offset = { x?: number; y?: number };
  const at = ({ x = 0, y = 0 }: Offset) => `translate(${x}px, ${y}px)`;

  function enter(units: Element[], from: Offset = { y: 20 }) {
    return units.map((el, i) =>
      animate(el, [{ opacity: 0, transform: at(from) }, { opacity: 1, transform: 'none' }], {
        duration: D.fadeIn, delay: i * D.stagger, fill: 'backwards',
      }));
  }
  function leave(units: Element[], to: Offset = { y: -10 }) {
    return units.map((el) =>
      animate(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: at(to) }], {
        duration: D.fadeOut, easing: EASE_EXIT, fill: 'forwards',
      }));
  }

  /* Swap a radio-driven view: the outgoing content eases away, the radio
     changes (so the CSS that already drives the demo does the switch), then
     the incoming content eases into place in sequence. */
  async function swap(input: HTMLInputElement, outgoing: Element[], incoming: () => Element[][], motion: { from?: Offset; to?: Offset } = {}) {
    const exits = leave(outgoing, motion.to);
    await finished(exits);
    input.checked = true;
    exits.forEach((a) => a.cancel());
    await finished(incoming().flatMap((group) => enter(group, motion.from)));
  }

  async function showScene(key: string) {
    const input = sceneInputs.find((i) => i.value === key);
    if (!input || input.checked) return;
    const chapter = input.closest<HTMLDetailsElement>('details');
    if (chapter && !chapter.open) await setOpen(chapter, true);
    const from = currentScene();
    await swap(input, sceneUnits(from), () => { sceneBody.scrollTop = 0; inspectorBody.scrollTop = 0; return sceneGroups(key); });
  }

  async function setView(value: 'beats' | 'page') {
    const input = viewInputs.find((i) => i.value === value);
    if (!input || input.checked) return;
    const scene = $(`.scene-body [data-scene="${currentScene()}"]`)!;
    const [outSel, inSel] = value === 'page' ? ['.scene-beats', '.scene-page'] : ['.scene-page', '.scene-beats'];
    /* Rise to the top first: the page is shorter than the beats, so
       swapping while scrolled down would clamp the scroll and jump. */
    await glide(sceneBody, 0, D.shift);
    await swap(input, [$(outSel, scene)!], () => [[$(inSel, scene)!]], { from: { y: 28 }, to: { y: -14 } });
  }

  async function showRegion(region: Region) {
    if (!panesShown()) return;
    const input = regionInputs.find((i) => i.value === region);
    if (!input || input.checked) return;
    const outgoing = regionEl[regionNow()];
    const incoming = regionEl[region];
    const dir = Math.sign(regionOrder.indexOf(region) - regionOrder.indexOf(regionNow())) || 1;
    /* The regions share one grid cell at this width, so the outgoing one can
       stay painted beneath the incoming for a true crossfade — no empty
       frame between them. */
    outgoing.style.display = 'flex';
    outgoing.style.pointerEvents = 'none';
    input.checked = true;
    const out = leave([outgoing], { x: dir * -24 });
    await finished([...out, ...enter([incoming], { x: dir * 36 })]);
    out.forEach((a) => a.cancel());
    outgoing.style.display = '';
    outgoing.style.pointerEvents = '';
  }

  /* ---- The visitor ------------------------------------------------------ */

  let dispatching = false;
  async function choose(input: HTMLInputElement) {
    if (input.name === 'sample-scene') {
      await showScene(input.value);
      dispatching = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      dispatching = false;
      await showRegion('main');
    } else if (input.name === 'sample-scene-view') {
      await setView(input.value as 'beats' | 'page');
    } else if (input.name === 'sample-workspace-region') {
      await showRegion(input.value as Region);
    }
  }

  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const summary = target.closest('summary');
    if (summary && root.contains(summary)) {
      const details = summary.parentElement as HTMLDetailsElement;
      event.preventDefault();
      /* Next frame, so analytics.js sees the beat as it was when clicked. */
      requestAnimationFrame(async () => { await settle(); setOpen(details, !details.open); });
      return;
    }
    const input = target instanceof HTMLInputElement && target.type === 'radio'
      ? target
      : target.closest('label')?.querySelector<HTMLInputElement>('input[type="radio"]');
    if (input && root.contains(input) && !input.checked) {
      event.preventDefault();
      requestAnimationFrame(async () => { await settle(); choose(input); });
    }
  });

  /* Arrow keys move a radio group natively, without a click; the change has
     already happened, so bring the new content in. */
  root.addEventListener('change', (event) => {
    if (dispatching) return;
    const input = event.target as HTMLInputElement;
    if (input.name === 'sample-scene') {
      sceneBody.scrollTop = 0;
      sceneGroups(input.value).forEach((group) => enter(group));
      if (panesShown()) regionInputs.find((i) => i.value === 'main')!.checked = true;
    } else if (input.name === 'sample-scene-view') {
      enter([$(`.scene-body [data-scene="${currentScene()}"] ${input.value === 'page' ? '.scene-page' : '.scene-beats'}`)!], { y: 28 });
    } else if (input.name === 'sample-workspace-region') {
      enter([regionEl[input.value as Region]], { x: 24 });
    }
  });

  /* ---- The tour --------------------------------------------------------- */

  const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted());
    const id = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(id); reject(new Aborted()); }, { once: true });
  });
  const guard = (signal: AbortSignal) => { if (signal.aborted) throw new Aborted(); };

  const scenesInOrder = sceneInputs.map((i) => i.value);
  const beatsOf = (key: string) => $$<HTMLDetailsElement>(`.scene-body [data-scene="${key}"] .ka-beat`);
  const draftedBeats = (key: string) => beatsOf(key).filter((b) => b.querySelector('.ka-beat-preview, .ka-manuscript'));
  const referencesOf = (key: string) => $$<HTMLDetailsElement>(`#sample-references [data-scene="${key}"] .ka-reference`);
  const home = currentScene();
  const tourScenes = [home, ...scenesInOrder.filter((k) => k !== home && draftedBeats(k).length)].slice(0, 3);

  async function closeAll(list: HTMLDetailsElement[], except?: HTMLDetailsElement) {
    await Promise.all(list.filter((d) => d !== except && d.open).map((d) => setOpen(d, false)));
  }
  async function focusBeat(beat: HTMLDetailsElement, signal: AbortSignal) {
    guard(signal);
    await showRegion('main');
    await closeAll(beatsOf(currentScene()), beat);
    guard(signal);
    await setOpen(beat, true);
  }
  async function focusReference(key: string, index: number, signal: AbortSignal) {
    const refs = referencesOf(key);
    const ref = refs[Math.min(index, refs.length - 1)];
    if (!ref) return;
    guard(signal);
    await showRegion('inspector');
    await closeAll(refs, ref);
    guard(signal);
    await setOpen(ref, true);
  }
  async function readDown(beat: HTMLDetailsElement, signal: AbortSignal) {
    const quote = beat.querySelector('blockquote');
    const target = quote ?? beat.querySelector('.ka-manuscript-prose p:last-child');
    if (!target) return;
    guard(signal);
    await glide(sceneBody, offsetIn(target, sceneBody) - sceneBody.clientHeight * 0.25, D.read);
  }

  type Step = (signal: AbortSignal) => Promise<void>;
  const steps: Step[] = [(s) => sleep(DWELL.settle, s)];

  tourScenes.forEach((key, index) => {
    if (index > 0) {
      steps.push(async (s) => {
        guard(s);
        await showRegion('outline');
        /* Open the next chapter, move the selection into it, and only then
           fold the chapter behind — so the selected row never disappears. */
        const chapter = sceneInputs.find((i) => i.value === key)!.closest('details')!;
        await showScene(key);
        await closeAll($$<HTMLDetailsElement>('.ka-tree > .ka-tree-list > li > details'), chapter);
        await sleep(DWELL.beat, s);
        await showRegion('main');
        await sleep(DWELL.look, s);
      });
    }
    const beats = draftedBeats(key).slice(0, index === 0 ? 2 : 1);
    beats.forEach((beat, beatIndex) => {
      steps.push(async (s) => { await focusBeat(beat, s); await sleep(DWELL.look, s); });
      if (index === 0 && beatIndex === 0) {
        steps.push(async (s) => { await readDown(beat, s); await sleep(DWELL.read, s); });
      }
    });
    if (index === 0) {
      steps.push(async (s) => {
        guard(s);
        await showRegion('main');
        await setView('page');
        await sleep(DWELL.beat, s);
        await glide(sceneBody, sceneBody.scrollTop + sceneBody.clientHeight * 0.6, D.read);
        await sleep(DWELL.read, s);
        await setView('beats');
        await sleep(DWELL.beat, s);
      });
    }
    steps.push(async (s) => { await focusReference(key, 1, s); await sleep(DWELL.look, s); });
  });

  /* Come home the way a writer would: close what was opened, return to the
     first scene, fold the other chapters, restore its first reference. */
  steps.push(async (s) => {
    guard(s);
    await showRegion('main');
    await closeAll(beatsOf(currentScene()));
    await glide(sceneBody, 0, D.shift);
    guard(s);
    /* Tidy the first scene while it is out of sight, so it returns as it
       began: beats closed, its first reference the open one. */
    await closeAll(beatsOf(home));
    const homeRefs = referencesOf(home);
    homeRefs.forEach((r, i) => { r.open = i === 0; });
    await showRegion('outline');
    await showScene(home);
    await closeAll($$<HTMLDetailsElement>('.ka-tree > .ka-tree-list > li > details'), sceneInputs.find((i) => i.value === home)!.closest('details')!);
    await sleep(DWELL.beat, s);
    await focusReference(home, 0, s);
    await showRegion('main');
    await sleep(DWELL.look, s);
  });

  let step = 0;
  let loop: AbortController | null = null;
  let stoppedByVisitor = false;
  let optedIn = false;
  let onScreen = false;

  const canPlay = () =>
    !stoppedByVisitor && onScreen && !document.hidden && (optedIn || !reduced());

  async function play() {
    const controller = new AbortController();
    loop = controller;
    root.dataset.tour = 'playing';
    try {
      while (!controller.signal.aborted) {
        await steps[step](controller.signal);
        step = (step + 1) % steps.length;
      }
    } catch (error) {
      if (!(error instanceof Aborted)) throw error;
    } finally {
      if (loop === controller) loop = null;
      if (!loop) root.dataset.tour = stoppedByVisitor ? 'stopped' : 'paused';
      renderToggle();
    }
  }
  function update() {
    if (canPlay() && !loop) play();
    else if (!canPlay() && loop) loop.abort();
    renderToggle();
  }

  /* The visitor has taken over: stop where we are. The current step's
     index is kept, so Play resumes from here rather than from the start. */
  function stop() {
    if (stoppedByVisitor) return;
    stoppedByVisitor = true;
    cancelGlide();
    settle();
    loop?.abort();
    update();
  }

  /* The control shows the visitor's intent, not the moment: while the tour
     waits off-screen it still reads "Pause tour", because it will play. */
  const intendsToPlay = () => !stoppedByVisitor && (optedIn || !reduced());
  /* One icon, redrawn, rather than a hidden second one: a control never
     carries an icon that renders at no size. Lucide pause and play. */
  const ICON = {
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z"/>',
  };
  function renderToggle() {
    if (!toggle) return;
    const playing = intendsToPlay();
    toggle.hidden = false;
    const svg = toggle.querySelector('svg');
    if (svg) svg.innerHTML = playing ? ICON.pause : ICON.play;
    const label = toggle.querySelector('[data-tour-label]');
    if (label) label.textContent = playing ? 'Pause tour' : 'Play tour';
  }

  toggle?.addEventListener('click', () => {
    if (intendsToPlay()) stop();
    else { stoppedByVisitor = false; optedIn = true; update(); }
  });

  /* Any real interaction with the workspace stops the tour. A mouse press
     stops it at once; a tap is recognised by its click, so a finger that
     only scrolls the page past the demo does not. A wheel or a drag stops it
     only inside a region that scrolls — that is the visitor reading, and the
     tour's own glide would fight them — not over the demo's bars. */
  root.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') stop(); }, { capture: true });
  root.addEventListener('click', stop, { capture: true });
  root.addEventListener('keydown', stop, { capture: true });
  for (const body of [sceneBody, inspectorBody, outlineBody]) {
    body.addEventListener('wheel', stop, { passive: true });
    body.addEventListener('touchmove', stop, { passive: true });
  }
  root.addEventListener('focusin', (e) => { if ((e.target as Element).matches(':focus-visible')) stop(); });

  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); }, { threshold: 0.5 }).observe(root);
  document.addEventListener('visibilitychange', update);
  reduceMotion.addEventListener('change', update);
  renderToggle();
}
