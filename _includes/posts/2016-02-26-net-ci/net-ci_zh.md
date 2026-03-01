* [准备工作](#准备工作)
* [全局设置](#全局设置)
  * [配置git插件](#配置git插件)
  * [配置MSBuild插件](#配置MSBuild插件)
  * [配置gitlab插件](#配置gitlab插件)
* [Job的配置](#Job的配置)
  * [SSH的问题](#SSH的问题)
  * [源码管理](#源码管理)
  * [触发器](#触发器)
  * [构建](#构建)   
* [血泪教训](#血泪教训)
* [更改Jenkins目录](#更改Jenkins目录)
* [一些配置](#一些配置)
* [插件选用](#插件选用)
* [异常处理](#异常处理)
  * [误设置了安全选项导致无法登录进去](#误设置了安全选项导致无法登录进去)
* [参考链接](#参考链接)

![Image](/img/in-post/net-ci/ci_1.png)

## 准备工作

安装之后记得安装MSbuild,gitlab,gitlab-hook插件 

服务器上面，需要安装.net环境，git

## 全局设置

- Git plugin

瞎填一个user name和email就行

## Global Tool Configuration

不知道什么时候开始，插件的设置移动到了这个地方，这里需要设置几个地方

- MSBuild

![Image](/img/in-post/net-ci/msbuild设置.png)

- Git

主要是设置git的可执行文件，由于我有加到path上，所以忽略

## Credentials

证书的设置比较奇葩

需要点击(global)，然后在弹出的内容里面点击add Credentials

## Job的配置

- SSH的问题

我们都知道每一个Windows命令其实有着角色附在上面的。以前用git的时候，发现自己是有加ssh私钥到服务器上面的，但是git push失败，那也其实就是因为我们用的角色有问题。

Jenkins用的是**Local System account**.在用ssh key连接我们gitlab上面的项目时，要把我们系统用户上面的.ssh复制到Jenkins使用的用户用的文件夹。

但是在这之前。需要ssh(在git的安装目录里面有这个exe)一下我们的gitlab主机

```bash
ssh.exe -T git@192.1.1.123
```

确保known_hosts里面有了这个主机后，把整个.ssh文件夹复制到**C:\Windows\SysWOW64\config\systemprofile**，以及**C:\Windows\System32\config\systemprofile**这个目录

**小技巧**

看到permission denied的话，加多一句

```bash
ssh-keygen -t rsa -C "robot233@robot.com"
```

看一下know host加到哪个目录，然后把自己生成的丢过去这个导致失败的目录就行。

- 源码管理

在安装了上文提到的必备插件之后，源码里面就可以选择git，这里面我用了ssh，所以是下图这种格式

![Image](/img/in-post/net-ci/job里面的git设置1.png)

**重点:**

这个证书别用计算机用户那个SSH.我们知道，一个gitlab只允许一台机子一个ssh，同一个ssh不能添加到多个账户。这样就会有一个问题。我们这台编译机要连源码的项目，于是需要一个ssh key.但是它编译后的结果，在Windows中我是用git去做目录同步的，于是需要另外一个ssh 去连我的机器人账户，这2个ssh key一样的话，将会导致一个步骤失败。

源码浏览器，其实是跳到我们的gitlab对应项目上，所以用http

![Image](/img/in-post/net-ci/job里面的git设置2.png)

- 触发器

这个很重要。我们根据自己的需要打勾以及选择之后

![Image](/img/in-post/net-ci/job里面的git设置3.png)

复制Build when a change is pushed to GitLab. GitLab CI Service URL后面的url.

回到这个项目对应gitlab项目设置，在setting→_→web hooks里面填上这个URL，并按需要打勾，确认无误后添加。

这样当我们gitlab上面的源码有变动时，就会触发web hook.告诉我们的CI该干活了。

![Image](/img/in-post/net-ci/添加WebHook.png)

- MSBuild

这里主要需要学习MSBuild的文法。当初我建这个CI的目的。纯粹是为了编译网站。下面这个几个就是常用的，非常容易理解。 

```text
/p:PublishProfile="F:xxxxx.pubxml"
/p:DeployOnBuild=true
/p:Configuration=Release
/p:VisualStudioVersion=12.0  
/property:TargetFrameworkVersion=v4.5
```

pubxml文件在我们选择发布时就会生成一个。这个自己看，也非常容易理解。

我建议在自己开发的机器msbuild一遍。

一般来讲。我们的msbuild位于**cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\**

然后

```bash
cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\
MSBuild.exe "C:\xxxxx.sln" \
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/t:Rebuild \
/maxcpucount:16
```

我个人推荐的配置是

```bash
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/maxcpucount:16
```

通过编译后上服务器一遍来说没问题

但是，我特么就是**有问题啊！！！！**

- nuget feed的问题

因为我项目里面用了我私有的nuget包，这个包在nuget的官方源头是找不到的。所以我需要像在VS那样，在CI server上面配置自己的feed

在**C:\Windows\SysWOW64\config\systemprofile\AppData\Roaming\NuGet**中找到NuGet.Config，改为

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageRestore>
    <add key="enabled" value="True" />
    <add key="automatic" value="True" />
  </packageRestore>
  <bindingRedirects>
    <add key="skip" value="False" />
  </bindingRedirects>
  <packageSources>
    <add key="nuget.org" value="https://www.nuget.org/api/v2/" />
    <add key="我的后宫" value="D:\nuget" />     
  </packageSources>
  <activePackageSource>
    <add key="All" value="(Aggregate source)" />
  </activePackageSource>
</configuration>
```

- 编译失败问题

这个不能忍了。妹的在我的电脑一点问题都没有，在server上死活不给编译过去。后来重点排查了程序中的第三方dll和我的后宫nuget包，发现错误都出在那里。之所以在开发机上面没有发觉，是因为开发机上面的nuget依赖有本地缓存。编译的时候直接跳过去了。于是历经了35次后，本宝宝的程序终于在CI上面编译成功

- git没有权限clone不了项目的问题

这个是job的配置出错.job的git配置里面，选择SSH Username with private key，直接输入私钥，要完整复制 ~/.ssh/id_isa里面的内容。即是包括首尾那个没有意义的分割符！

## 血泪教训

- 不要使用gitlab的**test hook**

当时我项目有2个分支，我要生成的是某个分支的，但是点了一下test hook.我擦，主分支的东西都被拉过去了。

## 异常处理

### anonymous没有Overall/Administer权限

http://stackoverflow.com/questions/22833665/hudson-security-accessdeniedexception2-anonymous-is-missing-the-overall-admini

### 误设置了安全选项导致无法登录进去

修改

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

```bash
cd jenkins目录
# 重启
jenkins restart   # Forces
```

## 更改Jenkins目录

> Stop Jenkins service

> Move C:\Users\Coola\.jenkins folder to d:\Jenkins

> Using regedit, change HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Jenkins\ImagePath to "d:\Jenkins\jenkins.exe"

> Start service

## 一些配置 

- 这个权限对应“任何用户可以做任何事(没有任何限制)”

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

- 这个权限对应“登录用户可以做任何事”

```xml
<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy"/>
```

## 插件选用

| 插件名          | 用途                 | 介绍url                                                      |
| --------------- | -------------------- | ------------------------------------------------------------ |
| proxy           | 代理                 |                                                              |
| gitlab          | 用于与gitlab集成     | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Plugin    |
| publish-over-ssh | 通过ssh连接其他Linux机器 |                                                              |
| Mercurial       | 构建工具             | https://wiki.jenkins-ci.org/display/JENKINS/Mercurial+Plugin |
| gitlab-hook     | Enables Gitlab web hooks to be used to trigger SMC polling on Gitlab projects | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Hook+Plugin |

## 参考链接

1. [取消安全选项](https://wiki.jenkins-ci.org/display/JENKINS/Disable+security)
2. [配置权限](http://www.cnblogs.com/zz0412/p/jenkins_jj_14.html)
3. [用 GitLab + Jenkins 搭建 CI](http://zipperary.com/2015/07/10/%E7%94%A8-gitlab-+-jenkins-%E6%90%AD%E5%BB%BA-ci/?utm_source=tuicool&utm_medium=referral)
4. [Jenkins搭建.NET自动编译测试与发布环境](http://blog.csdn.net/wangjia184/article/details/18365553)
5. [利用Jenkins+Gitlab搭建持续集成(CI)环境](http://hyhx2008.github.io/li-yong-jenkinsgitlabda-jian-chi-xu-ji-cheng-cihuan-jing.html)
6. [用MSBuild和Jenkins搭建持续集成环境（1）](http://www.infoq.com/cn/articles/MSBuild-1)
7. [用MSBuild和Jenkins搭建持续集成环境（2）](http://www.infoq.com/cn/articles/MSBuild-2)
8. [Jenkins进阶系列](http://www.cnblogs.com/zz0412/tag/jenkins/)
9. [Jenkins CI integration](http://doc.gitlab.com/ee/integration/jenkins.html)
10. [GitLab Documentation](http://doc.gitlab.com/ce/ci/quick_start/README.html)
11. [Configuring your repo for Jenkins CI](https://github.com/dotnet/dotnet-ci/blob/master/docs/CI-SETUP.md)
12. [Jenkins git clone via SSH on Windows 7 x64](http://computercamp-cdwilson-us.tumblr.com/post/48589650930/jenkins-git-clone-via-ssh-on-windows-7-x64)
13. [使用Jenkins搭建持续集成服务](http://chenpeng.info/html/3081?utm_source=tuicool)
14. [Hosting Your Own NuGet Feeds](https://docs.nuget.org/create/hosting-your-own-nuget-feeds)
15. [Using MSBuild.exe to “Publish” a ASP.NET MVC 4 project with the cmd line](http://stackoverflow.com/questions/13920146/using-msbuild-exe-to-publish-a-asp-net-mvc-4-project-with-the-cmd-line)
16. [项目开发环境搭建手记（5.Jenkins搭建）](http://blog.csdn.net/fbysss/article/details/44087185)
17. [MSBuild DeployOnBuild=true not publishing](http://stackoverflow.com/questions/4962705/msbuild-deployonbuild-true-not-publishing)
18. [How to change Jenkins default folder on Windows](http://stackoverflow.com/questions/12689139/how-to-change-jenkins-default-folder-on-windows)
19. [Jenkins环境变量](https://wiki.jenkins-ci.org/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-JenkinsSetEnvironmentVariables)