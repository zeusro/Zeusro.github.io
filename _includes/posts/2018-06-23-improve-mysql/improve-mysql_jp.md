![image](/img/in-post/improve-mysql/640.webp)

## スロークエリ最適化の基本ステップ

0. まず実行して、本当に遅いかどうかを確認し、SQL_NO_CACHEの設定に注意します
1. where条件で単一テーブルクエリを行い、最小の返却レコードテーブルをロックします。これは、クエリステートメントのwhereをすべて、返却レコード数が最小のテーブルから適用し、単一テーブルの各フィールドを個別にクエリして、どのフィールドの識別度が最も高いかを確認することを意味します
2. explainで実行計画を確認し、1の期待と一致するかどうか（ロックされたレコードが少ないテーブルからクエリを開始）
3. order by limit形式のSQLステートメントでは、ソートされたテーブルを優先的にクエリします
4. ビジネスの使用シナリオを理解します
5. インデックスを追加する際は、インデックス作成の主要な原則を参照します
6. 結果を観察し、期待に合わない場合は、0から分析を続けます

## MySQLクエリのコツ

### クエリの分析

```sql
explain  select sleep(1);
```

* explainはクエリステートメントのパフォーマンスを分析できます
* sleep秒

### 変数の代入

```
set @current =0;
select @current :=@current +1;
```
* クエリでは、:=を使用して変数を再代入できます

### データベースサイズの表示

```sql
SELECT table_schema 'DB Name',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 1)   MB
FROM information_schema.tables
GROUP BY table_schema order by MB desc;
```

### utf-8テーブルで中国語データを検索

    select number from Chinese_Test where HEX(contents) REGEXP '^(..)*(E[4-9])';

中国文字はE4からE9です

## いくつかのコツ

### "utf-8"を使用しない

utf-8は真のUTF-8ではなく、`utf8mb4`を代替として使用する必要があります。システムには`character_set_server`というパラメータがあり、これを`utf8mb4`に変更します

### データベースエンジンの表示

    SELECT * FROM INFORMATION_SCHEMA.ENGINES;

### 長いトランザクションの表示

    select * from information_schema.innodb_trx;

### 強制的なテーブル変更

テーブル変更中に実行：

```sql
SELECT 
    CONCAT('kill ', thread_id, ';')
FROM
    (SELECT DISTINCT
        (i.trx_mysql_thread_id) thread_id
    FROM
        information_schema.innodb_trx i, (SELECT 
        id, time
    FROM
        information_schema.processlist
    WHERE
        time = (SELECT 
                MAX(time)
            FROM
                information_schema.processlist
            WHERE
                state = 'Waiting for table metadata lock'
                    AND SUBSTRING(info, 1, 5) IN ('alter' , 'optim', 'repai', 'lock ', 'drop ', 'creat'))) p
    WHERE
        TIMESTAMPDIFF(SECOND, i.trx_started, NOW()) > p.time
            AND i.trx_mysql_thread_id NOT IN (CONNECTION_ID() , p.id)) t;
```

alterを実行しながら、`select * from INFORMATION_SCHEMA.innodb_trx`以外のプロセスをkillします（alterを除く）

`PS`：mysql 5.7はonlineDDLをサポートしていますが、実際にはデータ型の変更はDMLをサポートしていません。この場合、[pt-online-schema-change](https://www.percona.com/doc/percona-toolkit/LATEST/pt-online-schema-change.html)の使用を検討してください。例は[pt-online-schema-change使用説明、制限と比較](http://seanlook.com/2016/05/27/mysql-pt-online-schema-change/)を参照してください

参考：
[pt-online-schema-changeの原理解析と応用説明](https://www.cnblogs.com/xinysu/p/6758170.html)

### MySQLリモートアクセスを許可

    vi /etc/mysql/my.cnf
    ```
    [mysqld]
    bind-address    = 0.0.0.0
    ```

### 大きなデータテーブルの変更

1. 変更されるテーブルTable Aには、タイムスタンプを記録するフィールドが必要です。このタイムスタンプは、データが更新されるたびに更新されるフィールドです。このフィールドにはインデックスが必要です。djangoでは、auto_now=Trueを使用できます
2. 新しい一時テーブルTable Bを作成します。tmp_tableではなく、一時的に使用される新しいテーブルです。このテーブルは、変更するテーブルとまったく同じデータ構造を持ち、変更する部分（追加フィールドなど）を加えたものです
3. Table Aのインデックスを記録します
4. Table Bのすべてのインデックスを削除します
5. Table AのすべてのデータをTable Bにコピーします。INSERT INTO B(field1, field2) SELECT field1, field2 FROM Aを実行すべきですか？もちろん違います。それでもTable Aをロックしませんか？ここでの移行は、細分化が必要な場所です。スクリプトを書いて、プログラムにたとえば5000レコードずつ読み取り、Table Bに挿入させます。Table Bにはインデックスがないため、マルチプロセスを使用しないように注意してください。マルチプロセスの場合、Bに挿入するときに重複データがないことを確認してください。1000万のデータの場合、5000ずつ、この操作に500msかかると仮定すると、2000*200ms = 16分です。これは単なる見積もりであり、具体的な状況はサーバーの状態によって異なります。詳細は説明しにくいです。また、この移行が開始された時点を記録する必要があります。t1とします
5. Bのインデックスを構築し、すべてのインデックスが準備できたら、6を続けます
6. この時点で、Table AのデータはすべてTable Bに入りましたか？ほとんど入ったと言えるでしょうが、5で述べたように、これには約16分かかります。これほど長い時間で、新しいデータが入った可能性があり、既存のデータが更新された可能性もあります。したがって、Table Aでt1の後に変更されたデータを見つけ、Table Bに更新する必要があります。私たちのアプローチは：
    ```
    この操作に対応する時点t2を記録
    BEGIN;
    DELETE FROM B WHERE updated_time > t1;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t1;
    COMMIT;
    ```
7. 今、AとBはほぼ同期しているはずですよね？ほぼですが、6の実行後、Aはまだ書き込み中で、子孫は無限です...しかし、この時点で、AとBの違いは非常に非常に小さくなっています。したがって、次のステップで、トランザクション内で次の操作を実行します：
    ```
    BEGIN;
    DELETE FROM B WHERE updated_time > t2;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t2;

    ALTER TABLE A RENAME TO C;
    ALTER TABLE B RENAME TO A;
    COMMIT;
    ```

## MySQL Workbench

### whereなしでupdateを許可

    SET SQL_SAFE_UPDATES = 0;

### クライアントのヒント

    Error Code: 2013. Lost connection to MySQL server during query
    Error Code: 2006. MySQL server has gone away

    Edit -> Preferences -> SQL Editorに移動し、このパラメータをより高い値に設定します：DBMS connection read time out（秒単位）。例：86400。

### F5で現在選択されているステートメントを実行するように変更

方法：C:\Program Files\MySQL\MySQL Workbench 6.3 CE\data\main_menu.xmlの内容を変更

```xml

        <value type="object" struct-name="app.MenuItem" id="com.mysql.wb.menu.query.execute_current_statementwin"> 
          <link type="object" key="owner" struct-name="app.MenuItem">com.mysql.wb.menu.query</link> 
          <value type="string" key="caption">Execute Current Statement</value> 
          <value type="string" key="name">query.execute_current_statement</value> 
          <value type="string" key="command">builtin:query.execute_current_statement</value> 
          <value type="string" key="itemType">action</value> 
          <value type="string" key="shortcut">F5</value>
          <value type="string" key="platform">windows</value>
        </value> 
```

## トラブルシューティング

### パスワードを忘れた

* mysql 5.7 Ubuntu 64

```bash
sudo service mysql status
sudo service mysql stop
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld
sudo mysqld_safe --skip-grant-tables --skip-networking &  
```

```bash
mysql -u root --socket=/tmp/mysql.sock
```

```sql
use mysql; 
update user set authentication_string=PASSWORD("aaaaaaaaaaa") where User='root';
flush privileges;
```

```
sudo service mysql restart
```

### ディスクがいっぱい

Alibaba CloudのRDSでは、ディスクがいっぱいになると`--rds-read-drop-only`状態が表示されます。この時点では、データを読み取るか、データベースを削除することしかできません（結局、ディスクのアップグレードには再起動が必要です）。

この時点で最も速い解決策は、データベースを削除することです。

次善策として、データベースを転送してから削除します。

または、ビジネスの低ピーク時にデータテーブル構造を最適化します

```sql
SELECT 
    ROW_FORMAT,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    MAX_DATA_LENGTH,
    DATA_FREE,
    TABLE_SCHEMA,
    TABLE_NAME,
    ENGINE
FROM
    information_schema.TABLES
    order by data_free desc, TABLE_NAME

OPTIMIZE TABLE  db.tables

```

無効なスペースを解放します

## 参考リンク

1. [Table Locking Issues](https://dev.mysql.com/doc/refman/8.0/en/table-locking.html)
2. [privileges-provided](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
3. [RDS MySQLテーブル上のMetadata lockの生成と処理](https://help.aliyun.com/knowledge_detail/41723.html)
4. [MySQLでWaiting for table metadata lockが発生する原因と解決方法](https://www.cnblogs.com/digdeep/p/4892953.html)
5. [How to Allow Remote MySQL Database Connection](https://www.digitalocean.com/community/questions/how-to-allow-remote-mysql-database-connection)
6. [Lost connection to MySQL server during queryエラーを解決する方法](https://blog.csdn.net/lovemysea/article/details/79121154)
7. [mysqlのshow processlistコマンドの大きな役割](https://blog.csdn.net/juan083/article/details/54889893)
8. [Privileges Provided by MySQL](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
1. [覚えておいてください、MySQLで「utf8」を使用しないでください](http://www.infoq.com/cn/articles/in-mysql-never-use-utf8-use-utf8)
1. [MySQLインデックス原理とスロークエリ最適化](https://yq.aliyun.com/articles/66680)
1. [Mysqlで大きなデータテーブルを変更する方法](https://www.v2ex.com/t/44841)
1. [MySQLバイナリログ（Binary Log）](https://blog.csdn.net/leshami/article/details/39801867)
1. [how-to-get-size-of-mysql-database](https://stackoverflow.com/questions/1733507/how-to-get-size-of-mysql-database)
1. [How to detect rows with chinese characters in MySQL?](https://stackoverflow.com/questions/9795137/how-to-detect-rows-with-chinese-characters-in-mysql)
1. [クラウドデータベースRDS版 > 技術運用問題 > MYSQL使用](https://help.aliyun.com/knowledge_list/41698.html)
1. [mysql: show processlistの詳細説明](https://zhuanlan.zhihu.com/p/30743094)
1. [MySQL SHOW PROCESSLISTがトラブルシューティングを支援](http://www.ywnds.com/?p=9337)
1. [mysqld_safe Directory '/var/run/mysqld' for UNIX socket file don't existsを解決](http://blog.csdn.net/Z_YTTT/article/details/73650495)
1. [MySQL5.7でパスワードを変更する際にERROR 1054 (42S22): Unknown column 'password' in 'field list'が発生](http://blog.csdn.net/u010603691/article/details/50379282)
1. [create-user](https://www.yiibai.com/mysql/create-user.html)
1. [GRANT](https://www.yiibai.com/mysql/grant.html)
1. [privileges-provided](https://dev.mysql.com/doc/refman/5.7/en/privileges-provided.html#priv_all)
1. [MySQLユーザー管理：ユーザーの追加、権限付与、削除](https://www.cnblogs.com/chanshuyi/p/mysql_user_mng.html)
1. [スロークエリの詳細説明](https://www.kancloud.cn/thinkphp/mysql-design-optimalize/39320)
1. [MySQLデータベース最適化、この記事で十分](https://mp.weixin.qq.com/s/69XIz-UhuQTZ44InJEL98w)

### Alibaba Cloud

1. [パラメータチューニングの提案](https://help.aliyun.com/document_detail/63255.html)
1. [10分でMySQL Binlog分析+可視化ソリューションを構築](https://yq.aliyun.com/articles/338423)
1. [MySQLインスタンスのスペースがいっぱいになった後の自動ロックの原因をトラブルシューティングする方法](https://help.aliyun.com/knowledge_detail/51682.html)
