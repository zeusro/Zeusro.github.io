## Bean Validation仕様に組み込まれた制約アノテーション定義
```
制約アノテーション名	制約アノテーション説明
@Null	オブジェクトがnullかどうかを検証
@NotNull	オブジェクトが非nullかどうかを検証
@AssertTrue	Booleanオブジェクトがtrueかどうかを検証
@AssertFalse	Booleanオブジェクトがfalseかどうかを検証
@Min	NumberおよびStringオブジェクトが指定された値以上かどうかを検証
@Max	NumberおよびStringオブジェクトが指定された値以下かどうかを検証
@DecimalMin	NumberおよびStringオブジェクトが指定された値以上かどうかを検証（小数の精度が存在）
@DecimalMax	NumberおよびStringオブジェクトが指定された値以下かどうかを検証（小数の精度が存在）
@Size	オブジェクト（Array、Collection、Map、String）の長さが指定された範囲内かどうかを検証
@Digits	NumberおよびStringの構成が有効かどうかを検証
@Past	DateおよびCalendarオブジェクトが現在時刻より前かどうかを検証
@Future	DateおよびCalendarオブジェクトが現在時刻より後かどうかを検証
@Pattern	Stringオブジェクトが正規表現の規則に準拠しているかどうかを検証
```

## querystringでパラメータを受信 / POST Formでパラメータを受信
これら2つを一緒に書くのは、受信方法が同じで、複数のフィールドを個別に受信できるためです。

* 典型的なPOST Multi Formの例

```JAVA
@Validated
@RestController
public class PictureAPIs {
    public ApiResult add(@RequestParam("file") MultipartFile file,
                         @NotNull(message = "xxxは空にできません!")
                         @Size(min = 32, max = 32, message = "32文字の文字列である必要があります")
                         @RequestParam String gidUnique,                         
                         @Pattern(regexp = "^(taobao_picture_upload|taobao_product_img_upload|taobao_item_img_upload|taobao_product_add)$",message = "typeのオプション値:XXX")
                         @RequestParam("type") String type,                         
                         @RequestParam("i") String i) {
                         }
}
```

* @Validated
@Validatedは最も重要です。コントローラーパラメータの検証が必要なすべてのAPIにこのアノテーションを追加する必要があります。

* @RequestParam
これは非常に重要です。送信されたすべてのパラメータにこのタグを追加する必要があります。`@RequestParam("file")`は、name=fileのパラメータ送信を受信することを意味します。

* @NotNull
非null検証、これは非常に一般的です

* @Size
文字列の長さの上限と下限

* @Pattern
正規表現

## JSONパラメータの受信

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
    @NotNull(message = "base64は空にできません!")
    String base64;

    public String getBase64() {
        return base64;
    }

    public void setBase64(String base64) {
        this.base64 = base64;
    }

}
```
この例では、パラメータ検証タグはPictureAddBase64RequestBodyのフィールドに配置されます。

## その他

* 検証メソッド

```java
 //検証 
 public static<T> void validate(T t){ 
     Validator validator = factory.getValidator();
      Set<ConstraintViolation<T>> constraintViolations = validator.validate(t); 
      for(ConstraintViolation<T> constraintViolation : constraintViolations) { System.out.println(constraintViolation.getMessage()); } }
```

参考リンク:
1. [カスタムアノテーションとパラメータ検証](https://www.jianshu.com/p/2e71656aa88c)
1. [Javaアノテーション + アノテーションとインターセプターベースのログイン検証 / 権限制御](https://www.jianshu.com/p/f9f9490a0924)
1. [Bean Validation constraints](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/#validator-defineconstraints-spec)
1. [Bean Validation技術仕様の特徴概要](https://www.ibm.com/developerworks/cn/java/j-lo-beanvalid/)
1. [SpringMVCデータ検証 - 第7章 アノテーションベースのコントローラーのデータ検証、型変換およびフォーマット - Kaitaoと一緒にSpringMVCを学ぶ](http://jinnianshilongnian.iteye.com/blog/1733708)
