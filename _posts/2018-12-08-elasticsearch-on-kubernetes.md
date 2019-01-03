---
layout:       post
title:        "ElasticSearch深度集成kubernetes"
subtitle:     ""
date:         2018-12-08
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---


## 安装和配置

### 自制带插件的ES镜像

```dockerfile
FROM elasticsearch:6.5.0
#或者手动下载后然后安装也行
# COPY elasticsearch-analysis-ik-6.5.0.zip /
# elasticsearch-plugin install --batch file:///elasticsearch-analysis-ik-6.5.0.zip
    #IK Analyzer是一个开源的，基于java语言开发的中文分词工具包。是开源社区中处理中分分词非常热门的插件。 
RUN elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v6.5.0/elasticsearch-analysis-ik-6.5.0.zip && \
    # 拼音分词器
    elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-pinyin/releases/download/v6.5.0/elasticsearch-analysis-pinyin-6.5.0.zip && \    
    # Smart Chinese Analysis Plugin
    elasticsearch-plugin install analysis-icu && \
    # 日文分词器
    elasticsearch-plugin install analysis-kuromoji && \
    # 语音分析
    elasticsearch-plugin install analysis-phonetic && \
    # 计算字符哈希
    elasticsearch-plugin install  mapper-murmur3 && \
    # 在_source中提供size字段
    elasticsearch-plugin install mapper-size
```

### 编排文件

- RBAC 相关内容

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

- 主体程序


存储使用了hostpath,需要先在宿主机闯将目录,并赋予适当的权限,不然会出错

```
mkdir -p /root/kubernetes/17zwd/elasticsearch/data
sudo chmod 775  /root/kubernetes/17zwd/elasticsearch/data -R
chown 1000:0  /root/kubernetes/17zwd/elasticsearch/data -R
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
      # Elasticsearch requires vm.max_map_count to be at least 262144.
      # If your OS already sets up this number to a higher value, feel free
      # to remove this init container.
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
          # need more cpu upon initialization, therefore burstable class
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
          #因为是测试,所以master,data,ingest都混用          
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

这个编排精髓的一点在于用了节点`affinity`使每一个节点最多会运行一个容器,确保了高可用.

如果要吧节点的角色再抽取出来,那么其实抽取一个service作为相互发现的,即可.


```
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


1. [在Kubernetes上部署Elasticsearch集群](https://blog.csdn.net/chenleiking/article/details/79453460)
1. [重要配置的修改](https://www.elastic.co/guide/cn/elasticsearch/guide/current/important-configuration-changes.html)
1. [Install Elasticsearch with Docker](https://www.elastic.co/guide/en/elasticsearch/reference/6.x/docker.html)
1. [学习Elasticsearch之4：配置一个3节点Elasticsearch集群(不区分主节点和数据节点)](http://ethancai.github.io/2016/08/06/configure-smallest-elasticsearch-cluster/)
1. [谈一谈Elasticsearch的集群部署](https://blog.csdn.net/zwgdft/article/details/54585644)
1. [官方docker镜像构建项目](https://github.com/elastic/elasticsearch-docker/tree/master/templates)
1. [Elasticsearch模块功能之-自动发现（Discovery）
](https://blog.csdn.net/changong28/article/details/38377863)
1. [订阅费用](https://www.elastic.co/subscriptions)
2. [故障转移](https://es.xiaoleilu.com/020_Distributed_Cluster/20_Add_failover.html)
3. [节点配置](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html#coordinating-node)
4. [Elasticsearch 5.X集群多节点角色配置深入详解](https://blog.csdn.net/laoyang360/article/details/78290484)
1. [elasticsearch-cloud-kubernetes](https://github.com/fabric8io/elasticsearch-cloud-kubernetes)
1. [干货 | 吃透Elasticsearch 堆内存](https://blog.csdn.net/laoyang360/article/details/79998974)

[x] 配置账户

- 插件安装

[elasticsearch-docker-plugin-management](https://www.elastic.co/blog/elasticsearch-docker-plugin-management)

### 安装插件

GET /_cat/plugins?v&s=component&h=name,component,version,description


## 压力测试

```
esrally configure
esrally list tracks
esrally --pipeline=benchmark-only --target-hosts=127.0.0.1:9200 --track=geonames
```

datastore.type = elasticsearch
datastore.host = 127.0.0.1
datastore.port = 9200
datastore.secure = False

通过 Elasticsearch 官方提供的 benchmark 脚本 rally


## ElasticSearch集群的维护


更新的时候务必使用灰度更新,从序号最大的镜像开始更新,不然分片丢失了,相信我,你会死的很惨
```
kubectl patch statefulset elasticsearch -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":0}}}}' -n test
kubectl patch statefulset elasticsearch -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":1}}}}' -n test
kubectl patch statefulset elasticsearch -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"partition":2}}}}' -n test
```
