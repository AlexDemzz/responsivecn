#!/usr/bin/env bash
#
# verify-registry.sh — the blocking pre-deploy registry contract check.
# Same script runs in CI (.github/workflows/registry.yml) and locally.
#
# Proves, at the shadcn-CLI × built-artifacts seam (no component internals):
#   a. `shadcn registry validate`            — schema conformance
#   b. `shadcn build`                        — artifacts to a throwaway output dir
#   c. `view` / `list` / `add --dry-run`     — every item, against the built output
#   d. REAL install of every item into two throwaway projects (Base UI + Radix),
#      routed by slug, then `tsc --noEmit`   — the only check that proves
#                                              "add -> code that compiles".
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

# ---------------------------------------------------------------------------
# Throwaway project scaffolding
# ---------------------------------------------------------------------------
# Minimal Vite-shaped React+TS project the shadcn CLI treats as an install
# target. Two styles: base-nova (Base UI) and new-york-v4 (Radix) — the CLI's
# getBase heuristic reads the style prefix, so bare registryDependencies
# (dialog, drawer, ...) resolve to the correct base's primitives.
scaffold_project() {
  local dir="$1" base="$2"
  mkdir -p "$dir/src/lib" "$dir/src/hooks" "$dir/src/components/ui"

  local css deps style
  if [ "$base" = radix ]; then
    style="new-york-v4"
    css="src/index.css"
    deps='"class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.24.0",
    "radix-ui": "^1.6.2",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "tailwind-merge": "^3.6.0",
    "vaul": "^1.1.2"'
  else
    style="base-nova"
    css="src/styles.css"
    deps='"@base-ui/react": "^1.6.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.24.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "tailwind-merge": "^3.6.0"'
  fi

  cat > "$dir/package.json" <<EOF
{
  "name": "smoke-$base",
  "private": true,
  "type": "module",
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": {
    $deps
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^6"
  }
}
EOF

  cat > "$dir/tsconfig.json" <<'EOF'
{
  "include": ["src", "*.ts", "*.tsx"],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "skipLibCheck": true,
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
EOF

  cat > "$dir/components.json" <<EOF
{
  "\$schema": "https://ui.shadcn.com/schema.json",
  "style": "$style",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "$css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
EOF

  cat > "$dir/src/lib/utils.ts" <<'EOF'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

  # Standard shadcn use-mobile hook (768px). `add` overwrites it with the
  # official copy; seeding it means the components resolve during dry-run too.
  cat > "$dir/src/hooks/use-mobile.ts" <<'EOF'
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
EOF

  printf '@import "tailwindcss";\n' > "$dir/$css"
}

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

# Enumerate the built catalog and split by base (portable to bash 3.2 — no mapfile).
ITEMS=()
while IFS= read -r name; do [ -n "$name" ] && ITEMS+=("$name"); done \
  < <(registry_item_names "$BUILD_DIR/registry.json")
[ "${#ITEMS[@]}" -gt 0 ] || die "no items enumerated from built catalog"
BASE_ITEMS=(); RADIX_ITEMS=()
for name in "${ITEMS[@]}"; do
  [ -f "$BUILD_DIR/$name.json" ] || die "built item missing: $name.json"
  if [ "$(item_base "$name")" = radix ]; then RADIX_ITEMS+=("$name"); else BASE_ITEMS+=("$name"); fi
done
ok "built ${#ITEMS[@]} items — base: ${BASE_ITEMS[*]:-none} | radix: ${RADIX_ITEMS[*]:-none}"

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
# Phase D — real smoke install + tsc, per base
# ---------------------------------------------------------------------------
smoke_base() {
  local base="$1"; shift
  local items=("$@")
  [ "${#items[@]}" -gt 0 ] || { warn "no $base items to smoke; skipping"; return 0; }

  local dir="$WORK/smoke-$base"
  log "Phase D ($base) — scaffold + install ${#items[@]} items"
  scaffold_project "$dir" "$base"

  # Pre-install deps so `add` has them satisfied (no per-item npm install) and
  # tsc has types.
  ( cd "$dir" && npm install --no-audit --no-fund --silent )

  # c (continued): `add --dry-run` per item, on the clean scaffold — previews
  # resolution without writing files.
  for name in "${items[@]}"; do
    "${SHADCN[@]}" add "$BUILD_DIR/$name.json" --cwd "$dir" --dry-run --yes >/dev/null \
      || die "add --dry-run failed: $name"
  done
  ok "$base: add --dry-run previewed all ${#items[@]} items"

  # d: real install of every item, then backfill dangling primitives.
  for name in "${items[@]}"; do
    "${SHADCN[@]}" add "$BUILD_DIR/$name.json" --cwd "$dir" --overwrite --yes >/dev/null \
      || die "add failed: $name"
  done
  backfill_ui_primitives "$dir"

  # Pick up anything `add` appended to package.json, then typecheck the result.
  ( cd "$dir" && npm install --no-audit --no-fund --silent )
  log "Phase D ($base) — tsc --noEmit"
  ( cd "$dir" && npx tsc --noEmit ) || die "$base smoke project failed tsc"
  ok "$base: installed ${#items[@]} items -> tsc clean"
}

# Empty-array-safe expansion (bash 3.2 + set -u errors on "${empty[@]}").
smoke_base base  ${BASE_ITEMS[@]+"${BASE_ITEMS[@]}"}
smoke_base radix ${RADIX_ITEMS[@]+"${RADIX_ITEMS[@]}"}

echo
ok "Registry contract verified: ${#ITEMS[@]} items validated, built, viewed, listed, installed (base+radix), and typechecked."
