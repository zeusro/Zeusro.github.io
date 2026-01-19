* [Preparation](#preparation)
* [Global Settings](#global-settings)
  * [Configure Git Plugin](#configure-git-plugin)
  * [Configure MSBuild Plugin](#configure-msbuild-plugin)
  * [Configure GitLab Plugin](#configure-gitlab-plugin)
* [Job Configuration](#job-configuration)
  * [SSH Issues](#ssh-issues)
  * [Source Code Management](#source-code-management)
  * [Triggers](#triggers)
  * [Build](#build)   
* [Lessons Learned](#lessons-learned)
* [Change Jenkins Directory](#change-jenkins-directory)
* [Some Configurations](#some-configurations)
* [Plugin Selection](#plugin-selection)
* [Exception Handling](#exception-handling)
  * [Anonymous Missing Overall/Administer Permission](#anonymous-missing-overalladminister-permission)
* [Reference Links](#reference-links)

![Image](/img/in-post/net-ci/ci_1.png)

## Preparation

After installation, remember to install MSBuild, GitLab, and GitLab-hook plugins.

On the server, you need to install the .NET environment and Git.

## Global Settings

- Git plugin

Just fill in any user name and email.

## Global Tool Configuration

I don't know when it started, but plugin settings moved to this location. You need to configure several things here:

- MSBuild

![Image](/img/in-post/net-ci/msbuild设置.png)

- Git

Mainly to set the Git executable file. Since I've added it to the PATH, I'll skip this.

## Credentials

The credential settings are quite unusual.

You need to click (global), then click "Add Credentials" in the popup.

## Job Configuration

- SSH Issues

We all know that every Windows command actually has a role attached to it. When I used Git before, I found that I had added an SSH private key to the server, but Git push failed. This was actually because the role we were using had issues.

Jenkins uses the **Local System account**. When connecting to our GitLab project using an SSH key, you need to copy the .ssh folder from your system user to the folder used by the Jenkins user.

But before that, you need to SSH (there's an exe in the Git installation directory) to our GitLab host:

```bash
ssh.exe -T git@192.1.1.123
```

After ensuring that known_hosts contains this host, copy the entire .ssh folder to **C:\Windows\SysWOW64\config\systemprofile** and **C:\Windows\System32\config\systemprofile**.

**Tip**

If you see "permission denied", add this command:

```bash
ssh-keygen -t rsa -C "robot233@robot.com"
```

Check which directory the known host was added to, then copy your generated key to the directory that caused the failure.

- Source Code Management

After installing the required plugins mentioned above, you can select Git in the source code section. I used SSH here, so the format is as shown in the image below:

![Image](/img/in-post/net-ci/job里面的git设置1.png)

**Important:**

Don't use the SSH from the computer user for this credential. We know that a GitLab only allows one SSH per machine, and the same SSH cannot be added to multiple accounts. This creates a problem: our build machine needs to connect to the source code project, so it needs an SSH key. However, for the compiled results, I use Git for directory synchronization in Windows, so I need another SSH to connect to my robot account. If these two SSH keys are the same, one step will fail.

The source browser actually jumps to our corresponding GitLab project, so use HTTP:

![Image](/img/in-post/net-ci/job里面的git设置2.png)

- Triggers

This is very important. After checking and selecting according to our needs:

![Image](/img/in-post/net-ci/job里面的git设置3.png)

Copy the URL after "Build when a change is pushed to GitLab. GitLab CI Service URL".

Go back to the corresponding GitLab project settings, fill in this URL in Settings → Web Hooks, check as needed, and add after confirming.

This way, when there are changes to the source code on our GitLab, it will trigger the web hook and tell our CI to get to work.

![Image](/img/in-post/net-ci/添加WebHook.png)

- MSBuild

Here you mainly need to learn MSBuild syntax. When I built this CI, my purpose was purely to compile websites. The following are commonly used and very easy to understand:

```text
/p:PublishProfile="F:xxxxx.pubxml"
/p:DeployOnBuild=true
/p:Configuration=Release
/p:VisualStudioVersion=12.0  
/property:TargetFrameworkVersion=v4.5
```

The pubxml file is generated when we choose to publish. You can check it yourself, and it's very easy to understand.

I recommend running MSBuild once on your development machine.

Generally, our MSBuild is located at **cd C:\Windows\Microsoft.NET\Framework64\v4.0.30319\**

Then:

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

My recommended configuration is:

```bash
/p:PublishProfile="C:\xxxxx.pubxml" \
/p:DeployOnBuild=true \
/p:Configuration=Release \
/p:VisualStudioVersion=12.0 \
/property:TargetFrameworkVersion=v4.5 \
/verbosity:n \
/maxcpucount:16
```

After compiling and deploying to the server, it should generally be fine.

But, I **had problems!!!!**

- NuGet Feed Issues

Because my project uses my private NuGet packages, which cannot be found in the official NuGet source, I need to configure my own feed on the CI server, just like in VS.

Find NuGet.Config in **C:\Windows\SysWOW64\config\systemprofile\AppData\Roaming\NuGet** and change it to:

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
    <add key="My Private Feed" value="D:\nuget" />     
  </packageSources>
  <activePackageSource>
    <add key="All" value="(Aggregate source)" />
  </activePackageSource>
</configuration>
```

- Build Failure Issues

This is unacceptable. It worked fine on my computer, but the server absolutely refused to compile. Later, I focused on checking third-party DLLs and my private NuGet packages in the program, and found that all errors were there. The reason I didn't notice on the development machine was because the NuGet dependencies on the development machine had local cache. The compilation directly skipped them. After 35 attempts, my program finally compiled successfully on CI.

- Git Permission Issues - Cannot Clone Project

This is a job configuration error. In the job's Git configuration, select "SSH Username with private key", directly enter the private key, and completely copy the content from ~/.ssh/id_rsa. This includes the meaningless separators at the beginning and end!

## Lessons Learned

- Don't use GitLab's **test hook**

At that time, my project had 2 branches. I wanted to generate from a specific branch, but I clicked the test hook. Damn it, the main branch content was all pulled over.

## Exception Handling

### Anonymous Missing Overall/Administer Permission

http://stackoverflow.com/questions/22833665/hudson-security-accessdeniedexception2-anonymous-is-missing-the-overall-admini

### Mistakenly Set Security Options Causing Unable to Log In

Modify:

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

```bash
cd jenkins directory
# Restart
jenkins restart   # Forces
```

## Change Jenkins Directory

> Stop Jenkins service

> Move C:\Users\Coola\.jenkins folder to d:\Jenkins

> Using regedit, change HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Jenkins\ImagePath to "d:\Jenkins\jenkins.exe"

> Start service

## Some Configurations

- This permission corresponds to "Any user can do anything (no restrictions)"

```xml
<authorizationStrategy class="hudson.security.AuthorizationStrategy$Unsecured"/>
```

- This permission corresponds to "Logged-in users can do anything"

```xml
<authorizationStrategy class="hudson.security.FullControlOnceLoggedInAuthorizationStrategy"/>
```

## Plugin Selection

| Plugin Name      | Purpose                          | Introduction URL                                                      |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------- |
| proxy            | Proxy                            |                                                                        |
| gitlab           | For GitLab integration           | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Plugin            |
| publish-over-ssh | Connect to other Linux machines via SSH |                                                                        |
| Mercurial        | Build tool                       | https://wiki.jenkins-ci.org/display/JENKINS/Mercurial+Plugin          |
| gitlab-hook      | Enables Gitlab web hooks to be used to trigger SMC polling on Gitlab projects | https://wiki.jenkins-ci.org/display/JENKINS/GitLab+Hook+Plugin |

## Reference Links

1. [Disable Security](https://wiki.jenkins-ci.org/display/JENKINS/Disable+security)
2. [Configure Permissions](http://www.cnblogs.com/zz0412/p/jenkins_jj_14.html)
3. [Building CI with GitLab + Jenkins](http://zipperary.com/2015/07/10/%E7%94%A8-gitlab-+-jenkins-%E6%90%AD%E5%BB%BA-ci/?utm_source=tuicool&utm_medium=referral)
4. [Jenkins .NET Automatic Build Test and Release Environment](http://blog.csdn.net/wangjia184/article/details/18365553)
5. [Building Continuous Integration (CI) Environment with Jenkins+Gitlab](http://hyhx2008.github.io/li-yong-jenkinsgitlabda-jian-chi-xu-ji-cheng-cihuan-jing.html)
6. [Building Continuous Integration Environment with MSBuild and Jenkins (1)](http://www.infoq.com/cn/articles/MSBuild-1)
7. [Building Continuous Integration Environment with MSBuild and Jenkins (2)](http://www.infoq.com/cn/articles/MSBuild-2)
8. [Jenkins Advanced Series](http://www.cnblogs.com/zz0412/tag/jenkins/)
9. [Jenkins CI integration](http://doc.gitlab.com/ee/integration/jenkins.html)
10. [GitLab Documentation](http://doc.gitlab.com/ce/ci/quick_start/README.html)
11. [Configuring your repo for Jenkins CI](https://github.com/dotnet/dotnet-ci/blob/master/docs/CI-SETUP.md)
12. [Jenkins git clone via SSH on Windows 7 x64](http://computercamp-cdwilson-us.tumblr.com/post/48589650930/jenkins-git-clone-via-ssh-on-windows-7-x64)
13. [Building Continuous Integration Service with Jenkins](http://chenpeng.info/html/3081?utm_source=tuicool)
14. [Hosting Your Own NuGet Feeds](https://docs.nuget.org/create/hosting-your-own-nuget-feeds)
15. [Using MSBuild.exe to "Publish" a ASP.NET MVC 4 project with the cmd line](http://stackoverflow.com/questions/13920146/using-msbuild-exe-to-publish-a-asp-net-mvc-4-project-with-the-cmd-line)
16. [Project Development Environment Setup Notes (5. Jenkins Setup)](http://blog.csdn.net/fbysss/article/details/44087185)
17. [MSBuild DeployOnBuild=true not publishing](http://stackoverflow.com/questions/4962705/msbuild-deployonbuild-true-not-publishing)
18. [How to change Jenkins default folder on Windows](http://stackoverflow.com/questions/12689139/how-to-change-jenkins-default-folder-on-windows)
19. [Jenkins Environment Variables](https://wiki.jenkins-ci.org/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-JenkinsSetEnvironmentVariables)
