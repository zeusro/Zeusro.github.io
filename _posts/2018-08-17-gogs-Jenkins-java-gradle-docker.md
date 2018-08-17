---
layout:       post
title:        "Gog+Jenkins+java+docker构建(gradle版)"
subtitle:     ""
date:         2018-08-17
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Java
    - CI
    - Jenkins
    - docker
---


## 前言

    接收到 gogs 的推web hook 之后,Jenkins对Java 项目进行自动构建/测试,最后将应用容器化,推送到私有 docker 源(阿里云)


## 前期准备

1. gitea/gogs
1. Jenkins
    1. Mask Passwords Plugin
    1. Generic Webhook Trigger
    1. Gogs plugin
    1. Gradle Plugin    


## java项目的配置

    自定义私有框架依赖,那么前置工作需要先更新Jenkins环境的依赖,打包到 maven local 里面.gradle 同理(gradle可以指定先读取本地 maven 依赖,所以都一样).


- 插件的选择:com.palantir.docker

    gradle <module>:build -x test --debug  <module>:docker

    gradle比 maven 好的地方就在于简洁高效,而且可以继续复用 mavenlocal 和 maven 的远程仓库.

```yaml
apply plugin: 'com.palantir.docker'
apply plugin: 'application'
apply plugin: 'org.springframework.boot'


group = '${docker-registry}'
version = project.findProperty('projVersion') ?: '3.0.7'
mainClassName = 'com.zeusro.SBApplication'

buildscript {
    ext {
        springBootVersion = '2.0.4.RELEASE'
    }
    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }
    dependencies {
        classpath("org.springframework.boot:spring-boot-gradle-plugin:${springBootVersion}")
        classpath('gradle.plugin.com.palantir.gradle.docker:gradle-docker:0.19.2')
    }
}


tasks.withType(JavaCompile) {
	options.encoding = 'UTF-8'
}
dependencies {
    
    compile 'org.mybatis.spring.boot:mybatis-spring-boot-starter:1.3.0'
    compile group: 'org.springframework.boot', name: 'spring-boot-starter-thymeleaf', version: '2.0.4.RELEASE'
    testCompile group: 'org.springframework.boot', name: 'spring-boot-starter-test', version: '2.0.4.RELEASE'
    compile group: 'org.springframework.data', name: 'spring-data-redis', version: '2.0.6.RELEASE'
    compile 'net.sourceforge.nekohtml:nekohtml:1.9.21'
}

docker {
    dockerfile file('Dockerfile') //DockerFile路径
    name "${project.group}/${jar.baseName}:${jar.version}"
    files jar.archivePath
    buildArgs(['JAR_FILE': "${jar.archiveName}"])
}

```

## 自动化构建的理念

    源代码分为 master 和 develop分支
    
    develop 对应 docker image的 latest 版本,表示每日更新;
    master 提取gradle 的 version 作为tag, 表示一种稳定的发布.master 触发有2种机制,一种是 tag event,一种是merge/push event.因为 tag 事件需要自己写一些 git的操作,所以我一般偷懒,选择 merge/push event 作为触发.
    本文将先后介绍2种触发方式在 Jenkins 配置上面的细微差别.
    


## Jenkins 的配置



















