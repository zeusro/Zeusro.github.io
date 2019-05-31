---
layout:       post
title:        "阿里云产品之坑大合集"
subtitle:     ""
date:         2019-05-31
author:       "Zeusro"
header-img:   "img/make-the-world-a-better-place.jpeg"
header-mask:  0.3
catalog:      true
tags:
---

稍不注意,钱包就没了.

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