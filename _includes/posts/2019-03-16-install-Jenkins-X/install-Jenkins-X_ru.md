## Предисловие

Ранее представлено
[Concourse-CI от начала до отказа](https://www.zeusro.com/2018/09/02/give-up-concourse-ci/)
Сегодня поговорим о эпохальной версии `Jenkins`--**JenkinsX**!

`JenkinsX` — это подпроект Jenkins, специально разработанный для работы на K8S.

Статья разделена на 2 части. Часть 1 знакомит с установкой, Часть 2 объясняет практики применения.


## Предварительные требования

### helm

Включая клиент и сервер. Также нужно понять [синтаксис](https://helm.sh/docs/chart_template_guide/#getting-started-with-a-chart-template).

Запустите `helm version`, чтобы убедиться, что и клиент, и сервер в порядке.

### Локально

#### jx

Подобно `Concourse-CI`, в начале также нужно установить локальный CLI.


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

Лучшая практика — создать свой собственный `myvalue.yaml`, изменить образы внутри, сделать все сразу, чтобы не нужно было изменять позже.

https://jenkins-x.io/getting-started/config/


### Сервер

Использование внутреннего Alibaba Cloud ECS в качестве сервера.

Уже созданы сервис и под ingress.

### Проверка установки

`jx compliance run` запустит новый ns и серию ресурсов для проверки всего кластера. Но поскольку образы все из
gcr.io, мой запуск не удался. Если вы уверены, просто пропустите этот шаг.

```
jx compliance run
jx compliance status
jx compliance results
jx compliance delete

```

## Шаги установки

### jx install

`jx install` — это дальнейшая обертка вокруг helm. Параметры разделены на несколько частей.

`default-admin-password` — это пароль по умолчанию для `Jenkins`, `grafana`, `nexus`, `chartmuseum`. Рекомендуется установить его сложным, иначе придется изменять позже.

`--namespace` — целевой ns для установки. По умолчанию `kube-system`;

`--ingress` указывает текущий экземпляр ingress. Если не указан, будет ошибка, подсказка, что jx-ingress не найден.

`--domain` — это окончательное внешнее доменное имя для Jenkins-X.


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

Внутри есть несколько важных опций. Я выбрал по порядку:

> Static Master Jenkins

> Kubernetes Workloads: Automated CI+CD with GitOps Promotion

После этого командная строка войдет в это состояние ожидания:

waiting for install to be ready, if this is the first time then it will take a while to download images

При развертывании docker-образов вы обязательно столкнетесь с неописуемыми проблемами. В это время:

```bash
kgpo -l release=jenkins-x
```

Как и ожидалось, некоторые поды не запустились. В это время нужно перенести образы обратно в страну и изменить соответствующие `deploy`/`ds`.

### Настройка volume

#### mongodb

Сначала перенесите образ, связанный с `jenkins-x-mongodb`, в страну, затем настройте PVC.

```
jenkins-x-mongodb
docker.io/bitnami/mongodb:3.6.6-debian-9
```

Измените эту часть:

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: jenkins-x-mongodb
```

#### jenkins-x-chartmuseum

Также измените часть volumes:

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

Рекомендуется Alibaba Cloud NAS.

### Перенос образов k8s.gcr.io в страну

Jenkins-X настраивает deploy, CronJob. Многие образы из `gcr.io`. Обе части нужно изменить.

#### deploy

- `jenkins-x-controllerteam`, `jenkins-x-controllerbuild`

```
gcr.io/jenkinsxio/builder-go:0.1.281
Этот образ около 3.72G
```

- `jenkins-x-heapster`

```
docker pull k8s.gcr.io/heapster:v1.5.2
docker pull k8s.gcr.io/addon-resizer:1.7
# docker tag k8s.gcr.io/addon-resizer:1.7 $newregistry'addon-resizer:1.7'
```

#### CronJob

- jenkins-x-gcpreviews

После завершения переноса поды в основном все поднимаются.


## Финальные результаты

`jenkins`, `monocular` и `nexus` можно получить прямой доступ. Остальные пока можно игнорировать.

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

## Оптимизация настроек

### Изменить результаты `jx get urls`

Нужно изменить в SVC:

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

### Изменить центр обновления плагинов

Доступ к `/pluginManager/advanced`, заполните Update Site:

  https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/current/update-center.json


### [Пользовательский git-сервер](https://jenkins-x.io/developing/git/)

todo:

```bash
jx edit addon gitea -e true
jx get addons
```

## Другие полезные команды

### Обновить всю платформу Jenkins-X

```bash
jx upgrade platform
```

### Переключить окружение

```bash
jx context
jx environment
```

### Обновить пароль

TODO:

Ссылки:

1. [Эксперт по инженерной эффективности JD Ши Сюэфэн JenkinsX: Платформа CI/CD следующего поколения на основе Kubernetes](http://www.caict.ac.cn/pphd/zb/2018kxy/15pm/5/201808/t20180813_181702.htm)
1. [JenkinsX Essentials](https://www.youtube.com/watch?v=LPEIfvkJpw0)
2. [Установка Jenkins X](https://kubernetes.feisky.xyz/fu-wu-zhi-li/devops/jenkinsx)
3. [Установка и использование Jenkins X: Инструмент командной строки для автоматизированного CI/CD на Kubernetes](https://www.ctolib.com/jenkins-x-jx.html)
4. [5 минут для настройки среды jenkins на службе Alibaba Cloud Kubernetes и завершения конвейера от сборки приложения до развертывания](https://yq.aliyun.com/articles/683440)
1. [Установка на Kubernetes](https://jenkins-x.io/getting-started/install-on-cluster/)
1. [jx](https://jenkins-x.io/commands/jx/)
1. [JenkinsX Alibaba Cloud Container Service Kubernetes (1) - Практика установки и развертывания](https://yq.aliyun.com/articles/657149)
1. [Пример Alibaba Cloud](https://cs.console.aliyun.com/#/k8s/catalog/detail/incubator_jenkins-x-platform)
