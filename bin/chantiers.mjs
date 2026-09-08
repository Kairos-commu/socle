#!/usr/bin/env node
/**
 * Inventaire des chantiers ouverts — ce qui a été commencé et jamais refermé.
 *
 * Ne fait AUCUN appel à un modèle. Tout ce qu'il rapporte est écrit noir sur blanc dans le
 * dépôt : marqueurs d'inachèvement dans la doc, tests désactivés, TODO, état de git. Le but
 * est de remplacer un audit payant par un grep, et de ne laisser au jugement humain (ou au
 * modèle) que ce qu'un grep ne sait pas trancher.
 *
 * Configuration : .claude/check.json, section "chantiers" (toutes les clés sont optionnelles).
 * Usage : node bin/chantiers.mjs [--json] [--depuis JJ/MM] [--tout]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const asJson = args.includes('--json');
const showAll = args.includes('--tout');
const sinceArg = args[args.indexOf('--depuis') + 1];

const manifest = existsSync(join(root, '.claude', 'check.json'))
  ? JSON.parse(readFileSync(join(root, '.claude', 'check.json'), 'utf8'))
  : {};
const cfg = manifest.chantiers ?? {};

const DOC_DIRS = cfg.docs ?? ['docs', '.'];
const SRC_DIRS = cfg.sources ?? manifest.registry?.sources ?? ['src'];
const SRC_EXT = cfg.extensions ?? manifest.registry?.extensions ?? ['.ts', '.js'];
const EXCLUDE = (cfg.exclude ?? ['node_modules', 'dist', '_site', '.git']).map((p) => new RegExp(p));

/** Familles de marqueurs. Chacune dit une chose différente — ne pas les mélanger. */
const FAMILIES = cfg.families ?? [
  { key: 'a_verifier', label: 'Écrit mais jamais vu tourner en vrai',
    re: 'pas encore (re)?vérifié|non revérifié|pas encore éprouvé|à confirmer par|pas encore revérifié en usage réel' },
  { key: 'non_corrige', label: 'Défaut connu, laissé tel quel',
    re: 'non corrigé|pas corrigé|non traité|laissé tel quel|reste ouvert|toujours ouvert' },
  { key: 'a_faire', label: 'Annoncé, pas construit',
    re: 'reste à faire|non fait|pas construit|à construire|prochaine étape|reste hors scope|pas encore implémenté' },
];

/**
 * Marqueurs de test désactivé. Le défaut couvre JS/TS et Python — un motif propre à un
 * écosystème rendrait « 0 test désactivé » sur tous les autres, ce qui est pire qu'une
 * absence de mesure : c'est une affirmation fausse et rassurante. Constaté au premier
 * passage sur un projet Python, où @unittest.skip serait passé inaperçu.
 * Surchargeable via chantiers.skippedTestPattern dans le manifeste.
 */
const SKIPPED_TEST_RE = new RegExp(
  cfg.skippedTestPattern ??
    [
      '\\b(it|test|describe)\\.(skip|only)\\b', // JS/TS : it.skip, describe.only
      '\\bx(it|describe)\\(', // JS/TS : xit(, xdescribe(
      '@(unittest\\.)?skip', // Python : @skip, @unittest.skipIf
      '@pytest\\.mark\\.(skip|xfail)', // Python : pytest
      '#\\[ignore\\]', // Rust
      't\\.Skip\\(', // Go
    ].join('|'),
);

const isExcluded = (p) => EXCLUDE.some((re) => re.test(p));

function walk(entry, exts, acc = []) {
  const abs = join(root, entry);
  if (!existsSync(abs) || isExcluded(entry)) return acc;
  const st = statSync(abs);
  if (st.isFile()) {
    const rel = relative(root, abs).split(sep).join('/');
    if (exts.some((e) => rel.endsWith(e)) && !isExcluded(rel)) acc.push(rel);
    return acc;
  }
  for (const name of readdirSync(abs)) walk(`${entry}/${name}`, exts, acc);
  return acc;
}

/** Rend le titre de section (#… ) le plus proche AU-DESSUS d'une ligne, et sa date si elle y figure. */
function sectionOf(lines, i) {
  for (let k = i; k >= 0; k--) {
    if (/^#{1,6}\s/.test(lines[k])) {
      const title = lines[k].replace(/^#+\s*/, '').trim();
      const d = title.match(/(\d{2})\/(\d{2})/) || title.match(/(\d{4})-(\d{2})-(\d{2})/);
      return { title, date: d ? d[0] : null, line: k + 1 };
    }
  }
  return { title: '(hors section)', date: null, line: 0 };
}

const findings = { a_verifier: [], non_corrige: [], a_faire: [], tests: [], todos: [], git: {} };

// --- 1. Marqueurs d'inachèvement dans la doc
for (const f of DOC_DIRS.flatMap((d) => walk(d, ['.md']))) {
  const lines = readFileSync(join(root, f), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const fam of FAMILIES) {
      if (new RegExp(fam.re, 'i').test(line)) {
        const s = sectionOf(lines, i);
        findings[fam.key].push({ file: f, line: i + 1, section: s.title, date: s.date,
          text: line.trim().replace(/\s+/g, ' ').slice(0, 150) });
        break; // une ligne ne compte que dans la première famille qui matche
      }
    }
  });
}

// --- 2. Tests désactivés et TODO dans le code
for (const f of SRC_DIRS.flatMap((d) => walk(d, SRC_EXT))) {
  const lines = readFileSync(join(root, f), 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (SKIPPED_TEST_RE.test(line))
      findings.tests.push({ file: f, line: i + 1, text: line.trim().slice(0, 120) });
    if (/\b(TODO|FIXME|HACK|XXX)\b/.test(line))
      findings.todos.push({ file: f, line: i + 1, text: line.trim().slice(0, 120) });
  });
}

// --- 3. État de git
const git = (cmd, fallback = '') => {
  try { return execSync(`git ${cmd}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return fallback; }
};
const dirty = git('status --short').split('\n').filter(Boolean);
findings.git = {
  modifies: dirty.map((l) => l.trim()),
  branches: git('branch --no-merged').split('\n').map((s) => s.trim()).filter(Boolean),
  stash: git('stash list').split('\n').filter(Boolean).length,
  // Le format est quoté : il contient un espace et un pipe, que le shell interpréterait.
  dernierCommit: git("log -1 --format='%ad — %s' --date=format:'%d/%m %H:%M'"),
  // Ce qui a été FAIT : le pendant nécessaire des chantiers ouverts. Une session qui ne voit
  // que ce qui traîne donne une image fausse d'un dépôt où l'on avance.
  recents: git(`log --since='${cfg.recentSince ?? '7 days ago'}' --format='%ad|%s' --date=format:'%d/%m'`)
    .split('\n').filter(Boolean).map((l) => { const [d, ...r] = l.split('|'); return { date: d, sujet: r.join('|') }; }),
};

// --- Filtrage par date si demandé
const cutoff = sinceArg?.match(/^(\d{2})\/(\d{2})$/);
const keep = (e) => {
  if (showAll || !cutoff) return true;
  if (!e.date) return true; // sans date, on ne peut pas écarter : on garde
  const m = e.date.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return true;
  return Number(m[2]) * 100 + Number(m[1]) >= Number(cutoff[2]) * 100 + Number(cutoff[1]);
};

if (asJson) { console.log(JSON.stringify(findings, null, 2)); process.exit(0); }

// --- Rapport
const N = (a) => String(a.length).padStart(3);
console.log(`\n═══ Chantiers ouverts — ${relative(process.env.HOME ?? '', root) || root} ═══`);
console.log(`Dernier commit : ${findings.git.dernierCommit || '—'}`);
if (findings.git.recents.length) {
  console.log(`\n${N(findings.git.recents)} Livré récemment`);
  for (const c of findings.git.recents.slice(0, 8)) console.log(`      [${c.date}] ${c.sujet.slice(0, 100)}`);
  if (findings.git.recents.length > 8) console.log(`      … ${findings.git.recents.length - 8} autres commits`);
}
console.log();

for (const fam of FAMILIES) {
  const all = findings[fam.key];
  const shown = all.filter(keep);
  console.log(`${N(shown)} ${fam.label}${shown.length !== all.length ? `  (${all.length} au total)` : ''}`);
  // Grouper par section : c'est le chantier, pas la ligne.
  const bySection = new Map();
  for (const e of shown) {
    const k = `${e.file} — ${e.section}`;
    if (!bySection.has(k)) bySection.set(k, { date: e.date, n: 0, sample: e.text });
    bySection.get(k).n++;
  }
  const sorted = [...bySection.entries()].sort((a, b) => (b[1].date ?? '').localeCompare(a[1].date ?? ''));
  for (const [k, v] of sorted.slice(0, showAll ? 999 : 8))
    console.log(`      ${v.date ? `[${v.date}] ` : ''}${k}${v.n > 1 ? ` (×${v.n})` : ''}`);
  if (sorted.length > 8 && !showAll) console.log(`      … ${sorted.length - 8} autres sections (--tout)`);
  console.log();
}

console.log(`${N(findings.tests)} Tests désactivés (.skip / .only)`);
for (const t of findings.tests.slice(0, 6)) console.log(`      ${t.file}:${t.line}`);
if (findings.tests.length > 6) console.log(`      … ${findings.tests.length - 6} autres`);
console.log();
console.log(`${N(findings.todos)} TODO / FIXME dans le code`);
for (const t of findings.todos.slice(0, 6)) console.log(`      ${t.file}:${t.line}  ${t.text}`);
console.log();
console.log(`${N(findings.git.modifies)} Fichiers modifiés non commités`);
for (const m of findings.git.modifies.slice(0, 8)) console.log(`      ${m}`);
if (findings.git.branches.length) {
  console.log(`\n${N(findings.git.branches)} Branches non mergées`);
  for (const b of findings.git.branches.slice(0, 8)) console.log(`      ${b}`);
}
if (findings.git.stash) console.log(`\n  ${findings.git.stash} entrée(s) en stash`);
console.log(`\nAucun appel modèle. --tout pour tout voir, --depuis JJ/MM pour filtrer, --json pour la machine.\n`);
