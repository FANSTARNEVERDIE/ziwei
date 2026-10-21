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
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗帝座，至尊至贵之星，为官禄主，专司官贵地位',
      classicSrc: '紫微星，属己土，象阴，为南北斗中至尊至贵之星，故名帝座……为官禄主，专司官贵地位，掌造化之机枢',
      classicNote: '原书强调：紫微须得「百官朝拱」才能显达；无吉星拱照则为「孤君」，不作贵断。',
      essence: '天生的主事者，在意体面，习惯把事情扛在自己肩上',
      good: '有主见、能统筹全局、抗压强，关键时刻稳得住',
      issue: '放不下架子，不轻易低头；听不进反对意见时容易把自己孤立',
      advice: '把「面子」换成「目标」，你会发现愿意合作的人比想象中多',
      keys: ['领导', '自尊', '统筹']
    },
    '天机': {
      tag: '智慧之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第三星，化气为善，为兄弟主，是智慧、谋划之星，也是「动星」',
      classicSrc: '天机属乙木，象阴，南斗第三星……化气为善，为兄弟主；为智慧、益寿、仁善、谋划计算之星',
      classicNote: '原书称天机为「军师谋臣」——善谋划、能辅佐，但不宜独自创大业、当第一把手。',
      essence: '脑子转得快，凡事想三步，但也容易把自己绕进去',
      good: '分析力强、点子多、学东西快、擅长做规划',
      issue: '想太多、决断慢、容易焦虑；计划被打乱时心态易崩',
      advice: '给自己设一个「决策截止时间」，想清楚就动手，比想完美更重要',
      keys: ['谋略', '变动', '思虑']
    },
    '太阳': {
      tag: '光明之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '中天斗星，司昼贵，主光明、名誉与权贵',
      classicSrc: '太阳属丙火，为中天斗星，司昼贵，主光明、名誉、权贵',
      classicNote: '原书：太阳主「施舍」，在寅卯辰巳午为庙旺，在申酉戌亥为落陷，昼夜生人差别大。',
      essence: '愿意付出、照拂别人，天生有股「要把事情做给所有人看」的劲',
      good: '热情、有担当、能带头，名声容易显出来',
      issue: '付出过度却不被领情；太在意外界评价，容易累',
      advice: '学会分辨「值得的人」，把光留一部分给自己',
      keys: ['付出', '名声', '长辈缘']
    },
    '武曲': {
      tag: '财星 · 将星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗第六星，化气为财，为财帛主，兼为将星',
      classicSrc: '武曲属辛金，北斗第六星，化气为财，为财帛主，司财帛',
      classicNote: '原书：武曲性刚，号为「寡宿」，主孤；宜从事与金属、金融、军警相关之事。',
      essence: '行动派，讲效率不信空话，认定的事一定做完',
      good: '执行力强、能扛事、对钱务实、抗打击能力强',
      issue: '太硬、话少、不懂转弯，容易把关系处成「公事公办」',
      advice: '刻意练习表达感受，你会少走很多弯路',
      keys: ['财运', '刚毅', '执行']
    },
    '天同': {
      tag: '福星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第四星，化气为福，为福德主',
      classicSrc: '天同属壬水，南斗第四星，化气为福，为福德主',
      classicNote: '原书：天同喜见化权与一点煞忌来「激发」，否则易流于怠惰；旺于秋冬。',
      essence: '天性温软，喜欢舒服自在，不太爱跟人争',
      good: '人缘好、情绪感染力强、懂得享受生活、常有贵人',
      issue: '容易懒散、逃避困难、依赖心偏重',
      advice: '给自己找一个「非做不可」的目标，福气才不会被浪费',
      keys: ['福气', '温和', '享受']
    },
    '廉贞': {
      tag: '次桃花 · 公关之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗第五星，化气为囚，为官禄宫主',
      classicSrc: '廉贞属丙火，北斗第五星，化气为囚，为官禄宫主',
      classicNote: '原书：廉贞称「囚星」，主是非、纠葛；在巳亥陷地化忌大凶，在亥为火入水乡。',
      essence: '情感浓烈、爱恨分明，对美和人际有天生的敏感',
      good: '有魅力、懂人情、才艺多、能处理复杂局面',
      issue: '情绪起伏大、容易钻牛角尖，感情上常纠结',
      advice: '把强烈的情绪转成创作或专业能力，它会成为你的武器',
      keys: ['桃花', '才艺', '情绪']
    },
    '天府': {
      tag: '库星 · 财库',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第一星，为财库之主，司财帛与田宅',
      classicSrc: '天府属戊土，南斗第一星，为财库之主，司财帛田宅',
      classicNote: '原书：天府是「令星」，主号令；与紫微同宫为「紫府同宫」，主尊贵但带孤意。',
      essence: '稳重保守，喜欢把东西存起来，天生有管理的sense',
      good: '包容、稳当、会管钱、擅长守成',
      issue: '太保守、容易错过机会、安于现状',
      advice: '定期逼自己走出舒适区，你的「稳」是优势，不是借口',
      keys: ['守成', '包容', '财库']
    },
    '太阴': {
      tag: '月亮之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '中天斗星，司夜贵，为田宅主，亦为财帛主',
      classicSrc: '太阴属癸水，为中天斗星，司夜贵，为田宅主、财帛主',
      classicNote: '原书：太阴主「母星」，与母亲、女性长辈缘深；在酉戌亥子为庙旺，化忌不忌。',
      essence: '心思细腻，感受力强，喜欢安静整洁的环境',
      good: '体贴、有耐心、审美在线，钱和关系都擅长慢慢积累',
      issue: '容易内耗、想太多、不擅长表达自己的需求',
      advice: '把感受说出来。别人不是不关心，是猜不到',
      keys: ['细腻', '积累', '女性长辈缘']
    },
    '贪狼': {
      tag: '桃花之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗第一星，化气为桃花，是欲望之星',
      classicSrc: '贪狼属甲木，北斗第一星，化气为桃花',
      classicNote: '原书：贪狼主「欲」，也主才艺与交际；喜与火铃同宫，谓之「火贪格」。',
      essence: '欲望强、学什么都快，什么都想试一试',
      good: '多才多艺、社交广、学习力强、适应环境快',
      issue: '兴趣太散、难以专注、容易贪多嚼不烂',
      advice: '挑一件最有感觉的深耕三年，你会远超同龄人',
      keys: ['才艺', '社交', '欲望']
    },
    '巨门': {
      tag: '暗星 · 口舌之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗第二星，化气为暗，是口舌之星',
      classicSrc: '巨门属癸水，北斗第二星，化气为暗',
      classicNote: '原书：巨门主口舌是非，但「巨门化忌可从事以口舌求财的行业」；最喜化权。',
      essence: '靠嘴和脑子吃饭的人，看问题一针见血',
      good: '口才好、分析深、有研究精神、能挖出真相',
      issue: '说话直容易得罪人、易陷入口舌是非、疑心偏重',
      advice: '同一句话换个说法，你的专业度会被更多人接受',
      keys: ['口才', '研究', '是非']
    },
    '天相': {
      tag: '印星 · 辅佐之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第五星，化气为印，是印绶之星',
      classicSrc: '天相属壬水，南斗第五星，化气为印',
      classicNote: '原书：天相为「印」，主衣食、文书、印章；受天府节制，随紫微而贵。',
      essence: '天生的协调者，讲究公平，是团队里的黏合剂',
      good: '会做人、有分寸、能协调、衣着品味通常不错',
      issue: '优柔寡断、太在意平衡、容易被当成「老好人」',
      advice: '该表态时明确表态，协调不等于和稀泥',
      keys: ['协调', '公正', '辅佐']
    },
    '天梁': {
      tag: '荫星 · 长者星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第二星，化气为荫，为父母之主',
      classicSrc: '天梁属戊土，南斗第二星，化气为荫，为父母之主',
      classicNote: '原书：天梁为「荫星」「寿星」，主解厄、庇荫；也主孤，有「荫他人而自孤」之说。',
      essence: '老成持重，像天生带着「保护别人」的设定',
      good: '有原则、能化解危机、长辈缘好、值得信赖',
      issue: '爱说教、管太多、容易替别人操心',
      advice: '帮别人之前先问一句「你需要吗」，善意会更有效',
      keys: ['庇护', '原则', '长辈缘']
    },
    '七杀': {
      tag: '将星 · 肃杀',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '南斗第六星，化气为权，为将星',
      classicSrc: '七杀属庚金，南斗第六星，化气为权，为将星',
      classicNote: '原书：七杀为「上将」，主肃杀、威权；在寅申子午为旺，性刚，不宜见柔星。',
      essence: '敢冲敢拼，天生不服输，节奏比一般人快',
      good: '决断力强、能开创局面、抗压、执行凶猛',
      issue: '太急、易冲动、人生起伏大、不太会踩刹车',
      advice: '动手前留三天冷静期，你的胜率会明显提高',
      keys: ['开创', '冲劲', '变革']
    },
    '破军': {
      tag: '耗星 · 开创之星',
      // 原书星性定性（可对照《紫微斗数精成》第八章）
      classic: '北斗第七星，化气为耗，是耗星',
      classicSrc: '破军属癸水，北斗第七星，化气为耗',
      classicNote: '原书：破军主「破」，先破后成；在子午为庙，主开创，喜见禄存。',
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
        keys: s.keys,
        // 原书星性定性（依《紫微斗数精成》第八章）
        classic: s.classic || '',
        classicSrc: s.classicSrc || '',
        classicNote: s.classicNote || ''
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

  /* 「星 × 宫位」情境库：Node 测试环境按需加载，浏览器用全局变量 */
  let _starPalace = null;
  let _starPalaceTried = false;
  function tryStarPalace() {
    if (_starPalaceTried) return _starPalace;
    _starPalaceTried = true;
    try {
      _starPalace = require('./star-palace.js');
    } catch (e) {
      _starPalace = null;
    }
    return _starPalace;
  }
  function starPalaceLib() {
    if (typeof window !== 'undefined' && window.ZWStarPalace) return window.ZWStarPalace;
    return tryStarPalace();
  }

  /* 「星 × 四化」情境库（56 条）：同样按需加载 */
  let _sihuaStar = null;
  let _sihuaStarTried = false;
  function starSihuaLib() {
    if (typeof window !== 'undefined' && window.ZWSihuaStar) return window.ZWSihuaStar;
    if (_sihuaStarTried) return _sihuaStar;
    _sihuaStarTried = true;
    try {
      _sihuaStar = require('./sihua-star.js');
    } catch (e) {
      _sihuaStar = null;
    }
    return _sihuaStar;
  }

  /* 四化的庙陷与例外（依《紫微斗数精成》原文） */
  let _sihuaEx = null;
  let _sihuaExTried = false;
  function sihuaExLib() {
    if (typeof window !== 'undefined' && window.ZWSihuaException) return window.ZWSihuaException;
    if (_sihuaExTried) return _sihuaEx;
    _sihuaExTried = true;
    try {
      _sihuaEx = require('./sihua-exception.js');
    } catch (e) {
      _sihuaEx = null;
    }
    return _sihuaEx;
  }

  /* 依原文修正的「星×四化」条目（优先级高于推导版） */
  let _sihuaFixed = null;
  let _sihuaFixedTried = false;
  function sihuaFixedLib() {
    if (typeof window !== 'undefined' && window.ZWSihuaCorrected) return window.ZWSihuaCorrected;
    if (_sihuaFixedTried) return _sihuaFixed;
    _sihuaFixedTried = true;
    try {
      _sihuaFixed = require('./sihua-corrected.js');
    } catch (e) {
      _sihuaFixed = null;
    }
    return _sihuaFixed;
  }

  /**
   * 取某星某四化的说明，优先级：
   *   1. 依原文修正的条目（带 src）
   *   2. 由星曜属性推导的条目
   */
  function sihuaSpec(star, hua) {
    const FIXED = sihuaFixedLib();
    if (FIXED) {
      const c = FIXED.get(star, hua);
      if (c) return { text: c.text, src: c.src, tone: c.tone || '', corrected: true };
    }
    const SS = starSihuaLib();
    const d = SS ? SS.get(star, hua) : null;
    if (d) return { text: d.text, core: d.core, src: '', corrected: false };
    return null;
  }

  /**
   * 取某星在某宫的情境说明，并附来源标注
   *
   * 来源分两级：
   *   source  —— 《紫微斗数精成》第九章有明确论述（附原文引文）
   *   derived —— 由该星星性推导（星性来自原书，组合是本站推的）
   *
   * 界面必须区分这两者，否则用户会以为推导内容也是原书的话。
   */
  function palaceSpec(star, palace) {
    const SP = starPalaceLib();
    const ctx = SP ? SP.get(star, palace) : null;
    const PV = starProvLib();
    const prov = PV ? PV.get(star, palace) : null;
    return {
      ctx,
      kind: prov ? prov.kind : 'derived',
      quote: prov ? prov.quote : '',
    };
  }

  /* 「星×宫位」来源标注 */
  let _starProv = null;
  let _starProvTried = false;
  function starProvLib() {
    if (typeof window !== 'undefined' && window.ZWStarPalaceProvenance) {
      return window.ZWStarPalaceProvenance;
    }
    if (_starProvTried) return _starProv;
    _starProvTried = true;
    try {
      _starProv = require('./star-palace-provenance.js');
    } catch (e) {
      _starProv = null;
    }
    return _starProv;
  }

  /* 同盘区分层（日干四化） */
  let _dayLayer = null;
  let _dayLayerTried = false;
  function dayLayerLib() {
    if (typeof window !== 'undefined' && window.ZWDayLayer) return window.ZWDayLayer;
    if (_dayLayerTried) return _dayLayer;
    _dayLayerTried = true;
    try {
      _dayLayer = require('./day-layer.js');
    } catch (e) {
      _dayLayer = null;
    }
    return _dayLayer;
  }

  /* 命盘指纹（判断是否与别人同盘） */
  let _chartPrint = null;
  let _chartPrintTried = false;
  function chartPrintLib() {
    if (typeof window !== 'undefined' && window.ZWChartPrint) return window.ZWChartPrint;
    if (_chartPrintTried) return _chartPrint;
    _chartPrintTried = true;
    try {
      _chartPrint = require('./chart-print.js');
    } catch (e) {
      _chartPrint = null;
    }
    return _chartPrint;
  }

  /**
   * 生成「同盘」相关说明
   *
   * 为什么需要这一层：
   *   紫微斗数的星盘由「紫微星位置」锚定，而紫微位置 = f(农历日, 五行局)。
   *   实测 98 个生日只排出 62 种盘；1344 个生日里 372 组有人同盘。
   *   用户换日期看到相同结果时，必须告诉他原因，否则会以为算错了。
   *
   * 依据《紫微斗数精成》「四化应用概论」：
   *   生年干、生月干、生日干、生时干……均可飞四化；
   *   日干四化仅对自己和配偶及中年稍有影响。
   *   ——所以日干四化是原书承认的方法，但属次要参考。
   */
  function buildSameChartNote(astrolabe) {
    const CP = chartPrintLib();
    const DL = dayLayerLib();
    if (!CP || !DL || !astrolabe) return null;

    const layer = DL.buildDayLayer(astrolabe);
    if (!layer) return null;

    const ji = layer.hua.find((h) => h.hua === '忌');
    const lu = layer.hua.find((h) => h.hua === '禄');
    const quan = layer.hua.find((h) => h.hua === '权');
    const ke = layer.hua.find((h) => h.hua === '科');

    return {
      fingerprint: CP.fingerprint(astrolabe),
      explain: CP.explain(astrolabe),
      pillar: layer.pillar,
      stem: layer.stem,
      hua: layer.hua,
      headline: `你的日柱是「${layer.pillar}」，依原书可另看「日干四化」作参考：`,
      sentences: [
        ji ? `最需留意的是「${ji.star}化忌」` +
          (ji.palaceLabel ? `落在${ji.palaceLabel}` : '（不在盘中）') +
          `——${ji.note}。` : '',
        lu ? `比较顺的是「${lu.star}化禄」` +
          (lu.palaceLabel ? `落在${lu.palaceLabel}` : '') +
          `——${lu.note}。` : '',
        quan ? `「${quan.star}化权」落在${quan.palaceLabel || '盘中'}——${quan.note}。` : '',
        ke ? `「${ke.star}化科」落在${ke.palaceLabel || '盘中'}——${ke.note}。` : '',
      ].filter(Boolean),
      src: '《紫微斗数精成》上编第八章 23、四化星「四化应用概论」：'
        + '生年干、生月干、生日干、生时干……均可飞四化。'
        + '日干四化仅对自己和配偶及中年稍有影响。'
        + '（生年干四化为主，生月干为辅，日时干四化可不看）',
      caveat: '这一层是辅助参考，不是主要依据——原书明说日干四化影响有限。',
    };
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
    //
    // 关键：不能只用主星的通用字段——那样 14 颗星只有 14 种说法，
    // 用户换个生日常常读到同一段话。这里优先用「星 × 所在宫位」的
    // 情境库（js/star-palace.js，168 条），落到具体宫位上，
    // 同星不同宫的人会得到不同的解读。
    const blocks = [];
    if (stars.length) {
      const info = STARS[stars[0]];
      if (info) {
        const SP = starPalaceLib();
        // 命宫本身的星，用「星 × 命宫」的情境；
        // 若命宫无主星（借对宫），则用对宫位置的情境
        const ctxPalace = resolved.borrowed ? resolved.fromPalace : '命宫';
        const ctx = SP ? SP.get(stars[0], ctxPalace) : null;

        blocks.push({
          label: '你的优势',
          text: (ctx && ctx.g) || info.good,
          tone: 'good'
        });
        blocks.push({
          label: '你的课题',
          text: (ctx && ctx.i) || info.issue,
          tone: 'caution'
        });
        blocks.push({
          label: '给你的建议',
          text: (ctx && ctx.a) || info.advice,
          tone: 'tip'
        });
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

        // 同样改用「星×四化」的具体含义，而不是四化的通用模板
        const sp = sihuaSpec(s.name, s.mutagen);
        const specText = sp ? sp.text : h.lead;
        const head = `「${s.name}${h.name}」落在${palaceLabel(p.name)}`;
        focus.push({
          star: s.name,
          hua: s.mutagen,
          huaName: h.name,
          tone: (sp && sp.tone) || h.tone,
          palace: p.name,
          palaceTitle: pInfo.title,
          specText,
          specSrc: sp ? sp.src : '',
          corrected: !!(sp && sp.corrected),
          sentence: `${head}。${specText}` +
            (specText.endsWith('。') ? '' : '。') +
            `（作用在${pInfo.title}这个领域）`,
          text: `${head}。${specText}` +
            (specText.endsWith('。') ? '' : '。') +
            `（作用在${pInfo.title}这个领域）${h.tip}`
        });
      });
    });
    // 化忌排在前面（最需要注意）
    focus.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    // 标签
    const tags = stars.length && STARS[stars[0]] ? STARS[stars[0]].keys : [];

    // 十二宫逐宫解读
    //
    // 为什么必须有这一层：只看命宫的话，全天下只有 12 种结果
    // （命宫地支 × 主星），用户换个生日常常读到同一段话。
    // 把十二宫全部说出来之后，每张盘的差异才真正体现出来——
    // 这也更接近紫微斗数本来的读法：一张盘是一整套配置，
    // 不是只看一颗星。
    const SP2 = starPalaceLib();
    const palaceReadings = [];
    astrolabe.palaces.forEach((p) => {
      const info = PALACES[p.name];
      if (!info) return;
      const major = p.majorStars.map((s) => s.name);
      const sha = p.minorStars.filter((s) => s.type === 'tough').map((s) => s.name);
      const aux = p.minorStars
        .filter((s) => s.type === 'soft' || s.type === 'lucun' || s.type === 'tianma')
        .map((s) => s.name);

      // 该宫若有主星，取「主星 × 本宫」的情境；无主星则借对宫
      let ctx = null;
      let ctxFrom = '';
      let provInfo = null;
      if (major.length && SP2) {
        ctx = SP2.get(major[0], p.name);
        if (ctx) {
          ctxFrom = major[0];
          const PV = starProvLib();
          provInfo = PV ? PV.get(major[0], p.name) : null;
        }
      }
      if (!ctx) {
        const opp = astrolabe.palaces[(p.index + 6) % 12];
        if (opp && opp.majorStars.length && SP2) {
          ctx = SP2.get(opp.majorStars[0].name, p.name);
          if (ctx) {
            ctxFrom = opp.majorStars[0].name + '（借对宫）';
            const PV2 = starProvLib();
            provInfo = PV2 ? PV2.get(opp.majorStars[0].name, p.name) : null;
          }
        }
      }

      // 四化落在此宫的星
      const huaHere = [];
      [...p.majorStars, ...p.minorStars].forEach((s) => {
        if (s.mutagen && SIHUA[s.mutagen]) {
          huaHere.push({ star: s.name, hua: s.mutagen, tone: SIHUA[s.mutagen].tone });
        }
      });

      palaceReadings.push({
        name: p.name,
        label: palaceLabel(p.name),
        title: info.title,
        short: info.short,
        what: info.what,
        major, aux, sha,
        ctxFrom,
        // 情境文案；没有则退回宫位自身说明
        good: ctx ? ctx.g : '',
        issue: ctx ? ctx.i : '',
        advice: ctx ? ctx.a : info.how,
        borrowedCtx: !!ctx && /借对宫/.test(ctxFrom),
        hua: huaHere,
        isBody: !!p.isBodyPalace,
        // 来源标注：'source' 原书有论述 / 'derived' 由星性推导
        provKind: provInfo ? provInfo.kind : 'derived',
        provQuote: provInfo ? provInfo.quote : '',
      });
    });

    return {
      soulStars: stars,
      borrowed: resolved.borrowed,
      fromPalace: resolved.fromPalace,
      headline,
      blocks,
      tags,
      focus,
      palaceReadings,
      // 同盘区分层：日干四化（原书承认的辅助看法）
      sameChartNote: buildSameChartNote(astrolabe),
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
      const sp = sihuaSpec(starName, hua);
      const specText = sp ? sp.text : info.lead;
      lnHua.push({
        star: starName, hua, huaName: info.name,
        tone: (sp && sp.tone) || info.tone,
        palace: palaceName,
        palaceTitle: pInfo ? pInfo.title : '',
        specText,
        specSrc: sp ? sp.src : '',
        corrected: !!(sp && sp.corrected),
        // 必须用 palaceLabel：宫名本身可能已带「宫」字，
        // 直接拼「宫」会产出「命宫宫」
        sentence: `今年「${starName}${info.name}」落在${palaceLabel(palaceName)}。` +
          specText + (specText.endsWith('。') ? '' : '。') +
          `（作用在${pInfo ? pInfo.title : ''}这个领域）`
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
    //
    // 重要：只写「重心落在X宫」会让很多人生成同一句话——
    // 流年命宫的落宫由「流年地支 + 本命命宫位置」决定，
    // 命宫同位置的人会得到完全相同的结论，读起来像废话。
    // 因此这里必须带上「这一宫在你盘里实际有什么星」，
    // 让结论真正属于这张盘。
    const lnStars = lnPalace
      ? lnPalace.majorStars.map((s) => s.name)
      : [];
    const lnAux = lnPalace
      ? lnPalace.minorStars.filter((s) => s.type === 'soft' || s.type === 'lucun' || s.type === 'tianma')
        .map((s) => s.name)
      : [];
    const lnSha = lnPalace
      ? lnPalace.minorStars.filter((s) => s.type === 'tough').map((s) => s.name)
      : [];

    let headline;
    const head = `流年命宫落在「${palaceLabel(lnPalace ? lnPalace.name : '')}」`;

    if (lnInfo && lnStars.length) {
      const main = STARS[lnStars[0]];
      const essence = main ? main.essence.replace(/。$/, '') : '';

      // 把「今年最独有的信号」放前面：
      // 流年干支与四化每年必定不同，先说它，不同年份的结论第一句就分开
      let lead = `${year} 年（${ygz}）`;
      const ji = lnHua.find((h) => h.hua === '忌');
      if (ji) {
        const jiInfo = PALACES[ji.palace];
        lead += `最需要注意的是「${ji.star}化忌」落在${ji.palace ? palaceLabel(ji.palace) : ''}`;
        if (jiInfo) lead += `，${jiInfo.short}这块要放慢一点`;
        lead += '。';
      }
      const lu = lnHua.find((h) => h.hua === '禄');
      if (lu) {
        const luInfo = PALACES[lu.palace];
        lead += `「${lu.star}化禄」落在${lu.palace ? palaceLabel(lu.palace) : ''}`;
        if (luInfo) lead += `，${luInfo.short}这块比较有资源和福气`;
        lead += '。';
      }

      headline = lead +
        `${head}——这一年的重心在${lnInfo.short}。` +
        `这一宫在你本命盘里是「${lnStars.join('、')}」` +
        (main ? `，${main.tag}，${essence}。` : '。') +
        (main && main.issue ? `今年这件事上要留意：${main.issue}。` : '');
    } else if (lnInfo) {
      headline = `${year} 年（${ygz}）。${head}——这一年的重心在${lnInfo.short}。` +
        `这一宫在你本命盘里没有主星，代表今年这件事上你的态度比较灵活，容易被环境和身边的人带着走。`;
    } else {
      headline = '这一年没有特别的流年重点。';
    }

    // 辅助星与煞星：给出更具体的动向提示（同样逐盘不同）
    if (lnAux.length || lnSha.length) {
      const bits = [];
      if (lnAux.length) bits.push(`有「${lnAux.join('、')}」相助，这一块容易得到助力`);
      if (lnSha.length) bits.push(`同时有「${lnSha.join('、')}」，推进时会遇到阻力，别硬来`);
      headline += bits.join('；') + '。';
    }

    return {
      year, ygz, age,
      headline,
      lnPalace: lnPalace ? { name: lnPalace.name, ...lnInfo } : null,
      // 这一宫在本命盘里的实际星曜（让结论与个人盘绑定）
      lnStars,
      lnAux,
      lnSha,
      shifted,
      hua: lnHua,
      daxianText,
      guidance: lnInfo ? lnInfo.how : ''
    };
  }

  /**
   * 生成流月结论
   *
   * 结构上刻意把「本月独有的信号」放在最前面：
   *   1. 本月干支 + 四化 —— 每个月必定不同
   *   2. 落宫 + 该宫本命星曜
   *   3. 宫位重映射
   *   4. 流月星分布
   *
   * 为什么顺序重要：若开头统一是「X 月的重心在 Y」，
   * 落宫相同的两个月读起来就会很像（实测相似度 64%）。
   * 把四化提到最前，差异第一句就看得到。
   */
  function buildMonthHeadline(month, info, ganZhi, hua, monthMain, monthStars,
    focusRemap, monthStarMap, monthSha) {
    const parts = [];

    // 1) 本月干支与四化：每月最独有的信息
    const huaBrief = hua.map((h) => `${h.star}化${h.hua}`).join('、');
    if (huaBrief) {
      const ji = hua.find((h) => h.hua === '忌');
      let s = `${month} 月（${ganZhi}）`;
      if (ji) {
        const jiInfo = PALACES[ji.palace];
        s += `最需要注意的是「${ji.star}化忌」落在${ji.palace ? palaceLabel(ji.palace) : ''}`;
        if (jiInfo) s += `，${jiInfo.short}这块要放慢一点`;
        s += '。';
      } else {
        s += '本月没有化忌，整体比较平顺。';
      }
      s += `本月四化：${huaBrief}。`;
      parts.push(s);
    }

    // 2) 落宫与这一宫的本命星曜
    if (monthMain) {
      const ess = monthMain.essence.replace(/。$/, '');
      parts.push(`重心在${info.short}——这一宫在你本命盘里是「${monthStars.join('、')}」，` +
        `${monthMain.tag}，${ess}。` +
        (monthMain.advice ? `这个月可以试试：${monthMain.advice}。` : ''));
    } else {
      parts.push(`重心在${info.short}——这一宫在你本命盘里没有主星，` +
        `这个月的态度会比较随环境而变。`);
    }

    // 3) 宫位重映射
    if (focusRemap.length) {
      const list = focusRemap.slice(0, 3).map((r) =>
        `${r.fromLabel}变成${r.toLabel}（${r.toTitle}）`);
      parts.push(`宫位重新对应后，${list.join('、')}。`);
      const withStars = focusRemap.find((r) => r.stars.length);
      if (withStars) {
        const st = STARS[withStars.stars[0]];
        if (st) {
          parts.push(`其中${withStars.fromLabel}本命是「${withStars.stars.join('、')}」，` +
            `所以${withStars.toTitle}这件事上，你会用${st.keys.slice(0, 2).join('、')}的方式去处理。`);
        }
      }
    }

    // 4) 流月星分布
    const jiList = monthStarMap.filter((x) => x.ji.length)
      .map((x) => x.palaceLabel + '「' + x.ji.join('、') + '」');
    const shaList = monthStarMap.filter((x) => x.sha.length)
      .map((x) => x.palaceLabel + '「' + x.sha.join('、') + '」');
    const flowerList = monthStarMap.filter((x) => x.flower.length)
      .map((x) => x.palaceLabel + '「' + x.flower.join('、') + '」');

    if (jiList.length) parts.push(`吉星落在${jiList.slice(0, 3).join('、')}，这几块比较顺。`);
    if (shaList.length) parts.push(`煞星落在${shaList.slice(0, 3).join('、')}，这几块推进时会卡，别硬来。`);
    if (flowerList.length) parts.push(`桃花星落在${flowerList.slice(0, 2).join('、')}，人缘和感情的事会比较活跃。`);
    if (monthSha.length) parts.push(`此宫本命带「${monthSha.join('、')}」，推进时容易卡顿，给自己留点余地。`);

    return parts.join('');
  }

  /**
   * 流月白话解读
   *
   * 关键改进：原先只看 monthly.index（流月命宫落在哪一宫）。
   * 但 index 只有 12 个取值，且由「流月地支 + 本命命宫位置」决定，
   * 结果就是——不同月份、不同的人经常得到高度相似的结论。
   *
   * 实际紫微斗数看流月，要把整张本命盘**重新映射**一遍：
   * monthly.palaceNames 给出「本命的每个宫，在这个月变成了什么宫」。
   * 例如本命财帛宫这个月变成流月命宫，那这个月的重点就落在钱上。
   * 再加上流月星曜（月禄/月羊/月昌…）落在哪一宫。
   * 这样每个月的结果由整套 12 宫映射 + 星曜分布决定，
   * 而不是单一的 index。
   *
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

    // ---- 整套 12 宫重新映射：本命宫 -> 本月宫 ----
    const remap = [];
    if (m.palaceNames) {
      astrolabe.palaces.forEach((p, i) => {
        const lnName = m.palaceNames[i];
        if (!lnName || lnName === p.name) return;   // 名字没变的不必列
        remap.push({
          from: p.name,
          fromLabel: palaceLabel(p.name),
          to: lnName,
          toLabel: palaceLabel(lnName),
          toTitle: PALACES[lnName] ? PALACES[lnName].title : '',
          stars: p.majorStars.map((s) => s.name),
        });
      });
    }

    // ---- 本月流月星分布（月禄、月羊、月昌…）----
    //
    // 流月星的 type 有五种，不能只分「吉/凶」：
    //   soft=六吉类  lucun=禄存  tianma=天马  → 助力
    //   tough=煞星（擎羊陀罗火星铃星）          → 阻力
    //   flower=桃花星（红鸾天喜）               → 人缘感情，中性
    const monthStarMap = [];
    if (m.stars) {
      m.stars.forEach((arr, i) => {
        if (!arr || !arr.length) return;
        const p = astrolabe.palaces[i];
        if (!p) return;
        const names = arr.map((s) => s.name);
        const kinds = arr.map((s) => s.type);
        monthStarMap.push({
          palace: p.name,
          palaceLabel: palaceLabel(p.name),
          stars: names,
          ji: names.filter((_, k) => kinds[k] === 'soft' || kinds[k] === 'lucun' || kinds[k] === 'tianma'),
          sha: names.filter((_, k) => kinds[k] === 'tough'),
          flower: names.filter((_, k) => kinds[k] === 'flower'),
        });
      });
    }

    // 流月四化（与流年同理，必须查到本命盘的实际落宫）
    const huaNames = ['禄', '权', '科', '忌'];
    const hua = [];
    (m.mutagen || []).forEach((starName, i) => {
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
      const sp = sihuaSpec(starName, huaType);
      const mSpec = sp ? sp.text : hInfo.lead;
      hua.push({
        star: starName, hua: huaType, huaName: hInfo.name,
        tone: (sp && sp.tone) || hInfo.tone,
        palace: palaceName,
        specText: mSpec,
        specSrc: sp ? sp.src : '',
        corrected: !!(sp && sp.corrected),
        sentence: `本月「${starName}${hInfo.name}」落在${palaceLabel(palaceName)}。` +
          mSpec + (mSpec.endsWith('。') ? '' : '。') +
          `（作用在${pInfo ? pInfo.short : ''}这个领域）`
      });
    });
    hua.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    // 与流年同样的道理：只说「重心在X」会让同命宫位置的人生出同一句话。
    // 补上这一宫在本命盘里的实际星曜 + 本月流月星，结论才属于这张盘。
    const monthStars = palace ? palace.majorStars.map((s) => s.name) : [];
    const monthMain = monthStars.length ? STARS[monthStars[0]] : null;
    const monthSha = palace
      ? palace.minorStars.filter((s) => s.type === 'tough').map((s) => s.name) : [];

    // 本月落入这一宫的流月星（月禄/月羊…）——这是真正逐月变化的信号
    let monthStarsHere = [];
    if (horoscope.monthly.stars && horoscope.monthly.stars[idx]) {
      monthStarsHere = horoscope.monthly.stars[idx].map((s) => s.name);
    }

    let headline;
    const ganZhi = (m.heavenlyStem || '') + (m.earthlyBranch || '');

    // 本月「哪一宫变成了什么」——整套重映射里最值得说的几条。
    // 这是逐月真正拉开差异的地方：不同的月份，本命宫会被重新命名成不同的流月宫。
    const focusRemap = [];
    ['命宫', '财帛', '官禄', '夫妻', '福德'].forEach((target) => {
      const hit = remap.find((r) => r.to === target && r.from !== target);
      if (hit) focusRemap.push(hit);
    });

    headline = buildMonthHeadline(
      month, info, ganZhi, hua, monthMain, monthStars,
      focusRemap, monthStarMap, monthSha);

    return {
      year, month,
      ganZhi,
      palaceName: palace ? palace.name : '',
      title: info.title,
      short: info.short,
      how: info.how,
      headline,
      hua,
      // 供界面展示
      monthStars,
      monthSha,
      monthStarsHere,
      remap,
      monthStarMap,
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

      // 这一宫本命里的主星——不同盘的同一大限段内容不同，
      // 加上它，时间轴上每一段才真正属于这张盘
      const dxStars = p.majorStars.map((s) => s.name);
      const dxSha = p.minorStars.filter((s) => s.type === 'tough').map((s) => s.name);
      const dxMain = dxStars.length ? STARS[dxStars[0]] : null;

      // 一段话说明这十年在干什么
      let note = '';
      if (dxMain) {
        note = `这十年主题是${info ? info.short : ''}。此宫主星「${dxStars.join('、')}」` +
          `——${dxMain.tag}，${dxMain.essence.replace(/。$/, '')}。` +
          (dxMain.advice ? `可以试试：${dxMain.advice}。` : '');
      } else {
        note = `这十年主题是${info ? info.short : ''}。此宫无主星，` +
          `这十年的走向更依赖外部环境与身边的人，弹性较大。`;
      }
      if (dxSha.length) note += `本命带「${dxSha.join('、')}」，这段路上阻力会多一些。`;

      list.push({
        index: p.index,
        palace: p.name,
        palaceLabel: palaceLabel(p.name),
        ganZhi: p.decadal.heavenlyStem + p.decadal.earthlyBranch,
        startAge, endAge,
        startYear, endYear,
        title: info ? info.title : '',
        short: info ? info.short : '',
        stars: dxStars,
        sha: dxSha,
        note,
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

      // 找这颗星落在本命盘的哪一宫。
      // 注意：这是「被化的那颗星」所在宫，不是流日命宫 ——
      // 两者完全不同，写错就会出现「四化都落在同一宫」的假象。
      let palaceName = '';
      let hostPalace = null;
      astrolabe.palaces.forEach((p) => {
        [...p.majorStars, ...p.minorStars].forEach((s) => {
          if (s.name === starName) { palaceName = p.name; hostPalace = p; }
        });
      });
      const pInfo = PALACES[palaceName];

      // 关键：用「星 × 四化」的具体含义，而不是四化的通用模板。
      // 优先级：依原文修正的条目 > 由星属性推导的条目。
      const spec = sihuaSpec(starName, huaType);

      const whenWord = level === 'hour' ? '此时' : '今日';
      const place = palaceName ? palaceLabel(palaceName) : '';
      const area = pInfo ? pInfo.short : '';

      // 句尾带上「这颗星所在宫还有什么星」，让同一四化在不同盘上读起来不同。
      // 天干只有 10 个，四化每隔 10 天必然重复（历法事实），
      // 但星曜配置因人而异，这一句能把差异带出来。
      const hostStars = hostPalace
        ? hostPalace.majorStars
          .map((s) => s.name)
          .filter((n) => n !== starName)
        : [];

      let sentence = `${whenWord}「${starName}${hInfo.name}」落在${place}`;
      if (hostStars.length) {
        sentence += `（同宫还有「${hostStars.join('、')}」）`;
      }
      sentence += '。';

      // ---- 化忌的庙陷与例外（依《紫微斗数精成》）----
      //
      // 原书明确：「化忌不一定凶，必须看所化之星是庙旺还是失陷、落在何宫。
      // 若化星庙旺时，则有旺地化忌不忌之论，灾咎轻，虽有阻滞，但终能成功。」
      //
      // 实测抽样中约 25% 的化忌属于「旺地不忌」——
      // 若一律写成负面，等于给四分之一的情况下了错判。
      let exceptionNote = null;
      if (huaType === '忌' && hostPalace) {
        const EX = sihuaExLib();
        if (EX) {
          const branch = hostPalace.earthlyBranch;
          const yearPillar = astrolabe.chineseDate
            ? astrolabe.chineseDate.split(' ')[0] : '';
          const yearStem = yearPillar ? yearPillar[0] : '';
          // 先看生年干导致的反吉（条件更具体）
          const rev = EX.stemReverse(starName, branch, yearStem, yearPillar);
          if (rev) {
            exceptionNote = rev;
          } else {
            // 旺地不忌：需水命人的条目会在此内部判断
            const nb = EX.jiNotBad(starName, branch, { yearPillar });
            if (nb) exceptionNote = nb;
          }
        }
      }

      if (spec) {
        sentence += spec.text;
        if (area) sentence += `（作用在${area}这个领域）`;
        sentence += '。';
      } else {
        sentence += `「${area}」这块${hInfo.lead}。`;
      }

      // 命中例外时附上原书依据，并把语气改过来
      if (exceptionNote) {
        sentence += `【例外】${exceptionNote.text}`;
      }

      hua.push({
        star: starName, hua: huaType, huaName: hInfo.name,
        tone: (spec && spec.tone) || hInfo.tone,
        palace: palaceName,
        // 单独暴露出来，界面上可以显示「依据」
        specText: spec ? spec.text : '',
        core: spec ? spec.core : '',
        // 该条是否来自「依原文修正」的版本
        corrected: !!(spec && spec.corrected),
        specSrc: spec ? spec.src : '',
        // 庙陷例外的原文出处（用于界面标注与测试）
        exception: exceptionNote ? exceptionNote.text : '',
        exceptionSrc: exceptionNote ? exceptionNote.src : '',
        sentence,
      });
    });
    hua.sort((a, b) => (a.hua === '忌' ? -1 : 0) - (b.hua === '忌' ? -1 : 0));

    const unit = level === 'hour' ? '时辰' : '日';
    const when = `${o.dateLabel || ''}${o.hourLabel || ''}`.trim();
    const ganZhi = (node.heavenlyStem || '') + (node.earthlyBranch || '');

    // 结论开头先说这一日的干支与化忌落点——
    // 这是每天必定不同的信息，比「重心在X宫」有辨识度得多
    let headline = when
      ? `${when}（${ganZhi}${level === 'hour' ? '时' : '日'}）`
      : `这${unit}（${ganZhi}）`;
    const ji = hua.find((h) => h.hua === '忌');
    if (ji) {
      headline += `最需要注意的是「${ji.star}化忌」落在${ji.palace ? palaceLabel(ji.palace) : ''}。` +
        (ji.specText ? ji.specText + '。' : '');
    }
    headline += `${when ? '' : '这' + unit + '的'}重心在${info.short}` +
      (palace && palace.majorStars.length
        ? `，这一宫在你本命盘里是「${palace.majorStars.map((s) => s.name).join('、')}」。`
        : '，这一宫本命无主星，反应会比较随环境。');

    return {
      level,
      ganZhi,
      palaceName: palace ? palace.name : '',
      title: info.title,
      short: info.short,
      label: o.dateLabel || '',
      hourLabel: o.hourLabel || '',
      headline,
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