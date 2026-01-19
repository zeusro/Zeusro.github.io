## Preface

Previously introduced
[Concourse-CI from Getting Started to Giving Up](https://www.zeusro.com/2018/09/02/give-up-concourse-ci/)
Today let's talk about the epoch-making version of `Jenkins`--**JenkinsX**!

`JenkinsX` is a sub-project of Jenkins, specifically designed to run on K8S.

The article is divided into 2 parts. Part 1 introduces installation, Part 2 explains application practices.


## Prerequisites

### helm

Including client and server. Also need to understand the [syntax](https://helm.sh/docs/chart_template_guide/#getting-started-with-a-chart-template).

Run `helm version` to ensure both client and server are fine.

### Local

#### jx

Similar to `Concourse-CI`, you also need to install the local CLI at the beginning.


```bash
brew tap jenkins-x/jx
brew install jx 
```

```
➜  ~ jx version
NAME               VERSION
jx                 1.3.974
jenkins x platform 0.0.3535
Kubernetes cluster v1.11.5
kubectl            v1.13.4
helm client        v2.10.0+g9ad53aa
helm server        v2.10.0+g9ad53aa
git                git version 2.14.3 (Apple Git-98)
Operating System   Mac OS X 10.13.6 build 17G65
```

Best practice is to create your own `myvalue.yaml`, modify the images inside, do it all at once, so you don't need to modify later.

https://jenkins-x.io/getting-started/config/


### Server

Using domestic Alibaba Cloud ECS as server.

Already created ingress service and pod.

### Verify Installation

`jx compliance run` will start a new ns and a series of resources to check the entire cluster. But since the images are all from
gcr.io, my startup failed. If you're confident, just skip this step.

```
jx compliance run
jx compliance status
jx compliance results
jx compliance delete

```

## Installation Steps

### jx install

`jx install` is a further wrapper around helm. Parameters are divided into several parts.

`default-admin-password` is the default password for `Jenkins`, `grafana`, `nexus`, `chartmuseum`. It's recommended to set it complex, otherwise you'll have to modify it later.

`--namespace` is the target ns for installation. Default is `kube-system`;

`--ingress` specifies the current ingress instance. If not specified, it will error, prompting that jx-ingress cannot be found.

`--domain` is the final external domain name for Jenkins-X.


```
jx \
install \
--cloud-environment-repo https://github.com/haoshuwei/cloud-environments.git \
--default-admin-password abcde \
--provider=kubernetes \
--namespace $(namespace) \
--ingress-service=nginx-ingress-lb \
--ingress-deployment=nginx-ingress-controller \
--ingress-namespace=kube-system 
--domain=$(domain)
```

There are several important options inside. I selected in order:

> Static Master Jenkins

> Kubernetes Workloads: Automated CI+CD with GitOps Promotion

After that, the command line will enter this waiting state:

waiting for install to be ready, if this is the first time then it will take a while to download images

When deploying docker images, you will definitely encounter indescribable problems. At this time:

```bash
kgpo -l release=jenkins-x
```

Sure enough, some pods failed to start. At this time, you need to move the images back to domestic, and modify the corresponding `deploy`/`ds`.

### Configure volume

#### mongodb

First transfer the image associated with `jenkins-x-mongodb` to domestic, then configure PVC.

```
jenkins-x-mongodb
docker.io/bitnami/mongodb:3.6.6-debian-9
```

Modify this part:

```yaml
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: jenkins-x-mongodb
```

#### jenkins-x-chartmuseum

Also modify the volumes part:

```yaml
      volumes:
        - name: storage-volume
          persistentVolumeClaim:
            claimName: jenkins-x-chartmuseum
```

#### jenkins

```
      volumes:
        - configMap:
            defaultMode: 420
            name: jenkins
          name: jenkins-config
        - emptyDir: {}
          name: plugin-dir
        - emptyDir: {}
          name: secrets-dir
        - name: jenkins-home
          persistentVolumeClaim:
            claimName: jenkins
```

Alibaba Cloud NAS is recommended.

### Transfer k8s.gcr.io Images to Domestic

Jenkins-X configures deploy, CronJob. Many images are from `gcr.io`. Both parts need to be modified.

#### deploy

- `jenkins-x-controllerteam`, `jenkins-x-controllerbuild`

```
gcr.io/jenkinsxio/builder-go:0.1.281
This image is around 3.72G
```

- `jenkins-x-heapster`

```
docker pull k8s.gcr.io/heapster:v1.5.2
docker pull k8s.gcr.io/addon-resizer:1.7
# docker tag k8s.gcr.io/addon-resizer:1.7 $newregistry'addon-resizer:1.7'
```

#### CronJob

- jenkins-x-gcpreviews

After transfer is complete, pods basically all come up.


## Final Results

`jenkins`, `monocular` and `nexus` can be accessed directly. Others can be ignored for now.

```bash
# $(app).$(namespace).$(domain)
➜  ~ kg ing
NAME                         HOSTS                                             ADDRESS        PORTS     AGE
chartmuseum                  chartmuseum.$(namespace).$(domain)       172.18.221.8   80        17h
docker-registry              docker-registry.$(namespace).$(domain)   172.18.221.8   80        17h
jenkins                      jenkins.$(namespace).$(domain)           172.18.221.8   80        17h
monocular                    monocular.$(namespace).$(domain)         172.18.221.8   80        17h
nexus                        nexus.$(namespace).$(domain)             172.18.221.8   80        17h
```

```bash
➜  ~ kg all -l release=jenkins-x
NAME                                                    READY   STATUS         RESTARTS   AGE
pod/jenkins-6879786cbc-6p8f7                            1/1     Running        0          17h
pod/jenkins-x-chartmuseum-7557886767-rbvlf              1/1     Running        0          6m
pod/jenkins-x-controllerbuild-74f7bd9f66-5b5v6          1/1     Running        0          16m
pod/jenkins-x-controllercommitstatus-5947679dc4-ltft7   1/1     Running        0          17h
pod/jenkins-x-controllerrole-5d58fcdd9f-lggwj           1/1     Running        0          17h
pod/jenkins-x-controllerteam-75c7565bdb-dmcgw           1/1     Running        0          44m
pod/jenkins-x-controllerworkflow-578bd4f984-qntf4       1/1     Running        0          17h
pod/jenkins-x-docker-registry-7b56b4f555-4p6hx          1/1     Running        0          17h
pod/jenkins-x-gcactivities-1552708800-7qcdc             0/1     Completed      0          10m
pod/jenkins-x-gcpods-1552708800-wfssj                   0/1     Completed      0          10m
pod/jenkins-x-gcpreviews-1552654800-pptmn               0/1     ErrImagePull   0          24s
pod/jenkins-x-mongodb-6bd8cc478f-55wwm                  1/1     Running        1          18m
pod/jenkins-x-nexus-695cc97bd6-qljhk                    1/1     Running        0          17h

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)     AGE
service/heapster                    ClusterIP   172.30.2.12     <none>        8082/TCP    17h
service/jenkins                     ClusterIP   172.30.5.27     <none>        8080/TCP    17h
service/jenkins-x-chartmuseum       ClusterIP   172.30.14.160   <none>        8080/TCP    17h
service/jenkins-x-docker-registry   ClusterIP   172.30.13.194   <none>        5000/TCP    17h
service/jenkins-x-mongodb           ClusterIP   172.30.13.146   <none>        27017/TCP   17h
service/nexus                       ClusterIP   172.30.4.7      <none>        80/TCP      17h

NAME                                               DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/jenkins                            1         1         1            1           17h
deployment.apps/jenkins-x-chartmuseum              1         1         1            1           17h
deployment.apps/jenkins-x-controllerbuild          1         1         1            1           17h
deployment.apps/jenkins-x-controllercommitstatus   1         1         1            1           17h
deployment.apps/jenkins-x-controllerrole           1         1         1            1           17h
deployment.apps/jenkins-x-controllerteam           1         1         1            1           17h
deployment.apps/jenkins-x-controllerworkflow       1         1         1            1           17h
deployment.apps/jenkins-x-docker-registry          1         1         1            1           17h
deployment.apps/jenkins-x-mongodb                  1         1         1            1           17h
deployment.apps/jenkins-x-nexus                    1         1         1            1           17h

NAME                                                          DESIRED   CURRENT   READY   AGE
replicaset.apps/jenkins-6879786cbc                            1         1         1       17h
replicaset.apps/jenkins-x-chartmuseum-7557886767              1         1         1       6m
replicaset.apps/jenkins-x-chartmuseum-cc467cfc                0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-57dcb9fd5f          0         0         0       17h
replicaset.apps/jenkins-x-controllerbuild-74f7bd9f66          1         1         1       16m
replicaset.apps/jenkins-x-controllercommitstatus-5947679dc4   1         1         1       17h
replicaset.apps/jenkins-x-controllerrole-5d58fcdd9f           1         1         1       17h
replicaset.apps/jenkins-x-controllerteam-5f57968bc9           0         0         0       17h
replicaset.apps/jenkins-x-controllerteam-75c7565bdb           1         1         1       44m
replicaset.apps/jenkins-x-controllerworkflow-578bd4f984       1         1         1       17h
replicaset.apps/jenkins-x-docker-registry-7b56b4f555          1         1         1       17h
replicaset.apps/jenkins-x-mongodb-6bd8cc478f                  1         1         1       23m
replicaset.apps/jenkins-x-mongodb-6bfd5d9c79                  0         0         0       17h
replicaset.apps/jenkins-x-nexus-695cc97bd6                    1         1         1       17h

NAME                                          DESIRED   SUCCESSFUL   AGE
job.batch/jenkins-x-gcactivities-1552698000   1         1            3h
job.batch/jenkins-x-gcactivities-1552699800   1         1            2h
job.batch/jenkins-x-gcactivities-1552708800   1         1            10m
job.batch/jenkins-x-gcpods-1552698000         1         1            3h
job.batch/jenkins-x-gcpods-1552699800         1         1            2h
job.batch/jenkins-x-gcpods-1552708800         1         1            10m
job.batch/jenkins-x-gcpreviews-1552654800     1         0            15h

NAME                                   SCHEDULE         SUSPEND   ACTIVE   LAST SCHEDULE   AGE
cronjob.batch/jenkins-x-gcactivities   0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpods         0/30 */3 * * *   False     0        10m             17h
cronjob.batch/jenkins-x-gcpreviews     0 */3 * * *      False     1        15h             17h
```

## Settings Optimization

### Modify `jx get urls` Results

Need to modify in SVC:

```yaml
metadata:
  annotations:
    fabric8.io/exposeUrl:
```

1. jenkins-x-chartmuseum
1. jenkins-x-docker-registry
1. jenkins-x-monocular-api
1. jenkins-x-monocular-ui
1. jenkins
1. nexus

### Modify Plugin Update Center

Access `/pluginManager/advanced`, fill in Update Site:

  https://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/current/update-center.json


### [Custom git server](https://jenkins-x.io/developing/git/)

todo:

```bash
jx edit addon gitea -e true
jx get addons
```

## Other Useful Commands

### Update Entire Jenkins-X Platform

```bash
jx upgrade platform
```

### Switch Environment

```bash
jx context
jx environment
```

### Update Password

TODO:

Reference links:

1. [JD Engineering Efficiency Expert Shi Xuefeng JenkinsX: Next-Generation CI/CD Platform Based on Kubernetes](http://www.caict.ac.cn/pphd/zb/2018kxy/15pm/5/201808/t20180813_181702.htm)
1. [JenkinsX Essentials](https://www.youtube.com/watch?v=LPEIfvkJpw0)
2. [Install Jenkins X](https://kubernetes.feisky.xyz/fu-wu-zhi-li/devops/jenkinsx)
3. [Install and Use Jenkins X: Command-Line Tool for Automated CI/CD on Kubernetes](https://www.ctolib.com/jenkins-x-jx.html)
4. [5 Minutes to Set Up jenkins Environment on Alibaba Cloud Kubernetes Service and Complete Application Build to Deployment Pipeline](https://yq.aliyun.com/articles/683440)
1. [Install on Kubernetes](https://jenkins-x.io/getting-started/install-on-cluster/)
1. [jx](https://jenkins-x.io/commands/jx/)
1. [Alibaba Cloud Container Service Kubernetes JenkinsX (1) - Installation and Deployment Practice](https://yq.aliyun.com/articles/657149)
1. [Alibaba Cloud Example](https://cs.console.aliyun.com/#/k8s/catalog/detail/incubator_jenkins-x-platform)
