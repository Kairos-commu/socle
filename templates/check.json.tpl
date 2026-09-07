{
  "project": "<nom>",
  "steps": [
    { "name": "Types",  "cmd": "npm run typecheck", "expect": "0 erreur" },
    { "name": "Tests",  "cmd": "npm test",          "expect": "0 échec", "counter": 0 },
    { "name": "Lint",   "cmd": "npm run lint",      "expect": "0 erreur, 0 warning" },
    { "name": "Build",  "cmd": "npm run build",     "expect": "build sans erreur" }
  ],
  "regressions": [
    {
      "pattern": "<motif grep>",
      "why": "<l'incident qui a produit cette ligne, et le faux positif légitime éventuel>",
      "ref": "docs/incidents.md#<ancre>"
    }
  ],
  "registry": {
    "dir": "registry",
    "index": "FUNCTION_REGISTRY.md",
    "sources": ["src"],
    "extensions": [".ts", ".js"],
    "exclude": ["\\.test\\.", "\\.spec\\.", "node_modules", "dist"]
  },
  "audit": {
    "historical": ["docs/incidents.md"],
    "exclude": ["CHANGELOG.md"]
  },
  "visual": {
    "when": "le diff touche l'interface",
    "how": "<skill de lancement isolé, ou commande e2e>"
  },
  "sensitive": [
    {
      "paths": ["<chemin dont le comportement n'est pas déterministe>"],
      "cmd": "<harnais de mesure>",
      "note": "indisponibilité signalée, non bloquante"
    }
  ]
}
