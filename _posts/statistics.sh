#!/usr/bin/env bash
# cd _posts || { echo "目录 _posts 不存在"; exit 1; }

echo "按年份统计（依据文件名开头 YYYY-）："
# 提取每个 *.md 文件名开头的4位年份，统计
for f in *.md; do
  # 忽略不是这种格式的文件
  if [[ $f =~ ^([0-9]{4})- ]]; then
    echo "${BASH_REMATCH[1]}"
  fi
done | sort | uniq -c | while read cnt year; do
  printf "%s 年: %s 篇\n" "$year" "$cnt"
done

# 总数
total=$(ls *.md 2>/dev/null | wc -l)
echo "-----------------------------"
echo "总文章数: $total 篇"