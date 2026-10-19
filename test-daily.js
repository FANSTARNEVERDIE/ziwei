/* 流日 / 流时解读测试 */
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');

console.log('=== 流日 ===\n');
const h = a.horoscope('2026-06-15');
const day = ZW.buildShortReading(a, h, { level: 'day', dateLabel: '2026-06-15' });
t('生成成功', !!day);
t('level 正确', day.level === 'day');
t('含干支', /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(day.ganZhi), day.ganZhi);
t('含落宫', !!day.palaceName, day.palaceName + '宫');
t('结论非空', day.headline.length > 5, day.headline);
t('四化 4 条', day.hua.length === 4, day.hua.map(x => x.hua).join(''));
t('化忌排最前', day.hua[0].hua === '忌', day.hua[0].hua);
day.hua.forEach(x => console.log('    ' + x.sentence));

console.log('\n=== 流时 ===\n');
const hour = ZW.buildShortReading(a, a.horoscope('2026-06-15', 6), {
  level: 'hour', dateLabel: '2026-06-15', hourLabel: ' 午时',
});
t('生成成功', !!hour);
t('level 正确', hour.level === 'hour');
t('含落宫', !!hour.palaceName, hour.palaceName + '宫');
t('措辞用「此时」', hour.hua.length === 0 || hour.hua[0].sentence.startsWith('此时'), (hour.hua[0] || {}).sentence);
t('四化 4 条', hour.hua.length === 4);

console.log('\n=== 不同日期应产生不同结果 ===\n');
const days = ['2026-06-15', '2026-06-16', '2026-06-17'].map((d) => {
  const r = ZW.buildShortReading(a, a.horoscope(d), { level: 'day', dateLabel: d });
  console.log('  ' + d + ' -> ' + r.palaceName + '宫 / ' + r.ganZhi + ' / ' + r.short);
  return r;
});
const uniq = new Set(days.map(d => d.palaceName + d.ganZhi));
t('连续三天结果不同', uniq.size >= 2, uniq.size + ' 种');

console.log('\n=== 不同时辰应产生不同结果 ===\n');
const hours = [0, 6, 12].map((tm) => {
  const r = ZW.buildShortReading(a, a.horoscope('2026-06-15', tm), { level: 'hour', dateLabel: '2026-06-15' });
  console.log('  timeIndex=' + tm + ' -> ' + r.palaceName + '宫 / ' + r.ganZhi);
  return r;
});
t('不同时辰落宫不同', new Set(hours.map(x => x.palaceName)).size >= 2,
  hours.map(x => x.palaceName).join(','));

console.log('\n=== 边界 ===\n');
t('无 daily 时返回 null', ZW.buildShortReading(a, {}, { level: 'day' }) === null);
t('horoscope 为 null 时返回 null', ZW.buildShortReading(a, null, { level: 'day' }) === null);
t('缺少 opts 也能工作', (() => {
  const r = ZW.buildShortReading(a, h);
  return r && r.level === 'day' && r.hua.length === 4;
})());
t('宫名无「宫宫」', !/宫宫/.test(day.hua.map(x => x.sentence).join('')),
  day.hua[0] ? day.hua[0].sentence.slice(0, 30) : '');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);