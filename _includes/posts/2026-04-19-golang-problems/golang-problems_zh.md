
一句话概括，`golang`是一种高性能网络编程语言，仅此而已。

## 零值陷阱

```go
type AllBasicTypes struct {
	B    bool
	Str  string

	I8   int8
	I16  int16
	I32  int32
	I64  int64
	I    int

	U8   uint8
	U16  uint16
	U32  uint32
	U64  uint64
	U    uint
	Up   uintptr

	By   byte // uint8
	Ru   rune // int32

	F32  float32
	F64  float64

	C64  complex64
	C128 complex128
}

// var v AllBasicTypes —— 各字段为零值：false、""、0、0.0、(0+0i) 等
```

`golang`为了规避`Java`的空指针引用而引入了**默认零值**的设计。这导致了在设计程序的时候，遇到**零值**要小心处理。
比如上述这个结构，变量声明 `var v AllBasicTypes` 之后访问 `v.B`会得到`false`，`v.U8` 会得到 `0`。

那么在实际的应用场景，就无法判断`B`到底是`false`，还是未赋值。解决的办法是另外加一个字典标记，或者使用 `*bool` 布尔指针这种奇怪的类型。

```go
import (
    "fmt"
    "time"
    "google.golang.org/protobuf/types/known/timestamppb"
)

func main() {
    // 错误示例：使用 time.Time 的零值
    var zeroTime time.Time  // 或者 time.Time{}
    protoTs := timestamppb.New(zeroTime)
    
    // 序列化时就会报错
    data, err := proto.Marshal(protoTs)
    fmt.Println(err)  // 报错：proto: Google.Protobuf.Timestamp.Seconds out of range -62135596800
}
```

而时间的零值导致的`proto` `Timestamp`溢出是隐形的错误。
我们可能在底层的模型代码里面使用 `time.Time` 定义了某个字段，但在顶层`API`获取的时候发现反序列化失败。

## 弱网问题

在弱网环境，`golang`几乎是一种非常难用的编程语言。内置的语言包非常薄弱，经常需要`go get`，而国内 `go get` 则必定绕不过网络代理。

![Go 模块：菱形依赖下对公共依赖 C 的多个版本要求](/img/in-post/2026-04-19-golang-problems/golang-diamond-dependency.png)

即便网络问题解决了，第三方的**菱形依赖**你也解决了。但在弱网情况下，`golang`还是很难用。一份源代码，下载到本地，开发+编译绕不过 `vscode` + `golang`插件 + `go mod tidy`。
而且`golang`的`vscode`插件不是开箱即用的，安装之后还需要再安装 `dlv` 等工具。

## 兼容性问题

兼容性问题分两部分：**操作系统兼容**和**语言向前兼容**。

### golang的不向前兼容

很多人不知道，其实`golang`在这么多年迭代的过程中出现过不向前兼容的变更：

| Go 版本       | 变更类别                  | 具体不兼容变更描述                                                                 | 控制方式 / 备注                                                                 |
|---------------|---------------------------|------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **Go 1 (2012)** | 语言 & 标准库重大重构    | pre-Go 1 (r60 等) 到 Go 1 的巨大变更：包路径调整（e.g. encoding/asn1）、os.Error → error、time 包重构、map/delete 语法、rune 类型引入、map 遍历随机化等。 | 使用 `go fix` 工具辅助迁移。这是历史上最大的一次 breaking update。            |
| **Go 1.1**    | 语言 & 平台               | 整数除常量零变为编译错误；64 位平台 int/uint 变为 64 位；部分 net/syscall 结构体/签名变更。 | 直接影响编译或运行行为。                                                       |
| **Go 1.5**    | 运行时                    | GOMAXPROCS 默认从 1 改为 CPU 核心数（调度行为变更）。                             | 性能/并发相关，可能影响旧假设。                                                |
| **Go 1.21**   | 运行时 & panic            | `panic(nil)` 或 `panic(untyped nil)` 现在 panic `*runtime.PanicNilError`（之前无 panic）。 | `GODEBUG=panicnil=1` 恢复旧行为（或 `go 1.20` 及更早）。                       |
| **Go 1.21**   | 包初始化                  | 包初始化顺序算法精确定义（按 import path 排序），之前为未定义行为。               | 依赖隐式初始化顺序的代码可能受影响。                                           |
| **Go 1.22**   | 语言（for 循环）          | for 循环变量每个迭代创建新变量（之前所有迭代复用同一变量）。闭包捕获行为改变。   | 由 `go.mod` 中的 `go 1.22`（或更高）启用。旧模块保留旧行为。这是常见迁移点。   |
| **Go 1.22**   | net/http.ServeMux         | ServeMux 支持方法前缀（如 `POST /path`）、通配符 `{name}` 等新模式；路径转义处理变更。 | `GODEBUG=httpmuxgo121=1` 恢复 Go 1.21 行为。                                   |
| **Go 1.22**   | go/types                  | 类型别名现在用 `Alias` 类型表示（之前等价于原类型）。                            | `GODEBUG=gotypesalias=0`（默认在 1.22）；1.23 起默认 1，将在 1.27 移除。       |
| **Go 1.22**   | TLS & crypto              | 默认最小 TLS 版本提升至 1.2；移除部分 RSA key exchange 和 3DES 等 cipher（后续版本）。 | 多个 GODEBUG（如 `tls10server=1`、`tlsrsakex=1`、`tls3des=1`），部分将在 1.27 移除。 |
| **Go 1.23**   | time 包                   | time 包创建的 channel 变为 unbuffered（同步），影响 `Timer.Stop` 等正确使用。    | `GODEBUG=asynctimerchan=0` 恢复旧异步行为（将在 1.27 移除）。                  |
| **Go 1.23**   | net/http                  | `http.ServeContent` 在错误响应时移除某些 header。                                | `GODEBUG=httpservecontentkeepheaders=1` 恢复旧行为。                           |
| **Go 1.23**   | x509 & TLS                | 拒绝负序列号证书；`Leaf` 字段填充变更等。                                        | 多个 GODEBUG（如 `x509negativeserial=0`、`x509keypairleaf=0`）。               |
| **Go 1.24**   | x509                      | x509 证书策略（Policies）字段使用变更。                                           | `GODEBUG=x509usepolicies=0` 恢复旧行为。                                       |
| **Go 1.25**   | 运行时 & nil 检查         | 某些 nil 指针 dereference（e.g. `f, err := os.Open(); f.Name()` 当 f==nil 时）现在严格立即 panic（之前某些情况延迟）。 | 严格遵守规范；无 GODEBUG 控制，需修复代码（先检查 err）。                     |
| **Go 1.25+**  | 平台支持                  | 移除对旧 OS 支持（如 macOS 11、32-bit windows/arm）；Wasm 导出指令变更。         | 平台/移植相关，非 API 但影响构建。                                             |

在高版本`golang`中解析旧版本`golang`生成的证书，因为 `x509`部分的变更，可能出现解析失败的问题。

而语言不兼容的另一方面体现，是**工具集的割裂**。这在开发`proto`相关的时候就特别明显。

```bash
# 核心基础
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 数据验证
go install github.com/envoyproxy/protoc-gen-validate@latest

# HTTP 网关
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# API 文档
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
go install github.com/google/gnostic/cmd/protoc-gen-openapi@latest
```

你安装了这么多的工具集。但当你切换到低版本的`golang`语言，就会发现 `dlv` 甚至都运行不了。
你需要找各种兼容当前版本的`golang`，最后在一堆工具集中**迷失自我**。

实际情况并不允许你一直使用最新版本的`golang`，所以最后行为链路会变得非常奇怪：

在`window`使用`path`路径切换到低版本`golang` --> 调试工具集不支持 --> 重新寻找支持当前版本的`golang`工具集ABCD --> A弄好了，弄B，B弄好了找C，然后一直循环往复。

最后你忘了其实你只是想要跑个程序，却一直把时间浪费在 `go install` xx version。

### window不适合golang开发

而在`window`环境做`golang`开发是一个痛苦的事情。很多第三方工具，`golang`环境甚至无法编译成功，`go install` 就是一个笑话。
最后为了方便，`golang`开发大家都会尽可能地使用`Linux`/`mac` 系统。

## 选择编译缺失

`Go` 没有 `C#` / C 系那种**预处理器级**的条件编译：同一套语法里用 `#if` 把整段代码从**未选中的构建**里直接抹掉。`Go` 里更接近的做法是 **build tags**（`//go:build`）配合不同文件，或 `runtime.GOOS` 等运行时分支，语义和手感都不一样。若你从 `C#` 过来，会明显感到这种「选择性编译」能力的缺失。

`C#` 里常见用法大致如下（仅示意）：

```csharp
// 1) 按内置/项目符号裁剪代码块（DEBUG 由 Debug 配置自动定义）
#if DEBUG
    System.Diagnostics.Debug.WriteLine("只在 Debug 构建中存在");
#endif

#if MY_FEATURE
    // 需在 csproj 的 <DefineConstants> 或编译参数里定义 MY_FEATURE
    DoExperimentalStuff();
#endif

// 2) Conditional：未定义符号时，调用点会被编译器剔除（方法本身仍可存在）
using System.Diagnostics;

class App
{
    [Conditional("VERBOSE")]
    static void VerboseLog(string msg) => Console.WriteLine(msg);

    static void Main()
    {
        VerboseLog("这条在未定义 VERBOSE 时不会产生调用指令");
    }
}
```

对比之下，`Go` 要在「不同构建」下换实现，通常靠文件级条件（`//go:build linux`）或链接时注入，而不是在同一函数体里用 `#if` 折叠半页代码。

如果不用这种标签去做选择编译，那除了使用**环境变量**切换之外，我暂时想不到别的解决方案。

## 后记

写到这里，我突然想问自己一个问题：**AI时代**分享技术还有意义吗？

回想刚入行的时候，网络同行前辈的建议是写个博客记录整理一下遇到的问题和解决方案。至今这个习惯已经断断续续坚持了10年。

现在是AI时代，人学习信息技术的速度已经完全跟不上AI。但**批判性思维**让我不太受AI的影响，我始终把AI当成辅助计算的手段。

毕竟最终的决策风险要我本人承担。这么多年的风风雨雨，告诉我只有把**命运**掌握在自己手中，才不会被外物牵着走。

所以我觉得，写技术博客本身没有意义。**思考本身就是意义**，归纳是一个过程，文章只是一个供后人怀念的结果。
