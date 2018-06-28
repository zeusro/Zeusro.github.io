---
layout:       post
title:        "在阿里云的swarm上面安装consul(3agent 1server)"
subtitle:     ""
date:         2018-06-28
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - swarm
    - docker
    - docker-compose
---

坑太多了不解释.直接贴docker-compose.yaml 吧


## 3个agent(需要奇数个agent,跟选主算法有关)

### agent1

```yaml
consul-server1:
  image: 'consul:1.2.0'
  command:
    - agent
    - '-bind={{ GetInterfaceIP "eth0" }}'
    - '-client={{ GetInterfaceIP "eth0" }}'
    - '-server'
    - '-node=consulserver1'
    - '-bootstrap-expect=3'
  restart: always
  hostname: consulserver1
  network: host
  ports:
    - '8300:8300/tcp'
    - '8302:8302/udp'
    - '8302:8302/tcp'
    - '8600:8600/udp'
    - '8600:8600/tcp'
    - '8301:8301/tcp'
    - '8301:8301/udp'
  volumes:
    - '/consul/data:/consul/data'
  environment:
    - 'constraint:aliyun.node_index==1'
    - 'CONSUL_CLIENT_INTERFACE=eth0'
    - 'CONSUL_BIND_INTERFACE=eth0'
  labels:
    aliyun.auto_scaling.min_memory: '0'
    aliyun.auto_scaling.max_memory: '95'
    aliyun.scale: '1'
```

### agent2

```yaml
consul-server2:
  image: 'consul:1.2.0'
  ports:
    - '8300:8300/tcp'
    - '8302:8302/udp'
    - '8302:8302/tcp'
    - '8600:8600/udp'
    - '8600:8600/tcp'
    - '8301:8301/tcp'
    - '8301:8301/udp' 
  command:
    - agent
    - '-bind={{ GetInterfaceIP "eth0" }}'
    - '-client={{ GetInterfaceIP "eth0" }}'
    - '-server'
    - '-retry-join=consulserver1'
    - '-node=consulserver2'
  restart: always
  hostname: consulserver2
  network: host
  volumes:
    - '/consul/data:/consul/data'
  environment:
    - 'constraint:aliyun.node_index==2'
    - 'CONSUL_CLIENT_INTERFACE=eth0'
    - 'CONSUL_BIND_INTERFACE=eth0'   
  labels:
    aliyun.auto_scaling.min_memory: '0'
    aliyun.auto_scaling.max_memory: '95'
    aliyun.scale: '1'
  memswap_limit: 0
  shm_size: 0
  memswap_reservation: 0
  kernel_memory: 0
  name: consul-server2
```

### agent3

```yaml
consul-server3:
  image: 'consul:1.2.0'
  ports:
    - '8300:8300/tcp'
    - '8302:8302/udp'
    - '8302:8302/tcp'
    - '8600:8600/udp'
    - '8600:8600/tcp'
    - '8301:8301/tcp'
    - '8301:8301/udp'
  command:
    - agent
    - '-bind={{ GetInterfaceIP "eth0" }}'
    - '-client={{ GetInterfaceIP "eth0" }}'
    - '-server'
    - '-retry-join=consulserver1'
    - '-node=consulserver3'  
  volumes:
    - '/consul/data:/consul/data'
  restart: always
  network: host
  hostname: consulserver3
  environment:
    - 'constraint:aliyun.node_index==3'
    - 'CONSUL_CLIENT_INTERFACE=eth0'
    - 'CONSUL_BIND_INTERFACE=eth0'   
  labels:
    aliyun.scale: '1'
    aliyun.auto_scaling.max_memory: '95'
    aliyun.auto_scaling.min_memory: '0'
```

## 一个 client

```yaml
consul-client:
  image: 'consul:1.2.0'
  expose:
    - "8500"
  restart: always    
  container_name: consul  
  command:
    - agent
    - '-bind={{ GetInterfaceIP "eth0" }}'
    - '-client={{ GetInterfaceIP "eth0" }}'
    - '-ui'
    - '-retry-join=consulserver1'
    - '-node=client'
  labels:
    aliyun.scale: '1'  
    aliyun.auto_scaling.max_memory: '95'
    aliyun.auto_scaling.min_memory: '0'      
    aliyun.routing.port_8500: "https://abcd.com"
  environment:
    - 'constraint:aliyun.node_index==4'
```

## 注意

1. 因为2和3的agent配的`retry-join=consulserver1`,所以`consul-server1`一定要先启动.然后再启动2和3,最后启动 client.
1. consul-client用了阿里云的简单路由,所以直接拿容器的`8500`端口来用就行.如果是其他方式的话,自己酌情配置
    ```yaml
     ports:
       - '80:8500'
    ```
1. 其他aliyun的标签就不说明了,跟主题无关.
1. 最后我再补充一点,我这个配置是一个机器部署一个 agent, 最后挑第四台机作 client 的,没有那么多机器的,别问我怎么配.自己买机器去配就行了.

## 参考链接

1. https://www.jianshu.com/p/f8746b81d65d
1. https://www.consul.io/docs/guides/consul-containers.html
1. https://my.oschina.net/jywm/blog/760183
1. https://www.consul.io/docs/guides/outage.html
1. https://www.consul.io/docs/agent/options.html#_bootstrap_expect
1. http://dockone.io/question/786
1. https://github.com/hashicorp/consul/issues/993
1. https://github.com/hashicorp/consul/issues/454 
1. http://gaocegege.com/Blog/distributed%20system/try-consul