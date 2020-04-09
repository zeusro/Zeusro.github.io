now    := $(shell date)
today  ?=  $(shell date "+%Y-%m-%d")
post   ?= ""

define NEW_POST=
--- 
layout:       post 
title:        "" 
subtitle:     "" 
date:         $(today) 
author:       "Zeusro" 
header-img:   "imgoYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg" 
header-mask:  0.3 
catalog:      true 
multilingual: true 
tags: 
    -  
---  

endef



auto_commit:
	git add .
	# 需要注意的是，每行命令在一个单独的shell中执行。这些Shell之间没有继承关系。
	git commit -am "$(now)"
	git pull
	git push
	
docker:
	docker build -t zeusro/blog:1 .

new:
	cat >> _posts/$(today)-$(post).md<<"$(NEW_POST)"


up:
	docker-compose up --force-recreate --build

clean:
	git rm -r --cached .
	git add .
	git commit -am "auto clean"
	git push