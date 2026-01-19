Я немного ленился в последнее время. Я писал статьи, но они не были отполированы, поэтому я их не публиковал.

Сегодня я расскажу, как монтировать некоторые часто используемые ресурсы в k8s.

Текущая версия Kubernetes: 1.12.2

## env

### env

```
          env:
            - name: GIT_REPO
              value: 'ssh://git@127.0.0.1:22/a/b.git'
```

### Вложенный env

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

**Обратите внимание: изменение configmap не приведет к изменению смонтированных файлов/переменных окружения configmap в контейнерах; удаление configmap также не повлияет на переменные окружения/файлы внутри контейнеров, но после удаления configmap на смонтированном pod появится предупреждающее событие**

```
Events:
  Type     Reason       Age                 From                                         Message
  ----     ------       ----                ----                                         -------
  Warning  FailedMount  64s (x13 over 11m)  kubelet, cn-shenzhen.i-wz9498k1n1l7sx8bkc50  MountVolume.SetUp failed for volume "nginx" : configmaps "nginx" not found
```

Документация [config map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data) очень ясна, поэтому я бесстыдно скопирую ее здесь.

**Обратите внимание: configmap имеет ограничение в 1M, обычно используется для монтирования небольших конфигураций. Для больших конфигураций рекомендуется использовать центр конфигурации.**

### Монтирование одного элемента
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
        # Определить переменную окружения
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              # ConfigMap, содержащий значение, которое вы хотите присвоить SPECIAL_LEVEL_KEY
              name: special-config
              # Указать ключ, связанный со значением
              key: special.how
  restartPolicy: Never
```

Это монтирует элемент `special.how` из configmap `special-config`.

### Монтирование всего ConfigMap

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

Ссылки:

1. [Add nginx.conf to Kubernetes cluster](https://stackoverflow.com/questions/42078080/add-nginx-conf-to-kubernetes-cluster)
2. [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data)

### fieldRef

Может монтировать некоторые свойства pod

```
          env:
          - name: MY_POD_IP
            valueFrom:
              fieldRef:
                fieldPath: status.podIP

```

Выбирает поле pod: поддерживает metadata.name, metadata.namespace, metadata.labels, metadata.annotations, spec.nodeName, spec.serviceAccountName, status.hostIP, status.podIP.


### resourceFieldRef

Выбирает ресурс контейнера: в настоящее время поддерживаются только ограничения и запросы ресурсов (limits.cpu, limits.memory, limits.ephemeral-storage, requests.cpu, requests.memory и requests.ephemeral-storage).

Английская документация объясняет это ясно - используется для монтирования ограничений ресурсов (CPU/память) контейнеров в текущем yaml. На самом деле используется реже. Кроме того, может быть объединен с `downloadAPI`.

Обратите внимание, что `containerName` не может быть неправильно настроен, иначе статус pod станет `CreateContainerConfigError`.

```
          env:  
            - name: a
              valueFrom: 
                 resourceFieldRef:
                      containerName: nginx-test2
                      resource: limits.cpu
```



### secretKeyRef

Выбирает ключ секрета в пространстве имен pod

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

Ссылки:
1. [Подробное объяснение использования Secret в Kubernetes](https://blog.csdn.net/yan234280533/article/details/77018640)
2. https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#envvarsource-v1-core


## Монтирование директорий/файлов

k8s может монтировать слишком много ресурсов, поэтому я выберу несколько представительных для обсуждения.

Этот тип ресурса обычно должен сначала определить `volumes` на уровне spec, а затем определить `volumeMounts` в `containers`, что имеет смысл сначала объявить, а затем использовать.

### hostPath (Директория/файл хоста)

1. Для существующих директорий/файлов используйте `Directory`/`File` + nodeSelector
  Но после использования `nodeSelector` будущее масштабирование будет на соответствующих узлах. Если есть только 1 узел, и набор реплик превышает то, что фактический узел может обработать, это в конечном итоге приведет к проблеме единой точки отказа. Это требует внимания.
1. Для приложений, которые читают/пишут пустые файлы при запуске, используйте `DirectoryOrCreate` или `FileOrCreate`

Ниже демонстрируется первый подход.


    # Пометьте узел (здесь опущено)
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


#### Монтирование одного элемента (Метод 1)

Это монтирование поддерживает горячее обновление. Изменения будут видны примерно через 10 секунд после изменения.

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

#### Монтирование одного элемента (Метод 2)

Этот метод монтирования не поддерживает горячее обновление.

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

#### Полное монтирование

Это монтирование поддерживает горячее обновление. Изменения будут видны примерно через 10 секунд после изменения.

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

#### Монтирование одного элемента

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


#### Полное монтирование

Здесь используются определенные разрешения для монтирования файлов. По умолчанию, похоже, 777.

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
Например, секрет, созданный с этим паттерном, будет иметь файлы `id_rsa`, `id_rsa.pub` и `known_hosts` в директории `/root/.ssh` внутри контейнера.

### downwardAPI


Ссылки:
1. [volumes](https://kubernetes.io/docs/concepts/storage/volumes/)
1. [kubernetes-api/v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#hostpathvolumesource-v1-core)
