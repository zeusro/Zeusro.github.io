---
layout:       post
title:        "Github 加速"
subtitle:     ""
date:         2020-02-17
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - GitHub
    - git
---

最近因为疫情的问题，XXX 又拉起了遮羞布。

访问GitHub的时候人物头像不显示就算了，执行 `raw.githubusercontent.com`( GitHub 静态文件托管域名) 上面的远程代码直接爆 443 。搞得大家工作都不太方便。

于是我收集整理了目前现行的解决方案，试图从源头解决问题。

## 认识问题

### GitHub相关域名

**HOST 里的 IP 是错的，请勿直接复制粘贴！**

```host
# GitHub Start
192.30.253.112 github.com
192.30.253.119 gist.github.com
151.101.228.133 assets-cdn.github.com
151.101.228.133 raw.githubusercontent.com
151.101.228.133 gist.githubusercontent.com
151.101.228.133 cloud.githubusercontent.com
151.101.228.133 camo.githubusercontent.com
151.101.228.133 avatars0.githubusercontent.com
151.101.228.133 avatars1.githubusercontent.com
151.101.228.133 avatars2.githubusercontent.com
151.101.228.133 avatars3.githubusercontent.com
151.101.228.133 avatars4.githubusercontent.com
151.101.228.133 avatars5.githubusercontent.com
151.101.228.133 avatars6.githubusercontent.com
151.101.228.133 avatars7.githubusercontent.com
151.101.228.133 avatars8.githubusercontent.com
192.30.253.116  api.github.com
# GitHub End
```

### 问题根源

大规模 DNS挟持污染，解析到的日本IP 151.101.228.133 丢包严重

```bash
ping 151.101.228.133
......
--- 151.101.228.133 ping statistics ---
2661 packets transmitted, 2309 packets received, 13.2% packet loss
round-trip min/avg/max/stddev = 69.550/117.602/230.267/21.696 ms
```

## 代理方案

### 自行修改 pac 文件

#### 修改本地pac

由上可得出，GitHub 相关的域名有

```
github.com
*.github.com
*.githubusercontent.com
```

Windows 端的纸飞机 pac 是个本地文件；

mac 端的纸飞机 可以直接编辑，一行一个域名，原理都类似，不懂就复制粘贴 ~

[V2rayU](https://github.com/yanue/V2rayU) 同理

#### 更新本地 DNS 解析

```bash
#  MAC （OS X 10.11+ ）
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
# window
ipconfig /flushdns
```

### SwitchyOmega 自动切换模式 (适用于V2rayU)

用"PAC情景模式" 设置一个v2的情景模式

之后再设置自动切换模式并使用就好了

![img](/img/in-post/github/SwitchyOmega.png)


换用
[V2RayX](https://github.com/Cenmrev/V2RayX/releases)
的话就不用这么麻烦了，可以直接编辑pac，不过作者最近不怎么更新了。


## 无代理方案

### 修改 host

在
https://www.ipaddress.com/
找到 github.com 等域名的美国的IP，然后绑定HOST就行。
**这是一个体力活**。

国内的不一定准，但可供参考
1. https://tool.lu/dns/index.html
1. http://tool.chinaz.com/dns/

window 系统文件位置在 `C:/windows/system32/drivers/etc/hosts`

mac 系统文件位于 /etc/hosts

建议用 [SwitchHosts](https://github.com/oldj/SwitchHosts/releases)
管理 host 文件

进阶方案是写程序用调用web接口动态更新HOST

```host
# raw.githubusercontent.com 是 GitHub 的静态文件托管域名
199.232.28.133 raw.githubusercontent.com
```

我当时是急着用`raw.githubusercontent.com`上面的代码，所以我改成一个美国的IP，然后通过代理访问上了。

### Chrome浏览器插件

搜索安装 **GitHub加速** 即可，他们用一个中转的国内域名来 clone ，规避了 DNS解析的问题。

## git 加速

参考自[chuyik](https://gist.github.com/chuyik)的解决方案


### SSH协议使用 SSH 隧道进行代理（mac，Linux）

把自己的 ssh 加到海外的机器，xx.xx.xx.xx为机器的公网IP

然后把该机器的IP加到ssh配置 `~/.ssh/config` 里面

```
Host github.com raw.githubusercontent.com
    ProxyCommand  ssh root@xx.xx.xx.xx nc %h %p
```

之后把自己客户端的公钥加到远程GitHub，克隆仓库时用ssh协议才会生效

    git clone git@github.com:owner/git.git

### http(s)协议时用本地代理 + git config

```bash
#  走 HTTP 代理
git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"
# 走 socks5 代理（如 Shadowsocks）
git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"
# 取消设置
git config --global --unset http.proxy
git config --global --unset https.proxy
# 最后检查下配置
git config --list --global
git config --list --system
```

     git clone https://github.com/owner/git.git


## 终极解决方案

美国绿卡

![img](/img/逃.jpg)

最后多说一句，
[最近有人还原了s协议客户端的整个攻击过程](https://www.leadroyal.cn/?p=1036)

## 参考链接：
1. [修改Hosts临时解决GitHub的raw.githubusercontent.com无法链接的问题](https://www.ioiox.com/archives/62.html)
1. [解决Github国内访问出现的问题](http://rovo98.coding.me/posts/7e3029b3/)
1. [如何为 Git 设置代理？](https://segmentfault.com/q/1010000000118837)
1. [macOS 给 Git(Github) 设置代理（HTTP/SSH）](https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1)