/* ============================================================
   紫微斗数 星盘应用
   引擎：iztro (https://github.com/SylarLong/iztro)
   ============================================================ */
(function () {
  'use strict';

  const { astro } = window.iztro;

  /* ---------------- 常量 ---------------- */

  // 十二地支
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 时辰定义：索引 = 时支索引（0=子时）
  const SHICHEN = [
    { name: '子时', range: '23:00-00:59', zhi: 0 },
    { name: '丑时', range: '01:00-02:59', zhi: 1 },
    { name: '寅时', range: '03:00-04:59', zhi: 2 },
    { name: '卯时', range: '05:00-06:59', zhi: 3 },
    { name: '辰时', range: '07:00-08:59', zhi: 4 },
    { name: '巳时', range: '09:00-10:59', zhi: 5 },
    { name: '午时', range: '11:00-12:59', zhi: 6 },
    { name: '未时', range: '13:00-14:59', zhi: 7 },
    { name: '申时', range: '15:00-16:59', zhi: 8 },
    { name: '酉时', range: '17:00-18:59', zhi: 9 },
    { name: '戌时', range: '19:00-20:59', zhi: 10 },
    { name: '亥时', range: '21:00-22:59', zhi: 11 },
  ];

  /* 4×4 网格中，十二地支的坐标 [row, col]
     传统盘式：寅在左下，顺时针绕行
     巳 午 未 申
     辰         酉
     卯         戌
     寅 丑 子 亥                                         */
  const GRID_POS = {
    '巳': [1, 1], '午': [1, 2], '未': [1, 3], '申': [1, 4],
    '辰': [2, 1], '酉': [2, 4],
    '卯': [3, 1], '戌': [3, 4],
    '寅': [4, 1], '丑': [4, 2], '子': [4, 3], '亥': [4, 4],
  };

  /* 四化 → CSS 后缀 */
  const HUA_KEY = { '禄': 'lu', '权': 'quan', '科': 'ke', '忌': 'ji' };

  /* 合盘：对方的信息与排出的盘（声明提前，避免 TDZ） */
  const compatState = { gender: '女', shichen: 3, chart: null, input: null };

  /* 四化样式 */
  const HUA_CLASS = { '禄': 'tag-lu', '权': 'tag-quan', '科': 'tag-ke', '忌': 'tag-ji' };
  const HUA_COLOR = { '禄': '#4a8f78', '权': '#c9a227', '科': '#3f6f9f', '忌': '#b23a2e' };

  /* ---------------- 状态 ---------------- */
  const state = {
    chart: null,       // iztro astrolabe
    input: null,       // 用户输入
    liunian: null,     // 当前流年 horoscope
    liunianYear: new Date().getFullYear(),
    liunianMonth: new Date().getMonth() + 1,   // 流月（1-12），影响 monthly 数据
    liunianHour: null,  // 流时时辰索引，null 表示尚未初始化（取当前时辰）
    currentDaxianIndex: null,
    playEnter: false,  // 是否播放入场动效（仅新起盘时）
    pulseOnRender: false, // 是否让高亮宫位脉冲（流年切换时）
    chartRendered: false, // 盘面 DOM 是否已建立（切流年时复用）
    lastAge: null,     // 上一次的虚岁，用于数字滚动
    _enterTimer: null,
  };

  /* ---------------- DOM ---------------- */
  const $ = (id) => document.getElementById(id);
  const el = {
    form: $('chartForm'),
    formPanel: $('formPanel'),
    resultSection: $('resultSection'),
    emptyState: $('emptyState'),
    year: $('year'), month: $('month'), day: $('day'),
    lunarHint: $('lunarHint'),
    leapRow: $('leapRow'),
    isLeapMonth: $('isLeapMonth'),
    leapLabel: $('leapLabel'),
    leapHint: $('leapHint'),
    shichenGrid: $('shichenGrid'),
    trueSolar: $('trueSolar'),
    longitudeRow: $('longitudeRow'),
    longitude: $('longitude'),
    formError: $('formError'),
    submitBtn: $('submitBtn'),
    resetBtn: $('resetBtn'),
    navDemo: $('navDemo'),
    navReset: $('navReset'),
    // 白话解读
    readingPanel: $('readingPanel'),
    readingLead: $('readingLead'),
    readingTags: $('readingTags'),
    readingBlocks: $('readingBlocks'),
    readingFocus: $('readingFocus'),
    palaceGrid: $('palaceGrid'),
    sameChartBlock: $('sameChartBlock'),
    sameChartExplain: $('sameChartExplain'),
    sameChartHead: $('sameChartHead'),
    sameChartList: $('sameChartList'),
    sameChartCaveat: $('sameChartCaveat'),
    // 流年白话
    yearPanel: $('yearPanel'),
    yearTitle: $('yearTitle'),
    yearLead: $('yearLead'),
    yearDaxian: $('yearDaxian'),
    yearHua: $('yearHua'),
    liunianMonth: $('liunianMonth'),
    monthBlock: $('monthBlock'),
    monthTitle: $('monthTitle'),
    monthLead: $('monthLead'),
    monthHua: $('monthHua'),
    daxianTrack: $('daxianTrack'),
    daxianDetail: $('daxianDetail'),
    // 流日 / 流时
    liunianDate: $('liunianDate'),
    liunianHour: $('liunianHour'),
    dayPrev: $('dayPrev'),
    dayNext: $('dayNext'),
    dayToday: $('dayToday'),
    dayMeta: $('dayMeta'),
    dayBlock: $('dayBlock'),
    dayTitle: $('dayTitle'),
    dayLead: $('dayLead'),
    dayHua: $('dayHua'),
    hourBlock: $('hourBlock'),
    hourFoldTitle: $('hourFoldTitle'),
    hourLead: $('hourLead'),
    hourHua: $('hourHua'),
    // 星曜图鉴
    actStars: $('actStars'),
    starDrawer: $('starDrawer'),
    starMask: $('starMask'),
    starClose: $('starClose'),
    starSearch: $('starSearch'),
    starList: $('starList'),
    // 合盘
    actCompat: $('actCompat'),
    compatModal: $('compatModal'),
    compatMask: $('compatMask'),
    compatClose: $('compatClose'),
    compatForm: $('compatForm'),
    compatResult: $('compatResult'),
    compatFoot: $('compatFoot'),
    compatGo: $('compatGo'),
    compatBack: $('compatBack'),
    compatFromFav: $('compatFromFav'),
    compatHint: $('compatHint'),
    cYear: $('cYear'), cMonth: $('cMonth'), cDay: $('cDay'),
    cShichenGrid: $('cShichenGrid'),
    // 导读与词典
    guideList: $('guideList'),
    openGlossary: $('openGlossary'),
    glossary: $('glossary'),
    glossaryMask: $('glossaryMask'),
    glossaryClose: $('glossaryClose'),
    glossSearch: $('glossSearch'),
    glossList: $('glossList'),
    termPop: $('termPop'),
    termPopName: $('termPopName'),
    termPopText: $('termPopText'),
    termPopClose: $('termPopClose'),
    // 操作栏 / 收藏 / 提示
    actCopy: $('actCopy'),
    actSave: $('actSave'),
    actFavs: $('actFavs'),
    favCount: $('favCount'),
    favDrawer: $('favDrawer'),
    favMask: $('favMask'),
    favClose: $('favClose'),
    favList: $('favList'),
    favSub: $('favSub'),
    favClear: $('favClear'),
    toast: $('toast'),
    // 导出
    actExport: $('actExport'),
    actPrint: $('actPrint'),
    exportModal: $('exportModal'),
    exportMask: $('exportMask'),
    exportPreview: $('exportPreview'),
    exportClose: $('exportClose'),
    exportCancel: $('exportCancel'),
    exportDownload: $('exportDownload'),
    infoName: $('infoName'),
    infoSub: $('infoSub'),
    infoChips: $('infoChips'),
    chart: $('chart'),
    liunianYear: $('liunianYear'),
    liunianMeta: $('liunianMeta'),
    yearPrev: $('yearPrev'),
    yearNext: $('yearNext'),
    yearNow: $('yearNow'),
    drawer: $('drawer'),
    drawerMask: $('drawerMask'),
    drawerTitle: $('drawerTitle'),
    drawerSub: $('drawerSub'),
    drawerBody: $('drawerBody'),
    drawerClose: $('drawerClose'),
  };

  /* 表单状态 */
  const formState = {
    calendar: 'solar',
    gender: '男',
    shichen: 6, // 默认午时
  };

  /* ---------------- 初始化 ---------------- */

  function initShichen() {
    el.shichenGrid.innerHTML = SHICHEN.map((sc) => `
      <button type="button" class="sc-btn${sc.zhi === formState.shichen ? ' active' : ''}" data-zhi="${sc.zhi}">
        <span class="sc-name">${sc.name}</span>
        <span class="sc-range">${sc.range}</span>
      </button>
    `).join('');

    el.shichenGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.sc-btn');
      if (!btn) return;
      formState.shichen = Number(btn.dataset.zhi);
      el.shichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.zhi) === formState.shichen);
      });
    });
  }

  function initSegs() {
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        const name = seg.dataset.name;
        formState[name] = btn.dataset.val;
        seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        if (name === 'calendar') {
          // 切到阳历时闰月选择无效，重置掉避免残留
          if (formState.calendar !== 'lunar' && el.isLeapMonth) el.isLeapMonth.checked = false;
          updateLunarHint();
        }
      });
    });
  }

  function initEvents() {
    el.form.addEventListener('submit', onSubmit);
    el.resetBtn.addEventListener('click', resetForm);

    // 合盘里也有一个分段控件（性别），它不走 formState，单独处理
    document.querySelectorAll('.seg[data-name="cgender"]').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const btn = e.target.closest('.seg-btn');
        if (!btn) return;
        compatState.gender = btn.dataset.val;
        seg.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    el.trueSolar.addEventListener('change', () => {
      el.longitudeRow.hidden = !el.trueSolar.checked;
    });

    // 日期输入时实时提示农历
    ['year', 'month', 'day'].forEach((k) => {
      el[k].addEventListener('input', updateLunarHint);
    });

    // 流年切换
    el.yearPrev.addEventListener('click', () => shiftYear(-1));
    el.yearNext.addEventListener('click', () => shiftYear(1));
    el.yearNow.addEventListener('click', () => {
      el.liunianYear.value = new Date().getFullYear();
      renderLiunian();
    });
    el.liunianYear.addEventListener('change', renderLiunian);
    el.liunianYear.addEventListener('input', () => {
      clearTimeout(el.liunianYear._t);
      el.liunianYear._t = setTimeout(renderLiunian, 400);
    });

    // 闰月勾选框：改变时重算提示
    if (el.isLeapMonth) {
      el.isLeapMonth.addEventListener('change', () => {
        const y = Number(el.year.value), m = Number(el.month.value), d = Number(el.day.value);
        if (y && m && d) updateLeapUI(y, m, d);
      });
    }

    // 流月切换
    if (el.liunianMonth) {
      el.liunianMonth.addEventListener('change', onMonthChange);
    }

    // 流日 / 流时
    if (el.liunianDate) el.liunianDate.addEventListener('change', onDayChange);
    if (el.dayPrev) el.dayPrev.addEventListener('click', () => shiftDay(-1));
    if (el.dayNext) el.dayNext.addEventListener('click', () => shiftDay(1));
    if (el.dayToday) {
      el.dayToday.addEventListener('click', () => {
        el.liunianDate.value = toDateInput(new Date());
        onDayChange();
        toast('已回到今天', 'ok');
      });
    }
    if (el.liunianHour) el.liunianHour.addEventListener('change', () => {
      state.liunianHour = Number(el.liunianHour.value) || 0;
      renderShortReading();
    });

    // 大限时间轴：点击跳到该阶段
    if (el.daxianTrack) {
      el.daxianTrack.addEventListener('click', onDaxianClick);
    }

    // 抽屉
    el.drawerClose.addEventListener('click', closeDrawer);
    el.drawerMask.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });

    // 导航：示例命盘 / 重新起盘
    if (el.navDemo) el.navDemo.addEventListener('click', loadDemo);
    if (el.navReset) el.navReset.addEventListener('click', resetForm);

    // 术语词典
    if (el.openGlossary) el.openGlossary.addEventListener('click', openGlossary);
    if (el.glossaryClose) el.glossaryClose.addEventListener('click', closeGlossary);
    if (el.glossaryMask) el.glossaryMask.addEventListener('click', closeGlossary);
    if (el.glossSearch) {
      el.glossSearch.addEventListener('input', (e) => renderGlossary(e.target.value));
    }

    // 术语气泡：事件委托，覆盖动态生成的注解
    document.addEventListener('click', (e) => {
      const t = e.target.closest('.term');
      if (t) {
        e.preventDefault();
        showTermPop(t.dataset.term, t);
        return;
      }
      // 点其它地方关闭气泡
      if (!e.target.closest('.term-pop')) hideTermPop();
    });

    if (el.termPopClose) el.termPopClose.addEventListener('click', hideTermPop);

    // 合盘
    if (el.actCompat) el.actCompat.addEventListener('click', openCompat);
    if (el.compatClose) el.compatClose.addEventListener('click', closeCompat);
    if (el.compatMask) el.compatMask.addEventListener('click', closeCompat);
    if (el.compatGo) el.compatGo.addEventListener('click', runCompat);
    if (el.compatFromFav) el.compatFromFav.addEventListener('click', compatPickFavorite);
    if (el.compatBack) {
      el.compatBack.addEventListener('click', () => {
        el.compatForm.hidden = false;
        el.compatResult.hidden = true;
        el.compatFoot.hidden = true;
      });
    }

    // 星曜图鉴
    if (el.actStars) el.actStars.addEventListener('click', () => openStars());
    if (el.starClose) el.starClose.addEventListener('click', closeStars);
    if (el.starMask) el.starMask.addEventListener('click', closeStars);
    if (el.starSearch) {
      el.starSearch.addEventListener('input', (e) => renderStarList(e.target.value));
    }

    // 点盘面上的星名 -> 打开图鉴并定位
    // 注意：宫位点击也在同一个委托里处理（见下），
    // 用捕获阶段先拦星名，避免同一次点击弹出两个面板。
    el.chart.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('.star-btn');
      if (!btn) return;
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      openStars(btn.dataset.star);
    }, true);

    // 宫位点击 -> 打开宫位详情（统一委托，不随重渲染重复绑定）
    el.chart.addEventListener('click', (e) => {
      // 星名有自己的处理器，这里跳过
      if (e.target.closest && e.target.closest('.star-btn')) return;
      const cell = e.target.closest && e.target.closest('.cell');
      if (!cell) return;
      // 对比盘是静态的，不响应
      if (cell.closest('.chart.is-static')) return;
      openDrawer(Number(cell.dataset.idx));
    });

    // 操作栏
    if (el.actCopy) el.actCopy.addEventListener('click', onCopyLink);
    if (el.actSave) el.actSave.addEventListener('click', onSaveFavorite);
    if (el.actFavs) el.actFavs.addEventListener('click', openFavorites);
    if (el.actExport) el.actExport.addEventListener('click', openExport);
    if (el.actPrint) el.actPrint.addEventListener('click', onPrint);

    // 导出弹层
    if (el.exportClose) el.exportClose.addEventListener('click', closeExport);
    if (el.exportCancel) el.exportCancel.addEventListener('click', closeExport);
    if (el.exportMask) el.exportMask.addEventListener('click', closeExport);
    if (el.exportDownload) el.exportDownload.addEventListener('click', onExportDownload);

    // 收藏夹
    if (el.favClose) el.favClose.addEventListener('click', closeFavorites);
    if (el.favMask) el.favMask.addEventListener('click', closeFavorites);
    if (el.favList) {
      el.favList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const li = btn.closest('.fav-item');
        if (!li) return;
        const id = li.dataset.id;
        if (btn.dataset.act === 'del') {
          deleteFavorite(id);
          renderFavorites();
          updateFavCount();
          toast('已删除该收藏', 'ok');
        } else {
          const item = readFavorites().find((x) => x.id === id);
          if (item) loadFavorite(item);
        }
      });
    }
    if (el.favClear) {
      el.favClear.addEventListener('click', () => {
        let yes = false;
        try { yes = window.confirm('确定清空全部收藏？此操作不可撤销。'); } catch (e) { yes = false; }
        if (!yes) return;
        const S = Store();
        if (S) S.clearFavorites();
        renderFavorites();
        updateFavCount();
        toast('收藏已清空', 'ok');
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideTermPop(); closeGlossary(); closeFavorites(); closeExport(); closeStars();
      }
    });
  }

  /** 示例命盘：一键填入并起盘，便于快速了解产品 */
  function loadDemo() {
    formState.calendar = 'solar';
    formState.gender = '男';
    formState.shichen = 6; // 午时

    // 同步分段控件与时辰按钮的选中态
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        const isCal = seg.dataset.name === 'calendar' && b.dataset.val === 'solar';
        const isGen = seg.dataset.name === 'gender' && b.dataset.val === '男';
        b.classList.toggle('active', isCal || isGen);
      });
    });
    el.shichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.zhi) === 6);
    });

    el.year.value = '2000';
    el.month.value = '8';
    el.day.value = '16';
    el.trueSolar.checked = false;
    el.longitudeRow.hidden = true;

    el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  /* ---------------- 农历提示 ---------------- */

  const LUNAR_MONTH_NAMES = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  const LUNAR_DAY_NAMES = [
    '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];

  function updateLunarHint() {
    const y = Number(el.year.value), m = Number(el.month.value), d = Number(el.day.value);
    if (!y || !m || !d || y < 1900 || y > 2100) {
      el.lunarHint.textContent = '';
      if (el.leapRow) el.leapRow.hidden = true;
      if (el.leapHint) el.leapHint.hidden = true;
      return;
    }

    try {
      if (formState.calendar === 'solar') {
        // 阳历输入：闰月开关无意义，隐藏
        if (el.leapRow) el.leapRow.hidden = true;
        if (el.leapHint) el.leapHint.hidden = true;

        // 借助 iztro 自身的农历换算，保证与排盘一致
        const probe = astro.bySolar(`${y}-${m}-${d}`, formState.shichen, formState.gender, true, 'zh-CN');
        const ld = probe.rawDates.lunarDate;
        el.lunarHint.textContent =
          `对应农历：${LUNAR_MONTH_NAMES[ld.lunarMonth] || ld.lunarMonth}月` +
          `${LUNAR_DAY_NAMES[ld.lunarDay] || ld.lunarDay}` +
          (ld.isLeap ? '（闰月）' : '') +
          `　·　${probe.chineseDate}`;
        return;
      }

      // 农历输入：检查该年该月是否真有闰月，决定是否显示开关
      updateLeapUI(y, m, d);
    } catch (err) {
      el.lunarHint.textContent = '';
    }
  }

  /**
   * 农历输入的闰月辅助。
   * 闰月与非闰月会排出不同的盘（后半月尤其明显），
   * 所以必须让用户能明确选择，而不是靠猜。
   */
  function updateLeapUI(y, m, d) {
    const LW = window.ZWLeap;
    if (!LW || !el.leapRow) return;

    let leapM = 0;
    try { leapM = LW.leapMonthOf(astro, y); } catch (e) { leapM = 0; }

    const isTargetLeap = leapM === m;

    // 只有该年该月确实有闰月时才显示开关
    el.leapRow.hidden = !isTargetLeap;
    if (isTargetLeap && el.leapLabel) {
      el.leapLabel.textContent = `闰${LUNAR_MONTH_NAMES[m] || m}月`;
    }
    if (!isTargetLeap && el.isLeapMonth) {
      el.isLeapMonth.checked = false;
    }

    const leap = isTargetLeap && el.isLeapMonth && el.isLeapMonth.checked;

    // 校验日期是否超出该月天数
    let maxDay = 30;
    try { maxDay = LW.daysInMonth(astro, y, m, leap) || 30; } catch (e) { maxDay = 30; }

    const dayName = LUNAR_DAY_NAMES[d] || (d + '日');
    const monthName = (leap ? '闰' : '') + (LUNAR_MONTH_NAMES[m] || m) + '月';

    if (d > maxDay) {
      el.lunarHint.textContent =
        `农历${monthName}只有 ${maxDay} 天，请把日期改到 1–${maxDay} 之间。`;
      if (el.lunarHint.classList) el.lunarHint.classList.add('is-warn');
    } else {
      el.lunarHint.textContent =
        `按农历 ${y} 年${monthName}${dayName} 排盘（该月共 ${maxDay} 天）。`;
      if (el.lunarHint.classList) el.lunarHint.classList.remove('is-warn');
    }

    // 该年有闰月、但不是用户选的这个月时，提示一下
    if (el.leapHint) {
      if (leapM && !isTargetLeap) {
        el.leapHint.hidden = false;
        el.leapHint.textContent =
          `提示：${y} 年有闰${LUNAR_MONTH_NAMES[leapM] || leapM}月。` +
          `如果你生在那个月，请把月份改成 ${leapM} 月，勾选框会自动出现。`;
      } else {
        el.leapHint.hidden = true;
      }
    }
  }

  /* ---------------- 提交 ---------------- */

  function onSubmit(e) {
    e.preventDefault();
    el.formError.hidden = true;

    const y = Number(el.year.value);
    const m = Number(el.month.value);
    const d = Number(el.day.value);

    if (!y || !m || !d) return showError('请填写完整的出生日期');
    if (y < 1900 || y > 2100) return showError('年份需在 1900–2100 之间');
    if (m < 1 || m > 12) return showError('月份需在 1–12 之间');
    if (d < 1 || d > 31) return showError('日期需在 1–31 之间');

    // 出生日期不能晚于今天。
    // 否则排盘不报错，却会算出负虚岁、大限/小限为空——看起来像程序坏了。
    const today = new Date();
    const todayNum = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const inputNum = y * 10000 + m * 100 + d;
    if (formState.calendar === 'solar' && inputNum > todayNum) {
      const t = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
      return showError(`出生日期不能晚于今天（${t}）。如果是要看未来运势，请先按真实生日起盘，再用流年查看。`);
    }

    // 农历要额外校验：该月实际天数（闰月与普通月可能不同）
    if (formState.calendar === 'lunar') {
      const LW = window.ZWLeap;
      if (LW) {
        const leap = !!(el.isLeapMonth && el.isLeapMonth.checked &&
          el.leapRow && !el.leapRow.hidden);
        let maxDay = 30;
        try { maxDay = LW.daysInMonth(astro, y, m, leap) || 30; } catch (e) { maxDay = 30; }
        if (d > maxDay) {
          return showError(
            `农历${leap ? '闰' : ''}${LUNAR_MONTH_NAMES[m] || m}月只有 ${maxDay} 天，请把日期改到 1–${maxDay} 之间。`);
        }
      }
    }

    const useTrueSolar = el.trueSolar.checked;
    const longitude = Number(el.longitude.value) || 120;

    setLoading(true);

    try {
      let astrolabe;
      let timeIndex = formState.shichen;
      let usedTrueSolar = false;
      let solarNote = '';

      if (formState.calendar === 'solar') {
        let dateStr = `${y}-${m}-${d}`;
        if (useTrueSolar) {
          const corr = applyTrueSolar(dateStr, timeIndex, longitude);
          dateStr = corr.dateStr;
          timeIndex = corr.timeIndex;
          usedTrueSolar = true;
          // 若校正改变了时辰或日期，明确告知用户
          const [cy, cm, cd] = dateStr.split('-').map(Number);
          const dateChanged = cy !== y || cm !== m || cd !== d;
          const timeChanged = timeIndex !== formState.shichen;
          if (dateChanged || timeChanged) {
            solarNote = `真太阳时校正后：${cy}-${cm}-${cd} ${SHICHEN[timeIndex].name}`;
          }
        }
        astrolabe = astro.bySolar(dateStr, timeIndex, formState.gender, true, 'zh-CN');
      } else {
        // 农历：第 4 参是 isLeapMonth。
        // 闰月与非闰月会排出不同的盘（iztro 的 fixLeap=true 把闰月前半月算上月、
        // 后半月算下月），所以必须把用户的选择如实传进去，不能写死 false。
        const leap = !!(el.isLeapMonth && el.isLeapMonth.checked &&
          el.leapRow && !el.leapRow.hidden);
        formState.isLeapMonth = leap;
        astrolabe = astro.byLunar(`${y}-${m}-${d}`, timeIndex, formState.gender, leap, true, 'zh-CN');
        if (leap) solarNote = `按农历闰${LUNAR_MONTH_NAMES[m] || m}月排盘`;
      }

      state.chart = astrolabe;
      state.input = {
        calendar: formState.calendar, gender: formState.gender,
        year: y, month: m, day: d, shichen: timeIndex,
        trueSolar: usedTrueSolar, longitude, solarNote,
        // 闰月标记要一起存下来，否则收藏/分享会排出另一张盘
        isLeapMonth: formState.calendar === 'lunar' ? !!formState.isLeapMonth : false,
      };
      state.liunianYear = new Date().getFullYear();
      el.liunianYear.value = state.liunianYear;

      // 流日默认今天，流月与流时跟随当前时间
      initDayControls();

      // 本次为新起盘：允许播放入场动效
      state.playEnter = true;
      state.chartRendered = false;   // 盘面需重建
      state.lastAge = null;          // 虚岁不做滚动（首次直接显示）

      el.formPanel.hidden = true;
      el.emptyState.hidden = true;
      el.resultSection.hidden = false;

      renderInfo();
      renderReading();
      renderGuide();
      renderLiunian();
      syncUrl();          // 状态写进 URL：刷新不丢、可直接分享
      updateFavCount();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error(err);
      showError('排盘失败：' + (err && err.message ? err.message : '请检查输入'));
    } finally {
      setLoading(false);
    }
  }

  /**
   * 真太阳时校正
   * 以所选时辰的代表时刻为基准，加经度时差与均时差，
   * 得到真太阳时后重新推导「日期 + 时支索引」。
   * 注意：校正可能跨日，也可能改变时辰，两者必须同时更新，
   *       否则日柱与时柱会不一致。
   * @returns {{dateStr:string, timeIndex:number}}
   */
  function applyTrueSolar(dateStr, timeIndex, longitude) {
    const [yy, mm, dd] = dateStr.split('-').map(Number);

    // 经度时差：每偏离东经120度1度，差4分钟
    const lonDiff = (longitude - 120) * 4;
    // 均时差（近似公式）
    const dt = new Date(Date.UTC(yy, mm - 1, dd));
    const doy = Math.floor((dt - Date.UTC(yy, 0, 1)) / 86400000) + 1;
    const B = (2 * Math.PI * (doy - 81)) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

    // 该时辰的代表时刻（取时辰中点，单位：小时）
    // 索引 0-11 对应 子…亥；索引 12 为晚子时（23:00-23:59），与早子时同属子时范畴
    const SHICHEN_MID = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23];
    const midHour = SHICHEN_MID[timeIndex] !== undefined ? SHICHEN_MID[timeIndex] : 12;

    let totalMin = midHour * 60 + 30 + lonDiff + eot; // +30 分取时辰中点
    let dayShift = 0;
    while (totalMin < 0) { totalMin += 1440; dayShift--; }
    while (totalMin >= 1440) { totalMin -= 1440; dayShift++; }

    const nd = new Date(Date.UTC(yy, mm - 1, dd + dayShift));
    const newDateStr = `${nd.getUTCFullYear()}-${nd.getUTCMonth() + 1}-${nd.getUTCDate()}`;

    // 由校正后的钟点重新推导时支索引
    const correctedHour = Math.floor(totalMin / 60);
    const newTimeIndex = hourToTimeIndex(correctedHour);

    return { dateStr: newDateStr, timeIndex: newTimeIndex };
  }

  /** 由 0-23 小时数推导 iztro 的 timeIndex（0=早子时 … 12=晚子时） */
  function hourToTimeIndex(hour) {
    const h = ((hour % 24) + 24) % 24;
    if (h === 23) return 12;      // 晚子时
    return Math.floor((h + 1) / 2); // 0-1→0, 2-3→1, ... 22-23→11
  }

  function showError(msg) {
    el.formError.textContent = msg;
    el.formError.hidden = false;
  }

  /** 起盘按钮的加载态 */
  function setLoading(on) {
    el.submitBtn.classList.toggle('is-loading', on);
    el.submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    // 注意文案节点是 .btn-label（按钮里还有一个图标 span）
    const label = el.submitBtn.querySelector('.btn-label');
    if (label) label.textContent = on ? '起 盘 中' : '起 盘';
  }

  function resetForm() {
    el.formPanel.hidden = false;
    el.resultSection.hidden = true;
    el.emptyState.hidden = false;
    state.chart = null;
    el.formError.hidden = true;
    el.lunarHint.textContent = '';

    // 闰月勾选必须一起清掉。
    // 否则重新起盘时会带着上一次的闰月状态，排出另一张盘而用户毫无察觉。
    if (el.isLeapMonth) el.isLeapMonth.checked = false;
    formState.isLeapMonth = false;
    if (el.leapRow) el.leapRow.hidden = true;
    if (el.leapHint) el.leapHint.hidden = true;
    if (el.lunarHint.classList) el.lunarHint.classList.remove('is-warn');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 持久化 / 分享 / 收藏 ---------------- */

  const Store = () => window.ZWStore;

  /** 把当前命盘状态写进 URL，刷新与分享都不丢 */
  function syncUrl() {
    const S = Store();
    if (!S || !state.input) return;
    try {
      const q = S.encodeState(state.input);
      const url = q ? `${location.pathname}?${q}` : location.pathname;
      history.replaceState(null, '', url);
    } catch (e) { /* 某些环境（file://）限制 replaceState，忽略 */ }
  }

  /** 轻提示 */
  let toastTimer = null;
  function toast(msg, tone) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.className = 'toast' + (tone ? ' is-' + tone : '');
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2400);
  }

  /** 复制文本，优先用 Clipboard API，降级到 execCommand */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // 降级：file:// 或旧浏览器下 clipboard 不可用
    return new Promise((resolve, reject) => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand && document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand failed'));
      } catch (e) { reject(e); }
    });
  }

  function onCopyLink() {
    const S = Store();
    if (!S || !state.input) return;
    const url = S.buildShareUrl(location.href, state.input);
    syncUrl();   // 保证地址栏也是最新的
    copyText(url).then(
      () => toast('链接已复制，发给别人就能看到这张命盘', 'ok'),
      () => toast('复制失败，可手动复制地址栏链接', 'warn')
    );
  }

  /* ---- 收藏夹 ---- */

  function readFavorites() {
    const S = Store();
    if (!S) return [];
    return S.storageAvailable() ? S.listFavorites() : S.listFavoritesFallback();
  }

  function pushFavorite(entry) {
    const S = Store();
    if (!S) return { ok: false, list: [] };
    return S.storageAvailable() ? S.addFavorite(entry) : S.addFavoriteFallback(entry);
  }

  function deleteFavorite(id) {
    const S = Store();
    if (!S) return [];
    return S.storageAvailable() ? S.removeFavorite(id) : [];
  }

  function updateFavCount() {
    if (!el.favCount) return;
    const n = readFavorites().length;
    el.favCount.textContent = String(n);
    el.favCount.hidden = n === 0;
  }

  /** 收藏当前命盘 */
  function onSaveFavorite() {
    const S = Store();
    if (!S || !state.chart || !state.input) return;

    const a = state.chart;
    const suggested = `${a.gender}命 ${a.solarDate}`;
    let label = '';
    try {
      label = (window.prompt('给这张命盘起个名字（可留空）', suggested) || '').trim();
    } catch (e) { label = ''; }
    // 用户点了取消（prompt 返回 null）时不保存
    if (label === null) return;
    if (!label) label = suggested;

    const r = pushFavorite({
      label,
      calendar: state.input.calendar,
      gender: state.input.gender,
      year: state.input.year,
      month: state.input.month,
      day: state.input.day,
      shichen: state.input.shichen,
      trueSolar: state.input.trueSolar,
      longitude: state.input.longitude,
      // 闰月必须一起存，否则回看时会排出另一张盘
      isLeapMonth: !!state.input.isLeapMonth,
      solarDate: a.solarDate,
      lunarDate: a.lunarDate,
      soulStar: (window.ZWInterpret ? (window.ZWInterpret.resolveSoulStars(a).stars.join('、') || '无主星') : ''),
    });

    if (!r.ok) {
      toast(r.reason === 'unavailable'
        ? '当前浏览器不允许本地存储，无法收藏'
        : '保存失败，请检查浏览器存储权限', 'warn');
      return;
    }
    updateFavCount();
    toast('已收藏「' + label + '」', 'ok');
  }

  /** 从收藏条目恢复命盘 */
  function loadFavorite(item) {
    formState.calendar = item.calendar === 'lunar' ? 'lunar' : 'solar';
    formState.gender = item.gender === '女' ? '女' : '男';
    formState.shichen = Number(item.shichen) || 0;

    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        const isCal = seg.dataset.name === 'calendar' && b.dataset.val === formState.calendar;
        const isGen = seg.dataset.name === 'gender' && b.dataset.val === formState.gender;
        b.classList.toggle('active', isCal || isGen);
      });
    });
    el.shichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.zhi) === formState.shichen);
    });

    el.year.value = item.year;
    el.month.value = item.month;
    el.day.value = item.day;
    el.trueSolar.checked = !!item.trueSolar;
    el.longitudeRow.hidden = !item.trueSolar;
    if (item.trueSolar && item.longitude) el.longitude.value = item.longitude;

    // 先让闰月开关按年份/月份显示出来，再恢复勾选状态
    if (el.isLeapMonth) el.isLeapMonth.checked = false;
    updateLunarHint();
    if (formState.calendar === 'lunar' && item.isLeapMonth && el.isLeapMonth) {
      el.isLeapMonth.checked = true;
    }
    formState.isLeapMonth = !!(item.isLeapMonth && formState.calendar === 'lunar');

    closeFavorites();
    el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  function renderFavorites() {
    if (!el.favList) return;
    const S = Store();
    const list = readFavorites();
    const available = S ? S.storageAvailable() : false;

    if (el.favSub) {
      el.favSub.textContent = available
        ? '保存在本机浏览器，清除浏览器数据会一并删除'
        : '当前浏览器不允许本地存储，收藏仅本次会话有效';
    }

    if (!list.length) {
      el.favList.innerHTML = '<li class="fav-empty">还没有收藏。起盘后点「收藏命盘」就能存下来，方便随时回看自己或家人的盘。</li>';
      if (el.favClear) el.favClear.hidden = true;
      return;
    }

    el.favList.innerHTML = list.map((f) => {
      const safe = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const shichenName = SHICHEN[f.shichen] ? SHICHEN[f.shichen].name : '';
      const calTag = f.calendar === 'lunar' ? '农历' + (f.isLeapMonth ? '闰' : '') : '阳历';
      return `
        <li class="fav-item" data-id="${safe(f.id)}">
          <button type="button" class="fav-open" data-act="open">
            <span class="fav-name">${safe(f.label || '未命名')}</span>
            <span class="fav-meta">${safe(f.gender)} · ${safe(calTag)} · ${safe(f.solarDate)} · ${safe(shichenName)}${f.soulStar ? ' · ' + safe(f.soulStar) : ''}</span>
          </button>
          <button type="button" class="fav-del" data-act="del" aria-label="删除这条收藏">✕</button>
        </li>`;
    }).join('');

    if (el.favClear) el.favClear.hidden = false;
  }

  function openFavorites() {
    renderFavorites();
    updateFavCount();   // 计数可能与上次渲染后不同步，打开时刷新
    el.favDrawer.hidden = false;
    el.favMask.hidden = false;
  }

  function closeFavorites() {
    el.favDrawer.hidden = true;
    el.favMask.hidden = true;
  }

  /**
   * 启动时尝试从 URL 恢复命盘。
   * 支持带参数直接打开（分享链接）或刷新后继续。
   * @returns {boolean} 是否成功恢复
   */
  function restoreFromUrl() {
    const S = Store();
    if (!S) return false;
    const st = S.decodeState(location.search);
    if (!st) return false;

    formState.calendar = st.calendar;
    formState.gender = st.gender;
    formState.shichen = st.shichen;

    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        const isCal = seg.dataset.name === 'calendar' && b.dataset.val === st.calendar;
        const isGen = seg.dataset.name === 'gender' && b.dataset.val === st.gender;
        b.classList.toggle('active', isCal || isGen);
      });
    });
    el.shichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.zhi) === st.shichen);
    });

    el.year.value = st.year;
    el.month.value = st.month;
    el.day.value = st.day;
    el.trueSolar.checked = st.trueSolar;
    el.longitudeRow.hidden = !st.trueSolar;
    el.longitude.value = st.longitude;

    // 恢复闰月：先让开关按年月渲染，再回填勾选
    if (el.isLeapMonth) el.isLeapMonth.checked = false;
    updateLunarHint();
    if (st.calendar === 'lunar' && st.isLeapMonth && el.isLeapMonth && !el.leapRow.hidden) {
      el.isLeapMonth.checked = true;
    }
    formState.isLeapMonth = !!(st.isLeapMonth && st.calendar === 'lunar');

    el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  }

  /* ---------------- 导出 ---------------- */

  let exportCanvas = null;

  /** 导出用的文件名：带上生辰，便于区分 */
  function exportFileName() {
    const a = state.chart;
    const g = state.input && state.input.gender === '女' ? '女' : '男';
    const d = (a && a.solarDate ? a.solarDate : 'chart').replace(/[^\d-]/g, '');
    return `紫微命盘-${g}-${d}.png`;
  }

  /** 生成图片并展示预览 */
  function openExport() {
    const EX = window.ZWExport;
    if (!EX || !state.chart) return;

    try {
      // 副标题带上当前查看的流年，导出的图才说明看清的是哪一年
      const sub = state.liunian
        ? `${state.liunianYear} 年（${state.liunian.yearly.heavenlyStem}${state.liunian.yearly.earthlyBranch}）流年 · 虚岁 ${state.liunian.age.nominalAge}`
        : '';
      exportCanvas = EX.drawChart(state.chart, { scale: 2, liunian: state.liunian, subtitle: sub });

      // 预览：用 CSS 宽度自适应，不放大像素
      exportCanvas.style.width = '100%';
      exportCanvas.style.height = 'auto';
      exportCanvas.style.display = 'block';
      exportCanvas.style.borderRadius = '3px';
      el.exportPreview.innerHTML = '';
      el.exportPreview.appendChild(exportCanvas);

      el.exportModal.hidden = false;
      el.exportMask.hidden = false;
    } catch (err) {
      console.error(err);
      toast('生成图片失败，可改用「打印 / 存 PDF」', 'warn');
    }
  }

  function closeExport() {
    el.exportModal.hidden = true;
    el.exportMask.hidden = true;
    el.exportPreview.innerHTML = '';
    exportCanvas = null;
  }

  function onExportDownload() {
    const EX = window.ZWExport;
    if (!EX || !exportCanvas) return;
    EX.downloadCanvas(exportCanvas, exportFileName()).then(
      () => toast('图片已保存', 'ok'),
      () => toast('保存失败，可长按预览图另存', 'warn')
    );
  }

  /** 打印：浏览器自带「另存为 PDF」 */
  function onPrint() {
    closeExport();
    // 让打印样式生效后再调起打印对话框
    setTimeout(() => {
      try { window.print(); }
      catch (e) { toast('当前环境不支持打印', 'warn'); }
    }, 60);
  }

  /* ---------------- 流月 ---------------- */

  /** 初始化月份下拉（按农历月概念，但用公历月份选择更直观） */
  function initMonthSelect() {
    if (!el.liunianMonth) return;
    el.liunianMonth.innerHTML = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return `<option value="${m}">${m} 月</option>`;
    }).join('');
    // 默认当前月份，并同步进 state（流月数据依赖它）
    state.liunianMonth = new Date().getMonth() + 1;
    el.liunianMonth.value = String(state.liunianMonth);
  }

  function renderMonthReading() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    const h = state.liunian;
    if (!ZW || !h || !el.monthBlock || !el.liunianMonth) return;

    const month = Number(el.liunianMonth.value) || 1;
    const mr = ZW.buildMonthReading(a, h, state.liunianYear, month);
    if (!mr) { el.monthBlock.hidden = true; return; }

    el.monthBlock.hidden = false;
    el.monthTitle.textContent = `${mr.year} 年 ${mr.month} 月 · ${mr.ganZhi}月`;
    el.monthLead.textContent = mr.headline;
    el.monthHua.innerHTML = mr.hua.map((x) => `
      <li class="yhua-item is-${x.tone}">
        <span class="focus-hua tag tag-${HUA_KEY[x.hua]}">${x.hua}</span>
        <span class="yhua-text">${x.sentence}</span>
      </li>
    `).join('');
  }

  /** 切换流月：把流日移到该月的同一天，四层数据保持同源 */
  function onMonthChange() {
    if (!state.chart || !el.liunianMonth) return;
    const v = Number(el.liunianMonth.value);
    if (!Number.isInteger(v) || v < 1 || v > 12) return;
    state.liunianMonth = v;

    const yr = Number(el.liunianYear.value);

    // 同步流日日期到该月（保留日，超出该月天数则取月末）
    if (el.liunianDate) {
      const cur = el.liunianDate.value || `${yr}-${pad2(v)}-15`;
      const day = Number(cur.split('-')[2]) || 15;
      const lastDay = new Date(yr, v, 0).getDate();
      el.liunianDate.value = `${yr}-${pad2(v)}-${pad2(Math.min(day, lastDay))}`;
    }

    const dateStr = (el.liunianDate && el.liunianDate.value) || `${yr}-${pad2(v)}-15`;
    const hourIdx = Number(state.liunianHour) || 0;
    try {
      state.liunian = state.chart.horoscope(dateStr, hourIdx);
    } catch (err) {
      console.error(err);
      return;
    }
    renderMonthReading();
    renderShortReading();
  }

  /* ---------------- 大限时间轴 ---------------- */

  function renderDaxianTrack() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    if (!ZW || !a || !el.daxianTrack) return;

    const birthLunarYear = a.rawDates && a.rawDates.lunarDate
      ? a.rawDates.lunarDate.lunarYear
      : Number(a.solarDate.slice(0, 4));

    const list = ZW.buildDaxianTimeline(
      a, birthLunarYear, state.liunianYear, new Date().getFullYear());

    el.daxianTrack.innerHTML = list.map((d) => {
      const cls = ['dx-item'];
      if (d.isViewing) cls.push('is-viewing');
      if (d.isNow) cls.push('is-now');
      if (d.isPast) cls.push('is-past');
      // 查看中的那段若不是现实所在，明确标注，避免误读
      const badge = d.isNow
        ? '<span class="dx-now">现在</span>'
        : (d.isViewing ? '<span class="dx-now dx-viewing">查看中</span>' : '');
      // 这一宫本命里的主星——让每一段真正属于这张盘
      const stars = d.stars && d.stars.length
        ? `<span class="dx-stars">${d.stars.join('、')}</span>`
        : '<span class="dx-stars is-empty">无主星</span>';
      // 悬浮与点击时给出完整说明
      const tip = d.note ? ` title="${String(d.note).replace(/"/g, '&quot;')}"` : '';
      return `
        <li class="${cls.join(' ')}" data-start="${d.startYear}" data-idx="${d.index}"${tip}>
          <span class="dx-age">${d.startAge}–${d.endAge} 岁</span>
          <span class="dx-palace">${d.palaceLabel}</span>
          ${stars}
          <span class="dx-title">${d.title}</span>
          <span class="dx-years">${d.startYear}–${d.endYear}</span>
          ${badge}
        </li>`;
    }).join('');

    // 当前查看阶段滚进视野
    const cur = el.daxianTrack.querySelector('.is-viewing');
    if (cur && cur.scrollIntoView) {
      try {
        cur.scrollIntoView({ block: 'nearest', inline: 'center' });
      } catch (e) { /* 忽略 */ }
    }
  }

  function onDaxianClick(e) {
    const item = e.target.closest('.dx-item');
    if (!item) return;
    const startYear = Number(item.dataset.start);
    if (!Number.isFinite(startYear) || startYear < 1900 || startYear > 2100) {
      toast('这个阶段超出可查看范围', 'warn');
      return;
    }

    // 先在时间轴下方展开这一段的完整说明（含本命星曜）
    showDaxianDetail(Number(item.dataset.idx));

    el.liunianYear.value = startYear;
    renderLiunian();
    // 把流年面板带到视野里，让用户看到点选结果
    if (el.yearPanel && el.yearPanel.scrollIntoView) {
      try { el.yearPanel.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (err) { }
    }
    toast(`已跳到 ${startYear} 年（${item.querySelector('.dx-age').textContent}）`, 'ok');
  }

  /**
   * 展开某一段大限的详细说明。
   * 数据来自 buildDaxianTimeline 的 note/stars/sha，
   * 内容随本命盘变化，不是通用模板。
   */
  function showDaxianDetail(index) {
    if (!el.daxianDetail) return;
    const a = state.chart;
    if (!a) return;

    const birthLunarYear = a.rawDates && a.rawDates.lunarDate
      ? a.rawDates.lunarDate.lunarYear
      : Number(a.solarDate.slice(0, 4));
    const ZW = window.ZWInterpret;
    if (!ZW) return;

    const list = ZW.buildDaxianTimeline(
      a, birthLunarYear, state.liunianYear, new Date().getFullYear());
    const d = list.find((x) => x.index === index);
    if (!d) { el.daxianDetail.hidden = true; return; }

    const realYear = new Date().getFullYear();
    const relation = d.isNow ? '你现在就在这一段'
      : (realYear > d.endYear ? '这一段已经走过' : '这一段还没到');

    el.daxianDetail.innerHTML = `
      <div class="dd-head">
        <span class="dd-range">${d.startAge}–${d.endAge} 岁</span>
        <span class="dd-years">${d.startYear}–${d.endYear}</span>
        <span class="dd-rel">${relation}</span>
      </div>
      <p class="dd-note">${d.note}</p>
      <div class="dd-meta">
        <span>大限宫位 <strong>${d.palaceLabel}</strong></span>
        <span>大限干支 <strong>${d.ganZhi}</strong></span>
        ${d.stars.length ? `<span>本命主星 <strong>${d.stars.join('、')}</strong></span>` : ''}
        ${d.sha.length ? `<span>本命煞星 <strong>${d.sha.join('、')}</strong></span>` : ''}
      </div>
    `;
    el.daxianDetail.hidden = false;
  }

  /* ---------------- 合盘 ---------------- */

  function initCompatShichen() {
    if (!el.cShichenGrid) return;
    el.cShichenGrid.innerHTML = SHICHEN.map((sc) => `
      <button type="button" class="sc-btn${sc.zhi === compatState.shichen ? ' active' : ''}" data-zhi="${sc.zhi}">
        <span class="sc-name">${sc.name}</span>
      </button>
    `).join('');
    el.cShichenGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.sc-btn');
      if (!btn) return;
      compatState.shichen = Number(btn.dataset.zhi);
      el.cShichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.zhi) === compatState.shichen);
      });
    });
  }

  function openCompat() {
    if (!state.chart) return;
    el.compatForm.hidden = false;
    el.compatResult.hidden = true;
    el.compatFoot.hidden = true;
    if (el.compatHint) el.compatHint.textContent = '';
    el.compatModal.hidden = false;
    el.compatMask.hidden = false;

    // 有收藏时提示可以一键选取
    const favs = readFavorites();
    if (el.compatFromFav) el.compatFromFav.hidden = favs.length === 0;
  }

  function closeCompat() {
    el.compatModal.hidden = true;
    el.compatMask.hidden = true;
  }

  /** 用收藏里的某个人填入对方信息 */
  function compatPickFavorite() {
    const favs = readFavorites();
    if (!favs.length) return;
    const names = favs.map((f, i) => `${i + 1}. ${f.label || '未命名'}`).join('\n');
    let pick = null;
    try { pick = window.prompt('选择要用作对照的收藏（输入序号）\n' + names, '1'); }
    catch (e) { pick = null; }
    if (pick === null) return;
    const i = Number(pick) - 1;
    const item = favs[i];
    if (!item) { toast('没有这个序号', 'warn'); return; }

    el.cYear.value = item.year;
    el.cMonth.value = item.month;
    el.cDay.value = item.day;
    compatState.gender = item.gender === '男' ? '男' : '女';
    compatState.shichen = Number(item.shichen) || 0;

    document.querySelectorAll('.seg').forEach((seg) => {
      if (seg.dataset.name !== 'cgender') return;
      seg.querySelectorAll('.seg-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.val === compatState.gender);
      });
    });
    el.cShichenGrid.querySelectorAll('.sc-btn').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.zhi) === compatState.shichen);
    });
    if (el.compatHint) el.compatHint.textContent = `已填入「${item.label || '未命名'}」`;
  }

  function runCompat() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    if (!a || !ZW) return;

    const y = Number(el.cYear.value), m = Number(el.cMonth.value), d = Number(el.cDay.value);
    if (!y || !m || !d) { toast('请填写对方的完整生辰', 'warn'); return; }
    if (y < 1900 || y > 2100) { toast('年份需在 1900–2100 之间', 'warn'); return; }
    if (m < 1 || m > 12 || d < 1 || d > 31) { toast('月日填写有误', 'warn'); return; }

    let b;
    try {
      b = astro.bySolar(`${y}-${m}-${d}`, compatState.shichen, compatState.gender, true, 'zh-CN');
    } catch (err) {
      console.error(err);
      toast('对方生辰无法排盘，请检查日期', 'warn');
      return;
    }

    const comp = ZW.buildCompatibility(a, b);
    compatState.chart = b;

    const me = state.chart;
    const meStars = (ZW.resolveSoulStars(me).stars.join('、') || '无主星');
    const youStars = (ZW.resolveSoulStars(b).stars.join('、') || '无主星');
    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    el.compatResult.innerHTML = `
      <div class="compat-pair">
        <div class="cp-side">
          <span class="cp-who">你</span>
          <span class="cp-star">${esc(meStars)}</span>
          <span class="cp-meta">${esc(me.gender)} · ${esc(me.solarDate)} · ${esc(me.time || '')}</span>
        </div>
        <div class="cp-link" aria-hidden="true">
          <span class="cp-link-mark">合</span>
        </div>
        <div class="cp-side">
          <span class="cp-who">对方</span>
          <span class="cp-star">${esc(youStars)}</span>
          <span class="cp-meta">${esc(b.gender)} · ${esc(b.solarDate)} · ${esc(b.time || '')}</span>
        </div>
      </div>

      <div class="compat-verdict">
        <h3 class="cv-title">${esc(comp.pair.title)}</h3>
        <p class="cv-text">${esc(comp.pair.text)}</p>
      </div>

      <div class="compat-table-wrap">
        <h3 class="compat-sub">逐宫对照</h3>
        <table class="compat-table">
          <thead>
            <tr><th>宫位</th><th>你</th><th>对方</th></tr>
          </thead>
          <tbody>
            ${comp.rows.map((r) => `
              <tr>
                <td class="ct-palace">
                  <span class="ct-name">${esc(r.palaceLabel)}</span>
                  <span class="ct-title">${esc(r.title)}</span>
                </td>
                <td class="ct-stars">${esc(r.aStars)}</td>
                <td class="ct-stars">${esc(r.bStars)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="compat-charts">
        <h3 class="compat-sub">双盘并排</h3>
        <p class="compat-hint">两张完整命盤对照看，宫位位置一一对应。可左右滑动。</p>
        <div class="dual-scroll">
          <div class="dual-chart">
            <p class="dual-label">你 · ${esc(me.gender)} · ${esc(me.solarDate)}</p>
            <div class="chart is-static">${buildChartHTML(me, {
      showDecadal: false, showMarks: true, interactive: false, compact: true,
      title: '你',
    })}</div>
          </div>
          <div class="dual-chart">
            <p class="dual-label">对方 · ${esc(b.gender)} · ${esc(b.solarDate)}</p>
            <div class="chart is-static">${buildChartHTML(b, {
      showDecadal: false, showMarks: true, interactive: false, compact: true,
      title: '对方',
    })}</div>
          </div>
        </div>
      </div>

      <p class="compat-note">
        两个人的星曜只是相处倾向的一种参照，不代表关系好坏，更不是「合不合」的定论。
        真正决定关系的，是你们怎么对待彼此。
      </p>
    `;

    el.compatForm.hidden = true;
    el.compatResult.hidden = false;
    el.compatFoot.hidden = false;
  }

  /* ---------------- 流日 / 流时 ---------------- */

  function pad2(n) { return String(n).padStart(2, '0'); }

  /** 把 Date 转成本地时区的 YYYY-MM-DD（不能用 toISOString，会偏移时区） */
  function toDateInput(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  /** 初始化流日/流时控件。
   *  只填默认值，不覆盖用户已选的内容（起盘会重复调用）。 */
  function initDayControls() {
    if (!el.liunianDate) return;
    if (!el.liunianDate.value) el.liunianDate.value = toDateInput(new Date());
    if (el.liunianHour) {
      if (!el.liunianHour.options.length) {
        el.liunianHour.innerHTML = SHICHEN.map((sc, i) =>
          `<option value="${i}">${sc.name}</option>`).join('');
      }
      if (state.liunianHour == null) {
        // 用与真太阳时校正相同的换算，避免两套口径不一致。
        // 注意 23 点属于「晚子时」(timeIndex 12)，不是早子时(0)。
        state.liunianHour = hourToTimeIndex(new Date().getHours());
      }
      el.liunianHour.value = String(state.liunianHour);
    }
  }

  /** 该日期属于哪一年，用于校验是否与当前流年一致 */
  function dateYear() {
    if (!el.liunianDate || !el.liunianDate.value) return null;
    const m = /^(\d{4})-/.exec(el.liunianDate.value);
    return m ? Number(m[1]) : null;
  }

  function renderShortReading() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    if (!ZW || !a || !el.liunianDate || !el.liunianDate.value) return;

    const dateStr = el.liunianDate.value;
    const hourIdx = Number(el.liunianHour ? el.liunianHour.value : 0) || 0;

    // 流日/流时依赖具体日期，日期变了就要重取 horoscope
    let h;
    try {
      h = a.horoscope(dateStr, hourIdx);
    } catch (err) {
      console.error(err);
      return;
    }
    // 保留流年/流月数据（同一 horoscope 对象里都有）
    state.liunian = h;

    const dayLabel = dateStr.replace(/-/g, '/');

    // --- 流日 ---
    const day = ZW.buildShortReading(a, h, { level: 'day', dateLabel: dayLabel });
    if (day && el.dayBlock) {
      el.dayBlock.hidden = false;
      el.dayTitle.textContent = `流日 · ${day.ganZhi}日 · 落${day.palaceName}宫`;
      el.dayLead.textContent = day.headline;
      el.dayHua.innerHTML = day.hua.map((x) => `
        <li class="yhua-item is-${x.tone}">
          <span class="focus-hua tag tag-${HUA_KEY[x.hua]}">${x.hua}</span>
          <span class="yhua-text">${x.sentence}</span>
        </li>`).join('');
    }

    // --- 流时 ---
    const sc = SHICHEN[hourIdx];
    const hour = ZW.buildShortReading(a, h, {
      level: 'hour', dateLabel: dayLabel, hourLabel: ` ${sc ? sc.name : ''}`,
    });
    if (hour && el.hourBlock) {
      el.hourBlock.hidden = false;
      // 标题在 <summary> 里（折叠状态下也能看到落宫）
      if (el.hourFoldTitle) {
        el.hourFoldTitle.textContent = `${hour.ganZhi}时 · 落${hour.palaceName}宫`;
      }
      if (el.hourLead) el.hourLead.textContent = hour.headline;
      if (el.hourHua) {
        el.hourHua.innerHTML = hour.hua.map((x) => `
          <li class="yhua-item is-${x.tone}">
            <span class="focus-hua tag tag-${HUA_KEY[x.hua]}">${x.hua}</span>
            <span class="yhua-text">${x.sentence}</span>
          </li>`).join('');
      }
    }

    // 元信息
    if (el.dayMeta) {
      el.dayMeta.innerHTML = `
        <span class="ln-meta-item">流日 <strong>${day ? day.ganZhi : '—'}</strong></span>
        <span class="ln-meta-item">落宫 <strong>${day ? day.palaceName + '宫' : '—'}</strong></span>
        <span class="ln-meta-item">流时 <strong>${hour ? hour.ganZhi : '—'}</strong></span>
      `;
    }
    // 注意：跨年同步由 onDayChange() 统一处理（走完整的 renderLiunian），
    // 这里不再偷偷改年份——那只更新元信息，会让流年白话/大限轴停留在旧年份。
  }

  /**
   * 渲染流年元信息条。
   * 原先 renderLiunian 与 updateLiunianMetaOnly 各写一份，
   * 任何字段改动都要改两处（负虚岁就是两处都要修），故合并。
   * @param {boolean} tween 是否给虚岁做数字滚动
   */
  function renderLiunianMeta(tween) {
    const h = state.liunian;
    if (!h || !el.liunianMeta) return;

    const age = h.age.nominalAge;
    const ygz = h.yearly.heavenlyStem + h.yearly.earthlyBranch;
    const huaNames = ['禄', '权', '科', '忌'];
    const huaHtml = (h.yearly.mutagen || []).map((star, i) =>
      `<span style="color:${HUA_COLOR[huaNames[i]]}">${star}化${huaNames[i]}</span>`
    ).join(' ');

    const palaces = state.chart.palaces;
    const dx = palaces.find((p) =>
      p.decadal && age >= p.decadal.range[0] && age <= p.decadal.range[1]);

    // 大限/小限的 index 可能为 -1（如出生日期晚于所查年份），需容错
    const xiaoPalace = (h.age.index >= 0 && palaces[h.age.index]) ? palaces[h.age.index].name : null;
    const dxText = dx ? dx.decadal.range.join('-') + '岁'
      : (age >= 1 ? '已超出大限范围' : '—');

    el.liunianMeta.innerHTML = `
      <span class="ln-meta-item">流年 <strong>${ygz}</strong></span>
      <span class="ln-meta-item">虚岁 <strong class="ln-age">${ageText(age)}</strong></span>
      <span class="ln-meta-item">大限 <strong>${dxText}</strong></span>
      <span class="ln-meta-item">小限 <strong>${xiaoPalace || '—'}</strong></span>
      <span class="ln-meta-item">流年四化 ${huaHtml}</span>
    `;

    if (tween) {
      // 虚岁做数字滚动，让「时间在走」这件事看得见
      tweenNumber(el.liunianMeta.querySelector('.ln-age'), state.lastAge, age);
    }
    state.lastAge = age;
  }

  /** 仅更新元信息（不重绘盘面） */
  function updateLiunianMetaOnly() {
    renderLiunianMeta(false);
  }

  function shiftDay(delta) {
    if (!el.liunianDate || !el.liunianDate.value) return;
    const parts = el.liunianDate.value.split('-').map(Number);
    if (parts.length !== 3) return;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    el.liunianDate.value = toDateInput(d);
    onDayChange();
  }

  /**
   * 流日变化。
   * 关键：跨年时必须走完整的 renderLiunian()，
   * 否则元信息/流年白话/大限时间轴会停留在旧年份，同屏出现两套年份。
   */
  function onDayChange() {
    if (!state.chart) return;

    const dy = dateYear();
    if (dy && dy !== state.liunianYear) {
      // 跨年：完整重算（流年、流月、流日、流时、大限全部同步）
      el.liunianYear.value = dy;
      state.liunianYear = dy;
      renderLiunian();
      return;
    }

    // 同年之内：只更新流日/流时与盘面高亮，不必重算流年
    renderShortReading();
    syncChartHighlights();
  }

  /* ---------------- 触摸手势 ---------------- */

  /**
   * 给元素加左右滑动识别。
   * 只在明显的横向滑动（水平位移 > 垂直位移，且超过阈值）时触发，
   * 避免与页面纵向滚动/盘面横向滚动冲突。
   */
  function addSwipe(node, onLeft, onRight, opts) {
    if (!node) return;
    const o = opts || {};
    const MIN = o.min || 60;        // 最小水平位移
    const MAXV = o.maxVertical || 50; // 允许的最大垂直位移
    let sx = 0, sy = 0, tracking = false;

    node.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) { tracking = false; return; }
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    node.addEventListener('touchend', (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < MIN) return;             // 位移不够
      if (Math.abs(dy) > MAXV) return;            // 更像纵向滚动
      if (Math.abs(dx) < Math.abs(dy) * 1.5) return; // 方向不明确

      // 左滑（dx < 0）= 前进；右滑 = 后退
      if (dx < 0) onLeft && onLeft();
      else onRight && onRight();
    }, { passive: true });
  }

  /** 盘面区域：左右滑动切换流年（移动端主操作）
   *
   *  冲突处理：窄屏下 .chart-wrap 本身要横向滚动才能看全十二宫。
   *  若不加判断，用户想滚动看盘会被误判成切年。
   *  因此只在「已经滚到边缘、还继续往外滑」时才切换年份——
   *  这与原生滚动行为一致，不会互相干扰。
   */
  function initChartGestures() {
    const wrap = (el.chart && el.chart.parentElement) ||
      document.querySelector('.chart-wrap');
    if (!wrap) return;

    /** 盘面是否还能往该方向继续滚 */
    function canScrollFurther(dir) {
      const max = wrap.scrollWidth - wrap.clientWidth;
      if (max <= 2) return false;              // 不需要滚动（宽屏）
      if (dir < 0) return wrap.scrollLeft > 2;         // 还能往左滚
      return wrap.scrollLeft < max - 2;                // 还能往右滚
    }

    addSwipe(wrap,
      () => {
        // 左滑 = 看下一年；但若盘面还能右滚，优先让用户滚动看盘
        if (canScrollFurther(1)) return;
        shiftYear(1); toast('下一年', 'ok');
      },
      () => {
        if (canScrollFurther(-1)) return;
        shiftYear(-1); toast('上一年', 'ok');
      },
      { min: 70, maxVertical: 44 }
    );

    // 流日区域：左右滑动切换日期（这里没有横向滚动，可放心绑定）
    if (el.liunianDate) {
      const bar = el.liunianDate.closest ? el.liunianDate.closest('.day-bar') : null;
      if (bar) {
        addSwipe(bar,
          () => shiftDay(1),
          () => shiftDay(-1),
          { min: 60, maxVertical: 40 }
        );
      }
    }
  }

  /* ---------------- 星曜图鉴 ---------------- */

  /** 图鉴数据：主星在前，辅煞在后 */
  function starCatalog() {
    const ZW = window.ZWInterpret;
    if (!ZW) return [];
    const out = [];
    Object.keys(ZW.STARS).forEach((name) => {
      const s = ZW.STARS[name];
      out.push({
        name, kind: 'major', tag: s.tag, essence: s.essence,
        good: s.good, issue: s.issue, advice: s.advice, keys: s.keys,
      });
    });
    Object.keys(ZW.MINOR).forEach((name) => {
      const m = ZW.MINOR[name];
      out.push({
        name, kind: m.kind, tag: m.plain, essence: m.detail, keys: [],
      });
    });
    return out;
  }

  function renderStarList(filter) {
    const ZW = window.ZWInterpret;
    if (!ZW || !el.starList) return;
    const q = (filter || '').trim();
    const all = starCatalog();
    const list = q
      ? all.filter((s) => s.name.includes(q) || (s.tag || '').includes(q) ||
        (s.essence || '').includes(q) || (s.keys || []).some((k) => k.includes(q)))
      : all;

    if (!list.length) {
      el.starList.innerHTML = '<p class="gloss-empty">没有找到相关星曜，换个词试试。</p>';
      return;
    }

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    el.starList.innerHTML = list.map((s) => {
      const kindCls = s.kind === 'major' ? 'is-major' : (s.kind === 'sha' ? 'is-sha' : 'is-aux');
      const kindName = s.kind === 'major' ? '主星' : (s.kind === 'sha' ? '煞星' : '辅星');
      return `
        <section class="star-entry ${kindCls}" id="star-${esc(s.name)}">
          <header class="star-entry-head">
            <span class="star-entry-name">${esc(s.name)}</span>
            <span class="star-entry-tag">${esc(s.tag || '')}</span>
            <span class="star-entry-kind">${kindName}</span>
          </header>
          <p class="star-entry-essence">${esc(s.essence || '')}</p>
          ${s.good ? `<p class="star-entry-row is-good"><span>优势</span>${esc(s.good)}</p>` : ''}
          ${s.issue ? `<p class="star-entry-row is-caution"><span>课题</span>${esc(s.issue)}</p>` : ''}
          ${s.advice ? `<p class="star-entry-row is-tip"><span>建议</span>${esc(s.advice)}</p>` : ''}
          ${s.keys && s.keys.length
            ? `<div class="star-entry-keys">${s.keys.map((k) => `<span class="rtag">${esc(k)}</span>`).join('')}</div>`
            : ''}
        </section>`;
    }).join('');
  }

  function openStars(focusName) {
    renderStarList('');
    if (el.starSearch) el.starSearch.value = '';
    el.starDrawer.hidden = false;
    el.starMask.hidden = false;

    // 从盘面点进来时，直接滚到那颗星
    if (focusName) {
      const target = el.starList.querySelector('#star-' + CSS.escape(focusName));
      if (target) {
        setTimeout(() => {
          try { target.scrollIntoView({ block: 'start' }); } catch (e) { }
          target.classList.add('is-flash');
          setTimeout(() => target.classList.remove('is-flash'), 1400);
        }, 60);
        return;
      }
    }
    setTimeout(() => { if (el.starSearch) el.starSearch.focus(); }, 60);
  }

  function closeStars() {
    el.starDrawer.hidden = true;
    el.starMask.hidden = true;
  }

  /* ---------------- 无障碍 ---------------- */

  /**
   * 给盘面加上键盘与读屏支持。
   * 宫位用 role="button" + aria-label，方向键在宫位间移动，Enter/空格打开。
   */
  function enhanceChartA11y() {
    const a = state.chart;
    if (!a) return;
    const cells = [...el.chart.querySelectorAll('.cell')];
    if (!cells.length) return;

    cells.forEach((cell) => {
      const idx = Number(cell.dataset.idx);
      const p = a.palaces[idx];
      if (!p) return;

      const ZW = window.ZWInterpret;
      const label = ZW ? ZW.palaceLabel(p.name) : p.name;
      const stars = p.majorStars.map((s) => s.name + (s.mutagen ? '化' + s.mutagen : '')).join('、');
      const ln = state.liunian && state.liunian.yearly.palaceNames
        ? state.liunian.yearly.palaceNames[idx] : '';
      const parts = [
        label,
        `${p.heavenlyStem}${p.earthlyBranch}`,
        stars ? `主星 ${stars}` : '无主星',
      ];
      if (ln) parts.push(`流年${ZW ? ZW.palaceLabel(ln) : ln}`);
      if (p.isBodyPalace) parts.push('身宫');
      if (p.decadal) parts.push(`大限 ${p.decadal.range.join('到')}岁`);

      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('aria-label', parts.join('，') + '。按回车查看详情');
    });

    // 方向键按盘面方位移动：上下左右对应四邻
    const gridPos = GRID_POS;
    const byPos = new Map();
    cells.forEach((c) => {
      const idx = Number(c.dataset.idx);
      const p = a.palaces[idx];
      if (!p) return;
      const pos = gridPos[p.earthlyBranch];
      if (pos) byPos.set(pos[0] + ',' + pos[1], c);
    });

    /**
     * 从当前宫位沿方向找邻居。
     * 盘面是 4×4 环状布局，中心 2×2 是空的，所以要跳过。
     * 关键：跳过必须不消耗步数预算，否则从边缘往内走时会「走不到」
     * 对侧格子，表现为方向键在某些宫位失灵。
     */
    function findNeighbor(cell, dr, dc) {
      const idx = Number(cell.dataset.idx);
      const p = a.palaces[idx];
      if (!p) return null;
      const pos = gridPos[p.earthlyBranch];
      if (!pos) return null;

      let r = pos[0], c = pos[1];
      // 最多走完整个盘面的边长，足够跨过中心区
      for (let step = 0; step < 8; step++) {
        r += dr; c += dc;
        if (r < 1 || r > 4 || c < 1 || c > 4) return null;
        // 中心区不算宫位，继续走（不计入额外预算）
        if (r >= 2 && r <= 3 && c >= 2 && c <= 3) continue;
        const found = byPos.get(r + ',' + c);
        if (found) return found;
      }
      return null;
    }

    el.chart.addEventListener('keydown', (e) => {
      // 已处理过的事件不再重复处理（防止派发/冒泡导致的重复响应）
      if (e.__zwHandled) return;
      const cell = e.target && e.target.closest ? e.target.closest('.cell') : null;
      if (!cell) return;
      const map = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      };
      if (map[e.key]) {
        e.__zwHandled = true;
        e.preventDefault();
        const next = findNeighbor(cell, map[e.key][0], map[e.key][1]);
        if (next && next.focus) next.focus();
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.__zwHandled = true;
        e.preventDefault();
        openDrawer(Number(cell.dataset.idx));
      }
    });
  }

  /* ---------------- 离线（PWA） ---------------- */

  /**
   * 注册 Service Worker。
   * 注意：file:// 协议下不可用，且为了不影响本地双击打开的使用方式，
   * 注册失败一律静默——离线只是增强，不是必需。
   */
  function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;   // 本地文件不注册

    // 网络状态提示
    const bar = document.getElementById('netBar');
    function showNet(text, tone) {
      if (!bar) return;
      bar.textContent = text;
      bar.className = 'net-bar' + (tone ? ' is-' + tone : '');
      bar.hidden = false;
      clearTimeout(showNet._t);
      showNet._t = setTimeout(() => { bar.hidden = true; }, 3200);
    }

    window.addEventListener('offline', () => {
      showNet('已离线——排盘仍可正常使用', 'offline');
    });
    window.addEventListener('online', () => {
      showNet('网络已恢复', 'online');
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        // 有新版本时提示用户刷新，而不是偷偷替换
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              const ub = document.getElementById('updateBar');
              if (ub) ub.hidden = false;
            }
          });
        });
      }).catch((err) => {
        console.warn('[PWA] Service Worker 注册失败（不影响使用）:', err);
      });
    });

    const reloadBtn = document.getElementById('updateReload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg && reg.waiting) reg.waiting.postMessage('skipWaiting');
          setTimeout(() => location.reload(), 120);
        });
      });
    }
  }

  /* ---------------- 动效工具 ---------------- */

  /** 是否应跳过动画（用户偏好减少动效） */
  function motionOff() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * 滚动入场：用 IntersectionObserver，绝不监听 scroll
   * （scroll 监听会持续触发重排，移动端性能杀手）
   *
   * 注意：观察器只在元素已可见时才能算出正确结果。
   * 这些元素初始处于 hidden 的 resultSection 内，尺寸为 0，
   * 因此起盘后必须重新观察一遍——不能指望浏览器自动重算。
   */
  let revealObserver = null;
  let revealOk = false;
  let revealCallbacks = 0;

  function setupRevealObserver() {
    if (revealObserver) return;
    if (!('IntersectionObserver' in window) || motionOff()) return;
    revealObserver = new IntersectionObserver((entries) => {
      revealCallbacks++;
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);   // 只播一次
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    revealOk = true;

    // 保险：若观察器一个回调都没派发（环境不支持/被阻断），
    // 就撤掉动效直接显示。宁可不动，也不能让内容永远看不见。
    setTimeout(() => {
      if (revealCallbacks === 0) {
        document.querySelectorAll('.reveal').forEach((t) => {
          t.classList.add('is-in');
          t.style.willChange = 'auto';
        });
      }
    }, 3000);
  }

  /** 收集（或重新收集）需要入场动效的元素 */
  function observeReveals() {
    setupRevealObserver();
    if (!revealOk) return;
    document.querySelectorAll('[data-reveal]').forEach((t) => {
      if (t.classList.contains('is-in')) return;   // 已入场的不重复
      t.classList.add('reveal');
      revealObserver.observe(t);
    });
  }

  function initReveal() {
    // 关键：.reveal 由 JS 添加，而不是写在 HTML 里。
    // 这样即使脚本失败，内容也不会被永久藏在 opacity:0 后面。
    observeReveals();
  }

  /** 让某个容器内的元素按顺序分段入场（写入 --d 延迟） */
  function stagger(container, selector, step, start) {
    if (!container) return;
    const items = container.querySelectorAll(selector);
    items.forEach((it, i) => {
      it.style.setProperty('--d', String((start || 0) + i * step));
    });
  }

  /** 数字滚动（用于虚岁变化） */
  function tweenNumber(node, from, to, dur) {
    if (!node) return;
    if (from == null || from === to || motionOff()) {
      node.textContent = String(to);
      return;
    }
    const t0 = performance.now();
    const d = dur || 480;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / d);
      const e = 1 - Math.pow(1 - k, 3);            // easeOutCubic
      node.textContent = String(Math.round(from + (to - from) * e));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** 宫位聚光跟随光标（事件委托 + 直接写 CSS 变量，开销极小） */
  function initSpotlight() {
    if (motionOff()) return;
    el.chart.addEventListener('pointermove', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      cell.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      cell.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  }

  /* ---------------- 信息条 ---------------- */

  function renderInfo() {
    const a = state.chart;
    const shichenName = SHICHEN[state.input.shichen].name;

    el.infoName.textContent = `${a.gender}命 · ${a.fiveElementsClass}`;
    let sub = `阳历 ${a.solarDate} · 农历 ${a.lunarDate} · ${a.time || shichenName}`;
    if (state.input.trueSolar) {
      sub += ` · 真太阳时校正（东经 ${state.input.longitude}°）`;
      if (state.input.solarNote) sub += `　${state.input.solarNote}`;
    }
    el.infoSub.textContent = sub;

    const chips = [
      ['四柱', a.chineseDate, null],
      ['五行局', a.fiveElementsClass, '五行局'],
      ['命宫', a.earthlyBranchOfSoulPalace, '命宫'],
      ['身宫', a.earthlyBranchOfBodyPalace, '身宫'],
      ['命主', a.soul, '命主'],
      ['身主', a.body, '身主'],
      ['生肖', a.zodiac, null],
      ['星座', a.sign, null],
    ];
    // 可解释的字段带问号注解，点击就地看解释
    el.infoChips.innerHTML = chips.map(([k, v, termKey]) => {
      const label = termKey
        ? `<button type="button" class="term term-inline" data-term="${termKey}">${k}<span class="term-q">?</span></button>`
        : k;
      return `<span class="chip">${label} <strong>${v}</strong></span>`;
    }).join('');
  }

  /* ---------------- 白话解读 ---------------- */

  /** 把术语包成可点击的注解 */
  function term(text) {
    return `<button type="button" class="term" data-term="${text}">${text}</button>`;
  }

  function renderReading() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    if (!ZW || !el.readingPanel) return;

    const rd = ZW.buildReading(a);

    // 一句话结论
    el.readingLead.innerHTML = rd.headline;

    // 特质标签
    el.readingTags.innerHTML = rd.tags.length
      ? rd.tags.map((t) => `<span class="rtag">${t}</span>`).join('')
      : '';

    // 优势 / 课题 / 建议
    const toneClass = { good: 'is-good', caution: 'is-caution', tip: 'is-tip', neutral: 'is-neutral' };
    el.readingBlocks.innerHTML = rd.blocks.map((b) => `
      <div class="rblock ${toneClass[b.tone] || ''}">
        <span class="rblock-label">${b.label}</span>
        <p class="rblock-text">${b.text}</p>
      </div>
    `).join('');

    // 四化重点
    el.readingFocus.innerHTML = rd.focus.length
      ? rd.focus.map((f) => `
        <li class="focus-item is-${f.tone}">
          <span class="focus-hua tag tag-${HUA_KEY[f.hua]}">${f.hua}</span>
          <div class="focus-body">
            <span class="focus-star">${f.star} · ${f.huaName} · 落在${f.palace}宫</span>
            <span class="focus-text">${f.sentence}</span>
          </div>
        </li>`).join('')
      : '<li class="focus-empty">这张盘的四化标记较少，可直接看盘面。</li>';

    // 十二宫逐宫解读
    // 这是本命解读信息量最大的部分：只看命宫全天下只有十几种结果，
    // 逐宫展开之后每张盘的差异才真正体现出来。
    if (el.palaceGrid) {
      const list = rd.palaceReadings || [];
      el.palaceGrid.innerHTML = list.map((p, i) => {
        const huaHtml = p.hua.length
          ? `<span class="pg-hua">${p.hua.map((h) =>
            `<span class="tag tag-${HUA_KEY[h.hua]}">${h.hua}</span>`).join('')}</span>`
          : '';
        const starsHtml = p.major.length
          ? p.major.map((s) => `<span class="pg-star">${s}</span>`).join('')
          : '<span class="pg-star is-empty">无主星</span>';
        const auxHtml = p.aux.length
          ? `<span class="pg-aux">${p.aux.join('、')}</span>` : '';
        const shaHtml = p.sha.length
          ? `<span class="pg-sha">${p.sha.join('、')}</span>` : '';
        // 借对宫时明确标注，不让用户以为这一宫真有那颗星
        const borrowTag = p.borrowedCtx
          ? `<span class="pg-borrow">借对宫「${p.ctxFrom.replace('（借对宫）', '')}」</span>` : '';

        return `
          <details class="palace-card" ${i === 0 ? 'open' : ''}>
            <summary>
              <span class="pg-head">
                <span class="pg-name">${p.label}</span>
                <span class="pg-title">${p.title}</span>
                ${p.isBody ? '<span class="pg-body">身宫</span>' : ''}
              </span>
              <span class="pg-stars">${starsHtml}${huaHtml}</span>
            </summary>
            <div class="pg-body-wrap">
              ${borrowTag}
              ${p.good ? `<p class="pg-line"><span class="pg-k">优势</span>${p.good}</p>` : ''}
              ${p.issue ? `<p class="pg-line"><span class="pg-k is-issue">课题</span>${p.issue}</p>` : ''}
              ${p.advice ? `<p class="pg-line"><span class="pg-k is-tip">建议</span>${p.advice}</p>` : ''}
              <p class="pg-what">${p.what}</p>
              ${(auxHtml || shaHtml) ? `<p class="pg-minor">${auxHtml}${shaHtml}</p>` : ''}
              ${p.provKind === 'source'
            ? `<p class="pg-prov is-source" title="《紫微斗数精成》第九章原文">
                     <span class="pg-prov-k">原书依据</span>${(p.provQuote || '').slice(0, 110)}…
                   </p>`
            : `<p class="pg-prov is-derived">
                     <span class="pg-prov-k">推算说明</span>原书第九章未单列这一组合，本条由星性推导而来。
                   </p>`}
            </div>
          </details>`;
      }).join('');
    }

    // ===== 同盘区分（日干四化）=====
    // 紫微斗数的星盘由紫微位置锚定，而紫微位置 = f(农历日, 五行局)。
    // 所以不同出生日期可能排出同一张盘。这里告诉用户为什么，
    // 并给出原书承认的辅助区分依据。
    if (el.sameChartBlock) {
      const sc = rd.sameChartNote;
      if (sc) {
        el.sameChartBlock.hidden = false;
        el.sameChartExplain.textContent = sc.explain;
        el.sameChartHead.textContent = sc.headline;
        el.sameChartList.innerHTML = sc.sentences
          .map((s) => `<li>${s}</li>`).join('');
        el.sameChartCaveat.textContent = sc.caveat + ' 依据：' + sc.src;
      } else {
        el.sameChartBlock.hidden = true;
      }
    }

    // 分段入场：这是起盘后最先读的内容，按阅读顺序依次浮起
    if (state.playEnter && !motionOff()) {
      el.readingPanel.classList.remove('is-enter');
      void el.readingPanel.offsetWidth;
      el.readingPanel.classList.add('is-enter');

      stagger(el.readingPanel, '.reading-lead', 0, 60);
      stagger(el.readingPanel, '.rtag', 55, 200);
      stagger(el.readingPanel, '.rblock', 85, 380);
      stagger(el.readingPanel, '.reading-sub, .reading-hint', 0, 900);
      stagger(el.readingPanel, '.focus-item', 75, 980);
      stagger(el.readingPanel, '.reading-disclaimer', 0, 1420);

      clearTimeout(state._readTimer);
      state._readTimer = setTimeout(() => {
        el.readingPanel.classList.remove('is-enter');
      }, 2200);
    }
  }

  /* 四化 → CSS 后缀 */

  /* ---------------- 流年白话 ---------------- */

  function renderYearReading() {
    const a = state.chart;
    const ZW = window.ZWInterpret;
    const h = state.liunian;
    if (!ZW || !h || !el.yearPanel) return;

    const yr = ZW.buildYearReading(a, h, state.liunianYear);
    if (!yr) return;

    el.yearTitle.textContent = `${yr.year} 年 · ${yr.ygz}年 · 虚岁 ${yr.age}`;
    el.yearLead.textContent = yr.headline;
    el.yearDaxian.textContent = yr.daxianText || '';

    el.yearHua.innerHTML = yr.hua.map((x) => `
      <li class="yhua-item is-${x.tone}">
        <span class="focus-hua tag tag-${HUA_KEY[x.hua]}">${x.hua}</span>
        <span class="yhua-text">${x.sentence}</span>
      </li>
    `).join('');

    // 切流年时，流年白话也分段浮起（首次起盘由开盘动效统一处理）
    if (!state.playEnter && !motionOff()) {
      el.yearPanel.classList.remove('is-enter');
      void el.yearPanel.offsetWidth;
      el.yearPanel.classList.add('is-enter');
      stagger(el.yearPanel, '.year-lead', 0, 40);
      stagger(el.yearPanel, '.year-daxian', 0, 120);
      stagger(el.yearPanel, '.yhua-item', 70, 190);
      clearTimeout(state._yearTimer);
      state._yearTimer = setTimeout(() => {
        el.yearPanel.classList.remove('is-enter');
      }, 1400);
    }
  }

  /* ---------------- 新手导读 ---------------- */

  function renderGuide() {
    const ZW = window.ZWInterpret;
    if (!ZW || !el.guideList) return;
    el.guideList.innerHTML = ZW.GUIDE.map((g) => `
      <li class="guide-item">
        <span class="guide-num">${g.step}</span>
        <div class="guide-body">
          <span class="guide-title">${g.title}</span>
          <p class="guide-text">${g.text}</p>
        </div>
      </li>
    `).join('');
  }

  /* ---------------- 术语词典 ---------------- */

  function renderGlossary(filter) {
    const ZW = window.ZWInterpret;
    if (!ZW || !el.glossList) return;
    const q = (filter || '').trim();
    const entries = Object.entries(ZW.TERMS).filter(([k, v]) =>
      !q || k.includes(q) || v.includes(q));

    el.glossList.innerHTML = entries.length
      ? entries.map(([k, v]) => `
        <div class="gloss-item">
          <dt>${k}</dt>
          <dd>${v}</dd>
        </div>`).join('')
      : '<p class="gloss-empty">没有找到相关术语，换个词试试。</p>';
  }

  function openGlossary() {
    renderGlossary('');
    if (el.glossSearch) el.glossSearch.value = '';
    el.glossary.hidden = false;
    el.glossaryMask.hidden = false;
    setTimeout(() => { if (el.glossSearch) el.glossSearch.focus(); }, 60);
  }

  function closeGlossary() {
    el.glossary.hidden = true;
    el.glossaryMask.hidden = true;
  }

  /** 术语气泡：点击术语就地解释，不用跳走 */
  function showTermPop(termName, anchor) {
    const ZW = window.ZWInterpret;
    const text = ZW ? ZW.termInfo(termName) : null;
    if (!text) return;

    el.termPopName.textContent = termName;
    el.termPopText.textContent = text;
    el.termPop.hidden = false;

    // 定位：优先放在点击元素下方，超出视口则改放上方
    const r = anchor.getBoundingClientRect();
    const popW = Math.min(340, window.innerWidth - 24);
    let left = r.left + r.width / 2 - popW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - popW - 12));

    el.termPop.style.width = popW + 'px';
    el.termPop.style.left = left + 'px';

    const popH = el.termPop.offsetHeight || 140;
    const below = r.bottom + 8;
    if (below + popH > window.innerHeight - 12) {
      el.termPop.style.top = Math.max(12, r.top - popH - 8) + 'px';
    } else {
      el.termPop.style.top = below + 'px';
    }
  }

  function hideTermPop() {
    el.termPop.hidden = true;
  }

  /* ---------------- 流年 ---------------- */

  function shiftYear(delta) {
    let v = Number(el.liunianYear.value) + delta;
    v = Math.max(1900, Math.min(2100, v));
    el.liunianYear.value = v;
    renderLiunian();
  }

  function renderLiunian() {
    if (!state.chart) return;
    const yr = Number(el.liunianYear.value);
    if (!yr || yr < 1900 || yr > 2100) return;
    state.liunianYear = yr;

    // 流年变化时，把流日同步到该年（保留原来的月日，避免跳到同一日期）
    if (el.liunianDate && el.liunianDate.value) {
      const parts = el.liunianDate.value.split('-').map(Number);
      if (parts.length === 3 && parts[0] !== yr) {
        el.liunianDate.value = `${yr}-${pad2(parts[1])}-${pad2(parts[2])}`;
      }
    } else if (el.liunianDate) {
      el.liunianDate.value = `${yr}-${pad2(state.liunianMonth || 1)}-15`;
    }

    // 以流日日期取 horoscope：这样年、月、日、时四层数据同源一致。
    // （早先固定用 -15 会导致流月选择失效）
    const dateStr = (el.liunianDate && el.liunianDate.value) || `${yr}-${pad2(state.liunianMonth || 1)}-15`;
    const hourIdx = Number(state.liunianHour) || 0;

    let st;
    try {
      st = state.chart.horoscope(dateStr, hourIdx);
    } catch (err) {
      console.error('horoscope error', err);
      return;
    }
    state.liunian = st;
    const h = st;

    // 当前大限（按虚岁匹配）
    const age = h.age.nominalAge;
    const dx = state.chart.palaces.find((p) =>
      p.decadal && age >= p.decadal.range[0] && age <= p.decadal.range[1]);
    state.currentDaxianIndex = dx ? dx.index : null;

    // 流年元信息（含虚岁滚动）
    renderLiunianMeta(true);

    // 流年更新时信息条淡入（首次渲染不播，避免与入场动效叠加）
    if (!state.playEnter) {
      el.liunianMeta.classList.remove('is-updated');
      // 强制回流以重启动画
      void el.liunianMeta.offsetWidth;
      el.liunianMeta.classList.add('is-updated');
      state.pulseOnRender = true;
    }

    renderYearReading();
    renderMonthReading();
    renderShortReading();
    renderDaxianTrack();

    // 切流年只需更新高亮，不必重建整个盘面：
    // 全量重建会让 DOM 丢失状态、高亮「闪一下」，也无法做过渡动画
    if (state.chartRendered) {
      syncChartHighlights();
    } else {
      renderChart();
    }
  }

  /**
   * 轻量同步：只改动与流年/大限相关的 class 与标记，
   * 让高亮通过 CSS transition 平滑地从一个宫位移到另一个。
   */
  function syncChartHighlights() {
    const a = state.chart;
    const h = state.liunian;
    if (!a) return;
    const cells = el.chart.querySelectorAll('.cell');
    if (!cells.length) { renderChart(); return; }

    const names = h && h.yearly.palaceNames ? h.yearly.palaceNames : null;
    const newlyLit = [];

    cells.forEach((cell) => {
      const idx = Number(cell.dataset.idx);
      const isCurDx = idx === state.currentDaxianIndex;
      const isLnMing = !!(names && names[idx] === '命宫');
      const wasLit = cell.classList.contains('is-current-daxian') ||
        cell.classList.contains('is-liunian-ming');

      // 先清掉上一次的脉冲，否则重复添加不会重启动画
      cell.classList.remove('is-pulse');
      cell.classList.toggle('is-current-daxian', isCurDx);
      cell.classList.toggle('is-liunian-ming', isLnMing);

      // 「流年命宫」标记跟着移动
      let mark = cell.querySelector('.ln-mark');
      if (isLnMing && !mark) {
        mark = document.createElement('span');
        mark.className = 'ln-mark';
        mark.textContent = '流年命宫';
        cell.appendChild(mark);
      } else if (!isLnMing && mark) {
        mark.remove();
      }

      // 只给「新点亮」的宫位脉冲，保持不动的不重复闪
      if (!wasLit && (isCurDx || isLnMing)) newlyLit.push(cell);
    });

    newlyLit.forEach((c) => {
      void c.offsetWidth;   // 强制回流，确保动画重新开始
      c.classList.add('is-pulse');
    });

    // 流年命宫变了，读屏标签也要跟着更新
    enhanceChartA11y();
  }

  /* ---------------- 星盘渲染 ---------------- */

  /**
   * 生成盘面 HTML（与渲染目标解耦，供主盘与对比盘共用）
   * @param {object} a  iztro 命盘
   * @param {object} o  {
   *   liunianPalaceNames, currentDaxianIndex, pulse,
   *   showDecadal, showMarks, interactive, compact
   * }
   */
  function buildChartHTML(a, o) {
    const opt = o || {};
    const lnNames = opt.liunianPalaceNames || null;
    const curDx = opt.currentDaxianIndex;

    // 入场顺序：以命宫为起点，沿宫位顺序铺开
    const mingIdx = a.palaces.findIndex((x) => x.name === '命宫');
    const enterOrder = new Map();
    a.palaces.forEach((p) => {
      enterOrder.set(p.index, ((p.index - mingIdx) % 12 + 12) % 12);
    });

    const cells = [];

    a.palaces.forEach((p) => {
      const pos = GRID_POS[p.earthlyBranch];
      if (!pos) return;
      const [row, col] = pos;

      const isMing = p.name === '命宫';
      const isCurDx = p.index === curDx;
      const isLnMing = !!(lnNames && lnNames[p.index] === '命宫');

      const cls = ['cell'];
      if (isMing) cls.push('is-ming');
      if (isCurDx) cls.push('is-current-daxian');
      if (isLnMing) cls.push('is-liunian-ming');
      if (opt.pulse && (isLnMing || isCurDx)) cls.push('is-pulse');
      if (opt.compact) cls.push('is-compact');
      if (opt.interactive === false) cls.push('is-static');

      const majorHtml = p.majorStars.length
        ? `<div class="star-row">${p.majorStars.map((s) => starHtml(s, 'major', opt.interactive)).join('')}</div>`
        : '';
      // minorStars 含辅星、煞星、禄存、天马，用 type 区分
      const auxList = p.minorStars.filter((s) => s.type === 'soft' || s.type === 'lucun' || s.type === 'tianma');
      const shaList = p.minorStars.filter((s) => s.type === 'tough');
      const auxHtml = auxList.length
        ? `<div class="star-row">${auxList.map((s) => starHtml(s, 'aux', opt.interactive)).join('')}</div>` : '';
      const shaHtml = shaList.length
        ? `<div class="star-row">${shaList.map((s) => starHtml(s, 'sha', opt.interactive)).join('')}</div>` : '';

      const emptyTag = (!p.majorStars.length)
        ? '<div class="star-row"><span class="star star-aux" style="opacity:.45">无主星</span></div>' : '';

      const dxRange = (opt.showDecadal !== false && p.decadal) ? p.decadal.range.join('-') : '';

      cells.push(`
        <div class="${cls.join(' ')}" style="grid-row:${row};grid-column:${col};--i:${enterOrder.get(p.index) || 0}" data-idx="${p.index}">
          <div class="cell-head">
            <span class="cell-name">${p.name}</span>
            <span class="cell-ganzhi">${p.heavenlyStem}${p.earthlyBranch}</span>
          </div>
          ${dxRange ? `<div class="cell-decadal">${dxRange}岁</div>` : ''}
          <div class="cell-body">
            ${majorHtml}${emptyTag}${auxHtml}${shaHtml}
          </div>
          ${(opt.showMarks !== false && p.isBodyPalace) ? '<span class="shen-mark">身宫</span>' : ''}
          ${isLnMing ? '<span class="ln-mark">流年命宫</span>' : ''}
        </div>
      `);
    });

    cells.push(buildCenterHTML(a, opt));
    return cells.join('');
  }

  function renderChart() {
    const a = state.chart;
    if (!a) return;

    const h = state.liunian;

    el.chart.innerHTML = buildChartHTML(a, {
      liunianPalaceNames: h ? h.yearly.palaceNames : null,
      currentDaxianIndex: state.currentDaxianIndex,
      pulse: state.pulseOnRender,
      showDecadal: true,
      showMarks: true,
      interactive: true,
    });
    state.chartRendered = true;

    /**
     * 入场动效
     * 盘面在白话解读下方，起盘时通常还在屏幕外。
     * 若已在视口内就立刻播；否则等滚进来再播——避免动画白播一遍。
     */
    if (state.playEnter) {
      state.playEnter = false;
      const playEnter = () => {
        el.chart.classList.remove('is-enter');
        void el.chart.offsetWidth;
        el.chart.classList.add('is-enter');
        clearTimeout(state._enterTimer);
        const total = 12 * 42 + 500 + 140;
        state._enterTimer = setTimeout(() => {
          el.chart.classList.remove('is-enter');
        }, total);
      };

      if (motionOff()) {
        el.chart.classList.remove('is-enter');
      } else {
        const r = el.chart.getBoundingClientRect();
        const inView = r.top < window.innerHeight && r.bottom > 0;
        if (inView || !('IntersectionObserver' in window)) {
          playEnter();
        } else {
          const io = new IntersectionObserver((entries, obs) => {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();
            playEnter();
          }, { threshold: 0.12 });
          io.observe(el.chart);
        }
      }
    } else {
      el.chart.classList.remove('is-enter');
    }
    // 脉冲只作用于本次渲染
    state.pulseOnRender = false;

    // 键盘与读屏支持（盘面每次重建都要重新标注）
    enhanceChartA11y();

    // 盘面可见后重新收集入场元素（初始 hidden 时观察器算不出尺寸）
    observeReveals();

    // 宫位点击走事件委托（在 initEvents 里绑定一次），
    // 不必给 12 个格子各绑一个监听器——那会随每次重渲染重复创建。
  }

  /** 星曜 HTML（含四化标记）
   *  星名做成按钮：点它看图鉴，点宫位空白处看宫位详情。
   *  interactive=false 时渲染为纯文本（用于对比盘，避免双重按钮语义）。 */
  function starHtml(s, kind, interactive) {
    const bright = s.brightness && ['庙', '旺', '得', '利', '平', '不', '陷'].includes(s.brightness)
      ? `<span class="star-bright">${s.brightness}</span>` : '';
    const hua = s.mutagen
      ? `<span class="tag ${HUA_CLASS[s.mutagen] || ''}">${s.mutagen}</span>` : '';
    const safe = String(s.name).replace(/"/g, '&quot;');

    const nameHtml = interactive === false
      ? s.name
      : `<button type="button" class="star-btn" data-star="${safe}" title="查看「${safe}」的解释">${s.name}</button>`;

    return `<span class="star star-${kind}">${nameHtml}${bright}${hua}</span>`;
  }

  /** 中间 2×2 核心区 */
  function buildCenterHTML(a, opt) {
    const o = opt || {};

    const benmingSihua = [];
    a.palaces.forEach((p) => {
      [...p.majorStars, ...p.minorStars].forEach((s) => {
        if (s.mutagen) benmingSihua.push({ star: s.name, hua: s.mutagen, palace: p.name });
      });
    });
    // 化忌排最前，其余按 禄→权→科
    const order = { '忌': 0, '禄': 1, '权': 2, '科': 3 };
    benmingSihua.sort((x, y) => order[x.hua] - order[y.hua]);

    const huaLine = (list) => list.length
      ? list.map((x) => `<div class="cs-row"><span>${x.star}化<span class="cs-tag" style="color:${HUA_COLOR[x.hua]}">${x.hua}</span></span><span style="color:var(--txt-3)">${palaceLabelOf(x.palace)}</span></div>`).join('')
      : '<div class="cs-row" style="color:var(--txt-3)">—</div>';

    return `
      <div class="center-box${o.compact ? ' is-compact' : ''}" style="grid-row:2 / 4;grid-column:2 / 4">
        <div class="center-taiji">☯</div>
        <div class="center-title">${o.title || '紫微命盤'}</div>
        <dl class="center-grid">
          <dt>命宫</dt><dd><em>${a.earthlyBranchOfSoulPalace}</em></dd>
          <dt>身宫</dt><dd><em>${a.earthlyBranchOfBodyPalace}</em></dd>
          <dt>五行局</dt><dd><em>${a.fiveElementsClass}</em></dd>
          <dt>命主</dt><dd>${a.soul}</dd>
          <dt>身主</dt><dd>${a.body}</dd>
        </dl>
        <div class="center-sihua">
          <div style="color:var(--gold-dim);letter-spacing:.1em;margin-bottom:2px">本命四化</div>
          ${huaLine(benmingSihua)}
        </div>
        ${o.showBrand === false ? '' : '<div class="center-brand" aria-hidden="true">FANSTAR</div>'}
      </div>
    `;
  }

  /** 宫位标签（内部用，容错处理） */
  function palaceLabelOf(name) {
    const ZW = window.ZWInterpret;
    return ZW ? ZW.palaceLabel(name) : name;
  }

  /**
   * 虚岁显示文本。
   * 出生日期晚于所选流年时 iztro 会返回负数虚岁（实测 2035 年生查 2026 年得 -8），
   * 直接上屏会让人以为程序坏了，这里统一兜底。
   */
  function ageText(age) {
    if (typeof age !== 'number' || !Number.isFinite(age)) return '—';
    if (age < 1) return '未出生';
    return String(age);
  }

  /* ---------------- 宫位详情抽屉 ---------------- */

  function openDrawer(idx) {
    const a = state.chart;
    // 重置后 state.chart 为 null，但盘面 DOM 与其监听器仍在，
    // 键盘/点击仍可能命中残留的 .cell —— 这里必须容错
    if (!a || !a.palaces) return;
    const p = a.palaces[idx];
    if (!p) return;

    const ZW = window.ZWInterpret;
    const h = state.liunian;
    const lnName = h && h.yearly.palaceNames ? h.yearly.palaceNames[idx] : null;

    el.drawerTitle.textContent = `${ZW ? ZW.palaceLabel(p.name) : p.name} · ${p.heavenlyStem}${p.earthlyBranch}`;
    const subParts = [];
    if (p.isBodyPalace) subParts.push('身宫');
    if (lnName) subParts.push(`今年这里是流年${lnName}宫`);
    if (p.decadal) subParts.push(`大限 ${p.decadal.range.join('-')}岁`);
    if (p.ages && p.ages.length) subParts.push(`小限 ${p.ages.join('、')}`);
    el.drawerSub.textContent = subParts.join(' · ');

    const sec = [];

    // ===== 这宫管什么（人话） =====
    const pInfo = ZW ? ZW.palaceInfo(p.name) : null;
    if (pInfo) {
      sec.push(`
        <div class="dr-section dr-plain">
          <h3>这宫管什么</h3>
          <p class="dr-what"><strong>${pInfo.title}</strong>——${pInfo.what}</p>
          <p class="dr-how">${pInfo.how}</p>
        </div>
      `);
    }

    // ===== 你的情况（把星曜翻译成人话） =====
    const plain = [];
    p.majorStars.forEach((s) => {
      const info = ZW ? ZW.starInfo(s.name) : null;
      if (!info) return;
      plain.push({
        name: s.name, kind: 'major', info,
        hua: s.mutagen,
        brightness: s.brightness
      });
    });

    if (plain.length) {
      sec.push(`
        <div class="dr-section">
          <h3>你的情况</h3>
          <div class="plain-list">
            ${plain.map((x) => `
              <div class="plain-item">
                <div class="plain-head">
                  <span class="plain-star">${x.name}</span>
                  ${x.info.tag ? `<span class="plain-tag">${x.info.tag}</span>` : ''}
                  ${x.brightness ? `<span class="plain-bright">状态：${x.brightness}</span>` : ''}
                  ${x.hua ? `<span class="tag tag-${HUA_KEY[x.hua]}">${x.hua}</span>` : ''}
                </div>
                <p class="plain-essence">${x.info.essence}</p>
                ${x.info.classic ? `
                  <p class="plain-classic">
                    <span class="pc-k">原书定性</span>${x.info.classic}
                  </p>` : ''}
                ${x.info.good ? `<p class="plain-row"><span>优势</span>${x.info.good}</p>` : ''}
                ${x.info.issue ? `<p class="plain-row"><span>课题</span>${x.info.issue}</p>` : ''}
                ${x.info.advice ? `<p class="plain-row is-tip"><span>建议</span>${x.info.advice}</p>` : ''}
                ${x.info.classicNote ? `
                  <p class="plain-note">${x.info.classicNote}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `);
    } else if (!pInfo) {
      sec.push(`<div class="dr-section"><p class="dr-empty">这一宫没有主星。</p></div>`);
    }

    if (p.majorStars.length === 0 && pInfo) {
      sec.push(`
        <div class="dr-section">
          <p class="dr-note">这一宫没有主星。传统上会借对宫的星来参考，所以它更像一张「白纸」——受环境和身边人影响较大。</p>
        </div>
      `);
    }

    // ===== 星曜明细（保留原有的专业信息，折叠在下方） =====
    sec.push(`
      <details class="dr-details">
        <summary>展开星曜明细（进阶）</summary>
        <div class="dr-section">
          <h3>主星</h3>
          <div class="dr-stars">
            ${p.majorStars.length ? p.majorStars.map((s) =>
        `<div class="dr-star major">${s.name}${s.brightness ? `<span class="dr-bright">${s.brightness}</span>` : ''}
                ${s.mutagen ? `<span class="tag ${HUA_CLASS[s.mutagen]}">${s.mutagen}</span>` : ''}</div>`).join('')
        : '<div class="dr-empty">此宫无主星（借对宫星曜论）</div>'}
          </div>
        </div>
    `);

    // 辅星
    // 辅星 / 煞星（含禄存、天马）
    const soft = p.minorStars.filter((s) => s.type === 'soft' || s.type === 'lucun' || s.type === 'tianma');
    const tough = p.minorStars.filter((s) => s.type === 'tough');
    if (soft.length) {
      sec.push(`
        <div class="dr-section">
          <h3>辅星</h3>
          <div class="dr-stars">
            ${soft.map((s) => `<div class="dr-star aux">${s.name}${s.mutagen ? `<span class="tag ${HUA_CLASS[s.mutagen]}">${s.mutagen}</span>` : ''}</div>`).join('')}
          </div>
        </div>
      `);
    }
    if (tough.length) {
      sec.push(`
        <div class="dr-section">
          <h3>煞星</h3>
          <div class="dr-stars">
            ${tough.map((s) => `<div class="dr-star sha">${s.name}${s.mutagen ? `<span class="tag ${HUA_CLASS[s.mutagen]}">${s.mutagen}</span>` : ''}</div>`).join('')}
          </div>
        </div>
      `);
    }

    // 杂曜
    if (p.adjectiveStars && p.adjectiveStars.length) {
      sec.push(`
        <div class="dr-section">
          <h3>杂曜</h3>
          <div class="dr-stars" style="flex-direction:row;flex-wrap:wrap;gap:6px">
            ${p.adjectiveStars.map((s) => `<span class="chip">${s.name}</span>`).join('')}
          </div>
        </div>
      `);
    }

    // 长生十二神 / 博士十二神
    const meta = [];
    if (p.changsheng12) meta.push(['长生十二神', p.changsheng12]);
    if (p.boshi12) meta.push(['博士十二神', p.boshi12]);
    if (p.jiangqian12) meta.push(['将前十二神', p.jiangqian12]);
    if (p.suiqian12) meta.push(['岁前十二神', p.suiqian12]);
    if (meta.length) {
      sec.push(`
        <div class="dr-section">
          <h3>神煞</h3>
          <dl class="dr-kv">
            ${meta.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}
          </dl>
        </div>
      `);
    }

    // 流年星曜（yearly.stars 为按宫位索引的数组的数组）
    if (h && Array.isArray(h.yearly.stars) && Array.isArray(h.yearly.stars[idx])) {
      const lnStars = h.yearly.stars[idx];
      if (lnStars.length) {
        sec.push(`
          <div class="dr-section">
            <h3>流年星曜（${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}年）</h3>
            <div class="dr-stars" style="flex-direction:row;flex-wrap:wrap;gap:6px">
              ${lnStars.map((s) => `<span class="chip">${s.name}${s.mutagen ? ` 化${s.mutagen}` : ''}</span>`).join('')}
            </div>
          </div>
        `);
      }
    }

    // 关闭进阶明细的 <details>（主星/辅星/煞星/杂曜/神煞/流年星曜都在其中）
    sec.push('</details>');

    el.drawerBody.innerHTML = sec.join('');
    el.drawer.hidden = false;
    el.drawerMask.hidden = false;
  }

  function closeDrawer() {
    el.drawer.hidden = true;
    el.drawerMask.hidden = true;
  }

  /* ---------------- 启动 ---------------- */
  initShichen();
  initSegs();
  initEvents();
  initSpotlight();
  initReveal();
  initMonthSelect();
  initCompatShichen();
  initDayControls();
  initChartGestures();
  updateFavCount();
  initServiceWorker();

  // 测试钩子：暴露纯函数供 Node 环境验证（不影响浏览器行为）
  if (typeof window !== 'undefined') {
    window.__ziwei = {
      buildChartHTML, buildCenterHTML, palaceLabelOf,
      GRID_POS, SHICHEN,
    };
  }

  // 分享链接或刷新：URL 里带参数就直接恢复命盘
  restoreFromUrl();

})();