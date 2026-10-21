"""从 OCR 结果中提取「诸星落命宫参断」章节，按星分节保存。

来源：《紫微斗数精成》上编 第八章（p97–238）
  1 紫微星 p97   2 天机星 p109  3 太阳星 p120  4 武曲星 p130
  5 天同星 p140  6 廉贞星 p149  7 天府星 p160  8 太阴星 p165
  9 贪狼星 p172 10 巨门星 p180 11 天相星 p187 12 天梁星 p191
 13 七杀星 p197 14 破军星 p204 15 命无主星 p210
 16 禄存天马 p213  17 文昌文曲 p217  18 天魁天钺 p222
 19 左辅右弼 p225  20 擎羊陀罗 p228  21 火星铃星 p232
 22 天空地劫 p236
"""
import pathlib
import re
import json

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "_pdf" / "pages"
OUT = ROOT / "_pdf" / "诸星-原文.md"

# 章节起始页（书页码）→ (星名, 标题)
CHAPTERS = [
    (97, "紫微"), (109, "天机"), (120, "太阳"), (130, "武曲"),
    (140, "天同"), (149, "廉贞"), (160, "天府"), (165, "太阴"),
    (172, "贪狼"), (180, "巨门"), (187, "天相"), (191, "天梁"),
    (197, "七杀"), (204, "破军"), (210, "命无主星"),
    (213, "禄存天马"), (217, "文昌文曲"), (222, "天魁天钺"),
    (225, "左辅右弼"), (228, "擎羊陀罗"), (232, "火星铃星"),
    (236, "天空地劫"),
]


def page_text(pno):
    f = PAGES / f"{pno:04d}.txt"
    if not f.exists():
        return ""
    return f.read_text(encoding="utf-8").strip()


# 收集所有页
available = []
for pno in range(97, 247):
    t = page_text(pno)
    if t:
        available.append((pno, t))

print(f"可用页数: {len(available)}")

lines = ["# 《紫微斗数精成》诸星落命宫参断 · 原文\n",
         "来源：上编 第八章（p97–238）\n",
         "说明：OCR 结果，可能有少量识别误差。\n"]

for i, (start, name) in enumerate(CHAPTERS):
    end = CHAPTERS[i + 1][0] - 1 if i + 1 < len(CHAPTERS) else 238
    body = []
    for pno, t in available:
        if start <= pno <= end:
            body.append(t)
    text = "\n".join(body)
    lines.append(f"\n## {name}（p{start}–{end}）\n")
    # 保留全文，不做截断 —— 先前截到 6000 字，导致后半段的
    # 组合喜忌、四化、入十二宫等内容被丢掉，无法用于核对
    lines.append(text)
    lines.append("\n---\n")
    print(f"  {name}: p{start}-{end}, {len(text)} 字")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"\n已写出 {OUT}")
print(f"总字数: {len(chr(10).join(lines))}")