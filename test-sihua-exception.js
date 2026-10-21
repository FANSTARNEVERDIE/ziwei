/* 四化例外表测试 —— 依《紫微斗数精成》原文
 *
 * 这个测试的意义：原书明确「化忌不一定凶」，
 * 并列出了具体的旺地不忌与生年干反吉的例外。
 *
 * 我们起初的 72 条把化忌一律写成负面，实测抽样中约 25% 的化忌
 * 其实命中例外——等于给四分之一的情况下了错判。
 * 本测试锁死例外判断的准确性。
 */
const EX = require('./js/sihua-exception.js');
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 纳音与水命人判断 ===\n');

/* 六十甲子纳音抽查：这些是标准值，可对照任何纳音表 */
const NAYIN_SAMPLES = [
  ['甲子', '海中金', false], ['丙子', '涧下水', true],
  ['壬戌', '大海水', true], ['甲申', '泉中水', true],
  ['戊子', '霹雳火', false], ['丙午', '天河水', true],
  ['庚午', '路旁土', false], ['乙丑', '海中金', false],
  ['壬辰', '长流水', true], ['癸亥', '大海水', true],
];
NAYIN_SAMPLES.forEach(([gz, ny, isWater]) => {
  t(gz + ' 纳音为' + ny, EX.NAYIN[gz] === ny, EX.NAYIN[gz]);
  t(gz + ' 水命判断=' + isWater, EX.isWaterFate(gz) === isWater);
});

t('纳音表覆盖全部 60 甲子', Object.keys(EX.NAYIN).length === 60,
  Object.keys(EX.NAYIN).length + ' 项');
t('纳音表无重复条目', new Set(Object.values(EX.NAYIN)).size === 30,
  new Set(Object.values(EX.NAYIN)).size + ' 种纳音');

console.log('\n=== 旺地化忌不忌（原书例外）===\n');

/* 原书：「金水之星庙旺化忌，更是不忌……如太阴在酉戌亥子化忌」 */
['酉', '戌', '亥', '子'].forEach((b) => {
  t('太阴@' + b + ' 化忌不忌', !!EX.jiNotBad('太阴', b, { yearPillar: '庚子' }));
});
['寅', '卯', '辰'].forEach((b) => {
  t('太阴@' + b + ' 不适用该例外', !EX.jiNotBad('太阴', b, { yearPillar: '庚子' }));
});

/* 原书：「武曲化忌在已宫为长生之地」 */
t('武曲@巳 化忌不忌', !!EX.jiNotBad('武曲', '巳', { yearPillar: '庚子' }));
t('武曲@午 不适用该例外', !EX.jiNotBad('武曲', '午', { yearPillar: '庚子' }));

/* 原书：「木火之星庙旺化忌……如太阳在寅卯辰巳午化忌」 */
['寅', '卯', '辰', '巳', '午'].forEach((b) => {
  t('太阳@' + b + ' 化忌仍有福论', !!EX.jiNotBad('太阳', b, { yearPillar: '庚子' }));
});
['申', '酉', '亥'].forEach((b) => {
  t('太阳@' + b + ' 不适用该例外', !EX.jiNotBad('太阳', b, { yearPillar: '庚子' }));
});

t('天机@卯 化忌仍有福论', !!EX.jiNotBad('天机', '卯', { yearPillar: '庚子' }));

console.log('\n=== 生年干反吉（有条件，不能无条件套用）===\n');

t('天同@戌 + 丁年 → 反吉', !!EX.stemReverse('天同', '戌', '丁', '丁卯'));
t('天同@戌 + 戊年 → 不成立', !EX.stemReverse('天同', '戌', '戊', '戊辰'));
t('巨门@辰 + 辛年 → 反吉', !!EX.stemReverse('巨门', '辰', '辛', '辛巳'));
t('巨门@辰 + 壬年 → 不成立', !EX.stemReverse('巨门', '辰', '壬', '壬午'));

/* 廉贞@亥 的关键：原书要求「水命人」，不能无条件给 */
t('廉贞@亥 + 水命（丙子）→ 反吉',
  !!EX.stemReverse('廉贞', '亥', '丙', '丙子'));
t('廉贞@亥 + 非水命（庚子）→ 不成立（这是修正点）',
  !EX.stemReverse('廉贞', '亥', '庚', '庚子'));
t('廉贞@亥 缺年柱时不轻易判定',
  !EX.stemReverse('廉贞', '亥', '丙', undefined));

console.log('\n=== 未列出的情况不给例外（防止过度套用）===\n');

t('紫微@子 化忌无例外', !EX.jiNotBad('紫微', '子', { yearPillar: '庚子' }));
t('巨门@寅 化忌无例外', !EX.jiNotBad('巨门', '寅', { yearPillar: '庚子' }));
t('未知星名返回 null', EX.jiNotBad('不存在的星', '子', {}) === null);
t('空宫支返回 null', EX.jiNotBad('太阴', null, {}) === null);

console.log('\n=== 接入解读：例外应体现在实际输出 ===\n');

/* 找一张真实的、命中太阴旺地化忌的盘 */
let found = null;
for (let y = 1950; y <= 2020 && !found; y++) {
  for (let m = 1; m <= 12 && !found; m += 5) {
    const a = astro.bySolar(y + '-' + m + '-15', 6, '男', true, 'zh-CN');
    const h = a.horoscope('2026-10-19', 6);
    const rd = ZW.buildShortReading(a, h, { level: 'day', dateLabel: '2026-10-19' });
    const hit = rd.hua.find((x) => x.exception);
    if (hit) found = { birth: y + '-' + m + '-15', hit };
  }
}

t('实际排盘中能命中例外', !!found,
  found ? found.birth + ' → ' + found.hit.star + '化忌' : '未找到样本');

if (found) {
  const e = found.hit;
  t('例外文案非空', !!e.exception);
  t('例外带原文出处', !!e.exceptionSrc);
  t('句子中标注了【例外】', /【例外】/.test(e.sentence));
  console.log('     ' + e.sentence.slice(0, 100));
  console.log('     出处: ' + e.exceptionSrc.slice(0, 70));
}

console.log('\n=== 例外在真实命盘中的出现频率 ===\n');

let total = 0, hits = 0;
for (let y = 1950; y <= 2010; y += 2) {
  const a = astro.bySolar(y + '-6-15', 6, '男', true, 'zh-CN');
  a.palaces.forEach((p) => {
    [...p.majorStars, ...p.minorStars].forEach((s) => {
      if (s.mutagen !== '忌') return;
      total++;
      const yp = a.chineseDate.split(' ')[0];
      if (EX.jiNotBad(s.name, p.earthlyBranch, { yearPillar: yp }) ||
        EX.stemReverse(s.name, p.earthlyBranch, yp[0], yp)) hits++;
    });
  });
}
const rate = total ? hits / total : 0;
t('例外在抽样中确实常见（>10%）', rate > 0.1,
  hits + '/' + total + ' = ' + (rate * 100).toFixed(1) + '%');
console.log('     → 若不做这个判断，这部分命盘的化忌会被误判为纯负面');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
console.log('\n出处：《紫微斗数精成》上编 第八章 23、四化星（p239–246）');
console.log('      每条例外均保留原文 src 字段，可逐条核对。');