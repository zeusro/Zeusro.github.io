---
layout:       post
title:        "迁移GitHub page到新域名"
subtitle:     ""
date:         2019-10-28
author:       "Zeusro"
header-img:   "img/b/2019/Silver-Days.jpg"
header-mask:  0.3
catalog:      true
tags:
---

手贱买了个[新域名](www.zeusro.com),于是博客也要改下设置.由于之前一直用阿里云解析,现在顺带转移给 cloudflare.

1. 修改GitHub page 的setting,custom domain 改成新域名,并取消掉 enforce https (cloudflare自带证书)
1. 找个服务器监听80端口,把旧域名的流量全部301到新域名,这里我用了docker nginx 来做
1. 设置搜索引擎,迁移站点.如果之前还监听了HTTPS,HTTPS也要301跳转

```yaml
version: '2.2'
services:
    blog:
      image: nginx
      ports:
      - "80:80"
      - "443:443"
      volumes:
      - "/root/migrate/nginx.conf:/etc/nginx/nginx.conf"
```

```conf
user  nginx;
worker_processes auto;
pid /run/nginx.pid;
#daemon off;

events {
        worker_connections 768;
        multi_accept on;
}

http {

server {
    listen       80 ;
    server_name  www.zeusro.tech zeusro.tech;
    return       301 https://www.zeusro.com$request_uri;
}

}
```