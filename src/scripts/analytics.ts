import { APP_VERSION } from '../data/downloads';

/**
 * GA4 event helpers for the kindling marketing site.
 *
 * All functions guard on `typeof gtag === 'function'` so they are safe to call
 * even when the GA snippet has not loaded (ad blockers, local dev, preview
 * hosts: public/analytics.js only loads on kindlingwriter.com).
 *
 * The event model (analytics sweep, 25 Sep 2026):
 * - `download_initiated` is the one key event: an installer download started.
 *   It fires exactly once per download, on every path: the thanks page, and
 *   the direct-installer fallbacks (modified clicks, storage denied).
 * - `download_click` and `download_cta_click` are intent, not outcomes. They
 *   are funnel steps, never key events, so a download is never counted twice.
 * - Scroll and outbound clicks come from GA4 enhanced measurement, and page
 *   groups from the `content_group` set in public/analytics.js.
 */

declare global {
  // eslint-disable-next-line no-var
  var gtag: ((...args: unknown[]) => void) | undefined;
}

function gtagSafe(...args: unknown[]): void {
  if (typeof gtag === 'function') {
    gtag(...args);
  }
}

/** User clicked a platform download button. Intent; the outcome is `trackDownloadStarted`. */
export function trackDownload(os: string, location: string, version = APP_VERSION): void {
  gtagSafe('event', 'download_click', {
    os_platform: os,
    cta_location: location,
    app_version: version,
  });
}

/** User chose a download action, including the direct installer route. */
export function trackDownloadCTA(location: string): void {
  gtagSafe('event', 'download_cta_click', {
    cta_location: location,
  });
}

/** An installer download started: the site's one key event. Call once per download. */
export function trackDownloadStarted(os: string, location: string, version = APP_VERSION): void {
  gtagSafe('event', 'download_initiated', {
    os_platform: os,
    cta_location: location,
    app_version: version,
  });
}
