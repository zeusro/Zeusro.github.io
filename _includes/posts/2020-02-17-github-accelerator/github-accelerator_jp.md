最近、パンデミックの問題により、GitHubにアクセスする際、ユーザーのアバターが表示されないだけでなく、`raw.githubusercontent.com`（GitHubの静的ファイルホスティングドメイン）上のリモートコードを実行すると直接443が爆発します。皆の作業が非常に不便になっています。

そこで、現在の解決策を収集し、整理して、根本から問題を解決しようとしました。

## 問題の認識

### GitHub関連ドメイン

**HOST内のIPは間違っています。直接コピー＆ペーストしないでください！**

```host
# GitHub Start
192.30.253.112 github.com
192.30.253.119 gist.github.com
151.101.228.133 assets-cdn.github.com
151.101.228.133 raw.githubusercontent.com
151.101.228.133 gist.githubusercontent.com
151.101.228.133 cloud.githubusercontent.com
151.101.228.133 camo.githubusercontent.com
151.101.228.133 avatars0.githubusercontent.com
151.101.228.133 avatars1.githubusercontent.com
151.101.228.133 avatars2.githubusercontent.com
151.101.228.133 avatars3.githubusercontent.com
151.101.228.133 avatars4.githubusercontent.com
151.101.228.133 avatars5.githubusercontent.com
151.101.228.133 avatars6.githubusercontent.com
151.101.228.133 avatars7.githubusercontent.com
151.101.228.133 avatars8.githubusercontent.com
192.30.253.116  api.github.com
# GitHub End
```

### 問題の根本原因

大規模なDNSハイジャック汚染、解決された日本のIP 151.101.228.133は深刻なパケット損失があります。

```bash
ping 151.101.228.133
......
--- 151.101.228.133 ping statistics ---
2661 packets transmitted, 2309 packets received, 13.2% packet loss
round-trip min/avg/max/stddev = 69.550/117.602/230.267/21.696 ms
```

## プロキシソリューション

### 自分でPACファイルを変更

#### ローカルPACを変更

上記から、GitHub関連のドメインは：

```
github.com
*.github.com
*.githubusercontent.com
```

Windows側の紙飛行機PACはローカルファイルです。

mac側の紙飛行機は直接編集でき、1行に1つのドメイン、原理は似ています。理解できない場合はコピー＆ペーストしてください〜

[V2rayU](https://github.com/yanue/V2rayU)も同様です

#### ローカルDNS解決を更新

```bash
# MAC（OS X 10.11+）
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
# window
ipconfig /flushdns
```

### SwitchyOmega自動切り替えモード（V2rayUに適用）

「PACシナリオモード」を使用してv2のシナリオモードを設定します。

その後、自動切り替えモードを設定して使用します。

![img](/img/in-post/github/SwitchyOmega.png)


[V2RayX](https://github.com/Cenmrev/V2RayX/releases)に切り替える場合は、これほど面倒な必要はなく、pacを直接編集できますが、作者は最近あまり更新していません。


## プロキシなしソリューション

### hostを変更

https://www.ipaddress.com/
でgithub.comなどのドメインの米国のIPを見つけ、HOSTにバインドします。
**これは手作業です**。

国内のものは正確ではないかもしれませんが、参考にできます：
1. https://tool.lu/dns/index.html
1. http://tool.chinaz.com/dns/

Windowsシステムファイルの場所は`C:/windows/system32/drivers/etc/hosts`です

macシステムファイルは/etc/hostsにあります

[SwitchHosts](https://github.com/oldj/SwitchHosts/releases)を使用してhostファイルを管理することをお勧めします

高度なソリューションは、Webインターフェースを呼び出してHOSTを動的に更新するプログラムを書くことです。

```host
# raw.githubusercontent.comはGitHubの静的ファイルホスティングドメインです
199.232.28.133 raw.githubusercontent.com
```

私は`raw.githubusercontent.com`上のコードを急いで使用していたため、米国のIPに変更し、プロキシ経由でアクセスしました。

### Chromeブラウザ拡張機能

**GitHub加速**を検索してインストールするだけで完了です。彼らは中継された国内ドメインを使用してクローンし、DNS解決の問題を回避しています。

## git加速

[chuyik](https://gist.github.com/chuyik)のソリューションを参照


### SSHプロトコルでSSHトンネルを使用してプロキシ（mac、Linux）

自分のsshを海外のマシンに追加し、xx.xx.xx.xxはマシンのパブリックIPです。

その後、マシンのIPをssh設定`~/.ssh/config`に追加します：

```
Host github.com raw.githubusercontent.com
    ProxyCommand  ssh root@xx.xx.xx.xx nc %h %p
```

その後、クライアントの公開鍵をリモートGitHubに追加します。SSHプロトコルを使用してリポジトリをクローンする場合にのみ有効になります。

    git clone git@github.com:owner/git.git

### http(s)プロトコルでローカルプロキシ+git configを使用

```bash
# HTTPプロキシを使用
git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"
# socks5プロキシを使用（Shadowsocksなど）
git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"
# 設定をキャンセル
git config --global --unset http.proxy
git config --global --unset https.proxy
# 最後に設定を確認
git config --list --global
git config --list --system
```

     git clone https://github.com/owner/git.git

## flclash経由のssh

SSH設定（~/.ssh/config）に次のように記述します：

```
Host github.com
    HostName ssh.github.com
    Port 443
    User git
    # socks5プロキシを使用する場合
    ProxyCommand nc -x 127.0.0.1:7890 %h %p
```

ここでssh.github.comはGitHubのSSH-over-443アドレスです。  ￼

nc -x ホスト:ポート %h %pはnc（netcat）を使用してSOCKS5プロキシ経由でSSHを転送します。-xはプロキシタイプ（socks）を指定します。flclashのローカルプロキシポートに応じて変更します。SSH ConfigのProxyCommandは、SSHトラフィックをプロキシ経由で送信できます。  ￼

ServerAliveIntervalなどのパラメータも追加して、接続のアイドル中断を防ぐことができます。

```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
ssh ssh.github.com
Please type 'yes', 'no' or the fingerprint: yes
Warning: Permanently added '[ssh.github.com]:443' (ED25519) to the list of known hosts.
```

SSHポート22のブロックを回避するため、GitHubは追加で443ポートのSSHサービスを提供しているため、その公開鍵フィンガープリントも異なります。
yesを入力すると、git pushで切断の問題が発生しなくなります。

## 究極のソリューション

米国グリーンカード

![img](/img/逃.jpg)

最後にもう一言、
[最近、ssプロトコルクライアントの攻撃プロセス全体を復元した人がいます](https://www.leadroyal.cn/?p=1036)

## 参考リンク

1. [Hostsを変更してGitHubのraw.githubusercontent.com接続問題を一時的に解決](https://www.ioiox.com/archives/62.html)
1. [中国でのGitHubアクセスで発生する問題の解決](http://rovo98.coding.me/posts/7e3029b3/)
1. [Gitにプロキシを設定する方法は？](https://segmentfault.com/q/1010000000118837)
1. [macOSでGit(Github)にプロキシ（HTTP/SSH）を設定](https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1)
