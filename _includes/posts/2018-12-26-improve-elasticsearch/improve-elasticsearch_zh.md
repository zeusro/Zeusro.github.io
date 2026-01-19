使用routing明确数据对应的分片位置

[Elasticsearch的路由（Routing）特性](https://blog.csdn.net/cnweike/article/details/38531997)




## 性能减低的原因

1. Your clients are simply sending too many queries too quickly in a fast burst, overwhelming the queue. You can monitor this with Node Stats over time to see if it's bursty or smooth
1. You've got some very slow queries which get "stuck" for a long time, eating up threads and causing the queue to back up. You can enable the slow log to see if there are queries that are taking an exceptionally long time, then try to tune those
1. There may potentially be "unending" scripts written in Groovy or something. E.g. a loop that never exits, causing the thread to spin forever.
1. Your hardware may be under-provisioned for your workload, and bottlenecking on some resource (disk, cpu, etc)
1. A temporary hiccup from your iSCSI target, which causes all the in-flight operations to block waiting for the disks to come back. It wouldn't take a big latency hiccup to seriously backup a busy cluster... ES generally expects disks to always be available.
1. Heavy garbage collections could cause problems too. Check Node Stats to see if there are many/long old gen GCs running

这段E文，无非就是说，你的机器太low，你查的过多, `Mysql` 的经验同样适用于ES。

## 节点的选择

自己玩就别整那么多节点了,`Elasticsearch`是内存杀手.

资源紧张的话，`coordinating` , `data` 和 `ingest` 可以合起来。

### coordinating

协调节点是请求的入口

```
node.master:false
node.data:false
node.ingest:false
```

### master

选主,决定分片位置

```
node.master:true
node.data:false
node.ingest:false
```

### data

存放分片的节点

```
node.master:false
node.data:true
node.ingest:false
```

### ingest

ingest节点负责处理pipeline

```
node.master:false
node.data:false
node.ingest:true
```

## 系统配置优化

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

queue_size 是并发查询的限制,默认是1000,不同的版本名称可能略有区别,线程池的参数可以直接附在启动参数里面(毕竟挂载配置文件对我来说也是一种麻烦)

参考:

1. [配置集群](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)
1. [更新集群配置](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)
1. [线程池配置](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)


## Index配置优化

### shard

建议在小规格节点下单shard大小不要超过30GB。更高规格的节点单shard大小不要超过50GB。

对于日志分析场景或者超大索引，建议单shard大小不要超过100GB。

shard的个数（包括副本）要尽可能匹配节点数，等于节点数，或者是节点数的整数倍。

通常我们建议单节点上同一索引的shard个数不要超5个。


## 查询优化

对于 _all 这项参数，如果在业务使用上没有必要，我们通常的建议是禁止或者有选择性的添加。

### 只选取必须的字段

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

### 新建索引时关闭索引映射的自动映射功能

[index别名](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)

## 其他经验

按照实际经验,elasticsearch多半是index的时候少,search的时候多,所以针对search去做优化比较合适.

### 日志的最佳实践

如果日志丢了也无所谓,建议用1节点0副本分片储存日志.

日志 index 用 `xx-<date>` ,这样删除的时候直接删 index 就行

delete by query 的我表示每次都想死...

```
POST /tracing/_delete_by_query?conflicts=proceed
{
	"query": {
		"range": {
			"@timestamp": {
				"lt": "now-90d",
				"format": "epoch_millis"
			}
		}
	}
}

GET /_tasks?&actions=*delete*
```

## 故障维护

### Unassigned Shards

`解决方案:`新建一个`number_of_replicas`为0的新index,然后用`_reindex`.迁移完成之后,把`number_of_replicas`改回去.`reindex`有个`size`的参数,按需配置或许更快些.

**注意**可以通过`GET _tasks?actions=indices:data/write/reindex?detailed`查看相关任务

参考
1. [Elasticsearch Reindex 性能提升10倍](https://my.oschina.net/TOW/blog/1928075)
1. [解决elasticsearch集群Unassigned Shards 无法reroute的问题](https://www.jianshu.com/p/542ed5a5bdfc)
1. [tasks API](https://www.elastic.co/guide/en/elasticsearch/reference/current/tasks.html)

### reindex

reindex也是有技巧的。

```bash
# 禁用副本
put geonames/_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
# 禁用刷新期间，_count结果不更新
json='{"index":{"refresh_interval":"-1"}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json

# 中途想取消也行
curl -XPOST 0.0.0.0:9200/_tasks/mHCg6HqYTqqd12nIDFDk1w:2977/_cancel

# 恢复刷新机制
json='{"index":{"refresh_interval":null}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json
```

### gc overhead

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

- 滚动重启

[_rolling_restarts](https://www.elastic.co/guide/en/elasticsearch/guide/current/_rolling_restarts.html)

- 慢日志分析

慢日志分搜索和索引两种,并且可以从index,或者cluster级别进行设置

```bash
PUT _settings
{
        "index.indexing.slowlog.threshold.index.debug" : "10ms",
        "index.indexing.slowlog.threshold.index.info" : "50ms",
        "index.indexing.slowlog.threshold.index.warn" : "100ms",
        "index.search.slowlog.threshold.fetch.debug" : "100ms",
        "index.search.slowlog.threshold.fetch.info" : "200ms",
        "index.search.slowlog.threshold.fetch.warn" : "500ms",
        "index.search.slowlog.threshold.query.debug" : "100ms",
        "index.search.slowlog.threshold.query.info" : "200ms",
        "index.search.slowlog.threshold.query.warn" : "1s"
}
```

参考链接:

1. [ES 慢查询收集总结](http://www.fblinux.com/?p=1334)
1. [使用reroute手动转移分片](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-reroute.html)

### No alive nodes found in your cluster

这个要具体分析，看看ES的日志。有可能是并发连接数1000限制导致的问题。

## 参考工具

[elasticHQ](http://www.elastichq.org/)

## 参考链接:
1. [如何使用Elasticsearch构建企业级搜索方案？](https://zhuanlan.zhihu.com/p/29449979)
1. [滴滴Elasticsearch多集群架构实践](https://mp.weixin.qq.com/s/K44-L0rclaIM40hma55pPQ)
1. [从平台到中台：Elaticsearch 在蚂蚁金服的实践经验](https://www.infoq.cn/article/IfwCVj-qJ4TU0dmBZ177)
1. [为什么Elasticsearch查询变得这么慢了？](https://blog.csdn.net/laoyang360/article/details/83048087)
1. [通过某瓣真实案例看Elasticsearch优化](https://www.dongwm.com/post/elasticsearch-performance-tuning-practice-at-douban/#%E5%89%8D%E8%A8%80)
1. []()