/* 打包可上传 Cloudflare Pages 的 zip
 *
 * 为什么不用 PowerShell 的 Compress-Archive：
 *   它会把路径写成 `css\style.css`（反斜杠）。ZIP 规范（APPNOTE 4.4.17.1）
 *   要求用正斜杠 `/`，Cloudflare 的解压端是 Linux，会把这个条目当成
 *   一个名叫 `css\style.css` 的文件，而不是 css/ 目录下的文件 ——
 *   结果是 CSS/JS 全部 404，页面裸奔。
 *
 *   所以这里手工构造 zip，保证：
 *     1) 分隔符一律为 `/`
 *     2) 文件位于压缩包根目录（无外层 dist/）
 *     3) 用 deflate 压缩，体积合理
 *
 * 用法：node tools/make-zip.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, process.env.ZIP_NAME || 'ziwei-cloudflare.zip');

/* ---------- CRC32 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

/* ---------- 收集文件（递归，路径转成 / 分隔） ---------- */
function collect(dir, base) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name);
    const rel = base ? base + '/' + name : name;
    const st = fs.statSync(abs);
    if (st.isDirectory()) {
      out.push(...collect(abs, rel));
    } else {
      out.push({ abs, name: rel, size: st.size });
    }
  }
  return out;
}

/* ---------- 写 zip ---------- */
function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const f of files) {
    const raw = fs.readFileSync(f.abs);
    const crc = crc32(raw);
    const comp = zlib.deflateRawSync(raw, { level: 9 });
    // 压缩后更大就存原始数据
    const useStore = comp.length >= raw.length;
    const data = useStore ? raw : comp;
    const method = useStore ? 0 : 8;

    const nameBuf = Buffer.from(f.name, 'utf8');

    /* 本地文件头 */
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);      // 签名
    lh.writeUInt16LE(20, 4);              // 解压所需版本 2.0
    lh.writeUInt16LE(0x0800, 6);          // 标志位：文件名是 UTF-8
    lh.writeUInt16LE(method, 8);          // 压缩方法
    lh.writeUInt16LE(0, 10);              // 修改时间
    lh.writeUInt16LE(0x21, 12);           // 修改日期（1980-01-01）
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);    // 压缩后大小
    lh.writeUInt32LE(raw.length, 22);     // 原始大小
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);              // 扩展字段长度

    locals.push(lh, nameBuf, data);

    /* 中央目录条目 */
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);              // 创建版本
    ch.writeUInt16LE(20, 6);              // 解压所需版本
    ch.writeUInt16LE(0x0800, 8);          // 标志位
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(data.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);              // 扩展字段
    ch.writeUInt16LE(0, 32);              // 注释
    ch.writeUInt16LE(0, 34);              // 磁盘号
    ch.writeUInt16LE(0, 36);              // 内部属性
    // 外部属性：普通文件 rw-r--r--
    // 注意 0o100644 << 16 = 0x81A40000，超过 int32 正数范围，
    // 用乘法并 >>> 0 转成无符号，再写 UInt32
    ch.writeUInt32LE(((0o100644 * 0x10000) >>> 0), 38);
    ch.writeUInt32LE(offset, 42);         // 本地头偏移

    centrals.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const localBuf = Buffer.concat(locals);

  /* 中央目录结束记录 */
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localBuf.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localBuf, centralBuf, eocd]);
}

/* ---------- 主流程 ---------- */
function main() {
  if (!fs.existsSync(DIST)) {
    console.error('✗ dist 不存在，请先运行 node tools/build-dist.js');
    process.exit(1);
  }

  const files = collect(DIST, '').sort((a, b) => a.name.localeCompare(b.name));
  console.log('打包 ' + files.length + ' 个文件…\n');
  files.forEach((f) => console.log('  + ' + f.name.padEnd(26) + (f.size / 1024).toFixed(1) + ' KB'));

  const zip = buildZip(files);
  try {
    fs.writeFileSync(OUT, zip);
  } catch (e) {
    if (e.code === 'EBUSY' || e.code === 'EPERM') {
      console.error('\n✗ 无法写入 ' + path.basename(OUT) + '：文件被其它程序占用。');
      console.error('  常见原因：压缩软件或编辑器正打开着它，或有残留进程持有句柄。');
      console.error('  办法：关掉占用它的程序，或换个输出名：');
      console.error('    ZIP_NAME=ziwei-cloudflare-2.zip node tools/make-zip.js');
      process.exit(1);
    }
    throw e;
  }

  console.log('\n已生成: ' + path.basename(OUT));
  console.log('大小: ' + (zip.length / 1024).toFixed(1) + ' KB');

  /* ---------- 校验 ---------- */
  console.log('\n校验…');

  // 1) 分隔符必须是 /
  const bad = files.filter((f) => f.name.includes('\\'));
  if (bad.length) {
    console.error('  ✗ 有文件用了反斜杠路径: ' + bad.map((f) => f.name).join(', '));
    process.exit(1);
  }
  console.log('  ✓ 路径分隔符全部为 /（ZIP 规范要求）');

  // 2) 不能有外层目录
  const wrapped = files.filter((f) => /^dist\//.test(f.name));
  if (wrapped.length) {
    console.error('  ✗ 存在 dist/ 外层目录');
    process.exit(1);
  }
  console.log('  ✓ 文件位于压缩包根目录');

  // 3) 关键文件必须在
  const need = ['index.html', 'sw.js', 'manifest.webmanifest',
    'css/style.css', 'js/app.js', 'vendor/iztro.min.js'];
  const missing = need.filter((n) => !files.some((f) => f.name === n));
  if (missing.length) {
    console.error('  ✗ 缺少: ' + missing.join(', '));
    process.exit(1);
  }
  console.log('  ✓ 关键文件齐全');

  // 4) 回读验证：重新解析刚写的 zip，确认能被标准方式读取
  const check = fs.readFileSync(OUT);
  const sig = check.readUInt32LE(0);
  if (sig !== 0x04034b50) {
    console.error('  ✗ zip 签名不对');
    process.exit(1);
  }
  const eocdPos = check.length - 22;
  const entryCount = check.readUInt16LE(eocdPos + 10);
  if (entryCount !== files.length) {
    console.error('  ✗ 条目数不符: 期望 ' + files.length + '，实际 ' + entryCount);
    process.exit(1);
  }
  console.log('  ✓ 可被标准解析（' + entryCount + ' 个条目）');

  console.log('\n可以上传了。');
  console.log('Cloudflare Dashboard → Workers & Pages → Create → Pages');
  console.log('→ Upload assets → 拖入 ' + path.basename(OUT));
}

main();