---
layout:       post
title:        "Mysql优化"
subtitle:     ""
date:         2018-06-23
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - mysql
---

## 一些套路

* 不要使用"utf-8"
    utf-8不是真正的UTF-8,应该使用utf8mb4作为替代

* 显示数据库引擎

    SELECT * FROM INFORMATION_SCHEMA.ENGINES;

* 查看有哪些线程正在执行

    show processlist;

我比较喜欢用

```bash
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where db = 'xxxx'  and state !='' order by time desc,command ;
```

* 显示长事务

    select * from information_schema.innodb_trx;

* 改表

改表期间,运行

```sql
select concat('kill ',i.trx_mysql_thread_id,';') from information_schema.innodb_trx i,
  (select 
         id, time
     from
         information_schema.processlist
     where
         time = (select 
                 max(time)
             from
                 information_schema.processlist
             where
                 state = 'Waiting for table metadata lock'
                     and substring(info, 1, 5) in ('alter' , 'optim', 'repai', 'lock ', 'drop ', 'creat'))) p
  where timestampdiff(second, i.trx_started, now()) > p.time
  and i.trx_mysql_thread_id  not in (connection_id(),p.id);
```

执行 alter 的同时, kill 掉除了 select * from   INFORMATION_SCHEMA.innodb_trx里面除了 alter 以外的进程

* 允许 mysql 远程访问

    vi /etc/mysql/my.cnf
    ```
    [mysqld]
    bind-address    = 0.0.0.0
    ```

## MySQL Workbech


* 允许update不where更新

    SET SQL_SAFE_UPDATES = 0;

* 客户端提示

    Error Code: 2013. Lost connection to MySQL server during query
    Error Code: 2006. MySQL server has gone away

    Go to Edit -> Preferences -> SQL Editor and set to a higher value this parameter: DBMS connection read time out (in seconds). For instance: 86400.



## 参考链接

1. [ Table Locking Issues](https://dev.mysql.com/doc/refman/8.0/en/table-locking.html)
2. [privileges-provided](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
3. [RDS MySQL 表上 Metadata lock 的产生和处理](https://help.aliyun.com/knowledge_detail/41723.html)
4. [MySQL出现Waiting for table metadata lock的原因以及解决方法](https://www.cnblogs.com/digdeep/p/4892953.html)
5. [How to Allow Remote MySQL Database Connection](https://www.digitalocean.com/community/questions/how-to-allow-remote-mysql-database-connection)
6. [解决Lost connection to MySQL server during query错误方法](https://blog.csdn.net/lovemysea/article/details/79121154)
7. [mysql的show processlist命令大作用](https://blog.csdn.net/juan083/article/details/54889893)
8. [Privileges Provided by MySQL](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
1. [记住，永远不要在MySQL中使用“utf8”](http://www.infoq.com/cn/articles/in-mysql-never-use-utf8-use-utf8)
1. []()

### 阿里云

1. [10分钟搭建MySQL Binlog分析+可视化方案](https://yq.aliyun.com/articles/338423?spm=a1z5c.11394323.0.0.52d06cf5whHsHp)