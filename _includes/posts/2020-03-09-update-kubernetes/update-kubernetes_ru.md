## Самая большая ловушка — устаревший apiVersion

`apiVersion` в `Kubernetes` может истечь.

Для 1.16 `DaemonSet`, `Deployment`, `StatefulSet`, `ReplicaSet` все единообразно используют `apps/v1`

`NetworkPolicy` использует `networking.k8s.io/v1`

`PodSecurityPolicy` использует `networking.k8s.io/v1`

Поэтому использование устаревших API, таких как `apps/v1beta2`, `extensions/v1beta1` в `1.16`, вызовет ошибку.

## Принять изменения


### Проверить затронутые ресурсы

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

Да, вы не ослышались, можно только удалить и пересоздать.

Мое предложение: в период низкой нагрузки бизнеса создать deploy с тем же label, чтобы покрыть старый `resource`, масштабировать старый `resource` до 0 и добавить `label` `deprecated:true`, понаблюдать некоторое время, затем полностью удалить.

## Послесловие

Частота изменений apiVersion в некоторой степени также может доказать гегемонию `Kubernetes` в планировании контейнеров—в конце концов, если вы расстаетесь с подругой, вы не захотите покупать ей новую одежду, верно?

![](/img/sticker/云原生开发.gif)

## Ссылки

1. [error: At least one of apiVersion, kind and name was changed](https://stackoverflow.com/questions/56386647/error-at-least-one-of-apiversion-kind-and-name-was-changed)
1. [Kubernetes Version 1.16 Removes Deprecated APIs](https://www.ibm.com/cloud/blog/announcements/kubernetes-version-1-16-removes-deprecated-apis)
1. [Интерпретация версии Kubernetes v1.17](https://yq.aliyun.com/articles/739120)
1. [API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
1. [Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)
