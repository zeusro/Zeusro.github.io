## Built-in Constraint Annotation Definitions in Bean Validation Specification
```
Constraint Annotation Name	Constraint Annotation Description
@Null	Validates that the object is null
@NotNull	Validates that the object is not null
@AssertTrue	Validates that the Boolean object is true
@AssertFalse	Validates that the Boolean object is false
@Min	Validates that Number and String objects are greater than or equal to the specified value
@Max	Validates that Number and String objects are less than or equal to the specified value
@DecimalMin	Validates that Number and String objects are greater than or equal to the specified value, with decimal precision
@DecimalMax	Validates that Number and String objects are less than or equal to the specified value, with decimal precision
@Size	Validates that the object (Array, Collection, Map, String) length is within the given range
@Digits	Validates that the composition of Number and String is legal
@Past	Validates that Date and Calendar objects are before the current time
@Future	Validates that Date and Calendar objects are after the current time
@Pattern	Validates that the String object conforms to the rules of the regular expression
```

## Receiving Parameters via QueryString / POST Form
These two are written together because they receive parameters in the same way, and can receive multiple fields separately.

* Typical POST Multi Form Example

```JAVA
@Validated
@RestController
public class PictureAPIs {
    public ApiResult add(@RequestParam("file") MultipartFile file,
                         @NotNull(message = "xxx cannot be empty!")
                         @Size(min = 32, max = 32, message = "Must be a 32-character string")
                         @RequestParam String gidUnique,                         
                         @Pattern(regexp = "^(taobao_picture_upload|taobao_product_img_upload|taobao_item_img_upload|taobao_product_add)$",message = "type optional values:XXX")
                         @RequestParam("type") String type,                         
                         @RequestParam("i") String i) {
                         }
}
```

* @Validated
@Validated is the most important. This annotation needs to be added to every API that requires controller parameter validation.

* @RequestParam
This is very important. Every submitted parameter needs to have this tag. `@RequestParam("file")` means receiving a parameter submission with name=file.

* @NotNull
Non-null validation, this is very common

* @Size
String length upper and lower limits

* @Pattern
Regular expression

## Receiving JSON Parameters

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
    @NotNull(message = "base64 cannot be empty!")
    String base64;

    public String getBase64() {
        return base64;
    }

    public void setBase64(String base64) {
        this.base64 = base64;
    }

}
```
Using this as an example, the parameter validation tags are placed on the fields of PictureAddBase64RequestBody.

## Other

* Validation Method

```java
 //Validate 
 public static<T> void validate(T t){ 
     Validator validator = factory.getValidator();
      Set<ConstraintViolation<T>> constraintViolations = validator.validate(t); 
      for(ConstraintViolation<T> constraintViolation : constraintViolations) { System.out.println(constraintViolation.getMessage()); } }
```

Reference Links:
1. [Custom Annotations and Parameter Validation](https://www.jianshu.com/p/2e71656aa88c)
1. [Java Annotations + Login Verification / Permission Control Based on Annotations & Interceptors](https://www.jianshu.com/p/f9f9490a0924)
1. [Bean Validation constraints](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/#validator-defineconstraints-spec)
1. [Bean Validation Technical Specification Feature Overview](https://www.ibm.com/developerworks/cn/java/j-lo-beanvalid/)
1. [SpringMVC Data Validation - Chapter 7 Annotation-based Controller Data Validation, Type Conversion and Formatting - Learning SpringMVC with Kaitao](http://jinnianshilongnian.iteye.com/blog/1733708)
