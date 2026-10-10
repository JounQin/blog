# blog

[![GitHub Actions](https://github.com/JounQin/blog/workflows/CI/badge.svg)](https://github.com/JounQin/blog/actions?query=workflow%3A%22CI%22)
[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A blog system built on the GitHub GraphQL API, with Nuxt 4 SSR running on Cloudflare Workers.

- Articles are the GitHub issues of the `JounQin/blog` repository: title, body, labels and comments are read through GraphQL
- SSR: Nuxt 4 + Vue 3, nitro `cloudflare_module` preset, running on Cloudflare Workers (workerd)
- i18n: `en` / `zh`, including the `[en]…[zh]…[_end_]` translation DSL and untagged strings (translated with an auto-detected source), with `@deeplx/core` (no API key needed) as the remote translation provider; optionally set `DEEPLX_URL` / `DEEPLX_TOKEN` to fall back to a self-hosted [DLX](https://github.com/OwO-Network/DLX) instance when the library fails (4xx/5xx) or echoes a chunk unchanged
- PWA: `@vite-pwa/nuxt` (service worker + web manifest)
- Login: GitHub OAuth with an HMAC-signed cookie session
- Environment variables, deployment checklist and the migration log live in [MIGRATION.md](MIGRATION.md)

## GitHub tokens

GitHub data is read with an OAuth **user** token rather than only `GITHUB_TOKEN`, because
organisations such as `web-infra-dev` reject personal access tokens (classic) outright, while
fine-grained PATs and per-organisation GitHub App installs are impractical for a blog that reads
data across several organisations. The GitHub OAuth app therefore needs its callback URL registered
(`GITHUB_OAUTH_CALLBACK`, or the request origin) and, for refresh tokens, **Expire user access
tokens** enabled in its settings.

Every sign-in asks for the same read-only `read:org read:user` scopes, so a signed-in visitor's own
token can serve the data queries and share the load instead of everything depending on one token.
When `GITHUB_OWNER_LOGIN` (the maintainer, defaulting to the app owner) signs in once, the callback
stores that account's token in the `BLOG_OAUTH` KV namespace — it serves anonymous visitors and is
the fallback for a signed-in user whose own token cannot read an organisation. The entry pins that
account's numeric GitHub id, so a changed `GITHUB_OWNER_LOGIN` neither uses nor overwrites it;
handing the blog to another account on purpose means deleting the KV key first, then signing in as
the new owner. The stored token is
refreshed with its refresh token before it expires (GitHub rotates both, the new pair is written
back and cached per isolate, and a failure degrades rather than failing a page), and successful
GitHub responses are cached in `caches.default` for five minutes — never errors or rate limits.

`wrangler dev` uses Miniflare's local KV, so local work needs no namespace. `BLOG_OAUTH` (the
maintainer's OAuth user token) is configured in the **Cloudflare dashboard**, not in this repository:
**Production** bindings for the production Worker, and **Settings → Bindings → Previews Base** for
branch/PR previews. The code feature-detects the binding, so a deployment without it keeps working on
`GITHUB_TOKEN` alone.

Trade-off, stated factually: Cloudflare's Previews documentation says dashboard Previews Base settings
must be copied back into the Wrangler file "to keep future deployments in sync", so a `wrangler
deploy` may reconcile the deployed bindings from the config and drop a dashboard-only binding. That is
what we are testing; if `BLOG_OAUTH` disappears after a deploy, its declaration has to come back into
`wrangler.jsonc`. Confirm the binding on a deployed version: **Workers → blog →
Deployments/Versions → that version → Bindings** should list `BLOG_OAUTH`, and the runtime logs should
not contain `[oauth-token] no usable BLOG_OAUTH KV binding` (that line means the stored-token path is
disabled).

The exact token precedence and configuration are described in
[MIGRATION.md](MIGRATION.md#github-tokens).

## Local development

```sh
cp .dev.vars.example .dev.vars # fill in GITHUB_TOKEN etc. — one file is enough locally
yarn dev                       # http://localhost:3000 (the OAuth callback is registered on port 3000)
```

`yarn dev` runs nitro through the Cloudflare dev emulation, so the runtime reads `.dev.vars` and the `vars` block of `wrangler.jsonc`; `.env` / `.env.local` are not used by this setup.

## Scripts

| Command                                    | Description                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `yarn dev`                                 | Nuxt dev server (port 3000)                                              |
| `yarn build`                               | Production build into `.output/`                                         |
| `yarn worker:dev`                          | Run the build output inside a local workerd through wrangler (port 8787) |
| `yarn lint` / `yarn lint:fix`              | ESLint (flat config)                                                     |
| `yarn typecheck` / `yarn typecheck:server` | Type checking (app / worker + shared)                                    |

## Layout

```
app/       Nuxt application (srcDir): layouts, pages, components, composables, assets/styles
worker/    nitro routes and helpers (api/, utils/, error.ts, middleware/)
shared/    code shared by app and worker (types, locale, translation DSL)
```
