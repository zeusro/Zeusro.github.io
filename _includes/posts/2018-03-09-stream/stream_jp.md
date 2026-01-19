1. [準備](#準備)
    * エンティティの定義
    * コレクションの定義
1. [streamのその他の用法](#streamのその他の用法)
    - [コレクションの検証に使用](#コレクションの検証に使用引用元ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - [自分でストリームを生成](#自分でストリームを生成引用元ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - Stream.iterate
1. [streamの注意事項](#streamの注意事項)
    * ストリームは一度しか使用できず、再利用すると以下の例外が発生します
    * filter
1. [完全なコード](#完全なコード)
1. [参考リンク](#参考リンク)

<script src="https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98.js"></script>

## 準備

* エンティティの定義

```java
// {% raw %}
package com.zeusro;


import java.util.Date;
import java.util.List;

/**
 * The type Person <p/>
 * author: <a href="http://zeusro.github.io/">Zeusro</a> <p/>
 *
 * @date Created in 2018.03.08 <p/>
 */
public class Person implements Cloneable {

    // 身長
    private int height;
    // 体重
    private int weight;
    // 身分証明書番号
    private String identifier;
    // 住所
    private String address;
    // 誕生日
    private Date birthday;
    // 趣味
    private List<String> hobbies;

    // 性別
    private Sex sex;

    @Override
    protected Object clone() throws CloneNotSupportedException {
        return (Person) super.clone();
    }

    public Sex getSex() {
        return sex;
    }

    public void setSex(Sex sex) {
        this.sex = sex;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Date getBirthday() {
        return birthday;
    }

    public void setBirthday(Date birthday) {
        this.birthday = birthday;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public List<String> getHobbies() {
        return hobbies;
    }

    public void setHobbies(List<String> hobbies) {
        this.hobbies = hobbies;
    }

    public String getIdentifier() {
        return identifier;
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public int getWeight() {
        return weight;
    }

    public void setWeight(int weight) {
        this.weight = weight;
    }


}
//{% endraw %}
```

```java

package com.zeusro;

public enum Sex {
    // 男性
    Male,
    // 女性
    Female,
    // 第三の性 https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
    X,
}
```

* コレクションの定義

```java
// {% raw %}
            // LocalDate.of(2018, 02, 29);
            //java.time.DateTimeException: Invalid date 'February 29' as '2018' is not a leap year
            final Person female = new Person();
            female.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1981, 1, 1)));
            female.setHeight(165);
            female.setWeight(50);
            female.setSex(Sex.Female);
            female.setAddress("北京");
            female.setIdentifier("1");
            female.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("逛街");
            }});

            final Person male = new Person();
            male.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1982, 2, 1)));
            male.setHeight(170);
            male.setWeight(50);
            male.setSex(Sex.Male);
            male.setAddress("北京");
            male.setIdentifier("2");
            male.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("看電影");
            }});

            final Person x = new Person();
            x.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1983, 3, 1)));
            x.setHeight(170);
            x.setWeight(50);
            x.setSex(Sex.X);
            x.setAddress("北京");
            x.setIdentifier("3");
            x.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("上網");
            }});

            final Person male2 = new Person();
            male2.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1984, 1, 1)));
            male2.setHeight(150);
            male2.setWeight(35);
            male2.setSex(Sex.Male);
            male2.setAddress("北京");
            male2.setIdentifier("4");
            male2.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("看電影");
            }});

            List<Person> list1 = new ArrayList<Person>() {
                {
                    add(female);
                    add(male);
                    add(x);
                }
            };
            List<Person> list2 = new ArrayList<Person>() {
                {
                    add(female);
                    add(male2);
                }
            };
//{% endraw %}
```

## streamのその他の用法

### コレクションの検証に使用(引用元[IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

> allMatch：Stream内のすべての要素が渡されたpredicateに一致する場合、trueを返します
> 
> anyMatch：Stream内のいずれかの要素が渡されたpredicateに一致する場合、trueを返します
> 
> noneMatch：Stream内のどの要素も渡されたpredicateに一致しない場合、trueを返します
  

### 自分でストリームを生成(引用元[IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

* Stream.generate

Supplierインターフェースを実装することで、ストリームの生成を自分で制御できます。この方法は通常、乱数、定数のStream、または前後の要素間で何らかの状態情報を維持する必要があるStreamに使用されます。SupplierインスタンスをStream.generate()に渡して生成されたStreamは、デフォルトでシリアル（parallelに対して）ですが、順序なし（orderedに対して）です。無限であるため、パイプラインでは、limitなどの操作を使用してStreamのサイズを制限する必要があります。

```java
Random seed = new Random();
Supplier<Integer> random = seed::nextInt;
Stream.generate(random).limit(10).forEach(System.out::println);
//Another way
IntStream.generate(() -> (int) (System.nanoTime() % 100)).
limit(10).forEach(System.out::println);
```

Stream.generate()は、自分で実装したSupplierも受け入れます。たとえば、大量のテストデータを構築する際に、何らかの自動ルールを使用して各変数に値を割り当てる場合、または式に基づいてStreamの各要素値を計算する場合です。これらはすべて状態情報を維持するケースです。

```java
Stream.generate(new PersonSupplier()).
limit(10).
forEach(p -> System.out.println(p.getName() + ", " + p.getAge()));
private class PersonSupplier implements Supplier<Person> {
 private int index = 0;
 private Random random = new Random();
 @Override
 public Person get() {
 return new Person(index++, "StormTestUser" + index, random.nextInt(100));
 }
}
```

```
# 出力結果：
StormTestUser1, 9
StormTestUser2, 12
StormTestUser3, 88
StormTestUser4, 51
StormTestUser5, 22
StormTestUser6, 28
StormTestUser7, 81
StormTestUser8, 51
StormTestUser9, 4
StormTestUser10, 76
```

* Stream.iterate

iterateはreduce操作と非常によく似ており、シード値とUnaryOperator（例：f）を受け入れます。その後、シード値がStreamの最初の要素になり、f(seed)が2番目、f(f(seed))が3番目、というように続きます。

```java
Stream.iterate(0, n -> n + 3).limit(10). forEach(x -> System.out.print(x + " "));.
```

```
# 出力結果：
0 3 6 9 12 15 18 21 24 27
```

**Stream.generateと同様に、iterateを使用する際は、パイプラインにlimitなどの操作が必要で、Streamのサイズを制限する必要があります。**



## streamの注意事項

* ストリームは一度しか使用できず、再利用すると以下の例外が発生します

```java
Stream<Person> list1Stream = list1.stream();
list1Stream.filter(o -> o.getBirthday().equals(time1)).count();
list1Stream.filter(o -> !o.getBirthday().equals(time1)).count();//java.lang.IllegalStateException: stream has already been operated upon or closed
```

したがって、コレクション操作が必要な場合は、`Stream<Person> list1Stream = list1.stream();`を使用して定義するのではなく、毎回新しいstreamを直接作成することをお勧めします

```java
list1.stream().filter(o -> o.getBirthday().equals(time1)).count();
list1.stream().filter(o -> !o.getBirthday().equals(time1)).count();
```

* filter

通常、filter操作がある場合、並列ストリームparallelStreamは使用しません。使用すると、スレッドセーフティの問題が発生する可能性があります


## 完全なコード

```java
// {% raw %}

import com.google.gson.Gson;
import com.zeusro.Person;
import com.zeusro.Sex;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static java.lang.System.out;


/**
 * The type Main <p/>
 * author: <a href="http://zeusro.github.io/">Zeusro</a> <p/>
 *
 * @date Created in 2018.03.09 <p/>
 */
public class Main {


    private static Date convertLocalDateToTimeZone(LocalDate localDate) {
        ZoneId zoneID = ZoneId.systemDefault();
        return Date.from(localDate.atStartOfDay(zoneID).toInstant());
    }

    public static void main(String[] args) {

        try {
            // LocalDate.of(2018, 02, 29);
            //java.time.DateTimeException: Invalid date 'February 29' as '2018' is not a leap year
            final Person female = new Person();
            female.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1981, 1, 1)));
            female.setHeight(165);
            female.setWeight(50);
            female.setSex(Sex.Female);
            female.setAddress("北京");
            female.setIdentifier("1");
            female.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("逛街");
            }});

            final Person male = new Person();
            male.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1982, 2, 1)));
            male.setHeight(170);
            male.setWeight(50);
            male.setSex(Sex.Male);
            male.setAddress("北京");
            male.setIdentifier("2");
            male.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("看電影");
            }});

            final Person x = new Person();
            x.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1983, 3, 1)));
            x.setHeight(170);
            x.setWeight(50);
            x.setSex(Sex.X);
            x.setAddress("北京");
            x.setIdentifier("3");
            x.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("上網");
            }});

            final Person male2 = new Person();
            male2.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1984, 1, 1)));
            male2.setHeight(150);
            male2.setWeight(35);
            male2.setSex(Sex.Male);
            male2.setAddress("北京");
            male2.setIdentifier("4");
            male2.setHobbies(new ArrayList<String>() {{
                add("吃飯");
                add("看電影");
            }});

            List<Person> list1 = new ArrayList<Person>() {
                {
                    add(female);
                    add(male);
                    add(x);
                }
            };
            List<Person> list2 = new ArrayList<Person>() {
                {
                    add(female);
                    add(male2);
                }
            };
            //ストリームは一度しか使用できず、再利用すると以下の例外が発生します
            //java.lang.IllegalStateException: stream has already been operated upon or closed
            Stream<Person> list1Stream = list1.stream();
            Date time1 = convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1));
            //0
            Long count1 = list1.stream().filter(o -> o.getBirthday().equals(time1)).count();
            Map<Sex, List<Person>> group1 = list1.stream().collect(Collectors.groupingBy(Person::getSex));
            Iterator it = group1.entrySet().iterator();
            while (it.hasNext()) {
                Map.Entry<Sex, List<Person>> groupByItem = (Map.Entry) it.next();
                Sex sex = groupByItem.getKey();
                out.println(sex);
                groupByItem.getValue().forEach(person -> {
                    out.println(new Gson().toJson(person));
                });
            }
/*
出力結果:
Male
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}
Female
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"Female"}
X
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
 */
            //streamにはRemoveAll操作がありません
            Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
            list1.stream().forEach(o -> {
                //ForEach内でコレクションを操作できます
                o.setSex(Sex.X);
            });
            list1.forEach(o -> {
                out.println(new Gson().toJson(o));
            });
/*
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"}
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
 */
            //IntStreamのmaxメソッドはOptionalIntを返します。値を読み取る前に値があるかどうかを確認する必要があります。isPresent=falseの場合、直接getAsIntを呼び出すとエラーが発生します。mapToLong、mapToDoubleも同様です
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //文字列連結、数値のsum、min、max、averageはすべて特殊なreduceです。
            //コレクションが長さ0のコレクションの場合、初期値Integer.MIN_VALUEが返されます。初期値も任意に渡すことはできません。その理由はまだ明確ではありません
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            //170
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
                //170
            }
            //mapToIntパラメータの2つの書き方は同じです。以下の書き方を好みますが、ideaはwarningを報告します
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
            list1.stream().map(Person::getIdentifier).distinct();
            //skipとlimitパラメータは両方ともlongであることに注意してください
            list1.stream().skip(1L).limit(2L);
            out.println("------------------------------------|昇順|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            /*
[{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}]
[{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}]            
             */
            out.println("------------------------------------|降順|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
/*
[{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}]
[{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}]
 */
            out.println("------------------------------------|積集合 list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
            out.println("------------------------------------|和集合list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
            list1.stream().distinct().collect(Collectors.toList());
            out.println("------------------------------------|差集合list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
            out.println("------------------------------------|データ構造変換|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
            out.println("------------------------------------|その他の注意点|------------------------------------");
            //2つの配列をこの方法で結合すると、list2が空になります
            Stream.of(list1, list2).collect(Collectors.toList());
            //以下が正しい使用方法です
            Stream.of(list1, list2).flatMap(List::stream).collect(Collectors.toList());
            out.println("------------------------------------|reduce|------------------------------------");
            //文字列連結、数値のsum、min、max、averageはすべて特殊なreduceです。
            maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
            int sumWeight = -1;
            OptionalInt sumWeightOption = list1.stream().mapToInt(Person::getHeight).reduce(Integer::sum);
            if (sumWeightOption.isPresent()) {
                sumWeight = sumWeightOption.getAsInt();
            }
            sumWeight = list1.stream().mapToInt(Person::getHeight).reduce(0, (a, b) -> a + b);
            sumWeight = list1.stream().mapToInt(Person::getHeight).reduce(0, Integer::sum);

            out.println("------------------------------------|peek ,forEach ,forEachOrdered |------------------------------------");
            out.println("forEachの後はメソッドを続けて実行できません");
            list1.stream().forEach(o -> {
                out.println(new Gson().toJson(o));
            });
            /*
forEachの後はメソッドを続けて実行できません
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"北京","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}            
             */
            out.println("まずソートしてから、反復処理します");
            list1.stream().forEachOrdered(o -> {
                out.println(new Gson().toJson(o));
            });
/*
まずソートしてから、反復処理します
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"北京","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}
 */
            out.println("peek*2");
            List<Integer> l = Stream.iterate(0, (Integer n) -> n + 1) //毎回1ずつ増加する等差数列を生成
                    .peek(n -> out.println("number generated:" + n))
                    .filter(n -> (n % 2 == 0))
                    .peek(n -> out.println("Even number filter passed for" + n)) //偶数に遭遇したときに続けて出力
                    .limit(5).collect(Collectors.toList());
            out.println(new Gson().toJson(l));
            //9を生成したときにこの操作が終了したことがわかります。これはlimitが設定されているためです
            /*
peek*2
number generated:0
Even number filter passed for0
number generated:1
number generated:2
Even number filter passed for2
number generated:3
number generated:4
Even number filter passed for4
number generated:5
number generated:6
Even number filter passed for6
number generated:7
number generated:8
Even number filter passed for8
[0,2,4,6,8]            
             */
        } catch (Exception e) {
            out.println(e);
        } finally {
            out.println("done");
        }
    }


}

// {% endraw %}
```


## 参考リンク:

1. [Java 8 中的 Streams API 详解](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/)
1. [Introduction to the Java 8 Date/Time API](http://www.baeldung.com/java-8-date-time-intro)
1. [Convert java.time.LocalDate into java.util.Date type](https://stackoverflow.com/questions/22929237/convert-java-time-localdate-into-java-util-date-type)
1. [Java 8之Stream API](http://irusist.github.io/2015/12/30/Java-8%E4%B9%8BStream-API/)
1. [Comparator.comparing(…) throwing non-static reference exception while taking String::compareTo](https://stackoverflow.com/questions/43274306/comparator-comparing-throwing-non-static-reference-exception-while-taking-s)
1. [采用java8 lambda表达式 实现java list 交集/并集/差集/去重并集](http://blog.csdn.net/gzt19881123/article/details/78327465)
1. [详解Java中的clone方法 -- 原型模式](http://blog.csdn.net/zhangjg_blog/article/details/18369201)
1. [Collection to stream to a new collection
](https://stackoverflow.com/questions/21522341/collection-to-stream-to-a-new-collection)
1. [Java parallel stream用法](http://www.cnblogs.com/huangzifu/p/7631164.html)
1. [Java 8 – How to 'peek' into a running Stream| Stream.peek method tutorial with examples](https://www.javabrahman.com/java-8/java-8-how-to-peek-into-a-running-stream-peek-method-tutorial-with-examples/)
1. [JDK8函数式接口Function、Consumer、Predicate、Supplier](https://blog.csdn.net/z834410038/article/details/77370785)
