<!-- TODO: Translate to en -->

注意,`/consul/data`这个存储被我注释掉了,请按需自行配置相应的volume

主要思路就是先启动3台server,彼此之间通过`consul-server`实现自动加入节点.并通过反亲和度确保每个节点只允许一个consul-server.实现真正高可用.

然后启动`consul-client`,通过`consul-server`实现自动加入节点.

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

带`-ui`参数的节点都能作为ui呈现,记住是用8500这个端口.例子我就不写了.

## 不足之处

重启机制没做好.应该在server那里配置`livenessProbe`,当自身离开时自动重启,不过这个问题不是很大,consul自身挺稳定的,本身很少出事.

主要是`consul-client`,`consul-client`在检测离开了server节点之后,应该直接重启,重新加入.但是这一点我没做.

## 其他问题

### 加密通讯

consul还支持彼此间加密通讯,但是我之前配置client的时候失败了,这就比较遗憾了.加密通讯要加多一些配置,比较麻烦,所以我改成无加密通讯了.

### 反注册失败

这个问题遇到很多次了,有些服务需要手动反注册3次(可能因为我有个server节点).有些流氓服务不管多少次也是反注册失败,相当残念.

### consul很卡

consul的架构,server一定要跟client分离.如果直接往server注册服务,server担任了服务健康检查的角色,就会使整个consul变得非常的卡,我本想通过反注册服务给它降低负荷,但还是失败了,搞得最后我迁移了配置,重新搭了一套consul,相当蛋疼.

## 常用api

```
# 反注册服务
put /v1/agent/service/deregister/<serviceid>
# 获取配置
get /v1/kv/goms/config/<config>
# 获取服务列表
get /v1/agent/services
# 查询节点状态
get /v1/status/leader


```

## 参考链接

https://github.com/hashicorp/consul-helm