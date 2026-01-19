## Основной подход

Анализ в реальном времени (`show full processlist;`) в сочетании с отложенным анализом (`mysql.slow_log`) для оптимизации SQL-запросов.

## Анализ в реальном времени

### Просмотр выполняющихся потоков

    show processlist;
    show full processlist;

По сравнению с `show processlist;`, я предпочитаю использовать это, потому что этот запрос может использовать условия where.

```SQL
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST where state !='' order by state,time desc,command ;
-- Группировка текущих подключенных пользователей по IP клиента
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by h  order by c desc,user;
-- Группировка текущих подключенных пользователей по имени пользователя
SELECT substring_index(Host,':',1) as h,count(Host)  as c,user FROM INFORMATION_SCHEMA.PROCESSLIST  group by user  order by c desc,user;
```

### Характеристики, соответствующие различным затратным по времени SQL

1. Изменение таблицы
1. Copying to tmp table
1. Copying to tmp table on disk
1. Reading from net
1. Sending data
1. Нет индекса
1. Sorting result
1. Creating sort index
1. Sorting result

Сосредоточьтесь на этих состояниях, обратитесь к "[Какие состояния в processlist должны вызывать внимание](https://www.kancloud.cn/thinkphp/mysql-faq/47446)" для оптимизации.

## Отложенный анализ

### Настройка параметров медленного запроса

```
slow_query_log 1
log_queries_not_using_indexes OFF
long_query_time 5
slow_query_log 1  
```

```SQL
# Создать базу данных
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

В порядке приоритета, столбцы, на которые нужно обратить внимание: `lock_time`, `query_time`, `rows_examined`. При анализе применяйте правило 80/20. Сначала найдите самую проблемную SQL, оптимизируйте ее первой, затем постоянно используйте not like или удаляйте, чтобы исключить уже оптимизированные неэффективные SQL.

## Идеи оптимизации для неэффективных SQL

Для каждого запроса разумно сначала проанализировать его с помощью `explain SQL`.

Как правило, чем меньше строк, тем лучше. Остерегайтесь ситуаций Extra: `Using where`. Это обычно означает полное сканирование таблицы. Когда объем данных большой (>100k), рассмотрите добавление индексов.

### Используйте подзапросы осторожно

Старайтесь избегать вложенных подзапросов, используйте индексы для их оптимизации.

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

Например, такой вид совершенно не нужен. На поверхности кажется быстрее, чем удаление подзапроса, но на самом деле это потому, что MySQL 5.7 оптимизировал подзапросы, создав [Derived table](http://mysql.taobao.org/monthly/2017/03/05/), который кэшировал набор результатов.

Согласно анализу реального сценария, поле `status` не имело индекса, что привело к полному сканированию таблицы (using where). После добавления индекса проблема была решена.

### json тип

Для типов данных json, если сохраненный JSON очень длинный, чтение будет естественно медленнее. В реальных сценариях сначала определите, необходимо ли использовать этот тип. Во-вторых, старайтесь получать только нужные поля.

Я видел, что это написано так:

```SQL
WHERE j_a like '%"sid":514572%'
```

Такое поведение явно показывает незнание MySQL. MySQL имеет функции извлечения JSON.

```SQL
WHERE JSON_EXTRACT(j_a, "$[0].sid")=514572;
```

Хотя это также полное сканирование таблицы, это все же лучше, чем полный нечеткий запрос like, верно?

Лучший подход — создать индекс через виртуальное поле.

[MySQL · Лучшие практики · Как индексировать JSON поля](http://mysql.taobao.org/monthly/2017/12/09/)

Но в настоящее время индексирование MySQL для json недостаточно. Если столбцы данных json слишком большие, рекомендуется хранить в `MongoDB` (я видел 120k json, хранящихся в MySQL, скорость чтения была просто невыразимой).

### Строковый тип

```SQL
WHERE a=1
```

Использование чисел для присвоения значений полям строкового типа приведет к тому, что индексы на этом поле станут недействительными.

```SQL
WHERE a='1'
```

### Группирующие запросы

`group by`, `count(x)`, `sum(x)`, используйте с осторожностью. Очень ресурсоемко по CPU.

#### `group by`

```SQL
select col_1 from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 group by col_1
```

Такой вид `group by`, не связанный с агрегатными запросами (`count(x)`, `sum(x)`), явно неразумен. Использование distinct запросов более эффективно.

```SQL
select distinct(col_1) from table_a where (col_2 > 7 or mtsp_col_2 > 0) and col_3 = 1 limit xxx;
```

### `count(x)`, `sum(x)`

Поле x должно предпочтительно иметь индекс, иначе даже если условия фильтрации имеют индексы, это будет очень медленно.

### order by x

Поле x должно предпочтительно иметь индекс, иначе `show processlist;` может показать много результатов `Creating sort index`.

### Недействительность составного индекса

Составные индексы имеют принцип левого совпадения.

```SQL
KEY 'idx_a' (a,b,c)
```

```SQL
WHERE b='' and c =''
```

В это время составной индекс недействителен.

## Другое

```SQL
EXPLAIN SQL
DESC SQL
```

```SQL
# Таблица INNODB_TRX в основном содержит информацию о всех транзакциях, выполняющихся в движке InnoDB, включая транзакции, ожидающие блокировки, и выполняющиеся транзакции
SELECT * FROM information_schema.INNODB_TRX;
SELECT * FROM information_schema.innodb_locks;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

## Ссылки

1. [Сводка журнала медленных запросов MySQL](https://www.cnblogs.com/kerrycode/p/5593204.html)
1. [Причины и решения высокой загрузки CPU MySQL](https://help.aliyun.com/knowledge_detail/51587.html)
1. [Оптимизация MySQL, сводка причин, по которым запросы не используют индексы](https://blog.csdn.net/m0_37808356/article/details/72526687)
1. [Введение в использование таблиц, связанных с Innodb в information_schema для анализа использования блокировок SQL-запросов](https://blog.csdn.net/and1kaney/article/details/51213979)
