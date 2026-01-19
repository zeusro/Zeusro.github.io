## Окружение:

1. версия kubernetes: Alibaba Cloud v1.11.5
1. Система узла: CentOS Linux 7 (Core)
1. Версия контейнера узла: docker://17.6.2

## Введение в концепции

### X-Forwarded-For

```
X-Forwarded-For: <client>, <proxy1>, <proxy2>
```

### remote_addr

remote_addr представляет IP клиента, но его значение не предоставляется клиентом. Вместо этого оно указывается сервером на основе IP клиента. Когда ваш браузер обращается к веб-сайту, предполагая, что между ними нет прокси, веб-сервер сайта (Nginx, Apache и т.д.) установит remote_addr в IP вашей машины. Если вы используете прокси, ваш браузер сначала обратится к прокси, а затем прокси перешлет на веб-сайт. В этом случае веб-сервер установит remote_addr в IP этой прокси-машины.

## Внутренние запросы (Запросы Pod к Pod)

```
podA-->podB
```

В это время только `getRemoteAddr` может получить IP, все остальные заголовки пусты. clientIP, полученный podB, является podIP podA (виртуальный IP).

Адрес клиента всегда является IP-адресом клиентского пода, независимо от того, находятся ли клиентский под и серверный под на одном узле или на разных узлах.


## Внешние запросы

### Nodeport svc

```
client-->svc-->pod
```

#### externalTrafficPolicy: Cluster

Установка `externalTrafficPolicy: Cluster` в svc.spec означает, что все узлы запустят `kube-proxy`, и внешний трафик может быть передан еще раз.

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

В это время трафик проходит через пересылку node2. clientIP, полученный приложением, неопределен. Это может быть IP `node 2`, или это может быть IP клиента.

#### externalTrafficPolicy: Local

Установка `externalTrafficPolicy: Local` в svc.spec запускает `kube-proxy` на узлах, запускающих поды. Внешний трафик идет напрямую к узлу.

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

В это время только узлы, запускающие поды, будут иметь соответствующий прокси, избегая посредника (node 2), получающего прибыль.

`clientIP` — это `remote_addr`.


### LoadBalancer svc

Установите `externalTrafficPolicy: Local` в svc.spec.

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

SLB прослушивает HTTP: Возьмите `X-Forwarded-For` (получите IP клиента от SLB).

SLB прослушивает TCP: Возьмите `remote_addr`.

Случай `externalTrafficPolicy: Cluster` не нужно упоминать, это бессмысленно.

### ingress

```
client-->slb-->ingress svc-->ingress pod-->app svc-->pod
```

Сначала нужно установить тип svc `ingress` в `Nodeport`/`LoadBalancer`, и `externalTrafficPolicy: Local`.

Тип app svc может быть `ClusterIP`/`NodePort`/`LoadBalancer`, это не имеет значения.

В это время значение `X-Forwarded-For` является `clientIP`.

`remote_addr` — это виртуальный IP `ingress pod`.

## Ссылки:

1. [source-ip](https://kubernetes.io/docs/tutorials/services/source-ip/)
1. [X-Forwarded-For в заголовках HTTP-запросов](https://imququ.com/post/x-forwarded-for-header-in-http.html)
1. [Как получить реальный IP клиента](https://help.aliyun.com/document_detail/54007.html?spm=5176.11065259.1996646101.searchclickresult.610a1293EtcJUu)
1. [Аудит исходного адреса: отслеживание SNAT служб Kubernetes](https://ieevee.com/tech/2017/09/18/k8s-svc-src.html)
1. [Разговор о виртуальном IP компонентов службы kubernets](https://ieevee.com/tech/2017/01/20/k8s-service.html)
