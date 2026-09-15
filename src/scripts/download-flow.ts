import { APP_VERSION, DOWNLOADS, type Platform } from '../data/downloads';
import { trackDownload, trackDownloadCTA } from './analytics';

const PENDING_KEY = 'kindling:pending-download';
const MAX_AGE_MS = 5 * 60 * 1000;

export function isPlatform(value: unknown): value is Platform {
  return value === 'mac' || value === 'windows' || value === 'linux';
}

/** Keep real installer hrefs as the no-JS, modified-click, and storage-denied fallback. */
export function requestDownload(event: MouseEvent, os: Platform, location: string): void {
  trackDownloadCTA(location);
  trackDownload(os, location);
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ os, location, createdAt: Date.now() }));
  } catch {
    return; // Let the anchor request the binary normally.
  }
  event.preventDefault();
  window.location.assign(`/download/thanks/?os=${os}`);
}

/** Consume before dispatch: direct visits, refreshes and stale URLs cannot replay an attempt. */
export function initiatePendingDownload(): boolean {
  let pending;
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return false;
    pending = JSON.parse(raw);
  } catch {
    return false;
  }
  const os = new URLSearchParams(window.location.search).get('os');
  if (!pending || !isPlatform(os) || pending.os !== os ||
      typeof pending.createdAt !== 'number' || pending.createdAt > Date.now() ||
      Date.now() - pending.createdAt > MAX_AGE_MS || typeof pending.location !== 'string') return false;

  const link = document.createElement('a');
  link.href = DOWNLOADS[os].url;
  link.rel = 'noopener';
  link.hidden = true;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (typeof gtag === 'function') {
    gtag('event', 'download_initiated', {
      os_platform: os,
      cta_location: pending.location,
      app_version: APP_VERSION,
    });
  }
  return true;
}
