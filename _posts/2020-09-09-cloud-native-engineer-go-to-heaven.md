---
layout:       post
title:        "云原生开发工程师的五重境界"
subtitle:     "Cloud Native Engineers go to heaven"
date:         2020-09-09
author:       "Zeusro"
header-img:   "img/in-post/cloud-native-engineer-go-to-heaven/Great-Sphinx-Giza-Egypt.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - cloud native
---


斯芬克斯是
[地狱双头犬](http://mp.weixin.qq.com/s?__biz=MzI1ODEyNDg3MA==&mid=2655475426&idx=1&sn=46f0e640feae4c4afac374b3928b691e&chksm=f1bf0bcbc6c882dd4159982119c36e091be1d4cf12cd8d9f29f05bc3e38d378f030347ee80a2&mpshare=1&scene=23&srcid=0909hfH7Peo4PyTVSU8U3yyv&sharer_sharetime=1599615406806&sharer_shareid=9b8919de2238b20229856a42c8974cdc#rd)
的女儿，她有一个经典的谜语。叫做斯芬克斯之谜：

> Which creature has one voice and yet becomes four-footed and two-footed and three-footed?

斯芬克斯的这个谜语代表了自我认知的困难。今天，我就来试着解答这个谜语。

## 《Docker源码分析》

要想成为一个优秀的云原生开发工程师。这本书是必看的。虽然 docker 容器历经迭代之后，很多设计已经废弃，这本书信息的参考度已经略有下降。
但从这本书可以学到一种**脚踏实地**的治学思想。在国内《21天学会C++》的浮躁技术风盛行的劣币驱逐下，这本书是一股清流，值得收藏。

如果你能拿到这本书的第一版，然后拿到 [孙宏亮](https://github.com/allencloud) 的签名，收藏价值 * N 。不过前提是得出卖色相，给 [dragonflyoss](https://github.com/dragonflyoss) 贡献代码。

## 《UNIX环境高级编程（第三版）》

Docker 底层的核心技术包括 Linux 上的命名空间（Namespaces）、控制组（Control groups）、Union 文件系统（Union file systems）和容器格式（Container format）。

本质上，容器技术依附于 Unix 系统，所以初步了解了 docker 容器技术之后，要继续往上发展，得对 Unix 系统有所了解。很多问题溯源分析到最后都会发现，问题出自 Unix 系统本身的设计。

这本书目测是CNCF中国大使张磊的读物。

## 《活着》

信息技术有着一条非常长的学习链路。但当你学完了基础知识，熬过了无数的夜，加了无数的班之后，基本上可以在以下几本书中汲取新的知识：

1. 《颈椎病康复指南》
1. 《腰椎间盘突出日常护理》
1. 《心脏病的预防与防治》
1. 《高血压降压宝典》
1. 《强迫症的自我恢复》
1. 《精神病症状学》

到了这个时候，就得看余华写的《活着》。脊椎病的治疗其实很简单，练习 [下腰](https://www.bilibili.com/video/BV197411n7U8) 即可。至于其他疾病，只能靠多运动解决，比如慢跑，游泳，打篮球等。

以前我还在写 `ASP.NET MVC` 的时候，有个网名叫 elfy 的上海土豪传授过我不少 C# 的知识，后来不知道他怎么回事，入了 [avalon](https://github.com/RubyLouvre/avalon) 的坑，成为 [司徒正美](https://www.cnblogs.com/rubylouvre/) 的脑残粉，隔三差五就安利这个 MVVM 的框架。后来我也被他拐入了坑。

我们 C# 的包管理器主要是 nuget 。当时我正在学习怎么复用旧的模块，就顺便帮他们做 av龙 的包管理。
地址是
[avalon](https://www.nuget.org/packages/avalon/2.0.0-beta1)

司徒正美是一个 nice 的人，虽然我后来被他们移出群聊。但我其实蛮欣赏他的履历。他写过一本 《[《JavaScript 框架設計》](https://book.douban.com/subject/27133542/)》，而且后来他还把那本巨著公开了，放到个人的博客上，供人[免费下载](https://files.cnblogs.com/rubylouvre/JavaScript%E6%A1%86%E6%9E%B6%E8%AE%BE%E8%AE%A1%E6%96%B0.rar) 。

我记得他还在当去哪儿网前端架构师的时候，有一天晚上喝了点酒，吐槽说虽然去哪儿上市了，他领到了点股票。
但是每年能够卖出去的，其实很少，而且因为涉及外汇，还要结汇什么的，很麻烦。

他的工作能力也是大家公认的。

在他博客园的 [tag](https://www.cnblogs.com/rubylouvre/tag/) 里面，只有“生活”是最少的，只有3篇文章。
也许，这就是他英年早逝的伏笔吧。

说实话，我不喜欢消费死者。我只是希望大家能够以史为镜，可以知兴替。

很多时候，我都能看到个体的缺点，甚至一个组织，一座城市的衰亡。但当我提出这一点的时候，企图力挽狂澜的时候，大部分人不过都是**囿于面子，死不悔改**。
然后把他们内心的阴暗通过互联网宣泄到我身上。等到我顺着网线去找他们的时候，发现他们也不过如此。

中国就是这样，贱种人民总是相互掐架。他们永远也逃不出囚徒困境。看到稍微比他们好一点的人，他们唯一想要做的事情就是拉到跟他们一样傻逼的位置上。

![image](/img/in-post/cloud-native-engineer-go-to-heaven/IMG_20200621_065936__01__01.jpg)

就像我初二那个转班过来的翁润同学。他初二的时候，看到肖煌凯历史有进步，就很不爽，公然带头制造校园暴力，把那位无辜的同学污蔑为狗，围在教室里面殴打他。

后来他就把自己的嫉妒心转移到我身上。每次都说我考试作弊。直到我考上聿怀中学，也是如此。所以后来我就退群了。
搞笑的是，我后来成绩变差，有一次学校搞了个免费补习班，我又遇到了他。当时他借了小旭一套校服。
高考的时候，他终于如愿以偿，我沦落到跟他一样的学校。

## 《六祖坛经》

第四重境界叫做**万法皆空**。如果你经过了第三重境界。头发都快掉光了，离出家也不远了。

## 《龟虽寿》

> 神龟虽寿，犹有竟时；
> 
> 腾蛇乘雾，终为土灰。
> 
> 老骥伏枥，志在千里；
> 
> 烈士暮年，壮心不已。
> 
> 盈缩之期，不但在天；
> 
> 养怡之福，可得永年。
> 
> 幸甚至哉，歌以咏志。

第五重境界简单概括叫做“如日东山能在起，大鹏展翅恨天低。”

## 结论

> 少年去游荡，中年想掘藏，老年做和尚。

## 参考链接

[1]
程序员的自我修养的四个阶段，你在哪一阶段？
https://bbs.csdn.net/topics/391852760

[2]
六祖坛经
https://www.liaotuo.com/fojing/liuzutanjing/yuanwen.html

[3]
Sphinx
https://en.wikipedia.org/wiki/Sphinx

[4]
the-underlying-technology
https://docs.docker.com/get-started/overview/#the-underlying-technology

[5]



[6]
