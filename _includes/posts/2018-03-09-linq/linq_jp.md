1. [準備](#準備)
    * エンティティの定義
    * コレクションの定義
1. [完全なコード](#完全なコード)
1. [参考リンク](#参考リンク)

## 準備

* エンティティの定義

```Csharp

    public class Person
    {

        /// <summary>
        /// 身長
        /// </summary>
        /// <returns></returns>
        public int Height { get; set; }

        /// <summary>
        /// 体重
        /// </summary>
        /// <returns></returns>
        public int Weight { get; set; }

        /// <summary>
        /// 誕生日
        /// </summary>
        /// <returns></returns>
        public DateTime Birthday { get; set; }

        /// <summary>
        /// 趣味
        /// </summary>
        /// <returns></returns>
        public List<string> Hobbies { get; set; }

        /// <summary>
        /// 身分証明書番号
        /// </summary>
        /// <returns></returns>
        public string Identifier { get; set; }

        /// <summary>
        /// 住所
        /// </summary>
        /// <returns></returns>
        public string Address { get; set; }

        public Sex Sex { get; set; }


    }

    /// <summary>
    /// 性別
    /// </summary>
    public enum Sex : short
    {
        //男
        Male = 1,
        //女
        Female,
        //第三の性別 https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
        X,

    }
```

* コレクションの定義

```csharp
 Person female = new Person()
            {
                Birthday = new DateTime(1981, 1, 1),
                Height = 165,
                Weight = 50,
                Sex = Sex.Female,
                Address = "北京",
                Identifier = "1",
                Hobbies = new List<string>() { "吃飯", "逛街" },
            };
            Person male = new Person()
            {
                Birthday = new DateTime(1982, 2, 1),
                Height = 170,
                Weight = 50,
                Sex = Sex.Male,
                Address = "北京",
                Identifier = "2",
                Hobbies = new List<string>() { "吃飯", "看電影" },
            };
            Person x = new Person()
            {
                Birthday = new DateTime(1983, 3, 1),
                Height = 170,
                Weight = 50,
                Sex = Sex.X,
                Address = "北京",
                Identifier = "3",
                Hobbies = new List<string>() { "吃飯", "上網" },
            };
            Person male2 = new Person()
            {
                Birthday = new DateTime(1984, 1, 1),
                Height = 150,
                Weight = 35,
                Sex = Sex.Male,
                Address = "北京",
                Identifier = "4",
                Hobbies = new List<string>() { "吃飯", "看電影" },
            };
            List<Person> list1 = new List<Person>() { female, male, x };
            List<Person> list2 = new List<Person>() { female, male2 };
```

## 完全なコード

```csharp
 class Program
    {
        static void Main(string[] args)
        {
            Person female = new Person()
            {
                Birthday = new DateTime(1981, 1, 1),
                Height = 165,
                Weight = 50,
                Sex = Sex.Female,
                Address = "北京",
                Identifier = "1",
                Hobbies = new List<string>() { "吃飯", "逛街" },
            };
            Person male = new Person()
            {
                Birthday = new DateTime(1982, 2, 1),
                Height = 170,
                Weight = 50,
                Sex = Sex.Male,
                Address = "北京",
                Identifier = "2",
                Hobbies = new List<string>() { "吃飯", "看電影" },
            };
            Person x = new Person()
            {
                Birthday = new DateTime(1983, 3, 1),
                Height = 170,
                Weight = 50,
                Sex = Sex.X,
                Address = "北京",
                Identifier = "3",
                Hobbies = new List<string>() { "吃飯", "上網" },
            };
            Person male2 = new Person()
            {
                Birthday = new DateTime(1984, 1, 1),
                Height = 150,
                Weight = 35,
                Sex = Sex.Male,
                Address = "北京",
                Identifier = "4",
                Hobbies = new List<string>() { "吃飯", "看電影" },
            };
            List<Person> list1 = new List<Person>() { female, male, x };
            List<Person> list2 = new List<Person>() { female, male2 };
            int count1 = list1.Where(o => o.Birthday.Equals(new DateTime(1990, 1, 1)) && o.Sex == Sex.Male).Count();
            long count2 = list1.Where(o => o.Birthday.Equals(new DateTime(1990, 1, 1)) && o.Sex == Sex.Male).LongCount();
            /*              
             0
             0
             */
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
            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//結果が空の場合、例外が発生するため、このメソッドは通常ほとんど使用されません
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
            list1.ForEach(item =>
            {
                //ForEach内でコレクションを操作できます
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
            int maxHeight = list1.Select(o => o.Height).Max();
            //list1.Max(o => o.Height)と同じ
            int minWeight = list1.Min(o => o.Weight);            
            list1.Select(o=>o.Identifier).Distinct();
            list1.Skip(1).Take(2);
            //昇順
            list1 = list1.OrderBy(o => o.Birthday).ToList();
            //降順
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
            //結合、以下はlist1とlist2から同じID番号のものを取り出し、新しいコレクションを生成することを意味します            
            //実際、joinには別の用法があり、sqlserverの多テーブル結合と同様に、異なるデータソースを結合して新しいデータ構造を生成します
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //積集合 list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
            //和集合list1 ∪ list2 
            var union = list1.Union(list2).ToList();
            //差集合list1 - list2
            var except = list1.Except(list2).ToList();
            //データ構造の変換
            list1.ToArray();
            //キーが重複している場合、ToDictionaryはエラーを引き起こすことに注意してください
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
        }
    }
```




## 参考リンク:

1. [言語統合クエリ (LINQ)](https://docs.microsoft.com/zh-cn/dotnet/csharp/linq/)
1. [LINQ操作配列（積集合,和集合,差集合,最値,平均,重複削除）](http://edi.wang/post/2012/2/20/linq-on-array-intersection-union-max-min-average-remove-duplication)
1. [C#の素晴らしい関数 -- 1. ToLookup](http://www.cnblogs.com/multiplesoftware/archive/2011/03/31/2000528.html)
