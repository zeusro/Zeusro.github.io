---
layout:       post
title:        "容器内部请求Kubernetes api-server"
subtitle:     ""
date:         2019-04-19
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Kubernetes
---



连接api-server分3种情况

1. 通过kubectl proxy中转连接
2. 通过授权验证,直接连接(kubectl和各种client就是这种情况)
    `kubectl`加载`~/.kube/config`作为授权信息,请求远端的`api-server`的resetful
    API.`api-server`根据你提交的授权信息判断有没有权限,有权限的话就将对应的结果返回给你.
3. 容器内部通过`ServiceAccount`连接

今天来介绍容器内部连接`api-server`的办法.

## 一个简单的例子

![img](https://d33wubrfki0l68.cloudfront.net/673dbafd771491a080c02c6de3fdd41b09623c90/50100/images/docs/admin/access-control-overview.svg)

`Kubernetes`这套RBAC的机制在[之前的文章](https://www.zeusro.tech/2019/01/17/kubernetes-rbac/)有提过.这里就不解释了


为了方便起见,我直接使用`kube-system`的`admin`作为例子.

```yaml
# {% raw %}

apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ServiceAccount","metadata":{"annotations":{},"name":"admin","namespace":"kube-system"}}
  name: admin
  namespace: kube-system
  resourceVersion: "383"
secrets:
- name: admin-token-wggwk
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: cluster-admin
  resourceVersion: "51"
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
- nonResourceURLs:
  - '*'
  verbs:
  - '*'
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: cluster-admin
  resourceVersion: "102"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:masters

# {% endraw %}
```

简单地说,容器通过`ServiceAccount`配合RBAC这套机制,让容器拥有访问`api-server`的权限.

原本我打算在`kube-system`下面创建一个nginx容器,去访问,但是curl失败了,后来我找了个centos的镜像去测试.大家记得配置好`serviceAccount`就行


    metadata.spec.template.spec.serviceAccount: admin


## 容器请求api-server的细节

### deploy声明sa(`ServiceAccount`)的本质

在deploy声明sa的本质是把sa的对应的secret挂载到`/var/run/secrets/kubernetes.io/serviceaccount`目录中.

不声明sa,则把`default`作为sa挂载进去

```
# k edit secret admin-token-wggwk
# 用edit加载的secret内容都会以base64形式表示
# base64(kube-system):a3ViZS1zeXN0ZW0=
apiVersion: v1
data:
  ca.crt: *******
  namespace: a3ViZS1zeXN0ZW0=
  token: *******
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: admin
    kubernetes.io/service-account.uid: 9911ff2a-8c46-4179-80ac-727f48012229 
  name: admin-token-wggwk
  namespace: kube-system
  resourceVersion: "378"
type: kubernetes.io/service-account-token
```

所以deploy衍生的每一个pod里面的容器,
`/var/run/secrets/kubernetes.io/serviceaccount`目录下面都会有这3个文件

```
/run/secrets/kubernetes.io/serviceaccount # ls -l
total 0
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

虽然这3个文件都是软链接而且最终指向了下面那个带日期的文件夹,但是我们不用管它.
```
/run/secrets/kubernetes.io/serviceaccount # ls -a -l
total 4
drwxrwxrwt    3 root     root           140 Apr 19 06:46 .
drwxr-xr-x    3 root     root          4096 Apr 19 06:46 ..
drwxr-xr-x    2 root     root           100 Apr 19 06:46 ..2019_04_19_06_46_10.877180351
lrwxrwxrwx    1 root     root            31 Apr 19 06:46 ..data -> ..2019_04_19_06_46_10.877180351
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

## 请求api-server

集群就绪之后,在`default`这个命名空间下会有`kubernetes`这个svc,容器透过ca.crt作为证书去请求即可.跨ns的访问方式为`https://kubernetes.default.svc:443`

### 前期准备

```
kubectl exec -it $po sh -n kube-system
cd /var/run/secrets/kubernetes.io/serviceaccount
TOKEN=$(cat token)
APISERVER=https://kubernetes.default.svc:443

```

### 先伪装成一个流氓去访问`api-server`

```bash
sh-4.2# curl -voa  -s  $APISERVER/version
* About to connect() to kubernetes.default.svc port 443 (#0)
*   Trying 172.30.0.1...
* Connected to kubernetes.default.svc (172.30.0.1) port 443 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
*   CAfile: /etc/pki/tls/certs/ca-bundle.crt
  CApath: none
* Server certificate:
* 	subject: CN=kube-apiserver
* 	start date: Jul 24 06:31:00 2018 GMT
* 	expire date: Jul 24 06:44:02 2019 GMT
* 	common name: kube-apiserver
* 	issuer: CN=cc95defe1ffd6401d8ede6d4efb0f0f7c,OU=default,O=cc95defe1ffd6401d8ede6d4efb0f0f7c
* NSS error -8179 (SEC_ERROR_UNKNOWN_ISSUER)
* Peer's Certificate issuer is not recognized.
* Closing connection 0
```

可以看到,用默认的`/etc/pki/tls/certs/ca-bundle.crt`公钥去访问,直接就报证书对不上了(Peer's Certificate issuer is not recognized.)

### 带证书去访问`api-server`

```bash
curl -s $APISERVER/version  \
--header "Authorization: Bearer $TOKEN" \
--cacert ca.crt 
{
  "major": "1",
  "minor": "11",
  "gitVersion": "v1.11.5",
  "gitCommit": "753b2dbc622f5cc417845f0ff8a77f539a4213ea",
  "gitTreeState": "clean",
  "buildDate": "2018-11-26T14:31:35Z",
  "goVersion": "go1.10.3",
  "compiler": "gc",
  "platform": "linux/amd64"
}
```

那这样思路就很明确了,curl的时候带上正确的证书(ca.crt)和请求头就行了.

## 使用curl访问常见API

这里先要介绍一个概念`selfLink`.在`kubernetes`里面,所有事物皆资源/对象.`selfLink`就是每一个资源对应的`api-server`地址.`selfLink`跟资源是一一对应的.

`selfLink`是有规律的,由`namespace`,`type`,`apiVersion`,`name`等组成.


### [get node](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#list-node-v1-core)

    kubectl get no

```bash
curl \
-s $APISERVER/api/v1/nodes?watch \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

### [get pod](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#list-pod-v1-core)


    kubectl get po -n kube-system -w


```bash
curl \
-s $APISERVER/api/v1/namespaces/kube-system/pods?watch \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

### [get pod log](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#read-log-pod-v1-core)

    kubectl logs  -f -c logtail  -n kube-system  logtail-ds-vvpfr


```bash
curl \
-s $APISERVER"/api/v1/namespaces/kube-system/pods/logtail-ds-vvpfr/log?container=logtail&follow" \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

完整API见[kubernetes API](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/)


## 参考链接
1. [Access Clusters Using the Kubernetes API](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)
2. [cURLing the Kubernetes API server](https://medium.com/@nieldw/curling-the-kubernetes-api-server-d7675cfc398c)

