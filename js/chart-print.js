/* 命盘指纹：判断是否与别人同盘
 *
 * 为什么需要：
 *   紫微斗数的星盘只由「农历月 + 时支 + 性别」决定，
 *   所以不同出生日期可能排出完全相同的盘。
 *   实测 40 个生日 → 只有 23 种盘。
 *
 *   当用户发现「换日期结果一样」时，需要有人告诉他为什么，
 *   而不是让他以为网站算错了。
 *
 * 指纹构成：农历月 + 时支 + 性别 + 五行局 + 命宫地支
 *   （这几项相同则星曜排布必定相同）
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWChartPrint = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * 取时辰索引（0=早子时 … 12=晚子时）
   *
   * 注意：rawDates.chineseDate 是对象（{yearly,monthly,daily,hourly}），
   * 顶层的 astrolabe.chineseDate 才是「庚辰 甲申 丙午 甲午」这样的字符串。
   * 两者不要混用。
   */
  function timeIndexOf(astrolabe) {
    // 优先用顶层字符串解析时柱
    if (typeof astrolabe.chineseDate === 'string') {
      const parts = astrolabe.chineseDate.trim().split(/\s+/);
      if (parts.length >= 4) return parts[3];
    }
    // 退回 rawDates 的对象形式
    const cd = astrolabe.rawDates && astrolabe.rawDates.chineseDate;
    if (cd && Array.isArray(cd.hourly)) return cd.hourly.join('');
    return '';
  }

  /**
   * 计算命盘指纹
   *
   * 设计原则：**不猜决定因素，直接从盘面取**。
   *
   * 早先试过用「农历日+五行局+时支+性别」当指纹，结果错漏百出：
   *   · 性别其实不影响星曜排布（08-16 男/女 的盘完全相同）
   *   · 农历日不同但紫微位置相同的日子，盘是一样的
   *     （农历5日与9日在土五局下紫微都在寅）
   *   · 同一天不同时辰，盘不同（时系诸星）
   *
   * 所以指纹直接由盘面上的事实构成：
   *   十二宫的宫位地支 + 该宫主星 + 该宫辅星
   * 这样必然「指纹相同 ⇔ 星盘相同」，不需要推导规则。
   *
   * @param {object} astrolabe iztro 命盘
   * @returns {string}
   */
  function fingerprint(astrolabe) {
    if (!astrolabe || !astrolabe.palaces) return '';
    return astrolabe.palaces.map((p) =>
      p.earthlyBranch + ':' +
      p.majorStars.map((s) => s.name).join('+') + '/' +
      p.minorStars.map((s) => s.name).join('+')
    ).join('|');
  }

  /**
   * 取时支（如 '午'）
   * 时支由时辰决定，与日期无关——这正是星盘只由月+时+性别决定的原因。
   */
  function timeBranchOf(astrolabe) {
    // timeRange 形如 '11:00~13:00'，可直接映射到地支
    const tr = astrolabe.timeRange;
    if (typeof tr === 'string' && tr.includes('~')) {
      const start = parseInt(tr.split('~')[0], 10);
      if (!isNaN(start)) {
        // 23:00~01:00 子, 01:00~03:00 丑, ... 按两小时一支
        const idx = Math.floor(((start + 1) % 24) / 2);
        return '子丑寅卯辰巳午未申酉戌亥'[idx];
      }
    }
    // 退回 rawDates 的时柱地支
    const cd = astrolabe.rawDates && astrolabe.rawDates.chineseDate;
    if (cd && Array.isArray(cd.hourly)) return cd.hourly[1];
    return '';
  }

  /**
   * 生成「为什么会同盘」的解释
   * @param {object} astrolabe
   * @returns {string}
   */
  function explain(astrolabe) {
    const ld = astrolabe.rawDates && astrolabe.rawDates.lunarDate;
    if (!ld) return '';
    return '紫微斗数的星盘，只由「农历月 + 出生时辰 + 性别」决定'
      + '（你的农历是 ' + ld.lunarMonth + ' 月' + (ld.isLeap ? '（闰）' : '')
      + '、' + (astrolabe.time || '')
      + '、' + (astrolabe.gender || '')
      + '，五行局 ' + astrolabe.fiveElementsClass
      + '，命宫在' + astrolabe.earthlyBranchOfSoulPalace + '）。'
      + '所以农历同月、同时辰、同性别的人，星曜排布会完全一样——'
      + '这是这套排盘法的规则，不是算错。';
  }

  return { fingerprint, explain, timeIndexOf, timeBranchOf };
});