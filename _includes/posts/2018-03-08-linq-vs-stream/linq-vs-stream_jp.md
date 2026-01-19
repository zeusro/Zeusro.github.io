1. [準備](#準備)
    * エンティティの定義
    * コレクションの定義
1. [単一コレクション](#単一コレクション)
    1. [分類フィルタリング](#分類フィルタリング)
        * カウント(Count)
        * グループ化(GroupBy)
        * 一致する最初の項目(findFirst/First,FirstOrDefault)
        * 反復処理(ForEach)
        * 極値Max/Min        
        * スキップ(skip/Skip),取得(limit/Take)
    1. [ソート](#ソート)
        * 重複の削除(Distinct)
        * 昇順(sort/OrderBy)
        * 降順(sort/OrderByDescending)
1. [複数コレクション](#複数コレクション)
    * 積集合 list1 ∩ list2
    * 和集合list1 ∪ list2
    * 差集合list1 - list2
1. [データ構造の変換](#データ構造の変換)

Java8/C#コレクション操作を学び始める人のために、この記事を書きました。

## 準備


[C#版](https://gist.github.com/zeusro/6b4d0efa2e2b5a7ff29d3b22c98e6df3)


[Java版](https://gist.github.com/zeusro/da21cde9fd1ad4b7aaeb5d3a1c9bdb98)

## 単一コレクション

### 分類フィルタリング

* カウント(Count)

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

* グループ化(GroupBy)

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
出力結果:
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
            //GroupBy()拡張メソッドを使用する場合、遅延実行が使用されます。これは、コレクションを反復処理するとき、次に出現する項目がロードされる場合とされない場合があることを意味します。これは大きなパフォーマンス改善ですが、興味深い副作用を引き起こす可能性があります。
            list1.RemoveAll(o => o.Sex == Sex.X);//groupbyコレクションを定義した後、元のコレクションを変更すると、group1にSex=Xのグループがすでにないことがわかります
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
            出力結果:
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
            Female
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":2}
            Male
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":1}
             */
            //ToLookup()メソッドは、DictionaryのようなListを作成しますが、lookupという新しい.NET Collectionです。Lookupは、Dictionaryとは異なり、不変です。これは、lookupを作成すると、要素を追加または削除できないことを意味します。
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
            出力結果:            
            {"Height":165,"Weight":50,"Birthday":"1981-01-01T00:00:00","Hobbies":["吃飯","逛街"],"Identifier":"1","Address":"北京","Sex":3}
            {"Height":170,"Weight":50,"Birthday":"1982-02-01T00:00:00","Hobbies":["吃飯","看電影"],"Identifier":"2","Address":"北京","Sex":3}
             */
```

これと対照的に、streamにはRemoveAll操作がありません

* 一致する最初の項目(findFirst/First,FirstOrDefault)

```java
 Person after90 = list1.stream()
                    .filter(o -> o.getBirthday().after(convertLocalDateToTimeZone(LocalDate.of(1990, 1, 1))))
                    .findFirst()
                    .orElse(null);
            // null
```

```csharp

            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//結果が空の場合、例外が発生するため、このメソッドは通常ほとんど使用されません
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
```


* 反復処理(ForEach)

```java

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
```

```csharp

            list1.ForEach(item =>
            {
                //ForEach内でコレクションを操作できます
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
```

* 極値Max/Min

```java

            //IntStreamのmaxメソッドはOptionalIntを返します。値を読み取る前に値があるかどうかを確認する必要があります。isPresent=falseの場合、直接getAsIntするとエラーになります。mapToLong、mapToDoubleも同様です
            OptionalInt maxHeightOption = list1.stream().mapToInt(Person::getHeight).max();
            //文字列の連結、数値のsum、min、max、averageはすべて特殊なreduceです。
            //コレクションが長さ0のコレクションの場合、開始値Integer.MIN_VALUEを返します。開始値も乱用できません。理由はまだ明確ではありません
            int maxHeight = list1.stream().mapToInt(Person::getHeight).reduce(Integer.MIN_VALUE, Integer::max);
            out.println(maxHeight);
            if (maxHeightOption.isPresent()) {
                maxHeight = maxHeightOption.getAsInt();
                out.println(maxHeight);
            }
            //mapToIntパラメータの2つの書き方は同じです。以下の書き方を好みますが、ideaは警告を報告します
            OptionalInt minWeightOption = list1.stream().mapToInt(o -> o.getHeight()).min();
            int minWeight = list1.stream().mapToInt(o -> o.getHeight()).reduce(Integer.MAX_VALUE, Integer::min);
```

```csharp

            int maxHeight = list1.Select(o => o.Height).Max();
            //list1.Max(o => o.Height)と同じ
            int minWeight = list1.Min(o => o.Weight);            
```

* スキップ(skip/Skip),取得(limit/Take)

```java

            //skipとlimitパラメータは両方ともlongです。これに注意してください
            list1.stream().skip(1L).limit(2L);
```

### ソート

* 重複の削除(Distinct)

```java
list1.stream().map(Person::getIdentifier).distinct();
```

```csharp
list1.Select(o=>o.Identifier).Distinct();
```

```csharp
 list1.Skip(1).Take(2);
```

* 昇順(sort/OrderBy)

```java

            out.println("------------------------------------|昇順|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday)).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> left.getBirthday().compareTo(right.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
```

```csharp
            //昇順
            list1 = list1.OrderBy(o => o.Birthday).ToList();
```

* 降順(sort/OrderByDescending)

```java

            out.println("------------------------------------|降順|------------------------------------");
            list1 = list1.stream().sorted(Comparator.comparing(Person::getBirthday).reversed()).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));
            list1 = list1.stream().sorted((left, right) -> right.getBirthday().compareTo(left.getBirthday())).collect(Collectors.toList());
            out.println(new Gson().toJson(list1));

```

```csharp

            //降順
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
```

## 複数コレクション

* 積集合 list1 ∩ list2

```java

            out.println("------------------------------------|積集合 list1 ∩ list2|------------------------------------");
            list1.stream().filter(o -> list2.contains(o)).collect(Collectors.toList());
```

```csharp
//結合、以下はlist1とlist2から同じID番号のものを取り出し、新しいコレクションを生成することを意味します            
            //実際、joinには別の用法があり、sqlserverの多テーブル結合と同様に、異なるデータソースを結合して新しいデータ構造を生成します
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //積集合 list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
```

* 和集合list1 ∪ list2

```java

            out.println("------------------------------------|和集合list1 ∪ list2 |------------------------------------");
            list1.addAll(list2);
```

```csharp

            //和集合list1 ∪ list2 
            var union = list1.Union(list2).ToList();
```

* 差集合list1 - list2

```java

            out.println("------------------------------------|差集合list1 - list2|------------------------------------");
            list1.stream().filter(item1 -> !list2.contains(item1)).collect(Collectors.toList());
```

```csharp
            //差集合list1 - list2
            var except = list1.Except(list2).ToList();
```

## データ構造の変換

```java

            out.println("------------------------------------|データ構造の変換|------------------------------------");
            List<Person> list3 = list1.stream().filter(o -> true).collect(Collectors.toList());
            ArrayList<Person> list4 = list1.stream().filter(o -> true).collect(Collectors.toCollection(ArrayList::new));
            Set<Person> list5 = list1.stream().filter(o -> true).collect(Collectors.toSet());
            Object[] list6 = list1.stream().toArray();
            Person[] list7 = list1.stream().toArray(Person[]::new);
```

```csharp
            //データ構造の変換
            list1.ToArray();
            //キーが重複している場合、ToDictionaryはエラーを引き起こすことに注意してください
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
```
