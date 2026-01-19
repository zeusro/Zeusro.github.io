![image](/img/in-post/improve-mysql/640.webp)

## Основные шаги оптимизации медленных запросов

0. Сначала запустите, чтобы увидеть, действительно ли это медленно, обратите внимание на установку SQL_NO_CACHE
1. Запрос к одной таблице с условиями where, заблокируйте таблицу с минимальным количеством возвращённых записей. Это означает применение всех предложений where из запроса, начиная с таблицы с наименьшим количеством возвращённых записей, отдельный запрос каждого поля одной таблицы, чтобы увидеть, какое поле имеет наивысшую различимость
2. Используйте explain для просмотра плана выполнения, соответствует ли он ожиданию 1 (запрос, начинающийся с таблицы с меньшим количеством заблокированных записей)
3. Для SQL-запросов в форме order by limit дайте приоритет запросу отсортированной таблицы
4. Поймите сценарий использования бизнеса
5. При добавлении индексов обращайтесь к основным принципам создания индексов
6. Наблюдайте результаты, если не соответствует ожиданиям, продолжайте анализ с 0

## Советы по запросам MySQL

### Анализ запросов

```sql
explain  select sleep(1);
```

* explain может анализировать производительность запроса
* sleep секунд

### Присвоение переменных

```
set @current =0;
select @current :=@current +1;
```
* В запросах вы можете переназначить переменные, используя :=

### Просмотр размера базы данных

```sql
SELECT table_schema 'DB Name',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 1)   MB
FROM information_schema.tables
GROUP BY table_schema order by MB desc;
```

### Поиск китайских данных в таблицах utf-8

    select number from Chinese_Test where HEX(contents) REGEXP '^(..)*(E[4-9])';

китайские символы от E4 до E9

## Некоторые приёмы

### Не используйте "utf-8"

utf-8 — это не настоящий UTF-8, следует использовать `utf8mb4` в качестве замены. В системе есть параметр `character_set_server`, измените его на `utf8mb4`

### Отображение движков базы данных

    SELECT * FROM INFORMATION_SCHEMA.ENGINES;

### Отображение длинных транзакций

    select * from information_schema.innodb_trx;

### Принудительное изменение таблицы

Во время изменения таблицы выполните:

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

При выполнении alter убивайте процессы, кроме `select * from INFORMATION_SCHEMA.innodb_trx`, кроме alter

`PS`: Хотя mysql 5.7 поддерживает onlineDDL, на практике изменение типов данных не поддерживает DML. В это время можно рассмотреть использование [pt-online-schema-change](https://www.percona.com/doc/percona-toolkit/LATEST/pt-online-schema-change.html), пример см. в [pt-online-schema-change Инструкция по использованию, ограничения и сравнение](http://seanlook.com/2016/05/27/mysql-pt-online-schema-change/)

Ссылка:
[Анализ принципов pt-online-schema-change и объяснение применения](https://www.cnblogs.com/xinysu/p/6758170.html)

### Разрешить удалённый доступ к MySQL

    vi /etc/mysql/my.cnf
    ```
    [mysqld]
    bind-address    = 0.0.0.0
    ```

### Изменение больших таблиц данных

1. Таблица для изменения Table A нуждается в поле, которое записывает временные метки. Эта временная метка — это поле, которое обновляется каждый раз при обновлении данных. Это поле нуждается в индексе. В django вы можете использовать auto_now=True
2. Создайте новую временную таблицу Table B, не tmp_table, а новую таблицу, которая временно используется. Эта таблица имеет точно такую же структуру данных, как таблица для изменения, плюс части, которые вы хотите изменить, такие как добавленные поля;
3. Запишите индексы Table A
4. Удалите все индексы из Table B
5. Скопируйте все данные из Table A в Table B. Должны ли мы выполнить INSERT INTO B(field1, field2) SELECT field1, field2 FROM A? Конечно нет, разве это не заблокирует Table A? Миграция здесь — это место, которое требует подразделения. Напишите скрипт, чтобы программа читала, скажем, 5000 записей за раз, и вставляла их в Table B. Поскольку Table B не имеет индексов, будьте осторожны, чтобы не использовать многопроцессорность; если многопроцессорность, убедитесь, что нет дублирующихся данных при вставке в B; если это 10 миллионов записей, 5000 за раз, предполагая, что эта операция занимает 500ms, то 2000*200ms = 16 минут. Это всего лишь оценка, конкретные ситуации зависят от состояния сервера в то время, трудно детализировать. Кроме того, нам нужно записать момент времени, когда начинается эта миграция, обозначенный как t1;
5. Постройте индексы для B, подождите, пока все индексы будут готовы, затем продолжите с 6
6. Итак, в этот момент, все ли данные Table A вошли в Table B? Следует сказать, что большая часть вошла, но, как упоминалось в 5, это занимает около 16 минут. За такое долгое время могли войти новые данные, или существующие данные могли быть обновлены. Поэтому нам нужно найти данные в Table A, которые изменились после t1, а затем обновить их в Table B. Наш подход:
    ```
    Запишите момент времени, соответствующий этой операции t2
    BEGIN;
    DELETE FROM B WHERE updated_time > t1;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t1;
    COMMIT;
    ```
7. Теперь A и B должны быть почти синхронизированы, верно? Почти, но после выполнения 6, A всё ещё пишет, потомки бесконечны... Но в этот момент разница между A и B очень, очень мала. Итак, на следующем шаге мы выполняем следующие операции в транзакции:
    ```
    BEGIN;
    DELETE FROM B WHERE updated_time > t2;
    INSERT INTO B(field1, field2) SELECT field1, field2 FROM A WHERE updated_time >t2;

    ALTER TABLE A RENAME TO C;
    ALTER TABLE B RENAME TO A;
    COMMIT;
    ```

## MySQL Workbench

### Разрешить обновление без where

    SET SQL_SAFE_UPDATES = 0;

### Советы клиента

    Error Code: 2013. Lost connection to MySQL server during query
    Error Code: 2006. MySQL server has gone away

    Перейдите в Edit -> Preferences -> SQL Editor и установите более высокое значение для этого параметра: DBMS connection read time out (в секундах). Например: 86400.

### Изменить на F5 Выполнить текущий выбранный оператор

Метод: Измените содержимое в C:\Program Files\MySQL\MySQL Workbench 6.3 CE\data\main_menu.xml

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

## Устранение неполадок

### Забыли пароль

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

### Диск заполнен

RDS Alibaba Cloud, когда диск заполнен, будет показывать статус `--rds-read-drop-only`. В это время вы можете только читать данные или удалить базу данных (в конце концов, обновление диска требует перезапуска).

Самое быстрое решение в это время — удалить базу данных.

Второй вариант — перенести базу данных, затем удалить её.

Или оптимизировать структуру таблицы данных в периоды низкой нагрузки бизнеса

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

Освободите эти недействительные пространства

## Ссылки

1. [Table Locking Issues](https://dev.mysql.com/doc/refman/8.0/en/table-locking.html)
2. [privileges-provided](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
3. [RDS MySQL Генерация и обработка Metadata Lock на таблицах](https://help.aliyun.com/knowledge_detail/41723.html)
4. [Причины и решения MySQL Waiting for table metadata lock](https://www.cnblogs.com/digdeep/p/4892953.html)
5. [How to Allow Remote MySQL Database Connection](https://www.digitalocean.com/community/questions/how-to-allow-remote-mysql-database-connection)
6. [Метод решения ошибки Lost connection to MySQL server during query](https://blog.csdn.net/lovemysea/article/details/79121154)
7. [Большое использование команды mysql show processlist](https://blog.csdn.net/juan083/article/details/54889893)
8. [Privileges Provided by MySQL](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
1. [Помните, никогда не используйте "utf8" в MySQL](http://www.infoq.com/cn/articles/in-mysql-never-use-utf8-use-utf8)
1. [Принципы индексов MySQL и оптимизация медленных запросов](https://yq.aliyun.com/articles/66680)
1. [Как изменить большие таблицы данных в Mysql](https://www.v2ex.com/t/44841)
1. [Двоичный журнал MySQL (Binary Log)](https://blog.csdn.net/leshami/article/details/39801867)
1. [how-to-get-size-of-mysql-database](https://stackoverflow.com/questions/1733507/how-to-get-size-of-mysql-database)
1. [How to detect rows with chinese characters in MySQL?](https://stackoverflow.com/questions/9795137/how-to-detect-rows-with-chinese-characters-in-mysql)
1. [Облачная база данных RDS > Технические проблемы эксплуатации > Использование MYSQL](https://help.aliyun.com/knowledge_list/41698.html)
1. [mysql: подробное объяснение show processlist](https://zhuanlan.zhihu.com/p/30743094)
1. [MySQL SHOW PROCESSLIST Помогает в устранении неполадок](http://www.ywnds.com/?p=9337)
1. [Решение mysqld_safe Directory '/var/run/mysqld' for UNIX socket file don't exists](http://blog.csdn.net/Z_YTTT/article/details/73650495)
1. [MySQL5.7 Ошибка 1054 (42S22): Unknown column 'password' in 'field list' при изменении пароля](http://blog.csdn.net/u010603691/article/details/50379282)
1. [create-user](https://www.yiibai.com/mysql/create-user.html)
1. [GRANT](https://www.yiibai.com/mysql/grant.html)
1. [privileges-provided](https://dev.mysql.com/doc/refman/5.7/en/privileges-provided.html#priv_all)
1. [Управление пользователями MySQL: Добавление пользователей, Предоставление прав, Удаление пользователей](https://www.cnblogs.com/chanshuyi/p/mysql_user_mng.html)
1. [Подробное объяснение медленных запросов](https://www.kancloud.cn/thinkphp/mysql-design-optimalize/39320)
1. [Оптимизация базы данных MySQL, этой статьи достаточно](https://mp.weixin.qq.com/s/69XIz-UhuQTZ44InJEL98w)

### Alibaba Cloud

1. [Предложения по настройке параметров](https://help.aliyun.com/document_detail/63255.html)
1. [10 минут для создания решения анализа и визуализации MySQL Binlog](https://yq.aliyun.com/articles/338423)
1. [Как устранить неполадки причин автоматической блокировки после заполнения пространства экземпляра MySQL](https://help.aliyun.com/knowledge_detail/51682.html)
