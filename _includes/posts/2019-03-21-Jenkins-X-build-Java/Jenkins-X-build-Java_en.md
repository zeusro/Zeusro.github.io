`Jenkins-X` provides [various examples](https://jenkins.io/doc/pipeline/tour/hello-world/#examples) for different languages by default. We first learn the default examples, then adapt them according to our own situation.

First, let's understand the build process:

Pull code from git server (GitHub/gitea) -> Build docker image -> Push to image registry

It's recommended to use [jx create](https://jenkins-x.io/commands/jx_create_quickstart/) to create official examples at the beginning, push to GitHub, and then slowly modify after getting familiar.

```
jx create spring -d web -d actuator
jx create quickstart -l java
jx create quickstart \
 -l java \
 --docker-registry-org zeusro \
 --git-username zeusro \
 --org  zeusro \
 --git-provider-kind gitea \
 --git-provider-url  https://gitea.com \
 --git-host  https://gitea.com  \
 --import-commit-message init \
 --name java-abcde \
 --project-name  java-abcde
```

## Prerequisites

### Disable https certificate check

For domains without certificates, check this. Path: `Manage Jenkins`-`Configure System`

### Modify Kubernetes Pod Template

`Jenkins` pulls to Jenkins' working directory (server), while `Jenkins-X` starts a pod based on the configured template. This pod has 2 containers, one is `jnlp-slave`, and the other is the build tool image. If it's a `gradle` build, the image is `gcr.io/jenkinsxio/builder-gradle`.

So you need the following template. Path: `Manage Jenkins`-`Configure System`-`Images`-`Kubernetes Pod Template`, migrate and modify according to specific build language.


### Dependency Acceleration

- maven acceleration

```xml
<?xml version="1.0" encoding="utf-8"?>
<settings xmlns="https://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>alimaven</id>
      <mirrorOf>central</mirrorOf>
      <name>aliyun maven</name>
      <url>http://maven.aliyun.com/nexus/content/repositories/central/</url>
    </mirror>
  </mirrors>
  <profiles>
    <profile/>
  </profiles>
</settings>
```

- gradle acceleration

```
allprojects {
    apply plugin: 'maven'
    group = 'com.hh.onekey'
    version = '2.0.0'
}
subprojects {
    apply plugin: 'java'
    sourceCompatibility = 1.8
    targetCompatibility = 1.8

    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }


    dependencies {
        testCompile group: 'junit', name: 'junit', version: '4.12'
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven { url 'https://maven.aliyun.com/nexus/content/groups/public/' }
        maven { url 'https://maven.aliyun.com/nexus/content/repositories/jcenter' }
        maven { url "https://plugins.gradle.org/m2/" }
    }
}
```


## Build Prerequisites

There are 3 approaches, choose any one. The first is recommended.

### [Recommended] Deliver to mvn local

This idea came to me when building cache. In a normal pipeline build process, each build is a sandbox from scratch, requiring re-downloading packages before building. Very wasteful of traffic. So if mvnlocal is mounted inside the container, then directly restore locally, and pull from network when there are problems.

This can solve both the `build prerequisites` and `open source dependency pulling` problems.

Currently supported volumes are:

1. PVC
1. NFS
1. hostpath

NFS is recommended.

gradle: Mount to `/root/.gradle/caches`

maven: Mount to `/root/.mvnrepository`


### Deliver to Nexus

todo

### Associate Other Pipelines

todo

## Pull Code from Other git server (gitea)

```bash
jx create git server gitea http://xxx:1080
# jx delete git server gitea
jx get git
```

Currently the delete command is still quite stupid, can only delete by type. If 2 gitea-type git servers are added, when deleting, it will delete the earliest created gitea server first.




## Build docker Image

Build depends on `Jenkinsfile` and `Dockerfile` in the project.

Regarding `Jenkinsfile` syntax, I'll write another article to explain.


## Push docker Image to Custom Registry

- Modify DOCKER_REGISTR

The default setting is to push to the docker REGISTRY established when creating `Jenkins-X`. We need to change it to our own server.

Configuration path: `Manage Jenkins`-`Global properties`

Modify the DOCKER_REGISTRY variable

```
# Alibaba Cloud Shenzhen vpc
registry-vpc.cn-shenzhen.aliyuncs.com/
```

- [jx create docker](https://jenkins-x.io/commands/jx_create_docker/)

```bash
jx create docker auth \
--host "registry-vpc.cn-shenzhen.aliyuncs.com" \
--user "foo" --secret "FooDockerHubToken" \
--email "fakeemail@gmail.com"
```

After that, in the kubernetes namespace where this `Jenkins-X` instance is deployed, a secret named `jenkins-docker-cfg` will appear. This secret is a json.

```json
{
	"auths": {
		"registry-vpc.cn-shenzhen.aliyuncs.com": {
			"auth": "xxxxxxxxxx",
			"email": "fakeemail@gmail.com"
		}
	}
}
```

To let containers log into the docker registry through the auth field in this json.

So this secret also needs to be mounted inside the container. Fortunately, the default pod template has already set this step.

![Image](/img/in-post/jenkins-x-build-java/volume-jenkins-docker-cfg.png)


Besides this, there are other [authorization methods](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/docker-registry.md)


## Reference Links:

1. [Jenkins X Build Examples](https://github.com/jenkins-x-buildpacks/jenkins-x-kubernetes/tree/master/packs)
1. [pod-templates](https://github.com/jenkins-x/jx-docs/blob/master/content/architecture/pod-templates.md)
1. [Practicing Elastic CI/CD Systems Based on Kubernetes](https://yq.aliyun.com/articles/690403)
