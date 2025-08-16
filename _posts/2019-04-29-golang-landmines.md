---
layout:       post
title:        "go的不完全避坑指南"
subtitle:     ""
date:         2019-04-29
author:       "Zeusro"
header-img:   "img/b/2019/Silver-Days.jpg"
header-mask:  0.3
catalog:      true
tags:
    - go
---


在翻阅kubernetes的文档时，里面刚好谈到go一些注意事项。

结合以前遇过的坑爹API,汇成此文.

## 语言特性

### 数据切片

原则是取下标,不取上标

```go
	a:=[]int{0,1,2,3,4}
	a=a[:]
	a=a[2:4] //从第[2]位起取,直至[4-1]位,所以结果只有2个元素
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	//len(a):2 ; cap(a):3; values:[2 3]
```

数组切片是一种指针,所以才会引申出len/cap/append的问题

### len/cap/append的问题

关于len/cap的问题可以看下面2篇文章

1. [Slice length and capacity](https://tour.golang.org/moretypes/11)
1. [Go Slices: usage and internals](https://blog.golang.org/go-slices-usage-and-internals)

简单地说,len就是当前数组/切片实际元素的计数,cap是底层数组的长度,砍头不砍尾

```go
	a :=make([]int,2,3) 
	// a[2]=666  //panic: runtime error: index out of range
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):2 ; cap(a):3; values:[0 0] 
	a=a[1:]
	// 第0位没了,但是后面的还在,所以cap=3-1
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

`append`是在数组末尾追加元素,返回一个新的数组,原数组不会发生改变.

len=cap时,继续`append`,cap会翻倍

### 不会用defer就别瞎装逼

`defer`是倒序执行,而且后定义的`defer`先执行(这个很好理解,先定义A变量,然后定义B变量，A的作用域比B长，先清理B是正确选择).


```go
	for i := 0; i < 10; i++ {
		defer fmt.Println(i)              // OK; prints 9 ... 0
		defer func() { fmt.Println(i) }() // WRONG; prints "10" 10 times
		defer fmt.Println(i) //跟下面一行结果一样
		defer func(i int) { fmt.Println(i) }(i) // OK  prints 0 ... 9 in
		defer print(&i)                         // WRONG; prints "10" 10 times unpredictable order
		go func() { fmt.Println(i) }()          // WRONG; totally unpredictable.
	}

```

这个例子是[The Three Go Landmines.markdown](https://gist.github.com/lavalamp/4bd23295a9f32706a48f)提出来的。要理解其实不难，把for拆解出来就行了。注意for只是控制了循环的边界,循环结束后,i=10.

需要分清的传入参数的情况

`defer func() { fmt.Println(i) }()`
相当于

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

所以`defer func() { fmt.Println(i) }()`的结果为打印10次10

而`defer fmt.Println(i)`等价于`defer func(i int) { fmt.Println(i) }(i)`

把局部变量传入,defer内部获得的是值的复制,所以实际上是

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


还有无法定义变量获取defer函数的返回值，defer函数带返回值根本毫无意义

```go

	defer func() string {
		if str := "e"; str == "e" {
			return str
		}
		return "e"
	}()
```


### if变量作用域

if 里面定义的变量，即便是跟已定义变量同名，在if中对其赋值，对已经被定义的变量不会有影响。

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

### 半新不旧变量

常见于err和多重返回值函数，针对这种情况，可以通过if作用域强制覆盖，或者命名一个新变量解决

```go
var e error

func main() {
	s, e := a() //无法编译
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

### goroutine 机制

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

1. 问题1: 运行的结果
1. 问题2: 去掉`runtime.GC()`之后的结果
1. 问题3: 如果你是goruntime,去掉`fmt.Println(i)`之后要怎么优化编译

答案:

Gosched() 让出了CPU时间片,让 goroutine 有机会运行

Goroutine采用的是半抢占式的协作调度，只有在当前Goroutine发生阻塞时才会导致调度

GC()需要stop the world,所以会等待协程运行完

如果没有 GC()这个方法,则运行结果完全不可控

for 里面一堆废话,最合理的优化,应该是连协程都不创建,哈哈哈哈哈

## 坑爹API


### 获取字符串长度:

```go
len([]rune("文件夹,子文件夹,"))
```

### Split的坑

```go
	s := strings.Split("shit,", ",")
	fmt.Printf("len(s):%d\n", len(s))//2
	for _, v := range s {
		fmt.Printf("%s", v)
	}
```

strings.Split的字符串,如果用来分割的字符串恰好出现完整字符串的最后面,获得的数组长度会+1,这个数组的最后一个元素会是一个空白


### 时间转换函数

golang的字符串转日期函数非常不灵活,并且格式化的字符串是一个魔术变量,代表golang的面世时间...

```go
// ToTime 字符串转golang内置当地时间
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

### 值类型不会溢出

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

以前用C#的时候,如果定义一个值类型变量,赋予它一个超出范围的值的话是会出异常的,然而到了golang,直接变成这个类型无符号最大值

## 构建篇

启用了`go module`之后，对依赖的拉取变得更加频繁。但是基于中国有中国特色的互联网，我们有时候很难get到我们需要的依赖源代码，进而导致项目编译失败，CI失败。于是，我们需要一个proxy。

```bash
export GOPROXY=https://goproxy.io
```

[goproxy.io for Go modules](https://cloud.tencent.com/developer/news/308442)



## 开发建议

1. [CodeReviewComments](https://github.com/golang/go/wiki/CodeReviewComments)
1. [Effective Go](https://golang.org/doc/effective_go.html)


其他语言的可看
[Google Style Guides](https://google.github.io/styleguide/)

论喷子，还是没[王垠](http://www.yinwang.org/blog-cn/2014/04/18/golang)强

## 课后作业

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

注释掉里面的`defer`，观察一下不同组合下的函数的结果，看懂了，就算理解defer了
