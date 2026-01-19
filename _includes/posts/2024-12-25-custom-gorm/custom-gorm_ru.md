Для простых типов gorm реализует преобразование из типов базы данных в типы языка программирования. Для пользовательских типов необходимо реализовать методы сериализации и десериализации.

Метод сериализации относится к преобразованию из типов кода Go в типы базы данных, соответствует методу Value;
Десериализация относится к преобразованию из типов базы данных в типы кода Go, соответствует методу Scan.

## Пользовательские типы

Для пользовательских типов достаточно реализовать 2 метода. Проблема заключается в типах сторонних разработчиков.

## Типы сторонних разработчиков

```go
type FatPod struct {
AnnotationAffinity       PodAffinityTerms             `json:"annotation_affinity" gorm:"type:PodAffinityTerms;column:annotation_affinity" comment:"pod反亲和性注解"`
ResourceLimit            *corev1.ResourceRequirements `json:"-" gorm:"-" comment:"资源限制"`
ResourceLimitP           ResourceRequirementsP        `json:"resource_limit" gorm:"type:ResourceRequirementsP;column:resource_limit" comment:"资源限制"`
}

type PodAffinityTerms []PodAffinityTerm
type ResourceRequirementsP corev1.ResourceRequirements

// Scan реализует интерфейс sql.Scanner, Scan сканирует value в Jsonb, операция десериализации
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

//Value реализует интерфейс driver.Valuer, Value возвращает json value, операция сериализации
func (obj ResourceRequirementsP) Value() (driver.Value, error) {
	if &obj == nil {
		return []byte("{}"), nil
	}
	return json.Marshal(obj)
}
```

Если структура использует пакет стороннего разработчика, мы не можем легко изменить этот тип напрямую. Если исходный тип — это массив объектов, измените исходный `[]OBJECT` на `NEWTYPE` и реализуйте 2 метода в `NEWTYPE`.

type NEWTYPE `[]OBJECT`

Если исходный тип — это struct или `*struct`, я предлагаю добавить псевдоним типа в структуре, реализовать методы сериализации и десериализации для этого типа. Затем немного манипулировать тегами. Как показано в коде выше:
Исходный тип `ResourceLimit` остаётся без изменений, используйте `ResourceLimitP` как фактически сохраняемый и отображаемый атрибут.

Таким образом, места в программе, которые изначально затрагивали старое поле, не нужно изменять. Вам нужно только присвоить значения новому добавленному атрибуту там, где данные сохраняются в базе данных.

## Другие замечания

После добавления столбца в таблицу данных я использовал значение по умолчанию `'{}'` для `annotation_affinity`, но это поле на самом деле является массивом, что привело к сбою десериализации:
sql: Scan error on column index 62, name "annotation_affinity": json: cannot unmarshal object into Go value of type dao.PodAffinityTerms;

Поэтому, если в базе данных есть нестандартные значения, следует ли заставить метод Scan возвращать ошибку — это момент, который нужно рассмотреть.

Кроме того, я обнаружил, что метод Value может назначать значения по умолчанию для этого поля на уровне программы. Конкретное использование — возвращать `[]byte("{}"), nil`, когда указатель объекта определяется как пустой.
