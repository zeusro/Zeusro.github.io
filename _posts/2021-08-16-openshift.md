---
layout:       post
title:        "openshift踩坑日记"
subtitle:     "SHIT"
date:         2021-08-16
author:       "Zeusro"
header-img:   "img/b/2021/うずまきナルト.webp"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - Kubernetes
---


openshift 是红帽做的一个 kubernetes 发行版，相当于 rancher 的竞品。红帽公司 kubernetes 的基础上，引入了安全机制，身份验证，网络监控，日志可视化等特性，试图在云原生领域分一杯羹。

## scc（Security Context Constraints）

最近在 openshift 上面部署 traefik 出现了点问题。


```
Error creating: pods "traefik-ingress-controller-68cc888857-" is forbidden: unable to validate against any security context constraint: [provider restricted: .spec.securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.capabilities.add: Invalid value: "NET_BIND_SERVICE": capability may not be added 
spec.containers[0].securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 80: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 443: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 8080: Host ports are not allowed to be used]
```

根据错误提示，找到了问题点在于 scc 。官方的介绍如下：

> OpenShift 的 安全環境限制 （Security Context Constraints）類似於 RBAC 資源控制用戶訪問的方式，管理員可以使用安全環境限制（Security Context Constraints, SCC）來控制Pod 的權限。 您可以使用 SCC 定義 Pod 運行時必須特定條件才能被系統接受。

简单地说，scc 是在 rbac 的基础之上，对用户的行为进行了一些限制。包括上文提到的hostnetwork，SecurityContext 等。相当于 openshift 在 [PodSecurityPolicy](https://kubernetes.io/zh/docs/concepts/policy/pod-security-policy/) 上面做了一层封装。

默认情况下，openshift包含以下8种scc。

1. anyuid
1. hostaccess
1. hostmount-anyuid
1. hostnetwork
1. node-exporter
1. nonroot
1. privileged
1. restricted

而创建的pod资源默认归属于**Restricted**策略。管理员用户也可以创建自己的 scc 并赋予自己的 serviceaccount:

```yaml
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  annotations:
    kubernetes.io/description: traefikee-scc provides all features of the restricted SCC
      but allows users to run with any UID and any GID.
  name: traefikee-scc
priority: 10

allowHostDirVolumePlugin: true
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegeEscalation: true
allowPrivilegedContainer: false
allowedCapabilities:
- NET_BIND_SERVICE
defaultAddCapabilities: null
fsGroup:
  type: RunAsAny
groups:
- system:authenticated
readOnlyRootFilesystem: false
requiredDropCapabilities:
- MKNOD
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: RunAsAny
users: []
volumes:
- configMap
- downwardAPI
- emptyDir
- persistentVolumeClaim
- projected
- secret

```

```bash
oc create -f new-sa.yaml
oc create -f new-scc.yaml
oadm policy add-scc-to-user new-scc system:serviceaccount:monitor:new-sa
```

所以如果创建的资源未就绪，可以用 `kubectl describe pod ` 看一下是否触犯了 scc 的限制。

回到原题，我之所以想部署 traefik 是想做一个接入的控制平面。但是在 openshift 平台上面，其实有自己的一种实现，这种实现叫做 route。

## route 相关问题

### 同域名默认情况只允许一个命名空间

默认情况下禁止同域名跨namespace，需要启用该特性以支持，否则创建 route 会出现 a route in another namespace holds XX 。需要修改 openshift 的内置控制器配置以支持同域名跨namespace route。

```
oc -n openshift-ingress-operator patch ingresscontroller/default --patch '{"spec":{"routeAdmission":{"namespaceOwnership":"InterNamespaceAllowed"}}}' --type=merge
```

### 泛域名解析

建立泛域名解析的 route 时，会提示`wildcard routes are not allowed`。

openshift3可以通过设置ROUTER_ALLOW_WILDCARD_ROUTES 环境变量； openshift4不支持，该问题无解。 参考 https://github.com/openshift/enhancements/blob/master/enhancements/ingress/wildcard-admission-policy.md

### ingress 转换

为了适配大家在其他平台使用的 ingress 。openshift 做了一点兼容性处理，创建 ingress 时会对应创建 route。而如果ingress 中带 TLS ，openshift 也会转换成对应的 route。但 openshift 的route，tls 公私钥是直接存在 route 中的，而不是 secret 。

### 多path解析

如果原先的 ingress 存在针对同域名的多path前缀解析。比如ingress a 监听 域名 a 的 /a 路径；ingress b 监听域名 a 的 /b 路径，那么类似 traefik 的 url rewrite 规则，在注解里面也需要加入 rewrite 注解。openshift 会把这个注解加入到转换的 route
 中。

```
annotations:
    haproxy.router.openshift.io/rewrite-target: /
```

## 网络策略

如果应用无法访问跨namespace service/pod，具体体现是请求长时间没有响应。这应该是这个命名空间开启了隔离，需要用oc客户端赋权。

```
oc adm pod-network make-projects-global <project1> <project2>
```

反过来，如果用户要让某个命名空间（在openshift里面也叫做 project）只能namespace 内互访问，则可以这么操作：


```
oc adm pod-network isolate-projects <project1> <project2>
```

## CRI问题

目前已知的容器运行时有以下三个：

1. containerd
1. CRI-O
1. Docker

openshift 用的是 cri-o 。如果部署的应用强依赖于 containerd/docker ，则部署会导致失败。比如 openkruise 项目就不支持 openshift 。

## 参考链接

[1]
https://ithelp.ithome.com.tw/articles/10243781

[2]
https://kubernetes.io/docs/concepts/policy/pod-security-policy/

[3]
https://cloud.tencent.com/developer/article/1603597

[4]
https://docs.openshift.com/container-platform/4.8/rest_api/network_apis/route-route-openshift-io-v1.html

[5]
https://docs.openshift.com/container-platform/3.5/admin_guide/managing_networking.html