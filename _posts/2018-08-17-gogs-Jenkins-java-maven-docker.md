---
layout:       post
title:        "Gog+Jenkins+java+docker构建(maven版)"
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

    接收到 Gogs 的推web hook 之后,Jenkins对Java 项目进行自动构建/测试,最后将应用容器化,推送到私有 docker 源(阿里云)

    

## 前期准备


1. gitea/Gogs
1. Jenkins
	1. Mask Passwords Plugin
	1. Generic Webhook Trigger
	1. Gogs plugin
    1. Maven Integration plugin
	1. 
	1. 
	1. 
	1. 
	1. 

也许可用到的 Jenkins 插件:Deploy to container Plugin,Docker Plugin

## java项目的配置


    自定义私有框架依赖,那么前置工作需要先更新Jenkins环境的依赖,打包到 maven local 里面.gradle 同理(gradle可以指定先读取本地 maven 依赖,所以都一样).

- 插件的选择(1):dockerfile-maven-extension

    我对这个插件比较熟,所以我一般用这个.不过这插件有个限制, dockerfile 必须放在模块根目录里面.

    切换到模块所在的目录,然后执行`mvn install dockerfile:build -Dmaven.test.skip=true`,源代码没问题的话就可以在 docker image ls里面看到 **${docker.image.host}/${docker.image.image}:${project.version}** 的产生.

pom.xml
```xml
	<properties>
		<docker.image.host>${docker-registry}</docker.image.host>
		<docker.image.image>${imagename}</docker.image.image>
		<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
		<project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
		<java.version>1.8</java.version>
	</properties>

<build>
		<extensions>
			<extension>
				<groupId>com.spotify</groupId>
				<artifactId>dockerfile-maven-extension</artifactId>
				<version>1.4.0</version>
			</extension>
		</extensions>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
			<plugin>
				<groupId>com.spotify</groupId>
				<artifactId>dockerfile-maven-plugin</artifactId>
				<version>1.4.0</version>
				<configuration>
					<repository>${docker.image.host}/${docker.image.image}</repository>
					<tag>${project.version}</tag>
					<buildArgs>
						<JAR_FILE>target/${project.build.finalName}.jar</JAR_FILE>
					</buildArgs>
				</configuration>
				<dependencies>
					<dependency>
						<groupId>org.codehaus.plexus</groupId>
						<artifactId>plexus-archiver</artifactId>
						<version>3.4</version>
					</dependency>
					<dependency>
						<groupId>javax.activation</groupId>
						<artifactId>javax.activation-api</artifactId>
						<version>1.2.0</version>
					</dependency>
				</dependencies>
			</plugin>
		</plugins>
	</build>
```

- 插件的选择(2):maven-dependency-plugin + docker-maven-plugin

    这2个插件比较复杂,主要因为它把 dockerfile 放到了项目的 docker 目录,导致需要copy-resources这一步

    切换到模块所在的目录,然后执行 `mvn ` 

pom.xml 
```xml

<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-jar-plugin</artifactId>
				<version>2.6</version>
				<configuration>
					<skip>true</skip>
					<archive>
						<manifest>
							<addClasspath>true</addClasspath>
							<classpathPrefix>lib/</classpathPrefix>
							<mainClass>com.amiba.zwd.pic.web.ZwdPicWebApplication</mainClass>
						</manifest>
					</archive>
					<outputDirectory>target/release</outputDirectory>
				</configuration>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-dependency-plugin</artifactId>
				<version>2.1</version>
				<executions>
					<execution>
						<id>copy-dependencies</id>
						<phase>package</phase>
						<goals>
							<goal>copy-dependencies</goal>
						</goals>
						<configuration>
							<includeScope>compile</includeScope>
							<outputDirectory>target/release/lib</outputDirectory>
						</configuration>
					</execution>
				</executions>
			</plugin>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-resources-plugin</artifactId>
				<version>2.6</version>
				<executions>
					<execution>
						<id>text</id>
						<phase>package</phase>
						<goals>
							<goal>copy-resources</goal>
						</goals>
						<configuration>
							<outputDirectory>target/release</outputDirectory>
							<encoding>UTF-8</encoding>
							<resources>
								<resource>
									<directory>config</directory>
									<includes>
										<include>*.*</include>
									</includes>
									<targetPath>config</targetPath>
								</resource>
								<resource>
									<directory>bin</directory>
									<includes>
										<include>*.*</include>
									</includes>
									<targetPath>bin</targetPath>
								</resource>
								<resource>
									<directory>src/main/docker</directory>
								</resource>
							</resources>
						</configuration>
					</execution>
				</executions>
			</plugin>
			<plugin>
				<groupId>com.spotify</groupId>
				<artifactId>docker-maven-plugin</artifactId>
				<version>0.4.13</version>
				<executions>
					<execution>
						<phase>package</phase>
						<goals>
							<goal>build</goal>
						</goals>
						<configuration>
							<imageName>${project.artifactId}:${project.version}</imageName>
						</configuration>
					</execution>
				</executions>
				<configuration>
					<dockerDirectory>target/release</dockerDirectory>
				</configuration>
			</plugin>
		</plugins>
	</build>
```

## 自动化构建的理念

    源代码分为 master 和 develop分支
    
    develop 对应 docker image的 latest 版本,表示每日更新;
    master 提取gradle 的 version 作为tag, 表示一种稳定的发布.master 触发有2种机制,一种是 tag event,一种是merge/push event.因为 tag 事件需要自己写一些 git的操作,所以我一般偷懒,选择 merge/push event 作为触发.
    本文将先后介绍2种触发方式在 Jenkins 配置上面的细微差别.
    


## Jenkins 的配置

- 创建的时候选择 maven job

- 配置触发器

如果是master merge/push 事件的话,Expression填`^(refs/heads/master)$`;

develop merge/push 事件的话,Expression填`^(refs/heads/develop)$`;

这个 Optional filter 很关键.

![image](/img/in-post/gogs-Jenkins-java-docker/006mOQRagy1ftoe5v08qvj30z50n7abz.jpg)

如果是 git 的 tag 事件的话,则是


![image](/img/in-post/gogs-Jenkins-java-docker/tag1.png)

![image](/img/in-post/gogs-Jenkins-java-docker/tag2.png)

参考:
[使用Generic Webhook Trigger插件实现Jenkins+WebHooks（码云）持续集成--指定具体项目和分支进行集成](https://blog.csdn.net/xlgen157387/article/details/76216351)

## gitea/gogs 的配置

加一个 gogs型的 web hook. 地址填 Jenkins job里面写的 url