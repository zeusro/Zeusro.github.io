---
layout:       post
title:        "阿里云产品之坑大合集"
subtitle:     "稍不注意,钱包就没了."
date:         2019-05-31
author:       "Zeusro"
header-img:   "img/make-the-world-a-better-place.jpeg"
header-mask:  0.3
catalog:      true
tags:
---


## 任何阿里主导的开源项目

阿里巴巴是一家美股上市企业,上市企业的运作逻辑非常简单,那就是"制造更好的财报",这是无可避免的.这也与阿里巴巴一切KPI至上的执念契合.那么996是福报就不难理解了.开源项目对他们来说不过也只是牟利/内部晋升的一种工具而已,只有当利益契合的时候,他们才会积极开发/维护,dubbo停更之后重启并不是因为他们大发慈悲,而是他们想推阿里云的EDAS平台.

综上所述,不建议大家使用任何阿里主导的开源项目作为底层框架(阿里云有相关商业化产品的除外,比如RocketMq,dubbo等).

## OSS

### bucket类型

低频访问只适用于只写一次,按月为单位存储,极少访问的文件.任一条件不满足都不该用它.

bucket的类型一经创建,无可改变.

但其实这个bucket类型更像是一种默认值.在低频型bucket里面是可以通过强制设置`X-Oss-Storage-Class:Standard`来写入标准型文件的.

### 微信小程序

在微信小程序访问OSS,除了要堤防两马互掐,导致OSS域名"被举报"以外,还要注意跨域请求的问题.

Referer,access-control-allow-origin(JavaScript跨域设置)要加上`servicewechat.com`这个域名.

## ECS

ECS的共享计算型还好,突发性能型,谁买谁知道.

如果一不小心启动了CPU密集型的程序(MYSQL),云监控分分钟报警没商量.

## CDN

CDN开启HTTPS之后,静态HTTPS按次数计费

## SLB

后端服务器无法访问SLB，对于四层负载均衡服务，目前不支持负载均衡后端ECS实例直接为客户端提供服务的同时，又作为负载均衡的后端服务器。

[为什么无法访问负载均衡](https://help.aliyun.com/knowledge_detail/55206.html)