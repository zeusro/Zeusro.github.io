Вся связь между контейнерами внутри `kubernetes` должна проходить через `api-server`. Внешний доступ к управлению кластером через `kubectl` по сути также является доступом к `api-server`. `api-server` — это командный центр всего кластера.

Но когда вы в мире, вы не можете избежать травм. Как предотвратить вредителей внутри и снаружи кластера? `RBAC` (Role-based access control) был создан.

В одном предложении, отношения между `ServiceAccount`, `Role`, `RoleBinding`, `ClusterRole` и `ClusterRoleBinding`:

**`ClusterRoleBinding` и `RoleBinding` — это назначения, авторизующие, какие разрешения (Role, ClusterRole) могут иметь авторизованные объекты (пользователи, группы или сервисные аккаунты).**

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

Как упоминалось выше, `ServiceAccount` — это просто имя, без описания разрешений.

## service-account-token

API тип service-account-token — `kubernetes.io/service-account-token`

При изменении `ServiceAccount` Token Controller (часть controller-manager)
автоматически поддерживает `service-account-token`, добавляя/изменяя/удаляя по мере необходимости. Сущностный тип `service-account-token` — `secret`. Поэтому `service-account-token` находится в соотношении 1 к 1 с `ServiceAccount`, живя и умирая вместе.

Если определенный ресурс указывает `ServiceAccount`, `Admission Controllers` (часть api-server) смонтируют соответствующий `service-account-token` этого `ServiceAccount` в виде файлов в контейнер в директорию `/var/run/secrets/kubernetes.io/serviceaccount`.

Эта директория обычно имеет 3 файла:

1. ca.crt	
1. namespace  
1. token

Ссылки:

1. [Управление Service Accounts](https://kubernetes.io/zh/docs/admin/service-accounts-admin/)
1. [Настройка Service Accounts для Pods](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

## Role

```yml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" указывает на основную API группу
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

Role может использоваться только для предоставления прав доступа к ресурсам в одном пространстве имен.

Определяет конкретные URL.

## RoleBinding

```yml
# Это привязка роли позволяет "jane" читать pods в пространстве имен "default".
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

RoleBinding применяется для авторизации в пространстве имен. RoleBinding может предоставить разрешения, определенные в роли, пользователям или группам пользователей.

## ClusterRole 

```yml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1beta1
metadata:
  # "namespace" опущен, так как ClusterRoles не имеют пространства имен
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "watch", "list"]
```  

1. Контроль ресурсов на уровне кластера (например, права доступа к узлу)
1. Нересурсные конечные точки (например, доступ к /healthz)
1. Контроль ресурсов всех пространств имен (например, pods)

## ClusterRoleBinding

```yml
# Это привязка роли кластера позволяет любому в группе "manager" читать секреты в любом пространстве имен.
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

ClusterRoleBinding применяется для авторизации в масштабе кластера.

Наконец, давайте организуем это в таблице:

| Тип ресурса | Описание |
|---|---|
| ServiceAccount | Просто имя |
| service-account-token | Символ идентичности ServiceAccount | 
| Role | Предоставляет права доступа к ресурсам в одном пространстве имен | 
| RoleBinding | Предоставляет авторизованным объектам и Role | 
| ClusterRole | Можно рассматривать как надмножество Role, авторизация с точки зрения кластера | 
| ClusterRoleBinding | Предоставляет авторизованным объектам и ClusterRole | 

Самый простой способ понять RBAC `kubernetes` — войти внутрь kube-system и посмотреть, как определены различные ресурсы кластера.

Ссылки:

1. [Заметки о Kubernetes TLS bootstrapping](https://mritd.me/2018/01/07/kubernetes-tls-bootstrapping-note/)
1. [Использование RBAC для управления разрешениями kubectl](https://mritd.me/2018/03/20/use-rbac-to-control-kubectl-permissions/)
2. [Kubernetes RBAC](https://mritd.me/2017/07/17/kubernetes-rbac-chinese-translation/)
1. [Использование авторизации RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding)
1. [Аутентификация с Bootstrap Tokens](https://kubernetes.io/docs/reference/access-authn-authz/bootstrap-tokens/)
