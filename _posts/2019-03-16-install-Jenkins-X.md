---
layout:       post
title:        "国内服务器安装JenkinsX"
subtitle:     "安装不算很难"
date:         2019-03-16
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Jenkins
    - Jenkins-X
    - CI
    - kubernetes
---

## 前言

之前介绍了
[Concourse-CI从入门到放弃](https://www.zeusro.tech/2018/09/02/give-up-concourse-ci/)
今天来讲讲`Jenkins`的划时代版本--**JenkinsX**!

`JenkinsX`是一个Jenkins的子项目,专门运行在K8S上面.

文章分2部分,第一部分介绍安装,第二部分讲解应用实践.


## 前期准备

### helm

包括客户端和服务端.[语法](https://helm.sh/docs/chart_template_guide/#getting-started-with-a-chart-template)也要了解

运行`helm version`确保客户端和服务端都没有问题

### 本地

#### jx

跟`Concourse-CI`差不多,一开始也要安装本地CLI


```bash
brew tap jenkins-x/jx
brew install jx 
```

```
➜  ~ jx version
NAME               VERSION
jx                 1.3.974
jenkins x platform 0.0.3535
Kubernetes cluster v1.11.5
kubectl            v1.13.4
helm client        v2.10.0+g9ad53aa
helm server        v2.10.0+g9ad53aa
git                git version 2.14.3 (Apple Git-98)
Operating System   Mac OS X 10.13.6 build 17G65
```

最佳实践是创建自己的`myvalue.yaml`,修改里面的镜像,一步到位,这样就不需要后期修改了

https://jenkins-x.io/getting-started/config/


### 服务器

使用国内阿里云ECS作为服务器.

已经创建了ingress的服务和pod

### 验证安装

`jx compliance run`会启动一个新的ns和一系列资源去检查整个集群.但由于镜像都是
gcr.io的,所以我启动失败了.有信心的直接跳过这一步吧.

```
jx compliance run
jx compliance status
jx compliance results
jx compliance delete

```

## 安装步骤

### jx install

`jx install` 是对helm的再度封装.参数分为几部分

`default-admin-password` 是`Jenkins`,`grafana`,`nexus`,`chartmuseum`的默认密码,建议设复杂点,不然后期又要修改

`--namespace`是安装的目标ns.默认是`kube-system`;

`--ingress`指定当前的ingress实例,不指定的话会报错,提示找不到jx-ingress

`--domain`是最终Jenkins-X的对外域名


```
jx \
install \
--cloud-environment-repo https://github.com/haoshuwei/cloud-environments.git \
--default-admin-password abcde \
--provider=kubernetes \
--namespace $(namespace) \
--ingress-service=nginx-ingress-lb \
--ingress-deployment=nginx-ingress-controller \
--ingress-namespace=kube-system 
--domain=$(domain)
```

里面有几个重要的选项,我先后选了

> Static Master Jenkins

> Kubernetes Workloads: Automated CI+CD with GitOps Promotion

之后会命令行会进入这个等待的状态

waiting for install to be ready, if this is the first time then it will take a while to download images

部署docker镜像,相比一定会碰到不可描述类问题.这时

```bash
kgpo -l release=jenkins-x
```

果然发现部分pod启动失败,这时需要把镜像搬回国内,并修改对应的`deploy`/`ds`

### 配置volume

#### mongodb

先把`jenkins-x-mongodb`关联的镜像转移到国内,再配置PVC

```
jenkins-x-mongodb
docker.io/bitnami/mongodb:3.6.6-debian-9
```

修改这部分

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: jenkins-x-mongodb
```            

#### jenkins-x-chartmuseum

同样是修改volumes这部分

```yaml
      volumes:
        - name: storage-volume
          persistentVolumeClaim:
            claimName: jenkins-x-chartmuseum
```

#### jenkins

```
      volumes:
        - configMap:
            defaultMode: 420
            name: jenkins
          name: jenkins-config
        - emptyDir: {}
          name: plugin-dir
        - emptyDir: {}
          name: secrets-dir
        - name: jenkins-home
          persistentVolumeClaim:
            claimName: jenkins
```

推荐使用阿里云NAS

### 转移k8s.gcr.io镜像到国内

Jenkins-X配置了deploy,CronJob,镜像很多都是`gcr.io`的,两部分都需要修改

#### deploy

- `jenkins-x-controllerteam`,`jenkins-x-controllerbuild`

```
gcr.io/jenkinsxio/builder-go:0.1.281
这镜像3.72G左右
```

- `jenkins-x-heapster`

```
docker pull k8s.gcr.io/heapster:v1.5.2
docker pull k8s.gcr.io/addon-resizer:1.7
# docker tag k8s.gcr.io/addon-resizer:1.7 $newregistry'addon-resizer:1.7'
```

#### CronJob

- jenkins-x-gcpreviews

转移完成后,pod基本上就全起来了


## 最后成果

`jenkins`,`monocular`和`nexus`可以直接访问,其他的暂时不用管

```bash
# $(app).$(namespace).$(domain)
➜  ~ kg ing
NAME                         HOSTS                                             ADDRESS        PORTS     AGE
chartmuseum                  chartmuseum.$(namespace).$(domain)       172.18.221.8   80        17h
docker-registry              docker-registry.$(namespace).$(domain)   172.18.221.8   80        17h
jenkins                      jenkins.$(namespace).$(domain)           172.18.221.8   80        17h
monocular                    monocular.$(namespace).$(domain)         172.18.221.8   80        17h
nexus                        nexus.$(namespace).$(domain)             172.18.221.8   80        17h
```

```bash
➜  ~ kg all -l release=jenkins-x
NAME                                                    READY   STATUS         RESTARTS   AGE
pod/jenkins-6879786cbc-6p8f7                            1/1     Running        0          17h
pod/jenkins-x-chartmuseum-7557886767-rbvlf              1/1     Running        0          6m
pod/jenkins-x-controllerbuild-74f7bd9f66-5b5v6          1/1     Running        0          16m
pod/jenkins-x-controllercommitstatus-5947679dc4-ltft7   1/1     Running        0          17h
pod/jenkins-x-controllerrole-5d58fcdd9f-lggwj           1/1     Running        0          17h
pod/jenkins-x-controllerteam-75c7565bdb-dmcgw           1/1     Running        0          44m
pod/jenkins-x-controllerworkflow-578bd4f984-qntf4       1/1     Running        0          17h
pod/jenkins-x-docker-registry-7b56b4f555-4p6hx          1/1     Running        0          17h
pod/jenkins-x-gcactivities-1552708800-7qcdc             0/1     Completed      0          10m
pod/jenkins-x-gcpods-1552708800-wfssj                   0/1     Completed      0          10m
pod/jenkins-x-gcpreviews-1552654800-pptmn               0/1     ErrImagePull   0          24s
pod/jenkins-x-mongodb-6bd8cc478f-55wwm                  1/1     Running        1          18m
pod/jenkins-x-nexus-695cc97bd6-qljhk                    1/1     Running        0          17h

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE
service/heapster                    ClusterIP   172.30.2.12     <none>        8082/TCP    17h
service/jenkins                     ClusterIP   172.30.5.27     <none>        8080/TCP    17h
service/jenkins-x-chartmuseum       ClusterIP   172.30.14.160   <none>        8080/TCP    17h
service/jenkins-x-docker-registry   ClusterIP   172.30.13.194   <none>        5000/TCP    17h
service/jenkins-x-mongodb           ClusterIP   172.30.13.146   <none>        27017/TCP   17h
service/nexus                       ClusterIP   172.30.4.7      <none>        80/TCP      17h

NAME                                               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/jenkins                            1         1         1            1           17h
deployment.apps/jenkins-x-chartmuseum              1         1         1            1           17h
deployment.apps/jenkins-x-controllerbuild          1         1         1            1           17h
deployment.apps/jenkins-x-controllercommitstatus   1         1         1            1           17h
deployment.apps/jenkins-x-controllerrole           1         1         1            1           17h
deployment.apps/jenkins-x-controllerteam           1         1         1            1           17h
deployment.apps/jenkins-x-controllerworkflow       1         1         1            1           17h
deployment.apps/jenkins-x-docker-registry          1         1         1            1           17h
deployment.apps/jenkins-x-mongodb                  1         1         1            1           17h
deployment.apps/jenkins-x-nexus                    1         1         1            1           17h

NAME                                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/jenkins-6879786cbc                            1         1         1       17h
replicaset.apps/jenkins-x-chartmuseum-7557886767              1         1         1       6m
replicaset.apps/jenkins-x-chartmuseum-cc467cfc                0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-57dcb9fd5f          0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-74f7bd9f66          1         1         1       16m
replicaset.apps/jenkins-x-controllercommitstatus-5947679dc4   1         1         1       17h
replicaset.apps/jenkins-x-controllerrole-5d58fcdd9f           1         1         1       17h
replicaset.apps/jenkins-x-controllerteam-5f57968bc9           0         0         0       17h
replicaset.apps/jenkins-x-controllerteam-75c7565bdb           1         1         1       44m
replicaset.apps/jenkins-x-controllerworkflow-578bd4f984       1         1         1       17h
replicaset.apps/jenkins-x-docker-registry-7b56b4f555          1         1         1       17h
replicaset.apps/jenkins-x-mongodb-6bd8cc478f                  1         1         1       23m
replicaset.apps/jenkins-x-mongodb-6bfd5d9c79                  0         0         0       17h
replicaset.apps/jenkins-x-nexus-695cc97bd6                    1         1         1       17h

NAME                                          DESIRED   SUCCESSFUL   AGE
job.batch/jenkins-x-gcactivities-1552698000   1         1            3h
job.batch/jenkins-x-gcactivities-1552699800   1         1            2h
job.batch/jenkins-x-gcactivities-1552708800   1         1            10m
job.batch/jenkins-x-gcpods-1552698000         1         1            3h
job.batch/jenkins-x-gcpods-1552699800         1         1            2h
job.batch/jenkins-x-gcpods-1552708800         1         1            10m
job.batch/jenkins-x-gcpreviews-1552654800     1         0            15h

NAME                                   SCHEDULE         SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/jenkins-x-gcactivities   0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpods         0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpreviews     0 */3 * * *      False     1        15h             17h
```

## 设置优化

### 修改`jx get urls`的结果

需要修改SVC里面的

```yaml
metadata:
  annotations:
    fabric8.io/exposeUrl:
```

1. jenkins-x-chartmuseum
1. jenkins-x-docker-registry
1. jenkins-x-monocular-api
1. jenkins-x-monocular-ui
1. jenkins
1. nexus

### 设置maven源


## 其他有用命令

### 更新整个Jenkins-X平台

```bash
jx upgrade platform
```

### 切换环境

```bash
jx context
jx environment
```

### 更新密码



参考链接:

1. [京东工程效率专家 石雪峰 JenkinsX：基于Kubernetes的新一代CI/CD平台](http://www.caict.ac.cn/pphd/zb/2018kxy/15pm/5/201808/t20180813_181702.htm)
1. [JenkinsX Essentials](https://www.youtube.com/watch?v=LPEIfvkJpw0)
2. [安装Jenkins X](https://kubernetes.feisky.xyz/fu-wu-zhi-li/devops/jenkinsx)
3. [安装和使用Jenkins X：Kubernetes的自动化CI / CD的命令行工具](https://www.ctolib.com/jenkins-x-jx.html)
4. [5分钟在阿里云Kubernetes服务上搭建jenkins环境并完成应用构建到部署的流水线作业](https://yq.aliyun.com/articles/683440)
1. [Install on Kubernetes](https://jenkins-x.io/getting-started/install-on-cluster/)
1. [jx](https://jenkins-x.io/commands/jx/)
1. [阿里云容器服务Kubernetes之JenkinsX（1）-安装部署实践篇](https://yq.aliyun.com/articles/657149)
1. [阿里云示例](https://cs.console.aliyun.com/#/k8s/catalog/detail/incubator_jenkins-x-platform)
