# Le registre de fonctions — construit à froid, tenu par un test

Un index `registry/<domaine>.md` par domaine du projet, listant pour chaque fichier source
ses fonctions publiques et leur rôle en une ligne. Un `FUNCTION_REGISTRY.md` à la racine sert
d'index des domaines.

## Pourquoi, et pourquoi maintenant

Sans registre, une session qui doit intervenir sur un fichier commence par grepper le codebase
à l'aveugle — coûteux, incomplet, et surtout non reproductible d'une session à l'autre. Avec
registre, elle lit une page.

**Le construire à froid, en une seule passe, quand le projet est encore petit.** C'est la
seule fenêtre où c'est faisable : sur un dépôt devenu grand, le rattrapage est un chantier à
part entière que personne n'entreprend. Le coût à 50 fichiers est d'une passe ; à 300, il est
prohibitif.

## Ce qui le maintient en vie

Pas une consigne. **Un test qui échoue** (`bin/check-registry.mjs`, installé par `bootstrap`) :

- un fichier source réel absent du registre → échec, nommant le fichier ;
- une entrée du registre dont le fichier n'existe plus → échec, nommant l'entrée.

Branché dans la commande de test du projet et dans le hook pre-commit. Sans ce test, un
registre a une durée de vie de trois semaines.

## Le format d'une entrée

```markdown
### `src/domaine/fichier.ts`

<Une à trois lignes : ce que ce fichier fait, et la contrainte non évidente qui le gouverne.>

| Fonction | Rôle |
|---|---|
| `nomFonction(args)` | une ligne, à l'indicatif |

**À savoir avant d'y toucher** : <le piège propre à ce fichier, s'il y en a un.>
```

La colonne « rôle » n'est pas une paraphrase de la signature. `readConfig(path)` → « lit la
config » n'apporte rien ; « lit la config, rend les valeurs par défaut si le fichier est
absent — ne throw jamais » est ce qu'on avait besoin de savoir.

## Ce qu'on n'y met pas

Les fonctions privées non exportées, les tests, et tout ce qui se déduit de la signature.
Le registre est un index de navigation, pas une doc d'API générée.
