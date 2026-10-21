/* 调查原书各星章节中「化X」的分布，找出可用于核对 72 条的原文 */
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', '_pdf', '诸星-原文.md'), 'utf8');

const marks = [];
const re = /^## (.+?)（p(\d+)–(\d+)）/gm;
let m;
while ((m = re.exec(raw)) !== null) {
  marks.push({ name: m[1], start: m.index, end: re.lastIndex });
}

console.log('章节数: ' + marks.length);
console.log('');

const HUAS = ['化禄', '化权', '化科', '化忌'];
const table = [];

marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
  const body = raw.slice(mk.end, end);
  const counts = {};
  let tot = 0;
  HUAS.forEach((k) => {
    const n = body.split(k).length - 1;
    counts[k] = n;
    tot += n;
  });
  table.push({ name: mk.name, counts, tot, len: body.length });
});

console.log('星名'.padEnd(10) + '禄  权  科  忌   合计   正文字数');
console.log('-'.repeat(52));
table.forEach((r) => {
  console.log(
    r.name.padEnd(10) +
    String(r.counts['化禄']).padStart(2) + '  ' +
    String(r.counts['化权']).padStart(2) + '  ' +
    String(r.counts['化科']).padStart(2) + '  ' +
    String(r.counts['化忌']).padStart(2) + '   ' +
    String(r.tot).padStart(3) + '   ' + r.len
  );
});

/* 抽取每颗星提到「化忌」的那句话，用于核对我们的化忌描述 */
console.log('\n=== 各星「化忌」原文语句（摘录）===\n');
table.forEach((r) => {
  if (!r.counts['化忌']) return;
  const mk = marks.find((x) => x.name === r.name);
  const i2 = marks.indexOf(mk);
  const end = i2 + 1 < marks.length ? marks[i2 + 1].start : raw.length;
  const body = raw.slice(mk.end, end);

  const idx = body.indexOf('化忌');
  if (idx < 0) return;
  const seg = body.slice(Math.max(0, idx - 60), idx + 220).replace(/\s+/g, ' ');
  console.log('【' + r.name + '】');
  console.log('  ' + seg);
  console.log('');
});