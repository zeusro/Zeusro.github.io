```
graph TB
g(Comparable<Delayed>)-->A
A(Delayed)-->C(ScheduledFuture<V>)
D(Runnable)-->e(RunnableFuture<V>)
F(Future<V>)-->e(RunnableFuture<V>)
F-->C
e-->B(RunnableScheduledFuture<V>)
C-->B
cs(CompletionStage<T>)-->cf(CompletableFuture<T>)
F-->cf
F-->cc(CountedCompleter<T>)
e-->ft(FutureTask)
F-->fjt(ForkJoinTask<V>)
fjt-->cct(CountedCompleter<T>)
fjt-->rsa(RecursiveAction)
fjt-->rtt(RecursiveTask<V>)
```

![img](/img/in-post/future/future.png)

### Future<V>

上の図から、`Future<V>`が並外れた地位を持っていることがわかります。基本的に多くのメンバーがその「子」です。

Future<V>は非同期計算の結果を表します。

### ScheduledFuture<V>

予定されたタスクを表します。たとえば、`ScheduledFuture`をScheduledExecutorServiceと組み合わせて、周期的な繰り返し作業（scheduleAtFixedRate）、遅延作業（scheduleWithFixedDelay）を行うことができます。

### RunnableScheduledFuture<V>

これはインターフェースで、自分で実装する必要があります。

1回限りのタスクまたは周期的なタスクに使用できます。

ここでそのサブインターフェースを参照できます。ScheduledFutureの用法。

### RunnableFuture

これはインターフェースで、自分で実装する必要があります。

### FutureTask

`Callable<V>`と`Runnable`で初期化できます。`Callable<V>`には戻り値があります。

ExecutorServiceと組み合わせて、マルチスレッドタスク分散を実装できます。

### CompletableFuture<T>

チェーンサービス（1が複数のタスクを開始）を作成するために使用できます。


```java
int i = 1;

    public void run() throws InterruptedException, ExecutionException {

        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
            } catch (InterruptedException e) {
                throw new IllegalStateException(e);
            }
            i = i << 1;
            return "end 1";
        });

        future.thenApply((s) -> {
            // 前のタスクの結果を子タスクに渡す
            out.println(s);
            out.println("end 2");
            i = i << 1;
            return "hhh";
        });
        future.thenRun(() -> {
            try {
                Thread.sleep(1000);
                i = i << 1;
            } catch (InterruptedException e) {

            }
            out.println("CompletableFutureExample end");
        });
        // この信号を通じて、子スレッドの実行完了を継続的に待機
        while (i != 8) {
            Thread.sleep(500);
            out.println("継続的に待機");
        }
//        future.join();
//        CompletableFuture.allOf(future).join();
    }
```

### CountedCompleter<T>

CountedCompleter：タスクは結果を生成する場合と生成しない場合があります。

CountedCompleterは、タスクの実行完了後にカスタムフック関数の実行をトリガーします。


### RecursiveAction

CountedCompleter<T>と同様に、`ForkJoinTask<V>`から継承しますが、`RecursiveAction`は結果を生成しません。

### RecursiveTask<V>

RecursiveTaskクラスのインスタンスは、結果を生成するタスクを表します。

特徴は、再帰的に実行できることです。

```
public class RecursiveTaskExample extends RecursiveTask<Integer> {
    final int n;

    RecursiveTaskExample(int n) {
        this.n = n;
    }

    /**
     * The main computation performed by this task.
     *
     * @return the result of the computation
     */
    @Override
    protected Integer compute() {
        if (n <= 1) {
            return n;
        }
        RecursiveTaskExample f1 = new RecursiveTaskExample(n - 1);
        f1.fork();
        RecursiveTaskExample f2 = new RecursiveTaskExample(n - 2);
        return f2.compute() + f1.join();
    }
}
```

参考リンク：

1. [JUCソースコード分析-スレッドプール編（五）：ForkJoinPool - 2](https://www.jianshu.com/p/6a14d0b54b8d)
