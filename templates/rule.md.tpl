---
paths:
  - "<glob 1>"
  - "<glob 2>"
---

<!-- Règle à chargement CONDITIONNEL : n'entre dans le contexte que quand un fichier qui
     matche `paths:` est lu. Pour un domaine ÉPARPILLÉ sur plusieurs dossiers — sinon un
     CLAUDE.md dans le dossier suffit. Si cette règle importe une doc (`@../../docs/x.md`),
     l'import inconditionnel de cette doc doit être RETIRÉ du CLAUDE.md racine, sans quoi
     elle est chargée deux fois — check-context.mjs le signale. -->

# <domaine> — <une ligne>

- <Règle qui ne vaut que pour ces fichiers.>
- <Piège local.>

À lire avant un chantier de fond : `docs/<sujet>.md`.
