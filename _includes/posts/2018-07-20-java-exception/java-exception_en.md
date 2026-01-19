There's no end to materials on this topic. This article is just for my own reference.

```java

    static String a() {
        try {
            throw new RuntimeException("a");
        } catch (RuntimeException e) {
            return "d";
        } catch (Exception e) {
            return "b";
        } finally {
            return "c";
        }
//        return "d";
    }
```

This code ultimately returns "c". Because `finally` always executes. This is a bit different from C#. So remember, `finally` is generally for resource cleanup—don't return values here.

References:
1. [Rediscovering the Java Language—Exceptions (Exception)](https://blog.csdn.net/xialei199023/article/details/63251277)
1. [Deep Understanding of Java Exception Handling Mechanism](https://blog.csdn.net/hguisu/article/details/6155636)
1. [Java Exception Handling and Its Applications](https://www.ibm.com/developerworks/cn/java/j-lo-exception/index.html)
1. [Java Exception Handling Misconceptions and Experience Summary](https://www.ibm.com/developerworks/cn/java/j-lo-exception-misdirection/)
1. []()
