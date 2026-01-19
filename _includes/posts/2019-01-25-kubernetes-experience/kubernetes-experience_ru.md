Опыт (уроки) управления кластером Kubernetes

**2020-02-26 Обновление: Эта статья снова обновлена, пожалуйста, перейдите к [Опыт управления кластером Kubernetes](https://github.com/zeusro/awesome-kubernetes-notes/blob/master/source/chapter_6.md)**

## Проблемы узлов

### Правильные шаги для удаления узла

```bash
# SchedulingDisabled, убедитесь, что новые контейнеры не будут запланированы на этот узел
kubectl cordon $node
# Вытеснить все поды, кроме daemonsets
kubectl drain $node   --ignore-daemonsets
kubectl delete $node
```

### Правильные шаги для обслуживания узла

```bash
# SchedulingDisabled, убедитесь, что новые контейнеры не будут запланированы на этот узел
kubectl cordon $node
# Вытеснить все поды, кроме daemonsets
kubectl drain $node --ignore-daemonsets --delete-local-data
# После завершения обслуживания восстановите его нормальное состояние
kubectl uncordon $node
```

--delete-local-data означает игнорирование временного хранилища, такого как `emptyDir`

### ImageGCFailed

> 
>   kubelet может очистить неиспользуемые контейнеры и образы. kubelet перерабатывает контейнеры и образы каждую минуту и каждые пять минут соответственно.
> 
>   [Настройка сборки мусора kubelet](https://k8smeetup.github.io/docs/concepts/cluster-administration/kubelet-garbage-collection/)

Но у сборки мусора kubelet есть проблема: она может перерабатывать только неиспользуемые образы, что-то вроде `docker system prune`. Однако наблюдения показывают, что мертвые контейнеры — не самая большая проблема; запущенные контейнеры — большая проблема. Если ImageGCFailed продолжает происходить, а использование контейнерами ephemeral-storage/hostpath (хост-каталоги) продолжает увеличиваться, это в конечном итоге приведет к более серьезным проблемам DiskPressure, затрагивающим все контейнеры на узле.


Рекомендации:

1. Для машин с высокими характеристиками (4 ядра 32G и выше) настройте 100G+ SSD пространства для каталога docker
1. Настройте [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/#storage-resource-quota) для ограничения общих квот ресурсов
1. Отключите ephemeral-storage (запись локальных файлов) на стороне контейнера или используйте spec.containers[].resources.limits.ephemeral-storage для ограничения и контроля записи в хост-каталоги

### Давление диска узла (DiskPressure)

```
--eviction-hard=imagefs.available<15%,memory.available<300Mi,nodefs.available<10%,nodefs.inodesFree<5%
```

kubelet указывает давление диска при запуске. В качестве примера возьмем Alibaba Cloud: `imagefs.available<15%` означает, что когда слой чтения-записи контейнера меньше 15%, узел будет вытеснен. Последствием вытеснения узла является возникновение DiskPressure, и узел больше не может запускать какие-либо образы, пока проблема с диском не будет решена. Если контейнеры на узле используют хост-каталоги, эта проблема будет фатальной. Потому что вы не можете удалить каталоги, но именно накопление этих хост-каталогов привело к вытеснению узла.

Поэтому выработайте хорошие привычки: не пишите вещи случайно в контейнерах (запись файлов в контейнерах будет занимать ephemeral-storage, слишком много ephemeral-storage приведет к вытеснению подов), используйте больше stateless-контейнеров, тщательно выбирайте способы хранения, старайтесь не использовать хранилище hostpath.

Когда это происходит, действительно чувствуешь, что хочешь плакать, но нет слез.

```
Events:
  Type     Reason                 Age                   From                                            Message
  ----     ------                 ----                  ----                                            -------
  Warning  FreeDiskSpaceFailed    23m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 5182058496 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  ImageGCFailed          18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Warning  ImageGCFailed          13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Normal   NodeHasNoDiskPressure  10m (x5 over 47d)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasNoDiskPressure
  Normal   Starting               10m                   kube-proxy, node.xxxx1  Starting kube-proxy.
  Normal   NodeHasDiskPressure    10m (x4 over 42m)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasDiskPressure
  Warning  EvictionThresholdMet   8m29s (x19 over 42m)  kubelet, node.xxxx1     Attempting to reclaim ephemeral-storage
  Warning  ImageGCFailed          3m4s                  kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4920913920 bytes, but freed 0 bytes
```

ImageGCFailed — очень проблемное состояние. Когда появляется это состояние, это означает, что kubelet попытался освободить диск, но не смог. На этом этапе рассмотрите возможность ручного исправления на машине.

Рекомендации:

1. Когда количество образов превышает 200, приобретите 100G SSD для хранения образов
1. Используйте меньше временного хранилища (empty-dir, hostpath и т.д.)

Ссылки:

1. [Сигналы вытеснения](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#eviction-signals)
1. [10 диаграмм для глубокого понимания контейнеров и образов Docker](http://dockone.io/article/783)


### Высокое использование CPU узла

Возможно, узел выполняет GC (GC контейнера/GC образа). Проверьте с помощью `describe node`. Я столкнулся с этой ситуацией один раз, и в итоге контейнеров на узле стало намного меньше, что было немного расстраивающим.

```
Events:
  Type     Reason                 Age                 From                                         Message
  ----     ------                 ----                ----
  Warning  ImageGCFailed          45m                 kubelet, cn-shenzhen.xxxx  failed to get image stats: rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

Ссылка:

[Анализ исходного кода kubelet: Сборка мусора](https://cizixs.com/2017/06/09/kubelet-source-code-analysis-part-3/)

### Отключение узла (unknown)

```
  Ready                False   Fri, 28 Jun 2019 10:19:21 +0800   Thu, 27 Jun 2019 07:07:38 +0800   KubeletNotReady              PLEG is not healthy: pleg was last seen active 27h14m51.413818128s ago; threshold is 3m0s

Events:
  Type     Reason             Age                 From                                         Message
  ----     ------             ----                ----                                         -------
  Warning  ContainerGCFailed  5s (x543 over 27h)  kubelet, cn-shenzhen.xxxx                    rpc error: code = DeadlineExceeded desc = context deadline exceeded
```
После SSH-входа на хост я обнаружил, что хотя служба docker все еще работает, `docker ps` зависла. Поэтому я обновил ядро до 5.1 и перезапустил.

Позже выяснилось, что кто-то развернул проблемный образ, который крашил любой узел, на котором он запускался, независимо от узла. Это было расстраивающим.

unknown — очень серьезная проблема, и к ней нужно относиться серьезно. Когда узел становится unknown, сам kubernetes master не знает, живы ли контейнеры на узле или мертвы. Если на unknown-узле работает очень важный контейнер, и он случайно упал, kubernetes не запустит для вас другой контейнер автоматически. Это нужно отметить.

Ссылки:

[Узел мечется между Ready/NotReady с проблемами PLEG](https://github.com/kubernetes/kubernetes/issues/45419)
[Глубокий анализ Pod Disruption Budgets (PDB) Kubernetes](https://my.oschina.net/jxcdwangtao/blog/1594348)

### SystemOOM

`SystemOOM` не обязательно означает, что память машины исчерпана. Одна ситуация — это docker, контролирующий память контейнера.

По умолчанию место хранения Docker: /var/lib/docker/containers/$id

В этом каталоге есть важный файл: `hostconfig.json`, частичный отрывок выглядит так:

```json
	"MemorySwappiness": -1,
	"OomKillDisable": false,
	"PidsLimit": 0,
	"Ulimits": null,
	"CpuCount": 0,
	"CpuPercent": 0,
	"IOMaximumIOps": 0,
	"IOMaximumBandwidth": 0
}
```

`"OomKillDisable": false,` предотвращает гармонизацию службой docker контейнеров, превышающих лимиты ресурсов, путем убийства процессов/перезапуска, а вместо этого санкционирует их другими способами (подробности можно увидеть [здесь](https://docs.docker.com/config/containers/resource_constraints/))

### docker daemon зависла

Я столкнулся с этой ситуацией один раз. Причина была в проблемном контейнере, который повлиял на весь узел.

Эту проблему нужно решить быстро, потому что все поды на узле станут unknown.

```bash
systemctl daemon-reexec
systemctl restart docker (опционально, в зависимости от ситуации)
systemctl restart kubelet
```

В тяжелых случаях работает только перезапуск узла и остановка задействованного контейнера.

Рекомендация: `Для liveness/readiness контейнера используйте методы tcp/httpget, избегайте частого использования exec`
## pod


### Частые перезапуски pod

Есть много причин, нельзя обобщать

Одна ситуация: deploy настроил проверки работоспособности, узел работает нормально, но из-за слишком высокой нагрузки узла проверки работоспособности не проходят (load15 постоянно выше 2), частые Backoff. После того, как я повысил порог нездоровья и снизил нагрузку узла, проблема была решена.

```yaml

          livenessProbe:
            # Порог нездоровья
            failureThreshold: 3
            initialDelaySeconds: 5
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 8080
            timeoutSeconds: 1
```

### Ресурсы достигли установленного лимита

Повысьте лимит или проверьте приложение

### Readiness/Liveness connection refused

Неудачные проверки Readiness также перезапустят, но неудача проверки `Readiness` не обязательно является проблемой приложения. Если сам узел перегружен, также может возникнуть connection refused или timeout.

Эту проблему нужно исследовать на узле.


### pod вытеснен (Evicted)

1. Узел добавил taint, вызвав вытеснение pod
1. ephemeral-storage превысил лимит и был вытеснен
    1. Если использование EmptyDir превышает его SizeLimit, то этот pod будет вытеснен
    1. Если использование Container (лог, и если нет раздела overlay, включает imagefs) превышает его лимит, то этот pod будет вытеснен
    1. Если общее использование локального временного хранилища Pod (все emptydir и container) превышает сумму всех лимитов контейнеров в pod, то pod вытесняется

ephemeral-storage — это временное хранилище, используемое pod.
```
resources:
       requests: 
           ephemeral-storage: "2Gi"
       limits:
           ephemeral-storage: "3Gi"
```
После вытеснения узла вы все еще можете видеть его через get po. Используйте команду describe, чтобы увидеть историческую причину вытеснения.

> Message:            The node was low on resource: ephemeral-storage. Container codis-proxy was using 10619440Ki, which exceeds its request of 0.


Ссылки:
1. [Настройка ephemeral-storage pod Kubernetes](https://blog.csdn.net/hyneria_hope/article/details/79467922)
1. [Управление вычислительными ресурсами для контейнеров](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)


### kubectl exec вход в контейнер не удался

Я столкнулся с этой проблемой при настройке codis-server. В то время готовность и проверки работоспособности не были настроены. Но при получении описания pod оно показывало running. На самом деле, в этот момент контейнер уже был ненормальным.

```
~ kex codis-server-3 sh
rpc error: code = 2 desc = containerd: container not found
command terminated with exit code 126
```

Решение: Удалите этот pod, настройте `livenessProbe`


### виртуальное имя хоста pod

Для подов, производных от `Deployment`, `virtual host name` — это `pod name`.

Для подов, производных от `StatefulSet`, `virtual host name` — это `<pod name>.<svc name>.<namespace>.svc.cluster.local`. По сравнению с `Deployment`, это более регулярно. И поддерживает доступ от других подов.


### последовательные Crashbackoff pod

`Crashbackoff` имеет много причин.

Неудача создания песочницы (FailedCreateSandBox) в основном является проблемой плагина сети CNI.

Вытягивание образа имеет проблемы с китайской спецификой, может быть слишком большим, вытягивание медленное.

Также есть возможность, что параллелизм контейнера слишком высок, вызывая лавину трафика.

Например, теперь есть 3 контейнера abc. a внезапно столкнулся со всплеском трафика, вызвав внутренний сбой, затем `Crashbackoff`, поэтому a будет удален `service`. Оставшиеся bc не могут обработать столько трафика, последовательно падают, и в конечном итоге веб-сайт становится недоступным. Эта ситуация часто встречается в высококонкурентных веб-сайтах + неэффективных веб-контейнерах.

Без изменения кода оптимальное решение — увеличить количество реплик и добавить HPA для достижения динамического масштабирования.

### Неэффективность DNS

Включите nscd (службу кэширования доменных имен) внутри контейнеров, чтобы значительно повысить производительность разрешения.

Строго запрещено использовать alpine в качестве базового образа в production (вызовет аномалии запросов разрешения DNS)

## deploy

### MinimumReplicationUnavailable

Если `deploy` настроил SecurityContext, но api-server отклонил его, возникнет эта ситуация. В контейнере api-server удалите параметр запуска `SecurityContextDeny`.

См. [Использование контроллеров допуска](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)

## service

### Создана служба, но нет соответствующего po, что произойдет?

Запросы не будут иметь ответа до истечения времени ожидания запроса

Ссылка

1. [Настройка обработки нехватки ресурсов](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)


### service connection refuse

Возможные причины:

1. pod не установил readinessProbe, запросы идут на неготовые поды
1. kube-proxy не работает (kube-proxy отвечает за пересылку запросов)
1. Перегрузка сети


### service нет балансировки нагрузки

Проверьте, используется ли `headless service`. `headless service` не балансирует нагрузку автоматически...

```yaml
kind: Service
spec:
# clusterIP: None — это `headless service`
  type: ClusterIP
  clusterIP: None
```

Конкретное поведение: у службы нет собственного виртуального IP, nslookup покажет все IP подов. Но при ping будет появляться только IP первого пода.

```bash
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.31.10.94 172-31-10-94.consul.default.svc.cluster.local
Address 2: 172.31.10.95 172-31-10-95.consul.default.svc.cluster.local
Address 3: 172.31.11.176 172-31-11-176.consul.default.svc.cluster.local

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.973 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.170 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.170/0.571/0.973 ms

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.206 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.178 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.178/0.192/0.206 ms
```


Для обычного типа: ClusterIP service, nslookup покажет собственный IP службы

```BASH
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.30.15.52 consul.default.svc.cluster.local
```

## ReplicationController не обновляется

ReplicationController не обновляется с помощью apply, а с помощью `kubectl rolling-update`. Однако эта команда также устарела, заменена на `kubectl rollout`. Поэтому следует использовать `kubectl rollout` в качестве метода обновления, или быть ленивым, применить файл, затем удалить po.

Старайтесь использовать deploy вместо этого.

## StatefulSet

### обновление pod не удалось

StatefulSet обновляется по одному. Наблюдайте, есть ли контейнеры в `Crashbackoff`. Возможно, этот контейнер вызвал зависание обновления. Удалите его.

### unknown pod

Если статус привязанного к StatefulSet pod становится unknown, это очень проблематично. StatefulSet не поможет вам пересоздать pod.

Это приведет к постоянным сбоям внешних запросов.

Комплексная рекомендация: не используйте `StatefulSet`, замените его паттерном operator.

## [kube-apiserver](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-apiserver/)

`kube-apiserver` — это набор специальных контейнеров, работающих на `master`. В качестве примера возьмем kubernetes Alibaba Cloud (то же самое для kubernetes, созданного с помощью `kubeadm`)

Три файла определены под `/etc/kubernetes/manifests/`
1. kube-apiserver.yaml
1. kube-controller-manager.yaml
1. kube-scheduler.yaml

Узел master будет автоматически отслеживать изменения файлов в этом каталоге и автоматически перезапускаться по мере необходимости.

Поэтому для изменения настроек `api server` просто измените `kube-apiserver.yaml`, сохраните и выйдите, и соответствующий контейнер перезапустится. Аналогично, если вы неправильно измените конфигурацию, `api server` не запустится. Перед изменением обязательно внимательно прочитайте [документацию](https://kubernetes.io/zh/docs/concepts/overview/kubernetes-api/)

## Проблемы Kubernetes Alibaba Cloud

### Изменить Ingress по умолчанию

Создайте новый svc типа балансировщика нагрузки, указывающий на ingress, затем измените параметры запуска `nginx-ingress-controller` под `kube-system`.

```
        - args:
            - /nginx-ingress-controller
            - '--configmap=$(POD_NAMESPACE)/nginx-configuration'
            - '--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services'
            - '--udp-services-configmap=$(POD_NAMESPACE)/udp-services'
            - '--annotations-prefix=nginx.ingress.kubernetes.io'
            - '--publish-service=$(POD_NAMESPACE)/<пользовательский svc>'
            - '--v=2'
```

### У службы LoadBalancer нет IP

Конкретное поведение: EXTERNAL-IP всегда показывает pending.

```bash
~ kg svc consul-web
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
consul-web   LoadBalancer   172.30.13.122   <pending>     443:32082/TCP   5m  
```

Эта проблема связана с компонентом [Alibaba Cloud Provider](https://yq.aliyun.com/articles/626066). `cloud-controller-manager` имеет 3 компонента. Им нужно внутреннее избрание лидера. Возможно, что-то пошло не так. В то время я удалил один из проблемных `pods`, и это было исправлено.

### Очистка динамического PVC Statefulset

В настоящее время динамический PVC `Statefulset` Alibaba Cloud использует nas.

1. Для этого типа хранилища сначала масштабируйте реплики контейнера до 0 или удалите весь `Statefulset`.
1. Удалите PVC
1. Подключите nas к любому серверу, затем удалите соответствующий каталог nas pvc.

### После обновления до v1.12.6-aliyun.1 выделяемая память узла уменьшилась

Эта версия резервирует 1Gi на узел, что эквивалентно тому, что весь кластер имеет на N GB меньше (N — количество узлов) для выделения Pod.

Если узел 4G, а Pod запрашивает 3G, его очень легко вытеснить.

Рекомендация: Увеличьте спецификации узла.

```
Server Version: version.Info{Major:"1", Minor:"12+", GitVersion:"v1.12.6-aliyun.1", GitCommit:"8cb561c", GitTreeState:"", BuildDate:"2019-04-22T11:34:20Z", GoVersion:"go1.10.8", Compiler:"gc", Platform:"linux/amd64"}
```

### Новый узел показывает NetworkUnavailable

RouteController failed to create a route

Проверьте события kubernetes, чтобы увидеть, появляется ли это:

```
timed out waiting for the condition -> WaitCreate: ceate route for table vtb-wz9cpnsbt11hlelpoq2zh error, Aliyun API Error: RequestId: 7006BF4E-000B-4E12-89F2-F0149D6688E4 Status Code: 400 Code: QuotaExceeded Message: Route entry quota exceeded in this route table  
```

Эта проблема возникает из-за достижения [лимита пользовательских записей маршрута VPC](https://help.aliyun.com/document_detail/27750.html). По умолчанию 48. Нужно увеличить квоту для `vpc_quota_route_entrys_num`.

### Доступ к LoadBalancer svc случайно показывает аномалии пересылки трафика

См.
[[bug] Версия kubernetes Alibaba Cloud не проверяет порт службы loadbalancer, вызывая аномальную пересылку трафика](https://github.com/kubernetes/cloud-provider-alibaba-cloud/issues/57)
Проще говоря, один и тот же SLB не может иметь тот же порт svc, иначе он будет пересылать вслепую.

Официальное заявление:
> Несколько служб, повторно использующих один и тот же SLB, не могут иметь один и тот же порт прослушивания на передней панели, иначе это вызовет конфликт портов.


### Консоль показывает использование памяти узла всегда слишком высоким

[Мониторинг памяти контейнера Docker](https://xuxinkun.github.io/2016/05/16/memory-monitor-with-cgroup/)

Причина в том, что их консоль использует usage_in_bytes (cache+buffer), поэтому она будет больше, чем числа, видимые в облачном мониторинге.


### Мистическая оптимизация Ingress Controller

Измените configmap с именем nginx-configuration под kube-system

```
proxy-connect-timeout: "75" 
proxy-read-timeout: "75" 
proxy-send-timeout: "75" 
upstream-keepalive-connections: "300" 
upstream-keepalive-timeout: "300" 
upstream-keepalive-requests: "1000" 
keep-alive-requests: "1000" 
keep-alive: "300"
disable-access-log: "true" 
client-header-timeout: "75" 
worker-processes: "16"
```

Примечание: один элемент соответствует одной конфигурации, а не одному файлу. Формат примерно такой:

```
➜  ~ kg cm nginx-configuration -o yaml
apiVersion: v1
data:
  disable-access-log: "true"
  keep-alive: "300"
  keep-alive-requests: "1000"
  proxy-body-size: 20m
  worker-processes: "16"
  ......
```

### проблема pid

```
Message: **Liveness probe failed: rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:262: starting container process caused "process_linux.go:86: adding pid 30968 to cgroups caused \"failed to write 30968 to cgroup.procs: write /sys/fs/cgroup/cpu,cpuacct/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podfe4cc065_cc58_11e9_bf64_00163e08cd06.slice/docker-0447a362d2cf4719ae2a4f5ad0f96f702aacf8ee38d1c73b445ce41bdaa8d24a.scope/cgroup.procs: invalid argument\""
```

Узлы инициализации Alibaba Cloud используют старую версию centos, ядро 3.1. Ядро 3.10 Centos7.4 еще не поддерживает ограничения cgroup для pid/fd, поэтому возникает этот тип проблемы.

Рекомендации:

1. Вручную обслуживайте узлы, обновите до ядра 5.x (в настоящее время некоторые узлы были обновлены до 5.x, но версия docker все еще 17.6.2, продолжаю наблюдать~)
1. Установите [NPD](https://github.com/AliyunContainerService/node-problem-detector) + [eventer](https://github.com/AliyunContainerService/kube-eventer), используйте механизм событий для предупреждения администраторов о ручном обслуживании

### OSS PVC FailedMount

OSS можно использовать через PV, указывающий access key, access secret + PVC. Один день deploy столкнулся с проблемой FailedMount. Связался с инженерами разработки Alibaba Cloud, которые сказали, что flexvolume будет иметь проблемы при запуске на узлах, запускающихся впервые, нужно дать ему "перерегистрироваться"

Затронутая версия: registry-vpc.cn-shenzhen.aliyuncs.com/acs/flexvolume:v1.12.6.16-1f4c6cb-aliyun

Решение:

```bash
touch /usr/libexec/kubernetes/kubelet-plugins/volume/exec/alicloud~oss/debug
```

Ссылки (связанные с планированием приложений):
1. [Проверки работоспособности Kubernetes и обработка зависимостей служб](http://dockone.io/article/2587)
2. [Как kubernetes решает зависимости служб?](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Путь Kubernetes 1 - Заблуждения об ограничениях ресурсов приложения Java](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [Управление политиками управления CPU на узле](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
1. [Резервирование вычислительных ресурсов для системных демонов](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)
1. [Настройка обработки нехватки ресурсов](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)
