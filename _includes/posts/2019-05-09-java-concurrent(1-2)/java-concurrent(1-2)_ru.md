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

Простой интерфейс для запуска новых задач.

ExecutorService расширяет интерфейс Executor. Добавляет некоторые методы для управления жизненным циклом исполнителя и жизненным циклом задач.

Вы можете использовать класс `java.util.concurrent.Executors`, который предоставляет несколько простых статических фабричных методов для создания экземпляров потоков, для создания подклассов ExecutorService (обычно создание ThreadPoolExecutor/ScheduledExecutorService/ScheduledThreadPoolExecutor).

### ScheduledExecutorService

Наследует ExecutorService и Executor. Поддерживает Future и периодическое выполнение задач.

### AbstractExecutorService




### ThreadPoolExecutor

Реализует ExecutorService, поэтому может использоваться таким образом.

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

Из дерева наследования на диаграмме выше видно, что ScheduledThreadPoolExecutor реализует свои функции, наследуя интерфейс `ScheduledExecutorService`, добавляя метод `awaitTermination`.

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
