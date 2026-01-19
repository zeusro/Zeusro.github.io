## 序文

以前に紹介した
[Concourse-CI入門から放棄まで](https://www.zeusro.com/2018/09/02/give-up-concourse-ci/)
今日は`Jenkins`の画期的なバージョン--**JenkinsX**について話しましょう！

`JenkinsX`はJenkinsのサブプロジェクトで、K8S上で実行するように特別に設計されています。

記事は2つの部分に分かれています。第1部はインストールを紹介し、第2部はアプリケーションの実践を説明します。


## 前提条件

### helm

クライアントとサーバーを含みます。[構文](https://helm.sh/docs/chart_template_guide/#getting-started-with-a-chart-template)も理解する必要があります。

`helm version`を実行して、クライアントとサーバーの両方が正常であることを確認します。

### ローカル

#### jx

`Concourse-CI`と同様に、最初にローカルCLIをインストールする必要があります。


```bash
brew tap jenkins-x/jx
brew install jx 
```

```
➜  ~ jx version
NAME               VERSION
jx                 1.3.974
jenkins x platform 0.0.3535
Kubernetes cluster v1.11.5
kubectl            v1.13.4
helm client        v2.10.0+g9ad53aa
helm server        v2.10.0+g9ad53aa
git                git version 2.14.3 (Apple Git-98)
Operating System   Mac OS X 10.13.6 build 17G65
```

ベストプラクティスは、独自の`myvalue.yaml`を作成し、内部のイメージを変更して、一度にすべてを行うことです。そうすれば、後で変更する必要がありません。

https://jenkins-x.io/getting-started/config/


### サーバー

国内の阿里云ECSをサーバーとして使用。

すでにingressサービスとpodを作成済み。

### インストールの確認

`jx compliance run`は新しいnsと一連のリソースを起動してクラスター全体をチェックします。ただし、イメージはすべて
gcr.ioのため、起動に失敗しました。自信がある場合は、このステップをスキップしてください。

```
jx compliance run
jx compliance status
jx compliance results
jx compliance delete

```

## インストール手順

### jx install

`jx install`はhelmのさらなるラッパーです。パラメータはいくつかの部分に分かれています。

`default-admin-password`は`Jenkins`、`grafana`、`nexus`、`chartmuseum`のデフォルトパスワードです。複雑に設定することをお勧めします。そうしないと、後で変更する必要があります。

`--namespace`はインストールのターゲットnsです。デフォルトは`kube-system`です。

`--ingress`は現在のingressインスタンスを指定します。指定しないとエラーになり、jx-ingressが見つからないと表示されます。

`--domain`はJenkins-Xの最終的な外部ドメイン名です。


```
jx \
install \
--cloud-environment-repo https://github.com/haoshuwei/cloud-environments.git \
--default-admin-password abcde \
--provider=kubernetes \
--namespace $(namespace) \
--ingress-service=nginx-ingress-lb \
--ingress-deployment=nginx-ingress-controller \
--ingress-namespace=kube-system 
--domain=$(domain)
```

内部にはいくつかの重要なオプションがあります。順番に選択しました：

> Static Master Jenkins

> Kubernetes Workloads: Automated CI+CD with GitOps Promotion

その後、コマンドラインはこの待機状態に入ります：

waiting for install to be ready, if this is the first time then it will take a while to download images

dockerイメージをデプロイする際、説明できない問題に必ず遭遇します。この時：

```bash
kgpo -l release=jenkins-x
```

予想通り、一部のpodが起動に失敗しました。この時、イメージを国内に戻し、対応する`deploy`/`ds`を変更する必要があります。

### ボリュームの設定

#### mongodb

まず`jenkins-x-mongodb`に関連するイメージを国内に転送し、次にPVCを設定します。

```
jenkins-x-mongodb
docker.io/bitnami/mongodb:3.6.6-debian-9
```

この部分を変更：

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: jenkins-x-mongodb
```

#### jenkins-x-chartmuseum

同様にvolumes部分を変更：

```yaml
      volumes:
        - name: storage-volume
          persistentVolumeClaim:
            claimName: jenkins-x-chartmuseum
```

#### jenkins

```
      volumes:
        - configMap:
            defaultMode: 420
            name: jenkins
          name: jenkins-config
        - emptyDir: {}
          name: plugin-dir
        - emptyDir: {}
          name: secrets-dir
        - name: jenkins-home
          persistentVolumeClaim:
            claimName: jenkins
```

阿里云NASが推奨されます。

### k8s.gcr.ioイメージを国内に転送

Jenkins-Xはdeploy、CronJobを設定します。多くのイメージは`gcr.io`からです。両方の部分を変更する必要があります。

#### deploy

- `jenkins-x-controllerteam`、`jenkins-x-controllerbuild`

```
gcr.io/jenkinsxio/builder-go:0.1.281
このイメージは約3.72Gです
```

- `jenkins-x-heapster`

```
docker pull k8s.gcr.io/heapster:v1.5.2
docker pull k8s.gcr.io/addon-resizer:1.7
# docker tag k8s.gcr.io/addon-resizer:1.7 $newregistry'addon-resizer:1.7'
```

#### CronJob

- jenkins-x-gcpreviews

転送が完了すると、podは基本的にすべて起動します。


## 最終結果

`jenkins`、`monocular`、`nexus`は直接アクセスできます。他のものは今のところ無視できます。

```bash
# $(app).$(namespace).$(domain)
➜  ~ kg ing
NAME                         HOSTS                                             ADDRESS        PORTS     AGE
chartmuseum                  chartmuseum.$(namespace).$(domain)       172.18.221.8   80        17h
docker-registry              docker-registry.$(namespace).$(domain)   172.18.221.8   80        17h
jenkins                      jenkins.$(namespace).$(domain)           172.18.221.8   80        17h
monocular                    monocular.$(namespace).$(domain)         172.18.221.8   80        17h
nexus                        nexus.$(namespace).$(domain)             172.18.221.8   80        17h
```

```bash
➜  ~ kg all -l release=jenkins-x
NAME                                                    READY   STATUS         RESTARTS   AGE
pod/jenkins-6879786cbc-6p8f7                            1/1     Running        0          17h
pod/jenkins-x-chartmuseum-7557886767-rbvlf              1/1     Running        0          6m
pod/jenkins-x-controllerbuild-74f7bd9f66-5b5v6          1/1     Running        0          16m
pod/jenkins-x-controllercommitstatus-5947679dc4-ltft7   1/1     Running        0          17h
pod/jenkins-x-controllerrole-5d58fcdd9f-lggwj           1/1     Running        0          17h
pod/jenkins-x-controllerteam-75c7565bdb-dmcgw           1/1     Running        0          44m
pod/jenkins-x-controllerworkflow-578bd4f984-qntf4       1/1     Running        0          17h
pod/jenkins-x-docker-registry-7b56b4f555-4p6hx          1/1     Running        0          17h
pod/jenkins-x-gcactivities-1552708800-7qcdc             0/1     Completed      0          10m
pod/jenkins-x-gcpods-1552708800-wfssj                   0/1     Completed      0          10m
pod/jenkins-x-gcpreviews-1552654800-pptmn               0/1     ErrImagePull   0          24s
pod/jenkins-x-mongodb-6bd8cc478f-55wwm                  1/1     Running        1          18m
pod/jenkins-x-nexus-695cc97bd6-qljhk                    1/1     Running        0          17h

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE
service/heapster                    ClusterIP   172.30.2.12     <none>        8082/TCP    17h
service/jenkins                     ClusterIP   172.30.5.27     <none>        8080/TCP    17h
service/jenkins-x-chartmuseum       ClusterIP   172.30.14.160   <none>        8080/TCP    17h
service/jenkins-x-docker-registry   ClusterIP   172.30.13.194   <none>        5000/TCP    17h
service/jenkins-x-mongodb           ClusterIP   172.30.13.146   <none>        27017/TCP   17h
service/nexus                       ClusterIP   172.30.4.7      <none>        80/TCP      17h

NAME                                               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/jenkins                            1         1         1            1           17h
deployment.apps/jenkins-x-chartmuseum              1         1         1            1           17h
deployment.apps/jenkins-x-controllerbuild          1         1         1            1           17h
deployment.apps/jenkins-x-controllercommitstatus   1         1         1            1           17h
deployment.apps/jenkins-x-controllerrole           1         1         1            1           17h
deployment.apps/jenkins-x-controllerteam           1         1         1            1           17h
deployment.apps/jenkins-x-controllerworkflow       1         1         1            1           17h
deployment.apps/jenkins-x-docker-registry          1         1         1            1           17h
deployment.apps/jenkins-x-mongodb                  1         1         1            1           17h
deployment.apps/jenkins-x-nexus                    1         1         1            1           17h

NAME                                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/jenkins-6879786cbc                            1         1         1       17h
replicaset.apps/jenkins-x-chartmuseum-7557886767              1         1         1       6m
replicaset.apps/jenkins-x-chartmuseum-cc467cfc                0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-57dcb9fd5f          0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-74f7bd9f66          1         1         1       16m
replicaset.apps/jenkins-x-controllercommitstatus-5947679dc4   1         1         1       17h
replicaset.apps/jenkins-x-controllerrole-5d58fcdd9f           1         1         1       17h
replicaset.apps/jenkins-x-controllerteam-5f57968bc9           0         0         0       17h
replicaset.apps/jenkins-x-controllerteam-75c7565bdb           1         1         1       44m
replicaset.apps/jenkins-x-controllerworkflow-578bd4f984       1         1         1       17h
replicaset.apps/jenkins-x-docker-registry-7b56b4f555          1         1         1       17h
replicaset.apps/jenkins-x-mongodb-6bd8cc478f                  1         1         1       23m
replicaset.apps/jenkins-x-mongodb-6bfd5d9c79                  0         0         0       17h
replicaset.apps/jenkins-x-nexus-695cc97bd6                    1         1         1       17h

NAME                                          DESIRED   SUCCESSFUL   AGE
job.batch/jenkins-x-gcactivities-1552698000   1         1            3h
job.batch/jenkins-x-gcactivities-1552699800   1         1            2h
job.batch/jenkins-x-gcactivities-1552708800   1         1            10m
job.batch/jenkins-x-gcpods-1552698000         1         1            3h
job.batch/jenkins-x-gcpods-1552699800         1         1            2h
job.batch/jenkins-x-gcpods-1552708800         1         1            10m
job.batch/jenkins-x-gcpreviews-1552654800     1         0            15h

NAME                                   SCHEDULE         SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/jenkins-x-gcactivities   0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpods         0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpreviews     0 */3 * * *      False     1        15h             17h
```

## 設定の最適化

### `jx get urls`の結果を変更

SVC内で変更する必要があります：

```yaml
metadata:
  annotations:
    fabric8.io/exposeUrl:
```

1. jenkins-x-chartmuseum
1. jenkins-x-docker-registry
1. jenkins-x-monocular-api
1. jenkins-x-monocular-ui
1. jenkins
1. nexus

### プラグイン更新センターを変更

`/pluginManager/advanced`にアクセスし、Update Siteに記入：

  https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/current/update-center.json


### [カスタムgitサーバー](https://jenkins-x.io/developing/git/)

todo:

```bash
jx edit addon gitea -e true
jx get addons
```

## その他の有用なコマンド

### 全体のJenkins-Xプラットフォームを更新

```bash
jx upgrade platform
```

### 環境の切り替え

```bash
jx context
jx environment
```

### パスワードの更新

TODO:

参考リンク：

1. [京东工程效率専門家 石雪峰 JenkinsX：Kubernetesベースの次世代CI/CDプラットフォーム](http://www.caict.ac.cn/pphd/zb/2018kxy/15pm/5/201808/t20180813_181702.htm)
1. [JenkinsX Essentials](https://www.youtube.com/watch?v=LPEIfvkJpw0)
2. [Jenkins Xのインストール](https://kubernetes.feisky.xyz/fu-wu-zhi-li/devops/jenkinsx)
3. [Jenkins Xのインストールと使用：Kubernetesの自動CI/CDのコマンドラインツール](https://www.ctolib.com/jenkins-x-jx.html)
4. [阿里云Kubernetesサービスでjenkins環境を5分で構築し、アプリケーションのビルドからデプロイまでのパイプラインを完了](https://yq.aliyun.com/articles/683440)
1. [Kubernetesにインストール](https://jenkins-x.io/getting-started/install-on-cluster/)
1. [jx](https://jenkins-x.io/commands/jx/)
1. [阿里云コンテナサービスKubernetesのJenkinsX（1）-インストールとデプロイの実践](https://yq.aliyun.com/articles/657149)
1. [阿里云の例](https://cs.console.aliyun.com/#/k8s/catalog/detail/incubator_jenkins-x-platform)
