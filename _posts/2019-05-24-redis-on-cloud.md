---
layout:       post
title:        "分析redis的各种使用情景"
subtitle:     ""
date:         2019-05-24
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Kubernetes
    - Linux
---


使用docker-compose演示redis的各种使用情景,最后介绍了`codis`和`kubernetes`方案

## 总结

模式 | 特点
---|---
单机版-RDB|备份快,但数据可能不完整
单机版-AOF|备份慢,但是数据比较完整
1主N从|读写分离的典范
树状主从(N级缓存)|为了规避主重启导致的大规模全量复制,但是需要维持每一个中间master的健康
主从自动切换(Sentinel)|在主从的基础上加了Sentinel角色,通过Sentinel实现主从的自动切换
集群(N主N从)|基于slot的key分片,客户端支持得不是很多,所以用的人不多



## 单机版

### RDB模式(默认模式)

定期快照模式

```yaml
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"
        networks:
        - default        
        entrypoint:
        - redis-server
        volumes:
          - ./data:/data
```

### AOF模式

逐一写入,数据比较完整,文件较大,但恢复较慢

```yaml
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"
        networks:
        - default        
        entrypoint:
        - redis-server 
        - --appendonly yes
        volumes:
          - ./data:/data
```

## 主从复制版

### 1主N从

这种模式简单粗暴,但是master一旦重启,多从节点全量复制,IO将会比较繁重

```yaml
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"
        networks:
        - default        
        entrypoint:
        - redis-server 
        - --save 1 1
        volumes:
          - ./data:/data
    redis-slave1: 
        image: redis
        ports: 
        - "12661:6379"
        expose:
          - "6379"        
        networks:
        - default             
        entrypoint:
        - redis-server 
        - --slaveof redis-master 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
    redis-slave2: 
        image: redis
        ports: 
        - "12662:6379"
        expose:
          - "6379"            
        entrypoint:
        - redis-server         
        - --slaveof redis-master 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
```

### 树状主从(N级缓存)

从节点作为主节点.

这种模式规避了单master

```yaml
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"
        networks:
        - default        
        entrypoint:
        - redis-server 
        - --save 1 1
        volumes:
          - ./data:/data
    redis-slave1: 
        image: redis
        ports: 
        - "12661:6379"
        expose:
          - "6379"        
        networks:
        - default             
        entrypoint:
        - redis-server 
        - --slaveof redis-master 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
    redis-slave2: 
        image: redis
        ports: 
        - "12662:6379"
        expose:
          - "6379"            
        entrypoint:
        - redis-server         
        - --slaveof redis-slave1 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
```

### 主从自动切换(Sentinel模式)

这时需要引入 Sentinel 的概念

Redis 的 Sentinel 系统用于管理多个 Redis 服务器（instance）， 该系统执行以下三个任务：

1. 监控（Monitoring）： Sentinel 会不断地检查你的主服务器和从服务器是否运作正常。
1. 提醒（Notification）： 当被监控的某个 Redis 服务器出现问题时， Sentinel 可以通过 API 向管理员或者其他应用程序发送通知。
1. 自动故障迁移（Automatic failover）： 当一个主服务器不能正常工作时， Sentinel 会开始一次自动故障迁移操作， 它会将失效主服务器的其中一个从服务器升级为新的主服务器， 并让失效主服务器的其他从服务器改为复制新的主服务器； 当客户端试图连接失效的主服务器时， 集群也会向客户端返回新主服务器的地址， 使得集群可以使用新主服务器代替失效服务器。

[默认的Sentinel配置](https://raw.githubusercontent.com/antirez/redis/unstable/sentinel.conf)去掉注释后长这样

```conf
port 26379
daemonize no
pidfile /var/run/redis-sentinel.pid
logfile ""
dir /tmp
# 监视主服务器,下线master需要2个Sentinel同意
sentinel monitor mymaster redis-master 6379 2
# 30秒内有效回复视为master健康,否则下线
sentinel down-after-milliseconds mymaster 30000
# 故障转移时,从服务器同部数最大值
sentinel parallel-syncs mymaster 1
# 1. 同一个sentinel对同一个master两次failover之间的间隔时间。
# 2. 当一个slave从一个错误的master那里同步数据开始计算时间。直到slave被纠正为向正确的master那里同步数据时。
# 3.当想要取消一个正在进行的failover所需要的时间。  
# 4.当进行failover时，配置所有slaves指向新的master所需的最大时间。不过，即使过了这个超时，slaves依然会被正确配置为指向master，但是就不按parallel-syncs所配置的规则来了。
sentinel failover-timeout mymaster 90000
```

基本格式是`sentinel <选项的名字> <主服务器的名字> <选项的值>`

原本我想通过`docker-compose up --scale redis-sentinel=3`直接启动3个容器,结果发现这容器竟然会修改配置文件,所以只能分开写了

#### 初版

```yaml
# docker-compose up --scale redis-sentinel=3 虽然可以启动,但是3个容器同时写同一个文件,感觉不是很好
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"  
        entrypoint:
        - redis-server 
        - --save 1 1
        volumes:
          - ./data:/data
        # 重启策略改为no手动让他宕机模拟主从切换
        restart: "no"
    redis-slave1: 
        image: redis
        ports: 
        - "12661:6379"
        expose:
          - "6379"          
        entrypoint:
        - redis-server 
        - --slaveof redis-master 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
    redis-slave2: 
        image: redis
        ports: 
        - "12662:6379"
        expose:
          - "6379"            
        entrypoint:
        - redis-server         
        - --slaveof redis-slave1 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
    redis-sentinel:
        image: redis
        expose:
          - "26379"
        entrypoint:
        - redis-server
        - /usr/local/etc/redis/redis.conf
        - --sentinel
        volumes:
        - ./redis-sentinel.conf:/usr/local/etc/redis/redis.conf
```

#### 最终版:


```yaml
version: '3'
services:   
    redis-master: 
        image: redis
        ports: 
        - "12660:6379"
        expose:
          - "6379"  
        entrypoint:
        - redis-server 
        - --save 1 1
        volumes:
          - ./data:/data
        # 重启策略改为no手动让他宕机模拟主从切换
        restart: "no"
    redis-slave1: 
        image: redis
        ports: 
        - "12661:6379"
        expose:
          - "6379"          
        entrypoint:
        - redis-server 
        - --slaveof redis-master 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
    redis-slave2: 
        image: redis
        ports: 
        - "12662:6379"
        expose:
          - "6379"            
        entrypoint:
        - redis-server         
        - --slaveof redis-slave1 6379
        - --slave-serve-stale-data yes
        #当从机与主机断开连接时，或者当复制仍在进行时,slave仍然会回复client请求， 尽管数据可能会出现过期或者如果这是第一次同步，数据集可能为空。
        - --slave-read-only yes
        #0作为一个特殊的优先级，标识这个slave不能作为master 
        - --slave-priority 100
        # - --masterauth xxx
    redis-sentinel1:
        image: redis
        expose:
          - "26379"
        entrypoint:
        - redis-server
        - /usr/local/etc/redis/redis.conf
        - --sentinel
        volumes:
        - ./redis-sentinel1.conf:/usr/local/etc/redis/redis.conf
    redis-sentinel2:
        image: redis
        expose:
          - "26379"
        entrypoint:
        - redis-server
        - /usr/local/etc/redis/redis.conf
        - --sentinel
        volumes:
        - ./redis-sentinel2.conf:/usr/local/etc/redis/redis.conf
    redis-sentinel3:
        image: redis
        expose:
          - "26379"
        entrypoint:
        - redis-server
        - /usr/local/etc/redis/redis.conf
        - --sentinel
        volumes:
        - ./redis-sentinel3.conf:/usr/local/etc/redis/redis.conf
```


sentinel启动之后,配置发生了变化

这些内容没了
```
sentinel monitor mymaster redis-master 6379 2
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
```

变成

```
sentinel myid 3ae98d6815c1a9b941f8283b7e48bfeef7435905
sentinel deny-scripts-reconfig yes
# Generated by CONFIG REWRITE
sentinel config-epoch mymaster 0
sentinel leader-epoch mymaster 0
sentinel known-replica mymaster 172.24.0.4 6379
sentinel known-sentinel mymaster 172.24.0.7 26379 19ac7e0519e3c30a75e23bac34a7033594256c54
sentinel known-sentinel mymaster 172.24.0.5 26379 c596734a7f55ba2b6c7e3e81562aa6687e45fdeb
sentinel current-epoch 0
```

之后通过`docker ps`和`docker stop`手动停掉了master那个容器,sentinel发觉了,并重新选主.

此时通过`redis-cli`输入info,发现它已经成功变成了可以写入数据的`master`

```
# Generated by CONFIG REWRITE
sentinel config-epoch mymaster 1
sentinel leader-epoch mymaster 1
sentinel known-replica mymaster 172.24.0.3 6379
sentinel known-replica mymaster 172.24.0.2 6379
sentinel known-sentinel mymaster 172.24.0.7 26379 19ac7e0519e3c30a75e23bac34a7033594256c54
sentinel known-sentinel mymaster 172.24.0.5 26379 c596734a7f55ba2b6c7e3e81562aa6687e45fdeb
sentinel current-epoch 1
```

此时重启master,虽然他以server形式启动,但是角色已经自动被贬为slave.

此时master没有变化,所以sentinel的配置内容没有变

## 集群版(N主N从)

集群基于16384个slot做分片.目前各语言客户端实现比较少.所以用的人不是很多.

在docker中运行时,需要使用host网络模式(--net=host)

### redis-trib.rb

redis版本<5时,可以用`redis-trib.rb`建集群

```bash
./redis-trib.rb create --replicas 1 127.0.0.1:7000 127.0.0.1:7001 \
127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005

# 引入新节点
./redis-trib.rb add-node 127.0.0.1:7006 <任意节点IP>:<节点端口>

# 重新分片
./redis-trib.rb reshard <任意节点IP>:<节点端口>

```

### redis-cli


>=5直接用redis-cli即可.

```bash
redis-cli --cluster create 127.0.0.1:7000 127.0.0.1:7001 \
127.0.0.1:7002 127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
--cluster-replicas 1
redis-cli --cluster reshard 127.0.0.1:7000
redis-cli reshard <host>:<port> --cluster-from <node-id> --cluster-to <node-id> --cluster-slots <number of slots> --cluster-yes
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000
# Adding a new node as a replica
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000 --cluster-slave
redis-cli --cluster add-node 127.0.0.1:7006 127.0.0.1:7000 --cluster-slave --cluster-master-id 3c3a0c74aae0b56170ccb03a76b60cfe7dc1912e
redis-cli --cluster del-node 127.0.0.1:7000 `<node-id>`

```

### 集群指令

```
CLUSTER REPLICATE <master-node-id>
cluster nodes
```

## Kubernetes

个人觉得吧,redis跟Kubernetes不是特别契合.kubernetes本身有网络瓶颈的问题,通过svc去访问,频繁DNS解析也不好对吧.这对于高频访问redis的场景来说是致命的.

而且pod这种易失架构注定了在Kubernetes上面用redis要么用数据卷挂载,要么用主从自动切换模式(纯内存的话至少要1主2从,并且用反亲和度错开彼此的运行节点).

主从和单机版倒好解决,单机的话挂载好数据卷,主从的话,主和从分开2个deploy/statefulset部署即可.

但是集群版就比较麻烦.官方的设计还是偏向于传统二进制人工运维,没有做到云原生

看了一下官方的helm chart,也是用的主从模式.

## codis

codis是redis集群没出来之前,豌豆荚团队做的一个方案,通过proxy,隔离了后端的redis集群

### 优点

1. 支持Kubernetes
2. 有web图形界面,方便运维
3. Redis获得动态扩容/缩容的能力，增减redis实例对client完全透明、不需要重启服务

### 缺点

1. 稳定性堪忧
2. 依赖于国内的豌豆荚团队开发,迭代速度较慢
3. 原版的docker镜像较大,没有根据组件进行分开
3. 基于redis 3.x,而且很多原生的redis指令被阉割了
4. 强依赖注册中心(Zookeeper、Etcd、Fs)

我们用了几个月吧,到后期频繁出现

```
ERR handle response, backend conn reset
```
此外,日常观察发现pod退出/重启困难.如果某个group节点全部挂掉的话,整个集群将不可读写.

综上,codis已经影响到了严重影响到了我们程序的正确性,决定弃用codis.改为普通的1主N从的模式.


[主挂了之后导致服务不可用 #1356](https://github.com/CodisLabs/codis/issues/1356)


## 参考链接
1. [【Redis笔记】 第4篇: redis.conf中Replication配置项说明](https://blog.csdn.net/slvher/article/details/17682147)
2. [Redis 配置文件详解](https://www.jianshu.com/p/788ce685fc7c)
3. [redis命令参考](http://redisdoc.com/topic/sentinel.html)
4. [redis主从复制常见的一些坑](https://my.oschina.net/u/3371837/blog/1789452)
1. [Redis 的各项功能解决了哪些问题？](https://mp.weixin.qq.com/s/36o135V1BpcCBVNH-bvotw)
1. [集群教程](http://redisdoc.com/topic/cluster-tutorial.html)