/* 核对 star-palace.js 的 168 条与《紫微斗数精成》第九章原文
 *
 * 原书第九章是「按宫组织」的：每个宫一节，
 * 节内逐一说明各星入该宫的表现。
 * 我们的 168 条是按「星×宫」组织的，两者可以对照。
 *
 * 本脚本：
 *   1. 从原文按宫切分
 *   2. 在每个宫的原文里找出该宫相关的星曜论述
 *   3. 与我们的条目做关键词比对，找出可能偏离之处
 */
const fs = require('fs');
const path = require('path');
const SP = require('../js/star-palace.js');
const ZW = require('../js/interpret.js');

const SRC = path.join(__dirname, '..', '_pdf', '十二宫参断-原文.md');
if (!fs.existsSync(SRC)) {
  console.error('原文尚未生成，请先跑 python tools/extract-palaces-source.py');
  process.exit(1);
}
const raw = fs.readFileSync(SRC, 'utf8');

/* 按 ## 宫名（p..） 切分 */
const marks = [];
const re = /^## (.+?)（p(\d+)–(\d+)）/gm;
let m;
while ((m = re.exec(raw)) !== null) {
  marks.push({ name: m[1], start: m.index, end: re.lastIndex });
}

const sections = {};
marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
  sections[mk.name] = raw.slice(mk.end, end).trim();
});

console.log('=== 第九章原文分节情况 ===\n');
Object.keys(sections).forEach((k) => {
  const len = sections[k].length;
  const flag = len < 300 ? '  ← 内容过少（可能未 OCR 完）' : '';
  console.log('  ' + k.padEnd(8) + len + ' 字' + flag);
});

/* 宫名对齐：原文用「奴仆宫」，我们用「仆役」 */
const PALACE_MAP = {
  '兄弟宫': '兄弟', '夫妻宫': '夫妻', '子女宫': '子女',
  '财帛宫': '财帛', '疾厄宫': '疾厄', '迁移宫': '迁移',
  '奴仆宫': '仆役', '官禄宫': '官禄', '田宅宫': '田宅',
  '福德宫': '福德', '父母宫': '父母',
};

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

console.log('\n=== 原文中「各星」在本宫的出现情况 ===\n');

const coverage = [];
Object.keys(PALACE_MAP).forEach((srcName) => {
  const body = sections[srcName] || '';
  const ourPalace = PALACE_MAP[srcName];
  const found = [];
  STARS.forEach((st) => {
    // 原文常写「紫微入此宫」「紫微守」等
    const n = body.split(st).length - 1;
    if (n > 0) found.push(st + '(' + n + ')');
  });
  coverage.push({ src: srcName, our: ourPalace, body: body.length, found });
  console.log('  ' + srcName.padEnd(8) + '原文 ' + String(body.length).padStart(6) +
    ' 字 | 提到 ' + found.length + ' 颗星');
  if (found.length) console.log('      ' + found.join(' '));
});

console.log('\n=== 我们的 168 条 vs 原文覆盖 ===\n');

let gap = [];
coverage.forEach((c) => {
  if (c.body < 300) { gap.push(c.src + '（原文过少）'); return; }
  if (c.found.length < 5) gap.push(c.src + '（原文只提到 ' + c.found.length + ' 颗星）');
});
if (gap.length) {
  console.log('  疑点:');
  gap.forEach((g) => console.log('    · ' + g));
} else {
  console.log('  各宫原文都覆盖了多颗星，可用于核对');
}

/* 抽取几段原文，看原书的表述方式是否与我们的条目同构 */
console.log('\n=== 原文表述方式抽样（财帛宫）===\n');
const cb = sections['财帛宫'] || '';
console.log(cb.slice(0, 900).replace(/\s+/g, ' '));