If you're a die-hard Java enthusiast, I suggest you press `Ctrl + W` right now to close this tab.

In 1995, Sun officially announced Java and released JDK 1.0.

## Weak Syntax

I started with ASP.NET MVC in 2014, which means C# was my first language. C# syntax is quite elegant—even the syntax from 10 years ago absolutely crushes Java 10.

C#'s generics are beautifully designed. To this day, Java still implements generics using type erasure.

C# generics combined with LINQ are absolutely unstoppable—they destroy everything in their path. In contrast, Java's Stream API is not only verbose but also full of limitations.

For more on this, check out my article: [Java 8 Stream API vs C# LINQ Extension Methods](http://www.zeusro.com/2018/03/08/linq-vs-stream/).

## The Stepmother Has No Love

In October 1997, Sun sued Microsoft in a California court for violating their Java technology contract, accusing Microsoft of making "inappropriate modifications" to Java products and breaching the promise to provide Java-compatible products.

We believe Oracle leveraged Sun's existing hardware platform to better promote its database, middleware, and other products.

[Google Cries: Must Pay Oracle $8.8 Billion!](https://cloud.tencent.com/developer/article/1170732)

It's safe to say that after Oracle acquired Sun in 2009, Java's death sentence was already announced. Everything that followed makes perfect sense.

## Foot-Binding Programming

If you've read my article
[How To Do In Java](http://www.bullshitprogram.com/howtodoinjava/)
you'll understand that the Java API is absolutely terrible. These terrible parts are euphemistically called "very stable," but more accurately described as "foot-binding programming." These unreasonable designs constitute the language's historical technical debt. And this problem is unsolvable because Java insists on backward compatibility.

## Brain-Dead JVM

When job hunting, you'll notice that positions with slightly higher titles all have similar descriptions:

> Understand JVM, including memory model, class loading mechanism, and general memory issue review;
>
> Solid Java fundamentals, familiar with IO, multithreading, collections, and other core principles, with some understanding of JVM;
> 

I think the pride of internet professionals should lie in technological innovation, using technology to meet society's needs. Not in meeting the language's demands on you.

A language is a tool, ultimately serving commercial/business value. From a resource efficiency perspective, Java is a problematic language (it's memory-hungry and slow to start), but for stable development projects like banks—those big players with deep pockets—Java can still be useful. However, Java JVM, as a container technology legacy passed to Docker, has fulfilled its historical mission. It's time to retire.

Personally, I don't like cleaning up after historical legacy issues. Writing Java feels like shoveling manure to me.

## Conclusion

Java is old and can't eat anymore.

## References

1. [Java 20 Years: History and Future](https://www.infoq.cn/article/2015/05/java-20-history-future)
1. [JVM Series (1): Java Class Loading Mechanism](http://www.ityouknow.com/jvm/2017/08/19/class-loading-principle.html)
1. [Wait, Does Java Have Memory Leaks?](http://www.ityouknow.com/java/2019/05/23/memory-leak.html)
2. [Will Go Replace Java as the Next Enterprise Programming Language?](https://www.infoq.cn/article/QC4yNPx8YeIfaKiE*2DS)
3. [Java is Old, Can It Still Eat?](https://www.infoq.cn/article/is-java-out-of-date)
4. [Does Java Have Value Types?](http://www.yinwang.org/blog-cn/2016/06/08/java-value-type)
5. [Attacking Java - Cloud Native Evolution](https://yq.aliyun.com/articles/718894)
6. [Sun-Microsoft Trial: Preliminary Injunction Order](https://www.washingtonpost.com/wp-srv/business/longterm/microsoft/documents/sunruling.htm)
1. [The Background of Java's Birth](https://blog.csdn.net/coslay/article/details/46675063)
