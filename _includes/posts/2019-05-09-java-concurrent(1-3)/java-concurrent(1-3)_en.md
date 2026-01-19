```
graph TB
A(CompletionService<V>)-->B(ExecutorCompletionService)
```

![image](/img/in-post/java-concurrent/CompletionService.png)

### CompletionService<V>

You can implement this interface yourself. This is a task queue.

poll and take methods for retrieving queue elements.

take will block until a result appears in the queue.

poll should be used on the premise that the queue already has results, otherwise using it rashly will cause null pointer. You can specify a timeout wait time to avoid long blocking.


### ExecutorCompletionService

Generally declare `CompletionService<V>`, instantiate ExecutorCompletionService.

```java
    int TOTAL_TASK = 2;

    public void run() throws InterruptedException, ExecutionException {
        // Create thread pool
        ExecutorService pool = Executors.newFixedThreadPool(TOTAL_TASK);
        CompletionService<Integer> cService = new ExecutorCompletionService<>(pool);

        // Throw tasks into it
        for (int i = 0; i < TOTAL_TASK; i++) {
            cService.submit(new CallableExample());
            //This overloaded submit(Runnable task, V result) method passes the result in yourself
        }
        // Check thread pool task execution results
        for (int i = 0; i < TOTAL_TASK; i++) {
            Future<Integer> future = cService.take();
            System.out.println("method:" + future.get());
        }
        // Shutdown thread pool
        pool.shutdown();
    }
```    


[Other Examples](https://examples.javacodegeeks.com/core-java/util/concurrent/completionservice/java-completionservice-example/)
