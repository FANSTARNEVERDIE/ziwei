/* ============================================================
 * 持久化：URL 状态 + 本地收藏夹
 *
 * 设计目标：
 *   1. 刷新页面不丢命盘（状态写进 URL）
 *   2. 能把命盘链接发给别人（URL 自包含）
 *   3. 能收藏多个命盘（localStorage，仅本机）
 *
 * 隐私：生辰只在本机 URL 与 localStorage 中流转，
 *       不发往任何服务器。用户可随时清除。
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const KEY = 'ziwei.favorites.v1';
  const MAX_FAVORITES = 60;

  /* ---------------- URL 状态 ---------------- */

  /**
   * 把起盘输入编码为查询串
   * 字段尽量短，链接好读也好转发
   */
  function encodeState(input) {
    if (!input) return '';
    const p = new URLSearchParams();
    const pad = (n) => String(n).padStart(2, '0');
    p.set('d', `${input.year}-${pad(input.month)}-${pad(input.day)}`);
    p.set('t', String(input.shichen));
    p.set('g', input.gender === '女' ? 'f' : 'm');
    if (input.calendar === 'lunar') p.set('c', 'l');
    // 农历闰月：不带上这个标记，分享出去的链接会排出另一张盘
    if (input.calendar === 'lunar' && input.isLeapMonth) p.set('lm', '1');
    if (input.trueSolar) {
      p.set('ts', '1');
      p.set('lon', String(input.longitude));
    }
    return p.toString();
  }

  /** 解析查询串为输入对象；无有效数据返回 null */
  function decodeState(search) {
    if (!search) return null;
    let p;
    try {
      p = new URLSearchParams(search.replace(/^\?/, ''));
    } catch (e) {
      return null;
    }
    const d = p.get('d');
    if (!d) return null;

    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(d);
    if (!m) return null;
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // 注意：p.get 缺失时返回 null，而 Number(null) === 0，
// 0 又是合法的「早子时」。必须显式判空，否则缺参数会静默变成子时。
    const tRaw = p.get('t');
    const t = tRaw === null ? NaN : Number(tRaw);
    const timeIndex = Number.isInteger(t) && t >= 0 && t <= 12 ? t : 6;

    const lonRaw = p.get('lon');
    const lon = lonRaw === null ? NaN : Number(lonRaw);

    return {
      calendar: p.get('c') === 'l' ? 'lunar' : 'solar',
      gender: p.get('g') === 'f' ? '女' : '男',
      year, month, day,
      shichen: timeIndex,
      trueSolar: p.get('ts') === '1',
      longitude: Number.isFinite(lon) && lon >= 73 && lon <= 135 ? lon : 120,
      // 只有农历才可能有闰月
      isLeapMonth: p.get('c') === 'l' && p.get('lm') === '1',
    };
  }

  /** 生成不含其它参数的完整分享链接 */
  function buildShareUrl(baseUrl, input) {
    const q = encodeState(input);
    const base = String(baseUrl || '').split('?')[0].split('#')[0];
    return q ? `${base}?${q}` : base;
  }

  /* ---------------- 本地收藏夹 ---------------- */

  /** localStorage 在隐私模式/禁用时会抛错，全部包起来 */
  function safeGet() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function safeSet(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** 是否可用（隐私模式下可能不可用） */
  function storageAvailable() {
    try {
      const k = '__zw_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** 列表：按保存时间倒序；读取时过滤掉损坏条目 */
  function listFavorites() {
    return sanitize(safeGet()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  }

  /** 同一生辰（忽略备注）视为同一条。
   *  闰月必须参与比较：农历闰二月和二月会排出不同的盘，
   *  若不区分，两条不同命盘会被当成同一条而互相覆盖。 */
  function sameChart(a, b) {
    return a && b &&
      a.year === b.year && a.month === b.month && a.day === b.day &&
      a.shichen === b.shichen && a.gender === b.gender &&
      a.calendar === b.calendar &&
      !!a.isLeapMonth === !!b.isLeapMonth;
  }

  /**
   * 生成唯一 id
   * 注意：不能只用 Date.now()——同一毫秒内连续保存两条会得到相同 id，
   * 而 removeFavorite 用 id 过滤，会一次删掉多条。
   */
  let idSeq = 0;
  function makeId(prefix) {
    idSeq = (idSeq + 1) % 100000;
    return (prefix || 'f') +
      Date.now().toString(36) +
      '-' + idSeq.toString(36) +
      Math.random().toString(36).slice(2, 6);
  }

  /**
   * 新增收藏。已存在同一命盘时更新备注并移到最前。
   * @returns {{ok:boolean, reason?:string, list:Array}}
   */
  function addFavorite(entry) {
    if (!storageAvailable()) {
      return { ok: false, reason: 'unavailable', list: [] };
    }
    const list = safeGet();
    const idx = list.findIndex((x) => sameChart(x, entry));
    const record = {
      id: (idx >= 0 && list[idx].id) ? list[idx].id : makeId('f'),
      label: (entry.label || '').trim().slice(0, 24),
      calendar: entry.calendar,
      gender: entry.gender,
      year: entry.year, month: entry.month, day: entry.day,
      shichen: entry.shichen,
      trueSolar: !!entry.trueSolar,
      longitude: entry.longitude,
      isLeapMonth: !!entry.isLeapMonth,
      // 这些字段会直接进 innerHTML（已转义）与列表布局，
      // 做长度截断防止被写入超长字符串撑爆界面
      solarDate: String(entry.solarDate || '').slice(0, 32),
      lunarDate: String(entry.lunarDate || '').slice(0, 32),
      soulStar: String(entry.soulStar || '').slice(0, 48),
      savedAt: Date.now(),
    };
    if (idx >= 0) {
      list.splice(idx, 1);
    }
    list.unshift(record);
    // 超出上限时丢弃最旧的
    while (list.length > MAX_FAVORITES) list.pop();

    const ok = safeSet(list);
    return { ok, list: listFavorites(), reason: ok ? undefined : 'write-failed' };
  }

  function removeFavorite(id) {
    const list = sanitize(safeGet()).filter((x) => x.id !== id);
    safeSet(list);
    return listFavorites();
  }

  function clearFavorites() {
    safeSet([]);
    return [];
  }

  /** 当 localStorage 不可用时的降级：仅本次会话内存中保留 */
  let memory = [];
  function listFavoritesFallback() { return memory.slice().sort((a, b) => b.savedAt - a.savedAt); }
  function addFavoriteFallback(entry) {
    const idx = memory.findIndex((x) => sameChart(x, entry));
    if (idx >= 0) memory.splice(idx, 1);
    memory.unshift(Object.assign(
      { id: makeId('m'), savedAt: Date.now() },
      entry,
      // 同样做截断，与 localStorage 路径保持一致
      {
        solarDate: String(entry.solarDate || '').slice(0, 32),
        lunarDate: String(entry.lunarDate || '').slice(0, 32),
        soulStar: String(entry.soulStar || '').slice(0, 48),
      }
    ));
    while (memory.length > MAX_FAVORITES) memory.pop();
    return { ok: true, list: listFavoritesFallback() };
  }

  /** 读取端也做一次过滤：外部写入的损坏条目不应影响渲染 */
  function sanitize(list) {
    if (!Array.isArray(list)) return [];
    return list.filter((x) => x && typeof x === 'object' &&
      typeof x.id === 'string' &&
      Number.isFinite(Number(x.year)) &&
      Number.isFinite(Number(x.month)) &&
      Number.isFinite(Number(x.day)));
  }

  return {
    KEY, MAX_FAVORITES,
    encodeState, decodeState, buildShareUrl,
    storageAvailable,
    listFavorites, addFavorite, removeFavorite, clearFavorites,
    listFavoritesFallback, addFavoriteFallback,
    sameChart, makeId, sanitize,
  };
});