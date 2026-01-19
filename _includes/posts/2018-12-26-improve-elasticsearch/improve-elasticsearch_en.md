Use routing to specify the shard location for data

[Elasticsearch Routing Feature](https://blog.csdn.net/cnweike/article/details/38531997)




## Reasons for Performance Degradation

1. Your clients are simply sending too many queries too quickly in a fast burst, overwhelming the queue. You can monitor this with Node Stats over time to see if it's bursty or smooth
1. You've got some very slow queries which get "stuck" for a long time, eating up threads and causing the queue to back up. You can enable the slow log to see if there are queries that are taking an exceptionally long time, then try to tune those
1. There may potentially be "unending" scripts written in Groovy or something. E.g. a loop that never exits, causing the thread to spin forever.
1. Your hardware may be under-provisioned for your workload, and bottlenecking on some resource (disk, cpu, etc)
1. A temporary hiccup from your iSCSI target, which causes all the in-flight operations to block waiting for the disks to come back. It wouldn't take a big latency hiccup to seriously backup a busy cluster... ES generally expects disks to always be available.
1. Heavy garbage collections could cause problems too. Check Node Stats to see if there are many/long old gen GCs running

This English text basically says: your machine is too low-end, you're querying too much. `MySQL` experience also applies to ES.

## Node Selection

If you're just playing around, don't create so many nodes. `Elasticsearch` is a memory killer.

If resources are tight, `coordinating`, `data`, and `ingest` can be combined.

### coordinating

Coordinating nodes are the entry point for requests

```
node.master:false
node.data:false
node.ingest:false
```

### master

Elect master, decide shard locations

```
node.master:true
node.data:false
node.ingest:false
```

### data

Nodes that store shards

```
node.master:false
node.data:true
node.ingest:false
```

### ingest

Ingest nodes are responsible for processing pipelines

```
node.master:false
node.data:false
node.ingest:true
```

## System Configuration Optimization

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

queue_size is the limit for concurrent queries, default is 1000. Different versions may have slightly different names. Thread pool parameters can be directly attached to startup parameters (after all, mounting config files is also a hassle for me).

Reference:

1. [Configuring Clusters](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)
1. [Updating Cluster Configuration](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)
1. [Thread Pool Configuration](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)


## Index Configuration Optimization

### shard

It's recommended that single shard size should not exceed 30GB on small nodes. On higher-spec nodes, single shard size should not exceed 50GB.

For log analysis scenarios or very large indices, it's recommended that single shard size should not exceed 100GB.

The number of shards (including replicas) should match the number of nodes as much as possible, equal to the number of nodes, or an integer multiple of the number of nodes.

Usually we recommend that the number of shards for the same index on a single node should not exceed 5.


## Query Optimization

For the `_all` parameter, if it's not necessary in business use, our usual recommendation is to disable it or add it selectively.

### Only Select Required Fields

Just like in relational databases, don't use `select *`.

```
GET /product/goods/109524071?filter_path=_source.zdid
{
  "_source" : {
    "zdid" : 48
  }
}
```

Similar usage includes `_source`, but unlike `filter_path`, the returned results will include the default fields of the document itself.

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

**Note: _source and filter_path cannot be used together**

### Disable Automatic Mapping When Creating New Indices

[index aliases](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)

## Other Experience

Based on actual experience, elasticsearch is mostly used for fewer indexes and more searches, so optimizing for search is more appropriate.

### Best Practices for Logs

If losing logs doesn't matter, it's recommended to use 1 node with 0 replica shards to store logs.

Use `xx-<date>` for log indices, so when deleting, you can directly delete the index.

I feel like dying every time I use delete by query...

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

## Troubleshooting and Maintenance

### Unassigned Shards

`Solution:` Create a new index with `number_of_replicas` set to 0, then use `_reindex`. After migration is complete, change `number_of_replicas` back. `reindex` has a `size` parameter, configuring it as needed might be faster.

**Note** You can view related tasks through `GET _tasks?actions=indices:data/write/reindex?detailed`

Reference
1. [Elasticsearch Reindex Performance Improved 10x](https://my.oschina.net/TOW/blog/1928075)
1. [Solving Elasticsearch Cluster Unassigned Shards Unable to Reroute Problem](https://www.jianshu.com/p/542ed5a5bdfc)
1. [tasks API](https://www.elastic.co/guide/en/elasticsearch/reference/current/tasks.html)

### reindex

reindex also has techniques.

```bash
# Disable replicas
put geonames/_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
# During refresh disable, _count results don't update
json='{"index":{"refresh_interval":"-1"}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json

# You can also cancel midway
curl -XPOST 0.0.0.0:9200/_tasks/mHCg6HqYTqqd12nIDFDk1w:2977/_cancel

# Restore refresh mechanism
json='{"index":{"refresh_interval":null}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json
```

### gc overhead

```
[2019-01-04T08:41:09,538][INFO ][o.e.m.j.JvmGcMonitorService] [elasticsearch-onekey-3] [gc][159] overhead, spent [276ms] collecting in the last [1s]
```

`Solution/Problem Root:` Cluster overloaded, crashed

- Index yellow for a long time

`Solution/Problem Root:` First set `number_of_replicas` to 0, then set it back, manually trigger synchronization.

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

- Rolling restart

[_rolling_restarts](https://www.elastic.co/guide/en/elasticsearch/guide/current/_rolling_restarts.html)

- Slow log analysis

Slow logs are divided into search and index types, and can be set at the index or cluster level

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

Reference Links:

1. [ES Slow Query Collection Summary](http://www.fblinux.com/?p=1334)
1. [Using reroute to Manually Transfer Shards](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-reroute.html)

### No alive nodes found in your cluster

This needs specific analysis, check ES logs. It could be a problem caused by the 1000 concurrent connection limit.

## Reference Tools

[elasticHQ](http://www.elastichq.org/)

## Reference Links:
1. [How to Build Enterprise Search Solutions with Elasticsearch?](https://zhuanlan.zhihu.com/p/29449979)
1. [Didi Elasticsearch Multi-Cluster Architecture Practice](https://mp.weixin.qq.com/s/K44-L0rclaIM40hma55pPQ)
1. [From Platform to Middle Platform: Elasticsearch Practice Experience at Ant Financial](https://www.infoq.cn/article/IfwCVj-qJ4TU0dmBZ177)
1. [Why Has Elasticsearch Queries Become So Slow?](https://blog.csdn.net/laoyang360/article/details/83048087)
1. [Elasticsearch Optimization Through Real Cases at Douban](https://www.dongwm.com/post/elasticsearch-performance-tuning-practice-at-douban/#%E5%89%8D%E8%A8%80)
1. []()
