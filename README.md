# blog

[![GitHub Actions](https://github.com/JounQin/blog/workflows/CI/badge.svg)](https://github.com/JounQin/blog/actions?query=workflow%3A%22CI%22)
[![Conventional Commits](https://img.shields.io/badge/conventional%20commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

A blog system built on the GitHub GraphQL API, with Nuxt 4 SSR running on Cloudflare Workers.

- Articles are the GitHub issues of the `JounQin/blog` repository: title, body, labels and comments are read through GraphQL
- SSR: Nuxt 4 + Vue 3, nitro `cloudflare_module` preset, running on Cloudflare Workers (workerd)
- i18n: `en` / `zh`, including the `[en]…[zh]…[_end_]` translation DSL, with `@deeplx/core` (no API key needed) as the remote translation provider; optionally set `DEEPLX_URL` / `DEEPLX_TOKEN` to fall back to a self-hosted [DLX](https://github.com/OwO-Network/DLX) instance when the library fails (4xx/5xx) or echoes a chunk unchanged
- PWA: `@vite-pwa/nuxt` (service worker + web manifest)
- Login: GitHub OAuth with an HMAC-signed cookie session
- Environment variables, deployment checklist and the migration log live in [MIGRATION.md](MIGRATION.md)

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
| `yarn deploy`                              | `wrangler deploy` (Cloudflare Workers)                                   |
| `yarn lint` / `yarn lint:fix`              | ESLint (flat config)                                                     |
| `yarn typecheck` / `yarn typecheck:server` | Type checking (app / worker + shared)                                    |

## Layout

```
app/       Nuxt application (srcDir): layouts, pages, components, composables, assets/styles
worker/    nitro routes and helpers (api/, utils/, error.ts, middleware/)
shared/    code shared by app and worker (types, locale, translation DSL)
```
