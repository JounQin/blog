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
wrangler.jsonc   main=.output/server/index.mjs, assets=.output/public, nodejs_compat
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
- `githubGraphql` logs partial responses (data _and_ errors, for example nodes the token cannot
  read). For every token level except the last, that is treated as a failure so the next level is
  tried; only the final `GITHUB_TOKEN` level returns the partial data, and API routes filter `null`
  nodes, so pages degrade instead of failing
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

### GitHub tokens

Some organisations reject classic personal access tokens outright
(`web-infra-dev forbids access via a personal access token (classic)`), which is what broke
`/api/about`; an OAuth App **user** token with `read:org` is accepted there. An anonymous
visitor has no session, so that token cannot live in the session cookie — it is stored in an
optional KV namespace and read by the GraphQL client:

- **Capture** — every sign-in asks for the same read-only `read:org read:user` scopes, so a
  signed-in user's own token can serve the data queries and share the load; without `read:org` the
  organisation fields would always fall back to the owner's token. The callback keeps each user's
  `accessToken` (and `refreshToken`, when GitHub returns one because the app expires user tokens) in
  their signed session, and writes the **owner's** entry
  `{ accessToken, refreshToken, expiresAt, login, id, scopes }` under `oauth:user-token` in KV only
  when the signed-in `viewer.login` matches `GITHUB_OWNER_LOGIN` (defaulting to the app's owner), so
  no visitor can write to KV. `id` is the account's numeric GitHub id (`viewer.databaseId`), recorded
  on the first bootstrap — nothing new for the operator to configure. There is no separate bootstrap
  secret any more; the earlier `OWNER_LOGIN_SECRET` gate only existed to hide the elevated scopes and
  has been removed.
- **Identity pinning** — the entry is an identity record, not just a login string:
  - *read rule*: the stored token is used only when `entry.login` matches `GITHUB_OWNER_LOGIN` **and**
    the pinned `id` is present **and** the entry is not marked rejected. Otherwise the entry is
    ignored (a warning names `stored=<login>` and `expected=<GITHUB_OWNER_LOGIN>`, never a token) and
    the request falls through to `GITHUB_TOKEN`. The entry is deliberately **not** deleted on a
    mismatch: deleting is irreversible and would throw away the refresh token for what may be a typo,
    whereas ignoring it has the same effect and is reversible.
  - *write rule*: the callback stores when there is no entry, or the entry has no pinned id yet (the
    first bootstrap, which also covers an entry created before the id existed), or the signing-in
    account's `id` equals the entry's id. Overwriting the **same** identity is always safe, and a
    sign-in is the only recovery path for a token that died elsewhere, so it is authoritative on every
    isolate (CodeRabbit's "keep a healthy same-id entry" suggestion was deliberately not applied: the
    isolate that sees a rejection is not necessarily the one that serves the next sign-in). A
    **different** account id is refused with a warning — this is what stops a changed
    `GITHUB_OWNER_LOGIN` from handing the site to whoever now owns that login.
  - *dead tokens*: a credential failure (401/Bad credentials) writes a mark under its **own** KV key
    (`oauth:user-token:rejected`) whose value is the SHA-256 fingerprint of the exact access token
    that failed. The read rule ignores the stored token only when the mark matches the token
    currently in KV, so a location stops retrying the dead token as soon as it observes the mark,
    while a stale mark can never hide a token stored later. This is a **best-effort cross-isolate
    signal, not an atomic one**: Workers KV is eventually consistent and a write may take up to 60
    seconds or more to be visible in other locations (negative lookups are cached too), so a
    location that has not observed the mark yet can retry the dead token. Correctness never depends
    on the propagation: the isolate that detected the rejection drops its own cache immediately,
    every use re-checks and falls through on the rejection, and a stale retry only costs one rejected
    call before the fallback. The mark never rewrites the entry, which matters because Workers KV
    has no compare-and-swap: a read-modify-write of the entry could clobber a pair a concurrent
    sign-in or refresh had just stored, so the mark is deliberately kept out of the entry. A
    successful write deletes the mark; even if one arrives afterwards it names the old token and is
    ignored. Under-scoped but valid tokens are not marked, since they may still serve other queries.
  - *deliberate transfer*: to move the blog to another account on purpose, delete the
    `oauth:user-token` KV key by hand, update `GITHUB_OWNER_LOGIN`, then sign in as the new owner; the
    next sign-in has no entry to conflict with and pins the new identity.
- **Priority** (`worker/utils/github.ts`), highest first:
  1. the optional per-call `options.token` override, never cached. Its real use is the login flow:
     `/api/oauth` queries `viewer` with the token it has just exchanged — before any stored token
     exists — and makes the trusted-login check with it, so it must outrank the lookups below;
  2. the **signed-in user's own** token from this request's session;
  3. the **owner's stored** token (`BLOG_OAUTH` KV, refreshed as below), which is what serves
     anonymous visitors;
  4. `GITHUB_TOKEN`.
  Every level is tried, and any failure falls through to the next. For the levels that still have a
  fallback (the override, the session token and the owner token) a GraphQL `errors` payload counts
  as a failure even when partial `data` came with it, so an under-scoped token cannot silently serve
  half an organisation profile; only `GITHUB_TOKEN`, which has nowhere left to go, keeps the
  partial-data tolerance. A **rejected** owner token (401 or a permission error) drops the
  per-isolate cache, and a credential failure (401/Bad credentials) is also recorded in a separate KV
  key (`oauth:user-token:rejected`, holding the fingerprint of the token that actually failed), so an
  isolate stops retrying a dead token once it observes the mark — an eventually consistent signal, so
  until then a stale retry costs one rejected call before the fallback (see *dead tokens* above) —
  while a concurrent sign-in or refresh can never be clobbered.
- **Cache** (`worker/utils/github.ts`) — successful GitHub responses are also stored in
  `caches.default` for five minutes, keyed on the query, its variables and a **per-identity**
  component (never a raw token, and never the coarse token level). GitHub data is **not** uniformly
  public: the same query can return different nodes for a member of a private organisation than for a
  non-member, so sharing one body across identities would leak. The identity component is:
  - `user:<databaseId>` for a signed-in user, and `owner:<databaseId>` for the owner's stored token.
    Two requests with the same account id must see the same data: the account determines both the
    private resources it can reach and — because every sign-in asks for the same read-only scopes —
    the scopes granted. The pinned account id also keeps the owner's key stable across a token
    rotation, so rotating the token does not wipe the cache;
  - `user:token:<sha256>` for a session created before the account id was recorded, and
    `fallback:<sha256>` for `GITHUB_TOKEN`, which has no account to key on — the token itself is the
    only identity available, stored as a one-way hash.

  Anonymous traffic all shares the owner's identity, and GraphQL's limit is per token, so the cache
  still cuts the repeated calls of a busy page. Only a clean data response is stored: a rate limit, a
  401 or an empty body is never cached, so an error cannot poison it.

  The identity lives in the cache key's **query string** (`...?v1&identity=…&hash=…`), so a zone
  Cache Rule that strips query strings for this Worker would collapse every identity onto one key and
  defeat the isolation. Do not add such a rule; if one already exists, exclude this Worker's cache
  (the key cannot move out of the query string because Cloudflare's cache API keys on the URL).
- **Refresh** (`worker/utils/oauth-token.ts`) — the owner's stored token, when missing, expired or
  within five minutes of expiry, is refreshed with `POST $GITHUB_OAUTH_TOKEN_URL` and
  `grant_type=refresh_token` (the OAuth app id/secret are the existing Worker secrets); GitHub
  rotates both tokens, so the new pair is written back. The fresh value is cached per isolate.
  A refresh failure falls back to `GITHUB_TOKEN`.
- **Storage** — `BLOG_OAUTH` is configured in the **Cloudflare dashboard**, not in `wrangler.jsonc`:
  **Production** bindings for the production Worker, and **Settings → Bindings → Previews Base** for
  branch/PR previews (`wrangler preview`; Previews do not inherit production settings). The code
  feature-detects the binding, so a deployment without it keeps working on `GITHUB_TOKEN` alone.

  Trade-off, stated factually: Cloudflare's Previews documentation says dashboard Previews Base settings
  must be copied back into the Wrangler file "to keep future deployments in sync", so a `wrangler
  deploy` may reconcile the deployed bindings from the config and drop a dashboard-only binding. That is
  what we want to test by declaring nothing here; if `BLOG_OAUTH` disappears after a deploy, its
  declaration has to come back into `wrangler.jsonc`. Verify on a **deployed version**: **Workers →
  blog → Deployments/Versions → that version → Bindings** should list `BLOG_OAUTH`, and the runtime
  logs must not contain `[oauth-token] no usable BLOG_OAUTH KV binding` (that line means the
  stored-token path is disabled and `GITHUB_TOKEN` is used). Local `wrangler dev` uses Miniflare's
  local KV, so no dev namespace is needed.

### Translation

- `/api/translate` is backed by `@deeplx/core` (`translateByDeepLX(source, target, text)`, DeepL's
  free endpoints), so **no translation environment variable is needed** — the previous
  Google / Tencent providers (and their `GOOGLE_TRANSLATE_ENABLED`, `GOOGLE_TRANSLATE_URL`,
  `TRY_TENCENT_ON_GOOGLE_FAILED` and `TENCENT_*` variables) are gone. A caller-provided `source`
  is passed to the provider; when it is missing the provider detects the language itself, which is
  how untagged text, i.e. a string without `[en]`/`[zh]` markers, is translated. `target` (the
  language to produce) is explicit in that case; with `source` but no `target` the target is still
  derived from `source`, and with neither from the locale cookie, exactly as before. Note that the
  anonymous endpoint mirrors a given `source_lang` as `detected_source_language` whenever its own
  detection is not confident, so an accurate tag helps and a wrong one can cause an echo
- `/api/translate` is `POST` only (`translate.post.ts`): the client sends a JSON body
  `{ text | sourceText, source?, target?, retry? }`, so a long article body never has to fit into a
  URL, and a malformed body degrades to an empty translation rather than a 500. A failed request
  caches the source text, and an untagged template renders its original text while the translation
  is pending and after it fails, so neither case can show the "Translating…" placeholder
- `DEEPLX_URL` (e.g. `https://<your-dlx-host>`, **no trailing slash**) adds a **fallback** for a
  chunk the library cannot translate, tried in this order for every chunk: `@deeplx/core` first
  (`translateByDeepLX`, which returns `{ code, data, ... }` instead of throwing), retried while its
  `code` is **not** a 4xx (a 4xx means DeepL rejected the request/client profile, so a repeat is
  pointless, and the loop stops there). A 200 whose output is identical to the input is not
  retried either, but it does go to DLX: the library's anonymous profile echoes short, ambiguous
  or mixed chunks unchanged, while the self-hosted DLX answers with a different client profile —
  the iOS one — so it is the path that can still translate such a chunk. When the fallback fails,
  or `DEEPLX_URL` is unset, that chunk keeps its source text and the request reports
  `translated: false`. So, after the library attempts are
  spent on a failure or the chunk came back unchanged, **one** POST to
  `<DEEPLX_URL>/translate` with
  `Authorization: Bearer $DEEPLX_TOKEN` (omitted when the token is unset) and
  `{ text, source_lang?, target_lang }` (`source_lang` is sent only when the caller named a
  source, so the DLX detects it otherwise), for a self-hosted
  [DLX](https://github.com/OwO-Network/DLX). The fallback follows redirects (the runtime
  default), but the endpoint should serve `/translate` directly: a 301/302/303 is re-issued as a
  GET and drops the body, so only a method-preserving redirect (307/308) still translates. Only
  the **final** response is judged — HTTP 200, `code` 200, a non-empty `data` and
  `data !== chunk`. A chunk the library translates never reaches DLX, and with `DEEPLX_URL` unset
  nothing changes at all (the route stays library-only)
- The library signal is the value `translateByDeepLX` returns: a 200 carries `data` (identical to
  the input stops the retries and falls back to DLX, a different one is the translation), a 4xx
  `code` short-circuits to the fallback, and any other non-200 shape (5xx, empty payload,
  unexpected throw) spends the remaining attempts — no error parsing, cause inspection or message
  matching
- The fallback response only counts as translated when the HTTP status is 200, the JSON `code`
  is 200, `data` is a non-empty string and `data !== chunk`; everything else (any error status,
  an auth failure, a bad payload, an unchanged answer) fails like the library path, with a
  warning that names the path and the status/code but never the token
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
- Provider requests carry their own `AbortSignal.timeout`: 8 s for `@deeplx/core` (a cold
  isolate pays a cookie warm-up) and 4 s for the DLX fallback, so a worst-case SSR prefetch
  chunk stays at 8 s + 4 s = 12 s. Page-level API calls, GitHub requests and the client-side
  translation request use `retry: 0`, and ofetch does not retry the fallback POST by default
- Titles and the article body are prefetched during SSR: the provider's 1500-character limit is
  handled by chunking, and the translated strings are written to the payload state, so the first
  paint is already translated and the client never re-requests them
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
- Production: secrets via `wrangler secret put <NAME>`. Non-secret overrides can be Worker variables (dashboard) or a `wrangler.jsonc` `vars` block, but a `vars` block requires a matching `previews.vars` (Workers Builds refuses a preview deploy without it), so the `GITHUB_REPOSITORY_*` values are deliberately left to their `nuxt.config.ts` defaults instead of being duplicated per environment
- `DEEPLX_URL` / `DEEPLX_TOKEN` are optional and make a self-hosted DLX the `/api/translate`
  fallback when the `@deeplx/core` path fails. Put them in the dashboard (Worker
  variables/secrets) for **both** Production and Preview — **not** in a `wrangler.jsonc` `vars`
  block, which would force a `previews.vars` copy and overwrite the dashboard values on every
  deploy

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
- **CI** (`.github/workflows/ci.yaml`): single job, Node from `.node-version`, `yarn lint` + `yarn typecheck` +
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
- **Translation**: `POST /api/translate` with `{"source":"zh","sourceText":"…"}` returns the stubbed
  translation, and the home page HTML contains the translated title instead of the placeholder
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
Total Upload: 753.21 KiB / gzip: 189.22 KiB    (66 static assets)
env.ASSETS   Assets
(no vars: GITHUB_REPOSITORY_* are app constants, see nuxt.config.ts)
```

Values to add with `wrangler secret put <NAME>` (or in the dashboard):

| Variable                                    | Purpose                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`                              | GraphQL reads (classic PAT, or a fine-grained PAT with an expiry ≤ 366 days)     |
| `APP_KEYS`                                  | Session signing (comma-separated; without it login is disabled)                  |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app                                                                 |
| `GITHUB_OAUTH_CALLBACK`                     | e.g. `https://blog.1stg.me/api/oauth`; locally `http://localhost:3000/api/oauth` |

Translation needs no variable at all (`@deeplx/core`). Optionally add `DEEPLX_URL`
(e.g. `https://<your-dlx-host>`) and `DEEPLX_TOKEN` to fall back to a self-hosted DLX when
`@deeplx/core` fails or declines a chunk; both scopes (Production and Preview) need them, and
they must not go into `wrangler.jsonc` (see above).

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
  relative import and indexed access in `translate.post.ts`, and the loop type in
  `worker/api/archives.get.ts`

## Open items

1. `/api/about` currently returns 502: the query requests `user.email`, which needs the
   `read:user` (or `user:email`) scope on the classic PAT — add it, or drop the `email` field
2. Nothing is committed yet; review `git status` before committing
3. A real browser login round trip still has to be done on port 3000 (`yarn dev`), because that is
   the callback origin registered for local development

- `GITHUB_OAUTH_CALLBACK` may be left unset. Development and production set it
  explicitly; previews omit it and `/api/login` derives the callback from the origin
  of the incoming request. That works because the registered redirect URI
  (`https://jounqin.workers.dev/api/oauth`) has GitHub's "Allow wildcard matching"
  enabled, so any subdomain of it is accepted.

## Preview environment

Worker Previews do not inherit production settings. Add the runtime secrets to the
Preview scope as well (the Worker -> Settings -> Variables and Secrets -> Preview),
otherwise `/api/*` runs without credentials and login is unavailable:
`GITHUB_TOKEN`, `APP_KEYS`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — plus
`DEEPLX_URL` / `DEEPLX_TOKEN` when previews should use the self-hosted DLX fallback too
(without them a preview sticks to `@deeplx/core`).

Leave `GITHUB_OAUTH_CALLBACK` unset for previews: `/api/login` derives it from the
origin of the incoming request. Register `https://jounqin.workers.dev/api/oauth` in
the GitHub OAuth app with "Allow wildcard matching" so every preview host (and the
workers.dev URL itself) is accepted, and keep the explicit value for development
(`http://localhost:3000/api/oauth`) and production (`https://blog.1stg.me/api/oauth`).

## Known GraphQL noise

Some organisations refuse classic personal access tokens, for example
`web-infra-dev` forbids access via a personal access token (classic). GitHub then
returns a partial response with per-node errors. The owner's OAuth user token in
`BLOG_OAUTH` is accepted there, so the anonymous path no longer hits it; a
signed-in visitor's token that still cannot read a node now makes *that level*
fail and fall through to the owner's token (see **Priority** above). Only the
final `GITHUB_TOKEN` level keeps the partial data and drops the `null` nodes, so
a page can still render when every token is limited (verified: `/pulse` logs the
per-node errors and answers 200).
