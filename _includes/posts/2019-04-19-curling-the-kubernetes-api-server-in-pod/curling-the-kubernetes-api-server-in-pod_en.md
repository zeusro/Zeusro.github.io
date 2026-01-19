Connecting to api-server generally falls into 3 cases:

1. Kubernetes Node connects through kubectl proxy relay
2. Connect directly through authorization verification (kubectl and various clients fall into this case)
  - `kubectl` loads `~/.kube/config` as authorization information, requests the remote `api-server`'s RESTful API. `api-server` judges whether you have permission based on the authorization information you submit. If you have permission, it returns the corresponding result to you.
3. Containers connect through `ServiceAccount`


## Container Requesting api-server

![img](https://d33wubrfki0l68.cloudfront.net/673dbafd771491a080c02c6de3fdd41b09623c90/50100/images/docs/admin/access-control-overview.svg)

The RBAC mechanism of `Kubernetes` was mentioned in [a previous article](https://www.zeusro.com/2019/01/17/kubernetes-rbac/). I won't explain it here.

For convenience, I'll directly use `admin` from `kube-system` as an example.

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

Simply put, containers have access to `api-server` through `ServiceAccount` combined with the RBAC mechanism.

Originally I planned to create an nginx container under `kube-system` to access, but curl failed. Later I found a centos image to test. Everyone just remember to configure `serviceAccount` properly.


    metadata.spec.template.spec.serviceAccount: admin



### The Essence of deploy Declaring sa (`ServiceAccount`)

The essence of declaring sa in deploy is mounting the corresponding secret of sa to the `/var/run/secrets/kubernetes.io/serviceaccount` directory.

If sa is not declared, `default` is mounted as sa.

```bash
# k edit secret admin-token-wggwk
# Secrets loaded with edit will all be represented in base64 form
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

So in every container in pods derived from deploy,
the `/var/run/secrets/kubernetes.io/serviceaccount` directory will have these 3 files:

```bash
/run/secrets/kubernetes.io/serviceaccount # ls -l
total 0
lrwxrwxrwx    1 root     root            13 Apr 19 06:46 ca.crt -> ..data/ca.crt
lrwxrwxrwx    1 root     root            16 Apr 19 06:46 namespace -> ..data/namespace
lrwxrwxrwx    1 root     root            12 Apr 19 06:46 token -> ..data/token
```

Although these 3 files are all soft links and ultimately point to the dated folder below, we don't need to worry about it.

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

## curl Requesting api-server

After the cluster is ready, there will be a `kubernetes` svc in the `default` namespace. Containers can request using ca.crt as the certificate. Cross-ns access method is `https://kubernetes.default.svc:443`

### Prerequisites

```bash
kubectl exec -it $po sh -n kube-system
cd /var/run/secrets/kubernetes.io/serviceaccount
TOKEN=$(cat token)
APISERVER=https://kubernetes.default.svc:443

```

### First Pretend to be a Rogue to Access `api-server`

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

As you can see, using the default `/etc/pki/tls/certs/ca-bundle.crt` public key to access directly reports that the certificate doesn't match (Peer's Certificate issuer is not recognized.).

### Access `api-server` with Certificate

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

So the approach is clear: when curling, bring the correct certificate (ca.crt) and request header.

## Using curl to Access Common APIs

Here I need to introduce a concept `selfLink`. In `kubernetes`, everything is a resource/object. `selfLink` is the `api-server` address corresponding to each resource. `selfLink` has a one-to-one correspondence with resources.

`selfLink` has a pattern, composed of `namespace`, `type`, `apiVersion`, `name`, etc.


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

Complete API see [kubernetes API](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/)


## Using JavaScript Client to Access api-server

2019-08-23, when I was deploying kubeflow, I found that there's a component inside that uses nodejs to request api service. I observed the code, and the place where configuration is loaded is roughly like this.

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

As you can see, loading configuration has a priority order. sa is ranked relatively low in priority.

host and port are obtained by reading the corresponding env (actually, even if ENV is not configured in yaml, kubernetes itself will inject a large number of ENVs, these ENVs are mostly svc IP addresses and ports, etc.)

And the default client `skipTLSVerify: false,`

So how to cancel SSL verification when using the default client? Here's a stupid but foolproof method:

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

## Reference Links
1. [Access Clusters Using the Kubernetes API](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)
2. [cURLing the Kubernetes API server](https://medium.com/@nieldw/curling-the-kubernetes-api-server-d7675cfc398c)
