Note: The `/consul/data` storage has been commented out. Please configure the corresponding volume as needed.

The main idea is to first start 3 servers, which automatically join nodes through `consul-server`. High availability is achieved by using anti-affinity to ensure only one consul-server is allowed per node.

Then start `consul-client`, which automatically joins nodes through `consul-server`.

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

Nodes with the `-ui` parameter can all serve as UI. Remember to use port 8500. I won't write an example.

## Shortcomings

The restart mechanism wasn't done well. Should configure `livenessProbe` on the server, so it automatically restarts when it leaves. However, this isn't a big issue. Consul itself is quite stable and rarely has problems.

Mainly `consul-client`. After `consul-client` detects it has left the server node, it should directly restart and rejoin. But I didn't do this.

## Other Issues

### Encrypted Communication

Consul also supports encrypted communication between nodes, but I failed when configuring the client before, which is quite regrettable. Encrypted communication requires adding more configuration, which is troublesome, so I changed to unencrypted communication.

### Deregistration Failure

This problem has been encountered many times. Some services need to be manually deregistered 3 times (possibly because I have a server node). Some rogue services fail to deregister no matter how many times, which is quite unfortunate.

### Consul is Very Slow

In Consul's architecture, servers must be separated from clients. If services are directly registered to servers, and servers take on the role of service health checks, it will make the entire Consul very slow. I originally wanted to reduce the load by deregistering services, but it still failed. In the end, I migrated the configuration and rebuilt a Consul cluster, which was quite painful.

## Common APIs

```
# Deregister service
put /v1/agent/service/deregister/<serviceid>
# Get configuration
get /v1/kv/goms/config/<config>
# Get service list
get /v1/agent/services
# Query node status
get /v1/status/leader


```

## Reference Links

https://github.com/hashicorp/consul-helm
