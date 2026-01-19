## よく使うコマンド

```bash
iftop -i eth0 -nNB -m 10M
```

![image](/img/in-post/ss/1.png)

異なる状態の接続数を確認

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

これは`closed`状態が多いことを示しています。

`closed`状態は、接続が初期状態に戻ったことを意味するだけです。このソケットはまだ使用中なので、プログラムが後で通信する必要がある場合、再割り当てなしでこのソケットを引き続き使用し、効率が向上します。そうでなければ、ソケットを繰り返し作成および破棄すると、多くのオーバーヘッドが発生します。


## 補足知識

net.ipv4.tcp_retries2

デフォルトは15で、LinuxシステムがTCP接続を監視することを意味します。データ転送がない場合、最大15分待機してから解放します。

これは、PHPサービスが大量の閉じられていない接続を生成していることを意味します。

`TIME_WAIT`状態の接続が多いようです。


## 参考リンク

1. [iptablesによるSYN Flood攻撃とCC攻撃の防止について](https://www.cnblogs.com/harlanzhang/p/6189491.html)
1. [ssコマンドとRecv-QとSend-Q状態](https://www.cnblogs.com/leezhxing/p/5329786.html)
2. [毎日1つのlinuxコマンド（57）：ssコマンド](https://www.cnblogs.com/peida/archive/2013/03/11/2953420.html)
