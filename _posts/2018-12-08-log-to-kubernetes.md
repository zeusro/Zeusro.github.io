---
layout:       post
title:        "采集kubernetes的容器日志"
subtitle:     "推送到ElasticSearch"
date:         2018-12-08
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - kubernetes
---


## 需求

`/var/log/containers`下面的文件其实是软链接

真正的日志文件在`/var/lib/docker/containers`这个目录

可选方案:

1. Logstash(过于消耗内存,尽量不要用这个)
2. fluentd
3. filebeat
4. 不使用docker-driver

## 日志的格式

/var/log/containers

```json
{
	"log": "17:56:04.176 [http-nio-8080-exec-5] INFO  c.a.goods.proxy.GoodsGetServiceProxy - ------ request_id=514136795198259200,zdid=42,gid=108908071,从缓存中获取数据:失败 ------\n",
	"stream": "stdout",
	"time": "2018-11-19T09:56:04.176713636Z"
}

{
	"log": "[][WARN ][2018-11-19 18:13:48,896][http-nio-10080-exec-2][c.h.o.p.p.s.impl.PictureServiceImpl][[msg:图片不符合要求:null];[code:400.imageUrl.invalid];[params:https://img.alicdn.com/bao/uploaded/i2/2680224805/TB2w5C9bY_I8KJjy1XaXXbsxpXa_!!2680224805.jpg];[stack:{\"requestId\":\"514141260156502016\",\"code\":\"400.imageUrl.invalid\",\"msg\":\"\",\"stackTrace\":[],\"suppressedExceptions\":[]}];]\n",
	"stream": "stdout",
	"time": "2018-11-19T10:13:48.896892566Z"
}
```

## Logstash

- filebeat.yml

```
filebeat:
  prospectors:
  - type: log
    //开启监视，不开不采集
    enable: true
    paths:  # 采集日志的路径这里是容器内的path
    - /var/log/elkTest/error/*.log
    # 日志多行合并采集
    multiline.pattern: '^\['
    multiline.negate: true
    multiline.match: after
    # 为每个项目标识,或者分组，可区分不同格式的日志
    tags: ["java-logs"]
    # 这个文件记录日志读取的位置，如果容器重启，可以从记录的位置开始取日志
    registry_file: /usr/share/filebeat/data/registry

output:
  # 输出到logstash中
  logstash:
    hosts: ["0.0.0.0:5044"]
```

注：6.0以上该filebeat.yml需要挂载到/usr/share/filebeat/filebeat.yml,另外还需要挂载/usr/share/filebeat/data/registry 文件，避免filebeat容器挂了后，新起的重复收集日志。  


- logstash.conf

```
input {
	beats {
	    port => 5044
	}
}
filter {
    
   if "java-logs" in [tags]{ 
     grok {
        match => {
	       "message" => "(?<date>\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2},\d{3})\]\[(?<level>[A-Z]{4,5})\]\[(?<thread>[A-Za-z0-9/-]{4,40})\]\[(?<class>[A-Za-z0-9/.]{4,40})\]\[(?<msg>.*)"
        }
        remove_field => ["message"]
     }
    }
	#if ([message] =~ "^\[") {
    #    drop {}
    #}
	# 不匹配正则，匹配正则用=~
	if [level] !~ "(ERROR|WARN|INFO)" {
        drop {}
    }
}

## Add your filters / logstash plugins configuration here

output {
	elasticsearch {
		hosts => "0.0.0.0:9200"
	}
}

```

## fluentd

[fluentd-es-image镜像](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/fluentd-elasticsearch/fluentd-es-image)

[Kubernetes-基于EFK进行统一的日志管理](https://www.kubernetes.org.cn/4278.html)


[Docker Logging via EFK (Elasticsearch + Fluentd + Kibana) Stack with Docker Compose](https://docs.fluentd.org/v0.12/articles/docker-logging-efk-compose)


## filebeat+ES pipeline


### 定义pipeline

- 定义java专用的管道
```

PUT /_ingest/pipeline/java
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"\\[%{LOGLEVEL:level}\\s+?\\]\\[(?<date>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2},\\d{3})\\]\\[(?<thread>[A-Za-z0-9/-]+?)\\]\\[%{JAVACLASS:class}\\]\\[(?<msg>[\\s\\S]*?)\\]\\[(?<stack>.*?)\\]"
			]
		},"remove": {
              "field": "message"
            }
	}]
}

PUT /_ingest/pipeline/nginx
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"%{IP:client} - - \\[(?<date>.*?)\\] \"(?<method>[A-Za-z]+?) (?<url>.*?)\" %{NUMBER:statuscode} %{NUMBER:duration} \"(?<refer>.*?)\" \"(?<user-agent>.*?)\"" 
			]
		},"remove": {
              "field": "message"
            }
	}]
}

PUT /_ingest/pipeline/default
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": []
}

PUT /_ingest/pipeline/all
{
	"description": "[0]java[1]nginx[last]通用规则",
	"processors": [{
		"grok": {
			"field": "message",
			"patterns": [
				"\\[%{LOGLEVEL:level}\\s+?\\]\\[(?<date>\\d{4}-\\d{2}-\\d{2}\\s\\d{2}:\\d{2}:\\d{2},\\d{3})\\]\\[(?<thread>[A-Za-z0-9/-]+?)\\]\\[%{JAVACLASS:class}\\]\\[(?<msg>[\\s\\S]*?)\\]\\[(?<stack>.*?)\\]",
				
				"%{IP:client} - - \\[(?<date>.*?)\\] \"(?<method>[A-Za-z]+?) (?<url>.*?)\" %{NUMBER:statuscode} %{NUMBER:duration} \"(?<refer>.*?)\" \"(?<user-agent>.*?)\"",
				
				".+"
			]
		}
	}]
}

```

### filebeat.yml

```
    # ......
    # 省略了其他,只保留了关键的部分
    
    output:
      elasticsearch:
        hosts: ['${ELASTICSEARCH_HOST:elasticsearch}:${ELASTICSEARCH_PORT:9200}']
        # username: ${ELASTICSEARCH_USERNAME}
        # password: ${ELASTICSEARCH_PASSWORD}
        pipelines:
          - pipeline: "java"
```


参考链接:
1. [running-on-kubernetes](https://www.elastic.co/guide/en/beats/filebeat/current/running-on-kubernetes.html)
1. [ELK+Filebeat 集中式日志解决方案详解](https://www.ibm.com/developerworks/cn/opensource/os-cn-elk-filebeat/index.html)
2. [filebeat.yml（中文配置详解）](http://www.cnblogs.com/zlslch/p/6622079.html)
3. [Elasticsearch Pipeline 详解](https://www.felayman.com/articles/2017/11/24/1511527532643.html)



## 其他方案

有些是sidecar模式,sidecar模式可以做得比较细致.

1. [使用filebeat收集kubernetes中的应用日志](https://jimmysong.io/posts/kubernetes-filebeat/)
1. [使用Logstash收集Kubernetes的应用日志](https://jimmysong.io/posts/kubernetes-logstash/)
2. 


### 阿里云的方案

1. [Kubernetes日志采集流程](https://help.aliyun.com/document_detail/66654.html?spm=5176.8665266.sug_det.5.bbdc9gVU9gVUmc)


### 跟随docker启动
1. [docker驱动](https://www.fluentd.org/guides/recipes/docker-logging)
2. 


```bash
kubectl delete po $pod  -n kube-system
kubectl get po -l k8s-app=fluentd-es -n kube-system
pod=`kubectl get po -l k8s-app=fluentd-es -n kube-system | grep -Eoi 'fluentd-es-([a-z]|-|[0-9])+'` && kubectl logs $pod -n kube-system
kubectl get events -n kube-system | grep $pod
```
