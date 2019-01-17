---
layout:       post
title:        "理解kubernetes的角色控制"
subtitle:     "RBAC"
date:         2019-01-03
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---


`kubernetes`内部,master和node之间,别说内部通讯都需要通过`api-server`通讯,外部通过`kubelet`访问管理集群,本质上也是访问`api-server`,`api-server`就是整个集群的指挥中枢.


但是人在江湖漂,哪能不挨刀呢?要怎么防止集群内外瞎搞事的破坏分子呢?`RBAC`(Role-based access control )顺势而生.

一句话总结`ServiceAccount`,`Role`,`RoleBinding`,`ClusterRole`,`ClusterRoleBinding`的关系就是,

**`ClusterRoleBinding`,`RoleBinding`是一种任命,认命被授权的对象(users, groups, or service accounts)能够有什么样的权限(Role,ClusterRole)**

 

## ServiceAccount

```
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ServiceAccount","metadata":{"annotations":{},"name":"flannel","namespace":"kube-system"}}
  creationTimestamp: 2018-07-24T06:44:45Z
  name: flannel
  namespace: kube-system
  resourceVersion: "382"
  selfLink: /api/v1/namespaces/kube-system/serviceaccounts/flannel
  uid: 0d4064e6-8f0d-11e8-b4b4-00163e08cd06
secrets:
- name: flannel-token-f7d4d
```

上面说了,`ServiceAccount`只是一个虚名,本身没有任何的权限说明.

## service-account-token

service-account-token的API type是`kubernetes.io/service-account-token`

变动`ServiceAccount`时,Token Controller(controller-manager的一部分)
会自动维护`service-account-token`,根据实际情况增加/修改/删除,`service-account-token`的本质类型是`secret`.所以`service-account-token`是1对1跟`ServiceAccount`随生随死的.

而定义的资源如果指定了`ServiceAccount`,`Admission Controllers`(api-server的一部分)就会把这个`ServiceAccount`相应的`service-account-token`以文件的形式挂载到容器内部的`/var/run/secrets/kubernetes.io/serviceaccount`目录下.

该目录一般会有3个文件

1. ca.crt	
1. namespace  
1. token

1. [管理Service Accounts](https://kubernetes.io/zh/docs/admin/service-accounts-admin/)
1. [Configure Service Accounts for Pods](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

## Role

```yml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

Role 只能用于授予对单个命名空间中的资源访问权限

定义了具体的url

## RoleBinding

```yml
# This role binding allows "jane" to read pods in the "default" namespace.
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

RoleBinding 适用于某个命名空间内授权,RoloBinding 可以将角色中定义的权限授予用户或用户组

## ClusterRole 

```yml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```  

1. 集群级别的资源控制(例如 node 访问权限)
1. 非资源型 endpoints(例如 /healthz 访问)
1. 所有命名空间资源控制(例如 pods)

## ClusterRoleBinding

```yml
# This cluster role binding allows anyone in the "manager" group to read secrets in any namespace.
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: manager
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus-operator
subjects:
- kind: ServiceAccount
  name: prometheus-operator
  namespace: monitoring
```

ClusterRoleBinding 适用于集群范围内的授权。

最后用一个表格整理一下

|资源类型| 说明|
|---|---|
|ServiceAccount |一个虚名|
|service-account-token|ServiceAccount的身份象征 | 
|Role| 授予对单个命名空间中的资源访问权限| 
|RoleBinding|将赋予被授权对象和Role| 
|ClusterRole |可视为Role的超集,是从集群角度做的一种授权| 
|ClusterRoleBinding|将赋予被授权对象和ClusterRole| 
| | |

理解`kubernetes`RBAC的最简单办法,就是进入kube-system内部,看看各类集群资源是怎么定义的.

参考链接:

1. [Kubernetes TLS bootstrapping 那点事](https://mritd.me/2018/01/07/kubernetes-tls-bootstrapping-note/)
1. [使用 RBAC 控制 kubectl 权限](https://mritd.me/2018/03/20/use-rbac-to-control-kubectl-permissions/)
2. [Kubernetes RBAC](https://mritd.me/2017/07/17/kubernetes-rbac-chinese-translation/)
1. [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding)