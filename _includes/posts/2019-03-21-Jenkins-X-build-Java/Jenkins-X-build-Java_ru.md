`Jenkins-X` по умолчанию предоставляет [различные примеры](https://jenkins.io/doc/pipeline/tour/hello-world/#examples) для разных языков. Сначала мы изучаем примеры по умолчанию, затем адаптируем их согласно нашей собственной ситуации.

Сначала давайте разберемся с процессом сборки:

Получить код с git-сервера (GitHub/gitea) -> Собрать docker-образ -> Отправить в реестр образов

Рекомендуется использовать [jx create](https://jenkins-x.io/commands/jx_create_quickstart/) для создания официальных примеров в начале, отправить в GitHub, а затем медленно изменять после ознакомления.

```
jx create spring -d web -d actuator
jx create quickstart -l java
jx create quickstart \
 -l java \
 --docker-registry-org zeusro \
 --git-username zeusro \
 --org  zeusro \
 --git-provider-kind gitea \
 --git-provider-url  https://gitea.com \
 --git-host  https://gitea.com  \
 --import-commit-message init \
 --name java-abcde \
 --project-name  java-abcde
```

## Предварительные требования

### Отключить проверку https-сертификата

Для доменов без сертификатов установите это. Путь: `Manage Jenkins`-`Configure System`

### Изменить Kubernetes Pod Template

`Jenkins` получает в рабочий каталог Jenkins (сервер), в то время как `Jenkins-X` запускает под на основе настроенного шаблона. Этот под имеет 2 контейнера, один — `jnlp-slave`, а другой — образ инструмента сборки. Если это сборка `gradle`, образ — `gcr.io/jenkinsxio/builder-gradle`.

Поэтому вам нужен следующий шаблон. Путь: `Manage Jenkins`-`Configure System`-`Images`-`Kubernetes Pod Template`, мигрируйте и изменяйте в соответствии с конкретным языком сборки.


### Ускорение зависимостей

- ускорение maven

```xml
<?xml version="1.0" encoding="utf-8"?>
<settings xmlns="https://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>alimaven</id>
      <mirrorOf>central</mirrorOf>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/repositories/central/</url>
    </mirror>
  </mirrors>
  <profiles>
    <profile/>
  </profiles>
</settings>
```

- ускорение gradle

```
allprojects {
    apply plugin: 'maven'
    group = 'com.hh.onekey'
    version = '2.0.0'
}
subprojects {
    apply plugin: 'java'
    sourceCompatibility = 1.8
    targetCompatibility = 1.8

    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }


    dependencies {
        testCompile group: 'junit', name: 'junit', version: '4.12'
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }
}
```


## Предпосылки сборки

Есть 3 подхода, выберите любой. Первый рекомендуется.

### [Рекомендуется] Доставить в mvn local

Эта идея пришла мне в голову при сборке кэша. В обычном процессе сборки pipeline каждая сборка — это песочница с нуля, требующая повторной загрузки пакетов перед сборкой. Очень расточительно по трафику. Поэтому, если mvnlocal смонтирован внутри контейнера, то можно напрямую восстановить локально, а при проблемах загрузить из сети.

Это может решить как проблему `предпосылок сборки`, так и проблему `загрузки зависимостей с открытым исходным кодом`.

В настоящее время поддерживаемые тома:

1. PVC
1. NFS
1. hostpath

Рекомендуется NFS.

gradle: Монтировать в `/root/.gradle/caches`

maven: Монтировать в `/root/.mvnrepository`


### Доставить в Nexus

todo

### Связать с другими pipeline

todo

## Получить код с другого git-сервера (gitea)

```bash
jx create git server gitea http://xxx:1080
# jx delete git server gitea
jx get git
```

В настоящее время команда удаления все еще довольно глупа, может удалять только по типу. Если добавлено 2 git-сервера типа gitea, при удалении сначала удалится самый ранний созданный gitea-сервер.




## Собрать docker-образ

Сборка зависит от `Jenkinsfile` и `Dockerfile` в проекте.

Что касается синтаксиса `Jenkinsfile`, я напишу другую статью для объяснения.


## Отправить docker-образ в пользовательский реестр

- Изменить DOCKER_REGISTR

Настройка по умолчанию — отправка в docker REGISTRY, созданный при создании `Jenkins-X`. Нужно изменить на наш собственный сервер.

Путь конфигурации: `Manage Jenkins`-`Global properties`

Изменить переменную DOCKER_REGISTRY

```
# Alibaba Cloud Shenzhen vpc
registry-vpc.cn-shenzhen.aliyuncs.com/
```

- [jx create docker](https://jenkins-x.io/commands/jx_create_docker/)

```bash
jx create docker auth \
--host "registry-vpc.cn-shenzhen.aliyuncs.com" \
--user "foo" --secret "FooDockerHubToken" \
--email "fakeemail@gmail.com"
```

После этого в пространстве имен kubernetes, где развернут этот экземпляр `Jenkins-X`, появится секрет с именем `jenkins-docker-cfg`. Этот секрет — это json.

```json
{
	"auths": {
		"registry-vpc.cn-shenzhen.aliyuncs.com": {
			"auth": "xxxxxxxxxx",
			"email": "fakeemail@gmail.com"
		}
	}
}
```

Чтобы контейнеры могли войти в docker-реестр через поле auth в этом json.

Поэтому этот секрет также нужно смонтировать внутри контейнера. К счастью, шаблон пода по умолчанию уже установил этот шаг.

![Image](/img/in-post/jenkins-x-build-java/volume-jenkins-docker-cfg.png)


Кроме этого, есть другие [методы авторизации](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/docker-registry.md)


## Ссылки:

1. [Примеры сборки Jenkins X](https://github.com/jenkins-x-buildpacks/jenkins-x-kubernetes/tree/master/packs)
1. [pod-templates](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/pod-templates.md)
1. [Практика эластичных систем CI/CD на основе Kubernetes](https://yq.aliyun.com/articles/690403)
