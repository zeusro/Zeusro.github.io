Используйте routing для указания местоположения шарда для данных

[Функция маршрутизации Elasticsearch (Routing)](https://blog.csdn.net/cnweike/article/details/38531997)




## Причины снижения производительности

1. Ваши клиенты просто отправляют слишком много запросов слишком быстро в быстром всплеске, перегружая очередь. Вы можете отслеживать это с помощью Node Stats с течением времени, чтобы увидеть, является ли это всплеском или плавным
1. У вас есть очень медленные запросы, которые "застревают" на долгое время, потребляя потоки и вызывая резервное копирование очереди. Вы можете включить медленный журнал, чтобы увидеть, есть ли запросы, которые занимают исключительно долгое время, а затем попытаться настроить их
1. Могут быть потенциально "бесконечные" скрипты, написанные на Groovy или что-то подобное. Например, цикл, который никогда не выходит, заставляя поток вращаться вечно.
1. Ваше оборудование может быть недостаточно подготовлено для вашей рабочей нагрузки и создавать узкое место на каком-то ресурсе (диск, процессор и т.д.)
1. Временная проблема с вашей целью iSCSI, которая заставляет все операции в полете блокироваться, ожидая возврата дисков. Не потребуется большой задержки, чтобы серьезно резервировать занятый кластер... ES обычно ожидает, что диски всегда доступны.
1. Тяжелые сборки мусора также могут вызвать проблемы. Проверьте Node Stats, чтобы увидеть, запущено ли много/долгих old gen GC

Этот английский текст в основном говорит: ваша машина слишком низкая, вы запрашиваете слишком много. Опыт `MySQL` также применим к ES.

## Выбор узлов

Если вы просто играете, не создавайте так много узлов. `Elasticsearch` — убийца памяти.

Если ресурсы ограничены, `coordinating`, `data` и `ingest` можно объединить.

### coordinating

Координирующие узлы — это точка входа для запросов

```
node.master:false
node.data:false
node.ingest:false
```

### master

Выбор мастера, определение местоположения шардов

```
node.master:true
node.data:false
node.ingest:false
```

### data

Узлы, которые хранят шарды

```
node.master:false
node.data:true
node.ingest:false
```

### ingest

Узлы ingest отвечают за обработку конвейеров

```
node.master:false
node.data:false
node.ingest:true
```

## Оптимизация системной конфигурации

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

queue_size — это ограничение для одновременных запросов, по умолчанию 1000. В разных версиях названия могут немного отличаться. Параметры пула потоков можно напрямую прикрепить к параметрам запуска (в конце концов, монтирование файлов конфигурации также является проблемой для меня).

Ссылки:

1. [Настройка кластеров](https://www.elastic.co/guide/en/elasticsearch/reference/current/settings.html)
1. [Обновление конфигурации кластера](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)
1. [Конфигурация пула потоков](https://www.elastic.co/guide/en/elasticsearch/reference/6.5/modules-threadpool.html)


## Оптимизация конфигурации индекса

### shard

Рекомендуется, чтобы размер одного шарда не превышал 30 ГБ на небольших узлах. На узлах более высоких характеристик размер одного шарда не должен превышать 50 ГБ.

Для сценариев анализа логов или очень больших индексов рекомендуется, чтобы размер одного шарда не превышал 100 ГБ.

Количество шардов (включая реплики) должно максимально соответствовать количеству узлов, равняться количеству узлов или быть целым кратным количеству узлов.

Обычно мы рекомендуем, чтобы количество шардов для одного индекса на одном узле не превышало 5.


## Оптимизация запросов

Для параметра `_all`, если он не нужен в бизнес-использовании, наша обычная рекомендация — отключить его или добавить выборочно.

### Выбирать только необходимые поля

Как и в реляционных базах данных, не используйте `select *`.

```
GET /product/goods/109524071?filter_path=_source.zdid
{
  "_source" : {
    "zdid" : 48
  }
}
```

Подобное использование включает `_source`, но в отличие от `filter_path`, возвращаемые результаты будут включать поля по умолчанию самого документа.

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

**Примечание: _source и filter_path нельзя использовать вместе**

### Отключить автоматическое сопоставление при создании новых индексов

[псевдонимы индекса](https://www.elastic.co/guide/en/elasticsearch/reference/5.5/indices-aliases.html)

## Другой опыт

Согласно практическому опыту, elasticsearch в основном используется для меньшего количества индексов и большего количества поисков, поэтому оптимизация для поиска более подходящая.

### Лучшие практики для логов

Если потеря логов не имеет значения, рекомендуется использовать 1 узел с 0 реплика-шардами для хранения логов.

Используйте `xx-<date>` для логовых индексов, чтобы при удалении можно было напрямую удалить индекс.

Я чувствую, что умираю каждый раз, когда использую delete by query...

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

## Устранение неполадок и обслуживание

### Не назначенные шарды

`Решение:` Создайте новый индекс с `number_of_replicas`, установленным на 0, затем используйте `_reindex`. После завершения миграции измените `number_of_replicas` обратно. `reindex` имеет параметр `size`, настройка его по мере необходимости может быть быстрее.

**Примечание** Вы можете просмотреть связанные задачи через `GET _tasks?actions=indices:data/write/reindex?detailed`

Ссылки
1. [Производительность Elasticsearch Reindex улучшена в 10 раз](https://my.oschina.net/TOW/blog/1928075)
1. [Решение проблемы неспособности reroute не назначенных шардов кластера elasticsearch](https://www.jianshu.com/p/542ed5a5bdfc)
1. [tasks API](https://www.elastic.co/guide/en/elasticsearch/reference/current/tasks.html)

### reindex

reindex также имеет техники.

```bash
# Отключить реплики
put geonames/_settings
{
 
    "settings" : {
      "index" : {
        "number_of_replicas" : "0"
    }
  
}
}
# Во время отключения обновления результаты _count не обновляются
json='{"index":{"refresh_interval":"-1"}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json

# Вы также можете отменить на полпути
curl -XPOST 0.0.0.0:9200/_tasks/mHCg6HqYTqqd12nIDFDk1w:2977/_cancel

# Восстановить механизм обновления
json='{"index":{"refresh_interval":null}}'
curl -XPUT 0.0.0.0:9200/geonames/_settings -H 'Content-Type: application/json' -d $json
```

### gc overhead

```
[2019-01-04T08:41:09,538][INFO ][o.e.m.j.JvmGcMonitorService] [elasticsearch-onekey-3] [gc][159] overhead, spent [276ms] collecting in the last [1s]
```

`Решение/Корень проблемы:` Кластер перегружен, упал

- Индекс желтый в течение длительного времени

`Решение/Корень проблемы:` Сначала установите `number_of_replicas` на 0, затем верните обратно, вручную запустите синхронизацию.

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

- Катящийся перезапуск

[_rolling_restarts](https://www.elastic.co/guide/en/elasticsearch/guide/current/_rolling_restarts.html)

- Анализ медленного журнала

Медленные журналы делятся на типы поиска и индекса, и могут быть установлены на уровне индекса или кластера

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

Ссылки:

1. [Сбор медленных запросов ES](http://www.fblinux.com/?p=1334)
1. [Использование reroute для ручной передачи шардов](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-reroute.html)

### No alive nodes found in your cluster

Это требует конкретного анализа, проверьте логи ES. Это может быть проблема, вызванная ограничением в 1000 одновременных соединений.

## Справочные инструменты

[elasticHQ](http://www.elastichq.org/)

## Ссылки:
1. [Как построить корпоративные поисковые решения с Elasticsearch?](https://zhuanlan.zhihu.com/p/29449979)
1. [Практика многоуровневой архитектуры Elasticsearch в Didi](https://mp.weixin.qq.com/s/K44-L0rclaIM40hma55pPQ)
1. [От платформы к средней платформе: практический опыт Elasticsearch в Ant Financial](https://www.infoq.cn/article/IfwCVj-qJ4TU0dmBZ177)
1. [Почему запросы Elasticsearch стали такими медленными?](https://blog.csdn.net/laoyang360/article/details/83048087)
1. [Оптимизация Elasticsearch через реальные случаи в Douban](https://www.dongwm.com/post/elasticsearch-performance-tuning-practice-at-douban/#%E5%89%8D%E8%A8%80)
1. []()
