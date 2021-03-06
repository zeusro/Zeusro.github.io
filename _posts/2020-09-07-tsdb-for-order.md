---
layout:       post
title:        "时间序列数据库怎么处理电商订单"
subtitle:     ""
date:         2020-09-07
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - tsdb
---

## 一道面试题

最近我在面试。有一次，面试官问了我一个电商秒杀的问题。

对于这个问题，无论前端如何耍猴（比如像以前小米页面弄个无限loading），怎么各种分布式消息队列，多级缓存，读写分离。到最后都会发现，数据库都会是最大的瓶颈。

淘宝商城的双十一搞了很多年，但说实话，每年都崩。也就是说，连支付宝这么优秀的团队，服务可用性也是有上限的。

## （非）关系型数据库的解决方案

基本上都是数据库读写分离+乐观锁 or 悲观锁 的选择。

如果用乐观锁，那么尽量让实时数据流引擎（消息队列消费者）在尽可能短的时间内砍掉无效的订单。尽可能让用户在下单与付款之间过滤掉无效的订单。
俗称砍单。

如果用悲观锁，那么瓶颈必定是库存那部分的计算。对于这部分频繁更改的数据，建议走 Redis + 定期落盘。Redis 本身可以集群化，这样就可以最大程度地规避可用性问题。

## 土豪的解决方案

12306选择了 Pivotal GemFire分布式内存计算平台(Distributed In-memory computing)。

那么，用时间序列数据库怎么处理电商订单？

## 时间序列数据库的解决方案

在我之前写的文章中，我确立了不可变性作为时间序列数据库的第一属性。也就是说，对于时间序列数据库而言，只有 create 和 query ，没有 update 和 delete 。

那么，所有的数据，在时间序列数据库中都是一种状态机一般的存在。

比如商品库存表长这样：

date|goodID|count
---|---|---|---|---
2020-09-07 16:00|3| 1
2020-09-07 16:01|3| 0

订单长这一样子：

date|orderID | userID|goodID|status
---|---|---|---|---
2020-09-07 16:01|1|2|3| 已下单
2020-09-07 16:02|1|2|3| 已付款

数据库本身只是一个加了索引的表，写入之后记录不可变，数据库本身通过不变应万变。

**事务靠实时数据流分析引擎去实现**。

在库存运算方面，我建议这部分数据放内存里面，然后靠实时数据流分析引擎完成计算完事务后，再落盘时间序列数据库。也就是说，时间序列数据库存的是**既定的结果**。

不过关于这一块内容，以上只是一种设想。欢迎大家给我留言，一起讨论。

## 进一步思考

其实，与其用复杂的技术实现，还不如重新设计一个流程，规避超大并发的问题。

像后来天猫的双十一，前期会有一些锁定定金的订单，这些订单的支付时间是在1点之后，也就是说，从活动设计之初，我们就尽可能地错开了0点秒杀这个流量峰值。
这是一种时间换空间的做法。

## 结论

> 能够用钱解决的问题都不是问题。

## 参考链接

[1]
12306网站：分布式内存数据技术为查询提速75倍
https://cloud.tencent.com/developer/article/1074220

[2]
时间序列数据库的重要性
https://zhuanlan.zhihu.com/p/122145626

[3]
时间序列数据库才是未来
http://www.zeusro.com/2020/04/02/tsdb/

[4]
电商网站中，50W-100W高并发，秒杀功能是怎么实现的？ - 九章算法的回答 - 知乎
https://www.zhihu.com/question/20978066/answer/1415294056

[5]



[6]




