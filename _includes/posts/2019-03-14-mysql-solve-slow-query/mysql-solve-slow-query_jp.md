## 主な考え方

リアルタイム分析（`show full processlist;`）と遅延分析（`mysql.slow_log`）を組み合わせて、SQLステートメントを最適化します。

## リアルタイム分析

### 実行中のスレッドを確認

    show processlist;
    show full processlist;

`show processlist;`と比較して、このクエリはwhere条件を使用できるため、こちらを好んで使用します。

```SQL
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where state !='' order by state,time desc,command ;
-- クライアントIPで現在接続されているユーザーをグループ化
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by h  order by c desc,user;
-- ユーザー名で現在接続されているユーザーをグループ化
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by user  order by c desc,user;
```

### 時間のかかるSQLに対応する特徴

1. テーブル変更
1. Copying to tmp table
1. Copying to tmp table on disk
1. Reading from net
1. Sending data
1. インデックスなし
1. Sorting result
1. Creating sort index
1. Sorting result

これらの状態に注目し、[processlistで注意すべき状態](https://www.kancloud.cn/thinkphp/mysql-faq/47446)を参考にして最適化します。

## 遅延分析

### スロークエリパラメータの設定

```
slow_query_log 1
log_queries_not_using_indexes OFF
long_query_time 5
slow_query_log 1  
```

```SQL
# データベースを作成
CREATE TABLE `slow_log_2019-05-30` (
  `start_time` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `user_host` mediumtext NOT NULL,
  `query_time` time(6) NOT NULL,
  `lock_time` time(6) NOT NULL,
  `rows_sent` int(11) NOT NULL,
  `rows_examined` int(11) NOT NULL,
  `db` varchar(512) NOT NULL,
  `last_insert_id` int(11) NOT NULL,
  `insert_id` int(11) NOT NULL,
  `server_id` int(10) unsigned NOT NULL,
  `sql_text` mediumtext NOT NULL,
  `thread_id` bigint(21) unsigned NOT NULL,
  KEY `idx_start_time` (`start_time`),
  KEY `idx_query_time` (`query_time`),
  KEY `idx_lock_time` (`lock_time`),
  KEY `idx_rows_examined` (`rows_examined`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- insert into slow_log.slow_log_2019-05-30 select * from mysql.slow_log;
-- truncate table mysql.slow_log ;
select * FROM slow_log.`slow_log_2019-05-30`
where sql_text not like 'xxx`%'
order by  query_time desc,query_time desc;
```

優先順位で、注目すべき列は`lock_time`、`query_time`、`rows_examined`です。分析する際は、80/20の法則を適用し、まず最も問題のあるSQLを見つけて最適化し、その後、not likeまたは削除を継続して、すでに最適化された非効率なSQLを除外します。

## 非効率なSQLの最適化の考え方

各クエリについて、まず`explain SQL`で分析するのが賢明です。

一般的に、rowsは少ないほど良いです。Extra:`Using where`の状況に注意してください。これは通常、全テーブルスキャンです。データ量が大きい（>10万）場合は、インデックスの追加を検討してください。

### サブクエリの使用に注意

ネストされたサブクエリを避け、インデックスを使用して最適化します。

```SQL
EXPLAIN SELECT *
FROM (
	SELECT *
	FROM `s`.`t`
	WHERE status IN (-15, -11)
	LIMIT 0, 10
) a
ORDER BY a.modified DESC
```

たとえば、このようなものは完全に不要です。表面的には、サブクエリを削除するよりも少し速く見えますが、実際には、MySQL 5.7がサブクエリを最適化し、[Derived table](http://mysql.taobao.org/monthly/2017/03/05/)を生成し、結果セットをキャッシュしたためです。

実際のシナリオ分析によると、`status`フィールドにインデックスがなかったため、クエリが全テーブルスキャン（using where）になりました。インデックスを追加した後、問題は解決しました。

### json型

jsonデータ型は、保存されるJSONが非常に長い場合、読み取りが自然に遅くなります。実際のシナリオでは、まずこの型を使用する必要があるかどうかを確認し、次に、必要なフィールドのみを取得するようにします。

このように書かれているのを見たことがあります：

```SQL
WHERE j_a like '%"sid":514572%'
```

この動作は明らかにMySQLに不慣れです。MySQLにはJSON抽出関数があります。

```SQL
WHERE JSON_EXTRACT(j_a, "$[0].sid")=514572;
```

これも全テーブルスキャンですが、like全あいまいクエリよりも良いでしょう？

より良い方法は、仮想フィールドでインデックスを作成することです。

[MySQL · ベストプラクティス · JSONフィールドのインデックス方法](http://mysql.taobao.org/monthly/2017/12/09/)

ただし、現時点ではMySQLのjsonのインデックスは不十分です。jsonデータ列が大きすぎる場合は、`MongoDB`に保存することをお勧めします（12万のjsonをMySQLに保存しているのを見たことがありますが、読み取り速度は言葉になりませんでした）。

### 文字列型

```SQL
WHERE a=1
```

数値で文字列型のフィールドに値を割り当てると、そのフィールドのインデックスが無効になります。

```SQL
WHERE a='1'
```

### グループ化クエリ

`group by`、`count(x)`、`sum(x)`は慎重に使用してください。CPUを非常に消費します。

#### `group by`

```SQL
select col_1 from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 group by col_1
```

集約クエリ（`count(x)`、`sum(x)`）に関係しないこの種の`group by`は明らかに不合理です。distinctクエリの方が効果的です。

```SQL
select distinct(col_1) from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 limit xxx;
```

### `count(x)`、`sum(x)`

xフィールドにはインデックスを付けるのが最善です。そうしないと、フィルター条件にインデックスがあっても非常に遅くなります。

### order by x

xフィールドにはインデックスを付けるのが最善です。そうしないと、`show processlist;`に大量の`Creating sort index`結果が表示される可能性があります。

### 複合インデックスの無効化

複合インデックスには最左一致原則があります。

```SQL
KEY 'idx_a' (a,b,c)
```

```SQL
WHERE b='' and c =''
```

この場合、複合インデックスは無効です。

## その他

```SQL
EXPLAIN SQL
DESC SQL
```

```SQL
# INNODB_TRXテーブルは主に、InnoDBエンジンで実行されているすべてのトランザクションの情報を含み、waiting for a lockとrunningのトランザクションを含みます
SELECT * FROM information_schema.INNODB_TRX;
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

## 参考リンク

1. [MySQLスロークエリログのまとめ](https://www.cnblogs.com/kerrycode/p/5593204.html)
1. [MySQL CPU使用率が高い原因と解決方法](https://help.aliyun.com/knowledge_detail/51587.html)
1. [mysql最適化、クエリがインデックスを使用しない原因のまとめ](https://blog.csdn.net/m0_37808356/article/details/72526687)
1. [information_schemaのInnodb関連テーブルを使用してSQLクエリロックの使用状況を分析する方法の紹介](https://blog.csdn.net/and1kaney/article/details/51213979)
