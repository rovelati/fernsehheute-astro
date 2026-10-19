import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>

    <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
    </linearGradient>

    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#60a5fa" />
    </linearGradient>

    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Ambient Glow Orbs -->
  <circle cx="150" cy="120" r="300" fill="url(#blueGlow)" />
  <circle cx="1050" cy="500" r="350" fill="url(#blueGlow)" />

  <!-- Card Container -->
  <g filter="url(#shadow)">
    <rect x="80" y="70" width="1040" height="490" rx="36" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.12)" stroke-width="2" />
  </g>

  <!-- TV Icon Squircle on the Left -->
  <g transform="translate(140, 155)">
    <!-- Squircle Background -->
    <rect width="180" height="180" rx="42" fill="#2563eb" />
    <rect x="3" y="3" width="174" height="174" rx="39" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3" />
    
    <!-- TV Screen Outline -->
    <rect x="30" y="35" width="120" height="92" rx="14" fill="#0b1120" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <!-- Screen Glass -->
    <rect x="36" y="41" width="108" height="80" rx="10" fill="#020617"/>
    <!-- Play Triangle -->
    <polygon points="76,64 114,81 76,98" fill="#38bdf8" />
    <!-- Stand -->
    <rect x="83" y="130" width="14" height="15" rx="2" fill="#93c5fd"/>
    <rect x="62" y="143" width="56" height="7" rx="3" fill="#93c5fd"/>
    <!-- Red Live Dot -->
    <circle cx="132" cy="51" r="5" fill="#ef4444" />
  </g>

  <!-- Content Group -->
  <g transform="translate(370, 160)">
    <!-- Brand Name -->
    <text x="0" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#ffffff" letter-spacing="-1">
      Fernseh<tspan fill="url(#brandGrad)">Heute</tspan><tspan fill="#64748b" font-weight="600" font-size="38">.de</tspan>
    </text>

    <!-- Subtitle / Tagline -->
    <text x="0" y="115" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="34" fill="#f1f5f9">
      Das aktuelle TV-Programm von heute
    </text>
    <text x="0" y="155" font-family="system-ui, -apple-system, sans-serif" font-weight="400" font-size="22" fill="#94a3b8">
      Alle Sender, Spielfilme, Serien &amp; Live-Sport ab 20:15 Uhr im Überblick
    </text>

    <!-- Badges -->
    <g transform="translate(0, 205)">
      <!-- Badge 1: 20:15 Uhr -->
      <g>
        <rect width="180" height="46" rx="14" fill="#2563eb" fill-opacity="0.2" stroke="#3b82f6" stroke-opacity="0.5" stroke-width="1.5"/>
        <text x="90" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#60a5fa" text-anchor="middle">★ Prime Time 20:15</text>
      </g>
      <!-- Badge 2: 420+ Sender -->
      <g transform="translate(200, 0)">
        <rect width="170" height="46" rx="14" fill="#334155" fill-opacity="0.4" stroke="#475569" stroke-width="1.5"/>
        <text x="85" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#e2e8f0" text-anchor="middle">📺 420+ Sender</text>
      </g>
      <!-- Badge 3: Live & Free-TV -->
      <g transform="translate(390, 0)">
        <rect width="180" height="46" rx="14" fill="#334155" fill-opacity="0.4" stroke="#475569" stroke-width="1.5"/>
        <text x="90" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="16" fill="#e2e8f0" text-anchor="middle">⚡ Live &amp; Mediathek</text>
      </g>
    </g>
  </g>

  <!-- Footer bar inside card -->
  <text x="600" y="530" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="16" fill="#64748b" text-anchor="middle">
    fernsehheute.de · Schnelles &amp; werbefreies Fernsehprogramm für Deutschland
  </text>
</svg>
`;

async function generateOg() {
  const outPath = path.join(PUBLIC_DIR, 'og-default.png');
  const buf = await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png({ quality: 90 })
    .toBuffer();
  fs.writeFileSync(outPath, buf);
  console.log(`[generate-og] Created ${outPath} (${buf.length} bytes)`);
}

generateOg().catch(err => {
  console.error('[generate-og] Error:', err);
  process.exit(1);
});
