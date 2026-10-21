/* 测量：不同出生日期的人，结果到底有多少不同
 *
 * 用户诉求：「我希望下一次日期不同的两个人得到的结果是不一样的」
 *
 * 这个脚本量化两两之间的差异度：
 *   1. 命盘层（客观）：星曜配置相同的比例
 *   2. 解读层（文本）：解读文字的相似度
 *
 * 用真实的出生日期分布抽样，而不是只挑几个极端例子。
 */
const { astro } = require('iztro');
const ZW = require('../js/interpret.js');

/* 最长公共子串长度 */
function lcsLen(a, b) {
  if (!a || !b) return 0;
  const m = a.length, n = b.length;
  let prev = new Int32Array(n + 1), cur = new Int32Array(n + 1);
  let best = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : 0;
      if (cur[j] > best) best = cur[j];
    }
    const t = prev; prev = cur; cur = t;
    cur.fill(0);
  }
  return best;
}
function sim(a, b) {
  if (!a || !b) return 0;
  const s = Math.min(a.length, b.length);
  return s ? lcsLen(a, b) / s : 0;
}

/* 生成一批「相邻但不同」的出生日期——这是最容易撞车的情形 */
const cases = [];
for (let d = 1; d <= 28; d++) {
  cases.push([`2000-08-${String(d).padStart(2, '0')}`, 6, '男']);
}
for (let m = 1; m <= 12; m++) {
  cases.push([`2000-${String(m).padStart(2, '0')}-15`, 6, '男']);
}

console.log('抽样 ' + cases.length + ' 个出生日期（同一年，男女同、时辰同）\n');

const rows = [];
cases.forEach(([d, t, g]) => {
  let a;
  try { a = astro.bySolar(d, t, g, true, 'zh-CN'); } catch (e) { return; }
  const rd = ZW.buildReading(a);
  const h = a.horoscope('2026-06-15');
  const yr = ZW.buildYearReading(a, h, 2026);

  rows.push({
    birth: d,
    soulPalace: a.earthlyBranchOfSoulPalace,           // 命宫地支
    soulStars: ZW.resolveSoulStars(a).stars.join('、'), // 命宫主星
    fiveJu: a.fiveElementsClass,                        // 五行局
    // 整张盘的指纹：十二宫的宫名+主星
    chartPrint: a.palaces.map((p) =>
      p.name + ':' + p.majorStars.map((s) => s.name).join('+')).join('|'),
    // 解读文本
    headline: rd.headline,
    palaceFull: (rd.palaceReadings || []).map((p) =>
      p.label + ':' + (p.major.join('+') || '无') + '/' + p.good).join(' ; '),
    yearText: yr.headline,
  });
});

console.log('=== 1. 命盘层：配置是否相同 ===\n');

const prints = new Map();
rows.forEach((r) => {
  if (!prints.has(r.chartPrint)) prints.set(r.chartPrint, []);
  prints.get(r.chartPrint).push(r.birth);
});
console.log('  ' + rows.length + ' 个生日 → ' + prints.size + ' 种命盘配置');
console.log('  （' + (prints.size / rows.length * 100).toFixed(0) + '% 唯一）');

let dupGroups = [...prints.values()].filter((g) => g.length > 1);
if (dupGroups.length) {
  console.log('  命盘相同的组:');
  dupGroups.forEach((g) => console.log('    ' + g.join(', ')));
} else {
  console.log('  ✓ 没有两个生日排出完全相同的盘');
}

console.log('\n=== 2. 关键字段的分布 ===\n');

['soulPalace', 'soulStars', 'fiveJu'].forEach((k) => {
  const s = new Set(rows.map((r) => r[k]));
  console.log('  ' + k.padEnd(12) + s.size + '/' + rows.length +
    '  (' + (s.size / rows.length * 100).toFixed(0) + '%)');
});

console.log('\n=== 3. 解读层：两两相似度 ===\n');

function pairwise(texts) {
  let sum = 0, max = 0, count = 0, worst = null;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const s = sim(texts[i], texts[j]);
      sum += s; count++;
      if (s > max) { max = s; worst = [i, j]; }
    }
  }
  return { avg: sum / count, max, worst };
}

[
  ['一句话', 'headline'],
  ['十二宫解读', 'palaceFull'],
  ['流年结语', 'yearText'],
].forEach(([label, key]) => {
  const texts = rows.map((r) => r[key]).filter(Boolean);
  const st = pairwise(texts);
  console.log('  ' + label.padEnd(12) +
    '平均 ' + (st.avg * 100).toFixed(1) + '%  ' +
    '最高 ' + (st.max * 100).toFixed(1) + '%');
  if (st.worst) {
    console.log('      最相似: ' + rows[st.worst[0]].birth + ' vs ' + rows[st.worst[1]].birth);
  }
});

console.log('\n=== 4. 完全相同的解读 ===\n');

[
  ['一句话', 'headline'],
  ['十二宫解读', 'palaceFull'],
  ['流年结语', 'yearText'],
].forEach(([label, key]) => {
  const m = new Map();
  rows.forEach((r) => {
    const v = r[key];
    if (!v) return;
    if (!m.has(v)) m.set(v, []);
    m.get(v).push(r.birth);
  });
  const dups = [...m.values()].filter((g) => g.length > 1);
  const dupCount = dups.reduce((a, g) => a + g.length - 1, 0);
  console.log('  ' + label.padEnd(12) + m.size + ' 种 / ' + rows.length +
    '  → 重复 ' + dupCount + ' 例');
  dups.slice(0, 3).forEach((g) => console.log('      ' + g.join(', ')));
});