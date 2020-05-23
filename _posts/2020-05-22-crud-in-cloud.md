---
layout:       post
title:        "云计算时代的CRUD"
subtitle:     ""
date:         2020-05-22
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg" 
header-mask:  0.3
catalog:      true
multilingual: false
published:    true
tags:
    -  cloud
    -  god-theory
---  

希望大家尽快认识到，云计算时代的CRUD跟传统开发模式的区别。

## 历史回顾(二维)

2014年的时候，我们公司还有自己的服务器，后来由于一次断电没处理好，没UPS，数据库在里面，然后就哭了。

后来逐渐转向云计算平台(Infrastructure-as-a-service)。

当时我负责一个用户中心的ASP.NET后端。

里面有一个叫做下载数据包的功能。下载数据包，需要缓存图片，然后复制到一个临时的目录，再生成一个压缩包，供客户下载。我做的改进是多线程下载图片，并提高了压缩的速率，最后定期自动删除缓存的图片。

也就是说，这是一个二维命题。

> 人月成本+WEB服务器

## 云计算时代（三维）

云计算时代，我们可能会把图片的存储放到OSS这类的对象存储服务（Software-as-a-service）。所以问题升级到三维。

> 人月成本+WEB服务器+OSS

## 财务视角（四维）

财务不懂技术，技术部的员工也不是他招来的，TA只关心云服务的费用。所以问题升级到四维。

> 人月成本+WEB服务器+OSS+云服务费用

## 老板角度（超一维）

公司的一切都是老板的资产。

从老板角度，他并不管你用什么语言实现多么简单抑或复杂的功能，他只关心最小的人月成本，最少的服务器支出，最少的云服务费用。所有的维度合起来就是

> 成本

简单的说，P均衡为0。也就说，最少的预算，带来最大的价值。

## 员工视角——云计算时代的CRUD

那么再度回到员工视角。在开发**下载数据包**这个功能的时候，我们就有了新的认知。

方案一：WEB服务器上下行。

这种方案只适用于用户基数少-->上下行带宽小的场景。

方案二：WEB服务器+OSS+CDN。

C:创建的文件要尽可能小。并且要足够“密集”。也就是说，两张一模一样的图片存放在同一个OSS bucket里面，是相当浪费资源的行为。这里面包含存储的费用，API调用的费用等。

R:文件位置要有规律，这样才易于查找，复用。这里面可能包含CDN的费用，OSS公网流出费用等。

U:更新的频率要尽可能小。如果同一个文件反复更新，说明一开始设计的思路有问题。OSS文件自动刷新，会导致所有CDN节点需要重新重新回源，从而产生一定的费用。

D:数据都是有生命的。无意义的数据需要尽快删除。占着茅坑不拉屎，这是弟弟行为。

## 结论

希望做技术的各位，尽快认识到一点，“**技术为业务价值服务**”。

也就是说，不管你的技术有多好，多么前瞻，在限定期限内不能盈利，不能创造公认价值，那么它就是一种无用的屠龙技。