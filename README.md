# https://www.zeusro.com

<details>
<summary>展开查看</summary>
<pre>
<code>
    Code 13 everyday.
</code>
</pre>
</details>

## 新建博文

```bash
  # 简化版本
  make new post=win-on-arm
  make new post='zero' date=2025-09-23
  # 多国语言版本
  make mul post=iron
  make mul post='iron' date=2025-09-23
```

## 备注

- [raw](https://shopify.github.io/liquid/tags/raw/)

两个大括号用来引入 [jekyll](http://jekyllcn.com/) 的对象,其他语境需要使用,需要使用raw标记,这是liquid的语法.

```liquid
{% raw %}
  In Handlebars, {{ this }} will be HTML-escaped, but
  {{{ that }}} will not.
{% endraw %}

```

## 新增一种语言

在 _layouts/post.html 里面新增 option 标签

```html
<option value="3"> Русский Russian </option>
```

multilingual.md 中新增div标签

```html
<!-- Russian Version -->
<div class="ru post-container">
    {% capture about_ru %}{% include posts/0000-00-00-it-is-my-post/it-is-my-post_ru.md %}{% endcapture %}
    {{ about_ru | markdownify }}
</div>
```

Makefile 中修改 mul 目标：

```bash
	touch _includes/posts/$(date)-$(post)/$(post)_ru.md
```

## 鸣谢

感谢[Huxpro](https://github.com/Huxpro)开发的[huxpro.github.io](https://github.com/Huxpro/huxpro.github.io)模板