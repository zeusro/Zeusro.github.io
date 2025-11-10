---
layout:       post
title:        "golang 的不可变（Immutable）编程"
subtitle:     "Immutable go"
date:         2020-04-16
author:       "Zeusro"
header-img:   "img/b/2020/Mononoke.png" 
header-mask:  0.3
catalog:      true
multilingual: false
published:    true
tags:
    - go
    - Kubernetes
---


不可变编程是一种编程思想。简单地说，就是对象的属性只能set一次。

## ImmutableEphemeralVolume(immutable secret)

以 `kubernetes` 最近(2019年年底)的一个 `ImmutableEphemeralVolume` 为例。

我看了一下源代码，大意就是说，`configmap` 和 `secret` 在创建后不可更新。

以 secret 为例，目前（2020-04-16）secret 的定义是这样的：

```go

// Secret holds secret data of a certain type. The total bytes of the values in
// the Data field must be less than MaxSecretSize bytes.
type Secret struct {
	metav1.TypeMeta `json:",inline"`
	// Standard object's metadata.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`

	// Immutable, if set to true, ensures that data stored in the Secret cannot
	// be updated (only object metadata can be modified).
	// If not set to true, the field can be modified at any time.
	// Defaulted to nil.
	// This is an alpha field enabled by ImmutableEphemeralVolumes feature gate.
	// +optional
	Immutable *bool `json:"immutable,omitempty" protobuf:"varint,5,opt,name=immutable"`

	// Data contains the secret data. Each key must consist of alphanumeric
	// characters, '-', '_' or '.'. The serialized form of the secret data is a
	// base64 encoded string, representing the arbitrary (possibly non-string)
	// data value here. Described in https://tools.ietf.org/html/rfc4648#section-4
	// +optional
	Data map[string][]byte `json:"data,omitempty" protobuf:"bytes,2,rep,name=data"`

	// stringData allows specifying non-binary secret data in string form.
	// It is provided as a write-only convenience method.
	// All keys and values are merged into the data field on write, overwriting any existing values.
	// It is never output when reading from the API.
	// +k8s:conversion-gen=false
	// +optional
	StringData map[string]string `json:"stringData,omitempty" protobuf:"bytes,4,rep,name=stringData"`

	// Used to facilitate programmatic handling of secret data.
	// +optional
	Type SecretType `json:"type,omitempty" protobuf:"bytes,3,opt,name=type,casttype=SecretType"`
}
```

其实只看 

```go
Immutable *bool `json:"immutable,omitempty"`
```

就可以了。可以看到，这是一个 bool 的指针。因为这个字段目前处于`alpha` 的阶段，所以用了 `omitempty` 这个标签忽略掉了。


## 判断是否已经注入

`Secret` 有个 String 方法有点意思。

简单地说就是通过反射判断字段是否已经注入。

```go

func (this *Secret) String() string {
	......
	s := strings.Join([]string{`&Secret{`,
		`ObjectMeta:` + strings.Replace(strings.Replace(fmt.Sprintf("%v", this.ObjectMeta), "ObjectMeta", "v1.ObjectMeta", 1), `&`, ``, 1) + `,`,
		`Data:` + mapStringForData + `,`,
		`Type:` + fmt.Sprintf("%v", this.Type) + `,`,
		`StringData:` + mapStringForStringData + `,`,
		`Immutable:` + valueToStringGenerated(this.Immutable) + `,`,
		`}`,
	}, "")
	return s
}

```

valueToStringGenerated 方法展开是这样的：

```go
func valueToStringGenerated(v interface{}) string {
	rv := reflect.ValueOf(v)
	if rv.IsNil() {
		return "nil"
	}
	pv := reflect.Indirect(rv).Interface()
	return fmt.Sprintf("*%v", pv)
}
```

我简化了一下模型，写了个例子。

## 例子

```go
package main

import (
	"fmt"
	"reflect"
)

type Secret struct {
	Immutable *bool `json:"immutable,omitempty"`
}

func main() {
	s := Secret{Immutable: &[]bool{true}[0]}
	fmt.Println(valueToStringGenerated(s.Immutable)) // *true
	s = Secret{}
	fmt.Println(valueToStringGenerated(s.Immutable)) // nil
}

func valueToStringGenerated(v interface{}) string {
	rv := reflect.ValueOf(v)
	if rv.IsNil() {
		return "nil"
	}
	pv := reflect.Indirect(rv).Interface()
	return fmt.Sprintf("*%v", pv)
}
```

## 结论

为 `struct` 增加一个字段，这个字段是一个指针。

通过反射获取 `struct` 的成员（比如字段），进而判断是否已经注入。

有些情况（比如string），用私有字段，struct 暴露一个单例模式的 Set 方法也行。我猜是 bool 类型比较特殊，所以 `kubernetes` 官方才用了 `*bool` 这个数据结构。


## 参考链接
1. [Kubernetes: What is Immutable Infrastructure?](https://dyn.com/blog/kubernetes-what-is-immutable-infrastructure/)
2. [Image volumes and container volume](https://github.com/kubernetes/kubernetes/issues/831)
3. [How to set bool pointer to true in struct literal?](https://stackoverflow.com/questions/28817992/how-to-set-bool-pointer-to-true-in-struct-literal)