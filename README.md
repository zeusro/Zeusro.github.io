## 新建博文

```bash
  make new post=TSP date=2025-06-17
  # 或者简化版本
  make new post=critical-thinking
```

然后复制这一部分（本来想加到Makefile里面，结果搞不定最多只能创建一个文件，没办法初始化内容模版）

```markdown

---
layout:       post
title:        ""
subtitle:     ""
date:         
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    true
tags:
    - 
---

```


## 说明

<details>
<summary>展开查看</summary>
<pre>
<code>
    I don't fucking care what others say.
</code>
</pre>
</details>

## 本地预览

```bash
# 🔧 一、卸载系统残留的 Jekyll 和 Protobuf
sudo gem uninstall jekyll
sudo gem uninstall google-protobuf
sudo gem uninstall sass-embedded
# 🔧 二、使用 rbenv 安装隔离 Ruby 环境（推荐）
brew install rbenv
rbenv init
# ⬆️ 按提示将 eval "$(rbenv init -)" 添加到你的 ~/.zshrc 或 ~/.bashrc
source ~/.zshrc  # 或 ~/.bash_profile
# 📦 三、安装 Jekyll 和依赖（使用 Bundler）
sudo gem install -y bundler jekyll
# 还是有bug
bundle install




```

## 备注

- [raw](https://shopify.github.io/liquid/tags/raw/)

两个大括号用来引入 [jekyll](http://jekyllcn.com/) 的对象,其他语境需要使用,需要使用raw标记,这是liquid的语法.

```

{% raw %}
  In Handlebars, {{ this }} will be HTML-escaped, but
  {{{ that }}} will not.
{% endraw %}

```

## 鸣谢

感谢[Huxpro](https://github.com/Huxpro)开发的[huxpro.github.io](https://github.com/Huxpro/huxpro.github.io)模板