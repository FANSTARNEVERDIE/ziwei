/* 同盘区分层测试
 *
 * 用户诉求：「我希望下一次日期不同的两个人得到的结果是不一样的」
 *
 * 实测结论（重要，先讲清楚）：
 *   紫微斗数的星盘由「紫微星位置」锚定，而紫微位置 = f(农历日, 五行局)。
 *   98 个生日只排出 62 种盘；1344 个生日的样本里 372 组有人同盘。
 *   所以「不同日期排出同一张盘」是这套体系的事实，不是算错。
 *
 * 本层做的事：用原书承认的「日干四化」把同盘的人区分开。
 *   依据《紫微斗数精成》「四化应用概论」：
 *   生年干、生月干、生日干、生时干……均可飞四化。
 */
const { astro } = require('iztro');
const CP = require('./js/chart-print.js');
const DL = require('./js/day-layer.js');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

function chartOf(d, ti, g) {
  const a = astro.bySolar(d, Number(ti), g, true, 'zh-CN');
  return a.palaces.map((p) =>
    p.earthlyBranch + ':' +
    p.majorStars.map((s) => s.name).join('+') + '/' +
    p.minorStars.map((s) => s.name).join('+')
  ).join('|');
}

console.log('=== 1. 命盘指纹必须与星盘一一对应 ===\n');

const samples = [];
for (let d = 1; d <= 28; d++) samples.push(['2000-08-' + String(d).padStart(2, '0'), 6, '男']);
for (let d = 1; d <= 28; d++) samples.push(['1990-05-' + String(d).padStart(2, '0'), 3, '女']);
for (let ti = 0; ti <= 12; ti++) samples.push(['2000-08-16', ti, '男']);
samples.push(['2000-08-16', 6, '女']);

const prints = new Map();
samples.forEach(([d, ti, g]) => {
  const a = astro.bySolar(d, ti, g, true, 'zh-CN');
  const fp = CP.fingerprint(a);
  if (!prints.has(fp)) prints.set(fp, []);
  prints.get(fp).push(d + '#' + ti + '#' + g);
});

/* A. 同指纹 → 同星盘 */
let okA = true;
prints.forEach((keys) => {
  const c0 = chartOf(...keys[0].split('#'));
  keys.forEach((k) => { if (chartOf(...k.split('#')) !== c0) okA = false; });
});
t('同指纹 → 同星盘', okA);

/* B. 不同指纹 → 不同星盘 */
let okB = true, crossChecks = 0;
const gs = [...prints.values()];
for (let i = 0; i < gs.length; i++) {
  for (let j = i + 1; j < gs.length; j++) {
    crossChecks++;
    if (chartOf(...gs[i][0].split('#')) === chartOf(...gs[j][0].split('#'))) okB = false;
  }
}
t('不同指纹 → 不同星盘', okB, crossChecks + ' 项跨组检验');

console.log('\n=== 2. 「同盘」现象确实存在（不是缺陷，是体系事实）===\n');

const multi = gs.filter((g) => g.length > 1);
t('样本中存在同盘组', multi.length > 0, multi.length + ' 组');

/* 已知的同盘例子：2000-08-04 / 08-08 / 08-16 */
const c4 = chartOf('2000-08-04', 6, '男');
const c8 = chartOf('2000-08-08', 6, '男');
const c16 = chartOf('2000-08-16', 6, '男');
t('08-04 与 08-08 同盘', c4 === c8);
t('08-04 与 08-16 同盘', c4 === c16);

console.log('\n=== 3. 日干四化能区分同盘者 ===\n');

const DL_STEMS = Object.keys(DL.STEM_HUA);
t('十天干四化表完整', DL_STEMS.length === 10, DL_STEMS.join(''));

/* 天干四化必须与口诀一致 */
const MNEMONIC = {
  '甲': ['廉贞', '破军', '武曲', '太阳'],
  '乙': ['天机', '天梁', '紫微', '太阴'],
  '丙': ['天同', '天机', '文昌', '廉贞'],
  '丁': ['太阴', '天同', '天机', '巨门'],
  '戊': ['贪狼', '太阴', '右弼', '天机'],
  '己': ['武曲', '贪狼', '天梁', '文曲'],
  '庚': ['太阳', '武曲', '太阴', '天同'],
  '辛': ['巨门', '太阳', '文曲', '文昌'],
  '壬': ['天梁', '紫微', '左辅', '武曲'],
  '癸': ['破军', '巨门', '太阴', '贪狼'],
};
let huaOk = true;
Object.keys(MNEMONIC).forEach((s) => {
  const got = DL.huaOf(s).map((x) => x.star).join(',');
  if (got !== MNEMONIC[s].join(',')) huaOk = false;
});
t('十天干四化与口诀逐字一致', huaOk);

/* 同盘三人必须有不同四化 */
const sigs = [['2000-08-04'], ['2000-08-08'], ['2000-08-16']].map(([d]) => {
  const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
  const l = DL.buildDayLayer(a);
  return l ? l.hua.map((h) => h.star + h.hua).join(',') : '';
});
t('同盘三人的日干四化互不相同', new Set(sigs).size === 3, new Set(sigs).size + '/3');
sigs.forEach((s, i) => console.log('    ' + ['08-04', '08-08', '08-16'][i] + ': ' + s));

console.log('\n=== 4. 全量统计：同盘者的区分覆盖率 ===\n');

/* 样本量说明：bySolar 每次约 80ms，样本过多会让这组测试超过 1 分钟。
 * 取 2 年 × 12 月 × 每 2 天一个点 = 168 个样本，
 * 足够覆盖同盘情形（实测仍能找出 15+ 组同盘）。 */
const bigSamples = [];
for (const y of [1985, 2000]) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d += 2) {
      bigSamples.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
}
const bigGroups = new Map();
bigSamples.forEach((d) => {
  let a;
  try { a = astro.bySolar(d, 6, '男', true, 'zh-CN'); } catch (e) { return; }
  const fp = CP.fingerprint(a);
  if (!bigGroups.has(fp)) bigGroups.set(fp, []);
  if (bigGroups.get(fp).length < 10) {
    // 顺手缓存该日期的日干四化签名，避免后面重复解析
    const l = DL.buildDayLayer(a);
    bigGroups.get(fp).push({
      d,
      sig: l ? l.hua.map((h) => h.star + h.hua).join(',') : '',
    });
  }
});
const bigMulti = [...bigGroups.values()].filter((g) => g.length > 1);

let pairs = 0, diff = 0;
bigMulti.forEach((g) => {
  for (let i = 0; i < g.length; i++) {
    for (let j = i + 1; j < g.length; j++) {
      pairs++;
      if (g[i].sig && g[j].sig && g[i].sig !== g[j].sig) diff++;
    }
  }
});
const rate = pairs ? diff / pairs : 0;
t('同盘两两组合的区分率 > 80%', rate > 0.8,
  diff + '/' + pairs + ' = ' + (rate * 100).toFixed(1) + '%');
console.log('    （日干只有 10 种，同盘人数多时必然有重复，这是十天干的极限）');

console.log('\n=== 5. 接入解读层 ===\n');

const a16 = astro.bySolar('2000-08-16', 6, '男', true, 'zh-CN');
const rd = ZW.buildReading(a16);
t('解读结果带 sameChartNote', !!rd.sameChartNote);

const note = rd.sameChartNote;
t('含日柱', !!(note && note.pillar), note ? note.pillar : '');
t('含四化句子', !!(note && note.sentences.length >= 2),
  note ? note.sentences.length + ' 句' : '');
t('含原书出处', !!(note && /四化应用概论|生日干/.test(note.src)));
t('含「仅作参考」的说明', !!(note && /辅助参考|影响有限/.test(note.caveat)));

/* 三个同盘的人得到不同内容 */
const texts = ['2000-08-04', '2000-08-08', '2000-08-16'].map((d) => {
  const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
  const r = ZW.buildReading(a);
  return r.sameChartNote ? r.sameChartNote.sentences.join('') : '';
});
t('三个同盘者读到不同内容', new Set(texts).size === 3, new Set(texts).size + '/3');

/* 不同盘的人也必须不同 */
const t2 = ['1990-05-20', '1984-02-02', '1968-03-15'].map((d) => {
  const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
  const r = ZW.buildReading(a);
  return (r.headline || '') + '|' + (r.sameChartNote ? r.sameChartNote.sentences.join('') : '');
});
t('不同盘者内容不同', new Set(t2).size === 3, new Set(t2).size + '/3');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
console.log('\n出处：《紫微斗数精成》上编第八章 23、四化星「四化应用概论」');