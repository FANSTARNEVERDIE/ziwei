"""从 OCR 结果中抽取「四化星」章节的原文，建立可引用的出处文件。

来源：《紫微斗数精成》上编 第八章 诸星落命宫参断 · 23、四化星（p239-246）
本文件只做摘录整理，保留原文措辞，供项目核对与引用。
"""
import pathlib
import re
import json

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / "_pdf" / "pages"
OUT = ROOT / "_pdf" / "四化星-原文摘录.md"

# 四化星章节：p239 末尾开始，到 p246
PAGE_RANGE = range(239, 247)

parts = []
for pno in PAGE_RANGE:
    f = PAGES / f"{pno:04d}.txt"
    if not f.exists():
        continue
    txt = f.read_text(encoding="utf-8").strip()
    if txt:
        parts.append((pno, txt))

full = "\n".join(t for _, t in parts)

# 定位四个小节
sections = {}
markers = {
    "化禄": "（1）化禄星",
    "化权": "（2）化权星",
    "化科": "（3）化科星",
    "化忌": "（4)化忌星",
}
pos = {}
for name, mk in markers.items():
    i = full.find(mk)
    if i < 0:
        # 全角括号变体
        alt = mk.replace("（", "(").replace("）", ")")
        i = full.find(alt)
    pos[name] = i

order = sorted(pos.items(), key=lambda kv: kv[1])
for idx, (name, start) in enumerate(order):
    end = order[idx + 1][1] if idx + 1 < len(order) else len(full)
    if start < 0:
        continue
    sections[name] = full[start:end].strip()

OUT.parent.mkdir(exist_ok=True)
with OUT.open("w", encoding="utf-8") as fh:
    fh.write("# 《紫微斗数精成》四化星章节 · 原文摘录\n\n")
    fh.write("来源：上编 第八章 诸星落命宫参断 · 23、四化星（p239–246）\n")
    fh.write("说明：以下为 OCR 结果，可能有少量识别误差（已尽量保留原措辞）。\n\n")
    for name, body in sections.items():
        fh.write(f"## {name}星\n\n{body}\n\n---\n\n")

print(f"已写出 {OUT}")
print()
for name, body in sections.items():
    print(f"{name}: {len(body)} 字")
    print("  开头:", body[:60].replace("\n", " "))
    print()

# 单独抽出「例外/反吉」条目，这些是原项目缺失的
print("=== 书中明确提到的「化忌反吉」例外 ===")
ji = sections.get("化忌", "")
for pat in ["天同在成宫化忌", "巨门在辰宫化忌", "廉贞在亥化忌", "太阴在酉戌亥子化忌", "武曲化忌在已宫", "太阳在寅", "天机在卯化忌", "旺地化忌不忌"]:
    i = ji.find(pat)
    if i >= 0:
        print(f"  · {ji[max(0,i-30):i+90].strip()}")
        print()