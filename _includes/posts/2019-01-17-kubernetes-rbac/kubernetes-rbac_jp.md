`kubernetes`内部のコンテナ通信はすべて`api-server`を介して行う必要があります。外部から`kubectl`でクラスターにアクセスして管理することも、本質的には`api-server`へのアクセスです。`api-server`はクラスター全体の指揮中枢です。

しかし、世の中にいれば、傷つかないわけにはいきません。クラスター内外のトラブルメーカーを防ぐにはどうすればよいでしょうか？`RBAC`（ロールベースアクセス制御）が生まれました。

`ServiceAccount`、`Role`、`RoleBinding`、`ClusterRole`、`ClusterRoleBinding`の関係を一言でまとめると：

**`ClusterRoleBinding`、`RoleBinding`は任命であり、認可されたオブジェクト（ユーザー、グループ、またはサービスアカウント）がどのような権限（Role、ClusterRole）を持つことができるかを認可します。**

## ServiceAccount

```
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ServiceAccount","metadata":{"annotations":{},"name":"flannel","namespace":"kube-system"}}
  creationTimestamp: 2018-07-24T06:44:45Z
  name: flannel
  namespace: kube-system
  resourceVersion: "382"
  selfLink: /api/v1/namespaces/kube-system/serviceaccounts/flannel
  uid: 0d4064e6-8f0d-11e8-b4b4-00163e08cd06
secrets:
- name: flannel-token-f7d4d
```

上記で述べたように、`ServiceAccount`は単なる名前であり、それ自体には権限の説明がありません。

## service-account-token

service-account-tokenのAPIタイプは`kubernetes.io/service-account-token`です

`ServiceAccount`が変更されると、Token Controller（controller-managerの一部）
が`service-account-token`を自動的に維持し、実際の状況に応じて追加/変更/削除します。`service-account-token`の本質的なタイプは`secret`です。したがって、`service-account-token`は`ServiceAccount`と1対1で、生まれて死ぬまで一緒です。

定義されたリソースが`ServiceAccount`を指定している場合、`Admission Controllers`（api-serverの一部）は、この`ServiceAccount`に対応する`service-account-token`をファイルとしてコンテナ内部の`/var/run/secrets/kubernetes.io/serviceaccount`ディレクトリにマウントします。

このディレクトリには通常3つのファイルがあります：

1. ca.crt	
1. namespace  
1. token

参考リンク：

1. [Service Accountsの管理](https://kubernetes.io/zh/docs/admin/service-accounts-admin/)
1. [PodsのService Accountsを設定](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

## Role

```yml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # ""はコアAPIグループを示します
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

Roleは、単一の名前空間内のリソースへのアクセス権限を付与するためにのみ使用できます。

具体的なURLを定義します。

## RoleBinding

```yml
# このロールバインディングにより、"jane"は"default"名前空間でpodsを読み取ることができます。
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

RoleBindingは、特定の名前空間内での認可に適用されます。RoleBindingは、ロールで定義された権限をユーザーまたはユーザーグループに付与できます。

## ClusterRole 

```yml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  # ClusterRolesは名前空間に属さないため、"namespace"は省略されています
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```  

1. クラスターレベルのリソース制御（例：nodeアクセス権限）
1. 非リソース型エンドポイント（例：/healthzアクセス）
1. すべての名前空間リソース制御（例：pods）

## ClusterRoleBinding

```yml
# このクラスターロールバインディングにより、"manager"グループの誰でも任意の名前空間でシークレットを読み取ることができます。
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: manager
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus-operator
subjects:
- kind: ServiceAccount
  name: prometheus-operator
  namespace: monitoring
```

ClusterRoleBindingは、クラスター全体での認可に適用されます。

最後に、表で整理します：

| リソースタイプ | 説明 |
|---|---|
| ServiceAccount | 単なる名前 |
| service-account-token | ServiceAccountのアイデンティティシンボル | 
| Role | 単一の名前空間内のリソースへのアクセス権限を付与 | 
| RoleBinding | 認可されたオブジェクトとRoleを付与 | 
| ClusterRole | Roleのスーパーセットと見なすことができ、クラスターの観点から行う認可 | 
| ClusterRoleBinding | 認可されたオブジェクトとClusterRoleを付与 | 

`kubernetes`RBACを理解する最も簡単な方法は、kube-system内部に入り、さまざまなクラスターリソースがどのように定義されているかを確認することです。

参考リンク：

1. [Kubernetes TLS bootstrappingの話](https://mritd.me/2018/01/07/kubernetes-tls-bootstrapping-note/)
1. [RBACを使用してkubectl権限を制御](https://mritd.me/2018/03/20/use-rbac-to-control-kubectl-permissions/)
2. [Kubernetes RBAC](https://mritd.me/2017/07/17/kubernetes-rbac-chinese-translation/)
1. [RBAC認証の使用](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding)
1. [Bootstrap Tokensでの認証](https://kubernetes.io/docs/reference/access-authn-authz/bootstrap-tokens/)
