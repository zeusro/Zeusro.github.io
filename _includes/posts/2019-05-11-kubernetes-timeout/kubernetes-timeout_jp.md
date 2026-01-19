kubernetes + alpine + phpは、外部ネットワークへのアクセス/外部アドレスの解決時にタイムアウトの問題が特に発生しやすいです。

## 原因

dockerコンテナが外部ネットワークにアクセスする場合、完全なパスは次のとおりです。

コンテナ --> ホスト --> 外部ネットワーク --> ホスト --> コンテナ

コンテナとホスト間のトラフィックは、ソースネットワークアドレス変換（SNAT）を通過してスムーズに流れる必要があります。

SNATは、コンテナからホストにレンガ（トラフィック）を移動するポーターのようなものです。

1つのホスト上で複数のコンテナが実行され、外部ネットワークに同時にアクセスする場合（特に接続プールがないPHP）、システムから利用可能なポート（nf_nat_l4proto_unique_tuple）を要求します。利用できない場合は+1し、再度要求し、検証します。このプロセスが多すぎると、最終的にアドレッシングタイムアウトが発生します。

簡単に言えば、システムカーネルの問題です。

詳細な説明については、以下を参照してください：

[Docker/Kubernetesで説明できない接続タイムアウトの原因を探る旅を記録](https://mp.weixin.qq.com/s?__biz=MzIzNzU5NTYzMA==&mid=2247484016&idx=1&sn=72bc7f3443cbc259762fb6bd7adb33ae&chksm=e8c77cf1dfb0f5e7598497767db6365bd8db9f4b6a945cb8c72adb1e052e8b0cd46b727c929b&scene=21#wechat_redirect)

## 解決策

### 最適解

ノードをLinuxカーネル5.1にアップグレードします。

iptablesを1.6.2以上にアップグレードします。

IPVSモードベースのネットワークプラグインを使用し、SNAT/DNATを最小限に抑え、ランダムポートSNATをサポートしてkubernetesを起動します。

または、SNATをバイパスするネットワークプラグインソリューションを使用します。たとえば、阿里云の[terway](https://github.com/AliyunContainerService/terway)です。ただし、このプラグインは阿里云に深くバインドされており、各マシンに追加のエラスティックネットワークインターフェースを購入する必要があります。

### 次善の策

[dsでネームサーバーをデプロイ](https://github.com/kubernetes/enhancements/blob/master/keps/sig-network/0030-nodelocal-dns-cache.md)、すべてのノードのDNS解決はノード上のネームサーバーを通過し、最小限のSNAT + dnsキャッシュを通じてこのタイプの問題を緩和します。

### 疑似解決策（根本的な問題を解決できない）

デフォルトのpodの`/etc/resolv.conf`は通常次のようになります：

```
sh-4.2# cat /etc/resolv.conf
nameserver <kube-dns-vip>
search <namespace>.svc.cluster.local svc.cluster.local cluster.local localdomain
options ndots:5
```

この設定は、デフォルトのネームサーバーがkube-dns/core-dnsを指すことを意味します。すべてのクエリで、ドットの数が5未満の場合、searchで設定されたリストに従って検索します。結果が返されない場合、最後にドメイン名自体を直接クエリします。ndotsはn個のドット（dots）を意味します。

例：

```
sh-4.2# host -v baidu.com
Trying "baidu.com.<namespace>.svc.cluster.local"
Trying "baidu.com.svc.cluster.local"
Trying "baidu.com.cluster.local"
Trying "baidu.com.localdomain"
Trying "baidu.com"
......
```

#### alpineイメージを使用しない

#### [FQDN](https://baike.baidu.com/item/FQDN)を使用

ドメイン名は右から左にレベルごとに解決されるため、たとえば`google.com`は実際には`google.com.`で、comの後の.はルートドメインと呼ばれます。解決する際は、まず.を解決し、次に.comを解決します。.comはトップレベルドメインと呼ばれ、最後にgoogleを解決します。

FQDN（完全修飾ドメイン名）を使用：内部DNS（coreDNS、ノードDNSなど）の解決圧力を可能な限り最小限に抑えるためです。

#### ソケットを再開

```yaml
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c 
              - "/bin/echo 'options single-request-reopen' >> /etc/resolv.conf"
```

ソケットの再開を設定することは、コンテナ内の同時A、AAAAクエリを回避することです。


#### 2レベルドメインを直接上位解決に送る

[kubernetesがalpineベースのイメージを使用して外部DNSを正常に解決できない](https://www.sudops.com/kubernetes-alpine-image-resolve-ext-dns.html)を参照

`sed -i 's/options ndots:5/#options ndots:5/g' /etc/resolv.conf`を直接実行するとエラーになります。

alpineのechoコマンドは改行を飲み込み、resolv.confの形式が間違っているとDNS解決がエラーになります。

```yaml
  dnsConfig:
    options:
      - name: ndots
        value: "2"
      - name: single-request-reopen
```

`options ndots:5`を削除し、デフォルト値1に変更しました。この方法では、コンテナが<svc>に直接アクセスしても問題なく、searchリストを通過し、`<svc>.<namespace>.svc.cluster.local`にアクセスできます。

`Google.com`を解決する場合、実際には`Google.com.`を解決し、ドットの数が1を超えるため、searchリストを通過せず、直接上位DNSを使用します。

要約すると、ndotsを削除/ndotsを1に設定することで、頻繁なDNSクエリの可能性を減らします。外部IPの解決に「奇効」があります。

ただし、このホストが他のコンテナを実行する場合（これは冗談です。ノードが複数のコンテナを実行しない場合、kubernetesを使用する理由はありません）、他のコンテナも同時にリクエストするため、SNATの問題は依然として発生し、`/etc/resolv.conf`ファイルを変更しても根本的な問題を解決できません。


回避策1

```
          lifecycle:
            postStart:
              exec:
                command:
                - /bin/sh
                - -c 
                - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

回避策2

```
      initContainers:
      - name: alpine
        image: alpine
        command:
         - /bin/sh
         - -c 
         - "head -n 2 /etc/resolv.conf > /etc/temp.conf;cat /etc/temp.conf > /etc/resolv.conf;rm -rf /etc/temp.conf"
```

## 派生問題

### DNAT

コンテナがclusterIPにアクセスする場合（仮想IPであるため、DNATが必要）、このタイプのタイムアウト問題が発生する可能性があります。

### 同じnamespaceのsvcにアクセスする際に無理に追加しない

非ヘッドサービスの仮想ドメイン形式は`<svc>.<namespace>.svc.cluster.local`です

コンテナが`<svc>.<namespace>.svc.cluster.local`に直接アクセスする場合、デフォルトのDNS設定により、解決回数が実際には多くなります。正しい方法は`<svc>`にアクセスすることです。

例：testの下にsのsvcがあると仮定

```bash
host -v s 
# 1回解決
host -v s.test.svc.cluster.local
# 4回解決
```

したがって、同じnamespaceの他のsvcにアクセスする場合は、svc名を直接使用するだけで、`<svc>.<namespace>.svc.cluster.local`形式を使用して見せびらかす必要はありません。

## その他の知識

### DNSレコードタイプ

1. Aレコード：アドレスレコード。ドメイン名のIPv4アドレス（例：8.8.8.8）を指定するために使用されます。ドメイン名をIPアドレスにポイントする必要がある場合は、Aレコードを追加する必要があります。
1. CNAME：ドメイン名を別のドメイン名にポイントし、そのドメイン名がIPアドレスを提供する必要がある場合は、CNAMEレコードを追加する必要があります。
1. TXT：ここに何でも記入できます。長さ制限は255です。TXTレコードの大部分はSPFレコード（スパム対策）に使用されます。
1. NS：ネームサーバーレコード。サブドメインの解決を他のDNSサービスプロバイダーに委任する必要がある場合は、NSレコードを追加する必要があります。
1. AAAA：ホスト名（またはドメイン名）に対応するIPv6アドレス（例：ff06:0:0:0:0:0:0:c3）レコードを指定するために使用されます。
1. MX：メールを設定してメールを受信できるようにする必要がある場合は、MXレコードを追加する必要があります。
1. 明示的URL：あるアドレスから別のアドレスに301リダイレクトする必要がある場合は、明示的URLレコードを追加する必要があります（注：DNSPodは現在301リダイレクトのみをサポートしています）。
1. 暗黙的URL：明示的URLと同様ですが、違いは暗黙的URLがアドレスバーのドメイン名を変更しないことです。
1. SRV：どのコンピューターがどのサービスを提供するかを記録します。形式：サービス名、ドット、プロトコルタイプ、例：_xmpp-server._tcp。

### 使用されるコマンド

インストール方法：

```bash
  yum install -y bind-utils
  sudo apt-get install -y dnsutils
  apk add bind-tools
```

#### [dig](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/dig.htm)

  dig +trace +ndots=5 +search $host


#### [host](https://www.ibm.com/support/knowledgecenter/zh/ssw_aix_72/com.ibm.aix.cmds2/host.htm)

  host -v $host

## 参考リンク：

1. [iptablesでのDNAT、SNAT、MASQUERADEの理解](https://blog.csdn.net/wgwgnihao/article/details/68490985#)
1. [Linuxルートファイルシステム /etc/resolv.conf ファイルの詳細説明](https://blog.csdn.net/mybelief321/article/details/10049429#)
1. [kube-dns per node #45363](https://github.com/kubernetes/kubernetes/issues/45363)
1. [DNS間欠的な5秒の遅延 #56903](https://github.com/kubernetes/kubernetes/issues/56903)
1. [レーシーconntrackとDNSルックアップタイムアウト](https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts)
1. [/etc/resolv.conf](http://www.man7.org/linux/man-pages/man5/resolver.5.html)
1. [/etc/resolv.conf searchとndots設定](https://www.ichenfu.com/2018/10/09/resolv-conf-desc/)
1. [サービスとポッドのDNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
