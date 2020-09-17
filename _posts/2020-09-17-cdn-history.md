---
layout:       post
title:        "CDN往事录"
subtitle:     ""
date:         2020-09-17
author:       "Zeusro"
header-img:   "img/in-post/cdn-history/cloud.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - cdn
---

2018年3月，我正式陆续接管阿米巴集团公司的所有数字资产，成为实际意义上的运维负责人。

由于领导很看重我（~~老板不舍得花钱~~），有很长的一段时间，都是我一个人在负责所有事情。

特别是在CDN这一领域，由于涉及到历史遗留项目，域名解析，TTL，国内傻逼互联网运营商（比如长城宽带），这块工作内容更要谨慎处理。

我们先回到根源问题，为什么需要 CDN ，CDN 到底解决了什么问题。

## 为什么需要CDN

![image](/img/in-post/cdn-history/http.png)

要回答这个问题，得从历史的宏观角度思考这个问题。

远古时期的 web 请求，如果走A解析，那么请求链路基本如下：

```
computer --> local DNS  --> server IP
```

获取服务器IP之后，再由电子终端（电脑、手机、iPad）与服务器建立TCP连接，最后是浏览器渲染。

但这里面有个问题，`server IP` 只有一个，而 `computer` 通常有多个，如果用户过多（computer），就会出现网络拥堵。这就好比你去饭馆吃饭，但是老板很抠，服务员只有一个，随着顾客的增多，服务员越来越忙，最终根本顾不上你。

那么，怎么解决这个问题呢？

![image](/img/in-post/cdn-history/secret-garden.jpg)

答案当然是砸钱啦！既然你觉得服务员太少，服务不周到。那么你就多出点钱去女仆店，让妹子合法地围绕在你身边。

CDN也是类似这种机制，通过持续投入妹子（CDN边缘加速节点）,更好地服务想要吃饭（使用互联网开车）的人。

## 使用CDN

后来，当我们摆脱了远古的web时代，来到近现代。随着用户的指数级增长，就需要一套新的架构来适应变化。

而软件设计一直以来有一个套路：**如果一层不够，就再加多一层**。

![image](/img/in-post/cdn-history/maxresdefault.jpg)

所以，到了近现代，web 后端架构通常都是一个`椒盐千层饼`：

```
$host --> cname --> CDN --> SLB ip --> server1,server2,server3,...
```

而用户的访问链路则是

```
computer --> local DNS  --> CDN
```

CDN 的本质是一种**静态数据的缓冲与缓存**。

## CDN问题的诊断

大概2015年的时候，我兼职公司的技术支持。经常在QQ上给客户排除技术故障（~~拉网线~~）,逐步积累了一些网络诊断(~~吹牛逼~~)的经验。

如果我们分拆整个“近现代”web后端的请求链路，就会发现这里面每一层数据的流动都会产生问题。

### computer 的问题

主要是垃圾配置，垃圾宽带的问题。对于垃圾宽带的问题，我一般建议用户去 [工业和信息化部电信用户申诉受理中心](https://dxss.miit.gov.cn/) 投诉运营商。

### local DNS 的问题

`local DNS` 也叫本地DNS，如果不特别设置的话，就会走路由器，而路由器则跟运营商。
如果你遇到一个毫无节操的运营商，那么有可能你输入的网址是对的，但是你依旧上不了网。

出现这个问题的原因在于 DNS 服务本身是一个web服务供应商，如果我这边改了DNS IP，而运营商那边故意解析错（DNS污染）或者DNS跟不上（过了TTL依旧缓存旧的记录），整个解析就会有问题。

所以到了后来，我写了一份文档，让运营加入到我们公司的[帮助文档](https://17zwd.com/help/dianzhu/201806250906137255.htm)里面——主要就是设置下 `local DNS` ，规避掉运营商弱鸡 `DNS` 的问题。

![image](/img/in-post/cdn-history/local-dns.png)

### CDN 的问题

CDN 的问题出现得比较隐蔽，而且通常CDN运营商会甩锅。所以这个时候得详细收集用户数据，再反过来问候CDN~~父母~~。

假设出问题的是 stu.17zwd.com。我会让用户访问 https://ipip.net ,截图。然后根据不同的系统，输入不同的命令。

- [window客户]

```bash
set host=stu.17zwd.com
ipconfig -all
ping %host%
tracert %host%
```

- [mac客户]

```bash
export host=stu.17zwd.com
nslookup $host
ping $host
traceroute $host
```

之后再向上游反馈。

`*.w.alikunlun.com` 通常都是阿里云，
`*.wswebpic.com` 基本是网宿。

### 权威DNS的问题

![image](/img/in-post/cdn-history/dns-query_20151207015631_954.png)

这个问题出现得很少，我只遇过一次。那一次是服务器在访问某个国内不能备案的域名时出现的。
当时经过与阿里云售后联系发现，是服务器的IP访问权威DNS受限。

因为权威DNS本质上也是一种web服务，它可以主动拒绝不合法连接。

## 争取议价权

公有云的盈利模式，本质上靠 [网络效应](https://wiki.mbalib.com/wiki/%E7%BD%91%E7%BB%9C%E6%95%88%E5%BA%94) 带来的流量费用。随着服务器规模的增多，我们会发现带宽费用会逐渐水涨船高。

经过我大致测算，平摊之后，费用会占到50%以上。所以，我上任之后，为了尽可能收缩这方面的支出，做了不少努力。

**企业盈利的关键在于垄断经营。打破垄断，则需要竞争对手。**所以我引入了网宿，并督促他们做一个我相对满意的方案。这个方案就是“**按带宽计费**”。

经过我长期的「费米估算」，我总结出 `流量` + `带宽` 这一混合策略。
主要的流量放阿里云，用流量计费；国外和小流量的站点放网宿那边。

引入网宿之后，我们不再绝对地依赖阿里云，具备了随时伸缩的能力。之后，我再以此为筹码，在2020年这个财年里面，为公司阿里云账户的CDN产品申请了一个更高的折扣。

比较有缘的是，对接的阿里云商务经理以前在蓝汛上班。而我们以前用蓝汛CDN的时候，对接的也是她。我们算是久别重逢。

## 自动化运维程序

**CDN 费用的本质是网络流量费用**。

在阿里云内部，我追加了一个按带宽计费的共享带宽池。并用 [common-bandwidth-auto-switch](https://github.com/p-program/common-bandwidth-auto-switch) 这个我自己写的项目，动态规划共享带宽池里面的EIP列表，坚决不让阿里云多挣我司一分钱！！！

对于图片源站，我做了一个 [nginx-brotli实验](http://www.zeusro.com/2018/07/05/nginx-brotli/)，把图片用 `brotli` 编码，进以压缩费用。

最后，我总结出 《[多公有云CDN最佳实践](http://www.zeusro.com/2019/09/20/cdn-pickup/)》 ，偶尔 [用「超装逼」排查CDN流量剧增问题](http://www.bullshitprogram.com/super-b/)。

大概在很早时候，我就隐约觉得“**技术为业务价值服务**”，所以我做的项目基本上能算清商业价值。
而之前的怠工，主要是觉得做的那些项目不是很挣钱吧。

## 云原生时代的网络诊断

进入云原生时代，排查网络问题变得更加复杂。
具体的可以看 
1. [kubernetes的timeout问题](http://www.zeusro.com/2019/05/11/kubernetes-timeout/)
1. [理解kubernetes的service流量转发链路](http://www.zeusro.com/2019/05/17/kubernetes-iptables/)

[kt-connect](https://github.com/alibaba/kt-connect) 这个项目也不错。
如果喜欢原生态，建议直接用 `tcpdump` 🤣 。

## 结论

> 挖掘机是CDN最大的敌人。

## 参考链接

[1]
Proxy-coonection和connection的使用，如何管理跨代理服务器的长短连接？
https://my.oschina.net/u/4266687/blog/3514919

[2]
DNS基本概念
https://dudns.baidu.com/support/knowledge/Theory/

[3]
HTML渲染过程详解
https://www.cnblogs.com/dojo-lzz/p/3983335.html

[4]
CDN缓存那些事
https://bbs.qcloud.com/forum.php?mod=viewthread&tid=3775

[5]
使用ping命令丢包或不通时的链路测试方法
https://help.aliyun.com/knowledge_detail/40573.html

[6]
多维度分析CDN
https://zhuanlan.zhihu.com/p/142787755