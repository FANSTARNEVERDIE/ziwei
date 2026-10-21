/* 检查：换上不同出生日期，用户实际看到的文字是否真的变化
 *
 * 只看「用户能读到的那几行字」，不管 label/tone 这类样式字段。
 */
const { astro } = require('iztro');
const ZW = require('../js/interpret.js');

const CASES = [
  ['2000-8-16', 6, '男'],
  ['1990-5-20', 3, '女'],
  ['1984-2-2', 0, '男'],
  ['2024-2-10', 6, '男'],
  ['1975-11-8', 9, '女'],
  ['1968-3-15', 2, '男'],
];

const rows = [];

CASES.forEach(([d, t, g]) => {
  const a = astro.bySolar(d, t, g, true, 'zh-CN');
  const rd = ZW.buildReading(a);
  const soul = ZW.resolveSoulStars(a);
  const h = a.horoscope('2026-06-15');
  const yr = ZW.buildYearReading(a, h, 2026);
  const mo = ZW.buildMonthReading(a, h, 2026, 6);

  rows.push({
    label: d + ' ' + g,
    命宫: a.earthlyBranchOfSoulPalace,
    主星: soul.stars.join('、') || '(无)',
    借宫: soul.borrowed ? '借' + soul.fromPalace : '',
    一句话: rd.headline,
    优势: (rd.blocks.find((b) => b.label === '你的优势') || {}).text || '',
    课题: (rd.blocks.find((b) => b.label === '你的课题') || {}).text || '',
    建议: (rd.blocks.find((b) => b.label === '给你的建议') || {}).text || '',
    副星: (rd.blocks.find((b) => /另外/.test(b.label)) || {}).text || '',
    四化: rd.focus.map((f) => f.sentence).join(' | '),
    流年落宫: yr.lnPalace ? yr.lnPalace.name : '-',
    流年结语: yr.headline,
    流月结语: mo ? mo.headline : '-',
  });
});

const COLS = ['label', '命宫', '主星', '借宫', '一句话', '流年落宫'];

console.log('='.repeat(100));
console.log('基础字段');
console.log('='.repeat(100));
COLS.forEach((c) => {
  console.log('\n【' + c + '】');
  rows.forEach((r) => console.log('  ' + String(r.label).padEnd(14) + ' ' + String(r[c] || '').slice(0, 70)));
});

console.log('\n' + '='.repeat(100));
console.log('解读正文（用户实际读到的）');
console.log('='.repeat(100));
['一句话', '优势', '课题', '建议', '副星', '四化', '流年结语', '流月结语'].forEach((c) => {
  console.log('\n【' + c + '】');
  const uniq = new Set(rows.map((r) => r[c]));
  rows.forEach((r) => console.log('  ' + String(r.label).padEnd(14) + ' ' + String(r[c] || '(空)').slice(0, 88)));
  console.log('  → 不同版本数: ' + uniq.size + ' / ' + rows.length);
});

/* 判定 */
console.log('\n' + '='.repeat(100));
console.log('结论');
console.log('='.repeat(100));
const problems = [];
['一句话', '优势', '课题', '建议', '四化', '流年结语'].forEach((c) => {
  const uniq = new Set(rows.map((r) => r[c]));
  if (uniq.size === 1) problems.push(c + ' 完全不变（' + rows.length + ' 张盘都一样）');
  else if (uniq.size < rows.length) problems.push(c + ' 有重复（' + uniq.size + '/' + rows.length + ' 种）');
});
if (problems.length) {
  problems.forEach((p) => console.log('  ✗ ' + p));
} else {
  console.log('  ✓ 解读正文全部随命盘变化');
}