## Installation

### Ubuntu

```bash
# SET UP THE REPOSITORY
sudo apt-get remove docker docker-engine docker.io
sudo apt-get update
sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
 sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
# INSTALL DOCKER CE
 sudo apt-get update
 sudo apt-get install docker-ce
apt-cache madison docker-ce
# Alibaba Cloud company mirror
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": ["https://vhc6pxhv.mirror.aliyuncs.com"]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

```

```bash
sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version

```
Reference:
1. https://docs.docker.com/compose/install/#install-compose
2. 

### mac

```
brew cask install docker
docker ps
docker-machine create default

```

## Commands

###  run 
```
 docker run [OPTIONS] IMAGE [COMMAND] [ARG...]  
  -a, --attach=[]            Log into container (container started with docker run -d)  
  -c, --cpu-shares=0         Set container CPU weight, used in CPU sharing scenarios  
  --cap-add=[]               Add permissions, permission list details: http://linux.die.net/man/7/capabilities  
  --cap-drop=[]              Delete permissions, permission list details: http://linux.die.net/man/7/capabilities  
  --cidfile=""               After running container, write container PID value to specified file, a typical monitoring system usage  
  --cpuset=""                Set which CPUs container can use, this parameter can be used for container-exclusive CPU  
  -d, --detach=false         Specify whether container runs in foreground or background   
  --device=[]                Add host device to container, equivalent to device passthrough  
  --dns=[]                   Specify container's dns server  
  --dns-search=[]            Specify container's dns search domain, write to container's /etc/resolv.conf file  
  -e, --env=[]               Specify environment variables, container can use this environment variable  
  --entrypoint=""            Override image's entry point  
  --env-file=[]              Specify environment variable file, file format is one environment variable per line  
  --expose=[]                Specify container exposed ports, i.e., modify image's exposed ports  
  -h, --hostname=""          Specify container's hostname  
  -i, --interactive=false    Open STDIN for console interaction  
  --link=[]                  Specify associations between containers, use other containers' IP, env, etc.  
  --lxc-conf=[]             Specify container's configuration file, only used when --exec-driver=lxc is specified  
  -m, --memory=""            Specify container's memory limit  
  --name=""                  Specify container name, can manage container by name later, links feature requires using name  
  --net="bridge"             Container network settings, to be detailed  
  -P, --publish-all=false    Specify container exposed ports, to be detailed  
  -p, --publish=[]           Specify container exposed ports, to be detailed  
  --privileged=false         Specify whether container is privileged container, privileged containers have all capabilities  
  --restart=""               Specify container restart strategy after stopping, to be detailed  
  --rm=false                 Specify container automatically deletes after stopping (doesn't support containers started with docker run -d)  
  --sig-proxy=true           Set proxy to accept and handle signals, but SIGCHLD, SIGSTOP and SIGKILL cannot be proxied  
  -t, --tty=false            Allocate tty device, can support terminal login  
  -u, --user=""              Specify container's user  
  -v, --volume=[]            Mount storage volume to container, mount to a certain directory in container  
  --volumes-from=[]          Mount volumes from other containers to container, mount to a certain directory in container  
  -w, --workdir=""           Specify container's working directory  


# Start a bash terminal, allow user interaction
docker run -t -i ubuntu:14.04 /bin/bash

# Start terminated container  
docker container start
```

* --restart parameter supports three logical implementations:
```
no: Don't restart when container exits  
on-failure: Restart when container exits with error (non-zero return value)  
always: Always restart when container exits
```

* Network parameter --net
 
```bash
--net=bridge： //Use bridge specified by docker daemon
--net=host： //Container uses host's network
--net=container:NAME_or_ID：//Use another container's network, share IP and PORT and other network resources
--net=none： //Container uses its own network (similar to --net=bridge), but doesn't configure
```

* Simplest example
 
```bash
docker run --name myredis -d redis
```

###  build
```
docker build -t runoob/ubuntu:v1 .
```

### Built-in Monitoring

```bash
# {% raw %}
  docker stats $(docker ps --format={{.Names}})
# {% endraw %}  
```

Reference:
[docker stats](https://docs.docker.com/engine/reference/commandline/stats/)

## Some Pitfalls

### Docker has network bottlenecks, can be solved via ` --net=host`.
>    Docker supported network modes are:
> 
>    none. Close network connections inside container  
> 
>    bridge. Connect containers through veth interfaces, default configuration.
> 
>    host. Allow container to use host's network stack information. Note: This method will allow container to access system services like D-BUS in host, so it's considered unsafe.
> 
>   container. Use another container's network stack information.　
* 



### Cannot connect to the Docker daemon on macOS
```
brew cask install docker
``` 

### Use ADD Instruction Sparingly

ADD's other function is being able to automatically decompress compressed files. If the parameter is a local file that recognizes compression formats (tar, gzip, bzip2, etc.), it will be decompressed to the specified location in the container filesystem.

Reference links:
[Dockerfile:ADD VS COPY](https://juejin.im/post/5aa5d08e6fb9a028de4455d1)

### Containers executed by entrypoint cannot receive [Unix signals](https://zh.wikipedia.org/wiki/Unix%E4%BF%A1%E5%8F%B7)

entrypoint executed through sh -c causes application pid!=1

## Key Points:
* All file write operations should use data volumes (Volume), or bind host directories. Read-write at these locations skips container storage layer, directly read-write to host (or network storage), with higher performance and stability.
* So for CentOS/RHEL users, when unable to use UnionFS, must configure direct-lvm for devicemapper, whether for performance, stability or space utilization.
* When building images, use `&&` to connect instructions, finally need to clean up excess files
* Should place Dockerfile in an empty directory, or project root directory
* Some things in directory really don't want to pass to Docker engine during build, then can write a .dockerignore with .gitignore-like syntax
* 


1. [Experience Alpine Linux Docker Image](https://blog.phpgao.com/docker_alpine.html)

## Some Tips

### View Image Tags

```
brew install httpie
http -a <username>:<password> https://auth.docker.io/token  service==registry.docker.io scope==repository:library/nginx:pull
# Replace command result's token into $token
http https://registry.hub.docker.com/v2/library/nginx/tags/list 'Authorization: Bearer $token'

```

Reference

[Interacting with docker hub v2 API via OAuth](https://yq.aliyun.com/articles/635236?spm=a2c4e.11155435.0.0.70446906jG4z8L)


### View Google Container Tags

[Command line method](https://cloud.google.com/sdk/gcloud/reference/container/images/list-tags)


[API method](https://gcr.io/v2/google-containers/pause/tags/list)

[Web method](https://console.cloud.google.com/gcr/images/google-containers/GLOBAL)


### View Container Temporary Storage Usage

```bash
docker ps
docker inspect <containerid>
```

Result is a json, content in `GraphDriver` field is the space occupied by this container's read-write layer

[overlay2](https://docs.docker.com/storage/storagedriver/overlayfs-driver/#how-the-overlay2-driver-works) this storage driver, roughly looks like this

```
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5-init/diff:/var/lib/docker/overlay2/bc8e51a75f0c75a4c99aee3365e61d819db62c40567d19065803f604c37b037c/diff:/var/lib/docker/overlay2/c6b772109941ef801751cc79df1fff5365d802313e62d891709fa5dc0a77e5ee/diff:/var/lib/docker/overlay2/57825e2f123ee01d2a0316633797eea092d456e86313e57f387f55984539fa12/diff:/var/lib/docker/overlay2/85a562eb1efa7fb47d73c1f3a872eff792e2897fb10acc7f5c3a36a949267ea8/diff:/var/lib/docker/overlay2/175ef167c94fabfcdd71c9c0c00cf84aff09092c525a23eb34ef1abdc5353315/diff:/var/lib/docker/overlay2/7f3e18afdbf72eef8cf3c3c85be17fd690bd8d08ab845351f13e2ab9373f7116/diff:/var/lib/docker/overlay2/6587c9c58d7fbeaa3b2d485033cea9ed16b5e58f5ffb1ab52cbf0ce5d10015db/diff:/var/lib/docker/overlay2/7a5a3316ee39f485f5834604b4ed2943864935601cb53d1ff4e61523236fd7e3/diff:/var/lib/docker/overlay2/e823c204b197123caf2cb190a4a7eb6b1664ef91610578cd3a9230edd9948711/diff:/var/lib/docker/overlay2/5ee74f69388ee558000e54fab92d7f245e38cbcb74d1d428e6e8acb1d84d5785/diff:/var/lib/docker/overlay2/a716238ee065c05799244c3bd375ecc3132f3039f4e041254a150b4900b43c84/diff:/var/lib/docker/overlay2/8cf97acec90c72c19d9efe245d7196a27903c2593d64c34d4fd68c0f3244afe3/diff:/var/lib/docker/overlay2/d31d19d7f6dae649f5318546dd374b7c332dbdab01bc61b7e47bafec0f1a33e9/diff",
                "MergedDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/merged",
                "UpperDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/diff",
                "WorkDir": "/var/lib/docker/overlay2/a37aa91098cae96ea46461786e1fe5e737e6a9f6659aaecae03cb1a6649f2ec5/work"
```

Regarding storage drivers, [this article](http://dockone.io/article/1765) explains it pretty well

### Clean Containers

Use the following command before and after cleaning to compare effects

  docker system df -v

#### Method 1


```bash
    # Alternatively, you can use the following command to delete all containers in stopped (Exited) state:
    docker rm -v $(docker ps -a -q -f status=exited)
    #To delete (so-called) dangling volumes, you should enter the following command:
    docker volume rm $(docker volume ls -qf dangling=true)
    # Finally, enter the following command to ensure cleanup is complete:
    docker volume ls -qf dangling=true | xargs -r docker volume rm
```


```bash
#! /bin/sh means this script uses /bin/sh to interpret and execute, #! is a special indicator, what follows is the path of the shell that interprets this script
#!/bin/bash
docker rmi $ (docker images -q -f dangling=true)
docker volume rm $(docker volume ls -qf dangling=true)
0 0 1 ~/docker_clean.sh > /dev/null 2>&1
```

```bash
chmod 755 ~/docker_clean.sh
# Where USER is the real username
sudo usermod -aG docker USER
# After logging out and logging back in, we create a cron job by entering the following command
crontab –e
# Save and close the crontab file. After that, at midnight every day, Docker will automatically perform cleanup tasks, and you can experience a clean, tidy Docker.

```

Reference:[4 Practical Tips to Give Your Docker a "Big Cleanup"](https://yq.aliyun.com/articles/279136?spm=a2c4e.11153959.0.0.16b9d55awTBOj5)


#### 【Strongly Recommended】Method 2

```
docker system prune -a
docker system prune --volumes
```

### OOM Troubleshooting

```bash
grep -i OOM -A 5 -B 5 /var/log/messages
docker ps -a | grep 5c223ed
```

```bash
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Tasks state (memory values in pages):
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26934]     0 26934      411      128    40960        0           937 entrypoint.sh
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26981]     0 26981    48758     1814   118784        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26982] 65534 26982    69086    25949   323584        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26983] 65534 26983    70117    26791   331776        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  26986] 65534 26986    68812    25937   323584        0           937 php-fpm7
--
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  23381] 65534 23381    51941     8278   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29842] 65534 29842    51729     8041   180224        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  29854] 65534 29854    50988     7278   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [  30426] 65534 30426    52385     8720   184320        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: [    317] 65534   317    51335     7618   176128        0           937 php-fpm7
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,mems_allowed=0,oom_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task_memcg=/kubepods.slice/kubepods-burstable.slice/kubepods-burstable-podef7ce918_ae07_11e9_bf64_00163e08cd06.slice/docker-5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702.scope,task=php-fpm7,pid=26865,uid=65534
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: Memory cgroup out of memory: Killed process 26865 (php-fpm7) total-vm:367860kB, anon-rss:177544kB, file-rss:1720kB, shmem-rss:13216kB
Jul 30 08:11:33 izwz9hs52qcjvdljv2zxa2z kernel: oom_reaper: reaped process 26865 (php-fpm7), now anon-rss:0kB, file-rss:0kB, shmem-rss:13216kB
```

`5c223edfde3b17676cb982efdc201218a674578704d33d09de4775b721cb4702` This is the container ID that had OOM

## [Dockerfile Tips](https://mp.weixin.qq.com/s?__biz=MzI1OTY2MzMxOQ==&mid=2247486135&idx=2&sn=0136343fedfb03d18ecd52f4b0297250&chksm=ea743e0fdd03b719a4e31b0bf508d305c8ea95595fa6f94d1d149a1f39af950a97a08c21b831&mpshare=1&scene=23&srcid=0722hfZqf9tVS6zNAMxua63c#rd)

Put changing layers last, put cacheable layers in front

```
apt-get -y install -–no-install-recommends
rm -rf /var/lib/apt/lists/*
```

## Find Container Information by PID

```bash
{% raw %}
  docker ps -q | xargs docker inspect --format '{{.State.Pid}}, {{.ID}}, {{.Name}}, {{.Config.Image}}' | grep "^${PID},"
{% endraw %}
```

PS: docker inspect command result is a json, can first not add format, then define format yourself

Reference links:
[CoreOS - get docker container name by PID?](https://stackoverflow.com/questions/24406743/coreos-get-docker-container-name-by-pid)

## docker ps  Sorting

```bash
{% raw %}

docker ps --format "table {{.ID}}\t{{.Image}}" | (read -r; printf "%s\n" "$REPLY"; sort -k 2 )

docker ps [--format="TEMPLATE"]

--format="TEMPLATE"
  Pretty-print containers using a Go template.
  Valid placeholders:
     .ID - Container ID
     .Image - Image ID
     .Command - Quoted command
     .CreatedAt - Time when the container was created.
     .RunningFor - Elapsed time since the container was started.
     .Ports - Exposed ports.
     .Status - Container status.
     .Size - Container disk size.
     .Names - Container names.
     .Labels - All labels assigned to the container.
     .Label - Value of a specific label for this container. For example {{.Label "com.docker.swarm.cpu"}}
     .Mounts - Names of the volumes mounted in this container.

{% endraw %}
```

[Reference link](https://stackoverflow.com/questions/46173298/how-to-sort-or-order-results-docker-ps-format)

## Can't Learn Anymore

Can't learn docker commands? No problem, [lazydocker](https://github.com/jesseduffield/lazydocker) helps you out, click where you don't understand, mom no longer needs to worry about my docker problems.

## Reference Links:

1. [Docker Basics-Understanding Communication Between Containers](https://kevinguo.me/2017/08/23/Docker-container-communication/)
2. [【docker】docker run Command Detailed Explanation](https://blog.csdn.net/one_clouder/article/details/39224767)
3. [How to Pass Parameters to Project Inside Docker When Starting Docker](https://blog.csdn.net/wsbgmofo/article/details/79173920)
4. [Network Bottlenecks with Docker Usage](http://wiki.jikexueyuan.com/project/openresty/web/docker.html)
5. [How to Write docker-compose.yml, Docker compose file Reference Documentation](https://deepzz.com/post/docker-compose-file.html)
6. [Deep Understanding of Docker Volume (One)](http://dockone.io/article/128)
7. [Use volumes](https://docs.docker.com/storage/volumes/)
8. [Docker Container Management](https://itbilu.com/linux/docker/4kkTyS8Pf.html#docker-inspect)
9. [Install Docker Compose](https://docs.docker.com/compose/install/)
