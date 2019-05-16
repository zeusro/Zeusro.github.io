---
layout:       post
title:        "iptables"
subtitle:     "理解kubernetes的service流量转发链路"
date:         2019-05-17
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
    - Linux
---

## 基本

3 个协议：TCP,UDP,ICMP

4 个状态：NEW,ESTABLISHED,INVALID,RELATED

4个表

1. raw：高级功能，如：网址过滤。
1. mangle：数据包修改（QOS），用于实现服务质量。
1. net：地址转换，用于网关路由器。
1. filter：包过滤，用于防火墙规则。

5个链

1. PREROUTING链：用于目标地址转换（DNAT）。
1. INPUT链：处理输入数据包。
1. PORWARD链：处理转发数据包。
2. 1. OUTPUT链：处理输出数据包。
1. POSTOUTING链：用于源地址转换（SNAT）。

## 常用方法

```

iptables -t filter -nL
iptables -t nat -nL
iptables -t raw -nL 
iptables -t mangle -nL
```


## 用iptables分析kubernetes svc流量链路

> node节点的iptables是由kube-proxy生成的，具体实现可以参见[kube-proxy的代码](https://github.com/kubernetes/kubernetes/blob/master/pkg/proxy/iptables/proxier.go)
> 
> kube-proxy只修改了filter和nat表，它对iptables的链进行了扩充，自定义了KUBE-SERVICES，KUBE-NODEPORTS，KUBE-POSTROUTING，KUBE-MARK-MASQ和KUBE-MARK-DROP五个链，并主要通过为 KUBE-SERVICES链（附着在PREROUTING和OUTPUT）增加rule来配制traffic routing 规则

### 集群信息

Pod CIDR :172.31.0.0/16

阿里云kubernetes v1.12.6-aliyun.1

*.aliyuncs.com/acs/flannel:v0.8.0

SLB私有IP：172.6.6.6 (实际上还绑定了一个EIP)

### 以某个svc为例

以default名下的testsvc作为例子

```

➜  ~ kgsvc testsvc
NAME              TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)         w
testsvc           LoadBalancer   172.30.5.207   172.6.6.6      443:30031/TCP   106d

➜  ~ iptables -t nat -nL 

Chain PREROUTING (policy ACCEPT)
target         prot opt source               destination
KUBE-SERVICES  all  --  0.0.0.0/0            0.0.0.0/0            /* kubernetes service portals */

Chain OUTPUT (policy ACCEPT)
target         prot opt source               destination
KUBE-SERVICES  all  --  0.0.0.0/0            0.0.0.0/0            /* kubernetes service portals */
DOCKER         all  --  0.0.0.0/0           !127.0.0.0/8          ADDRTYPE match dst-type LOCAL

# 所有的服务都在这个Chain里面,非常长
Chain KUBE-SERVICES (2 references)
target                     prot opt source               destination
KUBE-MARK-MASQ             tcp  -- !172.31.0.0/16        172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
KUBE-SVC-M42ZCW2EYUCRBVAF  tcp  --  0.0.0.0/0            172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
......
KUBE-FW-M42ZCW2EYUCRBVAF   tcp  --  0.0.0.0/0            172.6.6.6            /* default/testsvc: loadbalancer IP */ tcp dpt:443

# 对经过的报文打标签
Chain KUBE-MARK-MASQ (522 references)
target     prot opt source               destination
MARK       all  --  0.0.0.0/0            0.0.0.0/0            MARK or 0x4000

Chain KUBE-XLB-M42ZCW2EYUCRBVAF (2 references)
target                     prot opt source               destination
KUBE-SVC-M42ZCW2EYUCRBVAF  all  --  172.31.0.0/16        0.0.0.0/0            /* Redirect pods trying to reach external loadbalancer VIP to clusterIP */
KUBE-MARK-DROP             all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: has no local endpoints */


Chain KUBE-SVC-M42ZCW2EYUCRBVAF (2 references)
target                     prot opt source               destination
KUBE-SEP-EA7TYKWK2S6G4PQR  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.14286000002
KUBE-SEP-ZJI36FVTROQF5MX7  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.16667000018
KUBE-SEP-JLGUPWE7JCRU2AGG  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.20000000019
KUBE-SEP-GCNPY23RDN22AOTX  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.25000000000
KUBE-SEP-FNDISD3HQYKEHL3T  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.33332999982
KUBE-SEP-3RWVMCKITDQWELSA  all  --  0.0.0.0/0            0.0.0.0/0            statistic mode random probability 0.50000000000
KUBE-SEP-BVMKBOC4GGNJ3567  all  --  0.0.0.0/0            0.0.0.0/0

Chain KUBE-SEP-BVMKBOC4GGNJ3567 (1 references)
# 172.31.9.52是pod虚拟IP
target          prot opt source               destination
KUBE-MARK-MASQ  all  --  172.31.9.52          0.0.0.0/0
DNAT            tcp  --  0.0.0.0/0            0.0.0.0/0            tcp to:172.31.9.52:80

Chain KUBE-FW-M42ZCW2EYUCRBVAF (1 references)
target                     prot opt source               destination
KUBE-XLB-M42ZCW2EYUCRBVAF  all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: loadbalancer IP */
KUBE-MARK-DROP             all  --  0.0.0.0/0            0.0.0.0/0            /* default/testsvc: loadbalancer IP */

Chain KUBE-MARK-DROP (60 references)
target     prot opt source               destination
MARK       all  --  0.0.0.0/0            0.0.0.0/0            MARK or 0x8000
```

图形化:

![image](/img/in-post/kubernetes-iptables/chain.png)

```
graph TB
a(内部流量/PREROUTING)-->c(KUBE-SERVICES)
b(外部流量/OUTPUT)-->c
c-->d(KUBE-MARK-MASQ)
d-->|destination:172.30.5.207|e(KUBE-SVC-M42ZCW2EYUCRBVAF)
e-->|destination:172.30.5.207|p1(KUBE-SEP-EA7TYKWK2S6G4PQR)
e-->|destination:172.30.5.207|p2(KUBE-SEP-ZJI36FVTROQF5MX7)
p1-->|destination:<podIP1>|f(KUBE-FW-M42ZCW2EYUCRBVAF)
p2-->|destination:<podIP2>|f
f-->g(KUBE-XLB-M42ZCW2EYUCRBVAF)
g-->|loadbalancer的IP在节点上截获后转给service|h(KUBE-SVC-M42ZCW2EYUCRBVAF)
```

### 一些iptables的技巧

#### 为什么pod的probability越来越大

第一个1/3概率 如果匹配上了说明命中了1/3, 没匹配上剩下2/3到下一条

第二条1/2概率 如果匹配上了说明命中了 2/3 * 1/2 = 1/3，没匹配上 1/2到下一条

第三条1的概率 匹配上了是2/3 * 1/2 * 1 = 1/3

#### 最后一个chain KUBE-SEP-BVMKBOC4GGNJ3567为什么没有probability

顺序匹配,他吃剩下的，所以不再需要计算权重了

#### destination 0.0.0.0/0是什么意思

仔细观察整个链路，到`KUBE-SEP-XXX`这一步时已经取得了pod的虚拟IP.所以除此以外的chain destination保持不变，不再需要修改


## 结论

1. kubernetes 0.8版本的flannel是对iptables的大规模运用。
1. KUBE-SERVICES这个又臭又长的chain链注定了服务匹配是O(n)的，随着svc越来越多，增删改查会越来越卡。
1. svc数量大于1000时，卡顿会相当明显
2. kube-proxy应基于IPVS模式，走iptables只会重蹈覆辙
3. svcIP是一个中转的虚拟IP


## 参考链接:
1. [Kubernetes 从1.10到1.11升级记录(续)：Kubernetes kube-proxy开启IPVS模式](https://blog.frognew.com/2018/10/kubernetes-kube-proxy-enable-ipvs.htm)
2. [如何在 kubernetes 中启用 ipvs](https://juejin.im/entry/5b7e409ce51d4538b35c03df)
3. [华为云在 K8S 大规模场景下的 Service 性能优化实践](https://zhuanlan.zhihu.com/p/37230013)
4. [kubernetes的网络数据包流程](https://zhuanlan.zhihu.com/p/28289080)
5. [kube-proxy的ipvs模式解读](https://segmentfault.com/a/1190000016333317)
6. [kube-proxy 模式对比：iptables 还是 IPVS？](https://www.jishuwen.com/d/2K3c)
1. [How to edit iptables rules](https://fedoraproject.org/wiki/How_to_edit_iptables_rules)
2. [关于iptables & ipvs的简单介绍](http://www.voidcn.com/article/p-uttldwvk-pz.html)
3. [iptables相关](https://www.zsythink.net/archives/category/%E8%BF%90%E7%BB%B4%E7%9B%B8%E5%85%B3/iptables/)
4. [理解kubernetes环境的iptables](https://www.cnblogs.com/charlieroro/p/9588019.html)

