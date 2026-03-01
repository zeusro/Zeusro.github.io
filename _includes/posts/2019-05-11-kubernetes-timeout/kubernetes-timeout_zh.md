kubernetes + alpine+ php 特别容易出现访问外网/解析外网地址的时候出现超时的问题。

## 原因

docker容器访问外网的时候，整个完整路径是这样的。

容器-->主机-->外网-->主机-->容器

容器到主机之间的流量要经过源地址转换(SNAT)才能顺利流通。

SNAT就像是一个搬运工，把砖(流量)从容器搬到主机

如果一个主机上面运行多个容器，并发访问外网(特别是PHP这种没有连接池的)时向系统申请可用端口(nf_nat_l4proto_unique_tuple)，不可用时+1，然后再申请，再校验。这个过程一多，最终就会导致寻址超时。

说白了是个系统内核问题。

详细的解释见

[记一次Docker/Kubernetes上无法解释的连接超时原因探寻之旅](https://mp.weixin.qq.com/s?__biz=MzIzNzU5NTYzMA==&mid=2247484016&idx=1&sn=72bc7f3443cbc259762fb6bd7adb33ae&chksm=e8c77cf1dfb0f5e7598497767db6365bd8db9f4b6a945cb8c72adb1e052e8b0cd46b727c929b&scene=21#wechat_redirect)

## 解决方案

### 最优解

节点升级到 5.1的Linux内核。

iptables升级到1.6.2以上

用基于IPVS模式，尽量少做SNAT/DNAT，支持随机端口SNAT的网络插件启动kubernetes

或者用绕过SNAT的网络插件插件方案，比如阿里云的[terway](https://github.com/AliyunContainerService/terway).但这个插件跟阿里云绑定得比较深入，需要每台机器额外购买一个弹性网卡。

### 次优解

[用ds部署name sever](https://github.com/kubernetes/enhancements/blob/master/keps/sig-network/0030-nodelocal-dns-cache.md)，所有节点的DNS解析走节点上的name server，通过最小程度的SNAT+dns cache缓解此类问题。

### 伪解决方案(不能解决根本问题)

默认的pod的`/etc/resolv.conf`一般长这样

```
sh-4.2# cat /etc/resolv.conf
nameserver <kube-dns-vip>
search <namespace>.svc.cluster.local svc.cluster.local cluster.local localdomain
options ndots:5
```

这个配置的意思是，默认nameserver指向kube-dns/core-dns，所有查询中，如果。的个数少于5个，则会根据search中配置的列表依次搜索，如果没有返回，则最后再直接查询域名本
身。ndots就是n个.(dots)的意思

举个例子

```
sh-4.2# host -v baidu.com
Trying "baidu.com.<namespace>.svc.cluster.local"
Trying "baidu.com.svc.cluster.local"
Trying "baidu.com.cluster.local"
Trying "baidu.com.localdomain"
Trying "baidu.com"
......
```

#### 不使用 alpine 镜像

#### 使用 [FQDN](https://baike.baidu.com/item/FQDN)

由于域名是从右到左逐级解析的，比如 `google.com` ，实际上是 `google.com.`，com后面的。称之为根域名。解析的时候，先解析.，然后解析.com,.com称之为顶级域名，最后解析google。

使用 FQDN：(Fully Qualified Domain Name)全限定域名，是为了尽可能减少内部DNS(比如coreDNS，节点DNS)的解析压力

#### 重开socket

```yaml
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c 
              - "/bin/echo 'options single-request-reopen' >> /etc/resolv.conf"
```

设置重开socket是规避容器并发A,AAAA查询


#### 2级域名直接走上层解析

参考[kubernetes 使用基于 alpine 镜像无法正常解析外网DNS](https://www.sudops.com/kubernetes-alpine-image-resolve-ext-dns.html) 做的

直接运行 `sed -i 's/options ndots:5/#options ndots:5/g' /etc/resolv.conf` 会报错

alpine的echo命令会吞换行符，而resolv.conf格式不对DNS解析会报错

```yaml
  dnsConfig:
    options:
      - name: ndots
        value: "2"
      - name: single-request-reopen
```

去掉了`options ndots:5`，变会默认值1，这样的话，容器内部直接访问<svc>还是没问题的，走search列表，`<svc>.<namespace>.svc.cluster.local`，还是能够访问。

而解析`Google.com`，实际上是解析`Google.com.`,.的数量超过1个，这时不走search列表，直接用上层DNS

综上所述，去掉ndots/ndots设为1 降低了频繁DNS查询的可能性。对于外网IP的解析有“奇效”。

但如果该主机运行其他容器(这不废话吗，一个节点不跑多个容器那还用啥kubernetes)，其他容器也会并发地请求，SNAT的问题还是会出现，所以说修改`/etc/resolv.conf`文件并不能解决根本问题


歪门邪道1

```
          lifecycle:
            postStart:
              exec:
                command:
                - /bin/sh
                - -c 
                - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

歪门邪道2

```
      initContainers:
      - name: alpine
        image: alpine
        command:
         - /bin/sh
         - -c 
         - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

## 衍生的问题

### DNAT

容器访问clusterIP(因为是虚拟IP所以需要DNAT)也有可能出现这类超时的问题

### 访问同 namespace svc 不要强行加戏

non-head service的 virtual domain 格式是`<svc>.<namespace>.svc.cluster.local`

如果我们容器直接访问`<svc>.<namespace>.svc.cluster.local`，因为默认DNS设置的问题，解析的次数反而更多。正确的方式是访问`<svc>`

例子：假设test下面有个s的svc

```bash
host -v s 
# 解析1次
host -v s.test.svc.cluster.local
# 解析4次
```

所以，访问同namespace其他svc，直接用svc名去访问即可，没必要装逼使用`<svc>.<namespace>.svc.cluster.local`这种格式。

## 其他知识

### dns记录类型

1. A记录：地址记录，用来指定域名的IPv4地址（如：8.8.8.8），如果需要将域名指向一个IP地址，就需要添加A记录。
1. CNAME： 如果需要将域名指向另一个域名，再由另一个域名提供ip地址，就需要添加CNAME记录。
1. TXT：在这里可以填写任何东西，长度限制255。绝大多数的TXT记录是用来做SPF记录（反垃圾邮件）。
1. NS：域名服务器记录，如果需要把子域名交给其他DNS服务商解析，就需要添加NS记录。
1. AAAA：用来指定主机名（或域名）对应的IPv6地址（例如：ff06:0:0:0:0:0:0:c3）记录。
1. MX：如果需要设置邮箱，让邮箱能收到邮件，就需要添加MX记录。
1. 显性URL：从一个地址301重定向到另一个地址的时候，就需要添加显性URL记录（注：DNSPod目前只支持301重定向）。
1. 隐性URL：类似于显性URL，区别在于隐性URL不会改变地址栏中的域名。
1. SRV：记录了哪台计算机提供了哪个服务。格式为：服务的名字、点、协议的类型，例如：_xmpp-server._tcp。

### 用到的命令

安装方法：

```bash
  yum install -y bind-utils
  sudo apt-get install -y dnsutils
  apk add bind-tools
```

#### [dig](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/dig.htm)

  dig +trace +ndots=5 +search $host


#### [host](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/host.htm)

  host -v $host

## 参考链接:

1. [iptables中DNAT、SNAT和MASQUERADE的理解](https://blog.csdn.net/wgwgnihao/article/details/68490985#)
1. [linux根文件系统 /etc/resolv.conf 文件详解](https://blog.csdn.net/mybelief321/article/details/10049429#)
1. [kube-dns per node #45363](https://github.com/kubernetes/kubernetes/issues/45363)
1. [DNS intermittent delays of 5s #56903](https://github.com/kubernetes/kubernetes/issues/56903)
1. [Racy conntrack and DNS lookup timeouts](https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts)
1. [/etc/resolv.conf](http://www.man7.org/linux/man-pages/man5/resolver.5.html)
1. [/etc/resolv.conf search和ndots配置](https://www.ichenfu.com/2018/10/09/resolv-conf-desc/)
1. [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)