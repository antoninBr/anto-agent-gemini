# MCP `gemini-docs`

Serveur MCP qui expose 2 outils pour interroger la doc officielle Gemini :

- `search_gemini_docs(query, limit?)` — recherche dans la doc Gemini CLI (GitHub) + pages curées (Code Assist, MCP).
- `read_gemini_doc_page(url)` — récupère le contenu markdown d'une page (avec cache 1h).

## Build

```bash
npm install
npm run build
```

## Vérification standalone (sans Gemini)

```bash
npm run smoke:search -- "extensions"
npm run smoke:read   # lit le README de gemini-cli par défaut
npm run smoke:read -- "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/extensions/reference.md"
```

## Variables d'environnement

- **`GITHUB_TOKEN` (requis)** — token GitHub personnel. La GitHub Code Search API renvoie `401 Unauthorized` sans token (l'endpoint `/search/code` exige une authentification depuis 2022).
  - **Créer un token :** GitHub → Settings → Developer settings → Personal access tokens → "Generate new token (classic)" ou fine-grained.
  - **Scope requis :** aucun. Un token "no scope" suffit pour la recherche dans les repos publics.
  - **Export :**

    ```bash
    export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
    ```

    Pour rendre permanent, ajoute la ligne à `~/.bashrc`, `~/.zshrc`, ou `~/.config/fish/config.fish`.

## Sources interrogées

1. **GitHub Code Search** sur `google-gemini/gemini-cli` (filtre `path:docs extension:md`) — corpus principal.
2. **Pages curées** (en dur dans `src/search-docs.ts`, constante `KNOWN_PAGES`) :
   - Doc Gemini Code Assist
   - Spec et quickstart MCP

Pour ajouter une source curée, édite `KNOWN_PAGES` dans `src/search-docs.ts` puis `npm run build`.

## Intégration dans l'extension Gemini

Le MCP est déclaré dans `gemini-extension.json` à la racine du repo via :

```json
{
  "mcpServers": {
    "gemini-docs": {
      "command": "node",
      "args": ["${extensionPath}/mcp-servers/gemini-docs/dist/index.js"]
    }
  }
}
```

`${extensionPath}` est résolu à la volée par Gemini CLI au chemin absolu du dossier de l'extension. Pour passer `GITHUB_TOKEN` au serveur, ajoute un bloc `env` à la config (cf. doc des `mcpServers` Gemini CLI).

## Architecture

- `src/index.ts` — bootstrap stdio + routing des 2 outils.
- `src/fetch-page.ts` — `read_gemini_doc_page` + cache TTL 1h.
- `src/search-docs.ts` — `search_gemini_docs` (GitHub + KNOWN_PAGES).
- `src/scripts/smoke-{search,read}.ts` — vérification standalone.
