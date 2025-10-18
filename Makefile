BUILD_TIME 			  := $(shell LC_TIME=zh_CN.UTF-8 date +"%Y-%m-%d %H:%M:%S %A")
#BUILD_TIME            := $(shell date +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || powershell -Command "Get-Date -Format o")
post   ?= ""
ifeq ($(OS),Windows_NT)
    # Windows 系统
    date ?= $(shell powershell -command "Get-Date -Format 'yyyy-MM-dd'")
else
    # macOS/Linux 系统
    date ?= $(shell date "+%Y-%m-%d")
endif

auto_commit:
	git add .
	# 需要注意的是，每行命令在一个单独的shell中执行。这些Shell之间没有继承关系。
	git commit -am "$(BUILD_TIME)"
	git pull
	git push

clean:
	git rm -r --cached .
	git add .
	git commit -am "auto clean"
	git push

new:
# 	cat >> _posts/$(date)-$(post).md
	cp template.md _posts/$(date)-$(post).md


up:
	git pull origin new
	# docker-compose up --force-recreate --build
	docker-compose up --build
