**Continuous optimization** is the only algorithm in my work and life, and one manifestation is `DevOps`.

Today I'll talk about my love-hate history with `DevOps`.

## 2016 ~ 2018: Static Jenkins

In 2016, I was thinking about how to improve work efficiency and make application releases keep up with iterations.

At that time, I didn't know this was called `DevOps`. I just used whatever was available. Finally, I chose `Jenkins`. `Jenkins` is a pure waterfall-flow CI model based on plugins. That is to say, configuration is the most burdensome part.

![image](/img/road-of-devops/jenkins-1.png)

Every project needed repeated configuration (although I later created a template project, I found it couldn't solve the fundamental problem). Every project's configuration contained N plugins. Take a `Java` project inside as an example.

The entire CI process is divided into:

> webhook --> Jenkins build --> docker push

Jenkins build can be further subdivided into:

> git pull/clone --> gradle/maven build --> docker build

![image](/img/road-of-devops/jenkins-2.png)

Every step here, even data flow (like determining whether to trigger a build based on tag and branch), requires plugins.

![branch plugin](/img/road-of-devops/jenkins-3.png)

Taking this project as an example, the plugins we ultimately used were:
1. docker
2. Environment Injector Plugin
3. Gitea (source repository is gitea)
4. gradle (build tool is gradle)
5. Mask Passwords (for masking docker login passwords)
6. Generic Webhook Trigger Plugin (the Optional filter in the image above—only branches that meet input requirements will trigger the next build step)

Besides project configuration, we also had to do some global configuration...

In the end, we'll find that `Jenkins` became a super aircraft carrier, and no one knows what's inside. What remains is just:

> provider_version=`docker image ls $image1 |grep -Eo '([0-9]{0,2}\.){2}[0-9]+'| head -1`

This most useful tag extraction script, hahaha...

### Conclusion

Optimal solution for small build systems (<30 build tasks)

### Related Work Review

1. [Building .NET CI Environment with Jenkins from Scratch](http://www.zeusro.com/2016/02/26/net-ci/)
2. [Gogs+Jenkins Building Java Projects, Finally Dockerized](http://www.zeusro.com/2018/08/17/gogs-Jenkins-java-docker/)
3. [Using Jenkins on Kubernetes](http://www.zeusro.com/2019/10/29/jenkins-on-kubernetes/)

## 2018 ~ Present: Swarm + Concourse

![image](/img/road-of-devops/concourse-1.png)

If `Jenkins` is a pure waterfall-flow aircraft carrier based on plugins, then Concourse is a minimalist ninja.

Concourse's biggest advantage is reusable template configuration. Second, an active community is also a good point (showing at least many people use it). Moreover, their releases are sometimes written quite playfully, with some emojis and stuff.

The downside is there are many breaking changes. If running with docker, it becomes docker in docker.

In version 4.x, there were countless instances of docker hung, load15 too high, etc. At that time, we could only restart. Very annoying. This problem was slightly alleviated after upgrading to [5.x](https://github.com/concourse/concourse/releases/tag/v5.0.0).

![image](/img/road-of-devops/concourse-2.png)

BTW, Concourse itself is a distributed system, with plans to run in `Kubernetes` in the future, but currently it's just a [draft](https://github.com/concourse/concourse/pull/5223)

![image](/img/road-of-devops/concourse-3.png)

### Conclusion

Version [6.x](https://github.com/concourse/concourse/releases/tag/v6.0.0) was released at the end of March 2020, worth a try.

### Related Work Review
1. [Concourse-CI Integrating maven/gradle Projects](http://www.zeusro.com/2018/09/02/give-up-concourse-ci/)

## 2020: tektoncd

![image](/img/road-of-devops/devops.png)

Actually, I also messed around with `JenkinsX`, but at that time, `JenkinsX` documentation was too scarce, causing work to be constantly unsuccessful. `JenkinsX` is a bit like `Jenkins Blue Ocean`, with some `serverless` added. But it didn't abandon the `static Jenkins` stuff. Finally, it became a bit neither fish nor fowl.

On 2020/03/11, `JenkinsX` announced self-(my)(collapse).

The functional serverless framework [knative](https://github.com/knative) also announced abandoning its own CI development, pointing to `tektoncd`.

In March 2019, I had already participated as a cloud player to experience `tektoncd`. At that time, the model definition was still very simple.

But looking at it now, the build cache that I thought was missing has now been added. However, what I proposed in 2019:
> Redefining CI/CD through CRD is a major highlight, but currently build tasks can only be created manually through YAML files. When there are many build tasks, CI-related CRDs will accumulate heavily in the cluster, which feels quite stupid.

This problem wasn't solved well. The current approach is to implement periodic cleanup through `Cronjob`.

### Conclusion

Great potential, worth a try.

### Related Work Review

1. [Installing JenkinsX on Domestic Servers](http://www.zeusro.com/2019/03/16/install-Jenkins-X/)
1. [Jenkins-X Building Java Applications](http://www.zeusro.com/2019/03/16/Jenkins-X-build-Java/)
2. [tektoncd Cloud Player First Experience](http://www.zeusro.com/2019/03/25/tektoncd/)
3. [Please support build cache in PipelineResources](https://github.com/tektoncd/pipeline/issues/2088)
4. [Can't rerun existing completed taskruns or delete completed taskruns automatically](https://github.com/tektoncd/pipeline/issues/1302)
5. [Introduce runHistoryLimit](https://github.com/tektoncd/pipeline/issues/2332)

### References

1. [Jenkins X Chose Tekton｜Will Abandon Jenkins](https://mp.weixin.qq.com/s/n_AfL63DQsOXZLsw08Iwbg)
1. [Jenkins X ❤ Tekton](https://jenkins-x.io/blog/2020/03/11/tekton/)

## 2018.06 ~ Present: Kubernetes

I've published countless topics about `Kubernetes`. In 2018, after slightly understanding `Kubernetes`' release workflow (at that time I wasn't even very familiar with `docker`), I immediately decided that day that even if I was the only one, I would promote this system within the company.

Facts proved I was right. We later built a complete `DevOps` system, and `Kubernetes` was the last and most important link. We went directly from the "no operations era" to the "no need for operations era" (passing the buck to Alibaba Cloud after-sales 🤣🤣🤣).

But facts also proved I was wrong. After traditional applications became flowing `pods`, we needed to solve:

1. volume
1. Network diagnosis
1. Resource monitoring and quotas
1. Cloud vendor component bugs
1. Docker's own bugs
1. System kernel (like IPtable, cgroup, namespace) bugs

And a series of other problems. Any one of them is a big problem...

### Conclusion

**No silver bullet**. But I believe `Kubernetes` is the preferred model for application deployment in the next 10 years.

### Related Work Review
1. [Kubernetes Series Articles](http://www.zeusro.com/archive/?tag=Kubernetes)
2. [Kubernetes Chinese Book](https://github.com/zeusro/awesome-kubernetes-notes)

### References
1. [Sun Jianbo: Will Kubernetes "Kill" DevOps?](yq.aliyun.com/articles/742165)

## 2020: Alibaba (Advertising Space for Rent ~)

I pay less attention to this aspect (distinguishing between PR articles and technical sharing is a waste of time, so I just don't look).

Alibaba's company scale is relatively large. The problems they encounter and solutions they propose (like middle platform, modifying JVM) are more like dragon-slaying skills, not very useful for small companies.

But there are also many places worth learning from.

Like this `golang` `Dockerfile`, and that `DevOps` culture from Cloud Efficiency.

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

### Cloud Efficiency `DevOps` Culture

![image](/img/road-of-devops/yunxiao1.png)

#### Fully Automated R&D Mode

> With the wave of "containerization" coming, our R&D platform upgraded again, handing all online container definitions and operations monitoring responsibilities to developers. The application operations position no longer exists.

#### Traffic Replay Testing

> The second is traffic replay testing technology. This technological innovation had a great impact on the testing team. By copying online traffic offline, it low-cost solved the problem of test regression, simplifying traditional test case writing to test data orchestration. The second layer is the application of Mock technology, transforming a distributed system problem into a single-machine problem, completing thousands of test case runs in seconds. With these two foundational technologies, a testing platform can be developed at the upper layer, using algorithmic means to identify effective traffic, automatically process data, and identify defects behind abnormal traffic. Through these three levels of transformation, it can be said that Alibaba's testing efficiency has had a qualitative change.

#### Full-Link Pressure Testing

> The third is full-link pressure testing technology (corresponding to the product on Alibaba Cloud called PTS). The reason everyone can confidently shop during Double 11, getting smoother year by year, is that this technology helps developers discover risks before each major promotion. After discovery, rapid response is needed, using DevOps tools to solve online problems. Each pressure test is a training exercise, somewhat similar to military exercises—quickly discovering problems, quickly solving them, continuously honing the team's DevOps capabilities. It can also be said that Alibaba's DevOps capabilities were trained through one "Double 11" after another.

#### Bold Attempts, Grasp the Bottom Line

![image](/img/road-of-devops/yunxiao2.png)

### Conclusion

What suits you is best.

### References

1. [Alibaba DevOps Culture Discussion](https://yq.aliyun.com/articles/752195)
2. [Detailed Guide to CI/CD Practice in DevOps R&D Mode](https://yq.aliyun.com/articles/738405)

## Other Optional Solutions

[gocd](https://github.com/gocd/gocd)

[How to Do the Ideal DevOps Process? Look at Slack's Code Deployment Practice](https://mp.weixin.qq.com/s?__biz=MzAwMDU1MTE1OQ==&mid=2653552052&idx=1&sn=bbc6dd52c9451dc807530ff5af2f50fd&chksm=813a6c2cb64de53a1d6818d72974150805dffcfda32f896c67e158a047b706036ab433b11e1d&mpshare=1&scene=23&srcid=&sharer_sharetime=1586425526712&sharer_shareid=75da3ea8231bb63b18e055a6e877643e#rd)

## Summary

`DevOps` has only one core idea: **continuously improve application development, deployment, monitoring, upgrade/iteration efficiency**.
