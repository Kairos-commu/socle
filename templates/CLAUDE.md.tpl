# CLAUDE.md

Instructions pour les sessions d'agent sur **<PROJET>** — la couche RACINE : ce qu'une session
doit savoir **avant d'agir**, quel que soit le fichier qu'elle va toucher. Cible : 150 lignes,
200 au plus (`check-context.mjs` échoue au-delà). Ce qui ne vaut que pour une partie du code
va dans le `CLAUDE.md` de son dossier ou une règle `.claude/rules/*.md` à `paths:` ; le récit
et les décisions datées vont dans `docs/`, jamais importés. Cf. `doctrine/contexte.md`.

## Langue

<Langue des réponses, commentaires de code et messages de commit.>

## Vue d'ensemble

<Trois à dix lignes : ce que fait le projet, pour qui, la contrainte qui le gouverne, et
ce qui est explicitement hors scope. Ce qu'une session doit savoir avant de lire la moindre
ligne de code — pas l'histoire de comment on y est arrivé.>

## Interdits — avant tout geste

<Les règles qui interdisent une action et ne peuvent pas attendre qu'un fichier soit lu :>

- **Jamais lancer le serveur/l'appli de l'utilisateur** (`<commande>`) : sa session peut
  tourner en parallèle. Instance isolée : `<skill ou commande>`.
- **Jamais commiter ni pousser sans demande explicite.** <Chemin de commit imposé, s'il y en
  a un.>
- <Fichier ou réglage qu'on ne touche pas sans en parler, avec la raison.>

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

## Commandes

```bash
<typecheck>    # …
<test>         # … (N tests attendus — le compteur est dans .claude/check.json)
<lint>
<build>
```

<Les bancs, scripts d'analyse et commandes rares vont dans `scripts/CLAUDE.md` ou la règle du
domaine — pas ici.>

## Pièges transverses — une ligne chacun

<Uniquement ceux qui peuvent frapper n'importe quelle session (environnement, installation,
outillage). Symptôme → cause → geste, avec un renvoi. Les pièges d'un domaine vont dans son
CLAUDE.md. Chaque piège mécaniquement détectable a sa ligne dans `regressions` du manifeste.>

1. <…>

## Où est le reste

| Je touche à… | Chargé automatiquement | À ouvrir avant un chantier de fond |
|---|---|---|
| `<dossier>/` | `<dossier>/CLAUDE.md` | `docs/<sujet>.md` |
| `<fichiers éparpillés>` | `.claude/rules/<domaine>.md` | `docs/<sujet>.md` |
| n'importe quel fichier source | — | `registry/<domaine>.md` (index `FUNCTION_REGISTRY.md`) |
| un bug déjà vu | — | `docs/incidents.md` (`grep`, jamais lu en entier) |

## Vigilance — <production / diffusion>

<Si le projet a une sortie publique : ce qui est irréversible une fois poussé, et la
checklist avant push. Retirer cette section si rien ne sort du poste.>
