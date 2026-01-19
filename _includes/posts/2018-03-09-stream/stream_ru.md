1. [Подготовка](#подготовка)
    * Определение сущности
    * Определение коллекции
1. [Другие способы использования stream](#другие-способы-использования-stream)
    - [Для проверки коллекций](#для-проверки-коллекций-цитируется-по-ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - [Самостоятельная генерация потока](#самостоятельная-генерация-потока-цитируется-по-ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - Stream.iterate
1. [Важные замечания по stream](#важные-замечания-по-stream)
    * Поток можно использовать только один раз, повторное использование приведет к следующему исключению
    * filter
1. [Полный код](#полный-код)
1. [Ссылки](#ссылки)

<script src="https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98.js"></script>

## Подготовка

* Определение сущности

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

    // Рост
    private int height;
    // Вес
    private int weight;
    // Номер удостоверения личности
    private String identifier;
    // Адрес
    private String address;
    // День рождения
    private Date birthday;
    // Хобби
    private List<String> hobbies;

    // Пол
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
    // Мужской
    Male,
    // Женский
    Female,
    // Третий пол https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
    X,
}
```

* Определение коллекции

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

## Другие способы использования stream

### Для проверки коллекций (цитируется по [IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

> allMatch: Возвращает true, если все элементы в Stream соответствуют переданному predicate
> 
> anyMatch: Возвращает true, если любой элемент в Stream соответствует переданному predicate
> 
> noneMatch: Возвращает true, если ни один элемент в Stream не соответствует переданному predicate
  

### Самостоятельная генерация потока (цитируется по [IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

* Stream.generate

Реализуя интерфейс Supplier, вы можете самостоятельно контролировать генерацию потока. Это обычно используется для случайных чисел, константных Stream, или Stream, которым необходимо поддерживать некоторую информацию о состоянии между элементами. Stream, сгенерированный путем передачи экземпляра Supplier в Stream.generate(), по умолчанию является последовательным (относительно parallel), но неупорядоченным (относительно ordered). Поскольку он бесконечен, в конвейере необходимо использовать операции типа limit для ограничения размера Stream.

```java
Random seed = new Random();
Supplier<Integer> random = seed::nextInt;
Stream.generate(random).limit(10).forEach(System.out::println);
//Another way
IntStream.generate(() -> (int) (System.nanoTime() % 100)).
limit(10).forEach(System.out::println);
```

Stream.generate() также принимает вашу собственную реализацию Supplier. Например, при построении больших объемов тестовых данных, используя какое-то автоматическое правило для присвоения значений каждой переменной; или вычисляя каждое значение элемента Stream по формуле. Это все случаи, когда поддерживается информация о состоянии.

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
# Результат вывода：
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

iterate очень похож на операцию reduce, принимает начальное значение и UnaryOperator (например, f). Затем начальное значение становится первым элементом Stream, f(seed) - вторым, f(f(seed)) - третьим, и так далее.

```java
Stream.iterate(0, n -> n + 3).limit(10). forEach(x -> System.out.print(x + " "));.
```

```
# Результат вывода：
0 3 6 9 12 15 18 21 24 27
```

**Аналогично Stream.generate, при использовании iterate в конвейере должны быть операции типа limit для ограничения размера Stream.**



## Важные замечания по stream

* Поток можно использовать только один раз, повторное использование приведет к следующему исключению

```java
Stream<Person> list1Stream = list1.stream();
list1Stream.filter(o -> o.getBirthday().equals(time1)).count();
list1Stream.filter(o -> !o.getBirthday().equals(time1)).count();//java.lang.IllegalStateException: stream has already been operated upon or closed
```

Поэтому я рекомендую каждый раз, когда нужны операции с коллекцией, создавать новый stream напрямую, а не использовать `Stream<Person> list1Stream = list1.stream();` для определения

```java
list1.stream().filter(o -> o.getBirthday().equals(time1)).count();
list1.stream().filter(o -> !o.getBirthday().equals(time1)).count();
```

* filter

Обычно, когда есть операция filter, не используйте параллельные потоки (parallelStream), так как это может привести к проблемам с потокобезопасностью


## Полный код

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
            //Поток можно использовать только один раз, повторное использование приведет к следующему исключению
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
Результат вывода:
Male
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}
Female
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"Female"}
X
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
 */
            //stream не имеет операции RemoveAll
            Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
            list1.stream().forEach(o -> {
                //В ForEach можно выполнять операции с коллекцией
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
            //Метод max класса IntStream возвращает OptionalInt, необходимо сначала проверить наличие значения перед его чтением. Прямой вызов getAsInt при isPresent=false приведет к ошибке. То же самое относится к mapToLong, mapToDouble
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //Конкатенация строк, sum, min, max, average чисел - все это особые случаи reduce.
            //Когда коллекция имеет длину 0, будет возвращено начальное значение Integer.MIN_VALUE. Начальное значение также нельзя передавать произвольно, причина этого мне пока не ясна
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            //170
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
                //170
            }
            //Два способа записи параметров mapToInt одинаковы, мне больше нравится следующий способ, но idea выдает warning
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
            list1.stream().map(Person::getIdentifier).distinct();
            //Обратите внимание, что параметры skip и limit оба имеют тип long
            list1.stream().skip(1L).limit(2L);
            out.println("------------------------------------|По возрастанию|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            /*
[{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}]
[{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}]            
             */
            out.println("------------------------------------|По убыванию|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
/*
[{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}]
[{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}]
 */
            out.println("------------------------------------|Пересечение list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
            out.println("------------------------------------|Объединение list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
            list1.stream().distinct().collect(Collectors.toList());
            out.println("------------------------------------|Разность list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
            out.println("------------------------------------|Преобразование структуры данных|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
            out.println("------------------------------------|Другие важные моменты|------------------------------------");
            //Если объединить два массива таким способом, list2 будет пустым
            Stream.of(list1, list2).collect(Collectors.toList());
            //Ниже правильный способ использования
            Stream.of(list1, list2).flatMap(List::stream).collect(Collectors.toList());
            out.println("------------------------------------|reduce|------------------------------------");
            //Конкатенация строк, sum, min, max, average чисел - все это особые случаи reduce.
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
            out.println("После forEach нельзя продолжить выполнение методов");
            list1.stream().forEach(o -> {
                out.println(new Gson().toJson(o));
            });
            /*
После forEach нельзя продолжить выполнение методов
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"北京","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}            
             */
            out.println("Сначала сортировка, затем обход");
            list1.stream().forEachOrdered(o -> {
                out.println(new Gson().toJson(o));
            });
/*
Сначала сортировка, затем обход
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"北京","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}
 */
            out.println("peek*2");
            List<Integer> l = Stream.iterate(0, (Integer n) -> n + 1) //Генерирует арифметическую прогрессию, увеличивающуюся на 1 каждый раз
                    .peek(n -> out.println("number generated:" + n))
                    .filter(n -> (n % 2 == 0))
                    .peek(n -> out.println("Even number filter passed for" + n)) //Продолжает вывод при встрече четных чисел
                    .limit(5).collect(Collectors.toList());
            out.println(new Gson().toJson(l));
            //Можно увидеть, что при генерации до 9 эта операция завершилась, потому что был установлен limit
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


## Ссылки:

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
