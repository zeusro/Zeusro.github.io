
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
npm install grunt -g
# 编译less
grunt less  
# 安装Ruby
sudo gem install bundler jekyll
npm run watch
```

## 新建博文

  make new post=test
  make new post=test today=2018-03-28

然后复制这一部分（本来想加到Makefile里面，结果搞不定）

```markdown

---
layout:       post
title:        ""
subtitle:     ""
date:         
author:       "Zeusro"
header-img:   "imgoYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg" 
header-mask:  0.3
catalog:      true
multilingual: true
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