Kubernetes Cluster Management Experience (Lessons)

**2020-02-26 Update: This article has been updated again, please go to [Kubernetes Cluster Management Experience](https://github.com/zeusro/awesome-kubernetes-notes/blob/master/source/chapter_6.md)**

## Node Issues

### Correct Steps to Delete a Node

```bash
# SchedulingDisabled, ensure new containers won't be scheduled to this node
kubectl cordon $node
# Evict all pods except daemonsets
kubectl drain $node   --ignore-daemonsets
kubectl delete $node
```

### Correct Steps to Maintain a Node

```bash
# SchedulingDisabled, ensure new containers won't be scheduled to this node
kubectl cordon $node
# Evict all pods except daemonsets
kubectl drain $node --ignore-daemonsets --delete-local-data
# After maintenance is complete, restore its normal state
kubectl uncordon $node
```

--delete-local-data means ignoring temporary storage like `emptyDir`

### ImageGCFailed

> 
>   kubelet can clean up unused containers and images. kubelet recycles containers and images every minute and every five minutes respectively.
> 
>   [Configure kubelet garbage collection](https://k8smeetup.github.io/docs/concepts/cluster-administration/kubelet-garbage-collection/)

But kubelet's garbage collection has a problem: it can only recycle unused images, somewhat like `docker system prune`. However, observation shows that dead containers are not the biggest problem; running containers are the bigger problem. If ImageGCFailed keeps occurring, and container usage of ephemeral-storage/hostpath (host directories) keeps increasing, it will eventually lead to more serious DiskPressure problems, affecting all containers on the node.


Recommendations:

1. For high-spec machines (4 cores 32G and above), configure 100G+ SSD space for the docker directory
1. Configure [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/#storage-resource-quota) to limit overall resource quotas
1. Disable ephemeral-storage (local file writes) on the container side, or use spec.containers[].resources.limits.ephemeral-storage to limit and control host directory writes

### Node Disk Pressure (DiskPressure)

```
--eviction-hard=imagefs.available<15%,memory.available<300Mi,nodefs.available<10%,nodefs.inodesFree<5%
```

kubelet specifies disk pressure at startup. Taking Alibaba Cloud as an example, `imagefs.available<15%` means when the container's read-write layer is less than 15%, the node will be evicted. The consequence of node eviction is the occurrence of DiskPressure, and the node can no longer run any images until the disk problem is resolved. If containers on the node use host directories, this problem will be fatal. Because you can't delete the directories, but it's really the accumulation of these host directories that caused the node to be evicted.

So, develop good habits: don't write things randomly in containers (writing files in containers will occupy ephemeral-storage, too much ephemeral-storage will cause pods to be evicted), use stateless containers more, choose storage methods carefully, try not to use hostpath storage.

When this happens, it really feels like wanting to cry but having no tears.

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

ImageGCFailed is a very problematic state. When this state appears, it means kubelet tried to reclaim disk but failed. At this point, consider whether to manually go on the machine to fix it.

Recommendations:

1. When the number of images is above 200, purchase 100G SSD to store images
1. Use less temporary storage (empty-dir, hostpath, etc.)

Reference links:

1. [Eviction Signals](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#eviction-signals)
1. [10 Diagrams to Deeply Understand Docker Containers and Images](http://dockone.io/article/783)


### Node CPU Spikes

It's possible the node is performing GC (container GC/image GC). Check with `describe node`. I encountered this situation once, and in the end, there were many fewer containers on the node, which was a bit frustrating.

```
Events:
  Type     Reason                 Age                 From                                         Message
  ----     ------                 ----                ----
  Warning  ImageGCFailed          45m                 kubelet, cn-shenzhen.xxxx  failed to get image stats: rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

Reference:

[kubelet Source Code Analysis: Garbage Collect](https://cizixs.com/2017/06/09/kubelet-source-code-analysis-part-3/)

### Node Disconnection (unknown)

```
  Ready                False   Fri, 28 Jun 2019 10:19:21 +0800   Thu, 27 Jun 2019 07:07:38 +0800   KubeletNotReady              PLEG is not healthy: pleg was last seen active 27h14m51.413818128s ago; threshold is 3m0s

Events:
  Type     Reason             Age                 From                                         Message
  ----     ------             ----                ----                                         -------
  Warning  ContainerGCFailed  5s (x543 over 27h)  kubelet, cn-shenzhen.xxxx                    rpc error: code = DeadlineExceeded desc = context deadline exceeded
```
After SSHing into the host, I found that although the docker service was still running, `docker ps` was stuck. So I upgraded the kernel to 5.1 and restarted.

Later it was discovered that someone deployed a problematic image that would crash any node it ran on, no matter which node. That was frustrating.

unknown is a very serious problem and must be taken seriously. When a node becomes unknown, the kubernetes master itself doesn't know whether containers on the node are alive or dead. If there's a very important container running on an unknown node, and it happens to crash, kubernetes won't automatically start another container for you. This is something to note.

Reference links:

[Node flapping between Ready/NotReady with PLEG issues](https://github.com/kubernetes/kubernetes/issues/45419)
[In-depth Analysis of Kubernetes Pod Disruption Budgets (PDB)](https://my.oschina.net/jxcdwangtao/blog/1594348)

### SystemOOM

`SystemOOM` doesn't necessarily mean the machine's memory is exhausted. One situation is docker controlling container memory.

By default, Docker's storage location is: /var/lib/docker/containers/$id

There's an important file in this directory: `hostconfig.json`, a partial excerpt looks like this:

```json
	"MemorySwappiness": -1,
	"OomKillDisable": false,
	"PidsLimit": 0,
	"Ulimits": null,
	"CpuCount": 0,
	"CpuPercent": 0,
	"IOMaximumIOps": 0,
	"IOMaximumBandwidth": 0
}
```

`"OomKillDisable": false,` prevents the docker service from harmonizing containers that exceed resource limits by killing processes/restarting, but instead sanctions them in other ways (details can be seen [here](https://docs.docker.com/config/containers/resource_constraints/))

### docker daemon stuck

I encountered this situation once. The reason was a problematic container that affected the entire node.

This problem needs to be resolved quickly, because all pods on the node will become unknown.

```bash
systemctl daemon-reexec
systemctl restart docker (optional, depending on situation)
systemctl restart kubelet
```

In severe cases, only restarting the node and stopping the involved container works.

Recommendation: `For container liveness/readiness, use tcp/httpget methods, avoid high-frequency use of exec`
## pod


### pod Frequent Restarts

There are many reasons, cannot generalize

One situation is: deploy configured health checks, node runs normally, but because node load is too high, health checks fail (load15 consistently above 2), frequent Backoff. After I raised the unhealthy threshold and reduced node load, the problem was resolved.

```yaml

          livenessProbe:
            # Unhealthy threshold
            failureThreshold: 3
            initialDelaySeconds: 5
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 8080
            timeoutSeconds: 1
```

### Resources Reached Limit Setting

Raise limit or check application

### Readiness/Liveness connection refused

Readiness check failures will also restart, but `Readiness` check failure isn't necessarily an application problem. If the node itself is overloaded, connection refused or timeout can also occur.

This problem needs to be investigated on the node.


### pod Evicted

1. Node added taint causing pod to be evicted
1. ephemeral-storage exceeded limit and was evicted
    1. If EmptyDir usage exceeds its SizeLimit, then this pod will be evicted
    1. If Container usage (log, and if there's no overlay partition, includes imagefs) exceeds its limit, then this pod will be evicted
    1. If Pod's total usage of local temporary storage (all emptydir and container) exceeds the sum of all container limits in the pod, then the pod is evicted

ephemeral-storage is temporary storage used by a pod.
```
resources:
       requests: 
           ephemeral-storage: "2Gi"
       limits:
           ephemeral-storage: "3Gi"
```
After a node is evicted, you can still see it through get po. Use the describe command to see the historical reason for eviction.

> Message:            The node was low on resource: ephemeral-storage. Container codis-proxy was using 10619440Ki, which exceeds its request of 0.


References:
1. [Kubernetes pod ephemeral-storage configuration](https://blog.csdn.net/hyneria_hope/article/details/79467922)
1. [Managing Compute Resources for Containers](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)


### kubectl exec Entering Container Failed

I encountered this problem when setting up codis-server. At that time, readiness and health checks were not configured. But when getting pod description, it showed running. Actually, at this point, the container was already abnormal.

```
~ kex codis-server-3 sh
rpc error: code = 2 desc = containerd: container not found
command terminated with exit code 126
```

Solution: Delete this pod, configure `livenessProbe`


### pod's virtual host name

For pods derived from `Deployment`, `virtual host name` is `pod name`.

For pods derived from `StatefulSet`, `virtual host name` is `<pod name>.<svc name>.<namespace>.svc.cluster.local`. Compared to `Deployment`, it's more regular. And it supports access from other pods.


### pod Consecutive Crashbackoff

`Crashbackoff` has many causes.

Sandbox creation (FailedCreateSandBox) failure is mostly a CNI network plugin problem.

Image pulling has issues with Chinese characteristics, may be too large, pulling is slow.

There's also a possibility that container concurrency is too high, causing traffic avalanche.

For example, there are now 3 containers abc. a suddenly encounters a traffic spike causing internal crash, then `Crashbackoff`, so a will be removed by `service`. The remaining bc can't handle that much traffic, crash consecutively, and finally the website becomes inaccessible. This situation is common in high-concurrency websites + low-efficiency web containers.

Without changing code, the optimal solution is to increase replica count and add HPA to achieve dynamic scaling.

### DNS Inefficiency

Enable nscd (domain name caching service) inside containers to significantly improve resolution performance.

Strictly prohibit using alpine as base image in production (will cause DNS resolution request abnormalities)

## deploy

### MinimumReplicationUnavailable

If `deploy` configured SecurityContext, but api-server rejected it, this situation will occur. In the api-server container, remove the `SecurityContextDeny` startup parameter.

See [Using Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)

## service

### Created a Service, But No Corresponding po, What Happens?

Requests will have no response until request timeout

Reference

1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)


### service connection refuse

Possible reasons:

1. pod didn't set readinessProbe, requests go to unready pods
1. kube-proxy is down (kube-proxy is responsible for forwarding requests)
1. Network overload


### service No Load Balancing

Check if `headless service` is used. `headless service` does not automatically load balance...

```yaml
kind: Service
spec:
# clusterIP: None is `headless service`
  type: ClusterIP
  clusterIP: None
```

Specific behavior: service has no virtual IP of its own, nslookup will show all pod IPs. But when pinging, only the first pod's IP appears.

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


For normal type: ClusterIP service, nslookup will show the service's own IP

```BASH
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.30.15.52 consul.default.svc.cluster.local
```

## ReplicationController Not Updating

ReplicationController is not updated with apply, but with `kubectl rolling-update`. However, this command is also deprecated, replaced by `kubectl rollout`. So should use `kubectl rollout` as the update method, or be lazy, apply file then delete po.

Try to use deploy instead.

## StatefulSet

### pod Update Failed

StatefulSet updates one by one. Observe if there are containers in `Crashbackoff`. It's possible this container caused the update to get stuck. Delete it.

### unknown pod

If a StatefulSet bound pod's status becomes unknown, this is very problematic. StatefulSet won't help you recreate the pod.

This will cause external requests to keep failing.

Comprehensive recommendation: don't use `StatefulSet`, replace it with operator pattern.

## [kube-apiserver](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-apiserver/)

`kube-apiserver` is a set of special containers running on `master`. Taking Alibaba Cloud kubernetes as an example (same for kubernetes created with `kubeadm`)

Three files are defined under `/etc/kubernetes/manifests/`
1. kube-apiserver.yaml
1. kube-controller-manager.yaml
1. kube-scheduler.yaml

The master node will automatically monitor changes to files in this directory and automatically restart as needed.

So to modify `api server` settings, just modify `kube-apiserver.yaml`, save and exit, and the corresponding container will restart. Similarly, if you modify the configuration incorrectly, `api server` will fail to start. Before modifying, be sure to carefully read the [documentation](https://kubernetes.io/zh/docs/concepts/overview/kubernetes-api/)

## Alibaba Cloud Kubernetes Issues

### Modify Default Ingress

Create a new load balancer type svc pointing to ingress, then modify the startup parameters of `nginx-ingress-controller` under `kube-system`.

```
        - args:
            - /nginx-ingress-controller
            - '--configmap=$(POD_NAMESPACE)/nginx-configuration'
            - '--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services'
            - '--udp-services-configmap=$(POD_NAMESPACE)/udp-services'
            - '--annotations-prefix=nginx.ingress.kubernetes.io'
            - '--publish-service=$(POD_NAMESPACE)/<custom svc>'
            - '--v=2'
```

### LoadBalancer Service Has No IP

Specific behavior is EXTERNAL-IP always shows pending.

```bash
~ kg svc consul-web
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
consul-web   LoadBalancer   172.30.13.122   <pending>     443:32082/TCP   5m  
```

This problem is related to the [Alibaba Cloud Provider](https://yq.aliyun.com/articles/626066) component. `cloud-controller-manager` has 3 components. They need internal leader election. Something may have gone wrong. At that time, I deleted one of the problematic `pods`, and it was fixed.

### Clean Statefulset Dynamic PVC

Currently, Alibaba Cloud `Statefulset` dynamic PVC uses nas.

1. For this type of storage, first scale container replicas to 0, or delete the entire `Statefulset`.
1. Delete PVC
1. Mount nas to any server, then delete the pvc corresponding nas directory.

### After Upgrading to v1.12.6-aliyun.1, Node Allocatable Memory Decreased

This version reserves 1Gi per node, equivalent to the entire cluster having N GB less (N is the number of nodes) for Pod allocation.

If a node is 4G and a Pod requests 3G, it's extremely easy to be evicted.

Recommendation: Increase node specifications.

```
Server Version: version.Info{Major:"1", Minor:"12+", GitVersion:"v1.12.6-aliyun.1", GitCommit:"8cb561c", GitTreeState:"", BuildDate:"2019-04-22T11:34:20Z", GoVersion:"go1.10.8", Compiler:"gc", Platform:"linux/amd64"}
```

### New Node Shows NetworkUnavailable

RouteController failed to create a route

Check kubernetes events to see if this appears:

```
timed out waiting for the condition -> WaitCreate: ceate route for table vtb-wz9cpnsbt11hlelpoq2zh error, Aliyun API Error: RequestId: 7006BF4E-000B-4E12-89F2-F0149D6688E4 Status Code: 400 Code: QuotaExceeded Message: Route entry quota exceeded in this route table  
```

This problem occurs because the [VPC custom route entry limit](https://help.aliyun.com/document_detail/27750.html) was reached. Default is 48. Need to increase the quota for `vpc_quota_route_entrys_num`.

### Accessing LoadBalancer svc Randomly Shows Traffic Forwarding Abnormalities

See
[[bug] Alibaba Cloud kubernetes version doesn't check loadbalancer service port, causing traffic to be abnormally forwarded](https://github.com/kubernetes/cloud-provider-alibaba-cloud/issues/57)
Simply put, the same SLB cannot have the same svc port, otherwise it will forward blindly.

Official statement:
> Multiple Services reusing the same SLB cannot have the same frontend listening port, otherwise it will cause port conflicts.


### Console Shows Node Memory Usage Always Too High

[Docker Container Memory Monitoring](https://xuxinkun.github.io/2016/05/16/memory-monitor-with-cgroup/)

The reason is their console uses usage_in_bytes(cache+buffer), so it will be larger than the numbers seen in cloud monitoring.


### Ingress Controller Mystical Optimization

Modify the configmap named nginx-configuration under kube-system

```
proxy-connect-timeout: "75" 
proxy-read-timeout: "75" 
proxy-send-timeout: "75" 
upstream-keepalive-connections: "300" 
upstream-keepalive-timeout: "300" 
upstream-keepalive-requests: "1000" 
keep-alive-requests: "1000" 
keep-alive: "300"
disable-access-log: "true" 
client-header-timeout: "75" 
worker-processes: "16"
```

Note: one item corresponds to one configuration, not one file. Format is roughly like this:

```
➜  ~ kg cm nginx-configuration -o yaml
apiVersion: v1
data:
  disable-access-log: "true"
  keep-alive: "300"
  keep-alive-requests: "1000"
  proxy-body-size: 20m
  worker-processes: "16"
  ......
```

### pid Problem

```
Message: **Liveness probe failed: rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:262: starting container process caused "process_linux.go:86: adding pid 30968 to cgroups caused \"failed to write 30968 to cgroup.procs: write /sys/fs/cgroup/cpu,cpuacct/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podfe4cc065_cc58_11e9_bf64_00163e08cd06.slice/docker-0447a362d2cf4719ae2a4f5ad0f96f702aacf8ee38d1c73b445ce41bdaa8d24a.scope/cgroup.procs: invalid argument\""
```

Alibaba Cloud initialization nodes use an old centos version, kernel is 3.1. Centos7.4's kernel 3.10 doesn't support cgroup limits for pid/fd yet, so this type of problem occurs.

Recommendations:

1. Manually maintain nodes, upgrade to 5.x kernel (currently some nodes have been upgraded to 5.x, but docker version is still 17.6.2, continuing to observe~)
1. Install [NPD](https://github.com/AliyunContainerService/node-problem-detector) + [eventer](https://github.com/AliyunContainerService/kube-eventer), use event mechanism to alert administrators for manual maintenance

### OSS PVC FailedMount

OSS can be used through PV specifying access key, access secret + PVC. One day, a deploy encountered a FailedMount problem. Contacted Alibaba Cloud development engineers, who said flexvolume will have problems running on nodes running for the first time, need to let it "re-register"

Affected version: registry-vpc.cn-shenzhen.aliyuncs.com/acs/flexvolume:v1.12.6.16-1f4c6cb-aliyun

Solution:

```bash
touch /usr/libexec/kubernetes/kubelet-plugins/volume/exec/alicloud~oss/debug
```

References (application scheduling related):
1. [Kubernetes Health Checks and Service Dependency Handling](http://dockone.io/article/2587)
2. [How does kubernetes solve service dependencies?](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetes Road 1 - Java Application Resource Limit Misconceptions](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Control CPU Management Policies on the Node](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
1. [Reserve Compute Resources for System Daemons](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)
1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)
