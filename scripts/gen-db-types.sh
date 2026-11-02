#!/usr/bin/env bash
# Regenerate shared/database.types.ts from the local Supabase Postgres.
# Writes to a temp file first so a failed run never truncates the committed file.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

out="shared/database.types.ts"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

supabase gen types typescript --local > "$tmp"
mv "$tmp" "$out"
trap - EXIT

echo "Wrote $out"
