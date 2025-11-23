---
layout:       post
title:          "再见了，p-program.github.io！"
subtitle:     "Hello,Github action"
date:         2025-10-21
author:       "Zeusro"
header-img:   "img/b/2025/green.jpg"
header-mask:  0.3
# 目录
catalog:      true
# 多语言
multilingual: false
published:    false
tags:
    - Devops
---

今年生成式AI大爆发之后，分享技术已经没有太大动力。
像这个 Github action 的配置，换做以前大概需要花费我2~3天时间。这次在OpenAI帮助下3个小时内就完成了。

## Hello,Github action

调整流程非常简单：
1. [p-program.github.io](https://github.com/p-program/p-program.github.io) pages-GitHub Pages的设定改为默认值，Custom domain填空
1. 解决源代码项目中的中的**Dependabot alerts**
1. 在源代码项目按照提示词新增 `.github/workflows/deploy.yml`
1. 手动触发 Build & Deploy 的action即可

调整之后虽然不用再导出静态HTML产物，而且DNS也不用修改（防止白嫖），但是目前来看每次都需要手动触发action，有点麻烦。

[https://www.bullshitprogram.com/](https://github.com/p-program/p-program.github.io) 是当时代金券太多没地方花而买的域名。

前期文章灵感取自王垠的个人经历。

看王垠的早期文章（回国做教培之前），总有一种耳目一新的感觉，他破除了我对传统编程概念的偏见。

“原来编程概念是可以这样子的？！原来所谓的OOP不过如此！”

后来这个网站主要是发表一些前沿的技术洞察，或者“皮学”。

## 解决一些历史遗留问题

```
Dependabot encountered an error performing the update

Error: The updater encountered one or more errors.

For more information see: https://github.com/p-program/readme/network/updates/1130827200 (write access to the repository is required to view the log)
```

Dependabot 中的安全检查主要针对项目中的供应链体系——有些依赖没有升级到安全的版本。按照提示修复，或者手动升级即可。

从事信息技术多年，我一直对这个行业持矛盾的意见。但总体上都是以反对态度为主。
科技的发展并没有真正地解放生产力，而是让人成为被量化计算的工具。

就像2020年，我提出[OOOS](https://www.bullshitprogram.com/one-open-operating-system/)，以[AI作为智慧型API入口](https://www.bullshitprogram.com/the-seed-of-robot/)时，本意是通过AI让人的创意能够快速落实。

但就今天看来，大部分企业将其作为一种裁员工具，真是让人生气。
