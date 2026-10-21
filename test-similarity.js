/* 测量「运势相似度」——用户的实际抱怨
 *
 * 前面几轮都在测「文案是否完全相同」，但用户说的是「相似」。
 * 所以这里用文本相似度（最长公共子串比例）来量化：
 *   相似度 = 两个结论的最长公共子串长度 / 较短者长度
 * 值越高说明两段话越像。
 *
 * 分别测两个维度：
 *   A. 同一张盘、不同月份  —— 用户切换流月时的感受
 *   B. 不同出生日期、同一时间段 —— 用户换生日时的感受
 */
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

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

function similarity(a, b) {
  if (!a || !b) return 0;
  const shorter = Math.min(a.length, b.length);
  return shorter ? lcsLen(a, b) / shorter : 0;
}

/* 求一组文本两两相似度的平均值与最大值 */
function pairwise(texts) {
  let sum = 0, max = 0, count = 0, maxPair = null;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const s = similarity(texts[i], texts[j]);
      sum += s; count++;
      if (s > max) { max = s; maxPair = [i, j]; }
    }
  }
  return { avg: count ? sum / count : 0, max, maxPair };
}

let fail = 0;
const THRESHOLD_AVG = 0.55;   // 平均相似度上限
const THRESHOLD_MAX = 0.85;   // 任意两句的相似度上限

console.log('=== A. 同一张盘，12 个月的流月结论 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const texts = [];
  for (let m = 1; m <= 12; m++) {
    const h = a.horoscope('2026-' + m + '-15');
    const mo = ZW.buildMonthReading(a, h, 2026, m);
    texts.push(mo.headline);
  }
  const st = pairwise(texts);
  console.log('  两两组合数: ' + (12 * 11 / 2));
  console.log('  平均相似度: ' + (st.avg * 100).toFixed(1) + '%  (上限 ' + (THRESHOLD_AVG * 100) + '%)');
  console.log('  最高相似度: ' + (st.max * 100).toFixed(1) + '%  (上限 ' + (THRESHOLD_MAX * 100) + '%)');
  if (st.maxPair) {
    const [i, j] = st.maxPair;
    console.log('  最相似的一对: ' + (i + 1) + '月 vs ' + (j + 1) + '月');
    console.log('    ' + texts[i].slice(0, 60));
    console.log('    ' + texts[j].slice(0, 60));
  }
  if (st.avg > THRESHOLD_AVG) { console.log('  ✗ 平均相似度过高'); fail++; }
  else if (st.max > THRESHOLD_MAX) { console.log('  ✗ 存在过于相似的一对'); fail++; }
  else console.log('  ✓ 通过');
}

console.log('\n=== B. 不同出生日期，同一个月 ===\n');
{
  const births = [
    ['2000-8-16', 6, '男'], ['1990-5-20', 3, '女'], ['1984-2-2', 0, '男'],
    ['2024-2-10', 6, '男'], ['1975-11-8', 9, '女'], ['1968-3-15', 2, '男'],
    ['1955-7-7', 5, '男'], ['2005-12-1', 11, '女'],
  ];
  const texts = births.map(([d, t, g]) => {
    const a = astro.bySolar(d, t, g, true, 'zh-CN');
    const h = a.horoscope('2026-06-15');
    return ZW.buildMonthReading(a, h, 2026, 6).headline;
  });
  const st = pairwise(texts);
  console.log('  样本数: ' + births.length + '，两两组合: ' + (births.length * (births.length - 1) / 2));
  console.log('  平均相似度: ' + (st.avg * 100).toFixed(1) + '%');
  console.log('  最高相似度: ' + (st.max * 100).toFixed(1) + '%');
  if (st.maxPair) {
    const [i, j] = st.maxPair;
    console.log('  最相似的一对: ' + births[i][0] + ' vs ' + births[j][0]);
  }
  if (st.avg > THRESHOLD_AVG) { console.log('  ✗ 平均相似度过高'); fail++; }
  else console.log('  ✓ 通过');
}

console.log('\n=== C. 同一张盘，不同年份的流年结论 ===\n');
{
  const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
  const texts = [];
  for (let y = 2024; y <= 2035; y++) {
    const h = a.horoscope(y + '-06-15');
    texts.push(ZW.buildYearReading(a, h, y).headline);
  }
  const st = pairwise(texts);
  console.log('  12 个年份，两两组合: 66');
  console.log('  平均相似度: ' + (st.avg * 100).toFixed(1) + '%');
  console.log('  最高相似度: ' + (st.max * 100).toFixed(1) + '%');
  if (st.maxPair) {
    const [i, j] = st.maxPair;
    console.log('  最相似的一对: ' + (2024 + i) + ' vs ' + (2024 + j));
  }
  if (st.avg > THRESHOLD_AVG) { console.log('  ✗ 平均相似度过高'); fail++; }
  else console.log('  ✓ 通过');
}

console.log('\n=== D. 不同出生日期，同一年的流年结论 ===\n');
{
  const births = [
    ['2000-8-16', 6, '男'], ['1990-5-20', 3, '女'], ['1984-2-2', 0, '男'],
    ['2024-2-10', 6, '男'], ['1975-11-8', 9, '女'], ['1968-3-15', 2, '男'],
  ];
  const texts = births.map(([d, t, g]) => {
    const a = astro.bySolar(d, t, g, true, 'zh-CN');
    const h = a.horoscope('2026-06-15');
    return ZW.buildYearReading(a, h, 2026).headline;
  });
  const st = pairwise(texts);
  console.log('  平均相似度: ' + (st.avg * 100).toFixed(1) + '%');
  console.log('  最高相似度: ' + (st.max * 100).toFixed(1) + '%');
  if (st.avg > THRESHOLD_AVG) { console.log('  ✗ 平均相似度过高'); fail++; }
  else console.log('  ✓ 通过');
}

console.log('\n' + '='.repeat(60));
console.log(fail === 0 ? '结论: 相似度在可接受范围内 ✓' : '结论: ' + fail + ' 项超标 ✗');
console.log('='.repeat(60));
console.log('\n说明：不可能做到 0% 相似——同一套紫微斗数体系，');
console.log('术语与句式本就共用。这里约束的是「不要高到读起来像同一段话」。');
process.exit(fail ? 1 : 0);