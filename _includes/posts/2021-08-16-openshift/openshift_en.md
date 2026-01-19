OpenShift is a Kubernetes distribution made by Red Hat, equivalent to a competitor of Rancher. On top of Kubernetes, Red Hat has introduced security mechanisms, authentication, network monitoring, log visualization and other features, trying to get a piece of the cloud-native pie.

## SCC (Security Context Constraints)

Recently, there was a problem deploying Traefik on OpenShift.

```
Error creating: pods "traefik-ingress-controller-68cc888857-" is forbidden: unable to validate against any security context constraint: [provider restricted: .spec.securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.capabilities.add: Invalid value: "NET_BIND_SERVICE": capability may not be added 
spec.containers[0].securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 80: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 443: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 8080: Host ports are not allowed to be used]
```

Based on the error message, the problem was found to be with SCC. The official introduction is as follows:

> OpenShift's Security Context Constraints (SCC) are similar to how RBAC resources control user access. Administrators can use Security Context Constraints (SCC) to control Pod permissions. You can use SCC to define specific conditions that Pods must meet at runtime to be accepted by the system.

Simply put, SCC adds some restrictions on user behavior on top of RBAC. This includes the hostNetwork and SecurityContext mentioned above. It's equivalent to OpenShift wrapping a layer on top of [PodSecurityPolicy](https://kubernetes.io/zh/docs/concepts/policy/pod-security-policy/).

By default, OpenShift includes the following 8 types of SCC:

1. anyuid
1. hostaccess
1. hostmount-anyuid
1. hostnetwork
1. node-exporter
1. nonroot
1. privileged
1. restricted

And created pod resources belong to the **Restricted** policy by default. Administrator users can also create their own SCC and assign it to their serviceaccount:

```yaml
apiVersion: security.openshift.io/v1
kind: SecurityContextConstraints
metadata:
  annotations:
    kubernetes.io/description: traefikee-scc provides all features of the restricted SCC
      but allows users to run with any UID and any GID.
  name: traefikee-scc
priority: 10

allowHostDirVolumePlugin: true
allowHostIPC: false
allowHostNetwork: false
allowHostPID: false
allowHostPorts: false
allowPrivilegeEscalation: true
allowPrivilegedContainer: false
allowedCapabilities:
- NET_BIND_SERVICE
defaultAddCapabilities: null
fsGroup:
  type: RunAsAny
groups:
- system:authenticated
readOnlyRootFilesystem: false
requiredDropCapabilities:
- MKNOD
runAsUser:
  type: RunAsAny
seLinuxContext:
  type: MustRunAs
supplementalGroups:
  type: RunAsAny
users: []
volumes:
- configMap
- downwardAPI
- emptyDir
- persistentVolumeClaim
- projected
- secret

```

```bash
oc create -f new-sa.yaml
oc create -f new-scc.yaml
oadm policy add-scc-to-user new-scc system:serviceaccount:monitor:new-sa
```

So if created resources are not ready, you can use `kubectl describe pod` to see if SCC restrictions have been violated.

Back to the original topic, the reason I wanted to deploy Traefik was to create an ingress control plane. But on the OpenShift platform, there's actually its own implementation, which is called route.

## Route Related Issues

### Same Domain Name Only Allows One Namespace by Default

By default, cross-namespace with the same domain name is prohibited. This feature needs to be enabled to support it, otherwise creating a route will show "a route in another namespace holds XX". The built-in controller configuration of OpenShift needs to be modified to support cross-namespace routes with the same domain name.

```
oc -n openshift-ingress-operator patch ingresscontroller/default --patch '{"spec":{"routeAdmission":{"namespaceOwnership":"InterNamespaceAllowed"}}}' --type=merge
```

### Wildcard Domain Resolution

When creating a route with wildcard domain resolution, it will prompt `wildcard routes are not allowed`.

OpenShift 3 can enable it by setting the ROUTER_ALLOW_WILDCARD_ROUTES environment variable; OpenShift 4 does not support it, and this issue has no solution. Reference: https://github.com/openshift/enhancements/blob/master/enhancements/ingress/wildcard-admission-policy.md

### Ingress Conversion

To adapt to ingress used on other platforms, OpenShift has done some compatibility processing. When creating ingress, it will correspondingly create a route. And if ingress includes TLS, OpenShift will also convert it to the corresponding route. But in OpenShift's route, TLS public and private keys are stored directly in the route, not in secrets.

### Multi-path Resolution

If the original ingress has multi-path prefix resolution for the same domain name. For example, ingress a listens to the /a path of domain a; ingress b listens to the /b path of domain a, then similar to Traefik's URL rewrite rules, rewrite annotations also need to be added in the annotations. OpenShift will add this annotation to the converted route.

```
annotations:
    haproxy.router.openshift.io/rewrite-target: /
```

## Network Policy

If applications cannot access cross-namespace services/pods, specifically manifested as requests having no response for a long time. This should be that this namespace has isolation enabled, and the oc client needs to be used to grant permissions.

```
oc adm pod-network make-projects-global <project1> <project2>
```

Conversely, if users want a namespace (also called project in OpenShift) to only allow access within the namespace, they can do this:

```
oc adm pod-network isolate-projects <project1> <project2>
```

## CRI Issues

Currently known container runtimes include the following three:

1. containerd
1. CRI-O
1. Docker

OpenShift uses CRI-O. If deployed applications strongly depend on containerd/docker, deployment will fail. For example, the OpenKruise project does not support OpenShift.

## References

[1]
https://ithelp.ithome.com.tw/articles/10243781

[2]
https://kubernetes.io/docs/concepts/policy/pod-security-policy/

[3]
https://cloud.tencent.com/developer/article/1603597

[4]
https://docs.openshift.com/container-platform/4.8/rest_api/network_apis/route-route-openshift-io-v1.html

[5]
https://docs.openshift.com/container-platform/3.5/admin_guide/managing_networking.html
