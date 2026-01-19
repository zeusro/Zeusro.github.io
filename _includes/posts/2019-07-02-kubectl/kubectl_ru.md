## Рекомендуемые инструменты

### [kubectx](https://github.com/ahmetb/kubectx)

kubectx: Используется для переключения доступа к кластеру

kubens: Используется для переключения пространства имен по умолчанию

### [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)

Псевдонимы команд `kubectl`

### Автодополнение

zsh

```bash
source <(kubectl completion zsh)  # setup autocomplete in zsh into the current shell
echo "if [ $commands[kubectl] ]; then source <(kubectl completion zsh); fi" >> ~/.zshrc # add autocomplete permanently to your zsh shell
```

Для других методов см. [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## Общие команды kubectl

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -R означает рекурсивно применить все конфигурации в каталоге
    kubectl apply -R -f configs/


    kubectl get cs
    kubectl get svc --sort-by=.metadata.creationTimestamp
    # Просмотр узлов
    kubectl get no --sort-by=.metadata.creationTimestamp
    kubectl drain <node-name>
    kubectl taint nodes node1 key=value:NoSchedule


    kubectl get ing pdd --n java
    # Не планировать
    kubectl cluster-info dump


    kubectl get po --field-selector spec.nodeName=xxxx
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=$(namespace)
    kubectl get po --all-namespaces
    # Просмотр аномальных подов
    kubectl get po --all-namespaces --field-selector 'status.phase!=Running'
```

## Команды, связанные с управлением кластером

### Связанные с управлением приложениями

```bash
    kubectl top pod
    kubectl delete deployment,services -l app=nginx 
    kubectl scale deployment/nginx-deployment --replicas=2
    kubectl get svc --all-namespaces=true
    kubectl rollout undo deployment/nginx-deployment --to-revision=2
    kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80
    # Для наблюдения за изменениями ReplicaSet.
    kubectl get rs -w
    kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
    # deployment "nginx-deployment" image updated
    kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java
```

### Принудительное удаление

Иногда возникают проблемы при удалении pv/pvc. В этом случае нужно добавить 2 параметра команды `--grace-period=0 --force `

### Удалить все неудачные поды

```bash
  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'
  # Нечеткое удаление подов
  key=
  kgpo -n default | grep $key | awk '{print $1}' | xargs kubectl delete po -n1 -n default
  
```

### События

```bash
    kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
    kubectl get event --all-namespaces  --field-selector involvedObject.name=$po
```


Ссылки:
1. [Обслуживание узлов kubernetes cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)
