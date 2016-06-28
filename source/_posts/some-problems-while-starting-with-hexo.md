---
title: 使用 Hexo 搭建免费博客遇到的几个坑
date: 2016-06-28 21:40:58
categories: 默认
tags: 问题修复
---

今天开始尝试使用 Hexo 替代 Jekyll 搭建 GitHub Pages 免费博客, 期间由于一些惯性思维或技术细节不熟悉的原因折腾了很久才成功完整地发布博客工程, 下面记录一下具体遇到的问题和解决过程。

<!--more-->

## 项目结构的变化

由于 Jekyll 中最终发布的博客内容文件也处于博客源码项目, 第一次搭建博客时运行 `hexo deploy` 成功后实际上只是把 *product* 目录发布到 *GitHub Pages* [个人主页工程](https://JounQin.github.io), 也就是说 Hexo 的源码和最终的博客内容是分开的. 其实是因为 Jekyll 得到 GitHub 的官方支持而已, 当然 Hexo 配置好后搭建博客也相当方便.

## 项目发布配置

1. Hexo 发布到 GitHub 只需要调整 *_config.yml* 文件中的 *deploy* 部分内容, 但是需要注意的是, *git* 配置对应的路径必须是 ssh 格式的, 而不是 *https*, 否则 `hexo deploy` 是无法发布成功的.
1. 为了实现提交博客源码自动发布代码到 *GitHub Pages* 工程, 可以选择使用 [travis-ci](https://travis-ci.org/) (参考 [使用 travis-ci 自动部署 hexo 博客](http://w3cboy.com/post/2016/03/travisci-hexo-deploy/)), 运行 `travis encrypt-file ~/.ssh/id_rsa --add` 自动添加密钥信息时 `~/.ssh/id_rsa` 会被写成 `~\/.ssh/id_rsa`, 这会导致 *travis-ci* 运行失败.
1. 由于变更了 *id_rsa.enc* 文件的位置, 因此对应地 *.travis.yml* 文件中也要调整.
