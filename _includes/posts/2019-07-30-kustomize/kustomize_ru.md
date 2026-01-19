<!-- TODO: Translate to ru -->

## 不用helm的原因

[这篇文章](https://medium.com/virtuslab/think-twice-before-using-helm-25fbb18bc822) 介绍得比较详细

helm2 像个巨婴。我个人无法喜欢。

我比较喜欢kustomize这种无侵入，轻量级的生成模式。

(后记:用了Helm3 一段时候后,发现helm3 基本能满足需求,而且helm 3 取消了服务端)

## 基本概念

base：含有一个kustomization.yaml文件的目录，可以被其他的kustomization.yaml来引用
resource：文件路径，指向一个声明了kubernetes API对象的YAML文件

patch: 文件路径，指向一个声明了kubernetes API patch的YAML文件

variant: 含有同一组bases的不同kustomization


[术语](https://github.com/kubernetes-sigs/kustomize/blob/master/docs/glossary.md)

## 准备工作

1. 升级kubectl到1.14版本
1. [下载](https://github.com/kubernetes-sigs/kustomize/releases)安装kustomize，并添加到$path

## 基本目录结构

```
├── base
│   ├── deployment.yaml
│   ├── kustomization.yaml
│   └── service.yaml
└── overlays
    ├── dev
    │   ├── kustomization.yaml
    │   └── patch.yaml
    ├── prod
    │   ├── kustomization.yaml
    │   └── patch.yaml
    └── staging
        ├── kustomization.yaml
        └── patch.yaml
```

## 实际运用

[我写的例子](https://github.com/zeusro/kustomize-example)


## 参考链接：

1. https://zhuanlan.zhihu.com/p/38424955
1. https://aisensiy.github.io/2018/11/27/helm-and-kustomize/
2. https://yq.aliyun.com/articles/699126?spm=a2c4e.11163080.searchblog.38.273b2ec1q8XHEg
3. https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/