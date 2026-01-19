<!-- TODO: Translate to jp -->

`java.util.concurrent`这个包里面定义了各种线程相关的集合和类,接口.抽丝剥茧之后,我对那句"把我祖传的java包传给你"有了更深的理解.这个继承树看起来非常蛋疼.
不过最后我还是剥离分解,整理得出此文.


写到一半本来想放弃来着,因为[这个网站](https://examples.javacodegeeks.com/category/core-java/util/concurrent/)提供了大量例子

## 导航

1. [可能是最全的java线程指南(1-1)[任务调度类_Callable系]](/2019/05/09/java-concurrent(1-1)/)
1. [可能是最全的java线程指南(1-2)[任务调度类_Executor系]](/2019/05/09/java-concurrent(1-2)/)
1. [可能是最全的java线程指南(1-3)[任务调度类_CompletionService系]](/2019/05/10/java-concurrent(1-3)/)
1. []()
1. []()


## 没介绍到但比较重要的成员

### RejectedExecutionHandler

ThreadPoolExecutor实现了该接口

提供了一种失败重试的事件机制.参考[这里](https://examples.javacodegeeks.com/core-java/util/concurrent/rejectedexecutionhandler/java-util-concurrent-rejectedexecutionhandler-example/)



### ThreadFactory

这个一般用Guava的ThreadFactoryBuilder创建,比较少自己实现

### 异常

```java

BrokenBarrierException	

CancellationException	

CompletionException	

ExecutionException	

RejectedExecutionException	

TimeoutException

```


## 参考链接:
1. [40个Java多线程问题总结](http://www.importnew.com/18459.html#comment-651217)
2. [[翻译][Java]ExecutorService的正确关闭方法](https://blog.csdn.net/zaozi/article/details/38854561)
3. [Java并发编程：CountDownLatch、CyclicBarrier和Semaphore](https://www.cnblogs.com/dolphin0520/p/3920397.html)
4. [Java并发教程（Oracle官方资料）](http://www.iteye.com/magazines/131-Java-Concurrency)
5. [如何在 Java 中正确使用 wait, notify 和 notifyAll – 以生产者消费者模型为例](http://www.importnew.com/16453.html)
6. [Lesson: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html)
7. [Package java.util.concurrent](https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/package-summary.html)
8. [ava并发编程：Callable、Future和FutureTask](https://www.cnblogs.com/dolphin0520/p/3949310.html)