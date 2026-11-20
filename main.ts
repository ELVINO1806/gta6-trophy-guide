
import { buildDossier, canonicalJson } from "./vendor/makefun-frontend.ts";
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const shotsDir = join(repoRoot, "screenshots");
const appDir = join(repoRoot, "app");

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const from = join(src, entry);
    const to = join(dest, entry);
    if (statSync(from).isDirectory()) {
      copyTree(from, to);
    } else {
      copyFileSync(from, to);
    }
  }
}

function countFiles(dir: string): number {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    total += statSync(full).isDirectory() ? countFiles(full) : 1;
  }
  return total;
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyTree(appDir, join(outDir, "app"));
copyTree(shotsDir, join(outDir, "screenshots"));

const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
};
const dossier = buildDossier(outDir, dossierCaps);
const dossierBytes = dossier instanceof Uint8Array
  ? dossier
  : Buffer.from(typeof dossier === "string" ? dossier : canonicalJson(dossier), "utf8");
writeFileSync(join(outDir, "dossier.json"), dossierBytes);

console.log("Leonida Trophy Ledger handed in.");
console.log("app files copied: " + countFiles(join(outDir, "app")));
console.log("screenshots copied: " + countFiles(join(outDir, "screenshots")));
console.log("dossier bytes: " + dossierBytes.length);

