Примечание: хранилище `/consul/data` закомментировано. Пожалуйста, настройте соответствующий том по мере необходимости.

Основная идея заключается в том, чтобы сначала запустить 3 сервера, которые автоматически присоединяются к узлам через `consul-server`. Высокая доступность достигается за счет использования антисродства, чтобы гарантировать, что на каждом узле разрешен только один consul-server.

Затем запустите `consul-client`, который автоматически присоединяется к узлам через `consul-server`.

## server

```yml
apiVersion: v1
kind: Service
metadata:
  namespace: $(namespace)
  name: consul-server
  labels:
    name: consul-server
spec:
  ports:
    - name: http
      port: 8500
    - name: serflan-tcp
      protocol: "TCP"
      port: 8301
    - name: serfwan-tcp
      protocol: "TCP"
      port: 8302
    - name: server
      port: 8300
    - name: consuldns
      port: 8600
  selector:
    app: consul
    consul-role: server
---
# kgpo -l app=consul
# kgpo -l app=consul  -o  wide -w
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: consul-server
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: consul-server
  replicas: 3
  template:
    metadata:
      labels:
        app: consul
        consul-role: server
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              topologyKey: "kubernetes.io/hostname"
              namespaces: 
              - $(namespace)
              labelSelector:
                matchExpressions:
                - key: 'consul-role'
                  operator: In
                  values: 
                   - "server"
      terminationGracePeriodSeconds: 10
      securityContext:
        fsGroup: 1000
      containers:
        - name: consul
          image: "consul:1.4.2"
          imagePullPolicy: Always
          resources:
            requests:
              memory: 500Mi
          env:
            - name: POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP
          args:
            - "agent"
            - "-advertise=$(POD_IP)"
            - "-bind=0.0.0.0"
            - "-bootstrap-expect=3"
            - "-retry-join=consul-server"
            - "-client=0.0.0.0"
            - "-datacenter=dc1"
            - "-data-dir=/consul/data"
            - "-domain=cluster.local"
            - "-server"
            - "-ui"
            - "-disable-host-node-id"
            - '-recursor=114.114.114.114'
        #   volumeMounts:
        #     - name: data
        #       mountPath: /consul/data
          lifecycle:
            preStop:
              exec:
                command:
                - /bin/sh
                - -c
                - consul leave
          ports:
            - containerPort: 8500
              name: ui-port
            - containerPort: 8400
              name: alt-port
            - containerPort: 53
              name: udp-port
            - containerPort: 8301
              name: serflan
            - containerPort: 8302
              name: serfwan
            - containerPort: 8600
              name: consuldns
            - containerPort: 8300
              name: server
#   volumeClaimTemplates:
#   - metadata:
#       name: data
```

## client

```yml

---    
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: consul-client
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: consul-client
  replicas: 10
  template:
    metadata:
      labels:
        app: consul
        consul-role: client
    spec:
      terminationGracePeriodSeconds: 10
      securityContext:
        fsGroup: 1000
      containers:
        - name: consul
          image: "consul:1.4.2"
          imagePullPolicy: Always
          resources:
            requests:
              memory: 500Mi
          env:
            - name: podname
              valueFrom: 
                fieldRef:
                  fieldPath: metadata.name
          args:
          - agent
          - -ui
          - -retry-join=consul-server
          - -node=$(podname)
          - -bind=0.0.0.0
          - -client=0.0.0.0
          - '-recursor=114.114.114.114'
        #   volumeMounts:
        #     - name: data
        #       mountPath: /consul/data
          lifecycle:
            preStop:
              exec:
                command:
                - /bin/sh
                - -c
                - consul leave
          readinessProbe:
            # NOTE(mitchellh): when our HTTP status endpoints support the
            # proper status codes, we should switch to that. This is temporary.
            exec:
              command:
                - "/bin/sh"
                - "-ec"
                - |
                  curl http://127.0.0.1:8500/v1/status/leader 2>/dev/null | \
                  grep -E '".+"'
          ports:
            - containerPort: 8301
              name: serflan
            - containerPort: 8500
              name: ui-port
            - containerPort: 8600
              name: consuldns
---
apiVersion: v1
kind: Service
metadata:
  namespace: $(namespace)
  name: consul-client
  labels:
    name: consul-client
    consul-role: consul-client
spec:
  ports:
    - name: serflan-tcp
      protocol: "TCP"
      port: 8301
    - name: http
      port: 8500
    - name: consuldns
      port: 8600
  selector:
    app: consul
    consul-role: client
```

## UI

Узлы с параметром `-ui` могут служить как UI. Помните, что нужно использовать порт 8500. Пример я не буду писать.

## Недостатки

Механизм перезапуска не был сделан хорошо. Следует настроить `livenessProbe` на сервере, чтобы он автоматически перезапускался при выходе. Однако это не большая проблема. Consul сам по себе довольно стабилен и редко имеет проблемы.

В основном `consul-client`. После того, как `consul-client` обнаружит, что он покинул серверный узел, он должен напрямую перезапуститься и повторно присоединиться. Но я этого не сделал.

## Другие проблемы

### Зашифрованная связь

Consul также поддерживает зашифрованную связь между узлами, но я потерпел неудачу при настройке клиента ранее, что довольно досадно. Зашифрованная связь требует добавления больше конфигурации, что хлопотно, поэтому я перешел на незашифрованную связь.

### Сбой отмены регистрации

Эта проблема встречалась много раз. Некоторые службы нужно вручную отменять регистрацию 3 раза (возможно, потому что у меня есть серверный узел). Некоторые недобросовестные службы не могут отменить регистрацию, сколько бы раз ни пытались, что довольно досадно.

### Consul очень медленный

В архитектуре Consul серверы должны быть отделены от клиентов. Если службы регистрируются напрямую на серверах, и серверы берут на себя роль проверки здоровья служб, это сделает весь Consul очень медленным. Я изначально хотел снизить нагрузку, отменив регистрацию служб, но это все равно не удалось. В итоге я перенес конфигурацию и перестроил кластер Consul, что было довольно болезненно.

## Общие API

```
# Отменить регистрацию службы
put /v1/agent/service/deregister/<serviceid>
# Получить конфигурацию
get /v1/kv/goms/config/<config>
# Получить список служб
get /v1/agent/services
# Запросить статус узла
get /v1/status/leader


```

## Ссылки

https://github.com/hashicorp/consul-helm
