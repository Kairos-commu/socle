# Contexte — ce qui se charge à chaque session, et ce qui attend d'être utile

Un fichier d'instructions n'est pas lu une fois : il est **rechargé dans le contexte à chaque
lancement**, avant la première ligne de code, et il pèse ensuite sur chaque tour. Deux coûts,
et le second est le plus cher :

- des tokens, à chaque session, sur chaque projet ouvert en parallèle ;
- de l'**adhérence** — au-delà de ~200 lignes, l'agent suit moins bien ce qu'on lui demande,
  parce que les règles qui comptent sont noyées dans ce qui ne compte pas aujourd'hui.

Cette doctrine dit où va chaque chose pour que la session parte légère et trouve le reste
au moment où elle en a besoin. Mécanisme : `bin/check-context.mjs`.

## Comment Claude Code charge (vérifié dans sa documentation, 16/09/2026)

| Fichier | Chargé |
|---|---|
| `CLAUDE.md` racine, `CLAUDE.local.md`, `~/.claude/CLAUDE.md` | **à chaque lancement**, en entier |
| tout `@chemin` importé par ces fichiers, récursivement | **à chaque lancement** — un import organise, il n'économise rien |
| `.claude/rules/*.md` sans `paths:` | **à chaque lancement** |
| `.claude/rules/*.md` avec `paths: [globs]` | quand un fichier qui matche est **lu** |
| `CLAUDE.md` dans un **sous-dossier** | quand un fichier de ce dossier est **lu** |
| `docs/`, `registry/`, tout le reste | jamais seul — l'agent l'ouvre quand on l'y envoie |

Les commentaires HTML sont retirés avant l'injection : ils ne coûtent rien. Après un
`/compact`, seul le `CLAUDE.md` racine est réinjecté d'office ; les autres reviennent quand
un fichier concerné est relu.

## Les quatre couches

**1. Utilisateur — `~/.claude/CLAUDE.md`.** Ce qui vaut pour TOUS les projets de cette
machine et ne concerne que la personne : langue, discipline de vérification, façon de
travailler avec l'agent, économie de tokens. Écrit une fois, jamais recopié par projet.
Cinquante lignes au plus. Un projet partagé avec une équipe ne peut pas compter dessus (les
autres ne l'ont pas) : ce qui doit tenir pour l'équipe est répété dans le projet.

**2. Racine du projet — `CLAUDE.md`, ≤ 200 lignes, cible 150.** Uniquement ce qu'une session
doit savoir **avant d'agir**, quel que soit le fichier qu'elle va toucher :

- ce qu'est le projet, en dix lignes ;
- les règles qui interdisent un geste (ne pas lancer l'appli de l'utilisateur, ne pas
  commiter sans demande, ne pas toucher tel fichier) — celles-là ne peuvent pas attendre
  qu'un fichier soit lu ;
- vérification et portée (cf. `verification.md`) ;
- les commandes de base : typecheck, tests, lint, build, `/check` ;
- les pièges **transverses** — un par ligne, avec un renvoi ;
- **« Où est le reste »** : la carte des couches suivantes, une ligne par entrée.

**3. Domaine — `<dossier>/CLAUDE.md` ou `.claude/rules/<domaine>.md` avec `paths:`.** Les
règles qui ne valent que quand on touche cette partie du code : conventions du dossier,
pièges locaux, réglages à ne pas modifier sans le dire, et le renvoi vers la doc de fond
(« lire `docs/x.md` avant un chantier sur le moteur »). Trente à quatre-vingts lignes.

Choisir entre les deux formes :
- **`CLAUDE.md` dans le dossier** quand le domaine EST un dossier (`src/main/`,
  `src/renderer/constellation/`, `scripts/`) — la règle vit avec le code, se lit dans
  l'arborescence, se déplace avec lui ;
- **règle à `paths:`** quand le domaine est **éparpillé** (un moteur qui vit dans
  `renderer/orchestrator/`, `renderer/llm/` et `main/llm.js` ; un pense-bête dans `ui/`
  parmi 160 autres fichiers) — un seul fichier, plusieurs globs.

Une règle peut importer une doc entière (`@../../docs/x.md`) : c'est un chargement
conditionnel de cette doc, utile pour une histoire longue qu'on ne veut pas réécrire.
Mais **retirer alors l'import inconditionnel de la racine** — sinon la doc est chargée deux
fois, et rien ne le dit (voir « L'incident »).

**4. Fond — `docs/`, `registry/`, journal d'incidents.** L'histoire, les décisions datées,
les post-mortems, l'index des fonctions. **Jamais importé.** Une couche 2 ou 3 y envoie
(« à lire avant tout chantier sur X ») et l'agent l'ouvre à ce moment-là — c'est un coût
payé par la session qui en a besoin, pas par toutes.

## Le test pour placer une phrase

Devant chaque paragraphe d'un `CLAUDE.md` qui grossit, une question : **une session qui ne
touche pas à ce domaine a-t-elle besoin de le savoir avant d'agir ?**

- oui → racine ;
- non, mais quiconque touche ces fichiers doit le savoir → domaine ;
- non, c'est le récit de comment on en est arrivé là → fond.

Le récit est précieux — c'est lui qui explique les choix — mais il se lit quand on va
toucher au choix, pas à chaque ouverture. La racine dit **ce qui est** et **ce qu'on ne fait
pas** ; le fond dit **pourquoi**.

## L'incident qui a produit cette doctrine

Un projet de bureau de quatre mois : `CLAUDE.md` de 685 lignes important cinq documents,
**284 Ko chargés à chaque session — ~120 000 tokens, mesurés sur `/context`** (le premier
estimateur disait 70 000 : le français en markdown pèse ~2,4 octets par token, pas 4) —
quinze fois la cible en lignes — dont un
document de 1 230 lignes racontant chaque passe de design depuis le premier jour. Le 12/09,
un diagnostic avait produit deux règles à `paths:` pour rendre deux de ces documents
conditionnels ; les `@imports` de la racine n'ont jamais été retirés. Pendant quatre jours,
~58 000 tokens rechargés pour rien à chaque lancement, et chargés deux fois dès qu'un
fichier de la scène était touché. Personne ne l'a vu : aucune commande ne le mesurait.

Après découpage (racine 130 lignes, trois `CLAUDE.md` de dossier, six règles à `paths:`, le
récit dans `docs/`) : 15 Ko au lancement, ~6 000 tokens — dix-neuf fois moins — plus le
domaine touché ; et `check-context.mjs` échoue si la racine repasse 200 lignes ou si un
doublon réapparaît.

## Ce que ça ne règle pas

- La qualité des règles elles-mêmes. Une racine courte et vague vaut moins qu'une longue et
  précise — la cible est courte ET précise, cf. `verification.md`.
- Un domaine dont la règle n'arrive qu'après la première lecture : un interdit qui doit
  précéder tout geste reste en racine, même s'il ne concerne qu'un dossier.
- L'estimation de tokens du mécanisme (octets / 2,4, calibrée sur une mesure réelle de
  markdown français) reste une estimation ; `/context` dans une session donne le chiffre
  réel, et c'est lui qui fait foi — `context.bytesPerToken` du manifeste l'ajuste.
