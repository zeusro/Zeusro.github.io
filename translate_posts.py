#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量翻译文章
"""
import re
from pathlib import Path
from check_translations import check_translations

def translate_content(zh_content, target_lang):
    """
    翻译内容到目标语言
    这里使用AI进行翻译，保留markdown格式
    """
    # 这个函数将被替换为实际的翻译逻辑
    # 目前先返回占位符
    return f"<!-- Translated to {target_lang} -->\n\n{zh_content}"

def translate_post(post_info):
    """翻译单个文章的所有缺失语言"""
    post_dir = post_info['post_dir']
    missing_langs = post_info['missing_langs']
    zh_content = post_info['zh_content']
    lang_files = post_info['lang_files']
    
    # 获取文件名基础
    zh_file = lang_files.get('zh', {}).get('file')
    if not zh_file:
        print(f"  No Chinese file found, skipping...")
        return
    
    # 从文件名提取基础名称
    filename_base = zh_file.stem.replace('_zh', '')
    
    print(f"\nTranslating {post_dir.name}:")
    print(f"  Missing languages: {', '.join(missing_langs)}")
    
    # 翻译每个缺失的语言
    for lang in missing_langs:
        lang_file = post_dir / f"{filename_base}_{lang}.md"
        
        # 读取现有内容（如果有）
        existing_content = ""
        if lang_file.exists():
            existing_content = lang_file.read_text(encoding='utf-8')
        
        # 如果已经有实际翻译内容（不是TODO），跳过
        if existing_content and f'TODO: Translate to {lang}' not in existing_content and existing_content.strip():
            print(f"  {lang}: Already translated, skipping...")
            continue
        
        # 翻译内容
        print(f"  Translating to {lang}...")
        translated_content = translate_content(zh_content, lang)
        
        # 写入文件
        lang_file.write_text(translated_content, encoding='utf-8')
        print(f"  ✓ Saved: {lang_file.name}")

def main():
    """主函数"""
    print("Checking for posts that need translation...")
    posts_to_translate = check_translations()
    
    print(f"\nFound {len(posts_to_translate)} posts that need translation")
    print("Starting translation process...\n")
    
    # 翻译每篇文章
    for i, post_info in enumerate(posts_to_translate, 1):
        try:
            print(f"\n[{i}/{len(posts_to_translate)}] Processing: {post_info['post_dir'].name}")
            translate_post(post_info)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n\nTranslation complete! Processed {len(posts_to_translate)} posts.")

if __name__ == '__main__':
    main()
