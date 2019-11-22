---
layout:       post
title:        "一加5刷机"
subtitle:     ""
date:         2018-07-01
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - oneplus
---

## 前期准备

1. twrp-3.2.1-0-universal-codeworkx-cheeseburger.img
1. Aurora_O_A5000_1111_Stable_9.0.6_V41.0.zip
1. 

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
```

最后在twrp 那里选择安装，点击sdcard内的zip包即可

**已经前两步已经做了的,可以直接双清,然后刷机**

## 参考链接:
1. [OnePlus 3T: How to Unlock Bootloader ](https://forums.oneplus.com/threads/guide-oneplus-3t-how-to-unlock-bootloader-flash-twrp-root-nandroid-efs-backup-and-more.475142/)
1. [Fastboot与ADB工具使用指南 ](http://bbs.zhiyoo.com/thread-12644311-1-1.html)
