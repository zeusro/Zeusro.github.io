## 一般的なガベージコレクタ

### ParNewコレクタ

-XX:ParallelGCThreads
ガベージコレクションのスレッド数を制限します
 
### Parallel Scavengeコレクタ
 
最大ガベージコレクション一時停止時間
-XX:MaxGCPauseMillis
スループットサイズ
-XX:GCTimeRatio
 
最大ガベージコレクション一時停止時間を下げることは、スループットと新世代スペースを犠牲にして、ガベージコレクションをより頻繁にします
 
初心者向け操作：
-XX:UseAdaptiveSizePolicy
GC適応調整戦略
 
### CMSコレクタ

最短回収一時停止時間を目標とするコレクタで、「マーク-スイープ」に基づいて実装されています。
核心的な利点：並行収集、低一時停止
 

* Alibaba Cloud監視のケース

```
/acs/user/monitoragent/jre/bin/java -server 
-Xmx128m 
-Xms128m 
-Xmn70m 
-XX:SurvivorRatio=10 
-XX:PermSize=25m 
-XX:MaxPermSize=30m 
-XX:+DisableExplicitGC 
-XX:+UseConcMarkSweepGC 
-XX:+CMSParallelRemarkEnabled 
-XX:+UseCMSCompactAtFullCollection 
-XX:+CMSClassUnloadingEnabled 
-XX:LargePageSizeInBytes=128m 
-XX:+UseFastAccessorMethods 
-XX:+UseCMSInitiatingOccupancyOnly 
-XX:CMSInitiatingOccupancyFraction=70 
-XX:+UseParNewGC 
-verbose:gc 
-Xloggc:/acs/monitor/system/monitoragent/logs/gc.log 
-XX:+PrintGCDetails 
-XX:+PrintGCDateStamps 
-Duser.timezone=GMT+8 
-Djava.endorsed.dirs= 
-classpath /acs/user/monitoragent/lib:/acs/user/monitoragent/lib/aliyun-openservices-sls-v0.3-inner-0.1.0.jar:/acs/user/monitoragent/lib/aliyun-openservices-with-mqs.1.0.12.jar:/acs/user/monitoragent/lib/commons-beanutils-1.8.3.jar:/acs/user/monitoragent/lib/commons-codec-1.4.jar:/acs/user/monitoragent/lib/commons-collections-3.2.1.jar:/acs/user/monitoragent/lib/commons-digester-1.8.jar:/acs/user/monitoragent/lib/commons-httpclient-3.1.jar:/acs/user/monitoragent/lib/commons-lang-2.6.jar:/acs/user/monitoragent/lib/commons-lang3-3.1.jar:/acs/user/monitoragent/lib/commons-logging-1.0.4.jar:/acs/user/monitoragent/lib/commons-validator-1.4.0.jar:/acs/user/monitoragent/lib/diamond-client-3.6.7.jar:/acs/user/monitoragent/lib/diamond-utils-3.1.3.jar:/acs/user/monitoragent/lib/ezmorph-1.0.6.jar:/acs/user/monitoragent/lib/fastjson-1.2.41.jar:/acs/user/monitoragent/lib/hamcrest-core-1.1.jar:/acs/user/monitoragent/lib/httpclient-4.2.1.jar:/acs/user/monitoragent/lib/httpcore-4.2.1.jar:/acs/user/monitoragent/lib/jackson-core-lgpl-1.9.6.jar:/acs/user/monitoragent/lib/jackson-mapper-lgpl-1.9.6.jar:/acs/user/monitoragent/lib/jdom-1.1.jar:/acs/user/monitoragent/lib/json-lib-2.4-jdk15.jar:/acs/user/monitoragent/lib/junit-4.10.jar:/acs/user/monitoragent/lib/log4j-1.2.17.jar:/acs/user/monitoragent/lib/mysql-connector-java-5.1.25.jar:/acs/user/monitoragent/lib/netty-all-4.0.36.Final.jar:/acs/user/monitoragent/lib/nginx.agent.jar:/acs/user/monitoragent/lib/ons-api-1.1.5.jar:/acs/user/monitoragent/lib/ons-client-1.1.5.jar:/acs/user/monitoragent/lib/protobuf-java-2.4.1.jar:/acs/user/monitoragent/lib/rocketmq-client-3.6.4.jar:/acs/user/monitoragent/lib/rocketmq-common-3.6.4.jar:/acs/user/monitoragent/lib/rocketmq-remoting-3.6.4.jar:/acs/user/monitoragent/lib/slf4j-api-1.7.5.jar:/acs/user/monitoragent/lib/slf4j-log4j12-1.7.5.jar:/acs/user/monitoragent/lib/test.junit-4.8.1.jar:/acs/user/monitoragent/lib/test.junit.hamcrest-1.1.jar: -Dagent.home=/acs/user/monitoragent com.alibaba.ace.nginx.agent.Startup /acs/user/monitoragent/conf
``` 

### G1コレクタ

https://t.hao0.me/jvm/2017/01/15/jvm-g1.html

### ConcMarkSweepGC

推奨されるパラメータは-Xmnです。このパラメータは非常に簡潔で、NewSizeとMaxNewSizeを一度に設定するのと同等で、両者は等しいです。-Xmnは-Xmsヒープ開始サイズと-Xmxヒープ最大サイズと組み合わせて、ヒープメモリレイアウトを正確に決定します（設計者も簡潔さのために3つの短縮パラメータを作ったと推定されます）。また、公式文書では-Xmnは1.4からサポートされているようですが、現在は1.4より前のJREを使用している人はいないはずです。
 
* 使用例

```bash
java -jar 
-Xms10g 
-Xmx15g 
-XX:+UseConcMarkSweepGC 
-XX:NewSize=6g 
-XX:MaxNewSize=6g 
-verbose:gc 
-XX:+PrintGCDetails 
-XX:+PrintGCTimeStamps  
-Xloggc:./log/gc.log Slaver.jar
```

## jvm分析ツール

### jstat
> jstatの利点は、jvmに組み込まれており、使用が簡単で直接的なことです


    jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
    pid=1
    jstat -gc $pid 3000 3000

```
–class クラスのロード、アンロード数、総スペース、クラスのロードに費やされた時間を監視
–gc Javaヒープの状態を監視。Edenエリア、2つのSurvivorエリア、老世代、永続世代などの容量を含む
–gccapacity 監視内容は-gcとほぼ同じですが、出力は主にJavaヒープの各領域で使用される最大および最小スペースに焦点を当てています
–gcutil 監視内容は-gcとほぼ同じですが、出力は主に使用済みスペースが総スペースに占める割合に焦点を当てています
–gccause -gcutilと同じ機能ですが、最後のGCの原因を追加で出力します
–gcnew 新世代GCの状態を監視
–gcnewcapacity 監視内容は-gcnewとほぼ同じですが、出力は主に使用される最大および最小スペースに焦点を当てています
–gcold 老世代GCの状態を監視
–gcoldcapacity 監視内容は——gcoldとほぼ同じですが、出力は主に使用される最大および最小スペースに焦点を当てています
–gcpermcapacity 永続世代で使用される最大および最小スペースを出力
–compiler JITコンパイラによってコンパイルされたメソッド、時間消費などの情報を出力
–printcompilation JITコンパイルされたメソッドを出力
```

1. jstat –class<pid>：ロードされたクラスの数、占有スペースなどの情報を表示します。
```
Loaded ロードされたクラスの数
Bytes ロードされたクラスが占有するバイト数
Unloaded アンロードされたクラスの数
Bytes アンロードされたクラスのバイト数
Time クラスのロードとアンロードに費やされた時間
```

2. jstat -compiler <pid> VMリアルタイムコンパイルの数などの情報を表示します。
```
Compiled コンパイルタスクの実行数
Failed コンパイルタスクの実行失敗数
Invalid コンパイルタスクの実行無効化数
Time コンパイルタスクの消費時間
FailedType 最後に失敗したコンパイルタスクのタイプ
FailedMethod 最後に失敗したコンパイルタスクが存在するクラスとメソッド
```

3. jstat -gc <pid>：GC情報を表示し、GCの回数と時間を確認できます。
```
S0C 若世代の最初のsurvivor（サバイバーエリア）の容量（バイト）
S1C 若世代の2番目のsurvivor（サバイバーエリア）の容量（バイト）
S0U 若世代の最初のsurvivor（サバイバーエリア）の現在使用スペース（バイト）
S1U 若世代の2番目のsurvivor（サバイバーエリア）の現在使用スペース（バイト）
EC 若世代のEden（エデンの園）の容量（バイト）
EU 若世代のEden（エデンの園）の現在使用スペース（バイト）
OC Old世代の容量（バイト）
OU Old世代の現在使用スペース（バイト）
PC Perm（永続世代）の容量（バイト）
PU Perm（永続世代）の現在使用スペース（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
YGCT アプリケーション起動からサンプリング時までの若世代のGCに費やされた時間（秒）
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
FGCT アプリケーション起動からサンプリング時までのold世代（フルGC）のGCに費やされた時間（秒）
GCT アプリケーション起動からサンプリング時までのGCに費やされた総時間（秒）
```

4. jstat -gccapacity <pid>：VMメモリ内の3世代（young、old、perm）オブジェクトの使用と占有サイズを表示できます
```
NGCMN 若世代（young）の初期化（最小）サイズ（バイト）
NGCMX 若世代（young）の最大容量（バイト）
NGC 若世代（young）の現在の容量（バイト）
S0C 若世代の最初のsurvivor（サバイバーエリア）の容量（バイト）
S1C 若世代の2番目のsurvivor（サバイバーエリア）の容量（バイト）
EC 若世代のEden（エデンの園）の容量（バイト）
OGCMN old世代の初期化（最小）サイズ（バイト）
OGCMX old世代の最大容量（バイト）
OGC old世代の現在新しく生成された容量（バイト）
OC Old世代の容量（バイト）
PGCMN perm世代の初期化（最小）サイズ（バイト）
PGCMX perm世代の最大容量（バイト）
PGC perm世代の現在新しく生成された容量（バイト）
PC Perm（永続世代）の容量（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
```

5. jstat -gcutil <pid>：GC情報を統計します
```
S0 若世代の最初のsurvivor（サバイバーエリア）の使用済みが現在の容量に対する割合
S1 若世代の2番目のsurvivor（サバイバーエリア）の使用済みが現在の容量に対する割合
E 若世代のEden（エデンの園）の使用済みが現在の容量に対する割合
O old世代の使用済みが現在の容量に対する割合
P perm世代の使用済みが現在の容量に対する割合
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
YGCT アプリケーション起動からサンプリング時までの若世代のGCに費やされた時間（秒）
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
FGCT アプリケーション起動からサンプリング時までのold世代（フルGC）のGCに費やされた時間（秒）
GCT アプリケーション起動からサンプリング時までのGCに費やされた総時間（秒）
```

6. jstat -gcnew <pid>：若世代オブジェクトの情報。

```
S0C 若世代の最初のsurvivor（サバイバーエリア）の容量（バイト）
S1C 若世代の2番目のsurvivor（サバイバーエリア）の容量（バイト）
S0U 若世代の最初のsurvivor（サバイバーエリア）の現在使用スペース（バイト）
S1U 若世代の2番目のsurvivor（サバイバーエリア）の現在使用スペース（バイト）
TT 保持回数制限
MTT 最大保持回数制限
EC 若世代のEden（エデンの園）の容量（バイト）
EU 若世代のEden（エデンの園）の現在使用スペース（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
YGCT アプリケーション起動からサンプリング時までの若世代のGCに費やされた時間（秒）
```

7. jstat -gcnewcapacity<pid>：若世代オブジェクトの情報とその使用量。

```
NGCMN 若世代（young）の初期化（最小）サイズ（バイト）
NGCMX 若世代（young）の最大容量（バイト）
NGC 若世代（young）の現在の容量（バイト）
S0CMX 若世代の最初のsurvivor（サバイバーエリア）の最大容量（バイト）
S0C 若世代の最初のsurvivor（サバイバーエリア）の容量（バイト）
S1CMX 若世代の2番目のsurvivor（サバイバーエリア）の最大容量（バイト）
S1C 若世代の2番目のsurvivor（サバイバーエリア）の容量（バイト）
ECMX 若世代のEden（エデンの園）の最大容量（バイト）
EC 若世代のEden（エデンの園）の容量（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
```
8. jstat -gcold <pid>：old世代オブジェクトの情報。
```
PC Perm（永続世代）の容量（バイト）
PU Perm（永続世代）の現在使用スペース（バイト）
OC Old世代の容量（バイト）
OU Old世代の現在使用スペース（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
FGCT アプリケーション起動からサンプリング時までのold世代（フルGC）のGCに費やされた時間（秒）
GCT アプリケーション起動からサンプリング時までのGCに費やされた総時間（秒）
```
9. stat -gcoldcapacity <pid>：old世代オブジェクトの情報とその使用量。
```
OGCMN old世代の初期化（最小）サイズ（バイト）
OGCMX old世代の最大容量（バイト）
OGC old世代の現在新しく生成された容量（バイト）
OC Old世代の容量（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
FGCT アプリケーション起動からサンプリング時までのold世代（フルGC）のGCに費やされた時間（秒）
GCT アプリケーション起動からサンプリング時までのGCに費やされた総時間（秒）
```
10. jstat -gcpermcapacity<pid>：permオブジェクトの情報とその使用量。
```
PGCMN perm世代の初期化（最小）サイズ（バイト）
PGCMX perm世代の最大容量（バイト）
PGC perm世代の現在新しく生成された容量（バイト）
PC Perm（永続世代）の容量（バイト）
YGC アプリケーション起動からサンプリング時までの若世代のGC回数
FGC アプリケーション起動からサンプリング時までのold世代（フルGC）のGC回数
FGCT アプリケーション起動からサンプリング時までのold世代（フルGC）のGCに費やされた時間（秒）
GCT アプリケーション起動からサンプリング時までのGCに費やされた総時間（秒）
```
11. jstat -printcompilation <pid>：現在のVM実行情報。
```
Compiled コンパイルタスクの数
Size メソッドによって生成されたバイトコードのサイズ
Type コンパイルタイプ
Method コンパイルされたメソッドを識別するために使用されるクラス名とメソッド名。クラス名は/を名前空間区切り文字として使用します。メソッド名は指定されたクラス内のメソッドです。上記の形式は-XX:+PrintComplationオプションによって設定されます
```

### MemoryAnalyzer

## 参考リンク
1. [JVMチューニング：適切なGCコレクタを選択（三）](https://blog.csdn.net/historyasamirror/article/details/6245157)
1. [Java G1ガベージコレクタの深い理解](http://ghoulich.xninja.org/tag/g1/)
1. [JavaGCエキスパートになる（1）—Javaガベージ回収メカニズムの深い理解](http://www.importnew.com/1993.html)
1. [JavaGCエキスパートになる（2）—Javaガベージ回収メカニズムを監視する方法](http://www.importnew.com/2057.html)
1. [Java GCエキスパートになる（3）—Javaガベージ回収メカニズムを最適化する方法](http://www.importnew.com/3146.html)
1. [Java GCエキスパートになる（4）—ApacheのMaxClientsパラメータの詳細説明とTomcatのFullGC実行への影響](http://www.importnew.com/3151.html)
1. [JVMシリーズ三：JVMパラメータ設定、分析](http://www.cnblogs.com/redcreen/archive/2011/05/04/2037057.html)
1. [Java GCの種類を紹介し、GCを交換・チューニング](https://blog.csdn.net/roland101/article/details/2203461)
1. [Javaガベージ回収メカニズム（およびGC呼び出しを減らし、パフォーマンスを向上させる方法）](https://blog.csdn.net/hyqsong/article/details/42006947)
1. [What Is Garbage Collection?](https://plumbr.io/handbook/what-is-garbage-collection)
1. [頻繁なGC（Allocation Failure）およびyoung gc時間が長すぎる分析](https://juejin.im/post/5a9b811a6fb9a028e46e1c88)
1. [JVMシリーズ三：JVMパラメータ設定、分析](http://www.cnblogs.com/redcreen/archive/2011/05/04/2037057.html)
1. [javaGCチューニング](http://darktea.github.io/notes/2013/09/08/java-gc.html)
1. [Java Hotspot G1 GCのいくつかの主要技術](https://tech.meituan.com/g1.html)
1. [JVM](https://crowhawk.github.io/tags/#JVM)
1. [JVM（java仮想マシン）メモリ設定](https://www.cnblogs.com/jack204/archive/2012/07/02/2572932.html)
1. [java jstatの使い方](https://www.pocketdigi.com/20170522/1573.html)
1. [jstatコマンドの詳細説明](https://blog.csdn.net/zhaozheng7758/article/details/8623549)
1. [jstat使用の詳細説明（JVMの使用状況を分析）](https://blog.csdn.net/ouyang111222/article/details/53688986)
1. [javaクラスのロードメカニズム](http://www.cnblogs.com/ityouknow/p/5603287.html)
1. [G1(Garbage First)の使用](http://bboniao.com/jvm/2014-03/g1garbage-first.html)
1. [Javaコマンド学習シリーズ（4）：Jstat](http://www.importnew.com/18202.html)
1. [JVM問題分析処理マニュアル](https://yq.aliyun.com/articles/632125)
1. [JVMチューニングのまとめ -Xms -Xmx -Xmn -Xss](https://yq.aliyun.com/articles/268842)
