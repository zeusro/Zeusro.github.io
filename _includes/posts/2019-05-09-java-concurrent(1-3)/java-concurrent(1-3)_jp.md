```
graph TB
A(CompletionService<V>)-->B(ExecutorCompletionService)
```

![image](/img/in-post/java-concurrent/CompletionService.png)

### CompletionService<V>

このインターフェースを自分で実装できます。これはタスクキューです。

キュー要素を取得するpollメソッドとtakeメソッド。

takeはキューに結果が現れるまでブロックします。

pollは、キューにすでに結果があることを前提に使用する必要があります。そうでない場合、軽率に使用するとnullポインターが発生します。長時間のブロックを避けるために、タイムアウト待機時間を指定できます。


### ExecutorCompletionService

一般的に`CompletionService<V>`を宣言し、ExecutorCompletionServiceをインスタンス化します。

```java
    int TOTAL_TASK = 2;

    public void run() throws InterruptedException, ExecutionException {
        // スレッドプールを作成
        ExecutorService pool = Executors.newFixedThreadPool(TOTAL_TASK);
        CompletionService<Integer> cService = new ExecutorCompletionService<>(pool);

        // タスクを投入
        for (int i = 0; i < TOTAL_TASK; i++) {
            cService.submit(new CallableExample());
            //このオーバーロードされたsubmit(Runnable task, V result)メソッドは、結果を自分で渡します
        }
        // スレッドプールタスクの実行結果を確認
        for (int i = 0; i < TOTAL_TASK; i++) {
            Future<Integer> future = cService.take();
            System.out.println("method:" + future.get());
        }
        // スレッドプールをシャットダウン
        pool.shutdown();
    }
```    


[その他の例](https://examples.javacodegeeks.com/core-java/util/concurrent/completionservice/java-completionservice-example/)
