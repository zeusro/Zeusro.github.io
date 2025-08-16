---
layout:       post
title:        "Concourse-CI集成maven/gradle项目"
subtitle:     "Concourse-CI从入门到摔桌"
date:         2018-09-02
author:       "Zeusro"
header-img:   "img/b/2018/psc.jpeg"
header-mask:  0.3
catalog:      true
published:   false
tags:
    - DevOps
    - Java
    - Gradle
    - Maven
---


## 前言

我们要做的事情很简单,用Concourse这个工具拉取私有代码库的Java源代码,构建然后推送到阿里云仓库.

我希望看这篇文章的人能够重点看前面几段内容,而不是学会了皮毛,但没办法理解这个工具的设计理念.

## 概念介绍
> **Pipeline是一等公民：Concourse以pipeline机制运行集成任务。pipeline将Task、Resource、Job三者有机地结合起来。**
> 
> 任务（Task）是执行的基本单元，表现为在一个全新启动的容器中所运行的脚本。容器已经经过了预处理，因此其中包含了一个输入与输出目录，任务脚本可在这些目录中运行。
> 
> 资源（Resource）则表现为版本化资源的抽象位置，例如某个repository。资源也可用于对进入或退出某个管道的外部依赖进行建模，或是表示更抽象的概念，例如时间触发器等等。资源的变更可被检测（检查）、获取（获得）以及发布（推送）。不同的资源类型（例如Git、AWS S3或触发器）可用于封装用于管道的各种样板代码，为Concourse的扩展提供了一个可适配的接口。
> 
> 作业（Job）是由资源与任务构成的，通过构建计划实现。作业可由资源的变更所触发，也可以选择手动触发，以实现人工批准流程。
>
> **节选自[Concourse：可扩展的开源CI管道工具](http://www.infoq.com/cn/news/2016/05/concourse)**

## 前期心理准备

> Concourse-CI 是一个很坑爹的开源项目.
文档写的简直狗屎,如果不是2个资深同事帮助,估计我早已摔锅走人.
> 
> 我花了整整3天学习之后,蓦然回首,发现最好用的其实还是 `fly -h`这个命令.它解释了Concourse-CI能够做的所有事情.
> 
> 初学这玩意的时候,一定要弄清概念.
>
> 一开始的时候,他这个所谓的**管道**对我来说简直就是我们家乡逢雨必浸的破水沟,简直狗屁不通.我们用`Jenkins`也好,直接`本地构建`也罢,其实是基于`同一个上下文`.我们在同一个环境下cd来cd去,然后gradle build/mvn install云云.
> 
> 但是Concourse的上下文一开始对我来说是极其割裂的.每一个子任务都是在各自不同的镜像上面跑.再加上配置job的文件是在本地,搞得当时我根本分不清环境变量到底哪个环境的变量(本地环境,Concourse所在的服务器环境,job/task里面的docker环境)...
> 
> 但随着学习的深入,这上面的一段话其实是一段误解.`task`可以通过`inputs`接收`resources`的结果.`task`与`task`之间通过`inputs`和`outputs`传递结果.
> 
> **理解这个上下文,后面的工作就好办多了.**
>
> 而`fly`命令是基于本地的,那么`-v`的内容其实也是基于本地上下文.
>
> 而我们的构建工作也变得相当的清晰.

## 前期准备

### 本地环境
1. 安装`docker`,`docker-compose`.
1. 下载配置fly工具[fly](https://concourse-ci.org/download.html)
2. 

通过安装`fly`工具实现与服务器的通讯

### 服务器环境 docker-compose.yaml

```yaml

concourse-db:
  image: postgres:11-alpine
  hostname: concourse-db
  volumes:
    - /root/docker/concourse/database:/database
  environment:
    - 'POSTGRES_DB=concourse'
    - 'POSTGRES_PASSWORD=root'
    - 'POSTGRES_USER=root'
    - 'PGDATA=/database'

concourse-web:
  image: concourse/concourse:4.0.0
  hostname: concourse-web
  ports:
    - '9003:8080'
  command: web
  volumes:
    - /root/docker/concourse/keys/web:/concourse-keys
  environment:
    - 'CONCOURSE_POSTGRES_HOST=concourse-db'
    - 'CONCOURSE_POSTGRES_DATABASE=concourse'
    - 'CONCOURSE_POSTGRES_USER=root'
    - 'CONCOURSE_POSTGRES_PASSWORD=root'
    - 'CONCOURSE_EXTERNAL_URL=https://ci.zeusro.io'
    - 'CONCOURSE_MAIN_TEAM_ALLOW_ALL_USERS=true'
    - 'CONCOURSE_ADD_LOCAL_USER=zeusro:pwd'
  labels:
    aliyun.depends: concourse-db

concourse-worker:
  image: concourse/concourse:4.0.0
  privileged: true
  command: worker --work-dir /opt/concourse/worker
  volumes:
    - /root/docker/concourse/keys/worker:/concourse-keys
    - /root/docker/concourse/worker:/opt/concourse/worker
  environment:
    - 'CONCOURSE_TSA_HOST=concourse-web:2222'
    - 'CONCOURSE_GARDEN_DNS_SERVER=114.114.114.114'
  labels:
    aliyun.depends: concourse-web
```

1. 数据卷要按需指定目录
1. 如果不是在阿里云主机上面跑,`aliyun.depends`改为`docker-compose`的[depends_on](https://docs.docker.com/compose/compose-file/#depends_on)
2. CONCOURSE_EXTERNAL_URL按需绑定自己的域名
3. CONCOURSE_ADD_LOCAL_USER按需配置`Concourse-CI`的用户名和密码

    docker-compose up
    fly -t zeusro login -b -c https://ci.zeusro.io
    输入用户名,密码

### 构建用Java镜像

```
FROM openjdk:8-alpine3.8
LABEL maintainer="zeusro"
# 中国特色社会主义
RUN echo https://mirrors.ustc.edu.cn/alpine/v3.8/main > /etc/apk/repositories; \
echo https://mirrors.ustc.edu.cn/alpine/v3.8/community >> /etc/apk/repositories;\
echo "Asia/Shanghai" > /etc/timezone ;\
apk add --no-cache bash maven gradle 
```

我把这个镜像命名为`registry.cn-shenzhen.aliyuncs.com/amiba/openjdk:8-tools`


## 对构建的建模

我们先抛开一些,想一个问题:我现在有一台崭新的服务器,我要怎么部署Java的代码?

问题的答案基本可以归纳为以下的步骤.

1. 安装`git`,`maven`/`gradle`,`java JDK`,`docker`
2. git clone xx
3. mvn install 私有依赖
4. 执行主体项目的构建命令
5. 将生成的jar包打包到docker镜像里面
6. docker push

那么切换到 `Concourse-CI` 这个语境.这个步骤就变成了

1. 获取私有依赖,主体项目这N个`resources`(假设私有依赖可能有多个)
2. 在一个有`git`,`maven`/`gradle`,`java JDK`的环境里面执行构建任务(task)
3. 将生成的jar包打包到docker镜像里面(task)
4. docker push(put `resources`)



## Concourse-CI的构建上下文

每次构建任务开始时,我们通过`pwd`发现其每一次都是一个按照特定规则命名的临时目录.`inputs`,`outputs`,`cache`都是指定这个临时目录下的目录.

假设某次构建的临时目录是`/temp/xxx`

```
 inputs:
      - name: dependency1
      - name: dev-repo
      outputs:
      - name: dev-resource
      caches:
      - path: dependency-cache-1
```

那么这个配置产生的目录(`ls /temp/xxx`)就是

```
dependency1---------|私有依赖git仓库
dev-repo------------|主题项目git仓库
dev-resource--------|交付给下一个task的目录,下一个task用inputs接收
dependency-cache-1--|缓存的目录
```

## caches机制

首先问一个问题,为什么需要缓存这种机制?

这个问题得从依赖的还原机制入手.依赖一般是从本地缓存抓取文件,如果本地缓存没有这个文件,则从中心仓库里面拉取.但是`Concourse-CI`这个坑爹玩意是没有全局上下文这种东西的,每一次构建都是重新拉取镜像,那么如果不走缓存,这个下载依赖的动作就会在每一次的构建任务中重复进行.`caches`是为了解决这个问题而生.


## 开干

[我的示例项目](https://github.com/zeusro/spring-boot-template-with-Concourse-CI)

### 一开始的思路

一开始我的思路有点有问题,我分成了2个`task`:
1. `mvn install`私有依赖
2. `mvn install`主体项目

见maven分支的`concourse-ci-pipeline-1.yaml`文件

效果不是很理想.虽然用caches缓存了依赖包,但是2个`task`之间是通过cp操作连贯起来的.其实应该把2个task合为一个,这样就不存在上下文切换的问题.


### 改进版的思路

见master分支的`concourse-ci-pipeline-2.yaml`文件.

这个项目master用的gradle,maven版本的在maven分支.

## Concourse-CI的一些用法

以我这个项目为例

```bash
fly  -t zeusro set-pipeline -p spring-boot-template -c concourse-ci-pipeline.yaml \
-v "name=spring-boot-template" \
-v "repouri=ssh://git@github.com:zeusro/spring-boot-template.git" \
-v "repo-key=$(cat ~/.ssh/id_rsa)"  \
-v "dependency1uri=ssh://<基础依赖的仓库>" \
-v "image-name=<打包的阿里云镜像名称>"  \
-v "image-username=<登录镜像的用户名>"  \
-v 'image-password=<登录镜像的密码>'  ;
```

尖括号中间的内容自行按需替换即可

其实配置还可用文件方式指定

    fly -t amiba sp -p demo -c demo.yml -l demo/gradle.yml

![image](/img/in-post/concourse-ci/30BA710A5D04F0CD5E5B9C222FB34A33.jpg)


执行sq之后,
1. web UI相应的`Pipelines`上点播放键;
2. `fly -t zeusro trigger-job --job spring-boot-demo/dev-build`手动触发.
3. `resources`的特定事件
4. 

这些都能够触发相应`Pipelines`的执行.

    fly -t zeusro watch --job spring-boot-demo/dev-build --build 2
    
这个是实时查看命令的输出信息

    fly -t zeusro abort-build --job spring-boot-demo/dev-build --build 1
    
这个命令是废止特定构建


### 好用的命令集锦

```bash
fly -h
fly -t zeusro builds
fly -t zeusro watch --job spring-boot-demo/dev-build --build 2
fly -t zeusro abort-build --job spring-boot-demo/dev-build --build 1
fly -t zeusro trigger-job --job spring-boot-demo/dev-build
```

## 备注

1. 要留意dockerfile里面alpine,gradle,mvn的版本,避免误事

默认的`gradle`cache在

    /root/.gradle/caches/modules-2/files-2.1/

默认的`maven`repository在

    /root/.m2/repository/

## 结论

> 这玩意真他妈坑爹,有问题各位自己解决,谁爱搞谁去~

## 参考链接:
    
1. [Introduction to Concourse](https://concoursetutorial.com/)
2. [在阿里云容器服务上，轻松搭建Concourse CI](https://yq.aliyun.com/articles/178450)
3. [实战：用Concourse实现端到端的蓝绿部署](http://www.10tiao.com/html/341/201807/2651202189/1.html)
4. [Concourse学习：介绍和实践](http://ju.outofmemory.cn/entry/305358)
5. [Concourse caching with Maven/Gradle](https://github.com/bijukunjummen/ci-concourse-caching-sample)
6. [Concourse CI 介绍](https://blog.waterstrong.me/concourse-ci/)
7. [Concourse：可扩展的开源CI管道工具](http://www.infoq.com/cn/news/2016/05/concourse)
