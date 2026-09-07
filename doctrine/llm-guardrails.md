# Garde-fous pour un agent qui agit vraiment

Patterns extraits de projets où un modèle local appelle des outils à effet réel (fichiers,
système, réseau, dépenses). Chacun vient d'un incident constaté, pas d'une précaution
théorique. À importer dans le `CLAUDE.md` d'un projet dès qu'un modèle peut *faire* quelque
chose et pas seulement répondre.

## 1. Un palier de risque par outil, jamais par message

Classer chaque outil, pas chaque requête :

- **auto** — aucun effet de bord, exécuté sans demander (lecture, recherche).
- **confirm** — effet réel mais rattrapable, pause obligatoire (ouvrir, lancer, arrêter).
- **irreversible** — non rattrapable, traitement le plus strict (écrire, supprimer).

**Un outil non classé est traité comme irreversible** (fail-closed). Sans ça, un outil ajouté
plus tard et oublié dans la table s'exécute librement.

Ne jamais faire dépendre la confirmation d'une auto-évaluation du modèle (« je suis sûr à
80 % »). C'est le seul juge qu'on ne peut pas contrôler.

Le palier peut être **escaladé par argument** : une lecture est `auto`, la lecture d'un
chemin sensible passe à `confirm`. Le palier générique reste la source de vérité ;
l'escalade est locale et explicite.

## 2. Le code décide, le modèle rédige

Chaque fois qu'une valeur peut être **construite** plutôt que **devinée**, la construire :

- une URL de recherche : le modèle donne le site et les mots-clés, le code assemble l'URL ;
- une suppression : le code calcule la liste des fichiers, le modèle n'en désigne aucun ;
- un nom de fichier de sortie : construit à partir de la date et du sujet normalisé ;
- un contexte à transmettre à un service tiers : joint par l'application, pas recopié par le
  modèle.

Règle générale : **ne jamais demander à un modèle de reproduire fidèlement une chaîne qu'il
vient de lire.** Chemins avec apostrophe typographique, identifiants, noms exacts — il
normalise, paraphrase, invente une variante. Ce n'est pas rattrapable par une consigne.

## 3. Ne jamais exiger au tour N+1 une donnée qui n'existait qu'au tour N

Les résultats d'outils ne survivent pas d'un tour à l'autre dans la fenêtre de contexte. Un
identifiant rendu par un outil au tour N est **structurellement absent** au tour N+1 : le
modèle ne peut que l'inventer. Rendre ces références facultatives et les résoudre côté code
(le dernier plan de cette conversation, la dernière recherche de cette session).

## 4. Une valeur d'exemple dans une description est une valeur que le modèle enverra

`« ex: p_3fa9c2d1 »` dans la description d'un paramètre ressort tel quel dans les appels
réels. Idem pour un gabarit (`[Plan p_AAAAMMJJ_HHMM]`). Décrire la **forme** sans donner
d'instance, ou accepter que l'instance donnée soit utilisée.

## 5. Normaliser plutôt que rejeter indéfiniment

Un modèle qui envoie `path` au lieu de `filename`, ou `content` au lieu de `entry`, ne se
corrige pas après quatre rejets identiques : il essaie une cinquième variante. Deux gestes :

- **alias d'arguments** — accepter les synonymes évidents et normaliser avant validation ;
- **tolérance de forme** — un chemin absolu là où un nom nu est attendu se réduit à son
  dernier segment (ce qui, au passage, interdit toute traversée).

Garder le rejet pour ce qui est réellement ambigu. Un rejet qui se répète est un défaut de
contrat, pas un défaut du modèle.

## 6. Détecter dans la réponse produite, jamais deviner dans la demande

Deux familles de gardes, une seule est fiable :

- ✗ **lire la demande pour deviner l'intention** — c'est réinventer la classification par
  mots-clés, avec ses faux positifs et ses angles morts.
- ✓ **lire la réponse déjà produite et la confronter à un fait structurel** — « le texte
  annonce une action au futur » + « aucun outil n'a été appelé ce tour-ci » = promesse non
  tenue, une relance ciblée. Le fait structurel est certain ; seule la détection textuelle
  est approximative, et elle ne déclenche rien toute seule.

Une relance : **un seul essai**, jamais une boucle. Si elle échoue, garder le résultat tel
quel et le dire.

## 7. Vocabulaire fermé pour ce qui doit marcher quand le modèle déraille

Un arrêt d'urgence, un changement de mode, une commande critique : reconnus par une
expression régulière évaluée **avant tout appel au modèle**. Un mécanisme de secours qui
dépend du modèle pour être compris est inutilisable exactement quand il sert.

Reconnaître par la **forme** plutôt que par une liste exacte (une transcription vocale
produit des variantes), et rester **fail-closed** : ce qui n'est pas reconnu ne déclenche
rien.

## 8. Écrire l'intention avant l'action, pas le résultat après

Un journal append-only qui reçoit l'appel **avant** exécution ou confirmation. C'est le seul
moyen de voir ce qui a été envisagé mais refusé, et ce qui était en cours au moment d'un
crash. Le résultat s'écrit ensuite, dans un second journal ou une seconde ligne.

Même patron pour toute ressource système modifiée temporairement (un son coupé, un service
suspendu) : noter l'intention avant, retirer la note quand la restauration a réussi. Ce qui
reste au journal est exactement ce qui a fui.

## 9. Dédupliquer par signature dans un même tour

Un modèle rappelle le même outil avec les mêmes arguments, y compris après un refus explicite
ou un succès. Retenir, pour la durée d'un tour, la signature `nom + arguments triés` :

- rappel après refus → renvoyer le refus, sans rouvrir de confirmation ;
- rappel après succès → renvoyer le résultat, sans ré-exécuter.

Concerne aussi certains outils `auto` : tout ce qui **persiste** un effet (écriture mémoire)
ou dont l'exécution est **payante**.

## 10. Un résultat d'outil dit son propre périmètre

Un outil qui cherche « dans tous les fils sauf le fil courant » et rend « aucun résultat »
fait conclure au modèle que la chose n'existe pas — alors qu'elle est peut-être sous ses yeux.
Le message de résultat doit énoncer ce que la recherche **ne couvre pas**.

De même, un message d'erreur émis par un garde ne doit pas ressembler à une panne : le modèle
le rapportera comme telle à l'utilisateur. `[À CORRIGER — rien n'a échoué, reformule ainsi]`
plutôt que `[Erreur : ...]`.

## 11. Les marqueurs système sont imitables

Tout marqueur que l'application ajoute à l'historique (`[Outils réellement appelés : ...]`)
devient un motif que le modèle reproduit — y compris pour habiller une action jamais faite.
Sa présence dans une sortie de modèle est donc un **signal de fabrication**, exploitable comme
tel : détecter, relancer une fois, retirer le marqueur dans tous les cas.

## 12. Un plafond de dépense au seul point de passage

Chaque chemin qui appelle un service payant a sa propre borne (nombre de tours, déduplication,
plafond de tokens). Aucune ne borne leur **somme**. Un compteur journalier, contrôlé à
l'endroit unique par lequel passe tout appel réseau payant, avec un refus explicite au-delà
que chaque appelant relaie comme une absence de configuration — aucun chemin ne casse, tous
perdent la même capacité.

**Fail-open délibéré** : si le compteur est illisible, l'appel passe et l'anomalie est
signalée. C'est un garde-fou contre l'hémorragie, pas un garde-fou de sécurité.

## 13. Séparer les chemins d'exécution qui ont des exigences opposées

Un même modèle peut servir des usages qui se contredisent : un chemin qui doit pouvoir
conclure « rien n'a été trouvé » et un chemin qui doit toujours répondre ; un chemin qui
interdit l'invention et un chemin qui la demande. Ne pas les fusionner pour économiser du
code : prompt distinct, outils distincts, garde-fous distincts.

Corollaire utile : dériver la liste d'outils de chaque chemin d'une **déclaration unique**
(chaque capacité annonce à quels usages elle appartient) plutôt que de recopier des listes.
Une capacité ne peut alors pas fuir dans un chemin par oubli.
