我在2011年的时候接触 `C#` 这门语言，当时学校用的是 `.net framework 3.5` 的教程。

![image](/img/in-post/fuck-microsoft/history.png)

而 `C#` 这门语言，单就语言特性，10年的版本前就比 `Java8` 优秀得多。可惜狮子难敌群狼，也许也是一开始就对搜索引擎不友好，一直命途多舛。
面世至今18年，在我看来基本是原地踏步。

## 优美的C#语言

C#的泛型是一个很优美的设计。这个设计，直到今天，Java 还是在用类型擦除的方式去实现，至于 golang ，根本就是在纸上谈兵，到现在还没有实现。

C#泛型(MSIL)的内部是怎么实现的? - RednaxelaFX的回答 - 知乎
https://www.zhihu.com/question/27634924/answer/40854909

CLR天才论文
https://www.microsoft.com/en-us/research/publication/design-and-implementation-of-generics-for-the-net-common-language-runtime/?from=http%3A%2F%2Fresearch.microsoft.com%2Fpubs%2F64031%2Fdesignandimplementationofgenerics.pdf

## 喜欢拥抱变化的微软

可能微软比较喜欢拥抱变化吧，每隔几年就喜欢整一套新的技术框架。

- language
1. .NET framework
1. .NET core
1. Visual Basic
1. F#

- web
1. ashx
1. ASP
1. ASP.NET WebForm
1. WCF
1. Microsoft Silverlight
1. ASP.NET
1. ASP.NET MVC
1. SignalR 2.0
1. Abp VNext

- desktop
1. WPF
1. Windows Forms

- Mobile
1. Xamarin
1. UWP

从语法角度上看，C#是我见过最为优雅的语言，
[LINQ比Java8的stream API可不要优秀太多](http://www.zeusro.com/2018/03/08/linq-vs-stream/)。

但一开始微软就走错了路线，选择将 `C#` 与 `Windows` 平台强绑定，他们的 CEO 算盘是这样的：通过强绑定巩固自身优势，确立霸主地位。

群众是用脚投票的。无论是 `Windows` 系统也好，`Windows Server` 也好，授权都是一笔不小的费用。当时的微软过于注重短期利益，导致了 C# 的大败局。

所以 `Xamarin` 另辟蹊径，提出了用 .net 实现跨平台。

后来微软痛定思痛，决定拥抱开源。但即便收购 `Xamarin` 之后，整合之路也是困难重重。

2019年Build大会上宣布.NET 5时，微软就明确说了，"未来将只有一个.NET，您将能够使用它来定位Windows、Linux、macOS、iOS、Android、tvOS、watchOS和WebAssembly等等。 微软在4 月份宣布预览版 2时宣布，它已经处理了其 .NET 站点上 50% 的流量。

但是从2002年到2019年，这17年可以说是荒废了。微软每一次技术的迭代，基本上都是向前不兼容的。这对于普通开发者来说，是一种不小的折磨。

所以基本上微软的技术栈，只剩下几个方向：

1. Unity 3D 游戏开发
1. 给微软打工
1. 小成本免运维程序快速开发

## 现在

虽然现在已经不玩`C#`了，不过倒是认识了不少曾经开发过 `ASP.NET` 的朋友，其中一个朋友，还在2016年的时候请过我几顿。
也算是一段奇妙的经历。

![image](/img/in-post/fuck-microsoft/2016-04-21.jpeg)

## 结论

**微软的技术，1.0 根本不能用，2.0 还行。3.0？抱歉，没有3.0**。

## 参考链接

[1]
.NET 5.0预览版6发布：支持Windows ARM64设备
https://www.cnblogs.com/shanyou/p/13196251.html

[2]
C#
https://zh.wikipedia.org/wiki/C%E2%99%AF

[3]
走向统一的 .NET 旅程
https://www.cnblogs.com/shanyou/p/12921285.html
