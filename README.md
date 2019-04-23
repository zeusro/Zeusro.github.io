
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

## 备注

- [raw](https://shopify.github.io/liquid/tags/raw/)

两个大括号用来引入`jekyll`的对象,其他语境需要使用,需要使用raw标记,这是liquid的语法.

```
{% raw %}
  In Handlebars, {{ this }} will be HTML-escaped, but
  {{{ that }}} will not.
{% endraw %}

```

## 鸣谢
感谢[Huxpro](https://github.com/Huxpro)开发的[huxpro.github.io](https://github.com/Huxpro/huxpro.github.io)模板