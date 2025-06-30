---
layout:       post
title:        "Elasticsearch常用API"
subtitle:     ""
date:         2019-04-10
author:       "Zeusro"
header-img:   "img/b/2019/Silver-Days.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Elasticsearch
---



## 基本查询

ES,默认并发限制1000,如果前面的查询卡住或者瞬时请求过多,就会出现异常.

### 创建

```
POST /a/_doc/2
{"content":"公安部：各地校车将享最高路权"}
POST /a/_doc/1
{"content":"男人老狗穿什么连衣裙"}

```

### 查询

- 返回文档的一部分

?_source=title,text

### get

```
get /a/text/1
get /a/text/2
```

### 更新

- 部分更新

/_update

- 取回多个文档

/_mget


- 分析

```
GET _analyze
{
  "analyzer" : "standard",
  "text" : "this is a test"
}
```

## 分片

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

## 系统查询

- 健康检查

GET /_cluster/health

## 基于插件的查询

### [elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)

使用该插件,要注意**mappings要在创建index时创建**,不能后期修改/添加

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

使用在线热更新接口有个问题:对于旧的的数据需要重新索引(reindex).所以妄想通过增加新词来对旧的数据进行分词,这种需求是无法实现的.

热更新的词语存在内存中,不会更新dic文件

## 分片管理

### 默认模板设置

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

### 自定义模板-设置副本数默认为0

```bash
curl -XPUT 0.0.0.0:9200/_template/zeroreplicas  -H 'Content-Type: application/json' -d '
{
"index_patterns" : "*",
"settings" : {
"number_of_replicas" : 0
}
}'
```

### 缩容

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

## ingest/pipeline 用法

ingest 是 elasticsearch 的节点角色。在ingest里面定义pipeline。

pipeline是预处理器。什么是预处理器呢，可以勉强理解为数据清洗，在入库前对数据进行处理。

比如下面这个pipeline的定义

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

意思是把写入"servicelog-test" index 的数据按月分片处理。

原始写入"servicelog-test"的请求，最终最写入到 `servicelog-test_2020-02-01`(当前月份的自动分片)

这个 `pipeline` 解决了我们写入单一elasticsearch index 的问题。以后再也不需要 delete by query 了，直接删过往的index，这也是elasticsearch推荐的方式。

参考链接：[Date Index Name Processor](https://www.elastic.co/guide/en/elasticsearch/reference/master/date-index-name-processor.html)

## 付费功能(_xpack)

es默认没有密码,需要用户授权功能的话买商业版的许可.

- [security-api-users](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-users.html)


GET /_xpack/security/user

## 7.0废弃的查询

As of version 7.0 Elasticsearch will require that a [field] parameter is provided when a [seed] is set

改为

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

## 参考链接:

1. [基础入门](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/getting-started.html)
1. [文档元数据](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/_Document_Metadata.html)
2. [es 的常用查询语法](https://blog.csdn.net/qingmoruoxi/article/details/77221602)