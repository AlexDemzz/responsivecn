#!/usr/bin/env bash
# Shared helpers for the registry verification scripts.
# Sourced by verify-registry.sh and postdeploy-check.sh — no side effects on source.

# Pin the shadcn CLI so CI and local runs resolve the same tool. Override with
# SHADCN_VERSION if the repo bumps the dependency.
SHADCN_VERSION="${SHADCN_VERSION:-4.22.1}"
SHADCN=(npx --yes "shadcn@${SHADCN_VERSION}")

# Registry is served under /r/ (static assets). Fixed by the serving contract.
REGISTRY_PATH="${REGISTRY_PATH:-r}"

# Resolve the repo root from this file's location (scripts/ lives at the root).
_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${REPO_ROOT:-$(cd "${_LIB_DIR}/.." && pwd)}"

log()  { printf '\033[1;34m▸ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m! %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# Enumerate item names from a registry catalog / registry.json (never hardcoded).
# Usage: registry_item_names <path-to-registry.json>
registry_item_names() {
  node -e '
    const r = require(process.argv[1]);
    (r.items || []).forEach((i) => console.log(i.name));
  ' "$1"
}
