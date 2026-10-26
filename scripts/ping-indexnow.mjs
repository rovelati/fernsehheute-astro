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
  '/jetzt/',
  '/20-15/',
  '/morgen/',
  '/film-heute-abend/',
  '/serien-heute-abend/',
  '/sport-heute-abend/',
];

// Major Free-to-Air and ARD Regional Channels
const TOP_CHANNEL_PATHS = [
  '/das-erste/',
  '/zdf/',
  '/sat1/',
  '/prosieben/',
  '/rtl/',
  '/vox/',
  '/rtl2/',
  '/kabel-eins/',
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

function loadFallbackPaths() {
  const fallbackJsonPath = path.resolve(__dirname, 'top-200-paths.json');
  if (fs.existsSync(fallbackJsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(fallbackJsonPath, 'utf8'));
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

async function getTop200Urls() {
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

  // 1. Hubs first
  for (const h of HUB_PATHS) addPath(h);

  // 2. Top channels second
  for (const c of TOP_CHANNEL_PATHS) addPath(c);

  // 3. Sitemap remaining canonical URLs up to 200
  if (sitemapUrls && sitemapUrls.length > 0) {
    for (const u of sitemapUrls) {
      const pathPart = u.replace(SITE_URL, '');
      if (isValidPath(pathPart) && !orderedUrls.includes(u)) {
        orderedUrls.push(u);
      }
      if (orderedUrls.length >= 200) break;
    }
  }

  // 4. If still under 200, fill from top-200-paths.json
  if (orderedUrls.length < 200) {
    const fallbackPaths = loadFallbackPaths();
    for (const p of fallbackPaths) {
      addPath(p);
      if (orderedUrls.length >= 200) break;
    }
  }

  return orderedUrls.slice(0, 200);
}

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing Bing/Microsoft IndexNow notification for ${HOST}...`);
  const topUrls = await getTop200Urls();
  console.log(`[IndexNow] Submitting top ${topUrls.length} priority URLs:`);
  console.log(`  First URL (#1):   ${topUrls[0]}`);
  console.log(`  50th URL (#50):   ${topUrls[49] || '-'}`);
  console.log(`  100th URL (#100): ${topUrls[99] || '-'}`);
  console.log(`  Last URL (#${topUrls.length}):  ${topUrls[topUrls.length - 1]}`);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: topUrls,
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
        console.log(`[IndexNow] SUCCESS! (${endpoint}) Status ${response.status}: Submitted top ${topUrls.length} priority URLs.`);
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
