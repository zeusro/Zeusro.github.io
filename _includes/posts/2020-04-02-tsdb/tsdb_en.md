First, let's clarify a concept:

> Relational databases are a proper subset of non-relational databases, and non-relational databases are a proper subset of time-series databases.

## Relational Databases

![image](/img/in-post/tsdb/mysql.png)

Relational databases are defined as:
> Databases that use a relational model to organize data, storing data in rows and columns for user understanding. This series of rows and columns in relational databases is called tables, and a group of tables forms a database.

The pinnacle of relational databases is MySQL. The problem with relational databases lies in emphasizing "relationships." But actually, **relationships between objects are weak relationships. Strong relationships are just a special case**.

For example. Let's define three objects: Xiao Ming, Xiao Hong, and Xiao Wang. Xiao Ming and Xiao Hong are cohabiting lovers, and Xiao Wang lives next door. One day, Xiao Ming comes home and sees Xiao Hong and Xiao Wang in the same room. What would Xiao Ming think?

Should he say Xiao Wang and Xiao Hong are playing house, or accept their explanation that Xiao Wang is changing a light bulb in the room?

This relationship problem is actually the biggest problem with relational databases—**messing with relationships**. In many current development design standards, relational databases have been treated as a data storage warehouse (heap tables), prohibiting stored procedures and foreign keys. It can be said this is an inevitable result of historical development.

## Non-Relational Databases

So, non-relational databases are naturally NoSQL.

> NoSQL, generally referring to non-relational databases. With the rise of internet web2.0 websites, traditional relational databases have shown inadequacy in handling web2.0 websites, especially ultra-large-scale and high-concurrency SNS-type web2.0 purely dynamic websites, with many insurmountable problems. Non-relational databases have developed very rapidly due to their own characteristics. NoSQL databases emerged to solve the challenges brought by large-scale data collections with multiple data types, especially big data application problems.

Among them are key-value databases represented by Redis, and document databases represented by MongoDB.

![image](/img/in-post/tsdb/redis.jpg)

Redis is memory-based (though it can also persist to disk), and memory is a quite precious resource. The limitation of resources restricts the widespread use of resources.

![image](/img/in-post/tsdb/Mongodb.png)

MongoDB is actually a bit like Excel. In Excel files, each row can have any number of cells.

For example, Yui Aragaki's "hobbies" and "spouse" in MongoDB are not null, but simply don't have these fields at all.

姓名 | 性别|电话|爱好|偶像|特长
|---|---|---|---|---|---
王蟑螂 |男|+8617051026064|吃耙耙|新亘结衣
新亘结衣|女|+8113766621544|||唱歌

If Redis's problem is that memory is too precious, then I think the problem with non-relational databases is that the objects they describe are "not natural enough."

## Time-Series Databases

![image](/img/in-post/tsdb/tsdb.jpg)

"Not natural enough" means lacking the "time" attribute. Actually, **time is the first attribute of data**. Any data without the time attribute becomes meaningless. So many tables in design specifications say this at the specification level: **must have a creation time attribute**.

Besides, time-series databases should satisfy this characteristic: **Immutability**. Immutability means data cannot be changed after entry. Database business is handled by real-time data stream engines.

Time-series databases are the model that best fits the real world. Take the simplest example: I want to hit your chest with little fists. Let's simplify this action first, then enter it into a time-series database~

"Little fists hitting your chest," the most simplified model is describing a point moving from one point to another in three-dimensional space as a "line segment" (because the movement distance is limited, it's called a line segment).

In three-dimensional space, finding the distance between two points is actually no different from finding the distance between two points in one-dimensional space—just generalize the Pythagorean theorem. I would say the Pythagorean theorem is the "ladder" for raising dimensions.

With this understanding, defining data in time-series databases is very natural and simple. Still using this problem as an example, solving this problem only requires collecting data at intervals and entering it.

时间 | X |Y|Z
|---|---|---|---
2020-04-01 09:35:00|1|1|1
2020-04-01 09:35:01|2|2|2
2020-04-01 09:35:02|3|3|3
2020-04-01 09:35:03|3|3|3

### Monitoring Analysis

![image](/img/in-post/tsdb/monitor.jpg)

Dong Binglin, head of Hangzhou Dihuo Technology's monitoring platform, said this: "(Alibaba Cloud) TSDB helped us solve the problem of metric data storage. Its excellent performance, zero operational costs, permanent data storage, and dedicated technical support are all reasons we continue to use it. Currently, we can easily view real-time metric information and trace back historical metric information, discover problems in time, and provide basis for further decisions. TSDB is an indispensable part for us."

### Trend Analysis

Trend analysis is used to predict the future probabilistically. For example, in the data above, modeling with a three-dimensional Cartesian coordinate system yields a linear trend line. We can predict that at `2020-04-01 09:35:04`, my little fists will most likely land at coordinate point (4, 4, 4).

### Traceability Analysis

Traceability analysis is the opposite of trend analysis—it's another data structure in reverse chronological order.

时间|X|Y|Z
|---|---|---|---
2020-04-01 09:35:03|3|3|3
2020-04-01 09:35:02|3|3|3
2020-04-01 09:35:01|2|2|2
2020-04-01 09:35:00|1|1|1

In this problem, after establishing a linear trend line, we can use traceability reasoning to analyze that at `2020-04-01 09:34:59`, my fist was most likely at (0,0,0).

That is to say, this is used to predict the "past" probabilistically. Traceability analysis can be used in scenarios like criminal investigation, tracing causes of historical issues, etc.

Current time-series databases still have relatively structured records per row. And they're widely applied in the monitoring field, which is actually a misunderstanding.
Generalized time-series databases support arbitrary attributes per row of data.

## Conclusion

**I believe that in the future, time-series databases will surpass relational and non-relational databases to become the preferred solution for application development**.

## References

1. [Relational Databases](https://baike.baidu.com/item/%E5%85%B3%E7%B3%BB%E5%9E%8B%E6%95%B0%E6%8D%AE%E5%BA%93/8999831)
3. [NoSQL](https://baike.baidu.com/item/NoSQL)
4. [What are Scatter Plots? What are they used for?](https://zhuanlan.zhihu.com/p/22986989)
5. [Time-Series Database TSDB](https://www.aliyun.com/product/hitsdb?spm=5176.12825654.eofdhaal5.58.e9392c4aHy5yJU)
