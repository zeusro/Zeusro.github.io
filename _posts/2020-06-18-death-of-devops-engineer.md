---
layout:       post
title:        "某运维负责人之死"
subtitle:     ""
date:         2020-06-18
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - DevOps
    - Kubernetes
---

## 缘起

![image](/img/in-post/death-of-devops-engineer/devops.jpg)

2018年3月，我正式成为运维负责人，接管集团内部的云平台账户。

上一任运维负责人是个天才，他给我留了一堆完全没有密码的服务器，涵盖了腾讯云和阿里云，此外还有一大堆无效的DNS记录，CDN域名，处理这些垃圾的善后工作，陆陆续续花了我一年多时间。

2018年6月，因缘巧合之下，阿里云P8口授我 Kubernetes,我当天下午立即决定，无论遇到多大的困难，必定要将其落地。

当时我们的系统已经有一部分运行在阿里云的 docker swarm 上面，但我看了一下 release note ，觉得那玩意肯定是弃子。于是，在三个月左右的时间内，通过看英文版的《kubernetes in action》和参与社群，我从 0 docker 基础的渣渣升级为集团内部**首席云原生步道师**。并升级为社群的管理员。

## 阿里云`Kubernetes`早期产品经理

此外，我还成为了阿里云 Kubernetes 的早期产品经理。很多产品建议都是我提出来，由他们内部加以评估改进的。

1. [容器镜像服务支持私有仓库海外机器构建](https://connect.console.aliyun.com/connect/detail/84361)
1. [kubernetes web控制台:支持ephemeral-storage的设置](https://connect.console.aliyun.com/connect/detail/97716)
1. [容器镜像服务:支持gcr.io等镜像的代理](https://connect.console.aliyun.com/connect/detail/78278)
1. [kubernetes:尽快废弃 dashboard,并将其功能集成到阿里云控制台](https://connect.console.aliyun.com/connect/detail/77011)
1. [Kubernetes:改进创建svc](https://connect.console.aliyun.com/connect/detail/75930)
1. [kubernetes:改进RBAC](https://connect.console.aliyun.com/connect/detail/75929)
1. [阿里云kubernetes：SchedulingDisabled节点会被自动剔除出虚拟服务器组](https://connect.console.aliyun.com/connect/detail/73467)
1. [Kubernetes:扩充"节点不可调度"的功能,改为"维护节点"](https://connect.console.aliyun.com/connect/detail/70803)
1. [Kubernetes:改进创建集群选项](https://connect.console.aliyun.com/connect/detail/70665)
1. [k8s:增强云盘数据卷](https://connect.console.aliyun.com/connect/detail/61986)
1. [k8s:变更service的证书标签无法生效](https://connect.console.aliyun.com/connect/detail/57727)
1. [k8s:增加集群节点管理的相关文档](https://connect.console.aliyun.com/connect/detail/56229)
1. [云监控:改进K8S云监控](https://connect.console.aliyun.com/connect/detail/52189)
1. [容器服务:pv显示不友好](https://connect.console.aliyun.com/connect/detail/51523)
1. [K8S:进入POD终端之后的可操作时间过短](https://connect.console.aliyun.com/connect/detail/50469)
1. [k8s:配置deployment页面有问题](https://connect.console.aliyun.com/connect/detail/49659)
1. [k8s:volume的相关局限性以及改进](https://connect.console.aliyun.com/connect/detail/49640)
1. [k8s:namespace信息同步有问题](https://connect.console.aliyun.com/connect/detail/49361)
1. [k8s:取消ingress的TLS不生效](https://connect.console.aliyun.com/connect/detail/48979)
1. [阿里云镜像仓库:优化用户体验](https://connect.console.aliyun.com/connect/detail/48110)
1. [k8s:维护master的时候会多出一些奇怪的负载均衡](https://connect.console.aliyun.com/connect/detail/48072)
1. [k8s:改进HPA](https://connect.console.aliyun.com/connect/detail/48041)
1. [希望阿里云容器服务K8S 能够支持自主绑定 SLB](https://connect.console.aliyun.com/connect/detail/47469)
1. [k8s-给路由（Ingress）加上 TLS的时候会有问题](https://connect.console.aliyun.com/connect/detail/47443)
1. [k8s:改进LoadBalancer型服务和负载均衡的绑定](https://connect.console.aliyun.com/connect/detail/52594)
1. [k8s-使用私有镜像创建部署(deployment)的时候会有问题](https://connect.console.aliyun.com/connect/detail/47147)
1. [无意中发现 K8S的部署详情页面有 bug](https://connect.console.aliyun.com/connect/detail/47034)
1. [希望阿里云的容器kubernetes界面不要强行翻译专有名词!!!](https://connect.console.aliyun.com/connect/detail/46590)
1. [K8S-创建应用页面的相关教程改进](https://connect.console.aliyun.com/connect/detail/43756)
1. [优化K8S部署应用的用户体验](https://connect.console.aliyun.com/connect/detail/43736)
1. [让用户灵活选择 K8S master 付费方式](https://connect.console.aliyun.com/connect/detail/43655)
1. [容器服务-健康检查形同鸡肋](https://connect.console.aliyun.com/connect/detail/40484)
1. [容器服务-改进日志服务](https://connect.console.aliyun.com/connect/detail/40792)

2018-05-13 至今，围绕容器领域，陆陆续续提了几十个建议。虽然有一部分没被采纳，但我觉得我应该担得起“**阿里云Kubernetes早期产品经理**”这个称号。

最有印象的 BUG 是这个
[k8s:取消ingress的TLS不生效](https://connect.console.aliyun.com/connect/detail/48979)

当时我跟进了近三个月，还发了个视频给当时的阿里云产品经理。

## NoOps

![image](/img/in-post/death-of-devops-engineer/waterfall.jpg)

传统应用的瀑布模型，我就不吐槽有多糟糕啦，懂的人自然懂。当初在那个运维负责人坑了我一把之后，我看到 Kubernetes 简直像看到了救星一样。后来我就用 Kubernetes 回收了大部分的服务器，至于那些没密码的服务器，要么用休克疗法半夜重置密码后重启，要么耗个一两年，备份云盘后直接退款。

## Kubernetes 时代服务器的忘记密码

可参考我写的
[扩容阿里云kubernetes集群，并升级节点内核](https://developer.aliyun.com/article/756235)

略有区别的在于，

![image](/img/in-post/death-of-devops-engineer/QQ20200618-163420.png)

[节点维护](https://cs.console.aliyun.com/#/k8s/node/list)这里要设置为“**不可调度**”。然后慢慢耗死节点里面的 pod 。

当节点里面剩下的 pod 都不再重要时，便可以直接删除节点并退款相应的ECS。

## 吐槽

![image](/img/in-post/death-of-devops-engineer/no-silver.jpg)

阿里云能不能别老是给我发代金券了。我的域名再续下去得有百年了。

## 参考链接

[1]
2017年云趋势——从DevOps到NoOps
http://dockone.io/article/2126
