# 04 — Forker ce template pour une autre techno

> Pour qui : tu veux faire de l'enablement sur une **autre techno** (pas Gemini), en réutilisant la même structure.

L'idée : ce repo est un **template réel** d'extension Gemini d'enablement. Pour le réadapter à un autre domaine, suis cette checklist.

## Vue d'ensemble

| Élément | À renommer | À garder | À adapter |
|---|---|---|---|
| `gemini-extension.json` | `name` | structure JSON | `description` |
| `README.md` racine | titre, pitch | structure | contenu |
| `GEMINI.md` | — | structure (sections) | persona, audience, sources ; règle "ne bluffe pas" reste |
| `commands/*.toml` | éventuellement | structure du prompt | template de l'artefact, sources interrogées |
| `mcp-servers/<nom>/` | dossier | scaffolding TS, cache, smoke scripts | sources ciblées (constantes en haut de `search-docs.ts`) |
| `hooks/hooks.json` + `scripts/` | — | structure (un hook SessionStart + un BeforeTool) | texte de la bannière, patterns du garde-fou git si tu en veux d'autres |
| `docs/01-04-*.md` | — | structure | versions des outils, URLs, troubleshooting |
| `content/` | éventuellement | structure | — |

## Checklist de fork (cible : < 30 min)

### 1. Cloner et repartir d'un git neuf

```bash
git clone https://github.com/antoninBr/anto-agent-gemini.git mon-extension-X
cd mon-extension-X
rm -rf .git && git init
```

### 2. Renommer l'extension

Édite `gemini-extension.json` :

```json
{
  "name": "mon-extension-X",
  "version": "0.1.0",
  "description": "Assistant d'enablement <techno X> ..."
}
```

Le `name` doit être en kebab-case et **correspondre au nom du dossier** (Gemini CLI vérifie cette correspondance).

### 3. Adapter la persona

Édite `GEMINI.md` :

- Remplace "Gemini CLI / Code Assist / MCP" par la techno X.
- Adapte l'audience cible.
- **Garde** la règle "ne jamais inventer de syntaxe" et la règle de format imposé.

### 4. Adapter les sources du MCP

Édite `mcp-servers/gemini-docs/src/search-docs.ts` :

- Remplace `GITHUB_REPO = "google-gemini/gemini-cli"` par le repo officiel de la techno X (s'il est sur GitHub et a une doc en markdown).
- Adapte `KNOWN_PAGES` (URLs de doc officielle hors GitHub).

Renomme éventuellement le dossier `mcp-servers/gemini-docs/` → `mcp-servers/<techno-x>-docs/` et adapte le path dans `gemini-extension.json` (et le nom dans `package.json`).

Si la doc de la techno X n'est pas sur GitHub (ex. site statique) : adapte `searchGitHub()` ou supprime-le et étoffe `KNOWN_PAGES` + ajoute un parser plus malin.

### 5. Adapter les templates des skills

Édite `commands/concept.toml` et `commands/lab.toml` :

- Si la techno X a des conventions différentes (par ex. besoin d'une section "compatibilité versions"), adapte les sections du template.
- Le squelette (ÉTAPES OBLIGATOIRES + TEMPLATE OBLIGATOIRE) reste identique.

### 6. Adapter les hooks lifecycle (optionnel mais recommandé)

Édite `scripts/session-start.sh` :

- Remplace le texte `📚 anto-agent-gemini chargé.` par la bannière de ton extension (commandes, sous-agents, garde-fous).
- Garde le format JSON : un seul objet sur stdout, champ `systemMessage`.

Édite `scripts/git-guard.sh` (si tu veux garder le garde-fou git) :

- Les patterns sont génériques git, pas spécifiques à Gemini — tu peux les conserver tels quels.
- Pour ajouter un pattern (par ex. bloquer `rm -rf` ou `npm publish`), ajoute un bloc `case` supplémentaire dans le script.
- Pour le retirer complètement, supprime l'entrée `BeforeTool` dans `hooks/hooks.json` et le script associé.

⚠️ Vérifie que les scripts gardent le bit exécutable après le clone :

```bash
chmod +x scripts/*.sh
git update-index --chmod=+x scripts/session-start.sh scripts/git-guard.sh
```

### 7. Mettre à jour la doc

- `README.md` racine : nouveau pitch, nouveau lien repo.
- `docs/01-prerequis.md` : versions et outils de la techno X (si différents). **La section sur `GITHUB_TOKEN` reste valide** tant que tu utilises GitHub Code Search comme corpus.
- `docs/02-installation-extension.md` : remplace `antoninBr/anto-agent-gemini` par ton URL.
- `docs/03-utilisation.md` : adapte les exemples de slash commands.
- `docs/04-fork-template.md` : tu peux supprimer ce fichier si tu n'as pas vocation à être re-forké, ou l'adapter pour expliquer comment forker ton template.

### 8. Build et test standalone

```bash
cd mcp-servers/<ton-mcp>
npm install
npm run build
GITHUB_TOKEN=ghp_... npm run smoke:search -- "une-feature-de-X"
```

Sortie attendue : un tableau JSON non vide.

### 9. Premier commit

```bash
git add .
git commit -m "init: fork de anto-agent-gemini pour <techno X>"
```

### 10. Tester l'install

```bash
gemini extensions link .
gemini
```

Dans le prompt : tu dois voir la bannière `SessionStart` adaptée à ta techno, puis `/help` doit lister tes commandes ; `/concept <feature-de-ta-techno>` doit produire une fiche dans `content/concepts/`.

## Ce qui est réutilisable tel quel

- L'architecture (1 agent + 2 skills + 1 MCP + 2 hooks).
- Le scaffolding TypeScript du MCP (cache, fetch, turndown).
- La structure du prompt des skills (ÉTAPES + TEMPLATE).
- Le parcours doc en 4 fichiers numérotés.
- Le pattern smoke scripts pour vérifier le MCP standalone.
- Le hook `BeforeTool` garde-fou git (patterns génériques, réutilisables tels quels).
- La gestion du `GITHUB_TOKEN` (si tu interroges des repos GitHub).

## Ce qui est spécifique à ce repo

- La persona Gemini.
- Les sources `KNOWN_PAGES` (Code Assist, MCP).
- Les exemples dans la doc.

## Prochaine étape

Une fois forké, lance `gemini extensions link .` (cf. [`02-installation-extension.md`](02-installation-extension.md) Méthode 2) et teste avec `/concept <feature-de-ta-techno>`.
