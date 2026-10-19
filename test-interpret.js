/* 解读引擎测试：白话内容能否正确生成 */
const { astro } = require('iztro');
const ZW = require('./js/interpret.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('=== 知识库完整性 ===\n');
const MAIN14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const missing = MAIN14.filter(s => !ZW.STARS[s]);
t('十四主星全部有白话解释', missing.length === 0, missing.length ? '缺: ' + missing.join(',') : '14/14');

const PAL12 = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const pMissing = PAL12.filter(p => !ZW.PALACES[p]);
t('十二宫全部有白话解释', pMissing.length === 0, pMissing.length ? '缺: ' + pMissing.join(',') : '12/12');

t('四化全部有解释', ['禄', '权', '科', '忌'].every(k => ZW.SIHUA[k]));

// 每颗主星必须有完整五要素
const incomplete = MAIN14.filter(s => {
  const x = ZW.STARS[s];
  return !x.tag || !x.essence || !x.good || !x.issue || !x.advice || !x.keys || !x.keys.length;
});
t('每颗主星含 标签/本质/优势/课题/建议/关键词', incomplete.length === 0,
  incomplete.length ? '不全: ' + incomplete.join(',') : '全部完整');

console.log('\n=== 借对宫规则 ===\n');
// 造一个命宫无主星的案例：需要找命宫空宫的生日
let borrowedCase = null, ownCase = null;
const probes = [];
for (let m = 1; m <= 12; m++) {
  for (let d = 1; d <= 28; d += 3) {
    try {
      const a = astro.bySolar(`1990-${m}-${d}`, 6, '男', true, 'zh-CN');
      const r = ZW.resolveSoulStars(a);
      const soul = a.palaces.find(p => p.name === '命宫');
      if (!soul.majorStars.length && r.stars.length && !borrowedCase) {
        borrowedCase = { date: `1990-${m}-${d}`, r, soul, opp: a.palaces[(soul.index + 6) % 12] };
      }
      if (soul.majorStars.length && !ownCase) {
        ownCase = { date: `1990-${m}-${d}`, r, soul };
      }
      if (borrowedCase && ownCase) break;
    } catch (e) { }
  }
  if (borrowedCase && ownCase) break;
}

if (ownCase) {
  t('命宫有主星时不借对宫', !ownCase.r.borrowed && ownCase.r.stars.length > 0,
    ownCase.date + ' 命宫' + ownCase.soul.earthlyBranch + ' 星=' + ownCase.r.stars.join(','));
} else {
  t('命宫有主星时不借对宫', false, '未找到样本');
}

if (borrowedCase) {
  t('命宫无主星时借对宫', borrowedCase.r.borrowed && borrowedCase.r.stars.length > 0,
    borrowedCase.date + ' 命宫空 → 借' + borrowedCase.r.fromPalace +
    ' 星=' + borrowedCase.r.stars.join(','));
} else {
  console.log('  (未找到命宫无主星的样本，跳过)');
}

console.log('\n=== 解读生成（多命例）===\n');
const cases = [
  ['2000-8-16', 6, '男'], ['1984-2-2', 0, '男'], ['1990-5-20', 3, '女'],
  ['2024-2-10', 6, '男'], ['1975-11-8', 9, '女'], ['2005-7-1', 11, '男'],
];
let allOk = true;
for (const [d, tm, g] of cases) {
  const a = astro.bySolar(d, tm, g, true, 'zh-CN');
  const rd = ZW.buildReading(a);
  const ok = rd.headline && rd.headline.length > 10 && rd.blocks.length >= 3;
  if (!ok) allOk = false;
  console.log((ok ? '  OK  ' : '  FAIL') + ` ${d} ${g} | 命宫星=${rd.soulStars.join('+') || '无'}` +
    (rd.borrowed ? '(借)' : '') + ` | 要点=${rd.focus.length}条`);
  console.log(`        ${rd.headline.slice(0, 62)}...`);
}
t('所有命例均生成完整解读', allOk);

console.log('\n=== 四化白话 ===\n');
const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const rd = ZW.buildReading(a);
t('四化条目为 4 条', rd.focus.length === 4, '实际 ' + rd.focus.length);
t('化忌排在最前', rd.focus.length && rd.focus[0].hua === '忌', rd.focus.length ? rd.focus[0].huaName + ' @' + rd.focus[0].palace : '');
rd.focus.forEach(f => console.log('   ' + f.text));

console.log('\n=== 术语词典 ===\n');
const terms = Object.keys(ZW.TERMS);
t('术语数量充足', terms.length >= 20, terms.length + ' 条');
const emptyTerms = terms.filter(k => !ZW.TERMS[k] || ZW.TERMS[k].length < 8);
t('无空术语', emptyTerms.length === 0, emptyTerms.join(',') || '全部有内容');

console.log('\n=== 新手导读 ===\n');
t('导读为 4 步', ZW.GUIDE.length === 4);
ZW.GUIDE.forEach(g => console.log(`   ${g.step} ${g.title} — ${g.text.slice(0, 34)}...`));

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);