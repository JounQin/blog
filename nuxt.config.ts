import { fileURLToPath } from 'node:url'

const DEFAULT_EXCLUDED_LABELS = [
  'dependencies',
  'feature',
  'flag',
  'greenkeeper',
  'PR: draft',
  'PR: merged',
  'PR: partially-approved',
  'PR: reviewed-approved',
  'PR: reviewed-changes-requested',
  'PR: unreviewed',
  'security',
].join(',')

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

const TITLE = '1stG Blog'

// Minimal shape of a PostCSS node, so this config does not have to depend on
// `postcss` types directly (Vite ships it transitively)
interface PostCssNode {
  type: string
  prop?: string
}

// `github-markdown-css` declares its design tokens on `.markdown-body` (and on
// `[data-theme="…"]`, but only *inside* its own `prefers-color-scheme` queries).
// Custom properties only inherit downwards, so nothing outside the article body
// — `:root`, the navbar, the footer, cards — can read `--bgColor-*`,
// `--fgColor-*` or `--borderColor-*`. Adding `:root` to those token rules lifts
// them to the document root, so the rest of the app can consume the very same
// palette instead of keeping a second, hand-maintained copy of GitHub's colors.
const hoistGithubMarkdownTokens = {
  postcssPlugin: 'hoist-github-markdown-tokens',
  Rule(rule: { selectors: string[]; nodes: PostCssNode[] }) {
    const isTokenRule =
      rule.selectors.length > 0 &&
      rule.selectors.every(
        selector =>
          selector === '.markdown-body' || /^\[data-theme\s*=/.test(selector),
      ) &&
      // `.markdown-body` is not only used for tokens: the base rule carries
      // `font-size: 16px`, the font stack and `line-height`, and `:root` would
      // out-specify `html { font-size: 14px }`, scaling every rem on the page in
      // both colour schemes. Only the token rules qualify — they declare nothing
      // but custom properties, plus the `color-scheme` marker, which belongs on
      // `:root` anyway.
      rule.nodes.every(
        node =>
          node.type !== 'decl' ||
          node.prop?.startsWith('--') ||
          node.prop === 'color-scheme',
      )

    if (isTokenRule && !rule.selectors.includes(':root')) {
      rule.selectors = [':root', ...rule.selectors]
    }
  },
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Nuxt 4 layout: UI lives in app/, the Cloudflare/nitro routes live in worker/
  srcDir: 'app/',

  ssr: true,

  compatibilityDate: '2025-07-15',

  devtools: { enabled: false },

  modules: ['@nuxt/eslint', '@vite-pwa/nuxt'],

  pwa: {
    registerType: 'autoUpdate',
    // the module owns the web manifest and injects <link rel="manifest">
    manifest: {
      name: '1stG Blog',
      short_name: '1stG',
      start_url: '/',
      background_color: '#fff',
      theme_color: '#6c757d',
      display: 'standalone',
      icons: [
        { src: '/logo-48.png', sizes: '48x48', type: 'image/png' },
        { src: '/logo-120.png', sizes: '120x120', type: 'image/png' },
        { src: '/logo-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/logo-384.png', sizes: '384x384', type: 'image/png' },
        { src: '/logo-512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2,eot,ttf}'],
      // server rendered app: a navigation must never be answered from a cached
      // shell (the legacy app had no SPA fallback either)
      navigateFallbackDenylist: [/.*/],
      cleanupOutdatedCaches: true,
    },
    devOptions: {
      enabled: false,
    },
  },

  css: [
    'font-awesome/css/font-awesome.css',
    'github-markdown-css/github-markdown.css',
    'typeface-lato',
    '~/assets/styles/main.scss',
  ],

  app: {
    head: {
      title: TITLE,
      titleTemplate: (title?: string) =>
        title ? `${TITLE} | ${title}` : TITLE,
      htmlAttrs: {
        lang: 'zh-cmn-Hans-CN',
      },
      meta: [
        { charset: 'UTF-8' },
        { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge,chrome=1' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1,shrink-to-fit=no' },
        // follow the same `prefers-color-scheme` switch as the stylesheets so
        // the browser chrome matches the rendered surface
        {
          name: 'theme-color',
          content: '#f8f9fa',
          media: '(prefers-color-scheme: light)',
        },
        {
          name: 'theme-color',
          content: '#151b23',
          media: '(prefers-color-scheme: dark)',
        },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/logo-120.png' },
        { rel: 'shortcut icon', sizes: '48x48', href: '/logo-48.png' },
        // the PWA module generates the file; the link is declared explicitly
        // because `app.head` here replaces the module's own head config
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
      base: {
        target: '_blank',
      },
    },
  },

  vite: {
    css: {
      // Nuxt builds `css.postcss.plugins` from this config alone and never reads
      // `.postcssrc.js`, while Vite concatenates the arrays it is given, so this
      // runs alongside whatever Nuxt resolved on its own
      postcss: {
        plugins: [hoistGithubMarkdownTokens],
      },
      preprocessorOptions: {
        scss: {
          // sass needs the extra load paths for the bootstrap partials,
          // `additionalData` replaces the legacy style-resources-loader injection
          loadPaths: [
            resolve('./app/assets/styles'),
            resolve('./node_modules/bootstrap/scss'),
          ],
          additionalData: "@import 'pre-bootstrap';\n",
          // Bootstrap 5.3 still uses @import, global builtins and the if()
          // syntax: quietDeps silences warnings raised from node_modules, and
          // the remaining categories that reach our own files are listed here
          quietDeps: true,
          silenceDeprecations: [
            'import',
            'global-builtin',
            'color-functions',
            'if-function',
          ],
        },
      },
    },
  },

  routeRules: {
    // the service worker keeps a stable name: never let a browser/CDN cache it
    // (the legacy build did the same with `files['/service-worker.js'].maxAge = 0`)
    '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    '/manifest.webmanifest': {
      headers: { 'cache-control': 'public, max-age=3600' },
    },
  },

  nitro: {
    preset: 'cloudflare_module',
    // keep nitro out of the legacy `server/` directory of the Vue 2 implementation
    srcDir: resolve('./worker'),
    errorHandler: resolve('./worker/error.ts'),
    alias: {
      // node-fetch-native's exports map confuses the bundler for subpaths under
      // the `workerd` condition; point it at the real (no-op) proxy stub
      'node-fetch-native/proxy': resolve(
        './node_modules/node-fetch-native/dist/proxy-stub.mjs',
      ),
    },
    cloudflare: {
      deployConfig: false,
    },
  },

  runtimeConfig: {
    // NUXT_GITHUB_TOKEN
    githubToken: '',
    github: {
      // NUXT_GITHUB_API_URL (self-hosted GitHub / local stub server)
      apiUrl: 'https://api.github.com/graphql',
      owner: 'JounQin',
      name: 'blog',
      ownerType: 'user',
      excludedLabels: DEFAULT_EXCLUDED_LABELS,
      excludedRepositoryOwners: '',
      clientId: '',
      clientSecret: '',
      oauthCallback: '',
    },
  },

  typescript: {
    strict: false,
    typeCheck: false,
  },
})
