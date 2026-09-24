// Platform detection — the single source of truth for "what is this visitor on".
//
// Inlined in MarketingLayout's <head> (a classic script, like analytics.js), so
// it runs before the first paint and records its answer on <html>:
//
//   data-device="mobile" | "desktop"   phones and tablets can't run a desktop binary
//   data-os="mac" | "windows" | "linux"  set only for a desktop OS it can identify
//
// CSS can then lay a page out for the visitor's device in the first frame. On
// /download/ the "kindling is a desktop app" notice used to be revealed by a
// module script after paint, which pushed the platform picker down on every
// phone — a layout shift PageSpeed measured at up to 0.15 once first paint got
// faster. Scripts read the answer through detectPlatform() in platform.ts.
//
// Detection used to exist twice (SmartDownloadButton and an inline script on
// /download/); they disagreed, so every fix had to be made twice. Keep it here.
(function () {
  var root = document.documentElement;
  var ua = navigator.userAgent;
  var legacyPlatform = (navigator.platform || '').toLowerCase();

  function record(os, mobile) {
    root.dataset.device = mobile ? 'mobile' : 'desktop';
    if (os) root.dataset.os = os;
  }

  // iPadOS 13+ browses "desktop-class": its userAgent says Macintosh and
  // navigator.platform is MacIntel, so a naive check calls it a Mac and
  // cheerfully offers a .dmg. maxTouchPoints separates them — a real Mac
  // reports 0 (or 1 with a touch bar), an iPad reports 5.
  var isIPadOS = legacyPlatform.indexOf('mac') !== -1 && (navigator.maxTouchPoints || 0) > 1;
  var isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isMobileUA || isIPadOS) return record(null, true);

  // Chromium User-Agent Client Hints, where available — more reliable than
  // sniffing the UA string, and it reports mobile directly.
  var uad = navigator.userAgentData;
  if (uad) {
    if (uad.mobile) return record(null, true);
    var p = (uad.platform || '').toLowerCase();
    if (p.indexOf('mac') !== -1) return record('mac', false);
    if (p.indexOf('win') !== -1) return record('windows', false);
    if (p.indexOf('linux') !== -1 || p.indexOf('chromeos') !== -1) return record('linux', false);
  }

  // Fallback: classic userAgent string.
  if (/Macintosh|Mac OS X/i.test(ua)) return record('mac', false);
  if (/Windows/i.test(ua)) return record('windows', false);
  if (/Linux/i.test(ua)) return record('linux', false);
  return record(null, false);
})();
