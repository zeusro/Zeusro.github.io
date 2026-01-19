## Требования

Файлы под `/var/log/containers` на самом деле являются символическими ссылками.

Фактические файлы логов находятся в директории `/var/lib/docker/containers`.

Опциональные решения:

1. Logstash (слишком ресурсоемкий по памяти, старайтесь не использовать это)
2. fluentd
3. filebeat
4. Не использовать docker-driver

## Формат логов

/var/log/containers

```json
{
	"log": "17:56:04.176 [http-nio-8080-exec-5] INFO  c.a.goods.proxy.GoodsGetServiceProxy - ------ request_id=514136795198259200,zdid=42,gid=108908071,从缓存中获取数据:失败 ------\n",
	"stream": "stdout",
	"time": "2018-11-19T09:56:04.176713636Z"
}

{
	"log": "[][WARN ][2018-11-19 18:13:48,896][http-nio-10080-exec-2][c.h.o.p.p.s.impl.PictureServiceImpl][[msg:图片不符合要求:null];[code:400.imageUrl.invalid];[params:https://img.alicdn.com/bao/uploaded/i2/2680224805/TB2w5C9bY_I8KJjy1XaXXbsxpXa_!!2680224805.jpg];[stack:{\"requestId\":\"514141260156502016\",\"code\":\"400.imageUrl.invalid\",\"msg\":\"\",\"stackTrace\":[],\"suppressedExceptions\":[]}];]\n",
	"stream": "stdout",
	"time": "2018-11-19T10:13:48.896892566Z"
}
```

## Logstash

- filebeat.yml

```
filebeat:
  prospectors:
  - type: log
    // Включить мониторинг, не будет собирать, если не включено
    enable: true
    paths:  # Путь для сбора логов, это путь внутри контейнера
    - /var/log/elkTest/error/*.log
    # Многострочное объединение логов
    multiline.pattern: '^\['
    multiline.negate: true
    multiline.match: after
    # Тегировать каждый проект или группу, чтобы различать логи разных форматов
    tags: ["java-logs"]
    # Этот файл записывает позицию чтения логов. Если контейнер перезапускается, можно начать читать логи с записанной позиции
    registry_file: /usr/share/filebeat/data/registry

output:
  # Вывод в logstash
  logstash:
    hosts: ["0.0.0.0:5044"]
```

Примечание: Для версии 6.0 и выше этот filebeat.yml нужно монтировать в /usr/share/filebeat/filebeat.yml. Кроме того, нужно монтировать файл /usr/share/filebeat/data/registry, чтобы избежать дублирования сбора логов при перезапуске контейнера filebeat.


- logstash.conf

```
input {
	beats {
	    port => 5044
	}
}
filter {
    
   if "java-logs" in [tags]{ 
     grok {
        match => {
	       "message" => "(?<date>\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\]\[(?<level>[A-Z]{4,5})\]\[(?<thread>[A-Za-z0-9/-]{4,40})\]\[(?<class>[A-Za-z0-9/.]{4,40})\]\[(?<msg>.*)"
        }
        remove_field => ["message"]
     }
    }
	#if ([message] =~ "^\[") {
    #    drop {}
    #}
	# Для несоответствия регулярному выражению, используйте =~ для соответствия регулярному выражению
	if [level] !~ "(ERROR|WARN|INFO)" {
        drop {}
    }
}

## Добавьте ваши фильтры / конфигурацию плагинов logstash здесь

output {
	elasticsearch {
		hosts => "0.0.0.0:9200"
	}
}

```

## fluentd

[образ fluentd-es-image](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/fluentd-elasticsearch/fluentd-es-image)

[Kubernetes - Унифицированное управление логами на основе EFK](https://www.kubernetes.org.cn/4278.html)


[Логирование Docker через стек EFK (Elasticsearch + Fluentd + Kibana) с Docker Compose](https://docs.fluentd.org/v0.12/articles/docker-logging-efk-compose)


## filebeat+ES pipeline


### Определение pipeline

- Определение Java-специфичного pipeline

```

PUT /_ingest/pipeline/java
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"\\[%{LOGLEVEL:level}\\s+?\\]\\[(?<date>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2},\\d{3})\\]\\[(?<thread>[A-Za-z0-9/-]+?)\\]\\[%{JAVACLASS:class}\\]\\[(?<msg>[\\s\\S]*?)\\]\\[(?<stack>.*?)\\]"
			]
		},"remove": {
              "field": "message"
            }
	}]
}

PUT /_ingest/pipeline/nginx
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"%{IP:client} - - \\[(?<date>.*?)\\] \"(?<method>[A-Za-z]+?) (?<url>.*?)\" %{NUMBER:statuscode} %{NUMBER:duration} \"(?<refer>.*?)\" \"(?<user-agent>.*?)\"" 
			]
		},"remove": {
              "field": "message"
            }
	}]
}

PUT /_ingest/pipeline/default
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": []
}

PUT /_ingest/pipeline/all
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"\\[%{LOGLEVEL:level}\\s+?\\]\\[(?<date>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2},\\d{3})\\]\\[(?<thread>[A-Za-z0-9/-]+?)\\]\\[%{JAVACLASS:class}\\]\\[(?<msg>[\\s\\S]*?)\\]\\[(?<stack>.*?)\\]",
				
				"%{IP:client} - - \\[(?<date>.*?)\\] \"(?<method>[A-Za-z]+?) (?<url>.*?)\" %{NUMBER:statuscode} %{NUMBER:duration} \"(?<refer>.*?)\" \"(?<user-agent>.*?)\"",
				
				".+"
			]
		}
	}]
}

```

### filebeat.yml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
  namespace: kube-system
  labels:
    k8s-app: filebeat
data:
  filebeat.yml: |-
    filebeat.config:
        inputs:
          # Смонтированный configmap `filebeat-inputs`:
          path: ${path.config}/inputs.d/*.yml
          # Перезагружать конфигурации входов при их изменении:
          reload.enabled: false
        modules:
          path: ${path.config}/modules.d/*.yml
          # Перезагружать конфигурации модулей при их изменении:
          reload.enabled: false
    setup.template.settings:
        index.number_of_replicas: 0

    # https://www.elastic.co/guide/en/beats/filebeat/6.5/filebeat-reference-yml.html
    # https://www.elastic.co/guide/en/beats/filebeat/current/configuration-autodiscover.html
    filebeat.autodiscover:
     providers:
       - type: kubernetes
         templates:
             config:
               - type: docker
                 containers.ids:
                  # - "${data.kubernetes.container.id}" 
                  - "*"
                 enable: true
                 processors:
                  - add_kubernetes_metadata:
                      # include_annotations:
                      #   - annotation_to_include        
                      in_cluster: true
                  - add_cloud_metadata:

    cloud.id: ${ELASTIC_CLOUD_ID}
    cloud.auth: ${ELASTIC_CLOUD_AUTH}

    output:
      elasticsearch:
        hosts: ['${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
        # username: ${ELASTICSEARCH_USERNAME}
        # password: ${ELASTICSEARCH_PASSWORD}
        # pipelines:          
        #   - pipeline: "nginx"
        #     when.contains:
        #       kubernetes.container.name: "nginx-"
        #   - pipeline: "java"
        #     when.contains:
        #       kubernetes.container.name: "java-"              
        #   - pipeline: "default"  
        #     when.contains:
        #       kubernetes.container.name: ""
---
apiVersion: extensions/v1beta1
kind: DaemonSet
metadata:
  name: filebeat
  namespace: kube-system
  labels:
    k8s-app: filebeat
spec:
  template:
    metadata:
      labels:
        k8s-app: filebeat
    spec:
      tolerations:
        - key: "elasticsearch-exclusive"
          operator: "Exists"
          effect: "NoSchedule"         
      serviceAccountName: filebeat
      terminationGracePeriodSeconds: 30
      containers:
        - name: filebeat
          imagePullPolicy: Always          
          image: 'filebeat:6.6.0'
          args: [
            "-c", 
            "/etc/filebeat.yml",
            "-e",
          ]         
          env:
          - name: ELASTICSEARCH_HOST
            value: 0.0.0.0
          - name: ELASTICSEARCH_PORT
            value: "9200"
          # - name: ELASTICSEARCH_USERNAME
          #   value: elastic
          # - name: ELASTICSEARCH_PASSWORD
          #   value: changeme
          # - name: ELASTIC_CLOUD_ID
          #   value:
          # - name: ELASTIC_CLOUD_AUTH
          #   value:
          securityContext:
            runAsUser: 0
            # Если используете Red Hat OpenShift, раскомментируйте это:
            #privileged: true
          resources:
            limits:
              memory: 200Mi
            requests:
              cpu: 100m
              memory: 100Mi
          volumeMounts:
          - name: config
            mountPath: /etc/filebeat.yml
            readOnly: true
            subPath: filebeat.yml
          - name: data
            mountPath: /usr/share/filebeat/data
          - name: varlibdockercontainers
            mountPath: /var/lib/docker/containers
            readOnly: true
      volumes:
      - name: config
        configMap:
          defaultMode: 0600
          name: filebeat-config
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      # папка data хранит реестр статуса чтения для всех файлов, поэтому мы не отправляем все снова при перезапуске pod Filebeat
      - name: data
        hostPath:
          path: /var/lib/filebeat-data
          type: DirectoryOrCreate
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: filebeat
subjects:
- kind: ServiceAccount
  name: filebeat
  namespace: kube-system
roleRef:
  kind: ClusterRole
  name: filebeat
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: filebeat
  labels:
    k8s-app: filebeat
rules:
- apiGroups: [""] # "" указывает на основную API группу
  resources:
  - namespaces
  - pods
  verbs:
  - get
  - watch
  - list
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: filebeat
  namespace: kube-system
  labels:
    k8s-app: filebeat
```

Если вывод - это одноузловой elasticsearch, можно установить экспортированные filebeat* в 0 реплик, изменив шаблон

```
curl -X PUT "10.10.10.10:9200/_template/template_log" -H 'Content-Type: application/json' -d'
{
    "index_patterns" : ["filebeat*"],
    "order" : 0,
    "settings" : {
        "number_of_replicas" : 0
    }
}
'
```



Ссылки:
1. [running-on-kubernetes](https://www.elastic.co/guide/en/beats/filebeat/current/running-on-kubernetes.html)
1. [Подробное объяснение централизованного решения для логирования ELK+Filebeat](https://www.ibm.com/developerworks/cn/opensource/os-cn-elk-filebeat/index.html)
2. [filebeat.yml (подробное объяснение конфигурации на китайском)](http://www.cnblogs.com/zlslch/p/6622079.html)
3. [Подробное объяснение Elasticsearch Pipeline](https://www.felayman.com/articles/2017/11/24/1511527532643.html)
4. [es number_of_shards и number_of_replicas](https://www.cnblogs.com/mikeluwen/p/8031813.html)



## Другие решения

Некоторые используют режим sidecar, который можно сделать более тонко.

1. [Использование filebeat для сбора логов приложений в kubernetes](https://jimmysong.io/posts/kubernetes-filebeat/)
1. [Использование Logstash для сбора логов приложений Kubernetes](https://jimmysong.io/posts/kubernetes-logstash/)
2. 


### Решение Alibaba Cloud

1. [Процесс сбора логов Kubernetes](https://help.aliyun.com/document_detail/66654.html?spm=5176.8665266.sug_det.5.bbdc9gVU9gVUmc)


### Следовать запуску Docker
1. [драйвер docker](https://www.fluentd.org/guides/recipes/docker-logging)
2. 


```bash
kubectl delete po $pod  -n kube-system
kubectl get po -l k8s-app=fluentd-es -n kube-system
pod=`kubectl get po -l k8s-app=fluentd-es -n kube-system | grep -Eoi 'fluentd-es-([a-z]|-|[0-9])+'` && kubectl logs $pod -n kube-system
kubectl get events -n kube-system | grep $pod
```
