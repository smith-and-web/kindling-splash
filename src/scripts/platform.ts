/**
 * Platform detection — the single source of truth for "what is this visitor on".
 *
 * This used to exist twice: once in SmartDownloadButton.svelte (User-Agent
 * Client Hints, mobile-aware) and once as an inline script on /download/
 * (userAgent only, no mobile branch). They disagreed, so the same bug had to
 * be fixed in two places.
 */

export type DetectedOS = 'mac' | 'windows' | 'linux' | null;

export interface DetectedPlatform {
  /** Desktop OS, or null when we can't tell or the visitor is on mobile. */
  os: DetectedOS;
  /** True for phones and tablets — anything that can't run a desktop binary. */
  isMobile: boolean;
}

export function detectPlatform(): DetectedPlatform {
  if (typeof navigator === 'undefined') return { os: null, isMobile: false };

  const ua = navigator.userAgent;
  const legacyPlatform = (navigator.platform || '').toLowerCase();

  /*
   * iPadOS 13+ browses "desktop-class": its userAgent says Macintosh and
   * navigator.platform is MacIntel, so a naive check calls it a Mac and
   * cheerfully offers a .dmg. maxTouchPoints separates them — a real Mac
   * reports 0 (or 1 with a touch bar), an iPad reports 5.
   */
  const isIPadOS = legacyPlatform.includes('mac') && (navigator.maxTouchPoints ?? 0) > 1;
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (isMobileUA || isIPadOS) return { os: null, isMobile: true };

  // Chromium User-Agent Client Hints, where available — more reliable than
  // sniffing the UA string, and it reports mobile directly.
  const uad = (navigator as unknown as {
    userAgentData?: { platform?: string; mobile?: boolean };
  }).userAgentData;
  if (uad) {
    if (uad.mobile) return { os: null, isMobile: true };
    const p = (uad.platform ?? '').toLowerCase();
    if (p.includes('mac')) return { os: 'mac', isMobile: false };
    if (p.includes('win')) return { os: 'windows', isMobile: false };
    if (p.includes('linux') || p.includes('chromeos')) return { os: 'linux', isMobile: false };
  }

  // Fallback: classic userAgent string.
  if (/Macintosh|Mac OS X/i.test(ua)) return { os: 'mac', isMobile: false };
  if (/Windows/i.test(ua)) return { os: 'windows', isMobile: false };
  if (/Linux/i.test(ua)) return { os: 'linux', isMobile: false };

  return { os: null, isMobile: false };
}
