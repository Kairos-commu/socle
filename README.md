# Socle

[![License: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Méthode](https://img.shields.io/badge/type-m%C3%A9thode%2C%20pas%20framework-lightgrey.svg)](#le-principe)

> **English summary** — *Socle* ("foundation") is a set of guardrails and working practices
> for building software with a coding agent over the long run. It is **not** a quality
> analyser: it doesn't score your project or find your bugs. It's the harness that keeps an
> agent from drifting as a project grows — claiming things it never verified, forgetting to
> document what it creates, breaking what it had no way to know about.
>
> It ships **two programs that fail loudly** (a registry checker that exits non-zero when a
> source file was created without being documented; a pre-commit hook that blocks leaked
> keys), **four procedures the agent follows** (`check`, `bootstrap`, `audit`, `registry` —
> plain text, read by Claude Code), and **five method documents** — including 13 guardrails
> for an agent that actually acts on files, the system and a budget, each one drawn from a
> real incident rather than a theoretical precaution.
>
> Extracted from three real projects: a desktop app where a local model calls tools with real
> side effects, a second desktop app, and a static site in production. Three stacks, one
> method. **The documentation below is in French** — the method's precision depends on it.

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
  point/                fait le point en début de session — livré, en cours, à reprendre

templates/
  CLAUDE.md.tpl         squelette d'instructions projet
  check.json.tpl        manifeste de vérification, par projet
  pre-commit.sh         secrets, lint, registre, tests, build

bin/
  check-registry.mjs    le mécanisme : sort en 1 si le registre a divergé des sources
  chantiers.mjs         inventaire de ce qui est commencé et jamais refermé — zéro appel modèle

exemples/
  check.site-statique.json   manifeste réel d'un projet sans stack Node — ce que
                              `bootstrap` produit quand il ne peut pas tout détecter seul
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

## Ce que ça donne en vrai

`check-registry.mjs` n'est pas un linter qui suggère — il sort en erreur, avec le chemin
exact à documenter. Ci-dessous la sortie réelle de son premier passage sur un registre de
130 fichiers, tenu à la main depuis des semaines. Il y a trouvé un fichier créé cinq jours
plus tôt et jamais documenté :

```
$ node bin/check-registry.mjs

✗ 1 fichier(s) source absent(s) du registre :
    src/main/audio-mute-journal.js  → documenter dans registry/<domaine>.md

130 fichiers source, 8 fichiers de registre.
Cf. doctrine/registre.md du socle.
```

Une fois l'entrée écrite, le même appel :

```
$ node bin/check-registry.mjs

✓ registre cohérent — 130 fichiers source couverts par 8 fichiers de registre.
```

Code de sortie 1 dans le premier cas, 0 dans le second — c'est ce que `/check` lit pour
rendre son verdict, pas une lecture humaine du texte.

## Reprendre un projet sans le relire

Sur un dépôt qui a de l'historique, demander à un modèle « où j'en suis ? » revient à lui
faire relire des milliers de lignes de doc à chaque session. Or l'essentiel de la réponse est
déjà écrit noir sur blanc — « pas encore revérifié en usage réel », « non corrigé »,
« reste à faire » — et se calcule.

`chantiers.mjs` produit cet inventaire sans un seul appel modèle : marqueurs d'inachèvement
groupés par section et par date, tests désactivés, TODO, état de git, et les commits de la
période pour équilibrer le tableau. Sur un projet réel de 5 500 lignes de post-mortems, il
sort 329 marqueurs bruts, ramenés à 82 avec `--depuis`. Le skill `point` part de cette sortie
et n'ouvre un fichier que si le rapport l'y envoie.

C'est le même principe que partout ailleurs ici : ce qui est calculable ne se fait pas juger.

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
- **`bootstrap` suppose Node/npm** pour détecter les scripts d'un projet. Vérifié sur un
  projet Python : le manifeste doit s'écrire à la main. Ça fonctionne, mais ce n'est pas ce
  que le skill promet.
- **`check` attrape les régressions connues, pas les nouvelles.** Il ne remplace ni la
  relecture ni les tests — il empêche de reperdre ce qui a déjà coûté une fois.


## Questions fréquentes

**« C'est un outil qui analyse mon code ? »**
Non. Il ne note rien, ne mesure aucune qualité et ne trouve pas vos bugs. Il empêche un agent
de dériver à mesure qu'un projet grossit. Si vous cherchez un linter ou un analyseur statique,
ce n'est pas ici.

**« En quoi c'est différent d'un fichier d'instructions bien écrit ? »**
C'est la vraie question. Un bon fichier d'instructions est nécessaire et ne suffit pas : il
énonce des règles que rien ne fait respecter. Ici, chaque contrainte qui compte a un mécanisme
qui **échoue** quand elle est violée — un test qui sort en erreur, un hook qui bloque un
commit, un champ de type qu'on ne peut pas omettre. Le reste du socle découle de ce principe,
et il s'applique au socle lui-même : c'est pourquoi il livre des scripts et pas seulement des
recommandations. Cf. `doctrine/garde-mecanique.md`.

**« Ça marche avec quoi ? »**
Les skills sont écrits pour Claude Code. Les deux programmes (`bin/`) sont du Node sans
dépendance : ils tournent n'importe où, y compris en CI, indépendamment de tout agent.
`bootstrap` détecte les scripts d'un projet Node ; sur une autre chaîne d'outils, le manifeste
se remplit à la main.

**« Est-ce que ça a été testé ailleurs que chez son auteur ? »**
Non, et c'est la limite principale — elle est détaillée plus haut. Fait notable quand même :
les deux seuls défauts trouvés dans le socle l'ont été au premier passage sur un projet qui
n'était pas de la même famille que ceux d'où il vient. C'est pour ça que les retours ont plus
de valeur ici que les contributions.

**« Pourquoi la documentation est-elle en français ? »**
Parce que la précision de la méthode en dépend, et que la traduire l'affadirait. Un résumé
anglais est en tête de ce fichier ; les messages d'erreur des scripts, eux, sont là où ça
compte : ils nomment le fichier fautif et le geste à faire.

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
| `chantiers.mjs` | projet Python (unittest, sans pip) | **annonçait 0 test désactivé sur tout ce qui n'est pas JS** → motifs élargis à Python, Rust, Go |

Les deux défauts trouvés l'ont été **au premier passage sur un projet étranger**, pas sur ceux
d'où le socle vient. C'est la raison d'être de cette section : une méthode extraite de ses
propres projets est valide chez elle par construction, et nulle part ailleurs tant qu'on ne
l'a pas vue s'exécuter chez un tiers.

## Si tu l'essaies ailleurs

Rien ici n'a été vérifié en dehors des projets listés plus haut. Si tu poses `/bootstrap` sur
un projet d'une autre stack, d'une autre taille, ou avec d'autres habitudes, et que quelque
chose casse — un faux positif, une hypothèse fausse sur ton outillage, une règle qui ne tient
pas — [ouvre une issue](https://github.com/Kairos-commu/socle/issues) avec ce que `bootstrap`
ou `check` a réellement produit. C'est exactement ce genre de constat qui a fait grossir ce
socle jusqu'ici (cf. « Genèse » et « Éprouvé sur »), et la seule façon dont il peut continuer.

## Voir aussi

- **[Kairos-commu](https://github.com/Kairos-commu)** — le profil, et le contexte d'où vient
  cette méthode.
- **[site-de-recherche](https://github.com/Kairos-commu/site-de-recherche)** — le projet le
  plus étranger sur lequel le socle a été éprouvé (cf. « Éprouvé sur » plus haut).
