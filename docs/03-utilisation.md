# 03 — Utilisation au quotidien

> Prérequis : [`02-installation-extension.md`](02-installation-extension.md) complétée + `GITHUB_TOKEN` exporté.

## Démarrer une session

Depuis n'importe quel répertoire :

```bash
gemini
```

Tu obtiens un prompt interactif. L'extension `anto-agent-gemini` est chargée automatiquement (la persona, les skills, le MCP, **et les hooks**).

Au démarrage de la session, tu dois voir une bannière :

```
📚 anto-agent-gemini chargé.

Commandes :
  • /concept <sujet>  — fiche concept Gemini (en français)
  • /lab <sujet>      — lab guidé Gemini (en français)

Sous-agent :
  • @relecteur-pedagogique <fichier> — relecture qualité pédagogique

Garde-fou actif : git push --force, reset --hard, clean -fd, branch -D, checkout/restore . sont bloqués automatiquement (hook BeforeTool).
```

Cette bannière est produite par le hook `SessionStart` (cf. [section "Hooks de l'extension"](#hooks-de-lextension) plus bas). Si tu ne la vois pas, le hook n'est pas chargé — vérifie [`02-installation-extension.md`](02-installation-extension.md).

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

## Hooks de l'extension

L'extension installe deux hooks lifecycle Gemini CLI (déclarés dans `hooks/hooks.json`, scripts dans `scripts/`). Ce sont des points d'extension natifs de Gemini CLI — pas du code applicatif de l'agent.

| Hook | Événement | Effet |
|---|---|---|
| `anto-agent-gemini-banner` | `SessionStart` | Affiche la bannière d'accueil (commandes, sous-agents, garde-fous actifs) au lancement de chaque session. |
| `git-destructive-guard` | `BeforeTool` (matcher `run_shell_command`) | Inspecte chaque commande shell que l'agent veut lancer ; si elle correspond à un pattern destructeur git, la **bloque** avant exécution et renvoie la raison à l'agent. |

### Patterns bloqués par le garde-fou git

| Pattern | Raison |
|---|---|
| `git push --force` / `git push -f` | Peut écraser l'historique distant. |
| `git reset --hard` | Perte de travail non-commit. |
| `git clean -fd` (et variantes `-df`, `-fdx`, `-xfd`) | Suppression de fichiers non versionnés. |
| `git branch -D` | Suppression forcée d'une branche. |
| `git checkout .` / `git restore .` (et `git checkout -- .`) | Écrase tous les changements locaux. |

### Quand le garde-fou bloque

L'agent reçoit le message `🚫 Hook anto-agent-gemini : <raison>` sur stderr et la commande n'est pas exécutée. L'agent peut alors changer d'approche, ou **tu** peux exécuter la commande manuellement hors de Gemini si l'opération est volontaire.

### Tester les hooks

Bannière (doit produire un JSON valide) :

```bash
./scripts/session-start.sh | python3 -m json.tool
```

Garde-fou (bloque) :

```bash
echo '{"tool_name":"run_shell_command","tool_input":{"command":"git push --force"}}' \
  | ./scripts/git-guard.sh ; echo "exit=$?"
# Attendu : message stderr + exit=2
```

Garde-fou (laisse passer) :

```bash
echo '{"tool_name":"run_shell_command","tool_input":{"command":"git status"}}' \
  | ./scripts/git-guard.sh ; echo "exit=$?"
# Attendu : exit=0, pas de sortie
```

### Lister / désactiver les hooks depuis Gemini

Dans le prompt interactif :

```
/hooks panel              # vue détaillée de tous les hooks chargés
/hooks disable <name>     # désactive un hook par nom (ex: git-destructive-guard)
/hooks enable  <name>     # le réactive
/hooks disable-all        # coupe tout
```

Pour une désactivation **persistante**, commente l'entrée correspondante dans `hooks/hooks.json` et redémarre Gemini.

### Ajouter un hook

Voir [doc officielle Gemini CLI hooks](https://geminicli.com/docs/hooks/). Pattern à suivre : un script shell dans `scripts/`, appelé via `${extensionPath}${/}scripts${/}<nom>.sh`, qui lit le payload sur stdin et sort un JSON sur stdout (ou exit 2 + stderr pour bloquer un `BeforeTool`).

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
| Pas de bannière au démarrage | Hook `SessionStart` non détecté ou script non exécutable | Vérifie `chmod +x scripts/*.sh` et que `hooks/hooks.json` est à la racine de l'extension installée. |
| L'agent dit "ma commande a été bloquée" sur un git légitime | Faux positif du garde-fou git | Lance la commande manuellement hors de Gemini, ou ajoute une exception dans `scripts/git-guard.sh`. |

## Astuces

- **Forcer une langue de sortie autre que le français** (rare mais possible) : précise-la dans le slash command, par ex. `/concept extensions in English` — l'agent suivra l'instruction en clair, qui prime sur la règle par défaut du `GEMINI.md`.
- **Cibler une feature précise** : plus le `<feature>` est précis, plus le `search_gemini_docs` sera pertinent. `/concept "manifeste extension"` est plus utile que `/concept extension`.
- **Ne pas commiter automatiquement les artefacts** : l'agent écrit dans `content/`, mais ne commit jamais. Tu relis et tu commits à ton rythme.
