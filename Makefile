docker:
	docker build -t zeusro/blog:1 .

up:
	docker-compose up --force-recreate --build