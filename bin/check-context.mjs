#!/usr/bin/env node
/**
 * Mesure ce qu'un projet charge dans le contexte de l'agent À CHAQUE LANCEMENT, et sort en
 * code 1 quand ce chargement dépasse ce qu'un fichier d'instructions peut porter sans que
 * l'agent cesse de le suivre.
 *
 * C'est le mécanisme qui remplace la consigne « garde ton CLAUDE.md court ».
 * Cf. doctrine/contexte.md et doctrine/garde-mecanique.md.
 *
 * Ce qui est compté comme chargé au lancement (règles de Claude Code, vérifiées dans sa
 * documentation « memory » le 16/09/2026) :
 *   - CLAUDE.md (ou .claude/CLAUDE.md) et CLAUDE.local.md à la racine ;
 *   - tout fichier qu'ils importent par `@chemin`, récursivement (4 sauts au plus) ;
 *   - .claude/rules/**\/*.md SANS frontmatter `paths:` ;
 *   - la couche utilisateur (~/.claude/CLAUDE.md, ~/.claude/rules/ sans `paths:`), sauf
 *     `--no-user`.
 * Ce qui est compté comme CONDITIONNEL (chargé seulement quand un fichier concerné est lu) :
 *   - .claude/rules/**\/*.md AVEC `paths:`, et ce qu'ils importent ;
 *   - CLAUDE.md dans les sous-dossiers.
 *
 * Trois échecs, chacun tiré d'un cas réel :
 *   1. le CLAUDE.md racine dépasse `maxLines` (200 par défaut — la cible documentée par
 *      Claude Code, au-delà de laquelle l'adhérence baisse) ;
 *   2. le total chargé au lancement dépasse `maxBytes` (60 000 par défaut, ~25 000 tokens) ;
 *   3. un fichier est chargé DEUX fois — importé sans condition ET par une règle à `paths:`.
 *      Constaté sur un projet réel : deux règles conditionnelles posées pour alléger le
 *      lancement, les `@imports` d'origine jamais retirés, ~58 000 tokens rechargés à chaque
 *      session pendant quatre jours sans que rien ne le signale.
 *
 * Configuration facultative : .claude/check.json, section "context" :
 *   { "maxLines": 200, "maxBytes": 60000, "bytesPerToken": 2.4 }
 * Options : --max-lines N  --max-bytes N  --no-user  --json
 *
 * Les commentaires HTML sont retirés avant le comptage, comme Claude Code le fait avant
 * l'injection. Les tokens sont une ESTIMATION (octets / 2,4 — mesuré le 16/09 sur `/context`
 * d'une session réelle : 98 Ko de markdown français = 41 500 tokens, 47 Ko = 20 500 ; la
 * première version divisait par 4 et sous-comptait d'un facteur 1,7) : `/context` dans une
 * session donne le chiffre réel. `context.bytesPerToken` du manifeste l'ajuste.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { homedir } from 'node:os';

const root = process.cwd();
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : def;
};

let cfg = {};
const manifestPath = join(root, '.claude', 'check.json');
if (existsSync(manifestPath)) {
  try {
    cfg = JSON.parse(readFileSync(manifestPath, 'utf8')).context ?? {};
  } catch {
    /* manifeste illisible : les défauts s'appliquent, check-registry le signalera */
  }
}
const MAX_LINES = opt('--max-lines', cfg.maxLines ?? 200);
const MAX_BYTES = opt('--max-bytes', cfg.maxBytes ?? 60_000);
const BYTES_PER_TOKEN = cfg.bytesPerToken ?? 2.4; // français en markdown, mesuré — ~4 pour du code anglais
const tokens = (bytes) => Math.round(bytes / BYTES_PER_TOKEN);
const WITH_USER = !args.includes('--no-user');
const AS_JSON = args.includes('--json');
const MAX_DEPTH = 4;

// ---------------------------------------------------------------------------------------
// Lecture d'un fichier d'instructions : contenu sans commentaires HTML, imports, frontmatter.
// ---------------------------------------------------------------------------------------
function stripHtmlComments(text) {
  // Claude Code retire les commentaires de bloc hors des blocs de code. Approximation
  // suffisante pour une mesure : on retire tout commentaire HTML hors ``` … ```.
  const parts = text.split(/(```[\s\S]*?```)/);
  return parts
    .map((p, i) => (i % 2 === 1 ? p : p.replace(/<!--[\s\S]*?-->/g, '')))
    .join('');
}

function parsePaths(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = m[1];
  if (!/^\s*paths\s*:/m.test(fm)) return null;
  const globs = [];
  for (const line of fm.split('\n')) {
    const item = line.match(/^\s*-\s*["']?([^"'\s][^"']*?)["']?\s*$/);
    if (item) globs.push(item[1]);
    const inline = line.match(/^\s*paths\s*:\s*\[(.*)\]/);
    if (inline) inline[1].split(',').forEach((g) => globs.push(g.trim().replace(/^["']|["']$/g, '')));
  }
  return globs;
}

function findImports(text, fromFile) {
  // Un import est `@chemin` hors code (inline ou bloc). On ne retient que ce qui résout vers
  // un fichier existant : un `@nom` dans la prose (handle, paquet npm) n'est pas un import.
  const noCode = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  const found = [];
  const re = /(?:^|[\s(])@([~./A-Za-z0-9_-][^\s)>,;"']*)/g;
  let m;
  while ((m = re.exec(noCode))) {
    let p = m[1];
    if (p.startsWith('~/')) p = join(homedir(), p.slice(2));
    const abs = resolve(dirname(fromFile), p);
    if (existsSync(abs) && statSync(abs).isFile()) found.push(abs);
  }
  return found;
}

const seen = new Map(); // abs → { lines, bytes }
function measure(abs) {
  if (seen.has(abs)) return seen.get(abs);
  const clean = stripHtmlComments(readFileSync(abs, 'utf8'));
  const info = { lines: clean.split('\n').length, bytes: Buffer.byteLength(clean, 'utf8') };
  seen.set(abs, info);
  return info;
}

/** Suit les imports d'un fichier ; rend la liste [{file, via, depth}] du fichier et de tout ce qu'il tire. */
function expand(abs, via, depth = 0, acc = [], stack = new Set()) {
  if (stack.has(abs) || depth > MAX_DEPTH) return acc;
  stack.add(abs);
  acc.push({ file: abs, via, depth });
  const text = readFileSync(abs, 'utf8');
  for (const imp of findImports(text, abs)) expand(imp, abs, depth + 1, acc, stack);
  return acc;
}

function walkRules(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkRules(p));
    else if (e.endsWith('.md')) out.push(p);
  }
  return out;
}

function walkNestedClaudeMd(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'build', 'target', '.venv', 'venv'].includes(e)) continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkNestedClaudeMd(p, acc);
    else if (e === 'CLAUDE.md' && dir !== root && !p.includes(`${join(root, '.claude')}`)) acc.push(p);
  }
  return acc;
}

// ---------------------------------------------------------------------------------------
// Inventaire.
// ---------------------------------------------------------------------------------------
const launch = []; // { file, via, layer }
const conditional = []; // { file, via, rule, paths }
const warnings = [];

function addLaunch(abs, layer) {
  for (const e of expand(abs, null)) launch.push({ ...e, layer });
}

// Couche projet — racine.
const rootCandidates = [join(root, 'CLAUDE.md'), join(root, '.claude', 'CLAUDE.md')];
const rootFile = rootCandidates.find((p) => existsSync(p));
if (rootFile) addLaunch(rootFile, 'projet');
const localFile = join(root, 'CLAUDE.local.md');
if (existsSync(localFile)) addLaunch(localFile, 'projet (local)');

// Règles projet.
for (const r of walkRules(join(root, '.claude', 'rules'))) {
  const paths = parsePaths(readFileSync(r, 'utf8'));
  if (paths === null) addLaunch(r, 'règle projet (sans paths)');
  else for (const e of expand(r, null)) conditional.push({ ...e, rule: r, paths });
}

// CLAUDE.md imbriqués.
for (const n of walkNestedClaudeMd(root)) {
  for (const e of expand(n, null)) conditional.push({ ...e, rule: n, paths: [relative(root, dirname(n)) + '/**'] });
}

// Couche utilisateur.
if (WITH_USER) {
  const userRoot = join(homedir(), '.claude', 'CLAUDE.md');
  if (existsSync(userRoot)) addLaunch(userRoot, 'utilisateur');
  for (const r of walkRules(join(homedir(), '.claude', 'rules'))) {
    const paths = parsePaths(readFileSync(r, 'utf8'));
    if (paths === null) addLaunch(r, 'règle utilisateur (sans paths)');
  }
}

// ---------------------------------------------------------------------------------------
// Mesures et verdict.
// ---------------------------------------------------------------------------------------
const rel = (p) => (p.startsWith(root) ? relative(root, p) : p.replace(homedir(), '~'));
const uniqueLaunch = [...new Map(launch.map((e) => [e.file, e])).values()];
const launchBytes = uniqueLaunch.reduce((s, e) => s + measure(e.file).bytes, 0);
const launchLines = uniqueLaunch.reduce((s, e) => s + measure(e.file).lines, 0);
const rootInfo = rootFile ? measure(rootFile) : null;

const failures = [];
if (rootInfo && rootInfo.lines > MAX_LINES) {
  failures.push(
    `${rel(rootFile)} fait ${rootInfo.lines} lignes (cible : ${MAX_LINES}). Ce qui ne vaut pas pour ` +
      `TOUTE session va dans un CLAUDE.md de sous-dossier, une règle à \`paths:\`, ou docs/ (non importé).`,
  );
}
if (launchBytes > MAX_BYTES) {
  failures.push(
    `${launchBytes.toLocaleString('fr-FR')} octets chargés à chaque lancement (~${tokens(launchBytes).toLocaleString('fr-FR')} tokens) ` +
      `pour un budget de ${MAX_BYTES.toLocaleString('fr-FR')}. Voir le tableau : ce sont les imports qu'il faut rendre conditionnels.`,
  );
}
const launchSet = new Set(uniqueLaunch.map((e) => e.file));
const doubles = conditional.filter((c) => launchSet.has(c.file) && c.file !== c.rule);
for (const d of doubles) {
  failures.push(
    `${rel(d.file)} est chargé DEUX fois : sans condition (import) ET par ${rel(d.rule)} (paths: ${d.paths.join(', ')}). ` +
      `Retirer l'import inconditionnel, ou supprimer la règle.`,
  );
}

// Imports qui ressemblent à un chemin mais ne résolvent pas — avertissement seulement.
for (const e of [...uniqueLaunch, ...conditional]) {
  const text = readFileSync(e.file, 'utf8').replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  for (const m of text.matchAll(/(?:^|[\s(])@((?:\.{1,2}\/|docs\/|src\/|~\/)[^\s)>,;"']+)/g)) {
    const abs = resolve(dirname(e.file), m[1].replace(/^~\//, homedir() + '/'));
    if (!existsSync(abs)) warnings.push(`${rel(e.file)} importe ${m[1]} qui n'existe pas.`);
  }
}

if (AS_JSON) {
  console.log(
    JSON.stringify(
      {
        root: rootFile && { file: rel(rootFile), ...rootInfo },
        launch: uniqueLaunch.map((e) => ({ file: rel(e.file), via: e.via && rel(e.via), layer: e.layer, ...measure(e.file) })),
        conditional: conditional.map((c) => ({ file: rel(c.file), rule: rel(c.rule), paths: c.paths, ...measure(c.file) })),
        launchBytes,
        launchLines,
        maxLines: MAX_LINES,
        maxBytes: MAX_BYTES,
        bytesPerToken: BYTES_PER_TOKEN,
        launchTokensEstimate: tokens(launchBytes),
        failures,
        warnings,
      },
      null,
      2,
    ),
  );
  process.exit(failures.length ? 1 : 0);
}

const fmt = (n) => n.toLocaleString('fr-FR').padStart(9);
console.log('Chargé À CHAQUE LANCEMENT :');
for (const e of uniqueLaunch) {
  const i = measure(e.file);
  const via = e.via ? `  ← ${rel(e.via)}` : '';
  console.log(`  ${String(i.lines).padStart(5)} l ${fmt(i.bytes)} o  ${rel(e.file)}  [${e.layer}]${via}`);
}
console.log(`  ${'—'.repeat(5)}   ${'—'.repeat(9)}`);
console.log(
  `  ${String(launchLines).padStart(5)} l ${fmt(launchBytes)} o  total  (~${tokens(launchBytes).toLocaleString('fr-FR')} tokens estimés à ${BYTES_PER_TOKEN} o/token — \`/context\` donne le réel)`,
);

if (conditional.length) {
  console.log('\nChargé À LA DEMANDE (quand un fichier concerné est lu) :');
  const byRule = new Map();
  for (const c of conditional) {
    if (!byRule.has(c.rule)) byRule.set(c.rule, { paths: c.paths, files: [] });
    byRule.get(c.rule).files.push(c.file);
  }
  for (const [rule, { paths, files }] of byRule) {
    const bytes = [...new Set(files)].reduce((s, f) => s + measure(f).bytes, 0);
    console.log(`  ${fmt(bytes)} o  ${rel(rule)}  → ${paths.join(', ')}`);
    for (const f of new Set(files)) if (f !== rule) console.log(`               ${'└'} ${rel(f)}`);
  }
}

for (const w of warnings) console.log(`\n! ${w}`);

if (failures.length) {
  console.log(`\n✗ ${failures.length} problème(s) de contexte :`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log('\nCf. doctrine/contexte.md du socle.');
  process.exit(1);
}
console.log(
  `\n✓ contexte au lancement tenu — racine ${rootInfo ? rootInfo.lines : 0}/${MAX_LINES} lignes, ${launchBytes.toLocaleString('fr-FR')}/${MAX_BYTES.toLocaleString('fr-FR')} octets, aucun doublon.`,
);
