# 改动

## 在文章末尾增加 GitHub Discussion 板块 

2026-02-09

- **改动文件**：`_layouts/post.html`
- **位置**：在文章正文和「上一篇/下一篇」分页之后、评论区域（Disqus/网易云跟帖）之前插入一块 Discussion 区域，所有使用 `layout: post` 的文章末尾都会显示。
- **设计细节**：
  - 区块样式：浅灰背景 `#fafafa`、1px 浅灰边框、4px 圆角，上下留白 2em、内边距 1.5em，与正文区分开。
  - 标题：`💬 讨论 / Discussion`（中英双语）。
  - 说明文案：中英各一句（「对这篇文章有想法？欢迎在 GitHub 上发起讨论。」/ "Have thoughts on this post? Start a discussion on GitHub."）。
  - 按钮：`在 GitHub 参与讨论 / Discuss on GitHub`，使用主题已有的 `btn btn-default`；链接为 `https://github.com/zeusro/Zeusro.github.io/discussions/new/choose`，`target="_blank"`、`rel="noopener noreferrer"` 在新标签页打开。
