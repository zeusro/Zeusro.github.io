不変プログラミングはプログラミングの思想です。簡単に言えば、オブジェクトのプロパティは一度だけ設定できるということです。

## ImmutableEphemeralVolume(immutable secret)

`kubernetes`の最近（2019年末）の`ImmutableEphemeralVolume`を例にします。

ソースコードを見たところ、要するに`configmap`と`secret`は作成後に更新できないということです。

secretを例にすると、現在（2020-04-16）のsecretの定義は次のとおりです：

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

実際には

```go
Immutable *bool `json:"immutable,omitempty"`
```

を見れば十分です。これはboolへのポインタです。このフィールドは現在`alpha`段階にあるため、`omitempty`タグを使用して無視されています。


## 注入されたかどうかの判断

`Secret`には興味深いStringメソッドがあります。

簡単に言えば、リフレクションを使用してフィールドが注入されたかどうかを判断します。

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

valueToStringGeneratedメソッドは次のように展開されます：

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

モデルを簡略化して、例を作成しました。

## 例

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

## 結論

`struct`にフィールドを追加します。このフィールドはポインタです。

リフレクションを使用して`struct`のメンバー（フィールドなど）を取得し、注入されたかどうかを判断します。

一部のケース（stringなど）では、プライベートフィールドを使用し、structがシングルトンパターンのSetメソッドを公開することも可能です。bool型が特殊であるため、`kubernetes`公式が`*bool`データ構造を使用したのだと思います。


## 参考リンク
1. [Kubernetes: What is Immutable Infrastructure?](https://dyn.com/blog/kubernetes-what-is-immutable-infrastructure/)
2. [Image volumes and container volume](https://github.com/kubernetes/kubernetes/issues/831)
3. [How to set bool pointer to true in struct literal?](https://stackoverflow.com/questions/28817992/how-to-set-bool-pointer-to-true-in-struct-literal)
