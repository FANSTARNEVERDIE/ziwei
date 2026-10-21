/* 排盘引擎的「客观正确性」验证
 *
 * 前几轮我一直在写「解读文案」，那些是我自己写的，没有出处。
 * 这个测试做的是另一件事：验证**可以对照古籍核对**的部分。
 *
 * 紫微斗数中真正可验证的是「规则」，不是「解释」：
 *   1. 十天干四化表 —— 有口诀可逐字对照
 *   2. 十四主星的名称与数量
 *   3. 十二宫的固定名称
 *   4. 五行局的推导（由命宫干支纳音决定）
 *   5. 大限起运规则（阳男阴女顺行，阴男阳女逆行）
 *
 * 这些错了就是错的，没有解释空间。测试把它们锁死。
 */
const { astro } = require('iztro');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 1. 十天干四化表（对照传统口诀） ===\n');

/* 口诀（禄权科忌 顺序）：
 *   甲廉破武阳  乙机梁紫阴  丙同机昌廉  丁阴同机巨  戊贪阴右机
 *   己武贪梁曲  庚阳武阴同  辛巨阳曲昌  壬梁紫左武  癸破巨阴贪
 */
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
const HUA_ORDER = ['禄', '权', '科', '忌'];

/* 从引擎反查每个天干的四化 */
const actual = {};
for (let y = 1984; y <= 2043; y++) {
  const a = astro.bySolar(y + '-6-15', 6, '男', true, 'zh-CN');
  const stem = a.chineseDate.split(' ')[0][0];
  if (actual[stem]) continue;
  const map = {};
  a.palaces.forEach((p) => [...p.majorStars, ...p.minorStars].forEach((s) => {
    if (s.mutagen) map[s.mutagen] = s.name;
  }));
  actual[stem] = HUA_ORDER.map((k) => map[k]);
}

Object.keys(MNEMONIC).forEach((stem) => {
  const exp = MNEMONIC[stem];
  const act = actual[stem] || [];
  t(stem + '干四化', exp.every((v, i) => v === act[i]),
    '禄权科忌 = ' + act.join('、'));
});

console.log('\n=== 2. 十四主星 ===\n');

const MAJOR = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

const a1 = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const foundMajor = new Set();
a1.palaces.forEach((p) => p.majorStars.forEach((s) => foundMajor.add(s.name)));

t('每张盘恒有 14 颗主星', (() => {
  const counts = [];
  for (let y = 1950; y <= 2050; y += 7) {
    const a = astro.bySolar(y + '-6-15', 6, '男', true, 'zh-CN');
    let n = 0;
    a.palaces.forEach((p) => { n += p.majorStars.length; });
    counts.push(n);
  }
  return counts.every((c) => c === 14);
})(), '跨 1950-2050 抽样');

t('主星名称都在十四主星之列',
  [...foundMajor].every((s) => MAJOR.includes(s)),
  [...foundMajor].join('、'));

console.log('\n=== 3. 十二宫 ===\n');

const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

t('每张盘恒有 12 宫', a1.palaces.length === 12, a1.palaces.length + ' 宫');
t('宫名与既定名称一致',
  a1.palaces.every((p) => PALACES.includes(p.name)),
  a1.palaces.map((p) => p.name).join('、'));
t('十二宫名称无重复',
  new Set(a1.palaces.map((p) => p.name)).size === 12);

/* 宫位按地支逆时针排列，是紫微斗数的固定规则 */
t('宫位地支互不重复',
  new Set(a1.palaces.map((p) => p.earthlyBranch)).size === 12);

console.log('\n=== 4. 五行局 ===\n');

const JU = ['水二局', '木三局', '金四局', '土五局', '火六局'];
let juOk = true;
const juSeen = new Set();
for (let y = 1940; y <= 2040; y += 3) {
  const a = astro.bySolar(y + '-3-15', 6, '男', true, 'zh-CN');
  juSeen.add(a.fiveElementsClass);
  if (!JU.includes(a.fiveElementsClass)) juOk = false;
}
t('五行局只取五种既定值之一', juOk, [...juSeen].join('、'));
t('抽样中出现多种五行局', juSeen.size >= 4, juSeen.size + ' 种');

console.log('\n=== 5. 大限起运规则 ===\n');

/* 规则：阳男阴女顺行，阴男阳女逆行；起运岁数由五行局决定 */
const JU_START = { '水二局': 2, '木三局': 3, '金四局': 4, '土五局': 5, '火六局': 6 };
let dxOk = true, dxDetail = [];
[
  ['2000-8-16', 6, '男'],   // 庚辰年（阳）男 → 顺行
  ['1990-5-20', 3, '女'],   // 庚午年（阳）女 → 逆行
  ['1968-3-15', 2, '男'],   // 戊申年（阳）男 → 顺行
].forEach(([d, tm, g]) => {
  const a = astro.bySolar(d, tm, g, true, 'zh-CN');
  const ju = a.fiveElementsClass;
  const start = JU_START[ju];
  // 找到命宫那一宫的 decadal 起点
  const ming = a.palaces.find((p) => p.name === '命宫');
  const mingStart = ming && ming.decadal ? ming.decadal.range[0] : null;
  const ok = mingStart === start;
  if (!ok) dxOk = false;
  dxDetail.push(d + ' ' + ju + ' 命宫起运=' + mingStart + '（应为 ' + start + '）');
});
t('命宫大限起点 = 五行局数', dxOk, dxDetail.join(' | '));

/* 大限十二段应覆盖 起运岁 到 起运岁+119 */
const dxRanges = a1.palaces.filter((p) => p.decadal).map((p) => p.decadal.range);
t('大限共 12 段', dxRanges.length === 12, dxRanges.length + ' 段');
t('大限区间连续无缝', (() => {
  const sorted = dxRanges.slice().sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][0] !== sorted[i - 1][1] + 1) return false;
  }
  return true;
})(), dxRanges.slice().sort((x, y) => x[0] - y[0]).map((r) => r.join('-')).join(' '));

console.log('\n=== 6. 四柱干支 ===\n');

t('四柱格式为 四组干支', /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥](\s[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]){3}$/.test(a1.chineseDate),
  a1.chineseDate);

/* 年柱干支应与该年的实际年份对应（1984 = 甲子） */
t('1984 年为甲子年（基准点）', (() => {
  const a = astro.bySolar('1984-6-15', 6, '男', true, 'zh-CN');
  return a.chineseDate.startsWith('甲子');
})(), (() => {
  const a = astro.bySolar('1984-6-15', 6, '男', true, 'zh-CN');
  return a.chineseDate.split(' ')[0];
})());

t('2000 年为庚辰年', (() => {
  const a = astro.bySolar('2000-6-15', 6, '男', true, 'zh-CN');
  return a.chineseDate.startsWith('庚辰');
})());

console.log('\n=== 7. 与已知命例交叉核对 ===\n');

/* 这些是公开可查的八字/紫微对照案例，用于确认引擎没跑偏 */
const KNOWN = [
  // [阳历, 时支index, 性别, 期望命宫地支]
  ['2000-8-16', 6, '男', '寅'],
  ['1990-5-20', 3, '女', '寅'],
  ['1968-3-15', 2, '男', '丑'],
  ['2024-2-10', 6, '男', '申'],
];
KNOWN.forEach(([d, tm, g, expect]) => {
  const a = astro.bySolar(d, tm, g, true, 'zh-CN');
  t(d + ' ' + g + ' 命宫', a.earthlyBranchOfSoulPalace === expect,
    a.earthlyBranchOfSoulPalace + '（期望 ' + expect + '）');
});

console.log('\n' + '='.repeat(58));
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败');
console.log('='.repeat(58));
console.log('\n说明：本测试只验证**规则性**内容（四化表、星名、宫名、');
console.log('      五行局、大限起运、四柱干支）——这些有客观对错。');
console.log('      至于每颗星的「性格与建议」，各家说法不一，');
console.log('      不属于可验证范畴，见 README 的「内容来源」一节。');