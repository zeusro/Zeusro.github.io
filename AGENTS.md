# AGENTS.md - Zeusro.github.io

本文档面向 AI 编码助手。阅读本文档前，默认你对本项目一无所知。请根据本文档的指引理解项目结构、开发流程与约定。

---

## 1. 项目概览

本项目是一个基于 **Jekyll 4.x** 构建的静态博客，部署在 **GitHub Pages** 上，自定义域名 `www.zeusro.com`。

博客主题 fork 自 [Huxpro/huxpro.github.io](https://github.com/Huxpro/huxpro.github.io)（`package.json` 中仍保留 `hux-blog` 名称），并针对多语言（中/英/日/俄）内容做了大量定制：

- 文章默认用中文撰写，可选择性地提供英文、日文、俄文翻译；站点默认展示语言为英文。
- 多语言内容通过 `_includes/posts/<post-name>/` 下的独立 Markdown 文件管理。
- 前端使用 JavaScript 切换语言，URL 通过 `?lang=` 参数保留语言状态。
- 注册了 Service Worker，提供离线缓存与缓存破坏策略。

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 静态站点生成器 | Jekyll 4.x（Ruby） |
| 模板语言 | Liquid |
| Markdown 解析 | kramdown（GFM 输入模式） |
| 代码高亮 | Rouge |
| 分页插件 | jekyll-paginate |
| SEO/Feed/Sitemap | jekyll-seo-tag、jekyll-feed、jekyll-sitemap |
| 前端样式 | Bootstrap 3 + 自定义 LESS |
| 前端构建 | Grunt（Less 编译、JS 压缩、banner 注入） |
| 前端脚本 | jQuery、Velocity、AnchorJS、FastClick |
| 多语言工具 | Python 3（处理翻译占位、检查缺失、批量更新） |
| 部署 | GitHub Pages（CNAME 指向 `www.zeusro.com`） |
| 容器化 | Dockerfile + docker-compose.yaml（可选本地预览） |

---

## 3. 目录结构

```
.
├── _config.yml              # Jekyll 主配置
├── Gemfile                  # Ruby 依赖
├── package.json             # Node 依赖与 npm 脚本
├── Gruntfile.js             # 前端构建任务
├── Makefile                 # 常用命令（新建文章、自动提交、Docker 启动）
├── Rakefile                 # Ruby 任务（遗留，新建文章）
├── Dockerfile / docker-compose.yaml   # 容器化预览
│
├── _layouts/                # 页面布局
│   ├── default.html         # 基础 HTML 骨架
│   ├── page.html            # 列表/普通页
│   ├── post.html            # 文章页（含多语言选择器）
│   └── keynote.html         # 嵌入 iframe 的演示页
│
├── _includes/               # 可复用 Liquid 片段
│   ├── head.html            # <head>，含 SEO、PWA、CSS 引用
│   ├── nav.html             # 导航栏
│   ├── footer.html          # 页脚、脚本引用、统计代码
│   ├── intro-header.html    # 页面/文章头部（背景图、标题、标签）
│   ├── featured-tags.html   # 标签云
│   ├── short-about.html     # 侧边栏个人简介
│   ├── friends.html         # 友链
│   ├── mathjax_support.html # MathJax 支持
│   ├── about/               # 关于页面的多语言片段
│   └── posts/               # 每篇文章的多语言 Markdown 片段
│
├── _posts/                  # 博客文章（Jekyll 源文件）
│   └── YYYY-MM-DD-slug.md   # 文件名决定发布日期与 URL
│
├── css/                     # 编译后的样式
├── less/                    # LESS 源码
├── js/                      # JavaScript 文件（含源码与压缩版）
├── img/                     # 图片资源
├── fonts/                   # 字体
├── pwa/                     # PWA manifest 与图标
├── portfolio/               # 作品集子站点
├── sw.js                    # Service Worker
├── feed.xml                 # RSS Feed
├── search.json              # 站内搜索数据源
├── CNAME                    # 自定义域名
│
└── 工具脚本
    ├── template.md          # 单语言文章模板
    ├── multilingual.md      # 多语言文章模板
    ├── process_multilingual.py    # 批量将已有文章转为多语言结构
    ├── update_multilingual.py     # 根据已有翻译更新文章 front matter
    ├── check_multilingual.py      # 检查哪些多语言文章缺失翻译
    ├── check_translations.py      # 检查 _includes/posts 下翻译完整性
    └── translate_posts.py         # 翻译占位脚本（目前仅输出占位符）
```

---

## 4. 构建与开发命令

### 4.1 本地预览

需要先安装 Ruby 依赖：

```bash
bundle install
```

然后启动 Jekyll 开发服务器：

```bash
bundle exec jekyll serve
# 或
npm start
```

默认监听 `http://localhost:4000`。

### 4.2 前端资源构建

编辑 `less/*.less` 或 `js/hux-blog.js` 后，运行 Grunt 重新编译压缩资源：

```bash
npm install          # 首次安装 grunt 插件
grunt                # 编译 css/hux-blog.css、css/hux-blog.min.css、js/hux-blog.min.js
grunt watch          # 监听文件变化自动编译
```

`Gruntfile.js` 中的默认任务会：

1. `uglify`：压缩 `js/hux-blog.js` 到 `js/hux-blog.min.js`。
2. `less`：编译 `less/hux-blog.less` 到 `css/hux-blog.css` 与 `css/hux-blog.min.css`。
3. `usebanner`：在生成的 CSS/JS 顶部插入版本 banner。

开发时也可以同时运行 Jekyll 与 Grunt watch：

```bash
npm run dev
```

### 4.3 Docker 预览

```bash
make up
# 或
# docker-compose up --build
```

构建并启动 `jekyll/jekyll:4.2.2` 容器，映射 `4000:4000` 与 LiveReload 端口 `35729:35729`。

---

## 5. 新建文章流程

### 5.1 单语言文章

```bash
make new post=win-on-arm
make new post='zero' date=2025-09-23
```

`Makefile` 会复制 `template.md` 到 `_posts/YYYY-MM-DD-<post>.md`，并把日期占位符替换为当天（或指定日期）。

### 5.2 多语言文章

```bash
make mul post=china-Millennials-CE
make mul post=iron date=2025-09-23
```

`Makefile` 会：

1. 复制 `multilingual.md` 到 `_posts/YYYY-MM-DD-<post>.md`。
2. 替换日期与 slug 占位符。
3. 创建 `_includes/posts/YYYY-MM-DD-<post>/` 目录。
4. 生成四个语言片段文件：`<post>_zh.md`、`<post>_en.md`、`<post>_jp.md`、`<post>_ru.md`。

文章 `front matter` 中的 `multilingual: true` 会启用语言选择器。文章主体只保留四个 `{% include %}` 块，分别引入对应语言片段。

### 5.3 将已有文章批量转为多语言结构

```bash
python3 process_multilingual.py
```

该脚本会：

- 跳过 `published: false` 的文章。
- 把 `_posts` 中尚未多语言化的文章，将其正文提取到 `_includes/posts/<post>/<post>_zh.md`。
- 为英/日/俄生成 `<!-- TODO: Translate to xx -->` 占位符。
- 改写原文章为 `multilingual: true` 并插入四段 `{% include %}`。

注意：`2025-08-22-zero.md` 在脚本中被硬编码跳过。

### 5.4 根据已有翻译更新 front matter

```bash
python3 update_multilingual.py
```

适用于：`_includes/posts/<post>/` 下已经存在中文 + 至少一个外语翻译，但 `_posts` 中的文章仍是单语言模式。脚本会把这些文章改写成多语言模式，但只 `include` 实际存在的语言。

---

## 6. 多语言约定

### 6.1 语言代码

| 语言 | 内部代码 | HTML `lang` | URL 参数 |
|------|----------|-------------|----------|
| 中文 | `zh`     | `zh`        | `?lang=zh` |
| 英文 | `en`     | `en`        | `?lang=en` |
| 日文 | `jp`     | `ja`        | `?lang=jp` |
| 俄文 | `ru`     | `ru`        | `?lang=ru` |

### 6.2 新增一种语言需要修改的位置

参考 `README.md` 中的说明：

1. `_layouts/post.html` 的 `<select>` 语言选择器新增 `<option>`。
2. `multilingual.md` 模板新增对应语言的 `<div class="xx post-container">` 块。
3. `Makefile` 的 `mul` 目标新增对应语言片段文件。
4. `_config.yml` 的 `languages` 字段；如需调整默认展示语言，同步修改 `default_lang` 字段。
5. `_layouts/default.html`、`_includes/head.html` 中的 `hreflang`/`canonical`（如新增语言）。
6. `_includes/footer.html` 与 `sw.js` 中硬编码的语言映射数组（搜索 `langMap`、`mapping`、`supportedLangs`）。

### 6.3 翻译检查

```bash
# 检查 _posts 中哪些多语言文章缺失翻译
python3 check_multilingual.py

# 检查 _includes/posts 下翻译完整性（是否缺失、是否 TODO/空文件）
python3 check_translations.py

# 可选：启用 langdetect 校验文件内容语言是否与文件名一致
pip install langdetect
python3 check_translations.py --check-language
```

---

## 7. 代码风格与约定

### 7.1 Liquid / HTML

- 优先使用现有 `_includes` 片段复用代码。
- 多语言块统一放在文章 `front matter` 之后，按 `zh -> en -> jp -> ru` 顺序。
- 文章 `front matter` 键顺序参考 `template.md` / `multilingual.md`：

```yaml
---
layout:       post
title:        ""
subtitle:     ""
date:         YYYY-MM-DD
author:       "Zeusro"
header-img:   "img/..."
header-mask:  0.3
catalog:      true
multilingual: true/false
published:    true
tags:
    - tag1
    - tag2
---
```

- 在 Liquid 模板中需要显示 `{{ }}` 或 `{% %}` 时，使用 `{% raw %}{% endraw %}` 包裹。

### 7.2 Markdown

- 使用 GitHub Flavored Markdown（`_config.yml` 中 `kramdown.input: GFM`）。
- 代码块使用围栏代码块，Rouge 会自动高亮。
- 行内代码块不使用行号； fenced 代码块默认显示行号（配置见 `_config.yml`）。

### 7.3 LESS / CSS / JS

- 样式源码在 `less/`，编辑后必须运行 `grunt` 生成 `css/` 与 `js/*.min.js`。
- 不要直接修改 `css/hux-blog.min.css` 或 `js/hux-blog.min.js`，这些文件由构建生成。
- `js/hux-blog.js` 是主脚本源码，`js/hux-blog.min.js` 是压缩产物。

### 7.4 Python 脚本

- 所有脚本使用 `#!/usr/bin/env python3` 与 `utf-8` 编码声明。
- 使用 `pathlib.Path` 处理路径。
- 占位符约定：`<!-- TODO: Translate to xx -->` 表示该语言尚未翻译。

---

## 8. 测试与验证

本项目没有单元测试框架，验证依赖以下方式：

1. **Jekyll 构建**：

   ```bash
   bundle exec jekyll build
   ```

   确保无 Liquid/Markdown 语法错误。

2. **翻译检查脚本**：

   ```bash
   python3 check_multilingual.py
   python3 check_translations.py
   ```

3. **本地预览**：

   ```bash
   bundle exec jekyll serve
   # 或
   make up
   ```

4. **Service Worker**：修改非中文内容后，注意浏览器缓存可能导致全球化内容失效（README 中记录的已知 bug）。

---

## 9. 部署

- 生产环境使用 **GitHub Pages**，源分支通常为 `master`。
- `CNAME` 文件内容为 `www.zeusro.com`。
- `_config.yml` 中的 `url` 为 `https://www.zeusro.com`，`baseurl` 为空。
- 自动提交快捷命令（谨慎使用，会直接 push）：

  ```bash
  make auto_commit
  ```

  该目标会 `git add .`、`git commit -am "<build time>"`、`git pull`、`git push`。

- 历史遗留的 `Rakefile` 提供 `rake post title="..."`，但项目实际使用 `make new` / `make mul`。

---

## 10. 安全注意事项

- **不要**将含敏感信息的文件提交到仓库（`.env`、SSH 私钥等）。`.gitignore` 已排除常见构建产物与编辑器文件。
- 第三方脚本通过 CDN 加载（font-awesome、Google Analytics、gtag、Baidu Tongji 等），在国内或隐私敏感环境需留意。
- `sw.js` 会拦截同域请求并缓存；发布前确认缓存白名单与 `PRECACHE_LIST` 不会缓存过期或敏感资源。
- 自定义 `Dockerfile` 中 `GIT_URL` 指向公开仓库，无敏感凭证。
- 评论系统目前使用 GitHub Discussions 链接（无 Disqus/网易云跟帖密钥泄露风险）。

---

## 11. 常见问题与提示

- **Jekyll 构建失败**：检查 `Gemfile.lock` 是否存在；不存在时运行 `bundle install`。当前环境若 Ruby/Bundler 版本不兼容，可能需要使用 Docker。
- **新增语言后页面不生效**：检查 `_layouts/post.html` 选择器、`_includes/footer.html` 的 `mapping` 数组、`sw.js` 的缓存策略是否都同步更新。
- **Service Worker 导致旧内容**：发布重大更新后，考虑修改 `CACHE_NAMESPACE` 或通知用户清除缓存。
- **日期占位符**：`multilingual.md` 与 `template.md` 使用 `0000-00-00` 作为占位符，`make` 与 Python 脚本会负责替换。
- **翻译占位符**：空文件或仅含 `<!-- TODO: Translate to xx -->` 的文件会被检查脚本判定为“缺失翻译”。

---

## 12. 相关文件速查

| 目的 | 文件 |
|------|------|
| 站点配置 | `_config.yml` |
| Ruby 依赖 | `Gemfile` |
| Node 依赖/脚本 | `package.json` |
| 前端构建 | `Gruntfile.js` |
| 常用命令 | `Makefile` |
| 文章模板（单语言） | `template.md` |
| 文章模板（多语言） | `multilingual.md` |
| 多语言片段根目录 | `_includes/posts/` |
| Service Worker | `sw.js` |
| PWA 配置 | `pwa/manifest.json` |
| 自定义域名 | `CNAME` |
| 翻译检查 | `check_multilingual.py`、`check_translations.py` |
| 批量多语言化 | `process_multilingual.py`、`update_multilingual.py` |
