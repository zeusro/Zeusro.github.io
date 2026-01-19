Неизменяемое программирование — это философия программирования. Проще говоря, это означает, что свойства объекта можно установить только один раз.

## ImmutableEphemeralVolume(immutable secret)

Возьмём в качестве примера недавний (конец 2019 года) `ImmutableEphemeralVolume` в `kubernetes`.

Я посмотрел исходный код, основная идея в том, что `configmap` и `secret` нельзя обновить после создания.

В качестве примера возьмём secret, текущее (2020-04-16) определение secret такое:

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
	StringData map[string]string `json:"stringData,omitempty" protobuf:"bytes,4,opt,name=stringData"`

	// Used to facilitate programmatic handling of secret data.
	// +optional
	Type SecretType `json:"type,omitempty" protobuf:"bytes,3,opt,name=type,casttype=SecretType"`
}
```

На самом деле достаточно посмотреть на

```go
Immutable *bool `json:"immutable,omitempty"`
```

Видно, что это указатель на bool. Поскольку это поле находится на стадии `alpha`, используется тег `omitempty` для его игнорирования.


## Определение, было ли оно внедрено

У `Secret` есть интересный метод String.

Проще говоря, он использует рефлексию для определения, было ли поле внедрено.

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

Метод valueToStringGenerated разворачивается так:

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

Я упростил модель и написал пример.

## Пример

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

## Заключение

Добавить поле в `struct`, это поле — указатель.

Использовать рефлексию для получения членов `struct` (таких как поля), а затем определить, были ли они внедрены.

В некоторых случаях (например, string) использование приватного поля и предоставление struct метода Set в паттерне singleton также работает. Я думаю, bool особенный, поэтому `kubernetes` официально использовал структуру данных `*bool`.


## Ссылки
1. [Kubernetes: What is Immutable Infrastructure?](https://dyn.com/blog/kubernetes-what-is-immutable-infrastructure/)
2. [Image volumes and container volume](https://github.com/kubernetes/kubernetes/issues/831)
3. [How to set bool pointer to true in struct literal?](https://stackoverflow.com/questions/28817992/how-to-set-bool-pointer-to-true-in-struct-literal)
