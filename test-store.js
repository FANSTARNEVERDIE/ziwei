/* 持久化模块测试：URL 编解码往返、边界、收藏夹逻辑 */
const ZW = require('./js/store.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== URL 编解码往返 ===\n');
const cases = [
  { calendar: 'solar', gender: '男', year: 2000, month: 8, day: 16, shichen: 6, trueSolar: false, longitude: 120 },
  { calendar: 'lunar', gender: '女', year: 1984, month: 2, day: 2, shichen: 0, trueSolar: false, longitude: 120 },
  { calendar: 'solar', gender: '女', year: 1995, month: 3, day: 15, shichen: 11, trueSolar: true, longitude: 87.6 },
  { calendar: 'solar', gender: '男', year: 1900, month: 1, day: 1, shichen: 12, trueSolar: true, longitude: 135 },
  { calendar: 'solar', gender: '女', year: 2100, month: 12, day: 31, shichen: 0, trueSolar: false, longitude: 120 },
];
let allRound = true;
for (const c of cases) {
  const q = ZW.encodeState(c);
  const back = ZW.decodeState(q);
  const ok = back &&
    back.year === c.year && back.month === c.month && back.day === c.day &&
    back.shichen === c.shichen && back.gender === c.gender &&
    back.calendar === c.calendar &&
    back.trueSolar === c.trueSolar &&
    Math.abs(back.longitude - c.longitude) < 0.0001;
  if (!ok) allRound = false;
  console.log((ok ? '  OK  ' : '  FAIL') + ` ${c.year}-${c.month}-${c.day} ${c.gender} ${c.shichen}时 ts=${c.trueSolar} lon=${c.longitude}`);
  console.log('       ' + q);
}
t('全部往返一致', allRound);

console.log('\n=== 链接可读性 ===\n');
const q1 = ZW.encodeState(cases[0]);
console.log('  编码: ' + q1);
t('字段简短可读', q1.length < 40, q1.length + ' 字符');

console.log('\n=== 边界与异常 ===\n');
t('空查询串返回 null', ZW.decodeState('') === null);
t('无 d 参数返回 null', ZW.decodeState('?t=6&g=m') === null);
t('非法日期返回 null', ZW.decodeState('?d=2000-13-45') === null);
t('超范围年份返回 null', ZW.decodeState('?d=1800-1-1') === null);
t('超范围年份(2101)返回 null', ZW.decodeState('?d=2101-1-1') === null);
t('缺 t 时默认午时', ZW.decodeState('?d=2000-1-1').shichen === 6);
t('越界 t 被拒绝并回落', ZW.decodeState('?d=2000-1-1&t=99').shichen === 6);
t('越界经度被拒绝并回落', ZW.decodeState('?d=2000-1-1&lon=999').longitude === 120);
t('乱码不抛错', ZW.decodeState('?d=%%%') === null);
t('null 输入不抛错', ZW.decodeState(null) === null);

console.log('\n=== 分享链接 ===\n');
const url = ZW.buildShareUrl('https://example.com/ziwei/index.html?old=1#hash', cases[2]);
console.log('  ' + url);
t('保留路径且去掉旧参数与 hash',
  url.startsWith('https://example.com/ziwei/index.html?') &&
  !url.includes('old=1') && !url.includes('#hash'));
t('生成的链接能被解析回来', (() => {
  const b = ZW.decodeState(url.split('?')[1]);
  return b && b.year === 1995 && b.trueSolar === true && Math.abs(b.longitude - 87.6) < 0.001;
})());

console.log('\n=== 收藏夹（Node 无 localStorage，走降级路径）===\n');
t('storageAvailable 在 Node 下为 false', ZW.storageAvailable() === false);

const e1 = { calendar: 'solar', gender: '男', year: 2000, month: 8, day: 16, shichen: 6, label: '自己' };
const e2 = { calendar: 'solar', gender: '女', year: 1990, month: 5, day: 20, shichen: 3, label: '朋友' };
let fb = ZW.addFavoriteFallback(e1);
fb = ZW.addFavoriteFallback(e2);
t('降级模式可添加', fb.list.length === 2, fb.list.map(x => x.label).join(','));
t('最新的排最前', fb.list[0].label === '朋友');

const fb2 = ZW.addFavoriteFallback(e1);   // 重复添加同一命盘
t('同一命盘不重复添加', fb2.list.length === 2, '仍为 ' + fb2.list.length + ' 条');
t('重复添加时更新备注并置顶', fb2.list[0].label === '自己' && fb2.list.length === 2);

t('sameChart 判定正确',
  ZW.sameChart(e1, { year: 2000, month: 8, day: 16, shichen: 6, gender: '男', calendar: 'solar' }) === true &&
  ZW.sameChart(e1, e2) === false);

t('不同时辰视为不同命盘',
  ZW.sameChart(e1, Object.assign({}, e1, { shichen: 5 })) === false);

console.log('\n=== localStorage 可用时的完整路径（模拟）===\n');
// 注入一个假的 localStorage 再测
const store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
// 重新加载模块以使用新的全局
delete require.cache[require.resolve('./js/store.js')];
const ZW2 = require('./js/store.js');

t('storageAvailable 为 true', ZW2.storageAvailable() === true);
let r = ZW2.addFavorite({ calendar: 'solar', gender: '男', year: 2000, month: 8, day: 16, shichen: 6, label: '甲' });
r = ZW2.addFavorite({ calendar: 'solar', gender: '女', year: 1990, month: 5, day: 20, shichen: 3, label: '乙' });
t('写入两条', r.list.length === 2, r.list.map(x => x.label).join(','));
t('返回的 list 按时间倒序', r.list[0].label === '乙');

const id = r.list[0].id;
const after = ZW2.removeFavorite(id);
t('可删除指定条目', after.length === 1 && after[0].label === '甲');

// 上限
ZW2.clearFavorites();
for (let i = 0; i < ZW2.MAX_FAVORITES + 8; i++) {
  ZW2.addFavorite({
    calendar: 'solar', gender: '男',
    year: 1950 + i, month: 1, day: 1, shichen: 6, label: 'x' + i
  });
}
const capped = ZW2.listFavorites();
t('数量上限生效', capped.length === ZW2.MAX_FAVORITES, capped.length + ' / ' + ZW2.MAX_FAVORITES);
t('超出时丢弃最旧的', capped[0].label === 'x' + (ZW2.MAX_FAVORITES + 7),
  '最新=' + capped[0].label);

// 备注长度限制
ZW2.clearFavorites();
const long = 'あ'.repeat(80);
const rl = ZW2.addFavorite({ calendar: 'solar', gender: '男', year: 2000, month: 1, day: 1, shichen: 6, label: long });
t('备注被截断到 24 字', rl.list[0].label.length === 24, rl.list[0].label.length + ' 字');

// 损坏数据
store['ziwei.favorites.v1'] = '{不是合法JSON';
t('损坏数据不抛错且返回空', ZW2.listFavorites().length === 0);
store['ziwei.favorites.v1'] = '{"not":"array"}';
t('非数组数据返回空', ZW2.listFavorites().length === 0);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);