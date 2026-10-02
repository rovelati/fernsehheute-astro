#!/usr/bin/env node
/**
 * ping-indexnow.mjs — fernsehheute.de
 * Submits ONLY the top 20 most important canonical URLs to IndexNow (Bing, Yandex, Seznam, etc.)
 * to focus crawler budget on high-priority hubs and top TV channels.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'fernsehheute.de';
const KEY = '211149cc9ea6e1474b4a1881220eef9b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

// Top 20 most important URLs for FernsehHeute
const TOP_20_URLS = [
  `https://${HOST}/`,
  `https://${HOST}/morgen/`,
  `https://${HOST}/film-heute-abend/`,
  `https://${HOST}/serien-heute-abend/`,
  `https://${HOST}/sport-heute-abend/`,
  `https://${HOST}/zdf/`,
  `https://${HOST}/das-erste/`,
  `https://${HOST}/rtl/`,
  `https://${HOST}/sat1/`,
  `https://${HOST}/prosieben/`,
  `https://${HOST}/vox/`,
  `https://${HOST}/kabel-eins/`,
  `https://${HOST}/rtl2/`,
  `https://${HOST}/zdf-neo/`,
  `https://${HOST}/3sat/`,
  `https://${HOST}/arte/`,
  `https://${HOST}/super-rtl/`,
  `https://${HOST}/nitro/`,
  `https://${HOST}/sixx/`,
  `https://${HOST}/wdr/`,
];

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing Bing/Microsoft IndexNow notification for ${HOST}...`);
  console.log(`[IndexNow] Submitting STRICTLY top ${TOP_20_URLS.length} priority URLs:`);
  TOP_20_URLS.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: TOP_20_URLS,
  };

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'FernsehHeute-IndexNow/2.0 (+https://fernsehheute.de)',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 200 || response.status === 202) {
        console.log(`[IndexNow] SUCCESS! (${endpoint}) Status ${response.status}: Submitted top ${TOP_20_URLS.length} priority URLs.`);
      } else {
        const txt = await response.text();
        console.warn(`[IndexNow] WARN (${endpoint}): Status ${response.status} - ${txt}`);
      }
    } catch (error) {
      console.error(`[IndexNow] ERROR connecting to ${endpoint}:`, error.message);
    }
  }
}

pingIndexNow();
