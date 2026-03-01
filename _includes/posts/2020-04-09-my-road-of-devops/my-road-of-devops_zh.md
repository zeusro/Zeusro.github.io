**持续优化**是我工作和生活的唯一算法，其一体现就是 `DevOps` 。

今天讲下我跟 `DevOps` 相爱相杀的历史。

## 2016 ~ 2018：static Jenkins

在16年的时候，我就在想怎么提高工作的效率，让应用发布跟得上迭代。

那个时候我也不知道这叫 `DevOps` 。反正有啥就用啥。最后我选择了 `Jenkins` 。`Jenkins` 是一个基于插件的纯瀑布流的CI模型。也就是说，配置是最为繁重的那部分。

![image](/img/road-of-devops/jenkins-1.png)

每一个项目，都需要重复配置（虽然后来我建了一个模板项目，但我发现不能解决根本问题）。每一个项目里面的配置，都包含N个插件。以里面一个`Java`项目来说。

整个CI的流程，分为 

> webhook --> Jenkins build --> docker push

Jenkins build 又可细分为

> git pull/clone --> gradle/maven build --> docker build

![image](/img/road-of-devops/jenkins-2.png)

这里面每一个步骤，甚至是数据的流动（比如根据tag和branch判定是否需要触发构建）都需要用到插件。

![branch插件](/img/road-of-devops/jenkins-3.png)

以这个项目为例，最终我们使用的插件有：
1. docker
2. Environment Injector Plugin
3. Gitea（源仓库是gitea）
4. gradle（构建工具用的是gradle）
5. Mask Passwords（用于掩盖docker login密码）
6. Generic Webhook Trigger Plugin（就是上图那个 Optional filter 符合输入要求的branch才会触发下一步构建）


除了项目配置，还得做一些全局配置。。。


最终我们会发现， `Jenkins`变成了一架超级航空母舰，谁也不知道里面放了啥。留下的只是

> provider_version=`docker image ls $image1 |grep -Eo '([0-9]{0,2}\.){2}[0-9]+'| head -1`

这一行最有用的 tag 提取脚本，哈哈哈。。。

### 结论

小型构建系统（ <30 个构建任务）的最优解

### 相关工作回顾

1. [从零开始用Jenkins搭建.NET CI环境](http://www.zeusro.com/2016/02/26/net-ci/)
2. [Gogs+Jenkins构建java项目，最后docker化](http://www.zeusro.com/2018/08/17/gogs-Jenkins-java-docker/)
3. [在kubernetes上面使用Jenkins](http://www.zeusro.com/2019/10/29/jenkins-on-kubernetes/)


## 2018 ~ 至今：swarm + Concourse

![image](/img/road-of-devops/concourse-1.png)

如果说`Jenkins` 是一个基于插件的纯瀑布流的航空母舰，那么 Concourse 就是极简主义忍者。

Concourse 的最大优点在于可重用的模板配置，其次，活跃的社区也是不错的一个点（说明最起码用的人不少）。而且，他们的 releases 有时候也写的很皮，带点表情包什么的。

缺点在于 breaking change 不少，如果用 docker运行，就会变成 docker in docker。

4.x 版本的时候，出现了无数次 docker hung，load15 过高等状况，当时只能重启。非常滴蛋疼。这个问题，在升级到[5.x](https://github.com/concourse/concourse/releases/tag/v5.0.0)之后略有缓解。

![image](/img/road-of-devops/concourse-2.png)

BTW , Concourse 本身是一套分布式系统，未来计划在 `Kubernetes` 中运行，但目前还只是一个[草案](https://github.com/concourse/concourse/pull/5223)

![image](/img/road-of-devops/concourse-3.png)

### 结论

2020年3月末发布了[6.x](https://github.com/concourse/concourse/releases/tag/v6.0.0)版本，值得一试。


### 相关工作回顾
1. [Concourse-CI集成maven/gradle项目](http://www.zeusro.com/2018/09/02/give-up-concourse-ci/)


## 2020：tektoncd

![image](/img/road-of-devops/devops.png)

其实，我还折腾过 `JenkinsX` ，但那时候，`JenkinsX` 的文档太少，导致工作一直不顺利。`JenkinsX` 有点像 `Jenkins Blue Ocean`，还加入点 `serverless` 。 但他并没有放弃 `static Jenkins` 那套玩意。最后变得有点不伦不类。

2020/03/11，`JenkinsX` 宣布自(我)(倒)闭。

函数型 serverless 框架 [knative](https://github.com/knative) 也宣布放弃自家CI的开发，指向 `tektoncd`。

在2019年3月的时候，我就已经作为云玩家参与体验了 `tektoncd` 。那时候，模型的定义还是非常简单。

不过现在上看，当时觉得欠缺的构建缓存现在已经加上去了。不过，2019年我提出的
> 通过CRD重新定义CI/CD是一大亮点，但目前构建任务只能通过手动创建YAML文件，构建任务一多的时候，集群内就会大量堆积该CI相关的CRD，感觉比较蠢。

这个问题没能很好解决。目前的思路是通过 `Cronjob` 实现定期清除。


### 结论

潜力不小，值得一试。


### 相关工作回顾

1. [国内服务器安装JenkinsX](http://www.zeusro.com/2019/03/16/install-Jenkins-X/)
1. [Jenkins-X构建Java应用](http://www.zeusro.com/2019/03/16/Jenkins-X-build-Java/)
2. [tektoncd云玩家初体验](http://www.zeusro.com/2019/03/25/tektoncd/)
3. [Please support build cache in PipelineResources](https://github.com/tektoncd/pipeline/issues/2088)
4. [Can't rerun existing completed taskruns or delete completed taskruns automatically](https://github.com/tektoncd/pipeline/issues/1302)
5. [Introduce runHistoryLimit](https://github.com/tektoncd/pipeline/issues/2332)


### 参考链接

1. [Jenkins X选择了Tekton｜将弃用Jenkins](https://mp.weixin.qq.com/s/n_AfL63DQsOXZLsw08Iwbg)
1. [Jenkins X ❤ Tekton](https://jenkins-x.io/blog/2020/03/11/tekton/)

## 2018.06 ~ 至今：Kubernetes

关于 `Kubernetes` 我已经发表过无数话题。18年的时候，在稍微了解了一下 `Kubernetes` 的发布工作流之后（那个时候我对 `docker` 都不太熟练），我当天立刻决定，就算只有我一个人，我也要在公司内部推广这套系统。

事实证明，我是对的。我们后来又整了一套完整的 `DevOps` 的体系，`Kubernetes` 是其中最后，并且最重要的一环。我们从“无运维时代”，直接走向了“无需运维时代”（甩锅给阿里云售后🤣🤣🤣）。

但事实证明，我也是错的。传统应用变成流动的`pod`之后，要解决

1. volume
1. 网络诊断
1. 资源监控与配额
1. 云厂商组件bug
1. docker自身bug
1. 系统内核（比如IPtable，cgroup，namespace）自身bug

等等一系列问题。随便挑一个都是大问题。。。


### 结论

**没有银弹**。但我相信 `Kubernetes` 是未来10年应用部署的首选模型。

### 相关工作回顾
1. [Kubernetes系列文章](http://www.zeusro.com/archive/?tag=Kubernetes)
2. [Kubernetes 中文书](https://github.com/zeusro/awesome-kubernetes-notes)

### 参考链接
1. [孙健波：Kubernetes 会不会“杀死” DevOps？](yq.aliyun.com/articles/742165)

## 2020：阿里巴巴（广告位招租中 ~ ）

这方面的我关注的比较少（分辨是公关文还是技术分享比较浪费时间，所以干脆不看算了）。

阿里巴巴的公司体量比较大，他们遇到的问题和提出的解决方案（比如中台，修改JVM）很多更像是屠龙技，对于小型公司其实没有多大卵用。

不过值得借鉴的地方也有不少。

比如这个 `golang` 的 `Dockerfile`，还有云效那套 `DevOps` 文化。

### golang Dockerfile

```Dockerfile
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

### 云效 `DevOps` 文化

![image](/img/road-of-devops/yunxiao1.png)

#### 研发模式全自动化

> 随着“容器化”的浪潮来临，我们研发平台再一次升级，将线上容器定义、运维监控责任全部交给了开发者，应用运维岗位不复存在。

#### 流量回放测试

> 第二个是流量回放测试技术。这项技术的创新给测试团队带来了很大影响，通过线上流量复制到线下，低成本的解决了测试回归的问题，将传统通过编写用例进行测试，简化为编排数据进行测试。第二层是Mock技术的应用，将一个分布式系统问题，转化为单机问题，可以在几秒钟完成上千个用例运行。有了这两个基础技术后，在上层可以发展测试平台，通过算法的手段去识别有效流量，去自动化处理数据，去识别异常流量背后的缺陷。通过这三层面的变革，可以说让阿里巴巴测试效率有了质的变化。

#### 全链路压测

> 第三个是全链路压测技术（对应阿里云上的产品叫PTS）。双11大家之所以能放心剁手，一年比一年顺滑，核心就是这项技术在每次大促前帮助开发者发现风险。发现以后就需要快速的响应，通过DevOps工具去解决线上问题。每次压测都是一次练兵，有点类似于军事演习，快速发现问题，快速解决，不断锤炼团队DevOps能力，也可以这样说阿里巴巴的DevOps能力正是一次一次“双11”给练出来的。

#### 大胆尝试，把握底线

![image](/img/road-of-devops/yunxiao2.png)

### 结论

合适自己的才是最好。

### 参考链接

1. [阿里巴巴DevOps文化浅谈](https://yq.aliyun.com/articles/752195)
2. [DevOps研发模式下CI/CD实践详解指南](https://yq.aliyun.com/articles/738405)

## 其他可选方案

[gocd](https://github.com/gocd/gocd)

[理想的DevOp流程怎么做？看看Slack的代码部署实践](https://mp.weixin.qq.com/s?__biz=MzAwMDU1MTE1OQ==&mid=2653552052&idx=1&sn=bbc6dd52c9451dc807530ff5af2f50fd&chksm=813a6c2cb64de53a1d6818d72974150805dffcfda32f896c67e158a047b706036ab433b11e1d&mpshare=1&scene=23&srcid=&sharer_sharetime=1586425526712&sharer_shareid=75da3ea8231bb63b18e055a6e877643e#rd)

## 总结

`DevOps` 核心思路只有一个：**不断提高应用开发，部署，监控，升级/迭代效率**。