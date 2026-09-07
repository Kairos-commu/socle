# Socle

Méthode de travail avec un agent de code, extraite de trois projets réels et de leurs
incidents : une application de bureau avec agent local outillé, une seconde application de
bureau, un site statique en production. Trois stacks différentes, la même méthode.

**Ce n'est pas un template de projet.** Il ne contient aucun code d'application, aucun
framework, aucun choix de bibliothèque. Ce qui périme en six mois n'y est pas.

Ce qu'il contient : les règles qui ont tenu, et les **mécanismes qui les font tenir**.

## Le principe

Une consigne écrite en langue naturelle est respectée la plupart du temps. « La plupart du
temps » suffit pour du confort, jamais pour une garantie. Tout ce qui compte a donc ici un
mécanisme qui **échoue** quand la règle est violée — un test, un hook, un champ de type
obligatoire — et pas seulement une phrase dans un fichier d'instructions.

Un socle qui se contenterait de recommander ces pratiques serait exactement la chose qu'il
condamne.

## Contenu

```
doctrine/
  verification.md       ne jamais affirmer sans avoir lu ou exécuté
  garde-mecanique.md    consigne vs mécanisme — le principe qui décide de tout le reste
  registre.md           index des fonctions, construit à froid, tenu par un test
  journal-incidents.md  le post-mortem comme actif qui prend de la valeur
  llm-guardrails.md     13 patterns pour un agent qui agit vraiment (fichiers, système, coût)

skills/
  bootstrap/            équipe un projet — CLAUDE.md, manifeste, mécanismes, journal
  check/                garde de régression à étapes ordonnées, verdict binaire
  audit/                cohérence doc ↔ code, ne modifie rien
  registry/             construit et maintient le registre de fonctions

templates/
  CLAUDE.md.tpl         squelette d'instructions projet
  check.json.tpl        manifeste de vérification, par projet
  pre-commit.sh         secrets, lint, registre, tests, build

bin/
  check-registry.mjs    le mécanisme : sort en 1 si le registre a divergé des sources
```

## Démarrer

Sur un projet neuf comme sur un projet existant :

```
/bootstrap
```

Le skill lit le terrain (stack, scripts réellement définis, ce qui est déjà là), pose ce qui
manque sans écraser ce qui existe, installe les mécanismes, et **rapporte ce qu'il n'a pas pu
garantir** — un projet sans tests reste un projet sans tests, et le manifeste le dit.

Ensuite, après chaque modification :

```
/check
```

## Ce que le socle ne fait pas

- Il ne choisit pas votre stack, ni votre arborescence, ni vos bibliothèques.
- Il ne remplace pas la relecture : `check` attrape les régressions connues, pas les
  nouvelles.
- Il ne rend pas un projet rigoureux tout seul. Les mécanismes rendent la discipline moins
  coûteuse que son contournement — c'est tout, et c'est déjà l'essentiel.

## Genèse

Chaque règle de `doctrine/` vient d'un incident constaté, pas d'une précaution théorique. Les
`llm-guardrails` en particulier sortent d'une centaine de post-mortems écrits pendant qu'un
agent local apprenait à appeler des outils à effet réel : un plan de suppression calculé côté
code plutôt que désigné par le modèle, un journal d'intention écrit avant l'action, un
plafond de dépense au seul point de passage. Rien ici n'a été inventé à froid.

Le socle lui-même est né d'un constat mesurable : deux projets partageaient trois skills,
portés à la main une fois, et **divergents de 132 lignes** six semaines plus tard. Le
troisième projet, d'une stack sans rapport, n'en avait hérité d'aucun.

## Éprouvé sur

Le socle a été exécuté sur les trois projets dont il est extrait, et sur celui qui lui est le
plus étranger — un site statique sans tests, sans types et sans registre. Ce que ces passages
ont produit, mesuré :

| Ce qui a tourné | Sur quoi | Résultat |
|---|---|---|
| `check-registry.mjs` | registre réel, 130 fichiers source | 1 fichier créé et jamais documenté, trouvé en une passe |
| `check-registry.mjs` | même registre, mentions historiques | 1 faux positif → règle resserrée aux titres de section |
| hook pre-commit | projet sans tests, sans lint, sans registre | 3 étapes annoncées sautées, build exécuté, passe |
| hook pre-commit | index vide | **bloquait tous les commits** → corrigé (tester le contenu, pas le code retour du pipeline) |
| `check` complet | site en production, diff de 5 fichiers | 0 régression, vérification visuelle requise, verdict WARNING |

Les deux défauts trouvés l'ont été **au premier passage sur un projet étranger**, pas sur ceux
d'où le socle vient. C'est la raison d'être de cette section : une méthode extraite de ses
propres projets est valide chez elle par construction, et nulle part ailleurs tant qu'on ne
l'a pas vue s'exécuter chez un tiers.
