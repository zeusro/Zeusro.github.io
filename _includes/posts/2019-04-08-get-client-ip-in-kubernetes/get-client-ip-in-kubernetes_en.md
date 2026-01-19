## Environment:

1. kubernetes version: Alibaba Cloud v1.11.5
1. Node system: CentOS Linux 7 (Core)
1. Node container version: docker://17.6.2

## Concept Introduction

### X-Forwarded-For

```
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

### remote_addr

remote_addr represents the client's IP, but its value is not provided by the client. Instead, it's specified by the server based on the client's IP. When your browser accesses a website, assuming there are no proxies in between, the website's web server (Nginx, Apache, etc.) will set remote_addr to your machine's IP. If you use a proxy, your browser will first access the proxy, then the proxy forwards to the website. In this case, the web server will set remote_addr to that proxy machine's IP.

## Internal Requests (Pod to Pod Requests)

```
podA-->podB
```

At this time, only `getRemoteAddr` can get the IP, all other headers are empty. The clientIP obtained by podB is podA's podIP (virtual IP).

The client_address is always the client pod's IP address, whether the client pod and server pod are in the same node or in different nodes.


## External Requests

### Nodeport svc

```
client-->svc-->pod
```

#### externalTrafficPolicy: Cluster

Setting `externalTrafficPolicy: Cluster` in svc.spec means all nodes will start `kube-proxy`, and external traffic may be forwarded one more time.

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

At this time, traffic goes through node2's forwarding. The clientIP obtained by the app is uncertain. It could be `node 2`'s IP, or it could be the client's IP.

#### externalTrafficPolicy: Local

Setting `externalTrafficPolicy: Local` in svc.spec starts `kube-proxy` on nodes running pods. External traffic goes directly to the node.

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

At this time, only nodes running pods will have the corresponding proxy, avoiding the middleman (node 2) making a profit.

`clientIP` is `remote_addr`.


### LoadBalancer svc

Set `externalTrafficPolicy: Local` in svc.spec.

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

SLB listening on HTTP: Take `X-Forwarded-For` (get client IP from SLB).

SLB listening on TCP: Take `remote_addr`.

The case of `externalTrafficPolicy: Cluster` doesn't need to be mentioned, it's meaningless.

### ingress

```
client-->slb-->ingress svc-->ingress pod-->app svc-->pod
```

First, you need to set the `ingress` svc type to `Nodeport`/`LoadBalancer`, and `externalTrafficPolicy: Local`.

The app svc type can be `ClusterIP`/`NodePort`/`LoadBalancer`, it doesn't matter.

At this time, the value of `X-Forwarded-For` is the `clientIP`.

`remote_addr` is the `ingress pod` Virtual IP.

## Reference Links:

1. [source-ip](https://kubernetes.io/docs/tutorials/services/source-ip/)
1. [X-Forwarded-For in HTTP Request Headers](https://imququ.com/post/x-forwarded-for-header-in-http.html)
1. [How to Get Client Real IP](https://help.aliyun.com/document_detail/54007.html?spm=5176.11065259.1996646101.searchclickresult.610a1293EtcJUu)
1. [Source Address Auditing: Tracking SNAT of Kubernetes Services](https://ieevee.com/tech/2017/09/18/k8s-svc-src.html)
1. [Talking About the Virtual IP of Kubernetes Service Components](https://ieevee.com/tech/2017/01/20/k8s-service.html)
