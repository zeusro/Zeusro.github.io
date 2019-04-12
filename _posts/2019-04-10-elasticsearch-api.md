---
layout:       post
title:        "Elasticsearch常用API"
subtitle:     ""
date:         2019-04-10
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Elasticsearch
---


默认并发限制1000

## 常用API

- 返回文档的一部分


?_source=title,text

- 健康检查

GET /_cluster/health


- 部分更新

/_update

- 取回多个文档

/_mget


- 分析

GET /_analyze


GET _cat/indices


## 付费功能(_xpack)

- [security-api-users](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-api-users.html)

免费版不支持

GET /_xpack/security/user


## 参考链接:

1. [基础入门](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/getting-started.html)
1. [文档元数据](https://www.elastic.co/guide/cn/elasticsearch/guide/cn/_Document_Metadata.html)
