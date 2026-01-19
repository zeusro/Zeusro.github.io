Пакет `java.util.concurrent` определяет различные коллекции, классы и интерфейсы, связанные с потоками. После снятия слоев я получил более глубокое понимание фразы "передать мой наследственный java-пакет вам". Это дерево наследования выглядит довольно болезненно.

Но в конце концов я все же разобрал его, декомпозировал и организовал в эту статью.


Я хотел сдаться на полпути написания, потому что [этот сайт](https://examples.javacodegeeks.com/category/core-java/util/concurrent/) предоставляет множество примеров.

## Навигация

1. [Возможно, самое полное руководство по потокам Java (1-1)[Классы планирования задач_Серия Callable]](/2019/05/09/java-concurrent(1-1)/)
1. [Возможно, самое полное руководство по потокам Java (1-2)[Классы планирования задач_Серия Executor]](/2019/05/09/java-concurrent(1-2)/)
1. [Возможно, самое полное руководство по потокам Java (1-3)[Классы планирования задач_Серия CompletionService]](/2019/05/10/java-concurrent(1-3)/)
1. []()
1. []()


## Члены, не представленные, но относительно важные

### RejectedExecutionHandler

ThreadPoolExecutor реализует этот интерфейс.

Предоставляет механизм событий повторных попыток при сбое. См. [здесь](https://examples.javacodegeeks.com/core-java/util/concurrent/rejectedexecutionhandler/java-util-concurrent-rejectedexecutionhandler-example/)



### ThreadFactory

Обычно создается с помощью ThreadFactoryBuilder от Guava, редко реализуется самостоятельно.

### Исключения

```java

BrokenBarrierException	

CancellationException	

CompletionException	

ExecutionException	

RejectedExecutionException	

TimeoutException

```


## Ссылки:
1. [Сводка 40 вопросов о многопоточности Java](http://www.importnew.com/18459.html#comment-651217)
2. [[Перевод][Java]Правильный способ закрытия ExecutorService](https://blog.csdn.net/zaozi/article/details/38854561)
3. [Параллельное программирование Java: CountDownLatch, CyclicBarrier и Semaphore](https://www.cnblogs.com/dolphin0520/p/3920397.html)
4. [Учебник по параллелизму Java (Официальные материалы Oracle)](http://www.iteye.com/magazines/131-Java-Concurrency)
5. [Как правильно использовать wait, notify и notifyAll в Java – Используя модель производителя-потребителя в качестве примера](http://www.importnew.com/16453.html)
6. [Урок: Параллелизм](https://docs.oracle.com/javase/tutorial/essential/concurrency/index.html)
7. [Пакет java.util.concurrent](https://docs.oracle.com/javase/8/docs/api/?java/util/concurrent/package-summary.html)
8. [Параллельное программирование Java: Callable, Future и FutureTask](https://www.cnblogs.com/dolphin0520/p/3949310.html)
