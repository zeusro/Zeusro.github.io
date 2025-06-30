---
layout:       post
title:        "springMVC的验证注解"
subtitle:     ""
date:         2018-02-09
author:       "Zeusro"
header-img:   "img/b/2018/psc.jpeg"
header-mask:  0.3
catalog:      true
tags:
    - Java
---


##  Bean Validation 规范内嵌的约束注解定义
```
约束注解名称	约束注解说明
@Null	验证对象是否为空
@NotNull	验证对象是否为非空
@AssertTrue	验证 Boolean 对象是否为 true
@AssertFalse	验证 Boolean 对象是否为 false
@Min	验证 Number 和 String 对象是否大等于指定的值
@Max	验证 Number 和 String 对象是否小等于指定的值
@DecimalMin	验证 Number 和 String 对象是否大等于指定的值，小数存在精度
@DecimalMax	验证 Number 和 String 对象是否小等于指定的值，小数存在精度
@Size	验证对象（Array,Collection,Map,String）长度是否在给定的范围之内
@Digits	验证 Number 和 String 的构成是否合法
@Past	验证 Date 和 Calendar 对象是否在当前时间之前
@Future	验证 Date 和 Calendar 对象是否在当前时间之后
@Pattern	验证 String 对象是否符合正则表达式的规则
```

## querystring接收参数/ POST Form接收参数
这两种合在一起写是因为他们接收的方式都是一样的,可以用多个字段分开接收



* 典型的POST Multi Form 示例

```JAVA
@Validated
@RestController
public class PictureAPIs {
    public ApiResult add(@RequestParam("file") MultipartFile file,
                         @NotNull(message = "xxx不得为空!")
                         @Size(min = 32, max = 32, message = "必须是32位的字符串")
                         @RequestParam String gidUnique,                         
                         @Pattern(regexp = "^(taobao_picture_upload|taobao_product_img_upload|taobao_item_img_upload|taobao_product_add)$",message = "type可选值:XXX")
                         @RequestParam("type") String type,                         
                         @RequestParam("i") String i) {
                         }
}
```

* @Validated
@Validated是最重要的,在每个需要验证控制器参数的 API 上面都需要加上这个注解

* @RequestParam
这个是很重要的,每个提交的参数都需要加上这个标签`@RequestParam("file")`表示接收 name=file 的参数提交.

* @NotNull
非空验证,这个很常见

* @Size
字符串长度上下限

* @Pattern
正则


## 接收JSON参数

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
    @NotNull(message = "base64不得为空!")
    String base64;

    public String getBase64() {
        return base64;
    }

    public void setBase64(String base64) {
        this.base64 = base64;
    }

}
```
以这个为例,参数的校验标签放在PictureAddBase64RequestBody的字段上面


## 其他

* 验证方法

```java
 //验证 
 public static<T> void validate(T t){ 
     Validator validator = factory.getValidator();
      Set<ConstraintViolation<T>> constraintViolations = validator.validate(t); 
      for(ConstraintViolation<T> constraintViolation : constraintViolations) { System.out.println(constraintViolation.getMessage()); } }
```

参考链接:
1. [自定义注解与参数验证](https://www.jianshu.com/p/2e71656aa88c)
1. [Java注解 + 基于注解 & 拦截器实现登录验证 / 权限控制](https://www.jianshu.com/p/f9f9490a0924)
1. [Bean Validation constraints](https://docs.jboss.org/hibernate/stable/validator/reference/en-US/html_single/#validator-defineconstraints-spec)
1. [Bean Validation 技术规范特性概述](https://www.ibm.com/developerworks/cn/java/j-lo-beanvalid/)
1. [SpringMVC数据验证——第七章 注解式控制器的数据验证、类型转换及格式化——跟着开涛学SpringMVC](http://jinnianshilongnian.iteye.com/blog/1733708)