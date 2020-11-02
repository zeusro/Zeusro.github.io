---
layout:       post
title:        "应用架构的演变——理解虚拟化环境"
subtitle:     "Application Evolution"
date:         2020-10-29
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - cloud native
    - DevOps
---

在
[kube-killer](https://github.com/p-program/kube-killer/blob/master/README_ZH.md)
的中文文档里面，我简单介绍了应用架构的演变过程。

今天，我决定从更高层面，分多个维度描述应用架构的演变过程。

## 业务维度

### 一只大黄鸭

![image](/img/in-post/application-evolution/1.png)

在 `docker` 没有发布之前，其实容器技术就已经在探索了很多年了。实际上，`Java` 这门语言就是一种容器化的技术。Java 这门蹩脚的语言之所以大放异彩，是因为他通过虚拟机的方式，无视了各个操作系统以及硬件方面的差异。而对标 `Java` 的 C# 则是强绑定平台的，因为微软想推销自己的 `windows server` 。

那么，既然有一个免费的 `Linux` 系统，为什么还要 `windows server` 系统呢？ 所以  `Java` 相当于降维打击了 C# 。

语言是实现业务价值的一种工具。在上古时期，应用的架构更加偏向于单体应用。在这个单体应用里面，包含了整个web程序所需要包含的所有逻辑。

企业的发展在于业务，业务的发展是一个外向圆。所以很多网站发展到最后其实变成了一个巨大的航空母舰。

### 黄鸭漏气了

![image](/img/in-post/application-evolution/2.png)

随着业务的膨胀，对应的源代码也相应膨胀。签入迁出的次数越来越频繁，每次代码合并都是一个噩梦。所以到这一步，单体应用的弊端开始显现。不管是开发，部署都成为了一个巨大的工程难题。

所以到了这个时候，小黄鸭就漏气了。

漏气之后那该怎么办呢？结论是分拆。

### 变成小小鸭

![image](/img/in-post/application-evolution/3.png)

分拆在业务维度叫做服务治理。其实远在10年前就有这种思路。当时叫做SOA。微软的那套体系叫做 `WCF` ，当时偶尔会有人在网上问 `JAVA` 程序怎么访问 `WCF` 服务。其实那个就是服务治理的雏形。

在我看来,近几年吹的微服务不过是新瓶装旧酒。本质的思路并没有发生根本性改变。不过话说回来，分拆业务的效果是显著的，各个模块的人只需要关注自身的业务即可。

## 运维维度

而从运维维度，应用部署的模型就稍显不同。

### 百家争鸣时代

在这个时代，各种语言你方唱罢我登场。而作为运维，总是需要自行掌握 `Windows Server` ，`Centos` ， `Ubuntu` 之间各个平台的差异。更苦逼的在于，语言本身也在不停地发展中，有时会出现多个版本的语言打架的情况。

![image](/img/in-post/application-evolution/middle-finger.jpg)

除了软件层面，硬件层面也是一个问题。各个硬件厂商都想搞垄断，于是弄了一个自己才有的东西，然后申请专利，美其名曰“技术创新”，然后兜售给客户。但站在运维角度，这种差异性是很折磨人的。

而且硬件跟软件之间需要一个接入层，这个接入层叫做驱动。而有些硬件厂商懒得在特定操作系统上做驱动，于是英伟达就收获了 Linus 大佬那名扬天下的中指。

### Java 容器时代

![image](/img/in-post/application-evolution/Java.png)

Java 之所以这么流行，是因为他在操作系统之上又做了一层抽象，他通过这一层抽象抹除了平台的差异性。所以我一直强调， `Java` 本质是一种容器技术，而不是一种语言。

那么问题又来了， 如果一台服务器上面要运行多个 `Java` 程序的话，怎么办呢？

### docker 容器时代

这就是 `docker` 容器更绝的地方，他对“系统”都做了一层抽象。在这一层面上，你可以允许任意的程序，而且对机器上面的其他程序没有一点影响。

“系统”在 `docker` 镜像的语境里面只是一堆只读的文件，而程序是顶端可读写的一层“文件”。`docker`的横空出现,让单一机器上运行多版本的 `Java` 程序成为了可能，并且他设计的精妙之处在于各个容器之间的环境是“隔离的”（实际上服务器资源无法隔离），他的隔离是指，你在你的虚拟环境里面随便怎么装软件，都不会影响到其他容器。

到这一步，运维只需要跟开发说：“你给我个镜像吧。无论你给我什么玩意，我只需要 docker run 就可以运行。”

### Serviceless 时代

我之前在《[广州地铁](http://www.bullshitprogram.com/guangzhou-metro/)》这篇文章说过：

> 当前的 web 只是 Serverless 的一种特例（存活期很长的 Serverless ）

连续是不连续的特殊态，大部分人没能认识到这一点。

而在 `Serviceless` 时代，容器其实是一种朝生夕死的易失架构。这对 `DevOps`工程师其实提出了新的要求，要设计好监控和日志系统，以适应这一套全新的架构。

## 公有云维度

如果站在公有云角度，就会看到另外一幅有趣的光景。

### 黑网吧时代

公有云其实一直有一个“超售”的机制。他卖给你2核4G。实际上是通过切分一个虚拟的环境给你租用。

在黑网吧时代，公有云通过 `Xen` or `KVM` 虚拟方式切分了实际的物理机，加上计费规则之后再卖给用户。

### 计算存储分离时代

我们知道，家用PC的硬盘和CPU都是放在同一块主板上的。但是这对于公有云来说，就有点费劲。如果用户要一台2核4G的机器，但是硬盘要4T,而整台64核128G的物理机只有4T硬盘咋办？

所以计算与存储是大势所趋。因为只有架构更加灵活，才能更加适应用户多元化的选择。

### 集约化管理时代

`Kubernetes` 是容器的调度系统，它从微观到宏观，对应用，服务器，网络等组件都做了一层抽象，这一套庞大的操作系统，其实相当于再建了一套公有云的操作系统。

对于研发而言，其实我只需要设定我的期望值就行了，剩下的交给 `DevOps`工程师；

对于 `DevOps`工程师而言，则是建立一个顺畅的构建管道，实现代码到镜像的构建，再完成从镜像到工作负载的事情。最后解决下工作负载的问题；

而对于公有云而言，根据 `Kubernetes` 提供的消息，我们再对应排错即可。公有云卖的不是服务器，而是算力资源池。

### Serviceless 无服务器时代

ingress --> service --> deployment 已经打通了应用到web前端的交付，那对于公有云来说，是不是可以更简单利索一点。不卖服务器给用户了，只要用户给我交付一个容器，那么我就能完成一整个应用的发版？

这就是 `Serviceless` 无服务器时代的牛逼之处。哥卖的不是服务器，也不是服务，而是一个应用发版平台。公有云变成了一个 [Cloud Native Application Store](http://www.bullshitprogram.com/one-open-operating-system/) 。

## 例行吐槽

![image](/img/in-post/application-evolution/love-java.PNG)

## 参考链接

[1]
容器技术之发展简史
https://mp.weixin.qq.com/s/RZj26jdw-a_7QErPxOpyrg

[2]
SOA架构设计经验分享—架构、职责、数据一致性
https://www.cnblogs.com/wangiqngpei557/p/4486177.html

[3]
Xen V.S. KVM终于画上了一个完美的句号
https://zhuanlan.zhihu.com/p/33324585

[4]
计算应该与存储分离吗？
https://cloud.tencent.com/developer/article/1619383

