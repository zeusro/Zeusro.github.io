## Installation and Configuration

### Custom ES Image with Plugins

```dockerfile
FROM elasticsearch:6.5.0
# Or manually download and install
# COPY elasticsearch-analysis-ik-6.5.0.zip /
# elasticsearch-plugin install --batch file:///elasticsearch-analysis-ik-6.5.0.zip
    # IK Analyzer is an open-source Chinese word segmentation toolkit developed in Java. It's a very popular plugin in the open-source community for handling Chinese word segmentation.
RUN elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v6.5.0/elasticsearch-analysis-ik-6.5.0.zip && \
    # Pinyin analyzer
    elasticsearch-plugin install --batch https://github.com/medcl/elasticsearch-analysis-pinyin/releases/download/v6.5.0/elasticsearch-analysis-pinyin-6.5.0.zip && \    
    # Smart Chinese Analysis Plugin
    elasticsearch-plugin install analysis-icu && \
    # Japanese analyzer
    elasticsearch-plugin install analysis-kuromoji && \
    # Phonetic analysis
    elasticsearch-plugin install analysis-phonetic && \
    # Calculate character hash
    elasticsearch-plugin install  mapper-murmur3 && \
    # Provide size field in _source
    elasticsearch-plugin install mapper-size
```

### Orchestration Files

- RBAC Related Content

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

- Main Program


Storage uses hostpath. You need to create the directory on the host first and assign appropriate permissions, otherwise it will error.

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
          # Because it's for testing, master, data, and ingest are all mixed
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

The essence of this orchestration is using node `affinity` so that each node runs at most one container, ensuring high availability.

If you want to extract the node roles further, you can extract a service for mutual discovery.

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


1. [Deploying Elasticsearch Cluster on Kubernetes](https://blog.csdn.net/chenleiking/article/details/79453460)
1. [Important Configuration Changes](https://www.elastic.co/guide/cn/elasticsearch/guide/current/important-configuration-changes.html)
1. [Install Elasticsearch with Docker](https://www.elastic.co/guide/en/elasticsearch/reference/6.x/docker.html)
1. [Learning Elasticsearch 4: Configuring a 3-Node Elasticsearch Cluster (No Distinction Between Master and Data Nodes)](http://ethancai.github.io/2016/08/06/configure-smallest-elasticsearch-cluster/)
1. [Talking About Elasticsearch Cluster Deployment](https://blog.csdn.net/zwgdft/article/details/54585644)
1. [Official Docker Image Build Project](https://github.com/elastic/elasticsearch-docker/tree/master/templates)
1. [Elasticsearch Module Function - Auto Discovery (Discovery)](https://blog.csdn.net/changong28/article/details/38377863)
1. [Subscription Fees](https://www.elastic.co/subscriptions)
2. [Failover](https://es.xiaoleilu.com/020_Distributed_Cluster/20_Add_failover.html)
3. [Node Configuration](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html#coordinating-node)
4. [Elasticsearch 5.X Cluster Multi-Node Role Configuration In-Depth Explanation](https://blog.csdn.net/laoyang360/article/details/78290484)
1. [elasticsearch-cloud-kubernetes](https://github.com/fabric8io/elasticsearch-cloud-kubernetes)
1. [Understanding Elasticsearch Heap Memory](https://blog.csdn.net/laoyang360/article/details/79998974)

### Installing Plugins

[elasticsearch-docker-plugin-management](https://www.elastic.co/blog/elasticsearch-docker-plugin-management)

GET /_cat/plugins?v&s=component&h=name,component,version,description


## Stress Testing

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


Through the official Elasticsearch benchmark script rally


## ElasticSearch Cluster Maintenance


When updating, be sure to use grayscale updates, starting from the image with the largest sequence number. Otherwise, if shards are lost, believe me, you'll be in big trouble.

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
