/* 「星×宫位」来源标注测试
 *
 * 背景：我们为 14 星 × 12 宫 = 168 个组合都写了内容，
 *       但《紫微斗数精成》第九章只在 78 处给出明确论述。
 *       其余是按星性推导的——有依据，但不是原书说法。
 *
 * 若不区分，用户会以为推导内容也是原书的话。
 * 本测试锁死来源标注的正确性。
 */
const PV = require('./js/star-palace-provenance.js');
const SP = require('./js/star-palace.js');
const ZW = require('./js/interpret.js');
const { astro } = require('iztro');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

console.log('=== 覆盖完整性 ===\n');

const st = PV.stats();
t('总条目 = 168', st.total === 168, st.total + ' 条');
t('source 条目数与原文抽取一致', st.sourced === 78, st.sourced + ' 条');
t('derived 条目数 = 168 - 78', st.derived === 90, st.derived + ' 条');

let missing = [];
STARS.forEach((s) => PALACES.forEach((p) => {
  if (!PV.get(s, p)) missing.push(s + '@' + p);
}));
t('每个「星@宫」都有标注', missing.length === 0,
  missing.length ? '缺 ' + missing.length + ' 条' : '168/168');

console.log('\n=== 标注正确性 ===\n');

/* source 条目必须带引文 */
let noQuote = [];
STARS.forEach((s) => PALACES.forEach((p) => {
  const e = PV.get(s, p);
  if (e && e.kind === 'source' && (!e.quote || e.quote.length < 50)) {
    noQuote.push(s + '@' + p);
  }
}));
t('source 条目都带原文引文（≥50字）', noQuote.length === 0,
  noQuote.length ? noQuote.slice(0, 4).join(', ') : '78/78');

/* derived 条目不应带引文 */
let badDerived = [];
STARS.forEach((s) => PALACES.forEach((p) => {
  const e = PV.get(s, p);
  if (e && e.kind === 'derived' && e.quote) badDerived.push(s + '@' + p);
}));
t('derived 条目不带引文', badDerived.length === 0,
  badDerived.length ? badDerived.join(', ') : '90/90');

console.log('\n=== 关键抽样（应与原文一致）===\n');

/* 天机在财帛宫：原书说是不祥之星，我们起初写成正面的 */
const tj = PV.get('天机', '财帛');
t('天机@财帛 标注为 source', tj && tj.kind === 'source');
t('天机@财帛 引文含「不祥」或「过路财神」',
  tj && /不祥|过路财神/.test(tj.quote),
  tj ? tj.quote.slice(0, 50) : '');

/* 紫微在财帛宫：原书说「不算正财星，不擅理财」 */
const zw = PV.get('紫微', '财帛');
t('紫微@财帛 标注为 source', zw && zw.kind === 'source');
t('紫微@财帛 引文含「不擅理财」或「不算正财」',
  zw && /不擅理财|不算正财/.test(zw.quote),
  zw ? zw.quote.slice(0, 50) : '');

/* 命宫不是第九章内容（属第八章），应标 derived */
const mg = PV.get('紫微', '命宫');
t('紫微@命宫 标注为 derived（命宫属第八章）', mg && mg.kind === 'derived');

console.log('\n=== 接入解读：逐宫带来源 ===\n');

const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const rd = ZW.buildReading(a);

t('十二宫都有 provKind', rd.palaceReadings.every((p) => p.provKind),
  rd.palaceReadings.length + ' 宫');

const nSrc = rd.palaceReadings.filter((p) => p.provKind === 'source').length;
const nDer = rd.palaceReadings.filter((p) => p.provKind === 'derived').length;
console.log('    本盘：原书有论述 ' + nSrc + ' 宫，推导 ' + nDer + ' 宫');
t('source 的宫带引文', rd.palaceReadings
  .filter((p) => p.provKind === 'source')
  .every((p) => p.provQuote && p.provQuote.length > 40));

/* 多张盘验证 */
let totalSrc = 0, totalDer = 0;
[['1990-5-20', 3, '女'], ['1984-2-2', 0, '男'], ['1968-3-15', 2, '男']].forEach(([d, tm, g]) => {
  const x = astro.bySolar(d, tm, g, true, 'zh-CN');
  const r = ZW.buildReading(x);
  totalSrc += r.palaceReadings.filter((p) => p.provKind === 'source').length;
  totalDer += r.palaceReadings.filter((p) => p.provKind === 'derived').length;
});
console.log('    另外 3 张盘合计：原书 ' + totalSrc + '，推导 ' + totalDer);
t('跨盘都能取到标注', totalSrc + totalDer === 36, (totalSrc + totalDer) + '/36');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
console.log('\n出处：《紫微斗数精成》上编 第九章 诸星落十二宫参断（p271–380）');
console.log('      原文索引见 _pdf/star-palace-source.json');