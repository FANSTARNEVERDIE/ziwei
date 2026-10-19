/* 静态一致性检查：app.js 引用的 DOM id 是否都在 index.html 中存在
 * 这类错误在浏览器里表现为「某个功能静默失效」，
 * 因为 $() 返回 null，而多数调用点有 if 保护，不会报错。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// 解析 const el = { key: $('id'), ... }
const elBlock = app.match(/const el = \{([\s\S]*?)\n  \};/);
if (!elBlock) {
  console.error('✗ 未能解析 el 对象');
  process.exit(1);
}

const refs = [];
const re = /(\w+):\s*\$\('([\w]+)'\)/g;
let m;
while ((m = re.exec(elBlock[1])) !== null) {
  refs.push({ key: m[1], id: m[2] });
}

const htmlIds = new Set();
const reId = /id="([\w-]+)"/g;
while ((m = reId.exec(html)) !== null) htmlIds.add(m[1]);

console.log('app.js 引用 ' + refs.length + ' 个 id');
console.log('index.html 定义 ' + htmlIds.size + ' 个 id');
console.log('');

let fail = 0;
const missing = refs.filter((x) => !htmlIds.has(x.id));
if (missing.length) {
  console.log('✗ 引用了但 HTML 中不存在的 id（会导致该功能静默失效）:');
  missing.forEach((x) => console.log('   ' + x.key + ' -> #' + x.id));
  fail += missing.length;
} else {
  console.log('✓ 所有 el 引用的 id 都在 HTML 中存在');
}

// 反向检查：HTML 有但 JS 未引用的（可能漏接，也可能是纯静态元素）
const used = new Set(refs.map((x) => x.id));
const unused = [...htmlIds].filter((i) => !used.has(i));
console.log('');
console.log('HTML 中未被 el 引用的 id（' + unused.length + ' 个）:');
unused.forEach((i) => console.log('   ' + i));

// 额外：documgetElementById 的直接调用
const direct = [];
const reDirect = /getElementById\('([\w-]+)'\)/g;
while ((m = reDirect.exec(app)) !== null) direct.push(m[1]);
const directMissing = [...new Set(direct)].filter((i) => !htmlIds.has(i));
console.log('');
if (directMissing.length) {
  console.log('✗ getElementById 直接引用了不存在的 id:');
  directMissing.forEach((i) => console.log('   #' + i));
  fail += directMissing.length;
} else {
  console.log('✓ getElementById 直接引用（' + new Set(direct).size + ' 个）都存在');
}

console.log('');
console.log(fail === 0 ? '结果: 全部一致，无静默失效风险' : '结果: 发现 ' + fail + ' 处问题');
process.exit(fail === 0 ? 0 : 1);