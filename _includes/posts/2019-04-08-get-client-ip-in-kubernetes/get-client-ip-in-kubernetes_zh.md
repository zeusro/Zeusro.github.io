## 环境:

1. kubernetes版本: 阿里云v1.11.5
1. 节点系统 CentOS Linux 7 (Core)
1. 节点容器版本 docker://17.6.2

## 概念介绍

### X-Forwarded-For

```
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

### remote_addr

remote_addr代表客户端的IP，但它的值不是由客户端提供的，而是服务端根据客户端的ip指定的，当你的浏览器访问某个网站时，假设中间没有任何代理，那么网站的web服务器（Nginx，Apache等）就会把remote_addr设为你的机器IP，如果你用了某个代理，那么你的浏览器会先访问这个代理，然后再由这个代理转发到网站，这样web服务器就会把remote_addr设为这台代理机器的IP。

## 内部请求(Pod对Pod请求)

```
podA-->podB
```

这时只有`getRemoteAddr`能够获取IP，其余header全空.podB获得的clientIP为podA的podIP(虚拟IP)

The client_address is always the client pod’s IP address, whether the client pod and server pod are in the same node or in different nodes.


## 外部请求

### Nodeport svc

```
client-->svc-->pod
```

#### externalTrafficPolicy: Cluster

svc.spec设置`externalTrafficPolicy: Cluster`，意思是所有节点都会启动`kube-proxy`，外部流量可能转发多1次。

```
          client
             \ ^
              \ \
               v \
   node 1 <--- node 2
    | ^   SNAT
    | |   --->
    v |
 endpoint
```

这时流量通过node2的转发，app 获得的clientIP不定，有可能是`node 2` 的IP，也有可能是客户端的IP

#### externalTrafficPolicy: Local

svc.spec设置`externalTrafficPolicy: Local`，在运行pod的节点上启动`kube-proxy`，外部流量直达节点。

```
        client
       ^ /   \
      / /     \
     / v       X
   node 1     node 2
    ^ |
    | |
    | v
 endpoint
```

这时，只有运行了pod的节点才会有对应的proxy，避免了中间商(node 2)挣差价

`clientIP`为`remote_addr`


### LoadBalancer svc

svc.spec设置`externalTrafficPolicy: Local`.

```
                      client
                        |
                      lb VIP
                     / ^
                    v /
health check --->   node 1   node 2 <--- health check
        200  <---   ^ |             ---> 500
                    | V
                 endpoint
```

![image](/img/in-post/get-client-ip-in-kubernetes/15450327712333_zh-CN.png)

SLB监听HTTP:取`X-Forwarded-For`即可(从SLB获得客户端IP).

SLB监听TCP，则取`remote_addr`

`externalTrafficPolicy: Cluster`的情况就不用说了，没有意义。

### ingress

```
client-->slb-->ingress svc-->ingress pod-->app svc-->pod
```

首先需要设置`ingress`的svc类型为`Nodeport`/`LoadBalancer`，并且`externalTrafficPolicy: Local`

app svc type为`ClusterIP`/`NodePort`/`LoadBalancer`都无所谓。

这个时候，`X-Forwarded-For`的值即为`clientIP`

`remote_addr`为`ingress pod` Virtual IP

## 参考链接:

1. [source-ip](https://kubernetes.io/docs/tutorials/services/source-ip/)
1. [HTTP 请求头中的 X-Forwarded-For](https://imququ.com/post/x-forwarded-for-header-in-http.html)
1. [如何获取客户端真实IP](https://help.aliyun.com/document_detail/54007.html?spm=5176.11065259.1996646101.searchclickresult.610a1293EtcJUu)
1. [源地址审计：追踪 kubernetes 服务的SNAT](https://ieevee.com/tech/2017/09/18/k8s-svc-src.html)
1. [谈谈kubernets的service组件的Virtual IP](https://ieevee.com/tech/2017/01/20/k8s-service.html)