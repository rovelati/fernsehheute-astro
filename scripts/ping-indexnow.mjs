#!/usr/bin/env node
/**
 * ping-indexnow.mjs — fernsehheute.de
 * Submits the top 200 most important canonical URLs to IndexNow (Bing, Yandex, Seznam, etc.)
 * to maximize crawler indexation while staying strictly within search engine quotas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'fernsehheute.de';
const SITE_URL = `https://${HOST}`;
const KEY = '211149cc9ea6e1474b4a1881220eef9b';
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

// High-priority hub pages
const HUB_PATHS = [
  '/',
  '/oesterreich/',
  '/schweiz/',
  '/jetzt/',
  '/20-15/',
  '/morgen/',
  '/film-heute-abend/',
  '/serien-heute-abend/',
  '/sport-heute-abend/',
];

// Major Free-to-Air, Austrian, Swiss, and Regional Channels
const TOP_CHANNEL_PATHS = [
  '/orf-1/',
  '/orf-2/',
  '/orf-iii/',
  '/orf-sport-plus/',
  '/servus-tv/',
  '/atv/',
  '/puls-4/',
  '/puls-24/',
  '/krone-tv/',
  '/oe24-tv/',
  '/das-erste/',
  '/zdf/',
  '/sat1/',
  '/prosieben/',
  '/rtl/',
  '/vox/',
  '/rtl2/',
  '/kabel-eins/',
  '/srf-1/',
  '/srf-zwei/',
  '/srf-info/',
  '/3plus/',
  '/4plus/',
  '/tv24/',
  '/tv25/',
  '/puls-8/',
  '/swiss-1/',
  '/telezueri/',
  '/tele-baern/',
  '/telebasel/',
  '/muenchen-tv/',
  '/tv-ingolstadt/',
  '/3sat/',
  '/arte/',
  '/nitro/',
  '/super-rtl/',
  '/tele5/',
  '/zdf-neo/',
  '/zdfinfo/',
  '/one/',
  '/sixx/',
  '/phoenix/',
  '/tagesschau24/',
  '/n-tv/',
  '/welt/',
  '/sport1/',
  '/dmax/',
  '/kika/',
  '/ard-alpha/',
  '/wdr/',
  '/ndr/',
  '/br/',
  '/swr-bw/',
  '/swrrp/',
  '/hr/',
  '/rbb-berlin/',
  '/mdr-thueringen/',
  '/srfernsehen/',
];

function loadEmptyChannels() {
  const p = path.resolve(__dirname, '../.astro/empty-channels.json');
  if (fs.existsSync(p)) {
    try { return new Set(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch {}
  }
  return new Set();
}

function loadRedirects() {
  const redirectsSet = new Set();
  const redirectsPath = path.resolve(__dirname, '../public/_redirects');
  if (fs.existsSync(redirectsPath)) {
    try {
      const content = fs.readFileSync(redirectsPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const fromPath = trimmed.split(/\s+/)[0].replace(/\/+$/, '');
          if (fromPath) redirectsSet.add(fromPath);
        }
      }
    } catch (e) {
      console.warn('[IndexNow] Could not read _redirects:', e.message);
    }
  }
  return redirectsSet;
}

function loadTop200Paths() {
  const jsonPath = path.resolve(__dirname, 'top-200-paths.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const paths = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(paths) && paths.length > 0) {
        return paths;
      }
    } catch (e) {
      console.warn('[IndexNow] Could not read top-200-paths.json:', e.message);
    }
  }
  return [...HUB_PATHS, ...TOP_CHANNEL_PATHS];
}

async function extractSitemapUrls() {
  const sitemapCandidates = [
    path.resolve(__dirname, '../dist/sitemap-0.xml'),
    path.resolve(__dirname, '../public/sitemap-0.xml'),
  ];

  for (const sp of sitemapCandidates) {
    if (fs.existsSync(sp)) {
      try {
        const content = fs.readFileSync(sp, 'utf8');
        const matches = content.match(/<loc>(.*?)<\/loc>/g);
        if (matches && matches.length > 0) {
          const urls = matches.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(u => u.startsWith(SITE_URL));
          if (urls.length >= 100) return urls;
        }
      } catch (e) {
        console.warn(`[IndexNow] Error reading sitemap at ${sp}:`, e.message);
      }
    }
  }

  // Fallback to fetching remote sitemap
  try {
    const res = await fetch(`${SITE_URL}/sitemap-0.xml`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      const matches = text.match(/<loc>(.*?)<\/loc>/g);
      if (matches && matches.length > 0) {
        const urls = matches.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(u => u.startsWith(SITE_URL));
        if (urls.length >= 100) return urls;
      }
    }
  } catch (e) {
    console.warn('[IndexNow] Remote sitemap fetch skipped/failed:', e.message);
  }

  return null;
}

async function getAllCanonicalUrls() {
  const redirectsSet = loadRedirects();
  const emptyChannels = loadEmptyChannels();
  const isValidPath = (p) => {
    const norm = p.replace(/\/+$/, '');
    if (norm !== '' && redirectsSet.has(norm)) return false;
    const slug = norm.replace(/^\//, '');
    if (slug && emptyChannels.has(slug)) return false;
    return true;
  };

  const sitemapUrls = await extractSitemapUrls();
  const orderedUrls = [];

  const addPath = (p) => {
    if (!isValidPath(p)) return;
    const full = p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p.startsWith('/') ? p : '/' + p}`;
    if (!orderedUrls.includes(full)) {
      orderedUrls.push(full);
    }
  };

  // 1. Top 200 priority paths loaded FIRST (hubs, top German/Austrian/Swiss channels, top GSC/Bing performers)
  const top200Paths = loadTop200Paths();
  for (const p of top200Paths) {
    addPath(p);
  }

  // Ensure any explicit HUB_PATHS or TOP_CHANNEL_PATHS are included
  for (const h of HUB_PATHS) addPath(h);
  for (const c of TOP_CHANNEL_PATHS) addPath(c);

  const priorityCount = Math.min(orderedUrls.length, 200);
  console.log(`[IndexNow] Priority 1: Top ${priorityCount} high-priority URLs placed strictly at indices 0..${priorityCount - 1}`);

  // 2. Append all remaining canonical URLs from sitemap (up to IndexNow limit of 10,000)
  if (sitemapUrls && sitemapUrls.length > 0) {
    for (const u of sitemapUrls) {
      const pathPart = u.replace(SITE_URL, '');
      if (isValidPath(pathPart) && !orderedUrls.includes(u)) {
        orderedUrls.push(u);
      }
      if (orderedUrls.length >= 10000) break;
    }
  }

  return orderedUrls;

  return orderedUrls;
}

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing Bing/Microsoft IndexNow notification for ${HOST}...`);
  const allUrls = await getAllCanonicalUrls();
  console.log(`[IndexNow] Submitting all ${allUrls.length} canonical URLs to IndexNow:`);
  console.log(`  First URL (#1):   ${allUrls[0]}`);
  console.log(`  50th URL (#50):   ${allUrls[49] || '-'}`);
  console.log(`  100th URL (#100): ${allUrls[99] || '-'}`);
  console.log(`  Last URL (#${allUrls.length}):  ${allUrls[allUrls.length - 1]}`);

  // Specifically verify key GSC/Bing performance URLs and regional channels are in the top 200
  const top200Slice = allUrls.slice(0, 200);
  const checkUrls = [
    'https://fernsehheute.de/',
    'https://fernsehheute.de/jetzt/',
    'https://fernsehheute.de/20-15/',
    'https://fernsehheute.de/zdf/',
    'https://fernsehheute.de/br/',
    'https://fernsehheute.de/hse24/',
    'https://fernsehheute.de/qvc/',
    'https://fernsehheute.de/orf-1/',
    'https://fernsehheute.de/srf-1/',
    'https://fernsehheute.de/muenchen-tv/',
    'https://fernsehheute.de/tv-ingolstadt/',
  ];
  for (const cu of checkUrls) {
    const idx = allUrls.indexOf(cu);
    const inTop200 = idx >= 0 && idx < 200;
    console.log(`  [Check] ${cu} -> Pos #${idx + 1} (${inTop200 ? '✅ IN TOP 200' : '⚠️ OUTSIDE TOP 200'})`);
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: allUrls,
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
        console.log(`[IndexNow] SUCCESS! (${endpoint}) Status ${response.status}: Submitted all ${allUrls.length} canonical URLs.`);
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
