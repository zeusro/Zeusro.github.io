---
layout:       post
title:        "干掉mysql慢查询"
subtitle:     ""
date:         2019-03-14
author:       "Zeusro"
header-img:   "/img/b/2019/Silver-Days.jpg"
header-mask:  0.3
catalog:      true
tags:
    - mysql
---

## 主要思路

实时分析(`show full processlist;`)结合延后分析(`mysql.slow_log`),对SQL语句进行优化

## 实时分析

### 查看有哪些线程正在执行

    show processlist;
    show full processlist;

相比`show processlist;`我比较喜欢用.因为这个查询可以用where条件

```SQL
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where state !='' order by state,time desc,command ;
-- 按照客户端IP对当前连接用户进行分组
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by h  order by c desc,user;
-- 按用户名对当前连接用户进行分组
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by user  order by c desc,user;
```

### 各种耗时SQL对应的特征

1. 改表
1. Copying to tmp table
1. Copying to tmp table on disk
1. Reading from net
1. Sending data
1. 没有索引
1. Sorting result
1. Creating sort index
1. Sorting result

重点关注这些状态,参考《[processlist中哪些状态要引起关注](https://www.kancloud.cn/thinkphp/mysql-faq/47446)》进行优化

## 延后分析

### 设置慢查询参数

```
slow_query_log 1
log_queries_not_using_indexes OFF
long_query_time 5
slow_query_log 1  
```

```SQL
# 建数据库
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

按优先级排列,需要关注的列是`lock_time`,`query_time`,`rows_examined`.分析的时候应用二八法则,先找出最坑爹的那部分SQL,率先优化掉,然后不断not like或者删除掉排除掉已经优化好的低效SQL.

## 低效SQL的优化思路

对于每一个查询,先用 `explain SQL` 分析一遍,是比较明智的做法.

一般而言,rows越少越好,提防Extra:`Using where`这种情况,这种情况一般是扫全表,在数据量大(>10万)的时候考虑增加索引.

### 慎用子查询

尽力避免嵌套子查询，使用索引来优化它们。

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

比如说这种的,根本毫无必要.表面上看,比去掉子查询更快一点,实际上是因为mysql 5.7对子查询进行了优化,生成了[Derived table](http://mysql.taobao.org/monthly/2017/03/05/),把结果集做了一层缓存.

按照实际的场景分析发现,`status`这个字段没有做索引,导致查询变成了全表扫描(using where),加了索引后,问题解决.

### json类型

json数据类型,如果存入的JSON很长,读取出来自然越慢.在实际场景中,首先要确定是否有使用这一类型的必要,其次,尽量只取所需字段.

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

x这字段最好带上索引,不然 `show processlist;` 里面可能会出现大量 `Creating sort index` 的结果

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

```SQL
EXPLAIN SQL
DESC SQL
```

```SQL
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