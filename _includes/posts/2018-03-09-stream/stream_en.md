1. [Preparation](#preparation)
    * Define Entity
    * Define Collection
1. [Other Uses of Stream](#other-uses-of-stream)
    - [For Validating Collections](#for-validating-collections-cited-from-ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - [Generate Stream Yourself](#generate-stream-yourself-cited-from-ibmhttpswwwibmcomdeveloperworkscnjavaj-lo-java8streamapi)
    - Stream.iterate
1. [Notes on Stream](#notes-on-stream)
    * Streams can only be used once, reusing will cause the following exception
    * filter
1. [Complete Code](#complete-code)
1. [References](#references)

<script src="https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98.js"></script>

## Preparation

* Define Entity

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

    // Height
    private int height;
    // Weight
    private int weight;
    // ID number
    private String identifier;
    // Address
    private String address;
    // Birthday
    private Date birthday;
    // Hobbies
    private List<String> hobbies;

    // Gender
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
    // Male
    Male,
    // Female
    Female,
    // Third gender https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
    X,
}
```

* Define Collection

```java
// {% raw %}
            // LocalDate.of(2018, 02, 29);
            //java.time.DateTimeException: Invalid date 'February 29' as '2018' is not a leap year
            final Person female = new Person();
            female.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1981, 1, 1)));
            female.setHeight(165);
            female.setWeight(50);
            female.setSex(Sex.Female);
            female.setAddress("Beijing");
            female.setIdentifier("1");
            female.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Shopping");
            }});

            final Person male = new Person();
            male.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1982, 2, 1)));
            male.setHeight(170);
            male.setWeight(50);
            male.setSex(Sex.Male);
            male.setAddress("Beijing");
            male.setIdentifier("2");
            male.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Watching movies");
            }});

            final Person x = new Person();
            x.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1983, 3, 1)));
            x.setHeight(170);
            x.setWeight(50);
            x.setSex(Sex.X);
            x.setAddress("Beijing");
            x.setIdentifier("3");
            x.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Surfing the internet");
            }});

            final Person male2 = new Person();
            male2.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1984, 1, 1)));
            male2.setHeight(150);
            male2.setWeight(35);
            male2.setSex(Sex.Male);
            male2.setAddress("Beijing");
            male2.setIdentifier("4");
            male2.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Watching movies");
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

## Other Uses of Stream

### For Validating Collections (cited from [IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

> allMatch: Returns true if all elements in the Stream match the given predicate
> 
> anyMatch: Returns true if any element in the Stream matches the given predicate
> 
> noneMatch: Returns true if no elements in the Stream match the given predicate
  

### Generate Stream Yourself (cited from [IBM](https://www.ibm.com/developerworks/cn/java/j-lo-java8streamapi/))

* Stream.generate

By implementing the Supplier interface, you can control the generation of the stream yourself. This is typically used for random numbers, constant Streams, or Streams that need to maintain some state information between elements. The Stream generated by passing a Supplier instance to Stream.generate() is serial (relative to parallel) but unordered (relative to ordered) by default. Since it is infinite, you must use operations like limit in the pipeline to restrict the Stream size.

```java
Random seed = new Random();
Supplier<Integer> random = seed::nextInt;
Stream.generate(random).limit(10).forEach(System.out::println);
//Another way
IntStream.generate(() -> (int) (System.nanoTime() % 100)).
limit(10).forEach(System.out::println);
```

Stream.generate() also accepts your own Supplier implementation. For example, when constructing massive test data, use some automatic rule to assign values to each variable; or calculate each element value of the Stream according to a formula. These are all cases where state information is maintained.

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
# Output:
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

iterate is very similar to the reduce operation, accepting a seed value and a UnaryOperator (e.g., f). Then the seed value becomes the first element of the Stream, f(seed) is the second, f(f(seed)) is the third, and so on.

```java
Stream.iterate(0, n -> n + 3).limit(10). forEach(x -> System.out.print(x + " "));.
```

```
# Output:
0 3 6 9 12 15 18 21 24 27
```

**Similar to Stream.generate, when using iterate, the pipeline must have operations like limit to restrict the Stream size.**



## Notes on Stream

* Streams can only be used once, reusing will cause the following exception

```java
Stream<Person> list1Stream = list1.stream();
list1Stream.filter(o -> o.getBirthday().equals(time1)).count();
list1Stream.filter(o -> !o.getBirthday().equals(time1)).count();//java.lang.IllegalStateException: stream has already been operated upon or closed
```

So I recommend creating a new stream directly each time you need collection operations, rather than using `Stream<Person> list1Stream = list1.stream();` to define it

```java
list1.stream().filter(o -> o.getBirthday().equals(time1)).count();
list1.stream().filter(o -> !o.getBirthday().equals(time1)).count();
```

* filter

Generally, when there is a filter operation, do not use parallel streams (parallelStream), as it may cause thread safety issues


## Complete Code

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
            female.setAddress("Beijing");
            female.setIdentifier("1");
            female.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Shopping");
            }});

            final Person male = new Person();
            male.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1982, 2, 1)));
            male.setHeight(170);
            male.setWeight(50);
            male.setSex(Sex.Male);
            male.setAddress("Beijing");
            male.setIdentifier("2");
            male.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Watching movies");
            }});

            final Person x = new Person();
            x.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1983, 3, 1)));
            x.setHeight(170);
            x.setWeight(50);
            x.setSex(Sex.X);
            x.setAddress("Beijing");
            x.setIdentifier("3");
            x.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Surfing the internet");
            }});

            final Person male2 = new Person();
            male2.setBirthday(convertLocalDateToTimeZone(LocalDate.of(1984, 1, 1)));
            male2.setHeight(150);
            male2.setWeight(35);
            male2.setSex(Sex.Male);
            male2.setAddress("Beijing");
            male2.setIdentifier("4");
            male2.setHobbies(new ArrayList<String>() {{
                add("Eating");
                add("Watching movies");
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
            //Streams can only be used once, reusing will cause the following exception
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
Output:
Male
{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"Male"}
Female
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"Female"}
X
{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}
 */
            //stream does not have RemoveAll operation
            Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
            list1.stream().forEach(o -> {
                //You can operate on the collection in ForEach
                o.setSex(Sex.X);
            });
            list1.forEach(o -> {
                out.println(new Gson().toJson(o));
            });
/*
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"}
{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}
 */
            //IntStream's max method returns OptionalInt, you must check if there is a value before reading it. getAsInt will throw an error when isPresent=false. Same applies to mapToLong, mapToDouble
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //String concatenation, sum, min, max, average of numbers are all special cases of reduce.
            //When the collection is of length 0, it will return the initial value Integer.MIN_VALUE. The initial value cannot be passed arbitrarily, the reason for which I am not clear about yet
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            //170
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
                //170
            }
            //The two ways of writing mapToInt parameters are the same, I prefer the following way, but idea will report a warning
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
            list1.stream().map(Person::getIdentifier).distinct();
            //Note that skip and limit parameters are both long
            list1.stream().skip(1L).limit(2L);
            out.println("------------------------------------|Ascending|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            /*
[{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}]
[{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"},{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}]            
             */
            out.println("------------------------------------|Descending|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
/*
[{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}]
[{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"},{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"},{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}]
 */
            out.println("------------------------------------|Intersection list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
            out.println("------------------------------------|Union list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
            list1.stream().distinct().collect(Collectors.toList());
            out.println("------------------------------------|Difference list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
            out.println("------------------------------------|Data Structure Conversion|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
            out.println("------------------------------------|Other Things to Note|------------------------------------");
            //If merging two arrays this way, list2 will be empty
            Stream.of(list1, list2).collect(Collectors.toList());
            //The following is the correct usage
            Stream.of(list1, list2).flatMap(List::stream).collect(Collectors.toList());
            out.println("------------------------------------|reduce|------------------------------------");
            //String concatenation, sum, min, max, average of numbers are all special cases of reduce.
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
            out.println("forEach cannot continue executing methods after it");
            list1.stream().forEach(o -> {
                out.println(new Gson().toJson(o));
            });
            /*
forEach cannot continue executing methods after it
{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"Beijing","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"Male"}            
             */
            out.println("Sort first, then iterate");
            list1.stream().forEachOrdered(o -> {
                out.println(new Gson().toJson(o));
            });
/*
Sort first, then iterate
{"height":170,"weight":50,"identifier":"3","address":"Beijing","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["Eating","Surfing the internet"],"sex":"X"}
{"height":170,"weight":50,"identifier":"2","address":"Beijing","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}
{"height":165,"weight":50,"identifier":"1","address":"Beijing","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["Eating","Shopping"],"sex":"X"}
{"height":150,"weight":35,"identifier":"4","address":"Beijing","birthday":"Jan 1, 1984 12:00:00 AM","hobbies":["Eating","Watching movies"],"sex":"Male"}
 */
            out.println("peek*2");
            List<Integer> l = Stream.iterate(0, (Integer n) -> n + 1) //Generate an arithmetic sequence that increments by 1 each time
                    .peek(n -> out.println("number generated:" + n))
                    .filter(n -> (n % 2 == 0))
                    .peek(n -> out.println("Even number filter passed for" + n)) //Continue output when encountering even numbers
                    .limit(5).collect(Collectors.toList());
            out.println(new Gson().toJson(l));
            //You can see that when generating to 9, this operation ended because limit was set
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


## References:

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
