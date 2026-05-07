# Plan d'implémentation — Extension Gemini d'enablement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec source :** [`docs/superpowers/specs/2026-05-07-enablement-assistant-design.md`](../specs/2026-05-07-enablement-assistant-design.md)

**Objectif :** construire une extension Gemini installable contenant 1 agent (`GEMINI.md`), 2 skills (`/concept`, `/lab`), 1 MCP TypeScript (`gemini-docs`) qui interroge la doc officielle Gemini, et la doc transférable associée en français.

**Architecture :** le repo est l'extension. Installable via `gemini extensions install`. Le MCP fournit 2 outils (search/read) sur la doc officielle, fetchés en live (pas d'index local, cache mémoire 1h). Les artefacts (concepts/labs) vivent dans `content/`.

**Stack :** Node 20+, TypeScript, `@modelcontextprotocol/sdk`, `undici`, `turndown`, Gemini CLI.

**Note sur les tests :** la spec a explicitement exclu une suite de tests automatisés (Section 7 — "hors périmètre Lean"). Le plan utilise donc des **scripts smoke standalone** pour vérifier le MCP, et de la **vérification manuelle** pour les artefacts texte (markdown, TOML, JSON). Pas de TDD strict.

**Note sur la langue :** narrative en français, identifiants techniques / commandes / blocs de code en anglais (cf. mémoire feedback `Communication en français`).

---

## Structure des fichiers

À créer (tous les chemins relatifs à la racine du repo) :

```
anto-agent-gemini/
├── .gitignore
├── README.md
├── gemini-extension.json
├── GEMINI.md
├── commands/
│   ├── concept.toml
│   └── lab.toml
├── mcp-servers/
│   └── gemini-docs/
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── src/
│           ├── index.ts          # Entry point: stdio MCP server
│           ├── fetch-page.ts     # read_gemini_doc_page + cache
│           ├── search-docs.ts    # search_gemini_docs (GitHub API + sources curées)
│           └── scripts/
│               ├── smoke-search.ts
│               └── smoke-read.ts
├── docs/
│   ├── 01-prerequis.md
│   ├── 02-installation-extension.md
│   ├── 03-utilisation.md
│   ├── 04-fork-template.md
│   └── internal/
│       └── verification-notes.md  # Notes de la Tâche 0 (pas livré, reste en interne)
└── content/
    ├── concepts/
    │   └── .gitkeep
    └── labs/
        └── .gitkeep
```

Les fichiers `docs/superpowers/specs/*.md` et `docs/superpowers/plans/*.md` existent déjà.

**Responsabilité par fichier :**

| Fichier | Responsabilité |
|---|---|
| `gemini-extension.json` | Manifeste — déclare le nom, la version, et le MCP `gemini-docs`. |
| `GEMINI.md` | Persona/règles de l'agent (chargé auto par Gemini quand l'ext est active). |
| `commands/concept.toml` | Skill `/concept <feature>` — prompt + template de fiche concept. |
| `commands/lab.toml` | Skill `/lab <feature>` — prompt + template de lab. |
| `mcp-servers/gemini-docs/src/index.ts` | Bootstrap MCP stdio + routing des 2 outils. |
| `mcp-servers/gemini-docs/src/fetch-page.ts` | Logique de `read_gemini_doc_page` + cache TTL en mémoire. |
| `mcp-servers/gemini-docs/src/search-docs.ts` | Logique de `search_gemini_docs` — GitHub Code Search + pages curées. |
| `mcp-servers/gemini-docs/src/scripts/smoke-*.ts` | Scripts CLI standalone pour vérifier les 2 outils sans Gemini. |
| `docs/01-04-*.md` | Doc pédagogique linéaire (prérequis → install → usage → fork). |
| `docs/internal/verification-notes.md` | Synthèse Tâche 0 — référence pour les tâches suivantes. |
| `content/{concepts,labs}/.gitkeep` | Garder les dossiers en git tant qu'ils sont vides. |

---

## Tâche 0 : Vérification des conventions Gemini CLI

**But :** lever les "décisions ouvertes" listées dans la Section 8 de la spec **avant** d'écrire du code qui pourrait être faux.

**Files:**
- Create: `docs/internal/verification-notes.md`

- [ ] **Step 0.1 : Vérifier le schéma du manifeste `gemini-extension.json`**

Source à consulter (priorité GitHub officiel) :
- `https://github.com/google-gemini/gemini-cli` (README + `docs/` du repo)
- Recherche : "gemini-extension.json schema" et "extension manifest"

Utilise WebFetch sur `https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/extensions.md` (et fallback : recherche dans le repo via WebFetch sur la page GitHub).

À documenter dans les notes :
- Champs obligatoires (`name`, `version` ?), optionnels (`description`, `mcpServers`, `contextFileName`, `commands`, …).
- Variable d'interpolation pour le chemin de l'extension : `${extensionPath}` ? `$EXTENSION_DIR` ? Autre ?
- Exemple de bloc `mcpServers` valide.

- [ ] **Step 0.2 : Vérifier le format des slash commands TOML**

Source : doc officielle Gemini CLI (cf. même repo, `docs/cli/commands.md` ou équivalent).

À documenter :
- Champs supportés dans le TOML (`prompt`, `description`, `name` ?).
- Comment l'argument utilisateur est interpolé (`{{args}}`, `$ARGUMENTS`, `{args}`, autre).
- Convention de nommage du fichier vs nom du slash (ex. `concept.toml` → `/concept` ?).

- [ ] **Step 0.3 : Vérifier la commande d'installation**

À documenter :
- Syntaxe exacte : `gemini extensions install <url>` ou `gemini extension add` ou autre.
- Support de l'install depuis un git repo distant vs un path local.
- Comment lister/désinstaller.

- [ ] **Step 0.4 : Vérifier la version Node minimum requise**

Source : `engines.node` dans le `package.json` du repo `google-gemini/gemini-cli`.

- [ ] **Step 0.5 : Vérifier l'URL canonique de la doc Gemini Code Assist**

Source : Google Cloud / Google for Developers. WebFetch sur `https://developers.google.com/gemini-code-assist` et noter l'URL réelle après éventuelles redirections.

- [ ] **Step 0.6 : Rédiger les notes de vérification**

Crée `docs/internal/verification-notes.md` avec ce contenu (à remplir avec les valeurs réelles trouvées) :

```markdown
# Notes de vérification — conventions Gemini CLI

**Date :** 2026-05-07
**Version Gemini CLI vérifiée :** <vX.Y.Z>

## Manifeste `gemini-extension.json`

- Champs obligatoires : <list>
- Variable d'interpolation pour le chemin : `<valeur exacte>`
- Exemple validé :

\`\`\`json
<exemple copié de la doc officielle>
\`\`\`

## Slash commands TOML

- Emplacement : `commands/<name>.toml` → `/<name>`
- Champs : <list>
- Interpolation argument : `<syntaxe exacte>`

## Installation

- Commande exacte : `<commande>`
- Depuis URL git : <oui/non + syntaxe>
- Depuis path local : `<commande>`
- Lister : `<commande>`
- Désinstaller : `<commande>`

## Node minimum

- Version : `>= <X>`

## Gemini Code Assist

- URL canonique de la doc : `<url>`

## Divergences avec le plan

(Liste les points où ce plan d'implémentation devra être ajusté car la réalité diffère des hypothèses.)
```

- [ ] **Step 0.7 : Si divergences trouvées, ajuster le plan inline**

Si `${extensionPath}` n'est pas la bonne variable, met à jour les Tâches 8 et 13 avec la vraie syntaxe. Si `{{args}}` n'est pas le bon placeholder, met à jour Tâches 10 et 11. Si la commande d'install diffère, met à jour Tâche 13. Note chaque ajustement dans la section "Divergences" des notes.

- [ ] **Step 0.8 : Commit**

```bash
git add docs/internal/verification-notes.md
git commit -m "docs(internal): notes de vérification des conventions Gemini CLI"
```

---

## Tâche 1 : Init du repo (gitignore + dossiers vides)

**Files:**
- Create: `.gitignore`
- Create: `content/concepts/.gitkeep`
- Create: `content/labs/.gitkeep`

- [ ] **Step 1.1 : Créer `.gitignore`**

Contenu :

```gitignore
node_modules/
dist/
*.log
.DS_Store
.env
.env.local
```

- [ ] **Step 1.2 : Créer les dossiers `content/`**

```bash
mkdir -p content/concepts content/labs
touch content/concepts/.gitkeep content/labs/.gitkeep
```

- [ ] **Step 1.3 : Vérifier la structure**

```bash
ls -la content/concepts content/labs
```

Sortie attendue : un fichier `.gitkeep` dans chaque dossier.

- [ ] **Step 1.4 : Commit**

```bash
git add .gitignore content/
git commit -m "chore: gitignore + dossiers content/{concepts,labs}"
```

---

## Tâche 2 : Scaffold du MCP `gemini-docs`

**But :** monter un projet TypeScript minimal qui démarre un serveur MCP stdio sans outils encore exposés.

**Files:**
- Create: `mcp-servers/gemini-docs/package.json`
- Create: `mcp-servers/gemini-docs/tsconfig.json`
- Create: `mcp-servers/gemini-docs/src/index.ts`

- [ ] **Step 2.1 : Créer `mcp-servers/gemini-docs/package.json`**

```json
{
  "name": "@anto-agent-gemini/mcp-gemini-docs",
  "version": "0.1.0",
  "private": true,
  "description": "MCP server qui interroge la doc officielle Gemini (CLI, Code Assist, MCP).",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "smoke:search": "node dist/scripts/smoke-search.js",
    "smoke:read": "node dist/scripts/smoke-read.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "turndown": "^7.2.0",
    "undici": "^6.21.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/turndown": "^5.0.4",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 2.2 : Créer `mcp-servers/gemini-docs/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2.3 : Créer un `src/index.ts` minimal qui boot un serveur vide**

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "gemini-docs", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2.4 : Installer les dépendances**

```bash
cd mcp-servers/gemini-docs
npm install
```

Sortie attendue : `node_modules/` créé, `package-lock.json` créé, pas d'erreur.

- [ ] **Step 2.5 : Vérifier que ça compile**

```bash
cd mcp-servers/gemini-docs
npm run build
```

Sortie attendue : `dist/index.js` existe, pas d'erreur TypeScript.

- [ ] **Step 2.6 : Vérifier que le serveur boot et répond `tools/list`**

Test rapide en pipant une requête JSON-RPC stdio :

```bash
cd mcp-servers/gemini-docs
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

Sortie attendue : une ligne JSON contenant `"tools":[]`.

> Si le serveur n'écrit rien, c'est qu'il attend des messages encadrés par le framing MCP. Dans ce cas, lance `node dist/index.js` et tape `Ctrl-C` après 1s — pas d'erreur = serveur OK. La vraie vérif sera via la Tâche 6.

- [ ] **Step 2.7 : Commit**

```bash
git add mcp-servers/gemini-docs/package.json mcp-servers/gemini-docs/tsconfig.json mcp-servers/gemini-docs/src/index.ts mcp-servers/gemini-docs/package-lock.json
git commit -m "feat(mcp): scaffold MCP gemini-docs (stdio server vide)"
```

---

## Tâche 3 : Implémenter `read_gemini_doc_page` (avec cache)

**Files:**
- Create: `mcp-servers/gemini-docs/src/fetch-page.ts`
- Modify: `mcp-servers/gemini-docs/src/index.ts`

- [ ] **Step 3.1 : Créer `src/fetch-page.ts`**

```typescript
import { request } from "undici";
import TurndownService from "turndown";

interface DocPage {
  url: string;
  title: string;
  content: string;
}

const cache = new Map<string, { result: DocPage; expiresAt: number }>();
const TTL_MS = 60 * 60 * 1000; // 1 heure

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export async function readGeminiDocPage(url: string): Promise<DocPage> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const response = await request(url, {
    headers: { "User-Agent": "anto-agent-gemini-mcp/0.1" },
  });

  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} pour ${url}`);
  }

  const body = await response.body.text();
  const contentType = String(response.headers["content-type"] ?? "");

  let title = url;
  let content = body;

  if (contentType.includes("text/html")) {
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    content = turndown.turndown(body);
  } else {
    // Markdown ou texte brut : tente d'extraire le premier H1
    const firstHeading = body
      .split("\n")
      .find((line) => line.startsWith("# "));
    if (firstHeading) {
      title = firstHeading.replace(/^#\s+/, "").trim();
    }
  }

  const result: DocPage = { url, title, content };
  cache.set(url, { result, expiresAt: Date.now() + TTL_MS });
  return result;
}
```

- [ ] **Step 3.2 : Câbler l'outil dans `src/index.ts`**

Remplace tout le contenu de `src/index.ts` par :

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readGeminiDocPage } from "./fetch-page.js";

const server = new Server(
  { name: "gemini-docs", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_gemini_doc_page",
      description:
        "Récupère le contenu (markdown) d'une page de doc officielle Gemini ou MCP. Utilise une URL retournée par search_gemini_docs.",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL absolue de la page à lire.",
          },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_gemini_doc_page") {
    const page = await readGeminiDocPage(args?.url as string);
    return {
      content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
    };
  }

  throw new Error(`Outil inconnu: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 3.3 : Vérifier que ça compile**

```bash
cd mcp-servers/gemini-docs
npm run build
```

Sortie attendue : pas d'erreur TS, `dist/fetch-page.js` et `dist/index.js` existent.

- [ ] **Step 3.4 : Commit**

```bash
git add mcp-servers/gemini-docs/src/fetch-page.ts mcp-servers/gemini-docs/src/index.ts
git commit -m "feat(mcp): outil read_gemini_doc_page avec cache TTL 1h"
```

---

## Tâche 4 : Implémenter `search_gemini_docs`

**Files:**
- Create: `mcp-servers/gemini-docs/src/search-docs.ts`
- Modify: `mcp-servers/gemini-docs/src/index.ts`

- [ ] **Step 4.1 : Créer `src/search-docs.ts`**

```typescript
import { request } from "undici";

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

const GITHUB_REPO = "google-gemini/gemini-cli";
const GITHUB_API = "https://api.github.com";

// Pages curées en dur — sources hors GitHub. À enrichir au fil du temps.
const KNOWN_PAGES: Array<{ title: string; url: string; tags: string[] }> = [
  {
    title: "Gemini Code Assist — Aperçu",
    url: "https://docs.cloud.google.com/gemini/docs/codeassist/overview",
    tags: ["code assist", "vscode", "ide"],
  },
  {
    title: "Model Context Protocol — Spécification",
    url: "https://modelcontextprotocol.io/specification",
    tags: ["mcp", "protocol", "tools"],
  },
  {
    title: "MCP — Server quickstart",
    url: "https://modelcontextprotocol.io/quickstart/server",
    tags: ["mcp", "server", "typescript"],
  },
];

export async function searchGeminiDocs(
  query: string,
  limit: number = 5,
): Promise<SearchHit[]> {
  const queryLower = query.toLowerCase();

  // 1. GitHub Code Search sur le repo officiel.
  const githubHits = await searchGitHub(query, limit);

  // 2. Pages curées : matching simple (titre OU tag contient la query).
  const curatedHits: SearchHit[] = KNOWN_PAGES.filter(
    (p) =>
      p.title.toLowerCase().includes(queryLower) ||
      p.tags.some((t) => t.includes(queryLower)),
  ).map((p) => ({ title: p.title, url: p.url, snippet: "[curated]" }));

  return [...githubHits, ...curatedHits].slice(0, limit);
}

async function searchGitHub(
  query: string,
  limit: number,
): Promise<SearchHit[]> {
  const q = `${query} repo:${GITHUB_REPO} path:docs extension:md`;
  const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(q)}&per_page=${limit}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "anto-agent-gemini-mcp/0.1",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await request(url, { headers });

  if (response.statusCode === 403) {
    throw new Error(
      "Rate-limit GitHub atteint. Définis la variable d'env GITHUB_TOKEN pour relever la limite.",
    );
  }
  if (response.statusCode !== 200) {
    throw new Error(`HTTP ${response.statusCode} sur GitHub Search.`);
  }

  const data = (await response.body.json()) as {
    items?: Array<{
      path: string;
      html_url: string;
      repository: { full_name: string };
    }>;
  };

  return (data.items ?? []).map((item) => ({
    title: item.path,
    // html_url pointe vers la vue blob ; on le réécrit en raw pour récupérer le markdown direct.
    url: item.html_url.replace(
      "/blob/",
      "/raw/",
    ),
    snippet: `${item.repository.full_name}/${item.path}`,
  }));
}
```

- [ ] **Step 4.2 : Câbler le second outil dans `src/index.ts`**

Remplace `src/index.ts` par :

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readGeminiDocPage } from "./fetch-page.js";
import { searchGeminiDocs } from "./search-docs.js";

const server = new Server(
  { name: "gemini-docs", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_gemini_docs",
      description:
        "Recherche dans la doc officielle Gemini (CLI sur GitHub, Code Assist, spec MCP). Retourne une liste {title, url, snippet}.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Mots-clés de recherche." },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5).",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "read_gemini_doc_page",
      description:
        "Récupère le contenu (markdown) d'une page de doc officielle Gemini ou MCP. Utilise une URL retournée par search_gemini_docs.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL absolue de la page." },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_gemini_docs") {
    const results = await searchGeminiDocs(
      args?.query as string,
      (args?.limit as number) ?? 5,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }

  if (name === "read_gemini_doc_page") {
    const page = await readGeminiDocPage(args?.url as string);
    return {
      content: [{ type: "text", text: JSON.stringify(page, null, 2) }],
    };
  }

  throw new Error(`Outil inconnu: ${name}`);
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 4.3 : Vérifier que ça compile**

```bash
cd mcp-servers/gemini-docs
npm run build
```

Sortie attendue : pas d'erreur TS.

- [ ] **Step 4.4 : Commit**

```bash
git add mcp-servers/gemini-docs/src/search-docs.ts mcp-servers/gemini-docs/src/index.ts
git commit -m "feat(mcp): outil search_gemini_docs (GitHub Code Search + pages curées)"
```

---

## Tâche 5 : Scripts smoke + vérification standalone

**But :** vérifier que les 2 outils MCP fonctionnent **sans avoir à passer par Gemini CLI**.

**Files:**
- Create: `mcp-servers/gemini-docs/src/scripts/smoke-search.ts`
- Create: `mcp-servers/gemini-docs/src/scripts/smoke-read.ts`

- [ ] **Step 5.1 : Créer `src/scripts/smoke-search.ts`**

```typescript
import { searchGeminiDocs } from "../search-docs.js";

const query = process.argv[2] ?? "extensions";
const limit = process.argv[3] ? Number(process.argv[3]) : 5;

const results = await searchGeminiDocs(query, limit);
console.log(JSON.stringify(results, null, 2));

if (results.length === 0) {
  console.error(`[smoke-search] aucun résultat pour "${query}"`);
  process.exit(1);
}
```

- [ ] **Step 5.2 : Créer `src/scripts/smoke-read.ts`**

```typescript
import { readGeminiDocPage } from "../fetch-page.js";

const url =
  process.argv[2] ??
  "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md";

const page = await readGeminiDocPage(url);
console.log(`URL    : ${page.url}`);
console.log(`Title  : ${page.title}`);
console.log(`Length : ${page.content.length} chars`);
console.log(`--- Aperçu (500 premiers chars) ---`);
console.log(page.content.slice(0, 500));
```

- [ ] **Step 5.3 : Build + lancer le smoke search**

```bash
cd mcp-servers/gemini-docs
npm run build
npm run smoke:search -- extensions
```

Sortie attendue : un tableau JSON non vide avec au moins une entrée pointant vers `github.com/google-gemini/gemini-cli`.

> Si rate-limit GitHub : retry après quelques minutes, ou exporte `GITHUB_TOKEN` (token GitHub personnel sans scope spécial requis pour la search publique).

- [ ] **Step 5.4 : Lancer le smoke read**

```bash
cd mcp-servers/gemini-docs
npm run smoke:read
```

Sortie attendue : `Title : ...`, `Length : <quelques milliers> chars`, et un aperçu markdown du README de gemini-cli.

- [ ] **Step 5.5 : Tester le cas d'erreur (URL 404)**

```bash
cd mcp-servers/gemini-docs
npm run smoke:read -- https://raw.githubusercontent.com/google-gemini/gemini-cli/main/DOES-NOT-EXIST.md
```

Sortie attendue : exit non-zero + message `HTTP 404 pour ...`.

- [ ] **Step 5.6 : Commit**

```bash
git add mcp-servers/gemini-docs/src/scripts/
git commit -m "feat(mcp): scripts smoke standalone pour search + read"
```

---

## Tâche 6 : README du MCP

**Files:**
- Create: `mcp-servers/gemini-docs/README.md`

- [ ] **Step 6.1 : Rédiger le README**

Contenu :

````markdown
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
```

## Variables d'env

- `GITHUB_TOKEN` (optionnel) : token GitHub personnel pour augmenter la limite de la GitHub Search API publique (60 req/h sans token, 5000 req/h avec).

## Sources interrogées

1. **GitHub Code Search** sur `google-gemini/gemini-cli` (filtre `path:docs extension:md`).
2. **Pages curées** (en dur dans `src/search-docs.ts`) :
   - Doc Gemini Code Assist
   - Spec et quickstart MCP

Pour ajouter une source, édite `KNOWN_PAGES` dans `src/search-docs.ts`.

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

> Si la variable `${extensionPath}` n'est pas la bonne (cf. `docs/internal/verification-notes.md`), remplace-la par la valeur correcte.
````

- [ ] **Step 6.2 : Commit**

```bash
git add mcp-servers/gemini-docs/README.md
git commit -m "docs(mcp): README de gemini-docs"
```

---

## Tâche 7 : Manifeste `gemini-extension.json`

**But :** déclarer l'extension à la racine du repo. **Vérifie d'abord** dans `docs/internal/verification-notes.md` que le schéma ci-dessous correspond à la doc officielle.

**Files:**
- Create: `gemini-extension.json`

- [ ] **Step 7.1 : Créer le manifeste**

```json
{
  "name": "anto-agent-gemini",
  "version": "0.1.0",
  "description": "Assistant d'enablement Gemini : produit fiches concepts et labs guidés en français.",
  "mcpServers": {
    "gemini-docs": {
      "command": "node",
      "args": ["${extensionPath}/mcp-servers/gemini-docs/dist/index.js"]
    }
  }
}
```

> Si la Tâche 0 a montré que `${extensionPath}` n'est pas la bonne variable (par ex. c'est `${extensionDir}` ou un path relatif), corrige ici **et** dans `mcp-servers/gemini-docs/README.md` Step 6.1.

- [ ] **Step 7.2 : Valider le JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('gemini-extension.json','utf8')); console.log('OK')"
```

Sortie attendue : `OK`.

- [ ] **Step 7.3 : Commit**

```bash
git add gemini-extension.json
git commit -m "feat: manifeste gemini-extension.json (déclare le MCP gemini-docs)"
```

---

## Tâche 8 : `GEMINI.md` (persona de l'agent)

**Files:**
- Create: `GEMINI.md`

- [ ] **Step 8.1 : Rédiger `GEMINI.md`**

Contenu :

```markdown
# Agent — Assistant d'enablement Gemini

Tu es un assistant d'enablement Gemini francophone, expert de Gemini CLI, Gemini Code Assist (extension VS Code), et du Model Context Protocol (MCP).

## Audience cible

Devs (junior à confirmé) qui découvrent Gemini et veulent comprendre comment l'utiliser dans leur quotidien.

## Langue

Français pour tout texte produit. Garde en anglais : identifiants techniques, noms de commandes, mots-clés JSON/TOML, blocs de code.

## Style pédagogique

- Ton clair, direct, sans jargon non expliqué.
- Toujours un exemple concret avant la théorie.
- Cite explicitement la doc officielle (URLs récupérées via le MCP `gemini-docs`).

## Sources de vérité

Tu disposes du serveur MCP `gemini-docs` qui expose :

- `search_gemini_docs(query, limit?)` — cherche dans la doc officielle.
- `read_gemini_doc_page(url)` — lit une page renvoyée par la recherche.

**Règle d'or : ne jamais inventer de syntaxe Gemini.** Si un point n'est pas trouvé via le MCP, signale-le explicitement à l'utilisateur plutôt que de bluffer.

## Formats imposés

Quand tu produis un concept ou un lab via les skills `/concept` ou `/lab`, tu **dois** suivre les templates définis dans le prompt du skill.

- Sections fixes (cf. prompt du skill).
- Frontmatter YAML.
- Nommage de fichier : `YYYY-MM-DD-<slug>.md` dans `content/concepts/` ou `content/labs/`.
- Si un fichier existe déjà à ce chemin pour la même journée, ajoute un suffixe `-2`, `-3`, etc.

## Comportement de clarification

Si la feature demandée est ambiguë, pose une question avant de produire l'artefact.

Exemple : `/concept extensions` → "Tu vises le manifeste, le mécanisme d'install, ou les deux ?"

## Hors-périmètre

- Pas d'avis sur des produits non Gemini (sauf comparaison brève si pertinente).
- Pas de code business ; ta sortie est de la doc pédagogique.
```

- [ ] **Step 8.2 : Commit**

```bash
git add GEMINI.md
git commit -m "feat: persona de l'agent (GEMINI.md)"
```

---

## Tâche 9 : Skill `/concept`

**Files:**
- Create: `commands/concept.toml`

- [ ] **Step 9.1 : Vérifier le format TOML attendu**

Ouvre `docs/internal/verification-notes.md` (Tâche 0) et confirme :
- Le placeholder de l'argument est bien `{{args}}` (sinon adapte le bloc ci-dessous).
- Les champs `description` et `prompt` sont supportés.
- Le mapping fichier→commande est bien `concept.toml` → `/concept`.

- [ ] **Step 9.2 : Créer `commands/concept.toml`**

````toml
description = "Génère une fiche concept markdown sur une feature Gemini, dans content/concepts/."

prompt = """
Tu es l'assistant d'enablement (cf. GEMINI.md).
Crée une fiche concept en français sur la feature : {{args}}.

ÉTAPES OBLIGATOIRES (dans cet ordre) :

1. Appelle l'outil MCP `search_gemini_docs` avec la query dérivée de "{{args}}" pour identifier les pages de doc officielle pertinentes.
2. Pour chaque URL retenue (max 3), appelle `read_gemini_doc_page(url)`.
3. Si la recherche ne renvoie rien d'utile, demande à l'utilisateur s'il a une URL spécifique en tête, ou confirme que la feature existe vraiment dans Gemini. Ne bluffe pas.
4. Détermine un slug en kebab-case dérivé de "{{args}}" (ex. "extensions" → "extensions", "manifeste extension" → "manifeste-extension").
5. Construis le chemin cible : `content/concepts/<YYYY-MM-DD>-<slug>.md` (date du jour). Si ce fichier existe déjà, ajoute le suffixe `-2`, `-3`, etc.
6. Rédige la fiche en SUIVANT EXACTEMENT le template ci-dessous (sections obligatoires, frontmatter YAML).
7. Affiche un résumé court (3 lignes max) puis le chemin du fichier produit.

TEMPLATE OBLIGATOIRE (ne pas dévier) :

---
title: "<Titre court de la feature, en français>"
feature: "{{args}}"
date: <YYYY-MM-DD>
sources:
  - <URL 1 de la doc officielle>
  - <URL 2>
---

# <Titre>

## TL;DR

2-3 lignes maximum. Punchline.

## À quoi ça sert

Cas d'usage concret, formulé du point de vue du dev. Pourquoi cette feature existe, quel problème elle résout.

## Comment ça marche

Mécanique sous le capot. Si pertinent : un mini-schéma ASCII ou un tableau.

## Exemple minimal

```<lang>
<code minimal qui montre la feature en action>
```

## Pièges courants

- Piège 1 : <description courte>
- Piège 2 : ...
- (3 à 5 points, pas plus)

## Pour aller plus loin

- [<Titre du lien>](<URL doc officielle>)
- [<Titre du lien>](<URL>)

---

CONTRAINTES :
- Tout en français sauf identifiants techniques, commandes shell, mots-clés JSON/TOML.
- Liens uniquement vers la doc officielle (via les URLs retournées par le MCP).
- Si une info manque dans la doc, dis-le ("la doc ne précise pas X") plutôt que d'inventer.
"""
````

- [ ] **Step 9.3 : Vérifier la syntaxe TOML**

```bash
node -e "const fs=require('fs'); const toml=fs.readFileSync('commands/concept.toml','utf8'); console.log(toml.length, 'chars'); if(!toml.includes('description') || !toml.includes('prompt')) {console.error('FAIL: champs manquants'); process.exit(1);} console.log('OK')"
```

Sortie attendue : un nombre de chars + `OK`.

- [ ] **Step 9.4 : Commit**

```bash
git add commands/concept.toml
git commit -m "feat(skill): /concept — génère une fiche concept markdown"
```

---

## Tâche 10 : Skill `/lab`

**Files:**
- Create: `commands/lab.toml`

- [ ] **Step 10.1 : Créer `commands/lab.toml`**

````toml
description = "Génère un lab guidé markdown sur une feature Gemini, dans content/labs/."

prompt = """
Tu es l'assistant d'enablement (cf. GEMINI.md).
Crée un lab guidé en français sur la feature : {{args}}.

ÉTAPES OBLIGATOIRES (dans cet ordre) :

1. Appelle `search_gemini_docs` avec la query dérivée de "{{args}}".
2. Pour chaque URL retenue (max 3), appelle `read_gemini_doc_page(url)`.
3. Si rien de pertinent : demande clarification ou signale que la feature n'est pas documentée.
4. Détermine un slug en kebab-case dérivé de "{{args}}".
5. Construis le chemin cible : `content/labs/<YYYY-MM-DD>-<slug>.md`. Si déjà pris, suffixe `-2`, `-3`, etc.
6. Rédige le lab en SUIVANT EXACTEMENT le template ci-dessous.
7. Affiche un résumé (3 lignes) + chemin du fichier produit.

TEMPLATE OBLIGATOIRE :

---
title: "<Titre du lab, en français>"
feature: "{{args}}"
date: <YYYY-MM-DD>
duree_estimee: "<X> min"
niveau: "<débutant | intermédiaire>"
prerequis:
  - <prérequis 1>
  - <prérequis 2>
---

# <Titre du lab>

## Objectifs

À l'issue de ce lab, tu sauras :

- <objectif 1>
- <objectif 2>
- <objectif 3 — 3 max>

## Prérequis

- **Poste :** <ex. Gemini CLI installé, Node 20+>
- **Connaissances :** <ex. avoir lu la fiche concept "extensions">

## Étape 1 — <intitulé>

<Action à faire, en 1-2 phrases.>

```bash
<commande à taper>
```

**Résultat attendu :** <ce que l'utilisateur doit voir>.

## Étape 2 — <intitulé>

<...>

## Étape N — <intitulé>

<...>

## Validation finale

<Comment être sûr que tout a marché : commande de check, fichier attendu, sortie type, etc.>

## Pour aller plus loin

- **Variante :** <suggestion 1>
- **Défi bonus :** <suggestion 2>

---

CONTRAINTES :
- Tout en français sauf code/commandes.
- Étapes numérotées et atomiques (1 action par étape).
- Toujours indiquer le résultat attendu sous chaque commande critique.
- Liens uniquement vers la doc officielle (via le MCP).
- Pas de bluff : si la doc ne précise pas une étape, demande clarification ou signale-le dans le lab.
"""
````

- [ ] **Step 10.2 : Vérifier la syntaxe**

```bash
node -e "const fs=require('fs'); const toml=fs.readFileSync('commands/lab.toml','utf8'); if(!toml.includes('description') || !toml.includes('prompt')) {console.error('FAIL'); process.exit(1);} console.log('OK')"
```

Sortie attendue : `OK`.

- [ ] **Step 10.3 : Commit**

```bash
git add commands/lab.toml
git commit -m "feat(skill): /lab — génère un lab guidé markdown"
```

---

## Tâche 11 : Doc `01-prerequis.md`

**Files:**
- Create: `docs/01-prerequis.md`

- [ ] **Step 11.1 : Récupérer la version Gemini CLI testée**

```bash
gemini --version 2>/dev/null || echo "non installé localement — utiliser la dernière version du marketplace npm au moment de la rédaction"
```

Note la sortie pour l'inclure dans le `Testé avec gemini-cli x.y.z`.

- [ ] **Step 11.2 : Récupérer la version Node minimum**

Ouvre `docs/internal/verification-notes.md` et copie la valeur trouvée à la Step 0.4.

- [ ] **Step 11.3 : Rédiger le fichier**

```markdown
# 01 — Prérequis poste

> Testé avec **gemini-cli `<vX.Y.Z>`** et **Node `<vX.Y.Z>`**.
> Si tu utilises une version plus récente, la plupart des commandes restent valides — adapte si besoin.

Cette page liste **tout ce qu'il faut installer sur ton poste** avant de pouvoir installer et utiliser l'extension `anto-agent-gemini`.

## 1. Node.js

L'extension embarque un serveur MCP en TypeScript qui tourne sur Node.

- **Version minimum :** `>= <X>` (cf. `engines.node` du repo `google-gemini/gemini-cli`).
- **Installation :** [nodejs.org](https://nodejs.org/) ou via `nvm`.
- **Vérification :**

```bash
node --version
```

Sortie attendue : un numéro `vX.Y.Z` >= la version requise.

## 2. Gemini CLI

- **Installation :**

```bash
npm install -g @google/gemini-cli
```

> ⚠️ Le nom exact du package npm est à confirmer avec [github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli).

- **Vérification :**

```bash
gemini --version
```

Sortie attendue : `gemini X.Y.Z`.

## 3. Authentification Gemini

Deux options selon ton contexte :

- **Compte Google personnel** (gratuit avec quotas) :

```bash
gemini auth login
```

- **Clé API** (recommandé en pro / CI) :

```bash
export GEMINI_API_KEY="ta-clé-ici"
```

Tu peux la mettre dans ton `~/.bashrc` ou `~/.config/fish/config.fish` pour la rendre permanente.

- **Vérification :**

```bash
gemini "dis bonjour"
```

Sortie attendue : une réponse en langage naturel. Si erreur d'auth, refais l'étape précédente.

## 4. (Optionnel) Gemini Code Assist dans VS Code

Si tu veux l'expérience IDE en plus du CLI :

- Ouvre VS Code → Extensions → cherche **"Gemini Code Assist"** (éditeur Google).
- Installe et connecte-toi avec le même compte.
- L'extension supporte les MCP servers — la doc officielle est sur **`<URL canonique trouvée à la Step 0.5>`**.

## 5. Git

Indispensable pour cloner ce repo (ou installer l'extension depuis git).

```bash
git --version
```

Sortie attendue : `git version X.Y.Z`.

## 6. Smoke test final

Lance :

```bash
gemini --help
```

Sortie attendue : la liste des sous-commandes (`extensions`, `auth`, `mcp`, etc.). Si tu vois ça, ton poste est prêt — passe à `02-installation-extension.md`.

## Troubleshooting express

- **`gemini: command not found`** → vérifie que `$(npm prefix -g)/bin` est dans ton `PATH`, ou réinstalle avec un préfixe utilisateur.
- **Erreur d'auth** → `gemini auth status` te dit ce qui manque.
- **Quotas dépassés** → passe en clé API (étape 3, option 2).
```

- [ ] **Step 11.4 : Remplacer les placeholders du fichier**

Le contenu rédigé contient des `<vX.Y.Z>`, `<X>`, et `<URL ...>` à remplacer par les vraies valeurs récupérées aux Steps 11.1, 11.2 et 0.5.

Vérification :

```bash
grep -n '<v\?X\|<URL' docs/01-prerequis.md
```

Sortie attendue : aucune ligne (ou seulement les exemples explicites comme `vX.Y.Z` dans des phrases descriptives, à juger au cas par cas). Tout placeholder de variable doit être remplacé avant commit.

- [ ] **Step 11.5 : Commit**

```bash
git add docs/01-prerequis.md
git commit -m "docs: 01-prerequis (installation poste — Node, Gemini CLI, auth, git)"
```

---

## Tâche 12 : Doc `02-installation-extension.md`

**Files:**
- Create: `docs/02-installation-extension.md`

- [ ] **Step 12.1 : Reprendre la commande exacte d'install**

Ouvre `docs/internal/verification-notes.md` et copie la commande validée à la Step 0.3.

- [ ] **Step 12.2 : Rédiger le fichier**

````markdown
# 02 — Installation de l'extension

> Prérequis : avoir suivi `01-prerequis.md`.
> Testé avec **gemini-cli `<vX.Y.Z>`**.

Deux méthodes selon que tu veux **utiliser** ou **modifier** l'extension.

## Méthode 1 — Depuis le repo GitHub (utilisation simple)

```bash
gemini extensions install https://github.com/antoninBr/anto-agent-gemini
```

> La syntaxe exacte (`install` vs `add`, support direct d'une URL git) est validée dans `docs/internal/verification-notes.md`.

Sortie attendue : un message de succès + l'extension apparaît dans la liste (cf. ci-dessous).

## Méthode 2 — Depuis un clone local (dev / contribution)

```bash
git clone https://github.com/antoninBr/anto-agent-gemini.git
cd anto-agent-gemini
gemini extensions link .
```

L'avantage : `link` crée un lien symbolique vers le dossier local, donc tu peux modifier les fichiers et les changements sont pris en compte au prochain `gemini` sans réinstaller.

## Étape critique : compiler le MCP

L'extension embarque un serveur MCP TypeScript. **Il faut le compiler** une première fois sinon l'agent ne pourra pas appeler ses outils.

```bash
cd mcp-servers/gemini-docs
npm install
npm run build
```

Sortie attendue : pas d'erreur, et `mcp-servers/gemini-docs/dist/index.js` existe.

> Si tu modifies le code TypeScript du MCP, relance `npm run build` pour que les changements soient appliqués.

## Vérification

```bash
gemini extensions list
```

Sortie attendue : une ligne `anto-agent-gemini` avec statut actif.

```bash
gemini
```

Puis dans le prompt :

```
/help
```

Sortie attendue : la liste des commandes inclut `/concept` et `/lab`.

## Désinstallation

```bash
gemini extensions uninstall anto-agent-gemini
```

> Confirme la commande exacte dans `docs/internal/verification-notes.md`.

## Mise à jour

Si tu as installé via la méthode 1 (URL git), utilise la sous-commande `update` pour récupérer la dernière version :

```bash
gemini extensions update anto-agent-gemini
# ou pour tout mettre à jour
gemini extensions update --all
```

Si tu as installé via la méthode 2 (clone local liée par `link`), un simple `git pull` suffit (le lien symbolique pointe déjà vers ton clone) :

```bash
cd anto-agent-gemini
git pull
cd mcp-servers/gemini-docs && npm install && npm run build
```

## Troubleshooting

| Symptôme | Solution |
|---|---|
| `/concept` n'apparaît pas dans `/help` | Vérifie `gemini extensions list` ; relance `gemini` ; vérifie que `commands/concept.toml` est bien dans l'extension installée. |
| `Outil gemini-docs indisponible` | Tu as oublié `npm run build` du MCP. |
| Erreur `Cannot find module 'dist/index.js'` | Idem — build manquant. |
| Rate-limit GitHub à l'usage | Exporte `GITHUB_TOKEN=<ton-token>` (cf. `mcp-servers/gemini-docs/README.md`). |
````

- [ ] **Step 12.3 : Remplacer les placeholders du fichier**

Le fichier contient `<vX.Y.Z>` à remplacer par la valeur récupérée à la Step 11.1.

```bash
grep -n '<v\?X' docs/02-installation-extension.md
```

Sortie attendue : aucune ligne après remplacement (sauf exemples textuels intentionnels).

- [ ] **Step 12.4 : Commit**

```bash
git add docs/02-installation-extension.md
git commit -m "docs: 02-installation-extension (deux méthodes + build MCP)"
```

---

## Tâche 13 : Doc `03-utilisation.md`

**Files:**
- Create: `docs/03-utilisation.md`

- [ ] **Step 13.1 : Rédiger le fichier**

````markdown
# 03 — Utilisation au quotidien

> Prérequis : `02-installation-extension.md` complétée.

## Démarrer une session

Depuis n'importe quel répertoire :

```bash
gemini
```

Tu obtiens un prompt interactif. L'extension `anto-agent-gemini` est chargée automatiquement (la persona, les skills, et le MCP).

## Vérifier que les skills sont là

```
/help
```

Tu dois voir `/concept` et `/lab` dans la liste.

## Skill `/concept` — fiche concept

```
/concept extensions
```

Ce qui se passe :

1. L'agent appelle le MCP `gemini-docs` pour chercher des pages sur "extensions".
2. Il lit les pages pertinentes.
3. Il rédige une fiche markdown selon le template imposé.
4. Il écrit le fichier dans `content/concepts/<aujourd'hui>-extensions.md`.
5. Il affiche un résumé court + le chemin.

**Exemple de sortie attendue (extrait) :**

```
J'ai consulté 3 pages de la doc officielle (gemini-cli docs/extensions.md, …).
La fiche couvre : manifeste, installation, déclaration des outils.

Fichier produit : content/concepts/2026-05-07-extensions.md
```

Tu peux ensuite ouvrir le fichier, relire, ajuster, et `git commit` quand tu es content.

## Skill `/lab` — lab guidé

```
/lab "premier MCP"
```

Même flow, sauf que le template produit un lab pas-à-pas avec étapes numérotées et résultats attendus.

## Inspecter le MCP

Si tu veux voir ce que l'agent voit :

```bash
cd mcp-servers/gemini-docs
npm run smoke:search -- "extensions"
```

Tu obtiens directement la sortie JSON de `search_gemini_docs`.

Pour lister les MCPs vus par Gemini CLI :

```bash
gemini mcp list
```

> Confirme la commande exacte dans `docs/internal/verification-notes.md`.

## Cas d'erreur courants

| Symptôme | Cause probable | Fix |
|---|---|---|
| L'agent dit "le MCP gemini-docs n'est pas disponible" | Build manquant ou path incorrect dans le manifeste | `cd mcp-servers/gemini-docs && npm run build` ; vérifier la variable `${extensionPath}` du manifeste |
| L'agent invente une syntaxe au lieu d'aller chercher la doc | La règle `GEMINI.md` n'a pas été chargée | Vérifie que le fichier `GEMINI.md` est bien à la racine de l'extension |
| `Rate-limit GitHub` dans la sortie d'un skill | Trop de recherches sans token | Exporte `GITHUB_TOKEN` (cf. `mcp-servers/gemini-docs/README.md`) |
| Le slash `/concept` produit du markdown qui ne respecte pas le template | Le prompt du skill a été modifié ou tronqué | Diff `commands/concept.toml` avec la version git |

## Tip — boucle de feedback

Quand un artefact produit n'est pas idéal, **édite le prompt du skill** dans `commands/<skill>.toml` (sections "ÉTAPES OBLIGATOIRES" ou "TEMPLATE OBLIGATOIRE"), puis relance `/concept` ou `/lab`. Pas besoin de recompiler quoi que ce soit pour les skills (ce sont juste des prompts).

Pour modifier le **comportement global** de l'agent (ton, langue, règle "ne bluffe pas"), édite `GEMINI.md`.

Pour modifier les **outils disponibles** (ajouter une source de doc, changer le cache, etc.), édite `mcp-servers/gemini-docs/src/` puis `npm run build`.
````

- [ ] **Step 13.2 : Commit**

```bash
git add docs/03-utilisation.md
git commit -m "docs: 03-utilisation (démarrer, /concept, /lab, troubleshooting)"
```

---

## Tâche 14 : Doc `04-fork-template.md`

**Files:**
- Create: `docs/04-fork-template.md`

- [ ] **Step 14.1 : Rédiger le fichier**

````markdown
# 04 — Forker ce template pour une autre techno

> Pour qui : tu veux faire de l'enablement sur une **autre techno** (pas Gemini), en réutilisant la même structure.

L'idée : ce repo est un **template réel** d'extension Gemini d'enablement. Pour le réadapter à un autre domaine, suis cette checklist.

## Vue d'ensemble

| Élément | À renommer | À garder | À adapter |
|---|---|---|---|
| `gemini-extension.json` | `name` | structure JSON | `description` |
| `README.md` racine | titre, pitch | structure | contenu |
| `GEMINI.md` | — | structure (sections) | persona, audience, sources, règle "ne bluffe pas" reste |
| `commands/*.toml` | éventuellement | structure du prompt | template de l'artefact, sources interrogées |
| `mcp-servers/<nom>/` | dossier | scaffolding TS, cache, smoke scripts | sources ciblées (constantes en haut de `search-docs.ts`) |
| `docs/01-04-*.md` | — | structure | versions des outils, URLs, troubleshooting |
| `content/` | éventuellement | structure | — |

## Checklist de fork (cible : < 30 min)

### 1. Cloner et renommer

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
  "description": "Assistant d'enablement <techno X> ..."
}
```

### 3. Adapter la persona

Édite `GEMINI.md` :

- Remplace "Gemini CLI / Code Assist / MCP" par la techno X.
- Adapte l'audience cible.
- **Garde** la règle "ne jamais inventer de syntaxe" et la règle de format imposé.

### 4. Adapter les sources du MCP

Édite `mcp-servers/gemini-docs/src/search-docs.ts` :

- Remplace `GITHUB_REPO = "google-gemini/gemini-cli"` par le repo officiel de la techno X (s'il est sur GitHub et a une doc en markdown).
- Adapte `KNOWN_PAGES` (URLs de doc officielle hors GitHub).

Renomme éventuellement le dossier `gemini-docs/` → `<techno-x>-docs/` et adapte les paths dans `gemini-extension.json` et les scripts.

### 5. Adapter les templates des skills

Édite `commands/concept.toml` et `commands/lab.toml` :

- Si la techno X a des conventions différentes (par ex. besoin d'une section "compatibilité versions"), adapte les sections du template.
- Le squelette (ÉTAPES OBLIGATOIRES + TEMPLATE OBLIGATOIRE) reste identique.

### 6. Mettre à jour la doc

- `README.md` racine : nouveau pitch.
- `docs/01-prerequis.md` : versions et outils de la techno X (si différents).
- `docs/02-installation-extension.md` : reste identique en grande partie.
- `docs/03-utilisation.md` : adapter les exemples de slash commands.
- `docs/04-fork-template.md` : tu peux supprimer ce fichier si tu n'as pas vocation à être re-forké.

### 7. Build et test

```bash
cd mcp-servers/<ton-mcp>
npm install
npm run build
npm run smoke:search -- "une-feature-de-X"
```

### 8. Premier commit

```bash
git add .
git commit -m "init: fork de anto-agent-gemini pour <techno X>"
```

## Ce qui est réutilisable tel quel

- L'architecture (1 agent + 2 skills + 1 MCP).
- Le scaffolding TypeScript du MCP (cache, fetch, turndown).
- La structure du prompt des skills (ÉTAPES + TEMPLATE).
- Le parcours doc en 4 fichiers numérotés.
- Le pattern smoke scripts pour vérifier le MCP standalone.

## Ce qui est spécifique à ce repo

- La persona Gemini.
- Les sources `KNOWN_PAGES` (Code Assist, MCP).
- Les exemples dans la doc.

## Prochaine étape

Une fois forké, lance `gemini extensions link .` (cf. `02-installation-extension.md` méthode 2) et teste avec `/concept <feature-de-ta-techno>`.
````

- [ ] **Step 14.2 : Commit**

```bash
git add docs/04-fork-template.md
git commit -m "docs: 04-fork-template (checklist pour réadapter à une autre techno)"
```

---

## Tâche 15 : `README.md` racine

**Files:**
- Create: `README.md`

- [ ] **Step 15.1 : Rédiger le README**

````markdown
# anto-agent-gemini

Extension Gemini d'enablement — un assistant qui aide à produire **fiches concepts** et **labs guidés** en français sur les features de Gemini lui-même.

> Méta : utiliser Gemini pour préparer l'enseignement de Gemini.

## Démarrage rapide

1. [Prérequis poste](docs/01-prerequis.md) — Node, Gemini CLI, auth.
2. [Installation de l'extension](docs/02-installation-extension.md) — install + build du MCP.
3. [Utilisation au quotidien](docs/03-utilisation.md) — `/concept`, `/lab`, troubleshooting.
4. [Forker pour une autre techno](docs/04-fork-template.md) — adapter le template.

## Aperçu en une commande

```bash
gemini
> /concept extensions
```

Sortie attendue : une fiche markdown dans `content/concepts/<date>-extensions.md`, sourcée sur la doc officielle Gemini CLI.

## Structure

| Chemin | Rôle |
|---|---|
| `gemini-extension.json` | Manifeste de l'extension |
| `GEMINI.md` | Persona/contexte de l'agent |
| `commands/` | Skills (slash commands) `/concept` et `/lab` |
| `mcp-servers/gemini-docs/` | Serveur MCP TypeScript qui interroge la doc officielle |
| `docs/` | Documentation pédagogique transférable |
| `content/` | Artefacts produits par l'agent |

## Statut

Projet personnel d'apprentissage et template d'enablement. Le design complet est dans [`docs/superpowers/specs/`](docs/superpowers/specs/) et le plan d'implémentation dans [`docs/superpowers/plans/`](docs/superpowers/plans/).

## Licence

À définir.
````

- [ ] **Step 15.2 : Commit**

```bash
git add README.md
git commit -m "docs: README racine (pitch + parcours doc + structure)"
```

---

## Tâche 16 : Vérification end-to-end

**But :** s'assurer que tout marche ensemble une fois l'extension installée.

- [ ] **Step 16.1 : Compiler le MCP**

```bash
cd mcp-servers/gemini-docs
npm install
npm run build
cd ../..
```

Sortie attendue : pas d'erreur, `mcp-servers/gemini-docs/dist/index.js` existe.

- [ ] **Step 16.2 : Smoke direct du MCP**

```bash
cd mcp-servers/gemini-docs
npm run smoke:search -- "extensions"
npm run smoke:read
cd ../..
```

Attendu : JSON non vide pour search ; markdown non vide pour read.

- [ ] **Step 16.3 : Installer l'extension localement**

```bash
gemini extensions link .
```

Attendu : message de succès. `link` est le mode développeur officiel (lien symbolique vers le dossier courant). Si une commande diffère, cf. `docs/internal/verification-notes.md`.

- [ ] **Step 16.4 : Vérifier dans Gemini**

```bash
gemini
```

Dans le prompt :

```
/help
```

Attendu : `/concept` et `/lab` listés.

- [ ] **Step 16.5 : Lancer `/concept`**

Dans le prompt Gemini :

```
/concept extensions
```

Attendu :
1. L'agent annonce qu'il appelle `search_gemini_docs`.
2. Il liste les URLs trouvées.
3. Il appelle `read_gemini_doc_page` sur 1-3 d'entre elles.
4. Il écrit un fichier dans `content/concepts/`.
5. Il affiche un résumé + le chemin.

Vérifie ensuite hors de Gemini :

```bash
ls -la content/concepts/
```

Attendu : un fichier `2026-05-07-extensions.md` (ou nom proche) qui suit le template.

- [ ] **Step 16.6 : Lancer `/lab`**

Dans Gemini :

```
/lab "premier MCP"
```

Vérifie :

```bash
ls -la content/labs/
```

Attendu : un fichier `2026-05-07-premier-mcp.md` qui respecte le template lab (objectifs, prérequis, étapes numérotées, validation finale).

- [ ] **Step 16.7 : Test du cas dégradé (réseau coupé)**

Coupe ton wifi (ou exporte une IP de proxy invalide) :

```bash
# Linux : forcer un proxy bidon
export HTTPS_PROXY=http://127.0.0.1:1
gemini
```

Dans Gemini :

```
/concept extensions
```

Attendu : l'agent **signale explicitement** que le MCP a échoué (erreur réseau remontée), et **ne produit pas** de fiche bidon. Cohérent avec la règle "ne bluffe pas" du `GEMINI.md`.

Réactive le réseau :

```bash
unset HTTPS_PROXY
```

- [ ] **Step 16.8 : Commiter les artefacts produits par les tests (optionnel)**

Si les fichiers générés à 16.5 et 16.6 sont représentatifs, garde-les comme exemples :

```bash
git add content/concepts/ content/labs/
git commit -m "test: artefacts de référence produits par /concept et /lab"
```

Sinon, supprime-les et laisse `content/` avec juste les `.gitkeep`.

- [ ] **Step 16.9 : Pousser vers GitHub**

```bash
git push -u origin main
```

Attendu : push réussi vers `https://github.com/antoninBr/anto-agent-gemini`.

> Confirme avant de pousser que rien de sensible ne traîne (clés API, tokens) — `git diff origin/main` si la branche existe déjà.

---

## Récapitulatif

| Tâche | Livrable | Vérification |
|---|---|---|
| 0 | Notes de vérification | Lecture humaine |
| 1 | `.gitignore` + `content/` | `ls` |
| 2 | Scaffold MCP (server vide) | `npm run build` |
| 3 | `read_gemini_doc_page` | Build OK |
| 4 | `search_gemini_docs` | Build OK |
| 5 | Smoke scripts | `npm run smoke:*` |
| 6 | README MCP | Lecture humaine |
| 7 | Manifeste racine | JSON valide |
| 8 | `GEMINI.md` | Lecture humaine |
| 9 | Skill `/concept` | TOML valide |
| 10 | Skill `/lab` | TOML valide |
| 11 | `01-prerequis.md` | Lecture humaine |
| 12 | `02-installation-extension.md` | Lecture humaine |
| 13 | `03-utilisation.md` | Lecture humaine |
| 14 | `04-fork-template.md` | Lecture humaine |
| 15 | `README.md` racine | Lecture humaine |
| 16 | Test end-to-end | `/concept` + `/lab` produisent des artefacts conformes |

**Critère de succès global :** depuis un poste vierge (avec juste les prérequis), un dev clone le repo, suit `docs/02-installation-extension.md`, lance `gemini`, tape `/concept extensions`, et obtient une fiche markdown sourcée sur la doc officielle dans `content/concepts/`.
