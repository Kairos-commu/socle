# CLAUDE.md

Instructions pour les sessions d'agent sur **<PROJET>**.

## Langue

<Langue des réponses, commentaires de code et messages de commit.>

## Vérification — à lire avant de clore une tâche

- **Jamais affirmer « vérifié » sans avoir réellement lu le code ou fait tourner la
  commande.** Taguer toute affirmation de statut `[code-verified: fichier:ligne]` ou
  `[doc-only]` — la seconde n'est pas honteuse, mais ne doit jamais se déguiser en la
  première.
- **Avant d'intervenir sur un fichier de `<SOURCES>`, consulter `registry/<domaine>.md`**
  (index dans `FUNCTION_REGISTRY.md`) plutôt que de grepper à l'aveugle. Pour tout fichier
  créé, modifié ou supprimé, mettre à jour son entrée AVANT de considérer la tâche terminée.
- **Après toute modification, lancer le skill `check`** — checklist ordonnée — plutôt que de
  décider au cas par cas quoi revérifier. Confirmer que le nombre de tests est inchangé (ou
  volontairement modifié) : toute dérive silencieuse est un signal d'alerte.
- **Portée** : faire le changement minimal qui corrige le problème signalé. Ne pas toucher
  aux réglages adjacents (timeouts, seuils, constantes voisines) sans le signaler
  explicitement et demander d'abord.

## Vue d'ensemble

<Trois à dix lignes : ce que fait le projet, pour qui, et la contrainte qui le gouverne.
Ce qu'une session doit savoir avant de lire la moindre ligne de code.>

## Statut

<Ce qui est validé et éprouvé, ce qui est écrit mais jamais vu tourner en conditions réelles,
et ce qui est explicitement hors scope. La distinction « le code existe » / « vu fonctionner »
est la plus utile des trois.>

## Architecture

```
<Arborescence commentée : un fichier par ligne, sa raison d'être. Pas la sortie de `tree`.>
```

## Commandes

```bash
<commande>   # ce qu'elle fait, et quand la lancer
```

## Pièges déjà rencontrés — ne pas réintroduire

<Un piège numéroté par incident qui peut se reproduire. Symptôme observable d'abord, cause
ensuite, correctif enfin. Chaque piège mécaniquement détectable doit avoir sa ligne dans
`regressions` du manifeste `.claude/check.json` — sinon il se reproduira.>

## Documentation

<Les documents de `docs/`, et lesquels sont importés automatiquement ici. Garder ce fichier
court : les sections denses vivent dans `docs/` et s'importent.>

`docs/incidents.md` — journal de post-mortems, historique et daté. Ne se met pas à jour, il
s'ajoute.

## Vigilance — <production / diffusion>

<Si le projet a une sortie publique : ce qui est irréversible une fois poussé, et la
checklist avant push. Retirer cette section si rien ne sort du poste.>

## Ne pas modifier sans discussion

<Fichiers portés d'ailleurs, adaptés d'une source tierce, ou dont la forme actuelle résulte
d'un arbitrage documenté. Avec la raison, sinon la règle sera contournée.>
