# Vérification — ne jamais affirmer sans avoir lu ou exécuté

La règle la plus rentable du socle, et la moins coûteuse à appliquer.

## La règle

**Jamais affirmer « vérifié » sans avoir réellement lu le code source ou fait tourner la
commande.** Toute affirmation de statut porte un tag :

- `[code-verified: fichier:ligne]` — j'ai ouvert le fichier, la ligne dit ça.
- `[doc-only]` — c'est ce que la doc affirme, je ne l'ai pas recoupé avec le code.

`[doc-only]` n'est pas honteux. « D'après le README, ce comportement existe » est une
information légitime. Ce qui est interdit, c'est qu'elle se déguise en `[code-verified]`.

## Pourquoi ça change tout

Un agent qui raisonne sur une base de code produit spontanément des affirmations plausibles :
« cette fonction gère déjà ce cas », « ce garde-fou est en place ». Plausible et faux se
ressemblent, et l'erreur ne se voit qu'au prochain incident — parfois des semaines plus tard,
quand la décision fondée dessus a déjà produit du code.

Le tag ne rend pas l'agent plus intelligent. Il rend le doute **visible**, donc contestable.

## Corollaires

1. **Diagnostiquer par la preuve locale avant de chercher ailleurs.** Logs, traces, config
   réelle sur disque, sortie de commande — avant toute recherche web ou toute hypothèse sur
   le comportement d'une bibliothèque. Un bug peut vivre hors du dépôt (environnement,
   permissions, état système persisté) et aucune lecture de code ne le trouvera.

2. **Agréger avant de lire.** Sur un incident, compter d'abord sur l'ensemble des traces
   (combien d'occurrences, sur quelle fenêtre, corrélées à quoi), lire le code ensuite. Lire
   le code d'abord fait trouver une cause plausible et arrêter la recherche là.

3. **Un chiffre mesuré bat un essai réussi.** Un correctif validé par un seul essai manuel
   sur un processus non déterministe ne prouve rien. Si le comportement varie, il faut un
   taux sur N passes, avant et après.

4. **Rapporter fidèlement.** Si un test échoue, le dire avec sa sortie. Si une étape a été
   sautée, le dire. Un « c'est bon » non fondé coûte plus cher que l'échec qu'il masque.

## Où l'inscrire

Dans le `CLAUDE.md` du projet, en tête — pas au milieu. C'est la règle qui conditionne la
valeur de tout ce que l'agent affirmera ensuite.
