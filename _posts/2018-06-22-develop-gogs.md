---
layout:       post
title:        "CentOS7安装维护gogs"
subtitle:     ""
date:         2018-06-22
author:       "Zeusro"
header-img:   "img/b/2018/psc.jpeg"
header-mask:  0.3
catalog:      true
published:   false
tags:
    - Gogs
---

## 添加 gogs 专用用户


```
sudo adduser gogs
su gogs
```

## 初始化安装MariaDB
5.5.56-MariaDB
```
yum install -y mariadb mariadb-server
use mysql;  
update user set password=password("这里替换成你的密码")where user='root';
flush privileges;
exit
```
```
mysql -uroot -pyxssb
CREATE DATABASE `gogs` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
delete database `gogs`;
mysql -uroot -p < /gogs/scripts/mysql.sql
```

### 为 gogs 配置mysql账户和密码

```
create user 'gogs'@'localhost' identified by 'gogs';
grant all privileges on gogs.* to 'gogs'@'localhost';
flush privileges;
exit;
```

## 下载安装配置 Nginx


### 安装和启动
prce(重定向支持)和openssl(https支持，如果不需要https可以不安装。)
```
 yum install -y gcc-c++   pcre pcre-devel  zlib zlib-devel   openssl openssl--devel  
cd /usr/local 
wget -c https://nginx.org/download/nginx-1.12.2.tar.gz
tar -zxvf nginx-1.12.2.tar.gz  
rm -f nginx-1.12.2.tar.gz  
cd  nginx-1.12.2
./configure
```
然后会出现以下结果
```
......
Configuration summary
  + using system PCRE library
  + OpenSSL library is not used
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/local/nginx/sbin/nginx"
  nginx modules path: "/usr/local/nginx/modules"
  nginx configuration prefix: "/usr/local/nginx/conf"
  nginx configuration file: "/usr/local/nginx/conf/nginx.conf"
  nginx pid file: "/usr/local/nginx/logs/nginx.pid"
  nginx error log file: "/usr/local/nginx/logs/error.log"
  nginx http access log file: "/usr/local/nginx/logs/access.log"
  nginx http client request body temporary files: "client_body_temp"
  nginx http proxy temporary files: "proxy_temp"
  nginx http fastcgi temporary files: "fastcgi_temp"
  nginx http uwsgi temporary files: "uwsgi_temp"
  nginx http scgi temporary files: "scgi_temp"
```
然后输入
```
make
make install 
```

如果没有报错，顺利完成后，最好看一下nginx的安装目录
```
whereis nginx   
```
### 为 gogs 配置反向代理

vi  /usr/local/nginx/conf/nginx.conf
```
server {
    listen 12306;
    server_name git.crystalnetwork.us;

    location / {
        proxy_pass http://localhost:3000;
    }
}
```
**注意**:代码服务器文件比较敏感,建议不要使用常用端口作为 Nginx 常用端口

### 启动和停止 Nginx
```
cd /usr/local/nginx/sbin/
./nginx 
./nginx -s stop
./nginx -s quit
./nginx -s reload
./nginx -s quit: 此方式停止步骤是待nginx进程处理任务完毕进行停止。
./nginx -s stop: 此方式相当于先查出nginx进程id再使用kill命令强制杀掉进程。
```

### 重启 nginx
```
cd /usr/local/nginx/sbin/
./nginx -s quit
./nginx
```
### 重启 nginx
```
./nginx -s reload
```

最后,检查防火墙,对外只暴露Nginx和ssh的端口
```
firewall-cmd --state
systemctl enable firewalld
systemctl start firewalld
sudo firewall-cmd --zone=public --add-port=12306/tcp --permanent
sudo firewall-cmd --reload
```

sudo firewall-cmd --permanent --zone=public --add-port=3306 /tcp
sudo firewall-cmd --reload

## 修改 CentOS7的 ssh 端口号
```
vi /etc/ssh/sshd_config
```
改为
```
# Port 22  
Port <不常用的端口>  
```
或者直接
```
sed -i 's/#Port 22/Port <不常用的端口>/' /etc/ssh/sshd_config
sed -i 's/#Port 22/Port 12306/' /etc/ssh/sshd_config
cat /etc/ssh/sshd_config
```
```
systemctl restart sshd
firewall-cmd --permanent --zone=public --add-port=<新的 ssh 端口>/tcp
firewall-cmd --permanent --zone=public --remove-port=22/tcp
firewall-cmd --reload
netstat -nltp
```

## 关闭selinux
```
vi /etc/selinux/config
# SELINUX=enforcing
SELINUX=disabled
```

## 二进制安装gogs
```
wget -c  https://dl.gogs.io/0.11.34/linux_amd64.zip
unzip /linux_amd64.zip 
rm -f /linux_amd64.zip
nohup ./gogs web > /dev/null 2>&1 &
```

## 疑难问题


* 无效的日志路径：mkdir /gogs/log: permission denied

```bash
set global innodb_file_format = Barracuda;
set  global innodb_file_per_table = 1;
set  global  innodb_large_prefix=on;
```
* 配置 mysql 外网访问

http://blog.sina.com.cn/s/blog_5da16ee20102x47h.html

```
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'root' WITH GRANT OPTION;
UPDATE user SET Host='192.168.1.100' WHERE User='root' AND Host='localhost' LIMIT 1;
```
## 折腾配置

官网这个[文件](https://github.com/gogits/gogs/blob/master/conf/app.ini)详细注释了各个注释的作用

### 邮件系统, form 可以玩出花样
```
HOST    = smtp.qq.com:465
FROM    = rm-rf./*--no-preserve-root<sb@sb.com>
```
这样配的话就是sb@sb.com发出去,显示的收件人叫rm-rf./*--no-preserve-root


### 初始化配置(不建议)
```
rm -f -r /gogs/custom/
```

### domain
这个一定要配好,默认是 localhost, 要改成外网 ip




## 参考链接:
1. [使用 Gogs 搭建自己的 Git 服务器
](https://blog.mynook.info/post/host-your-own-git-server-using-gogs/)
2. [CentOS / RHEL 7 64 bits](https://packager.io/gh/pkgr/gogs/builds/686/install/centos-7)
3. [CentOS7安装维护Nginx](https://segmentfault.com/a/1190000008866185)
4. [linux nginx多站点
配置](http://blog.csdn.net/zhenxino8/article/details/38709257)
5. [CentOS 7开放端口和关闭防火墙](https://www.jianshu.com/p/bad33004bb4f)
6. [FAQs](https://gogs.io/docs/intro/faqs)
7. [怎样修改 CentOS 7 SSH 端口](https://sebastianblade.com/how-to-modify-ssh-port-in-centos7/)
8. [一步搞定私有Git服务器部署(Gogs)](https://www.jianshu.com/p/424627516ef6)
9. [手把手教学–ubuntu安装gogs实现自己的代码管理](http://blog.csdn.net/mr__g/article/details/74979995)
10. [The maximum column size is 767 bytes (Mysql)](http://www.cnblogs.com/cbugs/p/6887955.html)
11. [Configuration Cheat Sheet](https://gogs.io/docs/advanced/configuration_cheat_sheet)

