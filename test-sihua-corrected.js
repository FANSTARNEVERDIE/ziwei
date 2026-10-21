/* 依原文修正的条目测试
 *
 * 背景：核对《紫微斗数精成》原文后发现，我们原先「由星属性推导」
 * 的 72 条里，有 12 处与原书明确说法不符或不完整。
 * 最典型的是天同化忌——原书视之为「激发」，我们却写成纯负面。
 *
 * 本测试锁死这些修正，防止回退。
 */
const C = require('./js/sihua-corrected.js');
const ZW = require('./js/interpret.js');
const { astro } = require('iztro');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 修正条目完整性 ===\n');

const keys = Object.keys(C.CORRECTED);
t('修正条目数 = 12', keys.length === 12, keys.length + ' 条');

let noSrc = keys.filter((k) => !C.CORRECTED[k].src || C.CORRECTED[k].src.length < 20);
t('每条都带原文出处（src ≥ 20 字）', noSrc.length === 0,
  noSrc.length ? noSrc.join(', ') : '12/12');

let noText = keys.filter((k) => !C.CORRECTED[k].text || C.CORRECTED[k].text.length < 20);
t('每条都有解读文字', noText.length === 0, noText.length ? noText.join(', ') : 'ok');

console.log('\n=== 关键修正：天同化忌（原书视为激发）===\n');

const tt = C.get('天同', '忌');
t('天同化忌有修正条目', !!tt);
t('提到「激发」（原书用词）', tt && /激发/.test(tt.text));
t('提到「意志坚强」或「有冲劲」', tt && /意志坚强|有冲劲/.test(tt.text));
t('不再写成纯负面「心里空」', tt && !/心里空/.test(tt.text));
console.log('    ' + (tt ? tt.text.slice(0, 90) : ''));

console.log('\n=== 其他关键修正 ===\n');

const cases = [
  ['武曲', '权', /不宜经商/, '原书：武曲化权反不宜经商'],
  ['巨门', '权', /最喜化权|能干/, '原书：巨门最喜化权'],
  ['巨门', '忌', /口舌求财/, '原书：巨门化忌可以口舌求财'],
  ['贪狼', '忌', /嗜好/, '原书：贪狼化忌无煞可减少不良嗜好'],
  ['廉贞', '忌', /牢狱|大凶/, '原书：廉贞陷地化忌大凶'],
  ['紫微', '权', /刚性|压力/, '原书：紫微化权增刚性'],
];
cases.forEach(([star, hua, re, desc]) => {
  const c = C.get(star, hua);
  t(desc, !!c && re.test(c.text),
    c ? c.text.slice(0, 50) : '(无条目)');
});

console.log('\n=== 十四主星的原书定性 ===\n');

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

let missingClassic = [];
STARS.forEach((s) => {
  const info = ZW.starInfo(s);
  if (!info || !info.classic || !info.classicSrc) missingClassic.push(s);
});
t('14 主星都有 classic + classicSrc', missingClassic.length === 0,
  missingClassic.length ? missingClassic.join(', ') : '14/14');

/* 抽查几颗星的原书定性关键词是否与原文一致 */
const CLASSIC_CHECK = [
  ['紫微', /官禄主|帝座/],
  ['天机', /化气为善|兄弟主/],
  ['太阳', /司昼贵|光明/],
  ['廉贞', /化气为囚|官禄宫主/],
  ['太阴', /司夜贵|田宅主/],
  ['巨门', /化气为暗|口舌/],
  ['天相', /化气为印|印绶/],
  ['天梁', /化气为荫|父母之主/],
  ['七杀', /化气为权|将星/],
  ['破军', /化气为耗|耗星/],
];
CLASSIC_CHECK.forEach(([star, re]) => {
  const info = ZW.starInfo(star);
  t(star + ' 定性含原书关键词', info && re.test(info.classic),
    info ? info.classic.slice(0, 42) : '');
});

console.log('\n=== 接入解读：实际输出用修正版 ===\n');

const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const rd = ZW.buildReading(a);

t('本命四化带 specText', rd.focus.every((f) => !!f.specText),
  rd.focus.length + ' 条');

/* 找一个命中修正条目的四化。
 * 注意：修正条目涉及的是特定「星×化」组合，
 * 不是每天都会出现，所以要在多个月份里找。 */
let hitCorrected = null;
for (let m = 1; m <= 12 && !hitCorrected; m++) {
  for (let dd = 1; dd <= 28 && !hitCorrected; dd++) {
    const dt = '2026-' + String(m).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
    const h = a.horoscope(dt, 6);
    const short = ZW.buildShortReading(a, h, { level: 'day', dateLabel: dt });
    const c = short.hua.find((x) => x.corrected);
    if (c) hitCorrected = c;
  }
}
t('流日解读中能命中修正条目', !!hitCorrected,
  hitCorrected ? hitCorrected.star + '化' + hitCorrected.hua : '未命中');

if (hitCorrected) {
  t('命中时带原文出处', !!hitCorrected.specSrc);
  console.log('    ' + hitCorrected.sentence.slice(0, 96));
}

console.log('\n=== 修正不应破坏「因盘而异」 ===\n');

/* 说明：流日四化由日天干决定，天干只有 10 个，
 * 所以 20 天里必然出现重复（历法事实，非缺陷）。
 * 这里检验的是「明显多于 10 种」——因为落宫与星曜带来了额外差异。 */
const texts = new Set();
for (let i = 1; i <= 20; i++) {
  const d = '2026-11-' + String(i).padStart(2, '0');
  const h = a.horoscope(d, 6);
  const s = ZW.buildShortReading(a, h, { level: 'day', dateLabel: d });
  texts.add(s.headline + '||' + s.hua.map((x) => x.sentence).join(''));
}
t('20 天整体解读 ≥ 15 种（含落宫差异）', texts.size >= 15, texts.size + '/20');

/* 修正条目本身不应破坏 72 条的多样性 */
const SS = require('./js/sihua-star.js');
const Cc = require('./js/sihua-corrected.js');
const STARS18 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
  '左辅', '右弼', '文昌', '文曲'];
const all = [];
STARS18.forEach((st) => ['禄', '权', '科', '忌'].forEach((h) => {
  const fixed = Cc.get(st, h);
  const derived = SS.get(st, h);
  all.push(fixed ? fixed.text : (derived ? derived.text : ''));
}));
t('合并后 72 条仍两两不同', new Set(all).size === 72, new Set(all).size + '/72');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
console.log('\n出处：《紫微斗数精成》上编 第八章（p97–238）');
console.log('      每条修正均保留原文 src，可逐条核对。');