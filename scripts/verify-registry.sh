#!/usr/bin/env bash
#
# verify-registry.sh — the blocking pre-deploy registry contract check.
# Same script runs in CI (.github/workflows/registry.yml) and locally.
#
# Proves, at the shadcn-CLI × built-artifacts seam (no component internals):
#   a. `shadcn registry validate`            — schema conformance
#   b. `shadcn build`                        — artifacts to a throwaway output dir
#   c. `view` / `list` / `add --dry-run`     — every item, against the built output
#   d. REAL install of every item into two throwaway projects scaffolded by
#      `shadcn init -b base|radix -p nova`, plus each item's usage-check, then
#      `tsc --noEmit`                         — the only check that proves
#                                              "add -> code that compiles" on
#                                              both bases from ONE source file.
#
# Items are ENUMERATED from registry.json — items added later are covered with
# zero edits to this script or the workflow.
#
# Requires: node, npm, curl (for nothing here; curl is used by postdeploy-check).
# Network to npm + ui.shadcn.com is required (bare registryDependencies resolve
# against @shadcn).
set -euo pipefail

# shellcheck source=scripts/lib-registry.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-registry.sh"

cd "$REPO_ROOT"

# Single throwaway workspace; wiped on exit (success or failure).
WORK="$(mktemp -d "${TMPDIR:-/tmp}/responsivecn-verify.XXXXXX")"
SERVER_PID=""
cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

BUILD_DIR="$WORK/r"

# After installing items, some upstream @shadcn primitives import ui/* siblings
# they don't declare as registryDependencies (e.g. new-york-v4 `dialog` imports
# `button` with no declared dep). Resolve any dangling @/components/ui/* import
# by adding the missing primitive for this project's style. General: covers any
# such gap for any item, now and in the future.
backfill_ui_primitives() {
  local dir="$1"
  local pass missing ref
  for pass in 1 2 3 4; do
    missing=""
    for ref in $(grep -rhoE '@/components/ui/[a-z0-9-]+' "$dir/src" 2>/dev/null \
                   | sed 's#@/components/ui/##' | sort -u); do
      [ -f "$dir/src/components/ui/$ref.tsx" ] || missing="$missing $ref"
    done
    missing="$(echo "$missing" | xargs)"
    [ -z "$missing" ] && return 0
    log "backfilling missing ui primitives (pass $pass): $missing"
    for ref in $missing; do
      "${SHADCN[@]}" add "$ref" --cwd "$dir" --overwrite --yes >/dev/null
    done
  done
  die "backfill did not converge in $dir (still missing: $missing)"
}

# ---------------------------------------------------------------------------
# Phase A — validate
# ---------------------------------------------------------------------------
log "Phase A — registry validate"
"${SHADCN[@]}" registry validate
ok "registry.json is schema-valid"

# ---------------------------------------------------------------------------
# Phase B — build to a throwaway output dir (repo public/ is left untouched;
# the site build in CI produces public/r on its own via the prebuild hook)
# ---------------------------------------------------------------------------
log "Phase B — shadcn build -> $BUILD_DIR"
"${SHADCN[@]}" build -o "$BUILD_DIR" >/dev/null
[ -f "$BUILD_DIR/registry.json" ] || die "build produced no catalog (registry.json)"

# Enumerate the built catalog (portable to bash 3.2 — no mapfile).
ITEMS=()
while IFS= read -r name; do [ -n "$name" ] && ITEMS+=("$name"); done \
  < <(registry_item_names "$BUILD_DIR/registry.json")
[ "${#ITEMS[@]}" -gt 0 ] || die "no items enumerated from built catalog"
for name in "${ITEMS[@]}"; do
  [ -f "$BUILD_DIR/$name.json" ] || die "built item missing: $name.json"
done
ok "built ${#ITEMS[@]} items: ${ITEMS[*]}"

# ---------------------------------------------------------------------------
# Phase C — contract checks against the BUILT output
# ---------------------------------------------------------------------------
log "Phase C — view (per item) + list (served catalog) against built output"

# view: each built item JSON resolves and parses.
for name in "${ITEMS[@]}"; do
  "${SHADCN[@]}" view "$BUILD_DIR/$name.json" >/dev/null || die "view failed: $name"
done
ok "view resolved all ${#ITEMS[@]} items"

# list: serve the built dir over HTTP (the catalog path the CLI expects) and
# assert the CLI enumerates every item. Node-only static server — no python dep.
PORT_FILE="$WORK/port"
node -e '
  const http = require("http"), fs = require("fs"), path = require("path");
  const dir = process.argv[1], portFile = process.argv[2];
  const srv = http.createServer((req, res) => {
    const p = path.join(dir, decodeURIComponent(req.url.split("?")[0]));
    fs.readFile(p, (e, b) => {
      if (e) { res.writeHead(404, { "content-type": "application/json" }); res.end("{}"); }
      else { res.writeHead(200, { "content-type": "application/json" }); res.end(b); }
    });
  });
  srv.listen(0, "127.0.0.1", () => fs.writeFileSync(portFile, String(srv.address().port)));
' "$BUILD_DIR" "$PORT_FILE" &
SERVER_PID=$!
disown 2>/dev/null || true   # silence the shell's job-control "Terminated" notice
for _ in $(seq 1 50); do [ -s "$PORT_FILE" ] && break; sleep 0.1; done
[ -s "$PORT_FILE" ] || die "local registry server did not start"
PORT="$(cat "$PORT_FILE")"
CATALOG_URL="http://127.0.0.1:$PORT/registry.json"

LIST_OUT="$("${SHADCN[@]}" list "$CATALOG_URL" 2>&1 || true)"
if ! grep -q "Found ${#ITEMS[@]} items" <<<"$LIST_OUT"; then
  printf '%s\n' "$LIST_OUT" >&2
  die "list did not report ${#ITEMS[@]} items from the served catalog"
fi
kill "$SERVER_PID" 2>/dev/null || true; SERVER_PID=""
ok "list enumerated ${#ITEMS[@]} items from the served catalog"

# ---------------------------------------------------------------------------
# Phase D — real smoke install + tsc, once per shadcn base, same items
# ---------------------------------------------------------------------------
smoke_base() {
  local base="$1"
  local dir="$WORK/smoke-$base"
  log "Phase D ($base) — shadcn init -b $base -p nova"
  # init scaffolds the Vite project and installs its deps; `add` runs alone
  # afterwards (combining them in one init call skips the item install).
  ( cd "$WORK" && "${SHADCN[@]}" init -t vite -b "$base" -p nova \
      -n "smoke-$base" --no-monorepo --yes >/dev/null ) \
    || die "$base: shadcn init failed"

  for name in "${ITEMS[@]}"; do
    "${SHADCN[@]}" add "$BUILD_DIR/$name.json" --cwd "$dir" --dry-run --yes >/dev/null \
      || die "$base: add --dry-run failed: $name"
  done
  ok "$base: add --dry-run previewed all ${#ITEMS[@]} items"

  for name in "${ITEMS[@]}"; do
    "${SHADCN[@]}" add "$BUILD_DIR/$name.json" --cwd "$dir" --overwrite --yes >/dev/null \
      || die "$base: add failed: $name"
  done
  backfill_ui_primitives "$dir"

  # The usage-checks hold the type contract (desktop props 1:1 on this base);
  # they import the component from a sibling path, as installed.
  for name in "${ITEMS[@]}"; do
    local check="$REPO_ROOT/registry/$name/usage-check.tsx"
    [ -f "$check" ] && cp "$check" "$dir/src/components/ui/$name-usage-check.tsx"
  done

  log "Phase D ($base) — tsc --noEmit"
  ( cd "$dir" && npx tsc --noEmit -p tsconfig.app.json ) || die "$base smoke project failed tsc"
  ok "$base: installed ${#ITEMS[@]} items -> tsc clean"
}

smoke_base base
smoke_base radix

echo
ok "Registry contract verified: ${#ITEMS[@]} items validated, built, viewed, listed, installed (Base UI + Radix), and typechecked."
