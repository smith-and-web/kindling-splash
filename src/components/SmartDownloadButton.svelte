<script lang="ts">
  import { trackDownload, trackDownloadCTA } from '../scripts/analytics';

  function gtagSafe(...args: unknown[]): void {
    if (typeof globalThis.gtag === 'function') {
      globalThis.gtag(...args);
    }
  }

  /* ---- Download config (inline for client-side Svelte) ---- */
  const APP_VERSION = '1.2.0';

  const DOWNLOADS: Record<string, { label: string; url: string; size: string }> = {
    macos: {
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
  let { location = 'hero' }: { location?: string } = $props();

  /* ---- Reactive state ---- */
  let detectedOS: string | null = $state(null);
  let isMobile = $state(false);
  let ready = $state(false);

  /* ---- Detect platform on mount ---- */
  $effect(() => {
    const result = detectPlatform();
    detectedOS = result.os;
    isMobile = result.mobile;
    ready = true;
  });

  function detectPlatform(): { os: string | null; mobile: boolean } {
    // Check mobile first
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (mobile) return { os: null, mobile: true };

    // Chromium User-Agent Client Hints (preferred)
    if ('userAgentData' in navigator) {
      const uad = (navigator as any).userAgentData;
      const platform: string = (uad?.platform ?? '').toLowerCase();
      if (platform.includes('mac')) return { os: 'macos', mobile: false };
      if (platform.includes('windows') || platform.includes('win')) return { os: 'windows', mobile: false };
      if (platform.includes('linux') || platform.includes('chromeos')) return { os: 'linux', mobile: false };
    }

    // Fallback: classic userAgent string
    if (/Macintosh|Mac OS X/i.test(ua)) return { os: 'macos', mobile: false };
    if (/Windows/i.test(ua)) return { os: 'windows', mobile: false };
    if (/Linux/i.test(ua)) return { os: 'linux', mobile: false };

    return { os: null, mobile: false };
  }

  /* ---- Derived values ---- */
  let download = $derived(detectedOS ? DOWNLOADS[detectedOS] : null);

  /* ---- Handlers ---- */
  function handleDownloadClick(event: MouseEvent): void {
    if (detectedOS && download) {
      event.preventDefault();
      trackDownload(detectedOS, location);
      // Trigger file download programmatically
      const link = document.createElement('a');
      link.href = download.url;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Redirect to thanks page after a brief delay
      setTimeout(() => {
        window.location.href = `/download/thanks/?os=${detectedOS}`;
      }, 500);
    }
  }

  async function handleShare(): Promise<void> {
    const shareData = {
      title: 'Kindling - Free Writing Software',
      text: 'Check out Kindling, a free open-source writing app for plotters and plantsers.',
      url: 'https://kindlingwriter.com/download/',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        gtagSafe('event', 'mobile_share', { method: 'native_share', cta_location: location });
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(shareData.url);
        clipboardCopied = true;
        gtagSafe('event', 'mobile_share', { method: 'clipboard', cta_location: location });
        setTimeout(() => (clipboardCopied = false), 2000);
      } catch {
        // Clipboard also failed — ignore
      }
    }
  }

  let clipboardCopied = $state(false);
</script>

<div class="smart-download">
  {#if ready && isMobile}
    <!-- Mobile visitor -->
    <div class="mobile-message">
      <p class="mobile-heading">Kindling is a desktop app</p>
      <p class="micro-copy">Available for macOS, Windows &amp; Linux</p>
      <button class="share-btn" onclick={handleShare}>
        {clipboardCopied ? 'Link copied!' : 'Send this page to yourself'}
      </button>
    </div>

  {:else if ready && download && detectedOS}
    <!-- Known desktop platform -->
    <a
      href={download.url}
      class="download-btn"
      onclick={handleDownloadClick}
    >
      Download Kindling for {download.label}
    </a>
    <p class="micro-copy">Free &amp; open source · No account required · {download.size}</p>
    <a href="/download/" class="alt-platforms">Also available for other platforms &rarr;</a>

  {:else}
    <!-- Unknown platform / pre-hydration fallback (renders during SSR and before JS detection) -->
    <a href="/download/" class="download-btn" onclick={() => trackDownloadCTA(location)}>
      Download Kindling &mdash; Free
    </a>
    <p class="micro-copy">Free &amp; open source · No account required · ~10 MB</p>
    <a href="/download/" class="alt-platforms">See all platforms &rarr;</a>
  {/if}
</div>

<style>
  .smart-download {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  /* ---- Primary CTA Button ---- */
  .download-btn {
    display: inline-block;
    background: var(--ember-orange);
    color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 18px;
    text-decoration: none;
    padding: 14px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    text-align: center;
  }

  .download-btn:hover {
    background: var(--flame-orange);
  }

  /* ---- Micro-copy ---- */
  .micro-copy {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
    text-align: center;
  }

  /* ---- Alt platforms link ---- */
  .alt-platforms {
    color: var(--text-secondary);
    font-size: 14px;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .alt-platforms:hover {
    color: var(--ember-orange);
  }

  /* ---- Mobile message ---- */
  .mobile-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  .mobile-heading {
    color: var(--text-primary, #f5f2ef);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 18px;
    margin: 0;
  }

  .share-btn {
    display: inline-block;
    background: var(--ember-orange);
    color: #fff;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 16px;
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    margin-top: 4px;
  }

  .share-btn:hover {
    background: var(--flame-orange);
  }
</style>
