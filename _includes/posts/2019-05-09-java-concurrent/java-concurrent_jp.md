`java.util.concurrent`パッケージには、さまざまなスレッド関連のコレクション、クラス、インターフェースが定義されています。層を剥がした後、「私の祖先のjavaパッケージをあなたに渡す」というフレーズをより深く理解しました。この継承ツリーは非常に苦痛に見えます。

しかし、最終的には、それを分解し、整理して、この記事をまとめました。


書きながら途中で諦めようと思いましたが、[このサイト](https://examples.javacodegeeks.com/category/core-java/util/concurrent/)が多くの例を提供しているためです。

## ナビゲーション

1. [おそらく最も完全なjavaスレッドガイド(1-1)[タスクスケジューリングクラス_Callable系]](/2019/05/09/java-concurrent(1-1)/)
1. [おそらく最も完全なjavaスレッドガイド(1-2)[タスクスケジューリングクラス_Executor系]](/2019/05/09/java-concurrent(1-2)/)
1. [おそらく最も完全なjavaスレッドガイド(1-3)[タスクスケジューリングクラス_CompletionService系]](/2019/05/10/java-concurrent(1-3)/)
1. []()
1. []()


## 紹介されていないが比較的重要なメンバー

### RejectedExecutionHandler

ThreadPoolExecutorはこのインターフェースを実装します。

失敗再試行のイベントメカニズムを提供します。[ここ](https://examples.javacodegeeks.com/core-java/util/concurrent/rejectedexecutionhandler/java-util-concurrent-rejectedexecutionhandler-example/)を参照してください。



### ThreadFactory

これは通常、GuavaのThreadFactoryBuilderを使用して作成され、自分で実装することはほとんどありません。

### 例外

```java

BrokenBarrierException	

CancellationException	

CompletionException	

ExecutionException	

RejectedExecutionException	

TimeoutException

```


## 参考リンク：
1. [40のJavaマルチスレッド問題のまとめ](http://www.importnew.com/18459.html#comment-651217)
2. [[翻訳][Java]ExecutorServiceの正しいシャットダウン方法](https://blog.csdn.net/zaozi/article/details/38854561)
3. [Java並行プログラミング：CountDownLatch、CyclicBarrier、Semaphore](https://www.cnblogs.com/dolphin0520/p/3920397.html)
4. [Java並行チュートリアル（Oracle公式資料）](http://www.iteye.com/magazines/131-Java-Concurrency)
5. [Javaでwait、notify、notifyAllを正しく使用する方法 – プロデューサーコンシューマーモデルを例として](http://www.importnew.com/16453.html)
6. [レッスン：並行性](https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html)
7. [パッケージ java.util.concurrent](https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/package-summary.html)
8. [Java並行プログラミング：Callable、Future、FutureTask](https://www.cnblogs.com/dolphin0520/p/3949310.html)
