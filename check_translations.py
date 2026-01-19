#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查需要翻译的文章
"""
import re
from pathlib import Path

try:
    from langdetect import detect, DetectorFactory
    # 设置种子以确保结果一致性
    DetectorFactory.seed = 0
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    print("Warning: langdetect not installed. Language detection disabled.")
    print("Install it with: pip install langdetect")

def detect_language(content):
    """
    检测文本内容的实际语言
    
    Args:
        content: 文本内容
        
    Returns:
        检测到的语言代码，如果检测失败返回 None
    """
    if not LANGDETECT_AVAILABLE:
        return None
    
    # 移除TODO占位符和空内容
    content = content.strip()
    if not content or 'TODO: Translate to' in content:
        return None
    
    # 移除Markdown语法，只保留文本内容
    # 移除代码块
    content = re.sub(r'```[\s\S]*?```', '', content)
    # 移除行内代码
    content = re.sub(r'`[^`]+`', '', content)
    # 移除链接
    content = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', content)
    # 移除Markdown标题标记
    content = re.sub(r'^#+\s+', '', content, flags=re.MULTILINE)
    # 移除Markdown列表标记
    content = re.sub(r'^[\*\-\+]\s+', '', content, flags=re.MULTILINE)
    # 移除Markdown粗体/斜体
    content = re.sub(r'[\*\*\_\_]+', '', content)
    
    # 提取至少100个字符的文本用于检测（langdetect需要足够的文本）
    text_for_detection = re.sub(r'\s+', ' ', content)
    if len(text_for_detection) < 100:
        return None
    
    try:
        detected_lang = detect(text_for_detection)
        # 映射langdetect的语言代码到我们的代码
        lang_map = {
            'zh-cn': 'zh',
            'zh-tw': 'zh',
            'ja': 'jp',  # langdetect使用'ja'表示日语
            'en': 'en',
            'ru': 'ru'
        }
        return lang_map.get(detected_lang, detected_lang)
    except Exception:
        return None

def check_language_match(file_lang, content):
    """
    检查文件内容是否与文件名中的语言代码匹配
    
    Args:
        file_lang: 文件名中的语言代码 (zh, en, jp, ru)
        content: 文件内容
        
    Returns:
        (is_match, detected_lang): 是否匹配，检测到的语言
    """
    detected_lang = detect_language(content)
    if detected_lang is None:
        # 无法检测（可能是TODO或内容太少），假设匹配
        return (True, None)
    
    # 特殊处理：jp 和 ja 都表示日语
    if file_lang == 'jp' and detected_lang == 'ja':
        return (True, detected_lang)
    if file_lang == 'ja' and detected_lang == 'jp':
        return (True, detected_lang)
    
    return (file_lang == detected_lang, detected_lang)

def check_translations(check_language_correctness=False):
    """
    检查所有需要翻译的文章
    
    Args:
        check_language_correctness: 是否检查文件内容语言是否正确（需要langdetect库）
    """
    includes_dir = Path('_includes/posts')
    
    posts_to_translate = []
    language_mismatches = []
    
    # 遍历所有文章文件夹
    for post_dir in sorted(includes_dir.iterdir()):
        if not post_dir.is_dir() or post_dir.name.startswith('.'):
            continue
        
        # 查找所有语言文件
        lang_files = {}
        for lang in ['zh', 'en', 'jp', 'ru']:
            # 查找该语言的文件
            lang_pattern = f"*_{lang}.md"
            lang_file_list = list(post_dir.glob(lang_pattern))
            
            if lang_file_list:
                lang_file = lang_file_list[0]
                content = lang_file.read_text(encoding='utf-8')
                
                # 检查是否是TODO占位符
                is_todo = f'TODO: Translate to {lang}' in content or content.strip() == ''
                
                # 检查语言是否正确（如果启用）
                language_correct = True
                detected_lang = None
                if check_language_correctness and not is_todo:
                    is_match, detected_lang = check_language_match(lang, content)
                    language_correct = is_match
                    if not is_match:
                        language_mismatches.append({
                            'file': lang_file,
                            'expected_lang': lang,
                            'detected_lang': detected_lang
                        })
                
                lang_files[lang] = {
                    'file': lang_file,
                    'is_todo': is_todo,
                    'content': content,
                    'language_correct': language_correct,
                    'detected_lang': detected_lang
                }
            else:
                lang_files[lang] = None
        
        # 检查哪些语言需要翻译
        missing_langs = []
        for lang in ['en', 'jp', 'ru']:
            if lang_files[lang] is None:
                missing_langs.append(lang)
            elif lang_files[lang]['is_todo']:
                missing_langs.append(lang)
        
        if missing_langs:
            # 获取中文版本作为参考
            zh_content = lang_files.get('zh', {}).get('content', '') if lang_files.get('zh') else ''
            posts_to_translate.append({
                'post_dir': post_dir,
                'missing_langs': missing_langs,
                'zh_content': zh_content,
                'lang_files': lang_files
            })
    
    return posts_to_translate, language_mismatches

if __name__ == '__main__':
    import sys
    
    # 检查是否启用语言检测
    check_lang = '--check-language' in sys.argv or '-l' in sys.argv
    
    posts_to_translate, language_mismatches = check_translations(
        check_language_correctness=check_lang
    )
    
    print(f"Found {len(posts_to_translate)} posts that need translation:")
    print()
    for item in posts_to_translate:
        print(f"{item['post_dir'].name}:")
        print(f"  Missing translations: {', '.join(item['missing_langs'])}")
        print()
    
    # 显示语言不匹配的文件
    if check_lang and language_mismatches:
        print(f"\nFound {len(language_mismatches)} files with language mismatches:")
        print()
        for mismatch in language_mismatches:
            print(f"{mismatch['file']}:")
            print(f"  Expected: {mismatch['expected_lang']}")
            print(f"  Detected: {mismatch['detected_lang']}")
            print()
    elif check_lang:
        print("\n✓ All files have correct language content.")
    
    if not check_lang and LANGDETECT_AVAILABLE:
        print("\nTip: Use --check-language or -l flag to verify language correctness")