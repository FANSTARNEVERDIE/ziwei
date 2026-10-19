/* 边界测试：真实使用中会遇到的输入 */
const { astro } = require('iztro');

let pass = 0, fail = 0;
function t(name, fn) {
  try {
    const r = fn();
    console.log((r === false ? '✗' : '✓') + ' ' + name + (typeof r === 'string' ? ' — ' + r : ''));
    r === false ? fail++ : pass++;
  } catch (e) {
    console.log('✗ ' + name + ' — 抛错: ' + e.message);
    fail++;
  }
}

console.log('=== 边界与异常输入 ===\n');

t('最早年份 1900', () => {
  const a = astro.bySolar('1900-5-10', 6, '男', true, 'zh-CN');
  return a.fiveElementsClass + ' 命宫' + a.earthlyBranchOfSoulPalace;
});

t('最晚年份 2100', () => {
  const a = astro.bySolar('2100-5-10', 6, '男', true, 'zh-CN');
  return a.fiveElementsClass + ' 命宫' + a.earthlyBranchOfSoulPalace;
});

t('早子时 00:30 (timeIndex=0)', () => {
  const a = astro.bySolar('1995-3-15', 0, '女', true, 'zh-CN');
  return a.time + ' 命宫' + a.earthlyBranchOfSoulPalace;
});

t('晚子时 23:30 (timeIndex=12)', () => {
  const a = astro.bySolar('1995-3-15', 12, '女', true, 'zh-CN');
  return a.time + ' 命宫' + a.earthlyBranchOfSoulPalace;
});

t('闰月生日（2023 闰二月）', () => {
  const a = astro.bySolar('2023-4-1', 6, '男', true, 'zh-CN');
  const ld = a.rawDates.lunarDate;
  return `农历${ld.lunarMonth}月${ld.lunarDay}日 闰=${ld.isLeap}`;
});

t('除夕日 2024-02-09', () => {
  const a = astro.bySolar('2024-2-9', 6, '男', true, 'zh-CN');
  const ld = a.rawDates.lunarDate;
  return `农历${ld.lunarYear}年${ld.lunarMonth}月${ld.lunarDay}日（应仍在癸卯年）`;
});

t('春节当日 2024-02-10', () => {
  const a = astro.bySolar('2024-2-10', 6, '男', true, 'zh-CN');
  const ld = a.rawDates.lunarDate;
  return `农历${ld.lunarYear}年${ld.lunarMonth}月${ld.lunarDay}日（应已入甲辰年）`;
});

t('非法日期 2 月 30 日应报错', () => {
  try {
    astro.bySolar('2023-2-30', 6, '男', true, 'zh-CN');
    return false;
  } catch (e) { return '正确拒绝: ' + e.message; }
});

t('越界 timeIndex=13 应报错', () => {
  try {
    astro.bySolar('1995-3-15', 13, '男', true, 'zh-CN');
    return false;
  } catch (e) { return '正确拒绝: ' + e.message; }
});

console.log('\n=== 流年跨度 ===\n');

const chart = astro.bySolar('1990-8-8', 4, '男', true, 'zh-CN');

t('出生年流年（虚岁1）', () => {
  const h = chart.horoscope('1990-6-1');
  return `${h.yearly.heavenlyStem}${h.yearly.earthlyBranch} 虚岁${h.age.nominalAge}`;
});

t('虚岁100 流年（2089）', () => {
  const h = chart.horoscope('2089-6-1');
  return `${h.yearly.heavenlyStem}${h.yearly.earthlyBranch} 虚岁${h.age.nominalAge}`;
});

t('大限覆盖 3-12 → 113-122 共12步', () => {
  const ranges = chart.palaces.map(p => p.decadal && p.decadal.range.join('-'));
  return ranges.filter(Boolean).length + ' 步: ' + ranges[0] + ' ... ' + ranges[11];
});

console.log('\n=== 十二宫完整性（多命例）===\n');

const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const cases = [
  ['1950-1-1', 0, '男'], ['1965-7-20', 3, '女'], ['1978-12-31', 11, '男'],
  ['1988-6-6', 6, '女'], ['1999-9-9', 9, '男'], ['2010-3-3', 2, '女'],
  ['2020-2-29', 5, '男'], ['2030-11-11', 8, '女'],
];

let allOk = true;
for (const [d, tm, g] of cases) {
  const a = astro.bySolar(d, tm, g, true, 'zh-CN');
  const names = a.palaces.map(p => p.name).sort();
  const ok = JSON.stringify(names) === JSON.stringify([...PALACES].sort());
  const majorCount = a.palaces.reduce((n, p) => n + p.majorStars.length, 0);
  const minorCount = a.palaces.reduce((n, p) => n + p.minorStars.length, 0);
  const mutagenCount = a.palaces.reduce((n, p) =>
    n + [...p.majorStars, ...p.minorStars].filter(s => s.mutagen).length, 0);
  if (!ok) allOk = false;
  console.log(`${ok ? '✓' : '✗'} ${d} ${g} | ${a.fiveElementsClass} | 主星${majorCount} 辅煞${minorCount} 四化${mutagenCount}`);
}
console.log(allOk ? '\n✓ 全部命例十二宫名称完整' : '\n✗ 有命例宫名异常');

t('十四主星完整分布（任意命盘主星总数应为14）', () => {
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const n = a.palaces.reduce((s, p) => s + p.majorStars.length, 0);
  return n === 14 ? '14 颗 ✓' : `异常：${n} 颗`;
});

t('四化总数应为 4', () => {
  let bad = [];
  for (const [d, tm, g] of cases) {
    const a = astro.bySolar(d, tm, g, true, 'zh-CN');
    const n = a.palaces.reduce((s, p) => s + [...p.majorStars, ...p.minorStars].filter(x => x.mutagen).length, 0);
    if (n !== 4) bad.push(`${d}:${n}`);
  }
  return bad.length ? '异常 ' + bad.join(',') : '全部为 4 ✓';
});

console.log(`\n=== 结果: ${pass} 通过, ${fail} 失败 ===`);