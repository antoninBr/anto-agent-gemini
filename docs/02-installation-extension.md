# 02 — Installation de l'extension

> Prérequis : avoir suivi [`01-prerequis.md`](01-prerequis.md).
> Testé avec **gemini-cli `0.41.x`**.

Deux méthodes selon que tu veux **utiliser** ou **modifier** l'extension.

## Méthode 1 — Depuis le repo GitHub (utilisation simple)

```bash
gemini extensions install https://github.com/antoninBr/anto-agent-gemini
```

Sortie attendue : un message de succès ; l'extension apparaît dans la liste (cf. ci-dessous).

> Flags utiles : `--ref <branche|tag>`, `--auto-update`, `--pre-release`. Cf. `gemini extensions install --help`.

## Méthode 2 — Depuis un clone local (dev / contribution)

```bash
git clone https://github.com/antoninBr/anto-agent-gemini.git
cd anto-agent-gemini
gemini extensions link .
```

`link` est le **mode développeur** : Gemini utilise ton clone en place via lien. Tu peux modifier les fichiers et les changements sont pris en compte au prochain `gemini` (avec un build du MCP si tu as touché au TypeScript — cf. ci-dessous).

> Pour une install locale "permanente" (pas un lien dev), `gemini extensions install <path>` accepte aussi un chemin local en argument positionnel. Mais pour itérer, `link` est plus pratique.

## Étape critique : compiler le MCP

L'extension embarque un serveur MCP TypeScript. **Il faut le compiler** une première fois sinon l'agent ne pourra pas appeler ses outils.

```bash
cd mcp-servers/gemini-docs
npm install
npm run build
cd ../..
```

Sortie attendue : pas d'erreur, et `mcp-servers/gemini-docs/dist/index.js` existe.

> Si tu modifies le code TypeScript du MCP, relance `npm run build` pour que les changements soient appliqués au prochain démarrage de Gemini.

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

## Configurer GITHUB_TOKEN pour le MCP

Le MCP `gemini-docs` a besoin d'un `GITHUB_TOKEN` pour interroger la doc officielle. Deux options :

1. **Export dans le shell** (recommandé) — cf. [`01-prerequis.md`](01-prerequis.md#4-token-github-requis-pour-le-mcp-gemini-docs). Le MCP héritera automatiquement de la variable d'env.
2. **Via le manifeste** — ajoute un bloc `env` à la config du MCP dans `gemini-extension.json` :

   ```json
   {
     "mcpServers": {
       "gemini-docs": {
         "command": "node",
         "args": ["${extensionPath}${/}mcp-servers${/}gemini-docs${/}dist${/}index.js"],
         "env": {
           "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
         }
       }
     }
   }
   ```

   ⚠️ Ne commit pas un token en clair. Préfère l'option 1.

## Désinstallation

```bash
gemini extensions uninstall anto-agent-gemini
```

Pour `link` (méthode 2), même commande — Gemini retire le lien sans toucher à ton clone local.

## Mise à jour

Si tu as installé via la méthode 1 (URL git) :

```bash
gemini extensions update anto-agent-gemini
# ou pour mettre à jour toutes tes extensions :
gemini extensions update --all
```

Si tu as installé via la méthode 2 (clone local) :

```bash
cd anto-agent-gemini
git pull
cd mcp-servers/gemini-docs && npm install && npm run build && cd ../..
```

## Activer / désactiver temporairement

```bash
gemini extensions disable anto-agent-gemini
gemini extensions enable anto-agent-gemini
```

Utile si une extension cause un conflit avec une autre. Le scope par défaut est `workspace` ; ajoute `--scope user` pour activer/désactiver globalement.

## Troubleshooting

| Symptôme | Solution |
|---|---|
| `/concept` n'apparaît pas dans `/help` | Vérifie `gemini extensions list` ; redémarre `gemini` ; vérifie que `commands/concept.toml` existe à la racine de l'extension installée. |
| Erreur "le MCP gemini-docs n'est pas disponible" | Tu as oublié `npm run build` du MCP. Relance-le. |
| Erreur `Cannot find module 'dist/index.js'` | Idem — build manquant. |
| Erreur GitHub 401 quand l'agent cherche | `GITHUB_TOKEN` non défini. Cf. section ci-dessus. |
| Rate-limit GitHub à l'usage | Tu as atteint 5000 req/h. Attends ou utilise un autre token. |
| `gemini extensions install` refusée en mode interactif | Sors de la session Gemini (`Ctrl-D`) et lance la commande dans ton shell. |
