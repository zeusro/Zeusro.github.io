---
layout:       post
title:        "kubernetes的timeout问题"
subtitle:     ""
date:         2019-05-11
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---

kubernetes+alpine+php特别容易出现访问外网/解析外网地址的时候出现超时的问题.

## 原因

docker容器访问外网的时候,整个完整路径是这样的.

容器-->主机-->外网-->主机-->容器

容器到主机之间的流量要经过源地址转换(SNAT)才能顺利流通.

SNAT就像是一个搬运工,把砖(流量)从容器搬到主机

如果一个主机上面运行多个容器,并发访问外网(特别是PHP这种没有连接池的)时向系统申请可用端口(nf_nat_l4proto_unique_tuple),不可用时+1,然后再申请,再校验.这个过程一多,最终就会导致寻址超时.

说白了是个系统内核问题.

详细的解释见

[记一次Docker/Kubernetes上无法解释的连接超时原因探寻之旅](https://mp.weixin.qq.com/s?__biz=MzIzNzU5NTYzMA==&mid=2247484016&idx=1&sn=72bc7f3443cbc259762fb6bd7adb33ae&chksm=e8c77cf1dfb0f5e7598497767db6365bd8db9f4b6a945cb8c72adb1e052e8b0cd46b727c929b&scene=21#wechat_redirect)


## 解决方案

### 最优解

节点升级到 5.1的Linux内核.

iptables升级到1.6.2以上

用基于IPVS模式,并且支持随机端口SNAT的网络插件启动kubernetes(很遗憾,flannel目前没有实现这个选项,但是[有人做了出来](https://gist.github.com/maxlaverse/1fb3bfdd2509e317194280f530158c98))

### 次优解

用ds部署name sever,所有节点的DNS解析走节点上的name server,通过最小程度的SNAT+dns cache缓解此类问题.

### 伪解决方案(不能解决根本问题)

```
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c 
              - "/bin/echo 'options single-request-reopen' >> /etc/resolv.conf"
```

```
# https://www.sudops.com/kubernetes-alpine-image-resolve-ext-dns.html
echo "$(sed 's/options ndots:5/#options ndots:5/g' /etc/resolv.conf)" > /etc/resolv.conf
```

无论是
1. 设置重开socket
1. 注释`/etc/resolv.conf`里面的`options ndots:5`
都只是规避了容器并发AA,AAAA查询的问题.如果该主机运行其他容器(这不废话吗,一个节点不跑多个容器那还用啥kubernetes),其他容器也会并发地请求,从而导致SNAT的问题

## 衍生的问题

容器访问clusterIP(因为是虚拟IP所以需要DNAT)也会出现这类超时的问题

参考链接:

1. [iptables中DNAT、SNAT和MASQUERADE的理解](https://blog.csdn.net/wgwgnihao/article/details/68490985#)
1. [linux根文件系统 /etc/resolv.conf 文件详解](https://blog.csdn.net/mybelief321/article/details/10049429#)
1. [kube-dns per node #45363](https://github.com/kubernetes/kubernetes/issues/45363)
1. [DNS intermittent delays of 5s #56903](https://github.com/kubernetes/kubernetes/issues/56903)
1. [Racy conntrack and DNS lookup timeouts](https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts)
1. [/etc/resolv.conf](http://www.man7.org/linux/man-pages/man5/resolver.5.html)