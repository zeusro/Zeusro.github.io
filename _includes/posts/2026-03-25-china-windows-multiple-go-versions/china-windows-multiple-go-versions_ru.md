
Помните «правило ноль», о котором я уже говорил? **Не делайте рефакторинг с нулевой предельной отдачей.** У меня уже дважды была ситуация, когда из‑за изменений в реализации нижележащей версии Go нельзя было обновить версию Go в проекте.

Из‑за ограничений рабочей среды (CI не поддерживает нужное) нельзя постоянно пользоваться самым свежим golang в том же окружении, где ведётся работа.

Если редактор — VS Code, возникает такая связка:  
dlv обычно собирают на новейшем golang, а dlv опирается на `go mod tidy`.  
После `go mod tidy` политика обрезки графа зависимостей при переходе на более высокую версию Go пересчитывает дерево и в итоге переписывает `go.mod`.

Чтобы на Windows держать несколько версий Go и не ломать локальный кэш для `go mod` и `go install`, в экосистеме Go есть схема с `go install golang.org/dl/go<version>@latest`: разные версии ставятся в разные каталоги, переключение — через переменные окружения.

SDK разных версий изолированы и не мешают друг другу.  
Кэши `go mod` и `go install` (по умолчанию `%USERPROFILE%\go\pkg\mod` и `%USERPROFILE%\go\bin`) общие для пользователя — так задумано: кэш модулей и установленные бинарники обычно не привязаны к одной версии компилятора или обратно совместимы. Разные версии Go при сборке одного и того же модуля могут переиспользовать кэш и экономить место и время.

На практике всё равно всплывают узкие места.

## Где застреваешь

После настройки `GOPROXY` я поставил максимально новый golang для текущей связки (go 1.26.1) и добавил его в `PATH`.

Затем ставлю конкретную цепочку инструментов Go:

```bash
# В PowerShell или CMD: go install качает нужную версию — это отдельный лаунчер для версии.
go install golang.org/dl/go1.23.12@latest
# В `%USERPROFILE%\go\bin` появится go1.23.12.exe.
go1.23.12 download
# В Китае этот шаг часто падает из‑за сети.
```

Я скачал `go1.23.12.windows-amd64.zip`, положил в `%USERPROFILE%\sdk\go1.23.12`, распаковал каталог `go` в `%USERPROFILE%\sdk\go1.23.12` — сообщение о неудачной загрузке всё равно оставалось.

Тогда я прочитал исходники этой команды. `go1.23.12` соответствует `dl\go1.23.12\main.go` в https://github.com/golang/dl; ключевое — проверки файлов в `dl\internal\version\version.go`.

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

После появления `go1.23.12.windows-amd64.zip` считается SHA256, сверяется с удалённым значением, архив распаковывается и создаётся маркер `.unpacked-success`.  
Обойти это локально можно либо правкой `dl\internal\version\version.go` и пересборкой, либо созданием файла `.unpacked-success` в `%USERPROFILE%\sdk\go1.23.12` — я выбрал второе.

```bash
go1.23.12 version
go version go1.23.12 windows/amd64
```

Когда команды прошли, я попробовал собрать проект: даже после настройки переменных окружения сборка не удалась.

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

Вернулся к исходной идее: переключать версии Go порядком записей в `PATH` 🤣.  
В Windows 11 для 1.26 поднимите каталог с `go` от 1.26 выше, чем от 1.23. В новом окне терминала будет 1.26; обратный порядок — 1.23.

## One more thing

При сборке можно анализировать размер бинарника через [go-size-analyzer](https://github.com/Zxilly/go-size-analyzer).

1. Отключить CGO  
2. Убрать отладочную информацию  
3. Убрать сведения о путях  

— так уменьшается размер исполняемого файла.

```bash
CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o myapp main.go
```

На уровне кода, чтобы уменьшить итоговый бинарник:

1. Меньше динамической рефлексии  
2. Сборочные теги, чтобы не тянуть лишние импорты  
3. Осторожнее с пустым импортом `_`  

- Сборочные теги для отсечения ненужных ссылок  

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
    // Допустим, пакет огромный и тянет много зависимостей
    // "github.com/aws/aws-sdk-go/service/dynamodb"
)

func connectDB() {
    fmt.Println("Connecting to heavy Cloud Database...")
    // Инициализация облачной БД
}
```

### main.go

```go
package main

func main() {
    connectDB()
}
```

Обычный `go build` подключает `db_basic.go` и исключает `db_cloud.go` — бинарник маленький.

Нужна «тяжёлая» конфигурация — `go build -tags cloud_db`: включается `db_cloud.go`, исключается `db_basic.go`, и только тогда подтягиваются зависимости облачной БД.

По сути приём выборочной компиляции.

- Пустой импорт использовать осмотрительно  

```go
// main_plugin.go
package main

import (
	"fmt"
	_ "plugin" // Импортирован пакет plugin, даже через пустой идентификатор
)

type HeavyService struct{}

// Неэкспортируемый метод 1 (не используется)
func (s *HeavyService) unusedMethod1() {
	fmt.Println("This is a very complex method doing a lot of things...")
}

// Неэкспортируемый метод 2 (не используется)
func (s *HeavyService) unusedMethod2() {
	fmt.Println("Another unused complex method...")
}

func main() {
	fmt.Println("Hello, World!")
}
```

Поведение линкера:  
при `go build main_plugin.go` из‑за `plugin` бинарник помечается как поддерживающий динамическую загрузку.

Линкер рассуждает так: «Раз возможна подгрузка плагинов, неизвестно, не вызовет ли плагин `HeavyService.unusedMethod1` через рефлексию. Ради безопасности методы не выкидываю».

Итог:

1. `unusedMethod1`, `unusedMethod2` и прочие неэкспортируемые методы остаются.  
2. Остаются связанные с ними пакеты (включая глубже `fmt`), константы, строки.  
3. Размер бинарника сильно растёт.

## Ссылки

【1】  
Как Datadog уменьшил Go-бинарник своего Agent на 77% (обзорная статья, китайский язык)  
https://mp.weixin.qq.com/s/SW3-tI-OdtvladmWf-SLpg

