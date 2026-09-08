---
name: point
description: Fait le point sur un dépôt en début de session — ce qui a été livré, ce qui traîne, ce qu'il faudrait reprendre. S'appuie sur un inventaire calculé, pas sur une relecture de la doc.
---

# /point — reprendre un projet sans le relire

Pour un projet où l'on avance sur plusieurs fils à la fois et où beaucoup de choses sont
commencées sans être refermées. Répond à trois questions : **qu'est-ce qui a bougé**,
**qu'est-ce qui traîne**, **par quoi reprendre**.

## Règle de coût — la raison d'être de ce skill

**Ne relis pas la documentation du projet pour faire ce point.** Sur un dépôt qui a de
l'historique, un journal d'incidents peut peser plusieurs milliers de lignes : le relire à
chaque session coûte cher et redit ce qui est déjà écrit noir sur blanc.

L'inventaire est **calculé**, pas déduit. Tu pars de sa sortie. Tu n'ouvres un fichier de doc
que pour une section que le rapport a explicitement pointée, et seulement si la décision en
dépend.

## Étape 1 — Calculer l'inventaire

```
node <socle>/bin/chantiers.mjs --depuis JJ/MM
```

Sans `--depuis`, tout l'historique remonte, y compris des notes closes depuis longtemps :
choisis une date qui couvre la période active (la dernière semaine, ou la dernière étape du
projet). `--tout` pour lever le plafond d'affichage, `--json` si tu dois trier toi-même.

Le rapport rend cinq choses, et elles ne se traitent pas pareil :

| Section | Ce que c'est | Comment la lire |
|---|---|---|
| **Livré récemment** | les commits de la période | le contexte : ce qui vient d'être fait explique souvent ce qui traîne |
| **Écrit mais jamais vu tourner en vrai** | un correctif appliqué, jamais rejoué en conditions réelles | la plus actionnable : une vérification, pas un développement |
| **Défaut connu, laissé tel quel** | un problème constaté, délibérément non corrigé | ne pas le traiter comme une régression : la raison est écrite à côté |
| **Annoncé, pas construit** | une suite évoquée, jamais faite | le plus coûteux, et souvent le moins urgent |
| Tests désactivés, TODO, git | l'état mécanique | un test désactivé et un fichier non commité depuis des jours sont des signaux forts |

## Étape 2 — Trier ce que le calcul ne sait pas trancher

Le script trouve les marqueurs ; il ne sait pas lesquels comptent encore. Trois questions, à
poser sur les sections les plus récentes uniquement :

1. **Est-ce encore vrai ?** Un « pas encore revérifié » du 03/09 dans un domaine remanié
   depuis est probablement caduc. Croise avec « Livré récemment » avant d'ouvrir quoi que ce
   soit.
2. **Est-ce que ça bloque quelque chose ?** Un défaut isolé dans un chemin qui ne sert plus
   n'est pas un chantier.
3. **Quel est le coût de reprise ?** Une vérification en conditions réelles se mesure en
   minutes ; un « annoncé, pas construit » en heures. Ne pas les mettre dans la même liste.

## Étape 3 — Rendre trois choses, pas trente

Un inventaire brut de plusieurs centaines de lignes ne se traite pas : il décourage. Le
livrable est court.

```
## Point — <dépôt>, <date>

**Depuis <date>** : <n> commits. <Une phrase sur la direction réelle du travail.>

**À reprendre en priorité**
1. <chantier> — <pourquoi maintenant> · <coût estimé> · <fichier:ligne>
2. …
3. …

**Ce qui traîne mais peut attendre** : <n> éléments, dont <les familles dominantes>.

**Signaux mécaniques** : <tests désactivés, fichiers non commités, branches — ou « rien »>.
```

Trois priorités au maximum. S'il y en a une quatrième qui te paraît indispensable, c'est que
les trois premières sont mal choisies.

## Ce que ce skill ne fait pas

- **Il ne corrige rien.** Faire le point et réparer sont deux gestes ; les mélanger fait
  perdre la vue d'ensemble au premier correctif.
- **Il ne juge pas la qualité du code.** Il lit ce que le projet dit de lui-même.
- **Il ne remplace pas `/audit`** (cohérence doc ↔ code) ni `/check` (régressions). Il
  répond à « où en suis-je », pas à « est-ce que c'est juste ».

## Si le rapport est vide

C'est un résultat, pas un échec — et sur un projet actif, c'est plus souvent le signe que les
marqueurs d'inachèvement ne sont pas écrits que celui d'un projet sans dette. Vérifie que les
familles de `chantiers.families` du manifeste correspondent au vocabulaire réellement employé
dans la doc du projet ; c'est le seul réglage qui compte.
