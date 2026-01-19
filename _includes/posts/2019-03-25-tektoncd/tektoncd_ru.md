`tektoncd` — это система CI/CD типа `pipeline` (kubectl apply) для `kubernetes`, использующая пользовательский `kaniko` для сборки образов `docker`.

Способ развертывания — создание некоторых ресурсов, связанных с RBAC (ClusterRole, ClusterRoleBinding), а также CustomResourceDefinition.

Единственные постоянные контейнеры — tekton-pipelines-controller и tekton-pipelines-webhook.

Сначала заявляю, что я фактически не устанавливал и не использовал `tektoncd`. Следующий контент — чистая ерунда.
![image](/img/in-post/tektoncd/9150e4e5ly1fve14owghxj206o06omx8.jpg)


## Пять типов граждан в tektoncd

1. Task
1. TaskRun
1. PipelineResource
    1. type: git
    1. type: image
1. Pipeline
1. PipelineRun

tektoncd в настоящее время (0.1.0) имеет 5 типов объектов. Основная концепция — определить процесс сборки через определения yaml. Статус задачи сборки хранится в поле status.

Task — это процесс сборки одной задачи. TaskRun нужно определить, чтобы задача запустилась.

Pipeline содержит несколько Tasks и определяет input и output на этой основе. Input и output доставляются как PipelineResource. Суть PipelineResource — это PVC.

Аналогично, PipelineRun нужно определить, чтобы Pipeline запустился.

Этот пример из официального Github может помочь всем понять отношения между этими типами объектов.

```yaml
---
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  name: skaffold-image-leeroy-app
spec:
  type: image
  params:
  - name: url
    value: gcr.io/christiewilson-catfactory/leeroy-app
---
# This demo modifies the cluster (deploys to it) you must use a service
# account with permission to admin the cluster (or make your default user an admin
# of the `default` namespace with default-cluster-admin.

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: default-cluster-admin
subjects:
  - kind: ServiceAccount
    name: default
    namespace: default
roleRef:
  kind: ClusterRole
  name: cluster-admin
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  name: skaffold-image-leeroy-web
spec:
  type: image
  params:
  - name: url
    value: gcr.io/christiewilson-catfactory/leeroy-web
---
apiVersion: tekton.dev/v1alpha1
kind: PipelineResource
metadata:
  name: skaffold-git
spec:
  type: git
  params:
  - name: revision
    value: master
  - name: url
    value: https://github.com/GoogleContainerTools/skaffold
---
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: unit-tests
spec:
  inputs:
    resources:
    - name: workspace
      type: git
      targetPath: go/src/github.com/GoogleContainerTools/skaffold
  steps:
  - name: run-tests
    image: golang
    env:
    - name: GOPATH
      value: /workspace/go
    workingDir: /workspace/go/src/github.com/GoogleContainerTools/skaffold
    command:
    - make
    args:
    - test
---
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: build-push
spec:
  inputs:
    resources:
    - name: workspace
      type: git
    params:
    - name: pathToDockerFile
      description: The path to the dockerfile to build
      default: /workspace/workspace/Dockerfile
    - name: pathToContext
      description: The build context used by Kaniko (https://github.com/GoogleContainerTools/kaniko#kaniko-build-contexts)
      default: /workspace/workspace
  outputs:
    resources:
    - name: builtImage
      type: image
  steps:
  - name: build-and-push
    image: gcr.io/kaniko-project/executor
    command:
    - /kaniko/executor
    args:
    - --dockerfile=${inputs.params.pathToDockerFile}
    - --destination=${outputs.resources.builtImage.url}
    - --context=${inputs.params.pathToContext}
---
#This task deploys with kubectl apply -f <filename>
apiVersion: tekton.dev/v1alpha1
kind: Task
metadata:
  name: demo-deploy-kubectl
spec:
  inputs:
    resources:
    - name: workspace
      type: git
    - name: image
      type: image
    params:
    - name: path
      description: Path to the manifest to apply
    - name: yqArg
      description: Okay this is a hack, but I didn't feel right hard-codeing `-d1` down below
    - name: yamlPathToImage
      description: The path to the image to replace in the yaml manifest (arg to yq)
    clusters:
    - name: targetCluster
      description: Not yet used, kubectl command below should use this cluster
  steps:
  - name: replace-image
    image: mikefarah/yq
    command: ['yq']
    args:
    - "w"
    - "-i"
    - "${inputs.params.yqArg}"
    - "${inputs.params.path}"
    - "${inputs.params.yamlPathToImage}"
    - "${inputs.resources.image.url}"
  - name: run-kubectl
    image: lachlanevenson/k8s-kubectl
    command: ['kubectl']
    args:
    - 'apply'
    - '-f'
    - '${inputs.params.path}'
---
# This Pipeline Builds two microservice images(https://github.com/GoogleContainerTools/skaffold/tree/master/examples/microservices)
# from the Skaffold repo (https://github.com/GoogleContainerTools/skaffold) and deploys them to the repo currently running Tekton Pipelines.

# **Note** : It does this using the k8s `Deployment` in the skaffold repos's existing yaml
# files, so at the moment there is no guarantee that the image that are built and
# pushed are the ones that are deployed (that would require using the digest of
# the built image, see https://github.com/tektoncd/pipeline/issues/216).

apiVersion: tekton.dev/v1alpha1
kind: Pipeline
metadata:
  name: demo-pipeline
spec:
  resources:
  - name: source-repo
    type: git
  - name: web-image
    type: image
  - name: app-image
    type: image
  tasks:
  - name: skaffold-unit-tests
    taskRef:
      name: unit-tests
    resources:
      inputs:
      - name: workspace
        resource: source-repo
  - name: build-skaffold-web
    runAfter: [skaffold-unit-tests]
    taskRef:
      name: build-push
    params:
    - name: pathToDockerFile
      value: Dockerfile
    - name: pathToContext
      value: /workspace/workspace/examples/microservices/leeroy-web
    resources:
      inputs:
      - name: workspace
        resource: source-repo
      outputs:
      - name: builtImage
        resource: web-image
  - name: build-skaffold-app
    runAfter: [skaffold-unit-tests]
    taskRef:
      name: build-push
    params:
    - name: pathToDockerFile
      value: Dockerfile
    - name: pathToContext
      value: /workspace/workspace/examples/microservices/leeroy-app
    resources:
      inputs:
      - name: workspace
        resource: source-repo
      outputs:
      - name: builtImage
        resource: app-image
  - name: deploy-app
    taskRef:
      name: demo-deploy-kubectl
    resources:
      inputs:
      - name: workspace
        resource: source-repo
      - name: image
        resource: app-image
        from:
        - build-skaffold-app
    params:
    - name: path
      value: /workspace/workspace/examples/microservices/leeroy-app/kubernetes/deployment.yaml
    - name: yqArg
      value: "-d1"
    - name: yamlPathToImage
      value: "spec.template.spec.containers[0].image"
  - name: deploy-web
    taskRef:
      name: demo-deploy-kubectl
    resources:
      inputs:
      - name: workspace
        resource: source-repo
      - name: image
        resource: web-image
        from:
        - build-skaffold-web
    params:
    - name: path
      value: /workspace/workspace/examples/microservices/leeroy-web/kubernetes/deployment.yaml
    - name: yqArg
      value: "-d1"
    - name: yamlPathToImage
      value: "spec.template.spec.containers[0].image"
---
apiVersion: tekton.dev/v1alpha1
kind: PipelineRun
metadata:
  name: demo-pipeline-run-1
spec:
  pipelineRef:
    name: demo-pipeline
  trigger:
    type: manual
  serviceAccount: 'default'
  resources:
  - name: source-repo
    resourceRef:
      name: skaffold-git
  - name: web-image
    resourceRef:
      name: skaffold-image-leeroy-web
  - name: app-image
    resourceRef:
      name: skaffold-image-leeroy-app
```

## Резюме

Переопределение CI/CD через CRD — это большой плюс, но в настоящее время задачи сборки можно создавать только путем ручного создания YAML-файлов. Когда задач сборки много, в кластере накапливается большое количество CRD, связанных с CI, что кажется довольно глупым.

![image](/img/in-post/tektoncd/1543218293905992.jpg)

Конфигурация `serviceaccount`+`secret` SSH/auth для подключения к git-репозиториям. Рекомендуется, чтобы `Jenkins-X` поучился этому. В настоящее время `Jenkins-X` все еще не может определять `resource` в pipeline. Конфигурация снежинки довольно вредна.
