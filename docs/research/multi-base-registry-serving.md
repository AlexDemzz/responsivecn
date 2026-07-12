# Multi-Base Registry Serving — How Registries Serve Radix vs Base UI Variants

Research date: **2026-07-12**. All claims verified against primary sources only: the shadcn CLI source and v4 app in the `shadcn-ui/ui` repository at commit [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940) (tip of `main`, last pushed 2026-07-10; CLI package version `4.13.0` per [`packages/shadcn/package.json`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/package.json)), the live docs/schemas on ui.shadcn.com, and live registry endpoints fetched on 2026-07-12.

---

## TL;DR

- **There is no `{base}` placeholder.** The only tokens expanded in a registry URL template are `{name}`, `{style}`, and `${ENV_VAR}`. The base is not a separate dimension in URL resolution — it is **encoded in the style string**: preset styles are named `<base>-<style>` (`base-vega`, `radix-nova`), and the CLI derives the base with a prefix check (`style.startsWith("base-") ? "base" : "radix"`). ([builder.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L12-L13), [get-config.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/utils/get-config.ts#L321-L330))
- `{style}` resolves to the consumer project's `style` field from `components.json`, **verbatim** — e.g. `base-vega` in a Base UI project, `radix-nova` or legacy `new-york-v4` in a Radix project. ([builder.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L58-L82))
- The official registry maintains **two parallel authored component trees** (`registry/bases/base`, `registry/bases/radix`) and builds 2 bases × 8 styles = 16 style combinations to `public/r/styles/<base>-<style>/*`, plus legacy Radix styles (`new-york-v4`, …). Bare names (`dialog`) always resolve against `@shadcn` using the consumer's style string, which is how the right base is picked. ([bases/README.md](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/README.md), [build-registry.mts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/scripts/build-registry.mts#L68-L75), [resolver.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L120))
- The `{style}` mechanism **is available to third-party registries** (same template expansion for any configured registry). Bare-name resolution is **not** redirectable: bare deps are hardwired to `@shadcn`, and overriding `@shadcn` in `components.json` throws. ([builder.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L39), [get-config.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/utils/get-config.ts#L206-L213))
- In the wild (234 directory registries, fetched 2026-07-12): only 4 use `{style}`, and none of them serves the new `base-*` style strings (probed: 404). The two observed dual-base conventions are **base-in-item-name** (animate-ui: `components-base-dialog` / `components-radix-dialog`) and **separate registry per base** (basecn = Base UI port under its own namespace). ([registries.json](https://ui.shadcn.com/r/registries.json))
- A Radix project that `add`s a Base-UI-only item gets exactly the observed failure mode, with **no warning**: the item's files verbatim (typed against `@base-ui/react`), `@base-ui/react` installed from `dependencies`, and its bare `registryDependencies` resolved to **Radix** wrappers from `styles/new-york-v4/...`. No base-compatibility check exists in the `add` flow. ([resolver.ts](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L110-L127), live probes below)

---

## 1. URL template placeholders: `{name}`, `{style}`, and no `{base}`

The template expansion for every registry (built-in and third-party) lives in [`packages/shadcn/src/registry/builder.ts`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L12-L16). The complete set of tokens:

```ts
const NAME_PLACEHOLDER = "{name}"
const STYLE_PLACEHOLDER = "{style}"
const ENV_VAR_PATTERN = /\${(\w+)}/g
```

`buildUrlFromRegistryConfig` ([builder.ts L58–L82](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L58-L82)) replaces `{name}` with the item name, then `{style}` with `config.style` **only if the config has a style set**:

```ts
let url = registryConfig.replace(NAME_PLACEHOLDER, item)
if (config?.style && url.includes(STYLE_PLACEHOLDER)) {
  url = url.replace(STYLE_PLACEHOLDER, config.style)
}
return expandEnvVars(url)
```

**No `{base}` placeholder exists** — those three tokens (plus object-form `params`/`headers`, also env-expanded) are the entire template surface. The [namespace docs](https://ui.shadcn.com/docs/registry/namespace) document `{style}` as "replaced with the current style configuration" and document no base token either.

### What `{style}` resolves to per project kind

`config.style` is the `style` field of the consumer's `components.json`, passed through verbatim. Current values in the wild:

| Project | `components.json` `style` | `{style}` expands to |
|---|---|---|
| Base UI project (new, via preset) | `base-vega`, `base-nova`, … | `base-<style>` |
| Radix project (new, via preset) | `radix-vega`, `radix-nova`, … | `radix-<style>` |
| Radix project (legacy) | `new-york-v4`, `new-york`, `default` | the legacy string |

Verified end-to-end: the live init endpoint `https://ui.shadcn.com/init?base=base&style=vega&…` (what `shadcn init` fetches after the base/preset prompts, per [presets.ts `resolveInitUrl`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/preset/presets.ts)) returns a `registry:base` item named `base-vega` whose `config.style` is `"base-vega"` — that string is what gets written to `components.json` (fetched 2026-07-12). The 16 presets in [`https://ui.shadcn.com/r/config.json`](https://ui.shadcn.com/r/config.json) are exactly `{base,radix} × {vega,nova,maia,lyra,mira,luma,sera,rhea}` with `name = "<base>-<style>"`.

The CLI's only base-detection logic is a prefix check on that string — [`getBase` in get-config.ts L321–L330](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/utils/get-config.ts#L321-L330):

```ts
export function getBase(style: string | undefined) {
  // An undefined style means no existing config, so default to base.
  // Any defined style, including empty and unprefixed legacy values
  // (new-york, new-york-v4, default), stays radix.
  if (style === undefined) {
    return "base"
  }
  return style.startsWith("base-") ? "base" : "radix"
}
```

Note `getBase` is only called by `info`, `apply` (presets), and `docs` — **not** by `add`/resolution (see §5). Fallback style when no config exists: `FALLBACK_STYLE = "new-york-v4"` ([constants.ts L9](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/constants.ts#L9)).

## 2. How the official registry structures and selects bases

### Authoring: two parallel trees

Since Base UI became the default (announced [July 2026 in the changelog](https://ui.shadcn.com/docs/changelog): "Base UI as the Default"), the official registry authors every component twice. [`apps/v4/registry/bases/README.md`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases/README.md):

> This folder holds **two parallel registries**: `base/` — Base UI–backed components and blocks; `radix/` — Radix-backed components and blocks. For any shared surface … changes should be applied to both `base` and `radix` variants.

Each tree has its own `ui/`, `blocks/`, `examples/`, `hooks/`, `lib/`, `registry.ts`. The two bases are declared as `registry:style` items in [`apps/v4/registry/bases.ts`](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/registry/bases.ts) — `base` with `dependencies: ["@base-ui/react"]`, `radix` with `dependencies: ["radix-ui"]`.

### Build: base × style combinations

[`apps/v4/scripts/build-registry.mts` L68–L75](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/apps/v4/scripts/build-registry.mts#L68-L75) fans the two trees out into every served style:

```ts
const STYLE_COMBINATIONS = Array.from(BASES).flatMap((base) =>
  STYLES.map((style) => ({
    base, style,
    name: `${base.name}-${style.name}`,
    title: `${base.title} ${style.title}`,
  }))
)
```

and exports installable JSON to `public/r/styles/<style>/…` for each combination plus the legacy styles (the script's own header: "Export public/r/* for every style through the shadcn CLI"). So `ui.shadcn.com/r/styles/base-vega/dialog.json` and `…/styles/new-york-v4/dialog.json` are **statically pre-built per style**, and the style dir name carries the base.

Live confirmation (2026-07-12): [`styles/base-vega/dialog.json`](https://ui.shadcn.com/r/styles/base-vega/dialog.json) imports `@base-ui/react/dialog`; [`styles/new-york-v4/dialog.json`](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json) imports `radix-ui` and declares `dependencies: ["radix-ui"]`. (Note: the base-vega item declares no npm `dependencies` — `@base-ui/react` is carried by the base's `registry:style`/`registry:base` item installed at init.)

### Selection: bare names go to `@shadcn` with the consumer's style

The built-in registry template is the only routing rule ([constants.ts L43–L45](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/constants.ts#L43-L45)):

```ts
export const BUILTIN_REGISTRIES: z.infer<typeof registryConfigSchema> = {
  "@shadcn": `${REGISTRY_URL}/styles/{style}/{name}.json`,
}
```

A bare item string (no `@`, not a URL/file/github ref) is defaulted to `@shadcn` in [builder.ts L30–L40](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L30-L40) (`registry = "@shadcn"`), and the direct fetch path builds the same URL by hand — [resolver.ts L120](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L120):

```ts
const path = `styles/${config?.style ?? "new-york-v4"}/${item}.json`
```

That is the entire base-selection mechanism: **the consumer's style string, applied to the official per-style tree.** A `base-nova` project asking for `dialog` gets the Base UI dialog; a `new-york-v4` project gets the Radix one.

### Is the same mechanism available to a third-party registry?

- **`{style}` expansion: yes.** Any registry configured in `components.json` (or via the directory) gets the identical `{style}` substitution ([builder.ts L58–L82](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L58-L82)). A third party that serves `/r/styles/base-vega/x.json`, `/r/styles/new-york-v4/x.json`, … and registers `https://example.com/r/styles/{style}/{name}.json` rides the exact official mechanism.
- **Bare-name redirection: no.** Bare `registryDependencies` always resolve to `@shadcn`; user config cannot override it — [get-config.ts L206–L213](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/utils/get-config.ts#L206-L213) throws `"@shadcn" is a built-in registry and cannot be overridden.` (The only escape hatch is the `REGISTRY_URL` env var, [constants.ts L4–L5](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/constants.ts#L4-L5), which repoints the whole official registry — an env-level tool, not a per-registry option.)
- Third-party items **can** pin deps to their own namespace (`@responsivecn/foo`) or to absolute URLs in `registryDependencies` — namespaced deps go through the same template machinery ([resolver.ts L461–L493](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L461-L493)).

The caveat of relying on `{style}`: the style-string space is open-ended. Custom `registry:base` items can define arbitrary style names, so a `{style}` registry must be prepared for strings beyond the 16 official presets + 3 legacy values; the CLI's own `getBase` prefix heuristic (`base-*` → base, else radix) is the sanctioned discriminator.

## 3. Observed conventions among directory-listed registries

From the live directory output [`https://ui.shadcn.com/r/registries.json`](https://ui.shadcn.com/r/registries.json) (fetched 2026-07-12): **234 registries; only 4 use `{style}`** in their URL template:

| Registry | Template |
|---|---|
| `@diceui` | `https://diceui.com/r/{style}/{name}.json` |
| `@react-easy-modals` | `https://react-easy-modals-docs.vercel.app/r/styles/{style}/{name}.json` |
| `@reui` | `https://reui.io/r/{style}/{name}.json` |
| `@shadcn-studio` | `https://shadcnstudio.com/r/{style}/{name}.json` |

Probing diceui (2026-07-12): `…/r/new-york-v4/sortable.json` → 200, `…/r/default/sortable.json` → 200, `…/r/base-vega/sortable.json` → **404**. The `{style}` users predate the bases feature and serve the **legacy style axis only** — none observed serving `base-*` strings.

The dual-base registries observed use two other conventions:

- **Base encoded in the item name, single namespace** — [animate-ui](https://animate-ui.com/r/registry.json) (580 items, fetched 2026-07-12): parallel items `components-base-dialog` / `components-radix-dialog`, `components-base-accordion` / `components-radix-accordion`, …, plain `{name}` template. The consumer picks the base by picking the item name.
- **Separate registry per base** — [basecn](https://basecn.dev/r/registry.json) (56 items, fetched 2026-07-12) is a Base UI port of shadcn/ui under its own `@basecn` namespace with bare item names (`dialog`, `accordion`); the Radix counterpart is `@shadcn` itself. The base axis is the namespace.

**No directory registry was observed actually routing the new `base-*`/`radix-*` style strings through `{style}`** as of 2026-07-12 — the official registry is the only live implementation of that mechanism.

## 4. Impact on the flat catalog and the directory entry

**The catalog is fetched through the same URL template.** `getRegistry("@ns")` appends `/registry` to the namespace and resolves it like any item — [api.ts L69–L92](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/api.ts#L69-L92) (`registryName = "@ns/registry"` → `buildUrlAndHeadersForRegistryItem`). Consequences:

- Plain `{name}` template → one flat catalog at `/r/registry.json`, fetched identically for every consumer regardless of base. Base-ui-only, name-suffixed, or per-namespace registries keep the standard single catalog ([registry-json docs](https://ui.shadcn.com/docs/registry/registry-json), flat-catalog requirement per the [directory requirements](https://ui.shadcn.com/docs/registry/registry-index)).
- `{style}` template → the catalog URL itself becomes per-style (`/r/styles/{style}/registry.json`). The official registry does exactly this: `https://ui.shadcn.com/r/registry.json` → **404**, while [`/r/styles/base-vega/registry.json`](https://ui.shadcn.com/r/styles/base-vega/registry.json) (212 items) and [`/r/styles/new-york-v4/registry.json`](https://ui.shadcn.com/r/styles/new-york-v4/registry.json) (471 items) both serve full catalogs (fetched 2026-07-12). A `{style}` registry must therefore serve a catalog **per style string**, not one flat file.
- Item names must be unique **within** a catalog — `shadcn registry validate` enforces "each name is unique across the resolved registry" ([validate.ts L340–L352](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/validate.ts#L340-L352)). Same-named items across two per-style catalogs are fine (official does it); duplicate names inside one flat catalog are not, so the single-catalog conventions need distinct item names per base.

**Can one directory entry route two bases?** Mechanically yes, but only via `{style}`: the [directory entry](https://ui.shadcn.com/docs/registry/registry-index) is a single object with one `url` template (`name`, `homepage`, `url`, `description`, `logo`), and the live [registries.json](https://ui.shadcn.com/r/registries.json) entries carry exactly one template each. There is no per-base URL field, so the base can only vary through what `{style}` (or `{name}`) expands to. With a plain `{name}` template, one entry routes two bases only by encoding the base in item names (animate-ui) — otherwise it's two directory entries/namespaces (basecn).

## 5. What a Radix project receives from a base-only item today

Trace for `npx shadcn add @responsivecn/dialog-drawer` in a legacy Radix project (`style: "new-york-v4"`), all steps at commit `3cdaa6e`:

1. **The item itself** is fetched from the namespace template with `{name}` (and `{style}` if present — expanding to `new-york-v4`): [builder.ts L58–L82](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L58-L82) via [resolver.ts L110–L118](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L110-L118). A base-only registry serves its only variant: files typed against `@base-ui/react`.
2. **`files[].content` is written verbatim** (after path/alias transforms — none touch imports of npm packages), and **`dependencies` are installed as declared** — so `@base-ui/react` lands in the Radix project's `package.json` alongside `radix-ui`.
3. **Bare `registryDependencies`** (`dialog`, `drawer`, `use-mobile`) default to `@shadcn` ([builder.ts L39](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/builder.ts#L39)) and resolve to `styles/new-york-v4/dialog.json` etc. ([resolver.ts L120](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L120), [L546–L551](https://github.com/shadcn-ui/ui/blob/3cdaa6eb2f0da27aca8598cb752c32d840e06940/packages/shadcn/src/registry/resolver.ts#L546-L551)) — live: [that URL](https://ui.shadcn.com/r/styles/new-york-v4/dialog.json) is the **Radix** dialog wrapper (`import { Dialog as DialogPrimitive } from "radix-ui"`).
4. **No base guard fires.** `getBase` is referenced only in `commands/info.ts`, `commands/apply.ts`, and `commands/docs.ts` (verified by grep over `packages/shadcn/src` at the pinned commit); nothing in `commands/add.ts`, the preflights, or the resolver compares the item's base to the project's. The install succeeds silently.

Net result, confirming the observed failure mode: a Radix project gets shadcn **Radix** wrappers for `dialog`/`drawer`, plus a component whose own code imports `@base-ui/react` — parts render both primitive stacks, and the `<base>` package is added to a project that didn't have it. The mismatch only surfaces as a runtime/UX inconsistency, not as a CLI error.

## Open questions / caveats

- **Docs lag the code.** The [components.json docs](https://ui.shadcn.com/docs/components-json) don't yet document `base-*`/`radix-*` style values (page has no mention of Base UI or the base axis, checked 2026-07-12), and the legacy [`/r/styles/index.json`](https://ui.shadcn.com/r/styles/index.json) still lists only `new-york`/`default`. The mechanism above is established from code + live endpoints, not from a docs page — re-verify before building, the surface is moving.
- **Style strings are open-ended.** Custom presets/`registry:base` items may write style values outside the 16 official combos; a `{style}`-templated registry must decide how to respond to unknown style strings (the `getBase` prefix heuristic + a fallback per base is the obvious mapping). No official guidance exists for third parties on this.
- **`registry:base`/preset internals** (`/init` endpoint parameters, `resolveRegistryBaseConfig`) were only traced far enough to establish what `style` string lands in `components.json`; the full init pipeline is out of scope here.
- Live-endpoint claims (registries.json counts, animate-ui/basecn/diceui catalogs, per-style catalogs, init response) are snapshots of 2026-07-12 and can drift.
