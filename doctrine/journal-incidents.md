# Le journal d'incidents — l'actif qui prend de la valeur

Un fichier `docs/incidents.md` append-only, une section par incident réel. C'est le document
qui distingue un projet documenté d'un projet qui a une mémoire.

## Ce que c'est, et ce que ce n'est pas

- **Ce n'est pas de la doc d'état.** Un chemin ou un nom de fonction cité peut avoir disparu
  depuis : c'est attendu. Un journal historique ne se met pas à jour, il s'ajoute.
- **Ce n'est pas un changelog.** On n'y liste pas ce qui a été fait, on y explique ce qui a
  cassé, pourquoi, et comment on l'a su.
- **C'est le corpus qui empêche de refaire la même erreur** — y compris à six mois, y compris
  par une autre session qui n'a aucun souvenir de la première.

## Le gabarit d'une entrée

```markdown
## <Symptôme tel qu'il a été vécu> (JJ/MM)

<Qui l'a signalé, dans quelles conditions. Le symptôme brut, pas encore interprété.>

**Ce que les traces montrent** : <faits vérifiés, avec la source — fichier de log, sortie de
commande, ligne de code. Jamais une hypothèse à ce stade.>

**Cause racine** : <le mécanisme, pas la classe de problème. Si plusieurs causes se
superposent, les numéroter — c'est fréquent, et n'en corriger qu'une donne l'illusion d'un
correctif.>

**Fix** : <ce qui a changé, et pourquoi cette forme plutôt qu'une autre.>

**Ce qui n'est PAS corrigé** : <les défauts constatés au passage et laissés tels quels, avec
la raison. C'est la partie la plus utile du journal six mois plus tard.>

**Vérifié** : <commandes lancées, compteurs, ce qui a été rejoué. Distinguer « vérifié en
test » de « vérifié en usage réel » — le second est souvent absent, il faut l'écrire.>

Fichiers touchés : <liste>
```

## Les quatre règles qui font sa valeur

1. **Le symptôme d'abord, dans les mots de celui qui l'a vécu.** « L'appli semblait se
   fermer » retrouve l'incident six mois plus tard ; « race condition dans le handler TTS »
   ne se cherche pas, parce qu'on ne sait pas encore que c'est ça.

2. **Écrire ce qui n'est pas corrigé.** Un défaut constaté et laissé — avec sa raison — vaut
   plus qu'un correctif de plus. C'est ce qui évite de le re-diagnostiquer entièrement, et
   c'est la file d'attente réelle du projet.

3. **Écrire les hypothèses écartées, et par quoi.** « J'ai d'abord soupçonné X, écarté parce
   que la trace montre Y » économise le même détour à la session suivante.

4. **Distinguer « corrigé » de « corrigé et revérifié en conditions réelles ».** La plupart
   des correctifs sont écrits juste après le diagnostic, donc jamais rejoués. Le dire
   explicitement — sinon le journal affirme plus qu'il ne sait, et devient exactement le
   genre de source dont on ne peut plus rien tirer.

## Le rapport avec le reste du socle

Chaque entrée finit par produire soit un mécanisme (`doctrine/garde-mecanique.md`), soit une
ligne de grep dans `check` (étape « régressions connues »), soit un piège documenté dans le
`CLAUDE.md`. Un incident qui ne produit rien de tout ça a de bonnes chances de se reproduire.
