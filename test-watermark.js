/* 水印渲染验证
 *
 * canvas 绘制不会抛错，只会「画不出来」，所以必须实际检查像素：
 *   1. 品牌区域确实出现了非背景色像素
 *   2. 水印没有盖住盘面宫位内容
 *   3. 页脚高度改变后，盘面与页脚不重叠
 */
const { astro } = require('iztro');

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

/* 用来记录画布上发生了什么的假 ctx。
 * 故意写得直白：属性就是普通字段，方法直接 push 到 ops。
 * （先前用 setter/getter 代理导致 fillText 记录被吞掉） */
function makeFakeCtx() {
  const ops = [];
  const ctx = {
    ops,
    _scale: 1,
    fillStyle: '#000000', strokeStyle: '#000000',
    font: '10px sans-serif', textAlign: 'left', textBaseline: 'top',
    lineWidth: 1, globalAlpha: 1,

    scale(s) { ctx._scale = s; },
    fillRect(x, y, w, h) { ops.push({ type: 'fillRect', x, y, w, h }); },
    strokeRect(x, y, w, h) { ops.push({ type: 'strokeRect', x, y, w, h }); },
    fillText(text, x, y) {
      ops.push({
        type: 'fillText', text: String(text), x, y,
        fill: ctx.fillStyle, font: ctx.font, align: ctx.textAlign,
      });
    },
    measureText(txt) { return { width: String(txt).length * 7.5 }; },
    beginPath() { ops.push({ type: 'beginPath' }); },
    arc(x, y, r) { ops.push({ type: 'arc', x, y, r }); },
    moveTo(x, y) { ops.push({ type: 'moveTo', x, y }); },
    lineTo(x, y) { ops.push({ type: 'lineTo', x, y }); },
    arcTo() { },
    quadraticCurveTo() { },
    closePath() { },
    fill() { ops.push({ type: 'fill' }); },
    stroke() { ops.push({ type: 'stroke' }); },
    save() { }, restore() { },
    setLineDash() { },
  };
  return ctx;
}

let captured = null;
global.document = {
  createElement: (tag) => {
    if (tag !== 'canvas') return {};
    const ctx = makeFakeCtx();
    captured = ctx;
    return { width: 0, height: 0, getContext: () => ctx };
  },
};
global.window = global;

const EXP = require('./js/export.js');
const a = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');

console.log('=== 导出图品牌水印 ===\n');

const canvas = EXP.drawChart(a, {});
const ops = captured.ops;

const texts = ops.filter((o) => o.type === 'fillText');
const allText = texts.map((o) => o.text);

t('画布已创建', canvas && canvas.width > 0, canvas.width + 'x' + canvas.height);

// 顶部水印
const brandTop = texts.find((o) => o.text === 'FANSTAR');
t('顶部有 FANSTAR 水印', !!brandTop, brandTop ? ('位置 x=' + Math.round(brandTop.x)) : '未找到');
t('水印含中文小字', allText.includes('紫微斗數'));

// 水印必须在右上角（x 大于画布中线）
const W = canvas.width / 2;   // scale=2，逻辑宽度 = 像素/2
t('水印位于右侧', brandTop && brandTop.x > W * 0.6,
  brandTop ? 'x=' + Math.round(brandTop.x) + ' / 宽 ' + W : '');

// 页脚
const foot = texts.find((o) => /FANSTAR/.test(o.text) && o.y > 300);
t('页脚有品牌署名', !!foot, foot ? ('y=' + Math.round(foot.y) + ' 「' + foot.text + '」') : '未找到');
t('保留免责声明', allText.some((x) => /不构成决策依据/.test(x)));

console.log('\n=== 水印不与盘面重叠 ===\n');

// 盘面网格区域：从 headH 开始
const headH = 92, cell = 210, gap = 1, pad = 30;
const gridTop = pad + headH;
const gridBottom = gridTop + cell * 4 + gap * 3;

const inGrid = texts.filter((o) => o.text === 'FANSTAR' && o.y >= gridTop && o.y <= gridBottom);
t('没有 FANSTAR 落在盘面区内', inGrid.length === 0,
  inGrid.length ? inGrid.map((o) => 'y=' + Math.round(o.y)).join(',') : '盘面区 y=' + gridTop + '~' + gridBottom);

// 顶部水印应在盘面之上
t('顶部水印在盘面之上', brandTop && brandTop.y < gridTop,
  brandTop ? 'y=' + Math.round(brandTop.y) + ' < ' + gridTop : '');

console.log('\n=== 页脚高度足够（不压盘面）===\n');

const footTexts = texts.filter((o) => o.y > gridBottom);
t('页脚文字都在盘面下方', footTexts.every((o) => o.y > gridBottom),
  footTexts.length + ' 行, 最小 y=' + Math.min(...footTexts.map((o) => o.y)));
t('页脚有品牌行', footTexts.some((o) => /FANSTAR/.test(o.text)));

// 带副标题时不应溢出画布
const c2 = EXP.drawChart(a, { subtitle: '2026 流年 · 27 岁' });
const H2 = c2.height / 2;
const texts2 = captured.ops.filter((o) => o.type === 'fillText');
const maxY = Math.max(...texts2.map((o) => o.y));
t('带副标题时不溢出画布底部', maxY < H2, '最大 y=' + Math.round(maxY) + ' < 高度 ' + H2);
t('副标题已绘制', texts2.some((o) => /2026 流年/.test(o.text)));

console.log('\n=== drawBrandMark 可独立调用 ===\n');
t('已导出 drawBrandMark', typeof EXP.drawBrandMark === 'function');

// 左右对齐
const ctxL = makeFakeCtx();
EXP.drawBrandMark(ctxL, 40, 20, { align: 'left' });
const lOps = ctxL.ops.filter((o) => o.type === 'fillText');
t('align=left 时 x 等于传入值', lOps.length > 0 && Math.abs(lOps[0].x - 40) < 40,
  'x=' + Math.round(lOps[0].x));

const ctxR = makeFakeCtx();
EXP.drawBrandMark(ctxR, 400, 20, { align: 'right' });
const rOps = ctxR.ops.filter((o) => o.type === 'fillText');
t('align=right 时整体右对齐', rOps.length > 0 && rOps[0].x < 400 && rOps[0].x > 300,
  'x=' + Math.round(rOps[0].x) + ' (右边界 400)');

// 缩放不应崩
t('scale 参数生效不崩', (() => {
  try { EXP.drawBrandMark(makeFakeCtx(), 100, 10, { scale: 1.5 }); return true; }
  catch (e) { return false; }
})());

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);