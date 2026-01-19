1. [Preparation](#preparation)
    * Define Entity
    * Define Collection
1. [Complete Code](#complete-code)
1. [Reference Links](#reference-links)

## Preparation

* Define Entity

```Csharp

    public class Person
    {

        /// <summary>
        /// Height
        /// </summary>
        /// <returns></returns>
        public int Height { get; set; }

        /// <summary>
        /// Weight
        /// </summary>
        /// <returns></returns>
        public int Weight { get; set; }

        /// <summary>
        /// Birthday
        /// </summary>
        /// <returns></returns>
        public DateTime Birthday { get; set; }

        /// <summary>
        /// Hobbies
        /// </summary>
        /// <returns></returns>
        public List<string> Hobbies { get; set; }

        /// <summary>
        /// ID Number
        /// </summary>
        /// <returns></returns>
        public string Identifier { get; set; }

        /// <summary>
        /// Address
        /// </summary>
        /// <returns></returns>
        public string Address { get; set; }

        public Sex Sex { get; set; }


    }

    /// <summary>
    /// Gender
    /// </summary>
    public enum Sex : short
    {
        //Male
        Male = 1,
        //Female
        Female,
        //Third Gender https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
        X,

    }
```

* Define Collection

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

## Complete Code

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
            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//If the result is empty, it will cause an exception, so this method is rarely used
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
            list1.ForEach(item =>
            {
                //Can operate on the collection within ForEach
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
            int maxHeight = list1.Select(o => o.Height).Max();
            //Same as list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
            list1.Select(o=>o.Identifier).Distinct();
            list1.Skip(1).Take(2);
            //Ascending
            list1 = list1.OrderBy(o => o.Birthday).ToList();
            //Descending
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
            //Join, below means take out items with the same ID number from list1 and list2, generate a new collection            
            //Actually, join has other uses, similar to multi-table joins in sqlserver, combining different data sources together to generate new data structures
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //Intersection list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
            //Union list1 ∪ list2 
            var union = list1.Union(list2).ToList();
            //Difference list1 - list2
            var except = list1.Except(list2).ToList();
            //Data Structure Conversion
            list1.ToArray();
            //Note if key is duplicate, ToDictionary will cause an error
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
        }
    }
```




## Reference Links:

1. [Language Integrated Query (LINQ)](https://docs.microsoft.com/zh-cn/dotnet/csharp/linq/)
1. [LINQ Operations on Arrays (Intersection, Union, Difference, Max, Min, Average, Remove Duplicates)](http://edi.wang/post/2012/2/20/linq-on-array-intersection-union-max-min-average-remove-duplication)
1. [Wonderful Functions in C# -- 1. ToLookup](http://www.cnblogs.com/multiplesoftware/archive/2011/03/31/2000528.html)
