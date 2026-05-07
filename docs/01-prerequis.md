# 01 — Prérequis poste

> Testé avec **gemini-cli `0.41.x`** (dernière stable au moment de la rédaction) sur **Node `>=20`**.
> Les conventions vérifiées sont celles documentées sur la branche `main` du repo officiel `google-gemini/gemini-cli`. Si tu utilises une version plus récente, la plupart des commandes restent valides — adapte si besoin.

Cette page liste **tout ce qu'il faut installer sur ton poste** avant de pouvoir installer et utiliser l'extension `anto-agent-gemini`.

## 1. Node.js

L'extension embarque un serveur MCP en TypeScript qui tourne sur Node.

- **Version minimum requise :** `>= 20.0.0` (champ `engines.node` du `package.json` officiel de `gemini-cli`).
- **Installation :** [nodejs.org](https://nodejs.org/) (LTS recommandé) ou via [`nvm`](https://github.com/nvm-sh/nvm) (`nvm install 20 && nvm use 20`).
- **Vérification :**

  ```bash
  node --version
  ```

  Sortie attendue : `v20.x.x` (ou plus récent).

## 2. Gemini CLI

- **Installation :**

  ```bash
  npm install -g @google/gemini-cli
  ```

- **Vérification :**

  ```bash
  gemini --version
  ```

  Sortie attendue : un numéro `0.41.x` (ou plus récent).

## 3. Authentification Gemini

Deux options selon ton contexte :

### Option A — Compte Google personnel (gratuit avec quotas)

```bash
gemini auth login
```

Suis le flow OAuth dans ton navigateur. Recommandé pour démarrer rapidement.

### Option B — Clé API (recommandé en pro / CI)

Génère une clé sur [aistudio.google.com](https://aistudio.google.com/app/apikey), puis :

```bash
export GEMINI_API_KEY="ta-clé-ici"
```

Pour rendre permanent, ajoute la ligne à ton `~/.bashrc` / `~/.zshrc` / `~/.config/fish/config.fish`.

### Vérification

```bash
gemini "dis bonjour"
```

Sortie attendue : une réponse en langage naturel. Si erreur d'auth, refais l'étape précédente.

## 4. Token GitHub (requis pour le MCP `gemini-docs`)

Le MCP de cette extension interroge la **GitHub Code Search API**, qui renvoie `401 Unauthorized` sans token (l'endpoint `/search/code` exige une authentification depuis 2022).

- **Créer un token :**
  1. GitHub → Settings → Developer settings → Personal access tokens → **"Generate new token (classic)"** ou **"Fine-grained"**.
  2. **Aucun scope spécial requis** pour la recherche dans les repos publics. Tu peux laisser tous les scopes décochés (token "no scope").
  3. Recopie le token immédiatement (il ne sera plus affiché ensuite).
- **Export :**

  ```bash
  export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
  ```

  Pour rendre permanent, ajoute la ligne à ton shell profile (`~/.bashrc`, etc.).

> **Pourquoi c'est requis et pas optionnel ?** L'API `/search/code` ne tolère plus les requêtes anonymes. Sans token, **aucune recherche dans la doc Gemini ne fonctionnera** ; l'agent te le signalera mais ne produira pas de fiche concept ni de lab.

## 5. (Optionnel) Gemini Code Assist dans VS Code

Si tu veux l'expérience IDE en plus du CLI :

- Ouvre VS Code → Extensions → cherche **"Gemini Code Assist"** (éditeur Google).
- Installe et connecte-toi avec le même compte Google qu'au point 3.
- Doc officielle : [`docs.cloud.google.com/gemini/docs/codeassist/overview`](https://docs.cloud.google.com/gemini/docs/codeassist/overview).

L'extension VS Code supporte les MCP servers — la même config que le CLI s'appliquera après quelques manips dans les settings (cf. doc Code Assist).

## 6. Git

Indispensable pour cloner ce repo (ou installer l'extension depuis git).

```bash
git --version
```

Sortie attendue : `git version 2.x.x`.

## 7. Smoke test final

Lance :

```bash
gemini --help
```

Sortie attendue : la liste des sous-commandes (`extensions`, `mcp`, etc.). Si tu vois ça, ton poste est prêt — passe à [`02-installation-extension.md`](02-installation-extension.md).

## Troubleshooting express

| Symptôme | Solution |
|---|---|
| `gemini: command not found` | Vérifie que `$(npm prefix -g)/bin` est dans ton `PATH`, ou réinstalle avec un préfixe utilisateur. |
| Erreur d'auth Gemini | `gemini auth status` te dit ce qui manque. Re-fais Option A ou Option B. |
| Quotas dépassés | Passe en clé API (étape 3, Option B). |
| Erreur GitHub 401 quand l'agent cherche la doc | `GITHUB_TOKEN` non exporté ou expiré (étape 4). |
| Erreur GitHub 403 | Rate-limit atteint malgré le token (5000 req/h). Attends ou utilise un autre token. |
