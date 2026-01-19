## Reasons for Not Using helm

[This article](https://medium.com/virtuslab/think-twice-before-using-helm-25fbb18bc822) explains it in detail.

helm2 is like a giant baby. I personally can't like it.

I prefer kustomize's non-invasive, lightweight generation mode.

(Postscript: After using Helm3 for a while, I found that helm3 basically meets the requirements, and helm 3 removed the server side)

## Basic Concepts

base: A directory containing a kustomization.yaml file that can be referenced by other kustomization.yaml files.
resource: File path, pointing to a YAML file that declares a kubernetes API object.

patch: File path, pointing to a YAML file that declares a kubernetes API patch.

variant: Different kustomizations containing the same set of bases.


[Terminology](https://github.com/kubernetes-sigs/kustomize/blob/master/docs/glossary.md)

## Preparation

1. Upgrade kubectl to version 1.14
1. [Download](https://github.com/kubernetes-sigs/kustomize/releases) and install kustomize, and add it to $path

## Basic Directory Structure

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

## Practical Application

[Example I wrote](https://github.com/zeusro/kustomize-example)


## Reference Links:

1. https://zhuanlan.zhihu.com/p/38424955
1. https://aisensiy.github.io/2018/11/27/helm-and-kustomize/
2. https://yq.aliyun.com/articles/699126?spm=a2c4e.11163080.searchblog.38.273b2ec1q8XHEg
3. https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/
