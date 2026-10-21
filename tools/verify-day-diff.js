/* 验证：日干四化在「同盘组」内是否真的能区分
 *
 * 这是区分层的核心前提。若同盘的人日干四化也相同，
 * 那这个方案就没用。
 */
const { astro } = require('iztro');
const CP = require('../js/chart-print.js');
const DL = require('../js/day-layer.js');

/* 构造大量样本，按指纹分组 */
const samples = [];
for (let y of [1985, 1990, 2000, 2010]) {
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 28; d += 1) {
      samples.push([`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, 6, '男']);
    }
  }
}

const groups = new Map();
samples.forEach(([d, t, g]) => {
  let a;
  try { a = astro.bySolar(d, t, g, true, 'zh-CN'); } catch (e) { return; }
  const fp = CP.fingerprint(a);
  if (!groups.has(fp)) groups.set(fp, []);
  if (groups.get(fp).length < 8) groups.get(fp).push(d);
});

const multi = [...groups.values()].filter((g) => g.length > 1);
console.log('样本 ' + samples.length + ' 个生日');
console.log('指纹组 ' + groups.size + ' 个，其中多人同盘 ' + multi.length + ' 组');
console.log('');

let totalPairs = 0, diffPairs = 0, samePairs = 0;
let noHua = 0;

console.log('=== 同盘组内，日干四化是否不同 ===\n');

multi.slice(0, 8).forEach((g) => {
  const infos = g.map((d) => {
    const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
    const layer = DL.buildDayLayer(a);
    return {
      d,
      pillar: layer ? layer.pillar : '?',
      stem: layer ? layer.stem : '?',
      sig: layer ? layer.hua.map((h) => h.star + h.hua).join(',') : '',
    };
  });

  const sigs = new Set(infos.map((x) => x.sig));
  console.log('  组: ' + g.join(', '));
  infos.forEach((x) => {
    console.log('    ' + x.d + '  日柱 ' + x.pillar + '  → ' + x.sig);
  });
  console.log('    不同四化: ' + sigs.size + '/' + infos.length);
  console.log('');

  /* 两两比较 */
  for (let i = 0; i < infos.length; i++) {
    for (let j = i + 1; j < infos.length; j++) {
      totalPairs++;
      if (!infos[i].sig || !infos[j].sig) { noHua++; continue; }
      if (infos[i].sig !== infos[j].sig) diffPairs++;
      else samePairs++;
    }
  }
});

console.log('=== 统计（全部同盘组）===');
console.log('  两两组合: ' + totalPairs);
console.log('  四化不同: ' + diffPairs + '  (' + (diffPairs / totalPairs * 100).toFixed(1) + '%)');
console.log('  四化相同: ' + samePairs + '  (' + (samePairs / totalPairs * 100).toFixed(1) + '%)');
console.log('  无法计算: ' + noHua);
console.log('');
console.log('说明：日干只有 10 种，所以同盘人数一多就必然出现');
console.log('      日干相同的情况——这不是缺陷，是十天干的极限。');
console.log('      关键是：绝大多数同盘者的日干不同，可用于区分。');
console.log('');

/* 统计每组内「日干种类数 / 人数」 */
let ratios = [];
multi.forEach((g) => {
  const stems = new Set(g.map((d) => {
    const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
    const dl = DL.dayPillar(a.chineseDate);
    return dl ? dl.stem : '';
  }));
  ratios.push(stems.size / g.length);
});
const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
console.log('  组内「日干种类 / 人数」平均: ' + (avgRatio * 100).toFixed(0) + '%');
console.log('  （100% 表示组内每人日干都不同）');
console.log('');

/* 全量统计（不只前 8 组） */
let allPairs = 0, allDiff = 0;
multi.forEach((g) => {
  const sigs = g.map((d) => {
    const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
    const layer = DL.buildDayLayer(a);
    return layer ? layer.hua.map((h) => h.star + h.hua).join(',') : '';
  });
  for (let i = 0; i < sigs.length; i++) {
    for (let j = i + 1; j < sigs.length; j++) {
      allPairs++;
      if (sigs[i] && sigs[j] && sigs[i] !== sigs[j]) allDiff++;
    }
  }
});
console.log('=== 全量（' + multi.length + ' 组）===');
console.log('  两两组合: ' + allPairs);
console.log('  四化不同: ' + allDiff + '  (' + (allDiff / allPairs * 100).toFixed(1) + '%)');

/* 同一天干当然四化相同——这是天经地义的，
 * 关键是：同盘的人是否大多日干不同 */
const stems = {};
multi.forEach((g) => {
  g.forEach((d) => {
    const a = astro.bySolar(d, 6, '男', true, 'zh-CN');
    const dl = DL.dayPillar(a.chineseDate);
    if (!dl) return;
    stems[dl.stem] = (stems[dl.stem] || 0) + 1;
  });
});
console.log('=== 同盘者的日干分布 ===');
Object.keys(stems).sort().forEach((s) => {
  console.log('  ' + s + '干: ' + stems[s] + ' 人');
});
console.log('  涉及 ' + Object.keys(stems).length + ' 种日干（共 10 种）');