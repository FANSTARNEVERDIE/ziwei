"""从原文中抽取每颗星的「四化」段落，整理成对照文件。

这是核对 js/sihua-star.js 那 72 条的依据。
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_pdf" / "诸星-原文.md"
OUT = ROOT / "_pdf" / "各星四化-原文对照.md"

raw = SRC.read_text(encoding="utf-8")

# 切分成每颗星
marks = []
for m in re.finditer(r"^## (.+?)（p(\d+)–(\d+)）$", raw, re.M):
    marks.append((m.group(1), m.start(), m.end()))

sections = {}
for i, (name, start, head_end) in enumerate(marks):
    end = marks[i + 1][1] if i + 1 < len(marks) else len(raw)
    sections[name] = raw[head_end:end].strip()

lines = ["# 各星四化 · 原文对照\n",
         "来源：《紫微斗数精成》上编 第八章（p97–238）\n",
         "用途：核对 js/sihua-star.js 的 72 条「星×四化」\n"]

found = 0
for name, body in sections.items():
    # 找到「四化：」之后到下一个分段标记
    i = body.find("四化：")
    if i < 0:
        # 有的写成「四化」
        i = body.find("四化")
        if i < 0:
            continue
    seg = body[i:]
    # 截断到「论女命」或合理长度
    for stop in ["论女命", "入十二地支", "女命，", "☆"]:
        j = seg.find(stop, 10)
        if j > 100:
            seg = seg[:j]
            break
    seg = seg[:1800]
    lines.append(f"\n## {name}\n\n{seg}\n\n---\n")
    found += 1

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"抽出 {found} 颗星的四化段")
print(f"已写出 {OUT}")
print(f"字数: {len(chr(10).join(lines))}")

# 同时输出到 stdout 摘要
for name, body in sections.items():
    i = body.find("四化：")
    if i < 0:
        continue
    seg = body[i:i + 200].replace("\n", " ")
    print(f"  {name}: {seg[:140]}")