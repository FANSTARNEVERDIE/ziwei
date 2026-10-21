/* 同盘者的区分层——依「生日干四化」
 *
 * 为什么需要：
 *   紫微斗数的星盘只由「农历月 + 时支 + 性别」决定。
 *   实测 40 个不同生日 → 只有 23 种盘：
 *     2000-08-04、2000-08-08、2000-08-16 排出的盘完全相同
 *   他们的日柱不同，但传统紫微斗数不用日柱定盘。
 *   所以「不同日期的人得到相同结果」不是 bug，是体系本身如此。
 *
 * 依据：《紫微斗数精成》上编 第八章 23、四化星「四化应用概论」
 *   「生年干、生月干、生日干、生时干……均可飞四化」
 *   「日干四化仅对自己和配偶及中年稍有影响」
 *   「（生年干四化为主，生月干为辅，日时干四化可不看）」
 *
 * 定位：本层是「补充参考」，不是主论断。
 *       原书明确说日干四化影响有限，界面上必须如实标注，
 *       否则会让用户以为这是紫微斗数的主要判断依据。
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWDayLayer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---- 天干四化（依原书口诀）---- */
  const STEM_HUA = {
    '甲': ['廉贞', '破军', '武曲', '太阳'],
    '乙': ['天机', '天梁', '紫微', '太阴'],
    '丙': ['天同', '天机', '文昌', '廉贞'],
    '丁': ['太阴', '天同', '天机', '巨门'],
    '戊': ['贪狼', '太阴', '右弼', '天机'],
    '己': ['武曲', '贪狼', '天梁', '文曲'],
    '庚': ['太阳', '武曲', '太阴', '天同'],
    '辛': ['巨门', '太阳', '文曲', '文昌'],
    '壬': ['天梁', '紫微', '左辅', '武曲'],
    '癸': ['破军', '巨门', '太阴', '贪狼'],
  };
  const HUA_NAMES = ['禄', '权', '科', '忌'];

  /* ---- 日干地支的时辰映射提示 ----
   * 原书未就「日支」给出独立论断，这里不使用自造内容。
   * 只如实呈现日柱干支本身。
   */

  /* 每类四化在「次要层」的语气提示。
   * 不做性格描写（原书没有相应论述），
   * 只说明这个四化会让该领域「顺」还是「要留心」。 */
  const HUA_TONE = {
    '禄': { label: '顺', text: '这一块比较容易得到资源与助力' },
    '权': { label: '强', text: '这一块会想抓主动权、也容易费力' },
    '科': { label: '名', text: '这一块容易被看见、得到认可' },
    '忌': { label: '留心', text: '这一块需要多花心思、容易卡住' },
  };

  /**
   * 取某天干的四化星列表
   * @param {string} stem 天干
   * @returns {{star:string,hua:string}[]}
   */
  function huaOf(stem) {
    const arr = STEM_HUA[stem];
    if (!arr) return [];
    return arr.map((star, i) => ({ star, hua: HUA_NAMES[i] }));
  }

  /**
   * 取日柱信息
   *
   * 注意：chineseDate 在不同位置类型不同——
   *   astrolabe.chineseDate        是字符串 '庚辰 甲申 甲午 庚午'
   *   astrolabe.rawDates.chineseDate 是对象 {yearly,monthly,daily,hourly}
   * 这里同时兼容两种。
   *
   * @param {string|object} chineseDate
   */
  function dayPillar(chineseDate) {
    if (!chineseDate) return null;

    let stem, branch;
    if (typeof chineseDate === 'string') {
      const parts = chineseDate.trim().split(/\s+/);
      if (parts.length < 3) return null;
      const p = parts[2];
      stem = p[0]; branch = p[1];
    } else if (chineseDate.daily && Array.isArray(chineseDate.daily)) {
      stem = chineseDate.daily[0];
      branch = chineseDate.daily[1];
    } else {
      return null;
    }

    if (!stem || !branch) return null;
    return { pillar: stem + branch, stem, branch };
  }

  /**
   * 计算「生日干四化」落在本命盘哪一宫
   *
   * @param {object} astrolabe iztro 命盘
   * @returns {null|{pillar,stem,branch,hua:[{star,hua,starType,palace,palaceLabel,tone,note}]}}
   */
  function buildDayLayer(astrolabe) {
    if (!astrolabe || !astrolabe.chineseDate) return null;
    const dp = dayPillar(astrolabe.chineseDate);
    if (!dp) return null;
    const stars = STEM_HUA[dp.stem];
    if (!stars) return null;

    const hua = [];
    stars.forEach((starName, i) => {
      const huaType = HUA_NAMES[i];
      // 找这颗星落在本命盘哪一宫
      let palace = null;
      let starType = '';
      astrolabe.palaces.forEach((p) => {
        p.majorStars.forEach((s) => {
          if (s.name === starName) { palace = p.name; starType = 'major'; }
        });
        p.minorStars.forEach((s) => {
          if (s.name === starName && !palace) { palace = p.name; starType = 'minor'; }
        });
      });

      const tone = HUA_TONE[huaType];
      hua.push({
        star: starName,
        hua: huaType,
        starType,
        palace,
        palaceLabel: palace ? (palace.endsWith('宫') ? palace : palace + '宫') : '',
        tone: tone.label,
        note: tone.text,
      });
    });

    return {
      pillar: dp.pillar,
      stem: dp.stem,
      branch: dp.branch,
      hua,
    };
  }

  /**
   * 生成同盘区分的说明文本
   * 用于向用户解释：为什么两个人盘相同、又为什么仍有差别
   */
  function buildNote(astrolabe, hasSameChartMate) {
    const layer = buildDayLayer(astrolabe);
    if (!layer) return null;

    const ji = layer.hua.find((h) => h.hua === '忌');
    const lu = layer.hua.find((h) => h.hua === '禄');

    return {
      layer,
      heading: '同盘者的区别（参考）',
      intro: hasSameChartMate
        ? '你的星盘与同月同时辰出生的人相同——这是紫微斗数的算法决定的，'
          + '星盘只由农历月、时辰、性别定出。'
          + '但出生日的干支不同，古人另有一条「日干四化」的辅助看法，'
          + '可以用来分辨同盘的人。'
        : '古人除生年四化外，另有「日干四化」的辅助看法。'
          + '原书注明它影响有限，只能作参考。',
      src: '《紫微斗数精成》上编第八章 23、四化星「四化应用概论」：'
        + '生年干、生月干、生日干、生时干……均可飞四化；'
        + '日干四化仅对自己和配偶及中年稍有影响。'
        + '（生年干四化为主，生月干为辅，日时干四化可不看）',
      summary: [
        `你的日柱是「${layer.pillar}」`,
        ji ? `日干四化里最需留意的是「${ji.star}化忌」${ji.palaceLabel ? '落在' + ji.palaceLabel : ''}` : '',
        lu ? `比较顺的是「${lu.star}化禄」${lu.palaceLabel ? '落在' + lu.palaceLabel : ''}` : '',
      ].filter(Boolean).join('，') + '。',
    };
  }

  return { STEM_HUA, HUA_NAMES, huaOf, dayPillar, buildDayLayer, buildNote };
});