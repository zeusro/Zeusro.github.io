# https://www.zeusro.com

<details>
<summary>展开查看</summary>
<pre>
<code>
    I don't fucking care what others say.
</code>
</pre>
</details>

## 新建博文

```bash
  # 或者简化版本
  make new post=bullshit-go
  make new post='zero' date=2025-08-22

```

然后复制这一部分（本来想加到Makefile里面，结果搞不定最多只能创建一个文件，没办法初始化内容模版）

```markdown

---
layout:       post
title:        ""
subtitle:     ""
date:         
author:       "Zeusro"
header-img:   "img/ku.webp"
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