Kubernetesクラスター管理の経験（教訓）

**2020-02-26更新：この記事は再更新されました。 [Kubernetesクラスター管理の経験](https://github.com/zeusro/awesome-kubernetes-notes/blob/master/source/chapter_6.md)に移動してください**

## ノードの問題

### ノードを削除する正しい手順

```bash
# SchedulingDisabled、新しいコンテナがこのノードにスケジュールされないようにする
kubectl cordon $node
# daemonsets以外のすべてのpodを追い出す
kubectl drain $node   --ignore-daemonsets
kubectl delete $node
```

### ノードをメンテナンスする正しい手順

```bash
# SchedulingDisabled、新しいコンテナがこのノードにスケジュールされないようにする
kubectl cordon $node
# daemonsets以外のすべてのpodを追い出す
kubectl drain $node --ignore-daemonsets --delete-local-data
# メンテナンスが完了したら、正常な状態に復元する
kubectl uncordon $node
```

--delete-local-dataは`emptyDir`のような一時ストレージを無視することを意味します

### ImageGCFailed

> 
>   kubeletは未使用のコンテナとイメージをクリーンアップできます。kubeletは毎分と5分ごとにコンテナとイメージをそれぞれ回収します。
> 
>   [kubeletガベージコレクションの設定](https://k8smeetup.github.io/docs/concepts/cluster-administration/kubelet-garbage-collection/)

しかし、kubeletのガベージコレクションには問題があります。未使用のイメージのみを回収でき、`docker system prune`に似ています。しかし、観察により、死んだコンテナが最大の問題ではなく、実行中のコンテナがより大きな問題であることがわかりました。ImageGCFailedが継続的に発生し、コンテナのephemeral-storage/hostpath（ホストディレクトリ）の使用量が増加し続けると、最終的により深刻なDiskPressure問題につながり、ノード上のすべてのコンテナに影響します。


推奨事項：

1. 高スペックマシン（4コア32G以上）の場合、dockerディレクトリに100G以上のSSDスペースを設定する
1. [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/#storage-resource-quota)を設定して、全体的なリソースクォータを制限する
1. コンテナ側でephemeral-storage（ローカルファイル書き込み）を無効にするか、spec.containers[].resources.limits.ephemeral-storageを使用してホストディレクトリへの書き込みを制限および制御する

### ノードのディスク圧力（DiskPressure）

```
--eviction-hard=imagefs.available<15%,memory.available<300Mi,nodefs.available<10%,nodefs.inodesFree<5%
```

kubeletは起動時にディスク圧力を指定します。阿里云を例にとると、`imagefs.available<15%`は、コンテナの読み書き層が15%未満の場合、ノードが追い出されることを意味します。ノードの追い出しの結果は、DiskPressureの発生であり、ディスク問題が解決されるまで、ノードはもうイメージを実行できません。ノード上のコンテナがホストディレクトリを使用している場合、この問題は致命的になります。ディレクトリを削除することはできませんが、これらのホストディレクトリの蓄積がノードの追い出しを引き起こしました。

したがって、良い習慣を身につけてください。コンテナ内にランダムに書き込まない（コンテナ内にファイルを書き込むとephemeral-storageが占有され、ephemeral-storageが多すぎるとpodが追い出されます）、ステートレスコンテナをより多く使用し、ストレージ方法を慎重に選択し、hostpathストレージを使用しないようにしてください。

これが発生すると、本当に泣きたくても涙が出ない気持ちになります。

```
Events:
  Type     Reason                 Age                   From                                            Message
  ----     ------                 ----                  ----                                            -------
  Warning  FreeDiskSpaceFailed    23m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 5182058496 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  ImageGCFailed          18m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 6089891840 bytes, but freed 0 bytes
  Warning  FreeDiskSpaceFailed    13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Warning  ImageGCFailed          13m                   kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4953321472 bytes, but freed 0 bytes
  Normal   NodeHasNoDiskPressure  10m (x5 over 47d)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasNoDiskPressure
  Normal   Starting               10m                   kube-proxy, node.xxxx1  Starting kube-proxy.
  Normal   NodeHasDiskPressure    10m (x4 over 42m)     kubelet, node.xxxx1     Node node.xxxx1 status is now: NodeHasDiskPressure
  Warning  EvictionThresholdMet   8m29s (x19 over 42m)  kubelet, node.xxxx1     Attempting to reclaim ephemeral-storage
  Warning  ImageGCFailed          3m4s                  kubelet, node.xxxx1     failed to garbage collect required amount of images. Wanted to free 4920913920 bytes, but freed 0 bytes
```

ImageGCFailedは非常に問題のある状態です。この状態が表示されると、kubeletがディスクを回収しようとしたが失敗したことを意味します。この時点で、マシンに手動で修正する必要があるかどうかを検討してください。

推奨事項：

1. イメージ数が200を超える場合、100G SSDを購入してイメージを保存する
1. 一時ストレージ（empty-dir、hostpathなど）を少なく使用する

参考リンク：

1. [Eviction Signals](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#eviction-signals)
1. [10の図でDockerコンテナとイメージを深く理解する](http://dockone.io/article/783)


### ノードCPUの急上昇

ノードがGC（コンテナGC/イメージGC）を実行している可能性があります。`describe node`で確認してください。この状況に一度遭遇し、最終的にノード上のコンテナが大幅に減少し、少しイライラしました。

```
Events:
  Type     Reason                 Age                 From                                         Message
  ----     ------                 ----                ----
  Warning  ImageGCFailed          45m                 kubelet, cn-shenzhen.xxxx  failed to get image stats: rpc error: code = DeadlineExceeded desc = context deadline exceeded
```

参考：

[kubeletソースコード分析：ガベージコレクション](https://cizixs.com/2017/06/09/kubelet-source-code-analysis-part-3/)

### ノードの切断（unknown）

```
  Ready                False   Fri, 28 Jun 2019 10:19:21 +0800   Thu, 27 Jun 2019 07:07:38 +0800   KubeletNotReady              PLEG is not healthy: pleg was last seen active 27h14m51.413818128s ago; threshold is 3m0s

Events:
  Type     Reason             Age                 From                                         Message
  ----     ------             ----                ----                                         -------
  Warning  ContainerGCFailed  5s (x543 over 27h)  kubelet, cn-shenzhen.xxxx                    rpc error: code = DeadlineExceeded desc = context deadline exceeded
```
ホストにSSHでログインした後、dockerサービスはまだ実行されていましたが、`docker ps`が固まっていました。そこで、カーネルを5.1にアップグレードして再起動しました。

後で、誰かが問題のあるイメージをデプロイし、どのノードで実行してもノードをクラッシュさせることがわかりました。それはイライラしました。

unknownは非常に深刻な問題であり、真剣に取り組む必要があります。ノードがunknownになると、kubernetes master自体はノード上のコンテナが生きているか死んでいるかを知りません。unknownノード上で非常に重要なコンテナが実行されており、たまたまクラッシュした場合、kubernetesは自動的に別のコンテナを起動しません。これは注意すべき点です。

参考リンク：

[PLEGの問題でReady/NotReadyの間でフラッピングするノード](https://github.com/kubernetes/kubernetes/issues/45419)
[Kubernetes Pod Disruption Budgets（PDB）の詳細分析](https://my.oschina.net/jxcdwangtao/blog/1594348)

### SystemOOM

`SystemOOM`は必ずしもマシンのメモリが使い果たされたことを意味するわけではありません。dockerがコンテナのメモリを制御している場合があります。

デフォルトでは、Dockerの保存場所は次のとおりです：/var/lib/docker/containers/$id

このディレクトリには重要なファイルがあります：`hostconfig.json`。部分的な抜粋は次のようになります：

```json
	"MemorySwappiness": -1,
	"OomKillDisable": false,
	"PidsLimit": 0,
	"Ulimits": null,
	"CpuCount": 0,
	"CpuPercent": 0,
	"IOMaximumIOps": 0,
	"IOMaximumBandwidth": 0
}
```

`"OomKillDisable": false,`は、dockerサービスがリソース制限を超えるコンテナをプロセスを殺す/再起動することで調和することを防ぎ、代わりに他の方法で制裁します（詳細は[ここ](https://docs.docker.com/config/containers/resource_constraints/)を参照）

### docker daemonの固まり

この状況に一度遭遇しました。理由は、問題のあるコンテナがノード全体に影響を与えたことです。

この問題は迅速に解決する必要があります。ノード上のすべてのpodがunknownになるためです。

```bash
systemctl daemon-reexec
systemctl restart docker（状況に応じてオプション）
systemctl restart kubelet
```

深刻な場合は、ノードを再起動し、関連するコンテナを停止するしかありません。

推奨事項：`コンテナのliveness/readinessにはtcp/httpget方式を使用し、execの高頻度使用を避ける`
## pod


### podの頻繁な再起動

多くの理由があり、一概には言えません

1つの状況は、deployがヘルスチェックを設定し、ノードが正常に実行されているが、ノードの負荷が高すぎてヘルスチェックが失敗した（load15が2以上で長期間）、頻繁なBackoffです。不健全なしきい値を上げ、ノードの負荷を下げた後、問題が解決しました。

```yaml

          livenessProbe:
            # 不健全なしきい値
            failureThreshold: 3
            initialDelaySeconds: 5
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 8080
            timeoutSeconds: 1
```

### リソースがlimit設定値に達した

limitを上げるか、アプリケーションを確認する

### Readiness/Liveness connection refused

Readinessチェックの失敗も再起動しますが、`Readiness`チェックの失敗が必ずしもアプリケーションの問題であるとは限りません。ノード自体が過負荷の場合、connection refusedまたはtimeoutも発生する可能性があります。

この問題はノードで調査する必要があります。


### podの追放（Evicted）

1. ノードにtaintが追加され、podが追放された
1. ephemeral-storageが制限を超えて追放された
    1. EmptyDirの使用量がSizeLimitを超える場合、このpodは追放されます
    1. Containerの使用量（ログ、overlayパーティションがない場合はimagefsを含む）がlimitを超える場合、このpodは追放されます
    1. Podのローカル一時ストレージの総使用量（すべてのemptydirとcontainer）がpod内のすべてのcontainerのlimitの合計を超える場合、podは追放されます

ephemeral-storageはpodが使用する一時ストレージです。
```
resources:
       requests: 
           ephemeral-storage: "2Gi"
       limits:
           ephemeral-storage: "3Gi"
```
ノードが追放された後、get poでまだ見ることができます。describeコマンドを使用して、追放の履歴的な理由を確認できます。

> Message:            The node was low on resource: ephemeral-storage. Container codis-proxy was using 10619440Ki, which exceeds its request of 0.


参考：
1. [Kubernetes pod ephemeral-storage設定](https://blog.csdn.net/hyneria_hope/article/details/79467922)
1. [コンテナのコンピュートリソースの管理](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/)


### kubectl execコンテナへの進入失敗

codis-serverをセットアップしているときにこの問題に遭遇しました。その時、readinessとヘルスチェックが設定されていませんでした。しかし、podの説明を取得すると、runningと表示されました。実際、この時点で、コンテナはすでに異常でした。

```
~ kex codis-server-3 sh
rpc error: code = 2 desc = containerd: container not found
command terminated with exit code 126
```

解決策：このpodを削除し、`livenessProbe`を設定する


### podの仮想ホスト名

`Deployment`から派生したpodの場合、`virtual host name`は`pod name`です。

`StatefulSet`から派生したpodの場合、`virtual host name`は`<pod name>.<svc name>.<namespace>.svc.cluster.local`です。`Deployment`と比較して、より規則的です。また、他のpodからのアクセスをサポートします。


### podの連続Crashbackoff

`Crashbackoff`には多くの原因があります。

サンドボックスの作成（FailedCreateSandBox）の失敗は、主にcniネットワークプラグインの問題です。

イメージのプルには中国の特色のある問題があり、大きすぎる可能性があり、プルが遅いです。

コンテナの同時実行が高すぎて、トラフィックの雪崩を引き起こしている可能性もあります。

たとえば、現在3つのコンテナabcがあります。aが突然トラフィックの急増に遭遇し、内部クラッシュを引き起こし、その後`Crashbackoff`になり、aは`service`によって削除されます。残りのbcはそれほど多くのトラフィックを処理できず、連続してクラッシュし、最終的にウェブサイトがアクセス不能になります。この状況は、高同時実行ウェブサイト+低効率のWebコンテナでよく見られます。

コードを変更せずに、最適な解決策は、レプリカ数を増やし、HPAを追加して動的スケーリングを実現することです。

### DNSの非効率性

コンテナ内でnscd（ドメイン名キャッシュサービス）を有効にすると、解決パフォーマンスが大幅に向上します。

本番環境でalpineをベースイメージとして使用することは厳禁です（DNS解決リクエストの異常を引き起こします）

## deploy

### MinimumReplicationUnavailable

`deploy`がSecurityContextを設定したが、api-serverが拒否した場合、この状況が発生します。api-serverコンテナ内で、`SecurityContextDeny`起動パラメータを削除します。

[Using Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/)を参照

## service

### サービスを作成したが、対応するpoがない場合、何が起こるか？

リクエストはrequest timeoutまで応答がありません

参考

1. [Configure Out Of Resource Handling](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/#node-conditions)


### service connection refuse

考えられる理由：

1. podがreadinessProbeを設定していない、リクエストが準備ができていないpodに送信される
1. kube-proxyがダウンしている（kube-proxyはリクエストの転送を担当）
1. ネットワークの過負荷


### serviceに負荷分散がない

`headless service`が使用されているかどうかを確認してください。`headless service`は自動的に負荷分散しません...

```yaml
kind: Service
spec:
# clusterIP: Noneが`headless service`です
  type: ClusterIP
  clusterIP: None
```

具体的な動作：serviceには独自の仮想IPがなく、nslookupはすべてのpodのIPを表示します。しかし、pingするときは、最初のpodのIPのみが表示されます。

```bash
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.31.10.94 172-31-10-94.consul.default.svc.cluster.local
Address 2: 172.31.10.95 172-31-10-95.consul.default.svc.cluster.local
Address 3: 172.31.11.176 172-31-11-176.consul.default.svc.cluster.local

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.973 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.170 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.170/0.571/0.973 ms

/ # ping consul
PING consul (172.31.10.94): 56 data bytes
64 bytes from 172.31.10.94: seq=0 ttl=62 time=0.206 ms
64 bytes from 172.31.10.94: seq=1 ttl=62 time=0.178 ms
^C
--- consul ping statistics ---
2 packets transmitted, 2 packets received, 0% packet loss
round-trip min/avg/max = 0.178/0.192/0.206 ms
```


通常のtype: ClusterIP serviceの場合、nslookupはサービス自身のIPを表示します

```BASH
/ # nslookup consul
nslookup: can't resolve '(null)': Name does not resolve

Name:      consul
Address 1: 172.30.15.52 consul.default.svc.cluster.local
```

## ReplicationControllerが更新されない

ReplicationControllerはapplyで更新されるのではなく、`kubectl rolling-update`で更新されます。しかし、このコマンドも廃止され、`kubectl rollout`に置き換えられました。したがって、`kubectl rollout`を更新手段として使用するか、怠惰に、apply fileの後にdelete poを実行する必要があります。

できるだけdeployを使用してください。

## StatefulSet

### podの更新失敗

StatefulSetは1つずつ更新されます。`Crashbackoff`のコンテナがあるかどうかを観察してください。このコンテナが更新を停止させた可能性があります。削除してください。

### unknown pod

StatefulSetがバインドするpodの状態がunknownになった場合、これは非常に問題があります。StatefulSetはpodを再作成しません。

これにより、外部リクエストが継続的に失敗します。

総合的な推奨事項：`StatefulSet`を使用せず、operatorパターンに置き換えてください。

## [kube-apiserver](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-apiserver/)

`kube-apiserver`は`master`上で実行される特殊なコンテナのセットです。阿里云kubernetesを例にとると（`kubeadm`で作成されたkubernetesも同様）

`/etc/kubernetes/manifests/`の下に3つのファイルが定義されています
1. kube-apiserver.yaml
1. kube-controller-manager.yaml
1. kube-scheduler.yaml

masterノードはこのディレクトリ内のファイルの変更を自動的に監視し、必要に応じて自動的に再起動します。

したがって、`api server`の設定を変更するには、`kube-apiserver.yaml`を変更し、保存して終了するだけで、対応するコンテナが再起動します。同様に、設定を間違えて変更すると、`api server`は起動に失敗します。変更する前に、必ず[ドキュメント](https://kubernetes.io/zh/docs/concepts/overview/kubernetes-api/)を注意深く読んでください。

## 阿里云Kubernetesの問題

### デフォルトingressの変更

ingressを指す新しいロードバランサー型svcを作成し、`kube-system`の下の`nginx-ingress-controller`の起動パラメータを変更します。

```
        - args:
            - /nginx-ingress-controller
            - '--configmap=$(POD_NAMESPACE)/nginx-configuration'
            - '--tcp-services-configmap=$(POD_NAMESPACE)/tcp-services'
            - '--udp-services-configmap=$(POD_NAMESPACE)/udp-services'
            - '--annotations-prefix=nginx.ingress.kubernetes.io'
            - '--publish-service=$(POD_NAMESPACE)/<カスタムsvc>'
            - '--v=2'
```

### LoadBalancerサービスにIPがない

具体的な動作は、EXTERNAL-IPが常にpendingと表示されることです。

```bash
~ kg svc consul-web
NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
consul-web   LoadBalancer   172.30.13.122   <pending>     443:32082/TCP   5m  
```

この問題は[Alibaba Cloud Provider](https://yq.aliyun.com/articles/626066)コンポーネントに関連しています。`cloud-controller-manager`には3つのコンポーネントがあり、内部でリーダー選出が必要です。どこかでエラーが発生した可能性があります。その時、問題のある`pod`の1つを削除したところ、修正されました。

### Statefulset動的PVCのクリーンアップ

現在、阿里云`Statefulset`動的PVCはnasを使用しています。

1. このタイプのストレージの場合、まずコンテナのレプリカを0にするか、`Statefulset`全体を削除する必要があります。
1. PVCを削除する
1. nasを任意のサーバーにマウントし、pvcに対応するnasディレクトリを削除する

### v1.12.6-aliyun.1にアップグレード後、ノードの割り当て可能メモリが減少

このバージョンは各ノードに1Giを予約し、クラスター全体でN GB（Nはノード数）少なくなり、Podの割り当てに使用できます。

ノードが4Gで、Podが3Gをリクエストする場合、非常に追放されやすくなります。

推奨事項：ノードの仕様を向上させる。

```
Server Version: version.Info{Major:"1", Minor:"12+", GitVersion:"v1.12.6-aliyun.1", GitCommit:"8cb561c", GitTreeState:"", BuildDate:"2019-04-22T11:34:20Z", GoVersion:"go1.10.8", Compiler:"gc", Platform:"linux/amd64"}
```

### 新しいノードにNetworkUnavailableが表示される

RouteController failed to create a route

kubernetes eventsを確認し、以下が表示されているかどうかを確認してください：

```
timed out waiting for the condition -> WaitCreate: ceate route for table vtb-wz9cpnsbt11hlelpoq2zh error, Aliyun API Error: RequestId: 7006BF4E-000B-4E12-89F2-F0149D6688E4 Status Code: 400 Code: QuotaExceeded Message: Route entry quota exceeded in this route table  
```

この問題は[VPCのカスタムルートエントリ制限](https://help.aliyun.com/document_detail/27750.html)に達したために発生します。デフォルトは48です。`vpc_quota_route_entrys_num`のクォータを増やす必要があります。

### LoadBalancer svcへのアクセスでランダムにトラフィック転送の異常が発生

参照
[[bug]阿里云kubernetes版がloadbalancer service portをチェックせず、トラフィックが異常に転送される](https://github.com/kubernetes/cloud-provider-alibaba-cloud/issues/57)
簡単に言えば、同じSLBに同じsvcポートを持つことはできません。そうしないと、盲目に転送されます。

公式声明：
> 同じSLBを再利用する複数のServiceは、同じフロントエンドリスニングポートを持つことはできません。そうしないと、ポートの競合が発生します。


### コンソールに表示されるノードのメモリ使用率が常に大きい

[Dockerコンテナメモリ監視](https://xuxinkun.github.io/2016/05/16/memory-monitor-with-cgroup/)

理由は、コンソールがusage_in_bytes（cache+buffer）を使用しているため、クラウド監視で見られる数値よりも大きくなることです。


### Ingress Controllerの神秘的な最適化

kube-systemの下のnginx-configurationという名前のconfigmapを変更する

```
proxy-connect-timeout: "75" 
proxy-read-timeout: "75" 
proxy-send-timeout: "75" 
upstream-keepalive-connections: "300" 
upstream-keepalive-timeout: "300" 
upstream-keepalive-requests: "1000" 
keep-alive-requests: "1000" 
keep-alive: "300"
disable-access-log: "true" 
client-header-timeout: "75" 
worker-processes: "16"
```

注意：1つの項目が1つの設定に対応し、1つのファイルではありません。フォーマットはおおよそ次のとおりです：

```
➜  ~ kg cm nginx-configuration -o yaml
apiVersion: v1
data:
  disable-access-log: "true"
  keep-alive: "300"
  keep-alive-requests: "1000"
  proxy-body-size: 20m
  worker-processes: "16"
  ......
```

### pidの問題

```
Message: **Liveness probe failed: rpc error: code = 2 desc = oci runtime error: exec failed: container_linux.go:262: starting container process caused "process_linux.go:86: adding pid 30968 to cgroups caused \"failed to write 30968 to cgroup.procs: write /sys/fs/cgroup/cpu,cpuacct/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podfe4cc065_cc58_11e9_bf64_00163e08cd06.slice/docker-0447a362d2cf4719ae2a4f5ad0f96f702aacf8ee38d1c73b445ce41bdaa8d24a.scope/cgroup.procs: invalid argument\""
```

阿里云の初期化ノードで使用されるcentosバージョンは古く、カーネルは3.1です。Centos7.4のカーネル3.10はまだpid/fdのcgroup制限をサポートしていないため、このタイプの問題が発生します。

推奨事項：

1. ノードを手動でメンテナンスし、5.xカーネルにアップグレードする（現在、一部のノードが5.xにアップグレードされていますが、dockerバージョンはまだ17.6.2です。継続的に観察中〜）
1. [NPD](https://github.com/AliyunContainerService/node-problem-detector) + [eventer](https://github.com/AliyunContainerService/kube-eventer)をインストールし、イベントメカニズムを利用して管理者に手動メンテナンスを促す

### OSS PVC FailedMount

PVでaccess key、access secret + PVCを指定することでOSSを使用できます。ある日、あるdeployがFailedMountの問題に遭遇し、阿里云の開発エンジニアに連絡したところ、flexvolumeが初回実行のノードで実行すると問題が発生し、「再登録」させる必要があるとのことでした。

影響を受けるバージョン：registry-vpc.cn-shenzhen.aliyuncs.com/acs/flexvolume:v1.12.6.16-1f4c6cb-aliyun

解決策：

```bash
touch /usr/libexec/kubernetes/kubelet-plugins/volume/exec/alicloud~oss/debug
```

参考（アプリケーションスケジューリング関連）：
1. [Kubernetesのヘルスチェックとサービス依存関係の処理](http://dockone.io/article/2587)
2. [kubernetesはサービス依存関係をどのように解決しますか？](https://ieevee.com/tech/2017/04/23/k8s-svc-dependency.html)
5. [Kubernetesの道1 - Javaアプリケーションリソース制限の誤解](https://yq.aliyun.com/articles/562440?spm=a2c4e.11153959.0.0.5e0ed55aq1betz)
8. [ノードでのCPU管理ポリシーの制御](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/#cpu-management-policies)
1. [システムデーモン用のコンピュートリソースの予約](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)
1. [リソース不足の処理の設定](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)
