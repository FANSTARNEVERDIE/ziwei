/* 解读必须「因盘而异」的回归测试
 *
 * 背景：用户反馈「无论怎么换出生日期，某项结果都一样」。
 * 根因：流年/流月的落宫由「流年地支 + 本命命宫位置」决定，
 *       命宫位置相同的人会得到完全相同的句子。
 *       （实测 6 张差异很大的盘中，有 4 张的流月结语一模一样。）
 *
 * 修法：结论必须带上「这一宫在本命盘里实际有什么星」。
 * 本测试锁死这一点，防止以后又被改回通用文案。
 */
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

/* 刻意挑多张「命宫同位置」的盘——这正是原先产生重复文案的情形 */
const SAME_MING = [
  ['2000-8-16', 6, '男'],
  ['1990-5-20', 3, '女'],
  ['1984-2-2', 0, '男'],
  ['1975-11-8', 9, '女'],
];

const ALL = SAME_MING.concat([
  ['2024-2-10', 6, '男'],
  ['1968-3-15', 2, '男'],
  ['2005-12-1', 11, '女'],
  ['1955-7-7', 5, '男'],
]);

function chartsOf(list) {
  return list.map(([d, tm, g]) => ({
    label: d + ' ' + g,
    a: astro.bySolar(d, tm, g, true, 'zh-CN'),
  }));
}

console.log('=== 前提：这些盘确实「流年落宫相同」===\n');

const cs = chartsOf(ALL);
const lnPalaces = cs.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  const idx = h.yearly.palaceNames.findIndex((n) => n === '命宫');
  return c.a.palaces[idx] ? c.a.palaces[idx].name : '?';
});

const dupCount = lnPalaces.length - new Set(lnPalaces).size;
t('样本中确实存在落宫重复的盘', dupCount > 0,
  lnPalaces.join(', ') + '（重复 ' + dupCount + ' 张）');

console.log('\n=== 流年结语必须因盘而异 ===\n');

const yearTexts = cs.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  return ZW.buildYearReading(c.a, h, 2026).headline;
});

const yearUniq = new Set(yearTexts);
t('流年结语全部不同', yearUniq.size === cs.length,
  yearUniq.size + '/' + cs.length + ' 种');

// 关键：落宫相同的盘，结语也必须不同
const sameIdx = {};
lnPalaces.forEach((p, i) => { (sameIdx[p] = sameIdx[p] || []).push(i); });
let samePalaceOk = true;
const samePalaceDetail = [];
Object.keys(sameIdx).forEach((p) => {
  const idxs = sameIdx[p];
  if (idxs.length < 2) return;
  const texts = idxs.map((i) => yearTexts[i]);
  if (new Set(texts).size !== texts.length) {
    samePalaceOk = false;
    samePalaceDetail.push(p + '宫下仍有重复');
  } else {
    samePalaceDetail.push(p + '宫下 ' + idxs.length + ' 张盘各不相同');
  }
});
t('落宫相同的盘，结语仍各不相同', samePalaceOk,
  samePalaceDetail.join('；'));

console.log('\n=== 流月结语必须因盘而异 ===\n');

const monthTexts = cs.map((c) => {
  const h = c.a.horoscope('2026-06-15');
  return ZW.buildMonthReading(c.a, h, 2026, 6).headline;
});

const monthUniq = new Set(monthTexts);
t('流月结语全部不同', monthUniq.size === cs.length,
  monthUniq.size + '/' + cs.length + ' 种');

console.log('\n=== 结语必须引用本命盘的实际星曜 ===\n');

let citesStars = 0;
cs.forEach((c, i) => {
  const h = c.a.horoscope('2026-06-15');
  const yr = ZW.buildYearReading(c.a, h, 2026);
  if (yr.lnPalace && yr.lnStars.length && yr.headline.includes(yr.lnStars[0])) citesStars++;
});
t('流年结语引用了该宫的星名', citesStars === cs.length,
  citesStars + '/' + cs.length);

let monthCites = 0;
cs.forEach((c) => {
  const h = c.a.horoscope('2026-06-15');
  const mo = ZW.buildMonthReading(c.a, h, 2026, 6);
  if (mo.monthStars.length && mo.headline.includes(mo.monthStars[0])) monthCites++;
  else if (!mo.monthStars.length && /没有主星/.test(mo.headline)) monthCites++;
});
t('流月结语引用了该宫的星名（或无主星时明说）', monthCites === cs.length,
  monthCites + '/' + cs.length);

console.log('\n=== 文案质量 ===\n');

const allTexts = yearTexts.concat(monthTexts);
t('没有「。。」重复标点', !allTexts.some((x) => /。。/.test(x)));
t('没有「，，」重复标点', !allTexts.some((x) => /，，/.test(x)));
t('没有「宫宫」', !allTexts.some((x) => /宫宫/.test(x)));
t('每句都以中文句号或问号结尾', allTexts.every((x) => /[。？]$/.test(x)),
  allTexts.filter((x) => !/[。？]$/.test(x)).slice(0, 2).join(' | ') || '全部合规');
t('结语长度合理（80-400 字）',
  allTexts.every((x) => x.length >= 80 && x.length <= 400),
  '范围 ' + Math.min(...allTexts.map((x) => x.length)) + '-' +
  Math.max(...allTexts.map((x) => x.length)));
// 说明：上限放宽到 400，因为流月结语现在会说明
// 「宫位重映射 + 吉星/煞星/桃花星分布」，内容比原来丰富得多。

console.log('\n=== 同一张盘：换年份应给出不同结果 ===\n');

const a1 = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const byYear = [2026, 2027, 2028, 2030].map((y) => {
  const h = a1.horoscope(y + '-06-15');
  return { y, text: ZW.buildYearReading(a1, h, y).headline };
});
const yearDup = new Set(byYear.map((x) => x.text)).size;
t('同一张盘不同年份结果不同', yearDup >= 2,
  byYear.map((x) => x.y + ':' + x.text.slice(0, 14)).join(' | '));

console.log('\n=== 借对宫的情形也必须说明 ===\n');

const borrowed = chartsOf(ALL).filter((c) => ZW.resolveSoulStars(c.a).borrowed);
t('样本中有借对宫的盘', borrowed.length > 0, borrowed.length + ' 张');
borrowed.forEach((c) => {
  const rd = ZW.buildReading(c.a);
  const ok = /借对宫/.test(rd.headline);
  t('  ' + c.label + ' 明说了借对宫', ok);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);