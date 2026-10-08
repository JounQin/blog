# Upstream report: nitropack resolver ENOTDIR

Target: **[nitrojs/nitro](https://github.com/nitrojs/nitro)** (nitropack lives there) ·
Related: [unjs/node-fetch-native#169](https://github.com/unjs/node-fetch-native/issues/169) (comment with the same evidence),
[unjs/node-fetch-native#114](https://github.com/unjs/node-fetch-native/issues/114)

## Title

```
bug: ENOTDIR when resolving a conditional-exports subpath under the workerd condition
```

## Body

### Environment

- `nitropack@2.13.4` (resolver in `nitropack/dist/rollup/index.mjs`, Rollup `4.60.2`),
  `nuxt@4.6.0`, `node-fetch-native@1.6.7`, `@deeplx/core@0.2.2`, workerd `1.20261006.1`, Node `24.21.0`

### Reproduction

```ts
// nuxt.config.ts
export default defineNuxtConfig({ nitro: { preset: 'cloudflare_module' } })
```

```ts
// server/api/repro.get.ts
import { createProxy } from 'node-fetch-native/proxy'

export default defineEventHandler(() => createProxy({}))
```

`nuxt build` fails before writing any output.

### Actual behaviour

```
ERROR  Error: ENOTDIR: not a directory, stat
 '/…/node_modules/node-fetch-native/dist/native.mjs/proxy'
```

The resolver resolved the package root to `dist/native.mjs` (a file) and appended
the subpath to it, producing a path that cannot exist.

### Why that path appears

`node-fetch-native@1.6.7` maps the `workerd` condition on the root entry to a
file, while the subpath only has `node` and `default`:

```jsonc
{
  ".":       { "workerd": "./dist/native.mjs", /* … */ },
  "./proxy": {
    "node":    { "default": "./dist/proxy.cjs" },
    "default": { "import": { "default": "./dist/proxy-stub.mjs" } }
  }
}
```

`"./proxy"` still has a `default` branch, so the spec-compliant answer under the
worker condition set is the stub:

```
conditions = workerd, worker, browser, import, default
"./proxy"  -> ./dist/proxy-stub.mjs
"."        -> ./dist/native.mjs
```

### Expected behaviour

Either resolve `"./proxy"` through its `default` branch
(`dist/proxy-stub.mjs`), or fail with a clear message such as "no matching export
condition for subpath". Resolving a path *through a file* and letting the OS
return `ENOTDIR` hides the real cause.

### Workaround in use

```ts
nitro: {
  alias: {
    'node-fetch-native/proxy': resolve('./node_modules/node-fetch-native/dist/proxy-stub.mjs'),
  },
}
```

### Related

- unjs/node-fetch-native#114 — the same subpath fails under Bun as well
- unjs/node-fetch-native#169 — request to add the worker conditions to `"./proxy"`

## Submitted

https://github.com/nitrojs/nitro/issues/4751
