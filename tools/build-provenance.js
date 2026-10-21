/* 「星 × 宫位」的来源标注
 *
 * 问题：我们为 14 星 × 12 宫 = 168 个组合都写了内容，
 *       但《紫微斗数精成》第九章只在 78 处给出明确论述。
 *       其余是按星性推导的——有依据，但不是原书说法。
 *
 * 用户看到「紫微在财帛宫：赚钱讲究格局」时，
 * 无从判断这是原书的话还是我们推的。这必须说清楚。
 *
 * 本文件为每个「星@宫」标注来源等级：
 *   'source'  原书第九章有明确论述（附原文引文）
 *   'derived' 由星性推导（星性来自原书，组合是本站推的）
 */
const fs = require('fs');
const path = require('path');

const SRC_JSON = path.join(__dirname, '..', '_pdf', 'star-palace-source.json');
const OUT = path.join(__dirname, '..', 'js', 'star-palace-provenance.js');

let idx = {};
if (fs.existsSync(SRC_JSON)) {
  idx = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));
}

const STARS = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府',
  '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];
const PALACES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

/* 建立标注表 */
const TABLE = {};
let sourced = 0, derived = 0;

STARS.forEach((st) => {
  PALACES.forEach((p) => {
    const key = st + '@' + p;
    const src = idx[key];
    if (src && src.text && src.text.length > 80) {
      // 原书有论述：存一段引文（截断，避免文件过大）
      TABLE[key] = {
        kind: 'source',
        quote: src.text.slice(0, 400),
      };
      sourced++;
    } else {
      TABLE[key] = { kind: 'derived', quote: '' };
      derived++;
    }
  });
});

/* 生成 JS 模块 */
const lines = [];
lines.push('/* 「星 × 宫位」的来源标注 —— 本文件由 tools/build-provenance.js 生成 */');
lines.push('/*');
lines.push(' * 背景：我们为 14 星 × 12 宫 = 168 个组合都写了内容，');
lines.push(' *       但《紫微斗数精成》第九章只在部分组合给出明确论述。');
lines.push(' *       用户无从判断哪条是原书的话、哪条是我们推的，');
lines.push(' *       所以这里逐条标注来源。');
lines.push(' *');
lines.push(' *   source  原书第九章有明确论述（quote 为原文引文）');
lines.push(' *   derived 由星性推导（星性来自原书，组合是本站推的）');
lines.push(' */');
lines.push('');
lines.push('(function (root, factory) {');
lines.push("  if (typeof module !== 'undefined' && module.exports) {");
lines.push('    module.exports = factory();');
lines.push('  } else {');
lines.push('    root.ZWStarPalaceProvenance = factory();');
lines.push('  }');
lines.push("})(typeof self !== 'undefined' ? self : this, function () {");
lines.push('');
lines.push('  const TABLE = {');
Object.keys(TABLE).sort().forEach((k) => {
  const v = TABLE[k];
  const q = v.quote ? JSON.stringify(v.quote) : "''";
  lines.push(`    ${JSON.stringify(k)}: { kind: ${JSON.stringify(v.kind)}, quote: ${q} },`);
});
lines.push('  };');
lines.push('');
lines.push('  /** 取某星在某宫的来源标注 */');
lines.push('  function get(star, palace) {');
lines.push("    const p = String(palace || '').replace(/宫$/, '') || '命宫';");
lines.push("    const raw = String(palace || '').trim();");
lines.push('    return TABLE[star + \'@\' + (raw === \'命宫\' ? \'命宫\' : p)]');
lines.push('      || TABLE[star + \'@\' + raw] || null;');
lines.push('  }');
lines.push('');
lines.push('  function stats() {');
lines.push('    let s = 0, d = 0;');
lines.push('    Object.keys(TABLE).forEach((k) => {');
lines.push("      if (TABLE[k].kind === 'source') s++; else d++;");
lines.push('    });');
lines.push('    return { sourced: s, derived: d, total: s + d };');
lines.push('  }');
lines.push('');
lines.push('  return { TABLE, get, stats };');
lines.push('});');
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log('=== 来源标注统计 ===\n');
console.log('  原书有论述 (source):  ' + sourced + ' 条');
console.log('  星性推导 (derived):   ' + derived + ' 条');
console.log('  合计:                 ' + (sourced + derived) + ' 条');
console.log('');
console.log('已写出 ' + OUT);
console.log('文件大小: ' + Math.round(fs.statSync(OUT).size / 1024) + ' KB');