/* 打包部署产物
 *
 * 只把「网站真正需要」的文件复制到 dist/，排除测试、工具、截图、文档。
 * 这样上传体积最小，也不会把测试脚本暴露到公网。
 *
 * 用法：node tools/build-dist.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

/* 需要部署的文件（白名单，比黑名单更安全：
 * 新增了测试文件也不会被误传上去） */
const INCLUDE = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  '_headers',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'css/style.css',
  'js/store.js',
  'js/lunar-table.js',
  'js/leap.js',
  'js/star-palace.js',
  'js/star-palace-provenance.js',
  'js/sihua-star.js',
  'js/sihua-exception.js',
  'js/sihua-corrected.js',
  'js/chart-print.js',
  'js/day-layer.js',
  'js/interpret.js',
  'js/export.js',
  'js/app.js',
  'vendor/iztro.min.js',
];

/* 可选：Cloudflare Pages 的重定向配置（存在就带上） */
const OPTIONAL = ['_redirects', 'robots.txt'];

function copy(rel) {
  const from = path.join(ROOT, rel);
  const to = path.join(DIST, rel);
  if (!fs.existsSync(from)) return { rel, ok: false, reason: '不存在' };
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return { rel, ok: true, size: fs.statSync(to).size };
}

function main() {
  // 清空 dist
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log('打包部署产物…\n');

  let total = 0, count = 0;
  const failed = [];

  INCLUDE.forEach((rel) => {
    const r = copy(rel);
    if (r.ok) {
      total += r.size;
      count++;
      console.log('  + ' + rel.padEnd(28) + (r.size / 1024).toFixed(1) + ' KB');
    } else {
      failed.push(rel);
      console.log('  ! ' + rel.padEnd(28) + '缺失');
    }
  });

  OPTIONAL.forEach((rel) => {
    if (fs.existsSync(path.join(ROOT, rel))) {
      const r = copy(rel);
      if (r.ok) { total += r.size; count++; console.log('  + ' + rel + '（可选）'); }
    }
  });

  console.log('\n共 ' + count + ' 个文件，' + (total / 1024).toFixed(1) + ' KB');
  console.log('输出目录: ' + DIST);

  if (failed.length) {
    console.log('\n✗ 有必需文件缺失: ' + failed.join(', '));
    process.exit(1);
  }

  /* 部署前自检：确认产物里的引用都能对上 */
  console.log('\n自检…');
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const refs = [];
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (/^(https?:|data:|#|mailto:)/.test(u)) continue;
    refs.push(u.split('?')[0]);
  }
  let missing = [];
  refs.forEach((r) => {
    const p = path.join(DIST, r);
    if (!fs.existsSync(p)) missing.push(r);
  });
  if (missing.length) {
    console.log('  ✗ index.html 引用了不存在的文件: ' + missing.join(', '));
    process.exit(1);
  }
  console.log('  ✓ index.html 的 ' + refs.length + ' 个引用全部存在');

  // sw.js 的预缓存清单也要能对上
  const sw = fs.readFileSync(path.join(DIST, 'sw.js'), 'utf8');
  const shellM = sw.match(/const SHELL\s*=\s*\[([\s\S]*?)\];/);
  if (shellM) {
    const items = [];
    const re2 = /'([^']+)'/g;
    let m2;
    while ((m2 = re2.exec(shellM[1])) !== null) items.push(m2[1]);
    const bad = [];
    items.forEach((it) => {
      const rel = it === './' ? 'index.html' : it.replace(/^\.\//, '');
      if (!fs.existsSync(path.join(DIST, rel))) bad.push(it);
    });
    if (bad.length) {
      console.log('  ✗ sw.js 预缓存清单有缺失: ' + bad.join(', '));
      process.exit(1);
    }
    console.log('  ✓ sw.js 预缓存清单 ' + items.length + ' 项全部存在');
  }

  console.log('\n可以部署了。');
}

main();