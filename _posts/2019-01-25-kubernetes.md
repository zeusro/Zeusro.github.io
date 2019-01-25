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


* 一些技巧

k8s目前没有没有类似docker-compose的`depends_on`依赖启动机制,建议使用[wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/)重写镜像的command.


## 集群管理经(教)验(训)

- 建了一个服务,但是没有对应的po,会出现什么情况?

请求时一直不会有响应,直到request timeout

参考

1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)

- taint别乱用

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

master节点本身就自带taint,所以才会导致我们发布的容器不会在master节点上面跑.但是如果自定义`taint`的话就要注意了!所有`DaemonSet`和kube-system,都需要带上相应的`tolerations`.不然该节点会驱逐所有不带这个`tolerations`的容器,甚至包括网络插件,kube-proxy,后果相当严重,请注意

其他参考链接：

1. [Kubernetes中的Taint和Toleration（污点和容忍）](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [kubernetes的调度机制](https://segmentfault.com/a/1190000012709117#articleHeader8)

- pod被驱逐(Evicted)

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

参考:
1. [Kubernetes pod ephemeral-storage配置](https://blog.csdn.net/hyneria_hope/article/details/79467922)
1. [Managing Compute Resources for Containers](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)

参考(应用调度相关):
1. [Kubernetes之健康检查与服务依赖处理](http://dockone.io/article/2587)
2. [kubernetes如何解决服务依赖呢？](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetes之路 1 - Java应用资源限制的迷思](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
