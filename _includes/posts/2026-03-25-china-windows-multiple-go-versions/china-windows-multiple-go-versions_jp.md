
以前に挙げた「ゼロ番の法則」を覚えていますか。**限界利益がゼロになるリファクタはやらない**、というやつです。底辺の Go 実装の挙動変化のせいで、プロジェクトの Go バージョンを上げられなくなった経験は、すでに 2 回あります。

職場環境の制約（CI が対応していないなど）のため、業務環境では常に最新の golang を使えません。

エディタに VS Code を使うと、次のような問題が出ます。  
dlv はだいたい最新の golang でビルドされ、`go mod tidy` に依存します。  
`go mod tidy` を実行すると、依存グラフのトリミング方針により、高い Go バージョンにすると依存ツリーが再計算され、最終的に `go.mod` が書き換わります。

Windows 上で複数バージョンの Go を共存させ、`go mod` と `go install` のローカルキャッシュを壊さないようにするには、公式が示す複数バージョン管理の流れ `go install golang.org/dl/go<version>@latest` があります。考え方は、バージョンごとに別ディレクトリへインストールし、環境変数で柔軟に切り替えることです。

各バージョンの SDK は隔離され、互いに干渉しません。  
`go mod` と `go install` のキャッシュ（既定では `%USERPROFILE%\go\pkg\mod` と `%USERPROFILE%\go\bin`）はグローバルで共有されます。モジュールキャッシュとインストールした実行ファイルは多くの場合バージョンに依存しないか後方互換なので、設計としてそうなっています。異なる Go で同一モジュールをビルドすると既存キャッシュを使え、容量と時間を節約できます。

実運用では、いくつかつまずきどころがあります。

## つまずき

`GOPROXY` を設定したうえで、手元の golang として利用できる最新（go 1.26.1）を入れ、`PATH` に載せました。

続いて特定バージョンの Go ツールチェーンを入れます。

```bash
# PowerShell または CMD で、必要なバージョンを go install で取得する。バージョン専用のランチャーが落ちてくる。
go install golang.org/dl/go1.23.12@latest
# `%USERPROFILE%\go\bin` に `go1.23.12.exe` ができる。
go1.23.12 download
# 中国ではネットワークの都合で、このステップが失敗しがち
```

`go1.23.12.windows-amd64.zip` を `%USERPROFILE%\sdk\go1.23.12` に置き、アーカイブ内の `go` フォルダを同じ `%USERPROFILE%\sdk\go1.23.12` に展開しても、やはりダウンロード失敗のままでした。

そこでこのコマンドのソースを読みました。`go1.23.12` は https://github.com/golang/dl の `dl\go1.23.12\main.go` に対応し、肝は `dl\internal\version\version.go` のファイル判定です。

```go
func install(targetDir, version string) error {
	if _, err := os.Stat(filepath.Join(targetDir, unpackedOkay)); err == nil {
		log.Printf("%s: already downloaded in %v", version, targetDir)
		return nil
	}

	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return err
	}
	goURL := versionArchiveURL(version)
	res, err := http.Head(goURL)
	if err != nil {
		return err
	}
	if res.StatusCode == http.StatusNotFound {
		return fmt.Errorf("no binary release of %v for %v/%v at %v", version, getOS(), runtime.GOARCH, goURL)
	}
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned %v checking size of %v", http.StatusText(res.StatusCode), goURL)
	}
	base := path.Base(goURL)
	archiveFile := filepath.Join(targetDir, base)
	if fi, err := os.Stat(archiveFile); err != nil || fi.Size() != res.ContentLength {
		if err != nil && !os.IsNotExist(err) {
			// Something weird. Don't try to download.
			return err
		}
		if err := copyFromURL(archiveFile, goURL); err != nil {
			return fmt.Errorf("error downloading %v: %v", goURL, err)
		}
		fi, err = os.Stat(archiveFile)
		if err != nil {
			return err
		}
		if fi.Size() != res.ContentLength {
			return fmt.Errorf("downloaded file %s size %v doesn't match server size %v", archiveFile, fi.Size(), res.ContentLength)
		}
	}
	wantSHA, err := slurpURLToString(goURL + ".sha256")
	if err != nil {
		return err
	}
	if err := verifySHA256(archiveFile, strings.TrimSpace(wantSHA)); err != nil {
		return fmt.Errorf("error verifying SHA256 of %v: %v", archiveFile, err)
	}
	log.Printf("Unpacking %v ...", archiveFile)
	if err := unpackArchive(targetDir, archiveFile); err != nil {
		return fmt.Errorf("extracting archive %v: %v", archiveFile, err)
	}
	if err := os.WriteFile(filepath.Join(targetDir, unpackedOkay), nil, 0644); err != nil {
		return err
	}
	log.Printf("Success. You may now run '%v'", version)
	return nil
}
```

`go1.23.12.windows-amd64.zip` を取得したあと SHA256 を計算し、リモートの値と突き合わせ、展開して `.unpacked-success` を作ります。  
ローカルでこの過程を飛ばすには、`dl\internal\version\version.go` を直して再ビルドするか、`%USERPROFILE%\sdk\go1.23.12` に `.unpacked-success` を置くか—こちらは後者を選びました。

```bash
go1.23.12 version
go version go1.23.12 windows/amd64
```

コマンドが通ったあと、あるプロジェクトをビルドしましたが、env を設定してもビルドは失敗したままでした。

```bash
go1.23.12 clean -cache
go1.23.12 clean -modcache
go1.23.12 clean -testcache

# go1.23.12 env -w GOPROXY=
# go1.23.12 env -w GONOPROXY=
# go1.23.12 env -w GOPRIVATE=
# go1.23.12 env -w GOINSECURE=
go1.23.12 env -w GOSUMDB=off
go1.23.12 env -w GO111MODULE=on
go1.23.12 build -v -ldflags="-checklinkname=0"
```

最初の方針に戻り、`PATH` の順で Go バージョンを切り替えることにしました 🤣。  
Windows 11 では 1.26 を使うなら、1.26 の `go` を 1.23 より上に並べる。新しいコマンドウィンドウでは 1.26 が使われ、逆にすれば 1.23 側になります。

## One more thing

ビルド時は [go-size-analyzer](https://github.com/Zxilly/go-size-analyzer) でバイナリサイズを分析できます。

1. CGO を無効にする  
2. デバッグ情報を除く  
3. パス情報を落とす  

ことでバイナリを小さくできます。

```bash
CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o myapp main.go
```

コード面では、最終バイナリを小さくするために次を意識します。

1. 動的リフレクションを減らす  
2. ビルドタグで不要な参照を外す  
3. 匿名インポートに注意する  

- ビルドタグで不要な参照を減らす  

### db_basic.go

```go
//go:build !cloud_db

package main

import "fmt"

func connectDB() {
    fmt.Println("Connecting to local SQLite database...")
}
```

### db_cloud.go

```go
//go:build cloud_db

package main

import (
    "fmt"
    // このパッケージが巨大で依存が多いと仮定
    // "github.com/aws/aws-sdk-go/service/dynamodb"
)

func connectDB() {
    fmt.Println("Connecting to heavy Cloud Database...")
    // クラウド DB 初期化のコード
}
```

### main.go

```go
package main

func main() {
    connectDB()
}
```

そのまま `go build` すると `db_basic.go` が入り `db_cloud.go` は外れ、出力は小さくなります。

高度な構成にしたい場合は `go build -tags cloud_db` とすると `db_cloud.go` が入り `db_basic.go` は外れ、重いクラウド DB 依存が初めてバンドルされます。

選択的コンパイルのテクニックに相当します。

- 匿名インポートに注意する  

```go
// main_plugin.go
package main

import (
	"fmt"
	_ "plugin" // plugin をインポートするだけ。空白識別子でもリンクされる
)

type HeavyService struct{}

// エクスポートされていないメソッド 1（未使用）
func (s *HeavyService) unusedMethod1() {
	fmt.Println("This is a very complex method doing a lot of things...")
}

// エクスポートされていないメソッド 2（未使用）
func (s *HeavyService) unusedMethod2() {
	fmt.Println("Another unused complex method...")
}

func main() {
	fmt.Println("Hello, World!")
}
```

コンパイル・リンクの挙動：  
`go build main_plugin.go` で `plugin` を入れると、バイナリは動的ロード対応として印が付きます。

リンカの考え方は「動的プラグインを将来読み込むかもしれない。読み込まれた側がリフレクションなどで `HeavyService.unusedMethod1` を呼ぶかもしれない。安全のため削れない」となります。

結果：

1. `unusedMethod1` や `unusedMethod2` など、エクスポートされていないメソッドが残される  
2. それらが引っ張る他パッケージ（`fmt` より深い依存など）、定数、文字列も連鎖的に残る  
3. 最終バイナリが異常に肥大化する  

## 参考リンク

【1】  
Datadog が Agent の Go バイナリを 77% 削減した話（記事紹介・中国語）  
https://mp.weixin.qq.com/s/SW3-tI-OdtvladmWf-SLpg

