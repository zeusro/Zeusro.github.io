## 最大の落とし穴は非推奨のapiVersionです

`Kubernetes`の`apiVersion`は期限切れになる可能性があります

1.16の場合、`DaemonSet`、`Deployment`、`StatefulSet`、`ReplicaSet`はすべて`apps/v1`を統一して使用します

`NetworkPolicy`は`networking.k8s.io/v1`を使用します

`PodSecurityPolicy`は`networking.k8s.io/v1`を使用します

したがって、`1.16`で`apps/v1beta2`、`extensions/v1beta1`などの非推奨APIを使用するとエラーになります。

## 変化を受け入れる


### 影響を受けるリソースを確認

```bash
kubectl get NetworkPolicy,PodSecurityPolicy,DaemonSet,Deployment,ReplicaSet \
--all-namespaces \
-o 'jsonpath={range .items[*]}{.metadata.annotations.kubectl\.kubernetes\.io/last-applied-configuration}{"\n"}{end}' | grep '"apiVersion":"extensions/v1beta1"'

kubectl get DaemonSet,Deployment,StatefulSet,ReplicaSet \
--all-namespaces \
-o 'jsonpath={range .items[*]}{.metadata.annotations.kubectl\.kubernetes\.io/last-applied-configuration}{"\n"}{end}' | grep '"apiVersion":"apps/v1beta'

kubectl get --raw="/metrics" | grep apiserver_request_count | grep 'group="extensions"' | grep 'version="v1beta1"' | grep -v ingresses | grep -v 'client="hyperkube' | grep -v 'client="kubectl' | grep -v 'client="dashboard'

kubectl get --raw="/metrics" | grep apiserver_request_count | grep 'group="apps"' | grep 'version="v1beta' | grep -v 'client="hyperkube' | grep -v 'client="kubectl' | grep -v 'client="dashboard'

```

### recreate

はい、聞き間違いではありません。削除して再作成するしかありません。

私の提案は、ビジネスの低ピーク時に、同じラベルでdeployを作成して古い`resource`をカバーし、古い`resource`を0にスケールし、`deprecated:true`の`label`を追加してしばらく観察した後、完全に削除することです。

## 後記

apiVersionの変更の頻度は、ある程度、`Kubernetes`のコンテナスケジューリングにおける覇権を証明することもできます—結局のところ、ガールフレンドと別れた場合、新しい服を買いたくないでしょう、そうでしょう？

![](/img/sticker/云原生开发.gif)

## 参考リンク

1. [error: At least one of apiVersion, kind and name was changed](https://stackoverflow.com/questions/56386647/error-at-least-one-of-apiversion-kind-and-name-was-changed)
1. [Kubernetes Version 1.16 Removes Deprecated APIs](https://www.ibm.com/cloud/blog/announcements/kubernetes-version-1-16-removes-deprecated-apis)
1. [Kubernetes v1.17バージョンの解釈](https://yq.aliyun.com/articles/739120)
1. [API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
1. [Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)
