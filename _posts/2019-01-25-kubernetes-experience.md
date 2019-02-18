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
    - kubernetes
---

## 推荐工具


### [kubectx](https://github.com/ahmetb/kubectx)

kubectx:用来切换集群的访问

kubens:用来切换默认的namespace

### [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)

`kubectl`命令别名


## 集群管理相关命令


```bash
kubectl get cs

# 查看节点
kubectl get nodes

kubectl get ing pdd --n java
# 不调度
kubectl taint nodes node1 key=value:NoSchedule
kubectl cluster-info dump


kubectl get svc --sort-by=.metadata.creationTimestamp
kubectl get no --sort-by=.metadata.creationTimestamp
kubectl get po --field-selector spec.nodeName=xxxx
kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
```

参考链接:
1. [kubernetes 节点维护 cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)


* 应用管理相关

```bash
kubectl top pod
kubectl delete deployment,services -l app=nginx 
kubectl scale deployment/nginx-deployment --replicas=2
kubectl get svc --all-namespaces=true

```

* 强制删除

有时 删除pv/pvc时会有问题,这个使用得加2个命令参数`--grace-period=0 --force `

* 删除所有失败的pod

  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'

* 一些技巧

k8s目前没有没有类似docker-compose的`depends_on`依赖启动机制,建议使用[wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/)重写镜像的command.


## 集群管理经(教)验(训)

### 建了一个服务,但是没有对应的po,会出现什么情况?

请求时一直不会有响应,直到request timeout

参考

1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)

### taint别乱用

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

master节点本身就自带taint,所以才会导致我们发布的容器不会在master节点上面跑.但是如果自定义`taint`的话就要注意了!所有`DaemonSet`和kube-system,都需要带上相应的`tolerations`.不然该节点会驱逐所有不带这个`tolerations`的容器,甚至包括网络插件,kube-proxy,后果相当严重,请注意

`taint`跟`tolerations`是结对对应存在的,操作符也不能乱用

#### NoExecute


```
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoExecute

NoExecute是立刻驱逐不满足容忍条件的pod,该操作非常凶险,请务必先行确认系统组件有对应配置tolerations.

特别注意用`Exists`这个操作符是无效的,必须用`Equal`

#### NoSchedule

```
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

```
Taints:             elasticsearch-exclusive=true:NoExecute
                    elasticsearch-exclusive=true:NoSchedule
```



其他参考链接：

1. [Kubernetes中的Taint和Toleration（污点和容忍）](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [kubernetes的调度机制](https://segmentfault.com/a/1190000012709117#articleHeader8)

### pod被驱逐(Evicted)

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

### 节点出现磁盘压力(DiskPressure)

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

### ReplicationController不更新

ReplicationController不是用apply去更新的,而是`kubectl rolling-update`,但是这个指令也废除了,取而代之的是`kubectl rollout`.所以应该使用`kubectl rollout`作为更新手段,或者懒一点,apply file之后,delete po.

尽量使用deploy吧.


## 进阶调度

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



参考(应用调度相关):
1. [Kubernetes之健康检查与服务依赖处理](http://dockone.io/article/2587)
2. [kubernetes如何解决服务依赖呢？](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetes之路 1 - Java应用资源限制的迷思](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
