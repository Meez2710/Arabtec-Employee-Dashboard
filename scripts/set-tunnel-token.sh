#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Private .env configuration was not found."
  exit 1
fi

printf "Paste the complete Cloudflare Docker command or only its token: "
IFS= read -r -s supplied
printf "\n"

if [[ "$supplied" == *"--token "* ]]; then
  token="${supplied##*--token }"
  token="${token%% *}"
else
  token="$supplied"
fi

token="${token#\"}"
token="${token%\"}"
token="${token#\'}"
token="${token%\'}"

if (( ${#token} < 40 )); then
  echo "That does not look like a valid tunnel token. Nothing was changed."
  exit 1
fi

temporary="$(mktemp)"
found=0
while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" == TUNNEL_TOKEN=* ]]; then
    printf 'TUNNEL_TOKEN=%s\n' "$token" >> "$temporary"
    found=1
  else
    printf '%s\n' "$line" >> "$temporary"
  fi
done < .env

if [[ "$found" -eq 0 ]]; then
  printf 'TUNNEL_TOKEN=%s\n' "$token" >> "$temporary"
fi

mv "$temporary" .env
chmod 600 .env
unset supplied token

echo "Cloudflare tunnel token saved privately."
