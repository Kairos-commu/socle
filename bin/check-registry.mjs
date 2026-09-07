#!/usr/bin/env node
/**
 * Vérifie que le registre de fonctions couvre exactement les fichiers source réels.
 *
 * Sort en code 1 avec un message actionnable dès qu'un fichier source n'est mentionné dans
 * aucun fichier du registre, ou qu'une entrée du registre pointe vers un fichier disparu.
 *
 * C'est le mécanisme qui remplace la consigne « pense à tenir le registre à jour ».
 * Cf. doctrine/registre.md et doctrine/garde-mecanique.md.
 *
 * Configuration : .claude/check.json, section "registry". Sans cette section, sort en 0
 * (le projet n'a pas de registre, ce n'est pas une erreur).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const manifestPath = join(root, '.claude', 'check.json');

if (!existsSync(manifestPath)) {
  console.error('check-registry : .claude/check.json introuvable.');
  console.error('  → lancer le skill bootstrap du socle, ou créer le manifeste à la main.');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (err) {
  console.error(`check-registry : .claude/check.json illisible — ${err.message}`);
  process.exit(1);
}

const cfg = manifest.registry;
if (!cfg) {
  console.log('check-registry : pas de section "registry" dans le manifeste, rien à vérifier.');
  process.exit(0);
}

const registryDir = cfg.dir ?? 'registry';
const sources = cfg.sources ?? ['src'];
const extensions = cfg.extensions ?? ['.ts', '.js'];
const excludeRe = (cfg.exclude ?? ['\\.test\\.', '\\.spec\\.', 'node_modules', 'dist'])
  .map((p) => new RegExp(p));

const isExcluded = (relPath) => excludeRe.some((re) => re.test(relPath));

/** Parcourt un chemin (fichier ou dossier) et rend les fichiers source retenus. */
function collect(entryPath, acc = []) {
  const abs = join(root, entryPath);
  if (!existsSync(abs)) return acc;
  const st = statSync(abs);
  if (st.isFile()) {
    const rel = relative(root, abs).split(sep).join('/');
    if (extensions.some((e) => rel.endsWith(e)) && !isExcluded(rel)) acc.push(rel);
    return acc;
  }
  for (const name of readdirSync(abs)) {
    const childRel = `${entryPath}/${name}`;
    if (isExcluded(childRel)) continue;
    collect(childRel, acc);
  }
  return acc;
}

const sourceFiles = sources.flatMap((s) => collect(s)).sort();

if (sourceFiles.length === 0) {
  console.error(`check-registry : aucun fichier source trouvé dans ${sources.join(', ')}.`);
  console.error('  → vérifier "registry.sources" et "registry.extensions" dans .claude/check.json.');
  process.exit(1);
}

// Concatène tout le texte du registre (+ son index s'il existe).
const registryFiles = [];
const registryAbs = join(root, registryDir);
if (existsSync(registryAbs) && statSync(registryAbs).isDirectory()) {
  for (const name of readdirSync(registryAbs)) {
    if (name.endsWith('.md')) registryFiles.push(`${registryDir}/${name}`);
  }
}
if (cfg.index && existsSync(join(root, cfg.index))) registryFiles.push(cfg.index);

if (registryFiles.length === 0) {
  console.error(`check-registry : aucun fichier de registre dans ${registryDir}/.`);
  console.error(`  → créer ${registryDir}/<domaine>.md, ou retirer la section "registry" du manifeste.`);
  process.exit(1);
}

const registryText = registryFiles.map((f) => readFileSync(join(root, f), 'utf8')).join('\n');

// Un fichier est couvert si son chemin OU son nom de base apparaît dans le registre.
const missing = sourceFiles.filter((f) => {
  const base = f.split('/').pop();
  return !registryText.includes(f) && !registryText.includes(base);
});

// Une entrée est orpheline si un TITRE de section du registre cite un chemin disparu.
// Restreint aux titres (`### `src/x.ts``) délibérément : un chemin cité dans un paragraphe
// est presque toujours une mention historique légitime (« X, retiré le 02/09, remplacé par
// Y ») et non une entrée. Faux positif constaté sur un registre réel dès la première passe.
const srcAlt = sources.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const extAlt = extensions.map((e) => e.replace('.', '\\.')).join('|');
const pathRe = new RegExp(`((?:${srcAlt})[\\w./-]*(?:${extAlt}))`, 'g');
const citedPaths = new Set();
for (const line of registryText.split('\n')) {
  if (!/^#{1,6}\s/.test(line)) continue;
  for (const m of line.matchAll(pathRe)) citedPaths.add(m[1]);
}
const orphans = [...citedPaths].filter((p) => !existsSync(join(root, p)) && !isExcluded(p)).sort();

let failed = false;

if (missing.length) {
  failed = true;
  console.error(`\n✗ ${missing.length} fichier(s) source absent(s) du registre :`);
  for (const f of missing) console.error(`    ${f}  → documenter dans ${registryDir}/<domaine>.md`);
}

if (orphans.length) {
  failed = true;
  console.error(`\n✗ ${orphans.length} entrée(s) du registre pointent vers un fichier disparu :`);
  for (const p of orphans) console.error(`    ${p}  → retirer l'entrée, ou corriger le chemin`);
}

if (failed) {
  console.error(`\n${sourceFiles.length} fichiers source, ${registryFiles.length} fichiers de registre.`);
  console.error('Cf. doctrine/registre.md du socle.\n');
  process.exit(1);
}

console.log(`✓ registre cohérent — ${sourceFiles.length} fichiers source couverts par ${registryFiles.length} fichiers de registre.`);
