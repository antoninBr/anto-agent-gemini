# 03 — Utilisation au quotidien

> Prérequis : [`02-installation-extension.md`](02-installation-extension.md) complétée + `GITHUB_TOKEN` exporté.

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

Tu dois voir `/concept` et `/lab` dans la liste. Si non : retourne sur [`02-installation-extension.md`](02-installation-extension.md) section "Vérification".

## Skill `/concept` — fiche concept

```
/concept extensions
```

Ce qui se passe :

1. L'agent appelle le MCP `gemini-docs` pour chercher des pages sur "extensions".
2. Il lit les pages pertinentes (max 3) via `read_gemini_doc_page`.
3. Il rédige une fiche markdown selon le template imposé.
4. Il écrit le fichier dans `content/concepts/<aujourd'hui>-extensions.md`.
5. Il affiche un résumé court + le chemin.

**Exemple de sortie attendue (extrait) :**

```
J'ai consulté 3 pages de la doc officielle (gemini-cli docs/extensions/reference.md, …).
La fiche couvre : manifeste, installation, déclaration des outils.

Fichier produit : content/concepts/2026-05-07-extensions.md
```

Tu peux ensuite ouvrir le fichier, relire, ajuster, et `git commit` quand tu es content.

## Skill `/lab` — lab guidé

```
/lab "premier MCP"
```

Même flow, sauf que le template produit un lab pas-à-pas avec étapes numérotées et résultats attendus, dans `content/labs/`.

## Inspecter le MCP

Si tu veux voir ce que l'agent voit, sans passer par Gemini :

```bash
cd mcp-servers/gemini-docs
npm run smoke:search -- "extensions"
```

Tu obtiens directement la sortie JSON de `search_gemini_docs`.

```bash
npm run smoke:read -- "https://raw.githubusercontent.com/google-gemini/gemini-cli/main/docs/extensions/reference.md"
```

Idem pour `read_gemini_doc_page`.

Pour lister les MCPs vus par Gemini CLI (en mode interactif) :

```
/extensions list
```

## Boucle de feedback rapide

Quand un artefact produit n'est pas idéal :

- **Édite le prompt du skill** dans `commands/<skill>.toml` (sections "ÉTAPES OBLIGATOIRES" ou "TEMPLATE OBLIGATOIRE"), puis relance `/concept` ou `/lab`. Pas besoin de recompiler — ce sont juste des prompts.
- Pour modifier le **comportement global** de l'agent (ton, langue, règle "ne bluffe pas"), édite `GEMINI.md` à la racine.
- Pour modifier les **outils disponibles** (ajouter une source de doc, changer le cache, etc.), édite `mcp-servers/gemini-docs/src/` puis `npm run build`.
- En mode interactif, `/extensions reload` recharge l'extension sans quitter Gemini.

## Cas d'erreur courants

| Symptôme | Cause probable | Fix |
|---|---|---|
| L'agent dit "le MCP gemini-docs n'est pas disponible" | Build manquant ou path incorrect dans le manifeste | `cd mcp-servers/gemini-docs && npm run build` ; vérifier `gemini-extension.json`. |
| L'agent invente une syntaxe au lieu d'aller chercher la doc | La règle `GEMINI.md` n'a pas été chargée | Vérifie que `GEMINI.md` est à la racine de l'extension installée et que `contextFileName` n'est pas surchargé dans le manifeste. |
| `Erreur GitHub 401` dans la sortie d'un skill | `GITHUB_TOKEN` non exporté | Re-exporter le token (cf. [`01-prerequis.md`](01-prerequis.md#4-token-github-requis-pour-le-mcp-gemini-docs)). |
| `Erreur GitHub 403` | Rate-limit (5000 req/h dépassé) | Attendre, ou changer de token. |
| Le `/concept` produit du markdown qui ne respecte pas le template | Le prompt du skill a été modifié ou tronqué | Diff `commands/concept.toml` avec la version git. |
| `404 pour <url>` quand l'agent essaie de lire une page | URL obsolète dans `KNOWN_PAGES` ou résultat de recherche périmé | Mets à jour `mcp-servers/gemini-docs/src/search-docs.ts` puis rebuild. |

## Astuces

- **Forcer une langue de sortie autre que le français** (rare mais possible) : précise-la dans le slash command, par ex. `/concept extensions in English` — l'agent suivra l'instruction en clair, qui prime sur la règle par défaut du `GEMINI.md`.
- **Cibler une feature précise** : plus le `<feature>` est précis, plus le `search_gemini_docs` sera pertinent. `/concept "manifeste extension"` est plus utile que `/concept extension`.
- **Ne pas commiter automatiquement les artefacts** : l'agent écrit dans `content/`, mais ne commit jamais. Tu relis et tu commits à ton rythme.
