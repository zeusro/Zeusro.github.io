---
layout:       post
title:        "干掉mysql慢查询"
subtitle:     ""
date:         2019-03-14
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - mysql
---

## 主要思路

通过导入`mysql.slow_log`的表数据,结合实时分析,进行SQL优化


## 设置慢查询参数

```
slow_query_log 1
log_queries_not_using_indexes OFF
long_query_time 5
slow_query_log 1  
```

## 建表

```SQL
# 建数据库
CREATE TABLE `slow_log_2019-03-14` (
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
 insert into slow_log.`slow_log_2019-03-14` select * from mysql.slow_log;
-- truncate table mysql.slow_log ;

```

## 实时分析

* 查看有哪些线程正在执行

    show processlist;

相比`show processlist;`我比较喜欢用

```SQL
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where state !='' order by state,time desc,command ;
```

重点关注

- 改表

1. Copying to tmp table	

- 内存不够用,转成磁盘

1. Copying to tmp table on disk	

- 传输数据量大

1. Reading from net
1. Sending data

- 没有索引

1. Copying to tmp table
1. Sorting result
1. Creating sort index
1. Sorting result

的状态,参考[processlist中哪些状态要引起关注](https://www.kancloud.cn/thinkphp/mysql-faq/47446)进行优化


## 延后分析

```
select * FROM slow_log.`slow_log_2019-03-14` 
where sql_text not like 'xxx`%'
order by  query_time desc,query_time desc;
```

按优先级排列,需要关注的列是`lock_time`,`query_time`,`rows_examined`.分析的时候应用二八法则,先找出最坑爹的那部分SQL,率先优化掉,然后不断not like或者删除掉排除掉已经优化好的低效SQL.

## 优化

### json类型

见过这样写的

```SQL
WHERE j_a like '%"sid":514572%'
```

这种行为明显是对mysql不熟悉,MYSQL是有JSON提取函数的.

```SQL
WHERE JSON_EXTRACT(j_a, "$[0].sid")=514572;
```

虽然也是全表扫描,但怎么说也比like全模糊查询好吧?

更好的做法,是通过虚拟字段建索引

[MySQL · 最佳实践 · 如何索引JSON字段](http://mysql.taobao.org/monthly/2017/12/09/)

但是现阶段MYSQL对json的索引做的是不够的,如果json数据列过大,建议还是存`MongoDB`(见过把12万json存mysql的,那读取速度简直无语).

### 字符串类型

```SQL
WHERE a=1
```

用数字给字符串类型的字段赋值会导致该字段上的索引失效.

```SQL
WHERE a='1'
```

### 分组查询

`group by`,`count(x)`,`sum(x)`,慎用.非常消耗CPU

#### `group by`

```SQL
select col_1 from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 group by col_1
```

这种不涉及聚合查询(`count(x)`,`sum(x)`)的`group by`明显就是不合理的,去重复查询效果更高点

```SQL
select distinct(col_1) from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 limit xxx;
```

### `count(x)`,`sum(x)`

x 这个字段最好带索引,不然就算筛选条件有索引也会很慢

### order by x

x这字段最好带上索引,不然`show processlist;`里面可能会出现大量`Creating sort index`的结果

### 组合索引失效

组合索引有个最左匹配原则

```SQL
KEY 'idx_a' (a,b,c)
```

```SQL
WHERE b='' and c =''
```

这时组合索引是无效的.



## 其他

```
EXPLAIN SQL
DESC SQL
```

```
# INNODB_TRX表主要是包含了正在InnoDB引擎中执行的所有事务的信息，包括waiting for a lock和running的事务
SELECT * FROM information_schema.INNODB_TRX;
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

## 参考链接

1. [MySQL慢查询日志总结](https://www.cnblogs.com/kerrycode/p/5593204.html)
1. [MySQL CPU 使用率高的原因和解决方法](https://help.aliyun.com/knowledge_detail/51587.html)
1. [mysql优化，导致查询不走索引的原因总结](https://blog.csdn.net/m0_37808356/article/details/72526687)
1. [information_schema中Innodb相关表用于分析sql查询锁的使用情况介绍](https://blog.csdn.net/and1kaney/article/details/51213979)