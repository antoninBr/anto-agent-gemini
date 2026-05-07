# Design — Extension Gemini "anto-agent-gemini"

**Date :** 2026-05-07
**Auteur :** a.brugnot@groupeonepoint.com
**Statut :** Validé (en attente de relecture finale)
**Approche retenue :** Lean (1 agent + 2 skills + 1 MCP)

---

## 1. Contexte et objectif

Une équipe de dev sollicite l'auteur pour les faire monter en compétence sur **Gemini CLI** et **Gemini Code Assist** (extension VS Code). Leur cas d'usage métier n'est pas encore connu, mais ils veulent à terme construire un agent + des skills + des outils (CLI ou MCP).

Ce repo a deux finalités :

1. **Apprentissage par la pratique** : l'auteur construit une vraie extension Gemini utile pour son propre travail (préparation de contenu d'enablement) en exerçant les patterns clés que l'équipe devra maîtriser.
2. **Référence transférable** : la structure du repo et la doc associée serviront de modèle que l'équipe pourra forker une fois leur cas d'usage défini.

**Cas d'usage retenu** : un assistant qui aide à produire des **fiches concepts** et des **labs guidés** sur les features de Gemini lui-même (méta : utiliser Gemini pour préparer l'enseignement de Gemini).

## 2. Périmètre

### Inclus

- 1 agent (persona via `GEMINI.md`)
- 2 skills (slash commands TOML) :
  - `/concept <feature>` — produit une fiche concept en markdown
  - `/lab <feature>` — produit un lab guidé en markdown
- 1 serveur MCP `gemini-docs` (TypeScript) qui expose 2 outils :
  - `search_gemini_docs(query, limit?)`
  - `read_gemini_doc_page(url)`
- Documentation pédagogique en français : prérequis poste, installation de l'extension, utilisation, fork pour une autre techno

### Exclus (volontairement, peuvent être ajoutés plus tard)

- Outil CLI custom (binaire dédié)
- Skill d'indexation/cohérence (`/index`)
- MCP de lecture du corpus produit
- Validation automatique des labs
- Embeddings / recherche sémantique dans le MCP
- Tutorial "comment construire ta propre extension" (la structure du repo elle-même sert d'exemple)

### Non-objectifs

- Ne pas viser un agent généraliste — la persona est focalisée sur l'enablement Gemini.
- Ne pas embarquer la doc Gemini en local (sinon elle se périme) — toujours fetch via le MCP.

## 3. Public cible

- **Utilisateur principal** : l'auteur du repo, francophone, expérimenté tech.
- **Audience des artefacts produits** : devs (junior à confirmé) qui découvrent Gemini.
- **Audience secondaire (fork)** : équipe de dev qui voudra reprendre la structure pour faire de l'enablement sur leur propre techno.

## 4. Architecture

### 4.1 Structure du repo

Le repo **est** l'extension Gemini. Quand `gemini extensions install <url>` est lancé, Gemini lit le manifeste à la racine et charge tout.

```
anto-agent-gemini/
├── README.md                       # Pitch + lien vers docs/
├── gemini-extension.json           # Manifeste de l'extension
├── GEMINI.md                       # Contexte/persona de l'agent
├── commands/                       # Skills (slash commands)
│   ├── concept.toml                # /concept <feature>
│   └── lab.toml                    # /lab <feature>
├── mcp-servers/
│   └── gemini-docs/                # Serveur MCP unique
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/index.ts
│       └── README.md              # Build/debug standalone du MCP
├── docs/                           # Doc pédagogique transférable
│   ├── 01-prerequis.md
│   ├── 02-installation-extension.md
│   ├── 03-utilisation.md
│   └── 04-fork-template.md
└── content/                        # Artefacts produits par l'agent
    ├── concepts/
    └── labs/
```

### 4.2 Flux d'utilisation

Exemple typique pour `/concept extensions` :

1. L'auteur lance `gemini` dans le repo.
2. Il tape `/concept extensions`.
3. Le skill charge le prompt TOML, qui interpole `extensions` dans `{{args}}`.
4. L'agent (avec le contexte `GEMINI.md`) appelle `search_gemini_docs("extensions")` via le MCP.
5. Il reçoit une liste de pages, choisit les pertinentes, appelle `read_gemini_doc_page(url)` sur chacune.
6. Il rédige une fiche markdown selon le **template concept** dans `content/concepts/2026-05-07-extensions.md`.
7. Il affiche un résumé + le chemin du fichier.
8. L'auteur relit, ajuste, et commit s'il est satisfait.

### 4.3 Séparation des responsabilités

| Composant | Responsabilité | Ne fait pas |
|---|---|---|
| `GEMINI.md` (agent) | Persona, ton, langue, formats imposés, règle "ne bluffe pas" | Contenu Gemini, procédures d'install |
| Skills (`commands/*.toml`) | Orchestrer un workflow (recherche → lecture → rédaction → écriture) | Définir la persona |
| MCP `gemini-docs` | Récupérer la doc officielle (search + read) | Indexer en local, faire de la sémantique |
| `docs/` | Procédures pour humains (install, fork) | Contenu sur Gemini en tant que tel |
| `content/` | Artefacts produits par l'agent | Code de l'extension |

## 5. Composants détaillés

### 5.1 L'agent (`GEMINI.md`)

**Rôle** : assistant d'enablement Gemini francophone, expert Gemini CLI + Code Assist + MCP.

**Audience** : devs (junior à confirmé).

**Langue** : français (sauf identifiants techniques, noms de commandes, mots-clés JSON/TOML).

**Style pédagogique** :
- Ton clair, direct, pas de jargon non expliqué.
- Exemples concrets avant la théorie.
- Liens systématiques vers la doc officielle citée.

**Formats imposés** : quand l'agent produit un concept ou un lab, il doit suivre les templates de la Section 5.2 — sections fixes, frontmatter, nommage de fichier `YYYY-MM-DD-<slug>.md` (et si un fichier existe déjà à ce chemin pour la même journée, l'agent ajoute un suffixe `-2`, `-3`, etc.).

**Sources de vérité** : la doc officielle Gemini (récupérée via le MCP). L'agent ne doit pas inventer de syntaxe — si un point n'est pas trouvé via le MCP, il le signale explicitement.

**Comportement** : pose une question de clarification si `<feature>` est ambigu (ex. `/concept extensions` → "tu veux le manifeste, le mécanisme d'install, ou les deux ?").

### 5.2 Les skills

#### `commands/concept.toml` — `/concept <feature>`

**Prompt (esquisse)** :
> Tu es l'assistant d'enablement (cf. GEMINI.md). Crée une fiche concept en français sur la feature : `{{args}}`.
> 1. Utilise `search_gemini_docs` pour trouver les pages pertinentes.
> 2. Lis-les avec `read_gemini_doc_page`.
> 3. Rédige la fiche dans `content/concepts/YYYY-MM-DD-<slug>.md` selon le template concept.
> 4. Affiche un résumé + le chemin du fichier.

**Template concept** :
- Frontmatter : `title`, `feature`, `date`, `sources` (URLs)
- **TL;DR** (2-3 lignes)
- **À quoi ça sert** (cas d'usage concret)
- **Comment ça marche** (mécanique, schéma si pertinent)
- **Exemple minimal** (bloc de code)
- **Pièges courants** (3-5 points)
- **Pour aller plus loin** (liens doc officielle)

#### `commands/lab.toml` — `/lab <feature>`

Même structure que `/concept`, cible `content/labs/`.

**Template lab** :
- Frontmatter : `title`, `feature`, `date`, `duree_estimee`, `niveau` (débutant/intermédiaire), `prerequis`
- **Objectifs** (3 max, formulés "à l'issue, tu sauras…")
- **Prérequis** (poste + connaissances)
- **Étapes** numérotées : action + commande à taper + résultat attendu
- **Validation finale** (comment savoir que ça a marché)
- **Pour aller plus loin** (variantes, défis bonus)

#### Décisions

- **Pas d'idempotence forcée** : deux invocations consécutives produisent deux fichiers distincts (avec suffixe `-2`, `-3`… si le slug + date sont identiques). Charge à l'utilisateur de supprimer/écraser manuellement s'il veut une seule version.
- **Templates dans le prompt**, pas en fichiers externes (simple pour démarrer).
- **Pas de commit auto** : l'utilisateur commit manuellement.

### 5.3 Le MCP `gemini-docs`

**Stack** : TypeScript + `@modelcontextprotocol/sdk` + `turndown` (HTML→md) + `undici` (fetch). Build via `tsc` → `dist/`.

**Outils exposés** :

- `search_gemini_docs(query: string, limit?: number = 5)` — retourne `[{ title, url, snippet }, ...]`
- `read_gemini_doc_page(url: string)` — retourne `{ title, url, content }` (markdown)

**Sources ciblées** :

1. Repo `google-gemini/gemini-cli` sur GitHub (dossier `docs/`, `extension="md"`) — référence canonique.
2. Doc Gemini Code Assist (`developers.google.com/gemini-code-assist` — URL exacte à vérifier à l'implémentation).
3. Spec MCP (`modelcontextprotocol.io`) — pour la partie outils MCP côté Gemini.

**Stratégie d'implémentation** :

- Pas d'index local pré-construit.
- `search_gemini_docs` : GitHub Code Search API publique pour la source 1 ; pour les sources 2 et 3, fetch + parse simple (sitemap ou liste de pages connues).
- `read_gemini_doc_page` : fetch + (HTML→markdown via turndown si besoin) + retourne le texte.
- Cache mémoire simple (Map URL → contenu, TTL 1h).

**Configuration dans `gemini-extension.json`** :
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

> Note : la syntaxe exacte du manifeste (`${extensionPath}` ou variable équivalente, schéma JSON) sera **vérifiée à l'implémentation** contre la doc officielle Gemini CLI au moment de la rédaction.

**Décisions** :

- **Pas d'auth GitHub par défaut** (limite ~10 req/min suffit). Variable `GITHUB_TOKEN` documentée si besoin.
- **Pas de gestion d'erreur sophistiquée** : erreurs remontées à l'agent qui les signale (cohérent avec la règle "ne bluffe pas").
- **Pas d'embeddings** : full-text suffit.

### 5.4 Documentation `docs/`

Quatre fichiers numérotés pour un parcours linéaire.

#### `01-prerequis.md`
- Node.js (version min requise par Gemini CLI)
- Gemini CLI : install (`npm install -g @google/gemini-cli` — à vérifier), vérification (`gemini --version`)
- Authentification : Google account ou clé API, configuration
- *(Optionnel)* Gemini Code Assist VS Code : marketplace + setup
- Git
- Smoke-test final (`gemini --help`)

#### `02-installation-extension.md`
- Méthode 1 — depuis GitHub : `gemini extensions install <url>` (syntaxe exacte à vérifier)
- Méthode 2 — depuis clone local : `git clone … && gemini extensions install --path ./anto-agent-gemini`
- Vérification : `gemini extensions list`
- **Compilation du MCP** : `cd mcp-servers/gemini-docs && npm install && npm run build` (étape critique car code custom embarqué)
- Désinstallation

#### `03-utilisation.md`
- Démarrer une session Gemini
- Vérifier les skills via `/help`
- Exemple complet `/concept` (commande + extrait sortie + chemin fichier)
- Exemple complet `/lab` (idem)
- Inspecter le MCP (logs, commande équivalent à `gemini mcp list`)
- Cas d'erreur courants + solutions

#### `04-fork-template.md`
- À renommer : `name` dans `gemini-extension.json`, README, dossier MCP
- À garder : structure (agent + skills + MCP + content/), patterns templates
- À adapter : `GEMINI.md` (persona/audience/périmètre), sources ciblées par le MCP, templates concept/lab
- Checklist de fork rapide (5-10 étapes max, < 30 min)

#### Décisions
- Doc en français, commandes shell en anglais.
- Pas de tutorial "construire ta propre extension" inclus — la structure du repo sert d'exemple.
- Versionnage : chaque fichier mentionne `Testé avec gemini-cli x.y.z` pour vieillir explicitement.

## 6. Erreurs et cas limites

| Situation | Comportement attendu |
|---|---|
| MCP introuvable / pas compilé | L'agent signale clairement "le MCP gemini-docs n'est pas disponible — vérifie le build" et n'invente pas. |
| `search_gemini_docs` ne trouve rien | L'agent le signale à l'utilisateur, propose de reformuler ou de fournir une URL directe. |
| `read_gemini_doc_page` échoue (404, timeout) | Erreur remontée, l'agent essaie une autre source si possible, sinon signale. |
| `<feature>` ambigu | L'agent pose une question de clarification (cf. règle persona). |
| Rate-limit GitHub atteint | Erreur explicite, doc mentionne `GITHUB_TOKEN`. |

## 7. Tests / vérification manuelle

Pas de suite de tests automatisés (hors périmètre Lean). Vérification manuelle après implémentation :

1. `npm run build` du MCP réussit.
2. `gemini extensions list` montre l'extension active.
3. `/help` liste `/concept` et `/lab`.
4. `/concept extensions` produit un fichier conforme au template dans `content/concepts/`.
5. `/lab "premier MCP"` produit un fichier conforme au template dans `content/labs/`.
6. Test du cas dégradé : couper le réseau, lancer `/concept`, vérifier que l'agent signale l'erreur sans bluffer.

## 8. Décisions ouvertes (à trancher en implémentation)

Points qui exigent vérification contre la doc officielle Gemini CLI au moment de l'implémentation :

- Syntaxe exacte du manifeste `gemini-extension.json` (champs supportés, schéma).
- Variable d'interpolation pour le chemin de l'extension (`${extensionPath}` ou autre).
- Commande exacte d'installation (`gemini extensions install` vs `gemini extension add` etc.).
- URL canonique de la doc Gemini Code Assist.
- Format TOML des slash commands (champs `prompt`, `description`, autres).

Le plan d'implémentation devra inclure une **étape 0 de vérification** de ces points avant de coder.

## 9. Risques

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| API/syntaxe Gemini CLI évolue | Moyenne | Moyen | Versionner explicitement la doc (`Testé avec x.y.z`), revérifier à chaque MAJ |
| GitHub Search API rate-limit gênant | Faible | Faible | Doc mentionne `GITHUB_TOKEN` |
| Doc Gemini Code Assist déplacée | Moyenne | Faible | Le MCP fetch en live, pas en cache disque ; rectif rapide |
| Sur-ingénierie du MCP | Faible | Moyen | Le périmètre Lean est explicite ; ne pas céder à la tentation des embeddings tant qu'un besoin réel n'apparaît pas |
