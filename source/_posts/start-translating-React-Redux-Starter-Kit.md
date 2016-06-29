---
title: 开始翻译 React Redux Starter Kit
date: 2016-06-29 09:50:17
categories: 
- 默认
- 原创
- 学习
tags: [翻译, 前端]
---
## react-redux-starter-kit 简要介绍

[react-redux-starter-kit](https://github.com/davezuko/react-redux-starter-kit) 项目主要提供了一种 React-Redux 技术栈整合包, 免除使用者为项目构建、单元测试、热重载等整合服务重复工作.

翻译项目: [react-redux-starter-kit-cn](https://github.com/JounQin/react-redux-starter-kit-cn)

欢迎其他有兴趣的同学一起参与, 帮助不熟悉的英语的同仁更好地使用 React-Redux 技术栈, 期待你的支持.

我个人也将使用整个启动包/脚手架开始搭建一个个人主页, 预计发布在 [1stg](http://1stg.me).

## 主要技术

* [react](https://github.com/facebook/react)
* [redux](https://github.com/rackt/redux)
* [react-router](https://github.com/rackt/react-router)
* [react-router-redux](https://github.com/rackt/react-router-redux)
* [webpack](https://github.com/webpack/webpack)
* [babel](https://github.com/babel/babel)
* [koa](https://github.com/koajs/koa)
* [karma](https://github.com/karma-runner/karma)
* [eslint](http://eslint.org)

## 目录结构:

```
.
├── bin                      # 构建/启动脚本
├── blueprints               # redux-cli 蓝图文件
├── build                    # 所有构建相关的配置
│   └── webpack              # 指定环境下的 webpack 配置
├── config                   # 项目配置设置
├── server                   # Koa 应用 (使用 webpack 中间件)
│   └── main.js              # 服务端应用入口
├── src                      # 应用源码
│   ├── main.js              # 应用初始化和渲染
│   ├── components           # 可复用的视图组件
│   ├── containers           # 可复用的容器组件
│   ├── layouts              # 决定主要页面结构的组件
│   ├── static               # 静态资源 (未在源码中任何地方引入)
│   ├── styles               # 应用通用性样式 (通用设置)
│   ├── store                # Redux 指定的分片
│   │   ├── createStore.js   # 创建并启用 redux store
│   │   └── reducers.js      # Reducer 声明和注入
│   └── routes               # 主路由定义和异步分割点
│       ├── index.js         # 使用 store 启动主应用程序路由
│       ├── Root.js          # 为上下文组件 providers 包装组件
│       └── Home             # 分形路由
│           ├── index.js     # 路由定义和异步分割点
│           ├── assets       # 渲染组件需要的资源
│           ├── components   # React 视图组件
│           ├── container    # 将组件与 actions 和 store 连接起来
│           ├── modules      # reducers/actions/常量等的集合
│           └── routes **    # 分形子路由 (** 可选)
└── tests                    # 单元测试
```
