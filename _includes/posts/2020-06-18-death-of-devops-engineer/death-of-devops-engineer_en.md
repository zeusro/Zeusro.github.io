## The Beginning

![image](/img/in-post/death-of-devops-engineer/devops.jpg)

In March 2018, I officially became the operations manager and took over the group's internal cloud platform accounts.

The previous operations manager was a genius. He left me a bunch of servers with no passwords at all, covering both Tencent Cloud and Alibaba Cloud. In addition, there were a ton of invalid DNS records and CDN domains. Cleaning up this mess took me over a year.

In June 2018, by chance, an Alibaba Cloud P8 gave me a verbal introduction to Kubernetes. That very afternoon, I immediately decided that no matter how difficult it would be, I would definitely implement it.

At that time, part of our system was already running on Alibaba Cloud's Docker Swarm, but after looking at the release notes, I felt that thing was definitely abandoned. So, in about three months, by reading the English version of "Kubernetes in Action" and participating in the community, I upgraded from a zero-docker-knowledge noob to the group's **Chief Cloud Native Evangelist**. I also became a community administrator.

## Alibaba Cloud Kubernetes Early Product Manager

Additionally, I became an early product manager for Alibaba Cloud Kubernetes. Many product suggestions were proposed by me and then evaluated and improved internally by them.

1. [Container Image Service: Support Private Repository Overseas Machine Builds](https://connect.console.aliyun.com/connect/detail/84361)
1. [Kubernetes Web Console: Support ephemeral-storage Settings](https://connect.console.aliyun.com/connect/detail/97716)
1. [Container Image Service: Support Proxy for gcr.io and Other Images](https://connect.console.aliyun.com/connect/detail/78278)
1. [Kubernetes: Deprecate Dashboard ASAP and Integrate Its Features into Alibaba Cloud Console](https://connect.console.aliyun.com/connect/detail/77011)
1. [Kubernetes: Improve Service Creation](https://connect.console.aliyun.com/connect/detail/75930)
1. [Kubernetes: Improve RBAC](https://connect.console.aliyun.com/connect/detail/75929)
1. [Alibaba Cloud Kubernetes: SchedulingDisabled Nodes Will Be Automatically Removed from Virtual Server Groups](https://connect.console.aliyun.com/connect/detail/73467)
1. [Kubernetes: Expand "Node Unschedulable" Function, Change to "Maintenance Node"](https://connect.console.aliyun.com/connect/detail/70803)
1. [Kubernetes: Improve Cluster Creation Options](https://connect.console.aliyun.com/connect/detail/70665)
1. [k8s: Enhance Cloud Disk Data Volumes](https://connect.console.aliyun.com/connect/detail/61986)
1. [k8s: Service Certificate Label Changes Don't Take Effect](https://connect.console.aliyun.com/connect/detail/57727)
1. [k8s: Add Related Documentation for Cluster Node Management](https://connect.console.aliyun.com/connect/detail/56229)
1. [Cloud Monitor: Improve K8S Cloud Monitoring](https://connect.console.aliyun.com/connect/detail/52189)
1. [Container Service: PV Display Not User-Friendly](https://connect.console.aliyun.com/connect/detail/51523)
1. [K8S: POD Terminal Operation Time Too Short After Entry](https://connect.console.aliyun.com/connect/detail/50469)
1. [k8s: Deployment Configuration Page Has Issues](https://connect.console.aliyun.com/connect/detail/49659)
1. [k8s: Volume Limitations and Improvements](https://connect.console.aliyun.com/connect/detail/49640)
1. [k8s: Namespace Information Sync Issues](https://connect.console.aliyun.com/connect/detail/49361)
1. [k8s: Ingress TLS Cancellation Doesn't Take Effect](https://connect.console.aliyun.com/connect/detail/48979)
1. [Alibaba Cloud Image Repository: Optimize User Experience](https://connect.console.aliyun.com/connect/detail/48110)
1. [k8s: Strange Load Balancers Appear When Maintaining Master](https://connect.console.aliyun.com/connect/detail/48072)
1. [k8s: Improve HPA](https://connect.console.aliyun.com/connect/detail/48041)
1. [Hope Alibaba Cloud Container Service K8S Can Support Independent SLB Binding](https://connect.console.aliyun.com/connect/detail/47469)
1. [k8s: Issues When Adding TLS to Ingress Routes](https://connect.console.aliyun.com/connect/detail/47443)
1. [k8s: Improve LoadBalancer Service and Load Balancer Binding](https://connect.console.aliyun.com/connect/detail/52594)
1. [k8s: Issues When Creating Deployments with Private Images](https://connect.console.aliyun.com/connect/detail/47147)
1. [Accidentally Discovered K8S Deployment Details Page Has Bug](https://connect.console.aliyun.com/connect/detail/47034)
1. [Hope Alibaba Cloud Container Kubernetes Interface Doesn't Force Translate Proper Nouns!!!](https://connect.console.aliyun.com/connect/detail/46590)
1. [K8S: Improve Related Tutorials for Application Creation Page](https://connect.console.aliyun.com/connect/detail/43756)
1. [Optimize K8S Application Deployment User Experience](https://connect.console.aliyun.com/connect/detail/43736)
1. [Let Users Flexibly Choose K8S Master Payment Method](https://connect.console.aliyun.com/connect/detail/43655)
1. [Container Service: Health Checks Are Useless](https://connect.console.aliyun.com/connect/detail/40484)
1. [Container Service: Improve Log Service](https://connect.console.aliyun.com/connect/detail/40792)

From 2018-05-13 to now, I've submitted dozens of suggestions around the container field. Although some weren't adopted, I think I deserve the title of "**Alibaba Cloud Kubernetes Early Product Manager**".

The most memorable bug was this one:
[k8s: Ingress TLS Cancellation Doesn't Take Effect](https://connect.console.aliyun.com/connect/detail/48979)

I followed up on it for nearly three months and even sent a video to the Alibaba Cloud product manager at the time.

## NoOps

![image](/img/in-post/death-of-devops-engineer/waterfall.jpg)

I won't complain about how terrible the waterfall model for traditional applications is—those who understand, understand. After that operations manager screwed me over, seeing Kubernetes was like seeing a savior. Later, I used Kubernetes to reclaim most of the servers. As for those servers without passwords, I either used shock therapy to reset passwords at midnight and restart, or waited a year or two, backed up the cloud disks, and directly refunded.

## Forgetting Server Passwords in the Kubernetes Era

You can refer to what I wrote:
[Scale Alibaba Cloud Kubernetes Cluster and Upgrade Node Kernel](https://developer.aliyun.com/article/756235)

The slight difference is:

![image](/img/in-post/death-of-devops-engineer/QQ20200618-163420.png)

[Node Maintenance](https://cs.console.aliyun.com/#/k8s/node/list) here should be set to "**Unschedulable**". Then slowly drain the pods in the node.

When the remaining pods in the node are no longer important, you can directly delete the node and refund the corresponding ECS.

## Complaints

![image](/img/in-post/death-of-devops-engineer/no-silver.jpg)

Can Alibaba Cloud stop sending me vouchers all the time? My domain name will be renewed for a hundred years if this continues.

## References

[1]
2017 Cloud Trends—From DevOps to NoOps
http://dockone.io/article/2126
