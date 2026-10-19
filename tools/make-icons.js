/* ============================================================
 * 生成 PWA 图标（纯 Node，不依赖第三方库）
 *
 * 手工构造 PNG：IHDR + IDAT(zlib) + IEND，
 * 像素缓冲用简单矩形绘制「紫」字轮廓的极简版：
 * 深色底 + 金色方框 + 中央金色方块（图标尺寸小，字形不可辨，
 * 故用几何符号表达品牌色，实际显示时配合应用名）。
 * ============================================================ */

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const BG = [10, 9, 8];          // #0a0908
const GOLD = [184, 148, 74];    // #b8944a
const GOLD_BRIGHT = [220, 187, 110]; // #dcbb6e

/** 画一个填充矩形（含边界检查） */
function fillRect(buf, W, H, x0, y0, x1, y1, color, alpha) {
  const a = alpha == null ? 1 : alpha;
  for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
      const i = (y * W + x) * 4;
      buf[i] = Math.round(buf[i] * (1 - a) + color[0] * a);
      buf[i + 1] = Math.round(buf[i + 1] * (1 - a) + color[1] * a);
      buf[i + 2] = Math.round(buf[i + 2] * (1 - a) + color[2] * a);
      buf[i + 3] = 255;
    }
  }
}

/** 画矩形描边 */
function strokeRect(buf, W, H, x0, y0, x1, y1, t, color, alpha) {
  fillRect(buf, W, H, x0, y0, x1, y0 + t, color, alpha);
  fillRect(buf, W, H, x0, y1 - t, x1, y1, color, alpha);
  fillRect(buf, W, H, x0, y0, x0 + t, y1, color, alpha);
  fillRect(buf, W, H, x1 - t, y0, x1, y1, color, alpha);
}

/**
 * 绘制图标
 * @param {number} size 边长
 * @param {boolean} maskable 是否留出安全边距（maskable 需要中心 80% 区域）
 */
function drawIcon(size, maskable) {
  const W = size, H = size;
  const buf = Buffer.alloc(W * H * 4, 0);
  // 背景（maskable 要求铺满整块，不做圆角）
  fillRect(buf, W, H, 0, 0, W, H, BG, 1);

  const s = size / 512;                    // 相对缩放
  const margin = maskable ? Math.round(512 * 0.14) * s : Math.round(512 * 0.09) * s;
  const t = Math.max(2, Math.round(10 * s));   // 描边粗细

  // 外框：品牌「方正」气质
  strokeRect(buf, W, H, margin, margin, W - margin, H - margin, t, GOLD, 0.85);

  // 内部 4×4 网格示意十二宫（极简，呼应盘面）
  const inner = margin + Math.round(46 * s);
  const innerSize = W - inner * 2;
  const gap = Math.max(1, Math.round(6 * s));
  const cell = (innerSize - gap * 3) / 4;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      // 中心 2×2 留空（对应盘面核心区）
      const isCenter = (r === 1 || r === 2) && (c === 1 || c === 2);
      if (isCenter) continue;
      const x0 = Math.round(inner + c * (cell + gap));
      const y0 = Math.round(inner + r * (cell + gap));
      const x1 = Math.round(x0 + cell);
      const y1 = Math.round(y0 + cell);
      const edge = (r === 0 || r === 3 || c === 0 || c === 3);
      // 外围 12 格
      if (edge) strokeRect(buf, W, H, x0, y0, x1, y1, Math.max(1, Math.round(3 * s)), GOLD, 0.6);
    }
  }

  // 中心：一个居中的圆点（不用大实心块）
  // 大金色方块会让中心与周围 12 格权重失衡，且在 192px 下像个色块；
  // 改成描边圆环 + 内点，既点出「核心」，又保持整体是「盘」的感觉。
  const ccx = W / 2;
  const ccy = H / 2;
  const ringR = cell * 0.95;
  const ringT = Math.max(2, Math.round(6 * s));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - ccx;
      const dy = y + 0.5 - ccy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(d - ringR) <= ringT / 2) {
        const i = (y * W + x) * 4;
        buf[i] = GOLD_BRIGHT[0];
        buf[i + 1] = GOLD_BRIGHT[1];
        buf[i + 2] = GOLD_BRIGHT[2];
        buf[i + 3] = 255;
      } else if (d <= ringR * 0.42) {
        // 内点：实心，但比原方块小得多
        const i = (y * W + x) * 4;
        buf[i] = GOLD_BRIGHT[0];
        buf[i + 1] = GOLD_BRIGHT[1];
        buf[i + 2] = GOLD_BRIGHT[2];
        buf[i + 3] = 255;
      }
    }
  }

  return buf;
}

/* ---------- PNG 编码 ---------- */

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(buf, W, H) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 6;    // color type RGBA
  ihdr[10] = 0;   // compression
  ihdr[11] = 0;   // filter
  ihdr[12] = 0;   // interlace

  // 每行前置 filter byte 0
  const raw = Buffer.alloc(H * (W * 4 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    buf.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- 输出 ---------- */
// 图标要放在站点根目录（manifest 里引用的是根路径）
const out = path.join(__dirname, '..');
const jobs = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
];

jobs.forEach(([name, size, maskable]) => {
  const pixels = drawIcon(size, maskable);
  const png = encodePNG(pixels, size, size);
  fs.writeFileSync(path.join(out, name), png);
  console.log(`生成 ${name} (${size}x${size}, ${(png.length / 1024).toFixed(1)} KB)`);
});