---
layout:       post
title:        "可能是最全的java线程指南(1-2)[任务调度类_Executor系]"
subtitle:     ""
date:         2019-05-09
author:       "Zeusro"
header-img:   "/img/b/2019/Silver-Days.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Java
---


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

一个运行新任务的简单接口。

ExecutorService，扩展了Executor接口。添加了一些用来管理执行器生命周期和任务生命周期的方法。

可以通过`java.util.concurrent.Executors`类,提供了多个实例化线程的简易静态工厂方法,来创造ExecutorService的子类(一般是创建ThreadPoolExecutor/ScheduledExecutorService/ScheduledThreadPoolExecutor)

### ScheduledExecutorService

继承了ExecutorService和Executor。支持Future和定期执行任务。

### AbstractExecutorService




### ThreadPoolExecutor

实现了ExecutorService,所以才能够这么玩

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

从上图的继承树就可以看出,ScheduledThreadPoolExecutor通过继承`ScheduledExecutorService`接口实现了其特性,多出了一个`awaitTermination`方法

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