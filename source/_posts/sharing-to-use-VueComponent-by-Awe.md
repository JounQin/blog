---
title: Awe 分享的 Vue 组件开发内容
categories: [转载, 学习]
tags: 前端
date: 2016-08-06 21:11:44
---
各位同学，大家晚上好，我是 Awe ，大学退学，目前在北京从事前端的工作，因为之前入门前端就开始使用 *Vue.js* ，算有一些爬坑经历。受豪情大大委托，花大家一点时间和大家聊聊我使用 *Vue.js* 的经历。

主要内容就是讲讲 *Vue.js* 组件化相关的一些点；因为我能力有限，可能会有理解不到位的地方，希望群里大神指正，一起交流。

![1.jpg](http://ww3.sinaimg.cn/large/72f96cbagw1f6kbxjwk6sj20yc0p6jwo.jpg)

<!--more-->

前端开发的现状，现在的前端圈，框架辈出，实在没有时间全部折腾一遍，不过幸运的是，我们遇到了一个很适合上手和用于市场的前端框架 *Vue* ，不管你以前是否接触过其他的 *MV\** ，或者组件化框架，上手 *Vue* 一定不会后悔。

群里都还是 *Vue* 有了解。

下面进入正题，在 *Vue* 的思想中，就是数据驱动即组件。

![2.jpg](http://ww3.sinaimg.cn/large/72f96cbagw1f6kbxylwsvj20jy0gsmy5.jpg)

![3.jpg](http://ww4.sinaimg.cn/large/72f96cbagw1f6kby96iywj20u604u0t8.jpg)

所以理解数据驱动是我们进行组件化开发的基础。

那么说到组件化，*Vue*在他的组件化系统中给我们开放了有3个重要的 *API* ：

* props
* event 
* slot
 
在每一个*Vue*组件实例中，它的数据（Data）作用域是孤立的。这意味着不能并且不应该在子组件的模板内直接引用父组件的数据。
而 *prop* 就是父组件将数据传给子组件的 *API* 。

*prop* 是组件数据的一个字段，期望从父组件传下来，子组件需要显式地用 *props* 选项。

![4.jpg](http://ww3.sinaimg.cn/large/72f96cbagw1f6kbyda0k9j20xc0maabm.jpg)

![5.jpg](http://ww4.sinaimg.cn/large/72f96cbagw1f6kbygvkdmj20xm0g4q3p.jpg)

这里两个截图就是，父组件将它自己 Data 中的 parentMsg 的值以 msg 这个名字传递给了子组件。

子组件就在它自己的 *prop* 中以 *msg* 接收到了父组件传递给他的这个字符串（*string*）。

*prop* 可以指定接受数据的类型，比如 *String*, *Object*, *Array*, *Function*, *Boolean* 等等，

在 *Vue* 1.x 中 prop可以通过 `.once`, `.sync` 这两个修饰符来声明这个 prop 传递的数据的修改用不用同步到父组件，在 *Vue 2.0* 中 prop 只会是一个向下的管道，子组件修改 prop 传递来的数据不会导致父组件中的对应数据的修改。

但是实际情况中，我们还是需要父子组件双向通信，我觉得下面的第 2 个 *API* 就会排上用场了。

事件：

在 *Vue 1.x* 中，事件有：

* `$broadcast`
* `$dispatch`
* `$emit`

在 *Vue* 中，任何一个 *Vue* 组件实例都是一个事件节点，我们可以使用 `$emit` 等在它上面触发事件，和 DOM 事件类似，*Vue* 的事件是冒泡向上传递，不过不同的是，会在第一次触发回调之后就停止冒泡，如果我们在回调函数中 `return true` 事件就会继续向上传递。

![6.jpg](http://ww1.sinaimg.cn/large/72f96cbagw1f6kbykg3mvj20wq0lidh7.jpg)

这里是一个子组件，我们在他的生命周期中的 `ready` 调用了他 `sayHello` 的方法。

`sayHello` 方法 内部调用了 `this.$emit('child-ready', 'Hello!')`，他就是在触发了一个 *key* 为 `child-ready` 的事件，参数是 `'Hello!'` 的字符

![7.jpg](http://ww4.sinaimg.cn/large/72f96cbagw1f6kbyp47bdj20w80lcgn5.jpg)

然后我们在父组件中来接受这个事件：

``` *Vue*
<child @child-ready="handler"></child>
```

接收到子组件触发的这个 `child-ready` 的事件 就会调用 父组件中的 `handler` 方法，这个 `handler` 比较简单，就是打印了一下接受到的字符，在实际业务中，我是用 `handler` 来接受新的参数来更新父组件中的数据等。

恩，这里除了在子组件标签中接收事件，也可以这样来接受事件。

![8.jpg](http://ww3.sinaimg.cn/large/72f96cbagw1f6kbyt2mksj20mm05imxj.jpg)

在有些业务中，我们可能不仅光靠传递数据就能完全实现，可能还需要在组件中嵌入另外的视图。

slot：

*slot* 是 *Vue.js* 的内容分发 *API*，参照了当前 *Web* 组件规范草稿，使用特殊的 `<slot>` 元素作为原始内容的插槽。

![9.jpg](http://ww4.sinaimg.cn/large/72f96cbagw1f6kbyx2ouuj20xk0iawfw.jpg)

这里，我们在 *child* 组件标签中嵌入了一个 `p`， `slot` 就是定义好， 这个 `p` 应该放在 *child* 组件中的具体位置。

![10.jpg](http://ww2.sinaimg.cn/large/72f96cbagw1f6kbz0obpvj20v20aejs2.jpg)

![11.jpg](http://ww4.sinaimg.cn/large/72f96cbagw1f6kbz431dij20lg088wf0.jpg)

`p` 就替代了 *child* 组件中 `slot` 的位置。

![12.jpg](http://ww3.sinaimg.cn/large/72f96cbagw1f6kbz8cqilj21080li761.jpg)

我们可以看到在子组件的 `slot` 中多了一个 *name* 的属性，与它相对应的就是父子间中 *DOM* 的 `slot` 属性，*Vue* 通过匹配他们就能准确的把内容分发到指定位置，对于父组件中没有指定 name DOM，它就会被放置在子组件中匿名 `slot` 的位置。
