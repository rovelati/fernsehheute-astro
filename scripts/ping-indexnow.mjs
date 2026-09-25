#!/usr/bin/env node
/**
 * ping-indexnow.mjs — fernsehheute.de
 * Automatically extracts ALL valid canonical URLs from the built sitemap (dist/sitemap-0.xml)
 * and submits them in bulk to the IndexNow API (Bing, Yandex, Seznam, etc.).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const HOST = 'fernsehheute.de';
const KEY = '211149cc9ea6e1474b4a1881220eef9b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

const FALLBACK_PATHS = [
  '/',
  '/morgen/',
  '/film-heute-abend/',
  '/serien-heute-abend/',
  '/sport-heute-abend/',
  '/das-erste/',
  '/zdf/',
  '/rtl/',
  '/sat1/',
  '/prosieben/',
  '/vox/',
  '/rtl2/',
  '/kabel-eins/',
  '/sixx/',
  '/super-rtl/',
  '/nitro/',
  '/tele5/',
  '/zdf-neo/',
  '/zdfinfo/',
  '/3sat/',
  '/arte/',
  '/phoenix/',
  '/one/',
  '/sport1/',
  '/dmax/',
  '/n-tv/',
  '/welt/',
  '/tagesschau24/',
  '/kika/',
  '/ard-alpha/',
  '/sat1-gold/',
  '/prosieben-maxx/',
  '/kabel-eins-doku/',
  '/wdr/',
  '/ndr/',
  '/br/',
  '/swr/',
  '/hr/',
  '/mdr/',
  '/rbb/',
  '/hse24/',
  '/qvc/',
];

function getUrlsFromSitemap() {
  const possiblePaths = [
    path.join(ROOT_DIR, 'dist', 'sitemap-0.xml'),
    path.join(ROOT_DIR, 'dist', 'sitemap.xml'),
    path.join(ROOT_DIR, 'public', 'sitemap-0.xml'),
  ];

  for (const sitemapPath of possiblePaths) {
    if (fs.existsSync(sitemapPath)) {
      try {
        const content = fs.readFileSync(sitemapPath, 'utf8');
        const matches = content.match(/<loc>(.*?)<\/loc>/g);
        if (matches && matches.length > 0) {
          const urls = matches
            .map(m => m.replace(/<\/?loc>/g, '').trim())
            .filter(u => u.startsWith(`https://${HOST}`));
          if (urls.length > 0) {
            console.log(`[IndexNow] Loaded ${urls.length} URLs from ${path.relative(ROOT_DIR, sitemapPath)}`);
            return Array.from(new Set(urls));
          }
        }
      } catch (err) {
        console.warn(`[IndexNow] Error reading sitemap at ${sitemapPath}:`, err.message);
      }
    }
  }

  console.log(`[IndexNow] Sitemap not found, using ${FALLBACK_PATHS.length} fallback core URLs.`);
  return FALLBACK_PATHS.map(p => `https://${HOST}${p}`);
}

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing Bing/Microsoft IndexNow notification for ${HOST}...`);

  const urls = getUrlsFromSitemap();
  console.log(`[IndexNow] Total canonical URLs to submit: ${urls.length}`);

  // IndexNow API accepts up to 10,000 URLs per request
  const BATCH_SIZE = 10000;
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    const payload = {
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: batch,
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
          console.log(`[IndexNow] SUCCESS! (${endpoint}) Status ${response.status}: Submitted ${batch.length} URLs.`);
        } else {
          const txt = await response.text();
          console.warn(`[IndexNow] WARN (${endpoint}): Status ${response.status} - ${txt}`);
        }
      } catch (error) {
        console.error(`[IndexNow] ERROR connecting to ${endpoint}:`, error.message);
      }
    }
  }
}

pingIndexNow();
