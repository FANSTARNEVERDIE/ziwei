"""提取第九章「诸星落十二宫参断」原文，按宫分节。

来源：《紫微斗数精成》上编 第九章（p271–380）
  第一节 兄弟宫 p271
  第二节 夫妻宫 p278
  第三节 子女宫 p294
  第四节 财帛宫 p305
  第五节 疾厄宫 p317
  第六节 迁移宫 p329
  第七节 奴仆宫 p340
  第八节 事业（官禄）宫 p347
  第九节 田宅宫 p361
  第十节 福德宫 p370
  第十二节 父母宫 p380
（命宫见第八章；目录未单列命宫）
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "_pdf" / "pages"
OUT = ROOT / "_pdf" / "十二宫参断-原文.md"

# (起始页, 宫名)
SECTIONS = [
    (271, "兄弟宫"),
    (278, "夫妻宫"),
    (294, "子女宫"),
    (305, "财帛宫"),
    (317, "疾厄宫"),
    (329, "迁移宫"),
    (340, "奴仆宫"),
    (347, "官禄宫"),
    (361, "田宅宫"),
    (370, "福德宫"),
    (380, "父母宫"),
]

available = {}
for pno in range(265, 395):
    f = PAGES / f"{pno:04d}.txt"
    if f.exists():
        t = f.read_text(encoding="utf-8").strip()
        if t:
            available[pno] = t

print(f"可用页数: {len(available)}")

lines = ["# 《紫微斗数精成》诸星落十二宫参断 · 原文\n",
         "来源：上编 第九章（p271–380）\n",
         "说明：OCR 结果，可能有少量识别误差。\n"]

for i, (start, name) in enumerate(SECTIONS):
    end = SECTIONS[i + 1][0] - 1 if i + 1 < len(SECTIONS) else 388
    body = [t for p, t in sorted(available.items()) if start <= p <= end]
    text = "\n".join(body)
    lines.append(f"\n## {name}（p{start}–{end}）\n")
    lines.append(text if text else "（尚未 OCR 到此页）")
    lines.append("\n---\n")
    print(f"  {name}: p{start}-{end}, {len(text)} 字")

OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"\n已写出 {OUT}")
print(f"总字数: {len(chr(10).join(lines))}")