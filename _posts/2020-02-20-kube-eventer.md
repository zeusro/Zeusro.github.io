---
layout:       post
title:        "kube-eventer，一个超好用的事件监控工具"
subtitle:     ""
date:         2020-02-20
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Kubernetes
---

## 缘起

起源来自阿里云的[文档](https://help.aliyun.com/document_detail/125679.html)

发现能对 kubernetes Event 进行消息推送之后，非常喜欢。但是其本身的钉钉推送方式不好用，所以决定亲自修改。

## 决定开发

项目源代码位于 [kube-eventer](https://github.com/AliyunContainerService/kube-eventer)
，顺便了解了一下kubernetes 的 Event 机制

1. Controller Manager 会记录节点注册和销毁的事件、Deployment 扩容和升级的事件
1. kubelet 会记录镜像回收事件、volume 无法挂载事件。基本上所有的事件都在`kubernetes/pkg/kubelet/events/event.go`l里面定义


## Event 结构体

Event 结构体定义在 `"k8s.io/api/core/v1"`里面

```go
// Event is a report of an event somewhere in the cluster.
type Event struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#metadata
	metav1.ObjectMeta `json:"metadata" protobuf:"bytes,1,opt,name=metadata"`

	// The object that this event is about.
	InvolvedObject ObjectReference `json:"involvedObject" protobuf:"bytes,2,opt,name=involvedObject"`

	// This should be a short, machine understandable string that gives the reason
	// for the transition into the object's current status.
	// TODO: provide exact specification for format.
	// +optional
	Reason string `json:"reason,omitempty" protobuf:"bytes,3,opt,name=reason"`

	// A human-readable description of the status of this operation.
	// TODO: decide on maximum length.
	// +optional
	Message string `json:"message,omitempty" protobuf:"bytes,4,opt,name=message"`

	// The component reporting this event. Should be a short machine understandable string.
	// +optional
	Source EventSource `json:"source,omitempty" protobuf:"bytes,5,opt,name=source"`

	// The time at which the event was first recorded. (Time of server receipt is in TypeMeta.)
	// +optional
	FirstTimestamp metav1.Time `json:"firstTimestamp,omitempty" protobuf:"bytes,6,opt,name=firstTimestamp"`

	// The time at which the most recent occurrence of this event was recorded.
	// +optional
	LastTimestamp metav1.Time `json:"lastTimestamp,omitempty" protobuf:"bytes,7,opt,name=lastTimestamp"`

	// The number of times this event has occurred.
	// +optional
	Count int32 `json:"count,omitempty" protobuf:"varint,8,opt,name=count"`

	// Type of this event (Normal, Warning), new types could be added in the future
	// +optional
	Type string `json:"type,omitempty" protobuf:"bytes,9,opt,name=type"`

	// Time when this Event was first observed.
	// +optional
	EventTime metav1.MicroTime `json:"eventTime,omitempty" protobuf:"bytes,10,opt,name=eventTime"`

	// Data about the Event series this event represents or nil if it's a singleton Event.
	// +optional
	Series *EventSeries `json:"series,omitempty" protobuf:"bytes,11,opt,name=series"`

	// What action was taken/failed regarding to the Regarding object.
	// +optional
	Action string `json:"action,omitempty" protobuf:"bytes,12,opt,name=action"`

	// Optional secondary object for more complex actions.
	// +optional
	Related *ObjectReference `json:"related,omitempty" protobuf:"bytes,13,opt,name=related"`

	// Name of the controller that emitted this Event, e.g. `kubernetes.io/kubelet`.
	// +optional
	ReportingController string `json:"reportingComponent" protobuf:"bytes,14,opt,name=reportingComponent"`

	// ID of the controller instance, e.g. `kubelet-xyzf`.
	// +optional
	ReportingInstance string `json:"reportingInstance" protobuf:"bytes,15,opt,name=reportingInstance"`
}


// ObjectReference contains enough information to let you inspect or modify the referred object.
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type ObjectReference struct {
	// Kind of the referent.
	// More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#types-kinds
	// +optional
	Kind string `json:"kind,omitempty" protobuf:"bytes,1,opt,name=kind"`
	// Namespace of the referent.
	// More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/
	// +optional
	Namespace string `json:"namespace,omitempty" protobuf:"bytes,2,opt,name=namespace"`
	// Name of the referent.
	// More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
	// +optional
	Name string `json:"name,omitempty" protobuf:"bytes,3,opt,name=name"`
	// UID of the referent.
	// More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#uids
	// +optional
	UID types.UID `json:"uid,omitempty" protobuf:"bytes,4,opt,name=uid,casttype=k8s.io/apimachinery/pkg/types.UID"`
	// API version of the referent.
	// +optional
	APIVersion string `json:"apiVersion,omitempty" protobuf:"bytes,5,opt,name=apiVersion"`
	// Specific resourceVersion to which this reference is made, if any.
	// More info: https://git.k8s.io/community/contributors/devel/api-conventions.md#concurrency-control-and-consistency
	// +optional
	ResourceVersion string `json:"resourceVersion,omitempty" protobuf:"bytes,6,opt,name=resourceVersion"`

	// If referring to a piece of an object instead of an entire object, this string
	// should contain a valid JSON/Go field access statement, such as desiredState.manifest.containers[2].
	// For example, if the object reference is to a container within a pod, this would take on a value like:
	// "spec.containers{name}" (where "name" refers to the name of the container that triggered
	// the event) or if no container name is specified "spec.containers[2]" (container with
	// index 2 in this pod). This syntax is chosen only to have some well-defined way of
	// referencing a part of an object.
	// TODO: this design is not final and this field is subject to change in the future.
	// +optional
	FieldPath string `json:"fieldPath,omitempty" protobuf:"bytes,7,opt,name=fieldPath"`
}
```

## 设计细节

程序的入口是
[eventer.go](https://note.youdao.com/)

`sink` 是程序的输出端，比如可以输出到钉钉，elasticsearch等等。
这一块插件会在一开始通过

```go
sinkManager, err := sinks.NewEventSinkManager(sinkList, sinks.DefaultSinkExportEventsTimeout, sinks.DefaultSinkStopTimeout)
```

这个方法，以`go func()` 形式并行启动所有 `sink` 。

真正的主角是 manager

```go
manager, err := manager.NewManager(sources[0], sinkManager, *argFrequency)
```

它接受 `sinkManager` 和其他一系列参数，启动主函数。重复展开定义之后，会找到`Housekeep` 这个方法

```go
func (rm *realManager) Housekeep() {
	for {
		// Try to infovke housekeep at fixed time.
		now := time.Now()
		start := now.Truncate(rm.frequency)
		end := start.Add(rm.frequency)
		timeToNextSync := end.Sub(now)

		select {
		case <-time.After(timeToNextSync):
			rm.housekeep()
		case <-rm.stopChan:
			rm.sink.Stop()
			return
		}
	}
}
```

这个方法写得非常简单明了，无限递归调用，除非接收到 `stopChan` 这个停止信号。

除此以外，还默认监听了 `0.0.0.0:8084` 作为健康检查的端口。

Event 的获取也相当高效

```go
// NewKubernetesSource 事件来源
func NewKubernetesSource(uri *url.URL) (*KubernetesEventSource, error) {
	kubeConfig, err := kubeconfig.GetKubeClientConfig(uri)
	if err != nil {
		return nil, err
	}
	kubeClient, err := kubeclient.NewForConfig(kubeConfig)
	if err != nil {
		return nil, err
	}
	eventClient := kubeClient.CoreV1().Events(kubeapi.NamespaceAll)
	result := KubernetesEventSource{
		localEventsBuffer: make(chan *kubeapi.Event, LocalEventsBufferSize),
		stopChannel:       make(chan struct{}),
		eventClient:       eventClient,
	}
	go result.watch()
	return &result, nil
}
```

## 结语

这个项目的开发者语言表达非常精炼，这个项目很适用于学习 golang 并发。


1. [Kubernetes Events介绍（上）](https://www.kubernetes.org.cn/1031.html)
2. [Kubernetes Events介绍（中）](https://www.kubernetes.org.cn/1090.html)
3. [Kubernetes Events介绍（下）](https://www.kubernetes.org.cn/1195.html)
4. [kubelet 源码分析： 事件处理](https://cizixs.com/2017/06/22/kubelet-source-code-analysis-part4-event/)