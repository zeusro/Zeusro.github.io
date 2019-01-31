---
layout:       post
title:        "kubernetes跑redis"
subtitle:     ""
date:         2019-01-03
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---

kubernetes有重启的机制,所以单节点一开始就不考虑.


这篇文章介绍得很好,详细对比了客户端分片,代理分片,路由分片的差别.
[Redis Cluster深入与实践](https://juejin.im/post/5a54a6fbf265da3e3f4c9048)


## codis

官方的golang版本比较旧.而且最终打包出来的镜像比较大

可以参考
1. [codis](https://github.com/CodisLabs/codis)
1. [Redis Codis 部署安装](http://www.cnblogs.com/zhoujinyi/p/9249873.html)

最终我用的codis,用了每组节点一主两从的方案

## twemproxy + redis 资源池

看起来不是很满意

[redis on kubernetes](https://segmentfault.com/a/1190000014453291#articleHeader1)

参考链接:

1. [Redis 持久化](https://www.jianshu.com/p/bedec93e5a7b)
1. [深入浅出Docker技术- Redis sentinel 集群的搭建](http://www.dczou.com/viemall/837.html)
1. [redis 系列23 哨兵Sentinel (上)](https://www.cnblogs.com/MrHSR/p/10119843.html)