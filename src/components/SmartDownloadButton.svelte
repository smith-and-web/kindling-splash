<script lang="ts">
  import { requestDownload, isPlatform } from '../scripts/download-flow';
  import { APP_VERSION } from '../data/downloads';
  import { detectPlatform } from '../scripts/platform';

  function gtagSafe(...args: unknown[]): void {
    if (typeof globalThis.gtag === 'function') {
      globalThis.gtag(...args);
    }
  }

  /* ---- Download config. APP_VERSION comes from data/downloads.ts so the
     version has a single source of truth. ---- */
  const DOWNLOADS: Record<string, { label: string; url: string; size: string }> = {
    mac: {
      label: 'macOS',
      url: `https://github.com/smith-and-web/kindling/releases/latest/download/Kindling_${APP_VERSION}_universal.dmg`,
      size: '~10 MB',
    },
    windows: {
      label: 'Windows',
      url: `https://github.com/smith-and-web/kindling/releases/latest/download/Kindling_${APP_VERSION}_x64-setup.exe`,
      size: '~10 MB',
    },
    linux: {
      label: 'Linux',
      url: `https://github.com/smith-and-web/kindling/releases/latest/download/Kindling_${APP_VERSION}_amd64.AppImage`,
      size: '~10 MB',
    },
  };

  /* ---- Props ---- */
  let { location = 'hero', compact = false }: { location?: string; compact?: boolean } = $props();

  /* ---- Reactive state ---- */
  let detectedOS: string | null = $state(null);
  let isMobile = $state(false);
  let ready = $state(false);

  /* ---- Detect platform on mount ---- */
  $effect(() => {
    const result = detectPlatform();
    detectedOS = result.os;
    isMobile = result.isMobile;
    ready = true;
  });

  /* ---- Derived values ---- */
  let download = $derived(detectedOS ? DOWNLOADS[detectedOS] : null);

  /* ---- Handlers ---- */
  function handleDownloadClick(event: MouseEvent): void {
    if (isPlatform(detectedOS) && download) {
      requestDownload(event, detectedOS, location);
    }
  }

  const SHARE_URL = 'https://kindlingwriter.com/download/';

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      shareStatus = 'Link copied.';
      gtagSafe('event', 'mobile_share', { method: 'clipboard', cta_location: location });
    } catch {
      // Clipboard permission denied, or no clipboard at all. Don't claim
      // success and don't dead-end: expose the URL so it can be selected.
      shareStatus = 'Copy the link below to send it to yourself.';
      showManualLink = true;
    }
  }

  async function handleShare(): Promise<void> {
    showManualLink = false;

    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: 'kindling — free writing software',
        text: 'Check out kindling, a free open-source writing app for plotters and pantsers.',
        url: SHARE_URL,
      });
      gtagSafe('event', 'mobile_share', { method: 'native_share', cta_location: location });
    } catch (error) {
      // Dismissing the share sheet is a deliberate choice, so stay quiet. Any
      // other rejection means the sheet never delivered the link — previously
      // both were swallowed identically, so the button just looked dead.
      if ((error as Error)?.name === 'AbortError') return;
      await copyLink();
    }
  }

  let shareStatus = $state('');
  let showManualLink = $state(false);
</script>

<div class="smart-download" class:compact={compact}>
  {#if ready && isMobile}
    <!-- Mobile visitor -->
    <div class="mobile-message">
      <p class="mobile-heading">kindling is a desktop app</p>
      <p class="micro-copy">Available for macOS, Windows &amp; Linux</p>
      <button class="ka-button share-btn" type="button" onclick={handleShare}>Share download link</button>
      <p class="share-status" role="status" aria-live="polite">{shareStatus}</p>
      {#if showManualLink}
        <div class="ka-field share-url">
          <label for={`share-url-${location}`}>Download page link</label>
          <input
            id={`share-url-${location}`}
            type="text"
            readonly
            value={SHARE_URL}
            onfocus={(e) => (e.currentTarget as HTMLInputElement).select()}
          />
        </div>
      {/if}
    </div>

  {:else if ready && download && detectedOS}
    <!-- Known desktop platform -->
    <a
      href={download.url}
      class="pw-button download-btn"
      onclick={handleDownloadClick}
    >
      {compact ? 'Download' : 'Download kindling'} for {download.label}
    </a>
    <p class="micro-copy">Free &amp; open source · No account required{compact ? ' · AI-free' : ` · ${download.size}`}</p>
    <a href="/download/" class="alt-platforms" data-cta-location={`${location}_all_platforms`}>{compact ? 'All platforms' : 'Also available for other platforms'} &rarr;</a>

  {:else}
    <!-- Unknown platform / pre-hydration fallback (renders during SSR and before JS detection) -->
    <a href="/download/" class="pw-button download-btn" data-cta-location={location}>
      Download kindling &mdash; free
    </a>
    <p class="micro-copy">Free &amp; open source · No account required{compact ? ' · AI-free' : ' · ~10 MB'}</p>
    <a href="/download/" class="alt-platforms" data-cta-location={`${location}_all_platforms`}>{compact ? 'All platforms' : 'See all platforms'} &rarr;</a>
  {/if}
</div>

<style>
  /* Arrangement only. The action's fill, radius, label size, hover, disabled
     state and 44px target belong to `.pw-button` (the marketing CTA) and
     `.ka-button` / `.ka-field` (operational controls) — see press/DESIGN.md,
     "One implementation per control role". The class names that remain here are
     behavioural hooks: analytics.js and scripts/check-launch.mjs address them. */
  .smart-download {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2xs);
    width: 100%;
  }

  .smart-download.compact {
    display: grid;
    grid-template-columns: auto auto;
    justify-content: start;
    align-items: center;
    gap: var(--space-xs) var(--space-s);
  }
  .compact .alt-platforms { grid-column: 2; grid-row: 1; color: var(--color-accent-text); }
  .compact .micro-copy { grid-column: 1 / -1; text-align: left; }
  .compact .mobile-message { grid-column: 1 / -1; align-items: flex-start; text-align: left; }
  @media (max-width: 480px) {
    .smart-download.compact { grid-template-columns: minmax(0, 1fr); justify-items: start; }
    .compact .alt-platforms { grid-column: 1; grid-row: 3; }
  }

  .micro-copy {
    color: var(--color-text-muted);
    font-size: var(--text-small);
    text-align: center;
  }

  /* A standalone control, so it meets the target contract rather than being
     whatever height its label happens to occupy. */
  .alt-platforms {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--control-target);
    color: var(--color-text-muted);
    font-size: var(--text-small);
    text-decoration: none;
    transition: color var(--transition);
  }

  .alt-platforms:hover {
    color: var(--color-accent-text);
  }

  .mobile-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2xs);
    text-align: center;
  }

  .mobile-heading {
    color: var(--color-text);
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: var(--text-body-lg);
  }

  .share-status {
    font-family: var(--font-ui);
    font-size: var(--text-small);
    color: var(--color-text-muted);
    min-height: 1.5em;
  }

  .share-url { text-align: left; }
</style>
