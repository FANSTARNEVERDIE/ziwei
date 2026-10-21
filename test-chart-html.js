/* 盘面 HTML 生成器测试
 *
 * buildChartHTML 是从 renderChart 抽出来的公共函数，
 * 主盘与对比盘共用。它是本轮重构的核心，必须独立验证：
 *   - 网格坐标完整且唯一
 *   - interactive=false 时不产生按钮
 *   - 各选项（showDecadal / showMarks / pulse）生效
 *
 * 通过加载 app.js 到模拟 DOM 环境来间接测试。
 */
const fs = require('fs');
const path = require('path');
const { astro } = require('iztro');

// --- 复用 e2e 的极简 DOM ---
class CList {
  constructor() { this.s = new Set(); }
  add(...c) { c.forEach(x => this.s.add(x)); }
  remove(...c) { c.forEach(x => this.s.delete(x)); }
  toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); }
  contains(c) { return this.s.has(c); }
}
class El {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this._html = '';
    this.style = {}; this.dataset = {}; this.classList = new CList();
    this.hidden = false; this.value = ''; this.textContent = '';
    this._listeners = {}; this._attrs = {};
    this._span = { textContent: '' };
    this.options = []; this.selectedIndex = 0;
    this.parentElement = null;
    this.scrollWidth = 0; this.clientWidth = 0; this.scrollLeft = 0;
    this.scrollHeight = 0; this.scrollTop = 0;
  }
  set innerHTML(v) { this._html = v; }
  get innerHTML() { return this._html; }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
  removeEventListener() { }
  querySelectorAll() { return []; }
  querySelector(sel) {
    if (sel === '.btn-label' || sel === 'span' || sel === '.ln-age') return this._span;
    return null;
  }
  closest() { return null; }
  appendChild(c) { this.children.push(c); }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return this._attrs[k]; }
  removeAttribute(k) { delete this._attrs[k]; }
  getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; }
  scrollTo() {} scrollIntoView() {} focus() {}
  get offsetHeight() { return 120; }
  get offsetWidth() { return 120; }
}

const ids = {};
const mk = (id) => (ids[id] = new El());
['chartForm', 'formPanel', 'resultSection', 'emptyState', 'year', 'month', 'day',
  'lunarHint', 'shichenGrid', 'trueSolar', 'longitudeRow', 'longitude', 'formError',
  'submitBtn', 'resetBtn', 'infoName', 'infoSub', 'infoChips', 'chart', 'liunianYear',
  'liunianMeta', 'yearPrev', 'yearNext', 'yearNow', 'drawer', 'drawerMask',
  'drawerTitle', 'drawerSub', 'drawerBody', 'drawerClose',
  'readingPanel', 'readingLead', 'readingTags', 'readingBlocks', 'readingFocus',
  'yearPanel', 'yearTitle', 'yearLead', 'yearDaxian', 'yearHua',
  'guideList', 'openGlossary', 'glossary', 'glossaryMask', 'glossaryClose',
  'glossSearch', 'glossList', 'termPop', 'termPopName', 'termPopText', 'termPopClose',
  'actCopy', 'actSave', 'actFavs', 'favCount', 'favDrawer', 'favMask', 'favClose',
  'favList', 'favSub', 'favClear', 'toast',
  'actExport', 'actPrint', 'exportModal', 'exportMask', 'exportPreview',
  'exportClose', 'exportCancel', 'exportDownload',
  'liunianMonth', 'monthBlock', 'monthTitle', 'monthLead', 'monthHua', 'daxianTrack',
  'actStars', 'starDrawer', 'starMask', 'starClose', 'starSearch', 'starList',
  'actCompat', 'compatModal', 'compatMask', 'compatClose', 'compatForm', 'compatResult',
  'compatFoot', 'compatGo', 'compatBack', 'compatFromFav', 'compatHint',
  'cYear', 'cMonth', 'cDay', 'cShichenGrid',
  'liunianDate', 'liunianHour', 'dayPrev', 'dayNext', 'dayToday', 'dayMeta',
  'dayBlock', 'dayTitle', 'dayLead', 'dayHua',
  'hourBlock', 'hourTitle', 'hourFoldTitle', 'hourLead', 'hourHua',
  'navDemo', 'navReset'].forEach(mk);

global.document = {
  getElementById: (id) => ids[id] || mk(id),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => { },
  createElement: (t) => new El(t),
  body: new El('body'),
  documentElement: new El('html'),
};
global.document.body.appendChild = () => { };
global.document.body.removeChild = () => { };
global.window = global;
global.innerWidth = 1200; global.innerHeight = 900;
global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;
global.console = console;
global.scrollTo = () => { };
global.addEventListener = () => { }; global.removeEventListener = () => { };
global.Event = class Event { constructor(t, o) { this.type = t; this.bubbles = !!(o && o.bubbles); } };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
global.matchMedia = () => ({ matches: false, addEventListener() { }, removeEventListener() { } });
global.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe() { } unobserve() { } disconnect() { } };
global.localStorage = (() => {
  const s = {};
  return { getItem: (k) => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: (k) => { delete s[k]; } };
})();
global.location = { search: '', href: 'http://localhost/', pathname: '/index.html', protocol: 'http:' };
global.history = { replaceState: () => { } };
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };
global.CSS = { escape: (s) => String(s) };
global.URL = global.URL || {};
global.URL.createObjectURL = () => 'blob:x'; global.URL.revokeObjectURL = () => { };
global.Blob = class { };
global.prompt = () => 'x'; global.confirm = () => true; global.print = () => { };
global.URLSearchParams = URLSearchParams;
global.PointerEvent = class extends global.Event { };

const origCreate = global.document.createElement;
global.document.createElement = (t) => {
  if (t === 'canvas') {
    const noop = () => { };
    return {
      width: 0, height: 0, style: {},
      getContext: () => ({
        scale: noop, fillRect: noop, strokeRect: noop, fillText: noop,
        beginPath: noop, moveTo: noop, lineTo: noop, arcTo: noop, closePath: noop,
        stroke: noop, fill: noop, measureText: () => ({ width: 20 }), save: noop, restore: noop,
      }),
      toBlob: (cb) => cb(new global.Blob()),
    };
  }
  return origCreate(t);
};

global.ZWStore = require('./js/store.js');
global.ZWInterpret = require('./js/interpret.js');
// app.js 里通过 window.iztro 取排盘引擎
const iztro = require('iztro');
global.iztro = iztro;
global.window.iztro = iztro;
// 暴露 buildChartHTML：app.js 在 IIFE 内，通过一个测试钩子导出
const appSrc = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
eval(appSrc);

const build = global.window.__ziwei && global.window.__ziwei.buildChartHTML;
if (typeof build !== 'function') {
  console.error('✗ 无法获取 buildChartHTML（测试钩子未生效）');
  process.exit(1);
}

let pass = 0, fail = 0;
function t(name, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

const A = astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
const B = astro.bySolar('1990-5-20', 3, '女', true, 'zh-CN');

console.log('=== 基本结构 ===\n');
const html = build(A, {});
t('能生成 HTML', typeof html === 'string' && html.length > 500, html.length + ' 字符');

const countCells = (h) => (h.match(/class="cell[ "]/g) || []).length;
t('12 个宫位格', countCells(html) === 12, countCells(html) + ' 格');
t('含中心区', html.includes('center-box'));
t('含命宫标记', html.includes('is-ming'));
t('含身宫标记', html.includes('shen-mark'));

// 坐标唯一性
const coords = [...html.matchAll(/grid-row:(\d+);grid-column:(\d+)/g)].map(m => m[1] + ',' + m[2]);
const outer = coords.filter(c => c !== '2,2');
t('网格坐标唯一', new Set(coords).size === coords.length, coords.length + ' 个坐标');
t('中心区占 2/2（跨行跨列）', html.includes('grid-row:2 / 4;grid-column:2 / 4'));

console.log('\n=== interactive 选项 ===\n');
const inter = build(A, { interactive: true });
const nonInter = build(A, { interactive: false });
t('interactive=true 时有星名按钮', (inter.match(/star-btn/g) || []).length > 0,
  (inter.match(/star-btn/g) || []).length + ' 个');
t('interactive=false 时无按钮', (nonInter.match(/star-btn/g) || []).length === 0);
t('非交互仍保留星名文字', nonInter.includes('紫微') || nonInter.includes('天府'));

console.log('\n=== showDecadal / showMarks ===\n');
const noDx = build(A, { showDecadal: false });
t('showDecadal=false 时无大限数字', !/cell-decadal/.test(noDx));
t('showDecadal=true 时有大限数字', /cell-decadal/.test(build(A, { showDecadal: true })));

const noMarks = build(A, { showMarks: false });
t('showMarks=false 时无身宫标记', !noMarks.includes('shen-mark'));

const compact = build(A, { compact: true });
t('compact 会加 is-compact 类', compact.includes('is-compact'));

console.log('\n=== 高亮与脉冲 ===\n');
const h = A.horoscope('2026-06-15');
const withLn = build(A, {
  liunianPalaceNames: h.yearly.palaceNames,
  currentDaxianIndex: 4,
});
t('流年命宫高亮存在', withLn.includes('is-liunian-ming'));
t('当前大限高亮存在', withLn.includes('is-current-daxian'));

const pulsed = build(A, {
  liunianPalaceNames: h.yearly.palaceNames,
  currentDaxianIndex: 4,
  pulse: true,
});
t('pulse=true 时产生 is-pulse', pulsed.includes('is-pulse'));

const noPulse = build(A, {
  liunianPalaceNames: h.yearly.palaceNames,
  currentDaxianIndex: 4,
  pulse: false,
});
t('pulse=false 时无 is-pulse', !noPulse.includes('is-pulse'));

console.log('\n=== 多命盘稳定性 ===\n');
let allOk = true;
[['2000-8-16', 6, '男'], ['1990-5-20', 3, '女'], ['1984-2-2', 0, '男'],
['2024-2-10', 6, '男'], ['1975-11-8', 9, '女']].forEach(([d, tm, g]) => {
  const c = astro.bySolar(d, tm, g, true, 'zh-CN');
  const out = build(c, { interactive: false, compact: true, showDecadal: false });
  const n = countCells(out);
  const cd = [...out.matchAll(/grid-row:(\d+);grid-column:(\d+)/g)].map(m => m[1] + ',' + m[2]);
  const ok = n === 12 && new Set(cd).size === cd.length;
  if (!ok) allOk = false;
  console.log((ok ? '  OK  ' : '  FAIL') + ` ${d} ${g} | ${n} 格 | 坐标 ${new Set(cd).size} 个`);
});
t('所有命例结构正确', allOk);

console.log('\n=== 中心区品牌水印 ===\n');

const withBrand = build(A, {});
t('默认含 center-brand', withBrand.includes('center-brand'));
t('水印文本为 FANSTAR', /<div class="center-brand"[^>]*>FANSTAR<\/div>/.test(withBrand));

const noBrand = build(A, { showBrand: false });
t('showBrand:false 时不渲染', !noBrand.includes('center-brand'));

// 水印必须在中心区结构内，不能跑到某个宫位格里。
// 中心区跨 2 行 2 列，用它的 grid 定位串来界定范围，
// 不能靠 <div> 配对（嵌套 div 会让简单正则失配）。
const centerStart = withBrand.indexOf('grid-row:2 / 4;grid-column:2 / 4');
const brandPos = withBrand.indexOf('center-brand');
// 中心区之后的下一个宫位格起点
const nextCell = withBrand.indexOf('class="cell', centerStart);
t('水印位于中心区内部',
  centerStart >= 0 && brandPos > centerStart && (nextCell < 0 || brandPos < nextCell),
  '中心区起点=' + centerStart + ' 水印=' + brandPos + ' 下一格=' + nextCell);

// 对比盘（compact + 非交互）也应带水印，因为它同样会被导出
const compactBrand = build(A, { compact: true, interactive: false });
t('对比盘也带水印', compactBrand.includes('center-brand'));

// 水印不能影响宫位格数
t('加品牌后仍是 12 格', (compactBrand.match(/class="cell[ "]/g) || []).length === 12);

console.log('\n=== 与主盘一致性 ===\n');
// 主盘渲染一次，确认用的是同一函数（结构应与 build 输出一致）
ids.chart.innerHTML = html;
t('主盘 DOM 可承载该 HTML', ids.chart.innerHTML.length === html.length);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);