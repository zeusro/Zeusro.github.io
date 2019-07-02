
---
layout:       post
title:        "kubectl常用命令"
subtitle:     ""
date:         2019-07-02
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
  - Kubernetes 
---


## 推荐工具

### [kubectx](https://github.com/ahmetb/kubectx)

kubectx:用来切换集群的访问

kubens:用来切换默认的namespace

### [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)

`kubectl`命令别名

### 自动完成

zsh

```bash
source <(kubectl completion zsh)  # setup autocomplete in zsh into the current shell
echo "if [ $commands[kubectl] ]; then source <(kubectl completion zsh); fi" >> ~/.zshrc # add autocomplete permanently to your zsh shell
```

其他的方式见[kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## kubectl常用命令

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R表示递归目录下所有配置
    kubectl apply -R -f configs/

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R表示递归目录下所有配置
    kubectl apply -R -f configs/


    # 将POD驱离
    kubectl drain <node-name>
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces | grep <YOUR-NODE>
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=$(namespace)
    kubectl get po --all-namespaces

    kubectl rollout undo deployment/nginx-deployment --to-revision=2
    kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80

    #来watch ReplicaSet的变化。
    kubectl get rs -w


    kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
    # deployment "nginx-deployment" image updated
    kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java

kubectl get cs

# 查看节点
kubectl get nodes

kubectl get ing pdd --n java
# 不调度
kubectl taint nodes node1 key=value:NoSchedule
kubectl cluster-info dump


kubectl get svc --sort-by=.metadata.creationTimestamp
kubectl get no --sort-by=.metadata.creationTimestamp
kubectl get po --field-selector spec.nodeName=xxxx
kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
kubectl get event --all-namespaces  --field-selector involvedObject.name=$po
# 查看异常pod
kubectl get po --all-namespaces --field-selector 'status.phase!=Running'

```
## 集群管理相关命令

### 应用管理相关

```bash
kubectl top pod
kubectl delete deployment,services -l app=nginx 
kubectl scale deployment/nginx-deployment --replicas=2
kubectl get svc --all-namespaces=true

```

### 强制删除

有时 删除pv/pvc时会有问题,这个使用得加2个命令参数`--grace-period=0 --force `

###删除所有失败的pod

```bash
  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'
```

### 一些技巧

k8s目前没有没有类似docker-compose的`depends_on`依赖启动机制,建议使用[wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/)重写镜像的command.



参考链接:
1. [kubernetes 节点维护 cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)

