All communication between containers in `kubernetes` needs to go through the `api-server`. External access to manage the cluster through `kubectl` is essentially also accessing the `api-server`. The `api-server` is the command center of the entire cluster.

But when you're in the world, you can't avoid getting hurt. How to prevent troublemakers inside and outside the cluster from causing damage? `RBAC` (Role-based access control) was born.

In one sentence, the relationship between `ServiceAccount`, `Role`, `RoleBinding`, `ClusterRole`, and `ClusterRoleBinding` is:

**`ClusterRoleBinding` and `RoleBinding` are appointments, authorizing what permissions (Role, ClusterRole) the authorized objects (users, groups, or service accounts) can have.**

## ServiceAccount

```
apiVersion: v1
kind: ServiceAccount
metadata:
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: |
      {"apiVersion":"v1","kind":"ServiceAccount","metadata":{"annotations":{},"name":"flannel","namespace":"kube-system"}}
  creationTimestamp: 2018-07-24T06:44:45Z
  name: flannel
  namespace: kube-system
  resourceVersion: "382"
  selfLink: /api/v1/namespaces/kube-system/serviceaccounts/flannel
  uid: 0d4064e6-8f0d-11e8-b4b4-00163e08cd06
secrets:
- name: flannel-token-f7d4d
```

As mentioned above, `ServiceAccount` is just a name, with no permission description itself.

## service-account-token

The API type of service-account-token is `kubernetes.io/service-account-token`

When `ServiceAccount` changes, the Token Controller (part of controller-manager)
automatically maintains `service-account-token`, adding/modifying/deleting as needed. The essence type of `service-account-token` is `secret`. So `service-account-token` is 1-to-1 with `ServiceAccount`, living and dying together.

If a defined resource specifies a `ServiceAccount`, `Admission Controllers` (part of api-server) will mount the corresponding `service-account-token` of this `ServiceAccount` as files into the container at the `/var/run/secrets/kubernetes.io/serviceaccount` directory.

This directory generally has 3 files:

1. ca.crt	
1. namespace  
1. token

Reference Links:

1. [Managing Service Accounts](https://kubernetes.io/zh/docs/admin/service-accounts-admin/)
1. [Configure Service Accounts for Pods](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

## Role

```yml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

Role can only be used to grant access permissions to resources in a single namespace.

Defines specific URLs.

## RoleBinding

```yml
# This role binding allows "jane" to read pods in the "default" namespace.
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: User
  name: jane
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

RoleBinding is used for authorization within a namespace. RoleBinding can grant permissions defined in a role to users or user groups.

## ClusterRole 

```yml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  # "namespace" omitted since ClusterRoles are not namespaced
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```  

1. Cluster-level resource control (e.g., node access permissions)
1. Non-resource endpoints (e.g., /healthz access)
1. All namespace resource control (e.g., pods)

## ClusterRoleBinding

```yml
# This cluster role binding allows anyone in the "manager" group to read secrets in any namespace.
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  name: read-secrets-global
subjects:
- kind: Group
  name: manager
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
```

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus-operator
subjects:
- kind: ServiceAccount
  name: prometheus-operator
  namespace: monitoring
```

ClusterRoleBinding is used for cluster-wide authorization.

Finally, let's organize it in a table:

| Resource Type | Description |
|---|---|
| ServiceAccount | Just a name |
| service-account-token | Identity symbol of ServiceAccount | 
| Role | Grants access permissions to resources in a single namespace | 
| RoleBinding | Grants authorized objects and Role | 
| ClusterRole | Can be considered a superset of Role, authorization from a cluster perspective | 
| ClusterRoleBinding | Grants authorized objects and ClusterRole | 

The simplest way to understand `kubernetes` RBAC is to go inside kube-system and see how various cluster resources are defined.

Reference Links:

1. [Kubernetes TLS bootstrapping Notes](https://mritd.me/2018/01/07/kubernetes-tls-bootstrapping-note/)
1. [Using RBAC to Control kubectl Permissions](https://mritd.me/2018/03/20/use-rbac-to-control-kubectl-permissions/)
2. [Kubernetes RBAC](https://mritd.me/2017/07/17/kubernetes-rbac-chinese-translation/)
1. [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding)
1. [Authenticating with Bootstrap Tokens](https://kubernetes.io/docs/reference/access-authn-authz/bootstrap-tokens/)
