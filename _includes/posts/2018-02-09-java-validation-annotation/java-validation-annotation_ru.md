## Встроенные определения аннотаций ограничений в спецификации Bean Validation
```
Имя аннотации ограничения	Описание аннотации ограничения
@Null	Проверяет, является ли объект null
@NotNull	Проверяет, является ли объект не null
@AssertTrue	Проверяет, является ли Boolean объект true
@AssertFalse	Проверяет, является ли Boolean объект false
@Min	Проверяет, больше или равно ли Number и String объекты указанному значению
@Max	Проверяет, меньше или равно ли Number и String объекты указанному значению
@DecimalMin	Проверяет, больше или равно ли Number и String объекты указанному значению, с десятичной точностью
@DecimalMax	Проверяет, меньше или равно ли Number и String объекты указанному значению, с десятичной точностью
@Size	Проверяет, находится ли длина объекта (Array, Collection, Map, String) в заданном диапазоне
@Digits	Проверяет, является ли состав Number и String допустимым
@Past	Проверяет, находятся ли Date и Calendar объекты до текущего времени
@Future	Проверяет, находятся ли Date и Calendar объекты после текущего времени
@Pattern	Проверяет, соответствует ли String объект правилам регулярного выражения
```

## Получение параметров через QueryString / POST Form
Эти два написаны вместе, потому что они получают параметры одинаковым способом и могут получать несколько полей отдельно.

* Типичный пример POST Multi Form

```JAVA
@Validated
@RestController
public class PictureAPIs {
    public ApiResult add(@RequestParam("file") MultipartFile file,
                         @NotNull(message = "xxx не может быть пустым!")
                         @Size(min = 32, max = 32, message = "Должна быть 32-символьная строка")
                         @RequestParam String gidUnique,                         
                         @Pattern(regexp = "^(taobao_picture_upload|taobao_product_img_upload|taobao_item_img_upload|taobao_product_add)$",message = "type опциональные значения:XXX")
                         @RequestParam("type") String type,                         
                         @RequestParam("i") String i) {
                         }
}
```

* @Validated
@Validated является наиболее важным. Эта аннотация должна быть добавлена к каждому API, которое требует проверки параметров контроллера.

* @RequestParam
Это очень важно. Каждый отправленный параметр должен иметь этот тег. `@RequestParam("file")` означает получение отправки параметра с name=file.

* @NotNull
Проверка на не-null, это очень распространено

* @Size
Верхний и нижний пределы длины строки

* @Pattern
Регулярное выражение

## Получение JSON параметров

```java
@RequestMapping(value = "/api/picture/add/base64",method = RequestMethod.POST, produces = "application/json;charset=UTF-8")
    public ApiResult add(
            @Validated
            @RequestBody PictureAddBase64RequestBody body,
            @CookieValue(name = CookieMessageConst.ACCESS_TOKEN_KEY, required = false) String token) {
            }
```

```java
public class PictureAddBase64RequestBody extends PictureAddBaseRequestBody {

    private static final long serialVersionUID = 6185318090948651724L;
    @NotNull(message = "base64 не может быть пустым!")
    String base64;

    public String getBase64() {
        return base64;
    }

    public void setBase64(String base64) {
        this.base64 = base64;
    }

}
```
Используя это в качестве примера, теги проверки параметров размещаются на полях PictureAddBase64RequestBody.

## Другое

* Метод проверки

```java
 //Проверка 
 public static<T> void validate(T t){ 
     Validator validator = factory.getValidator();
      Set<ConstraintViolation<T>> constraintViolations = validator.validate(t); 
      for(ConstraintViolation<T> constraintViolation : constraintViolations) { System.out.println(constraintViolation.getMessage()); } }
```

Ссылки:
1. [Пользовательские аннотации и проверка параметров](https://www.jianshu.com/p/2e71656aa88c)
1. [Java аннотации + Проверка входа / Управление разрешениями на основе аннотаций и перехватчиков](https://www.jianshu.com/p/f9f9490a0924)
1. [Bean Validation constraints](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/#validator-defineconstraints-spec)
1. [Обзор функций технической спецификации Bean Validation](https://www.ibm.com/developerworks/cn/java/j-lo-beanvalid/)
1. [Проверка данных SpringMVC - Глава 7 Проверка данных контроллера на основе аннотаций, преобразование типов и форматирование - Изучение SpringMVC с Kaitao](http://jinnianshilongnian.iteye.com/blog/1733708)
