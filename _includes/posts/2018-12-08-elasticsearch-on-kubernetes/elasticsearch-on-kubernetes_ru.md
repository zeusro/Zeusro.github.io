## Установка и конфигурация

### Пользовательский образ ES с плагинами

```dockerfile
FROM elasticsearch:6.5.0
# Или вручную загрузить и установить
# COPY elasticsearch-analysis-ik-6.5.0.zip /
# elasticsearch-plugin install --batch file:///elasticsearch-analysis-ik-6.5.0.zip
    # IK Analyzer — это набор инструментов для сегментации китайского текста с открытым исходным кодом, разработанный на Java. Это очень популярный плагин в сообществе с открытым исходным кодом для обработки сегментации китайского текста.
RUN elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v6.5.0/elasticsearch-analysis-ik-6.5.0.zip && \
    # Анализатор пиньинь
    elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-pinyin/releases/download/v6.5.0/elasticsearch-analysis-pinyin-6.5.0.zip && \    
    # Smart Chinese Analysis Plugin
    elasticsearch-plugin install analysis-icu && \
    # Японский анализатор
    elasticsearch-plugin install analysis-kuromoji && \
    # Фонетический анализ
    elasticsearch-plugin install analysis-phonetic && \
    # Вычисление хеша символов
    elasticsearch-plugin install  mapper-murmur3 && \
    # Предоставление поля size в _source
    elasticsearch-plugin install mapper-size
```

### Файлы оркестрации

- RBAC Связанный контент

```
apiVersion: v1
kind: ServiceAccount
metadata:
  name: elasticsearch-admin
  namespace: default
  labels:
    app: elasticsearch
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: default
  name: elasticsearch
  labels:
    app: elasticsearch
subjects:
- kind: ServiceAccount
  name: elasticsearch-admin
  namespace: default
  apiGroup: ""
roleRef:
  kind: ClusterRole
  name: elasticsearch
  apiGroup: ""
```

- Основная программа


Хранилище использует hostpath. Сначала нужно создать директорию на хосте и назначить соответствующие разрешения, иначе будет ошибка.

```bash
cd /root/kubernetes/$(namespace)/elasticsearch/data
mkdir -p $(pwd)
sudo chmod 775  $(pwd) -R
chown 1000:0  $(pwd) -R
```

```
# kubectl get po -l app=myelasticsearch -o wide  -n default
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: myelasticsearch
  namespace: default
  labels:
    app: myelasticsearch    
    elasticsearch-role: all
spec:
  updateStrategy:
    rollingUpdate:
      partition: 0
    type: RollingUpdate
  serviceName: elasticsearch-master
  replicas: 2
  selector:
    matchLabels:
      app: myelasticsearch
      elasticsearch-role: all
  template:
    metadata:
      labels:
        app: myelasticsearch                     
        elasticsearch-role: all 
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: elasticsearch-test-ready
                operator: Exists
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:              
              - key: 'app'
                operator: In
                values:
                - myelasticsearch
              - key: 'elasticsearch-role'
                operator: In
                values:
                - all                 
            topologyKey: "kubernetes.io/hostname"
            namespaces: 
            - default    
      serviceAccountName: elasticsearch-admin    
      terminationGracePeriodSeconds: 180
      # Elasticsearch требует, чтобы vm.max_map_count было не менее 262144.
      # Если ваша ОС уже устанавливает это число на более высокое значение, можете
      # удалить этот init контейнер.
      initContainers:
      - image: alpine:3.6
        command: ["/sbin/sysctl", "-w", "vm.max_map_count=262144"]
        name: elasticsearch-init
        securityContext:
          privileged: true      
      imagePullSecrets:
        - name: vpc-shenzhen      
      containers:
      - image: elasticsearch:6.5.0-plugin-in-remote-ik
        name: elasticsearch
        resources:
          # нужно больше CPU при инициализации, поэтому burstable класс
          limits:
            # cpu: 2
            memory: 4Gi
          requests:
            # cpu: 1
            memory: 1Gi
        ports:
        - name: restful
          containerPort: 9200          
          protocol: TCP
        - name: discovery
          containerPort: 9300          
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          initialDelaySeconds: 2
          periodSeconds: 10
          successThreshold: 1
          tcpSocket:
            port: 9200
          timeoutSeconds: 1     
        # livenessProbe:
        #   failureThreshold: 3
        #   initialDelaySeconds: 7
        #   periodSeconds: 10
        #   successThreshold: 1
        #   tcpSocket:
        #     port: 9200
        #   timeoutSeconds: 1           
        volumeMounts:
        - name: host
          mountPath: /usr/share/elasticsearch/data
        env:
        - name: "NAMESPACE"
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
        # - name: "ES_JAVA_OPTS"
        #   value: "-Xms256m -Xmx256m"              
        - name: "cluster.name"
          value: "myelasticsearch"
        - name: "bootstrap.memory_lock"
          value: "true"
        - name: "discovery.zen.ping.unicast.hosts"
          value: "myelasticsearch"
        - name: "discovery.zen.minimum_master_nodes"
          value: "2"
        - name: "discovery.zen.ping_timeout"
          value: "5s"
          # Поскольку это для тестирования, master, data и ingest все смешаны
        - name: "node.master"
          value: "true"
        - name: "node.data"
          value: "true"
        - name: "node.ingest"
          value: "true"
        - name: xpack.monitoring.collection.enabled
          value: "true" 
        - name: node.name
          valueFrom: 
            fieldRef:
              fieldPath: metadata.name 
              # fieldPath: spec.nodeName 
        securityContext: 
          privileged: true
      volumes:
      - name: host
        hostPath:
          path: /root/kubernetes/default/myelasticsearch/data
          type: DirectoryOrCreate
---
kind: Service
apiVersion: v1
metadata:
  labels:
    app: myelasticsearch
    elasticsearch-role: all
  name: myelasticsearch
  namespace: default
spec:
  ports:
    - name: discovery
      port: 9300
      targetPort: discovery
    - name: restful
      port: 9200
      protocol: TCP
      targetPort: restful
  selector:
    app: myelasticsearch
    elasticsearch-role: all
  type: NodePort
```

Суть этой оркестрации заключается в использовании `affinity` узла, чтобы каждый узел запускал максимум один контейнер, обеспечивая высокую доступность.

Если вы хотите извлечь роли узлов дальше, вы можете извлечь сервис для взаимного обнаружения.

```yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    app: elasticsearch
  name: elasticsearch-discovery
  namespace: default
spec:
  ports:
    - port: 9300
      targetPort: discovery
  selector:
    app: myelasticsearch
```


1. [Развертывание кластера Elasticsearch на Kubernetes](https://blog.csdn.net/chenleiking/article/details/79453460)
1. [Важные изменения конфигурации](https://www.elastic.co/guide/cn/elasticsearch/guide/current/important-configuration-changes.html)
1. [Установка Elasticsearch с Docker](https://www.elastic.co/guide/en/elasticsearch/reference/6.x/docker.html)
1. [Изучение Elasticsearch 4: Настройка кластера Elasticsearch с 3 узлами (без различия между мастером и узлами данных)](http://ethancai.github.io/2016/08/06/configure-smallest-elasticsearch-cluster/)
1. [Разговор о развертывании кластера Elasticsearch](https://blog.csdn.net/zwgdft/article/details/54585644)
1. [Официальный проект сборки образа Docker](https://github.com/elastic/elasticsearch-docker/tree/master/templates)
1. [Функция модуля Elasticsearch - Автоматическое обнаружение (Discovery)](https://blog.csdn.net/changong28/article/details/38377863)
1. [Стоимость подписки](https://www.elastic.co/subscriptions)
2. [Отказоустойчивость](https://es.xiaoleilu.com/020_Distributed_Cluster/20_Add_failover.html)
3. [Конфигурация узла](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html#coordinating-node)
4. [Подробное объяснение конфигурации ролей нескольких узлов кластера Elasticsearch 5.X](https://blog.csdn.net/laoyang360/article/details/78290484)
1. [elasticsearch-cloud-kubernetes](https://github.com/fabric8io/elasticsearch-cloud-kubernetes)
1. [Понимание кучи памяти Elasticsearch](https://blog.csdn.net/laoyang360/article/details/79998974)

### Установка плагинов

[elasticsearch-docker-plugin-management](https://www.elastic.co/blog/elasticsearch-docker-plugin-management)

GET /_cat/plugins?v&s=component&h=name,component,version,description


## Стресс-тестирование

```
esrally configure
esrally list tracks
esrally --pipeline=benchmark-only --target-hosts=127.0.0.1:9200 --track=geonames
```

```
datastore.type = elasticsearch
datastore.host = 127.0.0.1
datastore.port = 9200
datastore.secure = False
```


Через официальный скрипт бенчмарка Elasticsearch rally


## Обслуживание кластера ElasticSearch


При обновлении обязательно используйте серое обновление, начиная с образа с наибольшим порядковым номером. Иначе, если шарды потеряны, поверьте мне, вам будет очень плохо.

```bash
kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":0}}}}' \
-n test

kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":1}}}}' \
-n test

kubectl patch statefulset elasticsearch -p \
'{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":2}}}}' \
-n test
```
