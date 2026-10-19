/* ============================================================
 * 紫微斗数 · 白话解读知识库
 * 把术语翻译成普通人能懂的话。
 * 内容为传统紫微斗数的通行说法，属文化参考。
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWInterpret = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /* ---------------- 十四主星 ---------------- */

  const STARS = {
    '紫微': {
      tag: '帝王之星',
      essence: '天生的主事者，在意体面，习惯把事情扛在自己肩上',
      good: '有主见、能统筹全局、抗压强，关键时刻稳得住',
      issue: '放不下架子，不轻易低头；听不进反对意见时容易把自己孤立',
      advice: '把「面子」换成「目标」，你会发现愿意合作的人比想象中多',
      keys: ['领导', '自尊', '统筹']
    },
    '天机': {
      tag: '智慧之星',
      essence: '脑子转得快，凡事想三步，但也容易把自己绕进去',
      good: '分析力强、点子多、学东西快、擅长做规划',
      issue: '想太多、决断慢、容易焦虑；计划被打乱时心态易崩',
      advice: '给自己设一个「决策截止时间」，想清楚就动手，比想完美更重要',
      keys: ['谋略', '变动', '思虑']
    },
    '太阳': {
      tag: '光明之星',
      essence: '愿意付出、照拂别人，天生有股「要把事情做给所有人看」的劲',
      good: '热情、有担当、能带头，名声容易显出来',
      issue: '付出过度却不被领情；太在意外界评价，容易累',
      advice: '学会分辨「值得的人」，把光留一部分给自己',
      keys: ['付出', '名声', '长辈缘']
    },
    '武曲': {
      tag: '财星 · 将星',
      essence: '行动派，讲效率不信空话，认定的事一定做完',
      good: '执行力强、能扛事、对钱务实、抗打击能力强',
      issue: '太硬、话少、不懂转弯，容易把关系处成「公事公办」',
      advice: '刻意练习表达感受，你会少走很多弯路',
      keys: ['财运', '刚毅', '执行']
    },
    '天同': {
      tag: '福星',
      essence: '天性温软，喜欢舒服自在，不太爱跟人争',
      good: '人缘好、情绪感染力强、懂得享受生活、常有贵人',
      issue: '容易懒散、逃避困难、依赖心偏重',
      advice: '给自己找一个「非做不可」的目标，福气才不会被浪费',
      keys: ['福气', '温和', '享受']
    },
    '廉贞': {
      tag: '次桃花 · 公关之星',
      essence: '情感浓烈、爱恨分明，对美和人际有天生的敏感',
      good: '有魅力、懂人情、才艺多、能处理复杂局面',
      issue: '情绪起伏大、容易钻牛角尖，感情上常纠结',
      advice: '把强烈的情绪转成创作或专业能力，它会成为你的武器',
      keys: ['桃花', '才艺', '情绪']
    },
    '天府': {
      tag: '库星 · 财库',
      essence: '稳重保守，喜欢把东西存起来，天生有管理的sense',
      good: '包容、稳当、会管钱、擅长守成',
      issue: '太保守、容易错过机会、安于现状',
      advice: '定期逼自己走出舒适区，你的「稳」是优势，不是借口',
      keys: ['守成', '包容', '财库']
    },
    '太阴': {
      tag: '月亮之星',
      essence: '心思细腻，感受力强，喜欢安静整洁的环境',
      good: '体贴、有耐心、审美在线，钱和关系都擅长慢慢积累',
      issue: '容易内耗、想太多、不擅长表达自己的需求',
      advice: '把感受说出来。别人不是不关心，是猜不到',
      keys: ['细腻', '积累', '女性长辈缘']
    },
    '贪狼': {
      tag: '桃花之星',
      essence: '欲望强、学什么都快，什么都想试一试',
      good: '多才多艺、社交广、学习力强、适应环境快',
      issue: '兴趣太散、难以专注、容易贪多嚼不烂',
      advice: '挑一件最有感觉的深耕三年，你会远超同龄人',
      keys: ['才艺', '社交', '欲望']
    },
    '巨门': {
      tag: '暗星 · 口舌之星',
      essence: '靠嘴和脑子吃饭的人，看问题一针见血',
      good: '口才好、分析深、有研究精神、能挖出真相',
      issue: '说话直容易得罪人、易陷入口舌是非、疑心偏重',
      advice: '同一句话换个说法，你的专业度会被更多人接受',
      keys: ['口才', '研究', '是非']
    },
    '天相': {
      tag: '印星 · 辅佐之星',
      essence: '天生的协调者，讲究公平，是团队里的黏合剂',
      good: '会做人、有分寸、能协调、衣着品味通常不错',
      issue: '优柔寡断、太在意平衡、容易被当成「老好人」',
      advice: '该表态时明确表态，协调不等于和稀泥',
      keys: ['协调', '公正', '辅佐']
    },
    '天梁': {
      tag: '荫星 · 长者星',
      essence: '老成持重，像天生带着「保护别人」的设定',
      good: '有原则、能化解危机、长辈缘好、值得信赖',
      issue: '爱说教、管太多、容易替别人操心',
      advice: '帮别人之前先问一句「你需要吗」，善意会更有效',
      keys: ['庇护', '原则', '长辈缘']
    },
    '七杀': {
      tag: '将星 · 肃杀',
      essence: '敢冲敢拼，天生不服输，节奏比一般人快',
      good: '决断力强、能开创局面、抗压、执行凶猛',
      issue: '太急、易冲动、人生起伏大、不太会踩刹车',
      advice: '动手前留三天冷静期，你的胜率会明显提高',
      keys: ['开创', '冲劲', '变革']
    },
    '破军': {
      tag: '耗星 · 开创之星',
      essence: '天生要「打破重来」的人，不安于现状',
      good: '有魄力、敢革新、能置之死地而后生、适应剧变',
      issue: '消耗大、反复折腾、难以积累',
      advice: '分清「该破的」和「值得守的」，别把好牌也一起推倒',
      keys: ['破立', '变革', '消耗']
    }
  };

  /* ---------------- 十二宫位 ---------------- */

  const PALACES = {
    '命宫': {
      title: '你是谁',
      what: '整张盘的核心，代表你的本性、天赋和人生基调。',
      how: '初学者先看这里——你的性格底色、天生的做事方式，全在这一宫。',
      weight: 1
    },
    '兄弟': {
      title: '手足与伙伴',
      what: '你和兄弟姐妹、同龄朋友、合作伙伴的相处模式。',
      how: '看你和「平辈」的关系质量，以及能不能靠合作成事。',
      weight: 3
    },
    '夫妻': {
      title: '感情与伴侣',
      what: '你的感情模式，以及容易吸引到什么样的伴侣。',
      how: '反映你对亲密关系的期待和习惯，不是「注定和谁在一起」。',
      weight: 2
    },
    '子女': {
      title: '子女与创造',
      what: '你和子女的关系，也代表创造力、作品和晚辈缘。',
      how: '除了子女，也看你的「作品」和带人的方式。',
      weight: 4
    },
    '财帛': {
      title: '赚钱方式',
      what: '你的金钱观和赚钱路径——稳扎稳打还是快进快出。',
      how: '重点不是「有多少钱」，而是「钱怎么来、怎么留」。',
      weight: 2
    },
    '疾厄': {
      title: '身体与压力',
      what: '身体底子，以及面对压力时的反应模式。',
      how: '提醒你留意哪一类消耗。这是生活提醒，不是医学诊断。',
      weight: 5
    },
    '迁移': {
      title: '在外与机遇',
      what: '你出门在外的状态、外部机遇，也代表别人眼中的你。',
      how: '和命宫互为表里：命宫是内在的你，迁移是别人看到的你。',
      weight: 3
    },
    '仆役': {
      title: '朋友与人脉',
      what: '你和朋友、同事、下属的人际关系质量。',
      how: '看你的「人际圈」是助力还是消耗。',
      weight: 4
    },
    '交友': {
      title: '朋友与人脉',
      what: '你和朋友、同事、下属的人际关系质量。',
      how: '看你的「人际圈」是助力还是消耗。',
      weight: 4
    },
    '官禄': {
      title: '事业与舞台',
      what: '你的事业方向和工作方式，适合什么样的舞台。',
      how: '不是规定你做什么职业，而是你用什么方式做事最顺。',
      weight: 2
    },
    '田宅': {
      title: '家与财库',
      what: '居住环境、不动产，也代表你的「财库」和家庭氛围。',
      how: '看你是否守得住钱，以及需要一个什么样的安身之所。',
      weight: 4
    },
    '福德': {
      title: '内心与快乐',
      what: '你的精神世界和享受方式——什么事让你真正快乐。',
      how: '这一宫好，日子再难也撑得住；这一宫弱，外在再好也难满足。',
      weight: 3
    },
    '父母': {
      title: '长辈与文书',
      what: '你和父母、长辈、上司的关系，也代表学习与文书。',
      how: '看你和「上位者」的缘分，以及读书考试的顺逆。',
      weight: 4
    }
  };

  /* 宫位的「短说法」：适合嵌进句子里，避免词典式的生硬表述 */
  const PALACE_SHORT = {
    '命宫': '你的本性天赋',
    '兄弟': '手足与平辈关系',
    '夫妻': '感情与伴侣',
    '子女': '子女、作品与晚辈',
    '财帛': '赚钱方式与金钱观',
    '疾厄': '身体与压力反应',
    '迁移': '在外发展与外部机遇',
    '仆役': '朋友与人脉',
    '交友': '朋友与人脉',
    '官禄': '事业与工作方式',
    '田宅': '家庭环境与财库',
    '福德': '内心世界与精神享受',
    '父母': '长辈缘与文书学业'
  };
  Object.keys(PALACES).forEach((k) => {
    if (PALACE_SHORT[k]) PALACES[k].short = PALACE_SHORT[k];
  });

  /* ---------------- 四化 ---------------- */

  const SIHUA = {
    '禄': {
      name: '化禄',
      plain: '增益、顺遂、机会',
      meaning: '这颗星所在的地方，资源比较顺，容易有额外的收获或助力。',
      lead: '比较有资源和福气，容易有额外收获',
      tip: '这里的机会偏「顺」，适合主动争取。',
      tone: 'good'
    },
    '权': {
      name: '化权',
      plain: '掌控、主导、强势',
      meaning: '这颗星所在的地方，你会想抓在手里，也容易掌握主动权。',
      lead: '会想抓主动权，掌控欲比较强',
      tip: '这里的能量偏「强」，适合承担责任、也容易和人较劲。',
      tone: 'good'
    },
    '科': {
      name: '化科',
      plain: '名声、清誉、贵人',
      meaning: '这颗星所在的地方，容易得到认可、名声和他人的帮助。',
      lead: '容易得到认可、名声和贵人帮忙',
      tip: '这里的能量偏「名」，适合靠口碑和作品说话。',
      tone: 'good'
    },
    '忌': {
      name: '化忌',
      plain: '阻碍、执念、欠缺',
      meaning: '这颗星所在的地方，容易卡住、放不下，是需要多花心思的功课。',
      lead: '是需要多花心思的地方，容易卡住、放不下',
      tip: '传统上把化忌看作「功课」——这里费力，但也往往是你成长最快的地方。',
      tone: 'caution'
    }
  };

  /* ---------------- 辅星 / 煞星 ---------------- */

  const MINOR = {
    '左辅': { kind: 'aux', plain: '贵人相助', detail: '代表助力，做事容易得到帮手。' },
    '右弼': { kind: 'aux', plain: '贵人相助', detail: '代表助力，与左辅同为「辅佐」，落宫处多得支持。' },
    '文昌': { kind: 'aux', plain: '文采与条理', detail: '主聪明、文书、考试，也代表条理性。' },
    '文曲': { kind: 'aux', plain: '才艺与口才', detail: '主才华、艺术、表达，感性的一面。' },
    '天魁': { kind: 'aux', plain: '男性贵人', detail: '遇事容易得到长辈或男性贵人提携。' },
    '天钺': { kind: 'aux', plain: '女性贵人', detail: '遇事容易得到长辈或女性贵人提携。' },
    '禄存': { kind: 'aux', plain: '财禄与保守', detail: '代表稳定的财与福，但性格偏保守、不喜变动。' },
    '天马': { kind: 'aux', plain: '奔波与变动', detail: '主走动、外出、变动，与禄存同宫称「禄马交驰」，利于动中生财。' },
    '擎羊': { kind: 'sha', plain: '刚烈与冲突', detail: '代表冲劲也代表冲突，容易急躁、有伤，但用于开创反而有力。' },
    '陀罗': { kind: 'sha', plain: '拖延与纠缠', detail: '代表拖磨、反复，事情容易拖长，适合需要耐心的领域。' },
    '火星': { kind: 'sha', plain: '急躁与爆发', detail: '代表突发、急躁、冲动。与贪狼同宫时有「火贪」暴发之说。' },
    '铃星': { kind: 'sha', plain: '急烈与暗动', detail: '性质近火星，偏阴，情绪容易内压后爆发。' },
    '地空': { kind: 'sha', plain: '落空与超脱', detail: '代表想法超前、不落实，也可能带来精神层面的领悟。' },
    '地劫': { kind: 'sha', plain: '耗损与波折', detail: '代表计划外的消耗与波折，提醒留出余量。' },
    '天姚': { kind: 'aux', plain: '人缘与风情', detail: '代表异性缘与社交魅力。' },
    '红鸾': { kind: 'aux', plain: '婚喜之星', detail: '主喜事、感情机会。' },
    '天喜': { kind: 'aux', plain: '喜庆之星', detail: '主喜庆、开心的事。' }
  };

  /* ---------------- 术语词典 ---------------- */

  const TERMS = {
    '命宫': '整张盘的第一宫，代表你的本性、天赋和人生基调。看盘通常从这里开始。',
    '身宫': '代表你后天的行为方式和人生着力点。身宫和命宫同宫称「命身同宫」，性格表里如一。',
    '五行局': '由命宫干支推出的一个数值（水二局、木三局等），决定你几岁起运、大限怎么排。',
    '命主': '先天特质的主星，代表你骨子里的底色。',
    '身主': '后天行为的主星，代表你长大后展现出来的样子。',
    '主星': '十四颗主要星曜，是解读的核心。紫微、天府、太阳、太阴等。',
    '辅星': '左辅、右弼、文昌、文曲、天魁、天钺等，代表助力与才华。',
    '煞星': '擎羊、陀罗、火星、铃星、地空、地劫。代表阻力，但也常是冲劲的来源。',
    '四化': '星曜的四种变化标记：化禄、化权、化科、化忌。用来判断「哪里顺、哪里卡」。',
    '化禄': '增益、顺遂、机会。落在哪一宫，那里资源就比较顺。',
    '化权': '掌控、主导、强势。落在哪一宫，那里你会想抓在手里。',
    '化科': '名声、清誉、贵人。落在哪一宫，那里容易得到认可。',
    '化忌': '阻碍、执念、欠缺。落在哪一宫，那里需要多花心思。',
    '庙旺利陷': '星曜在不同宫位的状态强弱。庙、旺为状态好，能量顺畅；平、得为中等；陷为状态弱，要多努力。',
    '大限': '每十年一个阶段，代表这十年的人生主题。相当于「十年运势」。',
    '流年': '具体某一年的运势重点。切换年份就能看不同年份。',
    '小限': '另一种按年龄推算的年度宫位，与大限流年配合参考。',
    '天干地支': '中国传统纪年方式。天干十个（甲乙丙…），地支十二个（子丑寅…），组合成六十年一轮。',
    '虚岁': '中国传统年龄算法，出生即算一岁，每过农历新年加一岁。比周岁通常大一岁左右。',
    '真太阳时': '按出生地经度校正后的真实太阳时间。中国统一用北京时间，但新疆等地实际日照时间差很多，校正后时辰可能不同。',
    '本命盘': '按出生时间排出的固定命盘，一生不变。',
    '对宫': '在盘面上与你相对的宫位。本宫无主星时，传统上会借对宫的星来参考。',
    '三方四正': '本宫、对宫，加上左右各隔三格的两个宫，合称三方四正。看一个宫位时要一起看。',
    '闰月': '农历为了和阳历对齐，每隔几年会多加一个月份，叫闰月。'
  };

  /* ---------------- 怎么看这张盘（新手导读） ---------------- */

  const GUIDE = [
    {
      step: '01',
      title: '先看白话解读',
      text: '页面最上方那一段，已经把你命宫的主星翻译成了人话。看完那段，你就知道自己大概是什么样的人。'
    },
    {
      step: '02',
      title: '再看命宫那一格',
      text: '盘面左下角金色描边的那格就是命宫。里面的星曜决定了你的性格底色。点它可以看到详细解释。'
    },
    {
      step: '03',
      title: '注意四化标记',
      text: '星曜后面的「禄权科忌」小方块，是整张盘最实用的部分。它们标出了你哪里顺、哪里卡。'
    },
    {
      step: '04',
      title: '最后看流年',
      text: '切换年份，红框会移动——那就是那一年的重点宫位。想知道今年运势，看红框那一格。'
    }
  ];

  /**
   * 宫位显示名
   * iztro 的宫名里只有「命宫」自带「宫」字，其余是「田宅」「官禄」等。
   * 直接拼「宫」会得到「命宫宫」，所以统一走这里。
   */
  function palaceLabel(name) {
    if (!name) return '';
    return /宫$/.test(name) ? name : name + '宫';
  }

  /* ---------------- 常用判断 ---------------- */

  /** 主星 → 一句话总览 */
  function starEssence(starName) {
    const s = STARS[starName];
    return s ? s.essence : null;
  }

  /**
   * 找到命宫的主星。本宫无主星时，传统上借对宫（相隔六宫）的主星。
   * @returns {{ stars: string[], borrowed: boolean, fromPalace: string }}
   */
  function resolveSoulStars(astrolabe) {
    const palaces = astrolabe.palaces;
    const soul = palaces.find((p) => p.name === '命宫');
    if (!soul) return { stars: [], borrowed: false, fromPalace: '' };

    const own = soul.majorStars.map((s) => s.name);
    if (own.length) return { stars: own, borrowed: false, fromPalace: '命宫' };

    // 借对宫
    const oppIndex = (soul.index + 6) % 12;
    const opp = palaces[oppIndex];
    if (opp && opp.majorStars.length) {
      return { stars: opp.majorStars.map((s) => s.name), borrowed: true, fromPalace: opp.name };
    }
    return { stars: [], borrowed: false, fromPalace: '命宫' };
  }

  /** 宫位的白话说明 */
  function palaceInfo(name) {
    return PALACES[name] || null;
  }

  /** 星曜的白话说明（主星优先，其次辅煞） */
  function starInfo(name) {
    if (STARS[name]) {
      const s = STARS[name];
      return {
        kind: 'major',
        tag: s.tag,
        essence: s.essence,
        good: s.good,
        issue: s.issue,
        advice: s.advice,
        keys: s.keys
      };
    }
    if (MINOR[name]) {
      const m = MINOR[name];
      return { kind: m.kind, tag: m.plain, essence: m.detail, keys: [] };
    }
    return null;
  }

  /** 术语解释 */
  function termInfo(term) {
    return TERMS[term] || null;
  }

  /**
   * 生成整段白话解读
   * @returns {{soulStars, borrowed, headline, paragraphs[], tags[], focus[], guide}}
   */
  function buildReading(astrolabe) {
    const resolved = resolveSoulStars(astrolabe);
    const stars = resolved.stars;

    // 一句话结论
    let headline;
    if (stars.length) {
      const main = stars[0];
      const info = STARS[main];
      headline = info
        ? `你的命宫主星是「${main}」——${info.tag}。${info.essence}。`
        : `你的命宫主星是「${main}」。`;
      if (resolved.borrowed) {
        headline += `（你命宫本身没有主星，按传统借对宫「${resolved.fromPalace}」的星来论。）`;
      }
    } else {
      headline = '你的命宫没有主星。传统上这并不代表「命不好」，而是性格弹性较大，容易受环境和身边人影响。';
    }

    // 优势 / 课题 / 建议（取命宫主星）
    const blocks = [];
    if (stars.length) {
      const info = STARS[stars[0]];
      if (info) {
        blocks.push({ label: '你的优势', text: info.good, tone: 'good' });
        blocks.push({ label: '你的课题', text: info.issue, tone: 'caution' });
        blocks.push({ label: '给你的建议', text: info.advice, tone: 'tip' });
      }
      // 双主星时补充第二颗的简短说明
      if (stars.length > 1) {
        const second = STARS[stars[1]];
        if (second) {
          blocks.push({
            label: `另外，命宫还有「${stars[1]}」`,
            text: `${second.tag}：${second.essence}。它的存在让你在${second.keys.join('、')}方面更突出。`,
            tone: 'neutral'
          });
        }
      }
    }

    // 四化重点（白话）
    const focus = [];
    astrolabe.palaces.forEach((p) => {
      [...p.majorStars, ...p.minorStars].forEach((s) => {
        if (!s.mutagen) return;
        const h = SIHUA[s.mutagen];
        const pInfo = PALACES[p.name];
        if (!h || !pInfo) return;
        focus.push({
          star: s.name,
          hua: s.mutagen,
          huaName: h.name,
          tone: h.tone,
          palace: p.name,
          palaceTitle: pInfo.title,
          // 组成通顺的一句话：「天同化忌」落在疾厄宫：你在「身体与压力」这块……
          sentence: `「${s.name}${h.name}」落在${palaceLabel(p.name)}——你在「${pInfo.title}」这一块${h.lead}。`,
          text: `「${s.name}${h.name}」落在${palaceLabel(p.name)}——你在「${pInfo.title}」这一块${h.lead}。${h.tip}`
        });
      });
    });
    // 化忌排在前面（最需要注意）
    focus.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    // 标签
    const tags = stars.length && STARS[stars[0]] ? STARS[stars[0]].keys : [];

    return {
      soulStars: stars,
      borrowed: resolved.borrowed,
      fromPalace: resolved.fromPalace,
      headline,
      blocks,
      tags,
      focus,
      guide: GUIDE
    };
  }

  /**
   * 流年白话解读：这一年该看哪、重点是什么
   * @param {object} astrolabe 本命盘
   * @param {object} horoscope 流年对象（含 yearly / age / decadal）
   * @param {number} year 流年公历年
   */
  function buildYearReading(astrolabe, horoscope, year) {
    if (!horoscope) return null;

    const h = horoscope;
    const age = h.age.nominalAge;
    const ygz = h.yearly.heavenlyStem + h.yearly.earthlyBranch;
    const lnMingIndex = h.yearly.palaceNames
      ? h.yearly.palaceNames.findIndex((n) => n === '命宫')
      : -1;
    const lnPalace = lnMingIndex >= 0 ? astrolabe.palaces[lnMingIndex] : null;
    const lnInfo = lnPalace ? PALACES[lnPalace.name] : null;

    // 本命宫位 → 流年宫名的映射，用来解释「今年这一宫变成了什么」
    // 只挑几个对普通人最有指导意义的宫位
    const MEANINGFUL = ['命宫', '官禄', '财帛', '夫妻', '迁移', '福德'];
    const shifted = [];
    if (h.yearly.palaceNames) {
      astrolabe.palaces.forEach((p, i) => {
        const lnName = h.yearly.palaceNames[i];
        const info = PALACES[lnName];
        if (info && MEANINGFUL.includes(lnName)) {
          shifted.push({ origin: p.name, lnName, title: info.title });
        }
      });
    }

    // 流年四化
    const huaNames = ['禄', '权', '科', '忌'];
    const lnHua = [];
    (h.yearly.mutagen || []).forEach((starName, i) => {
      const hua = huaNames[i];
      const info = SIHUA[hua];
      if (!info) return;
      // 找这颗本命星在哪一宫
      let palaceName = '';
      astrolabe.palaces.forEach((p) => {
        [...p.majorStars, ...p.minorStars].forEach((s) => {
          if (s.name === starName) palaceName = p.name;
        });
      });
      const pInfo = PALACES[palaceName];
      lnHua.push({
        star: starName, hua, huaName: info.name, tone: info.tone,
        palace: palaceName,
        palaceTitle: pInfo ? pInfo.title : '',
        sentence: `今年「${starName}${info.name}」落在${palaceName}宫——「${pInfo ? pInfo.title : ''}」这块今年${info.lead}。`
      });
    });
    lnHua.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    // 大限说明：区间要从本命盘的对应宫位取，horoscope.decadal 本身不带 range
    let daxianText = '';
    if (h.decadal && typeof h.decadal.index === 'number') {
      const dxPalace = astrolabe.palaces[h.decadal.index];
      const range = dxPalace && dxPalace.decadal ? dxPalace.decadal.range : null;
      const dxInfo = dxPalace ? PALACES[dxPalace.name] : null;
      if (range && dxInfo) {
        daxianText = `你目前处在 ${range[0]}–${range[1]} 岁的大限。这十年的主题偏向${dxInfo.short}。`;
      }
    }

    // 一句话总览：宫位名 + 重心，避免与标题重复日期
    let headline;
    if (lnInfo) {
      headline = `流年命宫落在「${palaceLabel(lnPalace.name)}」——这一年的重心在${lnInfo.short}。`;
    } else {
      headline = '这一年没有特别的流年重点。';
    }

    return {
      year, ygz, age,
      headline,
      lnPalace: lnPalace ? { name: lnPalace.name, ...lnInfo } : null,
      shifted,
      hua: lnHua,
      daxianText,
      guidance: lnInfo ? lnInfo.how : ''
    };
  }

  /**
   * 流月白话解读
   * @param {object} astrolabe 本命盘
   * @param {object} horoscope 流年对象（含 monthly）
   * @param {number} year
   * @param {number} month 1-12
   */
  function buildMonthReading(astrolabe, horoscope, year, month) {
    if (!horoscope || !horoscope.monthly) return null;
    const m = horoscope.monthly;
    const idx = m.index;
    const palace = astrolabe.palaces[idx];
    const info = palace ? PALACES[palace.name] : null;
    if (!info) return null;

    const huaNames = ['禄', '权', '科', '忌'];
    const hua = [];
    (m.mutagen || []).forEach((starName, i) => {
      const huaType = huaNames[i];
      const hInfo = SIHUA[huaType];
      if (!hInfo) return;
      // 找这颗本命星落在哪一宫
      let palaceName = '';
      astrolabe.palaces.forEach((p) => {
        [...p.majorStars, ...p.minorStars].forEach((s) => {
          if (s.name === starName) palaceName = p.name;
        });
      });
      const pInfo = PALACES[palaceName];
      hua.push({
        star: starName, hua: huaType, huaName: hInfo.name, tone: hInfo.tone,
        palace: palaceName,
        sentence: `本月「${starName}${hInfo.name}」落在${palaceLabel(palaceName)}——「${pInfo ? pInfo.short : ''}」这块本月${hInfo.lead}。`
      });
    });
    hua.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    return {
      year, month,
      ganZhi: (m.heavenlyStem || '') + (m.earthlyBranch || ''),
      palaceName: palace ? palace.name : '',
      title: info.title,
      short: info.short,
      how: info.how,
      // 不再重复「重心落在X，也就是X」，直接说出重心所在
      headline: `${month} 月的重心在${info.short}。`,
      hua,
    };
  }

  /**
   * 大限时间轴数据
   * @param {object} astrolabe
   * @param {number} birthLunarYear 农历出生年（用于把虚岁换算成公历年）
   * @param {number} viewingYear 当前查看的流年（高亮这一段）
   * @param {number} realYear 现实中的今年（用于标记「现在」与区分已过阶段）
   */
  function buildDaxianTimeline(astrolabe, birthLunarYear, viewingYear, realYear) {
    const list = [];
    astrolabe.palaces.forEach((p) => {
      if (!p.decadal || !p.decadal.range) return;
      const [startAge, endAge] = p.decadal.range;
      const info = PALACES[p.name];
      // 虚岁 1 = 出生当年；故 虚岁 N 对应 出生年 + N - 1
      const startYear = birthLunarYear + startAge - 1;
      const endYear = birthLunarYear + endAge - 1;
      list.push({
        index: p.index,
        palace: p.name,
        palaceLabel: palaceLabel(p.name),
        ganZhi: p.decadal.heavenlyStem + p.decadal.earthlyBranch,
        startAge, endAge,
        startYear, endYear,
        title: info ? info.title : '',
        short: info ? info.short : '',
        // 正在查看的那一段
        isViewing: viewingYear != null && viewingYear >= startYear && viewingYear <= endYear,
        // 现实中确实处于这一段
        isNow: realYear != null && realYear >= startYear && realYear <= endYear,
        // 以现实年份为准判断是否已经走过
        isPast: realYear != null && realYear > endYear,
      });
    });
    list.sort((a, b) => a.startAge - b.startAge);
    return list;
  }

  /**
   * 星座组合解读：两颗主星的相处模式
   * 传统紫微看合盘，核心是「双方命宫主星」的互动。
   * 这里给出的是倾向提示，不是结论。
   */
  const PAIR_NOTES = {
    // 同类：性情相近，容易理解彼此，但缺点也会共振
    same: {
      title: '性情相近',
      text: '两人的性格底色接近，容易互相理解，相处省力。要注意的是——优点会放大，缺点也会同时放大，容易一起钻同一个牛角尖。'
    },
    // 互补型：一方主动一方配合，节奏容易错开也可能互相补位
    complement: {
      title: '一动一静',
      text: '一方偏主动开创，一方偏稳守配合。这种组合若能接受彼此节奏不同，往往能互补；若都想主导，就容易拉扯。'
    },
    // 强势相遇
    bothStrong: {
      title: '两强相遇',
      text: '两人都是有主见、想拿主意的人。好处是能一起成事，难处是争执时谁也不让。约定一个「谁先说了算」的规则会省很多力气。'
    },
    // 都偏温和
    bothSoft: {
      title: '两柔相处',
      text: '两人都偏温和、不爱冲突。相处舒服，但遇到需要决断的事容易互相推让——总要有一个人先开口。'
    }
  };

  /* 主星归类，用于判断组合性质 */
  const STRONG_STARS = ['紫微', '七杀', '破军', '武曲', '廉贞', '太阳', '巨门'];
  const SOFT_STARS = ['天同', '太阴', '天梁', '天相', '天府'];
  const ACTIVE_STARS = ['七杀', '破军', '贪狼', '天机', '太阳'];
  const STEADY_STARS = ['天府', '天相', '天梁', '太阴', '武曲'];

  function starGroup(name) {
    if (STRONG_STARS.includes(name)) return 'strong';
    if (SOFT_STARS.includes(name)) return 'soft';
    return 'mid';
  }

  /**
   * 双人合盘对照
   * @param {object} a 命盘 A
   * @param {object} b 命盘 B
   * @returns {object}
   */
  function buildCompatibility(a, b) {
    const ra = resolveSoulStars(a);
    const rb = resolveSoulStars(b);
    const sa = ra.stars[0] || '';
    const sb = rb.stars[0] || '';

    const ga = starGroup(sa);
    const gb = starGroup(sb);

    let pair;
    if (!sa || !sb) {
      pair = {
        title: '信息不足',
        text: '有一方命宫没有主星且对宫亦无主星，无法判断组合取向。可以直接对看两张盘的其他宫位。'
      };
    } else if (sa === sb) {
      pair = PAIR_NOTES.same;
    } else if (ga === 'strong' && gb === 'strong') {
      pair = PAIR_NOTES.bothStrong;
    } else if (ga === 'soft' && gb === 'soft') {
      pair = PAIR_NOTES.bothSoft;
    } else {
      pair = PAIR_NOTES.complement;
    }

    // 逐项对照：把两人同名的宫位放一起
    const rows = [];
    const ORDER = ['命宫', '夫妻', '财帛', '官禄', '福德', '迁移'];
    ORDER.forEach((name) => {
      const pa = a.palaces.find((x) => x.name === name);
      const pb = b.palaces.find((x) => x.name === name);
      if (!pa || !pb) return;
      const info = PALACES[name];
      rows.push({
        palace: name,
        palaceLabel: palaceLabel(name),
        title: info ? info.title : '',
        aStars: pa.majorStars.map((s) => s.name + (s.mutagen ? '化' + s.mutagen : '')).join('、') || '（无主星）',
        bStars: pb.majorStars.map((s) => s.name + (s.mutagen ? '化' + s.mutagen : '')).join('、') || '（无主星）',
        aBranches: pa.heavenlyStem + pa.earthlyBranch,
        bBranches: pb.heavenlyStem + pb.earthlyBranch,
      });
    });

    return {
      pair,
      aStars: ra.stars,
      bStars: rb.stars,
      aBorrowed: ra.borrowed,
      bBorrowed: rb.borrowed,
      rows,
    };
  }

  /**
   * 流日 / 流时白话解读
   * @param {object} astrolabe
   * @param {object} horoscope 需含 daily / hourly
   * @param {object} opts { level: 'day'|'hour', dateLabel, hourLabel }
   */
  function buildShortReading(astrolabe, horoscope, opts) {
    const o = opts || {};
    const level = o.level === 'hour' ? 'hour' : 'day';
    const node = level === 'hour' ? horoscope && horoscope.hourly : horoscope && horoscope.daily;
    if (!node) return null;

    const palace = astrolabe.palaces[node.index];
    const info = palace ? PALACES[palace.name] : null;
    if (!info) return null;

    const huaNames = ['禄', '权', '科', '忌'];
    const hua = [];
    (node.mutagen || []).forEach((starName, i) => {
      const huaType = huaNames[i];
      const hInfo = SIHUA[huaType];
      if (!hInfo) return;
      let palaceName = '';
      astrolabe.palaces.forEach((p) => {
        [...p.majorStars, ...p.minorStars].forEach((s) => {
          if (s.name === starName) palaceName = p.name;
        });
      });
      const pInfo = PALACES[palaceName];
      hua.push({
        star: starName, hua: huaType, huaName: hInfo.name, tone: hInfo.tone,
        palace: palaceName,
        sentence: `${level === 'hour' ? '此时' : '今日'}「${starName}${hInfo.name}」落在${palaceLabel(palaceName)}——「${pInfo ? pInfo.short : ''}」这块${hInfo.lead}。`,
      });
    });
    hua.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    const unit = level === 'hour' ? '时辰' : '日';
    const when = `${o.dateLabel || ''}${o.hourLabel || ''}`.trim();
    return {
      level,
      ganZhi: (node.heavenlyStem || '') + (node.earthlyBranch || ''),
      palaceName: palace ? palace.name : '',
      title: info.title,
      short: info.short,
      label: o.dateLabel || '',
      hourLabel: o.hourLabel || '',
      headline: when ? `${when} 的重心在${info.short}。` : `这${unit}的重心在${info.short}。`,
      hua,
    };
  }

  return {
    STARS, PALACES, SIHUA, MINOR, TERMS, GUIDE,
    starEssence, resolveSoulStars, palaceInfo, starInfo, termInfo, palaceLabel,
    buildReading, buildYearReading, buildMonthReading, buildDaxianTimeline,
    buildCompatibility, buildShortReading
  };
});