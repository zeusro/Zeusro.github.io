## Начало

![image](/img/in-post/death-of-devops-engineer/devops.jpg)

В марте 2018 года я официально стал менеджером по эксплуатации и взял на себя управление внутренними учетными записями облачной платформы группы.

Предыдущий менеджер по эксплуатации был гением. Он оставил мне кучу серверов без паролей вообще, охватывающих как Tencent Cloud, так и Alibaba Cloud. Кроме того, была куча недействительных DNS-записей и CDN-доменов. Уборка этого беспорядка заняла у меня более года.

В июне 2018 года, случайно, Alibaba Cloud P8 дал мне устное введение в Kubernetes. В тот же день днем я сразу решил, что как бы трудно это ни было, я определенно реализую это.

В то время часть нашей системы уже работала на Docker Swarm Alibaba Cloud, но после просмотра заметок о выпуске я почувствовал, что эта штука определенно заброшена. Итак, примерно за три месяца, читая английскую версию "Kubernetes in Action" и участвуя в сообществе, я перешел от новичка с нулевыми знаниями Docker к **Главному Евангелисту Cloud Native** группы. Я также стал администратором сообщества.

## Ранний менеджер продукта Alibaba Cloud Kubernetes

Кроме того, я стал ранним менеджером продукта Alibaba Cloud Kubernetes. Многие предложения по продуктам были предложены мной, а затем оценены и улучшены внутри них.

1. [Сервис образов контейнеров: Поддержка сборок на зарубежных машинах частных репозиториев](https://connect.console.aliyun.com/connect/detail/84361)
1. [Веб-консоль Kubernetes: Поддержка настроек ephemeral-storage](https://connect.console.aliyun.com/connect/detail/97716)
1. [Сервис образов контейнеров: Поддержка прокси для образов gcr.io и других](https://connect.console.aliyun.com/connect/detail/78278)
1. [Kubernetes: Как можно скорее устареть Dashboard и интегрировать его функции в консоль Alibaba Cloud](https://connect.console.aliyun.com/connect/detail/77011)
1. [Kubernetes: Улучшение создания сервисов](https://connect.console.aliyun.com/connect/detail/75930)
1. [Kubernetes: Улучшение RBAC](https://connect.console.aliyun.com/connect/detail/75929)
1. [Alibaba Cloud Kubernetes: Узлы SchedulingDisabled будут автоматически удалены из групп виртуальных серверов](https://connect.console.aliyun.com/connect/detail/73467)
1. [Kubernetes: Расширение функции "Узел не планируется", изменение на "Узел обслуживания"](https://connect.console.aliyun.com/connect/detail/70803)
1. [Kubernetes: Улучшение опций создания кластера](https://connect.console.aliyun.com/connect/detail/70665)
1. [k8s: Усиление томов данных облачного диска](https://connect.console.aliyun.com/connect/detail/61986)
1. [k8s: Изменения меток сертификата сервиса не вступают в силу](https://connect.console.aliyun.com/connect/detail/57727)
1. [k8s: Добавление связанной документации по управлению узлами кластера](https://connect.console.aliyun.com/connect/detail/56229)
1. [Облачный монитор: Улучшение облачного мониторинга K8S](https://connect.console.aliyun.com/connect/detail/52189)
1. [Сервис контейнеров: Отображение PV неудобно для пользователя](https://connect.console.aliyun.com/connect/detail/51523)
1. [K8S: Время работы терминала POD слишком короткое после входа](https://connect.console.aliyun.com/connect/detail/50469)
1. [k8s: Страница конфигурации развертывания имеет проблемы](https://connect.console.aliyun.com/connect/detail/49659)
1. [k8s: Ограничения тома и улучшения](https://connect.console.aliyun.com/connect/detail/49640)
1. [k8s: Проблемы синхронизации информации пространства имен](https://connect.console.aliyun.com/connect/detail/49361)
1. [k8s: Отмена TLS Ingress не вступает в силу](https://connect.console.aliyun.com/connect/detail/48979)
1. [Репозиторий образов Alibaba Cloud: Оптимизация пользовательского опыта](https://connect.console.aliyun.com/connect/detail/48110)
1. [k8s: Появляются странные балансировщики нагрузки при обслуживании мастера](https://connect.console.aliyun.com/connect/detail/48072)
1. [k8s: Улучшение HPA](https://connect.console.aliyun.com/connect/detail/48041)
1. [Надеюсь, что сервис контейнеров Alibaba Cloud K8S может поддерживать независимую привязку SLB](https://connect.console.aliyun.com/connect/detail/47469)
1. [k8s: Проблемы при добавлении TLS к маршрутам Ingress](https://connect.console.aliyun.com/connect/detail/47443)
1. [k8s: Улучшение привязки сервиса LoadBalancer и балансировщика нагрузки](https://connect.console.aliyun.com/connect/detail/52594)
1. [k8s: Проблемы при создании развертываний с частными образами](https://connect.console.aliyun.com/connect/detail/47147)
1. [Случайно обнаружена ошибка на странице деталей развертывания K8S](https://connect.console.aliyun.com/connect/detail/47034)
1. [Надеюсь, что интерфейс Kubernetes контейнеров Alibaba Cloud не принудительно переводит собственные имена!!!](https://connect.console.aliyun.com/connect/detail/46590)
1. [K8S: Улучшение связанных руководств для страницы создания приложений](https://connect.console.aliyun.com/connect/detail/43756)
1. [Оптимизация пользовательского опыта развертывания приложений K8S](https://connect.console.aliyun.com/connect/detail/43736)
1. [Позволить пользователям гибко выбирать способ оплаты мастера K8S](https://connect.console.aliyun.com/connect/detail/43655)
1. [Сервис контейнеров: Проверки работоспособности бесполезны](https://connect.console.aliyun.com/connect/detail/40484)
1. [Сервис контейнеров: Улучшение сервиса логов](https://connect.console.aliyun.com/connect/detail/40792)

С 2018-05-13 по настоящее время я подал десятки предложений в области контейнеров. Хотя некоторые не были приняты, я думаю, что заслуживаю титула "**Ранний менеджер продукта Alibaba Cloud Kubernetes**".

Самая запоминающаяся ошибка была эта:
[k8s: Отмена TLS Ingress не вступает в силу](https://connect.console.aliyun.com/connect/detail/48979)

Я отслеживал ее почти три месяца и даже отправил видео менеджеру продукта Alibaba Cloud в то время.

## NoOps

![image](/img/in-post/death-of-devops-engineer/waterfall.jpg)

Я не буду жаловаться на то, насколько ужасна модель водопада для традиционных приложений—те, кто понимает, понимают. После того, как тот менеджер по эксплуатации меня подставил, увидеть Kubernetes было как увидеть спасителя. Позже я использовал Kubernetes для возврата большинства серверов. Что касается тех серверов без паролей, я либо использовал шоковую терапию для сброса паролей в полночь и перезапуска, либо ждал год или два, делал резервную копию облачных дисков и напрямую возвращал деньги.

## Забывание паролей серверов в эпоху Kubernetes

Вы можете обратиться к тому, что я написал:
[Масштабирование кластера Kubernetes Alibaba Cloud и обновление ядра узла](https://developer.aliyun.com/article/756235)

Небольшая разница в том, что:

![image](/img/in-post/death-of-devops-engineer/QQ20200618-163420.png)

[Обслуживание узла](https://cs.console.aliyun.com/#/k8s/node/list) здесь должно быть установлено как "**Не планируется**". Затем медленно истощите поды в узле.

Когда оставшиеся поды в узле больше не важны, вы можете напрямую удалить узел и вернуть соответствующий ECS.

## Жалобы

![image](/img/in-post/death-of-devops-engineer/no-silver.jpg)

Может ли Alibaba Cloud перестать постоянно отправлять мне ваучеры? Мой домен будет продлеваться на сто лет, если это продолжится.

## Ссылки

[1]
Тренды облака 2017 года—От DevOps к NoOps
http://dockone.io/article/2126
