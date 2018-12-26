---
layout:       post
title:        "Elasticsearch性能优化"
subtitle:     ""
date:         2018-12-26
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Elasticsearch
---



使用routing明确数据对应的分片位置

[Elasticsearch的路由（Routing）特性](https://blog.csdn.net/cnweike/article/details/38531997)

### 参数的设置

对于 _all 这项参数，如果在业务使用上没有必要，我们通常的建议是禁止或者有选择性的添加。

- shard

建议在小规格节点下单shard大小不要超过30GB。更高规格的节点单shard大小不要超过50GB。

对于日志分析场景或者超大索引，建议单shard大小不要超过100GB。

shard的个数（包括副本）要尽可能匹配节点数，等于节点数，或者是节点数的整数倍。

通常我们建议单节点上同一索引的shard个数不要超5个。



### 查询优化

- 只选取必须的字段

就像在关系型数据库里面,不要`select * `一样.

    GET /product/goods/109524071?filter_path=_source.gid_unique

- 新建索引时关闭索引映射的自动映射功能

[index别名](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)



### 系统配置优化


```YML
thread_pool:
    bulk:
        queue_size: 2000
    search:
        queue_size: 2000
        
```        

[配置集群](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)

[更新集群配置](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)

[线程池配置](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)
