Recently I've been learning how to build nuclear bombs, and I happened to come across a live stream in the [Dragonfly](https://github.com/dragonflyoss/Dragonfly) group where Ba De, a big shot from Ant Financial, was sharing another sub-project called Nydus.

Based on my understanding, Nydus is an implementation of the next-generation container format. It exists mainly to solve problems with the old container format.

So the question is: What is Nydus? What is a container format? What specific problems does Nydus solve? Let's start with some terminology.

## Terminology

In fact, container technology has been developing for over [40 years](https://www.infoq.cn/article/SS6SItkLGoLExQP4uMr5) since 1979. Docker can only be said to be one of the more famous and popular implementations so far. It can be said that Docker solved the problem of application distribution and laid the foundation for the future popularity of Kubernetes.

However, as the saying goes, **when the warrior defeats the dragon, he himself becomes the dragon**. Whether it's Docker Inc.'s later various operations (renaming the project to Moby, Docker Swarm's weak orchestration) or CoreOS's rise, **the war in the open source world is a global battle for discourse power over technical standards**, and this battle is far more brutal than you imagine.

### OCI

OCI stands for [Open Container Initiative](https://opencontainers.org/), which belongs to the Linux Foundation. It is an open source organization established on 2015-6-22 by Docker, CoreOS, and other container vendors, with the main purpose of establishing common technical standards for container technology.

OCI has two main projects:

1. [runtime-spec](https://github.com/opencontainers/runtime-spec)
2. [image-spec](https://github.com/opencontainers/image-spec)

### OCIv1

![image](/img/in-post/oci-v2/Container-Images.jpg)

[OCIv1](https://github.com/opencontainers/image-spec/milestone/4) is the current container format.

### OCIv2

OCIv2 is designed to solve the historical technical debt of OCIv1.

### Dragonfly Nydus

On April 10, 2020, through a vote by the CNCF Technical Oversight Committee, the open source project Dragonfly from China officially became a CNCF incubating project, becoming the third Chinese project to enter the CNCF incubation stage after Harbor and TiKV.

![image](/img/in-post/oci-v2/Dragonfly.jpg)

Dragonfly's architecture is mainly designed to solve four major problems: large-scale image downloads, long-distance transmission, bandwidth cost control, and secure transmission.

![image](/img/in-post/oci-v2/Nydus-Architecture.jpg)

Nydus is an implementation of OCIv2, planned to be donated to Dragonfly and operated as a sub-project under it.

## Problems with Current Container Format

![image](/img/in-post/oci-v2/Prior-Community-Work-Comparison.jpg)

In the live stream, Ba De mentioned several problems with OCIv1:

1. Very low layer efficiency
1. No data verification
1. Repairability issues

### Very Low Layer Efficiency

![image](/img/in-post/oci-v2/h1.png)

Low layer efficiency mainly refers to redundancy. If we compare a docker image to a hamburger, image A is a cheeseburger.

```dockerfile
FROM centos
```

![image](/img/in-post/oci-v2/h2.png)

Image B is a double cheeseburger.

```dockerfile
FROM centos
RUN yum update -y
```

```bash
# Pull the cheeseburger
docker pull h1
# Pull the double cheeseburger
docker pull h2
```

According to the current design, images are independent of each other. That is, after pulling h1, although the underlying centos image is already cached on disk, when pulling h2, it still pulls the entire image again without reusing the underlying centos image. This ultimately leads to disk redundancy and wasted network traffic.

Low layer efficiency has another manifestation.

```dockerfile
FROM ubuntu:14.04
ADD compressed.tar /
# The deletion here is just a marker, actual image size = compressed.tar * 2 + ubuntu:14.04
RUN rm /compressed.tar
ADD compressed.tar /
```

For this docker image, when actually running, the root directory size in the container is much smaller than the image.

So, **image size and container size are fundamentally different**.

### No Data Verification (Verifiability)

Here's a quote from Ba De:

> If a read-only layer is modified, the container application doesn't know. This can happen with the current OCI image format. Images are verifiable during construction and transmission, but after the image is downloaded locally, it will be decompressed, and modifications to the decompressed files cannot be detected.
>
> Images need to be downloaded, decompressed to the local file system, and then handed over to the container for use. In this process, the step of decompressing to the local file system is where trust is lost.

### Workspace Repairability Issues

Repairability can solve the problem of slow docker build to some extent.

Taking the lightweight Kubernetes event export component [kube-eventer](https://github.com/AliyunContainerService/kube-eventer/blob/master/deploy/Dockerfile) as an example:

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

When we repeatedly execute docker build on machine A, each build is atomic, meaning each time it runs from top to bottom again. But actually we know that many instructions are repeated and don't need to be executed repeatedly.

Repairability also means another thing: after copying from machine A to machine B, continue building the docker image.

## My Thoughts

In my opinion, the current OCIv1 borrows from git's design, but is essentially a hamburger that's hard to eat. Only the top layer can be eaten (read-write).

The delivery cycle of cloud-native applications is generally:

> git Ops --> CI --> docker image --> waiting container/pod (docker pull, sandbox etc) --> running container/pod --> terminated container/pod

The security of cloud-native applications consists of the runtime environment and docker container. A secure docker container should try to leave no opportunities for exploitation at every stage.

For example, in the process from code to CI, there should be static code analysis + manual code review mechanisms to ensure there are no security issues in the code; in the process from CI to docker image construction, CI should run in a trusted environment. This trusted environment includes trusted authoritative DNS, controllable security firewalls, restricted network connections, and security scanning suites (antivirus software).

![image](/img/in-post/oci-v2/Image-Format.jpg)

From this perspective, Nydus calculating the hash of each layer is not only not very professional, but also slow. This content should be handed over to a more efficient security engine, and Nydus should do asynchronous event callbacks/message pub-sub, which might be better.

In summary, combined with the short barrel principle, we can draw this conclusion: **Container security requires coordination from all parties, and cloud-native applications are not absolutely secure**.

Finally, welcome everyone to join the [Dragonfly](https://github.com/dragonflyoss/Dragonfly) project. The project DingTalk group owner is [Sun Hongliang](https://github.com/allencloud), author of "Docker Source Code Analysis". In the context of domestic "Learn XX in 21 Days" garbage technical books being popular, this book is a breath of fresh air.

![image](/img/in-post/oci-v2/build.gif)

Also welcome everyone to participate in [co-building the OCIv2 standard](https://hackmd.io/@cyphar/ociv2-brainstorm).

## Conclusion

PPT first, bug secondly.

~~I want to secretly buy a batch of the first edition of "Docker Source Code Analysis" written by [Sun Hongliang](https://github.com/allencloud), then infiltrate Alibaba Cloud to get his autograph, and finally resell it 🤣~~

![image](/img/in-post/oci-v2/jihuatong.png)

## References

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
