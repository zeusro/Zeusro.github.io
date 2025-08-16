---
layout:       post
title:        "一加5刷机"
subtitle:     ""
date:         2018-07-01
author:       "Zeusro"
header-img:   "img/b/2018/psc.jpeg"
header-mask:  0.3
catalog:      true
published:   false
tags:
    - oneplus
---

## 前期准备

1. twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
1. Aurora_O_A5000_1111_Stable_9.0.6_V41.0.zip

## 安装 window驱动

这一步可能需要禁用驱动程序签名认证

## 解锁

```bash
adb reboot bootloader
fastboot oem unlock
```

## 刷TWRP

```bash
adb reboot bootloader
fastboot devices
fastboot flash recovery D:\twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
# 启动 twrp,黑屏说明twrp有问题，要重新刷别的版本
fastboot boot D:\twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
# 进入twrp 清理文件
```

## 刷机

```bash
adb push G:\oneplus3\Aurora_OnePlus_A3000_O_0629_OPEN37_V59.0.zip /sdcard/
# 这一步很慢，
# 6982 KB/s (2361816600 bytes in 330.299s)
```

最后在twrp 那里选择安装，点击sdcard内的zip包即可

**已经前两步已经做了的,可以直接双清,然后刷机**

## 8.1 升级 9.0 注意事项

不能跨越太大的版本,比如我的手机原本是[氢5.1.1](https://www.oneplusbbs.com/thread-4240181-1.html)的升9.0就会失败,要刷入11版的过渡版本

下载地址是
[OnePlus5Hydrogen_23_OTA_014_all_1806141244_4ad9db4b58](http://otafsc.h2os.com/patch/CHN/OnePlus5Hydrogen/OnePlus5Hydrogen_23.Y.14_014_1806141244/OnePlus5Hydrogen_23_OTA_014_all_1806141244_4ad9db4b58.zip)

刷完之后重启直接暂停然后关掉,进入recovery模式,这样也许能够跳过解密data分区那个步骤.

解密data分区比较麻烦,要进入系统后输入复杂密码,重启进入 twrp 输入复杂密码才行.


刷入过渡版本的系统后,recovery变成官方的,这时又要在bootloader重新刷

```
fastboot flash recovery D:\twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
fastboot boot D:\twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
adb push  d:\Aurora_O_A5000_1111_Stable_9.0.6_V41.0.zip /sdcard/
```

最后用adb 推送安装包,在twrp里面安装系统,重启.

## 官方系统刷入Google全家桶的办法

偶然在[https://melty.land/blog/lineageos-16](https://melty.land/blog/lineageos-16) 这篇文章看到的,有个[神奇的网站](https://opengapps.org/),在那里按照架构选择,下载对应的zip文件,在刷入系统后,**LineageOS 第一次启动前 进入twrp 安装**

## 参考链接:
1. [OnePlus 3T: How to Unlock Bootloader ](https://forums.oneplus.com/threads/guide-oneplus-3t-how-to-unlock-bootloader-flash-twrp-root-nandroid-efs-backup-and-more.475142/)
1. [Fastboot与ADB工具使用指南 ](http://bbs.zhiyoo.com/thread-12644311-1-1.html)
1. [一加5 刷机 挂载/vendor 失败 (invalid argument)](http://oneplusbbs.com/thread-4253107-1.html)
