#!/usr/bin/env node
/**
 * ping-indexnow.mjs — fernsehheute.de
 * Submits updated URLs to Bing/Microsoft IndexNow API instantly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HOST = 'fernsehheute.de';
const KEY = '211149cc9ea6e1474b4a1881220eef9b';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const CORE_PATHS = [
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

async function pingIndexNow() {
  console.log(`[IndexNow] Preparing Bing/Microsoft IndexNow notification for ${HOST}...`);
  
  const urlList = CORE_PATHS.map(p => `https://${HOST}${p}`);
  
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList,
  };

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'FernsehHeute-IndexNow/1.0 (+https://fernsehheute.de)',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 202) {
      console.log(`[IndexNow] SUCCESS! Status ${response.status}: Submitted ${urlList.length} URLs to Bing/IndexNow.`);
    } else {
      const txt = await response.text();
      console.warn(`[IndexNow] WARN: Response status ${response.status} - ${txt}`);
    }
  } catch (error) {
    console.error('[IndexNow] ERROR submitting to IndexNow:', error.message);
  }
}

pingIndexNow();
