# fumadocs + TanStack Start on Cloudflare Workers — Deployment, Static Registry Serving, Scaffold Paths

Research date: **2026-07-12**. All claims verified against primary sources only: live docs on [tanstack.com](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [developers.cloudflare.com](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) and [fumadocs.dev](https://fumadocs.dev/docs/manual-installation/tanstack-start); the `fuma-nama/fumadocs` repo at commit [`cf452dc`](https://github.com/fuma-nama/fumadocs/commit/cf452dc78b950ac2026e9101d461cb1e7782d455) (tip of `main`, 2026-07-11); and **two scaffolds actually run + built + served locally under workerd**: `create-fumadocs-app@16.1.3 --template tanstack-start` (→ fumadocs-core/ui `16.11.3`, fumadocs-mdx `15.1.0`, `@tanstack/react-start` `1.168.27`, vite `8.1.3`) and `pnpm dlx shadcn@latest init --preset b0 --template start` (shadcn CLI `4.13.0` → `@tanstack/react-start` `1.168.27` resolved from `latest`, vite `8.1.4`, `@base-ui/react` `1.6.0`). Both were wired to Cloudflare with `@cloudflare/vite-plugin` `1.44.0` + `wrangler` `4.110.0` and exercised via `vite dev`, `vite preview` and `wrangler dev` (workerd), with curl probes on every relevant endpoint. Not exercised: an actual production deploy to Cloudflare (no account action taken).

---

## TL;DR

- **Official CF path = `@cloudflare/vite-plugin` before `tanstackStart()` in vite plugins, plus a 5-line `wrangler.jsonc`** (`main: "@tanstack/react-start/server-entry"`, `compatibility_flags: ["nodejs_compat"]`). No nitro, no "preset/target" option on the Start plugin. ([TanStack hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [CF framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/))
- **fumadocs officially supports TanStack Start**: MDX compiles at build time via `fumadocs-mdx/vite`, UI has a dedicated `fumadocs-ui/provider/tanstack`, search is a normal Start server route running Orama in the Worker. Verified working on workerd (docs SSR, search, `.md` endpoints, prerender). ([manual install](https://fumadocs.dev/docs/manual-installation/tanstack-start), scaffold run)
- The "Fumadocs doesn't work on Edge runtime" warning is **Next.js-specific** (its Edge runtime; the fix is OpenNext). On Workers with `nodejs_compat` fumadocs demonstrably runs; fumadocs v16 even switched Shiki to the JS regex engine "To ensure seamless compatibility with environments like Cloudflare Workers". ([deploying/index.mdx@cf452dc](https://github.com/fuma-nama/fumadocs/blob/cf452dc78b950ac2026e9101d461cb1e7782d455/apps/docs/content/docs/%28framework%29/deploying/index.mdx), [v16 blog@cf452dc](https://github.com/fuma-nama/fumadocs/blob/cf452dc78b950ac2026e9101d461cb1e7782d455/apps/docs/content/blog/v16.mdx))
- **`public/` → `dist/client` → served assets-first**: verified `GET /r/dialog-drawer.json` → `200`, `content-type: application/json`, `etag`, `cache-control: public, max-age=0, must-revalidate` — the Worker is not invoked. Verified `GET /r/nope.json` → **HTTP `404`** (falls through to the SSR Worker, TanStack renders not-found *with a 404 status*), which is exactly what the shadcn CLI maps to `RegistryNotFoundError`. ([routing docs](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/), curl probes)
- **Neither scaffold ships Cloudflare config.** The fumadocs tanstack template ships `nitro({ preset: 'vercel' })` (Nitro v3 beta) which must be replaced; the shadcn `start` template ships nothing deploy-related. The CF wiring is the same 3 small changes in both cases (scaffold runs).
- **Both scaffolds converge on the same stack**: TanStack Start 1.168.x + Vite 8 + Tailwind v4 + **Base UI** (shadcn preset `b0` = style `nova` on `@base-ui/react`; the fumadocs template aliases `fumadocs-ui` → `@fumadocs/base-ui`, "the Base UI version of Fumadocs UI"). Grafting fumadocs onto the shadcn app is additive: ~7 files, no structural conflicts, and `fumadocs-ui/css/shadcn.css` maps fumadocs' namespaced `--color-fd-*` tokens onto shadcn's `--background`/`--sidebar-*` variables. ([component-library docs](https://fumadocs.dev/docs/ui/component-library), package inspection)
- Workers limits that matter: worker bundle **3 MB gzip free / 10 MB paid** (measured: fumadocs server build ≈ 0.74 MB gzip total — fits free), **CPU 10 ms/request free** (prerendered docs pages are served as static assets → zero Worker CPU), static assets **free and unlimited requests**, 20k files/25 MiB-per-file on free. ([limits](https://developers.cloudflare.com/workers/platform/limits/), [assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), measured build)

---

## 1. TanStack Start → Cloudflare Workers: official mechanism, config, limits

### Mechanism (current, verified live 2026-07-12)

TanStack Start deployment is **per-host Vite plugins, not an adapter/preset option on the Start plugin**. The [hosting guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) lists Cloudflare Workers as an official partner target and prescribes `@cloudflare/vite-plugin`; Nitro (`nitro/vite`, v3 beta) exists as a separate host-agnostic alternative, flagged "⚠️ … still under active development". Cloudflare's own [framework guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) (and the TanStack guide, identically):

```ts
// vite.config.ts — "Add the Cloudflare plugin before TanStack Start plugin"
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tanstackStart(), react()],
});
```

```jsonc
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "<YOUR_PROJECT_NAME>",
  "compatibility_date": "2026-07-11",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "observability": { "enabled": true }
}
```

Scripts: `"dev": "vite dev"`, `"build": "vite build"`, `"preview": "vite preview"`, `"deploy": "npm run build && wrangler deploy"`, `"cf-typegen": "wrangler types"` ([CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)). Alternatively, wrangler is now framework-aware: for an existing Start project with no config, "npx wrangler deploy" auto-detects TanStack Start and generates the config ([CF guide, Quick Deploy](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)).

**What the build actually produces (verified on both scaffolds):** `vite build` emits `dist/client/` (all static assets, `public/` copied in) and `dist/server/index.js` plus a **resolved `dist/server/wrangler.json`** with `"main": "index.js"`, `"assets": {"directory": "../client"}`, `"no_bundle": true`, and a generated `dist/client/.assetsignore` (`wrangler.json`, `.dev.vars`). The plugin also writes `.wrangler/deploy/config.json` = `{"configPath": "../../dist/server/wrangler.json"}`, which is how a plain `wrangler deploy`/`wrangler dev` from the project root picks up the built config — verified: `wrangler dev` served the built app correctly. Note the user-authored `wrangler.jsonc` never needs an `assets` key; the plugin injects it.

**Bindings & env:** server code accesses bindings via `import { env } from "cloudflare:workers"` inside server functions; types come from `wrangler types` ([CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)). A custom entry (`src/server.ts` wrapping `@tanstack/react-start/server-entry`'s `fetch`) is only needed for Queues/Cron/Durable Objects ([CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)).

**Prerender:** `tanstackStart({ prerender: { enabled: true } })` requires `@tanstack/react-start` ≥ 1.138.0; "Prerendering runs at build time. It uses your local environment variables, secrets, and bindings storage data" ([CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)). Verified: the fumadocs template's build crawled and prerendered `/`, `/docs`, `/docs/test` into `dist/client/**/index.html`.

### Workers runtime limits relevant to an SSR docs site

All from [platform/limits](https://developers.cloudflare.com/workers/platform/limits/) (live 2026-07-12):

| Limit | Free | Paid |
|---|---|---|
| Worker size (gzip) | **3 MB** | **10 MB** (64 MB uncompressed both) |
| CPU time / request | **10 ms** | 30 s default, configurable to 5 min |
| Memory | 128 MB / isolate | 128 MB / isolate |
| Subrequests | 50/request | 10,000/request |
| Static assets | 20,000 files, 25 MiB/file | 100,000 files, 25 MiB/file |

Measured against this project's shape: the fumadocs app's entire `dist/server` JS gzips to **≈ 744 KB** (raw 3.7 MB; biggest chunks: compiled MDX source ≈ 154 KB gzip, Orama search ≈ 104 KB gzip); the bare shadcn app ≈ 131 KB gzip. Both fit the free plan's 3 MB. `nodejs_compat` requires `compatibility_date` ≥ **2024-09-23**; without the flag, "npm packages depending on Node.js APIs will fail to function" ([runtime-apis/nodejs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)). No Node APIs exist at request time beyond what `nodejs_compat` provides — no filesystem, so all content must be bundled or prerendered (see §7).

---

## 2. fumadocs compatibility on TanStack Start

fumadocs ships an official TanStack Start integration ([manual-installation/tanstack-start](https://fumadocs.dev/docs/manual-installation/tanstack-start)); the pieces and their runtime story:

- **fumadocs-core** (`16.11.3`): `loader()` source API, page-tree serialization, search server — pure JS, imported by Start server functions/routes. Works in workerd (verified: docs SSR + search 200s under `wrangler dev`).
- **fumadocs-mdx** (`15.1.0`): compiles MDX **at build time** via a Vite plugin — `import mdx from 'fumadocs-mdx/vite'` + `source.config.ts` (`defineDocs({ dir: 'content/docs' })`). "The .source folder will be generated when you run development server or production build"; collections are imported from the generated folder (`import { docs } from 'collections/server'` with tsconfig path `"collections/*": ["./.source/*"]`) ([mdx/vite docs](https://fumadocs.dev/docs/mdx/vite)). The scaffold adds `"postinstall": "fumadocs-mdx"` to generate `.source` before typecheck/build. No Next plugin involved; nothing MDX-related runs at request time. The `.source/browser.ts` split exists specifically as a "workaround for Cloudflare Vite issues" ([fumadocs-mdx CHANGELOG@cf452dc](https://github.com/fuma-nama/fumadocs/blob/cf452dc78b950ac2026e9101d461cb1e7782d455/packages/mdx/CHANGELOG.md)).
- **fumadocs-ui** (`16.11.3`): full layouts work on TanStack Start — `DocsLayout`, `DocsPage`, with root wiring via `RootProvider` from **`fumadocs-ui/provider/tanstack`** (framework-specific provider entry point; scaffold-verified). Two interchangeable flavors: "Fumadocs UI maintains support for both Base UI and Radix UI, while it uses Base UI by default. … If you install manually, alias `fumadocs-ui` to the `@fumadocs/base-ui` package" ([component-library docs](https://fumadocs.dev/docs/ui/component-library)); internally they "share the same layout structure, components, and public API; only the underlying primitives differ" ([radix-base-ui-sync@cf452dc](https://github.com/fuma-nama/fumadocs/blob/cf452dc78b950ac2026e9101d461cb1e7782d455/.cursor/skills/radix-base-ui-sync/SKILL.md)).
- **Search**: the template wires an Orama **server route** — `createFromSource(source, { language: 'english' })` from `fumadocs-core/search/server`, exposed as `GET /api/search` via a Start file route. The index is built in the Worker at module scope; verified returning ranked JSON results under workerd. The alternative for zero-server search is `staticGET`: "For static site generation, you must use `staticGET` and make the route pre-rendered", client uses static mode; caveat "Static Search requires clients to download the exported search indexes. For large docs sites, it can be expensive" ([headless/search/orama](https://fumadocs.dev/docs/headless/search/orama)). For a 4-item registry either is trivially fine.
- **Syntax highlighting**: since v16, "the JavaScript engine is now the default over the WASM-based Oniguruma" — "To ensure seamless compatibility with environments like Cloudflare Workers" ([v16 blog@cf452dc](https://github.com/fuma-nama/fumadocs/blob/cf452dc78b950ac2026e9101d461cb1e7782d455/apps/docs/content/blog/v16.mdx)).
- **Next-only pieces**: `next/og` OG-image generation (the CLI offers `takumi` as the framework-agnostic alternative — it's what non-Next templates get, per `create-fumadocs-app` source: `if (!results.template?.startsWith('+next')) return 'takumi'`); the Next.js-specific deployment note "Use https://opennext.js.org/cloudflare, Fumadocs doesn't work on Edge runtime" applies to **Next's Edge runtime**, not to Workers-with-`nodejs_compat` — the empirical build/serve here contradicts a broad reading of that sentence, and the CF-compat changelog entries above show Workers is a supported target. OpenAPI page generation (`fumadocs-openapi`) was not evaluated (not relevant to this project).

---

## 3. Serving `public/r/*.json` as static assets on Workers — verified end-to-end

**Routing model.** "If you have both static assets and a Worker script configured, Cloudflare will first attempt to serve static assets if one matches the incoming request. … If an appropriate static asset is not found, Cloudflare will invoke your Worker script" ([routing/worker-script](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)). `run_worker_first` defaults to **`false`** (can be `true` or an array of glob patterns, `!` negation supported) ([wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [binding docs](https://developers.cloudflare.com/workers/static-assets/binding/)). We want the default: registry JSON must never pass through app code.

**`public/` placement.** Vite copies `public/` into the client build; verified: `public/r/dialog-drawer.json` and `public/r/registry.json` ended up at `dist/client/r/*.json`, and the generated config points `assets.directory` at `../client`. So `npx shadcn build`'s default output `./public/r` ([house research, §2](./shadcn-registry-requirements.md)) needs zero extra wiring.

**Observed behavior (curl against workerd via `vite preview` and `wrangler dev`, both scaffolds):**

| Request | Result |
|---|---|
| `GET /r/dialog-drawer.json` | `200`, `content-type: application/json`, `etag: "…"`, `cache-control: public, max-age=0, must-revalidate`, `cf-cache-status: HIT` — served by the asset layer, Worker not invoked |
| `GET /r/registry.json` (flat catalog) | `200`, `application/json` |
| `GET /r/nope.json` | **`404`**, `text/html` — no asset matched, request fell through to the SSR Worker, TanStack Start rendered its not-found component **with HTTP status 404** |
| `GET /docs` (prerendered) | `307` → `/docs/` → `200 text/html` served as a static asset |

Content-Type is derived from the file extension by the asset layer (observed `application/json` for `.json`; no config involved). ETag revalidation and "Requests to static assets are free and unlimited. … no additional cost for storing Assets" ([billing-and-limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)) make this ideal for CLI-fetched JSON — no cache tricks needed, and the shadcn CLI's requirements (body parses as JSON; 404 → `RegistryNotFoundError`) are met exactly ([house research, §3](./shadcn-registry-requirements.md)).

**Nuance on the 404:** it is *not* an asset-layer 404 — with a Worker script present, `not_found_handling` (default `"none"`, options `"404-page"` / `"single-page-application"`, [wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)) never fires for direct requests; the miss is handled by invoking the Worker, and the 404 status comes from TanStack Start's not-found path. Consequence: an unknown `/r/*.json` costs one (billed, CPU-metered) Worker invocation and returns an HTML body with status 404. That satisfies the CLI contract; a "pure" asset 404 is impossible in a full-stack Worker.

**`html_handling`** (default `auto-trailing-slash`) only affects HTML: "individual files (e.g. `foo.html`) will be served *without* a trailing slash and folder index files (e.g. `foo/index.html`) will be served *with* a trailing slash", with `307`s to canonicalize ([html-handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)). This is why prerendered `/docs` 307s to `/docs/`. `.json` files are untouched.

---

## 4. What the scaffolds actually generate (both run on 2026-07-12)

### 4a. `create-fumadocs-app@16.1.3 --template tanstack-start`

Templates available: `+next+fuma-docs-mdx`, `astro`, `+next+fuma-docs-mdx+static`, `waku`, `react-router`, `react-router-spa`, `tanstack-start`, `tanstack-start-spa` (CLI `--help`). Prompts (linter/search/og/ai-chat) are clack-interactive but **all fall back to defaults under `CI=true`** (linter disabled, search `orama`, og `takumi`, ai-chat off — read from `dist/bin.js` of the published package). Reproducible command: `CI=true npx create-fumadocs-app@16.1.3 my-docs --template tanstack-start --search orama --no-git --install --pm npm`.

Generated (depth-3 tree, node_modules excluded):

```
my-docs/
├── content/docs/{index.mdx, test.mdx}      # MDX content lives outside src/
├── source.config.ts                        # defineDocs({ dir: 'content/docs', docs.postprocess.includeProcessedMarkdown })
├── vite.config.ts
├── package.json / package-lock.json / tsconfig.json / README.md
├── .source/{server.ts, browser.ts, dynamic.ts, source.config.mjs}   # generated by `fumadocs-mdx` (postinstall)
└── src/
    ├── start.ts                            # createStart: CSRF middleware + Accept:text/markdown → .md redirect middleware
    ├── router.tsx                          # getRouter() with defaultNotFoundComponent
    ├── styles/app.css                      # tailwindcss + fumadocs-ui/css/neutral.css + preset.css
    ├── lib/{source.ts, shared.ts, layout.shared.tsx, cn.ts}
    ├── components/{mdx.tsx, not-found.tsx}
    └── routes/
        ├── __root.tsx                      # RootProvider from 'fumadocs-ui/provider/tanstack'
        ├── index.tsx
        ├── docs/$.tsx                      # DocsLayout + server loader + client MDX loader
        ├── docs/{$}[.]md.ts                # raw markdown endpoint per page
        ├── api/search.ts                   # createFromSource(source) Orama GET
        └── llms[.]txt.ts, llms-full[.]txt.ts
```

Key deps (exact, from package.json): `fumadocs-core 16.11.3`, `fumadocs-mdx 15.1.0`, **`fumadocs-ui: npm:@fumadocs/base-ui@16.11.3`** (npm alias to "The Base UI version of Fumadocs UI" — npm registry description), `@tanstack/react-start 1.168.27`, `@tanstack/react-router 1.170.17`, react 19.2, tailwind v4, vite `^8.1.3`, and devDependency **`nitro: 3.0.260610-beta`**. Scripts: `postinstall: fumadocs-mdx`, `types:check: fumadocs-mdx && tsc --noEmit`.

vite.config.ts ships `mdx()`, `tailwindcss()`, `tanstackStart({ prerender: { enabled: true } })`, `react()`, and **`nitro({ preset: 'vercel' })`** — i.e. **no Cloudflare config out of the box; the default deploy target is Vercel via Nitro v3 beta**. There is **no `public/` directory and no wrangler file** in the template. To target Workers: drop the `nitro` plugin, add `cloudflare({ viteEnvironment: { name: 'ssr' } })` first, add `wrangler.jsonc` (§1). Done here; build, prerender, `vite preview`, `vite dev` and `wrangler dev` all worked with zero code changes.

### 4b. `pnpm dlx shadcn@latest init --preset b0 --template start` (shadcn CLI 4.13.0)

Flags verified against `shadcn init --help`: templates `(next, start, vite, react-router, laravel, astro)`; `start` = TanStack Start. `--preset b0` is a version-prefixed preset code; `npx shadcn preset decode b0` → **version `b`, style `nova`, baseColor/theme/chartColor `neutral`, iconLibrary `lucide`, font `inter`, fontHeading `inherit`, radius `default`, menuAccent `subtle`, menuColor `default`** (builder URL: `https://ui.shadcn.com/create?preset=b0`). Preset codes do **not** encode the primitive library; without `-b` the CLI defaulted to **`base`** → `components.json` `"style": "base-nova"` and `@base-ui/react ^1.6.0` (no Radix). Note: `--name` is required to create a fresh project non-interactively, and `--no-monorepo` skips the monorepo prompt.

Generated (depth 3): a Create-TanStack-App (`.cta.json`, file-router mode) project with shadcn on top:

```
shadcn-start/
├── components.json                          # style base-nova, tailwind.css: src/styles.css, aliases @/*
├── vite.config.ts                           # devtools(), tailwindcss(), tanstackStart(), viteReact()
├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml / tsconfig.json
├── eslint.config.js / .prettierrc / README.md
├── public/{favicon.ico, manifest.json, robots.txt}
└── src/
    ├── router.tsx, routeTree.gen.ts, styles.css, logo.svg
    ├── routes/{__root.tsx, index.tsx}       # __root has a notFoundComponent (404)
    ├── components/ui/button.tsx             # installed by init
    └── lib/utils.ts
```

Deps: `@tanstack/react-start: latest` (resolved 1.168.27), `@base-ui/react ^1.6.0`, `shadcn ^4.13.0` *as a runtime dependency* (styles.css does `@import "shadcn/tailwind.css"`), tailwind v4, vite `^8` (resolved 8.1.4), vitest/eslint/prettier. **No wrangler config, no Cloudflare plugin, no docs/MDX anything.** Same 3-step CF wiring applied; build + `vite preview` on workerd verified (`/r/*.json` 200 JSON, `/r/nope.json` 404, `/` SSR 200).

Friction encountered (both package managers, this machine): `sharp` (an optional dep of **miniflare**) fails to build from source — harmless; skip it (`npm i --ignore-scripts` + run `fumadocs-mdx` manually, or pnpm 11 `allowBuilds: { sharp: false, workerd: true }` in `pnpm-workspace.yaml` — **workerd's postinstall must be allowed** or wrangler/preview breaks).

---

## 5. Grafting fumadocs onto an existing TanStack Start app (the shadcn-first path)

The [manual installation for TanStack Start](https://fumadocs.dev/docs/manual-installation/tanstack-start) + the template internals define the exact additive set. Onto the §4b app:

1. **Packages**: `fumadocs-core`, `fumadocs-ui` aliased to the Base UI flavor — `"fumadocs-ui": "npm:@fumadocs/base-ui@16.11.3"` (matches the app's existing `@base-ui/react`; installing plain `fumadocs-ui` would pull the entire Radix primitive set alongside Base UI) ([component-library](https://fumadocs.dev/docs/ui/component-library)) — plus `fumadocs-mdx` and `@types/mdx` ([mdx/vite](https://fumadocs.dev/docs/mdx/vite)).
2. **vite.config.ts**: add `mdx()` from `fumadocs-mdx/vite` (template puts it first, before `tailwindcss()`/`tanstackStart()`).
3. **`source.config.ts`** (root): `defineDocs({ dir: 'content/docs' })`; content lives in `content/docs/*.mdx` with `title`/`description` frontmatter.
4. **tsconfig**: add `"collections/*": ["./.source/*"]` to `paths`; add `"postinstall": "fumadocs-mdx"` to scripts.
5. **`src/lib/source.ts`**: `loader({ source: docs.toFumadocsSource(), baseUrl: '/docs' })`.
6. **Routes**: `src/routes/docs/$.tsx` (catch-all: `createServerFn` loader returning `page.path` + serialized page tree; client MDX via `browserCollections.docs.createClientLoader`; renders `DocsLayout` + `DocsPage` — full file shape in §4a scaffold), `src/routes/api/search.ts` (`createFromSource(source)`), optionally the `.md` + `llms.txt` routes and the `start.ts` Accept-negotiation middleware.
7. **`__root.tsx`**: wrap `<Outlet/>` in `RootProvider` from `fumadocs-ui/provider/tanstack`.
8. **CSS** (`src/styles.css`): add `@import 'fumadocs-ui/css/shadcn.css'; @import 'fumadocs-ui/css/preset.css';` — fumadocs tokens are namespaced `--color-fd-*` (no collision with shadcn's `--background` etc.), and the shipped `shadcn.css` theme maps every `--color-fd-*` onto the shadcn variables including `#nd-sidebar` → `--sidebar-*` (read from `fumadocs-ui/css/shadcn.css` in the installed package). Dark mode composes too: `RootProvider` (next-themes) toggles the `.dark` class, which is exactly what the shadcn template's `@custom-variant dark (&:is(.dark *))` keys off.

**Conflicts found: none structural.** Same Tailwind v4 pipeline, same `@/*` alias convention, both `resolve: { tsconfigPaths: true }`. Two watch-items: (a) the shadcn template's `notFoundComponent` on `__root` already returns 404s — keep it; (b) the TanStack devtools plugin coexisted with the CF plugin in the verified build.

---

## 6. Scaffold path decision inputs

Both paths were built and probed; they converge on the same runtime stack (TanStack Start 1.168.x, Vite 8, Tailwind v4, Base UI, file-router). What differs is which half you assemble by hand:

| | **A: `create-fumadocs-app` (tanstack-start), then `shadcn init` into it** | **B: `shadcn init --preset b0 --template start`, then graft fumadocs (§5)** |
|---|---|---|
| Docs engine | Complete & idiomatic on day 1: MDX pipeline, docs routes, search route, `.md`/llms.txt endpoints, Accept-negotiation middleware, prerender enabled | ~7 files to write by hand (well-documented; the §4a scaffold is a working reference to copy from) |
| shadcn side | `shadcn init` (no template) into the app; preset `b0` still applies; `public/` dir must be created (template has none) | `components.json`, preset `b0` theme, `button` + `shadcn/tailwind.css` preinstalled; `public/` exists |
| Cloudflare | Not included — ships `nitro({preset:'vercel'})` to **remove**, + add CF plugin & wrangler.jsonc | Not included — add CF plugin & wrangler.jsonc (nothing to remove) |
| Registry `/r/*.json` | Works after adding `public/` (verified) | Works out of the box (verified) |
| Version pinning | Exact pins (react-start 1.168.27, router 1.170.17) | `"latest"` specifiers in package.json — should be pinned manually |
| Extras | llms.txt routes, markdown-per-page endpoints, `not-found` component, CSRF middleware | eslint/prettier/vitest preconfigured; TanStack devtools |
| Risk profile | fumadocs-maintained glue stays upstream-updateable | hand-rolled glue must track fumadocs releases (their TanStack API surface has been moving: client loaders, `serializePageTree`, `useFumadocsLoader`) |

The pending map decision is between these; the CF wiring effort is identical (§1), so the decisive axis is **who authors the fumadocs glue** — the generator (A) or us (B). If B is chosen, the §4a scaffold in the scratchpad is a line-by-line donor. Flag: the user's proposed command works as assumed (`b0` and `start` are both valid), but note `init --template start` **does not accept `--preset b0` implying Base UI** — base comes from the separate `-b` flag defaulting to `base`, which is what we want anyway.

---

## 7. Constraints on app architecture

1. **All MDX is build-time.** `fumadocs-mdx/vite` compiles `content/docs/**` into the bundle/`.source` during `vite build`; there is no request-time MDX compilation and no filesystem on Workers to read from anyway ([mdx/vite](https://fumadocs.dev/docs/mdx/vite), [runtime-apis/nodejs](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)). Adding a doc page = rebuild + redeploy. Same for registry JSON: `npx shadcn build` must run before `vite build` in the deploy script.
2. **The registry stays a pure static-asset concern.** `public/r/` → `dist/client/r/` → assets-first serving with correct `application/json`, ETags, free unlimited requests, and 404-status fallthrough for unknown items (§3). Keep `run_worker_first` unset. Do not name app routes under `/r/` (assets always win for existing files — an `/r/...` route would be shadowed).
3. **Prerender is the CPU-limit escape hatch — with one trade-off.** Prerendered routes are emitted as `dist/client/**/index.html` and served as static assets: zero Worker CPU (free plan = 10 ms/request), but **request middleware never runs for them** — verified: `Accept: text/markdown` content negotiation on a prerendered `/docs/test` serves the HTML asset instead of redirecting to `.md` (the direct `/docs/test.md` endpoint still works). Also, prerendered folder pages canonicalize to trailing-slash URLs via 307 (`/docs` → `/docs/`). If Accept-negotiation matters, either don't prerender docs pages or accept `.md`-URL-only markdown access.
4. **Search: two workable strategies.** (a) Template default: Orama in the Worker at `/api/search` (index built at isolate startup from the bundled source — verified working; adds ~100 KB gzip to the worker). (b) Fully static: `staticGET` + prerendered route + `type: 'static'` client — no Worker involvement ([orama docs](https://fumadocs.dev/docs/headless/search/orama)). At 4 registry items + a handful of docs pages, both are trivially within limits; (b) removes the last hot server dependency of the docs section.
5. **The `/create` playground is just a client-heavy route.** No RSC exists in this stack (`rsc: false`); interactive code is ordinary client components, code-split per route by Start. Anything touching `window`/DOM must be effect-guarded or lazy since the route SSRs in workerd (or be excluded from prerender). If `/create` is prerendered it ships as static HTML + hydration — zero request-time CPU.
6. **Env/bindings** (if ever needed — e.g. future KV/R2): `import { env } from "cloudflare:workers"` inside server functions only; never at client-reachable module scope; types via `wrangler types` ([CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)). Today the site needs zero bindings.
7. **Dev/prod parity is genuinely good.** With `@cloudflare/vite-plugin`, the SSR environment runs **in workerd** even under `vite dev` (verified: dev-server curls match preview/wrangler-dev behavior for `/docs`, `/api/search`, `/r/*.json`, 404s). `vite preview` and `wrangler dev` both serve the built `dist/` through workerd + the asset layer. Only html_handling trailing-slash canonicalization differs in dev (no prerendered assets exist there).
8. **Budget reality**: measured worker ≈ 0.74 MB gzip vs 3 MB free-plan cap; growth comes mainly from MDX volume (bundled per-page chunks) and search index. Static assets are free; the only billed/metered path is SSR of non-prerendered routes, `/api/search` (if dynamic), and unknown-path 404s.

---

## Confidence & gaps

High confidence: everything above traces to live official docs, the fumadocs repo at `cf452dc`, published package contents, or behavior observed on this machine (build + workerd runtime probes). Gaps:

1. **No production deploy was performed** — `wrangler deploy`, Workers Builds, and edge-cache behavior (`cf-cache-status` on real POPs) are verified only as far as `wrangler dev`/`vite preview` (miniflare/workerd) go. The config-redirect mechanism (`.wrangler/deploy/config.json`) was exercised by `wrangler dev` only.
2. The wrangler-native zero-config path ("`npx wrangler deploy` auto-detects TanStack Start", [CF guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)) was not exercised; the Vite-plugin path was.
3. CPU-time headroom on the free plan (10 ms) for non-prerendered SSR was not measured; mitigation (prerender) is verified.
4. `orama-cloud` search, OG-image generation via `takumi`, and `fumadocs-openapi` on TanStack Start were not tested (out of scope for this site).
5. The `sharp`/miniflare postinstall failure is machine-specific (macOS, source build); documented workarounds applied. CI images with prebuilt sharp binaries will likely not hit it.
6. fumadocs' TanStack integration surface is young and moving (client loaders, `serializePageTree` appeared recently); pin exact fumadocs versions and treat upgrades as review-worthy.
