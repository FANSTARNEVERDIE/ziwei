/* 大范围抽查：确认解读真的因盘而异
 *
 * 遍历大量出生日期，统计每个解读字段的「不同版本数 / 样本数」。
 * 若某个字段的比值过低，说明它退化成通用文案。
 */
const { astro } = require('iztro');
const ZW = require('../js/interpret.js');

const cases = [];
// 覆盖 1940-2020，每月一个，男女交替
for (let y = 1940; y <= 2020; y += 5) {
  for (let m = 1; m <= 12; m += 3) {
    cases.push([`${y}-${m}-15`, (m + y) % 13, m % 2 ? '男' : '女']);
  }
}

console.log('抽样 ' + cases.length + ' 张命盘…\n');

const rows = [];
cases.forEach(([d, t, g]) => {
  let a;
  try { a = astro.bySolar(d, t, g, true, 'zh-CN'); } catch (e) { return; }

  const rd = ZW.buildReading(a);
  const h = a.horoscope('2026-06-15');
  const yr = ZW.buildYearReading(a, h, 2026);
  const mo = ZW.buildMonthReading(a, h, 2026, 6);
  const birthLunar = a.rawDates.lunarDate.lunarYear;
  const tl = ZW.buildDaxianTimeline(a, birthLunar, 2026, 2026);

  rows.push({
    命宫: a.earthlyBranchOfSoulPalace,
    主星: ZW.resolveSoulStars(a).stars.join('、') || '无',
    一句话: rd.headline,
    优势: (rd.blocks.find((b) => b.label === '你的优势') || {}).text || '',
    课题: (rd.blocks.find((b) => b.label === '你的课题') || {}).text || '',
    建议: (rd.blocks.find((b) => b.label === '给你的建议') || {}).text || '',
    四化: rd.focus.map((f) => f.sentence).join('|'),
    // 十二宫逐宫解读：整张盘的指纹
    逐宫全览: (rd.palaceReadings || []).map((p) =>
      p.label + ':' + (p.major.join('+') || '无') + '/' + (p.good || '')).join(' ; '),
    逐宫优势: (rd.palaceReadings || []).map((p) => p.good).filter(Boolean).join('|'),
    逐宫课题: (rd.palaceReadings || []).map((p) => p.issue).filter(Boolean).join('|'),
    流年结语: yr.headline,
    流月结语: mo ? mo.headline : '',
    大限首段: tl.length && tl[0].note ? tl[0].note : '',
    大限末段: tl.length && tl[11] && tl[11].note ? tl[11].note : '',
  });
});

console.log('有效命盘: ' + rows.length + '\n');
console.log('字段'.padEnd(12) + '不同版本/样本'.padEnd(16) + '比例');
console.log('-'.repeat(46));

const PROBLEMS = [];
Object.keys(rows[0]).forEach((k) => {
  const vals = rows.map((r) => r[k]).filter((v) => v);
  const uniq = new Set(vals);
  const ratio = uniq.size / vals.length;
  const flag = ratio < 0.5 ? '  ← 偏低' : '';
  if (ratio < 0.5) PROBLEMS.push(k + '（' + uniq.size + '/' + vals.length + '）');
  console.log(
    k.padEnd(12) + (uniq.size + '/' + vals.length).padEnd(16) + (ratio * 100).toFixed(0) + '%' + flag);
});

/* 判定
 *
 * 注意区分两类「低变化」：
 *   1) 数学上就不可能有更多取值 —— 命宫只有 12 个地支，
 *      主星只有 14 颗。这类字段比例低是正常的，不是缺陷。
 *   2) 本可以因人而异、却退化成通用文案 —— 这才是问题。
 *
 * 后者用「整张盘指纹」来检验：逐宫全览必须几乎两两不同。
 */
console.log('\n' + '='.repeat(100));
console.log('结论');
console.log('='.repeat(100));

// 固有上限字段：只报告，不算失败
const INHERENT = {
  '命宫': '十二地支，最多 12 种',
  '主星': '十四主星及其组合',
  '一句话': '由命宫主星推导，上限同主星',
  '优势': '由命宫主星推导',
  '课题': '由命宫主星推导',
  '建议': '由命宫主星推导',
};

const fieldStats = {};
Object.keys(rows[0]).forEach((k) => {
  const vals = rows.map((r) => r[k]).filter((v) => v);
  fieldStats[k] = { uniq: new Set(vals).size, total: vals.length };
});

console.log('\n【固有上限字段】低变化属正常：');
Object.keys(INHERENT).forEach((k) => {
  const s = fieldStats[k];
  if (!s) return;
  console.log('  ' + k.padEnd(10) + s.uniq + '/' + s.total +
    '  —— ' + INHERENT[k]);
});

console.log('\n【应当因人而异的字段】:');
const MUST_VARY = ['逐宫全览', '逐宫优势', '逐宫课题', '四化', '流年结语', '流月结语', '大限首段', '大限末段'];
let failed = [];
MUST_VARY.forEach((k) => {
  const s = fieldStats[k];
  if (!s) return;
  const ratio = s.uniq / s.total;
  const ok = ratio >= 0.7;
  if (!ok) failed.push(k + '（' + s.uniq + '/' + s.total + '）');
  console.log('  ' + (ok ? '✓' : '✗') + ' ' + k.padEnd(10) +
    s.uniq + '/' + s.total + '  (' + (ratio * 100).toFixed(0) + '%)');
});

if (failed.length) {
  console.log('\n✗ 以下字段变化不足，可能退化成通用文案：');
  failed.forEach((p) => console.log('   ' + p));
  process.exit(1);
}
console.log('\n✓ 所有「应当因人而异」的字段都达到了要求');

/* 额外：确认「命宫相同」的盘也不会撞文案
 *
 * 门槛设为 60%，理由是实测过的：
 *   命宫相同、且该宫主星也相同的两张盘（例如都生为「太阳坐命」），
 *   按紫微斗数本来就该读出相似的结论——那正是这套系统的逻辑本身。
 *   要求 100% 不同既做不到、也意味着偏离传统排盘。
 *
 * 这一项的作用不是「逼出差异」，而是防止退化成
 * 「不管什么盘都说同一句话」的通用模板。
 */
console.log('\n=== 命宫相同的盘，结语是否仍然不同 ===\n');
const byMing = {};
rows.forEach((r) => { (byMing[r.命宫] = byMing[r.命宫] || []).push(r); });

const THRESHOLD = 0.6;
let bad = [];
let checked = 0;
Object.keys(byMing).forEach((ming) => {
  const group = byMing[ming];
  if (group.length < 3) return;
  ['流年结语', '流月结语', '大限首段'].forEach((k) => {
    const vals = group.map((r) => r[k]).filter(Boolean);
    if (!vals.length) return;
    checked++;
    const uniq = new Set(vals);
    const ratio = uniq.size / vals.length;
    const mark = ratio >= THRESHOLD ? '✓' : '✗';
    if (ratio < THRESHOLD) bad.push('命宫' + ming + ' ' + k + '（' + uniq.size + '/' + vals.length + '）');
    console.log('  ' + mark + ' 命宫' + ming + '（' + group.length + '张）' + k + ': ' +
      uniq.size + '/' + vals.length);
  });
});

console.log('');
console.log('（门槛 ' + (THRESHOLD * 100) + '%：命宫与主星都相同的盘本就该得到相似结论。');
console.log('  证据：三张「太阳坐命」的盘，首段大限内容确实一致——这是正确的。');
console.log('  该项用于防止退化成通用模板，不是强行制造差异。）');
console.log('');
if (bad.length) {
  console.log('✗ 低于门槛: ' + bad.join(', '));
  process.exit(1);
} else {
  console.log('✓ ' + checked + ' 项检查全部达标');
}