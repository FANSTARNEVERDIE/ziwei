/* Service Worker 静态校验：
 * 1) sw.js 语法与结构
 * 2) 预缓存清单里的每个文件是否真实存在
 * 3) manifest 引用的图标是否存在
 * 4) index.html 是否正确引用了 manifest / sw / 图标
 * 浏览器运行时的缓存行为无法在 Node 里验证，但「清单是否指向真实文件」
 * 是最常见的 PWA 失败原因，这里必须查。
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const ROOT = __dirname;
const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');

console.log('=== sw.js 结构 ===\n');
t('含版本号常量', /const VERSION\s*=\s*'[^']+'/.test(swSrc));
t('有 install 事件', /addEventListener\('install'/.test(swSrc));
t('有 activate 事件', /addEventListener\('activate'/.test(swSrc));
t('有 fetch 事件', /addEventListener\('fetch'/.test(swSrc));
t('install 时 skipWaiting', /skipWaiting\(\)/.test(swSrc));
t('activate 时清理旧缓存', /caches\.delete/.test(swSrc));
t('处理导航请求（分享链接离线可用）', /req\.mode\s*===\s*'navigate'/.test(swSrc));
t('只处理同源请求', /url\.origin\s*!==\s*self\.location\.origin/.test(swSrc));

console.log('\n=== 预缓存清单指向真实文件 ===\n');
// 提取 SHELL 数组
const shellMatch = swSrc.match(/const SHELL\s*=\s*\[([\s\S]*?)\];/);
t('能解析出 SHELL 清单', !!shellMatch);
const entries = [];
if (shellMatch) {
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(shellMatch[1])) !== null) entries.push(m[1]);
}
console.log('  清单共 ' + entries.length + ' 项');

let missing = [];
entries.forEach((e) => {
  // './' 代表根目录，映射到 index.html
  const rel = e === './' ? 'index.html' : e.replace(/^\.\//, '');
  const abs = path.join(ROOT, rel);
  const exists = fs.existsSync(abs);
  if (!exists) missing.push(e);
});
t('清单中所有文件都存在', missing.length === 0, missing.length ? '缺失: ' + missing.join(', ') : '全部存在');

// 反向检查：核心资源是否都进了清单
const critical = ['index.html', 'css/style.css', 'js/app.js', 'js/interpret.js',
  'js/store.js', 'js/export.js', 'vendor/iztro.min.js'];
const notListed = critical.filter((c) => !entries.some((e) => e.replace(/^\.\//, '') === c));
t('核心资源都已列入清单', notListed.length === 0, notListed.length ? '缺: ' + notListed.join(', ') : '全部覆盖');

console.log('\n=== manifest ===\n');
let mf = null;
try {
  mf = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
} catch (e) { }
t('manifest 是合法 JSON', !!mf);
if (mf) {
  t('有 name 与 short_name', !!mf.name && !!mf.short_name, mf.short_name);
  t('start_url 指向入口', mf.start_url === './index.html', mf.start_url);
  t('display 为 standalone', mf.display === 'standalone');
  t('有 theme_color', /^#[0-9a-f]{6}$/i.test(mf.theme_color || ''), mf.theme_color);
  t('有图标', Array.isArray(mf.icons) && mf.icons.length > 0, (mf.icons || []).length + ' 个');

  const iconMissing = (mf.icons || []).filter((i) => !fs.existsSync(path.join(ROOT, i.src)));
  t('manifest 里的图标都存在', iconMissing.length === 0,
    iconMissing.length ? '缺: ' + iconMissing.map(i => i.src).join(', ') : '全部存在');

  const has512 = (mf.icons || []).some((i) => i.sizes === '512x512' && i.purpose !== 'maskable');
  const hasMaskable = (mf.icons || []).some((i) => (i.purpose || '').includes('maskable'));
  t('含 512x512 常规图标', has512);
  t('含 maskable 图标（Android 自适应）', hasMaskable);
}

console.log('\n=== index.html 接入 ===\n');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
t('引用了 manifest', /rel="manifest"\s+href="manifest\.webmanifest"/.test(html));
t('引用了 apple-touch-icon', /rel="apple-touch-icon"/.test(html));
t('有 theme-color', /name="theme-color"/.test(html));
t('有 apple-mobile-web-app-capable', /apple-mobile-web-app-capable/.test(html));
t('app.js 会注册 SW', /serviceWorker.*register|register\('sw\.js'\)/.test(
  fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8')));
t('file:// 下不注册（避免双击打开报错）',
  /location\.protocol\s*===\s*'file:'/.test(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8')));
t('有离线状态提示元素', /id="netBar"/.test(html));
t('有更新提示元素', /id="updateBar"/.test(html));

console.log('\n=== 图标文件有效性 ===\n');
[['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512]].forEach(([f, size]) => {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) { t(f + ' 存在', false); return; }
  const buf = fs.readFileSync(p);
  const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  t(f + ' 是有效 PNG 且尺寸正确', isPNG && w === size && h === size,
    (isPNG ? 'PNG' : '非PNG') + ' ' + w + 'x' + h);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);