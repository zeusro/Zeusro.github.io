## Main Approach

Real-time analysis (`show full processlist;`) combined with delayed analysis (`mysql.slow_log`) to optimize SQL statements.

## Real-Time Analysis

### View Which Threads Are Executing

    show processlist;
    show full processlist;

Compared to `show processlist;`, I prefer using this because this query can use where conditions.

```SQL
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where state !='' order by state,time desc,command ;
-- Group current connected users by client IP
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by h  order by c desc,user;
-- Group current connected users by username
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by user  order by c desc,user;
```

### Characteristics Corresponding to Various Time-Consuming SQL

1. Alter table
1. Copying to tmp table
1. Copying to tmp table on disk
1. Reading from net
1. Sending data
1. No index
1. Sorting result
1. Creating sort index
1. Sorting result

Focus on these states, refer to "[Which States in processlist Should Be Noted](https://www.kancloud.cn/thinkphp/mysql-faq/47446)" for optimization.

## Delayed Analysis

### Set Slow Query Parameters

```
slow_query_log 1
log_queries_not_using_indexes OFF
long_query_time 5
slow_query_log 1  
```

```SQL
# Create database
CREATE TABLE `slow_log_2019-05-30` (
  `start_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_host` mediumtext NOT NULL,
  `query_time` time(6) NOT NULL,
  `lock_time` time(6) NOT NULL,
  `rows_sent` int(11) NOT NULL,
  `rows_examined` int(11) NOT NULL,
  `db` varchar(512) NOT NULL,
  `last_insert_id` int(11) NOT NULL,
  `insert_id` int(11) NOT NULL,
  `server_id` int(10) unsigned NOT NULL,
  `sql_text` mediumtext NOT NULL,
  `thread_id` bigint(21) unsigned NOT NULL,
  KEY `idx_start_time` (`start_time`),
  KEY `idx_query_time` (`query_time`),
  KEY `idx_lock_time` (`lock_time`),
  KEY `idx_rows_examined` (`rows_examined`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- insert into slow_log.slow_log_2019-05-30 select * from mysql.slow_log;
-- truncate table mysql.slow_log ;
select * FROM slow_log.`slow_log_2019-05-30`
where sql_text not like 'xxx`%'
order by  query_time desc,query_time desc;
```

Prioritized, the columns to focus on are `lock_time`, `query_time`, `rows_examined`. When analyzing, apply the 80/20 rule. First find the most problematic SQL, optimize it first, then continuously use not like or delete to exclude already optimized inefficient SQL.

## Optimization Ideas for Inefficient SQL

For every query, it's wise to analyze it first with `explain SQL`.

Generally, fewer rows is better. Beware of Extra: `Using where` situations. This usually means full table scan. When data volume is large (>100k), consider adding indexes.

### Use Subqueries Cautiously

Try to avoid nested subqueries, use indexes to optimize them.

```SQL
EXPLAIN SELECT *
FROM (
	SELECT *
	FROM `s`.`t`
	WHERE status IN (-15, -11)
	LIMIT 0, 10
) a
ORDER BY a.modified DESC
```

For example, this kind is completely unnecessary. On the surface, it seems faster than removing the subquery, but actually it's because MySQL 5.7 optimized subqueries, generating a [Derived table](http://mysql.taobao.org/monthly/2017/03/05/), which cached the result set.

According to actual scenario analysis, the `status` field didn't have an index, causing the query to become a full table scan (using where). After adding an index, the problem was solved.

### json Type

For json data types, if the stored JSON is very long, reading it out will naturally be slower. In actual scenarios, first determine if it's necessary to use this type. Second, try to only fetch needed fields.

I've seen it written like this:

```SQL
WHERE j_a like '%"sid":514572%'
```

This behavior clearly shows unfamiliarity with MySQL. MySQL has JSON extraction functions.

```SQL
WHERE JSON_EXTRACT(j_a, "$[0].sid")=514572;
```

Although it's also a full table scan, it's still better than a full fuzzy like query, right?

A better approach is to create an index through a virtual field.

[MySQL · Best Practices · How to Index JSON Fields](http://mysql.taobao.org/monthly/2017/12/09/)

But currently MySQL's indexing for json is insufficient. If json data columns are too large, it's recommended to store in `MongoDB` (I've seen 120k json stored in MySQL, the read speed was simply speechless).

### String Type

```SQL
WHERE a=1
```

Using numbers to assign values to string type fields will cause indexes on that field to become invalid.

```SQL
WHERE a='1'
```

### Grouping Queries

`group by`, `count(x)`, `sum(x)`, use with caution. Very CPU intensive.

#### `group by`

```SQL
select col_1 from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 group by col_1
```

This kind of `group by` that doesn't involve aggregate queries (`count(x)`, `sum(x)`) is clearly unreasonable. Using distinct queries is more efficient.

```SQL
select distinct(col_1) from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 limit xxx;
```

### `count(x)`, `sum(x)`

The field x should preferably have an index, otherwise even if filter conditions have indexes, it will be very slow.

### order by x

The field x should preferably have an index, otherwise `show processlist;` may show many `Creating sort index` results.

### Composite Index Invalidation

Composite indexes have a leftmost matching principle.

```SQL
KEY 'idx_a' (a,b,c)
```

```SQL
WHERE b='' and c =''
```

At this time, the composite index is invalid.

## Other

```SQL
EXPLAIN SQL
DESC SQL
```

```SQL
# The INNODB_TRX table mainly contains information about all transactions executing in the InnoDB engine, including transactions waiting for a lock and running transactions
SELECT * FROM information_schema.INNODB_TRX;
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

## Reference Links

1. [MySQL Slow Query Log Summary](https://www.cnblogs.com/kerrycode/p/5593204.html)
1. [MySQL CPU Usage High Causes and Solutions](https://help.aliyun.com/knowledge_detail/51587.html)
1. [MySQL Optimization, Reasons Why Queries Don't Use Indexes Summary](https://blog.csdn.net/m0_37808356/article/details/72526687)
1. [Introduction to Using Innodb-Related Tables in information_schema for Analyzing SQL Query Lock Usage](https://blog.csdn.net/and1kaney/article/details/51213979)
