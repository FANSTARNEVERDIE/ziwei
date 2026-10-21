/* ============================================================
 * 四化的「庙陷与例外」——依《紫微斗数精成》原文
 *
 * 出处：《紫微斗数精成》上编 第八章 诸星落命宫参断
 *       23、四化星（p239–246）
 *
 * 为什么需要这个文件：
 *   我们原先的 72 条「星×四化」把化忌一律写成负面。
 *   但原书明确说：
 *
 *     「化忌不一定凶，必须看所化之星是什么星？是庙旺还是失陷？
 *       落在何宫？若化星庙旺时，则有旺地化忌不忌之论，灾咎轻，
 *       虽有阻滞，但终能成功。」
 *
 *   并且给出了具体例外（原文见每条 src 字段）：
 *     · 金水之星庙旺化忌更是不忌 —— 太阴在酉戌亥子、武曲在巳（长生之地）
 *     · 木火之星庙旺化忌仍为有福论 —— 太阳在寅卯辰巳午、天机在卯
 *       （但多富而不贵，或只贵而不富）
 *     · 天同在戌宫化忌，丁生人反吉
 *     · 巨门在辰宫化忌，辛生人反吉
 *     · 廉贞在亥化忌，火入水乡，逢水命人化忌也不为害
 *     · 属精神性的星曜在命宫化忌，反主头脑变得冷静
 *     · 命宫逢化忌宜迟婚、宜从事学术研究/特殊技艺/武职
 *
 * 本文件只做「把原书规则编码成可查询表」的工作，
 * 不改写原书意思。每条例外都带 src 引用原文。
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWSihuaException = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /* 「旺地化忌不忌」：星 + 所在宫支 → 说明
   * 宫支取自 iztro  palace.earthlyBranch
   */
  const JI_NOT_BAD = {
    '太阴': {
      branches: ['酉', '戌', '亥', '子'],
      text: '太阴属金水，庙旺之地化忌不忌，仍兼有富贵，只是心里容易多想。',
      src: '金水之星庙旺化忌，更是不忌，仍是兼有富贵，如太阴在酉戌亥子化忌',
    },
    '武曲': {
      branches: ['巳'],
      text: '武曲在巳为长生之地，化忌不作凶论，只是钱财上要多留意。',
      src: '武曲化忌在已宫为长生之地等',
    },
    '太阳': {
      branches: ['寅', '卯', '辰', '巳', '午'],
      text: '太阳属木火，庙旺化忌仍为有福论，但多富而不贵，或只贵而不富。',
      src: '若木火之星庙旺化忌，如太阳在寅卵卯辰已午化忌……仍为有福论，但多富而不贵或只贵而不富',
    },
    '天机': {
      branches: ['卯'],
      text: '天机在卯化忌仍为有福论，但多富而不贵，或只贵而不富。',
      src: '天机在卯化忌，仍为有福论，但多富而不贵或只贵而不富',
    },
  };

  /* 「生年干」相关的反吉：星 + 宫支 + 生年天干 → 说明 */
  const STEM_REVERSE = {
    '天同@戌': {
      stem: '丁',
      text: '天同在戌宫化忌，丁年生人反吉。',
      src: '天同在成宫化忌，丁生人反吉',
    },
    '巨门@辰': {
      stem: '辛',
      text: '巨门在辰宫化忌，辛年生人反吉。',
      src: '巨门在辰宫化忌，辛生人反吉',
    },
    '廉贞@亥': {
      stem: null,          // 不限天干，但需水命人
      waterOnly: true,
      text: '廉贞在亥化忌为「火入水乡」，若又是水命人，化忌也不为害。',
      src: '廉贞在亥化忌，是为火入水乡，又逢水命人，化忌也不为害',
    },
  };

  /* 原书对化忌的通用态度（可用于所有化忌的补充说明） */
  const JI_GENERAL = {
    notAlwaysBad: '化忌不一定凶——要看所化之星是庙旺还是失陷、落在哪一宫。',
    src: '化忌不一定凶，必须看所化之星是什么星？是庙旺还是失陷？落在何宫？',
    advice: '命宫逢化忌，宜迟婚，宜从事学术研究、特殊技艺或武职。凡事多忍耐则能混过去。',
    srcAdvice: '命宫逢化忌，宜迟婚，宜有宗教信仰，宜从事学术研究、特殊技艺、武职等。凡事多忍耐则能混过去。',
    debtMeaning: '化忌有「亏欠」之意——落在哪一宫，就代表你在那一块上「欠着债」，注定要花力气去补。',
    srcDebt: '化忌有"亏欠、欠债"之意，入那一宫即表示欠该宫的债',
    spiritual: '属精神性的星曜在命宫化忌，反主头脑变得冷静。',
    srcSpiritual: '属精神性的星曜在命官化忌，反主头脑变得冷静。',
  };

  /* 六十甲子纳音（用于判断「水命人」） */
  const NAYIN = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
    '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
  };

  /**
   * 判断是否「水命人」（年柱纳音属水）
   *
   * 原书多处提到「水命人」「水局人」化忌不忌，
   * 所以这个判断必须真的算，不能默认套用到所有人身上。
   * @param {string} yearPillar 年柱干支，如 '庚子'
   * @returns {boolean}
   */
  function isWaterFate(yearPillar) {
    const ny = NAYIN[yearPillar];
    return !!ny && ny.includes('水');
  }

  /**
   * 查询某星的化忌是否属于「旺地不忌」
   * @param {string} star 星名
   * @param {string} branch 该星所在宫的地支（如 '亥'）
   * @param {object} [ctx] { yearPillar } 用于需要水命人条件的条目
   * @returns {{text:string,src:string}|null}
   */
  function jiNotBad(star, branch, ctx) {
    const row = JI_NOT_BAD[star];
    if (!row || !branch) return null;
    if (!row.branches.includes(branch)) return null;
    // 需水命人的条目：条件不满足时不给例外，避免误判
    if (row.waterOnly) {
      const yp = ctx && ctx.yearPillar;
      if (!yp || !isWaterFate(yp)) return null;
    }
    return { text: row.text, src: row.src };
  }

  /**
   * 查询生年干导致的反吉
   *
   * 注意：原书说「廉贞在亥化忌，是为火入水乡，又逢水命人，化忌也不为害」——
   * 条件是「水命人」，不是无条件成立。这里按条件判断，避免误判。
   *
   * @param {string} star 星名
   * @param {string} branch 宫支
   * @param {string} yearStem 生年天干
   * @param {string} [yearPillar] 年柱（判断水命用）
   * @returns {{text:string,src:string}|null}
   */
  function stemReverse(star, branch, yearStem, yearPillar) {
    const key = star + '@' + branch;
    const row = STEM_REVERSE[key];
    if (!row) return null;
    if (row.waterOnly) {
      // 只有水命人才成立；传进来年柱就判，判不了就不给结论
      if (!yearPillar || !isWaterFate(yearPillar)) return null;
      return { text: row.text, src: row.src };
    }
    if (row.stem && row.stem === yearStem) return { text: row.text, src: row.src };
    return null;
  }

  return {
    JI_NOT_BAD, STEM_REVERSE, JI_GENERAL, NAYIN,
    jiNotBad, stemReverse, isWaterFate,
  };
});