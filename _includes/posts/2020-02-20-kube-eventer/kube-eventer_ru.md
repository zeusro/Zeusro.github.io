## Происхождение

Происходит из [документации](https://help.aliyun.com/document_detail/125679.html) Alibaba Cloud

После обнаружения, что kubernetes Event можно использовать для push-уведомлений, мне это очень понравилось. Но его собственный метод push DingTalk был неудобен в использовании, поэтому я решил изменить его самостоятельно.

## Решение о разработке

Исходный код проекта находится в [kube-eventer](https://github.com/AliyunContainerService/kube-eventer)
, и я также узнал о механизме Event kubernetes

1. Controller Manager записывает события регистрации и уничтожения узлов, события масштабирования и обновления Deployment
1. kubelet записывает события переработки образов, события неудачной монтировки volume. В основном все события определены в `kubernetes/pkg/kubelet/events/event.go`


## Структура Event

Структура Event определена в `"k8s.io/api/core/v1"`

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



```json
// kubectl get event -o json
{
    "apiVersion": "v1",
    "items": [{
        "apiVersion": "v1",
        "count": 2416,
        "eventTime": null,
        "firstTimestamp": "2020-02-14T12:22:43Z",
        "involvedObject": {
            "apiVersion": "v1",
            "kind": "Service",
            "name": "my-sb-svc",
            "namespace": "default",
            "resourceVersion": "264028180",
            "uid": "96117aad-4f24-11ea-a87c-00163e04f1e0"
        },
        "kind": "Event",
        "lastTimestamp": "2020-02-19T13:08:25Z",
        "message": "Port 666 was assigned to multiple services; please recreate service",
        "metadata": {
            "creationTimestamp": "2020-02-14T12:22:43Z",
            "name": "my-sb-svc.15f344468d77364d",
            "namespace": "default",
            "resourceVersion": "267629591",
            "selfLink": "/api/v1/namespaces/test/events/my-sb-svc.15f344468d77364d",
            "uid": "b3a56707-4f24-11ea-81ec-00163e0a865a"
        },
        "reason": "PortAlreadyAllocated",
        "reportingComponent": "",
        "reportingInstance": "",
        "source": {
            "component": "portallocator-repair-controller"
        },
        "type": "Warning"
    }],
    "kind": "List",
    "metadata": {
        "resourceVersion": "",
        "selfLink": ""
    }
}
```

## Детали дизайна

Точка входа программы —
[eventer.go](https://note.youdao.com/)

`sink` — это выходной конец программы, например, может выводить в DingTalk, elasticsearch и т.д.
Этот плагин запустит все `sink` параллельно в форме `go func()` в начале через

```go
sinkManager, err := sinks.NewEventSinkManager(sinkList, sinks.DefaultSinkExportEventsTimeout, sinks.DefaultSinkStopTimeout)
```

Этот метод.

Настоящий главный герой — это manager

```go
manager, err := manager.NewManager(sources[0], sinkManager, *argFrequency)
```

Он принимает `sinkManager` и ряд других параметров, запускает главную функцию. После многократного развертывания определений вы найдете метод `Housekeep`

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

Этот метод написан очень просто и ясно, бесконечные рекурсивные вызовы, если не получен сигнал остановки `stopChan`.

Кроме того, он также по умолчанию прослушивает `0.0.0.0:8084` как порт проверки работоспособности.

Получение Event также довольно эффективно

```go
// NewKubernetesSource Источник событий
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

## Заключение

Языковое выражение разработчика в этом проекте очень лаконично. Этот проект очень подходит для изучения параллелизма golang.


1. [Введение в Kubernetes Events (Часть 1)](https://www.kubernetes.org.cn/1031.html)
2. [Введение в Kubernetes Events (Часть 2)](https://www.kubernetes.org.cn/1090.html)
3. [Введение в Kubernetes Events (Часть 3)](https://www.kubernetes.org.cn/1195.html)
4. [Анализ исходного кода kubelet: Обработка событий](https://cizixs.com/2017/06/22/kubelet-source-code-analysis-part4-event/)
