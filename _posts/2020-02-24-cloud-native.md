---
layout:       post
title:        "cloud native相关概念（WIP:持续补充中）"
subtitle:     ""
date:         2020-02-24
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - cloud native
---

Cloud-native

Cloud-native development is not concerned where a new app or service is hosted, but how it is created. Cloud-native principles state the apps and services shall be hosted in distributed system environments that are capable of scaling to tens of thousands of self-healing, multi-tenant nodes. They must be packaged in containers, managed dynamically, and oriented around microservices.

## docker 相关

![](https://docs.docker.com/engine/images/architecture.svg)



## 行业标准

### [containerd](https://containerd.io/docs/)

```
An industry-standard container runtime with an emphasis on simplicity, robustness and portability
行业标准的容器运行时，着重于简单性，健壮性和可移植性
```

他们的主要项目有：

[https://containerd.io/docs/](containerd)

参考链接：
[Containerd 简介](https://www.cnblogs.com/sparkdev/p/9063042.html)

Container Runtime Interface (CRI)

OCI（Open Container Initiative）

## 行业组织

### Cloud Native Computing Foundation（CNCF）

[CNCF全家福](https://landscape.cncf.io/)

- Technical Oversight Committee （TOC）

CNCF 的技术监督委员会由 9 位具有丰富技术知识和行业背景的代表组成，为云原生社区提供技术领导。

 ### [OCI](https://www.opencontainers.org/)(Open Container Initiative)

 The Open Container Initiative (OCI) is a lightweight, open governance structure (project), formed under the auspices of the Linux Foundation, for the express purpose of creating open industry standards around container formats and runtime. The OCI was launched on June 22nd 2015 by Docker, CoreOS and other leaders in the container industry

#### [runc](https://github.com/opencontainers/runc)

> RunC 是一个轻量级的工具，它是用来运行容器的，只用来做这一件事，并且这一件事要做好。我们可以认为它就是个命令行小工具，可以不用通过 docker 引擎，直接运行容器。事实上，runC 是标准化的产物，它根据 OCI 标准来创建和运行容器。而 OCI(Open Container Initiative)组织，旨在围绕容器格式和运行时制定一个开放的工业化标准。

参考链接:
[RunC 简介](https://www.cnblogs.com/sparkdev/p/9032209.html) 

## kubernetes 相关

## service mesh 相关

## 其他概念

### Platform-as-a-Service (PaaS)

This term refers to the software that sits between applications and infrastructure in the cloud. Platforms are designed to work with private and public clouds, as well as the various hybrid approaches that are becoming popular with enterprises. The platform is used to deploy and manage applications on whatever infrastructure has been chosen, removing much of the burden of managing the setup and operational details of the infrastructure.

### CaaS

Containers-as-a-Service emerged with the rise of Docker, and is now used to describe the delivery of web apps written to any container technology. It is often compared to Platform-as-a-Service (PaaS), although the two terms are not necessarily discrete. (For example, Docker is often considered to be the platform for apps written to it, and the Cloud Foundry platform has its own containers as part of the platform.)

### DevOps

This is an approach rather than a product, and is essential to the successful development and deployment of applications to the cloud. The term comes from combining the terms “Development” and “Operations.” Its creation brings together two groups within enterprise IT that often consider themselves opposed to one another. Boiled down to essence, developers focus on software and value features and benefits, while operators focus on how software runs on hardware, and value deadlines and performance. Developers live in a world of unlimited possibilities, while operators will say they live in the “real world” of hard truths. To date, the largest group of Cloud Foundry Runtime users still come from the dev side, according to recent research by the Cloud Foundry Foundation.

### Function-as-a-Service

Abbreviated as FaaS, this is a relatively new term associated with emerging serverless infrastructure. Just as serverless is typically deployed to handle small, fast, event-driven demands that are found particularly in IoT (Internet of Things) deployments, FaaS is an approach that does not go through ongoing application services. Response times are expected to be very fast (in the milliseconds).

### Virtualization

This term has been in use within IT for several decades to describe any computing resource that can be separated, or “abstracted,” from its hardware. For cloud computing, it means that server resources can be separated from their original systems and pooled into virtual machines. This approach allows a higher percentage of each individual server to be put to use and provides a way for users to scale up and scale down access to server resources as needed.

### Virtual Machine

The idea of virtualization within enterprise IT is an old one, often used to describe memory management in an earlier age of Unix-based systems. Today, a “virtual machine” is an instance within cloud computing infrastructure that appears to the user to be a real system with specific resources. However, this system is being created by the provider out of resources from several systems, to maximize the use of resources within a datacenter facility while maintaining the expected features and performance expected by the user.


参考链接
1. [cloud-native-glossary](https://www.cloudfoundry.cn/cloud-native-glossary/)
1. [container-runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)
1. [Docker 生态概览](https://www.cnblogs.com/sparkdev/p/8998546.html)
1. []()
1. []()
1. []()