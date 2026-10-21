/* 把《紫微斗数精成》的星性原文，与我们现有的 STARS 描述做对照。
 *
 * 目的：找出我们写错、写偏、或漏掉的重要内容。
 * 方法：从 OCR 原文里提取每颗星的关键词，检查我们的描述是否覆盖。
 */
const fs = require('fs');
const path = require('path');
const ZW = require('../js/interpret.js');

const SRC = path.join(__dirname, '..', '_pdf', '诸星-原文.md');
const raw = fs.readFileSync(SRC, 'utf8');

// 按 ## 星名 切分
const sections = {};
const re = /^## (.+?)（p(\d+)–(\d+)）$/gm;
let m;
const marks = [];
while ((m = re.exec(raw)) !== null) {
  marks.push({ name: m[1], start: m.index, headEnd: re.lastIndex });
}
marks.forEach((mk, i) => {
  const end = i + 1 < marks.length ? marks[i + 1].start : raw.length;
  sections[mk.name] = raw.slice(mk.headEnd, end).trim();
});

console.log('=== 原文可用的星 ===');
Object.keys(sections).forEach((k) => {
  console.log('  ' + k.padEnd(8) + sections[k].length + ' 字');
});

/* 原书对每颗星的核心定性（从「星性解释」段抽取的关键概念）
 * 这些是从原文里人工读出的、该书明确强调的属性。
 * 用它们来检查我们的描述有没有漏掉重点。 */
const KEY_CLAIMS = {
  '紫微': {
    nature: '属己土，南北斗中至尊至贵之星，故名帝座，为官禄主，专司官贵地位',
    core: ['尊贵', '官禄主', '需百官朝拱', '孤君则不作贵断'],
    mustHave: ['百官朝拱', '尊贵', '官禄'],
  },
  '天机': {
    nature: '属乙木，南斗第三星，化气为善，为兄弟主；智慧、益寿、仁善、谋划计算之星',
    core: ['动星', '军师谋臣', '善', '机'],
    mustHave: ['动', '谋', '善'],
  },
  '太阳': {
    nature: '属丙火，为中天斗星，司昼贵，主光明、名誉、权贵',
    core: ['贵', '光明', '主父星', '施舍'],
    mustHave: ['光', '贵'],
  },
  '武曲': {
    nature: '属辛金，北斗第六星，化气为财，为财帛主，司财帛',
    core: ['财', '刚毅', '寡宿', '将星'],
    mustHave: ['财'],
  },
  '天同': {
    nature: '属壬水，南斗第四星，化气为福，为福德主',
    core: ['福', '水', '化福'],
    mustHave: ['福'],
  },
  '廉贞': {
    nature: '属丙火，北斗第五星，化气为囚，为官禄宫主',
    core: ['囚', '次桃花', '官禄主'],
    mustHave: ['囚', '桃花'],
  },
  '天府': {
    nature: '属戊土，南斗第一星，为财库之主，司财帛田宅',
    core: ['库', '财库', '令星'],
    mustHave: ['库'],
  },
  '太阴': {
    nature: '属癸水，为中天斗星，司夜贵，为田宅主、财帛主',
    core: ['水', '母星', '田宅', '夜'],
    mustHave: ['阴', '水'],
  },
  '贪狼': {
    nature: '属甲木，北斗第一星，化气为桃花，为欲望之星',
    core: ['桃花', '欲望', '才艺'],
    mustHave: ['桃花'],
  },
  '巨门': {
    nature: '属癸水，北斗第二星，化气为暗，为口舌之星',
    core: ['暗', '口舌', '是非'],
    mustHave: ['暗', '口'],
  },
  '天相': {
    nature: '属壬水，南斗第五星，化气为印，为印绶之星',
    core: ['印', '印绶', '衣禄'],
    mustHave: ['印'],
  },
  '天梁': {
    nature: '属戊土，南斗第二星，化气为荫，为父母之主',
    core: ['荫', '长者', '解厄'],
    mustHave: ['荫'],
  },
  '七杀': {
    nature: '属庚金，南斗第六星，化气为权，为将星',
    core: ['将星', '肃杀', '孤克'],
    mustHave: ['杀', '将'],
  },
  '破军': {
    nature: '属癸水，北斗第七星，化气为耗，为耗星',
    core: ['耗', '破', '开创'],
    mustHave: ['耗', '破'],
  },
};

console.log('\n=== 对照检查：我们的描述是否覆盖原书核心概念 ===\n');

let issues = [];
Object.keys(KEY_CLAIMS).forEach((star) => {
  const claim = KEY_CLAIMS[star];
  const ours = ZW.STARS[star];
  if (!ours) {
    issues.push(star + ': 我们的 STARS 里没有这颗星');
    return;
  }
  const ourText = [ours.tag, ours.essence, ours.good, ours.issue, ours.advice,
    (ours.keys || []).join('')].join(' ');

  const missed = claim.mustHave.filter((k) => !ourText.includes(k));
  const status = missed.length ? '✗ 漏' : '✓';
  console.log('  ' + status + ' ' + star.padEnd(4) +
    ' | 原书定性: ' + claim.nature.slice(0, 40));
  if (missed.length) {
    console.log('      我们的描述里没有出现: ' + missed.join('、'));
    issues.push(star + ' 缺: ' + missed.join('、'));
  }
});

console.log('\n=== 需要修正的 ===\n');
if (issues.length) {
  issues.forEach((x) => console.log('  · ' + x));
} else {
  console.log('  全部覆盖');
}

/* 输出原文里关于每颗星「四化」的段落，供后续核对 */
console.log('\n=== 原文中每颗星的四化说明（摘录）===\n');
Object.keys(sections).forEach((star) => {
  if (!KEY_CLAIMS[star]) return;
  const body = sections[star];
  const i = body.indexOf('四化：');
  if (i < 0) {
    console.log('  ' + star + ': 原文未找到「四化：」段');
    return;
  }
  // 取到下一个段落标记
  let seg = body.slice(i, i + 700);
  console.log('  【' + star + '】');
  console.log('    ' + seg.replace(/\s+/g, ' ').slice(0, 320));
  console.log('');
});