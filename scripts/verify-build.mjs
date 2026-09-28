import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

const REQUIRED_CHANNELS = ['zdf', 'das-erste', 'rtl', 'sat1', 'prosieben', 'vox', 'kabel-eins', 'arte', '3sat'];
const FORBIDDEN_CHANNELS = ['testkanalh01', 'testkanall01', 'beate-uhsetv', 'bluehustler', 'playboyeurope', 'penthousepassion', 'lustpur'];

function verify() {
  console.log('[verify-build] Checking built artifacts in dist/ ...');

  const homeFile = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(homeFile)) {
    console.error('[verify-build] ERROR: dist/index.html is missing!');
    process.exit(1);
  }

  const homeContent = fs.readFileSync(homeFile, 'utf8');
  if (!homeContent.includes('FernsehHeute') || homeContent.length < 5000) {
    console.error('[verify-build] ERROR: dist/index.html looks incomplete or corrupted!');
    process.exit(1);
  }

  // Check forbidden channels (adult & test channels must NOT be built)
  for (const forbidden of FORBIDDEN_CHANNELS) {
    const forbiddenDir = path.join(DIST_DIR, forbidden);
    if (fs.existsSync(forbiddenDir)) {
      console.error(`[verify-build] ERROR: Forbidden channel page generated: ${forbidden}`);
      process.exit(1);
    }
  }

  let failed = 0;
  for (const slug of REQUIRED_CHANNELS) {
    const chanFile = path.join(DIST_DIR, slug, 'index.html');
    if (!fs.existsSync(chanFile)) {
      console.error(`[verify-build] ERROR: ${slug}/index.html is missing!`);
      failed++;
      continue;
    }

    const content = fs.readFileSync(chanFile, 'utf8');
    if (content.includes('Keine Sendedaten für') || !content.includes('data-program')) {
      console.error(`[verify-build] ERROR: ${slug}/index.html has NO program listings!`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`[verify-build] BUILD VERIFICATION FAILED: ${failed} critical channels are missing programs!`);
    process.exit(1);
  }

  console.log(`[verify-build] SUCCESS: All critical channels verified and all forbidden channels excluded!`);
}

verify();
