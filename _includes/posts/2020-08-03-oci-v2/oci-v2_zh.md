最近在学习造核弹，刚好碰到 [Dragonfly](https://github.com/dragonflyoss/Dragonfly) 群里，来自蚂蚁金服的巴德大佬在直播分享另外一个子项目Nydus。

按照我的理解，Nydus是下一代容器格式的一种实现。其存在主要是为了解决旧的容器格式（container format）存在的问题。

那么问题来了，什么是 Nydus？什么是 container format？ Nydus 具体解决了什么问题。这里先来一波名词扫盲。

## 名词扫盲

实际上，容器技术从1979年发展至今已经超过[40年](https://www.infoq.cn/article/SS6SItkLGoLExQP4uMr5)，docker 只能说是目前为止，其中一种比较著名而流行的实现。可以说，docker 解决了应用分发的难题，为日后 kubernetes 的流行奠定了基础。

但是，俗话说得好，**勇士战胜恶龙之日，自身亦化作恶龙**。不管是 Docker 公司后来各种神操作（把项目改名 Moby ，docker swarm 的弱鸡编排）也好，CoreOS 的崛起也罢，**开源世界的战争，是一种技术标准的全球话语权争夺**，这种争夺远比你想象的要残酷。

### OCI

OCI全称 [Open Container Initiative](https://opencontainers.org/) ，隶属于Linux基金会，是Docker, CoreOS联合其他容器厂商，于 2015-6-22 建立的一个开源组织。其目的主要是为了制定容器技术的通用技术标准。

OCI旗下主要有2个项目：

1. [runtime-spec](https://github.com/opencontainers/runtime-spec)
2. [image-spec](https://github.com/opencontainers/image-spec)

### OCIv1

![image](/img/in-post/oci-v2/Container-Images.jpg)

[OCIv1]((https://github.com/opencontainers/image-spec/milestone/4)) 就是目前的容器格式。

### OCIv2

OCIv2 就是为了解决 OCIv1 的历史技术债务。

### Dragonfly Nydus

2020年4 月 10 日，由云原生计算基金会（CNCF）技术监督委员会投票决议，来自中国的开源项目 Dragonfly 正式晋升为 CNCF 孵化级别的托管项目，成为继 Harbor、TiKV 之后，第三个进入 CNCF 孵化阶段的中国项目。

![image](/img/in-post/oci-v2/Dragonfly.jpg)

Dragonfly 的架构主要是为了解决了大规模镜像下载、远距离传输、带宽成本控制、安全传输这四大难题。

![image](/img/in-post/oci-v2/Nydus-Architecture.jpg)

Nydus 是OCIv2的一种实现，计划捐给 Dragonfly ，作为其旗下一个子项目运作。

## 当前容器格式的问题

![image](/img/in-post/oci-v2/Prior-Community-Work-Comparison.jpg)

在直播分享中，巴德大佬提到了OCIv1的几个问题:

1. 分层效率很低
1. 数据没有校验
1. 可重建性问题

### 分层效率很低

![image](/img/in-post/oci-v2/h1.png)

分层效率低主要是指冗余性。如果把 docker image 比喻作汉堡包，镜像A是吉士汉堡包。

```dockerfile
FROM centos
```

![image](/img/in-post/oci-v2/h2.png)

镜像B是双层吉士汉堡包。

```dockerfile
FROM centos
RUN yum update -y
```

```bash
# 拉取吉士汉堡包
docker pull h1
# 拉取双层吉士汉堡包
docker pull h2
```

那么按照目前的设计，镜像之间是独立的，也就是说，拉取h1之后，虽然磁盘里面已经缓存了 centos 的底层镜像，但是拉取h2的时候，还是重新拉取整个镜像，并没有复用 centos 那个底层镜像。最终导致了磁盘的冗余和网络流量的浪费。

分层效率低还有另外一个体现。

```dockerfile
FROM ubuntu:14.04
ADD compressed.tar /
# 这里的删除只是一个标记，实际镜像大小 = compressed.tar * 2 + ubuntu:14.04
RUN rm /compressed.tar
ADD compressed.tar /
```

像这个 docker image ，实际在运行的时候， container 里面的根目录大小比镜像小得多。

所以，**镜像大小和容器大小有着本质的区别**。

### 数据没有校验(Verifiability)

这里稍加引述巴德大佬的话：

> 只读层被修改了，容器应用是不知道的。现在的OCI镜像格式下就有可能发生这种事情，镜像在构建和传输过程中是可校验的，但是镜像下载到本地后会被解压，解压后的文件的修改是无法探知的。
>
> 镜像需要下载，解压到本地文件系统，然后再交给容器去使用。这个流程中，解压到本地文件系统这一步是丢失可信的关键。

### workspace 可重建性问题(repairability)

可重建性可以从某种程度上解决 docker build 慢的问题。

以轻量级 kubernetes event导出组件 [kube-eventer](https://github.com/AliyunContainerService/kube-eventer/blob/master/deploy/Dockerfile)为例，

```dockerfile
FROM golang:1.14 AS build-env
ADD . /src/github.com/AliyunContainerService/kube-eventer
ENV GOPATH /:/src/github.com/AliyunContainerService/kube-eventer/vendor
ENV GO111MODULE on
WORKDIR /src/github.com/AliyunContainerService/kube-eventer
RUN apt-get update -y && apt-get install gcc ca-certificates
RUN make


FROM alpine:3.10

COPY --from=build-env /src/github.com/AliyunContainerService/kube-eventer/kube-eventer /
COPY --from=build-env /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

ENV TZ "Asia/Shanghai"
RUN apk add --no-cache tzdata
COPY deploy/entrypoint.sh /

ENTRYPOINT ["/kube-eventer"]
```

我们在机器A上反复执行docker build，每次的构建都是原子的，也就是说，每一次都是从上到下重新跑一遍。但实际上我们知道，很多指令都是重复的，没有必要重复执行。

可重建性还有另外一层意思，从机器A拷贝到机器B之后，继续构建docker image。

## 我的吐槽

在我看来，目前的 OCIv1 借鉴了 git 的设计，但本质是一个很难吃的汉堡包。只有最上面一层可以吃（读写）。

云原生应用的交付周期，一般是

> git Ops --> CI --> docker image --> waiting container/pod（docker pull，sandbox etc） --> running container/pod --> terminated container/pod

云原生应用的安全性由运行时环境和 docker container 组成，一个安全的 docker container ，应当尽量让它在各个环节里面，都没有可乘之机。

比如，从代码到CI的过程中，应当有静态代码分析 + 人工 code review 的机制，确保代码无安全性上的问题；从CI到 docker image 的构建过程中，应当让CI运行在一个可信的环境。这个可信的环境包括了可信的权威DNS，可控的安全防火墙，受限的网络连接以及安全扫描套件（杀毒软件）。

![image](/img/in-post/oci-v2/Image-Format.jpg)

从这个层面上讲，Nydus 计算每一层哈希，不仅不是很专业，而且很慢。这一块内容交给更高效的安全引擎，Nydus 做个异步事件回调/消息发布订阅，也许更好。

综上所述，结合短桶原理，可以得出这样的结论：**容器的安全性需要各方协调，云原生应用不存在绝对意义上的安全**。

最后，欢迎大家加入[Dragonfly](https://github.com/dragonflyoss/Dragonfly)项目，项目钉群群主是《Docker源码分析》的作者[孙宏亮](https://github.com/allencloud)。在国内《21天学会XX》垃圾技术书风行的大背景下，这本书是一股清流。

![image](/img/in-post/oci-v2/build.gif)

同时也欢迎大家参与[OCIv2标准的共建](https://hackmd.io/@cyphar/ociv2-brainstorm)。

## 结论

PPT first，bug secondly.

~~我想暗中买一批[孙宏亮](https://github.com/allencloud)大佬写的第一版《Docker源码分析》，之后再潜入阿里云，要到他的亲笔签名，最后再转卖出去🤣~~

![image](/img/in-post/oci-v2/jihuatong.png)

## 参考链接

[1]
docker、oci、runc以及kubernetes梳理
https://xuxinkun.github.io/2017/12/12/docker-oci-runc-and-kubernetes/

[2]
About the Open Container Initiative
https://opencontainers.org/about/overview/

[3]
The Road to OCIv2 Images: What's Wrong with Tar?
https://www.cyphar.com/blog/post/20190121-ociv2-images-i-tar

[4]
重磅 | Dragonfly 晋升成为 CNCF 孵化项目
https://developer.aliyun.com/article/754452

[5]
Dockerfile 操作建议
https://jiajially.gitbooks.io/dockerguide/content/chapter_fastlearn/dockerfile_tips.html

[6]
利用暴露在外的API，无法检测的Linux恶意软件将矛头指向Docker服务器
https://mp.weixin.qq.com/s?__biz=MzA5OTAyNzQ2OA==&mid=2649710368&idx=1&sn=afc957a5622a9bb658aa63574368400e&chksm=88936043bfe4e95563e6d8ca05c2bce662338072daa58f2ffd299ecbf26a7b57e33b5c871e4c&mpshare=1&scene=23&srcid=0803MLplml3bb8uyaXAyC2Rg&sharer_sharetime=1596696405119&sharer_shareid=9b8919de2238b20229856a42c8974cdc%23rd