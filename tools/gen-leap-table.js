/* 生成农历闰月查找表（1900-2100）
 *
 * 运行时逐月探测太慢（无闰月的年份要试满 12 个月，约 200ms/年）。
 * 闰月是固定的历史事实，预生成一张表即可，运行时 O(1)。
 *
 * 用法：node tools/gen-leap-table.js
 */
const { astro } = require('iztro');
const fs = require('fs');
const path = require('path');

const START = 1900;
const END = 2100;

/** 判断某年某月是否闰月 */
function monthIsLeap(y, m) {
  try {
    const a = astro.byLunar(`${y}-${m}-1`, 6, '男', true, true, 'zh-CN');
    const raw = a.rawDates && a.rawDates.lunarDate;
    return !!(raw && raw.isLeap && raw.lunarMonth === m);
  } catch (e) {
    return false;
  }
}

/** 某月天数（29 或 30） */
function daysOf(y, m, isLeap) {
  try {
    const a = astro.byLunar(`${y}-${m}-30`, 6, '男', !!isLeap, true, 'zh-CN');
    const raw = a.rawDates && a.rawDates.lunarDate;
    if (raw && raw.lunarMonth === m && raw.lunarDay === 30 && !!raw.isLeap === !!isLeap) return 30;
  } catch (e) { }
  return 29;
}

const leapMap = {};     // 年 -> 闰月月份
const dayMap = {};      // 年 -> 12 个月的「大小月」位串（含闰月位）

console.log(`生成 ${START}-${END} 农历数据…`);
const t0 = Date.now();

for (let y = START; y <= END; y++) {
  let leap = 0;
  for (let m = 1; m <= 12; m++) {
    if (monthIsLeap(y, m)) { leap = m; break; }
  }
  if (leap) leapMap[y] = leap;

  // 每月大小：1=大月(30天) 0=小月(29天)
  // 闰月位用第 13 位表示
  let bits = '';
  for (let m = 1; m <= 12; m++) bits += daysOf(y, m, false) === 30 ? '1' : '0';
  bits += leap ? (daysOf(y, leap, true) === 30 ? '1' : '0') : '0';
  dayMap[y] = bits;

  if ((y - START) % 40 === 0) console.log(`  …${y}`);
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`完成，用时 ${elapsed}s`);

const out = `/* ============================================================
 * 农历闰月与大小月查找表（${START}-${END}）
 *
 * 由 tools/gen-leap-table.js 自动生成，请勿手改。
 * 闰月是固定的历史事实，预生成查表比运行时探测快数百倍。
 *
 * leap: 年份 -> 闰月月份（不在表中表示该年无闰月）
 * days: 年份 -> 13 位串，前 12 位对应 1-12 月，第 13 位对应闰月
 *       '1' = 大月 30 天，'0' = 小月 29 天
 *       该年无闰月时第 13 位恒为 '0'
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWLunarTable = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var LEAP = ${JSON.stringify(leapMap)};
  var DAYS = ${JSON.stringify(dayMap)};

  return {
    START: ${START},
    END: ${END},
    leap: LEAP,
    days: DAYS,
  };
});
`;

const dest = path.join(__dirname, '..', 'js', 'lunar-table.js');
fs.writeFileSync(dest, out);
console.log(`已写入 ${dest}（${(out.length / 1024).toFixed(1)} KB）`);
console.log(`有闰月的年份: ${Object.keys(leapMap).length} / ${END - START + 1}`);