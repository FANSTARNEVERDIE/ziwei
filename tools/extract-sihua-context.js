/* 抽取原文中每颗星提到各「化」的句子，用于核对 js/sihua-star.js
 *
 * 原书没有「每颗星 × 每种化」的独立条目，
 * 但在讨论星性、组合喜忌、入宫时，会顺带说明该星化禄/权/科/忌的表现。
 * 把这些句子抽出来，就能验证我们的 72 条是否偏离原意。
 */
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', '_pdf', '诸星-原文.md'), 'utf8');
const OUT = path.join(__dirname, '..', '_pdf', '各星四化-原文语句.md');

const marks = [];
const re = /^## (.+?)（p(\d+)–(\d+)）/gm;
let m;
while ((m = re.exec(raw)) !== null) {
  marks.push({ name: m[1], start: m.index, end: re.lastIndex });
}

const HUAS = ['化禄', '化权', '化科', '化忌'];
const out = ['# 各星四化 · 原文语句摘录\n',
  '来源：《紫微斗数精成》上编 第八章\n',
  '用途：核对 js/sihua-star.js 的 72 条\n'];

marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
  const body = raw.slice(mk.end, end);

  const hits = {};
  HUAS.forEach((h) => { hits[h] = []; });

  HUAS.forEach((h) => {
    let from = 0;
    while (true) {
      const idx = body.indexOf(h, from);
      if (idx < 0) break;
      // 取该词前后各 90 / 160 字作为语境
      const seg = body.slice(Math.max(0, idx - 90), idx + 160).replace(/\s+/g, '');
      hits[h].push(seg);
      from = idx + h.length;
      if (hits[h].length >= 6) break;   // 每种化最多取 6 句
    }
  });

  const total = HUAS.reduce((a, h) => a + hits[h].length, 0);
  if (!total) return;

  out.push(`\n## ${mk.name}\n`);
  HUAS.forEach((h) => {
    if (!hits[h].length) return;
    out.push(`\n### ${h}\n`);
    hits[h].forEach((s, k) => out.push(`${k + 1}. …${s}…\n`));
  });
  out.push('\n---\n');
});

fs.writeFileSync(OUT, out.join(''), 'utf8');
console.log('已写出 ' + OUT);
console.log('字数: ' + out.join('').length);

/* 同时打印紫微、天同、巨门的化忌语境，供人工比对 */
console.log('\n=== 抽样：紫微 / 天同 / 巨门 的化忌语境 ===\n');
['紫微', '天同', '巨门'].forEach((star) => {
  const mk = marks.find((x) => x.name === star);
  if (!mk) return;
  const i = marks.indexOf(mk);
  const end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
  const body = raw.slice(mk.end, end);
  console.log('【' + star + '】');
  let from = 0, n = 0;
  while (n < 3) {
    const idx = body.indexOf('化忌', from);
    if (idx < 0) break;
    console.log('  …' + body.slice(Math.max(0, idx - 70), idx + 150).replace(/\s+/g, '') + '…');
    console.log('');
    from = idx + 2;
    n++;
  }
});