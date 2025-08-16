---
layout:       post
title:        "改变公有云接口调用的凭据系统"
subtitle:     ""
date:         2020-09-30
author:       "Zeusro"
header-img:   "img/b/2020/szw.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - Kubernetes
    - DevOps
---

公有云在调用云产品接口的时候通常需要 `secretId` 和 `secretKey` 。而 `Kubernetes` 里面有一类对象叫做 `secret` ，所以我在想，这两块内容能不能结合起来。

当公有云管理员创建子账户的时候，这两部分信息会自动注入到相应  `Kubernetes` 的关联 `namespace` 的 `secret` 中，这样用户连这部分信息都不需要保存，只需要上传自己的容器镜像，之后CD会自动挂载相应的 `serviceaccount` ，底层公有云以统一的形式加载这部分配置。

从结果上看，
1. 省略了运维设定生产配置这一毫无技术含量的工作
1. 屏蔽了业务开发对线上配置的染指

最终完美实现了自动化DevOps。

不过这么做有一个前提——那就是假定 `Kubernetes` 作为整个公有云的第一入口，公有云要自己打通自身权限控制和 Kubernetes 之间的连接。