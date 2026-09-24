/**
 * Platform detection, as recorded before first paint.
 *
 * The detection itself lives in `platform-detect.js`, inlined in
 * MarketingLayout's <head> so CSS can lay a page out for the visitor's device
 * in the first frame. This reads what it recorded on <html>; there is one
 * implementation, not two that can disagree.
 */

export type DetectedOS = 'mac' | 'windows' | 'linux' | null;

export interface DetectedPlatform {
  /** Desktop OS, or null when we can't tell or the visitor is on mobile. */
  os: DetectedOS;
  /** True for phones and tablets — anything that can't run a desktop binary. */
  isMobile: boolean;
}

const OSES: readonly DetectedOS[] = ['mac', 'windows', 'linux'];

export function detectPlatform(): DetectedPlatform {
  if (typeof document === 'undefined') return { os: null, isMobile: false };
  const { device, os } = document.documentElement.dataset;
  const known = OSES.includes(os as DetectedOS) ? (os as DetectedOS) : null;
  return { os: device === 'mobile' ? null : known, isMobile: device === 'mobile' };
}
