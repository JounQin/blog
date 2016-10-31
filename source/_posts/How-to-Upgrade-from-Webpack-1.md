---
title: 如何从 Webpack 1 升级至 Webpack 2
categories: [转载, 学习]
tags: [翻译, 前端]
date: 2016-10-24 12:48:26
---
### `resolve.root`, `resolve.fallback`, `resolve.modulesDirectories`

这些配置项被替换为一个单独的配置 `resolve.modules`。前往 [resolving](/configuration/resolve) 查看更多用例。

``` diff
  resolve: {
-   root: path.join(__dirname, "src")
+   modules: [
+     path.join(__dirname, "src"),
+     "node_modules"
+   ]
  }
```

### `resolve.extensions`

这个配置项不再要求传入一个空字符串。此行为已经被移至 `resolve.enforceExtension`。前往 [resolving](/configuration/resolve) 查看更多用例。

### `resolve.*`

更多的东西都在这里有变化。没有把它详细的列出来因为它不是经常用到。前往 [resolving](/configuration/resolve) 查看更多细节。

### `debug`

这个 `debug` 配置在 webpack 1 中切换加载器至调试模式。这需要长期通过加载器配置传入。浏览加载器文档查看相关配置项。

加载器的调试模式将在 webpack 3 及以后的版本中移除。

为了保持与旧的加载器的兼容性，加载器可以通过插件来开启调试模式：

``` diff
- debug: true,
  plugins: [
+   new webpack.LoaderOptionsPlugin({
+     debug: true
+   })
  ]
```

### `UglifyJsPlugin` sourceMap

这个 `UglifyJsPlugin` 的`sourceMap` 配置现在默认为 `false` 而不再是 `true`。
这意味着如果为压缩的代码使用 SourceMaps 功能你需要传入 `sourceMap: true`。

``` diff
  devtool: "source-map",
  plugins: [
    new UglifyJsPlugin({
+     sourceMap: true
    })
  ]
```

### `UglifyJsPlugin` 压缩加载器

这个 UglifyJsPlugin 不再将加载器切换至压缩模式。这需要长期通过加载器配置传入。浏览加载器文档查看相关配置项。

加载器的压缩模式将在 webpack 3 及以后的版本中移除。

为了保持与旧的加载器的兼容性，加载器可以通过插件来开启压缩模式：

``` diff
  plugins: [
+   new webpack.LoaderOptionsPlugin({
+     minimize: true
+   })
  ]
```

### `OccurrenceOrderPlugin` 现在默认启用了

它不再必要在配置中特别指定了。

``` diff
  plugins: [
-   new webpack.optimize.OccurrenceOrderPlugin()
  ]
```

### `ExtractTextWebpackPlugin` - 重大变更

[ExtractTextPlugin](https://github.com/webpack/extract-text-webpack-plugin) 1.0.0 不能与 webpack 2一起使用。变化注释是语法。The changes are mainly syntactical

#### `ExtractTextPlugin.extract`

```diff
module: {
  loaders: [
    test: /.css$/,
-    loader: ExtractTextPlugin.extract['css-loader']
+    loader: ExtractTextPlugin.extract({
+               fallbackLoader: "style-loader",
+               loader: "css-loader",
+               publicPath: "/dist" // Overrides output.publicPath
+     })
  ]
}
```

#### `new ExtractTextPlugin({options})`

```diff
plugins: [
-  new ExtractTextPlugin("bundle.css", {allChunks: true, disable: false})
+  new ExtractTextPlugin({
+   filename: "bundle.css",
+   disable: false,
+   allChunks: true
+  })
]
```


### 完全动态的 require 表达式现在默认失败了

一个仅有一个表达式的依赖（例如 `require(expr)`）将创建一个空的上下文而不是完整目录的上下文。

最好重构一下这种代码因为它无法在 ES6 模块中使用。如果做不到的话你可以使用 `ContextReplacementPlugin` 来提示编译器进行正确解析。查看 [dynamic dependencies](dynamic-dependencies)。

### 在命令行和配置中使用自定义参数

如果你像下面这样滥用命令行来传入自定义参数进行配置：

`webpack --custom-stuff`

``` js
// webpack.config.js
var customStuff = process.argv.indexOf("--custom-stuff") >= 0;
/*...*/
```

你会发现现在不再运行这样了。命令行现在更严格了。

相反，现在有一个传入参数给配置的接口。这应该用来替代以前的方式。未来的工具可能依赖于此。

`webpack --env.customStuff`

``` js
module.exports = function(env) {
  var config, customStuff = env.customStuff;
  /*...*/
  return config;
};
```

查看 [CLI](../api/cli).

### `require.ensure` 和 AMD `require` 是异步的

这些函数现在会一直是异步的而不是当分块儿已经加载完成时就同步调用他们的回调函数。

### `module.loaders` 现在是 `module.rules`

以前的加载器配置被一个更强大的规则系统取代，这将允许配置加载器和更多信息。

由于兼容性的原因旧的语法也是合法的，旧的名称会被转译。

新的命名更易于理解，有很好的理由进行升级配置。

``` diff
  module: {
-   loaders: [
+   rules: [
      {
        test: /\.css$/,
-       loaders: [
+       use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
-           query: {
+           options: {
              modules: true
            }
        ]
      }
    ]
  }
```

### `module.preLoaders` 和 `module.postLoaders` 被移除了

``` diff
  module: {
-   preLoaders: [
+   rules: [
      {
        test: /\.js$/,
+       enforce: "pre",
        loader: "eslint-loader"
      }
    ]
  }
```

### `LoaderOptionPlugin` 上下文

一些加载器需要上下文信息并从配置中读取。这需要长期通过加载器配置传入。浏览加载器文档查看相关配置项。

为了保持与旧的加载器的兼容性，这个信息可以用个插件传入：

``` diff
  plugins: [
+   new webpack.LoaderOptionsPlugin({
+     options: {
+       context: __dirname
+     }
+   })
  ]
```

#### 使用 ES6 进行代码分割

在 webpack v1 中，你可能会用到 `require.ensure` 为你的应用作为懒加载分块代码的方法：

```javascript
require.ensure([], function(require) {
  var foo = require("./module");
});
```

ES6 加载器特别定义了 `System.import` 作为运行时动态加载 ES6 模块的方法。

webpack 将 `System.import` 视为代码分割点并将请求的模块都放入成单独的分块中。

`System.import` 将模块名称作为参数并返回一个 Promise。

``` js
function onClick() {
	System.import("./module").then(module => {
		module.default;
	}).catch(err => {
		console.log("Chunk loading failed");
	});
}
```

好消息：加载分块失败现在可以进行处理了，因为他们是基于 `Promise` 的。

#### 动态表达式

可以传递一部分表达式给 `System.import`。这将和 CommonJS 中的表达式进行类似的处理（webpack 创建一个包含所有可能文件的[上下文](https://webpack.github.io/docs/context.html)）。

`System.import` 为每一个可能的模块创建一个单独的分块。

``` js
function route(path, query) {
	return System.import("./routes/" + path + "/route")
		.then(route => new route.Route(query));
}
// This creates a separate chunk for each possible route
```

#### 在 ES6 中混合使用 AMD 和 CommonJS

对于 AMD 和 CommonJS 你可以自由地混合它们三种模块方式（甚至是在同一个文件中）。在这种情况下 webpack 表现得和 babel 类似：

``` js
// CommonJS consuming ES6 Module
var book = require("./book");

book.currentPage;
book.readPage();
book.default === "This is a book";
```

``` js
// ES6 Module consuming CommonJS
import fs from "fs"; // module.exports map to default
import { readFileSync } from "fs"; // named exports are read from returned object+

typeof fs.readFileSync === "function";
typeof readFileSync === "function";
```

很重要的一点是你需要告诉 Babel 不要解析这些模块标识然后 webpack 就可以利用它们了。你可以通过在你的 `.babelrc` 文件或 babel-loader 的配置中设置以下内容。

**.babelrc**

```json
{
  "presets": [
    ["es2015", { "modules": false }]
  ]
}
```
