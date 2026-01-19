![image](/img/in-post/improve-mysql/640.webp)

## Basic Steps for Slow Query Optimization

0. Run it first to see if it's really slow, note setting SQL_NO_CACHE
1. Single-table query with where conditions, lock the table with minimum returned records. This means applying all where clauses from the query statement starting from the table with the smallest number of returned records, query each field of the single table separately, and see which field has the highest distinctiveness
2. Use explain to view the execution plan, whether it matches expectation 1 (query starting from the table with fewer locked records)
3. For SQL statements in the form of order by limit, prioritize querying the sorted table
4. Understand the business usage scenario
5. When adding indexes, refer to the major principles of index creation
6. Observe results, if not meeting expectations, continue analyzing from 0

## MySQL Query Tips

### Analyze Queries

```sql
explain  select sleep(1);
```

* explain can analyze query statement performance
* sleep seconds

### Variable Assignment

```
set @current =0;
select @current :=@current +1;
```
* In queries, you can reassign variables using :=

### View Database Size

```sql
SELECT table_schema 'DB Name',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 1)   MB
FROM information_schema.tables
GROUP BY table_schema order by MB desc;
```

### Search for Chinese Data in utf-8 Tables

    select number from Chinese_Test where HEX(contents) REGEXP '^(..)*(E[4-9])';

the Chinese Character is from E4 to E9

## Some Tricks

### Don't Use "utf-8"

utf-8 is not true UTF-8, should use `utf8mb4` as replacement. There's a parameter `character_set_server` in the system, change it to `utf8mb4`

### Display Database Engines

    SELECT * FROM INFORMATION_SCHEMA.ENGINES;

### Display Long Transactions

    select * from information_schema.innodb_trx;

### Force Table Modification

During table modification, run:

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

While executing alter, kill processes other than `select * from INFORMATION_SCHEMA.innodb_trx` except alter

`PS`: Although mysql 5.7 supports onlineDDL, in practice modifying data types doesn't support DML. At this time, consider using [pt-online-schema-change](https://www.percona.com/doc/percona-toolkit/LATEST/pt-online-schema-change.html), see example at [pt-online-schema-change Usage, Limitations and Comparison](http://seanlook.com/2016/05/27/mysql-pt-online-schema-change/)

Reference:
[pt-online-schema-change Principle Analysis and Application Explanation](https://www.cnblogs.com/xinysu/p/6758170.html)

### Allow MySQL Remote Access

    vi /etc/mysql/my.cnf
    ```
    [mysqld]
    bind-address    = 0.0.0.0
    ```

### Modify Large Data Tables

1. The table to be modified Table A needs a field that records timestamps. This timestamp is a field that updates every time data is updated. This field needs an index. In django, you can use auto_now=True
2. Create a new temporary table Table B, not tmp_table, but a new table that's temporarily used. This table has the exact same data structure as the table to be modified, plus the parts you want to modify, such as added fields;
3. Record Table A's indexes
4. Delete all indexes from Table B
5. Copy all data from Table A to Table B. Should we execute INSERT INTO B(field1, field2) SELECT field1, field2 FROM A? Of course not, wouldn't that still lock Table A? The migration here is a place that needs subdivision. Write a script to have the program read, say, 5000 records at a time, and insert them into Table B. Because Table B has no indexes, be careful not to use multi-process; if multi-process, ensure there's no duplicate data when inserting into B; if it's 10 million records, 5000 at a time, assuming this operation takes 500ms, then 2000*200ms = 16 minutes. This is just an estimate, specific situations depend on the server's condition at the time, hard to detail. Also, we need to record the time point when this migration starts, denoted as t1;
5. Build indexes for B, wait until all indexes are ready, then continue with 6
6. So at this point, has all Table A's data entered Table B? Should say most of it has, but as mentioned in 5, this takes about 16 minutes. In such a long time, new data may have entered, or existing data may have been updated. So we need to find data in Table A that changed after t1, then update it to Table B. Our approach is:
    ```
    Record the time point corresponding to this operation t2
    BEGIN;
    DELETE FROM B WHERE updated_time > t1;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t1;
    COMMIT;
    ```
7. Now A and B should be pretty much synced, right? Pretty much, but after 6 executes, A is still writing, descendants endless... But at this point, the difference between A and B is very, very small. So in the next step, we execute the following operations in a transaction:
    ```
    BEGIN;
    DELETE FROM B WHERE updated_time > t2;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t2;

    ALTER TABLE A RENAME TO C;
    ALTER TABLE B RENAME TO A;
    COMMIT;
    ```

## MySQL Workbench

### Allow update without where

    SET SQL_SAFE_UPDATES = 0;

### Client Tips

    Error Code: 2013. Lost connection to MySQL server during query
    Error Code: 2006. MySQL server has gone away

    Go to Edit -> Preferences -> SQL Editor and set to a higher value this parameter: DBMS connection read time out (in seconds). For instance: 86400.

### Change to F5 Execute Currently Selected Statement

Method: Modify content in C:\Program Files\MySQL\MySQL Workbench 6.3 CE\data\main_menu.xml

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

## Troubleshooting

### Forgot Password

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

### Disk Full

Alibaba Cloud's RDS, when the disk is full, will show `--rds-read-drop-only` status. At this time, you can only read data or delete the database (after all, upgrading the disk requires a restart).

The fastest solution at this time is to delete the database.

Second best, transfer the database, then delete it.

Or optimize the data table structure during business low periods

```sql
SELECT 
    ROW_FORMAT,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    MAX_DATA_LENGTH,
    DATA_FREE,
    TABLE_SCHEMA,
    TABLE_NAME,
    ENGINE
FROM
    information_schema.TABLES
    order by data_free desc, TABLE_NAME

OPTIMIZE TABLE  db.tables

```

Release those invalid spaces

## References

1. [Table Locking Issues](https://dev.mysql.com/doc/refman/8.0/en/table-locking.html)
2. [privileges-provided](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
3. [RDS MySQL Metadata Lock Generation and Handling on Tables](https://help.aliyun.com/knowledge_detail/41723.html)
4. [MySQL Waiting for table metadata lock Causes and Solutions](https://www.cnblogs.com/digdeep/p/4892953.html)
5. [How to Allow Remote MySQL Database Connection](https://www.digitalocean.com/community/questions/how-to-allow-remote-mysql-database-connection)
6. [Solving Lost connection to MySQL server during query Error Method](https://blog.csdn.net/lovemysea/article/details/79121154)
7. [mysql show processlist Command Great Use](https://blog.csdn.net/juan083/article/details/54889893)
8. [Privileges Provided by MySQL](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
1. [Remember, Never Use "utf8" in MySQL](http://www.infoq.com/cn/articles/in-mysql-never-use-utf8-use-utf8)
1. [MySQL Index Principles and Slow Query Optimization](https://yq.aliyun.com/articles/66680)
1. [How to Modify Large Data Tables in Mysql](https://www.v2ex.com/t/44841)
1. [MySQL Binary Log (Binary Log)](https://blog.csdn.net/leshami/article/details/39801867)
1. [how-to-get-size-of-mysql-database](https://stackoverflow.com/questions/1733507/how-to-get-size-of-mysql-database)
1. [How to detect rows with chinese characters in MySQL?](https://stackoverflow.com/questions/9795137/how-to-detect-rows-with-chinese-characters-in-mysql)
1. [Cloud Database RDS Edition > Technical Operations Issues > MYSQL Usage](https://help.aliyun.com/knowledge_list/41698.html)
1. [mysql: show processlist Detailed Explanation](https://zhuanlan.zhihu.com/p/30743094)
1. [MySQL SHOW PROCESSLIST Assists Troubleshooting](http://www.ywnds.com/?p=9337)
1. [Solving mysqld_safe Directory '/var/run/mysqld' for UNIX socket file don't exists](http://blog.csdn.net/Z_YTTT/article/details/73650495)
1. [MySQL5.7 Error 1054 (42S22): Unknown column 'password' in 'field list' When Changing Password](http://blog.csdn.net/u010603691/article/details/50379282)
1. [create-user](https://www.yiibai.com/mysql/create-user.html)
1. [GRANT](https://www.yiibai.com/mysql/grant.html)
1. [privileges-provided](https://dev.mysql.com/doc/refman/5.7/en/privileges-provided.html#priv_all)
1. [MySQL User Management: Add Users, Grant Permissions, Delete Users](https://www.cnblogs.com/chanshuyi/p/mysql_user_mng.html)
1. [Detailed Explanation of Slow Queries](https://www.kancloud.cn/thinkphp/mysql-design-optimalize/39320)
1. [MySQL Database Optimization, This Article is Enough](https://mp.weixin.qq.com/s/69XIz-UhuQTZ44InJEL98w)

### Alibaba Cloud

1. [Parameter Tuning Suggestions](https://help.aliyun.com/document_detail/63255.html)
1. [10 Minutes to Build MySQL Binlog Analysis + Visualization Solution](https://yq.aliyun.com/articles/338423)
1. [How to Troubleshoot MySQL Instance Space Full Auto-Lock Causes](https://help.aliyun.com/knowledge_detail/51682.html)
