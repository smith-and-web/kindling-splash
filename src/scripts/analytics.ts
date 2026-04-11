/**
 * GA4 event helpers for Kindling marketing site.
 *
 * All functions guard on `typeof gtag === 'function'` so they are safe to call
 * even when the GA snippet has not loaded (e.g. ad-blockers, local dev).
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

/** User clicked a platform download button. */
export function trackDownload(os: string, location: string, version = '1.2.0'): void {
  gtagSafe('event', 'download_click', {
    os_platform: os,
    cta_location: location,
    app_version: version,
  });
}

/** User clicked a CTA that navigates to the download page (not a direct download). */
export function trackDownloadCTA(location: string): void {
  gtagSafe('event', 'download_cta_click', {
    cta_location: location,
  });
}

/** Download actually completed (e.g. after redirect / thanks page). */
export function trackDownloadComplete(os: string): void {
  gtagSafe('event', 'download_complete', {
    operating_system: os,
  });
}

/** Post-download engagement (e.g. "join discord", "star on github"). */
export function trackPostDownloadAction(action: string): void {
  gtagSafe('event', 'post_download_action', {
    action_type: action,
  });
}

/** A feature card / section scrolled into view. */
export function trackFeatureView(featureName: string): void {
  gtagSafe('event', 'feature_viewed', {
    feature_name: featureName,
  });
}

/** Outbound link click (external sites). */
export function trackOutboundLink(url: string): void {
  gtagSafe('event', 'click', {
    event_category: 'outbound',
    event_label: url,
    transport_type: 'beacon',
  });
}

/**
 * Track scroll-depth milestones: 25 %, 50 %, 75 %, 100 %.
 * Call once on page load; cleans up automatically on page hide.
 */
export function initScrollDepthTracking(): void {
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();

  function check(): void {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const pct = Math.round((scrollTop / docHeight) * 100);

    for (const milestone of milestones) {
      if (pct >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        gtagSafe('event', 'scroll_depth', {
          percent_scrolled: milestone,
        });
      }
    }
  }

  window.addEventListener('scroll', check, { passive: true });

  // Clean up when the user navigates away
  window.addEventListener(
    'pagehide',
    () => window.removeEventListener('scroll', check),
    { once: true },
  );
}
