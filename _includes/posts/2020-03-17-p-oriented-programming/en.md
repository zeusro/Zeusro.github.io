![image](/img/sticker/p.jpg)

Today is 2020-03-17, let me introduce to you a revolutionary meta-programming development technique: **P-Oriented Programming**

Our good friend Lu Xun from middle school textbooks never said this:
> Without being mischievous, one cannot clarify one's ambition; without being humorous, one cannot reach far.

![image](/img/sticker/luxun.jpg)

The 21st century is the century of biology (mischief). Only by understanding **P-Oriented Programming** can one be the only sober person among the drunk, and be quickly eliminated in the turbulent world.

## Wrong Ways to Write Code

1. Set up a comprehensive internal health check mechanism
1. Have more than 2 `code reviewers` before merging branches
1. Build a complete test environment before official updates
1. Test coverage above 80%
1. Use gray releases for every update
1. Don't use root to manage servers
1. Hire engineers with solid computer fundamentals
1. Ensure 99.99% availability of underlying dependencies (Redis, MySQL)
1. Don't use `sudo rm -rf /` to upgrade servers

If you want to become a **P-Oriented Developer**, **P-Oriented Manager**, **P-Oriented XX**, you must eliminate all these bad habits.

## Correct Ways to Write Code

![image](/img/p-programming/code.jpg)

Feng Qingyang once said:
> "In terms of martial arts alone, these demonic cult elders cannot be said to have truly glimpsed the door of superior martial arts. They don't understand: techniques are dead, but the person executing them is alive. No matter how skillfully a dead technique is broken, when encountering a living technique, one will inevitably be bound hand and foot, only to be slaughtered. Remember this word 'living' firmly. Learn techniques flexibly, use techniques flexibly. If you stick rigidly to the old ways, even if you master tens of millions of techniques, when you meet a true master, you will still be completely broken."

![image](/img/p-programming/another.jpg)

Feng Qingyang also said:

> "A true man acts as he pleases, flowing like clouds and water, going wherever he wants. What martial arts rules, sect dogmas—they're all bullshit!"

`#define TRUE FALSE`

Remember: say no to premature optimization, and if optimization is needed, run away immediately.

![image](/img/p-programming/thread.png)

## Correct Ways to Do Frontend

![image](/img/p-programming/jq.jpg)

## Correct Ways to Write Bugs

![image](/img/p-programming/hand-over.jpg)

Writing bugs is fine, as long as they're not yours.

If your code has problems, hack your colleague's computer, rewrite the repository's commit history with `git rebase`, and let others take all the blame.

## Correct Ways to Do Testing

![image](/img/p-programming/test.gif)

## Correct Ways in Open Source Community

Your own open source project should emphasize the word "**P**" (mischievous). The project must be interesting, for example:
1. [Using dynamic programming to make a playboy steal others' partners](https://www.zeusro.com/2020/03/14/dynamic-optimization/)
1. [Artificially create bandwidth equilibrium state](https://github.com/p-program/common-bandwidth-auto-switch) to prevent Alibaba Cloud from making money from shared bandwidth.
1. Disdain that the `dnspod` website is too poor, [develop a userscript plugin to modify dnspod](https://www.zeusro.com/2019/07/05/mydnspod/), and finally send an email to Tencent's HR complaining about their product design

### Correct Ways to Make Pull Requests

`pull request` should also emphasize the word "**P**"

Remember, `pull request` is your best opportunity to get revenge on `reviewers` (usually your boss). Go all out to dig pits in the code and documentation. For example:

1. Use `int32` for variables that should be `int64`, letting the problem gradually appear over time
1. Creative spelling errors
1. Make full use of the `UTF-8` character set, use non-English letters, ASCII characters
1. Modularize as much as possible, make util, interface, service implement, web front-end, web back-end each a `git` `submodule`, and create diamond dependencies between `submodules`. Anyway, who knows when the top-level web project will run. More projects mean more KPI.
1. Persist in using `Java` programming and violate every rule in the [Alibaba Java Development Manual](https://github.com/alibaba/p3c)
1. Don't write any product details in product documentation (this is to protect your product from being destroyed!)
1. To hinder any tendency to hire external maintenance contractors, spread attacks and slander against other peer software companies in the code, especially any that might replace you

Self-obfuscated code is for God to see. Protect our code. Even if it falls into competitors' hands, don't panic at all. As long as your bugs are strange enough, the company won't dare to fire you easily! Competitors will also respect you!

**P-Oriented Programming** focuses on thinking, not results. Learn to speak nonsense with a straight face and write code full of bugs.

If someone questions you, send them this image:

![image](/img/p-programming/chicken.png)

### Correct Ways to Handle `issue`

No matter what question others ask, first make them learn [How To Ask Questions The Smart Way](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)

If they learn it, let them solve the problem themselves.

### Correct Ways to Do `code review`

No matter what code they write, first make them achieve 99.99% test coverage. If they achieve it, directly close their `pull request` and tell them you're not planning to maintain this project anymore.

References

1. [hexo Chart](https://github.com/cloudnativeapp/charts/pull/33)
1. [How to Write Unmaintainable Code](https://coderlmn.github.io/frontEndCourse/unmaintainable.html)
1. [Update README-zh_Hans.md](https://github.com/zxystd/IntelBluetoothFirmware/pull/61)

## Correct Ways to Administer Servers

![](/img/p-programming/rm.jpg)

1. `sudo rm -rf /`
1. Unplug the power
1. Plug in the power

## Correct Ways to Manage Databases

![image](/img/p-programming/delete-db.gif)

## Correct Ways to Be a Kubernetes Administrator

![image](/img/p-programming/rm.gif)

```bash
kubectl delete namespace default --grace-period=0 --force
```

## Conclusion

Believe me, after you experience the essence of **P-Oriented Programming**, it won't be long before you get demoted and have your salary cut, become CAO (Chief Apology Officer), enter and leave detention centers, hook up with prosecutors, and fall into the depths of life. Income halved, enemies doubled, life behind bars is not a dream!

![image](/img/p-programming/CAO.png)

[I recently bought a domain](http://www.bullshitprogram.com/), everyone is welcome to send me money.

## References

1. [風清揚：另有高処比天高](https://baike.baidu.com/tashuo/browse/content?id=465f421a9dfaa9bbf1492227&lemmaId=7056998&fromLemmaModule=pcBottom)
1. [Ask HN: What's the largest amount of bad code you have ever seen work?](https://news.ycombinator.com/item?id=18442637)
1. [is there an award for ugliest code?](https://www.reddit.com/r/ProgrammerHumor/comments/9xuhyj/is_there_an_award_for_ugliest_code/)
