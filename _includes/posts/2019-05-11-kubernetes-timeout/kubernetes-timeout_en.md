kubernetes + alpine + php is particularly prone to timeout issues when accessing external networks/resolving external addresses.

## Cause

When docker containers access external networks, the complete path is:

Container --> Host --> External Network --> Host --> Container

Traffic between containers and hosts needs to go through Source Network Address Translation (SNAT) to flow smoothly.

SNAT is like a porter, moving bricks (traffic) from containers to the host.

If multiple containers run on one host and concurrently access external networks (especially PHP which has no connection pool), they request available ports from the system (nf_nat_l4proto_unique_tuple). If unavailable, +1, then request again, then verify. When this process happens too much, it ultimately leads to addressing timeouts.

Simply put, it's a system kernel issue.

For detailed explanation, see:

[Remembering a Journey to Find the Unexplained Connection Timeout on Docker/Kubernetes](https://mp.weixin.qq.com/s?__biz=MzIzNzU5NTYzMA==&mid=2247484016&idx=1&sn=72bc7f3443cbc259762fb6bd7adb33ae&chksm=e8c77cf1dfb0f5e7598497767db6365bd8db9f4b6a945cb8c72adb1e052e8b0cd46b727c929b&scene=21#wechat_redirect)

## Solutions

### Optimal Solution

Upgrade nodes to Linux kernel 5.1.

Upgrade iptables to 1.6.2 or above.

Use network plugins based on IPVS mode, minimize SNAT/DNAT, support random port SNAT to start kubernetes.

Or use network plugin solutions that bypass SNAT, such as Alibaba Cloud's [terway](https://github.com/AliyunContainerService/terway). But this plugin is deeply bound to Alibaba Cloud and requires purchasing an additional elastic network interface for each machine.

### Suboptimal Solution

[Deploy name server with ds](https://github.com/kubernetes/enhancements/blob/master/keps/sig-network/0030-nodelocal-dns-cache.md), all nodes' DNS resolution goes through the name server on the node, alleviating this type of problem through minimal SNAT + dns cache.

### Pseudo-Solution (Cannot Solve Root Problem)

The default pod's `/etc/resolv.conf` usually looks like this:

```
sh-4.2# cat /etc/resolv.conf
nameserver <kube-dns-vip>
search <namespace>.svc.cluster.local svc.cluster.local cluster.local localdomain
options ndots:5
```

This configuration means the default nameserver points to kube-dns/core-dns. In all queries, if the number of dots is less than 5, it will search according to the list configured in search. If no result is returned, it will finally directly query the domain name itself. ndots means n dots.

For example:

```
sh-4.2# host -v baidu.com
Trying "baidu.com.<namespace>.svc.cluster.local"
Trying "baidu.com.svc.cluster.local"
Trying "baidu.com.cluster.local"
Trying "baidu.com.localdomain"
Trying "baidu.com"
......
```

#### Don't Use alpine Images

#### Use [FQDN](https://baike.baidu.com/item/FQDN)

Since domain names are resolved level by level from right to left, for example `google.com`, it's actually `google.com.`, the . after com is called the root domain. When resolving, first resolve ., then resolve .com, .com is called the top-level domain, finally resolve google.

Using FQDN: (Fully Qualified Domain Name) is to minimize the resolution pressure on internal DNS (like coreDNS, node DNS) as much as possible.

#### Reopen Socket

```yaml
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c 
              - "/bin/echo 'options single-request-reopen' >> /etc/resolv.conf"
```

Setting reopen socket is to avoid concurrent A, AAAA queries in containers.


#### 2-Level Domain Directly Goes to Upper-Level Resolution

Reference [kubernetes using alpine-based images cannot properly resolve external DNS](https://www.sudops.com/kubernetes-alpine-image-resolve-ext-dns.html)

Running `sed -i 's/options ndots:5/#options ndots:5/g' /etc/resolv.conf` directly will error.

alpine's echo command swallows newlines, and if resolv.conf format is wrong, DNS resolution will error.

```yaml
  dnsConfig:
    options:
      - name: ndots
        value: "2"
      - name: single-request-reopen
```

Removed `options ndots:5`, changed to default value 1. This way, containers directly accessing <svc> is still fine, going through search list, `<svc>.<namespace>.svc.cluster.local`, can still be accessed.

When resolving `Google.com`, it's actually resolving `Google.com.`, the number of dots exceeds 1, so it doesn't go through the search list, directly uses upper-level DNS.

In summary, removing ndots/setting ndots to 1 reduces the possibility of frequent DNS queries. It has "miraculous effects" for resolving external IPs.

But if this host runs other containers (isn't this nonsense, if a node doesn't run multiple containers, why use kubernetes), other containers will also request concurrently, the SNAT problem will still appear, so modifying the `/etc/resolv.conf` file cannot solve the root problem.


Workaround 1

```
          lifecycle:
            postStart:
              exec:
                command:
                - /bin/sh
                - -c 
                - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

Workaround 2

```
      initContainers:
      - name: alpine
        image: alpine
        command:
         - /bin/sh
         - -c 
         - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

## Derived Problems

### DNAT

Containers accessing clusterIP (because it's a virtual IP, DNAT is needed) may also have this type of timeout problem.

### Don't Forcefully Add Drama When Accessing Same Namespace svc

The virtual domain format for non-head service is `<svc>.<namespace>.svc.cluster.local`

If our container directly accesses `<svc>.<namespace>.svc.cluster.local`, because of default DNS settings, the number of resolutions is actually more. The correct way is to access `<svc>`

Example: Assume there's an s svc under test

```bash
host -v s 
# Resolve 1 time
host -v s.test.svc.cluster.local
# Resolve 4 times
```

So, when accessing other svc in the same namespace, just use the svc name directly, no need to show off using the `<svc>.<namespace>.svc.cluster.local` format.

## Other Knowledge

### DNS Record Types

1. A record: Address record, used to specify the IPv4 address of a domain name (e.g., 8.8.8.8). If you need to point a domain name to an IP address, you need to add an A record.
1. CNAME: If you need to point a domain name to another domain name, which then provides an IP address, you need to add a CNAME record.
1. TXT: You can fill in anything here, length limit 255. The vast majority of TXT records are used for SPF records (anti-spam).
1. NS: Name server record. If you need to hand over subdomain resolution to other DNS service providers, you need to add an NS record.
1. AAAA: Used to specify the IPv6 address corresponding to a hostname (or domain name) (e.g., ff06:0:0:0:0:0:0:c3) record.
1. MX: If you need to set up email so emails can be received, you need to add an MX record.
1. Explicit URL: When you need to 301 redirect from one address to another, you need to add an explicit URL record (Note: DNSPod currently only supports 301 redirect).
1. Implicit URL: Similar to explicit URL, the difference is that implicit URL doesn't change the domain name in the address bar.
1. SRV: Records which computer provides which service. Format: service name, dot, protocol type, e.g., _xmpp-server._tcp.

### Commands Used

Installation method:

```bash
  yum install -y bind-utils
  sudo apt-get install -y dnsutils
  apk add bind-tools
```

#### [dig](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/dig.htm)

  dig +trace +ndots=5 +search $host


#### [host](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/host.htm)

  host -v $host

## Reference Links:

1. [Understanding DNAT, SNAT and MASQUERADE in iptables](https://blog.csdn.net/wgwgnihao/article/details/68490985#)
1. [Detailed Explanation of Linux Root File System /etc/resolv.conf File](https://blog.csdn.net/mybelief321/article/details/10049429#)
1. [kube-dns per node #45363](https://github.com/kubernetes/kubernetes/issues/45363)
1. [DNS intermittent delays of 5s #56903](https://github.com/kubernetes/kubernetes/issues/56903)
1. [Racy conntrack and DNS lookup timeouts](https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts)
1. [/etc/resolv.conf](http://www.man7.org/linux/man-pages/man5/resolver.5.html)
1. [/etc/resolv.conf search and ndots configuration](https://www.ichenfu.com/2018/10/09/resolv-conf-desc/)
1. [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
