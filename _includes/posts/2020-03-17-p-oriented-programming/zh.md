![](/img/sticker/p.jpg)

今天是2020-03-17，让我向大家隆重介绍一种划时代的元编程开发技巧：**面向调皮开发**

我们中学课本的好朋友鲁迅，曾经没有这样说过：
> 非调皮无以明志，非滑稽无以致远

![](/img/sticker/luxun.jpg)

21世纪是生物(调皮)的世纪,只有懂得**面向调皮开发**，才能世人皆醉,唯我独醒，才能在滚滚红尘中，迅速被人淘汰。

## 写代码的错误姿势

1. 配备完善的内部健康检查机制
1. 合并分支之前都有2个以上`code reviewer`
1. 正式更新之前建立完备测试环境
1. 测试覆盖率在80%以上
1. 每次更新上线都用灰度
1. 不使用root管理运维服务器
1. 聘请计算机基础扎实的的工程师
1. 底层基础依赖（Redis，MySQL）保证99.99%的可用性
1. 不使用`sudo rm -rf /`来完成对服务器的升级

如果你想要成为一个**面向调皮开发者**，**面向调皮管理者**，**面向调皮XX**,这些陋习都要统统去掉。

## 写代码的正确姿势

![](/img/p-programming/code.jpg)

记住，对过早优化说不，需要优化就马上跑路。

## 搞前端的正确姿势

![](/img/p-programming/jq.jpg)

## 写bug的正确姿势

![](/img/p-programming/hand-over.jpg)

写出bug不要紧，只要不是你的就行。

如果是你写的代码出问题，那就`hack`同事的电脑，用`git rebase`重写仓库的提交历史，有锅全让别人来背。

## 搞测试的正确姿势

![](/img/p-programming/test.gif)

## 开源社区的正确姿势

自己的开源项目，要突出一个“**皮**”字，这个项目必须要有趣，比如
1. [用动态规划做一个渣男挖别人墙角](https://www.zeusro.com/2020/03/14/dynamic-optimization/)
1. [人为制造带宽均衡态](https://github.com/p-program/common-bandwidth-auto-switch)让阿里云的共享带宽挣不到钱。
1. 嫌弃`dnspod`网站做的太破，[开发一个油猴插件魔改dnspod](https://www.zeusro.com/2019/07/05/mydnspod/),最后再发邮件给腾讯的HR，吐槽下他们的产品设计

### pull request的正确姿势

`pull request`,也要突出一个“**皮**”字

要记住，`pull request`就是你报复`reviewers`(这些人通常是你上司)的最好机会。要竭尽全力，在代码和文档里面拼命挖坑。比如

1. 本该是`int64`的变量用`int32`表示，让这个问题随着时间的推移而逐渐出现
1. 创造性的拼写错误
1. 充分利用`UTF-8`的字符集，使用非英语字母，ASCII 字符
1. 尽可能模块化，util , interface ，service implement ，web front-end, web back-end 都各自做成 `git` 的 `submodule`，并且各个`submodule`之间还有菱形依赖。反正顶层的web项目天知道哪天能运行起来。项目一多，KPI 就有了。
1. 坚持使用`Java`编程，并违背[阿里巴巴Java开发手册](https://github.com/alibaba/p3c)上面的任何一条规则
1. `#define TRUE FALSE`
1. 产品文档上面不要写跟产品有关的任何细节（这是为了保护你的产品不被破坏！）
1. 为了阻挠任何雇佣外部维护承包商的倾向，可以在代码中散布针对其他同行软件公司的攻击和抹黑，特别是可能接替你工作的其中任何一家

自带混淆的代码是给上帝看的，保护好我们的代码，就算它们落入了竞争对手手上，也丝毫不慌。只要你写的bug足够奇怪，单位就不敢轻易辞退你！竞争对手也会对你肃然起敬！

**面向调皮开发**，注重的是思路，而不是结果。要学会一本正经的胡说八道，写出满是bug的代码.

如果有人质疑你，你就发这张图：

![](/img/p-programming/chicken.png)

### 处理 `issue` 的正确姿势

不管别人问你什么问题，先让他[提问的智慧](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/master/README-zh_CN.md)

如果他学会了，就让他自己解决问题。

### `code review` 的正确姿势

不管他写了什么代码，先让他测试覆盖率达到99.99%再说，如果他做到了，我们直接关掉他`pull request`,并告诉他，这个项目我已经不打算维护了。

参考

1. [hexo Chart](https://github.com/cloudnativeapp/charts/pull/33)
1. [如何编写无法维护的代码](https://coderlmn.github.io/frontEndCourse/unmaintainable.html)
1. [Update README-zh_Hans.md](https://github.com/zxystd/IntelBluetoothFirmware/pull/61)


## 服务器运维的正确姿势

![](/img/p-programming/rm.jpg)

1. `sudo rm -rf /`
1. 拔插头
1. 插插头

## 数据库管理的正确姿势

![](/img/p-programming/delete-db.gif)

## Kubernetes 管理员的正确姿势

![](/img/p-programming/rm.gif)

```bash
kubectl delete namespace default --grace-period=0 --force
```

## 结语

相信我，当你体会了**面向调皮开发**的真谛以后，相信用不了多久，降职减薪，当上CAO(首席背锅官)，出入拘留所，勾搭检察官，堕入人生低谷。收入减半，仇人加倍，铁窗生活不是梦！

![](/img/p-programming/CAO.png)