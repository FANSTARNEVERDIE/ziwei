/* 星 × 宫位 情境库测试
 *
 * 这层库是「解读不再千篇一律」的关键：
 * 14 主星 × 12 宫位 = 168 条情境。
 * 若缺失或错位，解读会静默退回通用文案 —— 用户看不出，
 * 但换生日就会读到同一段话。所以必须完整性校验。
 */
const SP = require('./js/star-palace.js');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

console.log('=== 覆盖完整性 ===\n');

const cov = SP.coverage();
t('14 颗主星全部有表', cov.stars === 14, cov.stars + ' 颗');
t('条目总数 = 14 × 12 = 168', cov.entries === 168, cov.entries + ' 条');

const missing = [];
STARS.forEach((s) => {
  PALACES.forEach((p) => {
    const e = SP.get(s, p);
    if (!e) missing.push(s + '@' + p);
  });
});
t('每颗星 × 每个宫位都能取到', missing.length === 0,
  missing.length ? '缺 ' + missing.length + ' 条: ' + missing.slice(0, 5).join(', ') : '168/168');

console.log('\n=== 每条内容完整 ===\n');

let incomplete = [];
STARS.forEach((s) => {
  PALACES.forEach((p) => {
    const e = SP.get(s, p);
    if (!e) return;
    if (!e.g || !e.i || !e.a) incomplete.push(s + '@' + p);
    else if (e.g.length < 8 || e.i.length < 8 || e.a.length < 8) incomplete.push(s + '@' + p + '(过短)');
  });
});
t('每条都有 g/i/a 且长度足够', incomplete.length === 0,
  incomplete.length ? incomplete.slice(0, 5).join(', ') : '全部完整');

// 三字段不应互相复制
let duplicated = [];
STARS.forEach((s) => {
  PALACES.forEach((p) => {
    const e = SP.get(s, p);
    if (!e) return;
    if (e.g === e.i || e.i === e.a || e.g === e.a) duplicated.push(s + '@' + p);
  });
});
t('优势/课题/建议互不重复', duplicated.length === 0,
  duplicated.length ? duplicated.slice(0, 5).join(', ') : '全部不同');

console.log('\n=== 同一颗星在不同宫位必须不同 ===\n');

let sameAcrossPalace = [];
STARS.forEach((s) => {
  const seen = new Map();
  PALACES.forEach((p) => {
    const e = SP.get(s, p);
    if (!e) return;
    const key = e.g + '|' + e.i + '|' + e.a;
    if (seen.has(key)) sameAcrossPalace.push(s + ': ' + seen.get(key) + ' 与 ' + p + ' 相同');
    else seen.set(key, p);
  });
});
t('同星不同宫位的文案不相同', sameAcrossPalace.length === 0,
  sameAcrossPalace.length ? sameAcrossPalace.slice(0, 3).join('; ') : '14 颗星 × 12 宫全部互异');

console.log('\n=== 查表容错 ===\n');

t('宫名带「宫」字可查', !!SP.get('紫微', '财帛宫'));
t('宫名不带「宫」字可查', !!SP.get('紫微', '财帛'));
t('「命宫」可查（不能被剥成「命」）', !!SP.get('紫微', '命宫'));
t('未知星名返回 null', SP.get('不存在的星', '命宫') === null);
t('未知宫位返回 null', SP.get('紫微', '不存在的宫') === null);
t('空值不抛错', (() => {
  try { SP.get(null, null); SP.get(undefined, '命宫'); return true; }
  catch (e) { return false; }
})());

console.log('\n=== 内容质量 ===\n');

const allTexts = [];
STARS.forEach((s) => PALACES.forEach((p) => {
  const e = SP.get(s, p);
  if (e) allTexts.push(e.g, e.i, e.a);
}));

t('无「宫宫」重复', !allTexts.some((x) => /宫宫/.test(x)));
t('无占位符（TODO/待补）', !allTexts.some((x) => /TODO|待补|XXX|占位/.test(x)));
t('长度合理（8-60 字）',
  allTexts.every((x) => x.length >= 8 && x.length <= 60),
  '范围 ' + Math.min(...allTexts.map((x) => x.length)) + '-' +
  Math.max(...allTexts.map((x) => x.length)));
t('建议都指向具体动作（含动词或方法词）',
  allTexts.filter((x) => /^(把|设|定|试|多|少|先|别|给|留|每|不|用|找|练|记)/.test(x)).length >= 40,
  allTexts.filter((x) => /^(把|设|定|试|多|少|先|别|给|留|每|不|用|找|练|记)/.test(x)).length + ' 条以动作开头');

console.log('\n=== 与 interpret.js 的衔接 ===\n');

const fs = require('fs');
const interp = fs.readFileSync('./js/interpret.js', 'utf8');
t('interpret.js 会加载情境库', /starPalaceLib|ZWStarPalace/.test(interp));
t('命宫解读使用情境库', /SP\.get\(stars\[0\], ctxPalace\)/.test(interp));
t('十二宫解读使用情境库', /SP2\.get\(major\[0\], p\.name\)/.test(interp));
t('借对宫时也用情境库', /opp\.majorStars\[0\]\.name, p\.name/.test(interp));
t('有回退（取不到时用通用字段）', /\(ctx && ctx\.g\) \|\| info\.good/.test(interp));

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);