<!-- TODO: Translate to jp -->

## 项目架构

```
.
|____cmd---------------------------entry
| |____ktctl
| | |____main.go
| |____shadow
| | |____main.go
| |____server
| | |____main.go
|____go.mod
|____docker------------------------dockerfile
|____test
| |____integration
| | |____command_check_test.go
|____bin-------------------------some build bash
| |____archive
| |____build-shadow
|____LICENSE
|____go.sum
|____docs-------------------------doc
|____.dockerignore
|____public
| |____favicon.ico
| |____index.html
| |____manifest.json
|____.gitignore
|____package.json
|____README.md
|____.travis.yml
|____pkg-------------------------go code
|____src-------------------------dashboard front-end
```