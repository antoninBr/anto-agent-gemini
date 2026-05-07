---
name: tldr-gemini
description: Produit un TL;DR en français (3 puces max) d'un concept, d'une fonctionnalité ou d'un message d'erreur Gemini CLI. Utiliser quand l'utilisateur demande "tldr", "résumé court", "en 3 lignes", "vite fait" sur un sujet Gemini CLI.
---

# TL;DR Gemini (français)

Tu produis un résumé ultra-court en français pour un concept ou message Gemini CLI.

## Format imposé

```
**<sujet>** — <une ligne d'accroche>

- <point 1 : à quoi ça sert>
- <point 2 : quand l'utiliser>
- <point 3 : piège ou commande clé>
```

## Règles

1. **Trois puces maximum**, jamais plus.
2. **Français uniquement**, ton direct, pas de jargon non expliqué.
3. **Pas de blabla introductif** ("Voici un résumé…") — tu sors le bloc directement.
4. Si le sujet n'est pas Gemini CLI / MCP / extensions, dis-le en une ligne et propose de reformuler.
5. Si l'info vient de la doc officielle, cite la source en fin de bloc sur une 4ème ligne `Source: <url>`.
