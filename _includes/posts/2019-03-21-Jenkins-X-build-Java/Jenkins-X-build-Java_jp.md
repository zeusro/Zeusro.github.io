<!-- TODO: Translate to jp -->

`Jenkins-X`默认提供了不同语言的[各种例子](https://jenkins.io/doc/pipeline/tour/hello-world/#examples),我们先学习默认的例子,再按照自身情况做一些适配.

先梳理一下构建流程

从git server(GitHub/gitea)拉取代码->构建docker镜像->推送到镜像仓库

建议一开始用[jx create](https://jenkins-x.io/commands/jx_create_quickstart/)创建官方的例子,推送到  GitHub,熟悉以后再慢慢修改

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

## 前置准备

### Disable https certificate check

域名没证书的得勾上,路径在`Manage Jenkins`-`Configure System`

### 修改 Kubernetes Pod Template

`Jenkins`是拉取到Jenkins的工作目录(服务器),而`Jenkins-X`是根据设置的模板启动启动一个pod,这个pod有2个容器,一个是`jnlp-slave`,另外一个是构建工具的镜像,如果是`gradle`构建的话镜像就是`gcr.io/jenkinsxio/builder-gradle`.

所以需要一下模板.路径在`Manage Jenkins`-`Configure System`-`Images`-`Kubernetes Pod Template`,按照特定构建语言迁移,修改.


### 依赖项加速

- maven加速

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

- gradle加速

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


## 构建前置依赖

有3种思路,任选一种即可.推荐第一种

### [推荐]交付到mvn local

这个思路是在我构建缓存时想到的.普通的pipeline构建流程,每次构建都是一个从零开始的沙箱,需要重新下载包再去构建.非常浪费流量.因此如果把mvnlocal挂载到容器内部,那么直接在本地还原即可,有问题时再从网络拉取.

这样就能同时解决`构建前置依赖`和`开源依赖拉取`的问题

目前支持的volume有

1. PVC
1. NFS
1. hostpath

推荐用NFS.

gradle:挂载到`/root/.gradle/caches`

maven:挂载到`/root/.mvnrepository`


### 交付给Nexus

todo

### 关联其他pipeline

todo

## 从其他git server(gitea)拉取代码

```bash
jx create git server gitea http://xxx:1080
# jx delete git server gitea
jx get git
```

目前删除的命令还比较蠢,只能按类型删除,如果加了2个gitea类型的git server,删除的时候会先删除最早创建的那个gitea server




## 构建docker镜像

构建依赖于项目内的`Jenkinsfile`和`Dockerfile`

关于`Jenkinsfile`的语法,另写一篇文章讲解


## 推送docker镜像到自定义源

- 修改DOCKER_REGISTR

默认的设定是推送到创建`Jenkins-X`时建立的docker REGISTRY,要把它改成我们自己的服务器

配置路径: `Manage Jenkins`-`Global properties`

修改DOCKER_REGISTRY这个变量

```
# 阿里云深圳vpc
registry-vpc.cn-shenzhen.aliyuncs.com/
```

- [jx create docker](https://jenkins-x.io/commands/jx_create_docker/)

```bash
jx create docker auth \
--host "registry-vpc.cn-shenzhen.aliyuncs.com" \
--user "foo" --secret "FooDockerHubToken" \
--email "fakeemail@gmail.com"
```

之后在部署该`Jenkins-X`实例的kubernetes 命名空间,会出现`jenkins-docker-cfg`的secret,这个secret是一个json

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

要让容器通过这个json里面的auth字段,实现对docker registry的登录.

所以还需要把这个secret挂载到容器内部,还好这一步默认的pod template已经设置了.

![Image](/img/in-post/jenkins-x-build-java/volume-jenkins-docker-cfg.png)


除此以外,还有其他的[授权方法](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/docker-registry.md)


## 参考链接:

1. [Jenkins X构建例子](https://github.com/jenkins-x-buildpacks/jenkins-x-kubernetes/tree/master/packs)
1. [pod-templates](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/pod-templates.md)
1. [基于 Kubernetes 实践弹性的 CI/CD 系统](https://yq.aliyun.com/articles/690403)