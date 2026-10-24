#!/usr/bin/env bash
#
# postdeploy-check.sh — minimal, MANUAL go-live smoke of the LIVE registry.
# NOT wired into CI (decision #12: no continuous monitoring).
#
# Verifies the served contract against a deployed origin:
#   1. GET /r/registry.json           -> 200 application/json, flat catalog
#                                        listing exactly the registry.json items
#   2. `shadcn view <origin>/r/<name>.json` for every item -> resolves
#   3. GET /r/<unknown>.json          -> real 404 (contract from spec #18)
#
# Usage:
#   scripts/postdeploy-check.sh [BASE_URL]
#   BASE_URL=https://responsive-cn.dev scripts/postdeploy-check.sh
# BASE_URL is the site origin; the registry is served under /r/.
set -euo pipefail

# shellcheck source=scripts/lib-registry.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib-registry.sh"

BASE_URL="${1:-${BASE_URL:-https://responsive-cn.dev}}"
BASE_URL="${BASE_URL%/}"                       # strip trailing slash
REG_URL="$BASE_URL/$REGISTRY_PATH"             # e.g. https://responsive-cn.dev/r
CATALOG_URL="$REG_URL/registry.json"

log "Post-deploy check against $BASE_URL"

# 1. Catalog: 200 + application/json, flat (no `include`), parseable.
log "1) GET $CATALOG_URL"
CATALOG="$(mktemp)"
trap 'rm -f "$CATALOG"' EXIT
STATUS="$(curl -sS -o "$CATALOG" -w '%{http_code}' \
  -H 'Accept: application/json' "$CATALOG_URL")"
[ "$STATUS" = 200 ] || die "catalog returned HTTP $STATUS (expected 200)"
CTYPE="$(curl -sSI "$CATALOG_URL" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2}')"
case "$CTYPE" in
  application/json*) ok "catalog 200, content-type: $CTYPE" ;;
  *) warn "catalog 200 but content-type is '$CTYPE' (expected application/json)" ;;
esac

# Enumerate live items from the served catalog and assert it is flat.
# Portable to bash 3.2 (no mapfile); the node step exits non-zero if not flat.
# Read + JSON.parse rather than require(): the downloaded file has no .json
# extension, so require() would try to parse it as a JS module.
node -e '
  const fs = require("fs");
  const c = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (c.include) { console.error("catalog is not flat: has include"); process.exit(1); }
  (c.items || []).forEach((i) => console.log(i.name));
' "$CATALOG" > "$CATALOG.names" || die "served catalog is not flat or not parseable"
ITEMS=()
while IFS= read -r name; do [ -n "$name" ] && ITEMS+=("$name"); done < "$CATALOG.names"
rm -f "$CATALOG.names"
# The live catalog must list exactly the items of the repo's registry.json
# (one base-agnostic item per pair, no per-base variants).
EXPECTED="$(registry_item_names "$REPO_ROOT/registry.json" | sort | tr '\n' ' ')"
ACTUAL="$(printf '%s\n' ${ITEMS[@]+"${ITEMS[@]}"} | sort | tr '\n' ' ')"
[ "$ACTUAL" = "$EXPECTED" ] \
  || die "served catalog lists [$ACTUAL], expected [$EXPECTED]"
ok "catalog is flat with ${#ITEMS[@]} items: ${ITEMS[*]}"

# 2. Each item resolves via the CLI against the live origin.
log "2) shadcn view each item against $REG_URL"
for name in "${ITEMS[@]}"; do
  "${SHADCN[@]}" view "$REG_URL/$name.json" >/dev/null || die "view failed: $name"
done
ok "view resolved all ${#ITEMS[@]} live items"

# 3. Unknown slug must be a real 404 (assets-first fallthrough).
log "3) GET unknown slug -> expect 404"
UNKNOWN_STATUS="$(curl -sS -o /dev/null -w '%{http_code}' \
  "$REG_URL/__does-not-exist__.json")"
if [ "$UNKNOWN_STATUS" = 404 ]; then
  ok "unknown slug returns 404"
else
  warn "unknown slug returned HTTP $UNKNOWN_STATUS (expected 404)"
fi

echo
ok "Post-deploy check passed for $BASE_URL"
