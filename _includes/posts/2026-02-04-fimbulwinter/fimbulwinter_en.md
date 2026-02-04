## Summary

This article starts from formal logic and definitions (network effect, law of entropy increase, anti-dependency, and the “zero” philosophy of zero marginal benefit), systematically reviews major outages of mainstream public clouds and infrastructure—Alibaba Cloud, Google Cloud, Azure, Cloudflare, Tencent Cloud—from 2014 to 2025, and compares their fault transparency. On this basis, it analyzes the “causes of death” of public cloud: software entropy and zero marginal benefit make legacy code and architecture hard to govern; network effects amplify cascading failures; and SLA compensation is severely misaligned with actual losses for enterprises and government. The author recommends that large enterprises and government agencies prioritize “anti-dependency” on any single public cloud and proposes a “small-concurrency high-availability system”—reducing single-point risk and blast radius through storage redundancy and traffic distribution (e.g., multi-region, multi-cluster DNS resolution).

![Fimbulwinter](/img/in-post/fimbulwinter/fimbulwinter.jpeg)

## Formal Logic and Definitions

**Network effect**: The more users (or participants) a product/service/platform has, the more valuable it becomes to each user.

**Law of entropy increase**: A project’s codebase will, over time, turn into a mess.

**Anti-dependency**: The reverse of depending on a single programming language, tech stack, or cloud platform. Examples: polyglot programming, multi-stack choices, multi-cloud strategy. Anti-dependency lets the business run smoothly without being tied to one language, open-source project, or public cloud.

**Zero**: Nobody wants to do refactoring whose marginal benefit is zero.


## Alibaba Cloud Outages

From 2014 to 2025, Alibaba Cloud did not have an unusually high number of **major incidents** that were widely reported, officially disclosed, **truly broad in impact, long in duration, and widely called “major outages”** (relative to its scale, its overall SLA remains among the best in the industry). A few of them, however, did cause significant social impact and industry debate. Below is a chronological list of **major-level outages** (based mainly on public reports, official announcements, media and community post-mortems):

| Time | Region/Scope | Duration | Main Impact and Consequences | Official/Main Cause | Notes / Industry View |
|------|--------------|----------|-----------------------------|---------------------|------------------------|
| June 2018 | Some regions (details not public) | ~30 min | Some cloud products abnormal, limited impact | Not disclosed in detail | Described by some media as “major technical failure” |
| March 3, 2019 | North China 2 (Beijing) AZ-C | Hours | Many ECS disk failures, many sites/Apps down | Disk failure | Significant impact; Alibaba Cloud compensated per SLA |
| Dec 18, 2022 | Hong Kong Region AZ-C | ~15.5 hours | Hong Kong region largely down; key sites in Macau (monetary authority, Galaxy, Lotus TV, etc.) unavailable; OKX affected | Cooling equipment failure → cascade → large outage | Widely called “one of the worst incidents in Alibaba Cloud history” |
| Nov 12, 2023 | **All regions and services globally** | ~3h 16m | Console, API, MQ, microservices, monitoring, ML, etc. largely abnormal; Taobao, DingTalk, Xianyu, Ele.me, Alibaba Cloud Drive, etc. down | Core component failure (auth/metadata/control plane) | **Widely seen as Alibaba Cloud’s worst, broadest outage**; “epic,” “unprecedented in the industry” |
| Nov 27, 2023 | Some servers | ~2 hours | Server access abnormal | Not disclosed in detail | Only half a month after 11·12; renewed trust concerns |
| July 2, 2024 | Some regions/services | Hours | Console and some services abnormal | No detailed post-mortem | Mid-sized; impact smaller than earlier incidents |
| 2025 (date unclear) | Global (suspected DNS-related) | ~6 hours | DNS hijacking led to global service issues | DNS hijacking | From 2025 public cloud outage summary; details TBD |

### Important Notes and Trends

1. **2014–2018 early**: Very few publicly disclosed major P0-level incidents in this period; more local, limited issues. Scale was much smaller; impact was smaller too.

2. **Two most severe**:
   - **2022.12 Hong Kong 15.5h** → Longest single-region outage; severe impact on critical infrastructure in Hong Kong and Macau.
   - **2023.11.12 global 3h+** → Control plane and global services down; widely seen as a rare “all regions × all services” failure, breaking the “multi-active, multi-center, N nines” myth.

3. **2024–2025**: From known information, frequency and severity are lower than 2022–2023, but medium-to-large events still occur (e.g. 2025 DNS hijacking had broad impact).

4. **Alibaba Cloud’s handling**: Most major incidents get detailed post-mortems (especially 2022 Hong Kong and 2023 global); SLA compensation (usually vouchers); senior/formal apologies.

Overall, in 2014–2025 Alibaba Cloud had roughly **5–7** incidents that qualify as “major,” with **Nov 12, 2023** and **Dec 2022 Hong Kong** generally seen as the two most severe.


## Google Cloud Outages

Google Cloud Platform (GCP) had relatively good overall SLA from 2014 to 2025; **major incidents** that truly affected **global scope** or **multiple core services** were not especially frequent (fewer than AWS and Azure in terms of global disasters). When they did occur, they often affected many third-party apps (e.g. Snapchat, Spotify, Discord, services depending on Cloudflare), with high social impact.

Below is a chronological list of **serious, broad-impact** GCP outages (based on public Status Dashboard, media, Wikipedia, industry post-mortems):

| Time | Region/Scope | Duration | Main Impact and Consequences | Main Cause | Notes / Industry View |
|------|--------------|----------|-----------------------------|------------|------------------------|
| Aug 2015 | Europe (Ghlin, Belgium) | Hours | Compute Engine very high read/write error rate; some data loss | Lightning damaged part of datacenter | Google rarely admitted **data loss**; limited customer set |
| July 2018 | Global (multiple regions) | Hours | GCP services abnormal; Snapchat, Spotify, etc. largely unusable | Network congestion + internal routing | Widely reported; strong third-party impact |
| June 2, 2019 | US East + global | ~4–5 hours | YouTube, Gmail, G Suite largely down; Snapchat, Discord, Vimeo login failures | US East network congestion + cascade | Broad impact; social media buzz |
| Dec 14, 2020 | Global | ~1 hour | Gmail, YouTube, Google Home, Nest, Pokémon GO, etc.—almost all auth-dependent services down | Identity/auth system (IAM-like) global failure | Consumer services “down”; one of the worst |
| Aug 2022 | Iowa datacenter | Local | Electrical fire (3 injured); some services affected, not global | Datacenter electrical fire | Physical facility; not purely software/architecture |
| Apr 2023 | Europe (Paris, etc.) | Hours | Multi-region network + service disruption | Flood + datacenter + network issues | Weather-related; medium impact |
| Oct 23, 2024 | Europe (Frankfurt europe-west3) | ~12+ hours | Region largely unavailable; many European customers affected | Not disclosed in detail (suspected control plane/network) | One of the longest single-region outages |
| **June 12, 2025** | **Global** (40+ regions) | ~2.5–3 hours | **70+ GCP services** abnormal; IAM down → API requests failing; Spotify, Discord, Twitch, Cloudflare, Fitbit, Gmail, Drive, YouTube, etc. down | **Service Control** (API auth core) automation update introduced severe bug → crash loop → global overload | **Widely seen as GCP’s worst global outage since 2020** |
| July 18, 2025 | us-east1 | ~2 hours | Multiple products higher error rates | Not disclosed in detail | Mid-sized; recovery relatively fast |


## Azure Outages

Microsoft Azure did not have an unusually high number of **major incidents** that were **broad in impact, long in duration, and highly visible** from 2014 to 2025 (compared with earlier, smaller-scale frequent glitches, the trend improved). A few events did cause global or multi-service impact, especially when **Microsoft 365, Teams, Xbox, Outlook** and other consumer/enterprise products were involved; the propagation effect was very visible.

Below is a chronological list of **major-level** Azure outages (based on Azure Status History, Post Incident Reviews, media, Wikipedia, industry post-mortems):

| Time | Region/Scope | Duration | Main Impact and Consequences | Main Cause | Notes / Industry View |
|------|--------------|----------|-----------------------------|------------|------------------------|
| Aug 14–18, 2014 | US Central, US East, US East 2, Europe North | Multiple days, hours per event | Cloud Services, SQL Database, VM, Websites, HDInsight, Mobile Services, Service Bus largely unavailable | Multiple network/storage issues | 2014’s most concentrated wave; Azure still young |
| **Nov 18–19, 2014** | **Multiple regions** (US, EU, Asia) | ~11 hours | Azure Storage at core; VM, Websites, Visual Studio Online, Xbox Live, MSN, Search, 20+ services down | Storage perf config change → Blob front-end infinite loop | **Azure’s worst early incident**; detailed RCA; customer compensation |
| Sep 15, 2016 | **Global** | Hours | Widespread DNS resolution failure; many Azure DNS–dependent services affected | Global DNS issue | Exposed DNS single-point risk |
| June 20, 2018 | North America multiple datacenters | Hours–1+ day | Cooling failure (lightning + surge protection) → multi-service disruption | Physical facility (lightning cascade) | Rare hardware/infrastructure incident |
| Sep 4, 2018 | **Multiple regions** | 25+ hours (some services 3 days) | Core services long unavailable | Cooling (lightning + surge) | One of the longest recoveries |
| Jan 23, 2023 | **Global** (core network) | ~3 hours | Microsoft 365 (Teams, Outlook, Exchange), some Azure services down | WAN issue | M365 “down”; huge impact |
| July 18, 2024 | US Central | ~Half day | VM and other management operations failing; customers unable to access managed services | Access control error + infrastructure failure | Close in time to next-day CrowdStrike global BSOD but independent |
| Jan 8–9, 2025 | East US 2, etc. | Hours | Azure Databricks, Synapse, Functions, App Service, VM network disruption | Network component issue | Notable early 2025 |
| **Oct 29, 2025** | **Global** | ~8 hours | Azure Front Door at core; Microsoft 365, Outlook, Teams, Xbox Live, Minecraft, Copilot down; Alaska Airlines, Heathrow, Costco, Starbucks, etc. affected | **Azure Front Door config change** + protection bug → inconsistent config propagated globally | **2025’s worst for Azure**; Downdetector 30k+ reports; similar to AWS same month |
| Nov 5–6, 2025 | West Europe (AZ01) | ~9–10 hours | VM, PostgreSQL/MySQL Flexible Server, AKS, Storage, Service Bus degraded/out | Datacenter thermal event | Serious regional outage |

### Observations and Trends (2014–2025)

- **2014**: Azure in rapid expansion; **config changes** and **storage layer** issues frequent; most concentrated year (Nov incident is a classic case).
- **2015–2019**: Fewer incidents; still mostly **single region** or **infrastructure** (cooling, lightning, DNS); impact relatively contained.
- **2020–2023**: Few major global outages; more **network** or **M365 dependency on Azure** (e.g. Jan 2023).
- **2024–2025**: Control plane/edge (e.g. **Azure Front Door**) became a new pain point; Oct 29, 2025 widely seen as Azure’s worst **global outage** in recent years, comparable to Alibaba Nov 2023 or GCP June 2025.
- **Typical traits**: Detailed **Post Incident Review (PIR)** after major incidents; **config change**, **control plane**, **network** often root causes (not just hardware); strong third-party propagation when M365, Xbox, Teams fail; SLA compensation (credit); customers care most about business continuity.

Overall, Azure had roughly **8–10** **major-level** (global/multi-service, long) outages in 2014–2025; severity and frequency on par with AWS and GCP; **cascading failure from config error** is a recurring pattern.


## Cloudflare Outages

Cloudflare, as one of the world’s largest CDN, security, DNS, and edge providers, did not have an unusually high number of **major incidents** that caused **broad internet disruption** from 2014 to 2025. When they did occur, impact often reached **millions to hundreds of millions** of users (Cloudflare carries ~20–25% of global web traffic).

Typical pattern: **recovery is often fast** (most ease within 1–4 hours), but **propagation is extreme**—when core proxy, DNS, or security components fail, many top sites (X, ChatGPT, Shopify, Discord, Spotify, parts of AWS, etc.) see 5xx or unreachable at once.

Below is a chronological list of **major-level** Cloudflare outages (based on official blog, status.cloudflare.com history, media, Wikipedia; focused on global/core traffic events):

| Time | Scope | Duration | Main Impact and Consequences | Main Cause | Notes / Industry View |
|------|-------|----------|-----------------------------|------------|------------------------|
| **July 2, 2019** | **Global** | ~1–2 hours | Many sites 502/503/504; large parts of internet unreachable | Software deploy introduced severe bug → proxy layer crash | **Widely seen as Cloudflare’s worst ever**; detailed post-mortem |
| 2020 multiple | Some regions/control plane | Hours | Dashboard, analytics, some APIs down; core proxy largely stable | Control plane issues | More impact on developers; less for general users |
| June 2022 | **Multiple datacenters** (19) | ~1.5 hours | Core proxy down; many sites unreachable | Network config error | Medium scale; fast recovery |
| Mar 21, 2025 | **Global** | ~1h 7m | Storage read/write severely impaired; many storage/cache–dependent services affected | KV/storage layer write failure + partial read issues | Notable early 2025 |
| June 12, 2025 | **Global** (some features) | Hours | Some features/services down; core traffic largely OK | Specific module deploy | Not core traffic; limited impact |
| July 14, 2025 | **Global** (1.1.1.1 DNS) | ~62 minutes | Public DNS resolver (1.1.1.1) fully down; many users unable to reach internet | Config error → BGP route withdrawal → DNS prefix disappeared from global routing table | **Severe for 1.1.1.1 users**; “internet-breaking” level |
| ~Oct 2025 | Some services | Tens of minutes | Brief DNS resolution disruption | DNS-related config | Mid-sized |
| **Nov 18, 2025** | **Global** | ~4–5 hours (peak longer) | **Large-scale internet outage**: X (Twitter), ChatGPT, Shopify, Spotify, Letterboxd, Indeed, Canva, Uber, DoorDash, Truth Social, League of Legends, etc.; ~20% web traffic; 1/3 of Alexa top 10k sites | Bot Management rules file abnormal growth (DB permission change → file size doubled) → global propagation → proxy crash | **2025’s worst**; also worst global traffic outage since 2019 |
| Dec 5, 2025 | **Global** | Hours | Widespread 5xx again; Shopify, Zoom, Vinted, Fortnite, Square, Just Eat, Canva, Vimeo, parts of AWS, Deliveroo, etc. | No full official root cause (suspected config/propagation) | **Only 17 days after Nov 18**; two major incidents in a row raised strong criticism |

### Observations and Trends (2014–2025)

- **2014–2018**: Cloudflare grew fast; few public **global major** incidents; more local/regional/functional issues; internet depended on Cloudflare less than today.
- **July 2019**: Became Cloudflare’s classic “black swan”; no **core proxy global** outage of similar scale for over six years.
- **2025 as anomaly**: At least **3–4** broad global/near-global events (especially Nov 18 and Dec 5 back-to-back). **Nov 18** widely seen as **worst since 2019**. Dec 5 again led many to question change control, rollback, and “fail small.”
- **Typical traits**: Most serious incidents tied to **config change**, **rules/propagation**, **control plane**, or **DNS/BGP**; very transparent post-mortems on blog.cloudflare.com; recovery usually fast (rollback + stop propagation), but impact very broad (Anycast + challenge mechanism); no explicit SLA credit like AWS/Azure/Google, but detailed explanation and improvement commitments.

Overall, Cloudflare had roughly **5–7** **major-level** (global core traffic, long) outages in 2014–2025; **July 2019** and **Nov 18, 2025** are the two peak events. 2025 saw a clear rise in frequency and renewed discussion of “internet infrastructure centralization risk.”


## Tencent Cloud Outages

Tencent Cloud, as China’s second-largest public cloud (after Alibaba Cloud) from 2014 to 2025, had relatively good stability among domestic providers. Truly **broad, long, high-visibility global/multi-region major** incidents were relatively few; when control plane (console/API) or core storage failed, impact quickly spread to many enterprises and developers.

Tencent Cloud’s **status page** (https://status.cloud.tencent.com/history) is relatively opaque; history often shows only the last year, and many medium-to-large incidents are missing; the full picture relies on official WeChat, tech blog, media, and community.

Below is a chronological list of **serious, broad-impact** Tencent Cloud incidents (based on official post-mortems, media, Zhihu/Weibo/developer community):

| Time | Region/Scope | Duration | Main Impact and Consequences | Main Cause | Notes / Industry View |
|------|--------------|----------|-----------------------------|------------|------------------------|
| Nov 2, 2014 | **Nationwide** (control plane + some services) | ~6 min | Tencent Cloud site slow, images failing, console abnormal; some users unable to use | Not disclosed (suspected network/load) | Early, small scale; limited impact but widely reported |
| Aug 2018 | Some users/cloud disk | Unclear (single-user impact hours to permanent) | Multiple users’ cloud disk data **wiped/lost**; losses in tens of millions | Silent disk error + migration validation/replica failure | **Tencent Cloud’s worst “data loss” incident**; trust crisis; detailed post-mortem |
| 2023 (sporadic) | Some regions/services | Tens of min–hours | Sporadic console/API issues, storage jitter | No detailed public post-mortem | Compared with Alibaba Nov 2023 global, Tencent was relatively stable |
| **Apr 8, 2024** | **17 regions globally** | ~74–87 min | Console fully unreachable; cloud API 504 Gateway Timeout; CVM/RDS instances running but unmanageable/no renew/scale; 1957 customers reported | New API version backward-incompat + missing config gray release → full rollout → global propagation | **Tencent Cloud’s most serious in recent years**; “global outage,” “control plane collapse”; similar style to Alibaba Nov 2023 |
| Oct 15, 2025 | Multiple regions | ~Tens of min–1 hour | Auto Scaling and other services abnormal | Not disclosed | From status page; mid-sized |
| Oct 17, 2025 | Guangzhou | ~1+ hour | AI digital-human related services abnormal | Not disclosed | Regional; specific AI/digital-human product |

### Observations and Trends (2014–2025)

- **Early (2014–2018)**: Failures often **storage data loss** or **short access issues**; 2018 “data loss” hit enterprise trust hardest.
- **2019–2023**: Tencent Cloud incident frequency and severity dropped; few nationwide/global events; stability better than Alibaba in the same period (e.g. calm during Alibaba 11·12).
- **2024–2025**: Apr 8, 2024 was a turning point; **control plane global** failure led many to reassess “change safety” and “gray release.” 2025 had several mid-sized events but nothing at “full service down” level like Apr 2024 or Alibaba/Google.
- **Typical traits**: **Control plane/API** is the main pain point (Apr 2024); **storage/data loss** is most damaging to enterprises (2018); post-mortems relatively timely (WeChat, tech community); no strict SLA credit like AWS/Azure/Google, but vouchers/compensation; propagation less dramatic than Alibaba/Cloudflare (customer mix more enterprise/gaming/video, less consumer internet).

Overall, Tencent Cloud had roughly **3–5** **major-level** (nationwide/global control plane long unavailable or serious data loss) incidents in 2014–2025; **2018 data loss** and **Apr 8, 2024 global control plane** are the two most discussed.


## Outage Transparency

In terms of outage transparency, Alibaba Cloud and Tencent Cloud are relatively weak.

Alibaba Cloud’s status board (https://status.aliyun.com/#/?region=cn-shanghai) and Tencent Cloud’s (https://status.cloud.tencent.com/history) only show the last year of events.

Azure (https://azure.status.microsoft/en-us/status/history/) keeps five years. Cloudflare (https://www.cloudflarestatus.com/history?page=17) is the most transparent; you can paginate back through earlier years.


## “Death” of the Public Cloud

When I was younger, I was keen on reading and refactoring other people’s code. Until “Java Boy” taught me a lesson: even after I fixed his memory leak, what he felt was an existential crisis. He used anger to cover his own inadequacy and blamed “keeping the Kubernetes platform stable” on me.

I wasn’t that eager to clean up his mess either. I just found the frequent `OOM kill` event alerts annoying. From that story I learned the philosophy of zero: **nobody wants to do refactoring whose marginal benefit is zero.**

Hence the **law of entropy increase** in software: a project’s codebase will, over time, turn into a mess.

Someone asked: what does this have to do with the “death” of the public cloud?

It’s very related. Because “industrial Cthulhu” demands that companies deliver ever-increasing profit. So for public cloud vendors and their frontline staff, they must “tell a new growth story”—in 2026, that story is AI.

The old code just rots. Changing it has no marginal benefit.

So everyone converges on the same idea: don’t touch others’ code; let it become a mess. Same for code, same for architecture. Even when the network topology is a pure mesh of mutual dependency, when things break everyone’s down, and when outage responsibility is shared equally, you bear no responsibility.

Ironically, an ops engineer who had zero incidents on their watch and “slept at work” every day would be seen as incompetent—because they look like they did nothing. Counterintuitively, that person should be treated as the company mascot: you have no idea how much they did before to keep things stable. Or they were just lucky and deserve a shrine.

The best ops is no ops. Because **ops compensation and career risk are completely misaligned**. Your boss won’t give you a bonus for deleting a seemingly useless config; but you will get cursed by customers for deleting a useful database config.

Public cloud vendors forget: network effects can lift them up and can slam them down. The more customers they have, the bigger the network cascade from a single outage. Like the Alipay outage on Dec 4, 2025, ~21:00–23:37—Alibaba’s sixth major incident in 2025.

When user scale is in the hundreds of millions, someone is paying every second. Yet the business keeps asking for more features; eventually the system buckles.

And public cloud compensation is completely misaligned. For something like Alipay it’s at most “refund the difference”; undercharging is treated as a perk. But losses for government and enterprises are incalculable. If your business runs on the public cloud and the cloud goes down, how do you explain your loss to the provider?

“My system does billions in transactions a day; you’re going to compensate me a few hundred million?”

Customer loss is unquantifiable, so Alibaba Cloud usually just hands out vouchers. That’s a drop in the bucket. No one can really account for lost time, actual business impact, or the value of that time.

Network effects brought public cloud exponential revenue growth. For large government and enterprise users, anti-dependency on a single public cloud should be on the agenda. Tying your fate to one cloud vendor cannot handle sudden risk.


## Small-Concurrency, High-Availability Systems

On that basis I propose “small-concurrency, high-availability systems”: **redundancy in storage** to achieve **high availability** in the business.

When traffic is spread across redundant systems, you avoid the single-cluster traffic spike of centralized flow and shrink the radius of failure.

Simplest example: at DNS resolution, point Guangdong to a South China Alibaba + Tencent Kubernetes cluster. Each cluster is independent and runs a complete internal business system. Worst case, if the public cloud itself fails, you get at most 50% unavailability.

Both being down at once is extremely unlikely.


## Farewell, Public Cloud. See you on the Yangtze River.

## References

【1】  
Cloudflare service outage, November 18, 2025  
https://blog.cloudflare.com/zh-cn/18-november-2025-outage/

【2】  
The invisible impact of DNS from the AWS outage: how DeepFlow quickly found root cause in chaos  
https://my.oschina.net/u/3681970/blog/18697034

【3】  
2023-11-12 Alibaba Cloud outage post-mortem and analysis  
https://github.tiankonguse.com/blog/2023/11/29/aliyun-break.html
