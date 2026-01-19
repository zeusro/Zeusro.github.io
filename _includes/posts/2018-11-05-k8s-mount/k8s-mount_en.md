I've been slacking off a bit recently. I've been writing articles, but they're not polished, so I haven't published them.

Today I'll introduce how to mount some commonly used resources in k8s.

Current Kubernetes version: 1.12.2

## env

### env

```
          env:
            - name: GIT_REPO
              value: 'ssh://git@127.0.0.1:22/a/b.git'
```

### Nested env

```
          env:
            - name: spring.profiles.active
              value: 'product'
            - name: MY_POD_IP
              valueFrom:
                fieldRef:
                  fieldPath: status.podIP              
            - name: GOMS_API_HTTP_ADDR
              value: 'http://$(MY_POD_IP):9090'
```

### configMap

**Note: Modifying configmap will not cause mounted configmap files/environment variables in containers to change; deleting configmap will also not affect environment variables/files inside containers, but after deleting configmap, a warning event will appear on the mounted pod**

```
Events:
  Type     Reason       Age                 From                                         Message
  ----     ------       ----                ----                                         -------
  Warning  FailedMount  64s (x13 over 11m)  kubelet, cn-shenzhen.i-wz9498k1n1l7sx8bkc50  MountVolume.SetUp failed for volume "nginx" : configmaps "nginx" not found
```

The [config map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data) documentation is very clear, so I'll shamelessly copy it here.

**Note: configmap has a 1M limit, generally used to mount small configurations. For large configurations, it's recommended to use a configuration center.**

### Mount a Single Item
```
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "env" ]
      env:
        # Define the environment variable
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              # The ConfigMap containing the value you want to assign to SPECIAL_LEVEL_KEY
              name: special-config
              # Specify the key associated with the value
              key: special.how
  restartPolicy: Never
```

This mounts the `special.how` item from the `special-config` configmap.

### Mount Entire ConfigMap

```
apiVersion: v1
kind: Pod
metadata:
  name: dapi-test-pod
spec:
  containers:
    - name: test-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "env" ]
      envFrom:
      - configMapRef:
          name: special-config
  restartPolicy: Never
```

Reference:

1. [Add nginx.conf to Kubernetes cluster](https://stackoverflow.com/questions/42078080/add-nginx-conf-to-kubernetes-cluster)
2. [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data)

### fieldRef

Can mount some properties of the pod

```
          env:
          - name: MY_POD_IP
            valueFrom:
              fieldRef:
                fieldPath: status.podIP

```

Selects a field of the pod: supports metadata.name, metadata.namespace, metadata.labels, metadata.annotations, spec.nodeName, spec.serviceAccountName, status.hostIP, status.podIP.


### resourceFieldRef

Selects a resource of the container: only resources limits and requests (limits.cpu, limits.memory, limits.ephemeral-storage, requests.cpu, requests.memory and requests.ephemeral-storage) are currently supported.

The English documentation explains it clearly - used to mount resource (CPU/memory) limits of containers in the current yaml. It's actually used less frequently. Additionally, it can be combined with `downloadAPI`.

Note that `containerName` cannot be misconfigured, otherwise the pod status will become `CreateContainerConfigError`.

```
          env:  
            - name: a
              valueFrom: 
                 resourceFieldRef:
                      containerName: nginx-test2
                      resource: limits.cpu
```



### secretKeyRef

Selects a key of a secret in the pod's namespace

```
        env:
        - name: WORDPRESS_DB_USER
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: username
        - name: WORDPRESS_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysecret
              key: password
```

Reference:
1. [Detailed Explanation of Secret Usage in Kubernetes](https://blog.csdn.net/yan234280533/article/details/77018640)
2. https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#envvarsource-v1-core


## Directory/File Mounting

k8s can mount too many resources, so I'll pick some representative ones to discuss.

This type of resource generally needs to define `volumes` at the spec level first, then define `volumeMounts` in `containers`, which has a meaning of declaring first, then using.

### hostPath (Host Directory/File)

1. For existing directories/files, use `Directory`/`File` + nodeSelector
  But after using `nodeSelector`, future scaling will be on matching nodes. If there's only 1 node, and the replica set exceeds what the actual node can handle, it will eventually lead to a single point of failure. This needs attention.
1. For applications that read/write empty files on startup, use `DirectoryOrCreate` or `FileOrCreate`

The following demonstrates the first approach.


    # Label the node (omitted here)
    kubectl get node --show-labels

```
apiVersion: apps/v1beta2
kind: Deployment
metadata:  
  labels:
    app: nginx-test2
  name: nginx-test2
  namespace: test
spec:
  progressDeadlineSeconds: 600
  replicas: 1
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: nginx-test2
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        app: nginx-test2
    spec:
      containers:
        - image: 'nginx:1.15.4-alpine'
          imagePullPolicy: Always
          name: nginx-test2
          resources: {}
          terminationMessagePolicy: File
          volumeMounts:
            - name: host1
              mountPath: /etc/nginx/sites-enabled
            - name: host2
              mountPath: /etc/nginx/sites-enabled2/a.com.conf            
      nodeSelector: 
        kubernetes.io/hostname: cn-shenzhen.i-wz9aabuytimkomdmjabq        
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
      volumes:
        - name: host1
          hostPath:
            path: /root/site
            type: Directory
        - name: host2
          hostPath:
            path: /root/site/a.com.conf
            type: File            
```

### configMap


#### Single Item Mount (Method 1)

This mount supports hot updates. Changes will be visible about 10 seconds after modification.

```
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
  volumes:
    - name: config-vol
      configMap:
        name: log-config
        items:
          - key: log_level
            path: log_level
```

#### Single Item Mount (Method 2)

This mounting method does not support hot updates.

```
          volumeMounts:                  
            - name: nginx
              mountPath: /etc/nginx/nginx.conf
              subPath: nginx.conf                            
      volumes:             
          - name: nginx
            configMap:
              name: amiba-nginx 
```

#### Complete Mount

This mount supports hot updates. Changes will be visible about 10 seconds after modification.

```
      volumeMounts:
        - name: config-vol
          mountPath: /etc/config
  volumes:
    - name: config-vol
      configMap:
        name: log-config
```

### secret

#### Single Item Mount

```
  volumes:
  - name: secrets
    secret:
      secretName: mysecret
      items:
      - key: password
        mode: 511
        path: tst/psd
      - key: username
        mode: 511
        path: tst/usr
```


#### Complete Mount

Here specific permissions are used to mount files. The default seems to be 777.

```
          volumeMounts:
            - name: sshkey
              mountPath: /root/.ssh              
      volumes:
        - name: sshkey
          secret:           
           secretName: pull-gitea
           defaultMode: 0400    
```

```
 kubectl create secret generic pull-gitea  \
--from-file=id_rsa=/Volumes/D/temp/id_rsa  \
--from-file=id_rsa.pub=/Volumes/D/temp/id_rsa.pub  \
--from-file=known_hosts=/Volumes/D/temp/known_hosts \
```
For example, a secret created with this pattern will have `id_rsa`, `id_rsa.pub`, and `known_hosts` files in the `/root/.ssh` directory inside the container.

### downwardAPI


Reference Links:
1. [volumes](https://kubernetes.io/docs/concepts/storage/volumes/)
1. [kubernetes-api/v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#hostpathvolumesource-v1-core)
