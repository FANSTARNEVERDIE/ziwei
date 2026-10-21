/* 验证「命盘指纹」是否与真实星盘一一对应
 *
 * 这件事必须严格验证，因为指纹的用途是告诉用户
 * 「你的盘和别人相同」——判断错了就是误导。
 *
 * 检验两个方向：
 *   A. 指纹相同 → 星盘必须相同
 *   B. 指纹不同 → 星盘必须不同
 */
const { astro } = require('iztro');
const CP = require('../js/chart-print.js');

/* 取整张盘的完整星曜配置作为「真值」 */
function chartOf(d, t, g) {
  const a = astro.bySolar(d, Number(t), g, true, 'zh-CN');
  return a.palaces.map((p) =>
    p.name + ':' +
    p.majorStars.map((s) => s.name).join('+') + '/' +
    p.minorStars.map((s) => s.name).join('+')
  ).join('|');
}

/* 构造样本：覆盖不同年、月、时辰、性别 */
const samples = [];
for (let d = 1; d <= 28; d++) samples.push(['2000-08-' + String(d).padStart(2, '0'), 6, '男']);
for (let d = 1; d <= 28; d++) samples.push(['1990-05-' + String(d).padStart(2, '0'), 3, '女']);
for (let d = 1; d <= 28; d++) samples.push(['1985-11-' + String(d).padStart(2, '0'), 9, '男']);
/* 同一天不同时辰 */
for (let t = 0; t <= 12; t++) samples.push(['2000-08-16', t, '男']);
/* 同年同月同日不同性别 */
samples.push(['2000-08-16', 6, '女']);

console.log('样本数: ' + samples.length);

const prints = new Map();
samples.forEach(([d, t, g]) => {
  const key = d + '#' + t + '#' + g;
  const a = astro.bySolar(d, t, g, true, 'zh-CN');
  const fp = CP.fingerprint(a);
  if (!prints.has(fp)) prints.set(fp, []);
  prints.get(fp).push(key);
});

console.log('指纹数: ' + prints.size);
console.log('');

/* 预计算每人的星盘，避免重复调用 */
const chartCache = {};
samples.forEach(([d, t, g]) => {
  chartCache[d + '#' + t + '#' + g] = chartOf(d, t, g);
});

let okA = true, okB = true, checks = 0;

/* A. 同指纹 → 同星盘 */
const groups = [...prints.entries()];
groups.forEach(([fp, keys]) => {
  const c0 = chartCache[keys[0]];
  keys.forEach((k) => {
    checks++;
    if (chartCache[k] !== c0) {
      okA = false;
      console.log('  ✗ 同指纹但星盘不同: ' + k + ' (fp=' + fp + ')');
    }
  });
});

/* B. 不同指纹 → 不同星盘 */
for (let i = 0; i < groups.length; i++) {
  for (let j = i + 1; j < groups.length; j++) {
    checks++;
    const c1 = chartCache[groups[i][1][0]];
    const c2 = chartCache[groups[j][1][0]];
    if (c1 === c2) {
      okB = false;
      console.log('  ✗ 不同指纹但星盘相同: ' + groups[i][1][0] + ' vs ' + groups[j][1][0]);
    }
  }
}

console.log('A. 同指纹 → 同星盘:  ' + (okA ? '✓' : '✗'));
console.log('B. 不同指纹 → 不同星盘: ' + (okB ? '✓' : '✗'));
console.log('共 ' + checks + ' 项检验');
console.log('');

const dups = groups.filter(([fp, g]) => g.length > 1);
console.log('真实同盘组（' + dups.length + ' 组）:');
dups.forEach(([fp, g]) => {
  console.log('  [' + fp + ']');
  console.log('    ' + g.join(', '));
});

/* 同盘的人，日柱是否不同——这是区分层的前提 */
console.log('');
console.log('=== 同盘者的日柱差异（区分层的前提）===');
const DL = require('../js/day-layer.js');
dups.slice(0, 3).forEach(([fp, g]) => {
  console.log('  [' + fp + ']');
  g.forEach((k) => {
    const [d, t, gg] = k.split('#');
    const a = astro.bySolar(d, Number(t), gg, true, 'zh-CN');
    const dp = DL.dayPillar(a.chineseDate);
    console.log('    ' + d + ' ' + gg + ' → 日柱 ' + dp.pillar);
  });
});

console.log('');
console.log(okA && okB ? '结论: 指纹与星盘完全对应，可用于「是否同盘」判断' : '结论: 指纹不可靠，需修正');

process.exit(okA && okB ? 0 : 1);