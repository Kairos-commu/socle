#!/usr/bin/env bash
# Hook pre-commit — installé par le skill bootstrap du socle.
# Ordre délibéré : le moins cher d'abord, pour échouer vite.
#
# Chaque étape est CONDITIONNELLE : ce qui n'existe pas dans le projet est annoncé comme
# sauté, jamais une erreur. Un hook qui échoue pour une étape absente est désinstallé dans
# la semaine — et le projet perd aussi les étapes qui marchaient.
set -e

has_script() { node -e "process.exit(require('./package.json').scripts?.['$1']?0:1)" 2>/dev/null; }

echo "→ scan de secrets"
# Tester le CONTENU, jamais le code retour du pipeline : avec un index vide, `xargs -r` ne
# lance pas grep et le pipeline rend 0 — ce qui ferait conclure « secret trouvé » et
# bloquerait tous les commits. Constaté au premier essai réel sur un projet tiers.
LEAKS=$(git diff --cached --name-only -z | xargs -0 -r grep -nEI \
    '(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*["'"'"'][^"'"'"']{12,})' \
    2>/dev/null || true)
if [ -n "$LEAKS" ]; then
  echo "$LEAKS"
  echo "✗ secret potentiel dans les fichiers indexés — commit bloqué."
  echo "  Si c'est un faux positif, le nommer autrement ou l'exclure explicitement."
  exit 1
fi

if [ -f .lintstagedrc ] || [ -f .lintstagedrc.json ] || grep -q '"lint-staged"' package.json 2>/dev/null; then
  echo "→ lint des fichiers indexés"
  npx --no-install lint-staged
else
  echo "→ lint des fichiers indexés : sauté (lint-staged non configuré)"
fi

if [ -f scripts/check-registry.mjs ]; then
  echo "→ registre"
  node scripts/check-registry.mjs
else
  echo "→ registre : sauté (pas de registre dans ce projet)"
fi

if has_script test; then
  echo "→ tests"
  npm test
else
  echo "→ tests : sauté (aucun script \"test\")"
fi

if has_script build; then
  echo "→ build"
  npm run build
else
  echo "→ build : sauté (aucun script \"build\")"
fi

echo "✓ pre-commit OK"
