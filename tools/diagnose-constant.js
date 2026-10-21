/* 诊断：找出「无论怎么换出生日期，某项结果都一样」的字段
 *
 * 方法：取一组差异极大的出生日期，把每个解读产物的字段全部拍平，
 * 逐字段比对——只在不同命盘间恒定不变的字段就是可疑项。
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
  ['2005-12-1', 11, '女'],
  ['1955-7-7', 5, '男'],
];

/* 把任意嵌套对象拍平成 path -> value */
function flatten(obj, prefix, out) {
  out = out || {};
  prefix = prefix || '';
  if (obj === null || obj === undefined) { out[prefix || '(root)'] = String(obj); return out; }
  if (typeof obj !== 'object') { out[prefix || '(root)'] = String(obj); return out; }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, prefix + '[' + i + ']', out));
    return out;
  }
  Object.keys(obj).forEach((k) => flatten(obj[k], prefix ? prefix + '.' + k : k, out));
  return out;
}

console.log('构建 ' + CASES.length + ' 张差异很大的命盘…\n');

const charts = CASES.map(([d, t, g]) => {
  const a = astro.bySolar(d, t, g, true, 'zh-CN');
  return { label: d + ' ' + g + ' t' + t, a };
});

/* 收集所有解读产物 */
const products = {};

products.reading = charts.map((c) => ZW.buildReading(c.a));
products.daxian = charts.map((c) => ZW.buildDaxianTimeline(
  c.a,
  Number(c.a.rawDates.lunarDate.lunarYear),
  new Date().getFullYear(),
  new Date().getFullYear()
));
products.stars = charts.map((c) => ZW.resolveSoulStars(c.a));

/* 流年需要 horoscope */
products.year = charts.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  return ZW.buildYearReading(c.a, h);
});
products.month = charts.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  return ZW.buildMonthReading(c.a, h);
});
products.day = charts.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  return ZW.buildShortReading(c.a, h, { level: 'day', dateLabel: '2026/06/15' });
});

/* 逐字段比对 */
Object.keys(products).forEach((name) => {
  console.log('='.repeat(64));
  console.log('产物: ' + name);
  console.log('='.repeat(64));

  const flat = products[name].map((p) => flatten(p));
  const allKeys = new Set();
  flat.forEach((f) => Object.keys(f).forEach((k) => allKeys.add(k)));

  const constant = [];
  allKeys.forEach((k) => {
    const vals = flat.map((f) => f[k]);
    const uniq = new Set(vals.filter((v) => v !== undefined));
    if (uniq.size === 1 && vals.filter((v) => v !== undefined).length === flat.length) {
      constant.push({ key: k, value: vals[0] });
    }
  });

  if (!constant.length) {
    console.log('  （无恒定字段，全部随命盘变化）\n');
    return;
  }

  console.log('  所有命盘都相同的字段（共 ' + constant.length + ' 个）:');
  constant.forEach((c) => {
    const v = String(c.value);
    const shown = v.length > 70 ? v.slice(0, 70) + '…' : v;
    console.log('    ' + c.key.padEnd(38) + ' = ' + shown);
  });
  console.log('');
});