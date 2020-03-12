---
layout:       post
title:        "WechatMagician(微信巫师)"
subtitle:     ""
date:         2018-03-02 12:00:00
author:       "Zeusro"
header-img:   "img/in-post/post-eleme-pwa/eleme-at-io.jpg"
header-mask:  0.3
catalog:      true
tags:
    - Xposed
---

[WechatMagician](https://github.com/Gh0u1L5/WechatMagician)的部分功能的实现原理是这样的.

微信应用在本地的数据库里面储存了大量信息,WeChatMagician在对数据库进行操作之前做了一些手脚,让原本的行为发生改变.

举个例子,用户 A 发信息给用户 B之后,用户 B 的手机上面的应用数据库会保存这条信息.而如果用户 A 此时选择撤回消息,那么用户 B 的微信app 会删除相应的这条信息记录.那么巫师的原理就是在删除这条信息之前做个手脚,阻止删除的结果的产生.这个过程叫做挟持（Hook)

这个插件做的比较好的地方，在于他是通过方法名查找到关联的方法。而一般的微信插件都是通过直接找到混淆后的方法名，所以每次微信更新，他们都要跟着更新。可惜，作者弃坑了，哈哈哈哈哈哈哈哈哈阿哈哈哈 ~

|表名|用途|
---|---|---|
message|用户之间的发信记录||
SnsInfo|朋友圈||
SnsComment|朋友圈评论||