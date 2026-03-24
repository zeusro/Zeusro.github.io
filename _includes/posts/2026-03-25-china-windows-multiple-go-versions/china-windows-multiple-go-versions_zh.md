
还记得我之前提出过的0号规律吗？**边际收益为0的重构不要去做**。我已经遇过2次因为底层go版本的实现变化，而导致的无法升级项目go版本问题。

由于工作环境的限制，CI的不支持，导致无法在工作环境中使用最用最新版本的golang。

如果使用VS code作为编辑器，就会产生一个问题：
dlv 基本用最新版本的golang去构建，而 dlv 依赖于 `go mod tidy`。
如果使用 `go mod tidy` ,会根据依赖图修剪策略，使用高版本go后会重算依赖树，最终导致 go.mod 被重写。

要在 Windows 上让多个版本的 Go 语言共存，并且不影响 go mod 和 go install 的本地缓存，
Go 官方提出了一个多版本管理工具 `go install golang.org/dl/go<version>@latest` ，核心思路是：将不同版本的 Go 安装在不同的目录，并通过环境变量灵活切换。

各版本 SDK 隔离存放，互不影响。
go mod 和 go install 的缓存（默认在 %USERPROFILE%\go\pkg\mod 和 %USERPROFILE%\go\bin）是全局共享的。这是设计使然，因为模块缓存和安装的可执行文件通常是版本无关或向后兼容的。使用不同版本 Go 编译同一模块时，会利用已有缓存，节省空间和时间。

但在实践过程中会出现一点问题。 

## 卡点

配置了 `GOPROXY` 之后，本地安装当前golang的最高版本（go 1.26.1）并指向path路径。

再安装特定版本的 Go 工具链： 

```bash
#打开 PowerShell 或 CMD，使用 go install 命令安装你需要的版本。这些命令会下载一个版本特定的启动器。
go install golang.org/dl/go1.23.12@latest
# 之后可以看到 `%USERPROFILE%\go\bin` 中出现了 `go1.23.12.exe`。
go1.23.12 download
# 这一步由于网络问题，国内会下载失败!
```

我下载了 `go1.23.12.windows-amd64.zip` 并放置到 `%USERPROFILE%\sdk\go1.23.12` 目录，然后把压缩包中的go目录提取到 `%USERPROFILE%\sdk\go1.23.12` 中，还是提示下载失败。

于是我翻阅了这个命令对应的项目源码。`go1.23.12`其实对应 https://github.com/golang/dl 中的 `dl\go1.23.12\main.go`，重点在于 `dl\internal\version\version.go`中的文件判断。

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

`go1.23.12.windows-amd64.zip` 文件下载之后会计算 SHA256 ，并与远程登记的值进行对比，之后再解压，创建 `.unpacked-success` 文件。
如果我本地想跳过这个过程，要么修改 `dl\internal\version\version.go` 重新编译;要么在 `%USERPROFILE%\sdk\go1.23.12` 目录中创建  `.unpacked-success` 文件,我选择第二种。


```BASH
go1.23.12 version
go version go1.23.12 windows/amd64
```


命令成功之后，我找了一个项目构建,设置 env 之后依旧构建失败了。

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

于是我决定回退一开始的方案，使用 path 路径切换 go 版本 🤣。
在win11中，使用1.26，就把1.26 go版本的path上移到1.23的上面。这样新开的命令窗口，就是使用1.26版本，反之同理。

## One more thing

构建项目可以通过[go-size-analyzer](https://github.com/Zxilly/go-size-analyzer)分析二进制文件的大小。


1. 禁用CGO
1. 去除调试信息
1. 移除路径信息

减少二进制文件大小。

```bash
CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o myapp main.go
```

而代码层面，为了减少最终二进制文件大小，应该做的是

1. 减少代码的动态反射
1. 使用构建标签减少非必要的引用
1. 谨慎使用匿名导入

- 使用构建标签减少非必要的引用

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
    // 假设这个包非常大，有很多依赖
    // "github.com/aws/aws-sdk-go/service/dynamodb" 
)

func connectDB() {
    fmt.Println("Connecting to heavy Cloud Database...")
    // 初始化云数据库的代码
}
```

### main.go

```go
package main

func main() {
    connectDB()
}
```

直接运行 go build，编译器会包含 db_basic.go，排除 db_cloud.go。编译出来的文件很小。

如果你想要包含高级特性的版本，运行 go build -tags cloud_db，编译器会包含 db_cloud.go，排除 db_basic.go，此时才会把那些沉重的云数据库依赖打包进去。

相当于一种选择编译的技巧。

- 谨慎使用匿名导入

```go
// main_plugin.go
package main

import (
	"fmt"
	_ "plugin" // 仅仅是导入了 plugin 包，哪怕使用空白标识符忽略它
)

type HeavyService struct{}

// 未导出的方法 1（未使用）
func (s *HeavyService) unusedMethod1() {
	fmt.Println("This is a very complex method doing a lot of things...")
}

// 未导出的方法 2（未使用）
func (s *HeavyService) unusedMethod2() {
	fmt.Println("Another unused complex method...")
}

func main() {
	fmt.Println("Hello, World!")
}
```

编译行为分析：
当你使用 go build main_plugin.go 编译时，由于引入了 plugin 包，链接器将该二进制文件标记为支持动态链接。

链接器会这样想：“既然支持动态加载插件，我不知道未来加载进来的插件会不会通过反射或其他机制偷偷调用 HeavyService.unusedMethod1。为了安全起见，我不能删掉它！”

结果是：

1. unusedMethod1、unusedMethod2 等所有未导出的方法都会被强行保留。
1. 这些方法内部引用的其他包（如 fmt 内部更深层的依赖）、常量、字符串，也全都会被牵连保留。
1. 最终编译出的二进制文件体积会异常膨胀。

## 参考链接

【1】
Datadog 如何将其 Agent 的 Go 二进制文件缩减 77%
https://mp.weixin.qq.com/s/SW3-tI-OdtvladmWf-SLpg


