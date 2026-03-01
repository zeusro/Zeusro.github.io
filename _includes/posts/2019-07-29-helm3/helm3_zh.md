## 缘由

阿里云搞了个 [云原生应用大赛](https://developer.aliyun.com/special/apphubchallenge) ，要求用 helm v3 提交代码，我就顺便提交几个 helm chart ，同时学学的 helm 的语法

## 语法

目前(2019-07-26) v3还没正式 release，文档很少，学习的时候只能拿旧的文档对照踩坑。

v2 跟 v3 的差别不小:

1. 取消了服务端;
2. helm list 改用secret;
3. 很多命令已经不兼容，发生变化


学习 helm 的蛋疼之处在于要弄明白他们的模板语法，模板语法包含一些内置函数，还有 `go template` 相关的一类东西。

[Variables](https://v3.helm.sh/docs/topics/chart_template_guide/variables/)
[Chart Development Tips and Tricks](https://helm.sh/docs/charts_tips_and_tricks/#using-the-include-function)

## 提交的几个 chart

[jekyll](https://github.com/cloudnativeapp/charts/pull/34)

[hexo](https://github.com/cloudnativeapp/charts/pull/33)

[codis](https://github.com/cloudnativeapp/charts/pull/39)

codis 花了比较多心血，大家给个辛苦费帮我在pr页面点赞吧~


## 与[kustomize](https://kustomize.io/) 的不同

kustomize 一开始就是做成轻量级的 yaml 生成器，所以不存在服务端;

kustomize 的变量替换比较麻烦，需要用 json patch.

kustomize 没有控制流程，要高度定制比较麻烦。

`Helm 3` 把已安装的 chart 信息存作 `type:helm.sh/release` 的 secret ，于是乎， `Helm 3` 支持在多个 namespace 安装相同名称的 release