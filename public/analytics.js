// Shared by marketing pages and Starlight. Collection is production-only.
(() => {
  if (window.location.hostname !== 'kindlingwriter.com' || window.location.protocol !== 'https:') return;
  if (window.kindlingAnalyticsLoaded) return;
  window.kindlingAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-VJQ72G87FE', {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-VJQ72G87FE';
  document.head.appendChild(tag);

  // Delegation includes Markdown links, docs navigation, and hydrated islands.
  // Direct installer actions are handled separately by the download helper.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname.replace(/\/$/, '') !== '/download') return;
    const location = link.dataset.ctaLocation ||
      (window.location.pathname.startsWith('/docs/') ? 'docs' :
        link.closest('nav') ? 'navbar' : link.closest('footer') ? 'footer' :
          link.closest('.article-content') ? 'blog_inline' : 'page_inline');
    window.gtag('event', 'download_cta_click', { cta_location: location });
  });

  document.addEventListener('change', (event) => {
    const choice = event.target;
    if (!(choice instanceof HTMLInputElement) || choice.name !== 'sample-scene-beat' || !choice.checked) return;
    window.gtag('event', 'demo_interaction', {
      demo_id: 'outline_to_draft',
      interaction_type: 'select_beat',
      beat_id: choice.id,
    });
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-newsletter-form]')) return;
    // A submission is not provider-verified confirmation. Never send form values.
    window.gtag('event', 'newsletter_submit', { form_id: form.dataset.newsletterForm });
  });
})();
