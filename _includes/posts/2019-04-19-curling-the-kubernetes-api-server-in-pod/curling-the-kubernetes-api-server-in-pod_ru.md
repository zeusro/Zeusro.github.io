Подключение к api-server обычно делится на 3 случая:

1. Kubernetes Node подключается через ретрансляцию kubectl proxy
2. Прямое подключение через проверку авторизации (kubectl и различные клиенты попадают в этот случай)
  - `kubectl` загружает `~/.kube/config` как информацию об авторизации, запрашивает RESTful API удаленного `api-server`. `api-server` судит, есть ли у вас разрешение, на основе информации об авторизации, которую вы отправляете. Если у вас есть разрешение, он возвращает соответствующий результат вам.
3. Контейнеры подключаются через `ServiceAccount`


## Контейнер запрашивает api-server

![img](https://d33wubrfki0l68.cloudfront.net/673dbafd771491a080c02c6de3fdd41b09623c90/50100/images/docs/admin/access-control-overview.svg)

Механизм RBAC `Kubernetes` упоминался в [предыдущей статье](https://www.zeusro.com/2019/01/17/kubernetes-rbac/). Здесь я не буду объяснять.

Для удобства я буду напрямую использовать `admin` из `kube-system` в качестве примера.

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

Проще говоря, контейнеры имеют доступ к `api-server` через `ServiceAccount` в сочетании с механизмом RBAC.

Изначально я планировал создать контейнер nginx под `kube-system` для доступа, но curl не удался. Позже я нашел образ centos для тестирования. Все просто помните правильно настроить `serviceAccount`.


    metadata.spec.template.spec.serviceAccount: admin



### Суть объявления sa (`ServiceAccount`) в deploy

Суть объявления sa в deploy заключается в монтировании соответствующего секрета sa в каталог `/var/run/secrets/kubernetes.io/serviceaccount`.

Если sa не объявлен, `default` монтируется как sa.

```bash
# k edit secret admin-token-wggwk
# Секреты, загруженные с помощью edit, будут представлены в форме base64
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

Таким образом, в каждом контейнере в подах, производных от deploy,
в каталоге `/var/run/secrets/kubernetes.io/serviceaccount` будут эти 3 файла:

```bash
/run/secrets/kubernetes.io/serviceaccount # ls -l
total 0
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

Хотя эти 3 файла являются символическими ссылками и в конечном итоге указывают на датированную папку ниже, нам не нужно об этом беспокоиться.

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

## curl запрашивает api-server

После готовности кластера в пространстве имен `default` будет svc `kubernetes`. Контейнеры могут запрашивать, используя ca.crt в качестве сертификата. Способ доступа между ns: `https://kubernetes.default.svc:443`

### Предварительные требования

```bash
kubectl exec -it $po sh -n kube-system
cd /var/run/secrets/kubernetes.io/serviceaccount
TOKEN=$(cat token)
APISERVER=https://kubernetes.default.svc:443

```

### Сначала притвориться негодяем для доступа к `api-server`

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

Как видно, использование публичного ключа по умолчанию `/etc/pki/tls/certs/ca-bundle.crt` для доступа напрямую сообщает, что сертификат не совпадает (Peer's Certificate issuer is not recognized.).

### Доступ к `api-server` с сертификатом

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

Так что подход ясен: при curl приносите правильный сертификат (ca.crt) и заголовок запроса.

## Использование curl для доступа к общим API

Здесь нужно ввести концепцию `selfLink`. В `kubernetes` все является ресурсом/объектом. `selfLink` — это адрес `api-server`, соответствующий каждому ресурсу. `selfLink` имеет взаимно однозначное соответствие с ресурсами.

`selfLink` имеет закономерность, состоящую из `namespace`, `type`, `apiVersion`, `name` и т.д.


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

Полный API см. [kubernetes API](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/)


## Использование клиента JavaScript для доступа к api-server

2019-08-23, когда я развертывал kubeflow, я обнаружил, что внутри есть компонент, который использует nodejs для запроса api-сервиса. Я наблюдал код, и место, где загружается конфигурация, примерно такое.

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

Как видно, загрузка конфигурации имеет порядок приоритета. sa занимает относительно низкий приоритет.

host и port получаются путем чтения соответствующего env (на самом деле, даже если ENV не настроен в yaml, kubernetes сам внедрит большое количество ENV, эти ENV в основном IP-адреса и порты svc и т.д.)

И клиент по умолчанию `skipTLSVerify: false,`

Так как же отменить проверку SSL при использовании клиента по умолчанию? Вот глупый, но надежный метод:

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

## Ссылки
1. [Доступ к кластерам с использованием Kubernetes API](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)
2. [cURLing сервера Kubernetes API](https://medium.com/@nieldw/curling-the-kubernetes-api-server-d7675cfc398c)
