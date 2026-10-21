"""提取《紫微斗数精成》的文本，用于核对本项目星曜解读的出处。

目的：用户要求"真实数据"，即从权威资料核对，而不是自行撰写。
本脚本把 PDF 转成纯文本，供后续比对。
"""
import sys
import json
import pathlib
import fitz  # PyMuPDF

PDF = pathlib.Path(r"D:\idm download\紫微斗数精成(上下编) (紫微斗数精成(上下编)) (z-library.sk, 1lib.sk, z-lib.sk).pdf")
OUT = pathlib.Path(__file__).resolve().parent.parent / "_pdf"

OUT.mkdir(exist_ok=True)

doc = fitz.open(PDF)
print(f"页数: {doc.page_count}")
print(f"元数据: {doc.metadata}")
print()

# 先看第一页的文本情况（判断是扫描件还是文字版）
first = doc[0].get_text()
print("=== 第 1 页文本长度:", len(first), "===")
print(first[:800])
print()

# 统计整本有多少页有可选文本
has_text = 0
for i in range(min(doc.page_count, 50)):
    if len(doc[i].get_text().strip()) > 50:
        has_text += 1
print(f"前 50 页中有文本的: {has_text} 页")