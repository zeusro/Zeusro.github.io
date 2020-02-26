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

containerd

Container Runtime Interface (CRI)

OCI（Open Container Initiative）


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
1. [](https://www.cloudfoundry.cn/cloud-native-glossary/)
1. []()