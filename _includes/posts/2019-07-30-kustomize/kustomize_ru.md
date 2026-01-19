## Причины не использовать helm

[Эта статья](https://medium.com/virtuslab/think-twice-before-using-helm-25fbb18bc822) объясняет это подробно.

helm2 похож на гигантского младенца. Лично я не могу его полюбить.

Я предпочитаю неинвазивный, легковесный режим генерации kustomize.

(Постскриптум: После использования Helm3 некоторое время я обнаружил, что helm3 в основном удовлетворяет требованиям, и helm 3 удалил серверную сторону)

## Основные концепции

base: Каталог, содержащий файл kustomization.yaml, который может быть ссылкой из других файлов kustomization.yaml.
resource: Путь к файлу, указывающий на YAML-файл, который объявляет объект API kubernetes.

patch: Путь к файлу, указывающий на YAML-файл, который объявляет патч API kubernetes.

variant: Различные kustomizations, содержащие один и тот же набор баз.


[Терминология](https://github.com/kubernetes-sigs/kustomize/blob/master/docs/glossary.md)

## Подготовка

1. Обновить kubectl до версии 1.14
1. [Скачать](https://github.com/kubernetes-sigs/kustomize/releases) и установить kustomize, и добавить в $path

## Базовая структура каталога

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

## Практическое применение

[Пример, который я написал](https://github.com/zeusro/kustomize-example)


## Ссылки:

1. https://zhuanlan.zhihu.com/p/38424955
1. https://aisensiy.github.io/2018/11/27/helm-and-kustomize/
2. https://yq.aliyun.com/articles/699126?spm=a2c4e.11163080.searchblog.38.273b2ec1q8XHEg
3. https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/
