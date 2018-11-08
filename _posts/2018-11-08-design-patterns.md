---
layout:       post
title:        "[转载]一句话概括设计模式"
subtitle:     ""
date:         2018-11-08
author:       "Zeusro"
header-img:   "img/oYYBAFHlDveICOlTAAWdBpjTP2sAAAvzgB9mBEABZ0e231.jpg"
header-mask:  0.3
catalog:      true
tags:
    - design
---

## 策略模式
定义了算法家族，分别封装起来，让他们之间可以互相替换，此模式让算法的变化，不会影响到使用算法的客户
重写父类策略算法

## 工厂模式
自动化new

## 装饰模式
动态地给一个对象添加一些额外的职责。就增加功能来说，装饰模式比生成子类更灵活

## 代理模式
为其他对象提供一种代理以控制对这个对象的访问

## 原型模式
用原型实例指定创建对象的种类，并且通过拷贝这些原型创建新的对象

## 模板方法模式
定义一个操作中算法的骨架，将一些步骤延迟到子类中。模板方法使得子类可以不改变一个算法的结构即可重定义该算法的某些特定步骤

## 外观模式
为子系统中的一组接口提供一个一致的界面，此模式定义了一个高层接口，这个接口使得这一系统更加容易使用。

## 建造者模式
将一个复杂对象的创建与它的表示分离，使得同样的构建过程可以创建不同的表示

## 观察者模式
定义了一种一堆多的依赖关系，让多个观察者对象同时监听一个主题对象。这个主题对象在状态发生变化时，会通知所有观察者对象使得它们能够自动更新自己

## 抽象工厂模式
提供一个创建一系列相关或相互依赖对象的接口，而无需指定它们具体的类

## 状态模式
当一个对象的内在状态改变时允许改变其行为，这个对象看起来像是改变了其类

## 适配器模式
将一个类的接口转换成客户希望的另外一个接口。适配器模式使得原本由于接口不兼容而不能一起工作的那些类可以一起工作
通过继承目标类重写其方法放入原有类的方法达成适配

## 备忘录模式
在不破坏封装性的前提下，捕获一个对象的内部状态，并在该对象之外保存这个状态。这样以后就可将该对象恢复到原先保存的状态

## 组合模式
将对象组合成树形结构以表示“部分-整体”的层次接口。组合模式使得用户对单个对象和组合对象的使用具有一致性

## 迭代器模式
提供一种方法顺序访问一个聚合对象中各个元素，而不暴露该对象的内部表示。

## 单例模式
保证一个类仅有一个实例，并提供一个访问它的全局访问点

## 桥接模式
将抽象部分与它的实现部分分离，使他们都可以独立地变化

## 命令模式
将一个请求封装成一个对象，从而使你可用不同的请求对客户进行参数化；对请求排队或记录请求日子，以及支持科撤销的操作

## 职责链模式
将多个对象都有机会处理请求，从而避免请求的发送者和接口者之间的耦合关系。将这个对象练成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。

## 中介者模式
用一个中介对象来封装一系列的对象交互。中介者使各对象不要显式地相互引用，从而使其耦合松散，而且可以独立地改变它们之间的交互。

## 享元模式
运用共享技术有效地支持大量细粒度的对象
用字典缓存可复用对象

## 解释器模式
给定一个语言，定义它的文法的一种表示，并定义一个解释器，这个解释器使用该类来表示届时语言中的句子

## 访问者模式
表示一个作用于某对象结构中的各元素的操作。它使你可以在不改变各元素的类的前提下定义作用于这些元素的新操作。