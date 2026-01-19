1. [Подготовка](#подготовка)
    * Определение сущности
    * Определение коллекции
1. [Одна коллекция](#одна-коллекция)
    1. [Классификация и фильтрация](#классификация-и-фильтрация)
        * Подсчет (Count)
        * Группировка (GroupBy)
        * Первый совпадающий элемент (findFirst/First, FirstOrDefault)
        * Обход (ForEach)
        * Экстремальные значения Max/Min        
        * Пропуск (skip/Skip), извлечение (limit/Take)
    1. [Сортировка](#сортировка)
        * Удаление дубликатов (Distinct)
        * По возрастанию (sort/OrderBy)
        * По убыванию (sort/OrderByDescending)
1. [Несколько коллекций](#несколько-коллекций)
    * Пересечение list1 ∩ list2
    * Объединение list1 ∪ list2
    * Разность list1 - list2
1. [Преобразование структуры данных](#преобразование-структуры-данных)

Эта статья написана специально для помощи начинающим изучать операции с коллекциями Java8/C#.

## Подготовка


[Версия C#](https://gist.github.com/zeusro/6b4d0efa2e2b5a7ff29d3b22c98e6df3)


[Версия Java](https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98)

## Одна коллекция

### Классификация и фильтрация

* Подсчет (Count)

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

* Группировка (GroupBy)

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
Вывод:
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
            //Когда мы используем метод расширения GroupBy(), используется отложенное выполнение. Это означает, что при итерации по коллекции следующий элемент может быть или не быть загружен. Это большое улучшение производительности, но может вызвать интересные побочные эффекты.
            list1.RemoveAll(o => o.Sex == Sex.X);//После определения коллекции groupby, изменение исходной коллекции обнаружит, что группа Sex=X уже отсутствует в group1
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
            Вывод:
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
            Female
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
             */
            //Метод ToLookup() создает список, похожий на Dictionary, но это новая коллекция .NET под названием lookup. Lookup, в отличие от Dictionary, неизменяем. Это означает, что после создания lookup вы не можете добавлять или удалять элементы.
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
            Вывод:            
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":3}
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":3}
             */
```

В отличие от этого, stream не имеет операции RemoveAll

* Первый совпадающий элемент (findFirst/First, FirstOrDefault)

```java
 Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
```

```csharp

            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//Если результат пуст, это вызовет исключение, поэтому этот метод редко используется
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
```


* Обход (ForEach)

```java

            list1.stream().forEach(o -> {
                //Можно работать с коллекцией внутри ForEach
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
                //Можно работать с коллекцией внутри ForEach
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
```

* Экстремальные значения Max/Min

```java

            //Метод max IntStream возвращает OptionalInt, нужно проверить, есть ли значение, прежде чем читать. getAsInt выдаст ошибку, когда isPresent=false. mapToLong, mapToDouble аналогичны
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //Конкатенация строк, sum, min, max, average чисел — все это специальные reduce.
            //Когда коллекция имеет длину 0, возвращается начальное значение Integer.MIN_VALUE. Начальное значение нельзя передавать случайно, причина мне пока не ясна
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
            }
            //Оба способа записи параметров mapToInt одинаковы. Я предпочитаю следующий, но idea выдаст предупреждение
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
```

```csharp

            int maxHeight = list1.Select(o => o.Height).Max();
            //То же, что list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
```

* Пропуск (skip/Skip), извлечение (limit/Take)

```java

            //Оба параметра skip и limit имеют тип long, обратите на это внимание
            list1.stream().skip(1L).limit(2L);
```

### Сортировка

* Удаление дубликатов (Distinct)

```java
list1.stream().map(Person::getIdentifier).distinct();
```

```csharp
list1.Select(o=>o.Identifier).Distinct();
```

```csharp
 list1.Skip(1).Take(2);
```

* По возрастанию (sort/OrderBy)

```java

            out.println("------------------------------------|По возрастанию|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
```

```csharp
            //По возрастанию
            list1 = list1.OrderBy(o => o.Birthday).ToList();
```

* По убыванию (sort/OrderByDescending)

```java

            out.println("------------------------------------|По убыванию|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));

```

```csharp

            //По убыванию
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
```

## Несколько коллекций

* Пересечение list1 ∩ list2

```java

            out.println("------------------------------------|Пересечение list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
```

```csharp
//Соединение, ниже означает извлечение элементов с одинаковым номером ID из list1 и list2, создание новой коллекции            
            //На самом деле, join имеет другое использование, подобное многотабличным соединениям в sqlserver, объединяя разные источники данных вместе для создания новых структур данных
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //Пересечение list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
```

* Объединение list1 ∪ list2

```java

            out.println("------------------------------------|Объединение list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
```

```csharp

            //Объединение list1 ∪ list2 
            var union = list1.Union(list2).ToList();
```

* Разность list1 - list2

```java

            out.println("------------------------------------|Разность list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
```

```csharp
            //Разность list1 - list2
            var except = list1.Except(list2).ToList();
```

## Преобразование структуры данных

```java

            out.println("------------------------------------|Преобразование структуры данных|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
```

```csharp
            //Преобразование структуры данных
            list1.ToArray();
            //Обратите внимание, если ключ дублируется, ToDictionary вызовет ошибку
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
```
