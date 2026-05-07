#!/usr/bin/env bash
# Hook SessionStart pour anto-agent-gemini.
# Sortie attendue par Gemini CLI : un seul objet JSON sur stdout, exit 0.
# Champ "systemMessage" : texte affiché en début de session (mode interactif).

cat <<'JSON'
{
  "systemMessage": "📚 anto-agent-gemini chargé.\n\nCommandes :\n  • /concept <sujet>  — fiche concept Gemini (en français)\n  • /lab <sujet>      — lab guidé Gemini (en français)\n\nSous-agent :\n  • @relecteur-pedagogique <fichier> — relecture qualité pédagogique\n\nGarde-fou actif : git push --force, reset --hard, clean -fd, branch -D, checkout/restore . sont bloqués automatiquement (hook BeforeTool)."
}
JSON
