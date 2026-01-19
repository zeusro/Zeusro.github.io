The `java.util.concurrent` package defines various thread-related collections, classes, and interfaces. After peeling back the layers, I have a deeper understanding of that phrase "passing my ancestral java package to you". This inheritance tree looks quite painful.

But in the end, I still stripped it down, decomposed it, and organized it into this article.


I wanted to give up halfway through writing, because [this website](https://examples.javacodegeeks.com/category/core-java/util/concurrent/) provides many examples.

## Navigation

1. [Possibly the Most Complete Java Thread Guide (1-1)[Task Scheduling Classes_Callable Series]](/2019/05/09/java-concurrent(1-1)/)
1. [Possibly the Most Complete Java Thread Guide (1-2)[Task Scheduling Classes_Executor Series]](/2019/05/09/java-concurrent(1-2)/)
1. [Possibly the Most Complete Java Thread Guide (1-3)[Task Scheduling Classes_CompletionService Series]](/2019/05/10/java-concurrent(1-3)/)
1. []()
1. []()


## Members Not Introduced But Relatively Important

### RejectedExecutionHandler

ThreadPoolExecutor implements this interface.

Provides a failure retry event mechanism. Reference [here](https://examples.javacodegeeks.com/core-java/util/concurrent/rejectedexecutionhandler/java-util-concurrent-rejectedexecutionhandler-example/)



### ThreadFactory

This is generally created using Guava's ThreadFactoryBuilder, rarely implemented yourself.

### Exceptions

```java

BrokenBarrierException	

CancellationException	

CompletionException	

ExecutionException	

RejectedExecutionException	

TimeoutException

```


## Reference Links:
1. [Summary of 40 Java Multithreading Questions](http://www.importnew.com/18459.html#comment-651217)
2. [[Translation][Java]Correct Way to Shut Down ExecutorService](https://blog.csdn.net/zaozi/article/details/38854561)
3. [Java Concurrency Programming: CountDownLatch, CyclicBarrier and Semaphore](https://www.cnblogs.com/dolphin0520/p/3920397.html)
4. [Java Concurrency Tutorial (Oracle Official Material)](http://www.iteye.com/magazines/131-Java-Concurrency)
5. [How to Correctly Use wait, notify and notifyAll in Java – Using Producer Consumer Model as Example](http://www.importnew.com/16453.html)
6. [Lesson: Concurrency](https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html)
7. [Package java.util.concurrent](https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/package-summary.html)
8. [Java Concurrency Programming: Callable, Future and FutureTask](https://www.cnblogs.com/dolphin0520/p/3949310.html)
