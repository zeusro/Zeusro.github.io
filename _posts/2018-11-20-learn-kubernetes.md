---
layout:       post
title:        "kubernetes笔记"
subtitle:     ""
date:         2018-11-20
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---




## 安装类问题

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)
2. 

参考:
1. [证书轮换](https://kubernetes.io/cn/docs/tasks/tls/certificate-rotation/)

## 一些实用工具

1. [kompose](https://github.com/kubernetes/kompose)

## k8s的 master-cluster 架构

### master(CONTROL PLANE)

- etcd distributed persistent storage

    Consistent and highly-available key value store used as Kubernetes’ backing store for all cluster data.

- kube-apiserver

    front-end for the Kubernetes control plane.
- kube-scheduler

    Component on the master that watches newly created pods that have no node assigned, and selects a node for them to run on.

- Controller Manager 
    - Node Controller
    
        Responsible for noticing and responding when nodes go down.
    - Replication Controller
        
        Responsible for maintaining the correct number of pods for every replication controller object in the system.
    - Endpoints Controller

        Populates the Endpoints object (that is, joins Services & Pods).
    - Service Account & Token Controllers
        
        Create default accounts and API access tokens for new namespaces.
- cloud-controller-manager(**alpha feature**)
    - Node Controller

        For checking the cloud provider to determine if a node has been deleted in the cloud after it stops responding        
    - Route Controller

        For setting up routes in the underlying cloud infrastructure
    - Service Controller

        For creating, updating and deleting cloud provider load balancers
    - Volume Controller
        
         For creating, attaching, and mounting volumes, and interacting with the cloud provider to orchestrate volumes

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R表示递归目录下所有配置
    kubectl apply -R -f configs/

```

参考链接:
1. [Kubernetes核心原理（二）之Controller Manager](https://blog.csdn.net/huwh_/article/details/75675761)

### worker nodes

- Kubelet

    The kubelet is the primary “node agent” that runs on each node.
- Kubernetes Proxy

    kube-proxy enables the Kubernetes service abstraction by maintaining network rules on the host and performing connection forwarding.

- Container Runtime (Docker, rkt, or others)

    The container runtime is the software that is responsible for running containers. Kubernetes supports several runtimes: Docker, rkt, runc and any OCI runtime-spec implementation.


## 一些概念

```
graph LR
K(namespace)-->A
A(pod)-->|副本管理|B(Replication Controller)
A-->|每个节点都运行|D(DaemonSet)
A-->|副本管理|C(ReplicaSet)
A-->|封装|G
C-->|封装|G(Deployment)
A-->F(Service)
A-->|固定的存储,网络服务名|E(StatefulSet)
E-->H
F-->H(Ingress)
F-->|nodeport|I
H-->|nodeport|I(负载均衡)
I-->J(客户端)
```




## 安装类问题

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)
2. 

参考:
1. [证书轮换](https://kubernetes.io/cn/docs/tasks/tls/certificate-rotation/)

## 一些实用工具

1. [kompose](https://github.com/kubernetes/kompose)


## k8s的 master-cluster 架构

### master(CONTROL PLANE)

- etcd distributed persistent storage

    Consistent and highly-available key value store used as Kubernetes’ backing store for all cluster data.

- kube-apiserver

    front-end for the Kubernetes control plane.
- kube-scheduler

    Component on the master that watches newly created pods that have no node assigned, and selects a node for them to run on.

- Controller Manager 
    - Node Controller
    
        Responsible for noticing and responding when nodes go down.
    - Replication Controller
        
        Responsible for maintaining the correct number of pods for every replication controller object in the system.
    - Endpoints Controller

        Populates the Endpoints object (that is, joins Services & Pods).
    - Service Account & Token Controllers
        
        Create default accounts and API access tokens for new namespaces.
- cloud-controller-manager(**alpha feature**)
    - Node Controller

        For checking the cloud provider to determine if a node has been deleted in the cloud after it stops responding        
    - Route Controller

        For setting up routes in the underlying cloud infrastructure
    - Service Controller

        For creating, updating and deleting cloud provider load balancers
    - Volume Controller
        
         For creating, attaching, and mounting volumes, and interacting with the cloud provider to orchestrate volumes

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R表示递归目录下所有配置
    kubectl apply -R -f configs/

```

参考链接:
1. [Kubernetes核心原理（二）之Controller Manager](https://blog.csdn.net/huwh_/article/details/75675761)

### worker nodes

- Kubelet

    The kubelet is the primary “node agent” that runs on each node.
- Kubernetes Proxy

    kube-proxy enables the Kubernetes service abstraction by maintaining network rules on the host and performing connection forwarding.

- Container Runtime (Docker, rkt, or others)

    The container runtime is the software that is responsible for running containers. Kubernetes supports several runtimes: Docker, rkt, runc and any OCI runtime-spec implementation.


## kubernetes的资源


- spec

 The spec, which you must provide, describes your desired state for the object–the characteristics that you want the object to have. 


- status

 The status describes the actual state of the object, and is supplied and updated by the Kubernetes system.

![image](/img/in-post/learn-kubernetes/resource.png)

### pod

    A pod is a group of one or more tightly related containers that will always run together on the same worker node and in the same Linux namespace(s).

    Each pod is like a separate logical machine with its own IP, hostname, processes, etc., running a single application.

- 健康检查
    1. HTTP GET
    2. TCP socket
    3. executes an arbitrary command
  

- liveness

The kubelet uses liveness probes to know when to restart a Container.

- readiness

The kubelet uses readiness probes to know when a Container is ready to start accepting traffic. 

- 问题：如果删除一个pod 是先从endpoint里移除pod ip,还是 pod 先删除
```
个人见解：
删除一个pod的k8s内部流程

1. 用户删除pod
2. apiserver标记pod为'dead'状态
3. kubelet删除pod 默认等待30s还在运行时 会强制关闭pod
   3.1 kubelet等待pod中容器的 prestop 执行结束
   3.2 发送 sigterm 信号 让容器关闭
   3.3 超过30s等待时间 发送 sigkill 信号强制pod关闭
4. nodecontroller中的endpoint controller从endpoint中删除此pod


3 4 步骤同时进行 一般情况下4肯定会先于3完成
由于 3 4 顺序不定  极端情况下可能存在 kubelet已经删除了pod 
而endpoint controller仍然存在此pod
会导致svc请求会转发到已经删除的pod上
从而导致调用svc出错

参考链接 https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods
```

- 相关命令

```bash
    # 设置为不调度节点
    kubectl cordon <node-name>
    # 设置为调度节点
    kubectl uncordon <node-name>
    # 将POD驱离
    kubectl drain <node-name>
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces | grep <YOUR-NODE>
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=17zwd
    kubectl get po --all-namespaces
```

参考链接:
1. [容器中使用pod的数据](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)
2. [在Kubernetes Pod中使用Service Account访问API Server](https://tonybai.com/2017/03/03/access-api-server-from-a-pod-through-serviceaccount/)
3. [优雅停止pod](https://pracucci.com/graceful-shutdown-of-kubernetes-pods.html)



### Deployment
    A Deployment controller provides declarative updates for Pods and ReplicaSets.




[Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) 用来作初始化环境的容器


```bash
kubectl rollout undo deployment/nginx-deployment --to-revision=2
kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80

```

参考:
1. [Assign CPU Resources to Containers and Pods](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
2. [Kubernetes deployment strategies](https://container-solutions.com/kubernetes-deployment-strategies/)
3. [Autoscaling based on CPU/Memory in Kubernetes — Part II](https://blog.powerupcloud.com/autoscaling-based-on-cpu-memory-in-kubernetes-part-ii-fe2e495bddd4)
4. [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)

- 资源不够时deployment无法更新

0/6 nodes are available: 3 Insufficient memory, 3 node(s) had taints that the pod didn't tolerate.

### Replication Controller

    A replication controller is a Kubernetes resource that ensures a pod is always up and running.

    -> label


- Rolling Update


    #只适用于pod 里面只包含一个 container 的情况
    kubectl rolling-update NAME [NEW_NAME] --image=IMAGE:TAG    
    
    
### ReplicaSet(副本集)

    Replication Controller(副本控制器)的替代产物

k8s组件|pod selector
--|--
Replication Controller|label
ReplicaSet|label ,pods that include a certain label key


```bash
#来watch ReplicaSet的变化。
kubectl get rs -w
```

参考链接:
1. [聊聊你可能误解的Kubernetes Deployment滚动更新机制](https://blog.csdn.net/WaltonWang/article/details/77461697)

### DaemonSet(守护进程集)

    A DaemonSet makes sure it creates as many pods as there are nodes and deploys each one on its own node

- 健康检查
1. liveness probe
2. HTTP-based liveness probe
3. 

### StatefulSet(有状态副本集)
    Manages the deployment and scaling of a set of Pods , and provides guarantees about the ordering and uniqueness of these Pods.

参考:
1. [StatefulSet](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)
2. 

```bash


kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
# deployment "nginx-deployment" image updated
kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java

```

### volumes

> volumes有2种模式
> 
> In-tree是 Kubernetes 标准版的一部分，已经写入 Kubernetes 代码中。
> Out-of-tree 是通过 Flexvolume 接口实现的，Flexvolume 可以使得用户在 Kubernetes 内自己编写驱动或添加自有数据卷的支持。


1.  emptyDir – a simple empty directory used for storing transient data,
1.  hostPath – for mounting directories from the worker node’s filesystem into the pod,
1.  gitRepo – a volume initialized by checking out the contents of a Git repository,
1.  nfs – an NFS share mounted into the pod,
1.  gcePersistentDisk (Google Compute Engine Persistent Disk), awsElasticBlockStore
(Amazon Web Services Elastic Block Store Volume), azureDisk (Microsoft Azure Disk
Volume) – for mounting cloud provider specific storage,
1.  cinder, cephfs, iscsi, flocker, glusterfs, quobyte, rbd, flexVolume, vsphereVolume,
photonPersistentDisk, scaleIO – for mounting other types of network storage,
1.  configMap, secret, downwardAPI – special types of volumes used to expose certain
Kubernetes resources and cluster info to the pod,
1.  persistentVolumeClaim – a way to use a pre- or dynamically provisioned persistent
storage (we’ll talk about them in the last section of this chapter).

- Persistent Volume
持久卷，就是将数据存储放到对应的外部可靠存储中，然后提供给Pod/容器使用，而无需先将外部存储挂在到主机上再提供给容器。它最大的特点是其生命周期与Pod不关联，在Pod死掉的时候它依然存在，在Pod恢复的时候自动恢复关联。

- Persistent Volume Claim
用来申明它将从PV或者Storage Class资源里获取某个存储大小的空间。


### ConfigMap

ConfigMap是用来存储配置文件的kubernetes资源对象，所有的配置内容都存储在etcd中.

实践证明修改 ConfigMap 无法更新容器中已注入的环境变量信息。

参考:
1. [Kubernetes ConfigMap热更新测试](https://jimmysong.io/posts/kubernetes-configmap-hot-update/)


### service

> A Kubernetes service is a resource you create to get a single, constant point of entry to a group of pods providing the same service.
    
> Each service has an IP address and port that never change while the service exists. 

> The resources will be created in the order they appear in the file. Therefore, it’s best to specify the service first, since that will ensure the scheduler can spread the pods associated with the service as they are created by the controller(s), such as Deployment.

- ClusterIP

集群内部访问用,外部可直接访问

当type不指定时,创建的就是这一类型的服务

clusterIP: None是一种特殊的[headless-service](https://kubernetes.io/zh/docs/concepts/services-networking/service/#headless-service),特点是没有clusterIP

- NodePort

每个节点都会开相同的端口,所以叫NodePort.有数量限制.外部可直接访问

- LoadBalancer

特定云产商的服务.如果是阿里云,就是在NodePort的基础上,帮你自动绑定负载均衡的后端服务器而已

- ExternalName

参考:
1. [IPVS-Based In-Cluster Load Balancing Deep Dive](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)

### Horizontal Pod Autoscaler

    The Horizontal Pod Autoscaler automatically scales the number of pods in a replication controller, deployment or replica set based on observed CPU utilization (or, with custom metrics support, on some other application-provided metrics).

配合metrics APIs以及resource 里面的 request 资源进行调整.

### Kubernetes Downward API

    It allows us to pass metadata about the pod and its environment through environment variables or files (in a so- called downwardAPI volume)

- environment variables
- downwardAPI volume
- 


### Resource Quotas

基于namespace限制pod资源的一种手段


## 网络模型

[Kubernetes网络模型原理](https://mp.weixin.qq.com/s?__biz=MjM5OTcxMzE0MQ==&mid=2653371440&idx=1&sn=49f4e773bb8a58728752275faf891273&chksm=bce4dc2a8b93553c6b33d53c688ba30d61f88f0e065f50d82b1fb7e64daa4cc68394ffd8810b&mpshare=1&scene=23&srcid=1031BL2jtxx8DABRb46lNGPl%23rd)



## 常用命令

* 集群管理相关


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



参考(应用调度相关):
1. [Kubernetes之健康检查与服务依赖处理](http://dockone.io/article/2587)
2. [kubernetes如何解决服务依赖呢？](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetes之路 1 - Java应用资源限制的迷思](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)


参考命令:
3. [kubectl命令指南](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. [Kubernetes与Docker基本概念与常用命令对照](https://yq.aliyun.com/articles/385699?spm=a2c4e.11153959.0.0.7355d55acvAlBq)
6. [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
7. [K8S资源配置指南](https://kubernetes.io/docs/reference/)
8. 


参考电子书:
[Kubernetes Handbook——Kubernetes中文指南/云原生应用架构实践手册](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)