Redesign launch preparation — 12 September 2026

The website changes are prepared in the working tree. Deploy after the Kindling
1.3 release, as planned. This document does not record a production deployment.

The launch changes preserve existing acquisition URLs and add contextual links
to the Scrivener landing page and comparison/workflow articles. Robots.txt now
points to the sitemap index. Completion pages are noindex and omitted from the
sitemap. Blog article metadata now reaches the layout's head slot. The existing
documentation-link corrections are included in the build checks.

Marketing and documentation share the same analytics bootstrap. It only starts
on HTTPS `kindlingwriter.com`; localhost and preview hosts do not load the Google
tag. Google signals and ad personalization signals are disabled in the tag
configuration. The desktop application's analytics policy is unaffected.

| Event | Meaning after this change |
|---|---|
| `download_cta_click` | One download action, including navigation, article links, docs, all-platform links, and specific installer choices |
| `download_click` | The user chooses an installer; retain as the primary website intent key event |
| `download_initiated` | The thank-you page consumes a recent, matching action and dispatches the binary request; never a verified completion |
| `demo_interaction` | User selects a different sample beat; initial selection does not count |
| `mobile_share` | Clipboard or native-share success, with `method` and `cta_location`; cancellation does not count |
| `newsletter_submit` | A valid newsletter form submission, without form values |
| `email_signup_confirmed` | No longer emitted by this site; subscription confirmation belongs to the email provider |

The download flow consumes its pending action before dispatching the request.
Refreshing or opening a bare thank-you URL cannot repeat an attempt. If browser
storage is unavailable, or a visitor uses a modified click, the real installer
link remains available. JavaScript-disabled visitors can also download normally.
These fallback paths record less analytics; file access takes precedence.

There is one outstanding GA4 Admin task. The connected MCP server exposes report
queries but no Admin write capability, so these account settings were not changed:

1. Select the GA4 property whose web stream uses `G-VJQ72G87FE`.
2. Open **Admin → Data display → Events → Key events** and unmark
   `ads_conversion_Other_Page_load_https_k_1`. Keep `download_click` marked.
3. Inspect the custom-event rule or connected tag configuration creating the
   legacy event. The audit observed it on `/download/`, `/download/thanks/`, and a
   malformed download URL. Retire that broad page-load rule once identified.
4. Check for any Admin-created rule that derives `email_signup_confirmed` from
   `/welcome/`. Retire it if present; do not use a page visit as confirmation.
5. Keep CTA, demo, mobile-share, and newsletter-submit events as diagnostic events
   rather than additional download conversions. Verify event parameters in
   DebugView after launch. Register `app_version`, `demo_id`, `interaction_type`,
   and `method` as event-scoped custom dimensions if those breakdowns are needed;
   `cta_location` and `os_platform` were already queryable in the audit.

Unmarking a key event changes future reporting, not historical totals. Continue
filtering historical reports to the production hostname and the specific download
event. [Google's key-event instructions](https://support.google.com/analytics/answer/13128484).

Run `npm run test:launch` before deploying. It builds the site, starts a temporary
local preview, and uses Playwright to exercise the generated site with all
production requests routed locally. Google collection, real binaries, and form
submissions are intercepted. It checks local/preview exclusion, CTA deduplication,
all platforms, direct and repeated thank-you visits, newsletter semantics, mobile
sharing, storage/no-JavaScript fallbacks, internal targets, metadata, and sitemap.
On macOS it can use installed Google Chrome. Otherwise install the test browser
with `npx playwright install chromium`, or set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an installed Chromium executable.

Record the actual deployment timestamp and commit SHA here at launch, and add the
same date to the analytics reporting log. CTA coverage expands with this release,
so compare cohorts using `download_click` and annotate the measurement change.

| Launch record | Value |
|---|---|
| Deployed at (UTC) | Pending deployment |
| Deployed commit | Pending deployment |
| Legacy GA4 key event unmarked at | Pending Admin change |
| Production event delivery verified | Pending deployment |

The focused comparison correction checked Plottr, Scrivener, Dabble, and Campfire
against their vendor pages. It also corrected the blanket claim that Plottr and
Scrivener cannot import from other tools. The source links and relevant check
dates are visible in the affected content; broader editorial improvements remain
in the postlaunch backlog.
