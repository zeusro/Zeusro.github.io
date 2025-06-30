---
layout:       post
title:        "一天速学bash"
subtitle:     "想想就好"
date:         2019-04-07
author:       "Zeusro"
header-img:   "img/b/2019/Silver-Days.jpg"
header-mask:  0.2
catalog:      true
tags:
    - bash
---


在[超级速查表](https://github.com/skywind3000/awesome-cheatsheets/blob/master/languages/bash.sh)的基础上增加了一点其他内容

## 特殊符号

### #!

#!是特殊的表示符，解释此脚本的shell的路径

### '（单引号）

单引号用来定义字符串，单引号内不能引用变量

```bash
a='a'
echo $a
a='$a'
echo $a
#结果：
#a
#$a
```

输出单引号的唯一方法是**双引号把它括起来**

```bash
#!/bin/bash
echo "'"单引号"'"
```

### "（双引号）

由双引号括起来的字符，除

1. $
2. '
3. "
4. \

这几个字符仍是特殊字符并保留其特殊功能外，其余字符仍作为普通字符对待

### `（反引号）

相当于$(command)

```bash
abc=`echo The number of users is `who| wc-l``
```

### 其他特殊符号

```bash
!!                  # 上一条命令
!^                  # 上一条命令的第一个单词
!$                  # 上一条命令的最后一个单词
!string             # 最近一条包含string的命令
!^string1^string2   # 最近一条包含string1的命令, 快速替换为string2, 相当于!!:s/string1/string2/
!#                  # 本条命令之前所有的输入内容
```

## 变量

运行shell时，会同时存在三种变量：

1.  局部变量 局部变量在脚本或命令中定义，仅在当前shell实例中有效，其他shell启动的程序不能访问局部变量。
2. 环境变量 所有的程序，包括shell启动的程序，都能访问环境变量，有些程序需要环境变量来保证其正常运行。必要的时候shell脚本也可以定义环境变量。
3. shell变量 shell变量是由shell程序设置的特殊变量。shell变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了shell的正常运行


### 基本定义和使用

```bash
your_name="qinjx"
echo $your_name
echo ${your_name}
# 只读变量，只读变量的值不能被改变。
readonly your_name
# 变量被删除后不能再次使用。unset 命令不能删除只读变量。
unset your_name
```

### 特殊变量

```bash
varname=value             # 定义变量
varname=value command     # 定义子进程变量并执行子进程
echo $varname             # 查看变量内容
echo $$                   # 查看当前 shell 的进程号
echo $!                   # 查看最近调用的后台任务进程号
echo $?                   # 查看最近一条命令的返回码
export VARNAME=value      # 设置环境变量（将会影响到子进程）
```

### 查看

```bash
declare -a                # 查看所有数组
declare -f                # 查看所有函数
declare -F                # 查看所有函数，仅显示函数名
declare -i                # 查看所有整数
declare -r                # 查看所有只读变量
declare -x                # 查看所有被导出成环境变量的东西
declare -p varname        # 输出变量是怎么定义的（类型+值）
```

### 逻辑操作

```bash
${varname:-word}          # 如果变量不为空则返回变量，否则返回 word
${varname:=word}          # 如果变量不为空则返回变量，否则赋值成 word 并返回
${varname:?message}       # 如果变量不为空则返回变量，否则打印错误信息并退出
${varname:+word}          # 如果变量不为空则返回 word，否则返回 null
```

### 正则匹配

```bash
${variable#pattern}       # 如果变量头部匹配 pattern，则删除最小匹配部分返回剩下的
${variable##pattern}      # 如果变量头部匹配 pattern，则删除最大匹配部分返回剩下的
${variable%pattern}       # 如果变量尾部匹配 pattern，则删除最小匹配部分返回剩下的
${variable%%pattern}      # 如果变量尾部匹配 pattern，则删除最大匹配部分返回剩下的
${variable/pattern/str}   # 将变量中第一个匹配 pattern 的替换成 str，并返回
${variable//pattern/str}  # 将变量中所有匹配 pattern 的地方替换成 str 并返回

*(patternlist)            # 零次或者多次匹配
+(patternlist)            # 一次或者多次匹配
?(patternlist)            # 零次或者一次匹配
@(patternlist)            # 单词匹配
!(patternlist)            # 不匹配
```

## 数据结构

## 字符串

- 拼接字符串

```bash
your_name="runoob"
# 使用双引号拼接
greeting="hello, "$your_name" !"
greeting_1="hello, ${your_name} !"
echo $greeting  $greeting_1
# 使用单引号拼接
greeting_2='hello, '$your_name' !'
greeting_3='hello, ${your_name} !'
echo $greeting_2  $greeting_3
```

- 获取字符串长度

```bash
string=a
echo ${#string}
```

- 提取子字符串

以下实例从字符串第 2 个字符开始截取 4 个字符：


```bash
string="runoob is a great site"
echo ${string:1:4} # 输出 unoo
```

- 查找子字符串

查找字符 i 或 o 的位置(哪个字母先出现就计算哪个)：

```bash
string="runoob is a great site"
echo `expr index "$string" io`  # 输出 4
```


### 数组

```bash
array_name=(
value0
value1
value2
value3
)
array_name[0]=value0
echo ${#array_name[n]}
# 使用 @ 符号可以获取数组中的所有元素，例如：
echo ${array_name[@]}
# 取得数组元素的个数
length=${#array_name[@]}
# 或者
length=${#array_name[*]}
# 取得数组单个元素的长度
lengthn=${#array_name[n]}

A=( foo bar "abc" 42 ) # 数组定义
B=("${A[@]:1:2}")         # 数组切片：B=( bar "abc" )
C=("${A[@]:1}")           # 数组切片：C=( bar "abc" 42 )
echo "${B[@]}"            # bar abc
echo "${B[1]}"            # abc
echo "${C[@]}"            # bar abc 42
echo "${C[@]: -2:2}"      # abc 42  减号前的空格是必须的
```


## 函数

```bash
# 定义一个新函数
# 参数返回，可以显示加：return 返回，如果不加，将以最后一条命令运行结果，作为返回值。
function myfunc() {
    # $1 代表第一个参数，$N 代表第 N 个参数
    # $# 代表参数个数
    # $0 代表被调用者自身的名字
    # $@ 代表所有参数，类型是个数组，想传递所有参数给其他命令用 cmd "$@" 
    # $* 空格链接起来的所有参数，类型是字符串
    {shell commands ...}
}

myfunc                    # 调用函数 myfunc 
myfunc arg1 arg2 arg3     # 带参数的函数调用
myfunc "$@"               # 将所有参数传递给函数
myfunc "${array[@]}"      # 将一个数组当作多个参数传递给函数
shift                     # 参数左移

```


## 流程控制

### 条件语句

#### 逻辑判断

```bash
statement1 && statement2  # and 操作符
statement1 || statement2  # or 操作符

exp1 -a exp2              # exp1 和 exp2 同时为真时返回真（POSIX XSI扩展）
exp1 -o exp2              # exp1 和 exp2 有一个为真就返回真（POSIX XSI扩展）
( expression )            # 如果 expression 为真时返回真，输入注意括号前反斜杆
! expression              # 如果 expression 为假那返回真
```

#### 字符串判断

```bash
str1 = str2               # 判断字符串相等，如 [ "$x" = "$y" ] && echo yes
str1 != str2              # 判断字符串不等，如 [ "$x" != "$y" ] && echo yes
str1 < str2               # 字符串小于，如 [ "$x" \< "$y" ] && echo yes
str2 > str2               # 字符串大于，注意 < 或 > 是字面量，输入时要加反斜杆
-n str1                   # 判断字符串不为空（长度大于零）
-z str1                   # 判断字符串为空（长度等于零）
```

#### 数字判断

```bash
num1 -eq num2             # 数字判断：num1 == num2
num1 -ne num2             # 数字判断：num1 != num2
num1 -lt num2             # 数字判断：num1 < num2
num1 -le num2             # 数字判断：num1 <= num2
num1 -gt num2             # 数字判断：num1 > num2
num1 -ge num2             # 数字判断：num1 >= num2
```

#### 文件判断

```bash
-a file                   # 判断文件存在，如 [ -a /tmp/abc ] && echo "exists"
-d file                   # 判断文件存在，且该文件是一个目录
-e file                   # 判断文件存在，和 -a 等价
-f file                   # 判断文件存在，且该文件是一个普通文件（非目录等）
-r file                   # 判断文件存在，且可读
-s file                   # 判断文件存在，且尺寸大于0
-w file                   # 判断文件存在，且可写
-x file                   # 判断文件存在，且执行
-N file                   # 文件上次修改过后还没有读取过
-O file                   # 文件存在且属于当前用户
-G file                   # 文件存在且匹配你的用户组
file1 -nt file2           # 文件1 比 文件2 新
file1 -ot file2           # 文件1 比 文件2 旧
```

#### 分支控制

```bash
test {expression}         # 判断条件为真的话 test 程序返回0 否则非零
[ expression ]            # 判断条件为真的话返回0 否则非零

test "abc" = "def"        # 查看返回值 echo $? 显示 1，因为条件为假
test "abc" != "def"       # 查看返回值 echo $? 显示 0，因为条件为真

test -a /tmp; echo $?     # 调用 test 判断 /tmp 是否存在，并打印 test 的返回值
[ -a /tmp ]; echo $?      # 和上面完全等价，/tmp 肯定是存在的，所以输出是 0

test cond && cmd1         # 判断条件为真时执行 cmd1
[ cond ] && cmd1          # 和上面完全等价
[ cond ] && cmd1 || cmd2  # 条件为真执行 cmd1 否则执行 cmd2
```

##### if

```bash
# 判断 /etc/passwd 文件是否存在
# 经典的 if 语句就是判断后面的命令返回值为0的话，认为条件为真，否则为假
if test -e /etc/passwd; then
    echo "alright it exists ... "
else
    echo "it doesn't exist ... "
fi

# 和上面完全等价，[ 是个和 test 一样的可执行程序，但最后一个参数必须为 ]
# 这个名字为 "[" 的可执行程序一般就在 /bin 或 /usr/bin 下面，比 test 优雅些
if [ -e /etc/passwd ]; then   
    echo "alright it exists ... "
else
    echo "it doesn't exist ... "
fi

# 和上面两个完全等价，其实到 bash 时代 [ 已经是内部命令了，用 enable 可以看到
[ -e /etc/passwd ] && echo "alright it exists" || echo "it doesn't exist"

# 判断变量的值
if [ "$varname" = "foo" ]; then
    echo "this is foo"
elif [ "$varname" = "bar" ]; then
    echo "this is bar"
else
    echo "neither"
fi

# 复杂条件判断，注意 || 和 && 是完全兼容 POSIX 的推荐写法
if [ $x -gt 10 ] && [ $x -lt 20 ]; then
    echo "yes, between 10 and 20"
fi

# 可以用 && 命令连接符来做和上面完全等价的事情
[ $x -gt 10 ] && [ $x -lt 20 ] && echo "yes, between 10 and 20"

# 小括号和 -a -o 是 POSIX XSI 扩展写法，小括号是字面量，输入时前面要加反斜杆
if [ \( $x -gt 10 \) -a \( $x -lt 20 \) ]; then
    echo "yes, between 10 and 20"
fi
```

### 循环

#### while

```bash
# while 循环
while condition; do
    statements
done

i=1
while [ $i -le 10 ]; do
    echo $i; 
    i=$(expr $i + 1)
done

# 死循环
while :
do
    echo I love you forever
done

while 命令
do
    循环体
done > 文件名
# 这个结构会将命令的输出，以及循环体中的标准输出都重定向到指定的文件中。 

```

#### for

```bash
# for 循环：上面的 while 语句等价
for i in {1..10}; do
    echo $i
done

for name [in list]; do
    statements
done

# for 列举某目录下面的所有文件
for f in /home/*; do 
    echo $f
done

# bash 独有的 (( .. )) 语句，更接近 C 语言，但是不兼容 posix sh
for (( initialisation ; ending condition ; update )); do
    statements
done

# 和上面的写法等价
for ((i = 0; i < 10; i++)); do echo $i; done
```

#### switch case


```bash
# case 判断
case expression in 
    pattern1 )
        statements ;;
    pattern2 )
        statements ;;
    * )
        otherwise ;;
esac

```

#### until

```bash
# until 语句
until condition; do
    statements
done

```

#### select

```bash
# select 语句
select name [in list]; do
  statements that can use $name
done
```


## 输入/输出重定向

```bash
cmd1 | cmd2                        # 管道，cmd1 的标准输出接到 cmd2 的标准输入
< file                             # 将文件内容重定向为命令的标准输入
> file                             # 将命令的标准输出重定向到文件，会覆盖文件
>> file                            # 将命令的标准输出重定向到文件，追加不覆盖
>| file                            # 强制输出到文件，即便设置过：set -o noclobber
n>| file                           # 强制将文件描述符 n的输出重定向到文件
<> file                            # 同时使用该文件作为标准输入和标准输出
n<> file                           # 同时使用文件作为文件描述符 n 的输出和输入
n> file                            # 重定向文件描述符 n 的输出到文件
n< file                            # 重定向文件描述符 n 的输入为文件内容
n>&                                # 将标准输出 dup/合并 到文件描述符 n
n<&                                # 将标准输入 dump/合并 定向为描述符 n
n>&m                               # 文件描述符 n 被作为描述符 m 的副本，输出用
n<&m                               # 文件描述符 n 被作为描述符 m 的副本，输入用
&>file                             # 将标准输出和标准错误重定向到文件
<&-                                # 关闭标准输入
>&-                                # 关闭标准输出
n>&-                               # 关闭作为输出的文件描述符 n
n<&-                               # 关闭作为输入的文件描述符 n
diff <(cmd1) <(cmd2)               # 比较两个命令的输出
```

## 运算

### 算术运算

```bash
num=echo $(expr 1 + 2) # 兼容 posix sh 的计算，使用 expr 命令计算结果
num=$(($num + 1))         # 变量递增
num=$((num + 1))          # 变量递增，双括号内的 $ 可以省略
num=$((1 + (2 + 3) * 2))  # 复杂计算
```

## 彩蛋

```bash
function g()
{
phone='13'
n=1
while [ $n -le 9 ]
do
    ram=$((RANDOM % 9))
    phone=$phone$ram
    let n++
done
echo $phone
}

while true; do dig "elastic.spain.adevinta.com" | grep time; sleep 2; done
```

## 参考链接

1. [shell中echo使用单引号时输出单引号](https://blog.csdn.net/u012124304/article/details/78676050)
2. [Shell 变量](http://www.runoob.com/linux/linux-shell-variable.html)
3. [bash](https://github.com/skywind3000/awesome-cheatsheets/blob/master/languages/bash.sh)
4. [玩转Bash脚本：循环结构之while循环](https://blog.csdn.net/guodongxiaren/article/details/43341769)