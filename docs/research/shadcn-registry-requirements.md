# shadcn Registry Requirements — Serving, Directory Acceptance, Namespaces

Research date: **2026-07-12**. All claims verified against primary sources only: the live schemas and docs on ui.shadcn.com, and the `shadcn-ui/ui` repository at commit [`3cdaa6e`](https://github.com/shadcn-ui/ui/commit/3cdaa6eb2f0da27aca8598cb752c32d840e06940) (tip of `main`, last pushed 2026-07-10; CLI package version `4.13.0` per [`packages/shadcn/package.json`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/package.json)).

---

## TL;DR

- A registry item only *requires* `name` + `type`; `files[].target` is required only for `registry:page` / `registry:file`. Two new item types exist since 2025: `registry:base` and `registry:font`. ([schema](https://ui.shadcn.com/schema/registry-item.json))
- A valid registry = item JSON at per-item URLs **plus** a flattened catalog (`registry.json` content) served at the reserved item name `registry` (e.g. `/r/registry.json`). The catalog powers `search`, `list` and MCP; `add <url>` never touches it. ([getting-started](https://ui.shadcn.com/docs/registry/getting-started), [api.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/api.ts))
- The CLI sends `GET` with `Accept: application/vnd.shadcn.v1+json, application/json;q=0.9` and `User-Agent: shadcn`, follows redirects (native fetch default), never checks the success Content-Type, and just requires the body to parse as JSON matching the item schema. URLs do **not** need to end in `.json`. CORS is irrelevant to the CLI (Node). ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts))
- Directory acceptance = a PR adding one JSON object (`name`, `homepage`, `url` with `{name}`, `description`, `logo` SVG) to [`apps/v4/registry/directory.json`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json). Requirements: open source, publicly accessible, flat registry, catalog without `files[].content`. ([registry-index](https://ui.shadcn.com/docs/registry/registry-index))
- Namespaces are **decentralized client-side aliases** in `components.json` — no central registration needed. But being listed in the directory makes `@yourns/...` work for every CLI user with zero config: the CLI fetches `https://ui.shadcn.com/r/registries.json` and auto-writes the mapping into the user's `components.json`. ([namespace docs](https://ui.shadcn.com/docs/registry/namespace), [registries.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/registries.ts))

---

## 1. `registry-item.json` schema (current)

Live schema: [https://ui.shadcn.com/schema/registry-item.json](https://ui.shadcn.com/schema/registry-item.json) (fetched 2026-07-12). Docs page: [https://ui.shadcn.com/docs/registry/registry-item-json](https://ui.shadcn.com/docs/registry/registry-item-json). Source of truth in repo: [`apps/v4/public/schema/registry-item.json`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/public/schema/registry-item.json) and the zod mirror in [`packages/shadcn/src/registry/schema.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts) (the zod file carries the comment "if you edit the schema here, you must also edit the schema in the apps/v4/public/schema/registry-item.json file").

### Required fields

Only two: `"required": ["name", "type"]`, plus conditionally `font` when `type` is `registry:font` (`allOf` if/then in the schema). Everything else — `title`, `description`, `files`, etc. — is optional at the schema level. ([schema](https://ui.shadcn.com/schema/registry-item.json))
Note: the [getting-started guidelines](https://ui.shadcn.com/docs/registry/getting-started) say that *for blocks* "the following properties are required: `name`, `description`, `type` and `files`" — a docs-level convention, not a schema constraint.

### Item types (complete current enum)

From the schema's `type` enum ([source](https://ui.shadcn.com/schema/registry-item.json)), with the purpose wording from the [docs page](https://ui.shadcn.com/docs/registry/registry-item-json):

| Type | Purpose |
|---|---|
| `registry:base` | entire design systems (**new**; carries `style`, `iconLibrary`, `baseColor`, `theme` fields, valid only on this type) |
| `registry:style` | registry styles (e.g. `new-york`); may use `extends` (set `"none"` to start fresh) |
| `registry:theme` | themes |
| `registry:block` | complex multi-file components |
| `registry:component` | simple components |
| `registry:ui` | UI components and single-file primitives |
| `registry:lib` | lib and utils |
| `registry:hook` | hooks |
| `registry:page` | page or file-based routes (`target` required) |
| `registry:file` | miscellaneous files (`target` required) |
| `registry:font` | fonts (**new**; requires the `font` object: `family`, `provider` — only `"google"` supported —, `import`, `variable`, optional `weight`/`subsets`/`selector`/`dependency`) |
| `registry:item` | universal registry items |

### `files` array

Each entry: `path` (relative to registry root — or to the declaring `registry.json` when using `include`), `type` (same enum minus `registry:font`), optional `content`, optional `target`. The JSON schema enforces via `if/then`: **`target` is required exactly when the file `type` is `registry:file` or `registry:page`**; otherwise only `path` + `type` are required. ([schema](https://ui.shadcn.com/schema/registry-item.json), [docs](https://ui.shadcn.com/docs/registry/registry-item-json): "The `target` property is required for `registry:page` and `registry:file` types.")

`target` supports placeholders `@components/`, `@ui/`, `@lib/`, `@hooks/` "which resolve to the corresponding aliases configured in components.json" ([schema description](https://ui.shadcn.com/schema/registry-item.json)), and `~/` for the project root, e.g. `"target": "~/hello.config.ts"` ([FAQ](https://ui.shadcn.com/docs/registry/faq)).

### `dependencies` / `devDependencies` (npm)

Arrays of npm specifiers; pin versions with `name@version`, e.g. `"zod@^3.20.0"` ([docs](https://ui.shadcn.com/docs/registry/registry-item-json): `["@radix-ui/react-accordion", "zod", "lucide-react", "name@1.0.2"]`; [getting-started guidelines](https://ui.shadcn.com/docs/registry/getting-started)).

**Base UI example:** a Base UI dependency is declared as a plain npm specifier in `dependencies`. shadcn's own base styles declare `dependencies: ["class-variance-authority", "lucide-react", "@base-ui/react"]` — note the official registry now uses the renamed **`@base-ui/react`** package, not the older `@base-ui-components/react` ([apps/v4/registry/bases/base/registry.ts, line 17](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/registry.ts)). If your components import `@base-ui-components/react`, you would declare exactly that string (optionally `@base-ui-components/react@<version>`); the CLI treats scoped packages correctly (keeps the first two path segments, [utils.ts `getDependencyFromModuleSpecifier`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/utils.ts)).

### `registryDependencies` (item addresses)

"Each entry is an item address" — five forms ([docs](https://ui.shadcn.com/docs/registry/registry-item-json)):

1. Bare name → the built-in shadcn/ui item: `"button"`. "Bare names keep their existing behavior. `button` means the built-in shadcn `button` item, not an item from the same GitHub repository."
2. Namespaced: `"@acme/input-form"`.
3. GitHub address: `"owner/repo/item"`, optionally pinned `"acme/ui/button#v1.2.0"` — "For published registries, prefer a tag or full commit SHA". "Refs are not inherited across dependencies."
4. Full URL: `"https://example.com/r/editor.json"`.
5. Local file: `"./editor.json"`.

Resolution is recursive with topological sort, file dedup by target ("last one wins"), and deep-merge of `tailwind`/`cssVars`/`css`/`envVars` ([namespace docs, Dependency Resolution](https://ui.shadcn.com/docs/registry/namespace); implementation: [resolver.ts `resolveRegistryTree`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/resolver.ts)).

### Other fields

All from the [live schema](https://ui.shadcn.com/schema/registry-item.json) + [docs](https://ui.shadcn.com/docs/registry/registry-item-json):

- `cssVars`: `{ theme, light, dark }` maps, merged into the project CSS. `cssVars.theme` is "For Tailwind v4 projects only."
- `css`: arbitrary nested CSS (at-rules, selectors, `@layer`, `@keyframes`, `@utility`, `@plugin`; empty objects allowed for body-less at-rules).
- `tailwind` (`tailwind.config` with `content`/`theme`/`plugins`): legacy Tailwind v3 mechanism — "Use cssVars for Tailwind v4 projects." The docs mark it deprecated.
- `envVars`: key–value pairs written to the project `.env`; "Existing variables are not overwritten" ([docs](https://ui.shadcn.com/docs/registry/registry-item-json)).
- `docs`: markdown string shown to the user on install.
- `categories`: string array (e.g. `["sidebar", "dashboard"]`).
- `meta`: arbitrary key–value metadata.
- `author`: "Recommended format: username <url>".
- `title` / `description`: human-readable metadata; "recommended … helps LLMs understand the component" ([getting-started](https://ui.shadcn.com/docs/registry/getting-started)).
- `extends`: `registry:style` only; `style`, `iconLibrary`, `baseColor`, `theme`: `registry:base` only; `font`: `registry:font` only (all enforced by `allOf` conditionals in the schema).

---

## 2. Root `registry.json`

Live schema: [https://ui.shadcn.com/schema/registry.json](https://ui.shadcn.com/schema/registry.json) (fetched 2026-07-12). Docs: [https://ui.shadcn.com/docs/registry/registry-json](https://ui.shadcn.com/docs/registry/registry-json).

- Fields: `name` and `homepage` — "Required when this file is used as the root registry, optional for included registry chunks" (schema descriptions); `items` — array of objects `$ref`-ing the registry-item schema; **`include`** — "An array of relative paths to registry.json files to include in this registry" (newer composition feature). Schema-level requirement: `anyOf: [{required:["items"]}, {required:["include"]}]` — at least one of the two. ([schema](https://ui.shadcn.com/schema/registry.json))
- "Registry item names must be unique across the resolved registry, including all included files"; with `include`, item `path`s are relative to the declaring `registry.json` and the output is flattened ([registry-json docs](https://ui.shadcn.com/docs/registry/registry-json), [getting-started](https://ui.shadcn.com/docs/registry/getting-started)).
- Serving options ([getting-started](https://ui.shadcn.com/docs/registry/getting-started)):
  - **Static:** `npx shadcn@latest build` generates per-item JSON in `public/r/` (`public/r/button.json`; `--output` to change), and resolves `include` into a flattened `registry.json` ("The generated `registry.json` does not contain `include`"). CLI command: [`packages/shadcn/src/commands/build.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/commands/build.ts) (`argument "[registry]" path to registry.json file, default ./registry.json`).
  - **Dynamic:** import `loadRegistry` / `loadRegistryItem` from `shadcn/registry` in route handlers; "Both loaders resolve `include` before returning JSON". API surface documented at [api-reference](https://ui.shadcn.com/docs/registry/api-reference).
- **How the CLI resolves `registry.json` vs item URLs:** `add`/`view` fetch *item* URLs directly and validate each response against the *item* schema — the catalog is never consulted for installs ([resolver.ts `fetchRegistryItems`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/resolver.ts)). `search`/`list`/MCP fetch the **catalog** by requesting the reserved item name `registry` through the namespace template: `getRegistry()` appends `/registry` to the namespace, so `@acme` with template `https://acme.com/r/{name}.json` resolves the catalog at `https://acme.com/r/registry.json` ([api.ts `getRegistry`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/api.ts); [MCP docs](https://ui.shadcn.com/docs/registry/mcp): "Make sure you have a registry item file at the root of your registry named `registry`").
- **The served catalog must be flattened:** the CLI throws if a fetched catalog contains `include` — "consumer registry endpoints must serve a resolved registry catalog. Run `npx shadcn build` and serve the built registry.json, or use loadRegistry() in a dynamic route" ([api.ts `parseRegistryCatalog`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/api.ts)).
- There is also a `registry validate` subcommand ("validate a shadcn registry", [`commands/registry/validate.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/commands/registry/validate.ts)) and documented local testing flows: `list`/`search <catalog-url>`, `view`/`add <item-url>` ([getting-started, "Test your registry"](https://ui.shadcn.com/docs/registry/getting-started)).

---

## 3. What `shadcn add <url>` actually expects

Primary source: [`packages/shadcn/src/registry/fetcher.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts) (`fetchRegistry`), [`proxy.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/proxy.ts), [`builder.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts), [`resolver.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/resolver.ts), [`utils.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/utils.ts), at commit `3cdaa6e`.

- **HTTP method:** plain `fetch(url, { headers })` — no `method` set, so `GET` ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts) via [proxy.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/proxy.ts)).
- **Request headers:** always `Accept: application/vnd.shadcn.v1+json, application/json;q=0.9` and `User-Agent: shadcn`; namespace-configured headers are layered on top ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts)). These two headers are officially documented for content negotiation, letting you serve HTML to browsers and JSON to the CLI from the same URL — including the domain root ([getting-started, "Content negotiation"](https://ui.shadcn.com/docs/registry/getting-started)).
- **Redirects:** no `redirect` option is passed, so Node's native fetch default (`redirect: "follow"`) applies — redirects are followed ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts), [proxy.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/proxy.ts); the code sets only `headers` and a proxy `dispatcher`).
- **Content-Type:** *not checked on success.* The code goes straight to `response.json()`; the `content-type` header is only inspected on **error** responses to decide whether to parse a structured error body. So you may serve `text/plain` if the body is valid JSON — but the body must parse as JSON and then validate against `registryItemSchema` (zod), else a `RegistryParseError` ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts), [resolver.ts `fetchRegistryItems`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/resolver.ts)).
- **Error handling:** non-OK statuses map to typed errors — 401 `RegistryUnauthorizedError`, 403 `RegistryForbiddenError`, 404 `RegistryNotFoundError`, 410 `RegistryGoneError`, anything else `RegistryFetchError`. If the error response is JSON, the CLI extracts a human message supporting **RFC 7807** (`detail`, `title`) and plain `message`/`error` fields ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts)). The exact CLI error strings for 401/403/404 are documented in [namespace docs, Error Handling](https://ui.shadcn.com/docs/registry/namespace).
- **URL shape:** anything `new URL()` accepts is treated as a URL (`isUrl`, [utils.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/utils.ts)) — **the URL does not need to end in `.json`**. One special case: URLs whose path contains `/chat/b/` (v0) get `/json` appended if missing ([builder.ts `resolveRegistryUrl`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts)). Local *file* arguments, by contrast, must end in `.json` (`isLocalFile`, [utils.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/utils.ts)).
- **Query strings:** preserved as-is (URL is normalized via `new URL(...).toString()`). For namespaces, configured `params` are appended with `?` or `&` depending on whether the template already has a query, and `${ENV_VAR}` placeholders are expanded in URLs, headers and params; headers whose env vars expand to empty are dropped ([builder.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts)).
- **Auth:** only via the namespace config (`headers` / `params` objects in `components.json`) — a bare URL argument gets no extra headers. Missing env vars referenced in a registry config produce `RegistryMissingEnvironmentVariablesError` before any fetch ([validator.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/validator.ts); [namespace docs, Authentication](https://ui.shadcn.com/docs/registry/namespace)).
- **Caching:** an in-memory, per-process `Map<url, Promise>` (`registryCache`) so each URL is fetched once per CLI run when `useCache: true`; no on-disk/persistent cache ([fetcher.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/fetcher.ts)).
- **Proxy:** honors `http_proxy`/`https_proxy`/`no_proxy` env vars via undici `EnvHttpProxyAgent` ([proxy.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/proxy.ts)).
- **CORS:** irrelevant to the CLI — it is a Node process, and nothing in the fetch path involves CORS. No shadcn doc imposes a CORS requirement (grep over all registry docs found zero mentions). Browser-adjacent flows exist but go through servers: "Open in v0" hands your item URL to `https://v0.dev/chat/api/open?url=[URL]`, requiring only that the item is "hosted and publicly accessible via a URL"; note "Open in v0 does not support cssVars, css, envVars, namespaced registries, or advanced authentication methods" ([open-in-v0 docs](https://ui.shadcn.com/docs/registry/open-in-v0)).

---

## 4. Official directory acceptance

**Current state (verified live 2026-07-12):** the Registry Directory is a docs page at [https://ui.shadcn.com/docs/directory](https://ui.shadcn.com/docs/directory) (HTTP 200) backed by a machine-readable index at [https://ui.shadcn.com/r/registries.json](https://ui.shadcn.com/r/registries.json) (currently **234 entries**). It was launched 2025-10-28: "We just published the Registry Directory … Built into the CLI. No config required." ([changelog source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/changelog/2025-10-registry-directory.mdx)).

### The file a PR must modify

[`apps/v4/registry/directory.json`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json) on `main`. The public `https://ui.shadcn.com/r/registries.json` endpoint is generated from it, stripping `logo` ([apps/v4/app/r/registries.json/route.ts](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/r/registries.json/route.ts)). Submission process, verbatim from [registry-index docs](https://ui.shadcn.com/docs/registry/registry-index):

1. Add your registry to `apps/v4/registry/directory.json`
2. Run `pnpm validate:registries`
3. Create a pull request to https://github.com/shadcn-ui/ui — "Once you have submitted your request, it will be validated and reviewed by the team."

### Entry fields

Validated by [`apps/v4/scripts/validate-registries.mts`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/scripts/validate-registries.mts):

- `name`: must match `^@[a-zA-Z0-9][a-zA-Z0-9-_]*$` (e.g. `@responsivecn`)
- `homepage`: valid URL
- `url`: template that **must include the `{name}` placeholder** (e.g. `https://responsivecn.dev/r/{name}.json`)
- `description`: string
- `logo`: string — in practice an inline SVG using `var(--foreground)`/`var(--background)` for theming (every one of the 234 entries has one; directory-only, not served in `registries.json`)
- (`author` appears on 2 entries as an extra, unvalidated field)

### Stated quality criteria

From [registry-index docs, "Requirements"](https://ui.shadcn.com/docs/registry/registry-index):

1. "The registry must be open source and publicly accessible."
2. "The registry must be a valid JSON file that conforms to the registry schema specification."
3. "The registry is expected to be a flat registry with no nested items i.e `/registry.json` and `/component-name.json` files are expected to be in the root of the registry."
4. "The `files` array, if present, must NOT include a `content` property." (i.e. the served catalog must not inline file contents)

CI enforcement: the [`Validate Registries` workflow](https://github.com/shadcn-ui/ui/blob/main/.github/workflows/validate-registries.yml) runs on every PR touching `directory.json` and additionally **blocks reserved namespaces**: `@shadcn, @ui, @blocks, @components, @block, @component, @util, @utils, @registry, @lib, @hook, @hooks, @theme, @themes, @chart, @charts`.

Also worth knowing: "You do not need to submit a public GitHub registry to the registry directory to use it with `owner/repo/item` addresses. The registry directory is for namespaces such as `@acme`." ([registry-index docs](https://ui.shadcn.com/docs/registry/registry-index))

### Example merged PRs (each diff touches only `apps/v4/registry/directory.json` — verified via `gh pr view --json files`)

- [#11114](https://github.com/shadcn-ui/ui/pull/11114) — "feat(registry): add @threecn to registry directory", merged 2026-07-09
- [#11090](https://github.com/shadcn-ui/ui/pull/11090) — "feat(registry): add @mozaika to the registry directory", merged 2026-07-06
- [#10989](https://github.com/shadcn-ui/ui/pull/10989) — "feat(registry): add @7ovr to registry directory", merged 2026-06-23

Housekeeping PRs show ongoing curation: [#10912](https://github.com/shadcn-ui/ui/pull/10912) removed 10 duplicate entries; [#10836](https://github.com/shadcn-ui/ui/pull/10836) sorted entries by name; [#10781](https://github.com/shadcn-ui/ui/pull/10781) "serve registries from directory" (the route.ts mechanism). A legacy snapshot exists at `apps/v4/public/r/registries-legacy.json`.

---

## 5. Namespace constraints

Docs: [https://ui.shadcn.com/docs/registry/namespace](https://ui.shadcn.com/docs/registry/namespace). Code: [`parser.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/parser.ts), [`builder.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts), [`constants.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts), [`schema.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts), [`utils/registries.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/registries.ts).

- **Configuration lives in `components.json`** under `registries`: either a URL template string or `{ url, headers?, params? }`. The URL **must contain `{name}`** (zod refinement: "Registry URL must include {name} placeholder") and keys must start with `@` ([schema.ts `registryConfigItemSchema`/`registryConfigSchema`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts)). `{style}` is an optional second placeholder replaced with the project's configured style ([builder.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts); [namespace docs, URL Pattern System](https://ui.shadcn.com/docs/registry/namespace)). `${ENV_VAR}` expansion works in url/headers/params ([namespace docs](https://ui.shadcn.com/docs/registry/namespace)).
- **Name grammar:** `/^(@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?)\/(.+)$/` — starts with `@`, alphanumeric plus hyphens/underscores ([parser.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/parser.ts); same pattern quoted in the [namespace docs, Technical Details](https://ui.shadcn.com/docs/registry/namespace)).
- **Purely decentralized — no central registration required:** "We intentionally designed the namespace system to be decentralized. There is a central open source registry index for open source namespaces but you are free to create and use any namespace you want. … No naming conflicts: Since there's no central authority, you don't need to worry about namespace collisions" ([namespace docs](https://ui.shadcn.com/docs/registry/namespace)). A namespace in one user's `components.json` is just a local alias.
- **Built-in registry:** only `@shadcn` is built in, resolving to `https://ui.shadcn.com/r/styles/{style}/{name}.json` (overridable via the `REGISTRY_URL` env var) ([constants.ts `BUILTIN_REGISTRIES`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts)). An unconfigured, unlisted namespace yields: `Unknown registry "@x". Make sure it is defined in components.json …` ([namespace docs, Error Handling](https://ui.shadcn.com/docs/registry/namespace)).
- **How the directory interacts with namespaces — yes, listing grants global resolution:** on `add`/`search`/`init`, the CLI discovers namespaces used by the requested items (including transitive `registryDependencies`, via [`namespaces.ts resolveRegistryNamespaces`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/namespaces.ts)); for any namespace missing from the local config it fetches the index at `${REGISTRY_URL}/registries.json` = `https://ui.shadcn.com/r/registries.json` ([api.ts `getRegistries`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/api.ts)), and if found, **writes the `name → url` mapping into the user's `components.json`** ([utils/registries.ts `ensureRegistriesInConfig`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/registries.ts); wired into `add`/`init`/`search` commands). Docs confirm: "When you run `shadcn add` or `shadcn search`, the CLI will automatically check the registry index for the registry you are looking for and add it to your `components.json` file" ([registry-index](https://ui.shadcn.com/docs/registry/registry-index)); "These registries are built into the CLI with no additional configuration required" ([directory page](https://ui.shadcn.com/docs/directory)). So once `@responsivecn` is merged into `directory.json`, `npx shadcn add @responsivecn/dialog-drawer` works for every user with zero setup.
- **Manual setup command:** `npx shadcn@latest registry add @acme=https://acme.com/r/{name}.json` ([getting-started](https://ui.shadcn.com/docs/registry/getting-started); [`commands/registry/add.ts`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/commands/registry/add.ts): "registries (@namespace) or registry URLs (@namespace=url)").
- **Namespace vs GitHub address:** "Use a GitHub address when the registry is a public GitHub repository and you want users to install without configuring components.json. … Use a namespace when you want a stable alias, custom hosting, authentication, request headers, query parameters or private registry support." ([namespace docs](https://ui.shadcn.com/docs/registry/namespace); GitHub registries: add `registry.json` to the repo root, install with `npx shadcn add <owner>/<repo>/<item>` — [github docs](https://ui.shadcn.com/docs/registry/github)).
- **Namespace obligations for full CLI support:** item JSON at `{name}` positions, plus a flattened catalog reachable at item name `registry` (for `search`/`list`/MCP) — see section 2 ([api.ts `getRegistry`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/api.ts), [MCP docs](https://ui.shadcn.com/docs/registry/mcp)).

---

## Confidence & gaps

High confidence — everything above traces to the live schemas, live docs, repo code at commit `3cdaa6e`, or `gh`-verified PR metadata. Remaining gaps / caveats:

1. **Redirect-following** is inferred from the absence of a `redirect` option in `fetchWithProxy` plus the WHATWG-fetch default (`follow`, max 20 hops in undici/Node). No shadcn doc or test states redirect policy explicitly.
2. **Review criteria beyond the documented four requirements** (e.g. subjective quality bars, rejection patterns) could not be verified: there is no PR template for directory additions in `.github/`, and I did not find written review-comment policy in the repo. The docs only say submissions "will be validated and reviewed by the team" ([registry-index](https://ui.shadcn.com/docs/registry/registry-index)). Reviewing rejected/closed PRs would be needed to characterize unwritten standards.
3. **`@shadcn` override behavior:** [constants.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/constants.ts) comments that built-in registries "cannot be overridden", but in [builder.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/builder.ts) user config is spread *after* `BUILTIN_REGISTRIES` (`{ ...BUILTIN_REGISTRIES, ...config?.registries }`), which would let a user-defined `@shadcn` win. I did not find code enforcing the comment; treat the comment as intent, not verified behavior.
4. **Directory review SLA / listing latency** (how long until a merged entry is live on ui.shadcn.com) is deployment-dependent; the route is `force-static`, so it updates on the next site deploy ([route.ts](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/r/registries.json/route.ts)).
5. The WebFetch summary of the registry-item docs page was cross-checked against the raw schema and the MDX source in the repo ([apps/v4/content/docs/registry/registry-item-json.mdx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/registry/registry-item-json.mdx)); wording quoted here comes from the MDX/schema, not the summary.
6. **`registries.json` schema tolerance:** the CLI-side zod schema for the index ([schema.ts `registriesSchema`](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts)) requires only `name` + `url` (homepage/description optional) — looser than the directory validation script; not a constraint on submitters.
