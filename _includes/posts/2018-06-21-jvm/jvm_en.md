## Common Garbage Collectors

### ParNew Collector

-XX:ParallelGCThreads
Limit the number of garbage collection threads
 
### Parallel Scavenge Collector
 
Maximum garbage collection pause time
-XX:MaxGCPauseMillis
Throughput size
-XX:GCTimeRatio
 
Lowering maximum garbage collection pause time comes at the cost of throughput and new generation space, directly causing garbage collection to become more frequent
 
Beginner-friendly operation:
-XX:UseAdaptiveSizePolicy
GC adaptive adjustment strategy
 
### CMS Collector

 A collector targeting shortest recovery pause time, implemented based on "mark-sweep".
Core advantage: concurrent collection, low pause
 

* Alibaba Cloud monitoring case

```
/acs/user/monitoragent/jre/bin/java -server 
-Xmx128m 
-Xms128m 
-Xmn70m 
-XX:SurvivorRatio=10 
-XX:PermSize=25m 
-XX:MaxPermSize=30m 
-XX:+DisableExplicitGC 
-XX:+UseConcMarkSweepGC 
-XX:+CMSParallelRemarkEnabled 
-XX:+UseCMSCompactAtFullCollection 
-XX:+CMSClassUnloadingEnabled 
-XX:LargePageSizeInBytes=128m 
-XX:+UseFastAccessorMethods 
-XX:+UseCMSInitiatingOccupancyOnly 
-XX:CMSInitiatingOccupancyFraction=70 
-XX:+UseParNewGC 
-verbose:gc 
-Xloggc:/acs/monitor/system/monitoragent/logs/gc.log 
-XX:+PrintGCDetails 
-XX:+PrintGCDateStamps 
-Duser.timezone=GMT+8 
-Djava.endorsed.dirs= 
-classpath /acs/user/monitoragent/lib:/acs/user/monitoragent/lib/aliyun-openservices-sls-v0.3-inner-0.1.0.jar:/acs/user/monitoragent/lib/aliyun-openservices-with-mqs.1.0.12.jar:/acs/user/monitoragent/lib/commons-beanutils-1.8.3.jar:/acs/user/monitoragent/lib/commons-codec-1.4.jar:/acs/user/monitoragent/lib/commons-collections-3.2.1.jar:/acs/user/monitoragent/lib/commons-digester-1.8.jar:/acs/user/monitoragent/lib/commons-httpclient-3.1.jar:/acs/user/monitoragent/lib/commons-lang-2.6.jar:/acs/user/monitoragent/lib/commons-lang3-3.1.jar:/acs/user/monitoragent/lib/commons-logging-1.0.4.jar:/acs/user/monitoragent/lib/commons-validator-1.4.0.jar:/acs/user/monitoragent/lib/diamond-client-3.6.7.jar:/acs/user/monitoragent/lib/diamond-utils-3.1.3.jar:/acs/user/monitoragent/lib/ezmorph-1.0.6.jar:/acs/user/monitoragent/lib/fastjson-1.2.41.jar:/acs/user/monitoragent/lib/hamcrest-core-1.1.jar:/acs/user/monitoragent/lib/httpclient-4.2.1.jar:/acs/user/monitoragent/lib/httpcore-4.2.1.jar:/acs/user/monitoragent/lib/jackson-core-lgpl-1.9.6.jar:/acs/user/monitoragent/lib/jackson-mapper-lgpl-1.9.6.jar:/acs/user/monitoragent/lib/jdom-1.1.jar:/acs/user/monitoragent/lib/json-lib-2.4-jdk15.jar:/acs/user/monitoragent/lib/junit-4.10.jar:/acs/user/monitoragent/lib/log4j-1.2.17.jar:/acs/user/monitoragent/lib/mysql-connector-java-5.1.25.jar:/acs/user/monitoragent/lib/netty-all-4.0.36.Final.jar:/acs/user/monitoragent/lib/nginx.agent.jar:/acs/user/monitoragent/lib/ons-api-1.1.5.jar:/acs/user/monitoragent/lib/ons-client-1.1.5.jar:/acs/user/monitoragent/lib/protobuf-java-2.4.1.jar:/acs/user/monitoragent/lib/rocketmq-client-3.6.4.jar:/acs/user/monitoragent/lib/rocketmq-common-3.6.4.jar:/acs/user/monitoragent/lib/rocketmq-remoting-3.6.4.jar:/acs/user/monitoragent/lib/slf4j-api-1.7.5.jar:/acs/user/monitoragent/lib/slf4j-log4j12-1.7.5.jar:/acs/user/monitoragent/lib/test.junit-4.8.1.jar:/acs/user/monitoragent/lib/test.junit.hamcrest-1.1.jar: -Dagent.home=/acs/user/monitoragent com.alibaba.ace.nginx.agent.Startup /acs/user/monitoragent/conf
``` 

### G1 Collector

https://t.hao0.me/jvm/2017/01/15/jvm-g1.html

### ConcMarkSweepGC

The recommended parameter is -Xmn, because this parameter is very concise, equivalent to setting NewSize and MaxNewSize at once, and both are equal. -Xmn combined with -Xms heap starting size and -Xmx heap maximum size, exactly determines the heap memory layout (the designer probably also created three shorthand parameters for simplicity). Also, the official docs seem to say -Xmn started being supported in 1.4, but nowadays there shouldn't be anyone still using JRE before 1.4, right? 
 
* Usage example

```bash
java -jar 
-Xms10g 
-Xmx15g 
-XX:+UseConcMarkSweepGC 
-XX:NewSize=6g 
-XX:MaxNewSize=6g 
-verbose:gc 
-XX:+PrintGCDetails 
-XX:+PrintGCTimeStamps  
-Xloggc:./log/gc.log Slaver.jar
```

## JVM Analysis Tools

### jstat
> jstat's advantage is that it's built into the JVM, simple and brutal to use


    jstat -<option> [-t] [-h<lines>] <vmid> [<interval> [<count>]]
    pid=1
    jstat -gc $pid 3000 3000

```
–class Monitor class loading, unloading count, total space and time spent loading classes
–gc Monitor Java heap status, including Eden area, 2 Survivor areas, old generation, permanent generation capacity, etc.
–gccapacity Monitor content is basically the same as -gc, but output mainly focuses on maximum and minimum space used in each Java heap area
–gcutil Monitor content is basically the same as -gc, but output mainly focuses on percentage of used space to total space
–gccause Same function as -gcutil, but will additionally output the cause of the last GC
–gcnew Monitor new generation GC status
–gcnewcapacity Monitor content is basically the same as -gcnew, output mainly focuses on maximum and minimum space used
–gcold Monitor old generation GC status
–gcoldcapacity Monitor content is basically the same as ——gcold, output mainly focuses on maximum and minimum space used
–gcpermcapacity Output maximum and minimum space used in permanent generation
–compiler Output methods compiled by JIT compiler, time consumed, etc.
–printcompilation Output methods that have been JIT compiled
```

1. jstat –class<pid> : Display loaded class count, space occupied, etc.
```
Loaded Number of loaded classes
Bytes Bytes occupied by loaded classes
Unloaded Number of unloaded classes
Bytes Bytes of unloaded classes
Time Time spent loading and unloading classes
```

2. jstat -compiler <pid> Display VM real-time compilation count, etc.
```
Compiled Number of compilation tasks executed
Failed Number of compilation task execution failures
Invalid Number of compilation task execution invalidations
Time Time consumed by compilation tasks
FailedType Type of the last failed compilation task
FailedMethod Class and method where the last failed compilation task is located
```

3. jstat -gc <pid>: Can display GC information, view GC count and time.
```
S0C Capacity of first survivor (survivor area) in young generation (bytes)
S1C Capacity of second survivor (survivor area) in young generation (bytes)
S0U Currently used space of first survivor (survivor area) in young generation (bytes)
S1U Currently used space of second survivor (survivor area) in young generation (bytes)
EC Capacity of Eden (Garden of Eden) in young generation (bytes)
EU Currently used space of Eden (Garden of Eden) in young generation (bytes)
OC Capacity of Old generation (bytes)
OU Currently used space of Old generation (bytes)
PC Capacity of Perm (persistent generation) (bytes)
PU Currently used space of Perm (persistent generation) (bytes)
YGC Number of GCs in young generation from application startup to sampling
YGCT Time spent on GCs in young generation from application startup to sampling (s)
FGC Number of GCs in old generation (full GC) from application startup to sampling
FGCT Time spent on GCs in old generation (full GC) from application startup to sampling (s)
GCT Total time spent on GC from application startup to sampling (s)
```

4. jstat -gccapacity <pid>: Can display usage and occupied size of three generations (young, old, perm) objects in VM memory
```
NGCMN Initialized (minimum) size in young generation (young) (bytes)
NGCMX Maximum capacity of young generation (young) (bytes)
NGC Current capacity of young generation (young) (bytes)
S0C Capacity of first survivor (survivor area) in young generation (bytes)
S1C Capacity of second survivor (survivor area) in young generation (bytes)
EC Capacity of Eden (Garden of Eden) in young generation (bytes)
OGCMN Initialized (minimum) size in old generation (bytes)
OGCMX Maximum capacity of old generation (bytes)
OGC Currently newly generated capacity of old generation (bytes)
OC Capacity of Old generation (bytes)
PGCMN Initialized (minimum) size in perm generation (bytes)
PGCMX Maximum capacity of perm generation (bytes)
PGC Currently newly generated capacity of perm generation (bytes)
PC Capacity of Perm (persistent generation) (bytes)
YGC Number of GCs in young generation from application startup to sampling
FGC Number of GCs in old generation (full GC) from application startup to sampling
```

5. jstat -gcutil <pid>: Statistics GC information
```
S0 Percentage of used space of first survivor (survivor area) in young generation to current capacity
S1 Percentage of used space of second survivor (survivor area) in young generation to current capacity
E Percentage of used space of Eden (Garden of Eden) in young generation to current capacity
O Percentage of used space of old generation to current capacity
P Percentage of used space of perm generation to current capacity
YGC Number of GCs in young generation from application startup to sampling
YGCT Time spent on GCs in young generation from application startup to sampling (s)
FGC Number of GCs in old generation (full GC) from application startup to sampling
FGCT Time spent on GCs in old generation (full GC) from application startup to sampling (s)
GCT Total time spent on GC from application startup to sampling (s)
```

6. jstat -gcnew <pid>: Information about young generation objects.

```
S0C Capacity of first survivor (survivor area) in young generation (bytes)
S1C Capacity of second survivor (survivor area) in young generation (bytes)
S0U Currently used space of first survivor (survivor area) in young generation (bytes)
S1U Currently used space of second survivor (survivor area) in young generation (bytes)
TT Holding count limit
MTT Maximum holding count limit
EC Capacity of Eden (Garden of Eden) in young generation (bytes)
EU Currently used space of Eden (Garden of Eden) in young generation (bytes)
YGC Number of GCs in young generation from application startup to sampling
YGCT Time spent on GCs in young generation from application startup to sampling (s)
```

7. jstat -gcnewcapacity<pid>: Information about young generation objects and their usage.

```
NGCMN Initialized (minimum) size in young generation (young) (bytes)
NGCMX Maximum capacity of young generation (young) (bytes)
NGC Current capacity of young generation (young) (bytes)
S0CMX Maximum capacity of first survivor (survivor area) in young generation (bytes)
S0C Capacity of first survivor (survivor area) in young generation (bytes)
S1CMX Maximum capacity of second survivor (survivor area) in young generation (bytes)
S1C Capacity of second survivor (survivor area) in young generation (bytes)
ECMX Maximum capacity of Eden (Garden of Eden) in young generation (bytes)
EC Capacity of Eden (Garden of Eden) in young generation (bytes)
YGC Number of GCs in young generation from application startup to sampling
FGC Number of GCs in old generation (full GC) from application startup to sampling
```
8. jstat -gcold <pid>: Information about old generation objects.
```
PC Capacity of Perm (persistent generation) (bytes)
PU Currently used space of Perm (persistent generation) (bytes)
OC Capacity of Old generation (bytes)
OU Currently used space of Old generation (bytes)
YGC Number of GCs in young generation from application startup to sampling
FGC Number of GCs in old generation (full GC) from application startup to sampling
FGCT Time spent on GCs in old generation (full GC) from application startup to sampling (s)
GCT Total time spent on GC from application startup to sampling (s)
```
9. stat -gcoldcapacity <pid>: Information about old generation objects and their usage.
```
OGCMN Initialized (minimum) size in old generation (bytes)
OGCMX Maximum capacity of old generation (bytes)
OGC Currently newly generated capacity of old generation (bytes)
OC Capacity of Old generation (bytes)
YGC Number of GCs in young generation from application startup to sampling
FGC Number of GCs in old generation (full GC) from application startup to sampling
FGCT Time spent on GCs in old generation (full GC) from application startup to sampling (s)
GCT Total time spent on GC from application startup to sampling (s)
```
10. jstat -gcpermcapacity<pid>: Information about perm objects and their usage.
```
PGCMN Initialized (minimum) size in perm generation (bytes)
PGCMX Maximum capacity of perm generation (bytes)
PGC Currently newly generated capacity of perm generation (bytes)
PC Capacity of Perm (persistent generation) (bytes)
YGC Number of GCs in young generation from application startup to sampling
FGC Number of GCs in old generation (full GC) from application startup to sampling
FGCT Time spent on GCs in old generation (full GC) from application startup to sampling (s)
GCT Total time spent on GC from application startup to sampling (s)
```
11. jstat -printcompilation <pid>: Current VM execution information.
```
Compiled Number of compilation tasks
Size Size of bytecode generated by methods
Type Compilation type
Method Class name and method name used to identify compiled methods. Class names use / as a namespace separator. Method name is the method in the given class. The above format is set by the -XX:+PrintComplation option
```

### MemoryAnalyzer

## References
1. [JVM Tuning: Choosing the Right GC Collector (Three)](https://blog.csdn.net/historyasamirror/article/details/6245157)
1. [Deep Understanding of Java G1 Garbage Collector](http://ghoulich.xninja.org/tag/g1/)
1. [Becoming a JavaGC Expert (1)—In-depth and Easy-to-understand Java Garbage Collection Mechanism](http://www.importnew.com/1993.html)
1. [Becoming a JavaGC Expert (2)—How to Monitor Java Garbage Collection Mechanism](http://www.importnew.com/2057.html)
1. [Becoming a Java GC Expert (3)—How to Optimize Java Garbage Collection Mechanism](http://www.importnew.com/3146.html)
1. [Becoming a Java GC Expert (4)—Detailed Explanation of Apache's MaxClients Parameter and Its Impact on Tomcat FullGC Execution](http://www.importnew.com/3151.html)
1. [JVM Series Three: JVM Parameter Settings and Analysis](http://www.cnblogs.com/redcreen/archive/2011/05/04/2037057.html)
1. [Introducing Java GC Types and Replacing/Tuning GC](https://blog.csdn.net/roland101/article/details/2203461)
1. [Java Garbage Collection Mechanism (and How to Reduce GC Calls and Improve Performance)](https://blog.csdn.net/hyqsong/article/details/42006947)
1. [What Is Garbage Collection?](https://plumbr.io/handbook/what-is-garbage-collection)
1. [Frequent GC (Allocation Failure) and Long Young GC Time Analysis](https://juejin.im/post/5a9b811a6fb9a028e46e1c88)
1. [JVM Series Three: JVM Parameter Settings and Analysis](http://www.cnblogs.com/redcreen/archive/2011/05/04/2037057.html)
1. [javaGC Tuning](http://darktea.github.io/notes/2013/09/08/java-gc.html)
1. [Some Key Technologies of Java Hotspot G1 GC](https://tech.meituan.com/g1.html)
1. [JVM](https://crowhawk.github.io/tags/#JVM)
1. [JVM (java virtual machine) Memory Settings](https://www.cnblogs.com/jack204/archive/2012/07/02/2572932.html)
1. [java jstat Usage](https://www.pocketdigi.com/20170522/1573.html)
1. [jstat Command Detailed Explanation](https://blog.csdn.net/zhaozheng7758/article/details/8623549)
1. [jstat Usage Detailed Explanation (Analyzing JVM Usage)](https://blog.csdn.net/ouyang111222/article/details/53688986)
1. [java Class Loading Mechanism](http://www.cnblogs.com/ityouknow/p/5603287.html)
1. [G1(Garbage First) Usage](http://bboniao.com/jvm/2014-03/g1garbage-first.html)
1. [Java Command Learning Series (4): Jstat](http://www.importnew.com/18202.html)
1. [JVM Problem Analysis and Handling Manual](https://yq.aliyun.com/articles/632125)
1. [JVM Tuning Summary -Xms -Xmx -Xmn -Xss](https://yq.aliyun.com/articles/268842)
