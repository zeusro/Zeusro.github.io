## Базовые запросы

ES имеет ограничение параллелизма по умолчанию 1000. Если предыдущие запросы застревают или слишком много мгновенных запросов, возникнут исключения.

### Создание

```
POST /a/_doc/2
{"content":"公安部：各地校车将享最高路权"}
POST /a/_doc/1
{"content":"男人老狗穿什么连衣裙"}

```

### Запрос

- Вернуть часть документа

?_source=title,text

### get

```
get /a/text/1
get /a/text/2
```

### Обновление

- Частичное обновление

/_update

- Получить несколько документов

/_mget


- Анализ

```
GET _analyze
{
  "analyzer" : "standard",
  "text" : "this is a test"
}
```

## Шарды

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

## Системные запросы

- Проверка здоровья

GET /_cluster/health

## Запросы на основе плагинов

### [elasticsearch-analysis-ik](https://github.com/medcl/elasticsearch-analysis-ik)

При использовании этого плагина обратите внимание, что **mappings должны быть созданы при создании индекса**, их нельзя изменить/добавить позже.

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

Есть проблема с использованием интерфейса онлайн горячего обновления: старые данные нужно переиндексировать (reindex). Поэтому идея добавления новых слов для сегментации старых данных не может быть достигнута.

Горячее обновленные слова хранятся в памяти и не обновляют dic файлы.

## Управление шардами

### Настройки шаблона по умолчанию

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

### Пользовательский шаблон - установить количество реплик по умолчанию в 0

```bash
curl -XPUT 0.0.0.0:9200/_template/zeroreplicas  -H 'Content-Type: application/json' -d '
{
"index_patterns" : "*",
"settings" : {
"number_of_replicas" : 0
}
}'
```

### Масштабирование вниз

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

## Использование ingest/pipeline

ingest — это роль узла в elasticsearch. В ingest определяются pipeline.

pipeline — это препроцессор. Что такое препроцессор? Его можно грубо понять как очистку данных, обработку данных перед хранением.

Например, определение этого pipeline:

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

Это означает, что данные, записанные в индекс "servicelog-test", обрабатываются по месяцам.

Исходные запросы, записывающие в "servicelog-test", в конечном итоге будут записаны в `servicelog-test_2020-02-01` (автоматическое шардирование для текущего месяца).

Этот `pipeline` решает нашу проблему записи в один индекс elasticsearch. Нам больше не нужен delete by query. Просто напрямую удаляйте прошлые индексы, что также является рекомендуемым способом elasticsearch.

Ссылка: [Date Index Name Processor](https://www.elastic.co/guide/en/elasticsearch/reference/master/date-index-name-processor.html)

## Платные функции (_xpack)

ES по умолчанию не имеет пароля. Если вам нужны функции авторизации пользователей, купите коммерческую лицензию.

- [security-api-users](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-users.html)


GET /_xpack/security/user

## Устаревшие запросы в 7.0

Начиная с версии 7.0 Elasticsearch потребует, чтобы параметр [field] был предоставлен, когда установлен [seed]

Изменить на:

```
 "random_score": {
                "seed": 10,
                "field": "_seq_no"
            }
```
Устаревание: Использовано устаревшее поле [inline], ожидается [source] вместо этого

```
		"_script": {
			"script": {
				"inline": "doc['xxx'].value>0?1:0"
			},
```
inline

## Ссылки:

1. [Основы](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/getting-started.html)
1. [Метаданные документа](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/_Document_Metadata.html)
2. [Общий синтаксис запросов es](https://blog.csdn.net/qingmoruoxi/article/details/77221602)
