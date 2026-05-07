# Notes de vérification — conventions Gemini CLI

**Date :** 2026-05-07
**Version Gemini CLI vérifiée :** `0.42.0-nightly.20260428.g59b2dea0e` (champ `version` du `package.json` de `main` au moment du fetch ; les nightly de la `0.42` exposent les conventions documentées ci-dessous).

**Sources principales consultées (toutes via WebFetch sur `raw.githubusercontent.com/google-gemini/gemini-cli/main/`) :**

- `docs/extensions/reference.md` — schéma du manifeste, variable de chemin, exemple `mcpServers`.
- `docs/extensions/writing-extensions.md` — variable `${extensionPath}` confirmée + `${/}` pour le séparateur cross-platform.
- `docs/extensions/index.md` — vue d'ensemble installation.
- `docs/cli/custom-commands.md` — TOML slash commands (emplacement, champs, placeholder `{{args}}`, namespacing par sous-dossier).
- `docs/cli/cli-reference.md` — sous-commandes `gemini extensions …` (install, link, list, uninstall, enable, disable, update, validate, new).
- `package.json` (root) — `engines.node` et `version`.
- `https://developers.google.com/gemini-code-assist` — testé : redirige (301) vers `https://codeassist.google/` (landing marketing, pas une doc).
- Recherche web complémentaire pour la doc canonique de Code Assist.

## Manifeste `gemini-extension.json`

- **Champs obligatoires** :
  - `name` — identifiant en kebab-case (lowercase + tirets, pas d'underscore ni d'espace) ; **doit correspondre au nom du dossier de l'extension**.
  - `version` — chaîne de version de l'extension.
- **Champs optionnels documentés** :
  - `description` — résumé court (affiché sur `geminicli.com/extensions`).
  - `mcpServers` — map de configurations de serveurs MCP. Sous-champs supportés : `command`, `args`, `cwd` (et toutes les options MCP standard **sauf** `trust`).
  - `contextFileName` — nom du fichier de contexte chargé en début de session (par défaut `GEMINI.md` s'il existe).
  - `excludeTools` — tableau de noms d'outils à exclure du modèle.
  - `migratedTo` — URL d'un nouveau repo source pour la migration automatique.
  - `plan` — config des fonctionnalités de planification, avec une propriété `directory`.
  - `settings` — tableau de paramètres configurables par l'utilisateur (champs : `name`, `description`, `envVar`, `sensitive`).
  - `themes` — définitions de thèmes personnalisés.
- **Variable d'interpolation pour le chemin de l'extension** : **`${extensionPath}`** — confirmée à la fois par `docs/extensions/reference.md` ("This should be used in mcpServers configurations and other manifest properties for portability.") et `docs/extensions/writing-extensions.md` ("replaced with the absolute path to your extension's directory").
- **Bonus cross-platform** : `${/}` est documenté comme séparateur de chemin portable (slash sous Unix, backslash sous Windows). Préférable à un `/` codé en dur dans `args`.
- **Exemple validé** (extrait de `docs/extensions/reference.md`) :

```json
{
  "name": "my-extension",
  "version": "0.1.0",
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${extensionPath}/my-server.js"],
      "cwd": "${extensionPath}"
    }
  }
}
```

> Note de la doc : « Separate your executable and its arguments using `command` and `args` instead of putting them both in `command`. »

## Slash commands TOML

- **Emplacement** :
  - User (global) : `~/.gemini/commands/`
  - Projet (local) : `<project-root>/.gemini/commands/`
  - **Extension : `<extension-root>/commands/<name>.toml`** — confirmé par `docs/extensions/reference.md` ("Provide custom commands by placing TOML files in a `commands/` subdirectory") et `docs/extensions/writing-extensions.md` (exemple `commands/fs/grep-code.toml` → `/fs:grep-code`). Source vérifiée le 2026-05-07 par WebFetch direct sur le repo officiel.
  - En cas de collision de nom, **la commande projet l'emporte sur la user**.
- **Mapping fichier → nom de commande** :
  - `test.toml` → `/test`
  - `git/commit.toml` → `/git:commit` (sous-dossier = namespace via `:`)
- **Champs supportés dans le TOML** :
  - **Requis** : `prompt` (string) — le prompt envoyé au modèle quand la commande est exécutée.
  - **Optionnel** : `description` (string) — courte description (1 ligne).
  - Pas de champ `name` (le nom vient du chemin de fichier).
- **Interpolation de l'argument utilisateur** : placeholder **`{{args}}`**.
  - Dans le corps du `prompt` : injection brute de l'argument tel que tapé.
  - Dans un bloc shell `!{...}` : l'argument est automatiquement échappé pour le shell.
  - **Si `prompt` ne contient pas `{{args}}`**, la commande complète est ajoutée à la fin du prompt, séparée par deux retours à la ligne.

## Installation

Toutes les sous-commandes vivent sous `gemini extensions …` (pluriel). Source : `docs/cli/cli-reference.md` + `docs/extensions/reference.md`.

- **Install depuis URL git/GitHub** :

  ```bash
  gemini extensions install <url> [--ref <ref>] [--auto-update] [--pre-release] [--consent] [--skip-settings]
  ```

  Exemple : `gemini extensions install https://github.com/gemini-cli-extensions/workspace`.

- **Install depuis un path local** : **PAS de `--path`**. La doc utilise une commande dédiée :

  ```bash
  gemini extensions link <path>
  ```

  C'est le « developer mode » : l'extension est utilisée en place via lien symbolique, ce qui permet d'itérer sans réinstaller. Exemple : `gemini extensions link /path/to/extension`.

  > Le flag `--path` n'apparaît dans aucune des sources officielles consultées. Si on veut une install local "permanente" (pas un lien dev), la même `gemini extensions install <source>` accepte aussi un path local d'après `docs/extensions/reference.md` (« The GitHub URL or local path of the extension »), mais la syntaxe précise est `gemini extensions install <path>` (positionnel, pas `--path`).

- **Lister** :

  ```bash
  gemini extensions list
  ```

  En mode interactif : `/extensions list`.

- **Désinstaller** :

  ```bash
  gemini extensions uninstall <name...>
  ```

- **Activer / désactiver** :

  ```bash
  gemini extensions enable <name> [--scope user|workspace]
  gemini extensions disable <name> [--scope user|workspace]
  ```

- **Mettre à jour** :

  ```bash
  gemini extensions update <name>
  gemini extensions update --all
  ```

  Pas de flag `--upgrade` documenté pour `install` (la mise à jour passe par `update`).

- **Bootstrap d'une nouvelle extension** : `gemini extensions new <path>`.
- **Valider la structure d'une extension** : `gemini extensions validate <path>`.
- **Recharger en cours de session** (mode interactif) : `/extensions reload`.
- **Restriction importante** : « Commands like `gemini extensions install` are not supported within the CLI's interactive mode » et les changements ne prennent effet qu'après redémarrage de la session.

## Node minimum

- **Version** : `>=20.0.0` (champ `engines.node` du `package.json` de `google-gemini/gemini-cli@main`).

## Gemini Code Assist

- **URL canonique de la doc** : `https://docs.cloud.google.com/gemini/docs/codeassist/overview`.
- **Détail des redirections constatées** :
  - `https://developers.google.com/gemini-code-assist` → 301 vers `https://codeassist.google/` (landing marketing, **pas** un index de doc).
  - La doc de référence vit sur le sous-domaine Cloud (`docs.cloud.google.com/gemini/docs/codeassist/`), avec des sous-pages comme `set-up-gemini`, `write-code-gemini`, `code-overview`, `release-notes`, `gemini-3`, `faqs`.
- **À retenir pour le code (`KNOWN_PAGES` du MCP `gemini-docs`)** : remplacer l'URL `https://developers.google.com/gemini-code-assist/docs/overview` par `https://docs.cloud.google.com/gemini/docs/codeassist/overview`.

## Divergences avec le plan

Trois divergences confirmées avec `docs/superpowers/plans/2026-05-07-enablement-assistant-plan.md` ; les deux premières sont corrigées inline (Step 0.7), la troisième est de simple cosmétique éditoriale et n'est pas corrigée tant qu'on n'écrit pas réellement le code.

1. **Install local : `--path` n'existe pas.** Le plan écrit `gemini extensions install --path .` (Tâches 12 et 16). La syntaxe officielle est `gemini extensions link <path>` pour le mode développeur (le mode visé en Tâche 16 et dans la "Méthode 2" de la Tâche 12). **Plan mis à jour** : Tâches 12 (Step 12.2, "Méthode 2") et 16 (Step 16.3) remplacent `install --path .` par `link .`.

2. **URL canonique de la doc Gemini Code Assist.** Le plan référence `https://developers.google.com/gemini-code-assist/docs/overview` dans `KNOWN_PAGES` (Tâche 6, ligne ~508). La bonne URL est `https://docs.cloud.google.com/gemini/docs/codeassist/overview`. **Plan mis à jour** : remplacement dans `KNOWN_PAGES`.

3. **Mise à jour d'une install via URL git.** Le plan écrit `gemini extensions install <url> --upgrade` (Tâche 12, Step 12.2). Le flag `--upgrade` n'est documenté nulle part ; la doc préconise `gemini extensions update <name>` ou `gemini extensions update --all`. **Plan mis à jour** : Step 12.2 remplace la commande de mise à jour.

Aucune divergence sur :

- `${extensionPath}` (confirmé, donc Tâches 7 et 12 du plan restent valides — le plan référence "Tâches 8 et 13" dans son Step 0.7 mais c'est un décalage de numérotation interne au plan, pas un bug à corriger ici).
- `{{args}}` (confirmé, Tâches 9 et 10 inchangées).
- `gemini extensions install <url>` (confirmé, Tâche 12 "Méthode 1" inchangée).
- `gemini extensions list` / `gemini extensions uninstall <name>` (confirmés).
- `engines.node >= 20.0.0` (à reporter dans `01-prerequis.md` en Tâche 11).

## Limites de la vérification

- Aucune vérification "live" d'un binaire `gemini` n'a été faite (pas d'install dans cet environnement). Tout repose sur la doc de la branche `main` du repo officiel à la date ci-dessus.
- La page `docs/extensions/index.md` ne donne pas la syntaxe complète d'install local — celle-ci est reconstruite à partir de `docs/cli/cli-reference.md` et `docs/extensions/reference.md`. Si une discordance est observée à l'usage en Tâche 16, mettre à jour ces notes et le plan.
- ~~La doc ne précise pas explicitement le mapping `commands/<name>.toml` → `/<name>` pour les commandes fournies par une extension.~~ **Levé le 2026-05-07** par lecture directe de `docs/extensions/reference.md` et `docs/extensions/writing-extensions.md` : le mapping est confirmé.
