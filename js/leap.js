/* ============================================================
 * 农历闰月工具
 *
 * 背景：紫微斗数排盘时，闰月与非闰月会排出不同的盘
 * （iztro 的 fixLeap=true 会把闰月前半月算上个月、后半月算下个月）。
 * 用户若不知道自己生在闰月，就会拿到错误的命盘。
 *
 * 难点：iztro 的 byLunar 在「该月并无闰月」时会静默忽略 isLeapMonth，
 *       不报错。因此不能靠返回值判断，必须显式查询。
 *
 * 性能：运行时逐月探测，无闰月的年份要试满 12 次排盘（实测约 200ms）。
 *       闰月是固定的历史事实，故预生成 js/lunar-table.js 查表，
 *       运行时 O(1)。表未覆盖的年份才回退到实时探测。
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWLeap = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /* 表未命中时的探测结果缓存 */
  const cache = new Map();
  const dayCache = new Map();

  function table() {
    return (typeof window !== 'undefined' && window.ZWLunarTable) ||
      (typeof self !== 'undefined' && self.ZWLunarTable) ||
      (typeof module !== 'undefined' && module.exports ? tryRequire() : null);
  }

  // Node 环境下直接 require（浏览器里走全局变量）
  let _table = null;
  function tryRequire() {
    if (_table) return _table;
    try {
      // eslint-disable-next-line global-require
      _table = require('./lunar-table.js');
    } catch (e) {
      _table = null;
    }
    return _table;
  }

  /** 判断某年某月是否为闰月（运行时探测，仅用于表未覆盖的年份） */
  function monthIsLeapProbe(astro, lunarYear, lunarMonth) {
    try {
      const a = astro.byLunar(`${lunarYear}-${lunarMonth}-1`, 6, '男', true, true, 'zh-CN');
      const raw = a.rawDates && a.rawDates.lunarDate;
      return !!(raw && raw.isLeap && raw.lunarMonth === Number(lunarMonth));
    } catch (e) {
      return false;
    }
  }

  /**
   * 查询某农历年的闰月月份
   * @param {object} astro iztro 的 astro 对象（仅表未命中时使用）
   * @param {number} lunarYear
   * @returns {number} 闰月月份 1-12；无闰月返回 0
   */
  function leapMonthOf(astro, lunarYear) {
    const y = Number(lunarYear);
    if (!Number.isInteger(y)) return 0;

    const T = table();
    if (T && T.leap && y >= T.START && y <= T.END) {
      return Number(T.leap[y]) || 0;
    }

    // 表未覆盖：回退到探测（结果缓存）
    if (cache.has(y)) return cache.get(y);
    if (!astro) return 0;

    let result = 0;
    for (let m = 1; m <= 12; m++) {
      if (monthIsLeapProbe(astro, y, m)) { result = m; break; }
    }
    cache.set(y, result);
    return result;
  }

  /** 该年该月是否为闰月 */
  function isLeapMonth(astro, lunarYear, lunarMonth) {
    return leapMonthOf(astro, lunarYear) === Number(lunarMonth);
  }

  /**
   * 该农历月共有多少天（29 或 30）
   *
   * 农历月只有 29 或 30 天，不必逐日试探（实测 30 次排盘要 666ms）。
   * 优先查表；表未命中时用「第 30 天是否仍属本月」判断，1 次排盘即可。
   */
  function daysInMonth(astro, lunarYear, lunarMonth, isLeap) {
    const y = Number(lunarYear), m = Number(lunarMonth);
    if (!Number.isInteger(y) || !Number.isInteger(m)) return 29;

    const T = table();
    if (T && T.days && y >= T.START && y <= T.END) {
      const bits = T.days[y];
      if (typeof bits === 'string' && bits.length >= 13) {
        const pos = isLeap ? 12 : (m - 1);
        const ch = bits.charAt(pos);
        if (ch === '1') return 30;
        if (ch === '0') return 29;
      }
    }

    const key = `${y}-${m}-${isLeap ? 1 : 0}`;
    if (dayCache.has(key)) return dayCache.get(key);
    if (!astro) return 29;

    let days = 29;
    try {
      const a = astro.byLunar(`${y}-${m}-30`, 6, '男', !!isLeap, true, 'zh-CN');
      const raw = a.rawDates && a.rawDates.lunarDate;
      if (raw && raw.lunarMonth === m && raw.lunarDay === 30 && !!raw.isLeap === !!isLeap) {
        days = 30;
      }
    } catch (e) { days = 29; }

    dayCache.set(key, days);
    return days;
  }

  /** 该年是否有闰月 */
  function hasLeapMonth(astro, lunarYear) {
    return leapMonthOf(astro, lunarYear) > 0;
  }

  function clearCache() { cache.clear(); dayCache.clear(); }

  return {
    leapMonthOf, monthIsLeapProbe, isLeapMonth, daysInMonth, hasLeapMonth, clearCache,
  };
});