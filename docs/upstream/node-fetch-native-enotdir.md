# Upstream report: `node-fetch-native/proxy` cannot be bundled for `workerd`

Target repository: **[unjs/node-fetch-native](https://github.com/unjs/node-fetch-native)**
Related issue: [#114 · bug: node-fetch-native/proxy](https://github.com/unjs/node-fetch-native/issues/114)

## Title

```
bug: ENOTDIR when bundling `node-fetch-native/proxy` with the `workerd` condition (nitro / Cloudflare Workers)
```

## Body (copy from here)

### Environment

- `node-fetch-native@1.6.7`
- consumed by `@deeplx/core@0.2.2` (`lib/translate.js`):

  ```js
  import { createProxy } from 'node-fetch-native/proxy'
  ```

- bundler: Nuxt `4.6.0` → `nitropack@2.13.4` (Rollup `4.60.2` resolver), nitro preset `cloudflare_module`
- Node `24.21.0`, wrangler `4.148.0`

### Reproduction

Any server-side module that imports the `proxy` subpath, bundled with the `workerd` condition
active (for example a Nuxt/nitro app with `nitro.preset = 'cloudflare_module'`):

```ts
import { createProxy } from 'node-fetch-native/proxy'

export default defineEventHandler(() => createProxy({}))
```

`nuxt build` then fails before writing any output.

### Actual behaviour

```
 ERROR  Error: ENOTDIR: not a directory, stat
 '/home/app/.../node_modules/node-fetch-native/dist/native.mjs/proxy'
```

The resolver resolved the package root to `dist/native.mjs` (a file) and then appended the
`proxy` subpath to that file path.

### Expected behaviour

The subpath should resolve to the non-node stub (`dist/proxy-stub.mjs`), which is what the
`default` branch of the exports map already declares, and what the other runtime conditions do
for the package root.

### Analysis

`package.json` of `node-fetch-native@1.6.7` (abridged):

```jsonc
{
  "exports": {
    ".": {
      "workerd": "./dist/native.mjs", // ← the root resolves to a FILE under this condition
      "worker": "./dist/native.mjs",
      // …other runtime conditions…
      "node": { "import": "./dist/index.mjs", "require": "./lib/index.cjs" },
      "default": "./dist/native.mjs",
    },
    "./proxy": {
      "node": { "default": "./dist/proxy.cjs" },
      "default": {
        "import": { "default": "./dist/proxy-stub.mjs" },
        "require": { "default": "./dist/proxy-stub.cjs" },
      },
    },
  },
}
```

`"./proxy"` has **no `workerd`/`worker`/`browser` … condition** — only `node` and `default`. A
resolver that has already matched the `workerd` condition for the root then falls back to legacy
"resolve the package entry, append the subpath" behaviour, which cannot work when the matched
entry is a file, and produces `dist/native.mjs/proxy`.

Issue #114 reports the same subpath failing under Bun (`No matching export … for import "fetch"`
from `dist/proxy.cjs`), so `./proxy` resolution looks fragile for non-node targets in general.

### Workaround in use

```ts
// nuxt.config.ts
nitro: {
  alias: {
    'node-fetch-native/proxy': resolve('./node_modules/node-fetch-native/dist/proxy-stub.mjs'),
  },
}
```

The stub is the intended implementation for runtimes without proxy support:

```js
function createProxy() {
  return { agent: undefined, dispatcher: undefined }
}
```

so the behaviour is unchanged (a `proxyUrl` passed on such a runtime is a no-op anyway).

### Suggested fixes (any of these)

1. Add the same runtime conditions to `"./proxy"` that `"."` already has, all pointing at the
   stub, e.g. `"workerd": "./dist/proxy-stub.mjs"`, `"worker"`, `"browser"`, `"edge-light"`, …
2. Or drop the nested condition object for `"./proxy"` and keep a flat `node` + `default` string,
   so simple resolvers do not need the fallback path.
3. Or mark the subpath as Node-only and document it, so bundlers targeting workers never try to
   resolve it (consumers such as `@deeplx/core` would then need a conditional/dynamic import).

Thanks! Happy to test a prerelease build if that helps.

## Submit

`gh` is not available in the environment where this draft was written. Either:

- open this prefilled URL in a browser:
- or run:

  ```sh
  gh issue create -R unjs/node-fetch-native \
    --title 'bug: ENOTDIR when bundling `node-fetch-native/proxy` with the `workerd` condition (nitro / Cloudflare Workers)' \
    --body-file docs/upstream/node-fetch-native-enotdir.md
  ```

Prefilled URL:

```
https://github.com/unjs/node-fetch-native/issues/new?title=bug%3A%20ENOTDIR%20when%20bundling%20%60node-fetch-native%2Fproxy%60%20with%20the%20%60workerd%60%20condition%20(nitro%20%2F%20Cloudflare%20Workers)&body=%23%23%23%20Environment%0A%0A-%20%60node-fetch-native%401.6.7%60%0A-%20consumed%20by%20%60%40deeplx%2Fcore%400.2.2%60%20(%60lib%2Ftranslate.js%60)%3A%0A%0A%20%20%60%60%60js%0A%20%20import%20%7B%20createProxy%20%7D%20from%20'node-fetch-native%2Fproxy'%0A%20%20%60%60%60%0A%0A-%20bundler%3A%20Nuxt%20%604.6.0%60%20%E2%86%92%20%60nitropack%402.13.4%60%20(Rollup%20%604.60.2%60%20resolver)%2C%20nitro%20preset%20%60cloudflare_module%60%0A-%20Node%20%6024.21.0%60%2C%20wrangler%20%604.148.0%60%0A%0A%23%23%23%20Reproduction%0A%0AAny%20server-side%20module%20that%20imports%20the%20%60proxy%60%20subpath%2C%20bundled%20with%20the%20%60workerd%60%20condition%0Aactive%20(for%20example%20a%20Nuxt%2Fnitro%20app%20with%20%60nitro.preset%20%3D%20'cloudflare_module'%60)%3A%0A%0A%60%60%60ts%0Aimport%20%7B%20createProxy%20%7D%20from%20'node-fetch-native%2Fproxy'%0A%0Aexport%20default%20defineEventHandler(()%20%3D%3E%20createProxy(%7B%7D))%0A%60%60%60%0A%0A%60nuxt%20build%60%20then%20fails%20before%20writing%20any%20output.%0A%0A%23%23%23%20Actual%20behaviour%0A%0A%60%60%60%0A%20ERROR%20%20Error%3A%20ENOTDIR%3A%20not%20a%20directory%2C%20stat%0A%20'%2Fhome%2Fapp%2F...%2Fnode_modules%2Fnode-fetch-native%2Fdist%2Fnative.mjs%2Fproxy'%0A%60%60%60%0A%0AThe%20resolver%20resolved%20the%20package%20root%20to%20%60dist%2Fnative.mjs%60%20(a%20file)%20and%20then%20appended%20the%0A%60proxy%60%20subpath%20to%20that%20file%20path.%0A%0A%23%23%23%20Expected%20behaviour%0A%0AThe%20subpath%20should%20resolve%20to%20the%20non-node%20stub%20(%60dist%2Fproxy-stub.mjs%60)%2C%20which%20is%20what%20the%0A%60default%60%20branch%20of%20the%20exports%20map%20already%20declares%2C%20and%20what%20the%20other%20runtime%20conditions%20do%0Afor%20the%20package%20root.%0A%0A%23%23%23%20Analysis%0A%0A%60package.json%60%20of%20%60node-fetch-native%401.6.7%60%20(abridged)%3A%0A%0A%60%60%60jsonc%0A%7B%0A%20%20%22exports%22%3A%20%7B%0A%20%20%20%20%22.%22%3A%20%7B%0A%20%20%20%20%20%20%22workerd%22%3A%20%22.%2Fdist%2Fnative.mjs%22%2C%20%20%20%2F%2F%20%E2%86%90%20the%20root%20resolves%20to%20a%20FILE%20under%20this%20condition%0A%20%20%20%20%20%20%22worker%22%3A%20%20%22.%2Fdist%2Fnative.mjs%22%2C%0A%20%20%20%20%20%20%2F%2F%20%E2%80%A6other%20runtime%20conditions%E2%80%A6%0A%20%20%20%20%20%20%22node%22%3A%20%7B%20%22import%22%3A%20%22.%2Fdist%2Findex.mjs%22%2C%20%22require%22%3A%20%22.%2Flib%2Findex.cjs%22%20%7D%2C%0A%20%20%20%20%20%20%22default%22%3A%20%22.%2Fdist%2Fnative.mjs%22%0A%20%20%20%20%7D%2C%0A%20%20%20%20%22.%2Fproxy%22%3A%20%7B%0A%20%20%20%20%20%20%22node%22%3A%20%7B%20%22default%22%3A%20%22.%2Fdist%2Fproxy.cjs%22%20%7D%2C%0A%20%20%20%20%20%20%22default%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%22import%22%3A%20%7B%20%22default%22%3A%20%22.%2Fdist%2Fproxy-stub.mjs%22%20%7D%2C%0A%20%20%20%20%20%20%20%20%22require%22%3A%20%7B%20%22default%22%3A%20%22.%2Fdist%2Fproxy-stub.cjs%22%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A%60%60%60%0A%0A%60%22.%2Fproxy%22%60%20has%20**no%20%60workerd%60%2F%60worker%60%2F%60browser%60%20%E2%80%A6%20condition**%20%E2%80%94%20only%20%60node%60%20and%20%60default%60.%20A%0Aresolver%20that%20has%20already%20matched%20the%20%60workerd%60%20condition%20for%20the%20root%20then%20falls%20back%20to%20legacy%0A%22resolve%20the%20package%20entry%2C%20append%20the%20subpath%22%20behaviour%2C%20which%20cannot%20work%20when%20the%20matched%0Aentry%20is%20a%20file%2C%20and%20produces%20%60dist%2Fnative.mjs%2Fproxy%60.%0A%0AIssue%20%23114%20reports%20the%20same%20subpath%20failing%20under%20Bun%20(%60No%20matching%20export%20%E2%80%A6%20for%20import%20%22fetch%22%60%0Afrom%20%60dist%2Fproxy.cjs%60)%2C%20so%20%60.%2Fproxy%60%20resolution%20looks%20fragile%20for%20non-node%20targets%20in%20general.%0A%0A%23%23%23%20Workaround%20in%20use%0A%0A%60%60%60ts%0A%2F%2F%20nuxt.config.ts%0Anitro%3A%20%7B%0A%20%20alias%3A%20%7B%0A%20%20%20%20'node-fetch-native%2Fproxy'%3A%20resolve('.%2Fnode_modules%2Fnode-fetch-native%2Fdist%2Fproxy-stub.mjs')%2C%0A%20%20%7D%2C%0A%7D%0A%60%60%60%0A%0AThe%20stub%20is%20the%20intended%20implementation%20for%20runtimes%20without%20proxy%20support%3A%0A%0A%60%60%60js%0Afunction%20createProxy()%20%7B%20return%20%7B%20agent%3A%20undefined%2C%20dispatcher%3A%20undefined%20%7D%20%7D%0A%60%60%60%0A%0Aso%20the%20behaviour%20is%20unchanged%20(a%20%60proxyUrl%60%20passed%20on%20such%20a%20runtime%20is%20a%20no-op%20anyway).%0A%0A%23%23%23%20Suggested%20fixes%20(any%20of%20these)%0A%0A1.%20Add%20the%20same%20runtime%20conditions%20to%20%60%22.%2Fproxy%22%60%20that%20%60%22.%22%60%20already%20has%2C%20all%20pointing%20at%20the%0A%20%20%20stub%2C%20e.g.%20%60%22workerd%22%3A%20%22.%2Fdist%2Fproxy-stub.mjs%22%60%2C%20%60%22worker%22%60%2C%20%60%22browser%22%60%2C%20%60%22edge-light%22%60%2C%20%E2%80%A6%0A2.%20Or%20drop%20the%20nested%20condition%20object%20for%20%60%22.%2Fproxy%22%60%20and%20keep%20a%20flat%20%60node%60%20%2B%20%60default%60%20string%2C%0A%20%20%20so%20simple%20resolvers%20do%20not%20need%20the%20fallback%20path.%0A3.%20Or%20mark%20the%20subpath%20as%20Node-only%20and%20document%20it%2C%20so%20bundlers%20targeting%20workers%20never%20try%20to%0A%20%20%20resolve%20it%20(consumers%20such%20as%20%60%40deeplx%2Fcore%60%20would%20then%20need%20a%20conditional%2Fdynamic%20import).%0A%0AThanks!%20Happy%20to%20test%20a%20prerelease%20build%20if%20that%20helps.
```
