## インストールと設定

### プラグイン付きのカスタムESイメージ

```dockerfile
FROM elasticsearch:6.5.0
#または手動でダウンロードしてインストールすることもできます
# COPY elasticsearch-analysis-ik-6.5.0.zip /
# elasticsearch-plugin install --batch file:///elasticsearch-analysis-ik-6.5.0.zip
    # IK Analyzerは、Java言語で開発されたオープンソースの中国語分かち書きツールキットです。オープンソースコミュニティで中国語分かち書きを処理する非常に人気のあるプラグインです。
RUN elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v6.5.0/elasticsearch-analysis-ik-6.5.0.zip && \
    # ピンイン分かち書き器
    elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-pinyin/releases/download/v6.5.0/elasticsearch-analysis-pinyin-6.5.0.zip && \    
    # Smart Chinese Analysis Plugin
    elasticsearch-plugin install analysis-icu && \
    # 日本語分かち書き器
    elasticsearch-plugin install analysis-kuromoji && \
    # 音声分析
    elasticsearch-plugin install analysis-phonetic && \
    # 文字ハッシュの計算
    elasticsearch-plugin install  mapper-murmur3 && \
    # _sourceでsizeフィールドを提供
    elasticsearch-plugin install mapper-size
```

### オーケストレーションファイル

- RBAC関連コンテンツ

```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: elasticsearch-admin
  namespace: default
  labels:
    app: elasticsearch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: elasticsearch
  labels:
    app: elasticsearch
subjects:
- kind: ServiceAccount
  name: elasticsearch-admin
  namespace: default
  apiGroup: ""
roleRef:
  kind: ClusterRole
  name: elasticsearch
  apiGroup: ""
```

- メインプログラム


ストレージはhostpathを使用しています。ホスト上でディレクトリを先に作成し、適切な権限を付与する必要があります。そうしないとエラーになります。

```bash
cd /root/kubernetes/$(namespace)/elasticsearch/data
mkdir -p $(pwd)
sudo chmod 775  $(pwd) -R
chown 1000:0  $(pwd) -R
```

```
# kubectl get po -l app=myelasticsearch -o wide  -n default
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: myelasticsearch
  namespace: default
  labels:
    app: myelasticsearch    
    elasticsearch-role: all
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: elasticsearch-master
  replicas: 2
  selector:
    matchLabels:
      app: myelasticsearch
      elasticsearch-role: all
  template:
    metadata:
      labels:
        app: myelasticsearch                     
        elasticsearch-role: all 
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:              
              - key: 'app'
                operator: In
                values:
                - myelasticsearch
              - key: 'elasticsearch-role'
                operator: In
                values:
                - all                 
            topologyKey: "kubernetes.io/hostname"
            namespaces: 
            - default    
      serviceAccountName: elasticsearch-admin    
      terminationGracePeriodSeconds: 180
      # Elasticsearchにはvm.max_map_countが少なくとも262144である必要があります。
      # OSがすでにこの数値をより高い値に設定している場合は、このinitコンテナを削除しても問題ありません。
      initContainers:
      - image: alpine:3.6
        command: ["/sbin/sysctl", "-w", "vm.max_map_count=262144"]
        name: elasticsearch-init
        securityContext:
          privileged: true      
      imagePullSecrets:
        - name: vpc-shenzhen      
      containers:
      - image: elasticsearch:6.5.0-plugin-in-remote-ik
        name: elasticsearch
        resources:
          # 初期化時にCPUがより必要なので、バースト可能クラス
          limits:
            # cpu: 2
            memory: 4Gi
          requests:
            # cpu: 1
            memory: 1Gi
        ports:
        - name: restful
          containerPort: 9200          
          protocol: TCP
        - name: discovery
          containerPort: 9300          
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          initialDelaySeconds: 2
          periodSeconds: 10
          successThreshold: 1
          tcpSocket:
            port: 9200
          timeoutSeconds: 1     
        # livenessProbe:
        #   failureThreshold: 3
        #   initialDelaySeconds: 7
        #   periodSeconds: 10
        #   successThreshold: 1
        #   tcpSocket:
        #     port: 9200
        #   timeoutSeconds: 1           
        volumeMounts:
        - name: host
          mountPath: /usr/share/elasticsearch/data
        env:
        - name: "NAMESPACE"
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        # - name: "ES_JAVA_OPTS"
        #   value: "-Xms256m -Xmx256m"              
        - name: "cluster.name"
          value: "myelasticsearch"
        - name: "bootstrap.memory_lock"
          value: "true"
        - name: "discovery.zen.ping.unicast.hosts"
          value: "myelasticsearch"
        - name: "discovery.zen.minimum_master_nodes"
          value: "2"
        - name: "discovery.zen.ping_timeout"
          value: "5s"
          # テスト用なので、master、data、ingestがすべて混在しています
        - name: "node.master"
          value: "true"
        - name: "node.data"
          value: "true"
        - name: "node.ingest"
          value: "true"
        - name: xpack.monitoring.collection.enabled
          value: "true" 
        - name: node.name
          valueFrom: 
            fieldRef:
              fieldPath: metadata.name 
              # fieldPath: spec.nodeName 
        securityContext: 
          privileged: true
      volumes:
      - name: host
        hostPath:
          path: /root/kubernetes/default/myelasticsearch/data
          type: DirectoryOrCreate
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: myelasticsearch
    elasticsearch-role: all
  name: myelasticsearch
  namespace: default
spec:
  ports:
    - name: discovery
      port: 9300
      targetPort: discovery
    - name: restful
      port: 9200
      protocol: TCP
      targetPort: restful
  selector:
    app: myelasticsearch
    elasticsearch-role: all
  type: NodePort
```

このオーケストレーションの要点は、ノード`affinity`を使用して、各ノードが最大1つのコンテナを実行するようにし、高可用性を確保することです。

ノードの役割をさらに抽出する場合は、相互検出用のサービスを抽出できます。

```yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    app: elasticsearch
  name: elasticsearch-discovery
  namespace: default
spec:
  ports:
    - port: 9300
      targetPort: discovery
  selector:
    app: myelasticsearch
```


1. [KubernetesでElasticsearchクラスターをデプロイ](https://blog.csdn.net/chenleiking/article/details/79453460)
1. [重要な設定の変更](https://www.elastic.co/guide/cn/elasticsearch/guide/current/important-configuration-changes.html)
1. [DockerでElasticsearchをインストール](https://www.elastic.co/guide/en/elasticsearch/reference/6.x/docker.html)
1. [Elasticsearchを学ぶ4：3ノードElasticsearchクラスターの設定（マスターノードとデータノードを区別しない）](http://ethancai.github.io/2016/08/06/configure-smallest-elasticsearch-cluster/)
1. [Elasticsearchクラスターのデプロイメントについて](https://blog.csdn.net/zwgdft/article/details/54585644)
1. [公式Dockerイメージビルドプロジェクト](https://github.com/elastic/elasticsearch-docker/tree/master/templates)
1. [Elasticsearchモジュール機能-自動検出（Discovery）](https://blog.csdn.net/changong28/article/details/38377863)
1. [サブスクリプション料金](https://www.elastic.co/subscriptions)
2. [フェイルオーバー](https://es.xiaoleilu.com/020_Distributed_Cluster/20_Add_failover.html)
3. [ノード設定](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html#coordinating-node)
4. [Elasticsearch 5.Xクラスターのマルチノード役割設定の詳細説明](https://blog.csdn.net/laoyang360/article/details/78290484)
1. [elasticsearch-cloud-kubernetes](https://github.com/fabric8io/elasticsearch-cloud-kubernetes)
1. [Elasticsearchヒープメモリを理解する](https://blog.csdn.net/laoyang360/article/details/79998974)

### プラグインのインストール

[elasticsearch-docker-plugin-management](https://www.elastic.co/blog/elasticsearch-docker-plugin-management)

GET /_cat/plugins?v&s=component&h=name,component,version,description


## ストレステスト

```
esrally configure
esrally list tracks
esrally --pipeline=benchmark-only --target-hosts=127.0.0.1:9200 --track=geonames
```

```
datastore.type = elasticsearch
datastore.host = 127.0.0.1
datastore.port = 9200
datastore.secure = False
```


Elasticsearch公式が提供するベンチマークスクリプトrallyを使用


## ElasticSearchクラスターのメンテナンス


更新する際は、必ずグレースケール更新を使用し、最大のシーケンス番号のイメージから開始してください。そうしないと、シャードが失われた場合、信じてください、大変なことになります。

```bash
kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":0}}}}' \
-n test

kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":1}}}}' \
-n test

kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":2}}}}' \
-n test
```
