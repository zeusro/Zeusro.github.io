In March 2018, I officially took over all digital assets of the Amoeba Group company one by one, becoming the de facto operations manager.

Because the leadership valued me (~~the boss was reluctant to spend money~~), for a long time, I was the only one responsible for everything.

Especially in the CDN field, because it involves legacy projects, domain name resolution, TTL, and stupid domestic internet operators (like Great Wall Broadband), this work content needs to be handled more carefully.

Let's go back to the root question: why do we need CDN, and what problem does CDN actually solve?

## Why Do We Need CDN

![image](/img/in-post/cdn-history/http.png)

To answer this question, we need to think about it from a macro historical perspective.

In ancient web requests, if going through A resolution, the request chain is basically as follows:

```
computer --> local DNS  --> server IP
```

After obtaining the server IP, the electronic terminal (computer, phone, iPad) establishes a TCP connection with the server, and finally the browser renders.

But there's a problem here: `server IP` is only one, while `computer` is usually many. If there are too many users (computers), network congestion will occur. This is like going to a restaurant to eat, but the boss is stingy, there's only one waiter. As customers increase, the waiter gets busier and busier, and eventually can't take care of you at all.

So, how to solve this problem?

![image](/img/in-post/cdn-history/secret-garden.jpg)

The answer is, of course, to throw money at it! Since you think there are too few waiters and the service isn't good enough, then spend more money to go to a maid cafe, so the girls can legally surround you.

CDN is a similar mechanism—by continuously investing in girls (CDN edge acceleration nodes), better serving people who want to eat (use the internet to drive).

## Using CDN

Later, when we left the ancient web era and came to modern times. With users growing exponentially, we needed a new architecture to adapt to changes.

Software design has always had a pattern: **if one layer isn't enough, add another layer**.

![image](/img/in-post/cdn-history/maxresdefault.jpg)

So, in modern times, web backend architecture is usually a `layered pastry`:

```
$host --> cname --> CDN --> SLB ip --> server1,server2,server3,...
```

And the user access chain is:

```
computer --> local DNS  --> CDN
```

CDN's essence is **buffering and caching of static data**.

## CDN Problem Diagnosis

Around 2015, I was doing part-time technical support for the company. I often helped customers troubleshoot technical issues on QQ (~~pulling network cables~~), gradually accumulating some network diagnosis (~~bragging~~) experience.

If we break down the entire "modern" web backend request chain, we'll find that data flow at each layer can cause problems.

### Computer Problems

Mainly garbage configuration and garbage broadband issues. For garbage broadband problems, I generally recommend users to complain to operators at the [Ministry of Industry and Information Technology Telecom User Complaint Center](https://dxss.miit.gov.cn/).

### Local DNS Problems

`local DNS` is also called local DNS. If not specifically set, it goes through the router, and the router goes through the operator.
If you encounter an operator with no bottom line, it's possible that the website you entered is correct, but you still can't access the internet.

The reason for this problem is that DNS service itself is a web service provider. If I change the DNS IP here, but the operator deliberately resolves incorrectly (DNS pollution) or the DNS can't keep up (still caching old records after TTL expires), the entire resolution will have problems.

So later, I wrote a document and had operations add it to our company's [help documentation](https://17zwd.com/help/dianzhu/201806250906137255.htm)—mainly just setting `local DNS` to avoid the operator's weak `DNS` problem.

![image](/img/in-post/cdn-history/local-dns.png)

### CDN Problems

CDN problems appear more hidden, and usually CDN operators will pass the buck. So at this time, you need to collect user data in detail, then go back and greet the CDN~~parents~~.

Assuming the problem is with stu.17zwd.com. I would have users visit https://ipip.net and take a screenshot. Then according to different systems, enter different commands.

- [Windows clients]

```bash
set host=stu.17zwd.com
ipconfig -all
ping %host%
tracert %host%
```

- [Mac clients]

```bash
export host=stu.17zwd.com
nslookup $host
ping $host
traceroute $host
```

Then report upstream.

`*.w.alikunlun.com` is usually Alibaba Cloud,
`*.wswebpic.com` is basically Wangsu.

### Authoritative DNS Problems

![image](/img/in-post/cdn-history/dns-query_20151207015631_954.png)

This problem appears very rarely. I've only encountered it once. That time was when the server was accessing a domain name that couldn't be filed in China.
After contacting Alibaba Cloud after-sales, we found that the server's IP was restricted from accessing authoritative DNS.

Because authoritative DNS is essentially also a web service, it can actively reject illegal connections.

## Fighting for Bargaining Power

Public clouds' profit model essentially relies on traffic fees brought by [network effects](https://wiki.mbalib.com/wiki/%E7%BD%91%E7%BB%9C%E6%95%88%E5%BA%94). As server scale increases, we'll find that bandwidth costs gradually rise.

After my rough calculation, after averaging, costs account for more than 50%. So, after I took office, to minimize spending in this area, I made a lot of efforts.

**The key to enterprise profit lies in monopoly operations. To break monopolies, you need competitors.** So I introduced Wangsu and urged them to make a plan I was relatively satisfied with. This plan is "**billing by bandwidth**".

After my long-term "Fermi estimation", I summarized the hybrid strategy of `traffic` + `bandwidth`.
Main traffic goes to Alibaba Cloud, using traffic billing; foreign and small traffic sites go to Wangsu.

After introducing Wangsu, we no longer absolutely depend on Alibaba Cloud and have the ability to scale at any time. After that, I used this as leverage to apply for a higher discount for the company's Alibaba Cloud account CDN product in the 2020 fiscal year.

Quite coincidentally, the Alibaba Cloud business manager I was working with used to work at ChinaCache. And when we used ChinaCache CDN before, we were also working with her. We were reunited after a long separation.

## Automated Operations Programs

**The essence of CDN costs is network traffic costs**.

Within Alibaba Cloud, I added a shared bandwidth pool billed by bandwidth. And used [common-bandwidth-auto-switch](https://github.com/p-program/common-bandwidth-auto-switch), a project I wrote myself, to dynamically plan the EIP list in the shared bandwidth pool, absolutely not letting Alibaba Cloud make one more cent from our company!!!

For image origin servers, I did an [nginx-brotli experiment](http://www.zeusro.com/2018/07/05/nginx-brotli/), encoding images with `brotli` to compress costs.

Finally, I summarized "[Multi-Public Cloud CDN Best Practices](http://www.zeusro.com/2019/09/20/cdn-pickup/)", occasionally [using "super pretentious" methods to troubleshoot CDN traffic surge problems](http://www.bullshitprogram.com/super-b/).

Very early on, I vaguely felt that "**technology serves business value**", so the projects I did could basically calculate commercial value.
The previous slacking off was mainly because I felt those projects weren't very profitable.

## Network Diagnosis in the Cloud Native Era

Entering the cloud native era, troubleshooting network problems has become more complex.
Specifically, you can see:
1. [kubernetes timeout problems](http://www.zeusro.com/2019/05/11/kubernetes-timeout/)
1. [Understanding kubernetes service traffic forwarding chain](http://www.zeusro.com/2019/05/17/kubernetes-iptables/)

[kt-connect](https://github.com/alibaba/kt-connect) is also a good project.
If you like native tools, I recommend using `tcpdump` directly 🤣.

## Conclusion

> Excavators are CDN's biggest enemy.

## References

[1]
Use of Proxy-connection and connection, how to manage long and short connections across proxy servers?
https://my.oschina.net/u/4266687/blog/3514919

[2]
DNS Basic Concepts
https://dudns.baidu.com/support/knowledge/Theory/

[3]
HTML Rendering Process Explained
https://www.cnblogs.com/dojo-lzz/p/3983335.html

[4]
CDN Caching Matters
https://bbs.qcloud.com/forum.php?mod=viewthread&tid=3775

[5]
Link Testing Methods When Using ping Command Packet Loss or No Connection
https://help.aliyun.com/knowledge_detail/40573.html

[6]
Multi-dimensional CDN Analysis
https://zhuanlan.zhihu.com/p/142787755
