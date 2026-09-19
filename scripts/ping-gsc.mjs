/**
 * Pings Google Search Console API to submit fresh sitemaps & notifies WebSub hubs
 */
import fs from 'fs';
import { google } from 'googleapis';

const SA_PATH = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_FILE || '/Users/romolovelati/Desktop/fernsehheute.de/gsc-ga4.json';
const SITE_URL = 'https://fernsehheute.de/';

async function notifyGoogle() {
  console.log('[GSC] Submitting fresh sitemaps to Google Search Console...');

  if (!fs.existsSync(SA_PATH)) {
    console.warn(`[GSC] Service account key not found at ${SA_PATH}. Skipping GSC API ping.`);
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SA_PATH,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    });

    const client = await auth.getClient();
    const searchconsole = google.searchconsole({ version: 'v1', auth: client });

    // Submit sitemap index
    await searchconsole.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: 'https://fernsehheute.de/sitemap-index.xml',
    });
    console.log('[GSC] ✓ sitemap-index.xml submitted successfully to Google Search Console.');

    // Submit primary sitemap
    await searchconsole.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: 'https://fernsehheute.de/sitemap-0.xml',
    });
    console.log('[GSC] ✓ sitemap-0.xml submitted successfully to Google Search Console.');

    // WebSub Ping (PubSubHubbub)
    const hubs = ['https://pubsubhubbub.appspot.com/', 'https://push.superfeedr.com/'];
    const feedUrl = 'https://fernsehheute.de/feed/heute-abend.xml';
    for (const hub of hubs) {
      try {
        const body = new URLSearchParams({
          'hub.mode': 'publish',
          'hub.url': feedUrl,
        });
        const res = await fetch(hub, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log(`[WebSub] Ping ${hub} -> Status ${res.status}`);
      } catch (err) {
        console.warn(`[WebSub] Ping ${hub} error:`, err.message);
      }
    }
  } catch (err) {
    console.error('[GSC] Error notifying Google:', err.message);
  }
}

notifyGoogle();
