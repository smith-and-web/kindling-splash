// Shared by marketing pages and Starlight. Collection is production-only.
(() => {
  if (window.location.hostname !== 'kindlingwriter.com' || window.location.protocol !== 'https:') return;
  if (window.kindlingAnalyticsLoaded) return;
  window.kindlingAnalyticsLoaded = true;

  // GA4's built-in Content group dimension: every page belongs to one group,
  // the same page roles the SEO audit reports on, so GA4 and Search Console
  // can be compared by section. test:launch evaluates this function and fails
  // if any indexable page falls into 'other'.
  // content-group:start
  function contentGroup(path) {
    if (path === '/') return 'home';
    if (path.indexOf('/download/') === 0 || path === '/welcome/') return 'download';
    if (path.indexOf('/docs/') === 0) return 'docs';
    if (path.indexOf('/blog/') === 0) return 'blog';
    if (['/compare/', '/plottr-vs-scrivener/', '/free-scrivener-alternative/', '/story-outlining-software/'].indexOf(path) !== -1) return 'comparison';
    if (['/features/', '/open-source/', '/faq/'].indexOf(path) !== -1) return 'product';
    if (['/privacy/', '/terms/', '/code-signing-policy/'].indexOf(path) !== -1) return 'legal';
    return 'other';
  }
  // content-group:end

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-VJQ72G87FE', {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    content_group: contentGroup(window.location.pathname),
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

  // The home-page demo's beats are native <details>. Record a visitor opening
  // one, from the click on its summary: `toggle` does not bubble, and it also
  // fires for a beat that starts open, which would count the initial state.
  // A click on a closed beat's summary is always the visitor opening it
  // (Enter and Space on a summary dispatch the same click).
  document.addEventListener('click', (event) => {
    const summary = event.target instanceof Element ? event.target.closest('summary') : null;
    const beat = summary?.parentElement;
    if (!(beat instanceof HTMLDetailsElement) || !/^sample-beat-\d+$/.test(beat.id) || beat.open) return;
    window.gtag('event', 'demo_interaction', {
      demo_id: 'outline_to_draft',
      interaction_type: 'open_beat',
      beat_id: beat.id,
    });
  });

  // The demo's scenes are one native radio group in its outline. `change`
  // fires only when the visitor picks a different scene, never for the
  // scene checked on load.
  document.addEventListener('change', (event) => {
    const choice = event.target;
    if (!(choice instanceof HTMLInputElement) || choice.name !== 'sample-scene' || !choice.checked) return;
    window.gtag('event', 'demo_interaction', {
      demo_id: 'outline_to_draft',
      interaction_type: 'select_scene',
      scene_id: choice.value,
    });
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-newsletter-form]')) return;
    // A submission is not provider-verified confirmation. Never send form values.
    window.gtag('event', 'newsletter_submit', { form_id: form.dataset.newsletterForm });
  });
})();
