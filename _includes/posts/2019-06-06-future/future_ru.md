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

Из диаграммы выше видно, что `Future<V>` имеет исключительный статус, в основном многие члены являются его "детьми".

Future<V> представляет результат асинхронного вычисления.

### ScheduledFuture<V>

Представляет запланированную задачу. Например, `ScheduledFuture` можно использовать с ScheduledExecutorService для выполнения периодических повторяющихся задач (scheduleAtFixedRate), отложенных задач (scheduleWithFixedDelay).

### RunnableScheduledFuture<V>

Это интерфейс, вам нужно реализовать его самостоятельно.

Может использоваться для одноразовых задач или периодических задач.

Здесь вы можете обратиться к его подынтерфейсу. Использование ScheduledFuture.

### RunnableFuture

Это интерфейс, вам нужно реализовать его самостоятельно.

### FutureTask

Может быть инициализирован с `Callable<V>` и `Runnable`. `Callable<V>` имеет возвращаемое значение.

Может использоваться с ExecutorService для реализации распределения многопоточных задач.

### CompletableFuture<T>

Может использоваться для создания цепочечных сервисов (1 запускает несколько задач).


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
            // Передать результат предыдущей задачи в дочернюю задачу
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
        // Через этот сигнал, непрерывно ждать завершения выполнения дочерних потоков
        while (i != 8) {
            Thread.sleep(500);
            out.println("Продолжать ждать");
        }
//        future.join();
//        CompletableFuture.allOf(future).join();
    }
```

### CountedCompleter<T>

CountedCompleter: Задачи могут производить результаты или могут не производить результаты.

CountedCompleter запустит выполнение пользовательской функции-хука после завершения выполнения задачи.


### RecursiveAction

Как CountedCompleter<T>, наследуется от `ForkJoinTask<V>`, но `RecursiveAction` не производит результатов.

### RecursiveTask<V>

Экземпляры класса RecursiveTask представляют задачи, которые производят результаты.

Характеристика в том, что он может выполняться рекурсивно.

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

Ссылки:

1. [Анализ исходного кода JUC - Часть пула потоков (Пять): ForkJoinPool - 2](https://www.jianshu.com/p/6a14d0b54b8d)
