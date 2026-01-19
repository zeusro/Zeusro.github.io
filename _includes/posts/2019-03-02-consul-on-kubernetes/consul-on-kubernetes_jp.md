注意：`/consul/data`のストレージはコメントアウトされています。必要に応じて対応するボリュームを設定してください。

主な考え方は、まず3台のサーバーを起動し、`consul-server`を通じて自動的にノードに参加させることです。アンチアフィニティを使用して、各ノードで1つのconsul-serverのみが許可されるようにすることで、真の高可用性を実現します。

次に`consul-client`を起動し、`consul-server`を通じて自動的にノードに参加させます。

## server

```yml
apiVersion: v1
kind: Service
metadata:
  namespace: $(namespace)
  name: consul-server
  labels:
    name: consul-server
spec:
  ports:
    - name: http
      port: 8500
    - name: serflan-tcp
      protocol: "TCP"
      port: 8301
    - name: serfwan-tcp
      protocol: "TCP"
      port: 8302
    - name: server
      port: 8300
    - name: consuldns
      port: 8600
  selector:
    app: consul
    consul-role: server
---
# kgpo -l app=consul
# kgpo -l app=consul  -o  wide -w
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: consul-server
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: consul-server
  replicas: 3
  template:
    metadata:
      labels:
        app: consul
        consul-role: server
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: "kubernetes.io/hostname"
              namespaces: 
              - $(namespace)
              labelSelector:
                matchExpressions:
                - key: 'consul-role'
                  operator: In
                  values: 
                   - "server"
      terminationGracePeriodSeconds: 10
      securityContext:
        fsGroup: 1000
      containers:
        - name: consul
          image: "consul:1.4.2"
          imagePullPolicy: Always
          resources:
            requests:
              memory: 500Mi
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
          args:
            - "agent"
            - "-advertise=$(POD_IP)"
            - "-bind=0.0.0.0"
            - "-bootstrap-expect=3"
            - "-retry-join=consul-server"
            - "-client=0.0.0.0"
            - "-datacenter=dc1"
            - "-data-dir=/consul/data"
            - "-domain=cluster.local"
            - "-server"
            - "-ui"
            - "-disable-host-node-id"
            - '-recursor=114.114.114.114'
        #   volumeMounts:
        #     - name: data
        #       mountPath: /consul/data
          lifecycle:
            preStop:
              exec:
                command:
                - /bin/sh
                - -c
                - consul leave
          ports:
            - containerPort: 8500
              name: ui-port
            - containerPort: 8400
              name: alt-port
            - containerPort: 53
              name: udp-port
            - containerPort: 8301
              name: serflan
            - containerPort: 8302
              name: serfwan
            - containerPort: 8600
              name: consuldns
            - containerPort: 8300
              name: server
#   volumeClaimTemplates:
#   - metadata:
#       name: data
```

## client

```yml

---    
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: consul-client
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: consul-client
  replicas: 10
  template:
    metadata:
      labels:
        app: consul
        consul-role: client
    spec:
      terminationGracePeriodSeconds: 10
      securityContext:
        fsGroup: 1000
      containers:
        - name: consul
          image: "consul:1.4.2"
          imagePullPolicy: Always
          resources:
            requests:
              memory: 500Mi
          env:
            - name: podname
              valueFrom: 
                fieldRef:
                  fieldPath: metadata.name
          args:
          - agent
          - -ui
          - -retry-join=consul-server
          - -node=$(podname)
          - -bind=0.0.0.0
          - -client=0.0.0.0
          - '-recursor=114.114.114.114'
        #   volumeMounts:
        #     - name: data
        #       mountPath: /consul/data
          lifecycle:
            preStop:
              exec:
                command:
                - /bin/sh
                - -c
                - consul leave
          readinessProbe:
            # NOTE(mitchellh): when our HTTP status endpoints support the
            # proper status codes, we should switch to that. This is temporary.
            exec:
              command:
                - "/bin/sh"
                - "-ec"
                - |
                  curl http://127.0.0.1:8500/v1/status/leader 2>/dev/null | \
                  grep -E '".+"'
          ports:
            - containerPort: 8301
              name: serflan
            - containerPort: 8500
              name: ui-port
            - containerPort: 8600
              name: consuldns
---
apiVersion: v1
kind: Service
metadata:
  namespace: $(namespace)
  name: consul-client
  labels:
    name: consul-client
    consul-role: consul-client
spec:
  ports:
    - name: serflan-tcp
      protocol: "TCP"
      port: 8301
    - name: http
      port: 8500
    - name: consuldns
      port: 8600
  selector:
    app: consul
    consul-role: client
```

## UI

`-ui`パラメータを持つノードはすべてUIとして機能できます。ポート8500を使用することを覚えておいてください。例は書きません。

## 不足点

再起動メカニズムがうまくいっていませんでした。サーバーで`livenessProbe`を設定し、自身が離脱したときに自動的に再起動する必要があります。ただし、これは大きな問題ではありません。consul自体は非常に安定しており、問題が発生することはほとんどありません。

主に`consul-client`です。`consul-client`がserverノードから離脱したことを検出した後、直接再起動して再参加する必要があります。しかし、これは行いませんでした。

## その他の問題

### 暗号化通信

consulはノード間の暗号化通信もサポートしていますが、以前クライアントを設定したときに失敗しました。これは非常に残念です。暗号化通信には追加の設定が必要で、面倒なので、暗号化なしの通信に変更しました。

### 登録解除の失敗

この問題は何度も発生しました。一部のサービスは手動で3回登録解除する必要があります（serverノードがあるためかもしれません）。一部の不正なサービスは、何回試しても登録解除に失敗し、非常に残念です。

### consulが非常に遅い

consulのアーキテクチャでは、serverはclientから分離する必要があります。サービスをserverに直接登録し、serverがサービスヘルスチェックの役割を担うと、consul全体が非常に遅くなります。サービスを登録解除して負荷を減らそうとしましたが、それでも失敗しました。最終的に、設定を移行し、consulクラスターを再構築しました。これは非常に苦痛でした。

## よく使うAPI

```
# サービスを登録解除
put /v1/agent/service/deregister/<serviceid>
# 設定を取得
get /v1/kv/goms/config/<config>
# サービスリストを取得
get /v1/agent/services
# ノードステータスを照会
get /v1/status/leader


```

## 参考リンク

https://github.com/hashicorp/consul-helm
