OpenShiftはRed Hatが作成したKubernetesディストリビューションで、Rancherの競合製品に相当します。Red HatはKubernetesの上に、セキュリティメカニズム、認証、ネットワーク監視、ログ可視化などの機能を導入し、クラウドネイティブ分野で一席を得ようとしています。

## SCC（Security Context Constraints）

最近、OpenShiftでTraefikをデプロイする際に問題が発生しました。

```
Error creating: pods "traefik-ingress-controller-68cc888857-" is forbidden: unable to validate against any security context constraint: [provider restricted: .spec.securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.capabilities.add: Invalid value: "NET_BIND_SERVICE": capability may not be added 
spec.containers[0].securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 80: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 443: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 8080: Host ports are not allowed to be used]
```

エラーメッセージに基づき、問題はSCCにあることがわかりました。公式の説明は以下のとおりです：

> OpenShiftのセキュリティコンテキスト制約（Security Context Constraints）は、RBACリソースがユーザーアクセスを制御する方法と類似しています。管理者はセキュリティコンテキスト制約（SCC）を使用してPodの権限を制御できます。SCCを使用して、Podが実行時にシステムによって受け入れられるために満たす必要がある特定の条件を定義できます。

簡単に言えば、SCCはRBACの上にユーザーの行動にいくつかの制限を追加します。これには、上記で言及したhostNetwork、SecurityContextなどが含まれます。OpenShiftが[PodSecurityPolicy](https://kubernetes.io/zh/docs/concepts/policy/pod-security-policy/)の上にレイヤーをラップすることに相当します。

デフォルトでは、OpenShiftには以下の8種類のSCCが含まれています：

1. anyuid
1. hostaccess
1. hostmount-anyuid
1. hostnetwork
1. node-exporter
1. nonroot
1. privileged
1. restricted

作成されたpodリソースはデフォルトで**Restricted**ポリシーに属します。管理者ユーザーは独自のSCCを作成し、独自のserviceaccountに割り当てることもできます：

```yaml
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  annotations:
    kubernetes.io/description: traefikee-scc provides all features of the restricted SCC
      but allows users to run with any UID and any GID.
  name: traefikee-scc
priority: 10

allowHostDirVolumePlugin: true
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegeEscalation: true
allowPrivilegedContainer: false
allowedCapabilities:
- NET_BIND_SERVICE
defaultAddCapabilities: null
fsGroup:
  type: RunAsAny
groups:
- system:authenticated
readOnlyRootFilesystem: false
requiredDropCapabilities:
- MKNOD
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: RunAsAny
users: []
volumes:
- configMap
- downwardAPI
- emptyDir
- persistentVolumeClaim
- projected
- secret

```

```bash
oc create -f new-sa.yaml
oc create -f new-scc.yaml
oadm policy add-scc-to-user new-scc system:serviceaccount:monitor:new-sa
```

したがって、作成されたリソースが準備できていない場合、`kubectl describe pod`を使用してSCCの制限に違反しているかどうかを確認できます。

元のトピックに戻ると、Traefikをデプロイしたかった理由は、イングレス制御プレーンを作成することでした。しかし、OpenShiftプラットフォームでは、実際には独自の実装があり、これはrouteと呼ばれます。

## route関連の問題

### 同じドメイン名はデフォルトで1つの名前空間のみを許可

デフォルトでは、同じドメイン名での名前空間間のクロスは禁止されています。これをサポートするには、この機能を有効にする必要があります。そうしないと、routeを作成すると「a route in another namespace holds XX」が表示されます。同じドメイン名での名前空間間routeをサポートするには、OpenShiftの組み込みコントローラー設定を変更する必要があります。

```
oc -n openshift-ingress-operator patch ingresscontroller/default --patch '{"spec":{"routeAdmission":{"namespaceOwnership":"InterNamespaceAllowed"}}}' --type=merge
```

### ワイルドカードドメイン解決

ワイルドカードドメイン解決のrouteを作成する場合、`wildcard routes are not allowed`というプロンプトが表示されます。

OpenShift 3はROUTER_ALLOW_WILDCARD_ROUTES環境変数を設定することで有効にできます。OpenShift 4はサポートしておらず、この問題には解決策がありません。参考：https://github.com/openshift/enhancements/blob/master/enhancements/ingress/wildcard-admission-policy.md

### ingress変換

他のプラットフォームで使用されるingressに適応するため、OpenShiftは互換性処理を行っています。ingressを作成すると、対応するrouteが作成されます。ingressにTLSが含まれている場合、OpenShiftは対応するrouteに変換します。しかし、OpenShiftのrouteでは、TLS公開鍵と秘密鍵はシークレットではなく、routeに直接保存されます。

### マルチパス解決

元のingressが同じドメイン名に対してマルチパスプレフィックス解決を持っている場合。例えば、ingress aがドメインaの/aパスをリッスンし、ingress bがドメインaの/bパスをリッスンする場合、TraefikのURL書き換えルールと同様に、アノテーションに書き換えアノテーションも追加する必要があります。OpenShiftはこのアノテーションを変換されたrouteに追加します。

```
annotations:
    haproxy.router.openshift.io/rewrite-target: /
```

## ネットワークポリシー

アプリケーションが名前空間間のサービス/podにアクセスできない場合、具体的には、リクエストが長時間応答がないことが現れます。これは、この名前空間で分離が有効になっているためで、ocクライアントを使用して権限を付与する必要があります。

```
oc adm pod-network make-projects-global <project1> <project2>
```

逆に、ユーザーが名前空間（OpenShiftではprojectとも呼ばれる）を名前空間内でのみアクセス可能にしたい場合、次のように操作できます：

```
oc adm pod-network isolate-projects <project1> <project2>
```

## CRIの問題

現在知られているコンテナランタイムには、以下の3つが含まれます：

1. containerd
1. CRI-O
1. Docker

OpenShiftはCRI-Oを使用します。デプロイされたアプリケーションがcontainerd/dockerに強く依存している場合、デプロイメントは失敗します。例えば、OpenKruiseプロジェクトはOpenShiftをサポートしていません。

## 参考リンク

[1]
https://ithelp.ithome.com.tw/articles/10243781

[2]
https://kubernetes.io/docs/concepts/policy/pod-security-policy/

[3]
https://cloud.tencent.com/developer/article/1603597

[4]
https://docs.openshift.com/container-platform/4.8/rest_api/network_apis/route-route-openshift-io-v1.html

[5]
https://docs.openshift.com/container-platform/3.5/admin_guide/managing_networking.html
