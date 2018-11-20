---
layout:       post
title:        "Java的一些异常处理"
subtitle:     ""
date:         2018-07-20
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Java
---

    这方面的资料不胜枚举,此文仅供本人备忘用.

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

这段代码最终返回值是"c".因为 finally 总是会执行.那这就跟 C#有点不一样了.所以记住,finally 一般是做一些资源的清理,不要在这里面返回值.


参考链接:
1. [重新认识Java语言——异常（Exception）](https://blog.csdn.net/xialei199023/article/details/63251277)
1. [深入理解java异常处理机制](https://blog.csdn.net/hguisu/article/details/6155636)
1. [Java 异常处理及其应用](https://www.ibm.com/developerworks/cn/java/j-lo-exception/index.html)
1. [Java 异常处理的误区和经验总结](https://www.ibm.com/developerworks/cn/java/j-lo-exception-misdirection/)
1. []()