При чтении документации kubernetes там как раз упоминались некоторые соображения по Go.

В сочетании с ранее встреченными проблемными API, собрано в эту статью.

## Особенности языка

### Срезы данных

Принцип — брать нижний индекс, не верхний.

```go
	a:=[]int{0,1,2,3,4}
	a=a[:]
	a=a[2:4] //Начать с позиции [2], до позиции [4-1], поэтому результат имеет только 2 элемента
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	//len(a):2 ; cap(a):3; values:[2 3]
```

Срезы массивов — это указатели, поэтому возникают проблемы len/cap/append.

### Проблемы len/cap/append

По проблемам len/cap см. следующие 2 статьи:

1. [Длина и емкость среза](https://tour.golang.org/moretypes/11)
1. [Срезы Go: использование и внутреннее устройство](https://blog.golang.org/go-slices-usage-and-internals)

Проще говоря, len — это подсчет фактических элементов в текущем массиве/срезе, cap — это длина базового массива, обрезать голову, не хвост.

```go
	a :=make([]int,2,3) 
	// a[2]=666  //panic: runtime error: index out of range
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):2 ; cap(a):3; values:[0 0] 
	a=a[1:]
	// Позиция 0 исчезла, но остальное остается, поэтому cap=3-1
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):1 ; cap(a):2; values:[0] 
	a=append(a,2)
	a=append(a,3)
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	//len(a):3 ; cap(a):4; values:[0 2 3]
	b:=append(a,4)
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):3 ; cap(a):4; values:[0 2 3] 
	fmt.Printf("len(b):%d ; cap(b):%d; values:%v \n",len(b),cap(b),b) 
	// len(b):4 ; cap(b):4; values:[0 2 3 4]
```

`append` добавляет элементы в конец массива, возвращает новый массив, исходный массив не изменяется.

Когда len=cap, продолжая `append`, cap удвоится.

### Не хвастайтесь, если не умеете использовать defer

`defer` выполняется в обратном порядке, и позже определенный `defer` выполняется первым (это легко понять, сначала определить переменную A, затем определить переменную B, область видимости A длиннее, чем B, сначала очистить B — правильный выбор).


```go
	for i := 0; i < 10; i++ {
		defer fmt.Println(i)              // OK; prints 9 ... 0
		defer func() { fmt.Println(i) }() // WRONG; prints "10" 10 times
		defer fmt.Println(i) //Тот же результат, что и строка ниже
		defer func(i int) { fmt.Println(i) }(i) // OK  prints 0 ... 9 in
		defer print(&i)                         // WRONG; prints "10" 10 times unpredictable order
		go func() { fmt.Println(i) }()          // WRONG; totally unpredictable.
	}

```

Этот пример был предложен [The Three Go Landmines.markdown](https://gist.github.com/lavalamp/4bd23295a9f32706a48f). Понять не сложно, просто разложите цикл for. Обратите внимание, что for только контролирует границу цикла, после окончания цикла i=10.

Нужно различать случаи передачи параметров:

`defer func() { fmt.Println(i) }()`
эквивалентно

```go
i:=0
defer func() { fmt.Println(i) }()
i=1
defer func() { fmt.Println(i) }()
......
i=9
defer func() { fmt.Println(i) }()
i=10
```

Поэтому результат `defer func() { fmt.Println(i) }()` — это печать 10 десять раз.

А `defer fmt.Println(i)` эквивалентно `defer func(i int) { fmt.Println(i) }(i)`

Передавая локальные переменные, defer внутри получает копию значения, поэтому фактически:

```go
i:=0
defer fmt.Println(0)
i=1
defer fmt.Println(1)
......
i=9
defer fmt.Println(9)
i=10
```


Также нельзя определить переменные для получения возвращаемых значений из defer-функций. Defer-функции с возвращаемыми значениями совершенно бессмысленны.

```go

	defer func() string {
		if str := "e"; str == "e" {
			return str
		}
		return "e"
	}()
```


### Область видимости переменных if

Переменные, определенные внутри if, даже если они имеют то же имя, что и уже определенные переменные, присвоение им внутри if не повлияет на уже определенные переменные.

```go
var ErrDidNotWork = errors.New("did not work")

func DoTheThing(reallyDoIt bool) (err error) {
  if reallyDoIt {
    result, err := tryTheThing()
    if err != nil || result != "it worked" {
      err = ErrDidNotWork
    }
  }
  return err
}
```

### Полуновые-полустарые переменные

Часто встречается с err и функциями с несколькими возвращаемыми значениями. Для этой ситуации можно принудительно переопределить через область видимости if или назвать новую переменную для решения.

```go
var e error

func main() {
	s, e := a() //Не компилируется
	s, err2 := a() //OK
	if s, e := a(); e != nil { //OK
	}
	······
	fmt.Print(s)
}

func a() (str string, err error) {
	return "", nil
}
```

### Механизм goroutine

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	var i byte
	go func() {
		for i = 0; i < 255; i++ {
			fmt.Println(i)
		}
	}()
	fmt.Println("start")
	runtime.Gosched()
	runtime.GC()
	fmt.Println("end")
}
```

1. Вопрос 1: Результат выполнения
1. Вопрос 2: Результат после удаления `runtime.GC()`
1. Вопрос 3: Если бы вы были goruntime, как бы вы оптимизировали компиляцию после удаления `fmt.Println(i)`

Ответы:

Gosched() уступает срез времени CPU, давая goroutine шанс запуститься.

Goroutine использует полупреemptive кооперативное планирование, только когда текущая Goroutine блокируется, это вызовет планирование.

GC() требует stop the world, поэтому будет ждать завершения выполнения корутины.

Если нет метода GC(), результат выполнения полностью непредсказуем.

В цикле for куча ерунды. Самая разумная оптимизация должна быть даже не создавать корутину, хахахаха.

## Проблемные API


### Получение длины строки:

```go
len([]rune("文件夹,子文件夹,"))
```

### Ловушка Split

```go
	s := strings.Split("shit,", ",")
	fmt.Printf("len(s):%d\n", len(s))//2
	for _, v := range s {
		fmt.Printf("%s", v)
	}
```

Для strings.Split, если строка, используемая для разделения, точно появляется в самом конце полной строки, полученная длина массива будет +1, и последний элемент этого массива будет пустым.


### Функция преобразования времени

Функция преобразования строки в дату golang очень негибкая, и форматированная строка — это магическая переменная, представляющая время рождения golang...

```go
// ToTime Строка в локальное время, встроенное в golang
func ToTime(str string) (time.Time, error) {
    var err error
    format1 := "2006-01-02 15:04:05"    
	loc, err := time.LoadLocation("Local");
	if err != nil {
		return time.Now(), err
	}
	date, err := time.ParseInLocation(format1, str, loc);
	if err == nil {
		return date, nil
	}
	format2 := "2006-01-02"
	date, err = time.ParseInLocation(format2, str, loc);
	if err == nil {
		return date, nil
	}
	sqlserverFormat:= "2006-01-02T15:04:05"
	date, err = time.ParseInLocation(sqlserverFormat, str, loc);
	if err == nil {
		return date, nil
	}
    return time.Now(), err
}
```

### Типы значений не переполняются

```go
	var s int32 = 5120
	fmt.Print(s * 1024 * 1024)
	fmt.Print("\n")
	fmt.Print(int64(s) * 1024 * 1024)
	fmt.Print("\n")
	fmt.Print(math.MaxInt32)
	fmt.Print("\n")
	fmt.Print(math.MaxInt64)
    /*
1073741824
5368709120
2147483647
9223372036854775807
*/
```

Когда я использовал C# раньше, если вы определяли переменную типа значения и присваивали ей значение за пределами диапазона, это вызывало исключение. Однако в golang это напрямую становится максимальным значением без знака этого типа.

## Раздел сборки

После включения `go module` получение зависимостей становится более частым. Но на основе уникального интернета Китая нам иногда трудно получить исходный код зависимостей, который нам нужен, что приводит к сбою компиляции проекта и сбою CI. Итак, нам нужен прокси.

```bash
export GOPROXY=https://goproxy.io
```

[goproxy.io для модулей Go](https://cloud.tencent.com/developer/news/308442)



## Рекомендации по разработке

1. [CodeReviewComments](https://github.com/golang/go/wiki/CodeReviewComments)
1. [Effective Go](https://golang.org/doc/effective_go.html)


Для других языков см.:
[Google Style Guides](https://google.github.io/styleguide/)

Что касается троллинга, все еще не так силен, как [Ван Инь](http://www.yinwang.org/blog-cn/2014/04/18/golang)

## Домашнее задание

```go

func a() (str string) {
	defer func() {
		str = "a"
	}()

	defer func(str string) {
		str = "b"
	}(str)

	defer func() {
		if str2 := "c"; str2 == "c" {
			str = str2
		}
	}()

	defer func() {
		if str := "d"; str == "d" {
			str = "d"
		}
	}()

	defer func() string {
		if str := "e"; str == "e" {
			return str
		}
		return "e"
	}()

	str = "f"
	return str
}

```

Закомментируйте `defer` внутри, наблюдайте результат функции при разных комбинациях. Как только поймете, вы поняли defer.
