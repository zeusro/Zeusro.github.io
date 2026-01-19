![image](/img/sticker/p.jpg)

Today is 2020-03-17, let me introduce to everyone a groundbreaking metaprogramming development technique: **P-Oriented Programming**

Our good friend Lu Xun from middle school textbooks once didn't say this:
> Without mischief, one cannot clarify ambition; without humor, one cannot reach far

![image](/img/sticker/luxun.jpg)

The 21st century is the century of biology (mischief). Only by understanding **P-Oriented Programming** can one be drunk while the world is sober, and can one be quickly eliminated in the rolling red dust.

## Wrong Ways to Write Code

1. Equip comprehensive internal health check mechanisms
1. Have 2 or more `code reviewers` before merging branches
1. Establish complete test environments before formal updates
1. Test coverage above 80%
1. Use grayscale for every update deployment
1. Don't use root to manage operations servers
1. Hire engineers with solid computer fundamentals
1. Ensure 99.99% availability for underlying infrastructure dependencies (Redis, MySQL)
1. Don't use `sudo rm -rf /` to complete server upgrades

If you want to become a **P-Oriented Developer**, **P-Oriented Manager**, **P-Oriented XX**, all these bad habits must be removed.

## Right Ways to Write Code

![image](/img/p-programming/code.jpg)

Feng Qingyang once said:
> "In terms of martial arts alone, these demon cult elders cannot be said to have truly glimpsed the door of superior martial arts. They don't understand that moves are dead, but the person executing them is alive. No matter how cleverly dead moves are broken, when encountering living moves, one is inevitably bound hand and foot, only to be slaughtered. You must firmly remember this word 'living'. Learn moves with flexibility, use moves with flexibility. If one is rigid and inflexible, even if one practices tens of millions of ultimate moves, when encountering a true master, one will ultimately be broken cleanly.

![image](/img/p-programming/another.jpg)

Feng Qingyang also said:

> "A true man acts as he pleases, flowing like clouds and water, going wherever he wants. What martial arts rules, sect doctrines, they're all fucking bullshit!"

`#define TRUE FALSE`

Remember, say no to premature optimization, and if optimization is needed, just run away immediately.

![image](/img/p-programming/thread.png)

## Right Ways to Do Frontend

![image](/img/p-programming/jq.jpg)

## Right Ways to Write Bugs

![image](/img/p-programming/hand-over.jpg)

Writing bugs doesn't matter, as long as they're not yours.

If code you wrote has problems, then `hack` your colleague's computer, use `git rebase` to rewrite the repository's commit history, and let others take all the blame.

## Right Ways to Do Testing

![image](/img/p-programming/test.gif)

## Right Ways for Open Source Community

Your own open source projects should emphasize a "**mischief**" character. The project must be interesting, such as:
1. [Using dynamic programming to make a scumbag steal someone's partner](https://www.zeusro.com/2020/03/14/dynamic-optimization/)
1. [Artificially creating bandwidth equilibrium state](https://github.com/p-program/common-bandwidth-auto-switch) to make Alibaba Cloud's shared bandwidth unable to make money.
1. Disliking that `dnspod`'s website is too broken, [developing a Tampermonkey plugin to modify dnspod](https://www.zeusro.com/2019/07/05/mydnspod/), and finally sending an email to Tencent's HR to complain about their product design

### Right Ways for Pull Requests

`pull request` should also emphasize a "**mischief**" character

Remember, `pull request` is your best opportunity to get revenge on `reviewers` (these people are usually your superiors). Go all out to dig pits in code and documentation. For example:

1. Use `int32` for variables that should be `int64`, letting the problem gradually appear over time
1. Creative spelling errors
1. Make full use of `UTF-8` character set, use non-English letters, ASCII characters
1. Modularize as much as possible, util, interface, service implement, web front-end, web back-end all made into `git` `submodules`, and there are diamond dependencies between each `submodule`. Who knows when the top-level web project can run. More projects mean more KPI.
1. Insist on using `Java` programming and violate every rule in [Alibaba Java Development Manual](https://github.com/alibaba/p3c)
1. Don't write any details related to the product in product documentation (this is to protect your product from being destroyed!)
1. To hinder any tendency to hire external maintenance contractors, you can scatter attacks and slander against other peer software companies in the code, especially any that might replace your work

Self-obfuscating code is for God to see. Protect our code well. Even if they fall into competitors' hands, we're not panicked at all. As long as the bugs you write are strange enough, the company won't dare to fire you easily! Competitors will also respect you!

**P-Oriented Programming** focuses on ideas, not results. Learn to speak nonsense seriously and write code full of bugs.

If someone questions you, send them this image:

![image](/img/p-programming/chicken.png)

### Right Ways to Handle `issues`

No matter what question someone asks you, first make them read [How To Ask Questions The Smart Way](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)

If they learn it, let them solve the problem themselves.

### Right Ways for `code review`

No matter what code they write, first make them achieve 99.99% test coverage. If they do it, we directly close their `pull request` and tell them this project is no longer maintained.

References

1. [hexo Chart](https://github.com/cloudnativeapp/charts/pull/33)
1. [How to Write Unmaintainable Code](https://coderlmn.github.io/frontEndCourse/unmaintainable.html)
1. [Update README-zh_Hans.md](https://github.com/zxystd/IntelBluetoothFirmware/pull/61)

## Right Ways for Server Operations

![](/img/p-programming/rm.jpg)

1. `sudo rm -rf /`
1. Unplug
1. Plug in

## Right Ways for Database Management

![image](/img/p-programming/delete-db.gif)

## Right Ways for Kubernetes Administrators

![image](/img/p-programming/rm.gif)

```bash
kubectl delete namespace default --grace-period=0 --force
```

## Conclusion

Believe me, after you experience the true meaning of **P-Oriented Programming**, it won't be long before you get demoted and salary cut, become CAO (Chief Apology Officer), enter and leave detention centers, hook up with prosecutors, and fall into the depths of life. Income halved, enemies doubled, prison life is not a dream!

![image](/img/p-programming/CAO.png)

[I recently bought a domain](http://www.bullshitprogram.com/), welcome everyone to send me money.

## Reference Links

1. [Feng Qingyang: There Are Heights Higher Than Heaven](https://baike.baidu.com/tashuo/browse/content?id=465f421a9dfaa9bbf1492227&lemmaId=7056998&fromLemmaModule=pcBottom)
1. [Ask HN: What's the largest amount of bad code you have ever seen work?](https://news.ycombinator.com/item?id=18442637)
1. [is there an award for ugliest code?](https://www.reddit.com/r/ProgrammerHumor/comments/9xuhyj/is_there_an_award_for_ugliest_code/)
