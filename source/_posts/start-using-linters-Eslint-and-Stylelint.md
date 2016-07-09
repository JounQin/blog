---
title: 开始使用代码检测工具 Eslint 和 Stylelint
categories: [原创, 学习]
tags: 前端
date: 2016-07-07 10:41:14
---

很早以前就听说过各种代码检测工具, 从 [JSLint](http://www.jslint.com/) 到 [JSHint](http://jshint.com/), 又到 [JSCS](http://jscs.info/), 再到现在最强大的代码检测工具当属 [ESLint](http://eslint.org/) (中文译站: [ESLint.cn](http://eslint.cn/)). [Lint](https://zh.wikipedia.org/wiki/Lint) 是一个计算机术语, 是一种静态程序分析工具的统称, 可以用于分析代码书写问题、提升代码可读性、统一项目代码风格等.

但是之前都感觉 ESLint 的规则配置非常麻烦, 懒得去搞清楚每条规则适用的情况, 而且强大的 [IDEA](https://www.jetbrains.com/idea/) 开发工具已经预置了代码校验和格式化功能, 所以一直没有在意去使用它.

<!--more-->

不过使用 [react-redux-starter-kit-cn](https://github.com/JounQin/react-redux-starter-kit-cn) 后项目里预置了 ESLint, 使用过程中发现项目里预置的代码风格和 IDEA 格式化风格相差甚远, 便想看看这个校验工具到底怎么玩儿, 硬着头皮查看校验时的报错信息, 然后根据 [rules](http://eslint.org/docs/rules/) 一个个调整 ESLint 配置文件, 使用过程中也慢慢明白该如何适应和配置 ESLint.

## 使用 ESLint

### 配置文件

下面是 [1stg](https://github.com/JounQin/1stg) 项目使用的 `.eslintrc` 配置文件, 完全符合 IDEA 预置格式化风格:

``` json
{
  "parser": "babel-eslint",
  "plugins": [
    "babel"
  ],
  "extends": [
    "standard",
    "standard-react"
  ],
  "env": {
    "browser": true
  },
  "globals": {
    "__DEV__": false,
    "__PROD__": false,
    "__DEBUG__": false,
    "__COVERAGE__": false,
    "__BASENAME__": false
  },
  "rules": {
    "babel/generator-star-spacing": 1,
    "eol-last": 2,
    "generator-star-spacing": 0,
    "jsx-quotes": [
      2,
      "prefer-double"
    ],
    "max-depth": 2,
    "max-len": [
      2,
      120,
      2
    ],
    "max-nested-callbacks": 2,
    "max-params": 2,
    "react/jsx-space-before-closing": [
      2,
      "never"
    ],
    "semi": [
      2,
      "always"
    ],
    "space-before-function-paren": [
      2,
      {
        "anonymous": "always",
        "named": "never"
      }
    ],
    "object-curly-spacing": 2,
    "array-bracket-spacing": 2,
    "computed-property-spacing": 2
  }
}
```

### 配置解析

让我们一起来看下这份配置文件, 这是一份 `json` 格式的配置文件, 当然也有 [其他格式](http://eslint.cn/docs/user-guide/configuring#configuration-file-formats) 可选.

* `parser` 指定 ESLint 使用的解析器, 我们使用 [babel-eslint](https://github.com/babel/babel-eslint) 因为我们使用了诸如 class properties, decorators, async/await, types 等特性, ESLint 尚未原生支持.
* `plugins` 指定添加第三方插件, 我们使用 [eslint-plugin-babel](https://github.com/babel/eslint-plugin-babel) 使支持添加 `babel-eslint` 校验配置
* `extends` 指定已经启用的规则, 需要安装 `eslint-config-[extend]` 包, 我们使用了 [eslint-config-standard](https://github.com/feross/eslint-config-standard) 和 [eslint-config-standard-react](https://github.com/feross/eslint-config-standard-react)
* `env` 指定脚本运行环境, 使预定义一些全局变量
* `globals` 运行时需要的其他的全局变量, 否则会被视为未定义而报错
* `rules` 可以根据自己的需要覆盖上面继承的已有配置

### 忽略文件

* 可以使用 `.eslintignore` 文件定义需要忽略的文件夹或单独的文件
* 对于文件中部分需要忽略校验的部分, 可以使用两段注释文本包围起来: `/* eslint-disable */`、`/* eslint-enable */`

### 运行及自动修复

一份相对简单的 ESLint 配置就完成了, 开始运行 `eslint <directory 目录名称>` 开始检验, 添加 `--fix` 参数可以让 ESLint 尝试自动修复一些代码风格问题.

## 使用 stylelint

[stylelint](http://stylelint.io/) 是『一个强大的、现代化的 CSS 检测工具』, 与 ESLint 类似, 是通过定义一系列的编码风格规则帮助我们避免在样式表中出现错误.

`stylelint` 出现前已经有 `csslint` 工具, 与 `ESLint` 出现前的 `JSLint` 类似, 由于技术局限它们的语法校验规则很难扩展, 继而由新的工具替代. `stylelint` 出现在 `postcss` 诞生之后, 因而它可以『理解』类 CSS 语法, 例如: CSSNext, PreCSS, LESS, SCSS, SugarSS.

### 配置文件

下面是 [1stg](https://github.com/JounQin/1stg) 项目使用的 `.stylelintrc` 配置文件:

``` json
{
  "extends": "stylelint-config-standard",
  "plugins": [
    "stylelint-scss"
  ],
  "rules": {
    "no-invalid-double-slash-comments": null,
    "number-leading-zero": "never",
    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": ":global,:local"
      }
    ],
    "selector-pseudo-element-colon-notation": "single"
  }
}

```

### 配置解析

可以看出来, 配置规则和 `ESLint` 差不多, 不过还是有些差异的.

* `plugins` 指定添加第三方插件, 使支持更多的规则配置, 我们是用来 `stylelint-scss` 以启用 SCSS 语法
* `extends` 指定已经启用的规则, 需要安装 `stylelint-config-[extend]` 包, 我们使用了 [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard)
* `defaultSeverity` 对于未指定错误提示级别的等级
* `rules` 与 `ESLint` 的 `rules` 使用 `[0, 1, 2]` 来代表规则启用状态不同, 而是每个规则都不同 (个人觉得略不方便), 一般的规则可以在 [rules](http://stylelint.io/user-guide/rules/) 查找调整

### 忽略文件

* 可以使用 `.stylelintignore` 文件定义需要忽略的文件夹或单独的文件
* 对于文件中部分需要忽略校验的部分, 可以使用两段注释文本包围起来: `/* stylelint-disable */`、`/* stylelint-enable */`

### 运行及自动修复

``` bash
stylelint "foo/*.css"
```

不过与 ESLint 自身提供修复编码风格问题不同, stylelint 本身并未提供这样的工具, 不过可以使用 [stylefmt](https://github.com/morishitter/stylefmt) 对其中已定义的风格规则进行格式化, 对于尚未支持的规则可以提交 issue.

``` bash
stylefmt "foo/*.css"
```
