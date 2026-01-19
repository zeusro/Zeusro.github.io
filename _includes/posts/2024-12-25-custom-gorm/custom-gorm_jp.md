単純型の場合、gormはデータベース型からプログラミング言語型への変換を実装していますが、カスタム型の場合は、シリアル化と逆シリアル化メソッドを実装する必要があります。

シリアル化メソッドは、Goコード型からデータベース型への変換を指し、Valueメソッドに対応します。
逆シリアル化は、データベース型からGoコード型への変換を指し、Scanメソッドに対応します。

## カスタム型

カスタム型の場合、2つのメソッドを実装すれば十分です。問題はサードパーティ型にあります。

## サードパーティ型

```go
type FatPod struct {
AnnotationAffinity       PodAffinityTerms             `json:"annotation_affinity" gorm:"type:PodAffinityTerms;column:annotation_affinity" comment:"pod反亲和性注解"`
ResourceLimit            *corev1.ResourceRequirements `json:"-" gorm:"-" comment:"资源限制"`
ResourceLimitP           ResourceRequirementsP        `json:"resource_limit" gorm:"type:ResourceRequirementsP;column:resource_limit" comment:"资源限制"`
}

type PodAffinityTerms []PodAffinityTerm
type ResourceRequirementsP corev1.ResourceRequirements

// Scan はsql.Scannerインターフェースを実装し、ScanはvalueをJsonbにスキャンします（逆シリアル化操作）
func (obj *ResourceRequirementsP) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New(fmt.Sprint("Failed to unmarshal JSONB value:", value))
	}
	result := ResourceRequirementsP{}
	err := json.Unmarshal(bytes, &result)
	*obj = result
	return err
}

//Value はdriver.Valuerインターフェースを実装し、Valueはjson valueを返します（シリアル化操作）
func (obj ResourceRequirementsP) Value() (driver.Value, error) {
	if &obj == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(obj)
}
```

構造体がサードパーティパッケージを使用している場合、この型を直接変更することは容易ではありません。元の型がオブジェクト配列の場合、元の`[]OBJECT`を`NEWTYPE`に変更し、`NEWTYPE`で2つのメソッドを実装します。

type NEWTYPE `[]OBJECT`

元の型がstruct、または`*struct`の場合、構造体に型エイリアスを追加し、この型にシリアル化と逆シリアル化メソッドを実装することをお勧めします。次に、タグで少し操作します。上記のコードに示すように：
元の型`ResourceLimit`は変更されず、`ResourceLimitP`を実際に保存および表示される属性として使用します。

これにより、プログラム内で元々古いフィールドに関連していた場所を変更する必要がなくなります。データベースにデータを保存する場所で、新しく追加された属性に値を割り当てるだけで済みます。

## その他の注意事項

データテーブルに列を追加した後、`annotation_affinity`にデフォルト値`'{}'`を使用しましたが、このフィールドは実際には配列であるため、逆シリアル化が失敗しました：
sql: Scan error on column index 62, name "annotation_affinity": json: cannot unmarshal object into Go value of type dao.PodAffinityTerms;

したがって、データベースに非標準の値が存在する場合、Scanメソッドにエラーを返させるかどうかは考慮すべき点です。

さらに、Valueメソッドは、プログラムレベルでこのフィールドにデフォルト値を割り当てることができることを発見しました。具体的な使用方法は、オブジェクトポインタが空であると判断された場合に`[]byte("{}"), nil`を返すことです。
