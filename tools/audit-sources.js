/* 审计：项目里每一处「内容」的来源与可靠性
 *
 * 目的：诚实区分三类内容
 *   A. 有客观依据（历法事实、第三方库算法、可验证的规则）
 *   B. 本项目原创文案（我写的，无外部出处）
 *   C. 从传统说法整理（有出处但未经逐条核对）
 */
const fs = require('fs');
const path = require('path');

function size(f) {
  const p = path.join(__dirname, '..', f);
  return fs.existsSync(p) ? fs.statSync(p).size : 0;
}

console.log('='.repeat(72));
console.log('内容来源审计');
console.log('='.repeat(72));

console.log('\n【A. 有客观依据的部分】\n');
console.log('  排盘算法');
console.log('    来源: iztro（第三方 MIT 库）');
console.log('    体积: ' + (size('vendor/iztro.min.js') / 1024).toFixed(1) + ' KB');
console.log('    说明: 安星表、四化、大限起运等由该库实现，未自行重写');
console.log('');
console.log('  农历闰月/大小月表');
console.log('    来源: 由 iztro 逐月探测后生成的查找表');
console.log('    文件: js/lunar-table.js (' + (size('js/lunar-table.js') / 1024).toFixed(1) + ' KB)');
console.log('    说明: 可复现 —— 删掉重跑 tools/gen-leap-table.js 会得到同样结果');
console.log('    校验: test-leap.js 会抽样比对「表值」与「实时探测」是否一致');
console.log('');
console.log('  真太阳时校正');
console.log('    来源: 天文学公式（经度时差 + 均时差）');
console.log('    说明: 公式本身是公开的，可数学验证');

console.log('\n【B. 本项目原创文案 —— 无外部出处】\n');

const files = [
  ['js/interpret.js', 'STARS / PALACES / MINOR / SIHUA / TERMS / GUIDE'],
  ['js/star-palace.js', '168 条「星 × 宫位」情境'],
];

files.forEach(([f, what]) => {
  const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  // 统计中文字符数
  const cjk = (src.match(/[\u4e00-\u9fff]/g) || []).length;
  console.log('  ' + f);
  console.log('    内容: ' + what);
  console.log('    中文字数: 约 ' + cjk + ' 字');
  console.log('    来源: **我根据通行说法自行撰写**');
  console.log('    风险: 无原文可对，可能与传统典籍说法有出入');
  console.log('');
});

console.log('【C. 可核对的对照关系】\n');
console.log('  以下关系是紫微斗数的既定规则，可对照任何一本入门书验证：');
console.log('    - 十二宫名称与顺序');
console.log('    - 十四主星名称');
console.log('    - 四化（禄权科忌）与天干的对应');
console.log('    - 大限起运与宫位顺序');
console.log('  项目中这些「名称与结构」部分符合通行说法；');
console.log('  但每一颗星的「性格描述、优势、课题、建议」属于解释性内容，');
console.log('  各家说法不一，本项目采用其中一种，不宣称唯一正确。');

console.log('\n' + '='.repeat(72));
console.log('结论');
console.log('='.repeat(72));
console.log('');
console.log('  可以做到「真实」的:');
console.log('    ✓ 排盘结果 — 由 iztro 计算，可与其他排盘站交叉验证');
console.log('    ✓ 农历闰月 — 可复现的探测结果，非人工填写');
console.log('    ✓ 真太阳时 — 天文学公式');
console.log('');
console.log('  无法宣称「真实」的:');
console.log('    ✗ 168 条情境解读 — 我写的，没有典籍出处');
console.log('    ✗ 星曜性格描述 — 我写的，各家说法不同');
console.log('    ✗ 建议类文案 — 属于现代应用建议，不是传统内容');
console.log('');
console.log('  改进方向见下方建议。');