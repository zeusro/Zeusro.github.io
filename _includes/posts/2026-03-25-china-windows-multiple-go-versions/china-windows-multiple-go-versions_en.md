
Do you still remember the “rule zero” I brought up before? **Do not refactor when the marginal benefit is zero.** I have already run into twice the situation where I could not upgrade a project’s Go version because the behavior of the underlying Go toolchain changed.

Because of limits in my work environment—CI not supporting it—I cannot use the latest golang there day to day.

If you use VS Code as your editor, a tension appears:
dlv is generally built with the newest golang, and dlv relies on `go mod tidy`.
If you run `go mod tidy`, the dependency graph pruning rules mean that after moving to a higher Go version the tree is recomputed and `go.mod` ends up rewritten.

To keep multiple Go versions on Windows at once without breaking local caches for `go mod` and `go install`, the Go project documents a multi-version workflow: `go install golang.org/dl/go<version>@latest`. The core idea is to put each Go version in its own directory and switch flexibly via environment variables.

Each SDK version lives in isolation and does not disturb the others.
Caches for `go mod` and `go install` (by default `%USERPROFILE%\go\pkg\mod` and `%USERPROFILE%\go\bin`) are shared globally. That is intentional: the module cache and installed binaries are usually version-agnostic or backward compatible. When different Go versions compile the same module, they reuse the cache and save disk space and time.

In real use, a few snags still show up.

## Sticking points

After configuring `GOPROXY`, I installed the newest golang available for my current setup (go 1.26.1) and put it on `PATH`.

Then I installed a specific Go toolchain:

```bash
# In PowerShell or CMD, use go install to fetch the version you need. These commands download a version-specific launcher.
go install golang.org/dl/go1.23.12@latest
# You should then see go1.23.12.exe under `%USERPROFILE%\go\bin`.
go1.23.12 download
# This step often fails in China because of network issues!
```

I downloaded `go1.23.12.windows-amd64.zip`, placed it under `%USERPROFILE%\sdk\go1.23.12`, and extracted the `go` directory into `%USERPROFILE%\sdk\go1.23.12`, but the tool still reported a download failure.

So I read the source for that command. `go1.23.12` maps to `dl\go1.23.12\main.go` in https://github.com/golang/dl; the important part is the file checks in `dl\internal\version\version.go`.

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

After `go1.23.12.windows-amd64.zip` is present, the tool computes SHA256, compares it with the value published remotely, unpacks, and writes the `.unpacked-success` marker.
To skip that locally I could either edit `dl\internal\version\version.go` and rebuild, or create `.unpacked-success` under `%USERPROFILE%\sdk\go1.23.12`; I picked the second option.

```bash
go1.23.12 version
go version go1.23.12 windows/amd64
```

With that working, I tried building a project; even after adjusting env vars the build still failed.

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

So I went back to the first approach: switching Go versions by reordering entries on `PATH` 🤣.
On Windows 11, to use 1.26, move the 1.26 `go` bin directory above the 1.23 one on `PATH`. New command windows then use 1.26; reverse the order for 1.23.

## One more thing

When you build, you can use [go-size-analyzer](https://github.com/Zxilly/go-size-analyzer) to study binary size.

1. Disable CGO  
2. Strip debug symbols  
3. Drop path metadata from the binary  

to shrink the executable.

```bash
CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o myapp main.go
```

At the source level, to reduce final binary size you should:

1. Cut down on dynamic reflection  
2. Use build tags to drop optional imports  
3. Be careful with blank imports  

- Use build tags to omit non-essential references  

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
    // Suppose this package is huge with many dependencies
    // "github.com/aws/aws-sdk-go/service/dynamodb"
)

func connectDB() {
    fmt.Println("Connecting to heavy Cloud Database...")
    // Code to initialize the cloud database
}
```

### main.go

```go
package main

func main() {
    connectDB()
}
```

A plain `go build` includes `db_basic.go` and excludes `db_cloud.go`, yielding a small binary.

For a build with the advanced path, run `go build -tags cloud_db`: the compiler includes `db_cloud.go`, excludes `db_basic.go`, and only then pulls in the heavy cloud database dependencies.

That is essentially a selective compilation technique.

- Be careful with blank imports  

```go
// main_plugin.go
package main

import (
	"fmt"
	_ "plugin" // Only imports plugin; even with _, the package is linked
)

type HeavyService struct{}

// Unexported method 1 (unused)
func (s *HeavyService) unusedMethod1() {
	fmt.Println("This is a very complex method doing a lot of things...")
}

// Unexported method 2 (unused)
func (s *HeavyService) unusedMethod2() {
	fmt.Println("Another unused complex method...")
}

func main() {
	fmt.Println("Hello, World!")
}
```

What the linker does:
When you `go build main_plugin.go`, importing `plugin` marks the binary as supporting dynamic loading.

The linker reasons: “Because plugins may be loaded later, I cannot know whether a plugin will call `HeavyService.unusedMethod1` via reflection or other tricks. To be safe I must keep it!”

The outcome:

1. `unusedMethod1`, `unusedMethod2`, and similar unexported methods are retained.  
2. Packages they pull in (deeper dependencies under `fmt`, constants, strings, etc.) are kept as well.  
3. The final binary balloons in size.

## References

【1】  
How Datadog shrunk its Agent’s Go binary by 77%  
https://mp.weixin.qq.com/s/SW3-tI-OdtvladmWf-SLpg

