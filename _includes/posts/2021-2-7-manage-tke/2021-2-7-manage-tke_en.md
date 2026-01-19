I started working with `kubernetes` in mid-2018 and led the transformation of traditional applications toward containerization.

Combining the actual problems encountered during implementation and the corresponding troubleshooting experience, let me talk about how to better manage TKE clusters.

## Cluster Management

Actually, before using TKE, you should ask yourself a question. This question is called ~~are you ready to face the storm~~? Oh no, it should be: are you really suitable for `kubernetes`?

![image](/img/in-post/manage-tke/wind.jpg)

When I first encountered `kubernetes`, I was deeply attracted by its features like auto-scaling, application self-healing, rapid iteration, version rollback, load balancing, etc. But after using it for a while, I was tormented to death by application performance monitoring, node failures, and network diagnostics.

What impressed me most was when a JAVA developer questioned me like this: "My application runs fine locally and on cloud servers, so why does it slow down after containerization? **This is all your problem.**"

Afterwards, I deliberately spent some time monitoring this JAVA application for a long time, until I found the cause of OOM kills and slow responses, and spent a Saturday fixing the memory leak—this **code problem**—before the world finally returned to its former peace.

Yes, this is not a `kubernetes` problem, and this is also a `kubernetes` problem. Software design has always had the saying **"no silver bullet"**. The so-called convenience is just shifting complexity elsewhere. The eventual consistency of applications relies on various `Controller` reconciliations, while the so-called load balancing is various iptable rules spread across all nodes, and application restarts rely on the hardworking `kubelet` on nodes.

So, if you don't have the courage to face the new challenges brought by containerization, or if your application scale is very small and iteration frequency is low, I still don't recommend you wade into these muddy waters.

![image](/img/in-post/manage-tke/hammer.png)

"**When you have a hammer, everything looks like a nail.**" This is a disease that needs treatment. Only true warriors dare to face the bleak reality of life.

### Cluster Planning

Forewarned is forearmed. Regarding cluster deployment, our [official documentation](https://cloud.tencent.com/document/product/457/11741) is actually quite detailed. I think the important aspects of cluster planning lie in the choice of **container runtime** and **network plugin**.

Personally, I think from a business perspective, `containerd` is slightly better than `docker` because Google and Docker Inc. have different interests. `kubernetes` established the container runtime standard in the form of CRI from the start, rather than directly using docker. This action has implications. The foreshadowing is that kubernetes 1.20 will drop support for docker.

As for network plugins, it depends on the platform and application characteristics. Taking Tencent Cloud as an example, we currently support `GlobalRouter` and `VPC-CNI`. Simply put, `VPC-CNI` has better network performance, but is limited by the number of machine cores. If applications are mainly small microservices (memory usage within 1G), then using `GlobalRouter` would be more appropriate.

In addition, the CIDR of the container network is also a pain point. If the CIDR range is set too small, there will be too few allocatable pod/service IPs, which will also affect the final application scale.

### Disaster Recovery Plan

Once there was a beautiful `namespace` placed before me that I didn't cherish, until I accidentally deleted her and realized everything was too late. If heaven could give me another chance, I really wish my brain hadn't been waterlogged at that time.

![image](/img/in-post/manage-tke/tear.jpeg)

I still remember that incident. To restore overall business availability, half the tech department had to work overtime until very late. But during the recovery process, we actually discovered some areas where previous work was inadequate: for example, giving developers permission to modify resources in a certain `namespace`, but developers updated applications for convenience by directly modifying ENV in YAML, then forgot the configuration later; for example, not backing up kubernetes YAML, etc.

Combining the entire application delivery process, I later created a relatively simple solution:

1. Periodic backup of code server disks
2. Sync kubernetes YAML to git repository using [kube-backup](https://github.com/zeusro/kube-backup)
3. Image pull accounts only have `pull image` permissions
4. Put production-level resources in the default namespace (because this default `namespace` cannot be deleted)
5. Disabled developer modification permissions, all configurations go through the configuration center, and removed most configmaps
6. Disabled my own admin account, allocated an `api-server` certificate without delete permissions

Point 5 is controversial. Personally, I think when we depend on a certain technology, we should consider "**anti-dependency**". Anti-dependency means: if this technology becomes obsolete or has serious problems, what is our plan B?

Although `kubernetes` provides a hot update mechanism, to reduce the burden on ETCD and reduce dependence on `kubernetes`, we put configurations in `consul`.

The best doctor treats before illness, the worst doctor treats after illness. I hope everyone doesn't wait like me until problems appear before thinking about how to solve them.

## Node Management

TKE node resource planning is actually a somewhat complex "Fermi estimation" problem. Properly managing and planning nodes helps better reduce costs and increase efficiency.

Node configuration needs to match actual situations. For compute-intensive applications, allocate more CPU, while for memory-consuming applications, I personally prefer 4-core 32G nodes more.

Services with special node requirements can use Node Affinity for deployment to schedule to nodes that meet requirements. For example, schedule MySQL to high IO models to improve data read/write efficiency.

GPU-type nodes generally have special purposes, and it's inappropriate to deliver them together with regular nodes to users. So I generally recommend using node taints to isolate them from other nodes, ensuring special-type nodes don't run containers that don't meet expectations.

    kubectl taint node $no just-for-gpu-application=true:NoExecute

```yaml
      tolerations:
        - key: "just-for-gpu-application"
          operator: "Exists"
          effect: "NoSchedule"
        - key: "just-for-gpu-application"
          operator: "Exists"
          effect: "NoExecute"          
```

I personally don't recommend adding small-configuration nodes (like 1-core 2G) to `kubernetes` clusters, because this loses the "elasticity" of application scaling. For example, an application initially gets 0.7 cores 1.5G, but after running for a while, it's found to need 2 cores 4G configuration. Rescheduling can only abandon the original node. Moreover, such low-configuration nodes don't really fit the design philosophy of distributed systems—achieving high availability through resource redundancy.

So, is higher node configuration always better?

This question actually has no standard answer. But I've encountered many times overall node failures caused by node `docker hang` or `Not Ready`, or even excessive node load. This triggers avalanches and unavailability of all applications on the node.

![image](/img/in-post/manage-tke/npd.png)

For problems caused by single-point node failures, in addition to establishing corresponding alert policies on cloud monitoring, we enhanced NPD based on the community version. It supports node self-healing (see "[Using TKE NPDPlus Plugin to Enhance Node Fault Self-Healing Capability](https://cloud.tencent.com/document/product/457/49376)"). Users can choose to restart the container runtime or even restart CVM.

In addition, our TKE also supports [using placement groups to achieve disaster recovery at the physical level](https://cloud.tencent.com/document/product/457/40212#PlacementSet), using anti-affinity at the cloud server underlying hardware level to scatter Pods across different nodes.

## Business Management

The `kubernetes` `DevOps` system is a challenge for both operations and development. Development needs to adapt to the `pod` architecture of ephemeral existence, embracing changes brought by application containerization.

### Volatility

> Everything will pass.
> 
> In my world, this might be the only sentence that can be considered truth.
> 《No Longer Human》

Volatility has several meanings. First, development needs to adapt to the fact that container IPs are variable. Second, the file system is also variable. Previously, when code was deployed on CVM, we could install various debugging tools on the server, but in a container environment, we face a dilemma: should we package debugging tools into the image, or use `kubectl exec` to enter the container and install them?

If we package tools into containers, the image will include some business-unrelated content, making the image larger and deployment slower. If we install debugging tools in containers, we face a lot of repetitive work every time we update/restart.

I won't give a standard answer here either, but I'll tell you how business management can be done in other dimensions.

### Observability

![image](/img/in-post/manage-tke/ob.png)

Currently, the industry's view of observability is to divide it into:

1. Metrics
2. Tracing
3. Logging

These parts. In this regard, we at Tencent Cloud have built a [cloud-native monitoring](https://cloud.tencent.com/document/product/457/49888) solution based on Prometheus, as well as [log collection](https://cloud.tencent.com/document/product/457/48836) and [event storage](https://cloud.tencent.com/document/product/457/50988). These solutions cover metrics monitoring, log collection, event storage, monitoring alerts, and other aspects.

From a Tracing perspective, distributed service tracking and monitoring can be further subdivided into non-invasive and invasive solutions. Invasive solutions refer to modifying code, such as adding specific request headers in the request chain; non-invasive solutions are the now-popular `Service Mesh` approach, letting business focus more on business, while letting traffic control be handled by sidecars. Due to space limitations, I won't expand on this here.

### Isolation

#### Resource Isolation

Resource isolation can be further subdivided into resource isolation within the same cluster and multi-tenant isolation. In previous chapters, I mentioned using node taints to isolate regular nodes and GPU nodes, which is actually a form of resource isolation.

![image](/img/in-post/manage-tke/LimitRange.png)

For multi-tenancy, the simplest implementation is one user per `namespace`, then use `LimitRange` to limit.

Resource isolation exists not only within clusters but also outside clusters. Sometimes we build clusters in the same VPC or across VPCs to achieve complete resource isolation, but this approach also creates new problems with cross-cloud communication (at the VPC level, we support communication through [peering connections](https://cloud.tencent.com/document/product/553/18836) and [cloud networking](https://cloud.tencent.com/document/product/877/18768)). This will be a new challenge for the entire microservices architecture.

#### Network Isolation

To understand network isolation, we must first understand **network connectivity** in reverse. Taking `Flannel`'s `VXLAN` mode as an example, `kubernetes` cluster nodes using this mode are interconnected. And actually, `services` across `namespaces` are also interconnected.

Some might have a question here: isn't `kubernetes` based on `namespace` for resource isolation? Why is cross-`namespace` access interconnected?

Here we have to mention the `/etc/resolv.conf` file that `kubernetes` injects. Taking any unmodified network configuration `pod` under `default` as an example:

```
cat /etc/resolv.conf
nameserver <kube-dns-vip>
search default.svc.cluster.local svc.cluster.local cluster.local localdomain
options ndots:5
```

This configuration means domains with fewer than five levels go through `coreDNS`, prioritized according to the `search` order. For example, resolving baidu.com goes like this:

```sh
sh-4.2# host -v baidu.com
Trying "baidu.com.<namespace>.svc.cluster.local"
Trying "baidu.com.svc.cluster.local"
Trying "baidu.com.cluster.local"
Trying "baidu.com.localdomain"
Trying "baidu.com"
......
```

Here we can see the clue. For example, if we create a service named `tke-six-six-six` under both `default` and `kube-system`, the reason accessing `six` under `default` doesn't jump to the service defined in `kube-system` is because it first tries to resolve `tke-six-six-six.default.svc.cluster.local`. But if we directly access `tke-six-six-six.kube-system.svc.cluster.local`, it's also possible. The so-called isolation is just manipulation at the domain resolution level.

Network isolation is particularly important in multi-tenant environments. We can't guarantee that all incoming and outgoing traffic is legitimate, so we first assume all traffic is illegitimate, only allowing traffic that meets requirements to access applications. If not using `istio`, the official also provides [Network Policy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) based on `ip`, `namespaceSelector`, and `podSelector`.

### Self-Healing

Here I'll apply the first principle of distributed systems again—achieving system availability through resource redundancy. Generally, to avoid single-node unavailability, we recommend users set applications to 2 or more replicas and set `podAntiAffinity`.

```
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: k8s-app
                      operator: In
                      values:
                        - my-pipi-server
                topologyKey: kubernetes.io/hostname
              weight: 100
```

In addition, we generally recommend users add the following configurations:

1. readinessProbe (readiness check)
2. livenessProbe (health check)
3. preStop hook

The importance of readiness checks and health checks goes without saying. `preStop hook` can set a short sleep time, because kube-proxy's action of updating node forwarding rules is not immediate. Adding a preStop hook to containers in Pods makes Pods sleep and wait for a period before truly being destroyed, giving time for Endpoint controller and kube-proxy to update Endpoints and forwarding rules.

Note that the default setting of `terminationGracePeriodSeconds` is 30 seconds. If the `preStop hook` time exceeds 30 seconds, the value of `terminationGracePeriodSeconds` should also be changed accordingly.

## Summary

What is learned from books is shallow; true knowledge comes from practice. Containerization brings new tests for both operations and development, so don't take it lightly.

I hope everyone, whether in operations or development, can extract management skills from operations and unlock new ~~overturn~~ programming moves in development.

![image](/img/in-post/manage-tke/win.png)

No problems are the biggest problem. If there's no answer, find the answer yourself!

## References

[1]
Introducing Container Runtime Interface (CRI) in Kubernetes
https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/

[2]
K8s宣布弃用Docker，千万别慌！
https://cloud.tencent.com/developer/article/1758588

[3]
解读：云原生下的可观察性发展方向
https://cloudnative.to/blog/cloud-native-observability/

[4]
十分钟漫谈容器网络方案 01—Flannel
https://www.infoq.cn/article/rnbqhui1wipzj6bjiwet
