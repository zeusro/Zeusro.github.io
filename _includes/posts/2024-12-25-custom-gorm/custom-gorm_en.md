For simple types, gorm implements conversion from database types to programming language types. For custom types, serialization and deserialization methods need to be implemented.

The serialization method refers to the conversion from Go code types to database types, corresponding to the Value method;
Deserialization refers to the conversion from database types to Go code types, corresponding to the Scan method.

## Custom Types

For custom types, implementing 2 methods is sufficient. The trouble lies with third-party types.

## Third-Party Types

```go
type FatPod struct {
AnnotationAffinity       PodAffinityTerms             `json:"annotation_affinity" gorm:"type:PodAffinityTerms;column:annotation_affinity" comment:"pod反亲和性注解"`
ResourceLimit            *corev1.ResourceRequirements `json:"-" gorm:"-" comment:"资源限制"`
ResourceLimitP           ResourceRequirementsP        `json:"resource_limit" gorm:"type:ResourceRequirementsP;column:resource_limit" comment:"资源限制"`
}

type PodAffinityTerms []PodAffinityTerm
type ResourceRequirementsP corev1.ResourceRequirements

// Scan implements the sql.Scanner interface, Scan scans value into Jsonb, deserialization operation
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

//Value implements the driver.Valuer interface, Value returns json value, serialization operation
func (obj ResourceRequirementsP) Value() (driver.Value, error) {
	if &obj == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(obj)
}
```

If the struct uses a third-party package, we cannot easily modify this type directly. If the original type is an object array, then change the original `[]OBJECT` to `NEWTYPE`, and implement 2 methods in `NEWTYPE`.

type NEWTYPE `[]OBJECT`

If the original type is a struct, or `*struct`, I suggest adding a type alias in the struct, implement serialization and deserialization methods for this type. Then do a little manipulation in the tags. As shown in the code above:
The original type `ResourceLimit` remains unchanged, use `ResourceLimitP` as the actual stored and displayed attribute.

This way, places in the program that originally involved the old field don't need to be changed. You only need to assign values to the newly added attribute where data is stored in the database.

## Other Notes

After adding a column to the data table, I used the default value `'{}'` for `annotation_affinity`, but this field is actually an array, which caused deserialization to fail:
sql: Scan error on column index 62, name "annotation_affinity": json: cannot unmarshal object into Go value of type dao.PodAffinityTerms;

So if there are non-standard values in the database, whether to make the Scan method return an error is a point to consider.

In addition, I found that the Value method can assign default values to this field at the program level. The specific usage is to return `[]byte("{}"), nil` when the object pointer is determined to be empty.
