In the Chinese documentation of [kube-killer](https://github.com/p-program/kube-killer/blob/master/README_ZH.md), I briefly introduced the evolution process of application architecture.

Today, I've decided to describe the evolution process of application architecture from a higher level, across multiple dimensions.

## Business Dimension

### A Big Yellow Duck

![image](/img/in-post/application-evolution/1.png)

Before `docker` was released, container technology had actually been explored for many years. In fact, `Java` as a language is a containerization technology. The reason this awkward language shined so brightly is that it ignored differences between operating systems and hardware through virtualization. C#, which competes with `Java`, is strongly platform-bound because Microsoft wanted to promote its own `windows server`.

So, since there's a free `Linux` system, why do we need a `windows server` system? So `Java` essentially performed a dimensional reduction attack on C#.

Language is a tool for realizing business value. In ancient times, application architecture was more inclined toward monolithic applications. This monolithic application contained all the logic needed for the entire web program.

Enterprise development lies in business, and business development is an outward circle. So many websites eventually became huge aircraft carriers.

### The Yellow Duck Deflated

![image](/img/in-post/application-evolution/2.png)

As business expanded, the corresponding source code also expanded. Check-ins and check-outs became more frequent, and each code merge was a nightmare. So at this point, the drawbacks of monolithic applications began to show. Both development and deployment became huge engineering challenges.

So at this point, the little yellow duck deflated.

What to do after deflation? The conclusion is to split.

### Becoming Little Ducks

![image](/img/in-post/application-evolution/3.png)

Splitting in the business dimension is called service governance. This idea actually existed 10 years ago. It was called SOA. Microsoft's system was called `WCF`. Occasionally, people would ask online how `JAVA` programs could access `WCF` services. That was actually the prototype of service governance.

In my view, the microservices hype in recent years is just old wine in new bottles. The fundamental idea hasn't fundamentally changed. But having said that, the effect of splitting business is significant—people in each module only need to focus on their own business.

## Operations Dimension

From the operations dimension, the application deployment model is slightly different.

### The Era of Contending Schools

In this era, various languages took turns on stage. As operations personnel, you always needed to master the differences between `Windows Server`, `Centos`, and `Ubuntu` platforms. What's worse, languages themselves are constantly developing, and sometimes multiple versions of languages would fight each other.

![image](/img/in-post/application-evolution/middle-finger.jpg)

Beyond the software level, the hardware level is also a problem. Various hardware manufacturers want to create monopolies, so they create something only they have, apply for patents, call it "technological innovation," and then sell it to customers. But from an operations perspective, this differentiation is very torturous.

Moreover, there needs to be an access layer between hardware and software, called drivers. Some hardware manufacturers are too lazy to make drivers for specific operating systems, so NVIDIA received Linus's world-famous middle finger.

### The Java Container Era

![image](/img/in-post/application-evolution/Java.png)

The reason Java is so popular is that it added another layer of abstraction on top of the operating system, eliminating platform differences through this abstraction. So I've always emphasized that `Java` is essentially a container technology, not a language.

So the question arises again: if you want to run multiple `Java` programs on one server, what do you do?

### The Docker Container Era

This is where `docker` containers are even more brilliant—they abstract the "system" itself. At this level, you can allow any program, and it won't affect other programs on the machine at all.

The "system" in the context of `docker` images is just a bunch of read-only files, and the program is a read-write layer of "files" on top. The emergence of `docker` made it possible to run multiple versions of `Java` programs on a single machine, and the brilliance of its design is that environments between containers are "isolated" (though server resources can't actually be isolated). Its isolation means you can install whatever software you want in your virtual environment without affecting other containers.

At this point, operations just needs to tell development: "Give me an image. Whatever you give me, I just need to docker run to execute it."

### The Serverless Era

I previously said in the article "[Guangzhou Metro](http://www.bullshitprogram.com/guangzhou-metro/)":

> Current web is just a special case of Serverless (a very long-lived Serverless)

Continuity is a special state of discontinuity. Most people fail to recognize this.

In the `Serverless` era, containers are actually an ephemeral architecture that lives and dies quickly. This actually puts new demands on `DevOps` engineers—they need to design monitoring and logging systems well to adapt to this entirely new architecture.

## Public Cloud Dimension

If you stand from the public cloud perspective, you'll see another interesting scene.

### The Black Internet Cafe Era

In the black internet cafe era, public clouds split actual physical machines through `Xen` or `KVM` virtualization, added billing rules, and then sold them to users.

Public clouds actually have always had an "overselling" mechanism. They sell you 2 cores 4G. Actually, they're renting you a split virtual environment. The physical machine's actual configuration is 96 cores 196G, but the total "server" configurations sold might be 200 cores 400G.

Overselling is reasonable because we observe that most server loads are regular and can't run at full capacity 24 hours a day. So the slack here is the first principle condition for the overselling mechanism to work.

### The Compute-Storage Separation Era

We know that home PC hard drives and CPUs are all on the same motherboard. But for public clouds, this is a bit troublesome. If a user wants a 2-core 4G machine but needs 4T of hard drive, and the entire 64-core 128G physical machine only has 4T of hard drive, what do you do?

So compute-storage separation is the trend. Because only with more flexible architecture can we better adapt to users' diverse choices.

### The Intensive Management Era

`Kubernetes` is a container scheduling system. From micro to macro, it abstracts applications, servers, networks, and other components. This huge operating system is actually equivalent to rebuilding a public cloud operating system.

For R&D, I just need to set my expectations, and the rest is left to `DevOps` engineers;

For `DevOps` engineers, it's about building a smooth build pipeline, implementing code-to-image builds, then completing image-to-workload tasks. Finally, solve workload problems;

For public clouds, based on messages provided by `Kubernetes`, we can troubleshoot accordingly. Public clouds don't sell servers—they sell computing resource pools.

### The Serverless Era

ingress --> service --> deployment has already connected application-to-web frontend delivery. For public clouds, can we make it simpler? Don't sell servers to users anymore. As long as users deliver a container to me, I can complete the entire application release?

This is the awesomeness of the `Serverless` era. Bro, I'm not selling servers, nor services, but an application release platform. Public clouds have become a [Cloud Native Application Store](http://www.bullshitprogram.com/one-open-operating-system/).

Moreover, for public clouds, the `Serverless` era has a bigger benefit: eliminating virtualization overhead. For public clouds, as long as they do monitoring, resource limits, process isolation, and billing management well, they can directly run your program on a super-strong physical machine. Virtualization has overhead. If this overhead can be omitted, it's actually a huge improvement for overall public cloud operational efficiency.

However, this is actually an idealized architecture. To achieve this goal, we first need to complete compute-storage separation for containers.

## Routine Complaints

![image](/img/in-post/application-evolution/love-java.PNG)

## References

[1]
A Brief History of Container Technology Development
https://mp.weixin.qq.com/s/RZj26jdw-a_7QErPxOpyrg

[2]
SOA Architecture Design Experience Sharing—Architecture, Responsibilities, Data Consistency
https://www.cnblogs.com/wangiqngpei557/p/4486177.html

[3]
Xen V.S. KVM Finally Draws a Perfect Period
https://zhuanlan.zhihu.com/p/33324585

[4]
Should Compute Be Separated from Storage?
https://cloud.tencent.com/developer/article/1619383
