`tektoncd` is a `pipeline`-type CI/CD (kubectl apply) system for `kubernetes`, using custom `kaniko` to build `docker` images.

The deployment method is to create some RBAC-related resources (ClusterRole, ClusterRoleBinding) and CustomResourceDefinition.

The only persistent containers are tekton-pipelines-controller and tekton-pipelines-webhook.

First, I declare that I have not actually installed or used `tektoncd`. The following content is pure nonsense.
![image](/img/in-post/tektoncd/9150e4e5ly1fve14owghxj206o06omx8.jpg)


## Five Types of Citizens in tektoncd

1. Task
1. TaskRun
1. PipelineResource
    1. type: git
    1. type: image
1. Pipeline
1. PipelineRun

tektoncd currently (0.1.0) has 5 types of objects. The core concept is to define the build process through yaml definitions. Build task status is stored in the status field.

Task is the build process of a single task. TaskRun needs to be defined for the task to run.

Pipeline contains multiple Tasks, and defines input and output on this basis. Input and output are delivered as PipelineResource. The essence of PipelineResource is PVC.

Similarly, PipelineRun needs to be defined for Pipeline to run.

This example from the official Github can help everyone understand the relationships between these types of objects.

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

## Summary

Redefining CI/CD through CRD is a major highlight, but currently build tasks can only be created by manually creating YAML files. When there are many build tasks, the cluster will accumulate a large number of CI-related CRDs, which feels quite stupid.

![image](/img/in-post/tektoncd/1543218293905992.jpg)

`serviceaccount`+`secret` configuration SSH/auth to connect to git repositories. It's recommended that `Jenkins-X` learn from this. Currently `Jenkins-X` still cannot define `resource` in pipelines. Snowflake configuration is quite harmful.
