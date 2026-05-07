#!/usr/bin/env bash
# Hook BeforeTool pour anto-agent-gemini.
# Bloque les commandes git destructrices avant exécution par run_shell_command.
#
# Contrat Gemini CLI :
#   - Reçoit sur stdin un JSON : { tool_name, tool_input: { command, ... }, ... }
#   - exit 0 = laisse passer ; exit 2 = bloque (raison sur stderr, renvoyée à l'agent)
#
# Volontairement défensif : si on n'arrive pas à parser, on laisse passer
# (un faux négatif est moins grave qu'un faux positif qui paralyse l'agent).

set -uo pipefail

payload="$(cat)"

# Extraction du champ tool_input.command sans dépendre de jq.
cmd=""
if command -v python3 >/dev/null 2>&1; then
  cmd="$(printf '%s' "$payload" | python3 -c 'import sys,json
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""), end="")
except Exception:
    pass' 2>/dev/null)"
fi

[ -z "$cmd" ] && exit 0

block() {
  local reason="$1"
  {
    echo "🚫 Hook anto-agent-gemini : $reason."
    echo "Commande bloquée : $cmd"
    echo "Si l'opération est volontaire, lance-la manuellement hors de Gemini."
  } >&2
  exit 2
}

# On normalise en encadrant la commande de espaces, ce qui simplifie les patterns case.
padded=" $cmd "

case "$padded" in
  *" git push "*" --force "*|*" git push "*" -f "*|*" git push --force "*|*" git push -f "*)
    block "git push --force détecté (peut écraser l'historique distant)"
    ;;
esac

case "$padded" in
  *" git reset --hard "*|*" git reset --hard")
    block "git reset --hard détecté (perte de travail non-commit possible)"
    ;;
  *" git clean -fd"*|*" git clean -df"*|*" git clean -fdx"*|*" git clean -xfd"*)
    block "git clean -fd détecté (suppression de fichiers non versionnés)"
    ;;
  *" git branch -D "*)
    block "git branch -D détecté (suppression forcée d'une branche)"
    ;;
  *" git checkout . "*|*" git checkout ."|*" git restore . "*|*" git restore ."|*" git checkout -- ."*|*" git restore -- ."*)
    block "git checkout/restore . détecté (écrase tous les changements locaux)"
    ;;
esac

exit 0
