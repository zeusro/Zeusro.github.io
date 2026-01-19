## Некоторые полезные инструменты

1. [kompose](https://github.com/kubernetes/kompose)

Может использоваться для преобразования файлов docker-compose, очень полезно для начинающих изучать Kubernetes.

## Инструменты установки

1. [kubeadm](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/)

Ссылки:
1. [Ротация сертификатов](https://kubernetes.io/cn/docs/tasks/tls/certificate-rotation/)


## Продвинутое планирование

Каждый тип сродства имеет 2 контекста: preferred и required. Preferred указывает предпочтение, а required является обязательным.

### Использование сродства для обеспечения запуска подов на целевых узлах

```yml
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
```


Ссылки:
1. [advanced-scheduling-in-kubernetes](https://kubernetes.io/blog/2017/03/advanced-scheduling-in-kubernetes/)
1. [kubernetes-scheulder-affinity](https://cizixs.com/2017/05/17/kubernetes-scheulder-affinity/)

### Использование антисродства для обеспечения запуска только одного приложения на каждом узле

```yml
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: 'app'
                operator: In
                values:
                - nginx-test2
            topologyKey: "kubernetes.io/hostname"
            namespaces:
            - test
```

```yml
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: "kubernetes.io/hostname"
              namespaces:
              - test
              labelSelector:
                matchExpressions:
                - key: 'app'
                  operator: In
                  values:
                   - "nginx-test2"
```


### Tolerations и Taints

Tolerations и taints всегда существуют парами. Taint похож на "Хотя я груб, курю и трачу все деньги, я все еще хорошая женщина." Этот вид taint обычно заставляет обычных мужчин (поды) держаться на расстоянии, но всегда есть несколько честных людей, которые могут терпеть (tolerations) это.

#### Taint

```bash
kubectl taint nodes xx  elasticsearch-test-ready=true:NoSchedule
kubectl taint nodes xx  elasticsearch-test-ready:NoSchedule-
```

Мастер-узлы поставляются с taints по умолчанию, поэтому контейнеры, которые мы развертываем, не будут работать на мастер-узлах. Но если вы настраиваете `taint`, будьте осторожны! Все компоненты `DaemonSet` и kube-system должны иметь соответствующие `tolerations`. В противном случае этот узел выгонит все контейнеры без этого `tolerations`, включая сетевые плагины и kube-proxy. Последствия довольно серьезны, пожалуйста, будьте осторожны.

`taint` и `tolerations` существуют парами, и операторы не могут использоваться случайным образом.

#### Tolerations

##### NoExecute


```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoExecute

NoExecute немедленно выгоняет поды, которые не соответствуют условиям толерантности. Эта операция очень опасна. Пожалуйста, сначала убедитесь, что системные компоненты имеют соответствующие tolerations настроены.

Обратите внимание, что использование оператора `Exists` здесь недействительно, вы должны использовать `Equal`.

##### NoSchedule

```yml
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Exists"
          effect: "NoSchedule"
        - key: "elasticsearch-exclusive"
          operator: "Equal"
          value: "true"
          effect: "NoExecute"
```

  kubectl taint node cn-shenzhen.xxxx  elasticsearch-exclusive=true:NoSchedule

Это пытается избежать планирования подов здесь, но поды все еще могут работать на нем.

`Exists` и `Equal` могут использоваться свободно, это не имеет большого значения.

Стоит упомянуть, что один и тот же ключ может иметь несколько эффектов одновременно.

```yml
Taints:             elasticsearch-exclusive=true:NoExecute
                    elasticsearch-exclusive=true:NoSchedule
```

Другие ссылки:

1. [Taint и Toleration в Kubernetes](https://jimmysong.io/posts/kubernetes-taint-and-toleration/)
1. [Механизм планирования Kubernetes](https://segmentfault.com/a/1190000012709117#articleHeader8)


## Советы по оркестрации контейнеров

### wait-for-it

k8s в настоящее время не имеет механизма зависимого запуска, подобного `depends_on` docker-compose. Рекомендуется использовать [wait-for-it](https://blog.giantswarm.io/wait-for-it-using-readiness-probes-for-service-dependencies-in-kubernetes/) для переписывания команды образа.

### Использование двойных кавычек в cmd

```yaml

               - "/bin/sh"
               - "-ec"
               - |
                  curl -X POST --connect-timeout 5 -H 'Content-Type: application/json' \
                  elasticsearch-logs:9200/logs,tracing,tracing-test/_delete_by_query?conflicts=proceed  \
                  -d '{"query":{"range":{"@timestamp":{"lt":"now-90d","format": "epoch_millis"}}}}'
```

## Архитектура k8s Master-Cluster

### Master (CONTROL PLANE)

- etcd distributed persistent storage

    Согласованное и высокодоступное хранилище ключ-значение, используемое как резервное хранилище Kubernetes для всех данных кластера.

- kube-apiserver

    интерфейс для плоскости управления Kubernetes.
- kube-scheduler

    Компонент на мастере, который следит за вновь созданными подами, которым не назначен узел, и выбирает узел для их запуска.

- Controller Manager 
    - Node Controller
    
        Отвечает за обнаружение и реагирование, когда узлы выходят из строя.
    - Replication Controller
        
        Отвечает за поддержание правильного количества подов для каждого объекта контроллера репликации в системе.
    - Endpoints Controller

        Заполняет объект Endpoints (то есть объединяет Services и Pods).
    - Service Account & Token Controllers
        
        Создает учетные записи по умолчанию и токены доступа API для новых пространств имен.
- cloud-controller-manager(**alpha feature**)
    - Node Controller

        Для проверки облачного провайдера, чтобы определить, был ли узел удален в облаке после того, как он перестал отвечать        
    - Route Controller

        Для настройки маршрутов в базовой облачной инфраструктуре
    - Service Controller

        Для создания, обновления и удаления балансировщиков нагрузки облачного провайдера
    - Volume Controller
        
         Для создания, подключения и монтирования томов, а также взаимодействия с облачным провайдером для оркестрации томов


Ссылки:
1. [Основные принципы Kubernetes (II) - Controller Manager](https://blog.csdn.net/huwh_/article/details/75675761)
1. [Компоненты Kubernetes](https://kubernetes.io/docs/concepts/overview/components/)

### Worker Nodes

- Kubelet

    kubelet — это основной "агент узла", который работает на каждом узле.
- Kubernetes Proxy

    kube-proxy обеспечивает абстракцию службы Kubernetes, поддерживая сетевые правила на хосте и выполняя пересылку соединений.

- Container Runtime (Docker, rkt или другие)

    Среда выполнения контейнеров — это программное обеспечение, отвечающее за запуск контейнеров. Kubernetes поддерживает несколько сред выполнения: Docker, rkt, runc и любую реализацию спецификации OCI runtime-spec.


## Ресурсы Kubernetes


- spec

 spec, который вы должны предоставить, описывает желаемое состояние объекта — характеристики, которые вы хотите, чтобы объект имел. 


- status

 status описывает фактическое состояние объекта и предоставляется и обновляется системой Kubernetes.

![image](/img/in-post/learn-kubernetes/resource.png)

### Pod

    Pod — это группа из одного или нескольких тесно связанных контейнеров, которые всегда будут работать вместе на одном рабочем узле и в одном пространстве имен Linux.

    Каждый pod похож на отдельную логическую машину со своим IP, именем хоста, процессами и т.д., запускающую одно приложение.

- liveness

kubelet использует liveness пробы, чтобы знать, когда перезапустить контейнер.

- readiness

kubelet использует readiness пробы, чтобы знать, когда контейнер готов начать принимать трафик. 

- Вопрос: Если вы удаляете pod, IP пода сначала удаляется из endpoint, или pod сначала удаляется?

Личное понимание:

Внутренний процесс удаления пода в k8s:
1. Пользователь удаляет pod
2. apiserver помечает pod как состояние 'dead'
3. kubelet удаляет pod, ждет 30 секунд по умолчанию, если все еще работает, принудительно закроет pod
   3.1 kubelet ждет завершения выполнения prestop в контейнерах пода
   3.2 отправляет сигнал sigterm для закрытия контейнеров
   3.3 после 30 секунд ожидания отправляет сигнал sigkill для принудительного закрытия пода
4. контроллер endpoint в nodecontroller удаляет этот pod из endpoint

Шаги 3 и 4 выполняются одновременно. Как правило, шаг 4 определенно завершится раньше шага 3. Поскольку шаги 3 и 4 не в фиксированном порядке, в крайних случаях kubelet может уже удалить pod, но контроллер endpoint все еще имеет этот pod, что приведет к тому, что запросы svc будут перенаправлены на уже удаленный pod, что приведет к ошибкам вызова svc.

Ссылка https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods


Ссылки:
1. [Использование данных пода в контейнерах](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)
2. [Использование Service Account для доступа к API Server в Kubernetes Pod](https://tonybai.com/2017/03/03/access-api-server-from-a-pod-through-serviceaccount/)
3. [Graceful Pod Shutdown](https://pracucci.com/graceful-shutdown-of-kubernetes-pods.html)



### Deployment
    Контроллер Deployment обеспечивает декларативные обновления для Pods и ReplicaSets.


- Rolling Update

```bash
    # Применимо только когда pod содержит только один контейнер
    kubectl rolling-update NAME [NEW_NAME] --image=IMAGE:TAG
```


[Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/) — это контейнеры, используемые для инициализации среды.


Ссылки:
1. [Назначение CPU ресурсов контейнерам и подам](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)
2. [Стратегии развертывания Kubernetes](https://container-solutions.com/kubernetes-deployment-strategies/)
3. [Автомасштабирование на основе CPU/памяти в Kubernetes — Часть II](https://blog.powerupcloud.com/autoscaling-based-on-cpu-memory-in-kubernetes-part-ii-fe2e495bddd4)
4. [Назначение подов узлам](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)

- Deployment не может обновляться, когда ресурсов недостаточно

0/6 nodes are available: 3 Insufficient memory, 3 node(s) had taints that the pod didn't tolerate.

### Replication Controller

    Контроллер репликации — это ресурс Kubernetes, который гарантирует, что pod всегда работает.

    -> label

### ReplicaSet

    Замена для Replication Controller

k8s Компонент|pod selector
--|--
Replication Controller|label
ReplicaSet|label, поды, которые включают определенный ключ метки


Ссылки:
1. [Разговор о механизме обновления Kubernetes Deployment, который вы могли неправильно понять](https://blog.csdn.net/WaltonWang/article/details/77461697)

### DaemonSet

    DaemonSet гарантирует, что он создает столько подов, сколько узлов, и развертывает каждый на своем узле

- Проверки здоровья
1. liveness probe
2. HTTP-based liveness probe
3. 

### StatefulSet
    Управляет развертыванием и масштабированием набора Pods и предоставляет гарантии относительно порядка и уникальности этих Pods.

Ссылки:
1. [StatefulSet](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)


### volumes

> volumes имеют 2 режима
> 
> In-tree является частью стандартной версии Kubernetes, уже записанной в код Kubernetes.
> Out-of-tree реализуется через интерфейс Flexvolume. Flexvolume позволяет пользователям писать свои собственные драйверы или добавлять поддержку своих собственных томов данных в Kubernetes.


1.  emptyDir – простой пустой каталог, используемый для хранения временных данных,
1.  hostPath – для монтирования каталогов из файловой системы рабочего узла в pod,
1.  gitRepo – том, инициализированный путем извлечения содержимого репозитория Git,
1.  nfs – общий ресурс NFS, смонтированный в pod,
1.  gcePersistentDisk (Google Compute Engine Persistent Disk), awsElasticBlockStore
(Amazon Web Services Elastic Block Store Volume), azureDisk (Microsoft Azure Disk
Volume) – для монтирования хранилища, специфичного для облачного провайдера,
1.  cinder, cephfs, iscsi, flocker, glusterfs, quobyte, rbd, flexVolume, vsphereVolume,
photonPersistentDisk, scaleIO – для монтирования других типов сетевого хранилища,
1.  configMap, secret, downwardAPI – специальные типы томов, используемые для раскрытия определенных
ресурсов Kubernetes и информации о кластере для пода,
1.  persistentVolumeClaim – способ использования предварительно или динамически подготовленного постоянного
хранилища (мы поговорим о них в последнем разделе этой главы).

- Persistent Volume
Постоянные тома хранят данные в соответствующем внешнем надежном хранилище, а затем предоставляют их Pods/контейнерам для использования, без необходимости сначала монтировать внешнее хранилище на хост, а затем предоставлять его контейнерам. Его самая большая особенность заключается в том, что его жизненный цикл не связан с Pods. Когда Pod умирает, он все еще существует. Когда Pod восстанавливается, он автоматически восстанавливает ассоциацию.

- Persistent Volume Claim
Используется для объявления, что он получит определенное пространство размера хранилища из ресурсов PV или Storage Class.

Ссылки:  
1. [Введение в Volumes в Kubernetes](https://jimmysong.io/posts/kubernetes-volumes-introduction)

### ConfigMap

ConfigMap — это объект ресурса Kubernetes, используемый для хранения файлов конфигурации. Весь контент конфигурации хранится в etcd.

Практика доказала, что изменение ConfigMap не может обновить информацию о переменных окружения, уже внедренную в контейнеры.

Ссылки:
1. [Тест горячего обновления Kubernetes ConfigMap](https://jimmysong.io/posts/kubernetes-configmap-hot-update/)


### service

> Служба Kubernetes — это ресурс, который вы создаете для получения единой постоянной точки входа в группу подов, предоставляющих одну и ту же службу.
    
> Каждая служба имеет IP-адрес и порт, которые никогда не меняются, пока служба существует. 

> Ресурсы будут создаваться в том порядке, в котором они появляются в файле. Поэтому лучше сначала указать службу, так как это обеспечит, что планировщик может распределить поды, связанные со службой, по мере их создания контроллерами, такими как Deployment.

- ClusterIP

Для внутреннего доступа к кластеру, может быть доступен напрямую извне.

Когда type не указан, создается этот тип службы.

clusterIP: None — это специальный [headless-service](https://kubernetes.io/zh/docs/concepts/services-networking/service/#headless-service), характеризующийся отсутствием clusterIP.

- NodePort

Каждый узел откроет тот же порт, поэтому он называется NodePort. Есть ограничения по количеству. Может быть доступен напрямую извне.

- LoadBalancer

Служба конкретного облачного провайдера. Если это Alibaba Cloud, это просто автоматическое привязывание серверов балансировщика нагрузки поверх NodePort.

- ExternalName

Ссылки:
1. [Глубокое погружение в балансировку нагрузки в кластере на основе IPVS](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)

### Horizontal Pod Autoscaler

    Horizontal Pod Autoscaler автоматически масштабирует количество подов в контроллере репликации, развертывании или наборе реплик на основе наблюдаемой загрузки CPU (или, с поддержкой пользовательских метрик, на некоторых других метриках, предоставляемых приложением).

Работает с API метрик и ресурсами запроса в ресурсах для корректировки.

### Kubernetes Downward API

    Он позволяет нам передавать метаданные о поде и его окружении через переменные окружения или файлы (в так называемом томе downwardAPI)

- environment variables
- downwardAPI volume


### Resource Quotas

Средство ограничения ресурсов подов на основе пространства имен


## Сетевая модель

[Принципы сетевой модели Kubernetes](https://mp.weixin.qq.com/s?__biz=MjM5OTcxMzE0MQ==&mid=2653371440&idx=1&sn=49f4e773bb8a58728752275faf891273&chksm=bce4dc2a8b93553c6b33d53c688ba30d61f88f0e065f50d82b1fb7e64daa4cc68394ffd8810b&mpshare=1&scene=23&srcid=1031BL2jtxx8DABRb46lNGPl%23rd)



Справочные команды:
3. [Руководство по командам kubectl](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
4. [Сравнение основных концепций и общих команд Kubernetes и Docker](https://yq.aliyun.com/articles/385699?spm=a2c4e.11153959.0.0.7355d55acvAlBq)
6. [Шпаргалка kubectl](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
7. [Руководство по конфигурации ресурсов K8S](https://kubernetes.io/docs/reference/)
8. [Введение в Container Runtime Interface (CRI) в Kubernetes](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/)


Справочные электронные книги:
[Kubernetes Handbook——Руководство по Kubernetes на китайском языке/Руководство по практике архитектуры облачных нативных приложений](https://jimmysong.io/kubernetes-handbook/concepts/statefulset.html)
