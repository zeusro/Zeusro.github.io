<!-- TODO: Translate to en -->

## 基础设施

centos 7.6 64位

内核版本:5.1.3-1.el7.elrepo.x86_64(手动升级,可免)

kubeadm

kubelet

node*3


## 初始准备

### repo镜像

```bash
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

### 升级内核

```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
yum --enablerepo=elrepo-kernel install -y kernel-ml
# 改引导
# awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg
sed -i 's/GRUB_DEFAULT=saved/GRUB_DEFAULT=0/g' /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg
reboot
uname -sr
```

### 系统设置

```bash
# 禁用交换区
swapoff -a
# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
# 开启forward
# Docker从1.13版本开始调整了默认的防火墙规则
# 禁用了iptables filter表中FOWARD链
# 这样会引起Kubernetes集群中跨Node的Pod无法通信
iptables -P FORWARD ACCEPT
```

### 启用IPVS


```bash
cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

# https://github.com/easzlab/kubeasz/issues/374
# 4.18内核将nf_conntrack_ipv4更名为nf_conntrack
cat > /etc/sysconfig/modules/ipvs.modules <<EOF
#!/bin/bash
ipvs_modules="ip_vs ip_vs_lc ip_vs_wlc ip_vs_rr ip_vs_wrr ip_vs_lblc ip_vs_lblcr ip_vs_dh ip_vs_sh ip_vs_fo ip_vs_nq ip_vs_sed ip_vs_ftp nf_conntrack"
for kernel_module in \${ipvs_modules}; do
    /sbin/modinfo -F filename \${kernel_module} > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        /sbin/modprobe \${kernel_module}
    fi
done
EOF

chmod 755 /etc/sysconfig/modules/ipvs.modules && bash /etc/sysconfig/modules/ipvs.modules 
lsmod | grep ip_vs
```




###  装18.06.2的docker

按照[kubernetes源代码](https://github.com/kubernetes/kops/blob/master/nodeup/pkg/model/docker.go#L57-L485)安装特定docker版本

```bash
# http://mirror.azure.cn/docker-ce/linux/centos/7/x86_64/stable/
sudo tee /etc/yum.repos.d/docker.repo <<-'EOF'
[dockerrepo]
name=Docker Repository
baseurl=http://mirror.azure.cn/docker-ce/linux/centos/7/x86_64/stable/
enabled=1 
gpgcheck=1
gpgkey=http://mirror.azure.cn/docker-ce/linux/centos/gpg
EOF

yum install -y docker-ce-18.06.2.ce-3.el7.x86_64

# 配置docker加速
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "registry-mirrors": ["https://vhc6pxhv.mirror.aliyuncs.com"]
}
EOF

sudo systemctl start docker
systemctl enable docker.service
```

### 安装其他依赖


```bash
yum -y install yum nfs-utils wget nano yum-utils device-mapper-persistent-data lvm2 git docker-compose ipvsadm net-tools telnet
yum update -y
```



### install-kubeadm

配置k8s的镜像

```bash
sudo tee /etc/yum.repos.d/kubernetes.repo <<-'EOF'
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF

sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
yum install -y  kubeadm kubectl --disableexcludes=kubernetes

systemctl enable kubelet
# && systemctl start kubelet
```

## 安装集群

接下来要根据实际情况选择单master还是奇数台master了

kubeadm的默认配置文件"藏"在`kubeadm config print init-defaults`和`kubeadm config print join-defaults`中,这里要根据中国特色社会主义的实际情况进行修改.


```
kubeadm config print join-defaults --component-configs KubeProxyConfiguration //JoinConfiguration KubeProxyConfiguration
kubeadm config print join-defaults --component-configs KubeletConfiguration // JoinConfiguration KubeletConfiguration
```

一般来说`serviceSubnet`范围要比`podSubnet`小

`podSubnet: 10.66.0.0/16`注定了最多只能有65534个pod,serviceSubnet同理.

### 高可用型(生产用)

高可用性的特点在于N个etcd,kube-apiserver,kube-scheduler,kube-controller-manager,以组件的冗余作为高可用的基础.


api-server以负载均衡作为对外的入口.

[设置master](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

```
# https://godoc.org/k8s.io/kubernetes/cmd/kubeadm/app/apis/kubeadm/v1beta1#ClusterConfiguration



export HOST0=172.18.221.35
export HOST1=172.18.243.72
export HOST2=172.18.243.77
mkdir -p ${HOST0}/ ${HOST1}/ ${HOST2}/
ETCDHOSTS=(${HOST0} ${HOST1} ${HOST2})
NAMES=("infra0" "infra1" "infra2")


for i in "${!ETCDHOSTS[@]}"; do
HOST=${ETCDHOSTS[$i]}
NAME=${NAMES[$i]}
cat << EOF > ${HOST}/kubeadm-config.yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
---
apiVersion: "kubeadm.k8s.io/v1beta1"
kind: ClusterConfiguration
# kubernetesVersion: stable
kubernetesVersion: v1.14.2
imageRepository: gcr.azk8s.cn/google_containers
# 这里配置了一个阿里云内网负载均衡作为入口,如果没有的话请自行忽略
# controlPlaneEndpoint: "172.18.221.7:6443"
networking:
# 规划pod CIDR
  podSubnet: 10.66.0.0/16
  serviceSubnet: 10.88.0.0/16
etcd:
    local:
        serverCertSANs:
        - "${HOST}"
        peerCertSANs:
        - "${HOST}"
        extraArgs:
            initial-cluster: ${NAMES[0]}=https://${ETCDHOSTS[0]}:2380,${NAMES[1]}=https://${ETCDHOSTS[1]}:2380,${NAMES[2]}=https://${ETCDHOSTS[2]}:2380
            initial-cluster-state: new
            name: ${NAME}
            listen-peer-urls: https://${HOST}:2380
            listen-client-urls: https://${HOST}:2379
            advertise-client-urls: https://${HOST}:2379
            initial-advertise-peer-urls: https://${HOST}:2380
EOF
done





kubeadm config images pull --config=kubeadm-config.yaml
sudo kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs

sudo kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs --ignore-preflight-errors=all

# todo:
kubeadm join 172.18.221.35:6443 --token l0ei3n.rqqqseno29oo564z \
    --discovery-token-ca-cert-hash sha256:9752be9ff3b619f5b6baadc98ed184e3e1dc2ff02b080aea2457b8f89496de2f
    
```


### 单master型(实验用)

```
sudo tee kubeadm-config.yaml <<-'EOF'
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
---
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
mode: ipvs
---
apiVersion: kubeadm.k8s.io/v1beta1
kind: ClusterConfiguration
# kubernetesVersion: stable
kubernetesVersion: v1.14.2
# 这里配置了一个阿里云内网负载均衡作为入口,如果没有的话请自行忽略
# controlPlaneEndpoint: "172.18.221.7:6443"
imageRepository: gcr.azk8s.cn/google_containers
networking:
# 规划pod CIDR
  podSubnet: 10.66.0.0/16
  serviceSubnet: 10.88.0.0/16
EOF

kubeadm config images pull --config=kubeadm-config.yaml
sudo kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs
```

### 配置kubelet客户端

```bash
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### [配置网络插件](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)

这里我选择`quay.io/coreos/flannel:v0.11.0-amd64`,因为架构比较齐全

### 引入其他master节点(高可用版)

在`kubeadm init`的输出中,有一行是

```
[upload-certs] Using certificate key: 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```

复制起来,在别的master上面运行命令

```
kubeadm join 172.18.221.35:6443 \
--token 29ciq3.5mtkr4nzc11mlzd6 \
--discovery-token-ca-cert-hash sha256:03b46745a1f3887417270e33fc9b3fb5ddd82599f0d0ec789ed4edf2c310faae \
--experimental-control-plane \
--certificate-key 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```





## 工作节点加入集群

```bash
kubeadm join 172.18.221.35:6443 --token c63abt.45sn8bhyxxo2lh0r \
    --discovery-token-ca-cert-hash sha256:891e41e798c29f7235078479ca3e0622594c91db08160bea620f60fffcd558f5
```




## 收尾工作


```
  ipvsadm -l
```


## 其他参考

### [kubelet-check] Initial timeout of 40s passed.

```
systemctl status kubelet
journalctl -xeu kubelet
```
通过以上任意一个命令看到,kubernetes服务虽然启动中,但是提示节点找不到.

```
May 20 14:55:22 xxx kubelet[3457]: E0520 14:55:22.095536    3457 kubelet.go:2244] node "xxx" not found
```

最后发现是一开始指定了负载均衡,负载均衡连接不上导致超时

 --ignore-preflight-errors=all


### 修改driver之后的注意事项

如果docker是之前安装的,改一下配置然后重启服务即可

改成systemd要在kubelet的服务上要加多一个参数,不然服务无法启动


```bash
vi /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```

```
# Restart docker.
systemctl daemon-reload
systemctl restart docker
systemctl restart kubelet
```

### master参与调度

```bash
# 去掉master污点,让其参与调度
kubectl taint $node --all node-role.kubernetes.io/master-
```

### 重置


```bash
kubeadm reset
ipvsadm --clear
```

### 重新计算discovery-token-ca-cert-hash

```
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
```


## todo

https://github.com/kubernetes/kubeadm/issues/1331

[证书轮换](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)

[setup-ha-etcd-with-kubeadm](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

## 参考链接

1. [Overview of kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
1. [阿里云镜像仓库](https://opsx.alibaba.com/mirror/search?q=kubelet&lang=zh-CN)
2. [官方安装指南](https://kubernetes.io/docs/setup/independent/install-kubeadm/)
1. [使用kubeadm安装kubernetes](http://bazingafeng.com/2017/11/20/using-kubeadm-install-kubernetes/)
2. [centos7安装kubeadm](http://www.maogx.win/posts/15/)
3. [centos7使用kubeadm安装k8s-1.11版本多主高可用](http://www.maogx.win/posts/33/)
4. [centos7使用kubeadm安装k8s集群](http://www.maogx.win/posts/16/)
5. [kubernetes集群的安装异常汇总](https://juejin.im/post/5bbf7dd05188255c652d62fe)
6. [kubeadm 设置工具参考指南](https://k8smeetup.github.io/docs/admin/kubeadm/)
7. [ipvs](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs)