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

```    
GET /product/goods/109524071?filter_path=_source.zdid
{
  "_source" : {
    "zdid" : 48
  }
}
```

类似的用法还有`_source`,但是与`filter_path`不同的在于,返回的结果会带上文档本身的默认字段

```
GET /product/goods/109524071?_source_include=zdid
{
  "_index" : "product",
  "_type" : "goods",
  "_id" : "109524071",
  "_version" : 4,
  "found" : true,
  "_source" : {
    "zdid" : 48
  }
}
````

```
_source=false
_source_include=zdid
_source_exclude
```

**注意:_source和filter_path不能一起用**

- 新建索引时关闭索引映射的自动映射功能

[index别名](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)



### 系统配置优化


```YML
thread_pool:
    bulk:
        queue_size: 2000
    search:
        queue_size: 2000
indices:
  query:
    bool:
      max_clause_count: 50000
  recovery:
    max_bytes_per_sec:

        
```        

[配置集群](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)

[更新集群配置](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)

[线程池配置](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)


### 其他经验

按照实际经验,elasticsearch多半是index的时候少,search的时候多,所以针对search去做优化比较合适.

### 常用查询技巧

```
error_trace=true
pretty=true
human=true
_stored_fields=tags,counter
```

## 故障维护

- Unassigned Shards

`解决方案/问题根源:`直接用`_reindex`

[解决elasticsearch集群Unassigned Shards 无法reroute的问题](https://www.jianshu.com/p/542ed5a5bdfc)

- gc overhead

```
[2019-01-04T08:41:09,538][INFO ][o.e.m.j.JvmGcMonitorService] [elasticsearch-onekey-3] [gc][159] overhead, spent [276ms] collecting in the last [1s]
```

`解决方案/问题根源:`集群负荷过重,宕机了

- index长时间yellow

`解决方案/问题根源:`先把`number_of_replicas`调成0,再调回去,手动触发同步.

```
put geonames/_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
```
## 参考工具

[elasticHQ](http://www.elastichq.org/)

参考链接:
1. [如何使用Elasticsearch构建企业级搜索方案？](https://zhuanlan.zhihu.com/p/29449979)