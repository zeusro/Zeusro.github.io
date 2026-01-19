## 基本クエリ

ESはデフォルトで同時実行制限が1000です。前のクエリがスタックしたり、瞬間的なリクエストが多すぎたりすると、例外が発生します。

### 作成

```
POST /a/_doc/2
{"content":"公安部：各地校车将享最高路权"}
POST /a/_doc/1
{"content":"男人老狗穿什么连衣裙"}

```

### クエリ

- ドキュメントの一部を返す

?_source=title,text

### get

```
get /a/text/1
get /a/text/2
```

### 更新

- 部分更新

/_update

- 複数のドキュメントを取得

/_mget


- 分析

```
GET _analyze
{
  "analyzer" : "standard",
  "text" : "this is a test"
}
```

## シャード

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

## システムクエリ

- ヘルスチェック

GET /_cluster/health

## プラグインベースのクエリ

### [elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)

このプラグインを使用する場合、**mappingsはインデックス作成時に作成する必要がある**ことに注意してください。後で変更/追加することはできません。

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

オンラインホットアップデートインターフェースを使用する場合、古いデータは再インデックス（reindex）する必要があるという問題があります。そのため、新しい単語を追加して古いデータを分かち書きするという要求は実現できません。

ホットアップデートされた単語はメモリに保存され、dicファイルは更新されません。

## シャード管理

### デフォルトテンプレート設定

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

### カスタムテンプレート-レプリカ数をデフォルトで0に設定

```bash
curl -XPUT 0.0.0.0:9200/_template/zeroreplicas  -H 'Content-Type: application/json' -d '
{
"index_patterns" : "*",
"settings" : {
"number_of_replicas" : 0
}
}'
```

### スケールダウン

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

## ingest/pipelineの用法

ingestはelasticsearchのノードロールです。ingest内でpipelineを定義します。

pipelineはプリプロセッサです。プリプロセッサとは何か？データクリーニングと理解でき、保存前にデータを処理します。

たとえば、このpipelineの定義：

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

これは"servicelog-test"インデックスに書き込まれるデータを月ごとに処理することを意味します。

"servicelog-test"に書き込む元のリクエストは、最終的に`servicelog-test_2020-02-01`（現在の月の自動シャード）に書き込まれます。

この`pipeline`は、単一のelasticsearchインデックスに書き込む問題を解決します。今後、delete by queryは不要です。過去のインデックスを直接削除するだけで、これもelasticsearchが推奨する方法です。

参考リンク：[Date Index Name Processor](https://www.elastic.co/guide/en/elasticsearch/reference/master/date-index-name-processor.html)

## 有料機能(_xpack)

esはデフォルトでパスワードがありません。ユーザー認証機能が必要な場合は、商業版のライセンスを購入してください。

- [security-api-users](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-users.html)


GET /_xpack/security/user

## 7.0で非推奨のクエリ

バージョン7.0以降、Elasticsearchでは[seed]が設定されている場合に[field]パラメータが必要になります

変更：

```
 "random_score": {
                "seed": 10,
                "field": "_seq_no"
            }
```
非推奨：非推奨フィールド[inline]が使用されました。[source]が期待されます

```
		"_script": {
			"script": {
				"inline": "doc['xxx'].value>0?1:0"
			},
```
inline

## 参考リンク：

1. [基礎入門](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/getting-started.html)
1. [ドキュメントメタデータ](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/_Document_Metadata.html)
2. [esの一般的なクエリ構文](https://blog.csdn.net/qingmoruoxi/article/details/77221602)
