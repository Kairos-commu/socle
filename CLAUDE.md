# CLAUDE.md — socle

Instructions pour les sessions travaillant **sur le socle lui-même**.

## Langue

Français : réponses, contenu des fichiers, messages de commit.

## Ce que c'est

Une méthode de travail extraite de projets réels, pas un template de code. Aucun code
d'application, aucun framework, aucun choix de bibliothèque n'a sa place ici.

## Règles d'écriture

1. **Rien ici sans usage réel.** Une règle s'ajoute quand elle a été appliquée sur au moins
   un projet et qu'elle a évité quelque chose de constatable. Jamais par anticipation — c'est
   la règle qui a créé le socle, elle vaut d'abord pour lui.
2. **Toute contrainte annoncée doit avoir son mécanisme.** Ajouter une recommandation sans le
   test, le hook ou le type qui la fait tenir, c'est produire exactement ce que
   `doctrine/garde-mecanique.md` condamne.
3. **Un mécanisme doit avoir été vu échouer.** Le casser volontairement, constater le blocage,
   réparer. Un garde-fou jamais vu échouer est une intention.
4. **Générique par construction.** Aucun chemin absolu, aucun nom de personne, aucun nom de
   projet, aucun secret. Le socle est destiné à être lisible par d'autres.
5. **Les exemples sont anonymisés mais réels.** « Un projet Electron de 130 fichiers » plutôt
   qu'un nom ; jamais un cas inventé pour illustrer.

## Vérification

Avant de clore une tâche ici :

- `node --check bin/*.mjs` et `bash -n templates/*.sh` ;
- tout script modifié doit être exécuté **dans les deux sens** (cas qui passe, cas qui
  échoue) sur un cas réel, pas seulement fabriqué ;
- les templates JSON doivent parser.

## Portée

Le socle grossit par la preuve, pas par l'exhaustivité. Devant le doute entre « ajouter une
règle de plus » et « ne rien ajouter », ne rien ajouter : une doctrine que personne ne lit en
entier ne protège de rien.
