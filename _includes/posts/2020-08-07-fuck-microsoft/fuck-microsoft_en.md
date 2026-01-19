I first encountered the `C#` language in 2011, when the school was using `.NET Framework 3.5` tutorials.

![image](/img/in-post/fuck-microsoft/history.png)

In terms of language features alone, `C#` from 10 years ago was far superior to `Java 8`. Unfortunately, a lion can't fight a pack of wolves. Maybe it was also because it was unfriendly to search engines from the start, so it's been plagued with misfortune.
It's been 18 years since its debut, and in my opinion, it's basically been treading water.

## The Elegant C# Language

C#'s generics are beautifully designed. To this day, Java still implements generics using type erasure, and as for golang, it's all just talk on paper—it still hasn't been implemented.

How are C# generics (MSIL) implemented internally? - RednaxelaFX's answer - Zhihu
https://www.zhihu.com/question/27634924/answer/40854909

The CLR Genius Paper
https://www.microsoft.com/en-us/research/publication/design-and-implementation-of-generics-for-the-net-common-language-runtime/?from=http%3A%2F%2Fresearch.microsoft.com%2Fpubs%2F64031%2Fdesignandimplementationofgenerics.pdf

## Microsoft Loves Embracing Change

Maybe Microsoft just loves embracing change. Every few years, they like to roll out a whole new set of technology frameworks.

- language
1. .NET framework
1. .NET core
1. Visual Basic
1. F#

- web
1. ashx
1. ASP
1. ASP.NET WebForm
1. WCF
1. Microsoft Silverlight
1. ASP.NET
1. ASP.NET MVC
1. SignalR 2.0
1. Abp VNext

- desktop
1. WPF
1. Windows Forms

- Mobile
1. Xamarin
1. UWP

From a syntax perspective, C# is the most elegant language I've ever seen.
[LINQ is way better than Java 8's stream API](http://www.zeusro.com/2018/03/08/linq-vs-stream/).

But Microsoft took the wrong path from the start, choosing to tightly bind `C#` to the `Windows` platform. Their CEO's plan was: strengthen our position through tight binding and establish dominance.

People vote with their feet. Whether it's `Windows` or `Windows Server`, licensing is a significant cost. Microsoft at that time was too focused on short-term gains, leading to C#'s major defeat.

So `Xamarin` took a different path, proposing cross-platform implementation with .NET.

Later, Microsoft reflected deeply and decided to embrace open source. But even after acquiring `Xamarin`, the integration path was full of difficulties.

When Microsoft announced .NET 5 at the 2019 Build conference, they clearly stated, "There will be only one .NET in the future, and you'll be able to use it to target Windows, Linux, macOS, iOS, Android, tvOS, watchOS, and WebAssembly, and more." Microsoft announced in April that when preview 2 was released, it was already handling 50% of the traffic on their .NET site.

But from 2002 to 2019, those 17 years were basically wasted. Every iteration of Microsoft's technology was basically forward-incompatible. For ordinary developers, this was quite a torture.

So basically, Microsoft's tech stack is left with only a few directions:

1. Unity 3D game development
1. Working for Microsoft
1. Rapid development of low-cost, maintenance-free applications

## Now

Although I don't play with `C#` anymore, I've met quite a few friends who used to develop with `ASP.NET`. One of them even treated me to several meals back in 2016.
It was quite an interesting experience.

![image](/img/in-post/fuck-microsoft/2016-04-21.jpeg)

## Conclusion

**Microsoft's technology: 1.0 is completely unusable, 2.0 is okay. 3.0? Sorry, there's no 3.0**.

## References

[1]
.NET 5.0 Preview 6 Released: Supports Windows ARM64 Devices
https://www.cnblogs.com/shanyou/p/13196251.html

[2]
C#
https://zh.wikipedia.org/wiki/C%E2%99%AF

[3]
The Journey to a Unified .NET
https://www.cnblogs.com/shanyou/p/12921285.html
