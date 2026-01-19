## An Interview Question

Recently I've been interviewing. Once, an interviewer asked me about an e-commerce flash sale problem.

For this problem, no matter how the frontend monkeys around (like Xiaomi's infinite loading page back in the day), no matter what distributed message queues, multi-level caching, or read-write separation you use, you'll eventually find that the database is always the biggest bottleneck.

Taobao's Double Eleven has been running for many years, but honestly, it crashes every year. That is to say, even a team as excellent as Alipay has an upper limit on service availability.

## (Non-)Relational Database Solutions

Basically, it's all about database read-write separation + optimistic locking or pessimistic locking.

If using optimistic locking, try to make the real-time data stream engine (message queue consumer) cut off invalid orders as quickly as possible. Filter out invalid orders between the user placing an order and paying.
Commonly known as order cancellation.

If using pessimistic locking, the bottleneck must be the inventory calculation part. For this frequently changing data, I suggest using Redis + periodic disk writes. Redis itself can be clustered, which maximizes availability.

## The Rich Guy's Solution

12306 chose Pivotal GemFire Distributed In-memory Computing Platform.

So, how do you handle e-commerce orders with a time-series database?

## Time-Series Database Solution

In my previous article, I established immutability as the first property of time-series databases. That is, for time-series databases, there's only create and query, no update and delete.

So, all data in a time-series database exists like a state machine.

For example, the product inventory table looks like this:

date|goodID|count
|---|---|---|---|---
2020-09-07 16:00|3| 1
2020-09-07 16:01|3| 0

Orders look like this:

date|orderID | userID|goodID|status
|---|---|---|---|---
2020-09-07 16:01|1|2|3| Ordered
2020-09-07 16:02|1|2|3| Paid

The database itself is just an indexed table. After writing, records are immutable. The database itself handles everything through immutability.

**Transactions are implemented by real-time data stream analysis engines**.

For inventory calculations, I suggest keeping this data in memory, then after the real-time data stream analysis engine completes the transaction calculations, write it to the time-series database. That is, the time-series database stores **predetermined results**.

However, regarding this content, the above is just a concept. Feel free to leave me a message to discuss together.

## Further Thoughts

Actually, rather than using complex technical implementations, it's better to redesign a process to avoid massive concurrency problems.

Like Tmall's Double Eleven later on, there will be some orders with locked deposits in advance. The payment time for these orders is after 1 AM. That is, from the beginning of the activity design, we tried to stagger the 0:00 flash sale traffic peak as much as possible.
This is a time-for-space approach.

## Conclusion

> Problems that can be solved with money are not problems.

## References

[1]
12306 Website: Distributed In-memory Data Technology Speeds Up Queries by 75x
https://cloud.tencent.com/developer/article/1074220

[2]
The Importance of Time-Series Databases
https://zhuanlan.zhihu.com/p/122145626

[3]
Time-Series Databases Are the Future
http://www.zeusro.com/2020/04/02/tsdb/

[4]
How is the flash sale feature with 500K-1M high concurrency implemented in e-commerce websites? - Jiuzhang Algorithm's Answer - Zhihu
https://www.zhihu.com/question/20978066/answer/1415294056
