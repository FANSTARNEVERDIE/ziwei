/* 「星 × 四化」情境库测试
 *
 * 背景：用户发现流日/流时的四化文案「每次都是这一句」。
 * 根因：SIHUA 表里四类四化各只有一句 lead，
 *       换星名换宫名但句子不变，读起来完全是废话。
 *
 * 本测试锁死：不同星的四化必须给出不同内容。
 */
const SS = require('./js/sihua-star.js');
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
  // 会参与四化的辅星：缺了它们就会退回旧模板
  '左辅', '右弼', '文昌', '文曲'];
const HUAS = ['禄', '权', '科', '忌'];

/* 四化表实际会用到的全部星曜（10 天干 × 4 化去重后为 15 颗） */
const HUA_STARS = ['廉贞', '破军', '武曲', '太阳', '天机', '天梁', '紫微',
  '太阴', '天同', '文昌', '巨门', '贪狼', '右弼', '文曲', '左辅'];

console.log('=== 覆盖完整性 ===\n');

const cov = SS.coverage();
t('18 颗星有表（14 主星 + 4 辅星）', cov.stars === 18, cov.stars + ' 颗');
t('条目总数 = 18 × 4 = 72', cov.entries === 72, cov.entries + ' 条');

/* 关键：四化表会用到的星，一颗都不能缺 —— 缺一颗就会退回模板 */
const missingHua = HUA_STARS.filter((s) => !SS.get(s, '忌'));
t('四化表涉及的 15 颗星全部有表', missingHua.length === 0,
  missingHua.length ? '缺: ' + missingHua.join(', ') : '15/15（这是防模板的核心）');

const missing = [];
STARS.forEach((s) => HUAS.forEach((h) => { if (!SS.get(s, h)) missing.push(s + '化' + h); }));
t('每颗星 × 每种四化都能取到', missing.length === 0,
  missing.length ? '缺: ' + missing.join(', ') : '72/72');

console.log('\n=== 关键：不同星的四化必须不同 ===\n');

/* 同一个四化下，14 颗星的文案必须两两不同 */
HUAS.forEach((h) => {
  const texts = STARS.map((s) => SS.get(s, h).text);
  const uniq = new Set(texts);
  t('化' + h + ' 十八颗星各不相同', uniq.size === STARS.length,
    uniq.size + '/' + STARS.length);
});

/* 同一颗星，四种化必须两两不同 */
let sameInStar = [];
STARS.forEach((s) => {
  const texts = HUAS.map((h) => SS.get(s, h).text);
  if (new Set(texts).size !== 4) sameInStar.push(s);
});
t('每颗星的四种化互不相同', sameInStar.length === 0,
  sameInStar.length ? sameInStar.join(', ') : '全部 ' + STARS.length + ' 颗');

/* 全局 56 条必须两两不同 —— 这是防止模板化的核心 */
const all = [];
STARS.forEach((s) => HUAS.forEach((h) => all.push(SS.get(s, h).text)));
t('全部 72 条两两不同', new Set(all).size === all.length, new Set(all).size + '/' + all.length);

console.log('\n=== 内容质量 ===\n');

t('每条都有文字', all.every((x) => x && x.length > 0));
t('无「。。」重复标点', !all.some((x) => /。。/.test(x)));
t('无「，，」重复标点', !all.some((x) => /，，/.test(x)));
t('长度合理（12-80 字）',
  all.every((x) => x.length >= 12 && x.length <= 80),
  '范围 ' + Math.min(...all.map((x) => x.length)) + '-' + Math.max(...all.map((x) => x.length)));

/* 每条都应能从该星属性推导 —— derive 字段非空 */
let noDerive = [];
STARS.forEach((s) => {
  const row = SS.TABLE[s];
  if (!row || !row.core || !row.derive) noDerive.push(s);
});
t('每颗星都记录了推导依据（core + derive）', noDerive.length === 0,
  noDerive.length ? noDerive.join(', ') : '14/14');

console.log('\n=== 查表容错 ===\n');

t('未知星名返回 null', SS.get('不存在的星', '忌') === null);
t('未知四化返回 null', SS.get('紫微', 'X') === null);
t('空值不抛错', (() => {
  try { SS.get(null, null); SS.get(undefined, '禄'); return true; }
  catch (e) { return false; }
})());

console.log('\n=== 接入解读后：不能再退回模板 ===\n');

/* 重要说明：
 * 流日四化由「日天干」决定，天干只有 10 个 ——
 * 所以每隔 10 天四化必然重复。**这是历法事实，不是缺陷。**
 * 两天若天干与落宫都相同，本就该读出相似结论。
 *
 * 因此这里检验的不是「每天必须不同」，而是：
 *   1. 旧模板句必须绝迹（这才是用户报的问题）
 *   2. 化忌描述应覆盖多颗星，而不是一句话反复用
 *   3. 整体解读（含落宫与星曜）应比单纯的 10 天干周期更丰富
 */
const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');

const OLD_TPL = [
  '是需要多花心思的地方，容易卡住、放不下',
  '比较有资源和福气，容易有额外收获',
  '会想抓主动权，掌控欲比较强',
  '容易得到认可、名声和贵人帮忙',
];

let tplHits = [];
const dayKeys = [];
const jiCore = [];
for (let i = 1; i <= 20; i++) {
  const d = '2026-11-' + String(i).padStart(2, '0');
  const h = a.horoscope(d, 6);
  const rd = ZW.buildShortReading(a, h, { level: 'day', dateLabel: d });
  rd.hua.forEach((x) => {
    OLD_TPL.forEach((tpl) => {
      if (x.sentence.includes(tpl)) tplHits.push(d + ' ' + x.star + x.hua);
    });
  });
  dayKeys.push(rd.headline + '||' + rd.hua.map((x) => x.sentence).join(''));
  const ji = rd.hua.find((x) => x.hua === '忌');
  if (ji && ji.specText) jiCore.push(ji.specText);
}

t('20 天里没有任何一句退回旧模板', tplHits.length === 0,
  tplHits.length ? tplHits.slice(0, 3).join(', ') : '0 处');
t('整体解读在 20 天内不止 10 种', new Set(dayKeys).size >= 10,
  new Set(dayKeys).size + '/20');
t('化忌描述覆盖多颗星（不是一句话反复用）',
  new Set(jiCore).size >= 8, new Set(jiCore).size + ' 种');

console.log('\n=== 流时同样检查 ===\n');

let hourTpl = [];
const hourKeys = [];
for (let ti = 0; ti <= 12; ti++) {
  const h = a.horoscope('2026-11-15', ti);
  const rd = ZW.buildShortReading(a, h, { level: 'hour', dateLabel: '2026-11-15' });
  hourKeys.push(rd.headline + '||' + rd.hua.map((x) => x.sentence).join(''));
  rd.hua.forEach((x) => {
    OLD_TPL.forEach((tpl) => {
      if (x.sentence.includes(tpl)) hourTpl.push(ti + ' ' + x.star + x.hua);
    });
  });
}
t('13 个时辰没有退回旧模板', hourTpl.length === 0,
  hourTpl.length ? hourTpl.slice(0, 3).join(', ') : '0 处');
t('13 个时辰整体解读不止 10 种',
  new Set(hourKeys).size >= 10, new Set(hourKeys).size + '/13');

console.log('\n=== 与旧模板对比 ===\n');

const OLD = {
  '禄': '比较有资源和福气，容易有额外收获',
  '权': '会想抓主动权，掌控欲比较强',
  '科': '容易得到认可、名声和贵人帮忙',
  '忌': '是需要多花心思的地方，容易卡住、放不下',
};
let stillTemplate = 0;
STARS.forEach((s) => HUAS.forEach((h) => {
  const txt = SS.get(s, h).text;
  if (txt.includes(OLD[h])) stillTemplate++;
}));
t('没有任何一条仍在使用旧模板句', stillTemplate === 0,
  stillTemplate ? stillTemplate + ' 条仍是模板' : '56 条全部替换');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
console.log('\n说明：56 条均由该星已确立的属性推导（见每颗星的 derive 字段），');
console.log('      不是凭空新编；但组合解释属本项目撰写，非古籍原文。');