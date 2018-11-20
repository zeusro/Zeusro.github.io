---
layout:       post
title:        "Java8的stream API与 C#的 LINQ 拓展方法对比"
subtitle:     ""
date:         2018-03-08
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - java
    - C#
---


1. [前期准备](#前期准备)
    * 定义实体
    * 定义集合
1. [单集合](#单集合)
    1. [分类筛选](#分类筛选)
        * 计数(Count)
        * 分组(GroupBy)
        * 匹配的第一项(findFirst/First,FirstOrDefault)
        * 遍历(ForEach)
        * 极值Max/Min        
        * 跳过(skip/Skip),截取(limit/Take)
    1. [排序](#排序)
        * 去重复(Distinct)
        * 升序(sort/OrderBy)
        * 降序(sort/OrderByDescending)
1. [多集合](#多集合)
    * 交集 list1 ∩ list2
    * 并集list1 ∪ list2
    * 差集list1 - list2
1. [数据结构转换](#数据结构转换)
1. []()
1. []()
1. []()
1. []()

为方便初学 Java8/C# 集合操作的人,特意写下这篇文章.

## 前期准备


[C#版](https://gist.github.com/zeusro/6b4d0efa2e2b5a7ff29d3b22c98e6df3)


[java版](https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98)






## 单集合

### 分类筛选

* 计数(Count)

```java
            Date time1 = convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1));
            //0
            Long count1 = list1.stream().filter(o -> o.getBirthday().equals(time1)).count();
```

```csharp
            int count1 = list1.Where(o => o.Birthday.Equals(new DateTime(1990, 1, 1)) && o.Sex == Sex.Male).Count();
            long count2 = list1.Where(o => o.Birthday.Equals(new DateTime(1990, 1, 1)) && o.Sex == Sex.Male).LongCount();
            /*              
             0
             0
             */
```

* 分组(GroupBy)

```java
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
输出结果:
Male
{"height":170,"weight":50,"identifier":"2","address":"北京","birthday":"Feb 1, 1982 12:00:00 AM","hobbies":["吃飯","看電影"],"sex":"Male"}
Female
{"height":165,"weight":50,"identifier":"1","address":"北京","birthday":"Jan 1, 1981 12:00:00 AM","hobbies":["吃飯","逛街"],"sex":"Female"}
X
{"height":170,"weight":50,"identifier":"3","address":"北京","birthday":"Mar 1, 1983 12:00:00 AM","hobbies":["吃飯","上網"],"sex":"X"}
 */
```

```csharp
var group1 = list1.GroupBy(o => o.Sex);
            //当我们使用 GroupBy（） 扩展方法时，使用了延迟执行。 这意味着，当你遍历集合的时候,下一个要出现的项目可能会或者可能不会被加载。 这是一个很大的性能改进，但它会引起有趣的副作用。
            list1.RemoveAll(o => o.Sex == Sex.X);//定义 groupby 集合后对原集合进行修改,会发现group1里面已经没了 Sex=X的分组
            foreach (var groupByItem in group1)
            {
                Sex sex = groupByItem.Key;
                System.Console.WriteLine(sex);
                foreach (Person person in groupByItem)
                {                    
                    System.Console.WriteLine(JsonConvert.SerializeObject(person));
                }
            }
            /*
            输出结果:
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
            Female
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
             */
            //该 ToLookup（） 方法创建一个类似 字典（Dictionary ） 的列表List, 但是它是一个新的 .NET Collection 叫做 lookup。 Lookup，不像Dictionary, 是不可改变的。 这意味着一旦你创建一个lookup, 你不能添加或删除元素。
            var group2 = list1.ToLookup(o => o.Sex);
            foreach (var groupByItem in group2)
            {
                Sex sex = groupByItem.Key;
                foreach (Person person in groupByItem)
                {
                    System.Console.WriteLine(sex);
                    System.Console.WriteLine(JsonConvert.SerializeObject(person));
                }

            }
            /*
            输出结果:            
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":3}
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":3}
             */
```

与此对比,stream没有RemoveAll的操作

* 匹配的第一项(findFirst/First,FirstOrDefault)

```java
 Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
```

```csharp

            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//如果结果为空,将会导致异常,所以一般极少使用该方法
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
```


* 遍历(ForEach)

```java

            list1.stream().forEach(o -> {
                //在ForEach當中可對集合進行操作
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
```

```csharp

            list1.ForEach(item =>
            {
                //在ForEach當中可對集合進行操作
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
```

* 极值Max/Min

```java

            //IntStream的max方法返回的是OptionalInt,要先判断有没有值再读取值.isPresent=false 时直接getAsInt会报错.mapToLong,mapToDouble同理
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //字符串拼接、数值的 sum、min、max、average 都是特殊的 reduce。
            //当集合为长度0的集合时会返回起始值Integer.MIN_VALUE,起始值也不能乱传,个中缘由我暂不清楚
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
            }
            //mapToInt参数的2种写法都一样,我比较喜欢以下写法,但是 idea 会报 warning
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
```

```csharp

            int maxHeight = list1.Select(o => o.Height).Max();
            //同 list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
```

* 跳过(skip/Skip),截取(limit/Take)

```java

            //skip和 limit参数都是long, 这个要注意
            list1.stream().skip(1L).limit(2L);
```

### 排序

* 去重复(Distinct)

```java
list1.stream().map(Person::getIdentifier).distinct();
```

```csharp
list1.Select(o=>o.Identifier).Distinct();
```

```csharp
 list1.Skip(1).Take(2);
```

* 升序(sort/OrderBy)

```java

            out.println("------------------------------------|升序|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
```

```csharp
            //升序
            list1 = list1.OrderBy(o => o.Birthday).ToList();
```

* 降序(sort/OrderByDescending)

```java

            out.println("------------------------------------|降序|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));

```

```csharp

            //降序
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
```

## 多集合

* 交集 list1 ∩ list2

```java

            out.println("------------------------------------|交集 list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
```

```csharp
//连接,下面表示把 list1和 list2当中相同身份证号的取出来,生成一个新的集合            
            //实际上, join 有另外的用法,类似 sqlserver 里面的多表连接,将不同数据源结合到一起,生成新的数据结构
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //交集 list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
```

* 并集list1 ∪ list2

```java

            out.println("------------------------------------|并集list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
```

```csharp

            //并集list1 ∪ list2 
            var union = list1.Union(list2).ToList();
```

* 差集list1 - list2

```java

            out.println("------------------------------------|差集list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
```

```csharp
            //差集list1 - list2
            var except = list1.Except(list2).ToList();
```

## 数据结构转换

```java

            out.println("------------------------------------|数据结构转换|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
```

```csharp
            //数据结构转换
            list1.ToArray();
            //注意如果 key 重复,ToDictionary会导致出错
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
```

