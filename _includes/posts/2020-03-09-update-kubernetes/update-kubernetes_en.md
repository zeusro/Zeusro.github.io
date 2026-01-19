## The Biggest Pitfall is Deprecated apiVersion

`Kubernetes`'s `apiVersion` can expire.

For 1.16, `DaemonSet`, `Deployment`, `StatefulSet`, `ReplicaSet` all uniformly use `apps/v1`

`NetworkPolicy` uses `networking.k8s.io/v1`

`PodSecurityPolicy` uses `networking.k8s.io/v1`

So, using deprecated APIs like `apps/v1beta2`, `extensions/v1beta1` in `1.16` will error.

## Embrace Change


### Check Affected Resources

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

Yes, you heard right, you can only delete and recreate.

My suggestion is, during business low peak, create a deploy with the same label to cover the old `resource`, scale the old `resource` to 0, and add a `deprecated:true` `label`, observe for a period, then completely delete.

## Postscript

The frequency of apiVersion changes, to some extent, can also prove `Kubernetes`'s hegemony in container scheduling—after all, if you break up with your girlfriend, you wouldn't want to buy her new clothes, right?

![](/img/sticker/云原生开发.gif)

## Reference Links

1. [error: At least one of apiVersion, kind and name was changed](https://stackoverflow.com/questions/56386647/error-at-least-one-of-apiversion-kind-and-name-was-changed)
1. [Kubernetes Version 1.16 Removes Deprecated APIs](https://www.ibm.com/cloud/blog/announcements/kubernetes-version-1-16-removes-deprecated-apis)
1. [Kubernetes v1.17 Version Interpretation](https://yq.aliyun.com/articles/739120)
1. [API Conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
1. [Kubernetes Deprecation Policy](https://kubernetes.io/docs/reference/using-api/deprecation-policy/)
