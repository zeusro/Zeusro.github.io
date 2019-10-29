---
layout:       post
title:        "在kubernetes上面使用Jenkins"
subtitle:     ""
date:         2019-10-29
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Jenkins
    - CI
---

阿里云swam宣布退市了,把上面的 Jenkins 移到 kubernetes 这边.

直接用 taint node + hostpath 了事.

```
node=c
kubectl taint node $node jenkins-ready=true:NoExecute
```

## 制作 docker 镜像

```dockerfile
FROM jenkins/jenkins:latest
USER root
ARG dockerGid=999
RUN echo "docker:x:${dockerGid}:jenkins" >> /etc/group
USER jenkins
```

## 服务器调整

原先的 docker-compose.yaml 长这样

```yaml
jenkins:
  image: 'jenkins-docker:latest'
  expose:
    - 50000/tcp
    - 8080/tcp
  volumes:
    - '/var/jenkins_home:/var/jenkins_home'
    - '/var/run/docker.sock:/var/run/docker.sock'
    - '/usr/bin/docker:/usr/bin/docker'
    - '/usr/lib/x86_64-linux-gnu/libltdl.so.7:/usr/lib/x86_64-linux-gnu/libltdl.so.7'
    - '/usr/local/maven:/usr/local/maven'
    - '/opt/gradle:/opt/gradle'
    - '/etc/localtime:/etc/localtime'
    - '/etc/timezone:/etc/timezone'
  environment:
    - 'LANG=C.UTF-8'
    - 'JAVA_HOME=/docker-java-home'
    - 'JENKINS_HOME=/var/jenkins_home'
    - 'JENKINS_SLAVE_AGENT_PORT=50000'
    - 'TINI_SHA=6c41ec7d33e857d4779f14d9c74924cab0c7973485d2972419a3b7c7620ff5fd'
    - 'JENKINS_UC=https://updates.jenkins.io'
    - 'JENKINS_UC_EXPERIMENTAL=https://updates.jenkins.io/experimental'
    - 'COPY_REFERENCE_FILE_LOG=/var/jenkins_home/copy_reference_file.log'
  restart: always
```

### 安装maven,Gradle

```bash
yum install -y maven
# mvn --version
Apache Maven 3.0.5 (Red Hat 3.0.5-17)
Maven home: /usr/share/maven
Java version: 1.8.0_232, vendor: Oracle Corporation
Java home: /usr/lib/jvm/java-1.8.0-openjdk-1.8.0.232.b09-0.el7_7.x86_64/jre
Default locale: en_US, platform encoding: UTF-8
OS name: "linux", version: "5.3.7-1.el7.elrepo.x86_64", arch: "amd64", family: "unix"
```

```bash
yum install -y unzip
mkdir /opt/gradle
unzip -d /opt/gradle gradle-5.6.3-bin.zip
# 配置环境变量
nano ~/.bash_profile
PATH=$PATH:/opt/gradle/gradle-5.6.3/bin
source ~/.bash_profile
gradle -v

------------------------------------------------------------
Gradle 5.6.3
------------------------------------------------------------

Build time:   2019-10-18 00:28:36 UTC
Revision:     bd168bbf5d152c479186a897f2cea494b7875d13

Kotlin:       1.3.41
Groovy:       2.5.4
Ant:          Apache Ant(TM) version 1.9.14 compiled on March 12 2019
JVM:          1.8.0_232 (Oracle Corporation 25.232-b09)
OS:           Linux 5.3.7-1.el7.elrepo.x86_64 amd64
```

### 迁移 Jenkins home 和缓存的包

新机器的数据盘目录是
/var/lib/docker

Jenkins目录决定位于
/var/lib/docker/jenkins

```bash

scp -c blowfish -r root@172.18.220.238:/var/jenkins_home /var/lib/docker/jenkins
cd /var/lib/docker/jenkins
mv jenkins_home/* /var/lib/docker/jenkins
scp -c blowfish -r root@172.18.220.238:/root/.gradle /root/.gradle
scp -c blowfish -r root@172.18.220.238:/root/.m2/repository /root/.m2/repository
```

## 准备yaml


## 结果

果然翻车,看了一下容器日志,出现

```
touch: cannot touch '/var/jenkins_home/copy_reference_file.log': Permission denied
Can not write to /var/jenkins_home/copy_reference_file.log. Wrong volume permissions?
```
