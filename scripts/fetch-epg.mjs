import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EPG_URL = process.env.EPG_XMLTV_URL || 'https://iptv-epg.org/files/epg-de.xml.gz';
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'epg-cache.json');

function downloadAndDecompress(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadAndDecompress(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage}`));
      }

      const gunzip = zlib.createGunzip();
      let xml = '';
      gunzip.setEncoding('utf8');

      res.pipe(gunzip);
      gunzip.on('data', (chunk) => { xml += chunk; });
      gunzip.on('end', () => resolve(xml));
      gunzip.on('error', reject);
    }).on('error', reject);
  });
}

function parseXmltv(xml) {
  const channels = [];
  const programmes = [];

  // Match channels
  const channelRegex = /<channel\s+id="([^"]+)">([\s\S]*?)<\/channel>/g;
  let chMatch;
  while ((chMatch = channelRegex.exec(xml)) !== null) {
    const id = chMatch[1];
    const inner = chMatch[2];
    const nameMatch = inner.match(/<display-name[^>]*>(.*?)<\/display-name>/);
    const logoMatch = inner.match(/<icon\s+src="([^"]+)"/);
    channels.push({
      id,
      name: nameMatch ? nameMatch[1].trim() : id,
      logo: logoMatch ? logoMatch[1] : null,
    });
  }

  // Match programmes
  const progRegex = /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)">([\s\S]*?)<\/programme>/g;
  let pMatch;
  while ((pMatch = progRegex.exec(xml)) !== null) {
    const startStr = pMatch[1];
    const stopStr = pMatch[2];
    const chid = pMatch[3];
    const inner = pMatch[4];

    const normCid = chid.toLowerCase().replace('de-', '').replace('.de', '');
    const titleMatch = inner.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const descMatch = inner.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);
    const catMatch = inner.match(/<category[^>]*>([\s\S]*?)<\/category>/);
    const iconMatch = inner.match(/<icon\s+src="([^"]+)"/);

    try {
      const sY = startStr.slice(0, 4);
      const sM = startStr.slice(4, 6);
      const sD = startStr.slice(6, 8);
      const sH = startStr.slice(8, 10);
      const sMin = startStr.slice(10, 12);
      const sSec = startStr.slice(12, 14) || '00';
      const isoStart = `${sY}-${sM}-${sD}T${sH}:${sMin}:${sSec}+00:00`;

      const eY = stopStr.slice(0, 4);
      const eM = stopStr.slice(4, 6);
      const eD = stopStr.slice(6, 8);
      const eH = stopStr.slice(8, 10);
      const eMin = stopStr.slice(10, 12);
      const eSec = stopStr.slice(12, 14) || '00';
      const isoStop = `${eY}-${eM}-${eD}T${eH}:${eMin}:${eSec}+00:00`;
      const dateStr = `${sY}-${sM}-${sD}`;

      programmes.push({
        id: `${normCid}-${startStr.slice(0, 14)}`,
        channel_id: normCid,
        title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
        description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
        start_time: isoStart,
        end_time: isoStop,
        date: dateStr,
        category: catMatch ? catMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '',
        poster_url: iconMatch ? iconMatch[1] : null,
      });
    } catch {
      // skip invalid time format
    }
  }

  return { channels, programmes };
}

async function main() {
  console.log(`[fetch-epg] Downloading XMLTV from ${EPG_URL}...`);
  try {
    const xml = await downloadAndDecompress(EPG_URL);
    console.log(`[fetch-epg] Parsing ${xml.length} bytes of XMLTV...`);
    const data = parseXmltv(xml);

    if (data.channels.length > 0 && data.programmes.length > 0) {
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data), 'utf8');
      console.log(`[fetch-epg] Successfully saved ${data.channels.length} channels and ${data.programmes.length} programmes to ${OUTPUT_FILE}`);
    } else {
      console.warn(`[fetch-epg] Warning: Parsed empty dataset, preserving existing file.`);
    }
  } catch (err) {
    console.warn(`[fetch-epg] Download failed: ${err.message}. Using existing ${OUTPUT_FILE} fallback.`);
  }
}

main();
