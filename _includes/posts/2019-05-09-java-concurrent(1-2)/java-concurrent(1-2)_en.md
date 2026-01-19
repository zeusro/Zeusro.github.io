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

A simple interface for running new tasks.

ExecutorService extends the Executor interface. Adds some methods for managing executor lifecycle and task lifecycle.

You can use the `java.util.concurrent.Executors` class, which provides multiple simple static factory methods for instantiating threads, to create subclasses of ExecutorService (generally creating ThreadPoolExecutor/ScheduledExecutorService/ScheduledThreadPoolExecutor).

### ScheduledExecutorService

Inherits ExecutorService and Executor. Supports Future and periodic task execution.

### AbstractExecutorService




### ThreadPoolExecutor

Implements ExecutorService, so it can be used this way.

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

From the inheritance tree in the diagram above, we can see that ScheduledThreadPoolExecutor implements its features by inheriting the `ScheduledExecutorService` interface, adding an `awaitTermination` method.

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
