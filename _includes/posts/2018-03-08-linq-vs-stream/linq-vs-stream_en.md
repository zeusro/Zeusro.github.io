1. [Preparation](#preparation)
    * Define Entity
    * Define Collection
1. [Single Collection](#single-collection)
    1. [Filtering and Classification](#filtering-and-classification)
        * Count
        * GroupBy
        * First Matching Item (findFirst/First, FirstOrDefault)
        * ForEach
        * Max/Min        
        * Skip, Take (limit)
    1. [Sorting](#sorting)
        * Distinct
        * Ascending (sort/OrderBy)
        * Descending (sort/OrderByDescending)
1. [Multiple Collections](#multiple-collections)
    * Intersection list1 ∩ list2
    * Union list1 ∪ list2
    * Difference list1 - list2
1. [Data Structure Conversion](#data-structure-conversion)

This article is written specifically to help beginners learning Java8/C# collection operations.

## Preparation


[C# Version](https://gist.github.com/zeusro/6b4d0efa2e2b5a7ff29d3b22c98e6df3)


[Java Version](https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98)

## Single Collection

### Filtering and Classification

* Count

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

* GroupBy

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
Output:
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
            //When we use the GroupBy() extension method, deferred execution is used. This means that when you iterate through the collection, the next item to appear may or may not be loaded. This is a big performance improvement, but it can cause interesting side effects.
            list1.RemoveAll(o => o.Sex == Sex.X);//After defining the groupby collection, modifying the original collection will find that the Sex=X group is already gone from group1
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
            Output:
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
            Female
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
             */
            //The ToLookup() method creates a Dictionary-like List, but it's a new .NET Collection called lookup. Lookup, unlike Dictionary, is immutable. This means once you create a lookup, you cannot add or remove elements.
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
            Output:            
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":3}
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":3}
             */
```

In contrast, stream doesn't have a RemoveAll operation

* First Matching Item (findFirst/First, FirstOrDefault)

```java
 Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
```

```csharp

            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//If the result is empty, it will cause an exception, so this method is rarely used
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
```


* ForEach

```java

            list1.stream().forEach(o -> {
                //Can operate on the collection within ForEach
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
                //Can operate on the collection within ForEach
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
```

* Max/Min

```java

            //IntStream's max method returns OptionalInt, must check if there's a value before reading. getAsInt will error when isPresent=false. mapToLong, mapToDouble are similar
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //String concatenation, sum, min, max, average of numbers are all special reduces.
            //When the collection is a length 0 collection, it returns the starting value Integer.MIN_VALUE. The starting value cannot be passed randomly, I'm not clear on the reason yet
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
            }
            //Both ways of writing mapToInt parameters are the same. I prefer the following, but idea will report a warning
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
```

```csharp

            int maxHeight = list1.Select(o => o.Height).Max();
            //Same as list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
```

* Skip, Take (limit)

```java

            //Both skip and limit parameters are long, note this
            list1.stream().skip(1L).limit(2L);
```

### Sorting

* Distinct

```java
list1.stream().map(Person::getIdentifier).distinct();
```

```csharp
list1.Select(o=>o.Identifier).Distinct();
```

```csharp
 list1.Skip(1).Take(2);
```

* Ascending (sort/OrderBy)

```java

            out.println("------------------------------------|Ascending|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
```

```csharp
            //Ascending
            list1 = list1.OrderBy(o => o.Birthday).ToList();
```

* Descending (sort/OrderByDescending)

```java

            out.println("------------------------------------|Descending|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));

```

```csharp

            //Descending
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
```

## Multiple Collections

* Intersection list1 ∩ list2

```java

            out.println("------------------------------------|Intersection list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
```

```csharp
//Join, below means take out items with the same ID number from list1 and list2, generate a new collection            
            //Actually, join has other uses, similar to multi-table joins in sqlserver, combining different data sources together to generate new data structures
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //Intersection list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
```

* Union list1 ∪ list2

```java

            out.println("------------------------------------|Union list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
```

```csharp

            //Union list1 ∪ list2 
            var union = list1.Union(list2).ToList();
```

* Difference list1 - list2

```java

            out.println("------------------------------------|Difference list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
```

```csharp
            //Difference list1 - list2
            var except = list1.Except(list2).ToList();
```

## Data Structure Conversion

```java

            out.println("------------------------------------|Data Structure Conversion|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
```

```csharp
            //Data Structure Conversion
            list1.ToArray();
            //Note if key is duplicate, ToDictionary will cause an error
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
```
