kubernetesのドキュメントを読んでいると、Goのいくつかの注意事項について言及されていました。

以前に遭遇した問題のあるAPIと組み合わせて、この記事にまとめました。

## 言語特性

### データスライス

原則は、下のインデックスを取り、上のインデックスは取りません。

```go
	a:=[]int{0,1,2,3,4}
	a=a[:]
	a=a[2:4] //位置[2]から開始し、位置[4-1]まで、したがって結果には2つの要素しかありません
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	//len(a):2 ; cap(a):3; values:[2 3]
```

配列スライスはポインターであるため、len/cap/appendの問題が発生します。

### len/cap/appendの問題

len/capの問題については、次の2つの記事を参照してください：

1. [スライスの長さと容量](https://tour.golang.org/moretypes/11)
1. [Goスライス：使用方法と内部構造](https://blog.golang.org/go-slices-usage-and-internals)

簡単に言えば、lenは現在の配列/スライスの実際の要素のカウントで、capは基になる配列の長さで、頭を切って尾を切らない。

```go
	a :=make([]int,2,3) 
	// a[2]=666  //panic: runtime error: index out of range
	fmt.Printf("len(a):%d ; cap(a):%d; values:%v \n",len(a),cap(a),a) 
	// len(a):2 ; cap(a):3; values:[0 0] 
	a=a[1:]
	// 位置0がなくなりましたが、残りは残っているため、cap=3-1
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

`append`は配列の末尾に要素を追加し、新しい配列を返します。元の配列は変更されません。

len=capの場合、`append`を続けると、capは2倍になります。

### deferの使い方がわからない場合は見せびらかさない

`defer`は逆順で実行され、後で定義された`defer`が先に実行されます（これは理解しやすいです。まず変数Aを定義し、次に変数Bを定義すると、AのスコープがBより長いため、Bを先にクリーンアップするのが正しい選択です）。


```go
	for i := 0; i < 10; i++ {
		defer fmt.Println(i)              // OK; prints 9 ... 0
		defer func() { fmt.Println(i) }() // WRONG; prints "10" 10 times
		defer fmt.Println(i) //次の行と同じ結果
		defer func(i int) { fmt.Println(i) }(i) // OK  prints 0 ... 9 in
		defer print(&i)                         // WRONG; prints "10" 10 times unpredictable order
		go func() { fmt.Println(i) }()          // WRONG; totally unpredictable.
	}

```

この例は[The Three Go Landmines.markdown](https://gist.github.com/lavalamp/4bd23295a9f32706a48f)によって提案されました。理解するのは難しくありません。forループを分解するだけです。forはループの境界を制御するだけであることに注意してください。ループが終了すると、i=10になります。

パラメータを渡す場合を区別する必要があります：

`defer func() { fmt.Println(i) }()`
は以下と同等です

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

したがって、`defer func() { fmt.Println(i) }()`の結果は、10を10回印刷することです。

そして`defer fmt.Println(i)`は`defer func(i int) { fmt.Println(i) }(i)`と同等です

ローカル変数を渡すと、defer内部は値のコピーを取得するため、実際には：

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


また、defer関数の戻り値を取得する変数を定義することはできません。戻り値を持つdefer関数は完全に意味がありません。

```go

	defer func() string {
		if str := "e"; str == "e" {
			return str
		}
		return "e"
	}()
```


### if変数スコープ

if内で定義された変数は、既に定義された変数と同じ名前であっても、if内でそれに代入しても、既に定義された変数には影響しません。

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

### 半新半旧変数

errと複数の戻り値を持つ関数で一般的です。この状況では、ifスコープで強制的にオーバーライドするか、新しい変数に名前を付けて解決できます。

```go
var e error

func main() {
	s, e := a() //コンパイルできません
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

### goroutineメカニズム

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

1. 問題1：実行結果
1. 問題2：`runtime.GC()`を削除した後の結果
1. 問題3：goruntimeの場合、`fmt.Println(i)`を削除した後、コンパイルをどのように最適化しますか

答え：

Gosched()はCPUタイムスライスを譲り、goroutineが実行される機会を与えます。

Goroutineは半プリエンプティブな協調スケジューリングを採用しており、現在のGoroutineがブロックした場合にのみスケジューリングが発生します。

GC()はstop the worldが必要なため、コルーチンの実行が完了するまで待機します。

GC()メソッドがない場合、実行結果は完全に予測不可能です。

forループ内に多くの無駄があります。最も合理的な最適化は、コルーチンさえ作成しないことです、はははは。

## 問題のあるAPI


### 文字列の長さを取得：

```go
len([]rune("文件夹,子文件夹,"))
```

### Splitの落とし穴

```go
	s := strings.Split("shit,", ",")
	fmt.Printf("len(s):%d\n", len(s))//2
	for _, v := range s {
		fmt.Printf("%s", v)
	}
```

strings.Splitの文字列の場合、分割に使用される文字列が完全な文字列の最後に正確に出現する場合、取得された配列の長さは+1になり、この配列の最後の要素は空白になります。


### 時間変換関数

golangの文字列から日付への関数は非常に柔軟性がなく、フォーマットされた文字列はマジック変数で、golangの誕生時間を表しています...

```go
// ToTime 文字列をgolang組み込み現地時間に変換
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

### 値型はオーバーフローしない

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

以前C#を使用していたとき、値型変数を定義し、範囲を超える値を割り当てると、例外が発生していました。しかし、golangでは、その型の符号なし最大値に直接なります。

## ビルドセクション

`go module`を有効にした後、依存関係の取得がより頻繁になります。しかし、中国の独特のインターネットに基づいて、必要な依存関係のソースコードを取得することが困難な場合があり、プロジェクトのコンパイル失敗とCI失敗につながります。したがって、プロキシが必要です。

```bash
export GOPROXY=https://goproxy.io
```

[Goモジュール用のgoproxy.io](https://cloud.tencent.com/developer/news/308442)



## 開発の推奨事項

1. [CodeReviewComments](https://github.com/golang/go/wiki/CodeReviewComments)
1. [Effective Go](https://golang.org/doc/effective_go.html)


他の言語については、以下を参照：
[Google Style Guides](https://google.github.io/styleguide/)

トローリングに関しては、[王垠](http://www.yinwang.org/blog-cn/2014/04/18/golang)ほど強くはありません

## 宿題

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

内部の`defer`をコメントアウトし、異なる組み合わせでの関数の結果を観察してください。理解できれば、deferを理解したことになります。
