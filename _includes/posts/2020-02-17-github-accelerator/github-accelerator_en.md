Recently due to the epidemic, when accessing GitHub, not only are user avatars not displaying, but executing code from `raw.githubusercontent.com` (GitHub static file hosting domain) directly explodes with 443. This makes everyone's work quite inconvenient.

So I collected and organized the current solutions, trying to solve the problem from the source.

## Understanding the Problem

### GitHub-Related Domains

**The IPs in HOST are wrong, please do not copy and paste directly!**

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

### Root Cause

Large-scale DNS hijacking pollution, the resolved Japanese IP 151.101.228.133 has severe packet loss.

```bash
ping 151.101.228.133
......
--- 151.101.228.133 ping statistics ---
2661 packets transmitted, 2309 packets received, 13.2% packet loss
round-trip min/avg/max/stddev = 69.550/117.602/230.267/21.696 ms
```

## Proxy Solutions

### Modify PAC File Yourself

#### Modify Local PAC

From the above, GitHub-related domains are:

```
github.com
*.github.com
*.githubusercontent.com
```

Windows-side Paper Airplane PAC is a local file;

mac-side Paper Airplane can be directly edited, one domain per line, the principle is similar, if you don't understand just copy and paste ~

[V2rayU](https://github.com/yanue/V2rayU) is the same

#### Update Local DNS Resolution

```bash
# MAC (OS X 10.11+ )
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
# window
ipconfig /flushdns
```

### SwitchyOmega Auto Switch Mode (Applicable to V2rayU)

Use "PAC scenario mode" to set up a v2 scenario mode.

Then set auto switch mode and use it.

![img](/img/in-post/github/SwitchyOmega.png)


If you switch to
[V2RayX](https://github.com/Cenmrev/V2RayX/releases)
, you don't need to be so troublesome, you can directly edit the pac, but the author hasn't updated much recently.


## No-Proxy Solutions

### Modify host

At
https://www.ipaddress.com/
find the US IPs for github.com and other domains, then bind them to HOST.
**This is manual labor**.

Domestic ones may not be accurate, but can be used as reference:
1. https://tool.lu/dns/index.html
1. http://tool.chinaz.com/dns/

Windows system file location is `C:/windows/system32/drivers/etc/hosts`

mac system file is located at /etc/hosts

It's recommended to use [SwitchHosts](https://github.com/oldj/SwitchHosts/releases)
to manage host files

Advanced solution is to write a program to dynamically update HOST by calling web interfaces.

```host
# raw.githubusercontent.com is GitHub's static file hosting domain
199.232.28.133 raw.githubusercontent.com
```

I was in a hurry to use code from `raw.githubusercontent.com`, so I changed it to a US IP, then accessed it through a proxy.

### Chrome Browser Extension

Search and install **GitHub Accelerator** and you're done. They use a relayed domestic domain to clone, avoiding the DNS resolution problem.

## git Acceleration

Referenced from [chuyik](https://gist.github.com/chuyik)'s solution


### SSH Protocol Using SSH Tunnel for Proxy (mac, Linux)

Add your ssh to an overseas machine, xx.xx.xx.xx is the machine's public IP.

Then add the machine's IP to ssh config `~/.ssh/config`:

```
Host github.com raw.githubusercontent.com
    ProxyCommand  ssh root@xx.xx.xx.xx nc %h %p
```

After that, add your client's public key to remote GitHub. It will only take effect when cloning repositories using ssh protocol.

    git clone git@github.com:owner/git.git

### http(s) Protocol Using Local Proxy + git config

```bash
# Use HTTP proxy
git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"
# Use socks5 proxy (like Shadowsocks)
git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"
# Cancel settings
git config --global --unset http.proxy
git config --global --unset https.proxy
# Finally check the configuration
git config --list --global
git config --list --system
```

     git clone https://github.com/owner/git.git

## ssh over flclash

Write this in your SSH config (~/.ssh/config):

```
Host github.com
    HostName ssh.github.com
    Port 443
    User git
    # If you use socks5 proxy
    ProxyCommand nc -x 127.0.0.1:7890 %h %p
```

Here ssh.github.com is GitHub's SSH-over-443 address.  ￼

nc -x host:port %h %p uses nc (netcat) to forward SSH through SOCKS5 proxy. -x specifies proxy type (socks), change according to your flclash local proxy port. SSH Config's ProxyCommand can make SSH traffic go through proxy.  ￼

ServerAliveInterval and other parameters can also be added to prevent connection idle interruption.

```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
ssh ssh.github.com
Please type 'yes', 'no' or the fingerprint: yes
Warning: Permanently added '[ssh.github.com]:443' (ED25519) to the list of known hosts.
```

To avoid blocking SSH port 22, GitHub additionally provides an SSH service on port 443, so its public key fingerprint is also different.
After entering yes, git push will no longer have disconnection issues.

## Ultimate Solution

US Green Card

![img](/img/逃.jpg)

One last word,
[Recently someone restored the entire attack process of ss protocol client](https://www.leadroyal.cn/?p=1036)

## Reference Links

1. [Modify Hosts to Temporarily Solve GitHub's raw.githubusercontent.com Connection Problem](https://www.ioiox.com/archives/62.html)
1. [Solving Problems with GitHub Access in China](http://rovo98.coding.me/posts/7e3029b3/)
1. [How to Set Proxy for Git?](https://segmentfault.com/q/1010000000118837)
1. [macOS Set Proxy (HTTP/SSH) for Git(Github)](https://gist.github.com/chuyik/02d0d37a49edc162546441092efae6a1)
