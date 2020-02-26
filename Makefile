docker:
	docker build -t zeusro/blog:1 .

up:
	docker-compose up --force-recreate --build

auto_commit:
	git add .
	# 需要注意的是，每行命令在一个单独的shell中执行。这些Shell之间没有继承关系。
	export now = '$(shell date)' ;\
	git commit -am "[$$now]"
	git push