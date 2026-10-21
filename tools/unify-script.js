/* 统一为简体：修掉界面文案里误用的繁体字
 *
 * 项目约定：正文与界面用简体；仅紫微斗数专有名词
 * （紫微斗數/命盤/星盤/宮位名等）保留传统写法。
 * 实测 index.html 简体 132 : 繁体 39，interpret.js 简体 717 : 繁体 2，
 * 说明简体才是主调，繁体是零散混入的，应统一。
 */
const fs = require('fs');
const path = require('path');

/* 只替换正文用字；术语词先做保护 */
const TERMS = [
  '紫微斗數', '命盤', '星盤',
];

/* 繁体 -> 简体（针对本项目实际出现过的字） */
const MAP = {
  '這': '这', '個': '个', '們': '们', '來': '来', '說': '说', '時': '时',
  '會': '会', '對': '对', '應': '应', '當': '当', '後': '后', '現': '现',
  '實': '实', '關': '关', '係': '系', '於': '于', '與': '与', '為': '为',
  '從': '从', '過': '过', '還': '还', '進': '进', '開': '开', '發': '发',
  '經': '经', '體': '体', '點': '点', '種': '种', '樣': '样', '讓': '让',
  '覺': '觉', '變': '变', '處': '处', '務': '务', '動': '动', '話': '话',
  '錢': '钱', '買': '买', '賣': '卖', '貴': '贵',
  '氣': '气', '質': '质', '風': '风', '險': '险', '難': '难',
  '樂': '乐', '歡': '欢', '學': '学', '習': '习', '讀': '读',
  '寫': '写', '認': '认', '識': '识', '記': '记', '憶': '忆',
  '麼': '么', '雖': '虽', '卻': '却', '並': '并',
  '員': '员', '師': '师', '醫': '医', '該': '该', '語': '语',
  '顆': '颗', '術': '术', '註': '注', '釋': '释', '選': '选', '擇': '择',
  '權': '权', '給': '给', '絕': '绝', '盤': '盘',
  '滑': '滑', '張': '张', '兩': '两', '雙': '双',
  /* 补充：首轮遗漏的字 */
  '輸': '输', '傳': '传', '機': '机', '運': '运', '線': '线',
  '斷': '断', '網': '网', '鋪': '铺', '離': '离', '錄': '录',
  '製': '制', '號': '号', '稱': '称', '證': '证', '據': '据',
  '誤': '误', '確': '确', '認': '认', '啟': '启', '閉': '闭',
  '畫': '画', '闆': '板', '邊': '边', '緣': '缘', '態': '态',
  '勢': '势', '絡': '络', '連': '连', '結': '结', '準': '准',
  '確': '确', '幫': '帮', '雜': '杂', '礙': '碍', '釋': '释',
  '覆': '覆', '蓋': '盖', '傭': '佣', '擴': '扩', '擾': '扰',
  '順': '顺', '須': '须', '預': '预', '測': '测', '驗': '验',
  '顯': '显', '蹤': '踪', '跡': '迹', '週': '周', '歲': '岁',
  '當': '当', '盡': '尽', '億': '亿', '價': '价', '億': '亿',
  '僅': '仅', '從': '从', '偵': '侦', '側': '侧', '債': '债',
  '傷': '伤', '傾': '倾', '僅': '仅', '勵': '励', '勸': '劝',
};

/* 「宮」需要特殊处理：
 *   - 宫位名（福德宮/官祿宮…）属于术语，保留？
 *   实测：项目里 95% 用的是简体「宫」，所以统一成「宫」更一致。
 *   但「紫微斗數」这类整体术语保留。 */
const PALACE_KEEP = new Set(['命宮', '身宮']);

const FILES = [
  'index.html',
  'js/app.js',
  'js/interpret.js',
  'js/star-palace.js',
  'js/export.js',
  'js/store.js',
];

let totalFixed = 0;
const detail = [];

FILES.forEach((f) => {
  const p = path.join(__dirname, '..', f);
  if (!fs.existsSync(p)) return;
  let src = fs.readFileSync(p, 'utf8');
  const before = src;

  /* 1) 先用占位符保护术语 */
  const placeholders = [];
  const protect = (term) => {
    const token = '\u0001T' + placeholders.length + '\u0001';
    placeholders.push(term);
    return token;
  };

  let work = src;
  // 保护整体术语（含繁体写法）
  TERMS.forEach((t) => {
    if (work.includes(t)) work = work.split(t).join(protect(t));
  });

  /* 2) 替换正文繁体字 */
  let count = 0;
  Object.keys(MAP).forEach((t) => {
    if (!work.includes(t)) return;
    const n = work.split(t).length - 1;
    count += n;
    work = work.split(t).join(MAP[t]);
  });

  /* 3) 「宮」统一为「宫」（保护过的术语除外） */
  if (work.includes('宮')) {
    // 但不该改「紫微斗數」这类已被保护的
    const n = work.split('宮').length - 1;
    count += n;
    work = work.split('宮').join('宫');
  }
  if (work.includes('祿')) { const n = work.split('祿').length - 1; count += n; work = work.split('祿').join('禄'); }
  if (work.includes('權')) { const n = work.split('權').length - 1; count += n; work = work.split('權').join('权'); }

  /* 4) 还原术语 */
  placeholders.forEach((term, i) => {
    work = work.split('\u0001T' + i + '\u0001').join(term);
  });

  if (work !== before) {
    fs.writeFileSync(p, work, 'utf8');
    totalFixed += count;
    detail.push({ file: f, count });
  }
});

console.log('=== 统一为简体 ===\n');
detail.forEach((d) => console.log('  ' + d.file.padEnd(22) + d.count + ' 处'));
console.log('\n合计修正 ' + totalFixed + ' 处');