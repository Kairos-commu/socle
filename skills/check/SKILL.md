---
name: check
description: Vérification de régression post-modification, pilotée par .claude/check.json. Utiliser après toute modification de code, avant de considérer une tâche terminée.
---

# /check — garde de régression

Exécuter chaque étape **dans l'ordre**, sans en sauter. Une étape sans configuration dans le
manifeste est **annoncée comme sautée**, jamais silencieusement omise : un projet sans
typecheck est un fait à rapporter, pas un vide à ignorer.

## Étape 0 — Lire le manifeste

Lire `.claude/check.json`. S'il n'existe pas : le signaler, proposer le skill `bootstrap`,
et exécuter ce qui est déductible du `package.json` (ou équivalent) en le disant explicitement.

Le manifeste porte les étapes du projet, leurs commandes, leurs attendus, et les régressions
connues à grepper. Cf. `templates/check.schema.json` du socle pour sa forme.

## Étape 1 — Les commandes de `steps`, dans l'ordre déclaré

Pour chaque entrée de `steps` :

1. lancer `cmd` ;
2. comparer à `expect` ;
3. si `counter` est présent, comparer le nombre obtenu à la valeur attendue.

**La dérive d'un compteur est une alerte, pas un détail.** Si le nombre de tests a bougé sans
qu'un test ait été consciemment ajouté ou retiré, le signaler immédiatement et ne pas conclure
au succès : c'est le signe qu'un test a été désactivé, renommé ou perdu par un merge.

Ne jamais faire taire un avertissement de lint par réflexe. Les règles de code mort
(`no-unused-vars`, assignations inutiles) ont une valeur de détection réelle — vérifier si le
signal est légitime avant de le supprimer.

## Étape 2 — Régressions connues (grep ciblé sur le diff)

Pour chaque entrée de `regressions` du manifeste, grepper le **diff** (fichiers modifiés,
commités ou non — pas tout le dépôt) et signaler chaque correspondance avec le `why` associé.

Ces motifs viennent du journal d'incidents : chaque incident qui peut se reproduire
mécaniquement mérite une ligne ici. Un projet dont la liste est vide est un projet dont les
incidents n'ont encore rien produit de réutilisable.

**Signaler, ne pas corriger en silence** — certaines correspondances sont des faux positifs
légitimes, documentés dans le `why`.

## Étape 3 — Cohérence du registre

```
node <socle>/bin/check-registry.mjs
```

Sauté si le manifeste n'a pas de section `registry`. Sinon, un échec ici bloque : un fichier
créé et jamais documenté est exactement ce que le registre existe pour empêcher.

## Étape 4 — Vérification visuelle ou fonctionnelle (si l'UI est touchée)

Si le diff touche l'interface et que `visual` est configuré dans le manifeste, suivre la
procédure qui y est déclarée (skill de lancement dédié, tests e2e, capture d'écran).

**Ne jamais conclure sur un raisonnement statique DOM/CSS** pour un changement visuel : une
règle d'auteur qui bat une règle par défaut, un élément hors flux, un z-index — rien de tout
cela ne se déduit à la lecture.

**Ne jamais lancer le serveur de développement de l'utilisateur** pour vérifier : sa session
peut tourner en parallèle. Utiliser l'instance isolée déclarée dans le manifeste.

## Étape 5 — Harnais spécifique (si le domaine sensible est touché)

Si `sensitive` est déclaré et que le diff touche l'un de ses chemins, lancer les commandes
associées. Typiquement : un harnais de mesure pour tout ce dont le comportement n'est pas
déterministe (un modèle, un service externe). Une indisponibilité est **signalée, non
bloquante** — mais elle doit apparaître dans le rapport, jamais être passée sous silence.

Pour un comportement non déterministe, **un essai ne distingue pas un correctif d'une
coïncidence** : comparer un taux sur N passes à la mesure précédente.

## Étape 6 — Rapport

```
## Régression Guard — <date>

Étape 1 — <nom> : ✅ / ❌   <sortie si échec>
Étape 2 — Régressions   : ✅ / ⚠️  <correspondances + why>
Étape 3 — Registre      : ✅ / ❌ / ⏭️ sauté (raison)
Étape 4 — Visuel        : ✅ / ❌ / ⏭️ sauté (raison)
Étape 5 — Harnais       : ✅ / ❌ / ⏭️ sauté (raison)

Verdict : PASS / FAIL / WARNING
```

## Règles

- **Aucune étape sautée en silence.** Sauté ⇒ dit, avec sa raison.
- **Verdict binaire.** « Globalement bon » n'est pas un verdict.
- **Le rapport cite les sorties réelles**, jamais un résumé de ce qu'elles devraient être
  (cf. `doctrine/verification.md` : `[code-verified]` vs `[doc-only]`).
- **FAIL n'est pas un échec de la tâche**, c'est l'information qui manquait pour la finir.
