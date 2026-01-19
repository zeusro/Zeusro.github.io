## Basic Queries

ES has a default concurrency limit of 1000. If previous queries get stuck or there are too many instantaneous requests, exceptions will occur.

### Create

```
POST /a/_doc/2
{"content":"公安部：各地校车将享最高路权"}
POST /a/_doc/1
{"content":"男人老狗穿什么连衣裙"}

```

### Query

- Return part of document

?_source=title,text

### get

```
get /a/text/1
get /a/text/2
```

### Update

- Partial update

/_update

- Retrieve multiple documents

/_mget


- Analyze

```
GET _analyze
{
  "analyzer" : "standard",
  "text" : "this is a test"
}
```

## Shards

```
PUT test
{
    "settings" : {
        "number_of_shards" : 1
    },
    "mappings" : {
        "properties" : {
            "field1" : { "type" : "text" }
        }
    }
}
GET /kimchy,elasticsearch/_search?q=tag:wow
GET /_all/_search?q=tag:wow
GET _cat/indices
```

## System Queries

- Health check

GET /_cluster/health

## Plugin-Based Queries

### [elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)

When using this plugin, note that **mappings must be created when creating the index**, they cannot be modified/added later.

```
PUT /a
{
	"mappings": {
		"_doc": {
			"properties": {
				"content": {
					"type": "text",
					"analyzer": "ik_max_word",
					"search_analyzer": "ik_smart"
				}
			}
		}
	}
}
```

There's a problem with using the online hot update interface: old data needs to be reindexed (reindex). So the idea of adding new words to segment old data cannot be achieved.

Hot-updated words are stored in memory and won't update dic files.

## Shard Management

### Default Template Settings

```
POST _template/default
{
  "template": ["*"]
  "order": -1
  "settings": {
    "number_of_replicas": "0"
  }
}
```

### Custom Template - Set Replica Count Default to 0

```bash
curl -XPUT 0.0.0.0:9200/_template/zeroreplicas  -H 'Content-Type: application/json' -d '
{
"index_patterns" : "*",
"settings" : {
"number_of_replicas" : 0
}
}'
```

### Scale Down

```
put */_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
```

## ingest/pipeline Usage

ingest is a node role in elasticsearch. Pipelines are defined within ingest.

A pipeline is a preprocessor. What is a preprocessor? It can be roughly understood as data cleaning, processing data before storage.

For example, the definition of this pipeline:

```
PUT _ingest/pipeline/monthlyindex
{
    "description" : "servicelog-test monthlyindex",
    "processors" : [
      {
        "date_index_name" : {
          "field" : "timestamp",
          "date_formats" : [
            "UNIX"
          ],
          "timezone" : "Asia/Shanghai",
          "index_name_prefix" : "servicelog-test_",
          "date_rounding" : "M"
        }
      },
      {
        "date" : {
          "field" : "timestamp",
          "formats" : [
            "UNIX"
          ],
          "timezone" : "Asia/Shanghai"
        }
      },
      {
        "remove" : {
          "field" : "timestamp"
        }
      },
      {
        "remove" : {
          "field" : "type"
        }
      }
    ]
}
```

This means data written to the "servicelog-test" index is processed by month.

Original requests writing to "servicelog-test" will ultimately be written to `servicelog-test_2020-02-01` (automatic sharding for the current month).

This `pipeline` solves our problem of writing to a single elasticsearch index. We no longer need delete by query. Just directly delete past indices, which is also the way elasticsearch recommends.

Reference link: [Date Index Name Processor](https://www.elastic.co/guide/en/elasticsearch/reference/master/date-index-name-processor.html)

## Paid Features (_xpack)

ES has no password by default. If you need user authorization features, buy a commercial license.

- [security-api-users](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-users.html)


GET /_xpack/security/user

## Deprecated Queries in 7.0

As of version 7.0 Elasticsearch will require that a [field] parameter is provided when a [seed] is set

Change to:

```
 "random_score": {
                "seed": 10,
                "field": "_seq_no"
            }
```
Deprecation: Deprecated field [inline] used, expected [source] instead

```
		"_script": {
			"script": {
				"inline": "doc['xxx'].value>0?1:0"
			},
```
inline

## Reference Links:

1. [Getting Started](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/getting-started.html)
1. [Document Metadata](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/_Document_Metadata.html)
2. [Common ES Query Syntax](https://blog.csdn.net/qingmoruoxi/article/details/77221602)
