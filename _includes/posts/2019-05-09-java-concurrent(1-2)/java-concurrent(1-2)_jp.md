```
graph TB
e(Executor<V>)-->es(ExecutorService)
es-->se(ScheduledExecutorService)
es-->aes(AbstractExecutorService)
aes-->tpe(ThreadPoolExecutor)
tpe-->ste(ScheduledThreadPoolExecutor)
se-->ste
```

![image](/img/in-post/java-concurrent/Executor.png)


### ExecutorService

新しいタスクを実行するためのシンプルなインターフェース。

ExecutorServiceはExecutorインターフェースを拡張します。エグゼキューターのライフサイクルとタスクのライフサイクルを管理するためのいくつかのメソッドを追加します。

`java.util.concurrent.Executors`クラスを使用して、スレッドをインスタンス化するための複数の簡単な静的ファクトリメソッドを提供し、ExecutorServiceのサブクラス（通常はThreadPoolExecutor/ScheduledExecutorService/ScheduledThreadPoolExecutorを作成）を作成できます。

### ScheduledExecutorService

ExecutorServiceとExecutorを継承します。Futureと定期的なタスク実行をサポートします。

### AbstractExecutorService




### ThreadPoolExecutor

ExecutorServiceを実装しているため、このように使用できます。

```java
        //guava
        ThreadFactory factory = new ThreadFactoryBuilder().setNameFormat("ExecutorServiceExample-%d").build();
        ExecutorService executor = new ThreadPoolExecutor(1,
                200,
                0L,
                TimeUnit.DAYS,
                new LinkedBlockingDeque<Runnable>(1024),factory);
```


### ScheduledThreadPoolExecutor

上の図の継承ツリーから、ScheduledThreadPoolExecutorが`ScheduledExecutorService`インターフェースを継承することでその機能を実装し、`awaitTermination`メソッドを追加していることがわかります。

```java
        Runnable runnabledelayedTask = new Runnable() {
            @Override
            public void run() {
                System.out.println(Thread.currentThread().getName() + " is Running Delayed Task");
            }
        };


        Callable callabledelayedTask = new Callable() {

            @Override
            public String call() throws Exception {
                return "GoodBye! See you at another invocation...";
            }
        };
        ScheduledExecutorService scheduledPool = Executors.newScheduledThreadPool(4);
        scheduledPool.scheduleWithFixedDelay(runnabledelayedTask, 1, 1, TimeUnit.SECONDS);
        ScheduledFuture sf = scheduledPool.schedule(callabledelayedTask, 4, TimeUnit.SECONDS);
        String value = (String) sf.get();
        System.out.println("Callable returned" + value);
        scheduledPool.shutdown();
        System.out.println("Is ScheduledThreadPool shutting down? " + scheduledPool.isShutdown());
```
