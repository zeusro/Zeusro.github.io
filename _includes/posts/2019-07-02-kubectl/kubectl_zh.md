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


    kubectl get cs
    kubectl get svc --sort-by=.metadata.creationTimestamp
    # 查看节点
    kubectl get no --sort-by=.metadata.creationTimestamp
    kubectl drain <node-name>
    kubectl taint nodes node1 key=value:NoSchedule


    kubectl get ing pdd --n java
    # 不调度
    kubectl cluster-info dump


    kubectl get po --field-selector spec.nodeName=xxxx
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=$(namespace)
    kubectl get po --all-namespaces
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
    kubectl rollout undo deployment/nginx-deployment --to-revision=2
    kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80
    #来watch ReplicaSet的变化。
    kubectl get rs -w
    kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
    # deployment "nginx-deployment" image updated
    kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java
```

### 强制删除

有时 删除pv/pvc时会有问题,这个使用得加2个命令参数`--grace-period=0 --force `

### 删除所有失败的pod

```bash
  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'
  #模糊删除pod
  key=
  kgpo -n default | grep $key | awk '{print $1}' | xargs kubectl delete po -n1 -n default
  
```

### 事件

```bash
    kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
    kubectl get event --all-namespaces  --field-selector involvedObject.name=$po
```


参考链接:
1. [kubernetes 节点维护 cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)