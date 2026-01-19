## 環境：

1. kubernetesバージョン：阿里云v1.11.5
1. ノードシステム：CentOS Linux 7 (Core)
1. ノードコンテナバージョン：docker://17.6.2

## 概念の紹介

### X-Forwarded-For

```
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

### remote_addr

remote_addrはクライアントのIPを表しますが、その値はクライアントによって提供されるのではなく、サーバーがクライアントのIPに基づいて指定します。ブラウザがWebサイトにアクセスする場合、中間にプロキシがないと仮定すると、WebサイトのWebサーバー（Nginx、Apacheなど）はremote_addrをマシンのIPに設定します。プロキシを使用する場合、ブラウザはまずプロキシにアクセスし、次にプロキシがWebサイトに転送します。この場合、Webサーバーはremote_addrをそのプロキシマシンのIPに設定します。

## 内部リクエスト（PodからPodへのリクエスト）

```
podA-->podB
```

この時、`getRemoteAddr`のみがIPを取得でき、その他のヘッダーはすべて空です。podBが取得するclientIPはpodAのpodIP（仮想IP）です。

client_addressは、クライアントpodとサーバーポッドが同じノードにあるか、異なるノードにあるかに関わらず、常にクライアントpodのIPアドレスです。


## 外部リクエスト

### Nodeport svc

```
client-->svc-->pod
```

#### externalTrafficPolicy: Cluster

svc.specで`externalTrafficPolicy: Cluster`を設定すると、すべてのノードが`kube-proxy`を起動し、外部トラフィックが1回多く転送される可能性があります。

```
          client
             \ ^
              \ \
               v \
   node 1 <--- node 2
    | ^   SNAT
    | |   --->
    v |
 endpoint
```

この時、トラフィックはnode2の転送を通過します。appが取得するclientIPは不定で、`node 2`のIPである可能性もあれば、クライアントのIPである可能性もあります。

#### externalTrafficPolicy: Local

svc.specで`externalTrafficPolicy: Local`を設定すると、podを実行しているノードで`kube-proxy`が起動し、外部トラフィックがノードに直接到達します。

```
        client
       ^ /   \
      / /     \
     / v       X
   node 1     node 2
    ^ |
    | |
    | v
 endpoint
```

この時、podを実行しているノードのみが対応するproxyを持ち、中間業者（node 2）の利益を回避します。

`clientIP`は`remote_addr`です。


### LoadBalancer svc

svc.specで`externalTrafficPolicy: Local`を設定します。

```
                      client
                        |
                      lb VIP
                     / ^
                    v /
health check --->   node 1   node 2 <--- health check
        200  <---   ^ |             ---> 500
                    | V
                 endpoint
```

![image](/img/in-post/get-client-ip-in-kubernetes/15450327712333_zh-CN.png)

SLBがHTTPをリッスン：`X-Forwarded-For`を取得します（SLBからクライアントIPを取得）。

SLBがTCPをリッスン：`remote_addr`を取得します。

`externalTrafficPolicy: Cluster`の場合は言うまでもなく、意味がありません。

### ingress

```
client-->slb-->ingress svc-->ingress pod-->app svc-->pod
```

まず、`ingress`のsvcタイプを`Nodeport`/`LoadBalancer`に設定し、`externalTrafficPolicy: Local`にする必要があります。

app svcタイプは`ClusterIP`/`NodePort`/`LoadBalancer`のいずれでも問題ありません。

この時、`X-Forwarded-For`の値が`clientIP`になります。

`remote_addr`は`ingress pod`の仮想IPです。

## 参考リンク：

1. [source-ip](https://kubernetes.io/docs/tutorials/services/source-ip/)
1. [HTTPリクエストヘッダー内のX-Forwarded-For](https://imququ.com/post/x-forwarded-for-header-in-http.html)
1. [クライアントの実際のIPを取得する方法](https://help.aliyun.com/document_detail/54007.html?spm=5176.11065259.1996646101.searchclickresult.610a1293EtcJUu)
1. [ソースアドレス監査：KubernetesサービスのSNATを追跡](https://ieevee.com/tech/2017/09/18/k8s-svc-src.html)
1. [kubernetsのserviceコンポーネントのVirtual IPについて](https://ieevee.com/tech/2017/01/20/k8s-service.html)
