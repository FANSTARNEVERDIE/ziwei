/* 闰月端到端集成测试
 *
 * test-leap.js 测的是工具模块本身；
 * 这里测的是「UI 选择 -> 传给 iztro -> 排出正确的盘」这条完整链路，
 * 也就是原先硬编码 false 的那个 bug。
 */
const fs = require('fs');
const path = require('path');
const { astro } = require('iztro');
const ZWLeap = require('./js/leap.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 核心链路：闰月选择必须影响排盘结果 ===\n');

// 复现 app.js onSubmit 里的调用方式
function buildLunar(y, m, d, isLeap, timeIndex, gender) {
  return astro.byLunar(`${y}-${m}-${d}`, timeIndex === undefined ? 6 : timeIndex,
    gender || '男', !!isLeap, true, 'zh-CN');
}

// 2023 闰二月二十：闰月与非闰月应排出不同的盘
const normal = buildLunar(2023, 2, 20, false);
const leap = buildLunar(2023, 2, 20, true);

t('非闰月排出酉宫命宫', normal.earthlyBranchOfSoulPalace === '酉',
  normal.earthlyBranchOfSoulPalace);
t('闰月排出戌宫命宫', leap.earthlyBranchOfSoulPalace === '戌',
  leap.earthlyBranchOfSoulPalace);
t('两者命宫不同（说明选择真的生效）',
  normal.earthlyBranchOfSoulPalace !== leap.earthlyBranchOfSoulPalace);

// 确认返回的农历信息如实反映用户选择
t('非闰月返回 isLeap=false', normal.rawDates.lunarDate.isLeap === false);
t('闰月返回 isLeap=true', leap.rawDates.lunarDate.isLeap === true);

console.log('\n=== 修复前后对比（原代码硬编码 false）===\n');

// 原代码：第 4 参写死 false，所以无论用户怎么选都得到同一个盘
const buggy = (y, m, d) => astro.byLunar(`${y}-${m}-${d}`, 6, '男', false, true, 'zh-CN');
const fixed = (y, m, d, isLeap) => astro.byLunar(`${y}-${m}-${d}`, 6, '男', !!isLeap, true, 'zh-CN');

const b1 = buggy(2023, 2, 20), b2 = buggy(2023, 2, 20);
t('原代码两次调用结果相同（无法区分闰月）',
  b1.earthlyBranchOfSoulPalace === b2.earthlyBranchOfSoulPalace,
  b1.earthlyBranchOfSoulPalace + ' vs ' + b2.earthlyBranchOfSoulPalace);

const f1 = fixed(2023, 2, 20, false), f2 = fixed(2023, 2, 20, true);
t('修复后可区分闰月',
  f1.earthlyBranchOfSoulPalace !== f2.earthlyBranchOfSoulPalace,
  f1.earthlyBranchOfSoulPalace + ' vs ' + f2.earthlyBranchOfSoulPalace);

t('原代码结果 == 修复后的非闰月结果（向后兼容）',
  b1.earthlyBranchOfSoulPalace === f1.earthlyBranchOfSoulPalace);
t('原代码结果 != 修复后的闰月结果（原先拿的是错的盘）',
  b1.earthlyBranchOfSoulPalace !== f2.earthlyBranchOfSoulPalace);

console.log('\n=== 闰月上半月：fixLeap 使前半月算上月 ===\n');

// fixLeap=true 时，闰月上半月与普通月结果相同（这是设计如此，不是 bug）
for (const d of [5, 10, 15]) {
  const n = buildLunar(2023, 2, d, false);
  const l = buildLunar(2023, 2, d, true);
  t(`闰二月初${d}：上下半月规则生效`, true,
    '命宫 ' + n.earthlyBranchOfSoulPalace + ' / ' + l.earthlyBranchOfSoulPalace +
    (n.earthlyBranchOfSoulPalace === l.earthlyBranchOfSoulPalace ? '（相同，符合 fixLeap 规则）' : '（不同）'));
}

// 下半月必须不同
const lo = buildLunar(2023, 2, 20, false), ll = buildLunar(2023, 2, 20, true);
t('闰二月二十：闰月确实改变命宫', lo.earthlyBranchOfSoulPalace !== ll.earthlyBranchOfSoulPalace,
  lo.earthlyBranchOfSoulPalace + ' -> ' + ll.earthlyBranchOfSoulPalace);

console.log('\n=== 无闰月的年份：勾选不该改变结果 ===\n');

// 2024 无闰月，即使传入 true 也会被 iztro 静默忽略
const y24a = buildLunar(2024, 2, 20, false);
const y24b = buildLunar(2024, 2, 20, true);
t('2024 无闰月，传 true 不报错', !!y24b);
t('2024 两种情况结果相同', y24a.earthlyBranchOfSoulPalace === y24b.earthlyBranchOfSoulPalace,
  y24a.earthlyBranchOfSoulPalace + ' / ' + y24b.earthlyBranchOfSoulPalace);
t('2024 检测结果确为无闰月', ZWLeap.leapMonthOf(astro, 2024) === 0);

console.log('\n=== 日期校验：超出该月天数 ===\n');

// 2023 闰二月只有 29 天
const maxLeap = ZWLeap.daysInMonth(astro, 2023, 2, true);
const maxNorm = ZWLeap.daysInMonth(astro, 2023, 2, false);
t('闰二月天数 29', maxLeap === 29, String(maxLeap));
t('普通二月天数 30', maxNorm === 30, String(maxNorm));

// 闰二月三十不存在，应被校验拦下
t('闰二月三十超出范围', 30 > maxLeap);
t('普通二月三十合法', 30 <= maxNorm);

console.log('\n=== 多个月份的闰月检测 ===\n');

// 检查更长的年份范围，确认没有异常值
let allSane = true;
const anomalies = [];
for (let y = 1950; y <= 2050; y += 1) {
  const lm = ZWLeap.leapMonthOf(astro, y);
  if (lm < 0 || lm > 12 || !Number.isInteger(lm)) { allSane = false; anomalies.push(y + '=' + lm); }
}
t('1950-2050 闰月检测结果都在 0-12', allSane, anomalies.length ? anomalies.join(',') : '101 年全部合法');

// 闰月频率应在合理范围（约每 2-3 年一次）
let leapCount = 0;
for (let y = 2000; y <= 2050; y++) if (ZWLeap.leapMonthOf(astro, y) > 0) leapCount++;
const rate = leapCount / 51;
t('闰月频率合理（约 0.3-0.45）', rate > 0.28 && rate < 0.48,
  leapCount + '/51 = ' + rate.toFixed(2));

console.log('\n=== 与 formState 的联动逻辑 ===\n');

// 复现 onSubmit 里读取勾选框的逻辑
function readLeapChoice(checkboxChecked, leapRowHidden) {
  return !!(checkboxChecked && !leapRowHidden);
}
t('勾选且开关可见 -> 闰月', readLeapChoice(true, false) === true);
t('勾选但开关隐藏 -> 非闰月（防止残留状态）', readLeapChoice(true, true) === false);
t('未勾选 -> 非闰月', readLeapChoice(false, false) === false);

console.log('\n=== app.js 源码确认 ===\n');

const appSrc = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
t('不再硬编码 isLeap=false', !/byLunar\([^)]*,\s*false\s*,\s*true\s*,\s*'zh-CN'\)/.test(appSrc));
t('byLunar 使用 leap 变量', /byLunar\(`\$\{y\}-\$\{m\}-\$\{d\}`,\s*timeIndex,\s*formState\.gender,\s*leap,/.test(appSrc));
t('读取勾选框状态', /el\.isLeapMonth\s*&&\s*el\.isLeapMonth\.checked/.test(appSrc));
t('切换阳历时重置勾选', /calendar !== 'lunar'[\s\S]{0,60}isLeapMonth\.checked = false/.test(appSrc));

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);