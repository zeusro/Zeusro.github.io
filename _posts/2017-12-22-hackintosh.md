---
layout:       post
title:        "安装黑苹果"
subtitle:     ""
date:         2017-12-22
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
published:    false
tags:
    - mac
---


1. [安装过程](#安装过程)
1. [吐槽](#吐槽)
1. [附transMac基本教程(搬运自知乎)](#附transMac基本教程(搬运自知乎))
1. [我的电脑配置](#我的电脑配置)
1. [我自己用的config.plist](#我自己用的config.plist)
1. [其他](#其他)
    1. [学习黑苹果需要的软件](#学习黑苹果需要的软件)
1. [参考链接](#参考链接)

## 安装过程

1. 下载专用镜像[【黑果小兵】macOS High Sierra 10.13.2(17C88)正式版 with Clover 4333原版镜像](https://pan.baidu.com/s/1i5hBZDV)
1. 使用transMAC将镜像烧录进 USB3.0高速U盘
1. 开机,进入BIOS设置,参考[Install macOS High Sierra on Any Supported Intel-based PC](https://www.tonymacx86.com/threads/unibeast-install-macos-high-sierra-on-any-supported-intel-based-pc.235474/) 主要就是关闭快速启动,启动 UEFI 之类的
1. 保存后进入UEFI的U盘,图形设置那里的选项全部不勾选
1. 然后按 esc, 空格,打上日志模式,使用英伟达 web driver
1. 先做好磁盘,进入实用工具,把系统盘做成 guid 格式,然后退出来,往里面装系统
1. 系统装完重启,重新进入 UEFI 的 U盘,通过 U盘选第二个还是第三个图标,有个boot mac 的,此时再安装一遍,成功后自动重启
1. 再次选择 U盘引导,进入系统后安装cover configurator,通过 Mount EFI挂载 U盘,把 U盘上面所有数据丢到系统盘根目录
1. 适当调整一下 config.plist
![image](/img/in-post/hackintosh/QQ20171223-122416.png)


## 吐槽
    原先电脑的显卡是AMD RADEON HD 6450 (1024MB),这个折腾不了,我宣布放弃


## 附transMac基本教程(搬运自知乎)

一、准备工具和镜像包硬件;win的电脑，win7&win8都可以，一个高速USB3.0的U盘。

WINDOWS下的dmg镜像恢复工具TransMac 10.4（内附注册码）: 密码，rvrk链接：[osx OS X Mavericks，10.9.4&10.10.3](http://pan.baidu.com/s/1hslubVQ) 

二、制作过程：非常简单，就是把Install OS X Mavericks_10.9.4.dmg镜像恢复一下。
1. WINDOWS环境下恢复：（请预先安装好TransMac并输入注册码）
    1. 插入U盘或其它存储介质；
    1. 以管理员身份运行TransMac：
![image](/img/in-post/hackintosh/974009b4f9be6b684a15954e42cb4ddc_hd.jpg)
    1. 在左侧的设备列表中右键点击你的U盘，点击右键菜单中的Restore with Disk Image：
![image](/img/in-post/hackintosh/6a4db79c961adec04cc264a934acb06a_hd.jpg)
    1.  在弹出的对话框中，找到下载好的dmg镜像，点击打开：
    1. 提醒你准备格式化U盘并恢复磁盘镜像文件。格式化会删除所有数据。点击OK继续：
![image](/img/in-post/hackintosh/84720385a7e47c3794b00636cd4b72f4_hd.jpg)
    1. 正在写入镜像。大概要十几、二十几分钟，视你的系统和设备而定：
![image](/img/in-post/hackintosh/0517aee28ae707d41ddc6623c93b157b_hd.jpg)


## 我的电脑配置

```
电脑型号  技嘉 To be filled by O.E.M.
操作系统  Microsoft Windows 10 专业版 (64位)
CPU  (英特尔)Intœel(R) Xeon(R) CPU E3-1230 V2 @ 3.30GHz(3300 Mhz)
主板  技嘉 B75M-D3V
内存  8.00 GB (   1600 MHz)
主硬盘  120 GB (  26NB32D1K1AU 已使用时间: 1644小时)
显卡  英伟达 GT 730
显示器1  冠捷 2477W1M 32位真彩色 60Hz
显示器2  冠捷 2477W1M 32位真彩色 60Hz

声卡  Realtek High Definition Audio
內建Realtek ALC887晶片
支援High Definition Audio

网卡  Realtek PCIe GBE Family Controller
Rev 1.1的是：Realtek 8111F LAN晶片(10/100/1000 Mbit)
```


## 我自己用的config.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>ACPI</key>
	<dict>
		<key>#Comment-SortedOrder</key>
		<string>SortedOrder may be required if you have patched SSDTs in ACPI/patched</string>
		<key>#SortedOrder</key>
		<array>
			<string>SSDT.aml</string>
			<string>SSDT-0.aml</string>
			<string>SSDT-1.aml</string>
			<string>SSDT-2.aml</string>
			<string>SSDT-3.aml</string>
			<string>SSDT-4.aml</string>
			<string>SSDT-5.aml</string>
			<string>SSDT-6.aml</string>
			<string>SSDT-7.aml</string>
			<string>SSDT-8.aml</string>
			<string>SSDT-9.aml</string>
			<string>SSDT-10.aml</string>
			<string>SSDT-11.aml</string>
			<string>SSDT-12.aml</string>
			<string>SSDT-13.aml</string>
			<string>SSDT-14.aml</string>
			<string>SSDT-15.aml</string>
			<string>SSDT-16.aml</string>
			<string>SSDT-17.aml</string>
			<string>SSDT-18.aml</string>
			<string>SSDT-19.aml</string>
			<string>SSDT-XOSI.aml</string>
			<string>SSDT-LPC.aml</string>
			<string>SSDT-UIAC.aml</string>
			<string>SSDT-PNLF.aml</string>
		</array>
		<key>AutoMerge</key>
		<true/>
		<key>DSDT</key>
		<dict>
			<key>Fixes</key>
			<dict>
				<key>#Comment-IRQ Fix</key>
				<string>The following fixes may be needed for onboard audio/USB/etc</string>
				<key>FixHeaders</key>
				<true/>
			</dict>
			<key>Patches</key>
			<array>
				<dict>
					<key>Comment</key>
					<string>change OSID to XSID (to avoid match against _OSI XOSI patch)</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					T1NJRA==
					</data>
					<key>Replace</key>
					<data>
					WFNJRA==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change _OSI to XOSI</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					X09TSQ==
					</data>
					<key>Replace</key>
					<data>
					WE9TSQ==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change _DSM to XDSM</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					X0RTTQ==
					</data>
					<key>Replace</key>
					<data>
					WERTTQ==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change EC0 to EC</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					RUMwXw==
					</data>
					<key>Replace</key>
					<data>
					RUNfXw==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change H_EC to EC</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					SF9FQw==
					</data>
					<key>Replace</key>
					<data>
					RUNfXw==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change ECDV to EC</string>
					<key>Disabled</key>
					<true/>
					<key>Find</key>
					<data>
					RUNEVg==
					</data>
					<key>Replace</key>
					<data>
					RUNfXw==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change HDAS to HDEF</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					SERBUw==
					</data>
					<key>Replace</key>
					<data>
					SERFRg==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change HECI to IMEI</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					SEVDSQ==
					</data>
					<key>Replace</key>
					<data>
					SU1FSQ==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change MEI to IMEI</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					TUVJXw==
					</data>
					<key>Replace</key>
					<data>
					SU1FSQ==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change GFX0 to IGPU</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					R0ZYMA==
					</data>
					<key>Replace</key>
					<data>
					SUdQVQ==
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change PCI0.VID to IGPU #1 (Thinkpad)</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					UENJMFZJRF8=
					</data>
					<key>Replace</key>
					<data>
					UENJMElHUFU=
					</data>
				</dict>
				<dict>
					<key>Comment</key>
					<string>change PCI0.VID to IGPU #2 (Thinkpad)</string>
					<key>Disabled</key>
					<false/>
					<key>Find</key>
					<data>
					VklEXwhfQURSDAAAAgA=
					</data>
					<key>Replace</key>
					<data>
					SUdQVQhfQURSDAAAAgA=
					</data>
				</dict>
			</array>
		</dict>
		<key>DropTables</key>
		<array>
			<dict>
				<key>Signature</key>
				<string>#MCFG</string>
			</dict>
			<dict>
				<key>Signature</key>
				<string>DMAR</string>
			</dict>
			<dict>
				<key>Signature</key>
				<string>SSDT</string>
				<key>TableId</key>
				<string>xh_rvp10</string>
			</dict>
		</array>
		<key>SSDT</key>
		<dict>
			<key>DropOem</key>
			<false/>
			<key>Generate</key>
			<dict>
				<key>PluginType</key>
				<true/>
			</dict>
			<key>NoDynamicExtract</key>
			<true/>
			<key>NoOemTableId</key>
			<true/>
		</dict>
	</dict>
	<key>Boot</key>
	<dict>
		<key>Arguments</key>
		<string>-v dart=0 kext-dev-mode=1</string>
		<key>DefaultVolume</key>
		<string>LastBootedVolume</string>
		<key>NeverHibernate</key>
		<true/>
		<key>Secure</key>
		<false/>
		<key>Timeout</key>
		<integer>5</integer>
		<key>XMPDetection</key>
		<false/>
	</dict>
	<key>CPU</key>
	<dict>
		<key>UseARTFrequency</key>
		<false/>
	</dict>
	<key>Devices</key>
	<dict>
		<key>#AddProperties</key>
		<array>
			<dict>
				<key>Comment</key>
				<string>hda-gfx=onboard-1 for HDMI audio</string>
				<key>Device</key>
				<string>IntelGFX</string>
				<key>Key</key>
				<string>hda-gfx</string>
				<key>Value</key>
				<data>
				b25ib2FyZC0xAA==
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>hda-gfx=onboard-1 for HDMI audio</string>
				<key>Device</key>
				<string>HDA</string>
				<key>Key</key>
				<string>hda-gfx</string>
				<key>Value</key>
				<data>
				b25ib2FyZC0xAA==
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>layout-id=3</string>
				<key>Device</key>
				<string>HDA</string>
				<key>Key</key>
				<string>layout-id</string>
				<key>Value</key>
				<data>
				AwAAAA==
				</data>
			</dict>
			<dict>
				<key>Device</key>
				<string>HDA</string>
				<key>Key</key>
				<string>PinConfigurations</string>
				<key>Value</key>
				<data>
				</data>
			</dict>
		</array>
		<key>AddProperties</key>
		<array>
			<dict>
				<key>Comment</key>
				<string>Inject "name" as (data)"#display" to disable graphics drivers on NVidia</string>
				<key>Device</key>
				<string>NVidia</string>
				<key>Disabled</key>
				<false/>
				<key>Key</key>
				<string>name</string>
				<key>Value</key>
				<data>
				I2Rpc3BsYXkA
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>Inject "IOName" as "#display" to disable graphics drivers on NVidia</string>
				<key>Device</key>
				<string>NVidia</string>
				<key>Disabled</key>
				<false/>
				<key>Key</key>
				<string>IOName</string>
				<key>Value</key>
				<string>#display</string>
			</dict>
			<dict>
				<key>Comment</key>
				<string>Inject bogus class-code to prevent graphics drivers loading for NVidia</string>
				<key>Device</key>
				<string>NVidia</string>
				<key>Disabled</key>
				<false/>
				<key>Key</key>
				<string>class-code</string>
				<key>Value</key>
				<data>
				/////w==
				</data>
			</dict>
		</array>
		<key>Audio</key>
		<dict>
			<key>Inject</key>
			<integer>0</integer>
		</dict>
		<key>USB</key>
		<dict>
			<key>AddClockID</key>
			<true/>
			<key>FixOwnership</key>
			<true/>
			<key>Inject</key>
			<true/>
		</dict>
	</dict>
	<key>DisableDrivers</key>
	<array>
		<string>VBoxHfs</string>
	</array>
	<key>GUI</key>
	<dict>
		<key>#ScreenResolution</key>
		<string>1920x1080</string>
		<key>Custom</key>
		<dict>
			<key>Entries</key>
			<array>
				<dict>
					<key>Disabled</key>
					<false/>
					<key>Hidden</key>
					<false/>
					<key>Ignore</key>
					<false/>
					<key>NoCaches</key>
					<false/>
					<key>Type</key>
					<string>OSXRecovery</string>
				</dict>
				<dict>
					<key>Disabled</key>
					<false/>
					<key>Ignore</key>
					<false/>
					<key>Title</key>
					<string>Windows</string>
					<key>Type</key>
					<string>Windows</string>
				</dict>
			</array>
		</dict>
		<key>Hide</key>
		<array>
			<string>Preboot</string>
		</array>
		<key>Mouse</key>
		<dict>
			<key>Enabled</key>
			<false/>
		</dict>
		<key>Scan</key>
		<dict>
			<key>Entries</key>
			<true/>
			<key>Legacy</key>
			<false/>
			<key>Linux</key>
			<true/>
			<key>Tool</key>
			<true/>
		</dict>
		<key>Theme</key>
		<string>BGM</string>
	</dict>
	<key>Graphics</key>
	<dict>
		<key>EDID</key>
		<dict>
			<key>Inject</key>
			<false/>
		</dict>
		<key>Inject</key>
		<dict>
			<key>ATI</key>
			<false/>
			<key>Intel</key>
			<false/>
			<key>NVidia</key>
			<false/>
		</dict>
		<key>ig-platform-id</key>
		<string>0x191b0000</string>
	</dict>
	<key>KernelAndKextPatches</key>
	<dict>
		<key>AppleIntelCPUPM</key>
		<true/>
		<key>AppleRTC</key>
		<true/>
		<key>DellSMBIOSPatch</key>
		<false/>
		<key>ForceKextsToLoad</key>
		<array>
			<string>\System\Library\Extensions\IONetworkingFamily.kext</string>
		</array>
		<key>KernelLapic</key>
		<true/>
		<key>KernelPm</key>
		<true/>
		<key>KernelToPatch</key>
		<array>
			<dict>
				<key>Comment</key>
				<string>Disable panic kext logging on 10.13 Debug kernel</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				sABMi1Xw
				</data>
				<key>MatchOS</key>
				<string>10.13</string>
				<key>Replace</key>
				<data>
				SIPEQF3D
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>Disable panic kext logging on 10.13 Release kernel</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				igKEwHRE
				</data>
				<key>MatchOS</key>
				<string>10.13</string>
				<key>Replace</key>
				<data>
				igKEwOtE
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>MSR 0xE2 _xcpm_idle instant reboot(c) Pike R. Alpha</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				ILniAAAADzA=
				</data>
				<key>Replace</key>
				<data>
				ILniAAAAkJA=
				</data>
			</dict>
		</array>
		<key>KextsToPatch</key>
		<array>
			<dict>
				<key>Comment</key>
				<string>Change 15 port limit to 24 in XHCI kext 10.13</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				g32MEA==
				</data>
				<key>Name</key>
				<string>AppleUSBXHCIPCI</string>
				<key>Replace</key>
				<data>
				g32MGw==
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>0x19160000/etc, 32MB BIOS, 19MB framebuffer 9MB cursor bytes (credit RehabMan)</string>
				<key>Disabled</key>
				<false/>
				<key>Find</key>
				<data>
				AAAgAgAAUAE=
				</data>
				<key>Name</key>
				<string>com.apple.driver.AppleIntelSKLGraphicsFramebuffer</string>
				<key>Replace</key>
				<data>
				AAAwAQAAkAA=
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>eDP, port 0000, 0x191e0000, 0x19160000, 0x19260000, 0x19270000, 0x191b0000, 0x19160002, 0x19260002, 0x191e0003, 0x19260004, 0x19270004, 0x193b0005 credit syscl</string>
				<key>Disabled</key>
				<true/>
				<key>Find</key>
				<data>
				AAAIAAIAAACYAAAAAQUJAAAEAAA=
				</data>
				<key>Name</key>
				<string>com.apple.driver.AppleIntelSKLGraphicsFramebuffer</string>
				<key>Replace</key>
				<data>
				AAAIAAAEAACYAAAAAQUJAAAEAAA=
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>Enable lid wake for 0x19260002 credit syscl/lighting/Yating Zhou</string>
				<key>Disabled</key>
				<true/>
				<key>Find</key>
				<data>
				ChMDAAAABgAAAAAAAAAAAA==
				</data>
				<key>Name</key>
				<string>com.apple.driver.AppleIntelSKLGraphicsFramebuffer</string>
				<key>Replace</key>
				<data>
				DxMDAAAABgAAAAAAAAAAAA==
				</data>
			</dict>
			<dict>
				<key>Comment</key>
				<string>Enable lid wake for 0x19260004 credit syscl/lighting/Yating Zhou</string>
				<key>Disabled</key>
				<true/>
				<key>Find</key>
				<data>
				CgsDAAAHBgADAAAABAAAAA==
				</data>
				<key>Name</key>
				<string>com.apple.driver.AppleIntelSKLGraphicsFramebuffer</string>
				<key>Replace</key>
				<data>
				DwsDAAAHBgADAAAABAAAAA==
				</data>
			</dict>
		</array>
	</dict>
	<key>RtVariables</key>
	<dict>
		<key>BooterConfig</key>
		<string>0x28</string>
		<key>CsrActiveConfig</key>
		<string>0x67</string>
	</dict>
	<key>SMBIOS</key>
	<dict>
		<key>ProductName</key>
		<string>MacBookAir6,2</string>
		<key>ProductName-Comment</key>
		<string>Using Haswell MacBookAir6,2 until Clover has support for Skylake identifiers</string>
		<key>Trust</key>
		<true/>
	</dict>
	<key>SystemParameters</key>
	<dict>
		<key>#BacklightLevel</key>
		<integer>0</integer>
		<key>InjectKexts</key>
		<string>Detect</string>
	</dict>
</dict>
</plist>

```

## 其他

### 学习黑苹果需要的软件

1. efibootmgr 
1. dsdt 
1. SSDT 

## 参考链接
1. [tonymacx86](https://www.tonymacx86.com/)
1. [黑苹果DIY简明教程](https://zhuanlan.zhihu.com/p/21257611)
1. [小米笔记本安装10.11.6的一些问题和心得](http://www.jianshu.com/p/06cc32a292a7)
1. [如何在win7下制作一个mac os 10.9的启动U盘？](https://www.zhihu.com/question/19812727)
1. [macOS Sierra 10.12.5 黑苹果四叶草引导安装教程](https://imac.hk/macos-sierra-10-12-5-clover-install.html)
1. [黑苹果安装大致流程简化版](https://huyangjia.com/a-simplified-version-of-the-hackintosh-installation-process.html)
1. [技嘉b85M-HD3黑苹果10.12安装过程](http://www.jianshu.com/p/41f22238492f)
1. [苹果Mac os系统u盘安装系统制作教程](https://richardym.github.io/blog/2016/08/15/MacOSCreat.html)
1. [技嘉GA-B75M-D3V的板载声卡是什么](http://product.pconline.com.cn/itbk/diy/gab75md3v/1208/2895555.html)