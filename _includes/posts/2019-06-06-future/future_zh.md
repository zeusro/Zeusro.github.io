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

上图可以看出`Future<V>`地位超凡，基本上很多成员都是他"儿子"

Future<V>表示异步运算的结果

### ScheduledFuture<V>

代表了一种预期的任务，比如可以用`ScheduledFuture`配合ScheduledExecutorService来做一个周期性的重复作业(scheduleAtFixedRate)，延迟作业(scheduleWithFixedDelay)

### RunnableScheduledFuture<V>

这是个接口，得自己实现。

可用于一次性任务或者周期性任务。

这里可以参考他的子接口.ScheduledFuture的用法

### RunnableFuture

这是个接口，得自己实现。

### FutureTask

可用`Callable<V>`和`Runnable`初始化。`Callable<V>`带返回值。

可配合ExecutorService实现多线程任务分发

### CompletableFuture<T>

可以用来创建链式服务(1启动多任务)


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
            //把上个任务的结果传递到子任务中
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
        //通过这个信号,持续等待子线程运行完毕
        while (i != 8) {
            Thread.sleep(500);
            out.println("继续等待");
        }
//        future.join();
//        CompletableFuture.allOf(future).join();
    }
```

### CountedCompleter<T>

CountedCompleter:任务可能产生结果，也可能不产生结果。

CountedCompleter 在任务完成执行后会触发执行一个自定义的钩子函数。


### RecursiveAction

跟CountedCompleter<T>一样继承于 `ForkJoinTask<V>`，但是`RecursiveAction`不产生结果。

### RecursiveTask<V>

RecursiveTask类的实例表示产生结果的任务。

特点在于可递归执行。

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

参考链接:

1. [JUC源码分析-线程池篇（五）：ForkJoinPool - 2](https://www.jianshu.com/p/6a14d0b54b8d)