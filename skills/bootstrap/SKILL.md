---
name: bootstrap
description: Installe le socle de méthode sur un projet — CLAUDE.md, manifeste de vérification, journal d'incidents, registre, hooks. Utiliser au démarrage d'un projet, ou pour équiper un projet existant qui n'a pas de filet.
---

# /bootstrap — équiper un projet

Fonctionne aussi bien sur un dépôt vide que sur un projet existant. Sur un projet existant,
**ne jamais écraser** : lire ce qui est là, proposer les ajouts, fusionner.

## Étape 1 — Reconnaître le terrain

Avant d'écrire quoi que ce soit, établir par la lecture (pas par supposition) :

- **la stack** — `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`… et les scripts
  réellement définis ;
- **ce qui existe déjà** — `CLAUDE.md`/`AGENTS.md`, `.claude/`, `docs/`, hooks, CI ;
- **ce qui est vérifiable** — y a-t-il un typecheck ? des tests ? un lint ? un build ? Un
  projet sans tests n'est pas un problème à corriger dans ce skill, c'est un fait à inscrire
  dans le manifeste ;
- **ce qui est déployé** — le projet a-t-il une sortie publique (site, paquet, release) ? Ça
  change entièrement la section « Vigilance » du `CLAUDE.md` ;
- **un modèle est-il appelé quelque part ?** Si oui, `doctrine/llm-guardrails.md` s'applique.

Restituer ce constat en cinq lignes avant de continuer. Un bootstrap posé sur une stack mal
identifiée produit un manifeste qui échoue à la première exécution.

## Étape 2 — `CLAUDE.md`

Depuis `templates/CLAUDE.md.tpl`. Les sections sont un squelette, pas un formulaire : ce qui
ne s'applique pas se retire.

Deux sections ne se retirent jamais :

- **Vérification** — la règle `[code-verified]` / `[doc-only]` et l'obligation de lancer
  `/check` avant de clore. C'est ce qui conditionne la valeur de tout le reste.
- **Portée** — faire le changement minimal qui corrige le problème signalé ; ne pas toucher
  aux réglages adjacents sans le dire et demander.

Si un `CLAUDE.md` existe déjà : **ne pas le réécrire.** Proposer les sections manquantes, et
laisser l'existant tel quel — il contient du savoir durement acquis.

## Étape 3 — `.claude/check.json`

Depuis `templates/check.json.tpl`, rempli avec les commandes **réellement définies** dans le
projet. Vérifier chaque commande en la lançant une fois : un manifeste qui référence un
script inexistant fait échouer `/check` pour une mauvaise raison, et on cesse de lui faire
confiance en trois jours.

Pour le compteur de tests, lancer la suite et inscrire le nombre obtenu. Sans valeur de
référence, la détection de dérive n'existe pas.

## Étape 4 — Les mécanismes

Ce qui distingue ce skill d'un simple template :

1. **Copier `bin/check-registry.mjs`** dans le projet (`scripts/` ou `bin/`) et le brancher
   dans la commande de test.
2. **Installer le hook pre-commit** depuis `templates/pre-commit.sh` : scan de secrets,
   lint des fichiers indexés, tests, build. Dans cet ordre — le moins cher d'abord.
3. **Vérifier que les deux échouent vraiment** : casser volontairement le registre, lancer le
   hook, constater le blocage, réparer. Un garde-fou jamais vu échouer n'est pas un
   garde-fou, c'est une intention.

## Étape 5 — `docs/incidents.md`

Créer le fichier avec son en-tête, même vide. Un journal qui commence le jour du premier
incident commence toujours trop tard : le premier incident sera diagnostiqué de mémoire, et
la moitié du raisonnement sera perdue.

Cf. `doctrine/journal-incidents.md` pour le gabarit d'entrée.

## Étape 6 — Le registre

Sur un projet neuf : créer la structure vide, la remplir au fil de l'eau.
Sur un projet existant : invoquer le skill `registry`, cas 1 (construction en une passe).

**Le faire maintenant.** Le coût croît avec la taille du dépôt, et passé un certain seuil
personne ne l'entreprend plus.

## Étape 7 — Doctrine applicable

Importer dans le `CLAUDE.md` les fichiers de `doctrine/` pertinents. `verification.md` et
`garde-mecanique.md` toujours ; `llm-guardrails.md` seulement si un modèle est appelé —
l'importer sans raison noie les règles qui comptent.

## Étape 8 — Rapport

Lister ce qui a été créé, ce qui a été laissé tel quel et pourquoi, et **ce qui manque encore
et n'a pas pu être installé** (pas de tests, pas de CI, pas de lint). Cette dernière liste
est la vraie sortie du skill : elle dit ce que le projet ne peut pas encore garantir.
