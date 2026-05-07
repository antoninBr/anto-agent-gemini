# anto-agent-gemini

Extension Gemini d'enablement — un assistant qui aide à produire **fiches concepts** et **labs guidés** en français sur les features de Gemini lui-même.

> Méta : utiliser Gemini pour préparer l'enseignement de Gemini.

## Démarrage rapide

1. [Prérequis poste](docs/01-prerequis.md) — Node, Gemini CLI, auth, `GITHUB_TOKEN`.
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
| `content/` | Artefacts produits par l'agent (concepts + labs) |

## Statut

Projet personnel d'apprentissage et template d'enablement. Le design complet est dans [`docs/superpowers/specs/`](docs/superpowers/specs/) et le plan d'implémentation dans [`docs/superpowers/plans/`](docs/superpowers/plans/).

## Licence

À définir.
