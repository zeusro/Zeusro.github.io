OpenShift — это дистрибутив Kubernetes, созданный Red Hat, эквивалентный конкуренту Rancher. Поверх Kubernetes Red Hat ввела механизмы безопасности, аутентификацию, мониторинг сети, визуализацию логов и другие функции, пытаясь получить кусок пирога облачных вычислений.

## SCC (Security Context Constraints)

Недавно возникла проблема с развёртыванием Traefik на OpenShift.

```
Error creating: pods "traefik-ingress-controller-68cc888857-" is forbidden: unable to validate against any security context constraint: [provider restricted: .spec.securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.capabilities.add: Invalid value: "NET_BIND_SERVICE": capability may not be added 
spec.containers[0].securityContext.hostNetwork: Invalid value: true: Host network is not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 80: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 443: Host ports are not allowed to be used 
spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 8080: Host ports are not allowed to be used]
```

На основе сообщения об ошибке проблема была найдена в SCC. Официальное введение следующее:

> Ограничения контекста безопасности OpenShift (Security Context Constraints) аналогичны тому, как ресурсы RBAC контролируют доступ пользователей. Администраторы могут использовать ограничения контекста безопасности (SCC) для контроля разрешений Pod. Вы можете использовать SCC для определения конкретных условий, которым Pod должны соответствовать во время выполнения, чтобы быть принятыми системой.

Проще говоря, SCC добавляет некоторые ограничения на поведение пользователей поверх RBAC. Это включает упомянутые выше hostNetwork, SecurityContext и т.д. Это эквивалентно тому, что OpenShift оборачивает слой поверх [PodSecurityPolicy](https://kubernetes.io/zh/docs/concepts/policy/pod-security-policy/).

По умолчанию OpenShift включает следующие 8 типов SCC:

1. anyuid
1. hostaccess
1. hostmount-anyuid
1. hostnetwork
1. node-exporter
1. nonroot
1. privileged
1. restricted

И созданные ресурсы pod по умолчанию принадлежат политике **Restricted**. Пользователи-администраторы также могут создать свой собственный SCC и назначить его своему serviceaccount:

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

Поэтому, если созданные ресурсы не готовы, можно использовать `kubectl describe pod`, чтобы посмотреть, не нарушены ли ограничения SCC.

Вернёмся к исходной теме. Причина, по которой я хотел развернуть Traefik, заключалась в создании плоскости управления ingress. Но на платформе OpenShift на самом деле есть своя реализация, которая называется route.

## Проблемы, связанные с route

### Одно доменное имя по умолчанию разрешает только одно пространство имён

По умолчанию запрещено пересечение пространств имён с одним и тем же доменным именем. Эта функция должна быть включена для поддержки, иначе создание route покажет "a route in another namespace holds XX". Встроенная конфигурация контроллера OpenShift должна быть изменена для поддержки маршрутов между пространствами имён с одним и тем же доменным именем.

```
oc -n openshift-ingress-operator patch ingresscontroller/default --patch '{"spec":{"routeAdmission":{"namespaceOwnership":"InterNamespaceAllowed"}}}' --type=merge
```

### Разрешение домена с подстановочными знаками

При создании route с разрешением домена с подстановочными знаками появится подсказка `wildcard routes are not allowed`.

OpenShift 3 может включить это, установив переменную окружения ROUTER_ALLOW_WILDCARD_ROUTES; OpenShift 4 не поддерживает это, и у этой проблемы нет решения. Ссылка: https://github.com/openshift/enhancements/blob/master/enhancements/ingress/wildcard-admission-policy.md

### Преобразование ingress

Чтобы адаптироваться к ingress, используемым на других платформах, OpenShift выполнил некоторую обработку совместимости. При создании ingress будет соответственно создан route. И если ingress включает TLS, OpenShift также преобразует его в соответствующий route. Но в route OpenShift открытые и закрытые ключи TLS хранятся непосредственно в route, а не в секретах.

### Разрешение нескольких путей

Если исходный ingress имеет разрешение префикса нескольких путей для одного и того же доменного имени. Например, ingress a прослушивает путь /a домена a; ingress b прослушивает путь /b домена a, то, аналогично правилам перезаписи URL Traefik, аннотации перезаписи также должны быть добавлены в аннотации. OpenShift добавит эту аннотацию в преобразованный route.

```
annotations:
    haproxy.router.openshift.io/rewrite-target: /
```

## Сетевая политика

Если приложения не могут получить доступ к сервисам/pod между пространствами имён, конкретно проявляется как запросы, не имеющие ответа в течение длительного времени. Это должно быть из-за того, что в этом пространстве имён включена изоляция, и клиент oc должен быть использован для предоставления разрешений.

```
oc adm pod-network make-projects-global <project1> <project2>
```

И наоборот, если пользователи хотят, чтобы пространство имён (также называемое project в OpenShift) разрешало доступ только в пределах пространства имён, они могут сделать это:

```
oc adm pod-network isolate-projects <project1> <project2>
```

## Проблемы CRI

В настоящее время известные контейнерные среды выполнения включают следующие три:

1. containerd
1. CRI-O
1. Docker

OpenShift использует CRI-O. Если развёрнутые приложения сильно зависят от containerd/docker, развёртывание не удастся. Например, проект OpenKruise не поддерживает OpenShift.

## Ссылки

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
