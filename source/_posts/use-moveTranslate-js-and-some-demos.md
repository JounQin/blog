---
title: 使用 moveTranslate.js 和一些演示
categories: [原创, 实践]
tags: 前端
date: 2016-08-05 23:21:44
---
# 简介:

moveTranslate.js 是一个对手机端 touchstart, touchmove, touchend 事件和 PC 端 mousedown, mousemove, mouseup + mouseleave 事件整合封装实现元素拖动的小工具.

<!--more-->

# 简单示例:
<script async src="https://jsfiddle.net/ugw7xzem/embed/"></script>
<a href="https://jsfiddle.net/ugw7xzem/embedded/" target="_blank">新窗口全屏查看</a>


这个工具本身只是为了实现元素的拖动, 同时兼容手机+PC, 兼顾元素点击事件和拖动不冲突, 不过实际应用中由于多个事件可供调用, 可以做出很多不错的效果, 以下是我们项目中用到的一些实例.

需要注意的是, 很多时候我们只需要在手机也就是小屏幕上启用这种拖动效果, 因为 PC 端的宽度足够大, 能够无压力地展示所有内容, 这时候就只需要在屏幕小的时候才启用.


# 使用实例:

1. [日历排期联动](http://test.res.easy-hi.cn/yoga-system-res/product/default/modules/index/html/merchant.html#merchantsubscribe/index/2016-05-09)

    缩小屏幕或使用 Chrome DevTools 模拟手机即可体验.
    这个页面有两个部分用到 moveTranslate , 一个是日历组件的滚动(未做大屏幕兼容), 一个是下方的排期列表部分(大屏幕亦未做兼容, 直接 scroll 的效果也 OK).
    
    小屏幕上日历组件可以根据滑动结束的位置判断需要滚动到哪一周, 而列表部分可以实现先让页面整体上移, 然后再在内部进行滚动(浏览器默认的 scroll 行为是先在容器内部滚动至顶部后再滚动页面整体即 body).

2. [日历课表时间轴联动](http://test.res.easy-hi.cn/yoga-system-res/product/default/modules/index/html/merchant.html#scheduling/index)

    这个页面更为复杂, 周日历组件部分要求与下方课表横向联动, 左侧时间轴区域要求与右方课表纵向联动, 同时还要保证向上滚动时优先使页面整体上移, 当周日历组件到达顶部时固定在顶部, 然后开始在课表内部滚动, 向下滚动时, 又优先在课表内部滚动, 当课表内部滚动到顶部了后再滚动页面整体.
    
    嗯, 都要被需求绕晕了, 但是运用 moveTranslate 我们完美实现, 同时上下滚动的逻辑还兼容系统 scroll 事件, 这也使 PC 端无需借助 moveTranslate(因为 PC 端有足够的宽度直接横向展示一周课表!)

3. [时间段的选择](http://test.res.easy-hi.cn/yoga-system-res/product/default/modules/index/html/merchant.html#private-manage/edit/12345678910/2002)

    这里用到了两个拖动按钮(css3 画的), 拖动的过程中还需要处理时间段起始标记位置和时间段长度的变化.
    
    另外由于两个拖动组件是对同一块区域生效, 因此如果使用两只手指分别同时进行操作的话会出现问题, 所以后来实现时一方开始拖动时就禁用了另一方的拖动.

4. more

    小组的另一个小伙伴正在尝试使用这个组件实现一个拖动排序的功能, 本身没有什么问题, 但是当列表比较长时, 就需要在拖动的过程中将页面进行整体上下移同时将拖动的元素恢复到手处在的位置.


# 总结

上述复杂的效果实际使用过程中初始化 moveTranslate 时都设置了 `{x:false, y:false}` 即默认 x 轴和 y 轴均不可拖动.

虽然默认不能滚动了, 但是元素上的位置偏移量我们是可以在 `translate.moving` 事件中取到的, 继而自己根据位置偏移量调整 DOM.

# 结语

此文只见到介绍了一下 moveTranslate 的一些实际应用, 具体操作实现将在下一篇文章中大致说明.

# 源码

前往 [Gist](https://gist.github.com/JounQin/50b8310a14b9215126f420cbab4785a6) 查看.
