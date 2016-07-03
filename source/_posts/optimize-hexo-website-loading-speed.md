---
title: 记录近期优化网站加载速度的实践
categories: [原创, 实践]
date: 2016-07-02 21:18:18
tags: [优化, gulp, async, defer]
---
前两天开始使用 hexo 搭建此博客网站, 本地开发的时候没管什么加载速度, 写完就直接扔 GitHub Pages 上了, 也就意味着网站能正常运行了. 不过访问了几次后发现加载速度有点儿不尽人意, 大概查看了下资源加载进程, 发现拉取的各种资源都是源码, hexo 在发布时并没有做任何优化! 所以就开始想着要优化一下网站的加载速度, 下面记录一下优化的具体细节.

<!--more-->

## 使用 [coding.me](http://coding.me) 提供的 Coding Pages 替代 GitHub Pages

GitHub 是国外网站, 服务器自然架在国外, 而且由于 *不可知* 的原因 GitHub 还可能被 *bi...* 而无法访问, 找到一个国内服务器进行博客搭建自然能提供最佳保障, 当然不想自己购买服务器使用国内 GitHub 的同类型网站提供的服务就成了最好的选择. 不过呢, 源码还是直接挂在 GitHub 即可, 直接修改 hexo 的配置文件 `_config.yml` 中 deploy 字段添加多个仓库. 例如:

```
deploy:
  type: git
  repo:
    github-master: git@github.com:JounQin/JounQin.github.io.git,master
    github-pages: git@github.com:JounQin/blog.git,gh-pages
    coding: git@git.coding.net:JounQin/JounQin.git,master
```

设置 DNS 将域名 CNAME 解析到 *pages.coding.me* 并在 Coding 绑定后即可, 这样访问自己的域名就能使用国内的 Coding 服务器了.

这样处理以后网站的初始化速度已经有了大幅提升了, 然而这还远远不够.

## 使用国内 CND 服务

NexT 主题提供了配置第三方库 CND 的设置 (详见[进阶设定](http://theme-next.iissnan.com/advanced-settings.html)), 如果需要升级第三方库版本也可以在这里修改. 目前我使用的 CDN 服务是 [BootCDN](http://www.bootcdn.cn/).

## 使用 async 或 defer 方式引入 script

由于使用 [阅读次数统计](http://theme-next.iissnan.com/third-party-services.html#analytics-busuanzi) 过程中出现过 *leancloud* 加载执行缓慢而造成文档渲染阻塞的问题, 便想办法改进, 幸而 [HTML5](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script) 中新增了 `async` 和 `defer` 属性(只支持外部脚本), 可以让文档和其他脚本先加载, 因此找到可以优化的脚本, 如 `localsearch` 和 `leancloud` 部分等, 根据实际情况添加 `defer` 属性 (注意在本地测试通过后再提交).

## 使用构建工具对静态资源进行压缩优化

[gulp 4.0](https://github.com/gulpjs/gulp/tree/4.0) 即将发布, 现在已经可以开始使用.

### 安装:

``` bash
npm uninstall -g gulp
npm i -g gulp-cli
npm i --save-dev autoprefixer del gulpjs/gulp-cli#4.0 gulp-load-plugins gulp-postcss gulp-posthtml gulp-uglify gulp-xml postcss-clean posthtml-minifier posthtml-postcss
```

### 配置(*gulpfile.js*):

``` javascript
const gulp = require('gulp'),
    postcss = require('posthtml-postcss'),
    htmlmin = require('posthtml-minifier'),
    autoprefixer = require('autoprefixer'),
    cleancss = require('postcss-clean'),
    $ = require('gulp-load-plugins')(),
    del = require('del');

const app = {
        build: 'build'
    },
    base = 'public/**/*.';

['css', 'js'].forEach(function (value) {
    app[value] = [`${base + value}`, `!${base}min.${value}`];
});

['html', 'xml'].forEach(function (value) {
    app[value] = `${base + value}`;
});

function clean() {
    return del(app.build);
}

function css() {
    return gulp.src(app.css)
        .pipe($.postcss([
            autoprefixer(),
            cleancss()]))
        .pipe(gulp.dest(app.build));
}

function js() {
    return gulp.src(app.js)
        .pipe($.uglify())
        .pipe(gulp.dest(app.build));
}

function html() {
    return gulp.src(app.html)
        .pipe($.posthtml([
            postcss([autoprefixer, cleancss]),
            htmlmin({
                collapseBooleanAttributes: true,
                collapseWhitespace: true,
                minifyCSS: true,
                minifyJS: true,
                removeTagWhitespace: true
            })
        ]))
        .pipe(gulp.dest(app.build));
}

function xml() {
    return gulp.src(app.xml)
        .pipe($.xml({
            parseOpts: {
                trim: true
            },
            buildOpts: {
                renderOpts: {
                    pretty: false
                },
                allowSurrogateChars: true,
                cdata: true
            },
            callback: function (result) {
                return result.replace(/\s{2,}/g, ' ');
            }
        }))
        .pipe(gulp.dest(app.build));
}

gulp.task(clean);

gulp.task('default', gulp.series(
    clean,
    gulp.parallel(css, js, html, xml)
));
```

PS: [gulp-xml](https://github.com/JounQin/gulp-xml) 是为了处理压缩 `search.xml` 和 `sitemap.xml` 等 `.xml` 文件而使用 [node-xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) 编写的 [gulp 插件](https://github.com/gulpjs/plugins), 欢迎使用.

至此个人能优化的地方已经完成, 至于其他的, 例如服务器端的优化等我们就无能为力了, 另外由于是使用了 hexo 架构, 对资源文件的打包优化也暂不考虑.

---

完成上面的工作后, 应该能明显感觉到首屏加载速度的提升, 有服务器资源的同学也可以将博客架在自己的服务器上后再近一步做些优化, 例如:

1. 对大部分服务器资源 (除 `index.html` 文件外) 进行 hash 版本化, 使文件缓存事件最大化, 使用 *200(from cache)* 状态取代 *304(Not Modified)*.
1. 使用构建工具对资源依赖近一步合并: [gulp-concat](https://github.com/contra/gulp-concat) / [gulp-replace](https://github.com/lazd/gulp-replace).
1. 最彻底的办法可能就是 —— 使用模块系统自己完整地搭建属于自己的网站. :) 因此我个人也开始用 [react-redux-starter-kit-cn](https://github.com/JounQin/react-redux-starter-kit-cn) 搭建一个完全自主可控的网站.

## 记录下对 HTTPS 的尝试

[kloudsec](https://kloudsec.com/) 免费提供对 *GitHub Pages* SSL 加密服务 (使用 [Let’s Encrypt](https://letsencrypt.org/)), 尝试后确实能对网站启用更安全的 HTTPS 服务, 然而奈何国内访问速度较慢, 国内也没有类似的免费加密服务, 只能作罢, 有需要的也可以尝试一下. 有能力的话还是自己使用自己的服务器进行 SSL 验证为妙.

最后, 安利下 [新主页](http://1stg.me/).