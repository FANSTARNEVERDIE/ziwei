/* 诊断：不同日期的运势为何相似
 *
 * 上一轮修的是「文案完全相同」。这一轮要查的是更细的问题：
 * 不同出生日期（或不同查看日期）算出来的运势，语义上为何高度相似。
 *
 * 方法：把结论拆成「落宫」「星曜」「四化」三个来源，
 * 分别统计各自的取值数，找出是哪个环节导致高度雷同。
 */
const { astro } = require('iztro');
const ZW = require('../js/interpret.js');

const BIRTH = [
  ['2000-8-16', 6, '男'],
  ['1990-5-20', 3, '女'],
  ['1984-2-2', 0, '男'],
  ['2024-2-10', 6, '男'],
  ['1975-11-8', 9, '女'],
  ['1968-3-15', 2, '男'],
  ['1955-7-7', 5, '男'],
  ['2005-12-1', 11, '女'],
];

const VIEW_DATES = [];
for (let m = 1; m <= 12; m++) VIEW_DATES.push('2026-' + m + '-15');

console.log('=== 1. 流月结论：同一张盘、不同月份 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const seen = new Map();
  VIEW_DATES.forEach((d) => {
    const h = a.horoscope(d);
    const mo = ZW.buildMonthReading(a, h, 2026, Number(d.split('-')[1]));
    const key = mo.palaceName + '|' + (mo.monthStarsHere || []).join(',');
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(d.split('-')[1] + '月');
  });
  console.log('  12 个月份归并成 ' + seen.size + ' 组:');
  seen.forEach((months, key) => {
    console.log('    [' + key + '] ← ' + months.join(','));
  });
}

console.log('\n=== 2. 流年结论：同一张盘、不同年份 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const seen = new Map();
  for (let y = 2020; y <= 2035; y++) {
    const h = a.horoscope(y + '-06-15');
    const yr = ZW.buildYearReading(a, h, y);
    const key = yr.lnPalace ? yr.lnPalace.name : '无';
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(y);
  }
  console.log('  16 个年份归并成 ' + seen.size + ' 组:');
  seen.forEach((ys, key) => {
    console.log('    [' + key + '宫] ← ' + ys.join(','));
  });
}

console.log('\n=== 3. 落宫是怎么算出来的（关键）===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  console.log('  年份  流年地支  流年命宫index  宫名    流月地支  流月命宫index  宫名');
  for (let y = 2024; y <= 2031; y++) {
    const h = a.horoscope(y + '-06-15');
    const yi = h.yearly.index, mi = h.monthly.index;
    console.log('  ' + y + '    ' + h.yearly.earthlyBranch + '        ' +
      String(yi).padStart(2) + '           ' + a.palaces[yi].name.padEnd(6) +
      '  ' + h.monthly.earthlyBranch + '        ' +
      String(mi).padStart(2) + '           ' + a.palaces[mi].name);
  }
}

console.log('\n=== 4. 流月命宫地支循环规律 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const idxs = [];
  for (let m = 1; m <= 24; m++) {
    const y = 2026 + Math.floor((m - 1) / 12);
    const mm = ((m - 1) % 12) + 1;
    const h = a.horoscope(y + '-' + mm + '-15');
    idxs.push(h.monthly.index);
  }
  console.log('  连续 24 个月的流月命宫 index:');
  console.log('    ' + idxs.join(' '));
  console.log('  不同取值数: ' + new Set(idxs).size + ' / 24');
  console.log('  → 只有 12 个宫位，所以最多 12 种，实际取到 ' + new Set(idxs).size + ' 种');
}

console.log('\n=== 5. 流月四化：同一年内是否恒定 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const seen = new Map();
  for (let m = 1; m <= 12; m++) {
    const h = a.horoscope('2026-' + m + '-15');
    const key = h.monthly.heavenlyStem + h.monthly.earthlyBranch;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(m);
  }
  console.log('  2026 年 12 个月的流月干支:');
  seen.forEach((ms, gz) => console.log('    ' + gz + ' ← ' + ms.join(',') + '月'));
  console.log('  不同干支数: ' + seen.size + ' / 12');
}

console.log('\n=== 6. 不同出生日期的人，同一时间段 ===\n');
{
  const seen = new Map();
  BIRTH.forEach(([d, t, g]) => {
    const a = astro.bySolar(d, t, g, true, 'zh-CN');
    const h = a.horoscope('2026-06-15');
    const key = a.palaces[h.monthly.index].name;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(d);
  });
  console.log('  8 个不同生日在 2026-06 的流月落宫:');
  seen.forEach((ds, k) => console.log('    [' + k + '宫] ← ' + ds.join(', ')));
  console.log('  归并成 ' + seen.size + ' 组');
}