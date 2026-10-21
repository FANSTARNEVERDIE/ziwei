"""全量 OCR《紫微斗数精成》，输出为可检索的文本。

607 页扫描件，单页约 7 秒，全量约 70 分钟。
用多进程并行加速，并按页保存，便于断点续跑。
"""
import pathlib
import sys
import time
import json
import multiprocessing as mp

import fitz

PDF = pathlib.Path(r"D:\idm download\紫微斗数精成(上下编) (紫微斗数精成(上下编)) (z-library.sk, 1lib.sk, z-lib.sk).pdf")
OUT = pathlib.Path(__file__).resolve().parent.parent / "_pdf"
OUT.mkdir(exist_ok=True)

PAGES_DIR = OUT / "pages"
PAGES_DIR.mkdir(exist_ok=True)


def ocr_page(args):
    pno, dpi = args
    out_file = PAGES_DIR / f"{pno + 1:04d}.txt"
    if out_file.exists() and out_file.stat().st_size > 0:
        return (pno, "skip", 0)

    from rapidocr_onnxruntime import RapidOCR
    doc = fitz.open(PDF)
    page = doc[pno]
    pix = page.get_pixmap(dpi=dpi)
    img = pix.tobytes("png")
    doc.close()

    ocr = RapidOCR()
    t0 = time.time()
    result, _ = ocr(img)
    dt = time.time() - t0

    if not result:
        out_file.write_text("", encoding="utf-8")
        return (pno, "empty", dt)

    text = "".join(item[1] for item in result)
    out_file.write_text(text, encoding="utf-8")
    return (pno, "ok", dt)


if __name__ == "__main__":
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 607
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 200

    jobs = [(p - 1, dpi) for p in range(start, end + 1)]
    print(f"待处理 {len(jobs)} 页，dpi={dpi}", flush=True)

    t0 = time.time()
    done = 0
    with mp.Pool(processes=6) as pool:
        for pno, status, dt in pool.imap_unordered(ocr_page, jobs):
            done += 1
            if done % 10 == 0 or done == len(jobs):
                el = time.time() - t0
                eta = el / done * (len(jobs) - done)
                print(f"  {done}/{len(jobs)}  已用 {el:.0f}s  预计还需 {eta:.0f}s  第{pno+1}页 {status}",
                      flush=True)

    print("完成", flush=True)