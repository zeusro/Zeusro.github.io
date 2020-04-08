now := $(shell date)
dd =666
auto_commit:
	git add .
	# 需要注意的是，每行命令在一个单独的shell中执行。这些Shell之间没有继承关系。
	git commit -am "$(now)"
	git pull
	git push
	
docker:
	docker build -t zeusro/blog:1 .

new:
	echo "$(dd)"

up:
	docker-compose up --force-recreate --build
