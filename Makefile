now    := $(shell date)
date  ?=  $(shell date "+%Y-%m-%d")
post   ?= ""

define NEW_POST=
---
layout:       post 
title:        "" 
subtitle:     "" 
date:         $(date) 
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

clean:
	git rm -r --cached .
	git add .
	git commit -am "auto clean"
	git push

new:
	cat >> _posts/$(date)-$(post).md<<"$(NEW_POST)"


up:
	git pull origin new
	# docker-compose up --force-recreate --build
	docker-compose up --build
