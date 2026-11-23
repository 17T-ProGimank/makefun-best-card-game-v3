// Tidepool Tussle — hand-in program (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file into the output directory
// and writes /output/dossier.json, the summary the judge reads, using the
// vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands
// in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Round 3 (this entry): Tidepool Tussle with 32 creatures across four
// families, two hero powers per side, and a tidepool terrain — one of four
// effects (High Tide, Calm Water, Kelp Bloom, Storm Surge) drawn every
// round, hitting both sides alike, with the next effect forecast a round
// ahead in the banner. Cards carry hover tooltips that explain Swift,
// Splash and their family in plain words. A 360-game simulation of the
// greedy player policy against Pell's AI keeps the duel near even with no
// deadlocks; the README carries the numbers and the full feature list,
// which the dossier picks up as the entry's summary.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The scorer's caps for this bounty: at most 4 screenshots, each at most
// 256 KiB; game/ at most 993 files and 48 MiB; every game path at most
// 1000 bytes; the dossier text at most 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
