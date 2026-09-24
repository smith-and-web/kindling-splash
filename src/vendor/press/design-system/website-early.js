/* kindling Press website early behaviors, v0.1.0.
   Inline this in <head>, before any stylesheet paints. It is optional; without
   it website.js behaves exactly as before.

   Why: at container widths at or below 820px the navigation collapses behind
   its menu button, but website.css only collapses it once website.js has bound
   the button and set data-pw-ready. When that script arrives after first paint
   — a slow phone, a large page bundle — the page paints with every link
   expanded and then snaps shut, moving everything below the header.
   kindlingwriter.com measured that layout shift at 0.165 on /download/.

   What it does:
   1. Marks <html> with data-pw-js before paint. website.css collapses the nav
      on that flag as well as on data-pw-ready, so the first frame is already
      collapsed. Without JavaScript the flag is never set and every link stays
      visible, as the contract requires.
   2. Makes the menu button work until website.js binds it: a delegated click
      toggles data-open and aria-expanded. Once website.js sets data-pw-ready
      on the nav, this handler steps aside and the full behaviour (focus,
      Escape, outside click) takes over. If website.js never loads, the menu
      still opens and closes.

   No requests, analytics or storage. */
(function () {
  var root = document.documentElement;
  root.setAttribute('data-pw-js', '');
  document.addEventListener('click', function (event) {
    var toggle = event.target instanceof Element ? event.target.closest('[data-pw-menu]') : null;
    var nav = toggle ? toggle.closest('[data-pw-nav]') : null;
    if (!nav || nav.hasAttribute('data-pw-ready')) return;
    var open = !nav.hasAttribute('data-open');
    if (open) nav.setAttribute('data-open', ''); else nav.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();
