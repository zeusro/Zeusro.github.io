api-serverへの接続は、一般的に3つのケースに分かれます：

1. Kubernetes Nodeがkubectl proxyを介して中継接続
2. 認証検証を介して直接接続（kubectlとさまざまなクライアントがこのケース）
  - `kubectl`は`~/.kube/config`を認証情報として読み込み、リモートの`api-server`のRESTful APIをリクエストします。`api-server`は、送信された認証情報に基づいて権限があるかどうかを判断し、権限がある場合は対応する結果を返します。
3. コンテナが`ServiceAccount`を介して接続


## コンテナがapi-serverをリクエスト

![img](https://d33wubrfki0l68.cloudfront.net/673dbafd771491a080c02c6de3fdd41b09623c90/50100/images/docs/admin/access-control-overview.svg)

`Kubernetes`のこのRBACメカニズムは[以前の記事](https://www.zeusro.com/2019/01/17/kubernetes-rbac/)で言及されました。ここでは説明しません。

便宜上、`kube-system`の`admin`を直接例として使用します。

```yaml
# {% raw %}

apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ServiceAccount","metadata":{"annotations":{},"name":"admin","namespace":"kube-system"}}
  name: admin
  namespace: kube-system
  resourceVersion: "383"
secrets:
- name: admin-token-wggwk
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: cluster-admin
  resourceVersion: "51"
rules:
- apiGroups:
  - '*'
  resources:
  - '*'
  verbs:
  - '*'
- nonResourceURLs:
  - '*'
  verbs:
  - '*'
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  annotations:
    rbac.authorization.kubernetes.io/autoupdate: "true"
  labels:
    kubernetes.io/bootstrapping: rbac-defaults
  name: cluster-admin
  resourceVersion: "102"
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: system:masters

# {% endraw %}
```

簡単に言えば、コンテナは`ServiceAccount`とRBACメカニズムを組み合わせて、`api-server`にアクセスする権限を持ちます。

もともと`kube-system`の下にnginxコンテナを作成してアクセスしようとしましたが、curlが失敗しました。後でcentosイメージを見つけてテストしました。皆さんは`serviceAccount`を適切に設定するだけです。


    metadata.spec.template.spec.serviceAccount: admin



### deployがsa（`ServiceAccount`）を宣言する本質

deployでsaを宣言する本質は、saの対応するsecretを`/var/run/secrets/kubernetes.io/serviceaccount`ディレクトリにマウントすることです。

saを宣言しない場合、`default`がsaとしてマウントされます。

```bash
# k edit secret admin-token-wggwk
# editで読み込まれたsecretの内容はすべてbase64形式で表示されます
# base64(kube-system):a3ViZS1zeXN0ZW0=
apiVersion: v1
data:
  ca.crt: *******
  namespace: a3ViZS1zeXN0ZW0=
  token: *******
kind: Secret
metadata:
  annotations:
    kubernetes.io/service-account.name: admin
    kubernetes.io/service-account.uid: 9911ff2a-8c46-4179-80ac-727f48012229 
  name: admin-token-wggwk
  namespace: kube-system
  resourceVersion: "378"
type: kubernetes.io/service-account-token
```

したがって、deployから派生したすべてのpod内のコンテナには、
`/var/run/secrets/kubernetes.io/serviceaccount`ディレクトリの下にこの3つのファイルがあります：

```bash
/run/secrets/kubernetes.io/serviceaccount # ls -l
total 0
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

これらの3つのファイルはすべてシンボリックリンクで、最終的に下の日付付きフォルダーを指していますが、気にする必要はありません。

```bash
/run/secrets/kubernetes.io/serviceaccount # ls -a -l
total 4
drwxrwxrwt    3 root     root           140 Apr 19 06:46 .
drwxr-xr-x    3 root     root          4096 Apr 19 06:46 ..
drwxr-xr-x    2 root     root           100 Apr 19 06:46 ..2019_04_19_06_46_10.877180351
lrwxrwxrwx    1 root     root            31 Apr 19 06:46 ..data -> ..2019_04_19_06_46_10.877180351
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

## curlでapi-serverをリクエスト

クラスターが準備できたら、`default`名前空間に`kubernetes`というsvcがあります。コンテナはca.crtを証明書として使用してリクエストできます。nsをまたぐアクセス方法は`https://kubernetes.default.svc:443`です。

### 前提条件

```bash
kubectl exec -it $po sh -n kube-system
cd /var/run/secrets/kubernetes.io/serviceaccount
TOKEN=$(cat token)
APISERVER=https://kubernetes.default.svc:443

```

### まず悪役を装って`api-server`にアクセス

```bash
sh-4.2# curl -voa  -s  $APISERVER/version
* About to connect() to kubernetes.default.svc port 443 (#0)
*   Trying 172.30.0.1...
* Connected to kubernetes.default.svc (172.30.0.1) port 443 (#0)
* Initializing NSS with certpath: sql:/etc/pki/nssdb
*   CAfile: /etc/pki/tls/certs/ca-bundle.crt
  CApath: none
* Server certificate:
* 	subject: CN=kube-apiserver
* 	start date: Jul 24 06:31:00 2018 GMT
* 	expire date: Jul 24 06:44:02 2019 GMT
* 	common name: kube-apiserver
* 	issuer: CN=cc95defe1ffd6401d8ede6d4efb0f0f7c,OU=default,O=cc95defe1ffd6401d8ede6d4efb0f0f7c
* NSS error -8179 (SEC_ERROR_UNKNOWN_ISSUER)
* Peer's Certificate issuer is not recognized.
* Closing connection 0
```

見てのとおり、デフォルトの`/etc/pki/tls/certs/ca-bundle.crt`公開鍵を使用してアクセスすると、証明書が一致しないと直接報告されます（Peer's Certificate issuer is not recognized.）。

### 証明書を持って`api-server`にアクセス

```bash
curl -s $APISERVER/version  \
--header "Authorization: Bearer $TOKEN" \
--cacert ca.crt 
{
  "major": "1",
  "minor": "11",
  "gitVersion": "v1.11.5",
  "gitCommit": "753b2dbc622f5cc417845f0ff8a77f539a4213ea",
  "gitTreeState": "clean",
  "buildDate": "2018-11-26T14:31:35Z",
  "goVersion": "go1.10.3",
  "compiler": "gc",
  "platform": "linux/amd64"
}
```

このように、アプローチは明確です。curlする際に、正しい証明書（ca.crt）とリクエストヘッダーを持参します。

## curlを使用して一般的なAPIにアクセス

ここで`selfLink`という概念を紹介する必要があります。`kubernetes`では、すべてのものがリソース/オブジェクトです。`selfLink`は各リソースに対応する`api-server`アドレスです。`selfLink`はリソースと1対1の対応関係があります。

`selfLink`にはパターンがあり、`namespace`、`type`、`apiVersion`、`name`などで構成されます。


### [get node](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#list-node-v1-core)

    kubectl get no

```bash
curl \
-s $APISERVER/api/v1/nodes?watch \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

### [get pod](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#list-pod-v1-core)


    kubectl get po -n kube-system -w


```bash
curl \
-s $APISERVER/api/v1/namespaces/kube-system/pods?watch \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

### [get pod log](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#read-log-pod-v1-core)

    kubectl logs  -f -c logtail  -n kube-system  logtail-ds-vvpfr


```bash
curl \
-s $APISERVER"/api/v1/namespaces/kube-system/pods/logtail-ds-vvpfr/log?container=logtail&follow" \
--header "Authorization: Bearer $TOKEN" \
--cacert  ca.crt
```

完全なAPIについては[kubernetes API](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/)を参照してください。


## JavaScriptクライアントを使用してapi-serverにアクセス

2019-08-23、kubeflowをデプロイしていたとき、内部にnodejsを使用してapiサービスをリクエストするコンポーネントがあることに気づきました。コードを観察したところ、設定を読み込む場所はおおよそ次のとおりです。

```ts

public loadFromDefault() {
        if (process.env.KUBECONFIG && process.env.KUBECONFIG.length > 0) {
            const files = process.env.KUBECONFIG.split(path.delimiter);
            this.loadFromFile(files[0]);
            for (let i = 1; i < files.length; i++) {
                const kc = new KubeConfig();
                kc.loadFromFile(files[i]);
                this.mergeConfig(kc);
            }
            return;
        }
        const home = findHomeDir();
        if (home) {
            const config = path.join(home, '.kube', 'config');
            if (fileExists(config)) {
                this.loadFromFile(config);
                return;
            }
        }
        if (process.platform === 'win32' && shelljs.which('wsl.exe')) {
            // TODO: Handle if someome set $KUBECONFIG in wsl here...
            try {
                const result = execa.sync('wsl.exe', ['cat', shelljs.homedir() + '/.kube/config']);
                if (result.code === 0) {
                    this.loadFromString(result.stdout);
                    return;
                }
            } catch (err) {
                // Falling back to alternative auth
            }
        }

        if (fileExists(Config.SERVICEACCOUNT_TOKEN_PATH)) {
            this.loadFromCluster();
            return;
        }

        this.loadFromClusterAndUser(
            { name: 'cluster', server: 'http://localhost:8080' } as Cluster,
            { name: 'user' } as User,
        );
    }
......


    public loadFromCluster(pathPrefix: string = '') {
        const host = process.env.KUBERNETES_SERVICE_HOST;
        const port = process.env.KUBERNETES_SERVICE_PORT;
        const clusterName = 'inCluster';
        const userName = 'inClusterUser';
        const contextName = 'inClusterContext';

        let scheme = 'https';
        if (port === '80' || port === '8080' || port === '8001') {
            scheme = 'http';
        }

        this.clusters = [
            {
                name: clusterName,
                caFile: `${pathPrefix}${Config.SERVICEACCOUNT_CA_PATH}`,
                server: `${scheme}://${host}:${port}`,
                skipTLSVerify: false,
            },
        ];
        this.users = [
            {
                name: userName,
                authProvider: {
                    name: 'tokenFile',
                    config: {
                        tokenFile: `${pathPrefix}${Config.SERVICEACCOUNT_TOKEN_PATH}`,
                    },
                },
            },
        ];
        this.contexts = [
            {
                cluster: clusterName,
                name: contextName,
                user: userName,
            },
        ];
        this.currentContext = contextName;
    }
```

見てのとおり、設定の読み込みには優先順位があります。saは比較的低い優先順位にランクされています。

hostとportは、対応するenvを読み取ることによって得られます（実際、yamlでENVが設定されていなくても、kubernetes自体が大量のENVを注入します。これらのENVのほとんどはsvcのIPアドレスとポートなどです）。

そしてデフォルトのクライアント`skipTLSVerify: false,`

では、デフォルトのクライアントを使用する場合、SSL検証をキャンセルするにはどうすればよいでしょうか？ここに、愚かですが確実な方法を提供します：

```ts
import * as k8s from '@kubernetes/client-node';
import { Cluster } from '@kubernetes/client-node/dist/config_types';

    this.kubeConfig.loadFromDefault();
    const context =
      this.kubeConfig.getContextObject(this.kubeConfig.getCurrentContext());
    if (context && context.namespace) {
      this.namespace = context.namespace;
    }
    let oldCluster = this.kubeConfig.getCurrentCluster()
    let cluster: Cluster = {
      name: oldCluster.name,
      caFile: oldCluster.caFile,
      server: oldCluster.server,
      skipTLSVerify: true,
    }
    kubeConfig.clusters = [cluster]
    this.coreAPI = this.kubeConfig.makeApiClient(k8s.Core_v1Api);
    this.customObjectsAPI =
      this.kubeConfig.makeApiClient(k8s.Custom_objectsApi);
```

## 参考リンク
1. [Kubernetes APIを使用してクラスターにアクセス](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)
2. [Kubernetes APIサーバーをcURLする](https://medium.com/@nieldw/curling-the-kubernetes-api-server-d7675cfc398c)
