"""用 rapidocr 对《紫微斗数精成》做 OCR。

先在第 1 页试点，确认中文识别质量，再决定是否全量。
"""
import pathlib
import sys
import time

import fitz
from rapidocr_onnxruntime import RapidOCR

PDF = pathlib.Path(r"D:\idm download\紫微斗数精成(上下编) (紫微斗数精成(上下编)) (z-library.sk, 1lib.sk, z-lib.sk).pdf")

doc = fitz.open(PDF)
ocr = RapidOCR()

# 试点：第 20 页（通常是目录或正文开始）
for pno in [19, 20, 30]:
    page = doc[pno]
    # 提高分辨率有助于识别小字
    pix = page.get_pixmap(dpi=200)
    img_bytes = pix.tobytes("png")

    t0 = time.time()
    result, _ = ocr(img_bytes)
    dt = time.time() - t0

    print(f"===== 第 {pno + 1} 页（耗时 {dt:.1f}s，{len(result) if result else 0} 块）=====")
    if result:
        text = "".join(item[1] for item in result)
        print(text[:700])
    else:
        print("(未识别出文字)")
    print()
    if pno == 19:
        # 只跑一页先看质量
        break