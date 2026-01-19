Immutable programming is a programming philosophy. Simply put, it means that an object's properties can only be set once.

## ImmutableEphemeralVolume(immutable secret)

Take `kubernetes`' recent (end of 2019) `ImmutableEphemeralVolume` as an example.

I looked at the source code, and the main idea is that `configmap` and `secret` cannot be updated after creation.

Taking secret as an example, the current (2020-04-16) definition of secret is:

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

Actually, just look at

```go
Immutable *bool `json:"immutable,omitempty"`
```

That's enough. You can see this is a pointer to bool. Because this field is currently in the `alpha` stage, the `omitempty` tag is used to ignore it.


## Determining if it has been injected

`Secret` has a String method that's interesting.

Simply put, it uses reflection to determine if a field has been injected.

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

The valueToStringGenerated method expands like this:

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

I simplified the model and wrote an example.

## Example

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

## Conclusion

Add a field to the `struct`, this field is a pointer.

Use reflection to get the members of the `struct` (such as fields), and then determine if they have been injected.

In some cases (like string), using a private field and exposing a singleton-pattern Set method from the struct also works. I guess bool is special, which is why `kubernetes` officially used the `*bool` data structure.


## References
1. [Kubernetes: What is Immutable Infrastructure?](https://dyn.com/blog/kubernetes-what-is-immutable-infrastructure/)
2. [Image volumes and container volume](https://github.com/kubernetes/kubernetes/issues/831)
3. [How to set bool pointer to true in struct literal?](https://stackoverflow.com/questions/28817992/how-to-set-bool-pointer-to-true-in-struct-literal)
