## 常用命令

```bash
iftop -i eth0 -nNB -m 10M
```

![image](/img/in-post/ss/1.png)

查看不同状态的连接数数量

```bash
netstat -an | awk '/^tcp/ {++y[$NF]} END {for(w in y) print w, y[w]}'
```

```bash
[root@dddd ~]# ss  -s

Total: 9599 (kernel 9688)
TCP:   12227 (estab 26, closed 12043, orphaned 6, synrecv 0, timewait 4920/0), ports 0

Transport Total     IP        IPv6
*         9688      -         -
RAW       0         0         0
UDP       14        8         6
TCP       184       35        149
INET      198       43        155
FRAG      0         0         0
```

这个是 closed 状态较多。

closed 状态只是表示连接恢复到初始的状态，这个socket 还在使用中， 而这样的话，后面程序有通信的话会继续使用这个socket ，不用重新分配，效率会有提高的。 不然重复创建销毁socket会带来很多消耗的。


## 补充知识

net.ipv4.tcp_retries2

默认是 15 ，即 linux 系统会监测一个 tcp 连接，如果没有数据量传输，最长要等到 15m 后才会释放

意思是 php 的服务，产生了大量没有关闭的连接

好像是 TIME_WAIT 状态的比较多


## 参考链接

1. [浅谈iptables防SYN Flood攻击和CC攻击](https://www.cnblogs.com/harlanzhang/p/6189491.html)
1. [ss命令和Recv-Q和Send-Q状态](https://www.cnblogs.com/leezhxing/p/5329786.html)
2. [每天一个linux命令（57）：ss命令](https://www.cnblogs.com/peida/archive/2013/03/11/2953420.html)