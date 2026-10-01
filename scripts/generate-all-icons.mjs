import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

async function buildIcons() {
  console.log('[build-icons] Reading SVG from', SVG_PATH);
  const svgBuffer = fs.readFileSync(SVG_PATH);

  // 1. Generate PNG sizes
  const sizes = [
    { name: 'favicon-16.png', size: 16 },
    { name: 'favicon-32.png', size: 32 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  const pngBuffers = {};

  for (const { name, size } of sizes) {
    const outPath = path.join(PUBLIC_DIR, name);
    const buf = await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(outPath, buf);
    pngBuffers[size] = buf;
    console.log(`[build-icons] Generated ${name} (${size}x${size}, ${buf.length} bytes)`);
  }

  // 2. Generate multi-resolution favicon.ico (16, 32, 48)
  // ICO header: 6 bytes + N * 16 bytes entries + image data
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type = 1
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const entries = [];
  const imageDatas = [];

  for (const size of icoSizes) {
    const imgBuf = pngBuffers[size];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(imgBuf.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset

    entries.push(entry);
    imageDatas.push(imgBuf);
    offset += imgBuf.length;
  }

  const icoBuffer = Buffer.concat([header, ...entries, ...imageDatas]);
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`[build-icons] Generated multi-size favicon.ico (${icoBuffer.length} bytes)`);

  console.log('[build-icons] All icons generated successfully!');
}

buildIcons().catch(err => {
  console.error('[build-icons] Error:', err);
  process.exit(1);
});
