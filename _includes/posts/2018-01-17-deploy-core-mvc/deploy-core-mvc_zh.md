## 装软件
* .NET Core Windows Server 托管捆绑包

ASP.NET Core 模块是一个 IIS 7.5+ 模块，它负责 ASP.NET Core HTTP 侦听器的进程管理，并将请求代理到它所管理的进程。 目前，为 IIS 安装 ASP.NET Core 模块的过程为手动操作。 需要在常规（而不是 Nano）计算机上安装 [.NET Core Windows Server 托管捆绑包](https://aka.ms/dotnetcore-2-windowshosting)。

* 安装补丁

[Update for Universal C Runtime in Windows](https://support.microsoft.com/en-us/help/2999226/update-for-universal-c-runtime-in-windows)

* 其他配置

1. 环境变量ASPNETCORE_ENVIRONMENT，设置为Production，表示该服务器读取的是生产环境 appsettings.Development.json的配置
2. 


## 源代码发布
```
dotnet publish E:\xxx\project.csproj 
/p:PublishProfile="E:\xxx\Properties\PublœishProfiles\jenkins.pubxml" 
/p:Configuration=Release 
-o E:\jenkins 
-v detailed  
--force 
-c Release 
-r win8-x64

# 简化命令
# dotnet publish -c Release -r win8-x64 -o E:\jenkins 
```

## IIS配置
参考链接里面说的很清楚了，主要就是设置应用程序池为无托管代码即可，把编译出来的目录作为 web 目录就行了，出现问题的按Troubleshoot那个链接处理


## 参考链接:
1. [.NET Core RID 目录](https://docs.microsoft.com/zh-cn/dotnet/core/rid-catalog)
2. [Host ASP.NET Core on Windows with IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x)
3. [Amazing ASP.NET Core 2.0](http://www.cnblogs.com/savorboard/p/aspnetcore2-feature.html)
4. [使用 IIS 在 Windows 上托管 ASP.NET Core](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x#iis-configuration)
5. [dotnet 发布](https://docs.microsoft.com/zh-cn/dotnet/core/tools/dotnet-publish?tabs=netcore2x)
6. [ASP.NET Core Module configuration reference](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/aspnet-core-module#aspnet-core-module-with-an-iis-shared-configuration)
7. [Troubleshoot ASP.NET Core on IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/troubleshoot)
8. [Visual Studio publish profiles for ASP.NET Core app deployment](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/visual-studio-publish-profiles?tabs=aspnetcore2x)
9. [使用多个环境](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/environments)
10.