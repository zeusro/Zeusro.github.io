最近少し手を抜いていました。記事は書いていましたが、完成していないので公開していませんでした。

今日はk8sでよく使われるリソースをマウントする方法を紹介します。

現在のKubernetesバージョン：1.12.2

## env

### env

```
          env:
            - name: GIT_REPO
              value: 'ssh://git@127.0.0.1:22/a/b.git'
```

### ネストされたenv

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

**注意：configmapを変更しても、コンテナ内のマウントされたconfigmapファイル/環境変数は変更されません。configmapを削除しても、コンテナ内の環境変数/ファイルには影響しませんが、configmapを削除した後、マウントされたpodに警告イベントが表示されます**

```
Events:
  Type     Reason       Age                 From                                         Message
  ----     ------       ----                ----                                         -------
  Warning  FailedMount  64s (x13 over 11m)  kubelet, cn-shenzhen.i-wz9498k1n1l7sx8bkc50  MountVolume.SetUp failed for volume "nginx" : configmaps "nginx" not found
```

[config map](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data)のドキュメントは非常に明確なので、ここで恥知らずにコピーします。

**注意：configmapには1Mの制限があり、通常は小さな設定をマウントするために使用されます。大量の設定の場合は、設定センターを使用することをお勧めします。**

### 単一項目のマウント
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
        # 環境変数を定義
        - name: SPECIAL_LEVEL_KEY
          valueFrom:
            configMapKeyRef:
              # SPECIAL_LEVEL_KEYに割り当てたい値を含むConfigMap
              name: special-config
              # 値に関連付けられたキーを指定
              key: special.how
  restartPolicy: Never
```

これは`special-config`というconfigmapの`special.how`項目をマウントします。

### 完全なconfigmapのマウント

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

参考：

1. [Add nginx.conf to Kubernetes cluster](https://stackoverflow.com/questions/42078080/add-nginx-conf-to-kubernetes-cluster)
2. [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/#define-container-environment-variables-using-configmap-data)

### fieldRef

podの一部のプロパティをマウントできます

```
          env:
          - name: MY_POD_IP
            valueFrom:
              fieldRef:
                fieldPath: status.podIP

```

podのフィールドを選択：metadata.name、metadata.namespace、metadata.labels、metadata.annotations、spec.nodeName、spec.serviceAccountName、status.hostIP、status.podIPをサポートします。


### resourceFieldRef

コンテナのリソースを選択：現在サポートされているのは、リソースの制限とリクエスト（limits.cpu、limits.memory、limits.ephemeral-storage、requests.cpu、requests.memory、requests.ephemeral-storage）のみです。

英語のドキュメントでは明確に説明されています - 現在のyaml内のコンテナのリソース（CPU/メモリ）制限をマウントするために使用されます。実際にはあまり使用されません。さらに、`downloadAPI`と組み合わせることができます。

`containerName`を誤って設定すると、podの状態が`CreateContainerConfigError`になることに注意してください。

```
          env:  
            - name: a
              valueFrom: 
                 resourceFieldRef:
                      containerName: nginx-test2
                      resource: limits.cpu
```



### secretKeyRef

podの名前空間内のシークレットのキーを選択

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

参考：
1. [KubernetesでのSecret使用の詳細説明](https://blog.csdn.net/yan234280533/article/details/77018640)
2. https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#envvarsource-v1-core


## ディレクトリ/ファイルのマウント

k8sがマウントできるリソースは多すぎるので、代表的なものをいくつか選んで説明します。

このタイプのリソースは、通常、まずspecレベルで`volumes`を定義し、次に`containers`で`volumeMounts`を定義する必要があります。これは、まず宣言してから使用するという意味です。

### hostPath（ホストディレクトリ/ファイル）

1. 既存のディレクトリ/ファイルには、`Directory`/`File` + nodeSelectorを使用
  ただし、`nodeSelector`を使用すると、今後のスケーリングは一致するノードで行われます。ノードが1つしかなく、レプリカセットが実際のノードが処理できる範囲を超えると、最終的に単一障害点の問題が発生します。これには注意が必要です。
1. 起動時に空のファイルを読み書きするアプリケーションには、`DirectoryOrCreate`または`FileOrCreate`を使用

以下は最初のアプローチを示しています。


    # ノードにラベルを付ける（ここでは省略）
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


#### 単一項目のマウント（方法1）

このマウントはホットアップデートをサポートします。変更後約10秒で変更が表示されます。

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

#### 単一項目のマウント（方法2）

このマウント方法はホットアップデートをサポートしません。

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

#### 完全マウント

このマウントはホットアップデートをサポートします。変更後約10秒で変更が表示されます。

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

#### 単一項目のマウント

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


#### 完全マウント

ここでは特定の権限を使用してファイルをマウントします。デフォルトは777のようです。

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
たとえば、このパターンで作成されたシークレットは、コンテナ内の`/root/.ssh`ディレクトリに`id_rsa`、`id_rsa.pub`、`known_hosts`の3つのファイルがあります。

### downwardAPI


参考リンク：
1. [volumes](https://kubernetes.io/docs/concepts/storage/volumes/)
1. [kubernetes-api/v1.12](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/#hostpathvolumesource-v1-core)
