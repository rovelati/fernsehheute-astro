# Targeted Bing maintenance — 12 October 2026

Bing Sitemaps: two registered/discovered files, zero errors/warnings, crawled October 10–11. The index and child each showed 353 discovered URLs (706 aggregate is not a count of unique pages). Current public sitemap contains 335 URLs. Kept the current sitemap unchanged.

Recommendations: 31 historical long-title URLs, one dead-link notification (/tele-5/), and a general inbound-links advisory. User requested conservative changes during traffic recovery.

Changes:
- Added explicit /tele-5 and /tele-5/ permanent redirects to the existing equivalent /tele5/ page. Rules placed first and both spellings retained. Public trailing-slash URL verified 301, destination valid with programme listings.
- Shortened only 26 currently available overlong titles from Bing's named URL set. Source template explicitly scopes changes to audited slugs and only titles over 70 characters. Preserved channel names and “Programm heute & heute Abend”, removing redundant suffixes. Other titles remain unchanged. Exact before/after manifest in bing-title-changes-2026-10-12.json.
- Kept source and deployed static HTML consistent for future normal builds. Changed the title occurrences in the HTML head only; all page bodies and other assets byte-identical to the previous published artifacts. No EPG import, database query, cron modification or full content rebuild.

Validation: Astro template compilation passed, existing verify-build.mjs passed, artifact comparison allowed only 26 HTML heads plus _redirects. All 26 live titles match and retain indexability. Public sitemap byte-identical. IndexNow accepted a single batch of 29 URLs with HTTP 200 (26 changed pages, two old Tele 5 spellings, current Tele 5 page). This confirms receipt, not indexing or ranking recovery.

Final Cloudflare Pages deployment: https://b102c403.fernsehheute.pages.dev
Production: https://fernsehheute.de/
Server backup: /var/www/fernsehheute.de/backups/bing-targeted-20261012 (src, public, dist).
Staged release: /var/www/fernsehheute.de/bing-targeted-staging.
Rollback: redeploy the saved dist with the existing unchanged functions/configuration, restore src/pages/[sender].astro and public/_redirects from the backup, and restore the saved production dist. Credentials stay in the existing server environment and are not included here.

Final follow-up: the historical skycinemaclassics and skysportuhd URLs also returned 404 despite matching canonical pages with programme listings. Added both slash variants as 301 redirects to /sky-cinema-classics/ and /sky-sport-uhd/. Verified all four variants live. Submitted these four aliases plus their two destinations to IndexNow: HTTP 200. Total 35 distinct notified URLs across two accepted requests. No change to existing sitemap or scheduled notifications.
