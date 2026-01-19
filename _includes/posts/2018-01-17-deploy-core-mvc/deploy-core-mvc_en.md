## Install Software
* .NET Core Windows Server Hosting Bundle

The ASP.NET Core module is an IIS 7.5+ module that handles process management for the ASP.NET Core HTTP listener and proxies requests to the processes it manages. Currently, installing the ASP.NET Core module for IIS is a manual process. You need to install the [.NET Core Windows Server Hosting Bundle](https://aka.ms/dotnetcore-2-windowshosting) on a regular (not Nano) computer.

* Install Patches

[Update for Universal C Runtime in Windows](https://support.microsoft.com/en-us/help/2999226/update-for-universal-c-runtime-in-windows)

* Other Configuration

1. Environment variable ASPNETCORE_ENVIRONMENT, set to Production, indicating that the server reads the production environment configuration from appsettings.Development.json
2. 

## Source Code Publishing
```
dotnet publish E:\xxx\project.csproj 
/p:PublishProfile="E:\xxx\Properties\PublœishProfiles\jenkins.pubxml" 
/p:Configuration=Release 
-o E:\jenkins 
-v detailed  
--force 
-c Release 
-r win8-x64

# Simplified command
# dotnet publish -c Release -r win8-x64 -o E:\jenkins 
```

## IIS Configuration
The reference links explain it very clearly. The main thing is to set the application pool to "No Managed Code", and use the compiled directory as the web directory. If problems occur, refer to the Troubleshoot link for handling.

## Reference Links:
1. [.NET Core RID Catalog](https://docs.microsoft.com/zh-cn/dotnet/core/rid-catalog)
2. [Host ASP.NET Core on Windows with IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x)
3. [Amazing ASP.NET Core 2.0](http://www.cnblogs.com/savorboard/p/aspnetcore2-feature.html)
4. [Host ASP.NET Core on Windows with IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/index?tabs=aspnetcore2x#iis-configuration)
5. [dotnet publish](https://docs.microsoft.com/zh-cn/dotnet/core/tools/dotnet-publish?tabs=netcore2x)
6. [ASP.NET Core Module configuration reference](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/aspnet-core-module#aspnet-core-module-with-an-iis-shared-configuration)
7. [Troubleshoot ASP.NET Core on IIS](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/iis/troubleshoot)
8. [Visual Studio publish profiles for ASP.NET Core app deployment](https://docs.microsoft.com/zh-cn/aspnet/core/host-and-deploy/visual-studio-publish-profiles?tabs=aspnetcore2x)
9. [Use multiple environments](https://docs.microsoft.com/zh-cn/aspnet/core/fundamentals/environments)
10.
