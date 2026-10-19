/* 合盘逻辑测试 */
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 组合分类 ===\n');
// 造样本：找不同主星组合的命盘
const samples = [];
const dates = [];
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= 28; d += 4) {
    for (const tm of [0, 3, 6, 9]) {
      dates.push([`1990-${m}-${d}`, tm, m % 2 ? '男' : '女']);
    }
  }
}
for (const [d, tm, g] of dates) {
  try {
    const a = astro.bySolar(d, tm, g, true, 'zh-CN');
    const r = ZW.resolveSoulStars(a);
    samples.push({ chart: a, star: r.stars[0] || '', date: d, tm, g });
  } catch (e) { }
}
const byStar = {};
samples.forEach(s => { if (s.star && !byStar[s.star]) byStar[s.star] = s; });
const stars = Object.keys(byStar);
console.log('  找到 ' + stars.length + ' 种命宫主星样本: ' + stars.join('、'));

t('样本覆盖足够', stars.length >= 8, stars.length + ' 种');

// 同类组合
const samePair = stars.find(s => s) || '紫微';
const comp1 = ZW.buildCompatibility(byStar[samePair].chart, byStar[samePair].chart);
t('相同主星 -> 性情相近', comp1.pair.title === '性情相近', samePair + ' × ' + samePair);

// 强强组合
const strongs = stars.filter(s => ['紫微','七杀','破军','武曲','廉贞','太阳','巨门'].includes(s));
if (strongs.length >= 2) {
  const c = ZW.buildCompatibility(byStar[strongs[0]].chart, byStar[strongs[1]].chart);
  t('两个强势星 -> 两强相遇', c.pair.title === '两强相遇', strongs[0] + ' × ' + strongs[1]);
} else {
  console.log('  (强势星样本不足，跳过)');
}

// 都偏温和
const softs = stars.filter(s => ['天同','太阴','天梁','天相','天府'].includes(s));
if (softs.length >= 2) {
  const c = ZW.buildCompatibility(byStar[softs[0]].chart, byStar[softs[1]].chart);
  t('两个温和星 -> 两柔相处', c.pair.title === '两柔相处', softs[0] + ' × ' + softs[1]);
} else {
  console.log('  (温和星样本不足，跳过)');
}

// 一强一柔 -> 一动一静
if (strongs.length >= 1 && softs.length >= 1) {
  const c = ZW.buildCompatibility(byStar[strongs[0]].chart, byStar[softs[0]].chart);
  t('一强一柔 -> 一动一静', c.pair.title === '一动一静', strongs[0] + ' × ' + softs[0]);
}

console.log('\n=== 逐宫对照 ===\n');
const A = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const B = astro.bySolar('1990-5-20', 3, '女', true, 'zh-CN');
const comp = ZW.buildCompatibility(A, B);
t('对照行数正确', comp.rows.length === 6, comp.rows.length + ' 行');
t('每行含双方星曜', comp.rows.every(r => r.aStars && r.bStars));
t('宫位标签正确（无「宫宫」）', comp.rows.every(r => !/宫宫/.test(r.palaceLabel)),
  comp.rows.map(r => r.palaceLabel).join(','));

comp.rows.forEach(r => {
  console.log('  ' + r.palaceLabel.padEnd(5) + ' A: ' + r.aStars.padEnd(14) + ' | B: ' + r.bStars);
});

console.log('\n=== 边界 ===\n');
// 极端：两盘完全相同
const selfComp = ZW.buildCompatibility(A, A);
t('同盘对照不报错', selfComp.rows.length === 6 && selfComp.pair.title === '性情相近');

// 借用对宫的情况要标注
const borrowed = samples.filter(s => ZW.resolveSoulStars(s.chart).borrowed);
if (borrowed.length >= 1 && samples.length >= 2) {
  const other = samples.find(s => !ZW.resolveSoulStars(s.chart).borrowed) || samples[0];
  const c = ZW.buildCompatibility(borrowed[0].chart, other.chart);
  t('借对宫的盘能正常对照', c.rows.length === 6,
    'A借=' + c.aBorrowed + ' B借=' + c.bBorrowed + ' star=' + (c.aStars[0] || '无'));
} else {
  console.log('  (无借对宫样本，跳过)');
}

t('空输入不崩溃', (() => {
  try { ZW.buildCompatibility(A, { palaces: [] }); return true; }
  catch (e) { return false; }
})());

// 对称性：A×B 与 B×A 的组合判断应一致
const ab = ZW.buildCompatibility(A, B);
const ba = ZW.buildCompatibility(B, A);
t('组合判断对称', ab.pair.title === ba.pair.title, ab.pair.title + ' == ' + ba.pair.title);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);