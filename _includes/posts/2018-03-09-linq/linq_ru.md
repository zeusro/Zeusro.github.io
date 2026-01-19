<!-- TODO: Translate to ru -->

1. [前期准备](#前期准备)
    * 定义实体
    * 定义集合
1. [完整代码](#完整代码)
1. [参考链接](#参考链接)

## 前期准备

* 定义实体

```Csharp

    public class Person
    {

        /// <summary>
        /// 身高
        /// </summary>
        /// <returns></returns>
        public int Height { get; set; }

        /// <summary>
        /// 高度
        /// </summary>
        /// <returns></returns>
        public int Weight { get; set; }

        /// <summary>
        /// 生日
        /// </summary>
        /// <returns></returns>
        public DateTime Birthday { get; set; }

        /// <summary>
        /// 爱好
        /// </summary>
        /// <returns></returns>
        public List<string> Hobbies { get; set; }

        /// <summary>
        /// 身份证号
        /// </summary>
        /// <returns></returns>
        public string Identifier { get; set; }

        /// <summary>
        /// 地址
        /// </summary>
        /// <returns></returns>
        public string Address { get; set; }

        public Sex Sex { get; set; }


    }

    /// <summary>
    /// 性别
    /// </summary>
    public enum Sex : short
    {
        //男
        Male = 1,
        //女
        Female,
        //第三性 https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
        X,

    }
```

* 定义集合

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

## 完整代码

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
            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//如果结果为空,将会导致异常,所以一般极少使用该方法
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
            list1.ForEach(item =>
            {
                //在ForEach當中可對集合進行操作
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
            int maxHeight = list1.Select(o => o.Height).Max();
            //同 list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
            list1.Select(o=>o.Identifier).Distinct();
            list1.Skip(1).Take(2);
            //升序
            list1 = list1.OrderBy(o => o.Birthday).ToList();
            //降序
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
            //连接,下面表示把 list1和 list2当中相同身份证号的取出来,生成一个新的集合            
            //实际上, join 有另外的用法,类似 sqlserver 里面的多表连接,将不同数据源结合到一起,生成新的数据结构
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //交集 list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
            //并集list1 ∪ list2 
            var union = list1.Union(list2).ToList();
            //差集list1 - list2
            var except = list1.Except(list2).ToList();
            //数据结构转换
            list1.ToArray();
            //注意如果 key 重复,ToDictionary会导致出错
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
        }
    }
```



## 参考链接:

1. [语言集成查询 (LINQ)](https://docs.microsoft.com/zh-cn/dotnet/csharp/linq/)
1. [LINQ操作数组（交集,并集,差集,最值,平均,去重复）](http://edi.wang/post/2012/2/20/linq-on-array-intersection-union-max-min-average-remove-duplication)
1. [C# 中奇妙的函数 -- 1. ToLookup](http://www.cnblogs.com/multiplesoftware/archive/2011/03/31/2000528.html)