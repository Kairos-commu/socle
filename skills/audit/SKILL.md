---
name: audit
description: Cross-référence la documentation du projet avec le code source réel. Ne rien modifier, produire un rapport de divergences.
---

# /audit — cohérence doc ↔ code

**Ne rien modifier.** Ce skill produit un rapport. Si une correction est ensuite demandée,
c'est une tâche séparée — mélanger les deux fait perdre la vue d'ensemble à mi-chemin.

## Périmètre

Tous les `.md` du dépôt hors `node_modules`, plus les `SKILL.md`. Le manifeste
`.claude/check.json` peut déclarer `audit.exclude` pour en écarter.

**Un journal d'incidents est un cas à part.** C'est un document historique daté : un chemin
ou un nom de fonction qui y est cité peut légitimement avoir disparu, et un ancien nom y est
délibérément conservé pour les événements antérieurs à un renommage. N'y signaler une
divergence que si elle casse la **lecture du post-mortem lui-même** — jamais « ce fichier
n'existe plus aujourd'hui », c'est attendu. Le déclarer dans `audit.historical`.

## Vérifications

1. **Chemins de fichiers cités** — pour chacun, vérifier qu'il existe. Lister les obsolètes.

2. **Noms de fonctions, classes, constantes cités** — pour chacun, grepper les sources.
   Lister ceux qui n'existent plus ou ont été renommés. C'est ici que se voient les
   renommages appliqués au code mais pas à la doc.

3. **Pièges / gotchas documentés** — pour chaque piège numéroté, vérifier que le motif décrit
   existe encore sous cette forme. Un piège qui référence du code supprimé mérite d'être
   **signalé, pas nécessairement supprimé** : la leçon peut survivre au code.

4. **Commandes documentées** — chaque commande citée existe-t-elle dans `package.json`
   (ou `Makefile`, `justfile`) ? Et l'inverse : un script réel absent de la doc est un
   candidat à documenter, ou à juger volontairement interne.

5. **Skills** — les chemins, variables d'environnement et sélecteurs qu'ils citent
   correspondent-ils au code réel ? Une dérive ici casse silencieusement un outil, pas
   seulement une phrase.

6. **Doublons documentaires** — deux fichiers qui décrivent la même chose de façon
   incohérente. Lister les candidats à la fusion, ne fusionner dans ce skill sous aucun
   prétexte.

7. **Couverture du registre** — comparer la table des fichiers analysés aux fichiers réels.
   Si `bin/check-registry.mjs` est installé, le lancer et reprendre sa sortie plutôt que de
   refaire le calcul à la main.

8. **Chiffres cités** — nombres de fichiers, de tests, de modules, tailles. Ils dérivent plus
   vite que le reste et se vérifient en une commande. Un chiffre faux dans un `CLAUDE.md`
   fausse le raisonnement de toutes les sessions suivantes.

## Format du rapport

Par fichier audité, une ligne par divergence :

```
<fichier>:<ligne approx> — <ce qui est écrit> vs <ce qui existe réellement>
```

Terminer par : nombre de divergences par catégorie, et une **priorité** — ce qui induirait
une future session en erreur, versus ce qui est cosmétique. C'est cette distinction qui rend
le rapport actionnable ; une liste plate de 80 divergences ne l'est pas.
