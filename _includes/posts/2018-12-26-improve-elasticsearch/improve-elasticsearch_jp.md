ルーティングを使用してデータに対応するシャードの位置を明確にする

[Elasticsearchのルーティング（Routing）機能](https://blog.csdn.net/cnweike/article/details/38531997)




## パフォーマンス低下の原因

1. クライアントが単にクエリを速すぎるバーストで送信しすぎて、キューを圧倒している。Node Statsで時間をかけて監視し、バースト性があるかスムーズかを確認できます
1. 長時間「スタック」する非常に遅いクエリがあり、スレッドを消費し、キューをバックアップさせている。スローログを有効にして、異常に長い時間がかかっているクエリがあるかどうかを確認し、それらを調整してみてください
1. Groovyなどで書かれた「終わらない」スクリプトがある可能性があります。例：終了しないループで、スレッドが永遠に回転する
1. ハードウェアがワークロードに対してプロビジョニング不足で、何らかのリソース（ディスク、CPUなど）でボトルネックになっている可能性があります
1. iSCSIターゲットからの一時的な問題で、進行中のすべての操作がディスクが戻るのを待ってブロックされる。忙しいクラスターを深刻にバックアップするのに大きなレイテンシの問題は必要ありません... ESは一般的にディスクが常に利用可能であることを期待しています
1. 重いガベージコレクションも問題を引き起こす可能性があります。Node Statsをチェックして、多くの/長いold gen GCが実行されているかどうかを確認してください

この英語のテキストは、基本的に、あなたのマシンが低すぎる、クエリが多すぎる、と言っています。`MySQL`の経験もESに適用されます。

## ノードの選択

自分で遊ぶ場合は、それほど多くのノードを作らないでください。`Elasticsearch`はメモリキラーです。

リソースが不足している場合、`coordinating`、`data`、`ingest`を組み合わせることができます。

### coordinating

調整ノードはリクエストのエントリーポイントです

```
node.master:false
node.data:false
node.ingest:false
```

### master

マスターを選択し、シャードの位置を決定

```
node.master:true
node.data:false
node.ingest:false
```

### data

シャードを格納するノード

```
node.master:false
node.data:true
node.ingest:false
```

### ingest

ingestノードはパイプラインの処理を担当します

```
node.master:false
node.data:false
node.ingest:true
```

## システム設定の最適化

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

queue_sizeは同時クエリの制限で、デフォルトは1000です。異なるバージョンでは名前が少し異なる場合があります。スレッドプールのパラメータは、起動パラメータに直接添付できます（結局、設定ファイルをマウントすることも私にとっては面倒です）。

参考：

1. [クラスターの設定](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)
1. [クラスター設定の更新](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)
1. [スレッドプール設定](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)


## Index設定の最適化

### shard

小さなノードでは、単一シャードのサイズが30GBを超えないことをお勧めします。より高スペックのノードでは、単一シャードのサイズが50GBを超えないことをお勧めします。

ログ分析シナリオまたは超大インデックスの場合、単一シャードのサイズが100GBを超えないことをお勧めします。

シャードの数（レプリカを含む）は、可能な限りノード数と一致させ、ノード数に等しいか、ノード数の整数倍にする必要があります。

通常、単一ノード上の同じインデックスのシャード数が5を超えないことをお勧めします。


## クエリの最適化

`_all`パラメータについては、ビジネス使用で必要ない場合、通常は無効にするか、選択的に追加することをお勧めします。

### 必要なフィールドのみを選択

リレーショナルデータベースと同様に、`select *`を使用しないでください。

```
GET /product/goods/109524071?filter_path=_source.zdid
{
  "_source" : {
    "zdid" : 48
  }
}
```

同様の用法には`_source`がありますが、`filter_path`とは異なり、返される結果にはドキュメント自体のデフォルトフィールドが含まれます。

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

**注意：_sourceとfilter_pathは一緒に使用できません**

### 新しいインデックスを作成する際にインデックスマッピングの自動マッピング機能を無効にする

[インデックスエイリアス](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)

## その他の経験

実際の経験によると、elasticsearchはインデックスが少なく、検索が多いため、検索を最適化するのが適切です。

### ログのベストプラクティス

ログが失われても問題ない場合は、1ノード0レプリカシャードでログを保存することをお勧めします。

ログインデックスには`xx-<date>`を使用し、削除する際は直接インデックスを削除できます。

delete by queryを使うたびに死にたくなります...

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

## 障害メンテナンス

### Unassigned Shards

`解決策：` `number_of_replicas`を0に設定した新しいインデックスを作成し、`_reindex`を使用します。移行が完了したら、`number_of_replicas`を元に戻します。`reindex`には`size`パラメータがあり、必要に応じて設定するとより高速になる可能性があります。

**注意** `GET _tasks?actions=indices:data/write/reindex?detailed`を通じて関連タスクを表示できます

参考
1. [Elasticsearch Reindex パフォーマンス10倍向上](https://my.oschina.net/TOW/blog/1928075)
1. [elasticsearchクラスターUnassigned Shards がrerouteできない問題を解決](https://www.jianshu.com/p/542ed5a5bdfc)
1. [tasks API](https://www.elastic.co/guide/en/elasticsearch/reference/current/tasks.html)

### reindex

reindexにもテクニックがあります。

```bash
# レプリカを無効化
put geonames/_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
# リフレッシュ無効化中、_count結果は更新されません
json='{"index":{"refresh_interval":"-1"}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json

# 途中でキャンセルすることもできます
curl -XPOST 0.0.0.0:9200/_tasks/mHCg6HqYTqqd12nIDFDk1w:2977/_cancel

# リフレッシュメカニズムを復元
json='{"index":{"refresh_interval":null}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json
```

### gc overhead

```
[2019-01-04T08:41:09,538][INFO ][o.e.m.j.JvmGcMonitorService] [elasticsearch-onekey-3] [gc][159] overhead, spent [276ms] collecting in the last [1s]
```

`解決策/問題の根源：` クラスターの負荷が重すぎて、クラッシュしました

- インデックスが長時間yellow

`解決策/問題の根源：` まず`number_of_replicas`を0に設定し、次に元に戻して、手動で同期をトリガーします。

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

- ローリング再起動

[_rolling_restarts](https://www.elastic.co/guide/en/elasticsearch/guide/current/_rolling_restarts.html)

- スローログ分析

スローログは検索とインデックスの2種類に分かれ、インデックスまたはクラスターレベルで設定できます

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

参考リンク：

1. [ES スロークエリ収集まとめ](http://www.fblinux.com/?p=1334)
1. [rerouteを使用してシャードを手動で転送](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-reroute.html)

### No alive nodes found in your cluster

これは具体的に分析する必要があり、ESのログを確認してください。同時接続数1000の制限による問題の可能性があります。

## 参考ツール

[elasticHQ](http://www.elastichq.org/)

## 参考リンク：
1. [Elasticsearchを使用してエンタープライズ検索ソリューションを構築する方法](https://zhuanlan.zhihu.com/p/29449979)
1. [Didi Elasticsearchマルチクラスターアーキテクチャの実践](https://mp.weixin.qq.com/s/K44-L0rclaIM40hma55pPQ)
1. [プラットフォームからミドルプラットフォームへ：Ant FinancialでのElasticsearchの実践経験](https://www.infoq.cn/article/IfwCVj-qJ4TU0dmBZ177)
1. [Elasticsearchクエリがなぜこんなに遅くなったのか？](https://blog.csdn.net/laoyang360/article/details/83048087)
1. [Doubanの実際のケースを通じてElasticsearchの最適化を見る](https://www.dongwm.com/post/elasticsearch-performance-tuning-practice-at-douban/#%E5%89%8D%E8%A8%80)
1. []()
