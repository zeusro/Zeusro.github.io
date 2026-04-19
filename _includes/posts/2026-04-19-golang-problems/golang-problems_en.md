
In one sentence: `golang` is a high-performance language for network programming—nothing more, nothing less.

## Zero-value traps

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

// var v AllBasicTypes — zero values: false, "", 0, 0.0, (0+0i), etc.
```

To avoid null-pointer-style issues like in `Java`, `golang` uses **default zero values**. That means you must be careful with zero values when you design programs.
For the struct above, after `var v AllBasicTypes`, `v.B` is `false` and `v.U8` is `0`.

In real scenarios you cannot tell whether `B` is **false** or simply **unset**. The usual fixes are an extra map for “was it set?” or the odd choice of a `*bool` pointer.

```go
import (
    "fmt"
    "time"
    "google.golang.org/protobuf/types/known/timestamppb"
)

func main() {
    // Bad example: zero value of time.Time
    var zeroTime time.Time  // or time.Time{}
    protoTs := timestamppb.New(zeroTime)
    
    // Serialization fails
    data, err := proto.Marshal(protoTs)
    fmt.Println(err)  // e.g. proto: Google.Protobuf.Timestamp.Seconds out of range -62135596800
}
```

A zero `time.Time` quietly blows up `proto` **`Timestamp`** handling.
You might define a field as `time.Time` deep in the model, then fail deserialization at the top-level `API`.

## Weak networks

On a poor network, `golang` is awkward to use: the standard library is thin, you constantly need `go get`, and in China `go get` almost always means fighting proxies.

![Go modules: diamond dependency with multiple required versions of shared dependency C](/img/in-post/2026-04-19-golang-problems/golang-diamond-dependency.png)

Even if the network and third-party **diamond dependencies** are “solved,” `golang` is still painful under weak connectivity. You check out one repo and still cannot escape `vscode` + the `golang` extension + `go mod tidy` for dev and build.
The `vscode` extension is not turnkey either—you install it, then still install `dlv` and more.

## Compatibility

Compatibility splits into **OS-level compatibility** and **forward language compatibility**.

### When `golang` is not forward-compatible

Many people do not realize `golang` has shipped **backward-incompatible** changes over the years:

| Go version   | Category                  | What broke                                                                 | Mitigation / notes                                                              |
|--------------|---------------------------|----------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| **Go 1 (2012)** | Language & stdlib overhaul | Huge jump from pre-Go 1 (r60, etc.): package paths (e.g. `encoding/asn1`), `os.Error` → `error`, `time` redesign, `map`/`delete`, `rune`, randomized map iteration, … | Use `go fix`. Largest breaking migration ever.                                  |
| **Go 1.1**   | Language & platforms      | Integer divide-by-zero on constants is an error; `int`/`uint` 64-bit on 64-bit; some `net`/`syscall` shapes/signatures. | Direct compile/runtime impact.                                                  |
| **Go 1.5**   | Runtime                   | `GOMAXPROCS` default 1 → number of CPUs.                                  | Concurrency/perf assumptions may change.                                        |
| **Go 1.21**  | Runtime & panic           | `panic(nil)` / untyped nil panics `*runtime.PanicNilError` (previously no panic). | `GODEBUG=panicnil=1` or stay on `go 1.20` or older.                             |
| **Go 1.21**  | Package init              | Init order is now defined (import path order); previously undefined.        | Code relying on implicit init order may break.                                  |
| **Go 1.22**  | Language (`for`)          | Per-iteration loop variables (was one shared var). Closure capture changes. | Enabled by `go 1.22` (or newer) in `go.mod`; older modules keep old behavior. Common migration point. |
| **Go 1.22**  | `net/http.ServeMux`       | Method prefixes (`POST /path`), `{name}` wildcards, escaping changes.       | `GODEBUG=httpmuxgo121=1` restores Go 1.21 behavior.                             |
| **Go 1.22**  | `go/types`                | Type aliases use `Alias` (previously same as underlying type).              | `GODEBUG=gotypesalias=0` (default in 1.22); default 1 from 1.23; removed 1.27. |
| **Go 1.22**  | TLS & crypto              | Min TLS 1.2; some RSA KEX / 3DES ciphers removed (later releases).         | Various `GODEBUG` flags (`tls10server=1`, …), some removed by 1.27.            |
| **Go 1.23**  | `time`                    | Channels from `time` are unbuffered; affects correct `Timer.Stop` usage.     | `GODEBUG=asynctimerchan=0` (removed 1.27).                                      |
| **Go 1.23**  | `net/http`                | `http.ServeContent` strips some headers on errors.                          | `GODEBUG=httpservecontentkeepheaders=1`.                                        |
| **Go 1.23**  | `x509` & TLS              | Reject negative serials; `Leaf` population changes, etc.                    | `GODEBUG` such as `x509negativeserial=0`, `x509keypairleaf=0`.                  |
| **Go 1.24**  | `x509`                    | Certificate Policies field handling.                                      | `GODEBUG=x509usepolicies=0`.                                                    |
| **Go 1.25**  | Runtime & nil checks        | Some nil derefs (e.g. `f, err := os.Open(); f.Name()` when `f==nil`) panic immediately (was sometimes deferred). | Spec-correct; no `GODEBUG`; fix code (check `err` first).                     |
| **Go 1.25+** | Platforms                 | Drops old OS support (e.g. macOS 11, 32-bit windows/arm); Wasm export changes. | Porting/build impact, not always API.                                          |

Parsing certs produced by older `golang` with a newer toolchain can fail because of `x509` changes.

Another face of incompatibility is **splintered tooling**—especially obvious around `proto`.

```bash
# Core
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Validation
go install github.com/envoyproxy/protoc-gen-validate@latest

# HTTP gateway
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# API docs
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
go install github.com/google/gnostic/cmd/protoc-gen-openapi@latest
```

You install all of that—then drop to an older `golang` and even `dlv` may not run.
You hunt for toolchains that match, and get **lost in the matrix** of plugins.

You cannot always stay on the newest `golang`, so workflows get weird:

Tweak `path` on `window` to an old `golang` → debugger stack unsupported → hunt for tools A B C D that match → fix A, then B, then C, loop forever.

You only wanted to run a program, but time burns on `go install` version pins.

### `window` is a bad fit for `golang`

On `window`, many third-party tools fail to build; `go install` becomes a joke.
So people doing `golang` gravitate to `Linux` / `mac` when they can.

## No selective compilation

`Go` lacks **preprocessor-style** conditional compilation like `C#` / the C family: `#if` that **strips whole regions** from unselected builds. The closest `Go` offers is **build tags** (`//go:build`) across files, or `runtime.GOOS` branches—different semantics and ergonomics. Coming from `C#`, you feel the missing “selective compilation.”

Typical `C#` patterns (illustrative):

```csharp
// 1) Trim code by symbol (DEBUG is defined in Debug builds)
#if DEBUG
    System.Diagnostics.Debug.WriteLine("Only in Debug builds");
#endif

#if MY_FEATURE
    // Define MY_FEATURE in csproj <DefineConstants> or compiler flags
    DoExperimentalStuff();
#endif

// 2) Conditional: if the symbol is undefined, call sites are stripped (method may remain)
using System.Diagnostics;

class App
{
    [Conditional("VERBOSE")]
    static void VerboseLog(string msg) => Console.WriteLine(msg);

    static void Main()
    {
        VerboseLog("No call instruction if VERBOSE is not defined");
    }
}
```

By contrast, `Go` swaps implementations per build mostly via file-level conditions (`//go:build linux`) or link tricks—not `#if` folding half a function.

Without those tags, aside from **environment variables**, I do not have another clean pattern.

## Postscript

Writing this, I ask myself: does sharing tech still matter in the **AI era**?

When I started, seniors said: blog your problems and fixes. I have kept that habit, off and on, for ten years.

We cannot out-learn AI—but **critical thinking** keeps me from being swept along; I treat AI as a calculator.

Risk is still mine. Years of bumps taught me: hold your **fate** in your own hands, or the world drags you.

So the blog post itself is not the point. **Thinking is the point**—synthesis is the process; the article is just something for later readers to remember you by.
