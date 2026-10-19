/* 闰月工具测试 */
const { astro } = require('iztro');
const ZW = require('./js/leap.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 闰月检测（对照已知历法事实）===\n');

// 已知：2020 闰四月、2023 闰二月、2025 闰六月、2028 闰五月
// 已知无闰月：2021、2022、2024、2026、2027
const hasLeap = { 2020: 4, 2023: 2, 2025: 6, 2028: 5 };
const noLeap = [2021, 2022, 2024, 2026, 2027];

Object.entries(hasLeap).forEach(([y, m]) => {
  const got = ZW.leapMonthOf(astro, Number(y));
  t(`${y} 年闰 ${m} 月`, got === m, '实际检测: ' + (got || '无'));
});

noLeap.forEach((y) => {
  const got = ZW.leapMonthOf(astro, y);
  t(`${y} 年无闰月`, got === 0, '实际检测: ' + (got || '无'));
});

console.log('\n=== isLeapMonth 便捷判断 ===\n');
t('2023 年 2 月是闰月', ZW.isLeapMonth(astro, 2023, 2) === true);
t('2023 年 3 月不是闰月', ZW.isLeapMonth(astro, 2023, 3) === false);
t('2024 年 2 月不是闰月', ZW.isLeapMonth(astro, 2024, 2) === false);
t('字符串月份也能判断', ZW.isLeapMonth(astro, 2023, '2') === true);

console.log('\n=== 缓存行为 ===\n');
ZW.clearCache();
const t0 = Date.now();
ZW.leapMonthOf(astro, 2023);
const first = Date.now() - t0;
const t1 = Date.now();
ZW.leapMonthOf(astro, 2023);
const second = Date.now() - t1;
t('第二次调用更快（命中缓存）', second <= first, first + 'ms -> ' + second + 'ms');

console.log('\n=== 该月天数 ===\n');
// 农历月只有 29 或 30 天
const dm1 = ZW.daysInMonth(astro, 2023, 2, false);
const dm2 = ZW.daysInMonth(astro, 2023, 2, true);
const dm3 = ZW.daysInMonth(astro, 2023, 1, false);
console.log('  2023 二月(普通): ' + dm1 + ' 天');
console.log('  2023 闰二月:     ' + dm2 + ' 天');
console.log('  2023 正月:       ' + dm3 + ' 天');
t('普通月天数合法(29/30)', dm1 === 29 || dm1 === 30, String(dm1));
t('闰月天数合法(29/30)', dm2 === 29 || dm2 === 30, String(dm2));
t('正月天数合法', dm3 === 29 || dm3 === 30, String(dm3));

// 遍历多年，天数都必须是 29 或 30
let allValid = true;
const bad = [];
for (let y = 2020; y <= 2030; y++) {
  for (let m = 1; m <= 12; m++) {
    const d = ZW.daysInMonth(astro, y, m, false);
    if (d !== 29 && d !== 30) { allValid = false; bad.push(y + '-' + m + '=' + d); }
  }
}
t('2020-2030 所有月份天数都合法', allValid, bad.length ? bad.slice(0, 5).join(',') : '132 个月全部合法');

console.log('\n=== 排盘差异确认（闰月确实影响命盘）===\n');
// 用闰二月下半月验证：闰月与非闰月排出的盘不同
const a1 = astro.byLunar('2023-2-20', 6, '男', false, true, 'zh-CN');
const a2 = astro.byLunar('2023-2-20', 6, '男', true, true, 'zh-CN');
const ming1 = a1.palaces.find(p => p.name === '命宫');
const ming2 = a2.palaces.find(p => p.name === '命宫');
console.log('  闰二月二十 非闰月: 命宫 ' + ming1.earthlyBranch + ' / ' + (ming1.majorStars[0] || {}).name);
console.log('  闰二月二十 闰月:   命宫 ' + ming2.earthlyBranch + ' / ' + (ming2.majorStars[0] || {}).name);
t('闰月下半月排出的盘确实不同',
  a1.earthlyBranchOfSoulPalace !== a2.earthlyBranchOfSoulPalace,
  a1.earthlyBranchOfSoulPalace + ' vs ' + a2.earthlyBranchOfSoulPalace);

console.log('\n=== 边界 ===\n');
t('超范围年份不抛错', (() => {
  try { ZW.leapMonthOf(astro, 1800); return true; } catch (e) { return false; }
})());
t('1900 年可查询', (() => {
  try { const r = ZW.leapMonthOf(astro, 1900); return typeof r === 'number'; }
  catch (e) { return false; }
})());
t('缓存在 clearCache 后清空', (() => {
  ZW.clearCache();
  return ZW.leapMonthOf(astro, 2023) === 2;
})());

console.log('\n=== 查找表与实时探测结果必须一致 ===\n');

// 这是关键校验：js/lunar-table.js 是预生成的，
// 若生成脚本有误，查表会给出错误的闰月，而运行时看不出来。
const T = require('./js/lunar-table.js');
t('表已加载', !!(T && T.leap && T.days), '覆盖 ' + T.START + '-' + T.END);

// 抽样年份做实时探测比对（全量太慢，抽样覆盖有闰月与无闰月两类）
const sampleYears = [];
for (let y = 1950; y <= 2050; y += 7) sampleYears.push(y);

let mismatch = [];
const tProbe = Date.now();
sampleYears.forEach((y) => {
  // 实时探测（绕过缓存与查表）
  let probed = 0;
  for (let m = 1; m <= 12; m++) {
    if (ZW.monthIsLeapProbe(astro, y, m)) { probed = m; break; }
  }
  const fromTable = Number(T.leap[y]) || 0;
  if (probed !== fromTable) mismatch.push(y + ': 表=' + fromTable + ' 实测=' + probed);
});
const probeMs = Date.now() - tProbe;

t('抽样年份表值与实时探测一致', mismatch.length === 0,
  mismatch.length ? mismatch.slice(0, 3).join('; ') : sampleYears.length + ' 个年份全部一致（' + probeMs + 'ms）');

// 天数抽样比对
let dayMismatch = [];
sampleYears.slice(0, 6).forEach((y) => {
  const leap = Number(T.leap[y]) || 0;
  for (let m = 1; m <= 12; m++) {
    const fromTable = ZW.daysInMonth(astro, y, m, false);
    // 实时探测
    let real = 29;
    try {
      const a = astro.byLunar(`${y}-${m}-30`, 6, '男', false, true, 'zh-CN');
      const raw = a.rawDates.lunarDate;
      if (raw.lunarMonth === m && raw.lunarDay === 30 && !raw.isLeap) real = 30;
    } catch (e) { real = 29; }
    if (fromTable !== real) dayMismatch.push(y + '-' + m + ': 表=' + fromTable + ' 实测=' + real);
  }
});
t('抽样月份天数表值与实时探测一致', dayMismatch.length === 0,
  dayMismatch.length ? dayMismatch.slice(0, 3).join('; ') : '72 个月全部一致');

console.log('\n=== 查表性能 ===\n');
ZW.clearCache();
let tp = Date.now();
for (let y = 1900; y <= 2100; y++) ZW.leapMonthOf(astro, y);
const ms = Date.now() - tp;
t('201 年查询在 50ms 内完成', ms < 50, ms + 'ms');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);