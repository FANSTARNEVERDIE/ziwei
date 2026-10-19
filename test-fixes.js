/* 代码审查发现的问题的回归测试
 *
 * 每个用例对应一个已修复的真实 bug，防止回归。
 * 这些 bug 大多是「静默错误」——不崩溃，但结果为错。
 */
const { astro } = require('iztro');
const ZW = require('./js/store.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== H1: 收藏 id 必须唯一（同一毫秒连续保存）===\n');

const ids = new Set();
for (let i = 0; i < 50; i++) ids.add(ZW.makeId('f'));
t('50 次生成无重复', ids.size === 50, ids.size + '/50');

const ids2 = new Set();
for (let i = 0; i < 50; i++) ids2.add(ZW.makeId('m'));
t('不同前缀也不重复', ids2.size === 50, ids2.size + '/50');

// 模拟真实场景：同一毫秒内存两条，删一条不能删掉两条
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
delete require.cache[require.resolve('./js/store.js')];
const S2 = require('./js/store.js');

S2.clearFavorites();
const r1 = S2.addFavorite({ calendar: 'solar', gender: '男', year: 2000, month: 8, day: 16, shichen: 6, label: '甲' });
const r2 = S2.addFavorite({ calendar: 'solar', gender: '女', year: 1990, month: 5, day: 20, shichen: 3, label: '乙' });
t('两条 id 不同', r2.list[0].id !== r2.list[1].id, r2.list.map(x => x.id).join(' / '));

const before = S2.listFavorites().length;
const afterDel = S2.removeFavorite(r2.list[0].id);
t('删一条只删一条', afterDel.length === before - 1, before + ' -> ' + afterDel.length);

console.log('\n=== H2: 出生日期晚于所查年份 ===\n');

// iztro 对出生前年份返回负虚岁，页面必须兜底
const future = astro.bySolar('2035-8-16', 6, '男', true, 'zh-CN');
const hf = future.horoscope('2026-06-15');
t('iztro 确实返回负虚岁（问题存在）', hf.age.nominalAge < 0, '虚岁 = ' + hf.age.nominalAge);
t('大限 index 为 -1（问题存在）', hf.decadal.index === -1, 'index = ' + hf.decadal.index);
t('小限 index 为 -1（问题存在）', hf.age.index === -1, 'index = ' + hf.age.index);

// 页面侧的兜底逻辑（与 app.js 的 ageText 保持一致）
function ageText(age) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return '—';
  if (age < 1) return '未出生';
  return String(age);
}
t('兜底：负数显示为「未出生」', ageText(-8) === '未出生', ageText(-8));
t('兜底：正常虚岁照常显示', ageText(27) === '27', ageText(27));
t('兜底：非数字显示为「—」', ageText(undefined) === '—' && ageText(NaN) === '—');

// 正常出生日期不受影响
const normal = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const hn = normal.horoscope('2026-06-15');
t('正常命盘虚岁为正', hn.age.nominalAge > 0, '虚岁 = ' + hn.age.nominalAge);
t('正常命盘大限有效', hn.decadal.index >= 0, 'index = ' + hn.decadal.index);

console.log('\n=== H3: 时辰索引（23 点应为晚子时）===\n');

function hourToTimeIndex(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h === 23) return 12;
  return Math.floor((h + 1) / 2);
}
const SHICHEN_NAMES = ['早子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时',
  '申时', '酉时', '戌时', '亥时', '晚子时'];

t('23 点 -> 晚子时(12)', hourToTimeIndex(23) === 12, hourToTimeIndex(23) + ' ' + SHICHEN_NAMES[hourToTimeIndex(23)]);
t('0 点 -> 早子时(0)', hourToTimeIndex(0) === 0);
t('13 点 -> 未时(7)', hourToTimeIndex(13) === 7, SHICHEN_NAMES[hourToTimeIndex(13)]);
t('12 点 -> 午时(6)', hourToTimeIndex(12) === 6);
t('22 点 -> 亥时(11)', hourToTimeIndex(22) === 11);

// 全部 24 小时都必须落在 0-12 范围内
let allValid = true;
const seen = new Set();
for (let h = 0; h < 24; h++) {
  const idx = hourToTimeIndex(h);
  if (!Number.isInteger(idx) || idx < 0 || idx > 12) allValid = false;
  seen.add(idx);
}
t('24 小时都映射到合法索引', allValid, [...seen].sort((a, b) => a - b).join(','));

console.log('\n=== M1: 流日跨年时年份必须同步 ===\n');

// 模拟 onDayChange 的判断逻辑
function shouldFullRender(dateStr, currentYear) {
  const m = /^(\d{4})-/.exec(dateStr);
  if (!m) return false;
  return Number(m[1]) !== currentYear;
}
t('同年内不触发完整重算', shouldFullRender('2026-08-01', 2026) === false);
t('跨年触发完整重算', shouldFullRender('2030-01-01', 2026) === true);
t('往回跨年也触发', shouldFullRender('2020-01-01', 2026) === true);

console.log('\n=== M7/M9: 容错与方向键 ===\n');

// openDrawer 的空值保护逻辑
function safeOpen(state) {
  const a = state.chart;
  if (!a || !a.palaces) return 'guarded';
  return 'ok';
}
t('state.chart 为 null 时不抛错', safeOpen({ chart: null }) === 'guarded');
t('缺少 palaces 时不抛错', safeOpen({ chart: {} }) === 'guarded');
t('正常盘可打开', safeOpen({ chart: { palaces: [] } }) === 'ok');

// 方向键邻居查找：跳过中心区不应消耗步数预算
const GRID_POS = {
  '巳': [1, 1], '午': [1, 2], '未': [1, 3], '申': [1, 4],
  '辰': [2, 1], '酉': [2, 4],
  '卯': [3, 1], '戌': [3, 4],
  '寅': [4, 1], '丑': [4, 2], '子': [4, 3], '亥': [4, 4],
};
// 构建坐标 -> 宫名映射
const byPos = new Map();
Object.entries(GRID_POS).forEach(([zhi, [r, c]]) => byPos.set(r + ',' + c, zhi));

function findNeighbor(zhi, dr, dc) {
  const pos = GRID_POS[zhi];
  if (!pos) return null;
  let r = pos[0], c = pos[1];
  for (let step = 0; step < 8; step++) {
    r += dr; c += dc;
    if (r < 1 || r > 4 || c < 1 || c > 4) return null;
    if (r >= 2 && r <= 3 && c >= 2 && c <= 3) continue;
    const found = byPos.get(r + ',' + c);
    if (found) return found;
  }
  return null;
}

t('左下(寅)向上 -> 卯', findNeighbor('寅', -1, 0) === '卯', findNeighbor('寅', -1, 0));
t('左上(巳)向下 -> 辰', findNeighbor('巳', 1, 0) === '辰', findNeighbor('巳', 1, 0));
t('左下(寅)向右 -> 丑', findNeighbor('寅', 0, 1) === '丑', findNeighbor('寅', 0, 1));
t('右上(申)向左 -> 未', findNeighbor('申', 0, -1) === '未', findNeighbor('申', 0, -1));
// 注意盘面布局（列号即坐标的第二位）：
//   巳 午 未 申     午 = (1,2)
//   辰 [中] [中] 酉
//   卯 [中] [中] 戌
//   寅 丑 子 亥     丑 = (4,2)
// 从午(1,2)向下：连续跳过 (2,2)(3,2) 两个中心格，落到 (4,2) = 丑
t('上中(午)向下 -> 跳过中心区落到底部同行', findNeighbor('午', 1, 0) === '丑',
  findNeighbor('午', 1, 0));
// 从子(4,3)向上：跳过 (3,3)(2,3)，落到 (1,3) = 未
t('下中(子)向上 -> 跳过中心区落到顶部同行', findNeighbor('子', -1, 0) === '未',
  findNeighbor('子', -1, 0));
t('左中(辰)向右 -> 跳过中心区到右侧', findNeighbor('辰', 0, 1) === '酉',
  findNeighbor('辰', 0, 1));
t('右中(酉)向左 -> 跳过中心区到左侧', findNeighbor('酉', 0, -1) === '辰',
  findNeighbor('酉', 0, -1));

// 穷举比对：旧实现（4 步预算）与新实现（8 步预算）在真实布局下是否一致。
// 结论：完全一致 —— 实际盘面最多连续跳过 2 个中心格，4 步够用。
// 也就是说「方向键部分宫位失灵」这条审查意见不成立。
// 保留放宽后的 8 步只是防御性写法（中心区尺寸若变化也不会立刻失效）。
function findNeighborOld(zhi, dr, dc) {
  const pos = GRID_POS[zhi];
  if (!pos) return null;
  let r = pos[0], c = pos[1];
  for (let step = 0; step < 4; step++) {
    r += dr; c += dc;
    if (r < 1 || r > 4 || c < 1 || c > 4) break;
    if (r >= 2 && r <= 3 && c >= 2 && c <= 3) continue;
    const found = byPos.get(r + ',' + c);
    if (found) return found;
  }
  return null;
}

let sameAsOld = true;
const diffs = [];
Object.keys(GRID_POS).forEach((z) => {
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
    const o = findNeighborOld(z, dr, dc);
    const n = findNeighbor(z, dr, dc);
    if (o !== n) { sameAsOld = false; diffs.push(z + '(' + dr + ',' + dc + '): ' + o + ' vs ' + n); }
  });
});
t('新旧实现在全部 48 种情况下一致（M9 不成立）', sameAsOld,
  diffs.length ? diffs.slice(0, 4).join('; ') : '48/48 一致');

// 越界应返回 null
t('左上角向左越界返回 null', findNeighbor('巳', 0, -1) === null);
t('右上角向上越界返回 null', findNeighbor('申', -1, 0) === null);

// 每个宫位在四个方向上都不应抛错
let noThrow = true;
Object.keys(GRID_POS).forEach((z) => {
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
    try { findNeighbor(z, dr, dc); } catch (e) { noThrow = false; }
  });
});
t('12 宫 × 4 方向均不抛错', noThrow);

console.log('\n=== H5/S3: localStorage 损坏数据过滤 ===\n');

store['ziwei.favorites.v1'] = JSON.stringify([
  { id: 'ok1', year: 2000, month: 8, day: 16, label: '正常' },
  { id: 'bad1', year: 'abc', month: 8, day: 16 },       // 年份非数字
  { id: 'bad2', month: 8, day: 16 },                     // 缺年份
  null,                                                   // null 条目
  'not-an-object',                                        // 字符串
  { year: 2000, month: 8, day: 16 },                     // 缺 id
]);
const clean = S2.listFavorites();
t('损坏条目被过滤', clean.length === 1, '保留 ' + clean.length + ' 条');

t('sanitize 导出可用', typeof S2.sanitize === 'function');
t('sanitize 处理非数组', S2.sanitize(null).length === 0 && S2.sanitize('x').length === 0);

// 超长字段被截断
S2.clearFavorites();
const long = 'あ'.repeat(200);
const rl = S2.addFavorite({
  calendar: 'solar', gender: '男', year: 2000, month: 1, day: 1, shichen: 6,
  label: long, solarDate: long, lunarDate: long, soulStar: long,
});
const saved = rl.list[0];
t('label 截断到 24', saved.label.length === 24, saved.label.length);
t('solarDate 截断到 32', saved.solarDate.length === 32, saved.solarDate.length);
t('lunarDate 截断到 32', saved.lunarDate.length === 32, saved.lunarDate.length);
t('soulStar 截断到 48', saved.soulStar.length === 48, saved.soulStar.length);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);