1. [Подготовка](#подготовка)
    * Определение сущности
    * Определение коллекции
1. [Полный код](#полный-код)
1. [Ссылки](#ссылки)

## Подготовка

* Определение сущности

```Csharp

    public class Person
    {

        /// <summary>
        /// Рост
        /// </summary>
        /// <returns></returns>
        public int Height { get; set; }

        /// <summary>
        /// Вес
        /// </summary>
        /// <returns></returns>
        public int Weight { get; set; }

        /// <summary>
        /// День рождения
        /// </summary>
        /// <returns></returns>
        public DateTime Birthday { get; set; }

        /// <summary>
        /// Хобби
        /// </summary>
        /// <returns></returns>
        public List<string> Hobbies { get; set; }

        /// <summary>
        /// Номер удостоверения личности
        /// </summary>
        /// <returns></returns>
        public string Identifier { get; set; }

        /// <summary>
        /// Адрес
        /// </summary>
        /// <returns></returns>
        public string Address { get; set; }

        public Sex Sex { get; set; }


    }

    /// <summary>
    /// Пол
    /// </summary>
    public enum Sex : short
    {
        //Мужской
        Male = 1,
        //Женский
        Female,
        //Третий пол https://zh.wikipedia.org/wiki/%E7%AC%AC%E4%B8%89%E6%80%A7
        X,

    }
```

* Определение коллекции

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

## Полный код

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
            var after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).First();//Если результат пуст, это вызовет исключение, поэтому этот метод редко используется
            //An unhandled exception of type 'System.InvalidOperationException' occurred in System.Linq.dll: 'Sequence contains no elements'
            after90 = list1.Where(o => o.Birthday >= new DateTime(1990, 1, 1)).FirstOrDefault();
            var after00 = list1.Where(o => o.Birthday >= new DateTime(2000, 1, 1)).FirstOrDefault();
            list1.ForEach(item =>
            {
                //Можно работать с коллекцией внутри ForEach
                item.Sex = Sex.X;
            });
            list1.ForEach(item =>
           {
               System.Console.WriteLine(JsonConvert.SerializeObject(item));
           });
            int maxHeight = list1.Select(o => o.Height).Max();
            //То же, что list1.Max(o => o.Height);
            int minWeight = list1.Min(o => o.Weight);            
            list1.Select(o=>o.Identifier).Distinct();
            list1.Skip(1).Take(2);
            //По возрастанию
            list1 = list1.OrderBy(o => o.Birthday).ToList();
            //По убыванию
            list1 = list1.OrderByDescending(o => o.Birthday).ToList();
            //Соединение, ниже означает извлечение элементов с одинаковым номером ID из list1 и list2, создание новой коллекции            
            //На самом деле, join имеет другое использование, подобное многотабличным соединениям в sqlserver, объединяя разные источники данных вместе для создания новых структур данных
            var intersect = list1.Join(list2, o => o.Identifier, o => o.Identifier, (a, b) => a).ToList();
            //Пересечение list1 ∩ list2                        
            intersect = list1.Intersect(list2).ToList();
            //Объединение list1 ∪ list2 
            var union = list1.Union(list2).ToList();
            //Разность list1 - list2
            var except = list1.Except(list2).ToList();
            //Преобразование структуры данных
            list1.ToArray();
            //Обратите внимание, если ключ дублируется, ToDictionary вызовет ошибку
            list1.ToDictionary(o => o.Identifier, o => o);
            list1.ToHashSet();
        }
    }
```



## Ссылки:

1. [Язык интегрированных запросов (LINQ)](https://docs.microsoft.com/zh-cn/dotnet/csharp/linq/)
1. [Операции LINQ с массивами (пересечение, объединение, разность, максимум, минимум, среднее, удаление дубликатов)](http://edi.wang/post/2012/2/20/linq-on-array-intersection-union-max-min-average-remove-duplication)
1. [Удивительные функции в C# -- 1. ToLookup](http://www.cnblogs.com/multiplesoftware/archive/2011/03/31/2000528.html)
