# Migration log: Vue 2 + Koa SSR → Nuxt 4 + Cloudflare Workers

Status: **complete** — the Vue 2 / Koa implementation has been removed from the
repository (it is still available in git history), and the blog now runs as a
Nuxt 4 SSR app on Cloudflare Workers (workerd).

## Layout

```
app/             Nuxt application (srcDir): app.vue, layouts/, pages/, components/,
                 composables/, i18n/, plugins/, assets/styles/
worker/          nitro routes (nitro.srcDir): api/, utils/, error.ts
shared/          code shared by app and worker: types/blog.ts, utils/{locale,translate}.ts
nuxt.config.ts   nitro preset cloudflare_module, scss injection, head, PWA, routeRules, runtimeConfig
wrangler.jsonc   main=.output/server/index.mjs, assets=.output/public, nodejs_compat, vars
```

## What was done

### Pages (all migrated)

- `app/layouts/default.vue` — full port of `src/views/App.vue`: navigation, search, login
  slot, footer, locale toggle, mobile collapse, scroll-to-top button, `HiProgress`
- `/` Home (list, label colours via `invert-color`, pagination, search, empty state)
- `/article/[number]` (markdown body, comments, relative time, link to GitHub)
- `/categories`, `/archives` (counts, labels, timeline grouped by year)
- `/pulse` (All/PRs/Issues switch, state colours, Load More via `HiLoading`)
- `/about` (profile: avatar, email, bio, location, website + pinned repository cards)
- Styles: Bootstrap 5 scss (the legacy style-resources-loader injection is replaced by
  `vite.css.preprocessorOptions.scss.loadPaths` + `additionalData`), font-awesome,
  github-markdown-css, typeface-lato
- i18n: `useI18n()` replaces `vue-translator` (`$t(key, args)` with `{ 0 }`
  interpolation, cookie + Accept-Language detection, local parsing of the
  `[en]…[zh]…[_end_]` translation DSL)

### Data layer

- `worker/api/{articles,article/[number],categories,archives,pulse,about,info,login,oauth,translate}`
  → `worker/utils/github.ts` → `api.github.com/graphql` (`GITHUB_API_URL` overridable)
- The token only ever lives in the Worker; queries were ported verbatim from `src/queries.gql`
- HTTP client: Nuxt/ofetch `$fetch` (global `fetch` underneath). **axios was removed** —
  its Node http adapter was one of the original portability blockers
- `githubGraphql` tolerates partial responses: when GitHub returns data *and* errors (for
  example nodes the token cannot read) it logs a warning and returns the partial data;
  API routes filter `null` nodes, so pages degrade instead of failing
- Per-node `null` filtering in `/api/pulse`, and `pinnedItems` filtered in `/api/about`

### Sessions and login

- `worker/utils/session.ts` — stateless, signed cookie session (`blog_sess`) using WebCrypto
  HMAC-SHA256, replacing `koa-session`. `APP_KEYS` is a comma-separated list (the first key
  signs, all keys verify, like Koa). Without `APP_KEYS` no session is issued (login disabled)
- Helper names are `readSession` / `writeSession` / `destroySession` on purpose: h3 already
  auto-imports `getSession` / `updateSession` / `clearSession`, and shadowing them triggers
  nitro's "Duplicated imports" warning with the local implementation silently winning
- `/api/login?path=<page>` starts the OAuth flow. The session (and the `uuid` used as the
  OAuth `state`) is created **on this response**: a `Set-Cookie` written by a route that is
  only fetched internally during SSR (`/api/info`) never reached the browser — the page
  response only had `LOCALE_COOKIE`, which made `/api/oauth` fail with
  `invalid oauth redirect`. A real navigation always stores the cookie
- `/api/oauth` verifies `state === session.uuid` (CSRF), exchanges the code
  (`GITHUB_OAUTH_TOKEN_URL` overridable for local stubs), queries `viewer`, stores the user
  and token in the session, and 302s back to `path` (same-origin relative paths only)
- `/api/info` returns the session user plus the public env values

### Translation

- `/api/translate` is backed by `@deeplx/core` (`translate(text, target, source)`, DeepL's
  free endpoints), so **no translation environment variable is needed** — the previous
  Google / Tencent providers (and their `GOOGLE_TRANSLATE_ENABLED`, `GOOGLE_TRANSLATE_URL`,
  `TRY_TENCENT_ON_GOOGLE_FAILED` and `TENCENT_*` variables) are gone
- Bundle workaround: `@deeplx/core` imports `node-fetch-native/proxy`, and `node-fetch-native` ships
  a conditional exports map whose `workerd`/`worker` branch points at `dist/native.mjs` (a file).
  Nitro's builder is still **Rollup based** (`nitropack@2.13.4` depends on `rollup@^4.60.2`; the app
  build, by contrast, runs on Rolldown through Vite 8), and its resolver then produced
  `dist/native.mjs/proxy`, so the build died with `ENOTDIR: not a directory`. `nitro.alias` maps that
  subpath to the package's own proxy stub (`dist/proxy-stub.mjs`), which is exactly the "no proxy in
  this runtime" implementation — see the alias in [nuxt.config.ts](nuxt.config.ts)
- Texts longer than the provider's 1500-character anonymous limit are split at safe
  boundaries (newline, `>`, space) and translated in parallel; a chunk that fails (timeout,
  rate limit) keeps its original text, so a long article never blocks the SSR
- Each request uses `AbortSignal.timeout(4000)`; every page-level API call, GitHub request and
  translation request also uses `retry: 0`, so the worst-case SSR latency stays inside one timeout
- Only titles are prefetched during SSR: article bodies exceed the provider's per-request limit
  and are filled in on the client by the existing `tt()` path
- `useI18n().prefetch()` resolves the DSL and requests the missing translations inside
  `useAsyncData`, writing them to `useState('translate-cache')` (serialized into the payload),
  so the SSR HTML already contains the translated text instead of the `Translating…` placeholder

### Environment variables

- The legacy plain names are supported: `GITHUB_TOKEN`, `GITHUB_REPOSITORY_OWNER/NAME/OWNER_TYPE`,
  `GITHUB_EXCLUDED_LABELS`, `GITHUB_EXCLUDED_REPOSITORY_OWNERS`, `GITHUB_CLIENT_ID/SECRET`,
  `GITHUB_OAUTH_CALLBACK`, `GITHUB_API_URL`, `APP_KEYS`
- `NUXT_`-prefixed runtimeConfig values still work as a fallback (`worker/utils/env.ts`)
- Locally **`.dev.vars` is the only file needed** (template: [.dev.vars.example](.dev.vars.example)).
  Measured: this Nuxt version runs `nuxt dev` through nitro's Cloudflare dev emulation
  (`Using cloudflare-dev emulation in development mode` / `Using secrets defined in .dev.vars`),
  and the worker runtime reads `.dev.vars` plus the `vars` of `wrangler.jsonc`. With
  `GITHUB_TOKEN` only in `.env.local`, `/api/categories` returns **503**, so `.env` / `.env.local`
  never reach the worker runtime (they only matter for a plain node preset)
- Production: secrets via `wrangler secret put <NAME>`, non-secret values in `wrangler.jsonc` `vars`

### Cleanup (done)

- Removed the Vue 2 + Koa implementation: `src/`, `server/`, `build/`, `types/`
- Removed legacy deployment/config files: `vercel.json` (used to rewrite to Heroku),
  `.env.build`, `.eslintrc`, `.eslintignore`, `codechecks.yml`
- Removed `env.js` / `.env.js` (defaults were migrated to `.dev.vars` and `.dev.vars.example`),
  the Synology `@eaDir` directories and the old `dist/`
- Dependencies went from 38 deps + 79 devDeps to **6 deps + 17 devDeps** (kept: nuxt, vue,
  vue-router, date-fns, invert-color, github-markdown-css; dev: @nuxt/eslint, @vite-pwa/nuxt,
  wrangler, sass, prettier, …)
- `package.json`: dropped the `legacy:*`, `lint:es`, `lint:style`, `lint:tsc`, `typecov` scripts
  and the `resolutions` / `nodemonConfig` / `remarkConfig` / `stylelint` / `typeCoverage` blocks
- `tsconfig.json` is now `{ "extends": "./.nuxt/tsconfig.json" }`
- Still present on purpose: `@1stg/app-config` (referenced by `.postcssrc.js`, `.prettierrc.js`,
  `.simple-git-hooks.js` and the `browserslist` field) and the prepare-lifecycle plugin in
  `.yarnrc.yml` — removing `@1stg` entirely means inlining those four places

### PWA

- `@vite-pwa/nuxt` with `registerType: 'autoUpdate'`; the web manifest is generated by the module
  (`manifest.webmanifest`, replacing the legacy `public/manifest.json`)
- `workbox.navigateFallbackDenylist: [/.*/]` — this is a server-rendered app, so a navigation is
  never answered from a cached SPA shell
- `routeRules` adds `cache-control: no-cache` for `/sw.js` (matching the legacy
  `files['/service-worker.js'].maxAge = 0`) and a 1-hour cache for `/manifest.webmanifest`
- Because `app.head` is declared here, the manifest `<link>` is explicit in `app.head.link`, and
  the module's own service-worker registration did not reach the SSR HTML either, so registration
  is explicit in [app/plugins/pwa.client.ts](app/plugins/pwa.client.ts)
  (`navigator.serviceWorker.register('/sw.js')`, failures ignored)
- Build output contains `sw.js` (4.1 KB) + `workbox-*.js` + `manifest.webmanifest`; `sw.js` has no
  `index.html` fallback, and the `/sw.js` registration is present in the client bundle

### Tooling

- **Lint**: `@nuxt/eslint` flat config (`eslint.config.mjs` extends `.nuxt/eslint.config.mjs`);
  `yarn lint` = `eslint .` → 0 problems; `lint-staged` runs `eslint --fix` on staged files
- **TypeScript pinned to 6.0.3**: 5.2 cannot parse Vite/Vue `.d.mts` files (`TS1003`) and 7.0 is
  rejected by typescript-eslint (`typescript-eslint does not support TS 7.0`)
- **CI** (`.github/workflows/nodejs.yml`): single job, Node 22, `yarn lint` + `yarn typecheck` +
  `yarn build` (the Node 18/20 × macOS/ubuntu matrix is gone; Nuxt 4 needs Node 20.19+/22.12+)

## Verification

All of the following was executed in this repository against a real build:

- Local GraphQL stub (`GITHUB_API_URL`) to exercise rendering without a token
- `nuxt dev` with a real token: `/api/categories` and `/api/articles` return real data
- **workerd (`wrangler dev`)**: `/`, `/pulse`, `/about`, `/categories`, `/archives`,
  `/article/455` all 200 with real content
- **OAuth**: stub-based full flow (cookie + uuid → wrong `state` 400 → correct `state` + `code`
  302 to `/foo` and session updated → `/api/info` returns the logged-in user). With the real OAuth
  app, `/api/login` returns 302 to GitHub with the right `client_id`, `state` and `redirect_uri`,
  sets the session cookie, and an intentionally invalid `code` makes GitHub answer
  `The code passed is incorrect or expired.` — which proves the client id/secret are accepted
- **Translation**: `/api/translate?Source=zh&SourceText=…` returns the stubbed translation, and the
  home page HTML contains the translated title instead of the placeholder
- **Resilience**: pointing the translation URL at a server that accepts connections and never
  answers, the page still renders 200 in ~4.3 s (2.5 s budget after the timeout was lowered).
  The original 8.4 s was caused by nitro's `$fetch` defaulting to one retry, hence `retry: 0`
- `nuxt build` passes; `wrangler deploy --dry-run` passes
- Lint: 0 problems. `yarn typecheck` (app) 0 errors, `yarn typecheck:server` 0 errors in
  `worker/` and `shared/`

### Findings worth keeping

1. `vue-server-renderer`'s bundle renderer needs `vm` + dynamic code evaluation — impossible on
   workerd. Using Nuxt SSR avoids the whole problem.
2. SSR on workerd failed with `xxx is not a function`: date-fns v2's CJS interop produced a broken
   reference after rolldown minification (`var r={}; r(...)`). Upgrading to **date-fns v4**
   (pure ESM) fixed it; the deep `date-fns/locale` import workaround is no longer needed.
3. `nitro.errorHandler` (`worker/error.ts`) logs the stack via `console.error`, so `wrangler tail` /
   Workers Logs show the real error (the default error response only carries the message).
4. GitHub GraphQL's `issues(labels:)` filter is **any-of**: single-label queries returned 0 issues
   while the default query with all 11 non-excluded labels returned 25. The legacy behaviour
   (passing all non-excluded labels) is therefore correct and the home page has content.

## Deployment checklist

`wrangler deploy --dry-run` on the current build:

```
Total Upload: 742.72 KiB / gzip: 186.25 KiB    (80 static assets)
env.ASSETS                       Assets
env.GITHUB_REPOSITORY_OWNER      "JounQin"      (wrangler.jsonc vars)
env.GITHUB_REPOSITORY_NAME       "blog"
env.GITHUB_REPOSITORY_OWNER_TYPE "user"
```

Values to add with `wrangler secret put <NAME>` (or in the dashboard):

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | GraphQL reads (classic PAT, or a fine-grained PAT with an expiry ≤ 366 days) |
| `APP_KEYS` | Session signing (comma-separated; without it login is disabled) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app |
| `GITHUB_OAUTH_CALLBACK` | e.g. `https://blog.1stg.me/api/oauth`; locally `http://localhost:3000/api/oauth` |

Translation needs no variable at all (`@deeplx/core`).

Custom domain: worker `blog` + `blog.1stg.me` (the removed `vercel.json` used to rewrite to Heroku;
this should become a Cloudflare custom domain).

## Dependencies provided by the framework

- `ofetch` is not in `package.json`: it comes with Nuxt/nitropack (`nuxt` and `nitropack` both
  depend on `ofetch@^1.5.1`). Only the injected globals are used (`$fetch`, `useFetch`,
  `useAsyncData`), never `import 'ofetch'`
- The only direct import of a transitive dependency is `import type { H3Event } from 'h3'`
  (`worker/utils/{env,blog,github}.ts`, types only); h3 comes from `nitropack` (`^1.15.11`).
  Removing it does not work: nitro's auto-import declares `H3Event` as a **global value**
  (`const H3Event: typeof import('h3').H3Event`), and using it as a type fails with
  `TS2749: 'H3Event' refers to a value`
- All other third-party imports (`invert-color`, `date-fns`) are declared in `package.json`

## Type checking

- Scripts: `yarn typecheck` (app), `yarn typecheck:server` (worker/shared); both run
  `nuxt prepare` first, because `nuxt build` leaves `.nuxt/types` without the auto-import globals
- Fixed along the way: indexed access in `parseAcceptLanguage`, `indexes[i+1]` in the translation
  DSL, the implicit `any` in the archives loop, the `worker/error.ts` handler signature, the
  relative import and indexed access in `translate.get.ts`, and the loop type in
  `worker/api/archives.get.ts`

## Open items

1. `/api/about` currently returns 502: the query requests `user.email`, which needs the
   `read:user` (or `user:email`) scope on the classic PAT — add it, or drop the `email` field
2. Nothing is committed yet; review `git status` before committing
3. A real browser login round trip still has to be done on port 3000 (`yarn dev`), because that is
   the callback origin registered for local development
