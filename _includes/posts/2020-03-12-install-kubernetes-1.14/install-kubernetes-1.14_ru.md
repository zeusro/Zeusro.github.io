## Инфраструктура

centos 7.6 64-бит

Версия ядра: 5.1.3-1.el7.elrepo.x86_64 (обновлено вручную, опционально)

kubeadm

kubelet

node*3


## Начальная подготовка

### репозиторий Mirror

```bash
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```

### Обновление ядра

```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm
yum --enablerepo=elrepo-kernel install -y kernel-ml
# Изменить загрузку
# awk -F\' '$1=="menuentry " {print $2}' /etc/grub2.cfg
sed -i 's/GRUB_DEFAULT=saved/GRUB_DEFAULT=0/g' /etc/default/grub
grub2-mkconfig -o /boot/grub2/grub.cfg
reboot
uname -sr
```

### Настройки системы

```bash
# Отключить swap
swapoff -a
# Остановить файрвол
systemctl stop firewalld
systemctl disable firewalld
setenforce 0
# Включить forward
# Docker скорректировал правила файрвола по умолчанию, начиная с версии 1.13
# Отключил цепочку FOWARD в таблице фильтров iptables
# Это вызовет невозможность связи подов между узлами в кластере Kubernetes
iptables -P FORWARD ACCEPT
```

### Включить IPVS


```bash
cat <<EOF >  /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF

# https://github.com/easzlab/kubeasz/issues/374
# Ядро 4.18 переименовало nf_conntrack_ipv4 в nf_conntrack
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





### Установить Docker 18.06.2

Установить конкретную версию docker согласно [исходному коду kubernetes](https://github.com/kubernetes/kops/blob/master/nodeup/pkg/model/docker.go#L57-L485)

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

# Настроить ускорение docker
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

### Установить другие зависимости


```bash
yum -y install yum nfs-utils wget nano yum-utils device-mapper-persistent-data lvm2 git docker-compose ipvsadm net-tools telnet
yum update -y
```



### install-kubeadm

Настроить зеркало k8s

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

## Установить кластер

Далее выберите один master или нечетное количество masters в зависимости от фактической ситуации.

Файл конфигурации по умолчанию kubeadm "скрыт" в `kubeadm config print init-defaults` и `kubeadm config print join-defaults`. Здесь измените в соответствии с фактической ситуацией с китайской спецификой.


```
kubeadm config print join-defaults --component-configs KubeProxyConfiguration //JoinConfiguration KubeProxyConfiguration
kubeadm config print join-defaults --component-configs KubeletConfiguration // JoinConfiguration KubeletConfiguration
```

Как правило, диапазон `serviceSubnet` должен быть меньше, чем `podSubnet`.

`podSubnet: 10.66.0.0/16` означает максимум 65534 пода, то же самое для serviceSubnet.

### Тип высокой доступности (для production)

Высокая доступность характеризуется N etcd, kube-apiserver, kube-scheduler, kube-controller-manager, используя избыточность компонентов в качестве основы высокой доступности.


api-server использует балансировку нагрузки в качестве внешней точки входа.

[Настройка master](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

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
# Здесь настроен внутренний балансировщик нагрузки Alibaba Cloud в качестве точки входа, если у вас его нет, пожалуйста, проигнорируйте
# controlPlaneEndpoint: "172.18.221.7:6443"
networking:
# Планировать CIDR пода
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


### Тип с одним master (для экспериментов)

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
# Здесь настроен внутренний балансировщик нагрузки Alibaba Cloud в качестве точки входа, если у вас его нет, пожалуйста, проигнорируйте
# controlPlaneEndpoint: "172.18.221.7:6443"
imageRepository: gcr.azk8s.cn/google_containers
networking:
# Планировать CIDR пода
  podSubnet: 10.66.0.0/16
  serviceSubnet: 10.88.0.0/16
EOF

kubeadm config images pull --config=kubeadm-config.yaml
sudo kubeadm init --config=kubeadm-config.yaml --experimental-upload-certs
```

### Настроить клиент kubelet

```bash
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### [Настроить сетевой плагин](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)

Здесь я выбрал `quay.io/coreos/flannel:v0.11.0-amd64`, потому что архитектура относительно полная

### Добавить другие узлы master (версия высокой доступности)

В выводе `kubeadm init` есть строка:

```
[upload-certs] Using certificate key: 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```

Скопируйте ее, запустите команду на других masters:

```
kubeadm join 172.18.221.35:6443 \
--token 29ciq3.5mtkr4nzc11mlzd6 \
--discovery-token-ca-cert-hash sha256:03b46745a1f3887417270e33fc9b3fb5ddd82599f0d0ec789ed4edf2c310faae \
--experimental-control-plane \
--certificate-key 05ae8e3c139a960c6e4e01aebf26869ce5f9abd9fa5cf4ce347e8308b9c276f9
```





## Рабочие узлы присоединяются к кластеру

```bash
kubeadm join 172.18.221.35:6443 --token c63abt.45sn8bhyxxo2lh0r \
    --discovery-token-ca-cert-hash sha256:891e41e798c29f7235078479ca3e0622594c91db08160bea620f60fffcd558f5
```





## Заключительная работа


```
  ipvsadm -l
```


## Другие ссылки

### [kubelet-check] Initial timeout of 40s passed.

```
systemctl status kubelet
journalctl -xeu kubelet
```
Через любую из вышеуказанных команд видно, что хотя служба kubernetes запускается, она указывает, что узел не может быть найден.

```
May 20 14:55:22 xxx kubelet[3457]: E0520 14:55:22.095536    3457 kubelet.go:2244] node "xxx" not found
```

Наконец выяснилось, что в начале был указан балансировщик нагрузки, и тайм-аут подключения балансировщика нагрузки вызвал тайм-аут.

 --ignore-preflight-errors=all


### Примечания после изменения драйвера

Если docker был установлен ранее, просто измените конфигурацию и перезапустите службу.

Чтобы изменить на systemd, нужно добавить еще один параметр в службу kubelet, иначе служба не может запуститься.


```bash
vi /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```

```
# Перезапустить docker.
systemctl daemon-reload
systemctl restart docker
systemctl restart kubelet
```

### Master участвует в планировании

```bash
# Удалить taint master, чтобы позволить ему участвовать в планировании
kubectl taint $node --all node-role.kubernetes.io/master-
```

### Сброс


```bash
kubeadm reset
ipvsadm --clear
```

### Пересчитать discovery-token-ca-cert-hash

```
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
```


## todo

https://github.com/kubernetes/kubeadm/issues/1331

[Ротация сертификатов](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)

[setup-ha-etcd-with-kubeadm](https://kubernetes.io/docs/setup/independent/setup-ha-etcd-with-kubeadm/)

## Ссылки

1. [Обзор kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm/)
1. [Репозиторий зеркал Alibaba Cloud](https://opsx.alibaba.com/mirror/search?q=kubelet&lang=zh-CN)
2. [Официальное руководство по установке](https://kubernetes.io/docs/setup/independent/install-kubeadm/)
1. [Использование kubeadm для установки kubernetes](http://bazingafeng.com/2017/11/20/using-kubeadm-install-kubernetes/)
2. [centos7 Установить kubeadm](http://www.maogx.win/posts/15/)
3. [centos7 Использовать kubeadm для установки k8s-1.11 версии мульти-мастер высокой доступности](http://www.maogx.win/posts/33/)
4. [centos7 Использовать kubeadm для установки кластера k8s](http://www.maogx.win/posts/16/)
5. [Сводка исключений установки кластера kubernetes](https://juejin.im/post/5bbf7dd05188255c652d62fe)
6. [Справочное руководство по инструменту настройки kubeadm](https://k8smeetup.github.io/docs/admin/kubeadm/)
7. [ipvs](https://github.com/kubernetes/kubernetes/tree/master/pkg/proxy/ipvs)
