# Une consigne ne tient pas. Un mécanisme qui casse, oui.

Le principe qui décide de la forme de tout le reste du socle.

## Le constat

Une consigne écrite en langue naturelle — dans un prompt, dans un `CLAUDE.md`, dans un
commentaire — est respectée la plupart du temps. « La plupart du temps » suffit pour du
confort, jamais pour une garantie. Sur un volume suffisant, tout ce qui repose sur la seule
bonne volonté d'un lecteur (humain ou modèle) finit par céder :

- une règle « mets à jour le registre avant de clore la tâche » est oubliée à la troisième
  session ;
- une consigne « ne prétends jamais avoir fait ce que tu n'as pas fait » est enfreinte dès
  que la formulation devient ambiguë ;
- une convention « ces deux fichiers doivent rester synchronisés » diverge silencieusement,
  et personne ne le voit avant l'incident.

Ce n'est pas un défaut de discipline. C'est une propriété des consignes.

## La règle

**Toute contrainte qui compte doit avoir un mécanisme qui échoue quand elle est violée.**

| Contrainte | Consigne (ne tient pas) | Mécanisme (tient) |
|---|---|---|
| Le registre est à jour | « pense à le mettre à jour » | un test compare le registre aux fichiers réels, sort en code 1 |
| Deux implémentations jumelles restent identiques | un commentaire dans les deux | un test croisé compare leurs sorties sur N cas communs |
| Toute capacité est documentée | une ligne dans le CLAUDE.md | un test échoue tant que la note manque |
| Pas de secret commité | « attention aux clés » | un hook pre-commit qui scanne et bloque |
| Les tests passent avant de clore | « lancer les tests » | un skill à étapes ordonnées, verdict explicite |

## Comment choisir le mécanisme

Par ordre de préférence, du plus fiable au moins fiable :

1. **Le compilateur** — un champ obligatoire dans un type refuse la compilation. Le plus
   fort : la violation n'existe jamais, même transitoirement.
2. **Un test** — échoue en CI et en pre-commit, nomme précisément ce qui manque.
3. **Un hook** — bloque le commit, mais peut être contourné (`--no-verify`).
4. **Un skill à étapes** — structure le geste, dépend encore de son invocation.
5. **Une consigne** — le dernier recours, et jamais pour ce qui compte vraiment.

Un mécanisme dont le message d'échec ne dit pas **quoi faire** est à moitié fait. « Registre
incohérent » ne vaut rien ; « registry/api.md ne mentionne pas src/api/auth.ts (créé, jamais
documenté) » se corrige en trente secondes.

## Le corollaire qui s'applique au socle lui-même

Un socle qui se contente de *recommander* ces pratiques est exactement la chose qu'il
condamne. C'est pourquoi `bootstrap` installe des scripts et des hooks, pas seulement des
fichiers de doc — et pourquoi `check` a un verdict binaire plutôt qu'un résumé nuancé.

## Fail-closed, fail-open : choisir consciemment

Un mécanisme qui ne peut pas trancher doit choisir son sens de défaillance, et le dire :

- **fail-closed** — dans le doute, refuser. Pour tout ce qui a un effet irréversible.
- **fail-open** — dans le doute, laisser passer. Pour tout ce qui, en bloquant, casserait
  plus que ce qu'il protège (un garde-fou de coût, un filtre de pertinence).

Le mauvais cas n'est pas d'avoir choisi le mauvais sens : c'est de ne pas avoir choisi, et de
découvrir le comportement par accident.
