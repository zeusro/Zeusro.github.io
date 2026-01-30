# Incentive Function Design under Education Bureaucracy

## Introduction

This article takes the education bureaucracy system as the macro context, and extracts family background, personality traits, and behaviour patterns of: (1) Teachers Y, F, D; (2) Students Judas, Black Mamba, P, Y, C13; (3) the school psychologist; (4) school leadership. It breaks “human decisions” into computable variables → scores → probability / outcome, analyses policy risks and consequences of different decisions, studies optimal strategies by role, and designs a time-based incentive function for school leadership as far as possible.

## Formal Logic and Definitions

**Education bureaucracy**: Students answer to teachers, teachers are managed by the principal, the principal answers to the school. School performance is quantified by average student score and undergraduate enrolment rate.

**Kick the cat** (also “kick the dog”) [1]: A metaphor for higher-ranking people in an organisation or family displacing frustration or dissatisfaction by punishing lower-ranking people, who in turn pass it down the chain, producing a cascade.

**Payoff functions**: Teachers’ payoff is average student score and undergraduate enrolment rate; students’ payoff is individual college-entrance exam score; final exam score is positively correlated with the past three years’ scores.

## Payoff (Payoff) Definitions

- **Teacher payoff** \(U_{\text{teacher}}\): Arguments are average student score \(\bar{S}\) and undergraduate enrolment rate \(r\)  
  \[
  U_{\text{teacher}} = w_{\text{avg}} \cdot \bar{S} + w_{\text{enroll}} \cdot r
  \]  
  Implementation uses \(w_{\text{avg}}=0.6\), \(w_{\text{enroll}}=0.4\). Performance (leadership incentive) is isomorphic to teacher payoff.

- **Predicted student exam score** \(G\): Positively correlated with year-end scores of the past 3 years, with higher weight on recent years  
  \[
  G = w_1 S_{t-3} + w_2 S_{t-2} + w_3 S_{t-1},\quad w_1+w_2+w_3=1,\; w_1\le w_2\le w_3
  \]  
  Implementation uses \(w_1=0.2,\,w_2=0.3,\,w_3=0.5\).

- **Student payoff** \(U_{\text{student}}\): Payoff is predicted individual exam score; no exam payoff if not in the exam pool  
  \[
  U_{\text{student}} = \begin{cases} G & \text{if in exam pool} \\ 0 & \text{otherwise} \end{cases}
  \]

## Quantitative Formulas

Formula 1: Average student score = Total student score / Number of students

Formula 2: Undergraduate enrolment rate = Number admitted to undergraduate / Number taking exam × 100%

## Character Modelling

**Teacher Y**: Uses Formula 1 for decisions. Can reduce the denominator (student count) via PUA tactics (pressuring students to leave or drop out); uses standing punishment, calling parents, public criticism in class meetings; uses lying and avoiding oversight to cope with moral and legal scrutiny.

**Teacher F**: Uses Formulas 1 and 2. Keeps student count in Formula 1 fixed but can reduce the number of exam takers to improve enrolment rate.

**Teacher D**: Uses Formulas 1 and 2. Maximises average score without removing students.

**Student Judas**: Affluent middle class, curries favour with Teacher F and gets a management role. Uses online harassment to attack other students to reduce headcount.

**Student Black Mamba**: Very wealthy; can buy an undergraduate place (e.g. Macau). The exam is optional; he may not sit it.

**Student P**: Low academic ability and IQ; responds to Teacher Y’s PUA with avoidance and withdrawal (leave of absence) as passive resistance.

**Student Y**: Highly myopic, high-IQ athlete. Uses athlete bonus in the exam; bonus requires school leadership approval.

**Student C13**: Poor family, genius with IQ > 160.

**School psychologist**: Balancer in the system; reduces student stress and negative emotion.

**School leadership**: Allocates resources (e.g. who gets bonus, who leaves), assigns the psychologist to targeted counselling.

A time-series meta-programming model quantifies family background, IQ, EQ, PUA exposure, legal/moral risk, etc., and models agents by role to simulate strategies and consequences. Implementation is in Go under `function/local/n/china/shantou/`.

## Time-Series Meta-Programming Model (aligned with function/time.md)

- **First principle**: Time is the first dimension. All time-series objects have time as the first member; time-series functions have time as the first parameter.
- **Time-series objects**: `Factor`, `Agent`, `SimState` have `Birth` or `Current` as the first member.
- **Time-series functions**: `Incentive(t, ...)`, `ChooseStrategy(t, ...)`, `ApplyStrategy(t, ...)` take time `t` as the first parameter.
- **Time-series log**: All events are logged as “time + content” (`LogTS`).
- **Visualisation**: Incentive sampled as `(t, performance)`; time on x-axis.

## Factor Definitions

| Factor | Symbol/Field | Range | Meaning |
|--------|--------------|-------|---------|
| Family background | FamilyBackground | [0,1] | 0=very poor, 1=very rich; affects resources and paths (e.g. “money power”, athlete investment) |
| Intelligence | IQ | [0,1] | Maps to score; affects academic performance and strategy understanding |
| Emotional intelligence | EQ | [0,1] | Affects stress resistance and emotion propagation in the kick-the-cat chain |
| PUA exposure | PUAExposure | [0,1] | Intensity of teacher PUA on this agent |
| PUA resistance | PUAResistance | [0,1] | Agent’s resistance to PUA |
| Legal/moral risk | LegalMoralRisk | [0,1] | Risk of legal/moral accountability for agent/action |

Net PUA pressure: `PUAExposure × (1 - PUAResistance)`, driving leave/avoidance strategies.

## Roles and Strategy Modelling

| Role | Incentive basis | Strategies | Selection logic (brief) |
|------|-----------------|------------|--------------------------|
| Teacher Y | Formula 1 (avg) | PUA to reduce headcount, lie/evade, normal teaching | Low avg and many students → PUA; high legal risk → lie/evade |
| Teacher F | Formulas 1+2 | Reduce exam takers, lie/evade, normal teaching | Many takers and low rate → reduce takers |
| Teacher D | Formulas 1+2 | Lie/evade, normal teaching (no removal) | High legal risk → lie/evade; else normal teaching |
| Student Judas | Curries Teacher F | Online harassment, study hard | Many students and low own risk → harassment |
| Student Black Mamba | Money | None (no exam) | — |
| Student P | Low IQ, high PUA | Leave/drop out, avoid | High net PUA and stress → leave |
| Student Y | Athlete bonus | Athlete bonus | Stable: choose bonus |
| Student C13 | High IQ, poor | Study hard | Stable: study hard |
| Psychologist | System balance | Reduce stress, soothe | High avg stress → soothe |
| Leadership | Performance = incentive | Pressure down (kick cat), design incentives | Low performance → pressure; high → design incentives |

## Strategy and Consequence Quantification

| Strategy | Consequence (delta/boolean) | Target |
|----------|-----------------------------|--------|
| PUA to reduce headcount | ΔStress↑, LegalRisk↑ | Random target student |
| Reduce exam takers | LeaveExam, LegalRisk↑ | Random target student |
| Lie/evade oversight | LegalRisk↓ (short term) | Actor |
| Leave/drop out | Dropout, LeaveExam | Self |
| Online harassment | ΔStress↑, LegalRisk↑ | Random target student |
| Athlete bonus / study hard / avoid | ΔScore, ΔStress | Self |
| Soothe / reduce stress | ΔStress↓ | Random target student |
| Pressure down | ΔStress↑ | Random target student |

## Time Incentive Function

Performance (leadership incentive) is isomorphic to teacher payoff, as a function of time \(t\):

```
Incentive(t) = TeacherPayoff(avg score, enrolment rate) = 0.6 × avg score + 0.4 × enrolment rate
```

Avg score and enrolment rate are computed from current in-school students, exam takers, and admittees at time \(t\). Each step samples `Incentive(t)` to get a time series for a “time–performance” plot. Predicted exam score is updated at year-end from `ScoreHistory` (past 3 years) for `GaokaoScore` and `StudentPayoff`.

## Nash Equilibrium and Best Strategies

Under the above payoffs and strategy sets, the equilibrium and recommendations (simulation and theory agree):

| Role | Payoff/goal | Strategy at Nash | Recommended best strategy |
|------|-------------|------------------|---------------------------|
| **Teachers** | \(U_{\text{teacher}}=\bar{S}\) and rate | When avg low and many students → PUA/reduce takers (defect); when legal risk high or previous defect → normal teaching (cooperate) | In repeated game: mostly normal teaching to keep reputation; consider reduction only when avg clearly low and headcount high, mind legal/moral risk |
| **Students** | \(U_{\text{student}}=G\) (3-year correlation) | High IQ, low PUA: study hard; high PUA and stress: leave or avoid | Maximise 3-year score: prefer “study hard”; under high stress or PUA use “avoid” or leave to protect long-term payoff |
| **Psychologist** | System stability (lower total stress) | Soothe when avg stress above threshold, else no action | When `AvgStress > threshold` soothe; else no action |
| **Leadership** | Performance = \(U_{\text{teacher}}\) | When performance below threshold pressure down (kick cat); else design incentives | Low → pressure; high → design incentives, approve bonuses, allocate resources |

**Nash summary**: Teachers and students are in a repeated game. Persistent defection (PUA/reduce takers) triggers student retaliation (e.g. harassment) or avoidance/leave, hurting average score and rate and thus teacher payoff. At equilibrium, teachers mostly teach normally and students without extreme stress study hard, so both approach maximum payoff over time. Psychologist and leadership act on aggregate indicators (avg stress, performance) with threshold responses as above.

## Simulation Design

- **Step**: Advance by day (or configurable).
- **Per step**: Update aggregates (student count, exam takers, rate, avg stress); for each agent call `ChooseStrategy(t, agent, ctx)`, then `ApplyStrategy(t, strategy, ...)`, apply consequences, append “time + content” log.
- **Output**: (1) Time-series log; (2) incentive sample (time → performance); (3) final stats (in-school, exam takers, admits, avg score, rate, performance).

Run: `go run .` or `go build` then run the binary in that directory.

## Implementation Files

**Source code location**: [zeusro/system — function/local/n/china/shantou/y](https://github.com/zeusro/system/tree/main/function/local/n/china/shantou/y)

| File | Content |
|------|---------|
| [model.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/model.go) | Time-series types: Factor, Event, Point, NLine; time first member (Birth/T) |
| [roles.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/roles.go) | Role and Strategy enums; Agent (Birth first), NewAgent; Factor, InSchool, InExamPool, Score, ScoreHistory, Stress, LegalRisk, StrategyCount, LastStrategy |
| [incentive.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/incentive.go) | IncentiveParams; Incentive(t,...), IncentiveAt; TeacherPayoff; GaokaoScore(ScoreHistory); StudentPayoff |
| [strategy.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/strategy.go) | ChooseStrategy(t, agent, ctx) by role; Consequence; ApplyStrategy(t, strategy, ...) |
| [sim.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/sim.go) | SimContext, SimState; LogTS, UpdateContext, Run; pickStudentTarget |
| [y.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y.go) | Main entry Y(...); newNamedAgents; outputs log, incentive sample, final stats, C13 advice |
| [y_test.go](https://github.com/zeusro/system/blob/main/function/local/n/china/shantou/y/y_test.go) | TestY (full run, -short to skip); TestY_shortParams, TestY_shortRun |

## Reference

[1] Kick the cat — [https://en.wikipedia.org/wiki/Displaced_aggression](https://en.wikipedia.org/wiki/Displaced_aggression)
