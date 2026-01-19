Материалов по этой теме бесчисленное множество. Эта статья только для моей собственной справки.

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

Этот код в конечном итоге возвращает "c". Потому что `finally` всегда выполняется. Это немного отличается от C#. Так что помните, `finally` обычно для очистки ресурсов—не возвращайте значения здесь.

Ссылки:
1. [Переосмысление языка Java—Исключения (Exception)](https://blog.csdn.net/xialei199023/article/details/63251277)
1. [Глубокое понимание механизма обработки исключений Java](https://blog.csdn.net/hguisu/article/details/6155636)
1. [Обработка исключений Java и её применение](https://www.ibm.com/developerworks/cn/java/j-lo-exception/index.html)
1. [Заблуждения и обобщение опыта обработки исключений Java](https://www.ibm.com/developerworks/cn/java/j-lo-exception-misdirection/)
1. []()
