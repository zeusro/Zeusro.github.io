---
layout:       post
title:        "nginx-brotli实验"
subtitle:     ""
date:         2018-07-05
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - nginx
    - docker
    - brotli
---


## 前期准备

1. docker-compose
1. [AdminLTE](https://github.com/almasaeed2010/AdminLTE)
1. https证书
1. 一个域名
1. 源站服务器
1. 

只有以 https协议访问网站时,才会有`Accept-Encoding: gzip, deflate, br`,所以上述准备缺一不可.

我使用了[AdminLTE](https://github.com/almasaeed2010/AdminLTE) 作为页面测试.

## 服务器配置

```
实例规格： ecs.sn1ne.xlarge
实例规格族： 计算网络增强型
镜像ID： ubuntu_16_0402_64_20G_al...
CPU： 4核
内存： 8 GB
实例类型： I/O优化
操作系统： Ubuntu 16.04 64位
带宽计费方式： 按固定带宽
当前使用带宽： 75Mbps
```

## 客户端

企业电信300M光纤

## docker-compose.yaml

```yaml
nginx-brotli:
  container_name: nginx-brotli
  image: 'fholzer/nginx-brotli:latest'
  ports:
    - "8080:80"
  restart: always
  volumes:
    - '/fordocker/nginx.conf:/etc/nginx/nginx.conf:ro'
    - '/fordocker/AdminLTE-3.0.0-alpha.2/:/usr/share/nginx/html:ro'

```

## nginx.conf

```conf

user  nginx;
worker_processes  1;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log  /var/log/nginx/access.log  main;
    root   /etc/nginx/html;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    gzip  on;
    include /etc/nginx/conf.d/*.conf;

    brotli on;
    brotli_static always;
    brotli_comp_level 6;
    brotli_types *;

}
```

* 用到的命令

```bash
ls /usr/share/nginx/html
cd /fordocker
nano nginx.conf
docker-compose exec nginx-brotli ls /usr/share/nginx/html
docker-compose logs nginx-brotli
docker-compose restart
netstat -nltp | grep 80
```

```bash
export url=''
echo $url
echo '待测url:'$url
curl -vo /dev/null $url -H "Accept-Encoding: br" -w "cost time: %{time_total}\n"
curl -vo /dev/null $url -H "Accept-Encoding: gzip" -w "cost time: %{time_total}\n"
curl -vo /dev/null $url -w "cost time: %{time_total}\n"
```

## 对照结果

测试的时候要给 nginx 一个预热的时间,先开 disable chache, 然后刷新十次左右.之后多次测量求平均值

### gzip on

    gzip on

![image](/img/in-post/nginx-brotli/gzip.png)

```
1330
1240
1200
829
1580
813
929
996
899
907
```

* 加载时间平均值:1072.3
* 页面总大小1.4MB

### br 6

```
    brotli on;
    brotli_static always;
    brotli_comp_level 6;
    brotli_types *;
```

![image](/img/in-post/nginx-brotli/br-06.png)

```
857
1200
855
854
865
1220
854
983
1280
1210
```

* 加载时间平均值:1017.8
* 页面总大小655kb

### br 7

```
    brotli on;
    brotli_static always;
    brotli_comp_level 7;
    brotli_types *;
```

![image](/img/in-post/nginx-brotli/br-07.png)

```
854
836
964
868
931
829
877
892
1370
933
```

* 加载时间平均值:935.4
* 页面总大小653kb




### br 8

```
    brotli on;
    brotli_static always;
    brotli_comp_level 8;
    brotli_types *;
```

![image](/img/in-post/nginx-brotli/br-08.png)

```
779
906
893
958
831
827
900
830
831
866
```

* 加载时间平均值:862.1
* 页面总大小652kb

### br 10

```
    brotli on;
    brotli_static always;
    brotli_comp_level 10;
    brotli_types *;
```

![image](/img/in-post/nginx-brotli/br-10.png)


```
1660
1720
1750
1640
1750
1640
1700
1710
1680
1730
```

* 加载时间平均值:1698
* 页面总大小633kb


## 结论


 content-encoding|加载时间平均值(ms)平均值|页面总大小
 --|--|--
 gzip|1072.3|1.4MB
 br-6|1017.8|655kb
 br-7|935.4|653kb
 br-8|862.1|652kb
 br-10|1698|633kb
用平均值去计算 br 编码其实不公平的,在实验中,我发现有些文件是干扰变量,用的 gzip 编码.那么再加上这个考量,结合服务器的压缩时间,我觉得 `brotli_comp_level` 设置 **6** ~ **8** 会比较合适.

不得不说,谷歌爸爸就是叼


1. [Nginx 容器教程](http://www.ruanyifeng.com/blog/2018/02/nginx-docker.html)
2. [fholzer/docker-nginx-brotli](https://github.com/fholzer/docker-nginx-brotli)
3. [https://hub.docker.com/r/fholzer/nginx-brotli/tags/](https://hub.docker.com/r/fholzer/nginx-brotli/tags/)
4. [google/ngx_brotli](https://github.com/google/ngx_brotli)
5. [nginx](https://hub.docker.com/_/nginx/)
6. [启用 Brotli 压缩算法，对比 Gzip 压缩 CDN 流量再减少 20%](https://tech.upyun.com/article/257/%E5%90%AF%E7%94%A8%20Brotli%20%E5%8E%8B%E7%BC%A9%E7%AE%97%E6%B3%95%EF%BC%8C%E5%AF%B9%E6%AF%94%20Gzip%20%E5%8E%8B%E7%BC%A9%20CDN%20%E6%B5%81%E9%87%8F%E5%86%8D%E5%87%8F%E5%B0%91%2020%25.html)
7. [又拍云 CDN 支持了 Brotli 了！](https://blog.upyun.com/?p=1769)
8. [Brotli and Static Compression](https://css-tricks.com/brotli-static-compression/)
9. [Static site implosion with Brotli and Gzip](https://www.voorhoede.nl/en/blog/static-site-implosion-with-brotli-and-gzip/)
1. [Brotli Accept-Encoding/Content-Encoding](https://caniuse.com/#feat=brotli)
1. [Static site implosion with Brotli and Gzip](https://www.voorhoede.nl/en/blog/static-site-implosion-with-brotli-and-gzip/)