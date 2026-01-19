![img](/img/in-post/kubernetes-iptables/Kube-proxy NAT分析.png)

## Основы

3 протокола: TCP, UDP, ICMP

4 состояния: NEW, ESTABLISHED, INVALID, RELATED

4 таблицы

1. raw: Расширенные функции, такие как: фильтрация URL.
1. mangle: Изменение пакетов (QOS), используется для реализации качества обслуживания.
1. net: Преобразование адресов, используется для маршрутизаторов шлюза.
1. filter: Фильтрация пакетов, используется для правил файрвола.

5 цепочек

1. Цепочка PREROUTING: Используется для преобразования адреса назначения (DNAT).
1. Цепочка INPUT: Обрабатывает входящие пакеты.
1. Цепочка FORWARD: Обрабатывает пересылаемые пакеты.
2. Цепочка OUTPUT: Обрабатывает исходящие пакеты.
1. Цепочка POSTROUTING: Используется для преобразования адреса источника (SNAT).

## Общие методы

```bash
iptables -t filter -nL
iptables -t nat -nL
iptables -t raw -nL
iptables -t mangle -nL
```


## Анализ ссылок трафика kubernetes svc с помощью iptables

> iptables на узлах генерируются kube-proxy. Для конкретной реализации см. [код kube-proxy](https://github.com/kubernetes/kubernetes/blob/master/pkg/proxy/iptables/proxier.go)
> 
> kube-proxy изменяет только таблицы filter и nat. Он расширяет цепочки iptables, настраивая пять цепочек: KUBE-SERVICES, KUBE-NODEPORTS, KUBE-POSTROUTING, KUBE-MARK-MASQ и KUBE-MARK-DROP, и в основном настраивает правила маршрутизации трафика, добавляя правила в цепочку KUBE-SERVICES (прикрепленную к PREROUTING и OUTPUT)

### Информация о кластере

Pod CIDR: 172.31.0.0/16

Alibaba Cloud kubernetes v1.12.6-aliyun.1

*.aliyuncs.com/acs/flannel:v0.8.0

Приватный IP SLB: 172.6.6.6 (на самом деле также привязан к EIP)

### Использование svc в качестве примера

Использование testsvc под пространством имен default в качестве примера

```

➜  ~ kgsvc testsvc
NAME              TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)         w
testsvc           LoadBalancer   172.30.5.207   172.6.6.6      443:30031/TCP   106d

➜  ~ iptables -t nat -nL 

Chain PREROUTING (policy ACCEPT)
target         prot opt source               destination
KUBE-SERVICES  all  --  0.0.0.0/0            0.0.0.0/0            /* kubernetes service portals */

Chain OUTPUT (policy ACCEPT)
target         prot opt source               destination
KUBE-SERVICES  all  --  0.0.0.0/0            0.0.0.0/0            /* kubernetes service portals */
DOCKER         all  --  0.0.0.0/0           !127.0.0.0/8          ADDRTYPE match dst-type LOCAL

# Все службы находятся в этой цепочке, очень длинной
Chain KUBE-SERVICES (2 references)
target                     prot opt source               destination
KUBE-MARK-MASQ             tcp  -- !172.31.0.0/16        172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
KUBE-SVC-M42ZCW2EYUCRBVAF  tcp  --  0.0.0.0/0            172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
......
KUBE-FW-M42ZCW2EYUCRBVAF   tcp  --  0.0.0.0/0            172.6.6.6            /* default/testsvc: loadbalancer IP */ tcp dpt:443

# Пометить проходящие пакеты
Chain KUBE-MARK-MASQ (522 references)
target     prot opt source               destination
MARK       all  --  0.0.0.0/0            0.0.0.0/0            MARK or 0x4000

Chain KUBE-XLB-M42ZCW2EYUCRBVAF (2 references)
target                     prot opt source               destination
KUBE-SVC-M42ZCW2EYUCRBVAF  all  --  172.31.0.0/16        0.0.0.0/0            /* Redirect pods trying to reach external loadbalancer VIP to clusterIP */
KUBE-MARK-DROP             all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: has no local endpoints */


Chain KUBE-SVC-M42ZCW2EYUCRBVAF (2 references)
target                     prot opt source               destination
KUBE-SEP-EA7TYKWK2S6G4PQR  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.14286000002
KUBE-SEP-ZJI36FVTROQF5MX7  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.16667000018
KUBE-SEP-JLGUPWE7JCRU2AGG  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.20000000019
KUBE-SEP-GCNPY23RDN22AOTX  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.25000000000
KUBE-SEP-FNDISD3HQYKEHL3T  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.33332999982
KUBE-SEP-3RWVMCKITDQWELSA  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.50000000000
KUBE-SEP-BVMKBOC4GGNJ3567  all  --  0.0.0.0/0            0.0.0.0/0

Chain KUBE-SEP-BVMKBOC4GGNJ3567 (1 references)
# 172.31.9.52 — это виртуальный IP пода
target          prot opt source               destination
KUBE-MARK-MASQ  all  --  172.31.9.52          0.0.0.0/0
DNAT            tcp  --  0.0.0.0/0            0.0.0.0/0            tcp to:172.31.9.52:80

Chain KUBE-FW-M42ZCW2EYUCRBVAF (1 references)
target                     prot opt source               destination
KUBE-XLB-M42ZCW2EYUCRBVAF  all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: loadbalancer IP */
KUBE-MARK-DROP             all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: loadbalancer IP */

Chain KUBE-MARK-DROP (60 references)
target     prot opt source               destination
MARK       all  --  0.0.0.0/0            0.0.0.0/0            MARK or 0x8000
```

Графически:

![image](/img/in-post/kubernetes-iptables/chain.png)

```
graph TB
a(Внутренний трафик/PREROUTING)-->c(KUBE-SERVICES)
b(Внешний трафик/OUTPUT)-->c
c-->d(KUBE-MARK-MASQ)
d-->|destination:172.30.5.207|e(KUBE-SVC-M42ZCW2EYUCRBVAF)
e-->|destination:172.30.5.207|p1(KUBE-SEP-EA7TYKWK2S6G4PQR)
e-->|destination:172.30.5.207|p2(KUBE-SEP-ZJI36FVTROQF5MX7)
p1-->|destination:<podIP1>|f(KUBE-FW-M42ZCW2EYUCRBVAF)
p2-->|destination:<podIP2>|f
f-->g(KUBE-XLB-M42ZCW2EYUCRBVAF)
g-->|После перехвата IP балансировщика нагрузки на узле, пересылка в службу|h(KUBE-SVC-M42ZCW2EYUCRBVAF)
```

### Некоторые приемы iptables

#### Почему вероятность пода увеличивается

Первая вероятность 1/3: Если совпало, это означает попадание в 1/3. Если не совпало, оставшиеся 2/3 переходят к следующей строке.

Вторая вероятность 1/2: Если совпало, это означает попадание в 2/3 * 1/2 = 1/3. Если не совпало, 1/2 переходит к следующей строке.

Третья вероятность 1: Если совпало, это 2/3 * 1/2 * 1 = 1/3

#### Почему последняя цепочка KUBE-SEP-BVMKBOC4GGNJ3567 не имеет вероятности

Последовательное сопоставление, она берет остаток, поэтому больше не нужно вычислять вес.

#### Что означает destination 0.0.0.0/0

Внимательно наблюдайте за всей ссылкой. К моменту достижения шага `KUBE-SEP-XXX` мы уже получили виртуальный IP пода. Поэтому, кроме этого, назначения других цепочек остаются неизменными и больше не нуждаются в изменении.


## Заключение

1. flannel версии kubernetes 0.8 — это крупномасштабное применение iptables.
1. Эта длинная и дурно пахнущая цепочка KUBE-SERVICES определяет, что сопоставление служб — O(n). По мере увеличения svc добавление/удаление/изменение/запрос будет становиться все медленнее.
1. Когда количество svc превышает 1000, задержка будет довольно заметной.
2. kube-proxy должен быть основан на режиме IPVS, использование iptables только повторит ту же ошибку.
3. svcIP — это транзитный виртуальный IP.


## Ссылки

1. [Запись обновления Kubernetes с 1.10 до 1.11 (продолжение): Kubernetes kube-proxy включает режим IPVS](https://blog.frognew.com/2018/10/kubernetes-kube-proxy-enable-ipvs.htm)
2. [Как включить ipvs в kubernetes](https://juejin.im/entry/5b7e409ce51d4538b35c03df)
3. [Практика оптимизации производительности служб Huawei Cloud в крупномасштабных сценариях K8S](https://zhuanlan.zhihu.com/p/37230013)
4. [Поток сетевых пакетов kubernetes](https://zhuanlan.zhihu.com/p/28289080)
5. [Интерпретация режима ipvs kube-proxy](https://segmentfault.com/a/1190000016333317)
6. [Сравнение режимов kube-proxy: iptables или IPVS?](https://www.jishuwen.com/d/2K3c)
1. [Как редактировать правила iptables](https://fedoraproject.org/wiki/How_to_edit_iptables_rules)
2. [Простое введение в iptables & ipvs](http://www.voidcn.com/article/p-uttldwvk-pz.html)
3. [Связанное с iptables](https://www.zsythink.net/archives/category/%E8%BF%90%E7%BB%B4%E7%9B%B8%E5%85%B3/iptables/)
4. [Понимание iptables в среде kubernetes](https://www.cnblogs.com/charlieroro/p/9588019.html)
