---
name: registry
description: Crée ou met à jour le registre de fonctions du projet (registry/<domaine>.md). Utiliser à l'initialisation d'un projet, et après tout ajout ou suppression de fichier source.
---

# /registry — index des fonctions par domaine

Cf. `doctrine/registre.md` du socle pour le pourquoi. Ce skill décrit le geste.

## Cas 1 — construction initiale (une seule passe, à faire tôt)

1. Lister les fichiers source réels selon `registry.sources` / `registry.extensions` du
   manifeste.
2. **Les regrouper par domaine**, pas par dossier — le découpage doit refléter la façon dont
   on raisonne sur le projet (processus principal, interface, données, orchestration…), pas
   l'arborescence. Cinq à huit domaines est la bonne échelle ; deux, c'est trop grossier pour
   servir, quinze, personne ne sait où chercher.
3. Pour chaque domaine, créer `registry/<domaine>.md` avec un en-tête « Périmètre » listant
   les fichiers couverts, puis une section par fichier.
4. Créer l'index à la racine (`FUNCTION_REGISTRY.md`) : la liste des domaines, une ligne
   chacun, plus le périmètre global et sa date.
5. Lancer `node <socle>/bin/check-registry.mjs` jusqu'à ce qu'il passe.

**Ne pas étaler cette passe sur plusieurs sessions.** Un registre à moitié construit n'est pas
utilisable et ne sera jamais fini — c'est le seul point où le tout-ou-rien est justifié.

## Cas 2 — maintenance (à chaque fichier créé, renommé ou supprimé)

Mettre à jour l'entrée **avant** de considérer la tâche terminée, au même titre que les tests.
Le script rend la chose non négociable ; ce skill dit quoi écrire.

## Format d'une entrée

```markdown
### `src/domaine/fichier.ts`

<Une à trois lignes : ce que fait ce fichier, et la contrainte non évidente qui le gouverne.>

| Fonction | Rôle |
|---|---|
| `nomFonction(args)` | une ligne, à l'indicatif |

**À savoir avant d'y toucher** : <le piège propre à ce fichier, s'il y en a un.>
```

## Ce qui fait la valeur d'une ligne

La colonne « rôle » ne paraphrase pas la signature :

- ✗ `readConfig(path)` → « lit la config »
- ✓ `readConfig(path)` → « lit la config, rend les défauts si le fichier est absent — ne
  throw jamais »

Écrire ce qu'on aurait voulu savoir **sans ouvrir le fichier**. Si la ligne n'évite pas
l'ouverture, elle ne sert à rien.

## Ce qu'on n'y met pas

Fonctions privées non exportées, tests, et tout ce qui se déduit de la signature. Ce n'est
pas une doc d'API générée : c'est un index de navigation, écrit pour être lu par quelqu'un
qui cherche où intervenir.
