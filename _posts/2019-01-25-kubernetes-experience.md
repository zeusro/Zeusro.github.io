---
layout:       post
title:        "kubernetes管理经验"
subtitle:     "Kubernetes Management Experience"
date:         2019-01-25
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Kubernetes
---

## 集群管理经(教)验(训)

### 节点问题


#### taint别乱用

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

master节点本身就自带taint,所以才会导致我们发布的容器不会在master节点上面跑.但是如果自定义`taint`的话就要注意了!所有`DaemonSet`和kube-system,都需要带上相应的`tolerations`.不然该节点会驱逐所有不带这个`tolerations`的容器,甚至包括网络插件,kube-proxy,后果相当严重,请注意

`taint`跟`tolerations`是结对对应存在的,操作符也不能乱用

##### NoExecute


```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoExecute

NoExecute是立刻驱逐不满足容忍条件的pod,该操作非常凶险,请务必先行确认系统组件有对应配置tolerations.

特别注意用`Exists`这个操作符是无效的,必须用`Equal`

##### NoSchedule

```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Exists"
          effect: "NoSchedule"
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoSchedule

是尽量不往这上面调度,但实际上还是会有pod在那上面跑

`Exists`和`Exists`随意使用,不是很影响

值得一提的是,同一个key可以同时存在多个effect

```yml
Taints:             elasticsearch-exclusive=true:NoExecute
                    elasticsearch-exclusive=true:NoSchedule
```

其他参考链接：

1. [Kubernetes中的Taint和Toleration（污点和容忍）](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [kubernetes的调度机制](https://segmentfault.com/a/1190000012709117#articleHeader8)


#### 删除节点的正确步骤

```bash
# SchedulingDisabled,确保新的容器不会调度到该节点
kubectl cordon $node
# 驱逐除了ds以外所有的pod
kubectl drain $node   --ignore-daemonsets
kubectl delete $node
```

#### 维护节点的正确步骤

```bash
# SchedulingDisabled,确保新的容器不会调度到该节点
kubectl cordon $node
# 驱逐除了ds以外所有的pod
kubectl drain $node --ignore-daemonsets
# 维护完成,恢复其正常状态
kubectl uncordon $node
```

#### 节点出现磁盘压力(DiskPressure)

```
--eviction-hard=imagefs.available<15%,memory.available<300Mi,nodefs.available<10%,nodefs.inodesFree<5%
```

kubelet在启动时指定了磁盘压力,以阿里云为例,`imagefs.available<15%`意思是说容器的读写层少于15%的时候,节点会被驱逐.节点被驱逐的后果就是产生DiskPressure这种状况,并且节点上再也不能运行任何镜像,直至磁盘问题得到解决.如果节点上容器使用了宿主目录,这个问题将会是致命的.因为你不能把目录删除掉,但是真是这些宿主机的目录堆积,导致了节点被驱逐.

所以,平时要养好良好习惯,容器里面别瞎写东西(容器里面写文件会占用ephemeral-storage,ephemeral-storage过多pod会被驱逐),多使用无状态型容器,谨慎选择存储方式,尽量别用hostpath这种存储

出现状况时,真的有种欲哭无泪的感觉.

```
Events:
  Type     Reason                 Age                   From                                            Message
  ----     ------                 ----                  ----                                            -------
  Warning  FreeDiskSpaceFailed    23m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 5182058496 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  ImageGCFailed          18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Warning  ImageGCFailed          13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Normal   NodeHasNoDiskPressure  10m (x5 over 47d)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasNoDiskPressure
  Normal   Starting               10m                   kube-proxy, node.xxxx1  Starting kube-proxy.
  Normal   NodeHasDiskPressure    10m (x4 over 42m)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasDiskPressure
  Warning  EvictionThresholdMet   8m29s (x19 over 42m)  kubelet, node.xxxx1     Attempting to reclaim ephemeral-storage
  Warning  ImageGCFailed          3m4s                  kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4920913920 bytes, but freed 0 bytes
```

参考链接:

1. [Eviction Signals](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#eviction-signals)
1. [10张图带你深入理解Docker容器和镜像](http://dockone.io/article/783)


#### 节点CPU彪高

有可能是节点在进行GC(container GC/image GC),用`describe node`查查.我有次遇到这种状况,最后节点上的容器少了很多,也是有点郁闷

```
Events:
  Type     Reason                 Age                 From                                         Message
  ----     ------                 ----                ----
  Warning  ImageGCFailed          45m                 kubelet, cn-shenzhen.xxxx  failed to get image stats: rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

参考:

[kubelet 源码分析：Garbage Collect](https://cizixs.com/2017/06/09/kubelet-source-code-analysis-part-3/)

#### 节点失联(unknown)

```
  Ready                False   Fri, 28 Jun 2019 10:19:21 +0800   Thu, 27 Jun 2019 07:07:38 +0800   KubeletNotReady              PLEG is not healthy: pleg was last seen active 27h14m51.413818128s ago; threshold is 3m0s

Events:
  Type     Reason             Age                 From                                         Message
  ----     ------             ----                ----                                         -------
  Warning  ContainerGCFailed  5s (x543 over 27h)  kubelet, cn-shenzhen.xxxx                    rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

ssh登录主机后发现,docker服务虽然还在运行,但`docker ps`卡住了.于是我顺便升级了内核到5.1,然后重启.

具体原因未明.

参考链接:

[Node flapping between Ready/NotReady with PLEG issues](https://github.com/kubernetes/kubernetes/issues/45419)
[深度解析Kubernetes Pod Disruption Budgets(PDB)](https://my.oschina.net/jxcdwangtao/blog/1594348)

### 对象问题

#### pod


##### pod频繁重启

原因有多种,不可一概而论

###### 资源达到limit设置值

调高limit或者检查应用

###### Readiness/Liveness connection refused

Readiness检查失败的也会重启,但是`Readiness`检查失败不一定是应用的问题,如果节点本身负载过重,也是会出现connection refused或者timeout

这个问题要上节点排查


##### pod被驱逐(Evicted)

1. 节点加了污点导致pod被驱逐
1. ephemeral-storage超过限制被驱逐
    1. EmptyDir 的使用量超过了他的 SizeLimit，那么这个 pod 将会被驱逐
    1. Container 的使用量（log，如果没有 overlay 分区，则包括 imagefs）超过了他的 limit，则这个 pod 会被驱逐
    1. Pod 对本地临时存储总的使用量（所有 emptydir 和 container）超过了 pod 中所有container 的 limit 之和，则 pod 被驱逐

ephemeral-storage是一个pod用的临时存储.
```
resources:
       requests: 
           ephemeral-storage: "2Gi"
       limits:
           ephemeral-storage: "3Gi"
```
节点被驱逐后通过get po还是能看到,用describe命令,可以看到被驱逐的历史原因

> Message:            The node was low on resource: ephemeral-storage. Container codis-proxy was using 10619440Ki, which exceeds its request of 0.


参考:
1. [Kubernetes pod ephemeral-storage配置](https://blog.csdn.net/hyneria_hope/article/details/79467922)
1. [Managing Compute Resources for Containers](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)


##### kubectl exec 进入容器失败

这种问题我在搭建codis-server的时候遇到过,当时没有配置就绪以及健康检查.但获取pod描述的时候,显示running.其实这个时候容器以及不正常了.

```
~ kex codis-server-3 sh
rpc error: code = 2 desc = containerd: container not found
command terminated with exit code 126
```

解决办法:删了这个pod,配置`livenessProbe`


##### pod的virtual host name

`Deployment`衍生的pod,`virtual host name`就是`pod name`.

`StatefulSet`衍生的pod,`virtual host name`是`<pod name>.<svc name>.<namespace>.svc.cluster.local`.相比`Deployment`显得更有规律一些.而且支持其他pod访问


##### pod接连Crashbackoff

`Crashbackoff`有多种原因.

沙箱创建(FailedCreateSandBox)失败,多半是cni网络插件的问题

镜像拉取,有中国特色社会主义的问题,可能太大了,拉取较慢

也有一种可能是容器并发过高,流量雪崩导致.

比如,现在有3个容器abc,a突然遇到流量洪峰导致内部奔溃,继而`Crashbackoff`,那么a就会被`service`剔除出去,剩下的bc也承载不了那么多流量,接连崩溃,最终网站不可访问.这种情况,多见于高并发网站+低效率web容器.

在不改变代码的情况下,最优解是增加副本数,并且加上hpa,实现动态伸缩容.

#### deploy

##### MinimumReplicationUnavailable

如果`deploy`配置了SecurityContext,但是api-server拒绝了,就会出现这个情况,在api-server的容器里面,去掉`SecurityContextDeny`这个启动参数.

具体见[Using Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)

#### service

##### 建了一个服务,但是没有对应的po,会出现什么情况?

请求时一直不会有响应,直到request timeout

参考

1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)


##### service connection refuse

原因可能有

1. pod没有设置readinessProbe,请求到未就绪的pod
1. kube-proxy宕机了(kube-proxy负责转发请求)
1. 网络过载


##### service没有负载均衡

检查一下是否用了`headless service`.`headless service`是不会自动负载均衡的...

```yaml
kind: Service
spec:
# clusterIP: None的即为`headless service`
  type: ClusterIP
  clusterIP: None
```

具体表现service没有自己的虚拟IP,nslookup会出现所有pod的ip.但是ping的时候只会出现第一个pod的ip

```bash
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.31.10.94 172-31-10-94.consul.default.svc.cluster.local
Address 2: 172.31.10.95 172-31-10-95.consul.default.svc.cluster.local
Address 3: 172.31.11.176 172-31-11-176.consul.default.svc.cluster.local

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.973 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.170 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.170/0.571/0.973 ms

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.206 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.178 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.178/0.192/0.206 ms
```


普通的type: ClusterIP service,nslookup会出现该服务自己的IP

```BASH
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.30.15.52 consul.default.svc.cluster.local
```

### ReplicationController不更新

ReplicationController不是用apply去更新的,而是`kubectl rolling-update`,但是这个指令也废除了,取而代之的是`kubectl rollout`.所以应该使用`kubectl rollout`作为更新手段,或者懒一点,apply file之后,delete po.

尽量使用deploy吧.

### StatefulSet更新失败

StatefulSet是逐一更新的,观察一下是否有`Crashbackoff`的容器,有可能是这个容器导致更新卡住了,删掉即可.


## 进阶调度

每一种亲和度都有2种语境:preferred,required.preferred表示倾向性,required则是强制.

### 使用亲和度确保节点在目标节点上运行

```yml
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
```


参考链接:
1. [advanced-scheduling-in-kubernetes](https://kubernetes.io/blog/2017/03/advanced-scheduling-in-kubernetes/)
1. [kubernetes-scheulder-affinity](https://cizixs.com/2017/05/17/kubernetes-scheulder-affinity/)

### 使用反亲和度确保每个节点只跑同一个应用

```yml
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: 'app'
                operator: In
                values:
                - nginx-test2
            topologyKey: "kubernetes.io/hostname"
            namespaces:
            - test
```

```yml
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: "kubernetes.io/hostname"
              namespaces:
              - test
              labelSelector:
                matchExpressions:
                - key: 'app'
                  operator: In
                  values:
                   - "nginx-test2"
```

### 容忍运行

master节点之所以不允许普通镜像,是因为master节点带了污点,如果需要强制在master上面运行镜像,则需要容忍相应的污点.

```yml
      tolerations:
        - effect: NoSchedule
          key: node-role.kubernetes.io/master
          operator: Exists
        - effect: NoSchedule
          key: node.cloudprovider.kubernetes.io/uninitialized
          operator: Exists
```

## 阿里云Kubernetes问题

### 修改默认ingress

新建一个指向ingress的负载均衡型svc,然后修改一下`kube-system`下`nginx-ingress-controller`启动参数.

```
        - args:
            - /nginx-ingress-controller
            - '--configmap=$(POD_NAMESPACE)/nginx-configuration'
            - '--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services'
            - '--udp-services-configmap=$(POD_NAMESPACE)/udp-services'
            - '--annotations-prefix=nginx.ingress.kubernetes.io'
            - '--publish-service=$(POD_NAMESPACE)/<自定义svc>'
            - '--v=2'
```

### LoadBalancer服务一直没有IP

具体表现是EXTERNAL-IP一直显示pending.

```bash
~ kg svc consul-web
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
consul-web   LoadBalancer   172.30.13.122   <pending>     443:32082/TCP   5m  
```

这问题跟[Alibaba Cloud Provider](https://yq.aliyun.com/articles/626066)这个组件有关,`cloud-controller-manager`有3个组件,他们需要内部选主,可能哪里出错了,当时我把其中一个出问题的`pod`删了,就好了.

### 清理Statefulset动态PVC

目前阿里云`Statefulset`动态PVC用的是nas。

1. 对于这种存储，需要先把容器副本将为0，或者整个`Statefulset`删除。
1. 删除PVC
1. 把nas挂载到任意一台服务器上面，然后删除pvc对应nas的目录。

### 升级到v1.12.6-aliyun.1之后节点可分配内存变少

该版本每个节点保留了1Gi,相当于整个集群少了N GB(N为节点数)供Pod分配.

如果节点是4G的,Pod请求3G,极其容易被驱逐.

建议提高节点规格.

```
Server Version: version.Info{Major:"1", Minor:"12+", GitVersion:"v1.12.6-aliyun.1", GitCommit:"8cb561c", GitTreeState:"", BuildDate:"2019-04-22T11:34:20Z", GoVersion:"go1.10.8", Compiler:"gc", Platform:"linux/amd64"}
```

### 新加节点出现NetworkUnavailable

RouteController failed to create a route

看一下kubernetes events,是否出现了

```
timed out waiting for the condition -> WaitCreate: ceate route for table vtb-wz9cpnsbt11hlelpoq2zh error, Aliyun API Error: RequestId: 7006BF4E-000B-4E12-89F2-F0149D6688E4 Status Code: 400 Code: QuotaExceeded Message: Route entry quota exceeded in this route table  
```

出现这个问题是因为达到了[VPC的自定义路由条目限制](https://help.aliyun.com/document_detail/27750.html),默认是48,需要提高`vpc_quota_route_entrys_num`的配额

### 访问LoadBalancer svc随机出现流量转发异常

见
[[bug]阿里云kubernetes版不检查loadbalancer service port,导致流量被异常转发](https://github.com/kubernetes/cloud-provider-alibaba-cloud/issues/57)
简单的说，同SLB不能有相同的svc端口，不然会瞎转发。

官方说法：
> 复用同一个SLB的多个Service不能有相同的前端监听端口，否则会造成端口冲突。


参考(应用调度相关):
1. [Kubernetes之健康检查与服务依赖处理](http://dockone.io/article/2587)
2. [kubernetes如何解决服务依赖呢？](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetes之路 1 - Java应用资源限制的迷思](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
1. [Reserve Compute Resources for System Daemons](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)
1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)