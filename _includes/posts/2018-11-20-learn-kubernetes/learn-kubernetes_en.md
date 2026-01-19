## Some Useful Tools

1. [kompose](https://github.com/kubernetes/kompose)

Can be used to convert docker-compose files, very helpful for beginners learning Kubernetes.

## Installation Tools

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)

References:
1. [Certificate Rotation](https://kubernetes.io/cn/docs/tasks/tls/certificate-rotation/)


## Advanced Scheduling

Each type of affinity has 2 contexts: preferred and required. Preferred indicates preference, while required is mandatory.

### Using Affinity to Ensure Pods Run on Target Nodes

```yml
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
```


Reference Links:
1. [advanced-scheduling-in-kubernetes](https://kubernetes.io/blog/2017/03/advanced-scheduling-in-kubernetes/)
1. [kubernetes-scheulder-affinity](https://cizixs.com/2017/05/17/kubernetes-scheulder-affinity/)

### Using Anti-Affinity to Ensure Only One Application Runs Per Node

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


### Tolerations and Taints

Tolerations and taints always exist in pairs. Taint is like "Although I'm rude, smoke, and spend all my money, I'm still a good woman." This kind of taint usually makes ordinary men (pods) keep their distance, but there are always a few honest people who can tolerate (tolerations) it.

#### Taint

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

Master nodes come with taints by default, which is why containers we deploy won't run on master nodes. But if you customize `taint`, be careful! All `DaemonSet` and kube-system components need to have corresponding `tolerations`. Otherwise, that node will evict all containers without this `tolerations`, including network plugins and kube-proxy. The consequences are quite serious, please be careful.

`taint` and `tolerations` exist in pairs, and operators cannot be used randomly.

#### Tolerations

##### NoExecute


```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoExecute

NoExecute immediately evicts pods that don't meet the tolerance conditions. This operation is very dangerous. Please make sure system components have corresponding tolerations configured first.

Note that using the `Exists` operator is invalid here, you must use `Equal`.

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

This tries to avoid scheduling pods here, but pods can still run on it.

`Exists` and `Equal` can be used freely, it doesn't matter much.

It's worth mentioning that the same key can have multiple effects simultaneously.

```yml
Taints:             elasticsearch-exclusive=true:NoExecute
                    elasticsearch-exclusive=true:NoSchedule
```

Other Reference Links:

1. [Taint and Toleration in Kubernetes](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [Kubernetes Scheduling Mechanism](https://segmentfault.com/a/1190000012709117#articleHeader8)


## Container Orchestration Tips

### wait-for-it

k8s currently doesn't have a dependency startup mechanism like docker-compose's `depends_on`. It's recommended to use [wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/) to rewrite the image's command.

### Using Double Quotes in cmd

```yaml

               - "/bin/sh"
               - "-ec"
               - |
                  curl -X POST --connect-timeout 5 -H 'Content-Type: application/json' \
                  elasticsearch-logs:9200/logs,tracing,tracing-test/_delete_by_query?conflicts=proceed  \
                  -d '{"query":{"range":{"@timestamp":{"lt":"now-90d","format": "epoch_millis"}}}}'
```

## k8s Master-Cluster Architecture

### Master (CONTROL PLANE)

- etcd distributed persistent storage

    Consistent and highly-available key value store used as Kubernetes' backing store for all cluster data.

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


Reference Links:
1. [Kubernetes Core Principles (II) - Controller Manager](https://blog.csdn.net/huwh_/article/details/75675761)
1. [Kubernetes Components](https://kubernetes.io/docs/concepts/overview/components/)

### Worker Nodes

- Kubelet

    The kubelet is the primary "node agent" that runs on each node.
- Kubernetes Proxy

    kube-proxy enables the Kubernetes service abstraction by maintaining network rules on the host and performing connection forwarding.

- Container Runtime (Docker, rkt, or others)

    The container runtime is the software that is responsible for running containers. Kubernetes supports several runtimes: Docker, rkt, runc and any OCI runtime-spec implementation.


## Kubernetes Resources


- spec

 The spec, which you must provide, describes your desired state for the object–the characteristics that you want the object to have. 


- status

 The status describes the actual state of the object, and is supplied and updated by the Kubernetes system.

![image](/img/in-post/learn-kubernetes/resource.png)

### Pod

    A pod is a group of one or more tightly related containers that will always run together on the same worker node and in the same Linux namespace(s).

    Each pod is like a separate logical machine with its own IP, hostname, processes, etc., running a single application.

- liveness

The kubelet uses liveness probes to know when to restart a Container.

- readiness

The kubelet uses readiness probes to know when a Container is ready to start accepting traffic. 

- Question: If you delete a pod, is the pod IP removed from the endpoint first, or is the pod deleted first?

Personal Understanding:

The internal process of deleting a pod in k8s:
1. User deletes pod
2. apiserver marks pod as 'dead' state
3. kubelet deletes pod, waits 30s by default, if still running, will force close pod
   3.1 kubelet waits for prestop in pod containers to finish executing
   3.2 sends sigterm signal to close containers
   3.3 after 30s wait time, sends sigkill signal to force close pod
4. endpoint controller in nodecontroller removes this pod from endpoint

Steps 3 and 4 proceed simultaneously. Generally, step 4 will definitely complete before step 3. Since steps 3 and 4 are not in a fixed order, in extreme cases, kubelet may have already deleted the pod, but the endpoint controller still has this pod, which will cause svc requests to be forwarded to an already deleted pod, resulting in svc call errors.

Reference link https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods


Reference Links:
1. [Using Pod Data in Containers](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)
2. [Using Service Account to Access API Server in Kubernetes Pod](https://tonybai.com/2017/03/03/access-api-server-from-a-pod-through-serviceaccount/)
3. [Graceful Pod Shutdown](https://pracucci.com/graceful-shutdown-of-kubernetes-pods.html)



### Deployment
    A Deployment controller provides declarative updates for Pods and ReplicaSets.


- Rolling Update

```bash
    # Only applicable when pod contains only one container
    kubectl rolling-update NAME [NEW_NAME] --image=IMAGE:TAG
```


[Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) are containers used to initialize the environment.


Reference:
1. [Assign CPU Resources to Containers and Pods](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
2. [Kubernetes deployment strategies](https://container-solutions.com/kubernetes-deployment-strategies/)
3. [Autoscaling based on CPU/Memory in Kubernetes — Part II](https://blog.powerupcloud.com/autoscaling-based-on-cpu-memory-in-kubernetes-part-ii-fe2e495bddd4)
4. [Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)

- Deployment cannot update when resources are insufficient

0/6 nodes are available: 3 Insufficient memory, 3 node(s) had taints that the pod didn't tolerate.

### Replication Controller

    A replication controller is a Kubernetes resource that ensures a pod is always up and running.

    -> label

### ReplicaSet

    Replacement for Replication Controller

k8s Component|pod selector
--|--
Replication Controller|label
ReplicaSet|label, pods that include a certain label key


Reference Links:
1. [Talking About the Kubernetes Deployment Rolling Update Mechanism You May Have Misunderstood](https://blog.csdn.net/WaltonWang/article/details/77461697)

### DaemonSet

    A DaemonSet makes sure it creates as many pods as there are nodes and deploys each one on its own node

- Health Checks
1. liveness probe
2. HTTP-based liveness probe
3. 

### StatefulSet
    Manages the deployment and scaling of a set of Pods, and provides guarantees about the ordering and uniqueness of these Pods.

Reference:
1. [StatefulSet](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)


### Volumes

> Volumes have 2 modes
> 
> In-tree is part of the Kubernetes standard version, already written into Kubernetes code.
> Out-of-tree is implemented through the Flexvolume interface. Flexvolume allows users to write their own drivers or add support for their own data volumes within Kubernetes.


1.  emptyDir – a simple empty directory used for storing transient data,
1.  hostPath – for mounting directories from the worker node's filesystem into the pod,
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
storage (we'll talk about them in the last section of this chapter).

- Persistent Volume
Persistent volumes store data in corresponding external reliable storage, then provide it to Pods/containers for use, without needing to mount external storage to the host first and then provide it to containers. Its biggest feature is that its lifecycle is not associated with Pods. When a Pod dies, it still exists. When a Pod recovers, it automatically restores the association.

- Persistent Volume Claim
Used to declare that it will obtain a certain storage size space from PV or Storage Class resources.

Reference:  
1. [Introduction to Volumes in Kubernetes](https://jimmysong.io/posts/kubernetes-volumes-introduction)

### ConfigMap

ConfigMap is a Kubernetes resource object used to store configuration files. All configuration content is stored in etcd.

Practice has proven that modifying ConfigMap cannot update environment variable information already injected into containers.

Reference:
1. [Kubernetes ConfigMap Hot Update Test](https://jimmysong.io/posts/kubernetes-configmap-hot-update/)


### Service

> A Kubernetes service is a resource you create to get a single, constant point of entry to a group of pods providing the same service.
    
> Each service has an IP address and port that never change while the service exists. 

> The resources will be created in the order they appear in the file. Therefore, it's best to specify the service first, since that will ensure the scheduler can spread the pods associated with the service as they are created by the controller(s), such as Deployment.

- ClusterIP

For cluster internal access, can be directly accessed externally.

When type is not specified, this type of service is created.

clusterIP: None is a special [headless-service](https://kubernetes.io/zh/docs/concepts/services-networking/service/#headless-service), characterized by having no clusterIP.

- NodePort

Each node will open the same port, so it's called NodePort. There are quantity limits. Can be directly accessed externally.

- LoadBalancer

Specific cloud provider service. If it's Alibaba Cloud, it's just automatically binding the backend servers of the load balancer on top of NodePort.

- ExternalName

Reference:
1. [IPVS-Based In-Cluster Load Balancing Deep Dive](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)

### Horizontal Pod Autoscaler

    The Horizontal Pod Autoscaler automatically scales the number of pods in a replication controller, deployment or replica set based on observed CPU utilization (or, with custom metrics support, on some other application-provided metrics).

Works with metrics APIs and request resources in resources for adjustment.

### Kubernetes Downward API

    It allows us to pass metadata about the pod and its environment through environment variables or files (in a so- called downwardAPI volume)

- environment variables
- downwardAPI volume


### Resource Quotas

A means of limiting pod resources based on namespace


## Network Model

[Kubernetes Network Model Principles](https://mp.weixin.qq.com/s?__biz=MjM5OTcxMzE0MQ==&mid=2653371440&idx=1&sn=49f4e773bb8a58728752275faf891273&chksm=bce4dc2a8b93553c6b33d53c688ba30d61f88f0e065f50d82b1fb7e64daa4cc68394ffd8810b&mpshare=1&scene=23&srcid=1031BL2jtxx8DABRb46lNGPl%23rd)



Reference Commands:
3. [kubectl Command Guide](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. [Kubernetes and Docker Basic Concepts and Common Commands Comparison](https://yq.aliyun.com/articles/385699?spm=a2c4e.11153959.0.0.7355d55acvAlBq)
6. [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
7. [K8S Resource Configuration Guide](https://kubernetes.io/docs/reference/)
8. [Introducing Container Runtime Interface (CRI) in Kubernetes](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/)


Reference E-books:
[Kubernetes Handbook——Kubernetes Chinese Guide/Cloud Native Application Architecture Practice Manual](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)
