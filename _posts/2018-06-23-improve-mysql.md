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

## 慢查询优化基本步骤

0. 先运行看看是否真的很慢，注意设置SQL_NO_CACHE
1. where条件单表查，锁定最小返回记录表。这句话的意思是把查询语句的where都应用到表中返回的记录数最小的表开始查起，单表每个字段分别查询，看哪个字段的区分度最高
2. explain查看执行计划，是否与1预期一致（从锁定记录较少的表开始查询）
3. order by limit 形式的sql语句让排序的表优先查
4. 了解业务方使用场景
5. 加索引时参照建索引的几大原则
6. 观察结果，不符合预期继续从0分析

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
SELECT 
    CONCAT('kill ', thread_id, ';')
FROM
    (SELECT DISTINCT
        (i.trx_mysql_thread_id) thread_id
    FROM
        information_schema.innodb_trx i, (SELECT 
        id, time
    FROM
        information_schema.processlist
    WHERE
        time = (SELECT 
                MAX(time)
            FROM
                information_schema.processlist
            WHERE
                state = 'Waiting for table metadata lock'
                    AND SUBSTRING(info, 1, 5) IN ('alter' , 'optim', 'repai', 'lock ', 'drop ', 'creat'))) p
    WHERE
        TIMESTAMPDIFF(SECOND, i.trx_started, NOW()) > p.time
            AND i.trx_mysql_thread_id NOT IN (CONNECTION_ID() , p.id)) t;
```

执行 alter 的同时, kill 掉除了 select * from   INFORMATION_SCHEMA.innodb_trx里面除了 alter 以外的进程

`PS`:虽然mysql 5.7支持onlineDDL,但是实测修改数据类型的时候不支持DML.这个时候可以考虑使用[pt-online-schema-change](https://www.percona.com/doc/percona-toolkit/LATEST/pt-online-schema-change.html)

参考:
[pt-online-schema-change的原理解析与应用说明](https://www.cnblogs.com/xinysu/p/6758170.html)

* 允许 mysql 远程访问

    vi /etc/mysql/my.cnf
    ```
    [mysqld]
    bind-address    = 0.0.0.0
    ```

* 查看数据库大小

```sql
SELECT table_schema "DB Name",
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) "DB Size in MB" 
FROM information_schema.tables 
GROUP BY table_schema; 
```

* utf-8的表里面搜索带中文的数据

    select number from Chinese_Test where HEX(contents) REGEXP '^(..)*(E[4-9])';

the Chinese Character is from E4 to E9

## MySQL Workbech


* 允许update不where更新

    SET SQL_SAFE_UPDATES = 0;

* 客户端提示

    Error Code: 2013. Lost connection to MySQL server during query
    Error Code: 2006. MySQL server has gone away

    Go to Edit -> Preferences -> SQL Editor and set to a higher value this parameter: DBMS connection read time out (in seconds). For instance: 86400.

## 修改大数据表

1. 被修改的表 Table A 需要有一个记录时间戳的字段， 这个时间戳就是每次数据更新，都会更新的字段， 这个字段需要有索引，在django里可以使用 auto_now=True
2. 创建一个新的临时表 Table B， 不是tmp_table, 是一个新的表，但是是临时使用的。 这个表和要修改的表拥有一模一样的数据结构， 加上你要修改的部分， 比如增加的字段；
3. 记录下Table A 的索引
4. 删除 Table B 的全部索引
5. 把Table A 的数据全部复制到Table B, 是不是执行 INSERT INTO B(field1, field2) SELECT field1, field2 FROM A？ 当然不是， 这么做不还是锁死了Table A 么， 这里的迁移就是一个需要细分的地方，需要写一个脚本， 让程序每次读取比如5000条数据出来， 插入到Table B里面， 因为Table B 是没有索引的， 所以要当心不要使用多进程来做； 如果是多进程， 要确保插入到B的时候是不会有重复数据的； 如果是1000万的数据，每次5000条， 假设这个操作需要500ms， 那么 2000*200ms = 16 分钟。 这只是一个估值， 具体情况和服务器当时的情况有关， 不好细说。 另外， 我们要记录这个迁移开始的时间点，记为t1;
5 为B建立索引， 待索引全部好了之后， 再继续6
6. 那么这个时候Table A 的数据是不是都进入了Table B 呢， 应当说差不多大部分都进入了， 但5中说， 这大概需要16分钟， 这么长的时间里， 可能有新的数据进入了， 也有可能已有的数据发生了更新， 所以我们要把Table A 中在t1 之后发生变化的数据查找出来， 然后更新到Table B 中， 我们的做法是：
    ```
记录这个操作对应的时间点 t2
BEGIN;
DELETE FROM B WHERE updated_time > t1;
INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t1;
COMMIT;
    ```
7. 现在A 和 B 差不多該同步了吧？ 差不多了， 但是6 执行完之后， A仍然在写， 子子孙孙无穷尽也 ... , 但这个时候 A 和 B 的差异已经非常非常小了， 所以在下一步，我们在一个transaction 里执行下面的操作：
```
BEGIN;
DELETE FROM B WHERE updated_time > t2;
INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t2;

ALTER TABLE A RENAME TO C;
ALTER TABLE B RENAME TO A;
COMMIT;
```


## 忘记密码

* mysql 5.7 Ubuntu 64

```bash
sudo service mysql status
sudo service mysql stop
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld
sudo mysqld_safe --skip-grant-tables --skip-networking &  
```

```bash
mysql -u root --socket=/tmp/mysql.sock
```

```sql
use mysql; 
update user set authentication_string=PASSWORD("aaaaaaaaaaa") where User='root';
flush privileges;
```

```
sudo service mysql restart
```

## mysql查询技巧


```
explain  select sleep(1);

```
* explain 可以分析查询语句的性能
* sleep秒

```
set @current =0;
select @current :=@current +1;
```
* 在查询中可以通过使用:=对变量进行重新赋值


## mysql workbench优化

* 修改为F5执行选中当前选中语句

方法:修改C:\Program Files\MySQL\MySQL Workbench 6.3 CE\data\main_menu.xml里面的内容
```xml

        <value type="object" struct-name="app.MenuItem" id="com.mysql.wb.menu.query.execute_current_statementwin"> 
          <link type="object" key="owner" struct-name="app.MenuItem">com.mysql.wb.menu.query</link> 
          <value type="string" key="caption">Execute Current Statement</value> 
          <value type="string" key="name">query.execute_current_statement</value> 
          <value type="string" key="command">builtin:query.execute_current_statement</value> 
          <value type="string" key="itemType">action</value> 
          <value type="string" key="shortcut">F5</value>
          <value type="string" key="platform">windows</value>
        </value> 
```

## 查看数据库大小

```sql
SELECT table_schema 'DB Name',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 1)   MB
FROM information_schema.tables 
GROUP BY table_schema order by MB;
```


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
1. [MySQL索引原理及慢查询优化](https://yq.aliyun.com/articles/66680)
1. [Mysql 如何修改大数据表](https://www.v2ex.com/t/44841)
1. [MySQL 二进制日志(Binary Log)](https://blog.csdn.net/leshami/article/details/39801867)
1. [how-to-get-size-of-mysql-database](https://stackoverflow.com/questions/1733507/how-to-get-size-of-mysql-database)
1. [How to detect rows with chinese characters in MySQL?](https://stackoverflow.com/questions/9795137/how-to-detect-rows-with-chinese-characters-in-mysql)
1. [云数据库 RDS 版 > 技术运维问题 > MYSQL使用](https://help.aliyun.com/knowledge_list/41698.html)
1. [mysql: show processlist 详解](https://zhuanlan.zhihu.com/p/30743094)
1. [MySQL SHOW PROCESSLIST协助故障诊断](http://www.ywnds.com/?p=9337)
1. [解决mysqld_safe Directory '/var/run/mysqld' for UNIX socket file don't exists](http://blog.csdn.net/Z_YTTT/article/details/73650495)
1. [MySQL5.7更改密码时出现ERROR 1054 (42S22): Unknown column 'password' in 'field list'](http://blog.csdn.net/u010603691/article/details/50379282)
1. [create-user](https://www.yiibai.com/mysql/create-user.html)
1. [GRANT](https://www.yiibai.com/mysql/grant.html)
1. [privileges-provided](https://dev.mysql.com/doc/refman/5.7/en/privileges-provided.html#priv_all)
1. [MySQL用户管理：添加用户、授权、删除用户](https://www.cnblogs.com/chanshuyi/p/mysql_user_mng.html)
1. [详解慢查询](https://www.kancloud.cn/thinkphp/mysql-design-optimalize/39320)
1. []()
1. []()
1. []()
1. []()
1. []()
1. []()
1. []()



### 阿里云

1. [10分钟搭建MySQL Binlog分析+可视化方案](https://yq.aliyun.com/articles/338423)