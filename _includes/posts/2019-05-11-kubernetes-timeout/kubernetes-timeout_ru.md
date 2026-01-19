kubernetes + alpine + php особенно склонны к проблемам с таймаутом при доступе к внешним сетям/разрешении внешних адресов.

## Причина

Когда docker-контейнеры обращаются к внешним сетям, полный путь таков:

Контейнер --> Хост --> Внешняя сеть --> Хост --> Контейнер

Трафик между контейнерами и хостами должен проходить через преобразование сетевых адресов источника (SNAT), чтобы течь плавно.

SNAT похож на носильщика, перемещающего кирпичи (трафик) из контейнеров на хост.

Если на одном хосте запущено несколько контейнеров и они одновременно обращаются к внешним сетям (особенно PHP, у которого нет пула соединений), они запрашивают доступные порты у системы (nf_nat_l4proto_unique_tuple). Если недоступно, +1, затем снова запрос, затем проверка. Когда этот процесс происходит слишком часто, это в конечном итоге приводит к таймаутам адресации.

Проще говоря, это проблема ядра системы.

Подробное объяснение см.:

[Запись путешествия по поиску необъяснимой причины таймаута соединения на Docker/Kubernetes](https://mp.weixin.qq.com/s?__biz=MzIzNzU5NTYzMA==&mid=2247484016&idx=1&sn=72bc7f3443cbc259762fb6bd7adb33ae&chksm=e8c77cf1dfb0f5e7598497767db6365bd8db9f4b6a945cb8c72adb1e052e8b0cd46b727c929b&scene=21#wechat_redirect)

## Решения

### Оптимальное решение

Обновить узлы до ядра Linux 5.1.

Обновить iptables до 1.6.2 или выше.

Использовать сетевые плагины на основе режима IPVS, минимизировать SNAT/DNAT, поддерживать случайный порт SNAT для запуска kubernetes.

Или использовать решения сетевых плагинов, обходящие SNAT, такие как [terway](https://github.com/AliyunContainerService/terway) от Alibaba Cloud. Но этот плагин глубоко привязан к Alibaba Cloud и требует покупки дополнительного эластичного сетевого интерфейса для каждой машины.

### Субоптимальное решение

[Развернуть сервер имен с ds](https://github.com/kubernetes/enhancements/blob/master/keps/sig-network/0030-nodelocal-dns-cache.md), разрешение DNS всех узлов проходит через сервер имен на узле, облегчая этот тип проблемы через минимальный SNAT + dns кэш.

### Псевдо-решение (не может решить корневую проблему)

Файл `/etc/resolv.conf` подов по умолчанию обычно выглядит так:

```
sh-4.2# cat /etc/resolv.conf
nameserver <kube-dns-vip>
search <namespace>.svc.cluster.local svc.cluster.local cluster.local localdomain
options ndots:5
```

Эта конфигурация означает, что сервер имен по умолчанию указывает на kube-dns/core-dns. Во всех запросах, если количество точек меньше 5, он будет искать согласно списку, настроенному в search. Если результат не возвращен, он в конечном итоге напрямую запросит само доменное имя. ndots означает n точек.

Например:

```
sh-4.2# host -v baidu.com
Trying "baidu.com.<namespace>.svc.cluster.local"
Trying "baidu.com.svc.cluster.local"
Trying "baidu.com.cluster.local"
Trying "baidu.com.localdomain"
Trying "baidu.com"
......
```

#### Не использовать образы alpine

#### Использовать [FQDN](https://baike.baidu.com/item/FQDN)

Поскольку доменные имена разрешаются уровень за уровнем справа налево, например `google.com`, это на самом деле `google.com.`, точка после com называется корневым доменом. При разрешении сначала разрешается ., затем разрешается .com, .com называется доменом верхнего уровня, наконец разрешается google.

Использование FQDN: (Полностью квалифицированное доменное имя) предназначено для минимизации давления разрешения на внутренний DNS (например, coreDNS, DNS узла) насколько возможно.

#### Переоткрыть сокет

```yaml
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c 
              - "/bin/echo 'options single-request-reopen' >> /etc/resolv.conf"
```

Установка переоткрытия сокета предназначена для избежания одновременных A, AAAA запросов в контейнерах.


#### 2-уровневый домен напрямую идет на разрешение верхнего уровня

Ссылка [kubernetes использует образы на основе alpine не может правильно разрешить внешний DNS](https://www.sudops.com/kubernetes-alpine-image-resolve-ext-dns.html)

Запуск `sed -i 's/options ndots:5/#options ndots:5/g' /etc/resolv.conf` напрямую выдаст ошибку.

Команда echo alpine проглатывает символы новой строки, и если формат resolv.conf неправильный, разрешение DNS выдаст ошибку.

```yaml
  dnsConfig:
    options:
      - name: ndots
        value: "2"
      - name: single-request-reopen
```

Удален `options ndots:5`, изменено на значение по умолчанию 1. Таким образом, контейнеры, напрямую обращающиеся к <svc>, все еще в порядке, проходя через список search, `<svc>.<namespace>.svc.cluster.local`, все еще могут быть доступны.

При разрешении `Google.com` фактически разрешается `Google.com.`, количество точек превышает 1, поэтому оно не проходит через список search, напрямую использует DNS верхнего уровня.

В итоге, удаление ndots/установка ndots в 1 снижает возможность частых DNS-запросов. Это имеет "чудесные эффекты" для разрешения внешних IP.

Но если этот хост запускает другие контейнеры (разве это не ерунда, если узел не запускает несколько контейнеров, зачем использовать kubernetes), другие контейнеры также будут запрашивать одновременно, проблема SNAT все еще появится, поэтому изменение файла `/etc/resolv.conf` не может решить корневую проблему.


Обходной путь 1

```
          lifecycle:
            postStart:
              exec:
                command:
                - /bin/sh
                - -c 
                - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

Обходной путь 2

```
      initContainers:
      - name: alpine
        image: alpine
        command:
         - /bin/sh
         - -c 
         - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

## Производные проблемы

### DNAT

Контейнеры, обращающиеся к clusterIP (поскольку это виртуальный IP, требуется DNAT), также могут иметь этот тип проблемы с таймаутом.

### Не принудительно добавлять драму при доступе к svc того же namespace

Формат виртуального домена для не-head service: `<svc>.<namespace>.svc.cluster.local`

Если наш контейнер напрямую обращается к `<svc>.<namespace>.svc.cluster.local`, из-за настроек DNS по умолчанию количество разрешений фактически больше. Правильный способ - обращаться к `<svc>`

Пример: предположим, что под test есть svc s

```bash
host -v s 
# Разрешить 1 раз
host -v s.test.svc.cluster.local
# Разрешить 4 раза
```

Итак, при доступе к другим svc в том же namespace просто используйте имя svc напрямую, нет необходимости хвастаться использованием формата `<svc>.<namespace>.svc.cluster.local`.

## Другие знания

### Типы записей DNS

1. A-запись: Запись адреса, используется для указания IPv4-адреса доменного имени (например, 8.8.8.8). Если нужно указать доменное имя на IP-адрес, нужно добавить A-запись.
1. CNAME: Если нужно указать доменное имя на другое доменное имя, которое затем предоставляет IP-адрес, нужно добавить CNAME-запись.
1. TXT: Здесь можно заполнить что угодно, ограничение длины 255. Подавляющее большинство TXT-записей используется для SPF-записей (антиспам).
1. NS: Запись сервера имен. Если нужно передать разрешение поддомена другим поставщикам DNS-услуг, нужно добавить NS-запись.
1. AAAA: Используется для указания IPv6-адреса, соответствующего имени хоста (или доменному имени) (например, ff06:0:0:0:0:0:0:c3) запись.
1. MX: Если нужно настроить почту, чтобы письма могли быть получены, нужно добавить MX-запись.
1. Явный URL: Когда нужно 301-редирект с одного адреса на другой, нужно добавить явную URL-запись (Примечание: DNSPod в настоящее время поддерживает только 301-редирект).
1. Неявный URL: Аналогично явному URL, разница в том, что неявный URL не изменяет доменное имя в адресной строке.
1. SRV: Записывает, какой компьютер предоставляет какую службу. Формат: имя службы, точка, тип протокола, например, _xmpp-server._tcp.

### Используемые команды

Способ установки:

```bash
  yum install -y bind-utils
  sudo apt-get install -y dnsutils
  apk add bind-tools
```

#### [dig](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/dig.htm)

  dig +trace +ndots=5 +search $host


#### [host](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/host.htm)

  host -v $host

## Ссылки:

1. [Понимание DNAT, SNAT и MASQUERADE в iptables](https://blog.csdn.net/wgwgnihao/article/details/68490985#)
1. [Подробное объяснение файла /etc/resolv.conf корневой файловой системы Linux](https://blog.csdn.net/mybelief321/article/details/10049429#)
1. [kube-dns per node #45363](https://github.com/kubernetes/kubernetes/issues/45363)
1. [Прерывистые задержки DNS на 5 секунд #56903](https://github.com/kubernetes/kubernetes/issues/56903)
1. [Гонка conntrack и таймауты поиска DNS](https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts)
1. [/etc/resolv.conf](http://www.man7.org/linux/man-pages/man5/resolver.5.html)
1. [Конфигурация search и ndots в /etc/resolv.conf](https://www.ichenfu.com/2018/10/09/resolv-conf-desc/)
1. [DNS для служб и подов](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
