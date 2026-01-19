## Infrastructure

centos 7.6 64-bit

Kernel version: 5.1.3-1.el7.elrepo.x86_64 (manually upgraded, optional)

kubeadm

kubelet

node*3


## Initial Preparation

### repo Mirror

```bash
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

### Upgrade Kernel

```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
yum --enablerepo=elrepo-kernel install -y kernel-ml
# Change boot
# awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg
sed -i 's/GRUB_DEFAULT=saved/GRUB_DEFAULT=0/g' /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg
reboot
uname -sr
```

### System Settings

```bash
# Disable swap
swapoff -a
# Stop firewall
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
# Enable forward
# Docker adjusted default firewall rules starting from version 1.13
# Disabled FOWARD chain in iptables filter table
# This will cause Pods across Nodes in Kubernetes cluster to be unable to communicate
iptables -P FORWARD ACCEPT
```

### Enable IPVS


```bash
cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

# https://github.com/easzlab/kubeasz/issues/374
# Kernel 4.18 renamed nf_conntrack_ipv4 to nf_conntrack
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





### Install Docker 18.06.2

Install specific docker version according to [kubernetes source code](https://github.com/kubernetes/kops/blob/master/nodeup/pkg/model/docker.go#L57-L485)

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

# Configure docker acceleration
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

### Install Other Dependencies


```bash
yum -y install yum nfs-utils wget nano yum-utils device-mapper-persistent-data lvm2 git docker-compose ipvsadm net-tools telnet
yum update -y
```



### install-kubeadm

Configure k8s mirror

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

## Install Cluster

Next, choose single master or odd number of masters based on actual situation.

kubeadm's default configuration file is "hidden" in `kubeadm config print init-defaults` and `kubeadm config print join-defaults`. Here, modify according to the actual situation with Chinese characteristics.


```
kubeadm config print join-defaults --component-configs KubeProxyConfiguration //JoinConfiguration KubeProxyConfiguration
kubeadm config print join-defaults --component-configs KubeletConfiguration // JoinConfiguration KubeletConfiguration
```

Generally, `serviceSubnet` range should be smaller than `podSubnet`.

`podSubnet: 10.66.0.0/16` means at most 65534 pods, same for serviceSubnet.

### High Availability Type (Production Use)

High availability features N etcd, kube-apiserver, kube-scheduler, kube-controller-manager, using component redundancy as the basis for high availability.


api-server uses load balancing as the external entry point.

[Setup master](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

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
# Here configured an Alibaba Cloud intranet load balancer as entry point, if you don't have one please ignore
# controlPlaneEndpoint: "172.18.221.7:6443"
networking:
# Plan pod CIDR
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


### Single Master Type (Experimental Use)

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
# Here configured an Alibaba Cloud intranet load balancer as entry point, if you don't have one please ignore
# controlPlaneEndpoint: "172.18.221.7:6443"
imageRepository: gcr.azk8s.cn/google_containers
networking:
# Plan pod CIDR
  podSubnet: 10.66.0.0/16
  serviceSubnet: 10.88.0.0/16
EOF

kubeadm config images pull --config=kubeadm-config.yaml
sudo kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs
```

### Configure kubelet Client

```bash
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### [Configure Network Plugin](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)

Here I chose `quay.io/coreos/flannel:v0.11.0-amd64`, because the architecture is relatively complete

### Add Other Master Nodes (High Availability Version)

In the output of `kubeadm init`, there's a line:

```
[upload-certs] Using certificate key: 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```

Copy it, run the command on other masters:

```
kubeadm join 172.18.221.35:6443 \
--token 29ciq3.5mtkr4nzc11mlzd6 \
--discovery-token-ca-cert-hash sha256:03b46745a1f3887417270e33fc9b3fb5ddd82599f0d0ec789ed4edf2c310faae \
--experimental-control-plane \
--certificate-key 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```





## Worker Nodes Join Cluster

```bash
kubeadm join 172.18.221.35:6443 --token c63abt.45sn8bhyxxo2lh0r \
    --discovery-token-ca-cert-hash sha256:891e41e798c29f7235078479ca3e0622594c91db08160bea620f60fffcd558f5
```





## Final Work


```
  ipvsadm -l
```


## Other References

### [kubelet-check] Initial timeout of 40s passed.

```
systemctl status kubelet
journalctl -xeu kubelet
```
Through either of the above commands, you can see that although the kubernetes service is starting, it prompts that the node cannot be found.

```
May 20 14:55:22 xxx kubelet[3457]: E0520 14:55:22.095536    3457 kubelet.go:2244] node "xxx" not found
```

Finally found that a load balancer was specified at the beginning, and the load balancer connection timeout caused the timeout.

 --ignore-preflight-errors=all


### Notes After Modifying Driver

If docker was installed before, just change the configuration and restart the service.

To change to systemd, you need to add one more parameter to the kubelet service, otherwise the service cannot start.


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

### Master Participates in Scheduling

```bash
# Remove master taint to let it participate in scheduling
kubectl taint $node --all node-role.kubernetes.io/master-
```

### Reset


```bash
kubeadm reset
ipvsadm --clear
```

### Recalculate discovery-token-ca-cert-hash

```
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
```


## todo

https://github.com/kubernetes/kubeadm/issues/1331

[Certificate Rotation](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)

[setup-ha-etcd-with-kubeadm](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

## Reference Links

1. [Overview of kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
1. [Alibaba Cloud Mirror Repository](https://opsx.alibaba.com/mirror/search?q=kubelet&lang=zh-CN)
2. [Official Installation Guide](https://kubernetes.io/docs/setup/independent/install-kubeadm/)
1. [Using kubeadm to Install kubernetes](http://bazingafeng.com/2017/11/20/using-kubeadm-install-kubernetes/)
2. [centos7 Install kubeadm](http://www.maogx.win/posts/15/)
3. [centos7 Use kubeadm to Install k8s-1.11 Version Multi-Master High Availability](http://www.maogx.win/posts/33/)
4. [centos7 Use kubeadm to Install k8s Cluster](http://www.maogx.win/posts/16/)
5. [kubernetes Cluster Installation Exception Summary](https://juejin.im/post/5bbf7dd05188255c652d62fe)
6. [kubeadm Setup Tool Reference Guide](https://k8smeetup.github.io/docs/admin/kubeadm/)
7. [ipvs](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs)
