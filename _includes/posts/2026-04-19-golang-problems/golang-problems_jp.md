
ひと言で言えば、`golang`は高性能なネットワーク向け言語に過ぎない。

## ゼロ値の罠

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

// var v AllBasicTypes — 各フィールドはゼロ値: false、""、0、0.0、(0+0i) など
```

`Java`のようなヌルポインタ問題を避けるため、`golang`は**デフォルトゼロ値**を採用した。その結果、設計時に**ゼロ値**には常に注意が必要になる。
上の構造体では `var v AllBasicTypes` のあと、`v.B`は`false`、`v.U8`は`0`になる。

実務では、`B`が本当に`false`なのか、**未代入**なのか判別できない。対策は別マップで「セットされたか」を持つか、変な型の `*bool` を使うことになる。

```go
import (
    "fmt"
    "time"
    "google.golang.org/protobuf/types/known/timestamppb"
)

func main() {
    // 悪い例: time.Time のゼロ値を使う
    var zeroTime time.Time  // または time.Time{}
    protoTs := timestamppb.New(zeroTime)
    
    // シリアライズで失敗する
    data, err := proto.Marshal(protoTs)
    fmt.Println(err)  // 例: proto: Google.Protobuf.Timestamp.Seconds out of range -62135596800
}
```

時間のゼロ値が原因の`proto` `Timestamp`まわりの不具合は、見えにくい。
下位のモデルで `time.Time` フィールドを定義していても、上位の`API`でデシリアライズに失敗することがある。

## 弱いネットワーク

回線が弱い環境では、`golang`はかなり使いづらい。標準付属は薄く、すぐ`go get`が必要で、中国国内では`go get`はプロキシとセットになる。

![Go モジュール: 共通依存 C の複数バージョン要求によるダイヤモンド依存](/img/in-post/2026-04-19-golang-problems/golang-diamond-dependency.png)

ネットの問題とサードパーティの**ダイヤモンド依存**をどうにかしても、弱い回線のもとでは`golang`は相変わらず厳しい。ソースを取得しても、開発とビルドから `vscode` + `golang`拡張 + `go mod tidy` は逃げられない。
しかも`golang`用`vscode`拡張は開箱即戦力ではなく、入れたあとも `dlv` などを別途入れる。

## 互換性

互換性は大きく**OS互換**と**言語の前方互換**に分かれる。

### `golang`が前方互換でない例

あまり知られていないが、`golang`は長年のあいだに**前方互換を壊す**変更を出している：

| Go バージョン | 分類 | 非互換の内容 | 回避・備考 |
|---------------|------|--------------|------------|
| **Go 1 (2012)** | 言語・標準庫の大改修 | pre-Go 1 (r60 等) からの巨大差分：パス変更（例: `encoding/asn1`）、`os.Error` → `error`、`time`再設計、`map`/`delete`、`rune`、マップ走査のランダム化など | `go fix` で移行。最大の breaking 更新。 |
| **Go 1.1** | 言語・プラットフォーム | 定数ゼロ除算がエラー；64bit で `int`/`uint` が64bit；一部 `net`/`syscall` の型・シグネチャ変更 | コンパイル・実行に直撃。 |
| **Go 1.5** | ランタイム | `GOMAXPROCS` 既定が 1 → CPU 数 | 並行・性能の前提が変わる。 |
| **Go 1.21** | ランタイム・panic | `panic(nil)` / 型なし nil が `*runtime.PanicNilError` を panic（以前は panic しない） | `GODEBUG=panicnil=1` または `go 1.20` 以前。 |
| **Go 1.21** | パッケージ初期化 | 初期化順が規定（import path 順）；以前は未定義 | 暗黙の初期化順に依存したコードに影響。 |
| **Go 1.22** | 言語（`for`） | ループ変数が反復ごとに新規（以前は共有）。クロージャの捕獲が変わる | `go.mod` の `go 1.22` 以上で有効。よくある移行ポイント。 |
| **Go 1.22** | `net/http.ServeMux` | メソッド接頭辞（`POST /path`）、`{name}` ワイルドカード、エスケープ変更 | `GODEBUG=httpmuxgo121=1` で Go 1.21 挙動。 |
| **Go 1.22** | `go/types` | 型エイリアスが `Alias` として表現（以前は下位型と同一扱い） | `GODEBUG=gotypesalias=0`（1.22 既定）；1.23 から既定1、1.27 で削除予定。 |
| **Go 1.22** | TLS・crypto | 最小 TLS 1.2；RSA KEX や 3DES など削除（以降も継続） | 複数の `GODEBUG`、一部 1.27 で削除。 |
| **Go 1.23** | `time` | `time` が作る channel がアンバッファ；`Timer.Stop` 等の正しい使い方に影響 | `GODEBUG=asynctimerchan=0`（1.27 で削除予定）。 |
| **Go 1.23** | `net/http` | エラー応答で `http.ServeContent` が一部 header を除去 | `GODEBUG=httpservecontentkeepheaders=1`。 |
| **Go 1.23** | `x509`・TLS | 負のシリアル拒否；`Leaf` の扱い変更など | `x509negativeserial=0` 等。 |
| **Go 1.24** | `x509` | Certificate Policies フィールドの扱い | `GODEBUG=x509usepolicies=0`。 |
| **Go 1.25** | ランタイム・nil チェック | 一部 nil デリファレンス（例: `f, err := os.Open(); f.Name()` で `f==nil`）が即 panic（以前は遅延することがあった） | `GODEBUG` なし。`err` を先に確認。 |
| **Go 1.25+** | プラットフォーム | 古い OS サポート廃止（例: macOS 11、32-bit windows/arm）；Wasm エクスポート変更 | API 以外だがビルドに影響。 |

新しい`golang`で古い`golang`が生成した証明書を読むと、`x509`の変更でパースに失敗することがある。

互換性のもう一つの顔は**ツールチェーンの分断**で、`proto`まわりが特に顕著だ。

```bash
# コア
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# バリデーション
go install github.com/envoyproxy/protoc-gen-validate@latest

# HTTP ゲートウェイ
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest

# API ドキュメント
go install github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest
go install github.com/google/gnostic/cmd/protoc-gen-openapi@latest
```

こんなに入れても、古い`golang`に下げると `dlv` すら動かない。
互換バージョンを探して、ツールの海で**迷子**になる。

常に最新の`golang`とは限らないので、作業フローは奇妙になる：

`window`で`path`をいじって古い`golang`に切り替え → デバッグスタック非対応 → 対応版のツール ABCD を探す → A、次 B、次 C… のループ。

本当はプログラムを動かしたいだけなのに、`go install` のバージョンいじりに時間を焼く。

### `window`は`golang`開発に向かない

`window`ではサードパーティツールの多くがビルドすら通らず、`go install`が笑い話になる。
なので`golang`開発は、なるべく`Linux`/`mac`を使う流れになる。

## 選択的コンパイルの欠如

`Go`には `C#` や C 系のような**プリプロセッサ級**の条件コンパイルがない：構文のなかで `#if` によって**選ばれないビルド**から丸ごと削る、というやり方はできない。近いのは **build tags**（`//go:build`）でファイルを分けるか、`runtime.GOOS` などの分岐で、意味も手触りも違う。`C#` 出身だと「選択的コンパイル」が足りないと感じる。

`C#` でよくある例（概略）：

```csharp
// 1) シンボルでブロックを切る（DEBUG は Debug 構成で定義）
#if DEBUG
    System.Diagnostics.Debug.WriteLine("Debug ビルドにだけ存在");
#endif

#if MY_FEATURE
    // csproj の <DefineConstants> かコンパイラで MY_FEATURE を定義
    DoExperimentalStuff();
#endif

// 2) Conditional: シンボル未定義なら呼び出し側が削られる（メソッド自体は残り得る）
using System.Diagnostics;

class App
{
    [Conditional("VERBOSE")]
    static void VerboseLog(string msg) => Console.WriteLine(msg);

    static void Main()
    {
        VerboseLog("VERBOSE 未定義なら呼び出し命令は生成されない");
    }
}
```

対して`Go`は「ビルドごとに実装を差し替える」なら、だいたいファイル単位の条件（`//go:build linux`）かリンク時の工夫で、関数の半分を `#if` で畳むことはしない。

その手のタグを使わないなら、**環境変数**で切り替える以外、すぐには思いつかない。

## あとがき

ここまで書いて、**AI時代**に技術を共有することにまだ意味があるのか、自分に問う。

入門した頃、先輩はブログに問題と解を書けと言った。その習慣は10年、途切れ途切れ続いている。

いまはAI時代で、人間の学習速度はAIに追いつかない。それでも**批判的思考**のおかげでAIに流されにくく、AIは計算の補助だと割り切っている。

最終的なリスクは自分が負う。長年の経験で、**運命**は自分の手で握る以外、外物に引きずられる。

だから技術ブログそのものに意味はない。**考えること自体が意味**で、まとめるのはプロセスに過ぎず、記事は後世が懐かしむ結果にすぎない。
