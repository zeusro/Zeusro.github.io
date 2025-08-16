---
layout:       post
title:        "安装蚂蚁笔记"
subtitle:     ""
date:         2018-06-23
author:       "Zeusro"
header-img:   "img/b/2018/psc.jpeg"
header-mask:  0.3
catalog:      true
published:   false
tags:
    - leanote
---

## 安装主题

```
wget -O leanote-linux-amd64-v2.6.1.bin.tar.gz https://sourceforge.net/projects/leanote-bin/files/2.6.1/leanote-linux-amd64-v2.6.1.bin.tar.gz/download
tar -xzvf leanote-linux-amd64-v2.6.1.bin.tar.gz


```


## mongodb

```

wget -O mongodb-linux-x86_64-3.6.3.tgz https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-3.6.3.tgz
tar -xzvf mongodb-linux-x86_64-3.6.3.tgz
mv  mongodb-linux-x86_64-3.6.3  mongodb-linux

vi /etc/profile
export PATH=$PATH:/mongodb-linux/bin
source /etc/profile

mkdir /mongoData

```

### 设置密码验证登录
```

mongod   --dbpath=/mongoData  --fork --logpath=/mongoLog/mongodb.log --storageEngine wiredTiger --journal


cd /mongodb-linux/bin            
./mongo   

 use admin;
 # 设置角色
db.createRole({role:'sysadmin',roles:[],privileges:[{resource:{anyResource:true},actions:['anyAction']}]})   

# 为admin数据库设置一个超级管理员账号与密码 
db.createUser({user:'god',pwd:'530cb1dd-cf40-4bcd-9408-fec8dbc6aa4c',roles:[{role:'sysadmin',db:'admin'}]});    

db.shutdownServer();  

quit()
```

### 初始化配置


#### 导入初始数据

```
mongorestore  -h localhost -d leanote --dir /leanote/mongodb_backup/leanote_install_data/

mongo
use leanote;
db.createUser({
    user: 'zzzz',
    pwd: '008103de-90c8-40e6-91df-effb12e51b93',
    roles: [{role: 'dbOwner', db: 'leanote'}]
});
db.auth("zzzz", "008103de-90c8-40e6-91df-effb12e51b93");

```

```bash
vi /leanote/conf/app.conf;
db.username=zzzz 
db.password=008103de-90c8-40e6-91df-effb12e51b93 
site.url=http://note.zeusro.tech
```

## 配置 Nginx

见
https://github.com/leanote/leanote/wiki/QA#2-%E9%85%8D%E7%BD%AEnginx

```bash

 vi /usr/local/nginx/conf/nginx.conf
 
 cd /usr/local/nginx/sbin/
./nginx -s reload
```

## 准备启动

```bash
cd /leanote/bin

nohup bash /leanote/bin/run.sh > /dev/null 2>&1 &


```

## 第一次使用

admin

abc123

记得上去重置demo这个默认创建的密码

还有就是关闭注册

## 参考链接

1. [tgz解压失败：gzip: stdin: not in gzip format](https://www.jianshu.com/p/660e8c5a3307)
2. [QA](https://github.com/leanote/leanote/wiki/QA)
3. [Leanote 二进制版详细安装教程 Mac and Linux](https://github.com/leanote/leanote/wiki/Leanote-%E4%BA%8C%E8%BF%9B%E5%88%B6%E7%89%88%E8%AF%A6%E7%BB%86%E5%AE%89%E8%A3%85%E6%95%99%E7%A8%8B----Mac-and-Linux)
