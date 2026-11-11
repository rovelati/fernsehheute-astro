import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const LOGOS_DIR = path.resolve(PUBLIC_DIR, 'channel-logos');
const OUT_DIR = path.resolve(PUBLIC_DIR, 'og');
const SENDER_OUT_DIR = path.resolve(OUT_DIR, 'sender');

fs.mkdirSync(SENDER_OUT_DIR, { recursive: true });

const CARD_SIZE = 600;

async function generateChannelCard(slug, logoPath, channelName) {
  const badgeW = 260;
  const badgeH = 54;
  const badgeX = Math.round((CARD_SIZE - badgeW) / 2);
  const badgeY = 410;

  const svgOverlay = `
  <svg width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <!-- Soft outer card border -->
    <rect x="3" y="3" width="${CARD_SIZE - 6}" height="${CARD_SIZE - 6}" rx="32" fill="none" stroke="#E2E8F0" stroke-width="3"/>
    
    <!-- Red pill badge: HEUTE IM TV -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="#DC2626"/>
    
    <!-- White dot indicator -->
    <circle cx="${badgeX + 34}" cy="${badgeY + badgeH / 2}" r="6" fill="#FFFFFF"/>
    
    <!-- Badge text -->
    <text x="${badgeX + 54}" y="${badgeY + badgeH / 2 + 7}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">HEUTE IM TV</text>

    <!-- Footer brand -->
    <text x="${CARD_SIZE / 2}" y="525" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="normal" fill="#94A3B8" text-anchor="middle">FernsehHeute.de</text>
  </svg>
  `;

  let composites = [
    { input: Buffer.from(svgOverlay), top: 0, left: 0 }
  ];

  if (logoPath && fs.existsSync(logoPath)) {
    try {
      const logoBuffer = await sharp(logoPath)
        .resize(360, 220, { fit: 'inside' })
        .png()
        .toBuffer();

      const meta = await sharp(logoBuffer).metadata();
      const logoX = Math.round((CARD_SIZE - meta.width) / 2);
      const logoY = Math.round(110 + (220 - meta.height) / 2);

      composites.unshift({ input: logoBuffer, top: logoY, left: logoX });
    } catch (e) {
      console.warn(`Warn rendering logo for ${slug}:`, e.message);
    }
  } else {
    // Text fallback for channel
    const name = (channelName || slug.replace(/-/g, ' ')).toUpperCase();
    const textSvg = `
    <svg width="${CARD_SIZE}" height="200" viewBox="0 0 ${CARD_SIZE} 200" xmlns="http://www.w3.org/2000/svg">
      <text x="${CARD_SIZE / 2}" y="130" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="bold" fill="#0F172A" text-anchor="middle">${name}</text>
    </svg>
    `;
    composites.unshift({ input: Buffer.from(textSvg), top: 120, left: 0 });
  }

  const outPath = path.resolve(SENDER_OUT_DIR, `${slug}.png`);
  await sharp({
    create: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(composites)
  .png({ quality: 92, compressionLevel: 9 })
  .toFile(outPath);
}

async function generateBrandDefaultCard() {
  const badgeW = 320;
  const badgeH = 56;
  const badgeX = Math.round((CARD_SIZE - badgeW) / 2);
  const badgeY = 410;

  const svgContent = `
  <svg width="${CARD_SIZE}" height="${CARD_SIZE}" viewBox="0 0 ${CARD_SIZE} ${CARD_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <!-- Soft outer card border -->
    <rect x="3" y="3" width="${CARD_SIZE - 6}" height="${CARD_SIZE - 6}" rx="32" fill="none" stroke="#E2E8F0" stroke-width="3"/>
    
    <!-- TV Icon / FernsehHeute Logo representation -->
    <g transform="translate(180, 110)">
      <rect x="10" y="20" width="220" height="150" rx="24" fill="#2563EB"/>
      <rect x="25" y="35" width="190" height="120" rx="14" fill="#FFFFFF"/>
      <path d="M70 15 L105 35 M170 15 L135 35" stroke="#2563EB" stroke-width="8" stroke-linecap="round"/>
      <polygon points="105,70 145,95 105,120" fill="#2563EB"/>
    </g>

    <!-- Main Title: FernsehHeute -->
    <text x="${CARD_SIZE / 2}" y="335" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" fill="#0F172A" text-anchor="middle">FernsehHeute<tspan fill="#2563EB">.de</tspan></text>
    <text x="${CARD_SIZE / 2}" y="365" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="600" fill="#64748B" text-anchor="middle">Das aktuelle TV-Programm</text>

    <!-- Red pill badge: 🔴 TV-PROGRAMM HEUTE -->
    <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="#DC2626"/>
    <circle cx="${badgeX + 36}" cy="${badgeY + badgeH / 2}" r="6" fill="#FFFFFF"/>
    <text x="${badgeX + 56}" y="${badgeY + badgeH / 2 + 7}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" letter-spacing="0.5">TV-PROGRAMM HEUTE</text>

    <!-- Footer brand -->
    <text x="${CARD_SIZE / 2}" y="525" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="normal" fill="#94A3B8" text-anchor="middle">Alle Sender • 20:15 Uhr • Kostenlos</text>
  </svg>
  `;

  const outPath = path.resolve(OUT_DIR, 'default.png');
  await sharp({
    create: {
      width: CARD_SIZE,
      height: CARD_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite([{ input: Buffer.from(svgContent), top: 0, left: 0 }])
  .png({ quality: 92, compressionLevel: 9 })
  .toFile(outPath);

  // Also replace public/og-default.png if desired
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 248, g: 250, b: 252, alpha: 1 }
    }
  })
  .composite([
    {
      input: await sharp(outPath).resize(550, 550).png().toBuffer(),
      top: 40,
      left: Math.round((1200 - 550) / 2)
    }
  ])
  .png({ quality: 92 })
  .toFile(path.resolve(PUBLIC_DIR, 'og-default.png'));

  console.log('Generated default brand card at og/default.png & og-default.png');
}

async function main() {
  await generateBrandDefaultCard();

  // Load channel mappings
  const mapPath = path.resolve(ROOT, 'src/data/channel-logos-map.json');
  let slugMap = {};
  if (fs.existsSync(mapPath)) {
    const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    slugMap = raw;
  }

  // Also scan all files in public/channel-logos/
  const files = fs.readdirSync(LOGOS_DIR);
  for (const f of files) {
    const ext = path.extname(f);
    if (ext === '.svg' || ext === '.png') {
      const base = path.basename(f, ext);
      if (!slugMap[base]) {
        slugMap[base] = `/channel-logos/${f}`;
      }
    }
  }

  const entries = Object.entries(slugMap);
  console.log(`Generating thumbnail cards for ${entries.length} channels...`);

  let count = 0;
  for (const [slug, relPath] of entries) {
    const cleanRel = (relPath || '').replace(/^\//, '');
    const fullLogoPath = path.resolve(PUBLIC_DIR, cleanRel);
    await generateChannelCard(slug, fullLogoPath);
    count++;
  }

  console.log(`Successfully generated ${count} channel cards in ${SENDER_OUT_DIR}`);
}

main().catch(console.error);
