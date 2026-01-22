
## ❌master ✅ main

master/slave 是计算机长久以来的一种主从架构。通过主从的分离，实现分布式读和故障转移。然而在Black Lives Matter 运动中，github 在2020年6月中公布了计划，反对使用可能带有奴役联想的术语，并在2020 年 10 月 1 日默认新仓库的分支名改为 "main"。

## 道德警察

政治正确在开源社区的一大体现，就是各种道德警察。很多中国的开发者，利用他们为数不多的时间开发开源软件，结果还被各种issue霸占，整天围绕着一些"弱智问题"问一些弱智问题。像是怎么安装这个软件，xx出错了怎么修复。

他们甚至没有时间去看一下报错的错误堆栈是从哪个地方开始的，总是理所当然地浪费他人的时间。然后把他人的无私贡献当成"开源精神"。

要么就是把一些八竿子打不着的理念带到开源社区，比如LGBT。

LGBT文化在开源社区的流行，个人认为是一种历史的倒退。就好像我们内部的女拳斗士，她们借助男多女少的性别优势，发表各种逆天言论。但究其理论根基，是一个黑色的空洞。她们最终的述求，不过是要在结婚前多要点钱，或者在离婚后平方对方资产，要不就是在细枝末节的小事上斤斤计较（比如要求他人环保自己却不断浪费食物），在这一点上，中西方竟然取得了完美的统一。

## Black Lives Matter & LLM寄生虫

道德警察在Black Lives Matter运动中特别明显。我记得在2020年底的时候，查看kubernetes网页文档突然多了声援BLM的牛皮癣广告。

查阅历史发现是 #25173 [https://github.com/kubernetes/website/pull/25173/files](https://github.com/kubernetes/website/pull/25173/files) 添加的。但后来在Jan 8, 2021，[https://github.com/kubernetes/website/pull/25769](https://github.com/kubernetes/website/pull/25769) 的时候就被移除了，而且移除的理由非常隐晦，仿佛一切都没存在过。

BLM运动的联合发起人Patrisse Cullors，于2021年辞去BLMGNF执行董事职务，税务文件显示她在财政年度内未领取薪水，而是作为"无薪志愿者"，但她与基金的关联公司和家人收到大笔资金：她的兄弟Paul Cullors的公司（Cullors Protection 或 Black Ties LLC）收到约84万美元用于"专业安全服务"（2022年税务文件）。 自2021年收入总计以来超过420万美元。 

Cullors还被指使用基金购买洛杉矶一处约600万美元的豪宅，用于"黑人创意空间"。 

而其他发起人董事会成员Shalomyah Bowers的公司收到210万美元咨询费。 

前董事会成员Raymond Howard及其姐妹的公司收到约110万美元。 

两名前雇员收到结算金：一位前董事会成员40万美元，另一位33.5万美元（2023年）。 

而随着时间的推移我们发现，声援这场运动的人才是真正的小丑。在 BLM 运动背后，最终得到实质利益的只是组织者的收入与豪宅，而非运动本身的理想。消费死者能够换回这么大的好处，也就只有这种资本主义国家能办到了。嘴上都是正义，一切都是生意。

他们的收入跟kubernetes这个项目根本毫无关系。它让我又想起了初高中那些寄生虫同学，他们只想着浪费你的资源，去实现自己的目的。

就好像之前的 [https://github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) 。现在的LLM辅助编程工具，可以在用户不读懂文档的前提下直接集成到自己的项目中。[https://github.com/zeusro/tool](https://github.com/zeusro/tool) 我这个项目就是用Cursor集成tailwindcss 的。

说实话，这让我有点毛骨悚然。一方面，开发者兢兢业业地工作，项目的star越来越多，用户也越来越多；然而真实的一面却是，获得的这些虚拟赞誉，完全无法覆盖团队的日常开支，甚至连基本的生存都成为问题。

## 我的想法

我在2020年的时候就认识到，kubernetes这个项目其实跟中国人没啥关系。项目主要发起人是Google cloud的人，那么如果你的工作关系不归属于Google cloud，那么基本上他们也不会接受你的pull request。这也完美解释了为什么LGBT的banner会出现在 kubernetes/website 这个项目。

crd是kubernetes的资源，而cr和controller是crd的下游。因此不管第三方（openkruise）实现的deployment、StatefulSet 、 DaemonSet 控制器有多好，这辈子要往上游 kubernetes 合并，估计有生之年都见不到了。

我自己早已被kubernetes 这个组织拉黑，但我无所叼谓。

作为国内的开发者，我觉得大家其实应该思考一个问题：如果我们总是等待救世主的到来，才付诸行动。那么大家说有没有一种可能，其实这个世界从来就没有什么神仙皇帝，也不存在所谓的救世主呢？

我们总是陷入一种模仿者的被动思维，不愿意去吃第一只螃蟹。而是等到项目成熟之后，才想着去分一杯羹，然而人家根本就不带你玩。

开源世界的政治斗争远比我们想象的要残酷。和平与开放之下，其实暗流涌动。

对于个人开发和初创团队开发的开源项目，我其实不会发表任何意见，看不爽不用便是。毕竟人家能付出点时间开发，就已经实属不易；但对于带上市公司背景的单位，我觉得眼光还是要放长远一点，姿态先放低一点，先立足于国内草台班子和小微企业占多数的情况，想清楚项目立意的客户群体。

而不是整天拿着百万年薪，写出来的代码却狗屁不通，连资源占用的ROI和边际收益，都无法跟喜欢零元购的小老板们说清楚。

## Yellow Lives Matter

如果kubernetes不改变，那就由我来改变kubernetes。

![Yellow Lives Matter](/img/in-post/how-political-correctness-ruined-open-source/yellow-lives-matter.gif)

我决定以 [https://github.com/p-program/kube-killer](https://github.com/p-program/kube-killer) 和 [https://github.com/Z-Nightmare/kuberneteskuberneteskubernetes](https://github.com/Z-Nightmare/kuberneteskuberneteskubernetes) 作为起点，在全球互联网发起 Yellow Lives Matter 运动，抗议 Kubernetes 组织这种国籍歧视和道德偏见。

> "The old is dying and the new cannot be born; in this interregnum a great variety of morbid symptoms appear."
