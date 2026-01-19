<!-- TODO: Translate to ru -->

```
graph TB
A(Callable<V>)-->B(DocumentationTool.DocumentationTask)
A-->C(JavaCompiler.CompilationTask)
```

![image](/img/in-post/java-concurrent/Callable.png)

一般情况下是配合ExecutorService来使用的，在ExecutorService接口中声明了若干个submit方法的重载版本：

```java
<T> Future<T> submit(Callable<T> task);
<T> Future<T> submit(Runnable task, T result);
Future<?> submit(Runnable task);
```

```java
import java.util.Random;
import java.util.concurrent.Callable;

public class CallableExample implements Callable {

    @Override
    public Object call() throws Exception {
        // Create random number generator
        Random generator = new Random();

        Integer randomNumber = generator.nextInt(5);

        // To simulate a heavy computation,
        // we delay the thread for some random time
        Thread.sleep(randomNumber * 1000);

        return randomNumber;
    }
}
```