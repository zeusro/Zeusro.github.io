## 推奨ツール

### [kubectx](https://github.com/ahmetb/kubectx)

kubectx：クラスターアクセスの切り替えに使用

kubens：デフォルトのnamespaceの切り替えに使用

### [kubectl-aliases](https://github.com/ahmetb/kubectl-aliases)

`kubectl`コマンドのエイリアス

### 自動補完

zsh

```bash
source <(kubectl completion zsh)  # setup autocomplete in zsh into the current shell
echo "if [ $commands[kubectl] ]; then source <(kubectl completion zsh); fi" >> ~/.zshrc # add autocomplete permanently to your zsh shell
```

他の方法については、[kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)を参照してください。

## kubectlのよく使うコマンド

```bash

    kubectl api-resources --namespaced=false
    kubectl api-resources --namespaced=true
    # -Rはディレクトリ内のすべての設定を再帰的に適用することを意味します
    kubectl apply -R -f configs/


    kubectl get cs
    kubectl get svc --sort-by=.metadata.creationTimestamp
    # ノードを表示
    kubectl get no --sort-by=.metadata.creationTimestamp
    kubectl drain <node-name>
    kubectl taint nodes node1 key=value:NoSchedule


    kubectl get ing pdd --n java
    # スケジュールしない
    kubectl cluster-info dump


    kubectl get po --field-selector spec.nodeName=xxxx
    kubectl exec -it ng-57d74c8694-6cqnz sh  -n=java
    kubectl get pods --all-namespaces --field-selector spec.nodeName=<node> -o wide
    kubectl get pods -o wide --all-namespaces
    kubectl get po -l app=nginx -w
    kubectl delete po -l app=onekey-ali-web -n=$(namespace)
    kubectl get po --all-namespaces
    # 異常なpodを表示
    kubectl get po --all-namespaces --field-selector 'status.phase!=Running'
```

## クラスター管理関連のコマンド

### アプリケーション管理関連

```bash
    kubectl top pod
    kubectl delete deployment,services -l app=nginx 
    kubectl scale deployment/nginx-deployment --replicas=2
    kubectl get svc --all-namespaces=true
    kubectl rollout undo deployment/nginx-deployment --to-revision=2
    kubectl autoscale deployment <deployment-name> --min=2 --max=5 --cpu-percent=80
    # ReplicaSetの変化を監視するために。
    kubectl get rs -w
    kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
    # deployment "nginx-deployment" image updated
    kubectl set image deploy monitorapi-deployment  monitorapi=registry-vpc.cn-shenzhen.aliyuncs.com/amiba/monitorapi:1.2.4 -n=java
```

### 強制削除

pv/pvcを削除する際に問題が発生することがあります。この場合、2つのコマンドパラメータ`--grace-period=0 --force `を追加する必要があります。

### すべての失敗したPodを削除

```bash
  kubectl get po --all-namespaces --field-selector 'status.phase==Failed'
  kubectl delete po  --field-selector 'status.phase==Failed'
  # あいまいな削除pod
  key=
  kgpo -n default | grep $key | awk '{print $1}' | xargs kubectl delete po -n1 -n default
  
```

### イベント

```bash
    kubectl get events  --field-selector involvedObject.kind=Service --sort-by='.metadata.creationTimestamp'
    kubectl get event --all-namespaces  --field-selector involvedObject.name=$po
```


参考リンク：
1. [kubernetes ノードメンテナンス cordon, drain, uncordon](https://blog.csdn.net/stonexmx/article/details/73543185)
