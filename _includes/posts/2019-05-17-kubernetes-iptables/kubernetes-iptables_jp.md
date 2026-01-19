![img](/img/in-post/kubernetes-iptables/Kube-proxy NAT分析.png)

## 基本

3つのプロトコル：TCP、UDP、ICMP

4つの状態：NEW、ESTABLISHED、INVALID、RELATED

4つのテーブル

1. raw：高度な機能、例：URLフィルタリング。
1. mangle：パケット変更（QOS）、サービス品質の実装に使用。
1. net：アドレス変換、ゲートウェイルーターに使用。
1. filter：パケットフィルタリング、ファイアウォールルールに使用。

5つのチェーン

1. PREROUTINGチェーン：宛先アドレス変換（DNAT）に使用。
1. INPUTチェーン：入力パケットを処理。
1. FORWARDチェーン：転送パケットを処理。
2. OUTPUTチェーン：出力パケットを処理。
1. POSTROUTINGチェーン：ソースアドレス変換（SNAT）に使用。

## よく使う方法

```bash
iptables -t filter -nL
iptables -t nat -nL
iptables -t raw -nL
iptables -t mangle -nL
```


## iptablesでkubernetes svcトラフィックリンクを分析

> ノードのiptablesはkube-proxyによって生成されます。具体的な実装については、[kube-proxyのコード](https://github.com/kubernetes/kubernetes/blob/master/pkg/proxy/iptables/proxier.go)を参照してください。
> 
> kube-proxyはfilterテーブルとnatテーブルのみを変更します。iptablesチェーンを拡張し、KUBE-SERVICES、KUBE-NODEPORTS、KUBE-POSTROUTING、KUBE-MARK-MASQ、KUBE-MARK-DROPの5つのチェーンをカスタマイズし、主にKUBE-SERVICESチェーン（PREROUTINGとOUTPUTに付着）にルールを追加してトラフィックルーティングルールを設定します。

### クラスター情報

Pod CIDR：172.31.0.0/16

阿里云kubernetes v1.12.6-aliyun.1

*.aliyuncs.com/acs/flannel:v0.8.0

SLBプライベートIP：172.6.6.6（実際にはEIPにもバインドされています）

### あるsvcを例として

default名前空間のtestsvcを例として使用

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

# すべてのサービスがこのチェーンにあり、非常に長い
Chain KUBE-SERVICES (2 references)
target                     prot opt source               destination
KUBE-MARK-MASQ             tcp  -- !172.31.0.0/16        172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
KUBE-SVC-M42ZCW2EYUCRBVAF  tcp  --  0.0.0.0/0            172.30.5.207         /* default/testsvc: cluster IP */ tcp dpt:443
......
KUBE-FW-M42ZCW2EYUCRBVAF   tcp  --  0.0.0.0/0            172.6.6.6            /* default/testsvc: loadbalancer IP */ tcp dpt:443

# 通過するパケットにタグを付ける
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
# 172.31.9.52はpod仮想IP
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

グラフィカル：

![image](/img/in-post/kubernetes-iptables/chain.png)

```
graph TB
a(内部トラフィック/PREROUTING)-->c(KUBE-SERVICES)
b(外部トラフィック/OUTPUT)-->c
c-->d(KUBE-MARK-MASQ)
d-->|destination:172.30.5.207|e(KUBE-SVC-M42ZCW2EYUCRBVAF)
e-->|destination:172.30.5.207|p1(KUBE-SEP-EA7TYKWK2S6G4PQR)
e-->|destination:172.30.5.207|p2(KUBE-SEP-ZJI36FVTROQF5MX7)
p1-->|destination:<podIP1>|f(KUBE-FW-M42ZCW2EYUCRBVAF)
p2-->|destination:<podIP2>|f
f-->g(KUBE-XLB-M42ZCW2EYUCRBVAF)
g-->|loadbalancerのIPがノードでインターセプトされた後、サービスに転送|h(KUBE-SVC-M42ZCW2EYUCRBVAF)
```

### iptablesのいくつかのテクニック

#### podの確率が増加する理由

最初の1/3の確率：一致した場合、1/3にヒットしたことを意味します。一致しない場合、残りの2/3が次の行に進みます。

2番目の1/2の確率：一致した場合、2/3 * 1/2 = 1/3にヒットしたことを意味します。一致しない場合、1/2が次の行に進みます。

3番目の確率1：一致した場合、2/3 * 1/2 * 1 = 1/3です

#### 最後のチェーンKUBE-SEP-BVMKBOC4GGNJ3567に確率がない理由

順次マッチング、残りを取るため、重みを計算する必要がなくなりました。

#### destination 0.0.0.0/0の意味

リンク全体を注意深く観察してください。`KUBE-SEP-XXX`ステップに到達した時点で、すでにpodの仮想IPを取得しています。したがって、これを除いて、他のチェーンの宛先は変更されず、変更する必要がなくなりました。


## 結論

1. kubernetes 0.8バージョンのflannelはiptablesの大規模な応用です。
1. この長くて臭いKUBE-SERVICESチェーンチェーンは、サービスマッチングがO(n)であることを決定します。svcが増加すると、追加/削除/変更/クエリがますます遅くなります。
1. svc数が1000を超えると、ラグがかなり明らかになります。
2. kube-proxyはIPVSモードに基づくべきで、iptablesを使用すると同じ過ちを繰り返すだけです。
3. svcIPは中継仮想IPです。


## 参考リンク

1. [Kubernetes 1.10から1.11へのアップグレード記録（続き）：Kubernetes kube-proxyがIPVSモードを有効化](https://blog.frognew.com/2018/10/kubernetes-kube-proxy-enable-ipvs.htm)
2. [kubernetesでipvsを有効にする方法](https://juejin.im/entry/5b7e409ce51d4538b35c03df)
3. [大規模K8Sシナリオでの华为云のサービスパフォーマンス最適化実践](https://zhuanlan.zhihu.com/p/37230013)
4. [kubernetesネットワークパケットフロー](https://zhuanlan.zhihu.com/p/28289080)
5. [kube-proxy ipvsモードの解釈](https://segmentfault.com/a/1190000016333317)
6. [kube-proxyモード比較：iptablesかIPVSか？](https://www.jishuwen.com/d/2K3c)
1. [iptablesルールを編集する方法](https://fedoraproject.org/wiki/How_to_edit_iptables_rules)
2. [iptables & ipvsの簡単な紹介](http://www.voidcn.com/article/p-uttldwvk-pz.html)
3. [iptables関連](https://www.zsythink.net/archives/category/%E8%BF%90%E7%BB%B4%E7%9B%B8%E5%85%B3/iptables/)
4. [kubernetes環境でのiptablesの理解](https://www.cnblogs.com/charlieroro/p/9588019.html)
