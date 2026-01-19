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

From the diagram above, we can see that `Future<V>` has an extraordinary status, basically many members are its "children".

Future<V> represents the result of an asynchronous computation.

### ScheduledFuture<V>

Represents a scheduled task. For example, `ScheduledFuture` can be used with ScheduledExecutorService to do periodic repeated jobs (scheduleAtFixedRate), delayed jobs (scheduleWithFixedDelay).

### RunnableScheduledFuture<V>

This is an interface, you need to implement it yourself.

Can be used for one-time tasks or periodic tasks.

You can refer to its sub-interface here. Usage of ScheduledFuture.

### RunnableFuture

This is an interface, you need to implement it yourself.

### FutureTask

Can be initialized with `Callable<V>` and `Runnable`. `Callable<V>` has a return value.

Can be used with ExecutorService to implement multi-threaded task distribution.

### CompletableFuture<T>

Can be used to create chained services (1 starts multiple tasks).


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
            // Pass the result of the previous task to the child task
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
        // Through this signal, continuously wait for child threads to finish running
        while (i != 8) {
            Thread.sleep(500);
            out.println("Continue waiting");
        }
//        future.join();
//        CompletableFuture.allOf(future).join();
    }
```

### CountedCompleter<T>

CountedCompleter: Tasks may produce results, or may not produce results.

CountedCompleter will trigger execution of a custom hook function after the task completes execution.


### RecursiveAction

Like CountedCompleter<T>, it inherits from `ForkJoinTask<V>`, but `RecursiveAction` does not produce results.

### RecursiveTask<V>

Instances of the RecursiveTask class represent tasks that produce results.

The characteristic is that it can be executed recursively.

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

Reference links:

1. [JUC Source Code Analysis - Thread Pool Part (Five): ForkJoinPool - 2](https://www.jianshu.com/p/6a14d0b54b8d)
