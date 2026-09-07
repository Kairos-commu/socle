# Socle

**Méthode et garde-fous pour travailler avec un agent de code sur un projet qui dure.**

Ce n'est pas un analyseur de qualité : il ne note pas votre projet et ne détecte pas vos
bugs. C'est le harnais qui empêche un agent de dériver à mesure que le projet grossit —
affirmer des choses fausses, oublier de documenter ce qu'il crée, casser ce qu'il ne pouvait
pas savoir.

Extrait de trois projets réels et de leurs incidents : une application de bureau dont un
modèle local appelle des outils à effet réel (fichiers, système, dépenses), une seconde
application de bureau, un site statique en production. Trois stacks différentes, la même
méthode.

**Aucun code d'application**, aucun framework, aucun choix de bibliothèque. Ce qui périme en
six mois n'y est pas.

## Ce qu'il y a dedans, concrètement

**Deux programmes qui bloquent.** Ils s'exécutent seuls, sans IA. `check-registry.mjs` sort
en erreur si un fichier source a été créé sans être documenté ; le hook pre-commit refuse un
commit contenant une clé, et lance tests et build avant de laisser passer.

**Quatre procédures que l'agent suit.** Des fichiers texte, pas du code : `/check` lance les
vérifications dans l'ordre et rend un verdict binaire, `/bootstrap` installe le socle sur un
projet, `/audit` compare la doc au code, `/registry` construit l'index des fonctions.

**Cinq documents de méthode.** Le vrai contenu — notamment 13 garde-fous pour un agent qui
agit vraiment, chacun tiré d'un incident constaté, pas d'une précaution théorique.

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

## Limites, dites franchement

- **Extrait des projets d'une seule personne, sur une seule machine.** La méthode est valide
  là d'où elle vient ; ailleurs, c'est à vérifier. Le tableau ci-dessous est ce qui existe
  comme preuve, ni plus ni moins.
- **`bootstrap` suppose Node/npm** pour détecter les scripts d'un projet. Sur une autre
  chaîne d'outils, une partie tombe à plat et le manifeste se remplit à la main.
- **`check` attrape les régressions connues, pas les nouvelles.** Il ne remplace ni la
  relecture ni les tests — il empêche de reperdre ce qui a déjà coûté une fois.


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
