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
| `GEMINI.md` | Persona/contexte de l'agent principal |
| `commands/` | Slash commands `/concept` et `/lab` |
| `skills/` | Expertises chargées à la demande (ex. `tldr-gemini`) |
| `agents/` | **Sous-agents** délégables — voir ci-dessous |
| `mcp-servers/gemini-docs/` | Serveur MCP TypeScript qui interroge la doc officielle |
| `hooks/hooks.json` | Hooks lifecycle de l'extension (bannière SessionStart + garde-fou git) |
| `scripts/` | Scripts shell appelés par les hooks |
| `docs/` | Documentation pédagogique transférable |
| `content/` | Artefacts produits par l'agent (concepts + labs) |

## Sous-agents inclus

Un **sous-agent** Gemini CLI n'est *pas* l'agent principal. C'est un agent **séparé**, avec sa propre persona, son propre contexte et son propre périmètre d'outils, que l'agent principal peut **déléguer** pour une tâche isolée. Il s'expose comme un outil — l'agent principal l'appelle, le sous-agent travaille dans une fenêtre de contexte indépendante, puis renvoie son résultat. Avantage : le va-et-vient interne du sous-agent ne pollue pas la session principale.

| Sous-agent | Rôle | Invocation |
|---|---|---|
| `relecteur-pedagogique` | Relit une fiche concept ou un lab fraîchement généré et renvoie un verdict structuré (clarté, niveau, prérequis, rigueur factuelle), avec vérifications dans la doc officielle. | `@relecteur-pedagogique content/concepts/2026-05-07-extensions.md` |

Cas d'usage typique : après un `/concept extensions`, déléguer la relecture au sous-agent pour avoir un avis indépendant avant publication, sans que l'agent principal qui orchestre la session ne soit biaisé par la conversation qui a produit la fiche.

## Statut

Projet personnel d'apprentissage et template d'enablement. Le design complet est dans [`docs/superpowers/specs/`](docs/superpowers/specs/) et le plan d'implémentation dans [`docs/superpowers/plans/`](docs/superpowers/plans/).

## Licence

À définir.
