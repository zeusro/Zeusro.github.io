---
layout:       post
title:        "sqlserver"
subtitle:     ""
date:         2017-12-24
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - mac
---

# sqlserver 远程数据库复制

## 步骤

*. 启动 sql 代理

* 配置数据库复制
    遇到错误
    ![image](/img/in-post/sql-server/A5A3D9B1-4E94-434F-B0B5-62660F3C89A5.png)
    前往目标服务器查看错误日志

    ![image](/img/in-post/sql-server/0AB4A02E-D257-4496-9EBE-69726C311C37.png)
    这时按照参考链接5去操作一遍.

    重新选项时,勾选使用 sql 管理对象方法
    ![IMAGE](/img/in-post/sql-server/QQ20171224-140811.png)

* 成功啦(当然是假的图)
    ![IMAGE](/img/in-post/sql-server/QQ20171224-141343.png)
    

## 各种错误

### 18456
客户端是08的话,连不了高版本的数据库系统

解决方案:直接用2012的客户端去搞这个复制


![IMAGE](/img/in-post/sql-server/QQ20171224-143731.png)
前往目标数据库,在服务器根目录-sql server 代理-作业,右键查看历史记录,展开到最内部节点,可查阅到具体的错误信息,包括并不限于
* 源数据库视图/存储过程有误导入复制失败
* 源数据库的用户名在目标数据库不存在导致失败
...

*todo:等我有空了我再研究这他妈到底应该怎么弄*

经历过这以上种种蛋疼的错误之后,时间为数不多,我选择放弃,选择用数据导出以复制数据库


## 使用数据导出导出数据库
* 注意连接字符串,所用驱动信息
* 复制数据库,主键并不导入,如果需要主键,请在导入后自己指定创建的sql语句

推荐的步骤如下:
1. 导入数据表
1. 导入自定义类型
1. 导入视图,存储过程
1. 创建索引
1. 
1. 

**但是上述步骤一多难免遗忘,我觉得还是要找些更好的方式导出比较好**

## 其他需要说明的点
1. 复制是整个数据库进行复制,不像导出数据库那么灵活
1. 选择错误的选项可能导致数据库无法联机,选的时候要慎重


## sqlserver 全局变量

```sql
select APP_NAME ( )  --当前会话的应用程序
select @@IDENTITY   --返回最后插入的标识值 
select USER_NAME()    --返回用户数据库用户名
SELECT @@CONNECTIONS  --返回自上次SQL启动以来连接或试图连接的次数。 
SELECT GETDATE() --当前时间 
SELECT @@CPU_BUSY/100  --返回自上次启动SQL 以来 CPU 的工作时间，单位为毫秒
USE tempdb SELECT @@DBTS    --为当前数据库返回当前 timestamp 数据类型的值。这一 timestamp 值保证在数据库中是唯一的。 
select @@IDENTITY  --返回最后插入的标识值 
SELECT @@IDLE    --返回SQL自上次启动后闲置的时间，单位为毫秒 
SELECT @@IO_BUSY    --返回SQL自上次启动后用于执行输入和输出操作的时间，单位为毫秒 
SELECT @@LANGID    --返回当前所使用语言的本地语言标识符(ID)。 
SELECT @@LANGUAGE    --返回当前使用的语言名 
SELECT @@LOCK_TIMEOUT   --当前会话的当前锁超时设置，单位为毫秒。 
SELECT @@MAX_CONNECTIONS    --返回SQL上允许的同时用户连接的最大数。返回的数不必为当前配置的数值 
EXEC sp_configure  --显示当前服务器的全局配置设置 
SELECT @@MAX_PRECISION  --返回 decimal 和 numeric 数据类型所用的精度级别，即该服务器中当前设置的精度。默认最大精度38。 
select @@OPTIONS    --返回当前 SET 选项的信息。 
SELECT @@PACK_RECEIVED   --返回SQL自启动后从网络上读取的输入数据包数目。 
SELECT @@PACK_SENT   --返回SQ自上次启动后写到网络上的输出数据包数目。 
SELECT @@PACKET_ERRORS   --返回自SQL启动后，在SQL连接上发生的网络数据包错误数。 
SELECT @@SERVERNAME  --返回运行SQL服务器名称。 
SELECT @@SERVICENAME   --返回SQL正在其下运行的注册表键名 
SELECT @@TIMETICKS   --返回SQL服务器一刻度的微秒数 
SELECT @@TOTAL_ERRORS   --返回 SQL服务器自启动后，所遇到的磁盘读/写错误数。 
SELECT @@TOTAL_READ    --返回 SQL服务器自启动后读取磁盘的次数。 
SELECT @@TOTAL_WRITE   --返回SQL服务器自启动后写入磁盘的次数。 
SELECT @@TRANCOUNT    --返回当前连接的活动事务数。 
SELECT @@VERSION   --返回SQL服务器安装的日期、版本和处理器类型。 

```

## 参考链接:
1. [Configure SQL Server Agent](https://docs.microsoft.com/zh-cn/sql/ssms/agent/configure-sql-server-agent)
1. [使用复制数据库向导](https://docs.microsoft.com/zh-cn/sql/relational-databases/databases/use-the-copy-database-wizard)
1. [查看 SQL Server 错误日志](https://docs.microsoft.com/zh-cn/sql/relational-databases/performance/view-the-sql-server-error-log-sql-server-management-studio)
1. [SQL SERVER 2008复制数据库时发生执行SQL Server代理作业错误](http://www.cnblogs.com/rainman/p/5948827.html)
1. []()
1. []()