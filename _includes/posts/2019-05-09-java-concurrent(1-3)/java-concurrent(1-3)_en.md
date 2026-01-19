<!-- TODO: Translate to en -->

```
graph TB
A(CompletionService<V>)-->B(ExecutorCompletionService)
```

![image](/img/in-post/java-concurrent/CompletionService.png)

### CompletionService<V>

可自行实现该接口.这是一个任务队列.

取出队列元素的poll和take方法

take会阻塞知道队列出现结果

poll使用的前提是确保队列已经有结果,不然贸贸然使用会出现空指针.可以指定一个超时等待时间,避免长时间卡死.


### ExecutorCompletionService

一般都是声明`CompletionService<V>`,实例化ExecutorCompletionService

```java
    int TOTAL_TASK = 2;

    public void run() throws InterruptedException, ExecutionException {
        // 创建线程池
        ExecutorService pool = Executors.newFixedThreadPool(TOTAL_TASK);
        CompletionService<Integer> cService = new ExecutorCompletionService<>(pool);

        // 向里面扔任务
        for (int i = 0; i < TOTAL_TASK; i++) {
            cService.submit(new CallableExample());
            //重载的这个submit(Runnable task, V result)方法,是自行把结果传入
        }
        // 检查线程池任务执行结果
        for (int i = 0; i < TOTAL_TASK; i++) {
            Future<Integer> future = cService.take();
            System.out.println("method:" + future.get());
        }
        // 关闭线程池
        pool.shutdown();
    }
```    


[其他例子](https://examples.javacodegeeks.com/core-java/util/concurrent/completionservice/java-completionservice-example/)