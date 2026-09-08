#!/usr/bin/env bash
# Point du jour — destiné à un hook SessionStart.
#
# Ne s'exécute qu'UNE FOIS PAR JOUR et par dépôt : un marqueur daté est posé dans
# $XDG_STATE_HOME. Les sessions suivantes de la même journée sortent immédiatement, sans
# rien injecter — l'inventaire ne change pas assez en quelques heures pour justifier de le
# repayer en contexte à chaque ouverture.
#
# Installation : cf. skills/point/SKILL.md, section « Automatiser ».
set -e

SOCLE="${SOCLE_DIR:-$HOME/kairos/socle}"
REPO="$(basename "$PWD")"
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/socle"
STAMP="$STATE/point-$REPO-$(date +%F)"

# Déjà passé aujourd'hui sur ce dépôt : on ne dit rien.
[ -f "$STAMP" ] && exit 0

# Pas un dépôt git, ou script absent : on ne bloque jamais l'ouverture d'une session.
[ -d .git ] || exit 0
[ -f "$SOCLE/bin/chantiers.mjs" ] || exit 0

mkdir -p "$STATE" && touch "$STAMP"

# Fenêtre glissante : les chantiers des derniers jours, pas tout l'historique.
DEPUIS="$(date -d "${POINT_WINDOW_DAYS:-10} days ago" +%d/%m 2>/dev/null || echo '')"
ARGS=(--depuis "$DEPUIS")
[ -z "$DEPUIS" ] && ARGS=()

echo "=== Point du jour (premier lancement) — généré sans appel modèle ==="
node "$SOCLE/bin/chantiers.mjs" "${ARGS[@]}" 2>/dev/null || exit 0
cat <<'NOTE'
--- Comment m'en servir dans cette session ---
Ceci est un inventaire CALCULÉ, pas un jugement : chaque ligne vient d'un marqueur écrit dans
le dépôt. Ne relis pas la doc pour le compléter.

Si une nouvelle idée ou un nouveau chantier est proposé aujourd'hui, vérifie d'abord s'il
recoupe un chantier ouvert ci-dessus — et si oui, dis-le en une phrase, avec la ligne
concernée, avant de commencer. Un « écrit mais jamais vu tourner en vrai » qui touche le même
domaine se boucle en minutes et doit généralement passer devant.
Ne bloque rien : signale, puis fais ce qui est demandé.
NOTE
