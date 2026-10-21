/* 端到端测试：在 Node 中模拟浏览器环境跑 app.js
   验证：网格布局完整性、渲染不报错、关键数据正确 */
const fs = require('fs');
const path = require('path');

// --- 极简 DOM 模拟 ---
class El {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this._html = '';
    this.style = {}; this.dataset = {}; this.classList = new CList();
    this.hidden = false; this.value = ''; this.textContent = '';
    this._listeners = {};
    this._attrs = {};
    // 提供一个带 textContent 的子元素，供 querySelector('span') 使用
    this._span = { textContent: '' };
    // <select> 的 options（流月/流时初始化会读 length）
    this.options = [];
    this.selectedIndex = 0;
    this.parentElement = null;
    this.scrollWidth = 0;
    this.scrollHeight = 0;
    this.clientWidth = 0;
    this.scrollLeft = 0;
    this.scrollTop = 0;
  }
  set innerHTML(v) { this._html = v; }
  get innerHTML() { return this._html; }
  addEventListener(t, fn) { (this._listeners[t] = this._listeners[t] || []).push(fn); }
  removeEventListener(t, fn) {
    const a = this._listeners[t];
    if (a) this._listeners[t] = a.filter(f => f !== fn);
  }
  querySelectorAll() { return []; }
  querySelector(sel) {
    if (sel === '.btn-label' || sel === 'span') return this._span;
    if (sel === '.ln-age') return this._span;
    return null;
  }
  closest() { return null; }
  appendChild(c) { this.children.push(c); }
  setAttribute(k, v) { this._attrs[k] = String(v); }
  getAttribute(k) { return this._attrs[k]; }
  removeAttribute(k) { delete this._attrs[k]; }
  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
  scrollTo() {}
  scrollIntoView() {}
  focus() {}
  get offsetHeight() { return 120; }
  get offsetWidth() { return 120; }
}
class CList {
  constructor() { this.s = new Set(); }
  add(...c) { c.forEach(x => this.s.add(x)); }
  remove(...c) { c.forEach(x => this.s.delete(x)); }
  toggle(c, on) { on ? this.s.add(c) : this.s.delete(c); }
  contains(c) { return this.s.has(c); }
}

const ids = {};
const mk = (id) => (ids[id] = new El());

['chartForm', 'formPanel', 'resultSection', 'emptyState', 'year', 'month', 'day',
  'lunarHint', 'leapRow', 'isLeapMonth', 'leapLabel', 'leapHint',
  'shichenGrid', 'trueSolar', 'longitudeRow', 'longitude', 'formError',
  'submitBtn', 'resetBtn', 'infoName', 'infoSub', 'infoChips', 'chart', 'liunianYear',
  'liunianMeta', 'yearPrev', 'yearNext', 'yearNow', 'drawer', 'drawerMask',
  'drawerTitle', 'drawerSub', 'drawerBody', 'drawerClose',
  // 白话解读相关
  'readingPanel', 'readingLead', 'readingTags', 'readingBlocks', 'readingFocus',
  'palaceGrid',
  'sameChartBlock', 'sameChartExplain', 'sameChartHead', 'sameChartList', 'sameChartCaveat',
  'yearPanel', 'yearTitle', 'yearLead', 'yearDaxian', 'yearHua',
  'guideList', 'openGlossary', 'glossary', 'glossaryMask', 'glossaryClose',
  'glossSearch', 'glossList', 'termPop', 'termPopName', 'termPopText', 'termPopClose',
  'actCopy', 'actSave', 'actFavs', 'favCount', 'favDrawer', 'favMask', 'favClose',
  'favList', 'favSub', 'favClear', 'toast',
  'actExport', 'actPrint', 'exportModal', 'exportMask', 'exportPreview',
  'exportClose', 'exportCancel', 'exportDownload',
  'liunianMonth', 'monthBlock', 'monthTitle', 'monthLead', 'monthHua', 'daxianTrack', 'daxianDetail',
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
  addEventListener: () => {},
  createElement: (t) => new El(t),
  body: new El('body'),
  documentElement: new El('html'),
};
global.document.body.appendChild = () => {};
global.document.body.removeChild = () => {};
global.window = global;
global.innerWidth = 1200;
global.innerHeight = 900;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.console = console;
global.scrollTo = () => {};
global.Event = class Event {
  constructor(type, opts) { this.type = type; this.bubbles = !!(opts && opts.bubbles); }
};
// 动效相关 API 的替身
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
global.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.IntersectionObserver = class {
  constructor(cb) { this.cb = cb; }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 持久化相关替身
global.localStorage = (() => {
  const s = {};
  return {
    getItem: (k) => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; },
    clear: () => { Object.keys(s).forEach((k) => delete s[k]); },
  };
})();
global.location = { search: '', href: 'http://localhost/index.html', pathname: '/index.html', protocol: 'http:' };
global.history = { replaceState: () => {} };
global.navigator = {
  clipboard: { writeText: () => Promise.resolve() },
  // 无 serviceWorker，走「不支持」分支（file:// 与旧浏览器同理）
};
global.CSS = global.CSS || { escape: (s) => String(s) };
// window 事件（离线状态提示用）
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.URLSearchParams = URLSearchParams;
global.PointerEvent = class PointerEvent extends global.Event {
  constructor(type, opts) {
    super(type, opts || {});
    this.clientX = (opts && opts.clientX) || 0;
    this.clientY = (opts && opts.clientY) || 0;
  }
};

// 载入持久化模块
const ZWStoreMod = require('./js/store.js');
global.ZWStore = ZWStoreMod;
global.window.ZWStore = ZWStoreMod;

// 载入闰月工具（含预生成的农历查找表）
const ZWLunarTableMod = require('./js/lunar-table.js');
global.ZWLunarTable = ZWLunarTableMod;
global.window.ZWLunarTable = ZWLunarTableMod;
const ZWLeapMod = require('./js/leap.js');
global.ZWLeap = ZWLeapMod;
global.window.ZWLeap = ZWLeapMod;

// 弹窗 / 打印 / 导出替身
global.prompt = () => '测试收藏';
global.confirm = () => true;
global.print = () => {};
global.URL = global.URL || {};
global.URL.createObjectURL = () => 'blob:test';
global.URL.revokeObjectURL = () => {};
global.CSS = global.CSS || { escape: (s) => String(s) };
global.Blob = class Blob { constructor() { } };
// canvas 替身：drawChart 需要 document.createElement('canvas') 返回可绘制对象
const origCreate = global.document.createElement;
global.document.createElement = (t) => {
  if (t === 'canvas') {
    const noop = () => {};
    return {
      width: 0, height: 0, style: {},
      getContext: () => ({
        scale: noop, fillRect: noop, strokeRect: noop, fillText: noop,
        beginPath: noop, moveTo: noop, lineTo: noop, arcTo: noop, closePath: noop,
        stroke: noop, fill: noop, measureText: () => ({ width: 20 }),
        save: noop, restore: noop, clearRect: noop,
      }),
      toBlob: (cb) => cb(new global.Blob()),
    };
  }
  return origCreate(t);
};

// --- 载入 iztro ---
// dist/iztro.min.js 是 UMD 包：浏览器中通过 <script> 挂到 self/window。
// 这里直接用 npm 包（lib/index.js），API 完全相同，验证的是同一套逻辑。
global.self = global;
const iztro = require('iztro');
global.iztro = iztro;
global.window.iztro = iztro;

// --- 载入白话解读知识库 ---
const ZW = require('./js/interpret.js');
global.ZWInterpret = ZW;
global.window.ZWInterpret = ZW;

// 星 × 宫位 情境库（interpret.js 依赖它给出逐宫解读）
const ZWSPMod = require('./js/star-palace.js');
global.ZWStarPalace = ZWSPMod;
global.window.ZWStarPalace = ZWSPMod;

// --- 载入 app.js ---
const appSrc = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
try {
  eval(appSrc);
  console.log('✓ app.js 载入无异常');
} catch (e) {
  console.error('✗ app.js 载入失败:', e.message);
  process.exit(1);
}

// --- 手动触发排盘 ---
ids.year.value = '2000';
ids.month.value = '8';
ids.day.value = '16';
ids.longitude.value = '120';
ids.liunianYear.value = '2026';

const submit = ids.chartForm._listeners['submit'];
if (!submit) { console.error('✗ 未绑定 submit 事件'); process.exit(1); }
submit[0]({ preventDefault() {} });

console.log('✓ 排盘执行完成');
console.log('  信息:', ids.infoName.textContent);
console.log('  副信息:', ids.infoSub.textContent);
console.log('  chips:', ids.infoChips.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

// --- 白话解读 ---
console.log('\n--- 白话解读 ---');
const strip = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
console.log('  一句话:', strip(ids.readingLead.innerHTML));
console.log('  标签:', strip(ids.readingTags.innerHTML));
const blocks = (ids.readingBlocks.innerHTML.match(/class="rblock[ "]/g) || []).length;
console.log('  优势/课题/建议块数:', blocks, blocks >= 3 ? '✓' : '✗ 应≥3');
const focus = (ids.readingFocus.innerHTML.match(/class="focus-item/g) || []).length;
console.log('  四化要点数:', focus, focus === 4 ? '✓' : '✗ 应为 4');
console.log('  四化首条:', strip(ids.readingFocus.innerHTML).slice(0, 56));

// 十二宫逐宫解读：这是本命解读信息量的关键，
// 缺了它，不同命盘只能读出十几种结果
const pcards = (ids.palaceGrid.innerHTML.match(/class="palace-card"/g) || []).length;
console.log('  十二宫卡片数:', pcards, pcards === 12 ? '✓' : '✗ 应为 12');
const plines = (ids.palaceGrid.innerHTML.match(/class="pg-line"/g) || []).length;
console.log('  逐宫解读条目数:', plines, plines >= 30 ? '✓' : '✗ 应≥30（12宫×3条）');
console.log('  首张卡片:', strip(ids.palaceGrid.innerHTML).slice(0, 70));
const guide = (ids.guideList.innerHTML.match(/class="guide-item/g) || []).length;
console.log('  新手导读步数:', guide, guide === 4 ? '✓' : '✗ 应为 4');
console.log('  信息条注解:', (ids.infoChips.innerHTML.match(/data-term=/g) || []).length, '处');

// --- 流年白话 ---
console.log('\n--- 流年白话 ---');
console.log('  标题:', ids.yearTitle.textContent);
console.log('  结论:', ids.yearLead.textContent);
console.log('  大限:', ids.yearDaxian.textContent);
const yhua = (ids.yearHua.innerHTML.match(/class="yhua-item/g) || []).length;
console.log('  流年四化:', yhua, yhua === 4 ? '✓' : '✗ 应为 4');

// --- 校验星盘 HTML ---
const html = ids.chart.innerHTML;
const cellCount = (html.match(/class="cell[ "]/g) || []).length;
console.log('  宫位格数:', cellCount, cellCount === 12 ? '✓' : '✗ 应为 12');
console.log('  含中心区:', html.includes('center-box') ? '✓' : '✗');
console.log('  含身宫标记:', html.includes('shen-mark') ? '✓' : '✗');
console.log('  含流年命宫标记:', html.includes('ln-mark') ? '✓' : '✗');

// 校验网格坐标唯一性
const coords = [...html.matchAll(/grid-row:(\d);grid-column:(\d)/g)].map(m => m[1] + ',' + m[2]);
const outerCoords = coords.slice(0, 12);
const uniq = new Set(outerCoords);
console.log('  网格坐标:', outerCoords.join(' | '));
console.log('  坐标唯一:', uniq.size === 12 ? '✓' : '✗ 有重复!');

// 期望的十二宫位置
const EXPECT = { '巳': '1,1', '午': '1,2', '未': '1,3', '申': '1,4', '辰': '2,1', '酉': '2,4', '卯': '3,1', '戌': '3,4', '寅': '4,1', '丑': '4,2', '子': '4,3', '亥': '4,4' };
console.log('  期望坐标:', Object.values(EXPECT).join(' | '));

// --- 流年信息 ---
console.log('  流年元信息:', ids.liunianMeta.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

// --- 测试抽屉 ---
console.log('\n--- 抽屉测试 ---');
for (let i = 0; i < 12; i++) {
  try {
    // 通过 chart.innerHTML 里的 data-idx 找到点击处理
    // app.js 内部绑定在每个 .cell 上，这里直接调用 openDrawer 不可得，
    // 改为验证 renderCenter 与本命四化已进入 HTML
  } catch (e) { }
}
console.log('  中心四化区:', html.includes('center-sihua') ? '✓' : '✗');
console.log('  本命四化内容:', (html.match(/class="cs-row"/g) || []).length, '行');

// --- 多命例回归 ---
console.log('\n--- 多命例回归 ---');
const cases = [
  ['1984-2-2', 0, '男'], ['1990-5-20', 3, '女'], ['2024-2-10', 6, '男'],
  ['1975-11-8', 9, '女'], ['2005-7-1', 11, '男'],
];
for (const [d, t, g] of cases) {
  const a = global.iztro.astro.bySolar(d, t, g, true, 'zh-CN');
  const h = a.horoscope('2026-6-1');
  console.log(`  ${d} ${g} | ${a.fiveElementsClass} | 命宫${a.earthlyBranchOfSoulPalace} | 流年${h.yearly.heavenlyStem}${h.yearly.earthlyBranch} 虚岁${h.age.nominalAge}`);
}
console.log('\n全部检查完成。');