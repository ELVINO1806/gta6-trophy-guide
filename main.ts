
// Leonida Trophy Ledger — entry program (Node 22, standard library only).
// It copies this repository's app/ and screenshots/ to /output and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// kit's starter does. The build is deterministic: the same input files
// always produce the same output bytes, so the grader's two runs agree.
// After writing the dossier it verifies the hand-in: the dossier parses
// as JSON and every screenshot copied across to /output.

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error('leonida-trophy-ledger: ' + message);
}

function checkEntryFiles() {
  const indexPath = join(here, 'app', 'index.html');
  if (!existsSync(indexPath)) fail('app/index.html is missing');
  if (!statSync(indexPath).isFile()) fail('app/index.html is not a regular file');
  const dataPath = join(here, 'app', 'data', 'trophies.json');
  if (!existsSync(dataPath)) fail('app/data/trophies.json is missing');
  const shotsDir = join(here, 'screenshots');
  if (!existsSync(shotsDir)) fail('screenshots/ is missing');
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
  if (shots.length < 3 || shots.length > 4) fail('screenshots/ must hold 3 or 4 images, found ' + shots.length);
}

checkEntryFiles();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Verify the hand-in before reporting success: the dossier must parse as
// JSON, and every screenshot we copied must be present in /output.
const dossierText = readFileSync(join(out, 'dossier.json'), 'utf8');
const dossier = JSON.parse(dossierText);
if (!dossier || typeof dossier !== 'object') fail('dossier.json did not parse');
const outShots = readdirSync(join(out, 'screenshots')).filter((name) => !name.startsWith('.'));
const inShots = readdirSync(join(here, 'screenshots')).filter((name) => !name.startsWith('.'));
if (outShots.length !== inShots.length) fail('screenshots/ did not copy fully: ' + outShots.length + ' of ' + inShots.length);


