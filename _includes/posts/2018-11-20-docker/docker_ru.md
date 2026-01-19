## Установка

### Ubuntu

```bash
# SET UP THE REPOSITORY
sudo apt-get remove docker docker-engine docker.io
sudo apt-get update
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
 sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
# INSTALL DOCKER CE
 sudo apt-get update
 sudo apt-get install docker-ce
apt-cache madison docker-ce
# Зеркало компании Alibaba Cloud
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://vhc6pxhv.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

```

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

```
Ссылки:
1. https://docs.docker.com/compose/install/#install-compose
2. 

### mac

```
brew cask install docker
docker ps
docker-machine create default

```

## Команды

###  run 
```
 docker run [OPTIONS] IMAGE [COMMAND] [ARG...]  
  -a, --attach=[]            Войти в контейнер (контейнер, запущенный с docker run -d)  
  -c, --cpu-shares=0         Установить вес CPU контейнера, используется в сценариях совместного использования CPU  
  --cap-add=[]               Добавить разрешения, подробности списка разрешений: http://linux.die.net/man/7/capabilities  
  --cap-drop=[]              Удалить разрешения, подробности списка разрешений: http://linux.die.net/man/7/capabilities  
  --cidfile=""               После запуска контейнера записать значение PID контейнера в указанный файл, типичное использование системы мониторинга  
  --cpuset=""                Установить, какие CPU может использовать контейнер, этот параметр можно использовать для эксклюзивного CPU контейнера  
  -d, --detach=false         Указать, работает ли контейнер на переднем плане или в фоновом режиме   
  --device=[]                Добавить устройство хоста в контейнер, эквивалентно сквозной передаче устройства  
  --dns=[]                   Указать DNS-сервер контейнера  
  --dns-search=[]            Указать домен поиска DNS контейнера, записать в файл /etc/resolv.conf контейнера  
  -e, --env=[]               Указать переменные окружения, контейнер может использовать эту переменную окружения  
  --entrypoint=""            Переопределить точку входа образа  
  --env-file=[]              Указать файл переменных окружения, формат файла — одна переменная окружения на строку  
  --expose=[]                Указать порты, открытые контейнером, т.е. изменить открытые порты образа  
  -h, --hostname=""          Указать имя хоста контейнера  
  -i, --interactive=false    Открыть STDIN для консольного взаимодействия  
  --link=[]                  Указать связи между контейнерами, использовать IP, env и т.д. других контейнеров  
  --lxc-conf=[]              Указать файл конфигурации контейнера, используется только при указании --exec-driver=lxc  
  -m, --memory=""            Указать лимит памяти контейнера  
  --name=""                  Указать имя контейнера, позже можно управлять контейнером по имени, функция links требует использования имени  
  --net="bridge"             Настройки сети контейнера, подробности позже  
  -P, --publish-all=false    Указать порты, открытые контейнером, подробности позже  
  -p, --publish=[]           Указать порты, открытые контейнером, подробности позже  
  --privileged=false         Указать, является ли контейнер привилегированным контейнером, привилегированные контейнеры имеют все capabilities  
  --restart=""               Указать стратегию перезапуска контейнера после остановки, подробности позже  
  --rm=false                 Указать автоматическое удаление контейнера после остановки (не поддерживает контейнеры, запущенные с docker run -d)  
  --sig-proxy=true           Установить прокси для приёма и обработки сигналов, но SIGCHLD, SIGSTOP и SIGKILL не могут быть проксированы  
  -t, --tty=false            Выделить tty-устройство, может поддерживать вход в терминал  
  -u, --user=""              Указать пользователя контейнера  
  -v, --volume=[]            Подключить том хранения к контейнеру, подключить к определённому каталогу в контейнере  
  --volumes-from=[]          Подключить тома из других контейнеров к контейнеру, подключить к определённому каталогу в контейнере  
  -w, --workdir=""           Указать рабочий каталог контейнера  


# Запустить bash-терминал, разрешить взаимодействие с пользователем
docker run -t -i ubuntu:14.04 /bin/bash

# Запустить завершённый контейнер  
docker container start
```

* Параметр --restart поддерживает три логические реализации:
```
no：Не перезапускать при выходе контейнера  
on-failure：Перезапускать при выходе контейнера с ошибкой (возвращаемое значение не равно нулю)  
always：Всегда перезапускать при выходе контейнера
```

* Сетевой параметр --net
 
```bash
--net=bridge： //Использовать мост, указанный docker daemon
--net=host： //Контейнер использует сеть хоста
--net=container:NAME_or_ID：//Использовать сеть другого контейнера, совместно использовать IP и PORT и другие сетевые ресурсы
--net=none： //Контейнер использует свою собственную сеть (аналогично --net=bridge), но не настраивает
```

* Самый простой пример
 
```bash
docker run --name myredis -d redis
```

###  build
```
docker build -t runoob/ubuntu:v1 .
```

### Встроенный мониторинг

```bash
# {% raw %}
  docker stats $(docker ps --format={{.Names}})
# {% endraw %}  
```

Ссылки:
[docker stats](https://docs.docker.com/engine/reference/commandline/stats/)

## Некоторые подводные камни

### Docker имеет сетевые узкие места, можно решить через ` --net=host`.
>    Поддерживаемые Docker сетевые режимы:
> 
>    none. Закрыть сетевые подключения внутри контейнера  
> 
>    bridge. Подключать контейнеры через интерфейсы veth, конфигурация по умолчанию.
> 
>    host. Разрешить контейнеру использовать информацию сетевого стека хоста. Примечание: этот метод позволит контейнеру получать доступ к системным сервисам, таким как D-BUS, на хосте, поэтому считается небезопасным.
> 
>   container. Использовать информацию сетевого стека другого контейнера。　
* 



### Не удаётся подключиться к Docker daemon на macOS
```
brew cask install docker
``` 

### Использовать инструкцию ADD экономно

Другая функция ADD — возможность автоматически распаковывать сжатые файлы. Если параметр — это локальный файл, который распознаёт форматы сжатия (tar, gzip, bzip2 и т.д.), он будет распакован в указанное место в файловой системе контейнера.

Ссылки:
[Dockerfile:ADD VS COPY](https://juejin.im/post/5aa5d08e6fb9a028de4455d1)

### Контейнеры, выполняемые entrypoint, не могут получать [Unix-сигналы](https://zh.wikipedia.org/wiki/Unix%E4%BF%A1%E5%8F%B7)

entrypoint, выполняемый через sh -c, приводит к тому, что pid приложения!=1

## Ключевые моменты:
* Все операции записи файлов должны использовать тома данных (Volume) или привязывать каталоги хоста. Чтение-запись в этих местах пропускает слой хранения контейнера, напрямую читает-записывает на хост (или сетевое хранилище), с более высокой производительностью и стабильностью.
* Поэтому для пользователей CentOS/RHEL, когда невозможно использовать UnionFS, необходимо настроить direct-lvm для devicemapper, будь то для производительности, стабильности или использования пространства.
* При сборке образов использовать `&&` для соединения инструкций, в конце нужно очистить лишние файлы
* Следует поместить Dockerfile в пустой каталог или корневой каталог проекта
* Некоторые вещи в каталоге действительно не хочется передавать в Docker engine во время сборки, тогда можно написать .dockerignore с синтаксисом, подобным .gitignore
* 


1. [Опыт использования Alpine Linux Docker Image](https://blog.phpgao.com/docker_alpine.html)

## Некоторые советы

### Просмотр тегов образа

```
brew install httpie
http -a <имя_пользователя>:<пароль> https://auth.docker.io/token  service==registry.docker.io scope==repository:library/nginx:pull
# Заменить token результата команды в $token
http https://registry.hub.docker.com/v2/library/nginx/tags/list 'Authorization: Bearer $token'

```

Ссылки

[Взаимодействие с docker hub v2 API через OAuth](https://yq.aliyun.com/articles/635236?spm=a2c4e.11155435.0.0.70446906jG4z8L)


### Просмотр тегов Google Container

[Способ командной строки](https://cloud.google.com/sdk/gcloud/reference/container/images/list-tags)


[Способ интерфейса](https://gcr.io/v2/google-containers/pause/tags/list)

[Веб-способ](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL)


### Просмотр временного хранилища, используемого контейнером

```bash
docker ps
docker inspect <containerid>
```

Результат — json, содержимое в поле `GraphDriver` — это пространство, занимаемое слоем чтения-записи этого контейнера

[overlay2](https://docs.docker.com/storage/storagedriver/overlayfs-driver/#how-the-overlay2-driver-works) этот драйвер хранения, примерно выглядит так

```
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5-init/diff:/var/lib/docker/overlay2/bc8e51a75f0c75a4c99aee3365e61d819db62c40567d19065803f604c37b037c/diff:/var/lib/docker/overlay2/c6b772109941ef801751cc79df1fff5365d802313e62d891709fa5dc0a77e5ee/diff:/var/lib/docker/overlay2/57825e2f123ee01d2a0316633797eea092d456e86313e57f387f55984539fa12/diff:/var/lib/docker/overlay2/85a562eb1efa7fb47d73c1f3a872eff792e2897fb10acc7f5c3a36a949267ea8/diff:/var/lib/docker/overlay2/175ef167c94fabfcdd71c9c0c00cf84aff09092c525a23eb34ef1abdc5353315/diff:/var/lib/docker/overlay2/7f3e18afdbf72eef8cf3c3c85be17fd690bd8d08ab845351f13e2ab9373f7116/diff:/var/lib/docker/overlay2/6587c9c58d7fbeaa3b2d485033cea9ed16b5e58f5ffb1ab52cbf0ce5d10015db/diff:/var/lib/docker/overlay2/7a5a3316ee39f485f5834604b4ed2943864935601cb53d1ff4e61523236fd7e3/diff:/var/lib/docker/overlay2/e823c204b197123caf2cb190a4a7eb6b1664ef91610578cd3a9230edd9948711/diff:/var/lib/docker/overlay2/5ee74f69388ee558000e54fab92d7f245e38cbcb74d1d428e6e8acb1d84d5785/diff:/var/lib/docker/overlay2/a716238ee065c05799244c3bd375ecc3132f3039f4e041254a150b4900b43c84/diff:/var/lib/docker/overlay2/8cf97acec90c72c19d9efe245d7196a27903c2593d64c34d4fd68c0f3244afe3/diff:/var/lib/docker/overlay2/d31d19d7f6dae649f5318546dd374b7c332dbdab01bc61b7e47bafec0f1a33e9/diff",
                "MergedDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/merged",
                "UpperDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/diff",
                "WorkDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/work"
```

Относительно драйверов хранения, [эта статья](http://dockone.io/article/1765) объясняет довольно хорошо

### Очистка контейнеров

Использовать следующую команду до и после очистки для сравнения эффектов

  docker system df -v

#### Способ 1


```bash
    # Кроме того, можно использовать следующую команду для удаления всех контейнеров в остановленном (Exited) состоянии:
    docker rm -v $(docker ps -a -q -f status=exited)
    #Чтобы удалить (так называемые) висящие тома, вы должны ввести следующую команду:
    docker volume rm $(docker volume ls -qf dangling=true)
    # Наконец, введите следующую команду, чтобы убедиться, что задача очистки завершена:
    docker volume ls -qf dangling=true | xargs -r docker volume rm
```


```bash
#! /bin/sh означает, что этот скрипт использует /bin/sh для интерпретации и выполнения, #! — это специальный индикатор, за которым следует путь оболочки, которая интерпретирует этот скрипт
#!/bin/bash
docker rmi $ (docker images -q -f dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)
0 0 1 ~/docker_clean.sh > /dev/null 2>&1
```

```bash
chmod 755 ~/docker_clean.sh
# Где USER — это реальное имя пользователя
sudo usermod -aG docker USER
# После выхода и повторного входа мы создаём задачу cron, введя следующую команду
crontab –e
# Сохранить и закрыть файл crontab. После этого каждый день в полночь Docker будет автоматически выполнять задачи очистки, и вы сможете испытать чистый, аккуратный Docker.

```
Ссылки:[4 практических совета для «большой уборки» вашего Docker](https://yq.aliyun.com/articles/279136?spm=a2c4e.11153959.0.0.16b9d55awTBOj5)


#### 【Настоятельно рекомендуется】Способ 2

```
docker system prune -a
docker system prune --volumes
```

### Устранение неполадок OOM

```bash
grep -i OOM -A 5 -B 5 /var/log/messages
docker ps -a | grep 5c223ed
```

```bash
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Tasks state (memory values in pages):
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26934]     0 26934      411      128    40960        0           937 entrypoint.sh
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26981]     0 26981    48758     1814   118784        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26982] 65534 26982    69086    25949   323584        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26983] 65534 26983    70117    26791   331776        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26986] 65534 26986    68812    25937   323584        0           937 php-fpm7
--
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  23381] 65534 23381    51941     8278   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29842] 65534 29842    51729     8041   180224        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29854] 65534 29854    50988     7278   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  30426] 65534 30426    52385     8720   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [    317] 65534   317    51335     7618   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,mems_allowed=0,oom_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task=php-fpm7,pid=26865,uid=65534
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Memory cgroup out of memory: Killed process 26865 (php-fpm7) total-vm:367860kB, anon-rss:177544kB, file-rss:1720kB, shmem-rss:13216kB
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom_reaper: reaped process 26865 (php-fpm7), now anon-rss:0kB, file-rss:0kB, shmem-rss:13216kB
```

`5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702` — это ID контейнера, в котором произошёл OOM

## [Советы по Dockerfile](https://mp.weixin.qq.com/s?__biz=MzI1OTY2MzMxOQ==&mid=2247486135&idx=2&sn=0136343fedfb03d18ecd52f4b0297250&chksm=ea743e0fdd03b719a4e31b0bf508d305c8ea95595fa6f94d1d149a1f39af950a97a08c21b831&mpshare=1&scene=23&srcid=0722hfZqf9tVS6zNAMxua63c#rd)

Изменяющиеся слои поместить в конец, кэшируемые слои поместить в начало

```
apt-get -y install -–no-install-recommends
rm -rf /var/lib/apt/lists/*
```

## Поиск информации о контейнере по PID

```bash
{% raw %}
  docker ps -q | xargs docker inspect --format '{{.State.Pid}}, {{.ID}}, {{.Name}}, {{.Config.Image}}' | grep "^${PID},"
{% endraw %}
```

PS: результат команды docker inspect — это json, можно сначала не добавлять format, затем определить формат самостоятельно

Ссылки:
[CoreOS - get docker container name by PID?](https://stackoverflow.com/questions/24406743/coreos-get-docker-container-name-by-pid)

## Сортировка docker ps

```bash
{% raw %}

docker ps --format "table {{.ID}}\t{{.Image}}" | (read -r; printf "%s\n" "$REPLY"; sort -k 2 )

docker ps [--format="TEMPLATE"]

--format="TEMPLATE"
  Красиво выводить контейнеры с помощью Go-шаблона.
  Допустимые заполнители:
     .ID - ID контейнера
     .Image - ID образа
     .Command - Команда в кавычках
     .CreatedAt - Время создания контейнера.
     .RunningFor - Прошедшее время с момента запуска контейнера.
     .Ports - Открытые порты.
     .Status - Статус контейнера.
     .Size - Размер диска контейнера.
     .Names - Имена контейнеров.
     .Labels - Все метки, назначенные контейнеру.
     .Label - Значение конкретной метки для этого контейнера. Например {{.Label "com.docker.swarm.cpu"}}
     .Mounts - Имена томов, смонтированных в этом контейнере.

{% endraw %}
```

[Ссылки](https://stackoverflow.com/questions/46173298/how-to-sort-or-order-results-docker-ps-format)

## Не могу больше учиться

Не можете выучить команды docker? Не проблема, [lazydocker](https://github.com/jesseduffield/lazydocker) поможет вам, где не понимаете — нажимайте, маме больше не нужно беспокоиться о моих проблемах с docker.

## Ссылки:

1. [Основы Docker — понимание связи между контейнерами](https://kevinguo.me/2017/08/23/Docker-container-communication/)
2. [【docker】Подробное объяснение команды docker run](https://blog.csdn.net/one_clouder/article/details/39224767)
3. [Как передать параметры проекту внутри docker при запуске docker](https://blog.csdn.net/wsbgmofo/article/details/79173920)
4. [Сетевые узкие места при использовании Docker](http://wiki.jikexueyuan.com/project/openresty/web/docker.html)
5. [Как написать docker-compose.yml, справочная документация Docker compose file](https://deepzz.com/post/docker-compose-file.html)
6. [Глубокое понимание Docker Volume (один)](http://dockone.io/article/128)
7. [Use volumes](https://docs.docker.com/storage/volumes/)
8. [Управление контейнерами Docker (Container)](https://itbilu.com/linux/docker/4kkTyS8Pf.html#docker-inspect)
9. [Install Docker Compose](https://docs.docker.com/compose/install/)
