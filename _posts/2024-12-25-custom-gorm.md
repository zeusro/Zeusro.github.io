---
layout:       post
title:        "在 gorm 中使用自定义类型"
subtitle:     ""
date:         2024-12-25
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - gorm
---

对于简单类型，gorm 实现了从数据库类型到程序语言类型的转换，而对于自定义类型，需要实现序列化和反序列化方法。

序列化方法指的是从go的代码类型到数据库的类型的转换，对应 Value 方法；
反序列化指的是从数据库的类型到go的代码类型的转换，对应 Scan 方法。

## 自有类型

自有类型的话，实现2个方法即可。麻烦的在于第三方类型。

## 第三方类型

```go
type FatPod struct {
AnnotationAffinity       PodAffinityTerms             `json:"annotation_affinity" gorm:"type:PodAffinityTerms;column:annotation_affinity" comment:"pod反亲和性注解"`
ResourceLimit            *corev1.ResourceRequirements `json:"-" gorm:"-" comment:"资源限制"`
ResourceLimitP           ResourceRequirementsP        `json:"resource_limit" gorm:"type:ResourceRequirementsP;column:resource_limit" comment:"资源限制"`
}

type PodAffinityTerms []PodAffinityTerm
type ResourceRequirementsP corev1.ResourceRequirements

// Scan 实现 sql.Scanner 接口，Scan 将 value 扫描至 Jsonb，反序列化操作
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

//Value  实现 driver.Valuer 接口，Value 返回 json value，序列化操作
func (obj ResourceRequirementsP) Value() (driver.Value, error) {
	if &obj == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(obj)
}
```

如果结构体使用了第三方包，我们不方便直接修改这个类型。如果原本的类型是对象数组，那么把原本的\[]OBJECT,调成 NEWTYPE 即可，在NEWTYPE中实现2个方法。

type NEWTYPE \[]OBJECT

如果原本的类型是struct，或者\*struct，我建议是在结构体中新增一个类型别名，对这个类型实现序列化和反序列方法。然后在标签那里做一点手脚。如上面代码所示：
原本的类型ResourceLimit不变，用一个ResourceLimitP作为实际落库和显示的属性。

这样程序中原本涉及旧字段的地方都不需要改。只需要在存数据库的地方，对新加的属性赋值即可。

## 其他注意事项

在数据表增加列后，我给 annotation\_affinity 用的默认值是'{}'，但是这字段实际是数组，这导致反序列化时失败了：
sql: Scan error on column index 62, name "annotation\_affinity": json: cannot unmarshal object into Go value of type dao.PodAffinityTerms;

所以如果数据库中存在不符合规范的值，是否要让 Scan 方法返回错误，这是一个需要考虑的点。

除此以外，我发现 Value 方法，可以在程序层面，给这个字段赋予默认值。具体用法就是当判断对象指针为空时，返回 \[]byte("{}"), nil
