---
layout:       post
title:        "php-fpm优化"
subtitle:     ""
date:         2019-11-25
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - php
    - DevOps
---


最近发现网站总是出问题,具体特征是并发连接数在整点时陡然升高,看了一下网站并发,新建连接数其实很少,推测后端程序php-fpm的问题

## docker 系统镜像的优化

可以参考 [lnmp高并发优化简介](https://www.8090st.com/lnmp-youhua.html)
和参考链接里面的资料,从 nginx , 内核 以及 php-fpm.conf 下手,指定对应的方案.

## 优化后的 php-fpm.conf

```conf
[www]
user = nobody
group = nobody
listen = [::]:9000
chdir = /application
# 动态线程
pm = dynamic
pm.max_children = 200
pm.start_servers = 20
pm.max_requests = 10240
pm.min_spare_servers = 20
pm.max_spare_servers = 200
catch_workers_output = Yes

request_terminate_timeout = 50s

```

max_execution_time 这个配置在php.ini中；php-fpm 的 request_terminate_timeout，在php-fpm.conf中。当以 php-fpm 提供服务时，request_terminate_timeout 设置会覆盖 max_execution_time 的设置，因此我们这里只测试 request_terminate_timeout。

之前的配置忽略了`request_terminate_timeout`这个配置,而`request_terminate_timeout`默认是无限等待的现在把它加上去,让 php-fpm 能够自动终止连接

```
# request_slowlog_timeout = 2
# slowlog = /var/log/php7/slow.log
```

坑爹的是,php-fpm.conf文件是不能注释的

## 代码层面的优化

### 取消`file_get_contents`的调用,转而用 curl 库.

### 分析慢日志

```bash
# 取前五十条慢日志分析
/application # grep -v "^$" /var/log/php7/slow.log | cut -d " " -f 3,2 | sort | uniq -c | sort -k1,1nr | head -n 50
  27314 = /application/public/index.php
  27115 run() /application/thinkphp/start.php:19
  27113 [INCLUDE_OR_EVAL]() /application/public/index.php:17
  26607 exec() /application/thinkphp/library/think/App.php:139
  26607 module() /application/thinkphp/library/think/App.php:456
  25758 invokeArgs() /application/thinkphp/library/think/App.php:343
  25758 invokeMethod() /application/thinkphp/library/think/App.php:611
  21076 get() /application/vendor/marlon/thinkphp-redis/src/RedisPro.php:73
  19256 item() /application/thinkphp/library/think/App.php:343
  18706 get() /application/extend/util/RedisCacheUtil.php:12
  15410 getCacheAdvertList() /application/extend/service/Advert/AdvertSource.php:1150
  15395 get() /application/extend/service/Advert/AdvertSource.php:1206
  13852 commonGetAdvertListByPage() /application/extend/service/Advert/AdvertSource.php:344
  13852 getListByProductDetail() /application/application/main/controller/Good.php:1087
```

`/application/thinkphp/*` 都是框架内部问题.

后边分析代码发现是 redis 读取缓慢,于是进入方法内部,看看是怎么一个情况,结果我惊呆了,发现一个函数是这样写的


```
protected function getCacheAdvertList($keyList)
    {
        $advertList = [];
        foreach ($keyList as $ruleName => $key) {
            $advert = RedisCacheUtil::get($key);
            $advertList[$ruleName] = $advert !== false ? $advert : [];
            $advertList[$ruleName] = $this->formatAdvert($advertList[$ruleName]);
        }

        return $advertList;
    }
```

我结合上下文和具体数据分析后发现,传入的$keyList长度上百,也就是说,单单这个功能,就要访问串行访问redis 100 多次.


## 最后

改代码是不大可能的,我观察到服务器的规格是ecs.sn2.medium,带宽500Mb/s,问题出现时,机器内网带宽总是跑满,甚至升到600Mb/s.于是升级服务器规格,提高到1.5Gb/s,问题解决.

不过到最后还是没找到网站并发周期性升高的原因(机器配置升高后问题依旧还在,只是不再那么明显).

总结一句话就是 **能用钱解决的问题都不叫问题!**

## 参考链接

1. [nginx 502 和 504 超时演示](https://juejin.im/post/5b54635ae51d451951133d85)
1. [PHP-php-fpm配置优化](https://www.cnblogs.com/cocoliu/p/8566193.html)
1. [php-fpm.conf 全局配置段](https://www.php.net/manual/zh/install.fpm.configuration.php)
1. [php-fpm 与 Nginx优化总结](https://www.kancloud.cn/digest/php-src/136260)
1. [你确定你真的懂Nginx与PHP的交互？](https://zhuanlan.zhihu.com/p/33725635)
1. [php-fpm.conf重要参数详解](https://blog.csdn.net/sinat_22991367/article/details/73431269)
2. [为高性能优化 PHP-FPM](https://learnku.com/php/t/34358)