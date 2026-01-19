## Recommended Tools

### [kubectx](https://github.com/ahmetb/kubectx)

kubectx: Used to switch cluster access

kubens: Used to switch default namespace

### [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)

`kubectl` command aliases

### Auto-completion

zsh

```bash
source <(kubectl completion zsh)  # setup autocomplete in zsh into the current shell
echo "if [ $commands[kubectl] ]; then source <(kubectl completion zsh); fi" >> ~/.zshrc # add autocomplete permanently to your zsh shell
```

For other methods, see [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## Common kubectl Commands

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R means recursively apply all configs in the directory
    kubectl apply -R -f configs/


    kubectl get cs
    kubectl get svc --sort-by=.metadata.creationTimestamp
    # View nodes
    kubectl get no --sort-by=.metadata.creationTimestamp
    kubectl drain <node-name>
    kubectl taint nodes node1 key=value:NoSchedule


    kubectl get ing pdd --n java
    # Don't schedule
    kubectl cluster-info dump


    kubectl get po --field-selector spec.nodeName=xxxx
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=$(namespace)
    kubectl get po --all-namespaces
    # View abnormal pods
    kubectl get po --all-namespaces --field-selector 'status.phase!=Running'
```

## Cluster Management Related Commands

### Application Management Related

```bash
    kubectl top pod
    kubectl delete deployment,services -l app=nginx 
    kubectl scale deployment/nginx-deployment --replicas=2
    kubectl get svc --all-namespaces=true
    kubectl rollout undo deployment/nginx-deployment --to-revision=2
    kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80
    # To watch ReplicaSet changes.
    kubectl get rs -w
    kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
    # deployment "nginx-deployment" image updated
    kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java
```

### Force Delete

Sometimes there are problems when deleting pv/pvc. In this case, you need to add 2 command parameters `--grace-period=0 --force `

### Delete All Failed Pods

```bash
  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'
  # Fuzzy delete pods
  key=
  kgpo -n default | grep $key | awk '{print $1}' | xargs kubectl delete po -n1 -n default
  
```

### Events

```bash
    kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
    kubectl get event --all-namespaces  --field-selector involvedObject.name=$po
```


Reference links:
1. [kubernetes Node Maintenance cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)
