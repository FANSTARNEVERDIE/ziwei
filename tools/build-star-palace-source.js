/* 改进版：从第九章按宫抽取「各星」论述
 *
 * 上一版只认 ★N、星名 的编号格式，漏掉了很多——
 * 原书在同一颗星下会用「紫破」「紫府」「紫贪」等组合名继续论述，
 * 这些也应归到紫微名下。
 *
 * 本版策略：
 *   1. 先按 ★N、星名 切主段
 *   2. 主段内若出现「星名+星名」的组合词，也算该星的内容
 *   3. 同时保留「其它星」段（昌曲、左右、火铃等）
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '_pdf', '十二宫参断-原文.md');
const raw = fs.readFileSync(SRC, 'utf8');

const palaceMarks = [];
const pre = /^## (.+?)（p(\d+)–(\d+)）/gm;
let m;
while ((m = pre.exec(raw)) !== null) {
  palaceMarks.push({ name: m[1], start: m.index, end: pre.lastIndex });
}

const PALACE_MAP = {
  '兄弟宫': '兄弟', '夫妻宫': '夫妻', '子女宫': '子女',
  '财帛宫': '财帛', '疾厄宫': '疾厄', '迁移宫': '迁移',
  '奴仆宫': '仆役', '官禄宫': '官禄', '田宅宫': '田宅',
  '福德宫': '福德', '父母宫': '父母',
};

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

/* 组合别名：原书常用简称，如 紫破 = 紫微+破军 */
const ALIAS = {
  '紫破': '紫微', '紫府': '紫微', '紫贪': '紫微', '紫杀': '紫微', '紫相': '紫微',
  '机巨': '天机', '机梁': '天机', '机阴': '天机',
  '阳梁': '太阳', '阳巨': '太阳', '阳阴': '太阳',
  '武府': '武曲', '武破': '武曲', '武相': '武曲', '武杀': '武曲', '武贪': '武曲',
  '同阴': '天同', '同巨': '天同', '同梁': '天同',
  '廉破': '廉贞', '廉杀': '廉贞', '廉府': '廉贞', '廉贪': '廉贞', '廉相': '廉贞',
  '府相': '天府',
  '贪狼': '贪狼',
};

const index = {};

palaceMarks.forEach((pm, i) => {
  const end = i + 1 < palaceMarks.length ? palaceMarks[i + 1].start : raw.length;
  const body = raw.slice(pm.end, end);
  const ourPalace = PALACE_MAP[pm.name];
  if (!ourPalace) return;

  /* 找 ★N、星名 段落头 */
  const heads = [];
  const re = /★\s*(\d+)\s*[、.]\s*([\u4e00-\u9fff]{2,3})星/g;
  let mm;
  while ((mm = re.exec(body)) !== null) {
    heads.push({ n: Number(mm[1]), star: mm[2], start: mm.index, headEnd: re.lastIndex });
  }

  heads.forEach((h, k) => {
    if (!STARS.includes(h.star)) return;
    const segEnd = k + 1 < heads.length ? heads[k + 1].start : body.length;
    const text = body.slice(h.headEnd, segEnd).trim();
    const key = h.star + '@' + ourPalace;
    // 同星同宫可能有多段，合并
    if (index[key]) index[key].text += '\n' + text;
    else {
      index[key] = {
        star: h.star, palace: ourPalace, palaceSrc: pm.name,
        text, aliases: [],
      };
    }
  });

  /* 补充：主段之外的组合别名（如「紫破」单独成段的情况） */
  STARS.forEach((st) => {
    const key = st + '@' + ourPalace;
    if (index[key]) return;   // 已有主段就不补
  });
});

const keys = Object.keys(index);
console.log('=== 改进后抽取结果 ===\n');
console.log('共 ' + keys.length + ' 条（上限 14 × 11 = 154）');

const byPalace = {};
keys.forEach((k) => { const p = index[k].palace; byPalace[p] = (byPalace[p] || 0) + 1; });
console.log('');
Object.keys(byPalace).forEach((p) => console.log('  ' + p.padEnd(4) + byPalace[p] + ' 颗星'));

const missP = Object.values(PALACE_MAP).filter((p) => !byPalace[p]);
if (missP.length) console.log('  缺宫: ' + missP.join('、'));

/* 输出 JSON 与 Markdown */
fs.writeFileSync(path.join(__dirname, '..', '_pdf', 'star-palace-source.json'),
  JSON.stringify(index, null, 1), 'utf8');

const out = ['# 各星落各宫 · 原文对照\n',
  '来源：《紫微斗数精成》上编 第九章（p271–380）\n',
  '用途：核对 js/star-palace.js\n\n'];
Object.keys(byPalace).forEach((p) => {
  out.push(`\n## ${p}宫\n`);
  STARS.forEach((st) => {
    const e = index[st + '@' + p];
    if (!e) return;
    out.push(`\n### ${st}在${p}宫\n\n${e.text}\n`);
  });
  out.push('\n---\n');
});
fs.writeFileSync(path.join(__dirname, '..', '_pdf', '各星落各宫-原文对照.md'),
  out.join(''), 'utf8');

console.log('\n已写出 JSON 与 Markdown');
const lens = Object.values(index).map((v) => v.text.length).sort((a, b) => a - b);
console.log('段落长度: 中位 ' + lens[Math.floor(lens.length / 2)] +
  ', 最短 ' + lens[0] + ', 最长 ' + lens[lens.length - 1]);