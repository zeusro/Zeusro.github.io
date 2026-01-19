## いくつかの便利なツール

1. [kompose](https://github.com/kubernetes/kompose)

docker-composeファイルの変換に使用でき、Kubernetesを学び始める人にとって非常に役立ちます。

## インストールツール

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)

参考：
1. [証明書のローテーション](https://kubernetes.io/cn/docs/tasks/tls/certificate-rotation/)


## 高度なスケジューリング

各タイプのアフィニティには2つのコンテキストがあります：preferredとrequired。preferredは傾向を示し、requiredは必須です。

### アフィニティを使用してポッドがターゲットノードで実行されるようにする

```yml
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
```


参考リンク：
1. [advanced-scheduling-in-kubernetes](https://kubernetes.io/blog/2017/03/advanced-scheduling-in-kubernetes/)
1. [kubernetes-scheulder-affinity](https://cizixs.com/2017/05/17/kubernetes-scheulder-affinity/)

### アンチアフィニティを使用して各ノードで1つのアプリケーションのみが実行されるようにする

```yml
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: 'app'
                operator: In
                values:
                - nginx-test2
            topologyKey: "kubernetes.io/hostname"
            namespaces:
            - test
```

```yml
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: "kubernetes.io/hostname"
              namespaces:
              - test
              labelSelector:
                matchExpressions:
                - key: 'app'
                  operator: In
                  values:
                   - "nginx-test2"
```


### tolerations と taint

tolerations と taint は常にペアで存在します。taint は「私は粗野で、タバコを吸い、浪費家ですが、それでも良い女性です」のようなものです。この種のtaint（汚点）は通常、一般的な男性（pod）を遠ざけますが、常にそれを許容（tolerations）できる誠実な人が何人かいます。

#### taint

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

masterノードはデフォルトでtaintが付いているため、デプロイしたコンテナがmasterノードで実行されない理由です。しかし、`taint`をカスタマイズする場合は注意してください！すべての`DaemonSet`とkube-systemコンポーネントには、対応する`tolerations`が必要です。そうしないと、そのノードはこの`tolerations`を持たないすべてのコンテナを追放し、ネットワークプラグインやkube-proxyも含まれます。結果は非常に深刻ですので、注意してください。

`taint`と`tolerations`はペアで対応して存在し、演算子も乱用できません。

#### tolerations

##### NoExecute


```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoExecute

NoExecuteは、許容条件を満たさないpodを即座に追放します。この操作は非常に危険です。まず、システムコンポーネントに対応するtolerationsが設定されていることを確認してください。

特に注意：`Exists`演算子は無効です。`Equal`を使用する必要があります。

##### NoSchedule

```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Exists"
          effect: "NoSchedule"
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoSchedule

ここにスケジュールしないようにしますが、実際にはまだその上でpodが実行される可能性があります。

`Exists`と`Equal`は自由に使用でき、それほど影響はありません。

同じキーが複数のeffectを同時に持つことができることは言及する価値があります。

```yml
Taints:             elasticsearch-exclusive=true:NoExecute
                    elasticsearch-exclusive=true:NoSchedule
```

その他の参考リンク：

1. [KubernetesのTaintとToleration（汚点と許容）](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [kubernetesのスケジューリングメカニズム](https://segmentfault.com/a/1190000012709117#articleHeader8)


## コンテナオーケストレーションのテクニック

### wait-for-it

k8sには現在、docker-composeの`depends_on`のような依存起動メカニズムがありません。[wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/)を使用してイメージのcommandを書き直すことをお勧めします。

### cmdで二重引用符を使用する方法

```yaml

               - "/bin/sh"
               - "-ec"
               - |
                  curl -X POST --connect-timeout 5 -H 'Content-Type: application/json' \
                  elasticsearch-logs:9200/logs,tracing,tracing-test/_delete_by_query?conflicts=proceed  \
                  -d '{"query":{"range":{"@timestamp":{"lt":"now-90d","format": "epoch_millis"}}}}'
```

## k8sのmaster-clusterアーキテクチャ

### master(CONTROL PLANE)

- etcd distributed persistent storage

    Kubernetesのすべてのクラスターデータのバッキングストアとして使用される一貫性と高可用性のキー値ストア。

- kube-apiserver

    Kubernetesコントロールプレーンのフロントエンド。
- kube-scheduler

    マスター上のコンポーネントで、割り当てられたノードがない新しく作成されたpodを監視し、それらが実行するノードを選択します。

- Controller Manager 
    - Node Controller
    
        ノードがダウンしたときに気づいて対応する責任があります。
    - Replication Controller
        
        システム内のすべてのレプリケーションコントローラーオブジェクトに対して、正しい数のpodを維持する責任があります。
    - Endpoints Controller

        Endpointsオブジェクトを埋めます（つまり、ServicesとPodsを結合します）。
    - Service Account & Token Controllers
        
        新しい名前空間のデフォルトアカウントとAPIアクセストークンを作成します。
- cloud-controller-manager(**alpha feature**)
    - Node Controller

        クラウドプロバイダーをチェックして、ノードが応答を停止した後にクラウドで削除されたかどうかを判断するため        
    - Route Controller

        基盤となるクラウドインフラストラクチャでルートを設定するため
    - Service Controller

        クラウドプロバイダーのロードバランサーを作成、更新、削除するため
    - Volume Controller
        
         ボリュームを作成、アタッチ、マウントし、クラウドプロバイダーと対話してボリュームをオーケストレートするため


参考リンク：
1. [Kubernetesコア原理（二）のController Manager](https://blog.csdn.net/huwh_/article/details/75675761)
1. [Kubernetesコンポーネント](https://kubernetes.io/docs/concepts/overview/components/)

### worker nodes

- Kubelet

    kubeletは各ノードで実行される主要な「ノードエージェント」です。
- Kubernetes Proxy

    kube-proxyは、ホスト上のネットワークルールを維持し、接続転送を実行することで、Kubernetesサービス抽象化を有効にします。

- Container Runtime (Docker, rkt, その他)

    コンテナランタイムは、コンテナの実行を担当するソフトウェアです。Kubernetesはいくつかのランタイムをサポートしています：Docker、rkt、runc、およびOCI runtime-spec実装。


## kubernetesのリソース


- spec

 提供する必要があるspecは、オブジェクトの希望する状態、つまりオブジェクトに持たせたい特性を記述します。 


- status

 statusはオブジェクトの実際の状態を記述し、Kubernetesシステムによって提供および更新されます。

![image](/img/in-post/learn-kubernetes/resource.png)

### pod

    podは、常に同じワーカーノード上で同じLinux名前空間内で一緒に実行される、1つ以上の密接に関連するコンテナのグループです。

    各podは、単一のアプリケーションを実行する独自のIP、ホスト名、プロセスなどを備えた別個の論理マシンのようなものです。

- liveness

kubeletはlivenessプローブを使用して、コンテナを再起動するタイミングを判断します。

- readiness

kubeletはreadinessプローブを使用して、コンテナがトラフィックの受け入れを開始する準備ができているタイミングを判断します。 

- 問題：podを削除する場合、endpointからpod ipを先に削除するか、podを先に削除するか

個人的な見解：

podを削除するk8sの内部プロセス
1. ユーザーがpodを削除
2. apiserverがpodを'dead'状態としてマーク
3. kubeletがpodを削除、デフォルトで30秒待機、まだ実行中の場合はpodを強制終了
   3.1 kubeletがpod内のコンテナのprestopの実行終了を待機
   3.2 sigterm信号を送信してコンテナを閉じる
   3.3 30秒の待機時間を超えると、sigkill信号を送信してpodを強制終了
4. nodecontroller内のendpoint controllerがendpointからこのpodを削除

3と4のステップは同時に進行します。一般的に、4は3より先に完了します。3と4の順序が不定のため、極端な場合、kubeletがすでにpodを削除したが、endpoint controllerがまだこのpodを持っている可能性があり、svcリクエストがすでに削除されたpodに転送され、svc呼び出しエラーが発生する可能性があります。

参考リンク https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods


参考リンク：
1. [コンテナでpodのデータを使用](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)
2. [Kubernetes PodでService Accountを使用してAPI Serverにアクセス](https://tonybai.com/2017/03/03/access-api-server-from-a-pod-through-serviceaccount/)
3. [podの優雅な停止](https://pracucci.com/graceful-shutdown-of-kubernetes-pods.html)



### Deployment
    Deploymentコントローラーは、PodとReplicaSetの宣言的更新を提供します。


- Rolling Update

```bash
    # pod内に1つのcontainerのみが含まれる場合にのみ適用
    kubectl rolling-update NAME [NEW_NAME] --image=IMAGE:TAG
```


[Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) は初期化環境を作成するために使用されるコンテナです。


参考：
1. [コンテナとPodにCPUリソースを割り当て](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
2. [Kubernetesデプロイメント戦略](https://container-solutions.com/kubernetes-deployment-strategies/)
3. [KubernetesでのCPU/メモリに基づく自動スケーリング—パートII](https://blog.powerupcloud.com/autoscaling-based-on-cpu-memory-in-kubernetes-part-ii-fe2e495bddd4)
4. [Podをノードに割り当て](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)

- リソースが不足している場合、deploymentは更新できません

0/6 nodes are available: 3 Insufficient memory, 3 node(s) had taints that the pod didn't tolerate.

### Replication Controller

    レプリケーションコントローラーは、podが常に稼働していることを保証するKubernetesリソースです。

    -> label

### ReplicaSet(レプリカセット)

    Replication Controller(レプリケーションコントローラー)の代替品

k8sコンポーネント|pod selector
--|--
Replication Controller|label
ReplicaSet|label、特定のラベルキーを含むpod


参考リンク：
1. [誤解している可能性のあるKubernetes Deploymentローリング更新メカニズムについて](https://blog.csdn.net/WaltonWang/article/details/77461697)

### DaemonSet(デーモンセット)

    DaemonSetは、ノードと同じ数のpodを作成し、それぞれを独自のノードにデプロイすることを確認します

- ヘルスチェック
1. liveness probe
2. HTTPベースのliveness probe
3. 

### StatefulSet(ステートフルレプリカセット)
    Podのセットのデプロイメントとスケーリングを管理し、これらのPodの順序と一意性について保証を提供します。

参考：
1. [StatefulSet](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)


### volumes

> volumesには2つのモードがあります
> 
> In-treeはKubernetes標準版の一部で、すでにKubernetesコードに書き込まれています。
> Out-of-treeはFlexvolumeインターフェースを通じて実装されます。Flexvolumeにより、ユーザーはKubernetes内で独自のドライバーを記述したり、独自のデータボリュームのサポートを追加したりできます。


1.  emptyDir – 一時データを保存するために使用されるシンプルな空のディレクトリ、
1.  hostPath – ワーカーノードのファイルシステムからディレクトリをpodにマウントするため、
1.  gitRepo – Gitリポジトリの内容をチェックアウトして初期化されたボリューム、
1.  nfs – podにマウントされたNFS共有、
1.  gcePersistentDisk (Google Compute Engine Persistent Disk), awsElasticBlockStore
(Amazon Web Services Elastic Block Store Volume), azureDisk (Microsoft Azure Disk
Volume) – クラウドプロバイダー固有のストレージをマウントするため、
1.  cinder, cephfs, iscsi, flocker, glusterfs, quobyte, rbd, flexVolume, vsphereVolume,
photonPersistentDisk, scaleIO – 他のタイプのネットワークストレージをマウントするため、
1.  configMap, secret, downwardAPI – 特定の
Kubernetesリソースとクラスター情報をpodに公開するために使用される特別なタイプのボリューム、
1.  persistentVolumeClaim – 事前または動的にプロビジョニングされた永続
ストレージを使用する方法（この章の最後のセクションで説明します）。

- Persistent Volume
永続ボリュームは、データストレージを対応する外部の信頼性の高いストレージに配置し、Pod/コンテナに提供して使用できるようにします。ホストに外部ストレージをマウントしてからコンテナに提供する必要はありません。その最大の特徴は、ライフサイクルがPodに関連付けられていないことです。Podが死んでも依然として存在し、Podが回復すると自動的に関連付けが復元されます。

- Persistent Volume Claim
PVまたはStorage Classリソースから特定のストレージサイズのスペースを取得することを宣言するために使用されます。

参考：  
1. [KubernetesのVolume紹介](https://jimmysong.io/posts/kubernetes-volumes-introduction)

### ConfigMap

ConfigMapは、設定ファイルを保存するために使用されるKubernetesリソースオブジェクトで、すべての設定内容がetcdに保存されます。

実践により、ConfigMapを変更しても、コンテナにすでに注入された環境変数情報を更新できないことが証明されています。

参考：
1. [Kubernetes ConfigMapホットアップデートテスト](https://jimmysong.io/posts/kubernetes-configmap-hot-update/)


### service

> Kubernetesサービスは、同じサービスを提供するpodのグループへの単一の一定のエントリーポイントを取得するために作成するリソースです。
    
> 各サービスには、サービスが存在する限り変更されないIPアドレスとポートがあります。 

> リソースは、ファイルに表示される順序で作成されます。したがって、サービスを最初に指定するのが最善です。これにより、スケジューラーが、Deploymentなどのコントローラーによって作成されるときに、サービスに関連付けられたpodを分散できることが保証されます。

- ClusterIP

クラスター内部アクセス用、外部から直接アクセス可能

typeが指定されていない場合、このタイプのサービスが作成されます

clusterIP: Noneは特別な[headless-service](https://kubernetes.io/zh/docs/concepts/services-networking/service/#headless-service)で、clusterIPがないことが特徴です

- NodePort

各ノードは同じポートを開くため、NodePortと呼ばれます。数量制限があります。外部から直接アクセス可能

- LoadBalancer

特定のクラウドプロバイダーのサービス。阿里云の場合、NodePortの上にロードバランサーのバックエンドサーバーを自動的にバインドするだけです

- ExternalName

参考：
1. [IPVSベースのクラスター内ロードバランシングの詳細](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)

### Horizontal Pod Autoscaler

    Horizontal Pod Autoscalerは、観測されたCPU使用率（または、カスタムメトリクスサポートにより、他のアプリケーション提供のメトリクス）に基づいて、レプリケーションコントローラー、デプロイメント、またはレプリカセット内のpodの数を自動的にスケーリングします。

メトリクスAPIとリソース内のrequestリソースと連携して調整します。

### Kubernetes Downward API

    podとその環境に関するメタデータを環境変数またはファイル（いわゆるdownwardAPIボリューム）を通じて渡すことができます

- environment variables
- downwardAPI volume


### Resource Quotas

名前空間に基づいてpodリソースを制限する手段


## ネットワークモデル

[Kubernetesネットワークモデル原理](https://mp.weixin.qq.com/s?__biz=MjM5OTcxMzE0MQ==&mid=2653371440&idx=1&sn=49f4e773bb8a58728752275faf891273&chksm=bce4dc2a8b93553c6b33d53c688ba30d61f88f0e065f50d82b1fb7e64daa4cc68394ffd8810b&mpshare=1&scene=23&srcid=1031BL2jtxx8DABRb46lNGPl%23rd)



参考コマンド：
3. [kubectlコマンドガイド](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. [KubernetesとDockerの基本概念と一般的なコマンドの比較](https://yq.aliyun.com/articles/385699?spm=a2c4e.11153959.0.0.7355d55acvAlBq)
6. [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
7. [K8Sリソース設定ガイド](https://kubernetes.io/docs/reference/)
8. [KubernetesでのContainer Runtime Interface (CRI)の紹介](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/)


参考電子書籍：
[Kubernetes Handbook——Kubernetes日本語ガイド/クラウドネイティブアプリケーションアーキテクチャ実践マニュアル](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)
