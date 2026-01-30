## 引言

本文将以教育行政化体系作为论述的大环境背景，提取
1 教师Y，教师F，教师D
2 学生犹大，学生黑曼巴，学生P，学生Y,学生C13
3 心理老师
4 学校领导
的家庭背景，性格特征，以及行为模式。把「人类决策」拆成可计算的变量 → 评分 → 概率 / 结果。并分析不同决策产生的政策风险和结果，
根据不同的角色定位，研究探讨最佳策略，并尽可能地为学校领导设计一个最佳的时间激励函数。

## 形式逻辑和定义

教育行政化：学生对老师负责，老师受校长管理，校长对学校负责。
学校政绩以学生平均成绩和本科升学率作为量化。

踢貓效應（英語：Kick the cat）：也稱為踢狗效應（kick the dog）[1]，是一種隱喻，描述在組織或是家庭中位階較高的人，可能會藉由責罰位階較低的人來轉移其挫折或不滿，而位階較低的人也會以類似的方式將挫折發泄給位階更低的人，因此產生了連鎖反應。

收益函数：教师以学生平均成绩和本科升学率作为收益函数；学生以个人高考成绩作为收益函数，学生最终的高考成绩，跟过往3年的成绩正相关。

## 收益函数（Payoff）定义

- **教师收益** \(U_{\text{teacher}}\)：以学生平均成绩 \(\bar{S}\) 和本科升学率 \(r\) 为自变量  
  \[
  U_{\text{teacher}} = w_{\text{avg}} \cdot \bar{S} + w_{\text{enroll}} \cdot r
  \]  
  实现中取 \(w_{\text{avg}}=0.6\)，\(w_{\text{enroll}}=0.4\)。政绩（领导层激励）与教师收益同构。

- **学生高考成绩预测** \(G\)：与过往 3 年年末成绩正相关，近期权重更大  
  \[
  G = w_1 S_{t-3} + w_2 S_{t-2} + w_3 S_{t-1},\quad w_1+w_2+w_3=1,\; w_1\le w_2\le w_3
  \]  
  实现中取 \(w_1=0.2,\,w_2=0.3,\,w_3=0.5\)。

- **学生收益** \(U_{\text{student}}\)：以个人高考成绩（预测值）为收益；未参考高考则无高考收益  
  \[
  U_{\text{student}} = \begin{cases} G & \text{若在高考参考池} \\ 0 & \text{否则} \end{cases}
  \]

## 量化公式

公式1：学生平均成绩 = 学生总成绩 / 学生人数

公式2：本科升学率 = 本科录取人数 / 参加高考人数 × 100%

## 人物建模分析

教师Y：以公式1作为决策量化的依据。公式1中的学生人数可以减少（使用PUA策略，让学生休学退学）；
使用罚站、电话家长、班会公开点名批评等方式减少学生人数；
使用撒谎和躲避监控策略，应付上级道德和法律审查。

教师F：以公式1和公式2作为决策量化的依据。公式1中的学生人数不变，但是从本科升学率出发，参加高考的人数可以减少。

教师D：以公式1和公式2作为决策量化的依据。以学生平均成绩最大化作为目标，但不采取剔除学生策略。

学生犹大：富裕中产阶级，攀附教师F获得了群管理。通过网络暴力的形式，攻击其他学生，意图在减少学生数量。

学生黑曼巴：家里非常有钱，可以直接使用钞能力购买澳门科技大学本科学位。因此高考只是一种选项，他本人可以不参加高考。

学生P：学习能力比较差，IQ比较低，对于教师Y的PUA策略，采取回避态度，使用休学作为消极对抗策略。

学生Y：高度近视的高IQ运动员。通过运动员加分策略让自己在高考中获得加分，但获取加分需要学校领导同意。

学生C13：家里很穷，但是一个IQ>160的天才学生。

心理老师：教育系统中的平衡人士。负责降低学生心理压力，安抚学生负面情绪。

学校领导：负责分配学校资源（比如谁加分，哪位学生休学退学），安排心理老师定向辅导学生的领导。

以时间序列作为元编程模型，将家庭背景，IQ，EQ，PUA，法律法规道德风险等因素量化分析，并根据不同的角色，对不同的社会成员建模，模拟实验不同学生和教师采取的策略和对应后果。编程语言使用 Go，程序位于本目录（`function/local/n/china/shantou/`）。

## 时间序列元编程模型（与 function/time.md 对齐）

- **第一性原理**：时间是第一维度。所有时序对象的时间必须为第一成员，时序函数的时间必须为第一参数。
- **时序对象**：`Factor`（量化因子）、`Agent`（社会成员）、`SimState`（仿真状态）均以 `Birth` 或 `Current` 为第一成员。
- **时序函数**：`Incentive(t, ...)`、`ChooseStrategy(t, ...)`、`ApplyStrategy(t, ...)` 等均以时间 `t` 为第一参数。
- **时序日志**：所有事件记录为「时间 + 内容」格式（`LogTS`），满足时间序列日志规范。
- **时序可视化**：激励函数采样为 `(t, 政绩值)` 点列，时间作为 x 轴可绘制政绩随时间演化。

## 量化因子定义

| 因子 | 符号/字段 | 取值范围 | 含义 |
|------|-----------|----------|------|
| 家庭背景 | FamilyBackground | [0,1] | 0=极贫，1=极富；影响资源与升学路径（如钞能力、运动员投入） |
| 智力 | IQ | [0,1] | 映射智力分数，影响学业表现与策略理解 |
| 情绪智力 | EQ | [0,1] | 影响抗压与踢猫链中的情绪传播 |
| PUA 暴露 | PUAExposure | [0,1] | 教师 PUA 策略对该个体的暴露强度 |
| PUA 抵抗力 | PUAResistance | [0,1] | 个体对 PUA 的抵抗力 |
| 法律法规道德风险 | LegalMoralRisk | [0,1] | 个体/行为触发的法规与道德追责风险 |

净 PUA 压力可定义为：`PUAExposure × (1 - PUAResistance)`，用于驱动休学/回避等策略。

## 角色与策略建模

| 角色 | 激励依据 | 可选策略 | 策略选择逻辑（简述） |
|------|----------|----------|------------------------|
| 教师Y | 公式1（平均分） | PUA减员、撒谎躲避、正常教学 | 平均分低且人数多→PUA；法规风险高→撒谎躲避 |
| 教师F | 公式1+公式2 | 减少高考参考人数、撒谎躲避、正常教学 | 参考人数多且升学率低→减参考人数 |
| 教师D | 公式1+公式2 | 撒谎躲避、正常教学（不采取剔除学生策略） | 法规风险高→撒谎躲避；否则正常教学，不以PUA/减参考人数提高政绩 |
| 学生犹大 | 攀附教师F | 网络暴力、努力学习 | 人数多且自身法规风险低→网络暴力 |
| 学生黑曼巴 | 钞能力 | 无（不参与高考） | — |
| 学生P | 低IQ、高PUA暴露 | 休学退学、回避对抗 | 净PUA高且压力大→休学 |
| 学生Y | 运动员加分 | 运动员加分 | 稳定选择加分策略 |
| 学生C13 | 高IQ贫困 | 努力学习 | 稳定选择努力学习 |
| 心理老师 | 系统平衡 | 减压安抚 | 平均压力高→减压 |
| 学校领导 | 政绩=激励函数 | 向下施压、设计激励函数 | 政绩低→向下施压（踢猫）；政绩高→设计激励 |

## 策略与后果量化

| 策略 | 后果（增量/布尔） | 作用对象 |
|------|-------------------|----------|
| PUA施压减员 | ΔStress↑, LegalRisk↑ | 随机目标学生 |
| 减少高考参考人数 | LeaveExam, LegalRisk↑ | 随机目标学生 |
| 撒谎躲避监控 | LegalRisk↓（短期） | 行为者 |
| 休学退学 | Dropout, LeaveExam | 行为者本人 |
| 网络暴力 | ΔStress↑, LegalRisk↑ | 随机目标学生 |
| 运动员加分/努力学习/回避对抗 | ΔScore, ΔStress | 行为者本人 |
| 减压安抚 | ΔStress↓ | 随机目标学生 |
| 向下施压 | ΔStress↑ | 随机目标学生 |

## 时间激励函数

政绩（领导层感知的激励值）与教师收益同构，定义为时间 t 的函数：

```
Incentive(t) = TeacherPayoff(平均成绩, 本科升学率) = 0.6 × 平均成绩 + 0.4 × 本科升学率
```

其中平均成绩与本科升学率由当前在校学生、参考人数、达线人数在 t 时刻的状态计算得到。仿真中每步对 `Incentive(t)` 采样，得到时间序列点列，可用于绘制「时间–政绩」曲线（时间轴为 x 轴）。学生高考成绩预测在每年末用当前成绩更新 `ScoreHistory`（过往 3 年），用于 `GaokaoScore` 与 `StudentPayoff`。

## 纳什均衡与各方最佳策略

在以上收益函数与策略空间下，可得到如下均衡与推荐策略（仿真与理论一致）：

| 角色 | 收益/目标 | 纳什均衡下的策略 | 最佳策略建议 |
|------|-----------|------------------|--------------|
| **教师** | \(U_{\text{teacher}}=\bar{S}\) 与升学率 | 平均分低且人数多时倾向 PUA/减参考人数（背叛）；法规风险高或上期已背叛则正常教学（合作） | 在重复博弈中：多数时期正常教学以维持声誉；仅在平均分明显偏低且学生数多时考虑减员，并注意法规道德风险 |
| **学生** | \(U_{\text{student}}=G\)（与 3 年成绩正相关） | 高 IQ、低 PUA 暴露：努力学习；高 PUA 暴露且压力大：休学或回避 | 以最大化 3 年成绩为主：优先「努力学习」；高压力或高 PUA 暴露时「回避对抗」或必要时休学以保护长期收益 |
| **心理老师** | 系统稳定（降低总压力） | 平均压力高于阈值时减压安抚，否则不行动 | 当 `AvgStress > 阈值` 时采取减压安抚，其余时期不行动 |
| **学校领导** | 政绩 = \(U_{\text{teacher}}\) | 政绩低于阈值时向下施压（踢猫），否则设计激励 | 政绩低时向下施压；政绩高时设计激励、批准加分等资源分配 |

**纳什均衡要点**：教师与学生存在重复博弈关系。教师若长期背叛（PUA/减参考人数），会触发学生报复（如网络暴力）或回避/休学，从而损害平均成绩与升学率，最终降低教师自身收益。在均衡下，教师多数时候选择正常教学，学生在无极端压力下选择努力学习，使双方在长期内都更接近各自收益最大化。心理老师与领导的行为由聚合指标（平均压力、政绩）驱动，其最佳策略为上述阈值反应。

## 仿真实验设计

- **步长**：按日（或可配置）推进。
- **每步**：先根据当前状态更新聚合指标（学生数、参考数、升学率、平均压力等），再对每个在册成员按角色调用 `ChooseStrategy(t, agent, ctx)`，得到策略后调用 `ApplyStrategy(t, strategy, ...)` 得到后果，将后果施加于行为者或目标学生，并追加「时间+内容」日志。
- **输出**：① 时间序列日志（每一条为「时间+内容」）；② 激励函数采样序列（时间→政绩）；③ 终态统计（在校人数、参考人数、本科录取数、平均成绩、本科升学率、政绩）。

运行方式：在本目录执行 `go run .` 或 `go build` 后运行生成的可执行文件。

## 实现文件

**源代码位置**：[zeusro/system — function/local/n/china/shantou/y](https://github.com/zeusro/system/tree/main/function/local/n/china/shantou/y)

| 文件 | 内容 |
|------|------|
| [model.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/model.go) | 时间序列对象：Factor、Event、Point、NLine；时间第一成员（Birth/T） |
| [roles.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/roles.go) | 角色 Role 与策略 Strategy 枚举；Agent 构造（Birth 第一成员）、NewAgent；Agent 含 Factor、InSchool、InExamPool、Score、ScoreHistory、Stress、LegalRisk、StrategyCount、LastStrategy |
| [incentive.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/incentive.go) | IncentiveParams（时间第一成员）；时间激励函数 Incentive(t, ...)、IncentiveAt；教师收益 TeacherPayoff(平均成绩, 升学率)；高考成绩预测 GaokaoScore(ScoreHistory)；学生收益 StudentPayoff(GaokaoScore, InExamPool) |
| [strategy.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/strategy.go) | ChooseStrategy(t, agent, ctx) 按角色分派；各角色策略函数（教师Y/F、犹大、黑曼巴、P、Y、C13、普通学生、心理老师、领导）；Consequence 后果结构；ApplyStrategy(t, strategy, agent, ctx, rng) 及后果量化 |
| [sim.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/sim.go) | SimContext（聚合状态含 StepsRemaining、LastRoundTeacherDefection）；SimState（Birth、Current、Agents、Events、Points、Duration）；LogTS、UpdateContext、Run（步进、每年末更新 ScoreHistory、激励采样、重复博弈两阶段选策略与施加后果）；pickStudentTarget |
| [y.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y.go) | 主仿真入口 Y(base, end, randomCount, seed)；newNamedAgents 构造教师与命名学生；输出时间序列日志、激励采样、终态统计、收益函数采样、学生策略分组统计、C13 建议 |
| [y_test.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y_test.go) | TestY 完整仿真（可 -short 跳过）；TestY_shortParams、TestY_shortRun 短仿真与 Run 单元测试 |

## 参考

[1] 踢貓效應 — [https://zh.wikipedia.org/wiki/踢貓效應](https://zh.wikipedia.org/wiki/%E8%B8%A2%E7%8C%AB%E6%95%88%E5%BA%94)
