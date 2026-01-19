When reading kubernetes documentation, it happened to mention some Go considerations.

Combined with previously encountered problematic APIs, compiled into this article.

## Language Features

### Data Slicing

The principle is to take the lower index, not the upper index.

```go
	a:=[]int{0,1,2,3,4}
	a=a[:]
	a=a[2:4] //Start from position [2], up to position [4-1], so the result only has 2 elements
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	//len(a):2 ; cap(a):3; values:[2 3]
```

Array slicing is a pointer, which is why len/cap/append issues arise.

### len/cap/append Issues

For len/cap issues, see the following 2 articles:

1. [Slice length and capacity](https://tour.golang.org/moretypes/11)
1. [Go Slices: usage and internals](https://blog.golang.org/go-slices-usage-and-internals)

Simply put, len is the count of actual elements in the current array/slice, cap is the length of the underlying array, cut head not tail.

```go
	a :=make([]int,2,3) 
	// a[2]=666  //panic: runtime error: index out of range
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):2 ; cap(a):3; values:[0 0] 
	a=a[1:]
	// Position 0 is gone, but the rest remains, so cap=3-1
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

`append` appends elements at the end of the array, returns a new array, the original array does not change.

When len=cap, continuing `append`, cap will double.

### Don't Show Off If You Don't Know How to Use defer

`defer` executes in reverse order, and later defined `defer` executes first (this is easy to understand, define variable A first, then define variable B, A's scope is longer than B, cleaning up B first is the correct choice).


```go
	for i := 0; i < 10; i++ {
		defer fmt.Println(i)              // OK; prints 9 ... 0
		defer func() { fmt.Println(i) }() // WRONG; prints "10" 10 times
		defer fmt.Println(i) //Same result as the line below
		defer func(i int) { fmt.Println(i) }(i) // OK  prints 0 ... 9 in
		defer print(&i)                         // WRONG; prints "10" 10 times unpredictable order
		go func() { fmt.Println(i) }()          // WRONG; totally unpredictable.
	}

```

This example was proposed by [The Three Go Landmines.markdown](https://gist.github.com/lavalamp/4bd23295a9f32706a48f). It's not hard to understand, just break down the for loop. Note that for only controls the loop boundary, after the loop ends, i=10.

Need to distinguish cases of passing parameters:

`defer func() { fmt.Println(i) }()`
is equivalent to

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

So the result of `defer func() { fmt.Println(i) }()` is printing 10 ten times.

And `defer fmt.Println(i)` is equivalent to `defer func(i int) { fmt.Println(i) }(i)`

Passing local variables, defer internally gets a copy of the value, so actually:

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


Also cannot define variables to get return values from defer functions. Defer functions with return values are completely meaningless.

```go

	defer func() string {
		if str := "e"; str == "e" {
			return str
		}
		return "e"
	}()
```


### if Variable Scope

Variables defined inside if, even if they have the same name as already defined variables, assigning to them inside if will not affect the already defined variables.

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

### Half-New Half-Old Variables

Common with err and multi-return functions. For this situation, you can force override through if scope, or name a new variable to solve it.

```go
var e error

func main() {
	s, e := a() //Cannot compile
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

### goroutine Mechanism

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

1. Question 1: The running result
1. Question 2: The result after removing `runtime.GC()`
1. Question 3: If you were goruntime, how would you optimize compilation after removing `fmt.Println(i)`

Answers:

Gosched() yields the CPU time slice, giving goroutine a chance to run.

Goroutine uses semi-preemptive cooperative scheduling, only when the current Goroutine blocks will it cause scheduling.

GC() needs stop the world, so it will wait for the coroutine to finish running.

If there's no GC() method, the running result is completely unpredictable.

There's a bunch of nonsense in the for loop. The most reasonable optimization should be not even creating the coroutine, hahahaha.

## Problematic APIs


### Getting String Length:

```go
len([]rune("文件夹,子文件夹,"))
```

### Split Pitfall

```go
	s := strings.Split("shit,", ",")
	fmt.Printf("len(s):%d\n", len(s))//2
	for _, v := range s {
		fmt.Printf("%s", v)
	}
```

For strings.Split, if the string used for splitting happens to appear at the very end of the complete string, the obtained array length will be +1, and the last element of this array will be a blank.


### Time Conversion Function

golang's string to date function is very inflexible, and the formatted string is a magic variable, representing golang's birth time...

```go
// ToTime String to golang built-in local time
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

### Value Types Don't Overflow

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

When I used C# before, if you defined a value type variable and assigned it a value beyond its range, it would throw an exception. However, in golang, it directly becomes the unsigned maximum value of that type.

## Build Section

After enabling `go module`, dependency pulling becomes more frequent. But based on China's unique internet, we sometimes have difficulty getting the dependency source code we need, which leads to project compilation failure and CI failure. So, we need a proxy.

```bash
export GOPROXY=https://goproxy.io
```

[goproxy.io for Go modules](https://cloud.tencent.com/developer/news/308442)



## Development Recommendations

1. [CodeReviewComments](https://github.com/golang/go/wiki/CodeReviewComments)
1. [Effective Go](https://golang.org/doc/effective_go.html)


For other languages, see:
[Google Style Guides](https://google.github.io/styleguide/)

In terms of trolling, still not as strong as [Wang Yin](http://www.yinwang.org/blog-cn/2014/04/18/golang)

## Homework

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

Comment out the `defer` inside, observe the function's result under different combinations. Once you understand, you've understood defer.
