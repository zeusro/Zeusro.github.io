## Common Commands

```bash
iftop -i eth0 -nNB -m 10M
```

![image](/img/in-post/ss/1.png)

View the number of connections in different states

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

This shows many connections in `closed` state.

The `closed` state only means the connection has returned to its initial state. This socket is still in use, so if the program needs to communicate later, it will continue using this socket without reallocation, which improves efficiency. Otherwise, repeatedly creating and destroying sockets would bring a lot of overhead.


## Supplementary Knowledge

net.ipv4.tcp_retries2

Default is 15, meaning the Linux system will monitor a TCP connection. If there's no data transmission, it will wait up to 15 minutes before releasing it.

This means PHP services have generated a large number of unclosed connections.

It seems there are many connections in `TIME_WAIT` state.


## Reference Links

1. [Brief Discussion on iptables Preventing SYN Flood Attacks and CC Attacks](https://www.cnblogs.com/harlanzhang/p/6189491.html)
1. [ss Command and Recv-Q and Send-Q States](https://www.cnblogs.com/leezhxing/p/5329786.html)
2. [One Linux Command Per Day (57): ss Command](https://www.cnblogs.com/peida/archive/2013/03/11/2953420.html)
