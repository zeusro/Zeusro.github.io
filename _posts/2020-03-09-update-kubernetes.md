---
layout:       post
title:        "更新kubernetes大版本需要注意的问题"
subtitle:     "坑,都是坑!"
date:         2020-03-09
author:       "Zeusro"
header-img:   "img/b/2020/Mononoke.png"
header-mask:  0.3
catalog:      true
tags:
    - Kubernetes
---

## 最大的坑是 deprecated apiVersion

`Kubernetes` 的 `apiVersion` 是会过期的

以 1.16来说,`DaemonSet`, `Deployment`, `StatefulSet`, `ReplicaSet` 全部统一使用 `apps/v1`

`NetworkPolicy`  使用 `networking.k8s.io/v1`

`PodSecurityPolicy` 使用 `networking.k8s.io/v1`

所以,在 `1.16` 中使用 `apps/v1beta2`, `extensions/v1beta1` 等废弃API都会出错

## 拥抱变化


### 检查受影响资源

```bash
kubectl get NetworkPolicy,PodSecurityPolicy,DaemonSet,Deployment,ReplicaSet \
--all-namespaces \
-o 'jsonpath={range .items[*]}{.metadata.annotations.kubectl\.kubernetes\.io/last-applied-configuration}{"\n"}{end}' | grep '"apiVersion":"extensions/v1beta1"'

kubectl get DaemonSet,Deployment,StatefulSet,ReplicaSet \
--all-namespaces \
-o 'jsonpath={range .items[*]}{.metadata.annotations.kubectl\.kubernetes\.io/last-applied-configuration}{"\n"}{end}' | grep '"apiVersion":"apps/v1beta'

kubectl get --raw="/metrics" | grep apiserver_request_count | grep 'group="extensions"' | grep 'version="v1beta1"' | grep -v ingresses | grep -v 'client="hyperkube' | grep -v 'client="kubectl' | grep -v 'client="dashboard'

kubectl get --raw="/metrics" | grep apiserver_request_count | grep 'group="apps"' | grep 'version="v1beta' | grep -v 'client="hyperkube' | grep -v 'client="kubectl' | grep -v 'client="dashboard'

```

### recreate

是的，你没有听错，只能删除后重建。

我的建议是，在业务低峰期，建同label deploy 覆盖旧的`resource`，旧的`resource`缩容至0,并加上`deprecated:true`的`label`观察一段时间后,再彻底删除.

## 后记

apiVersion 变动的频繁,在某种程度上也可以证明 `Kubernetes` 在容器调度方面的霸权——毕竟，如果你跟女朋友分手了，也不会想给她买新衣服，对吧？

![](/img/sticker/云原生开发.gif)

## 参考链接

1. [error: At least one of apiVersion, kind and name was changed](https://stackoverflow.com/questions/56386647/error-at-least-one-of-apiversion-kind-and-name-was-changed)
1. [Kubernetes Version 1.16 Removes Deprecated APIs](https://www.ibm.com/cloud/blog/announcements/kubernetes-version-1-16-removes-deprecated-apis)
1. [Kubernetes v1.17 版本解读](https://yq.aliyun.com/articles/739120)
1. [API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
1. [Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)