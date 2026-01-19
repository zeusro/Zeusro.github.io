```
graph TB
A(CompletionService<V>)-->B(ExecutorCompletionService)
```

![image](/img/in-post/java-concurrent/CompletionService.png)

### CompletionService<V>

Вы можете реализовать этот интерфейс самостоятельно. Это очередь задач.

Методы poll и take для извлечения элементов очереди.

take будет блокировать до появления результата в очереди.

poll следует использовать при условии, что очередь уже имеет результаты, иначе опрометчивое использование вызовет нулевой указатель. Вы можете указать время ожидания таймаута, чтобы избежать длительной блокировки.


### ExecutorCompletionService

Обычно объявляют `CompletionService<V>`, создают экземпляр ExecutorCompletionService.

```java
    int TOTAL_TASK = 2;

    public void run() throws InterruptedException, ExecutionException {
        // Создать пул потоков
        ExecutorService pool = Executors.newFixedThreadPool(TOTAL_TASK);
        CompletionService<Integer> cService = new ExecutorCompletionService<>(pool);

        // Бросить задачи в него
        for (int i = 0; i < TOTAL_TASK; i++) {
            cService.submit(new CallableExample());
            //Этот перегруженный метод submit(Runnable task, V result) передает результат сам
        }
        // Проверить результаты выполнения задач пула потоков
        for (int i = 0; i < TOTAL_TASK; i++) {
            Future<Integer> future = cService.take();
            System.out.println("method:" + future.get());
        }
        // Завершить работу пула потоков
        pool.shutdown();
    }
```    


[Другие примеры](https://examples.javacodegeeks.com/core-java/util/concurrent/completionservice/java-completionservice-example/)
