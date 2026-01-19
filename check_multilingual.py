#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查缺少多语言翻译的帖子
"""
import re
from pathlib import Path

def check_multilingual_status():
    """检查所有帖子的多语言状态"""
    posts_dir = Path('_posts')
    includes_dir = Path('_includes/posts')
    
    posts_to_translate = []
    
    # 遍历所有帖子文件
    for post_file in sorted(posts_dir.glob('*.md')):
        # 读取文件内容
        content = post_file.read_text(encoding='utf-8')
        
        # 跳过 published: false 的帖子
        if re.search(r'published:\s*false', content, re.IGNORECASE):
            continue
        
        # 检查是否已有多语言支持
        if 'multilingual: true' not in content:
            continue
        
        # 获取文件夹名和文件名
        folder_name = post_file.stem
        match = re.match(r'\d{4}-\d{2}-\d{2}-(.+)\.md', post_file.name)
        if match:
            filename_base = match.group(1)
        else:
            filename_base = post_file.stem
        
        # 检查多语言文件是否存在
        # 先从帖子内容中提取实际的include路径
        include_folder = None
        include_pattern = re.search(r'include posts/([^/]+)/([^_]+)_', content)
        if include_pattern:
            # 从include路径提取实际的文件夹和文件名
            actual_folder = include_pattern.group(1)
            actual_filename_base = include_pattern.group(2)
            include_folder = includes_dir / actual_folder
            filename_base = actual_filename_base
        else:
            # 如果没有找到include路径，使用默认的文件夹名
            include_folder = includes_dir / folder_name
        
        missing_langs = []
        
        for lang in ['en', 'jp', 'ru']:
            # 尝试多种文件命名格式
            lang_file1 = include_folder / f"{filename_base}_{lang}.md"
            lang_file2 = include_folder / f"{lang}.md"
            
            # 检查文件是否存在（支持两种命名格式）
            lang_file = None
            if lang_file1.exists():
                lang_file = lang_file1
            elif lang_file2.exists():
                lang_file = lang_file2
            
            if not lang_file or not lang_file.exists():
                missing_langs.append(lang)
            else:
                # 检查文件内容是否是TODO占位符
                lang_content = lang_file.read_text(encoding='utf-8')
                if f'TODO: Translate to {lang}' in lang_content or f'<!-- TODO: Translate to {lang} -->' in lang_content or lang_content.strip() == '':
                    missing_langs.append(lang)
        
        if missing_langs:
            posts_to_translate.append({
                'post_file': post_file,
                'folder_name': folder_name,
                'filename_base': filename_base,
                'missing_langs': missing_langs,
                'include_folder': include_folder
            })
    
    return posts_to_translate

if __name__ == '__main__':
    posts_to_translate = check_multilingual_status()
    print(f"Found {len(posts_to_translate)} posts that need translation:")
    for item in posts_to_translate:
        print(f"  {item['post_file'].name}: missing {', '.join(item['missing_langs'])}")
