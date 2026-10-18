/**
 * 《神都风云 · 问道大唐》PF1e 跑团系统 - 前端交互核心控制脚本
 * 涵盖：PF1e 规则引擎底表、程序化 Web Audio 合成器、3D 拟真投骰、
 * AI 司命问询式车卡向导、索骰/变卦双轨状态机与流式通信
 */

// =========================================================
// 1. PF1e 规则数据底表与权威标准 (遵循 Pathfinder 1e PRD)
// =========================================================

const PF1E_RULES = {
  // 核心 7 大种族
  races: {
    "人类": {
      attrMods: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      freeBonus: 2, // 自由单项 +2
      size: "中型",
      speed: 30,
      vision: "正常",
      traits: "1级额外获得1个专长槽；每级额外+1技能点。"
    },
    "矮人": {
      attrMods: { STR: 0, DEX: 0, CON: 2, INT: 0, WIS: 2, CHA: -2 },
      size: "中型",
      speed: 20,
      vision: "黑暗视觉 60尺",
      traits: "穿戴重甲不减速；对抗毒素与法术豁免+2；石觉。"
    },
    "精灵": {
      attrMods: { STR: 0, DEX: 2, CON: -2, INT: 2, WIS: 0, CHA: 0 },
      size: "中型",
      speed: 30,
      vision: "昏暗视觉",
      traits: "免疫睡眠；惑控豁免+2；察觉+2；法术穿透+2。"
    },
    "侏儒": {
      attrMods: { STR: -2, DEX: 0, CON: 2, INT: 0, WIS: 0, CHA: 2 },
      size: "小型",
      speed: 20,
      vision: "昏暗视觉",
      traits: "小型体型(AC/命中+1, 隐匿+4)；幻术DC+1；幻术豁免+2。"
    },
    "半身人": {
      attrMods: { STR: -2, DEX: 2, CON: 0, INT: 0, WIS: 0, CHA: 2 },
      size: "小型",
      speed: 20,
      vision: "正常",
      traits: "小型体型(AC/命中+1, 隐匿+4)；全豁免+1；恐惧豁免再+2；特技/察觉+2。"
    },
    "半精灵": {
      attrMods: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      freeBonus: 2,
      size: "中型",
      speed: 30,
      vision: "昏暗视觉",
      traits: "免疫睡眠；惑控豁免+2；察觉+2；免费获得【技能专攻】专长。"
    },
    "半兽人": {
      attrMods: { STR: 0, DEX: 0, CON: 0, INT: 0, WIS: 0, CHA: 0 },
      freeBonus: 2,
      size: "中型",
      speed: 30,
      vision: "黑暗视觉 60尺",
      traits: "威吓+2；【兽人坚韧】(HP降至负数时可维持瘫痪拼死战斗1轮)。"
    }
  },

  // 核心 11 大职业
  classes: {
    "野蛮人": {
      hd: 12, babType: "full", goodSaves: ["fort"],
      skillPoints: 4,
      classSkills: ["特技", "攀爬", "驯养动物", "威吓", "察觉", "骑术", "生存", "游泳"]
    },
    "吟游诗人": {
      hd: 8, babType: "med", goodSaves: ["ref", "will"],
      skillPoints: 6,
      classSkills: ["特技", "估价", "唬骗", "攀爬", "交涉", "伪装", "脱逃", "威吓", "察觉", "表演", "察言观色", "手上功夫", "辨识法术", "隐匿", "使用魔法装置"]
    },
    "牧师": {
      hd: 8, babType: "med", goodSaves: ["fort", "will"],
      skillPoints: 2,
      classSkills: ["估价", "交涉", "医疗", "察言观色", "辨识法术"]
    },
    "德鲁伊": {
      hd: 8, babType: "med", goodSaves: ["fort", "will"],
      skillPoints: 4,
      classSkills: ["攀爬", "飞行", "驯养动物", "医疗", "察觉", "骑术", "辨识法术", "生存", "游泳"]
    },
    "战士": {
      hd: 10, babType: "full", goodSaves: ["fort"],
      skillPoints: 2,
      classSkills: ["攀爬", "驯养动物", "威吓", "骑术", "生存", "游泳"]
    },
    "武僧": {
      hd: 8, babType: "med", goodSaves: ["fort", "ref", "will"],
      skillPoints: 4,
      classSkills: ["特技", "攀爬", "脱逃", "威吓", "察觉", "表演", "骑术", "察言观色", "隐匿", "游泳"]
    },
    "圣武士": {
      hd: 10, babType: "full", goodSaves: ["fort", "will"],
      skillPoints: 2,
      classSkills: ["交涉", "驯养动物", "医疗", "骑术", "察言观色", "辨识法术"]
    },
    "游侠": {
      hd: 10, babType: "full", goodSaves: ["fort", "ref"],
      skillPoints: 6,
      classSkills: ["特技", "攀爬", "驯养动物", "医疗", "威吓", "察觉", "骑术", "辨识法术", "隐匿", "生存", "游泳"]
    },
    "游荡者": {
      hd: 8, babType: "med", goodSaves: ["ref"],
      skillPoints: 8,
      classSkills: ["特技", "估价", "唬骗", "攀爬", "交涉", "解除装置", "伪装", "脱逃", "威吓", "察觉", "表演", "察言观色", "手上功夫", "隐匿", "游泳", "使用魔法装置"]
    },
    "术士": {
      hd: 6, babType: "slow", goodSaves: ["will"],
      skillPoints: 2,
      classSkills: ["唬骗", "辨识法术", "使用魔法装置"]
    },
    "法师": {
      hd: 6, babType: "slow", goodSaves: ["will"],
      skillPoints: 2,
      classSkills: ["估价", "辨识法术"]
    }
  },

  // 35项标准技能定义与对应核心属性 (ACP = 是否受护甲检定减值扣减)
  skills: [
    { name: "特技", attr: "DEX", acp: true },
    { name: "估价", attr: "INT", acp: false },
    { name: "唬骗", attr: "CHA", acp: false },
    { name: "攀爬", attr: "STR", acp: true },
    { name: "交涉", attr: "CHA", acp: false },
    { name: "解除装置", attr: "DEX", acp: true, trainedOnly: true },
    { name: "伪装", attr: "CHA", acp: false },
    { name: "脱逃", attr: "DEX", acp: true },
    { name: "飞行", attr: "DEX", acp: true },
    { name: "驯养动物", attr: "CHA", acp: false, trainedOnly: true },
    { name: "医疗", attr: "WIS", acp: false },
    { name: "威吓", attr: "CHA", acp: false },
    { name: "察觉", attr: "WIS", acp: false },
    { name: "表演", attr: "CHA", acp: false },
    { name: "骑术", attr: "DEX", acp: true },
    { name: "察言观色", attr: "WIS", acp: false },
    { name: "手上功夫", attr: "DEX", acp: true, trainedOnly: true },
    { name: "辨识法术", attr: "INT", acp: false, trainedOnly: true },
    { name: "隐匿", attr: "DEX", acp: true },
    { name: "生存", attr: "WIS", acp: false },
    { name: "游泳", attr: "STR", acp: true },
    { name: "使用魔法装置", attr: "CHA", acp: false, trainedOnly: true }
  ]
};

// 经典背景特性规范
const PF1E_TRAITS = {
  "反制者": {
    name: "反制者 (战斗背景)",
    type: "init",
    bonus: 2,
    desc: "精于预见突袭并快速应对威胁，先攻检定获得 +2 背景加值。"
  },
  "老练佣兵": {
    name: "老练佣兵 (战斗背景)",
    type: "will",
    bonus: 1,
    desc: "长年刀口舔血，意志豁免获得 +1 背景加值。"
  },
  "生性机警": {
    name: "生性机警 (信仰背景)",
    type: "perception",
    bonus: 1,
    desc: "耳聪目明，察觉检定获得 +1 背景加值且视作本职技能。"
  },
  "天生神力": {
    name: "天生神力 (生理背景)",
    type: "cmb",
    bonus: 1,
    desc: "体格雄壮，冲撞与摔绊 CMB 获得 +1 背景加值。"
  }
};

// =========================================================
// 1.2 CRB 核心专长库 (Feats) 与门派道途分支
// =========================================================

const CRB_CORE_FEATS = [
  { id: "power_attack", name: "猛力攻击 (Power Attack)", req: "力量 13", desc: "以 -1 近战命中换取 +2 (双手武器+3) 额外近战伤害。" },
  { id: "improved_init", name: "精通先攻 (Improved Initiative)", req: "无", desc: "战斗先攻检定直接获得 +4 加值，极速抢先出手占得先机。" },
  { id: "toughness", name: "健壮 (Toughness)", req: "无", desc: "直接获得 +3 永久生命值上限，大幅增强生存容错。" },
  { id: "dodge", name: "闪避 (Dodge)", req: "敏捷 13", desc: "防御等级 (AC) 永久获得 +1 闪避加值。" },
  { id: "point_blank_shot", name: "近距离射击 (Point-Blank Shot)", req: "无", desc: "30尺内远程攻击命中检定与伤害检定各获得 +1 加值。" },
  { id: "weapon_focus", name: "武器专攻 (Weapon Focus)", req: "BAB +1", desc: "选定武器攻击检定获得 +1 命中加值。" },
  { id: "spell_focus", name: "法术专攻 (Spell Focus)", req: "能够施法", desc: "所选法术学派豁免难度 DC 额外 +1。" },
  { id: "iron_will", name: "钢铁意志 (Iron Will)", req: "无", desc: "意志豁免检定直接获得 +2 永久加值。" },
  { id: "great_fortitude", name: "强韧加强 (Great Fortitude)", req: "无", desc: "强韧豁免检定直接获得 +2 永久加值。" },
  { id: "lightning_reflexes", name: "闪电反射 (Lightning Reflexes)", req: "无", desc: "反射豁免检定直接获得 +2 永久加值。" }
];

const CLASS_SUBCLASSES = {
  "术士": [
    { name: "🐉 巨龙血脉 (Draconic)", desc: "觉醒天生龙鳞防御 (天生护甲+1) 与龙之爪撕裂力量" },
    { name: "🔮 奥术血脉 (Arcane)", desc: "获得奥术连结法杖，法术专攻更强，施法专注极高" },
    { name: "☀️ 天界血脉 (Celestial)", desc: "获得天界神圣圣光之触，可触碰疗愈盟友或灼痛邪物" }
  ],
  "法师": [
    { name: "💥 塑能学派 (Evocation)", desc: "专注强攻法术力场，魔法飞弹与火炎杀伤更强" },
    { name: "🛡️ 防护学派 (Abjuration)", desc: "精于防护力场结界，奥术护盾与辟法防护卓越" },
    { name: "📜 全系通用学派 (Universalist)", desc: "八大学派兼收并蓄，不偏废任何法术" }
  ],
  "牧师": [
    { name: "⚔️ 战争领域 (War)", desc: "神明赐予战意祝福，兵刃交锋更显神威" },
    { name: "🌿 治疗领域 (Healing)", desc: "引导正能量与天恩神术恢复效果更强" },
    { name: "☀️ 太阳领域 (Sun)", desc: "神圣光辉灼照黑暗，专克不死恶煞" }
  ],
  "游侠": [
    { name: "👤 第一宿敌: 人形生物 (Humanoid)", desc: "对人形敌手 (强盗/刺客/乱军) 命中与伤害+2" },
    { name: "💀 第一宿敌: 不死生物 (Undead)", desc: "对幽魂、僵尸、骷髅命中与伤害+2" },
    { name: "👹 第一宿敌: 异界魔物 (Outsider)", desc: "对凶煞妖魔、深渊异类追踪与伤害+2" }
  ]
};

// 全 11 职业开局装备库 (严格符合 CRB 标准，术士法师穿法袍拿法杖，绝无穿甲失败率)
const CLASS_STARTING_EQUIPMENT = {
  "术士": {
    weapon: { name: "精工橡木法杖", threatRange: [20], critMultiplier: 2, damageDice: "1d6", damageType: "钝击" },
    armor: { name: "丝绸法袍 (无甲)", bonus: 0, maxDex: 99, acp: 0, spellFail: "0%" },
    inventory: [
      { name: "精工橡木法杖", category: "weapon", price: 5, weight: 4, qty: 1, equipped: true, desc: "1d6钝击, 简单双手武器" },
      { name: "轻型弩机", category: "weapon", price: 35, weight: 4, qty: 1, equipped: false, desc: "1d8穿刺, 19-20/x2, 射程80尺" },
      { name: "弩箭 (20支)", category: "gear", price: 2, weight: 2, qty: 1, desc: "随身弩箭弹药" },
      { name: "丝绸法袍", category: "armor", price: 10, weight: 2, qty: 1, equipped: true, desc: "舒适透气, 0%奥术失败率" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "饮用恢复 1d8+1 点生命" },
      { name: "施法材料包", category: "gear", price: 5, weight: 2, qty: 1, desc: "基础施法用具" }
    ]
  },
  "法师": {
    weapon: { name: "仪式法杖", threatRange: [20], critMultiplier: 2, damageDice: "1d6", damageType: "钝击" },
    armor: { name: "学者法袍 (无甲)", bonus: 0, maxDex: 99, acp: 0, spellFail: "0%" },
    inventory: [
      { name: "仪式法杖", category: "weapon", price: 5, weight: 4, qty: 1, equipped: true, desc: "1d6钝击" },
      { name: "精工匕首", category: "weapon", price: 2, weight: 1, qty: 1, equipped: false, desc: "1d4穿刺, 19-20/x2" },
      { name: "学者法袍", category: "armor", price: 10, weight: 2, qty: 1, equipped: true, desc: "轻柔袍服, 0%施法失败率" },
      { name: "法术书 (典籍)", category: "gear", price: 15, weight: 3, qty: 1, desc: "记载每日奥术真言" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "饮用恢复 1d8+1 点生命" }
    ]
  },
  "武僧": {
    weapon: { name: "齐眉棍", threatRange: [20], critMultiplier: 2, damageDice: "1d6", damageType: "钝击" },
    armor: { name: "苦行僧袍 (无甲)", bonus: 0, maxDex: 99, acp: 0, spellFail: "0%" },
    inventory: [
      { name: "齐眉棍", category: "weapon", price: 2, weight: 4, qty: 1, equipped: true, desc: "1d6钝击, 武僧双头兵刃" },
      { name: "苦行僧袍", category: "armor", price: 5, weight: 2, qty: 1, equipped: true, desc: "完全无甲, 完美发挥敏捷与感知双叠加 AC 防御" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "游荡者": {
    weapon: { name: "精工短剑", threatRange: [19, 20], critMultiplier: 2, damageDice: "1d6", damageType: "穿刺" },
    armor: { name: "精工软皮甲", bonus: 2, maxDex: 6, acp: 0, spellFail: "10%" },
    inventory: [
      { name: "精工短剑", category: "weapon", price: 10, weight: 2, qty: 1, equipped: true, desc: "1d6穿刺, 19-20/x2" },
      { name: "淬毒匕首", category: "weapon", price: 5, weight: 1, qty: 2, equipped: false, desc: "1d4穿刺, 暗杀备用" },
      { name: "精工软皮甲", category: "armor", price: 10, weight: 15, qty: 1, equipped: true, desc: "AC +2, 穿甲罚值 0 (轻巧潜行无拖累)" },
      { name: "盗贼工具包", category: "gear", price: 30, weight: 1, qty: 1, desc: "开锁与拆卸机关陷阱必备" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "游侠": {
    weapon: { name: "复合长弓", threatRange: [20], critMultiplier: 3, damageDice: "1d8", damageType: "穿刺" },
    armor: { name: "镶嵌皮甲", bonus: 3, maxDex: 5, acp: -1, spellFail: "15%" },
    inventory: [
      { name: "复合长弓", category: "weapon", price: 100, weight: 3, qty: 1, equipped: true, desc: "1d8穿刺, 致命 x3 暴击, 射程110尺" },
      { name: "羽箭 (40支)", category: "gear", price: 4, weight: 6, qty: 1, desc: "随身羽箭两壶" },
      { name: "猎人短剑", category: "weapon", price: 10, weight: 2, qty: 1, equipped: false, desc: "1d6穿刺, 近战防身" },
      { name: "镶嵌皮甲", category: "armor", price: 25, weight: 20, qty: 1, equipped: true, desc: "AC +3, 穿甲罚值 -1" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "野蛮人": {
    weapon: { name: "精工双手巨剑", threatRange: [19, 20], critMultiplier: 2, damageDice: "2d6", damageType: "挥砍" },
    armor: { name: "厚兽皮甲", bonus: 4, maxDex: 4, acp: -3, spellFail: "20%" },
    inventory: [
      { name: "精工双手巨剑", category: "weapon", price: 50, weight: 8, qty: 1, equipped: true, desc: "2d6挥砍, 19-20/x2, 刚猛巨力" },
      { name: "厚兽皮甲", category: "armor", price: 15, weight: 25, qty: 1, equipped: true, desc: "AC +4, 穿甲罚值 -3" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "牧师": {
    weapon: { name: "重型硬头锤", threatRange: [20], critMultiplier: 2, damageDice: "1d8", damageType: "钝击" },
    armor: { name: "硬鳞甲", bonus: 5, maxDex: 3, acp: -4, spellFail: "25%" },
    inventory: [
      { name: "重型硬头锤", category: "weapon", price: 12, weight: 8, qty: 1, equipped: true, desc: "1d8钝击" },
      { name: "硬鳞甲", category: "armor", price: 50, weight: 30, qty: 1, equipped: true, desc: "AC +5, 穿甲罚值 -4" },
      { name: "圣徽木盾", category: "armor", price: 7, weight: 5, qty: 1, equipped: true, desc: "AC +1 盾牌加值, 镌刻神圣印记" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "德鲁伊": {
    weapon: { name: "橡木弯刀", threatRange: [18, 20], critMultiplier: 2, damageDice: "1d6", damageType: "挥砍" },
    armor: { name: "生皮革甲 (非金属)", bonus: 2, maxDex: 6, acp: 0, spellFail: "10%" },
    inventory: [
      { name: "橡木弯刀", category: "weapon", price: 15, weight: 4, qty: 1, equipped: true, desc: "1d6挥砍, 18-20/x2 极宽暴击" },
      { name: "生皮革甲", category: "armor", price: 10, weight: 15, qty: 1, equipped: true, desc: "AC +2 (非金属天然皮甲，守戒无碍)" },
      { name: "重木盾", category: "armor", price: 7, weight: 10, qty: 1, equipped: true, desc: "AC +2 盾牌加值" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "圣武士": {
    weapon: { name: "精工长剑", threatRange: [19, 20], critMultiplier: 2, damageDice: "1d8", damageType: "挥砍" },
    armor: { name: "精工链甲衫", bonus: 4, maxDex: 4, acp: -1, spellFail: "20%" },
    inventory: [
      { name: "精工长剑", category: "weapon", price: 15, weight: 4, qty: 1, equipped: true, desc: "1d8挥砍, 19-20/x2" },
      { name: "精工链甲衫", category: "armor", price: 100, weight: 25, qty: 1, equipped: true, desc: "AC +4, 穿甲罚值 -1" },
      { name: "圣徽钢盾", category: "armor", price: 20, weight: 15, qty: 1, equipped: true, desc: "AC +2 盾牌加值" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "吟游诗人": {
    weapon: { name: "精工细剑", threatRange: [18, 20], critMultiplier: 2, damageDice: "1d6", damageType: "穿刺" },
    armor: { name: "精工软皮甲", bonus: 2, maxDex: 6, acp: 0, spellFail: "10%" },
    inventory: [
      { name: "精工细剑", category: "weapon", price: 20, weight: 2, qty: 1, equipped: true, desc: "1d6穿刺, 18-20/x2" },
      { name: "精工软皮甲", category: "armor", price: 10, weight: 15, qty: 1, equipped: true, desc: "AC +2 (轻装无拖累)" },
      { name: "精制鲁特琴", category: "gear", price: 35, weight: 3, qty: 1, desc: "奏乐引亢, 激发勇气之用" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  },
  "战士": {
    weapon: { name: "精工长剑", threatRange: [19, 20], critMultiplier: 2, damageDice: "1d8", damageType: "挥砍" },
    armor: { name: "精工链甲衫", bonus: 4, maxDex: 4, acp: -1, spellFail: "20%" },
    inventory: [
      { name: "精工长剑", category: "weapon", price: 15, weight: 4, qty: 1, equipped: true, desc: "1d8挥砍, 19-20/x2" },
      { name: "精工链甲衫", category: "armor", price: 100, weight: 25, qty: 1, equipped: true, desc: "AC +4, 穿甲罚值 -1" },
      { name: "重钢盾", category: "armor", price: 20, weight: 15, qty: 1, equipped: true, desc: "AC +2 盾牌加值" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "恢复 1d8+1 生命" }
    ]
  }
};

// 标准 PF1e 力量负重阶梯表 (中型生物: [轻载上限, 中载上限, 重载上限])
const PF1E_LOAD_TABLE = {
  1: [3, 6, 10], 2: [6, 13, 20], 3: [10, 20, 30], 4: [13, 26, 40],
  5: [16, 33, 50], 6: [20, 40, 60], 7: [23, 46, 70], 8: [26, 53, 80],
  9: [30, 60, 90], 10: [33, 66, 100], 11: [38, 76, 115], 12: [43, 86, 130],
  13: [50, 100, 150], 14: [58, 116, 175], 15: [66, 133, 200], 16: [76, 153, 230],
  17: [86, 173, 260], 18: [100, 200, 300], 19: [116, 233, 350], 20: [133, 266, 400],
  21: [153, 306, 460], 22: [173, 346, 520], 23: [200, 400, 600], 24: [233, 466, 700],
  25: [266, 533, 800]
};

function getLoadThresholds(strScore, size = "中型") {
  const score = Math.max(1, Math.min(25, strScore || 10));
  let [light, med, heavy] = PF1E_LOAD_TABLE[score] || [66, 133, 200];
  if (size === "小型") {
    light = Math.floor(light * 0.75);
    med = Math.floor(med * 0.75);
    heavy = Math.floor(heavy * 0.75);
  }
  return { light, med, heavy };
}

// 属性调整值计算公式
function calcMod(score) {
  return Math.floor((score - 10) / 2);
}

// 格式化输出修正值 (+2 / -1 / +0)
function fmtMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}


// =========================================================
// 2. 程序化 Web Audio 物理音效引擎 (零外部静态文件依赖)
// =========================================================

class ProceduralAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 合成多段骰子碰撞滚动声
  playDiceRoll() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const time = now + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + Math.random() * 220, time);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.06);
    }
  }

  // 大成功 Natural 20 胜利四和弦
  playNat20() {
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const time = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.65);
    });
  }

  // 大失败 Natural 1 警示低音鸣响
  playNat1() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // 索骰横幅唤起音效 (低音弦鸣)
  playAlert() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

const audio = new ProceduralAudioEngine();


// =========================================================
// 3. 全局应用状态 (FSM 与角色模型)
// =========================================================

const state = {
  // 角色卡模型 (标准 PF1e 战士开局范例，全数据解耦)
  character: {
    profile: {
      name: "行者",
      race: "人类",
      class: "战士",
      level: 1,
      gender: "男",
      age: 20,
      alignment: "守序中立",
      modernToken: "防风打火机"
    },
    abilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    hp: { current: 11, max: 11, temp: 0 },
    speed: 30,
    bab: 1,
    initiative: 4, // 敏捷 +2 + 反制者 +2
    cmb: 3,        // BAB 1 + 力量 +2
    cmd: 15,       // 10 + BAB 1 + 力量 +2 + 敏捷 +2
    ac: {
      total: 16,
      touch: 12,
      flatFooted: 14,
      armor: 4,
      shield: 0,
      dex: 2,
      maxDex: 4,
      acp: -2,
      spellFail: "20%"
    },
    saves: { fort: 3, ref: 2, will: 0 },
    trait: {
      name: "反制者 (战斗背景)",
      type: "init",
      bonus: 2,
      desc: "精于预见突袭并快速应对威胁，先攻检定获得 +2 背景加值。"
    },
    feat: {
      name: "猛力攻击 (入门专长)",
      desc: "以 -1 近战命中换取 +2 近战伤害加值。"
    },
    skills: {
      "特技": { ranks: 0, isClass: false, attr: "DEX" },
      "攀爬": { ranks: 1, isClass: true, attr: "STR" },
      "隐匿": { ranks: 1, isClass: false, attr: "DEX" },
      "察觉": { ranks: 1, isClass: false, attr: "WIS" },
      "威吓": { ranks: 1, isClass: true, attr: "CHA" }
    },
    weapon: {
      name: "精工长剑",
      threatRange: [19, 20],
      critMultiplier: 2,
      damageDice: "1d8",
      damageType: "挥砍",
      attackBonus: 3
    },
    load: { current: 35, lightMax: 66, medMax: 133, heavyMax: 200, status: "轻载" },
    currency: 150, // 初始随身资财 150 GP
    xp: { current: 0, next: 2000, level: 1 }, // 历练道行与等级轨
    inventory: [
      { name: "精工长剑", category: "weapon", price: 15, weight: 4, qty: 1, equipped: true, desc: "1d8伤害, 19-20/×2" },
      { name: "精工链甲衫", category: "armor", price: 100, weight: 25, qty: 1, equipped: true, desc: "AC +4, ACP -1" },
      { name: "治疗轻伤药水", category: "potion", price: 50, weight: 1, qty: 2, consumable: true, desc: "饮用恢复 1d8+1 点气血生命" },
      { name: "探险者背包", category: "gear", price: 2, weight: 2, qty: 1, desc: "随身装具" },
      { name: "麻绳 (50尺)", category: "gear", price: 1, weight: 10, qty: 1, desc: "结实麻绳，攀爬脱困必备" }
    ]
  },

  // 当前世界观题材
  theme: null,

  // 对话历史
  history: [],

  // 历代风云编年史简报列表（后台静默长程记忆）
  chronicles: [],

  // 战役宏观暗络大纲（核心主线 + 3支线）
  campaignArc: null,

  // 剧情世界时间流转锚点
  time_of_day: "晨光熹微 / 07:30",

  // 结缘人物谱 (短期记忆锚点与好感羁绊)
  npc_roster: [],

  // 挂起的索骰信息 (Pending Check)
  pendingCheck: null,

  // 车卡向导临时暂存状态
  wizard: {
    currentStep: 1,
    rolledScores: [15, 14, 13, 12, 10, 8],
    assignedAbilities: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    selectedRace: "人类",
    selectedRaceBonusAttr: "STR",
    selectedClass: "战士",
    selectedSubclass: null,
    selectedTrait: "反制者",
    fcbChoice: "hp",
    selectedFeats: [],
    skillRanks: {},
    availableSkillPoints: 4,
    token: "防风打火机",
    name: "行者",
    gender: "男",
    age: 20,
    height: 178,
    weight: 68,
    build: "修长匀称",
    looks: "墨发束冠，眼眸清朗，面容端方沉静，身着素青道袍",
    backstory: "自幼求索大道与身世真相"
  }
};


// =========================================================
// 3.5 全宇宙全题材通用引擎：时间流转、结缘人物谱与酷炫灵光动效
// =========================================================

// 1. 时间流转展示更新
function updateTimeDisplay(timeStr) {
  if (!timeStr) return;
  state.time_of_day = timeStr;
  const badge = document.getElementById("game-time-badge");
  if (badge) {
    badge.textContent = `⏳ ${timeStr}`;
    badge.title = `当前剧情世界流转时间：${timeStr}`;
  }
}


// 2. 结缘人物谱管理器
function addOrUpdateNpc(npc) {
  if (!npc || !npc.name) return;
  if (!state.npc_roster) state.npc_roster = [];
  
  const existingIdx = state.npc_roster.findIndex(n => n.name === npc.name);
  if (existingIdx !== -1) {
    state.npc_roster[existingIdx] = {
      ...state.npc_roster[existingIdx],
      role: npc.role || state.npc_roster[existingIdx].role,
      attitude: npc.attitude || state.npc_roster[existingIdx].attitude,
      relation: npc.relation || state.npc_roster[existingIdx].relation
    };
  } else {
    state.npc_roster.push({
      name: npc.name,
      role: npc.role || "未明",
      attitude: npc.attitude || "中立",
      relation: npc.relation || "初识结缘"
    });
  }

  updateNpcCountBadge();
  renderNpcRosterModal();
}

function updateNpcCountBadge() {
  const countBadge = document.getElementById("npc-count-badge");
  const count = (state.npc_roster || []).length;
  if (countBadge) {
    countBadge.textContent = `已结识 ${count} 人`;
  }
}

function renderNpcRosterModal() {
  const container = document.getElementById("npc-roster-body");
  if (!container) return;

  const roster = state.npc_roster || [];
  if (roster.length === 0) {
    container.innerHTML = `
      <div class="empty-npc-tip" style="text-align: center; color: #a0aec0; padding: 30px 10px;">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">📜</div>
        <p>暂未结识重要角色。随着剧情推演与 NPC 产生交集，司命将自动在此收录羁绊与态度！</p>
      </div>
    `;
    return;
  }

  let html = `<div class="npc-cards-grid">`;
  roster.forEach(npc => {
    let attitudeClass = "attitude-neutral";
    const att = (npc.attitude || "").toLowerCase();
    if (/友|亲|慕|喜|敬|信|崇/.test(att)) attitudeClass = "attitude-friendly";
    else if (/警|疑|防|慎|探/.test(att)) attitudeClass = "attitude-wary";
    else if (/敌|恨|杀|怨|死/.test(att)) attitudeClass = "attitude-hostile";

    html += `
      <div class="npc-card">
        <div class="npc-card-header">
          <span class="npc-card-name">${npc.name}</span>
          <span class="npc-attitude-badge ${attitudeClass}">态度: ${npc.attitude || '中立'}</span>
        </div>
        <div class="npc-card-role">阵营/身份：${npc.role || '隐秘'}</div>
        <div class="npc-card-relation">${npc.relation || '交错命运，风云初聚'}</div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function initNpcRosterModal() {
  const modal = document.getElementById("modal-npc-roster");
  const btnOpen = document.getElementById("btn-open-npc-roster");
  const btnDrawerOpen = document.getElementById("btn-drawer-open-roster");
  const btnClose = document.getElementById("btn-close-npc-roster");
  const btnFooter = document.getElementById("btn-close-npc-footer");

  if (!modal) return;
  const openModal = () => {
    modal.classList.remove("hidden");
    updateNpcCountBadge();
    renderNpcRosterModal();
  };
  const closeModal = () => modal.classList.add("hidden");

  if (btnOpen) btnOpen.onclick = openModal;
  if (btnDrawerOpen) btnDrawerOpen.onclick = openModal;
  if (btnClose) btnClose.onclick = closeModal;
  if (btnFooter) btnFooter.onclick = closeModal;
}

// 3. 突破行动智能建议胶囊渲染器
// 3. 智斗突破行动智能建议胶囊渲染器 (支持 3 个横排高质量卡片)
function renderActionSuggestions(suggestions) {
  const container = document.getElementById("action-suggestions-row");
  const inputAction = document.getElementById("input-action");
  if (!container) return;

  if (!suggestions || suggestions.length === 0) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.innerHTML = "";
  // 最多渲染 3 个横排智斗谋略卡片
  suggestions.slice(0, 3).forEach((sugg, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "action-capsule-btn";

    // 判断是结构化对象还是普通字符串
    if (typeof sugg === "object" && sugg !== null) {
      const title = sugg.title || `谋策 ${idx + 1}`;
      const desc = sugg.desc || sugg.title || "";
      const skill = sugg.skill || "智慧推演";
      const dcText = sugg.dc ? `对抗 DC ${sugg.dc}` : "见机行事";
      const bonusText = sugg.bonus ? `(+${sugg.bonus})` : "";

      card.innerHTML = `
        <div class="capsule-header">
          <span class="capsule-title">【${title}】</span>
          <span class="capsule-skill-tag">${skill} ${bonusText}</span>
        </div>
        <div class="capsule-desc">${desc}</div>
        <div class="capsule-dc">
          <span>🎯 ${dcText}</span>
          <span style="color:#d4af37;">点击执行 ↵</span>
        </div>
      `;

      card.onclick = () => {
        if (inputAction) {
          const actionText = `【${title}】：${desc}`;
          inputAction.value = actionText;
          inputAction.focus();
        }
      };
    } else {
      // 兼容历史纯文本格式
      const text = String(sugg);
      card.innerHTML = `
        <div class="capsule-header">
          <span class="capsule-title">【意图选择】</span>
          <span class="capsule-skill-tag">顺水推舟</span>
        </div>
        <div class="capsule-desc">${text}</div>
        <div class="capsule-dc">
          <span>🎯 即刻推进</span>
          <span style="color:#d4af37;">采纳 ↵</span>
        </div>
      `;
      card.onclick = () => {
        if (inputAction) {
          inputAction.value = text;
          inputAction.focus();
        }
      };
    }

    container.appendChild(card);
  });

  container.classList.remove("hidden");
}

// 4. 全屏酷炫灵光粒子动效系统 (Particle FX)
const ParticleFX = {
  canvas: null,
  ctx: null,
  particles: [],
  animId: null,

  init() {
    this.canvas = document.getElementById("fx-canvas");
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  burst(type = "gold", count = 50) {
    if (!this.canvas || !this.ctx) this.init();
    if (!this.ctx) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const colors = type === "magic" 
      ? ["#63b3ed", "#90cdf4", "#bbee66", "#f6d365", "#fff"]
      : ["#f6d365", "#d4af37", "#fbd38d", "#feb2b2", "#fff"];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      const radius = Math.random() * 4 + 1.5;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        radius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: Math.random() * 0.025 + 0.015
      });
    }

    if (!this.animId) {
      this.loop();
    }
  },

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};

// =========================================================
// 4. 战术面板视图同步、战利品与天命继业系统
// =========================================================

// 弹出战利品入囊飘字通知
function showRewardToast(reward) {
  const existing = document.querySelector(".reward-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "reward-toast";
  
  const itemsText = (reward.items || []).map(i => i.name).join("、");
  const descParts = [];
  if (reward.xp) descParts.push(`经验 +${reward.xp} XP`);
  if (reward.gp) descParts.push(`碎银 +${reward.gp} GP`);
  if (itemsText) descParts.push(`搜获道具：${itemsText}`);

  toast.innerHTML = `
    <div class="reward-icon">🏆</div>
    <div>
      <div class="reward-title">天道历练 · 战利品入囊</div>
      <div class="reward-desc">${descParts.join(" · ") || reward.reason || '斩获丰厚收益'}</div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
}

// 增加经验值并检查晋级
function addCharacterXP(amount, reason) {
  const c = state.character;
  if (!c) return;
  if (!c.xp) c.xp = { current: 0, next: 2000, level: c.profile?.level || 1 };

  c.xp.current += amount;
  renderTacticalPanel();

  if (c.xp.current >= c.xp.next && c.xp.level === 1) {
    audio.playNat20();
    appendNarrativeEntry("assistant", `【功参造化 · 经验圆满】：行者历练道行已臻至 ${c.xp.current}/${c.xp.next} 点！你浑身骨骼隐隐作响，内力激荡，可前往城镇客栈住店、或在荒野点击左栏【🏨 长休调息】正式破境晋升 2 级！`);
  }
}

// 天命陨落与传奇继承者系统 (世界存续，后人继业)
function showDeathLegacyModal() {
  const modal = document.getElementById("modal-death-legacy");
  if (!modal) return;
  const epitaph = document.getElementById("death-legacy-epitaph");
  const c = state.character;
  const name = c?.profile?.name || "行者";
  const cls = c?.profile?.class || "战士";
  const age = c?.profile?.age || 20;

  if (epitaph) {
    epitaph.innerHTML = `
      <strong>【行者 ${name} 终章碑铭】：</strong><br>
      时年 ${age} 岁的${cls}【${name}】在风云暗潮中力竭长眠，身死道未消。<br>
      旧人虽逝，但大千天下未曾停歇，未解之主线与天地宏愿犹在，留待后来人承接破局！
    `;
  }
  modal.classList.remove("hidden");
  audio.playNat1();

  const legacyBtn = document.getElementById("btn-create-legacy-char");
  if (legacyBtn) {
    legacyBtn.onclick = () => {
      modal.classList.add("hidden");
      // 保持当前战役题材、主线大纲与既有编年史，重新打开车卡向导！
      state.isLegacySuccession = true;
      const wizardModal = document.getElementById("modal-wizard");
      if (wizardModal) {
        wizardModal.classList.remove("hidden");
        showWizardStep(1);
      }
    };
  }
}

function renderTacticalPanel() {
  const c = state.character;
  if (!c) return;

  // 天命神技 · 金手指卡片动态呈现
  if (c.talent) {
    const talentCard = document.getElementById("card-destiny-talent");
    const iconElem = document.getElementById("destiny-talent-icon");
    const nameElem = document.getElementById("destiny-talent-name");
    const descElem = document.getElementById("destiny-talent-desc");
    const triggerElem = document.getElementById("destiny-talent-trigger");
    if (talentCard) talentCard.classList.remove("hidden");
    if (iconElem) iconElem.textContent = c.talent.icon || "✨";
    if (nameElem) nameElem.textContent = `天命神技 · ${c.talent.name}`;
    if (descElem) descElem.textContent = c.talent.desc || "";
    if (triggerElem) triggerElem.textContent = `🎯 专属判定：${c.talent.trigger || '神技碾压'} (+8 优选)`;
  }

  // 身份与气血
  document.getElementById("char-name").textContent = c.profile.name || "行者";
  document.getElementById("char-alignment").textContent = c.profile.alignment || "守序中立";
  document.getElementById("char-race").textContent = c.profile.race || "人类";
  document.getElementById("char-class").textContent = c.profile.class || "战士";
  const subclassElem = document.getElementById("char-subclass");
  if (subclassElem) subclassElem.textContent = c.profile.subclass ? `· ${c.profile.subclass}` : "";
  document.getElementById("char-level").textContent = c.profile.level || 1;
  const genderElem = document.getElementById("char-gender");
  if (genderElem) genderElem.textContent = c.profile.gender || "男";
  const ageElem = document.getElementById("char-age");
  if (ageElem) ageElem.textContent = c.profile.age || "20";

  // 身高体重体态外貌展示
  const hwElem = document.getElementById("char-height-weight");
  if (hwElem && c.profile.height && c.profile.weight) {
    hwElem.textContent = `${c.profile.height}cm / ${c.profile.weight}kg`;
  }
  const buildElem = document.getElementById("char-build");
  if (buildElem && c.profile.build) {
    buildElem.textContent = c.profile.build;
  }
  const looksElem = document.getElementById("char-looks-desc");
  if (looksElem && c.profile.looks) {
    looksElem.textContent = c.profile.looks;
  }

  document.getElementById("char-token").textContent = c.profile.modernToken || "无";

  document.getElementById("hp-current").textContent = c.hp.current;
  document.getElementById("hp-max").textContent = c.hp.max;
  const hpPercent = Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100));
  const hpBar = document.getElementById("hp-bar");
  hpBar.style.width = `${hpPercent}%`;

  // 历练道行与经验进度条
  const xpObj = c.xp || { current: 0, next: 2000, level: c.profile.level || 1 };
  const xpText = document.getElementById("xp-text");
  const xpBar = document.getElementById("xp-bar");
  if (xpText) xpText.textContent = `${xpObj.current} / ${xpObj.next} (${xpObj.level}级)`;
  if (xpBar) {
    const xpPercent = Math.min(100, (xpObj.current / xpObj.next) * 100);
    xpBar.style.width = `${xpPercent}%`;
  }

  // 状态指示 (瘫痪、濒死、死亡)
  const statusTag = document.getElementById("status-tag");
  const conScore = c.abilities.CON || 10;
  document.getElementById("death-threshold").textContent = conScore;

  if (c.hp.current > 0) {
    statusTag.textContent = "健康行气";
    statusTag.className = "status-tag status-normal";
  } else if (c.hp.current === 0) {
    statusTag.textContent = "瘫痪 (单动作)";
    statusTag.className = "status-tag status-disabled";
  } else if (c.hp.current > -conScore) {
    statusTag.textContent = "濒死昏迷 (流血对抗)";
    statusTag.className = "status-tag status-dying";
  } else {
    statusTag.textContent = "天命陨落 (阵亡)";
    statusTag.className = "status-tag status-dying";
    showDeathLegacyModal();
  }

  // 先攻与战系机动 (CMB/CMD)
  const initElem = document.getElementById("combat-init");
  if (initElem) initElem.textContent = fmtMod(c.initiative);
  const babElem = document.getElementById("combat-bab");
  if (babElem) babElem.textContent = fmtMod(c.bab);
  const cmbElem = document.getElementById("combat-cmb");
  if (cmbElem) cmbElem.textContent = fmtMod(c.cmb);
  const cmdElem = document.getElementById("combat-cmd");
  if (cmdElem) cmdElem.textContent = c.cmd;

  // 移动端快照
  const qHp = document.getElementById("quick-hp");
  if (qHp) qHp.textContent = `${c.hp.current}/${c.hp.max}`;
  const qAc = document.getElementById("quick-ac");
  if (qAc) qAc.textContent = c.ac.total;
  const qInit = document.getElementById("quick-init");
  if (qInit) qInit.textContent = fmtMod(c.initiative);

  // AC 矩阵
  document.getElementById("ac-total").textContent = c.ac.total;
  document.getElementById("ac-touch").textContent = c.ac.touch;
  document.getElementById("ac-flat").textContent = c.ac.flatFooted;
  const acArmor = document.getElementById("ac-armor");
  if (acArmor) acArmor.textContent = c.ac.armor ?? 4;
  const acShield = document.getElementById("ac-shield");
  if (acShield) acShield.textContent = c.ac.shield ?? 0;
  const acDex = document.getElementById("ac-dex");
  if (acDex) acDex.textContent = c.ac.dex ?? calcMod(c.abilities.DEX);
  const acMaxDex = document.getElementById("ac-maxdex");
  if (acMaxDex) acMaxDex.textContent = c.ac.maxDex ?? 4;
  const acAcp = document.getElementById("ac-acp");
  if (acAcp) acAcp.textContent = c.ac.acp ?? -2;
  const acSpellFail = document.getElementById("ac-spellfail");
  if (acSpellFail) acSpellFail.textContent = c.ac.spellFail ?? "20%";
  const speedElem = document.getElementById("speed-val");
  if (speedElem) speedElem.textContent = c.speed ?? 30;

  // 六维属性与修正值
  ["STR", "DEX", "CON", "INT", "WIS", "CHA"].forEach(attr => {
    const score = c.abilities[attr] || 10;
    const mod = calcMod(score);
    const scoreElem = document.getElementById(`abi-${attr.toLowerCase()}`);
    const modElem = document.getElementById(`mod-${attr.toLowerCase()}`);
    if (scoreElem) scoreElem.textContent = score;
    if (modElem) modElem.textContent = fmtMod(mod);
  });

  // 三大豁免
  document.getElementById("save-fort").textContent = fmtMod(c.saves.fort);
  document.getElementById("save-ref").textContent = fmtMod(c.saves.ref);
  document.getElementById("save-will").textContent = fmtMod(c.saves.will);

  // 随身资财与货栈状态
  const currElem = document.getElementById("display-currency");
  if (currElem) currElem.textContent = `${c.currency ?? 150} GP`;
  const currSubElem = document.getElementById("display-currency-sub");
  if (currSubElem) currSubElem.textContent = `折合 ${(c.currency ?? 150) * 10} 银两 / 现金`;

  // 武器与致命重击 (安全容错)
  const wepName = document.getElementById("weapon-name");
  if (wepName && c.weapon) wepName.textContent = c.weapon.name;
  const wepAb = document.getElementById("weapon-ab");
  if (wepAb && c.weapon) wepAb.textContent = fmtMod(c.weapon.attackBonus);
  const wepDmg = document.getElementById("weapon-damage");
  if (wepDmg && c.weapon) {
    const strMod = calcMod(c.abilities.STR);
    wepDmg.textContent = `${c.weapon.damageDice}${fmtMod(strMod)}`;
  }
  const weaponTypeElem = document.getElementById("weapon-type");
  if (weaponTypeElem && c.weapon) weaponTypeElem.textContent = c.weapon.damageType || "挥砍";
  const threatBadge = document.getElementById("weapon-threat-badge");
  if (threatBadge && c.weapon) {
    const tr = c.weapon.threatRange || [19, 20];
    const trStr = tr.length > 1 ? `${tr[0]}-${tr[tr.length - 1]}` : `${tr[0]}`;
    threatBadge.textContent = `${trStr} / ×${c.weapon.critMultiplier || 2} 重击`;
  }

  // 背景特性与专长卡
  const traitNameElem = document.getElementById("trait-name");
  const traitDescElem = document.getElementById("trait-desc");
  if (traitNameElem && c.trait) traitNameElem.textContent = c.trait.name;
  if (traitDescElem && c.trait) traitDescElem.textContent = c.trait.desc;

  const featNameElem = document.getElementById("feat-name");
  const featDescElem = document.getElementById("feat-desc");
  if (featNameElem && c.feat) featNameElem.textContent = c.feat.name;
  if (featDescElem && c.feat) featDescElem.textContent = c.feat.desc;

  // 负重阶梯表
  const loadBadge = document.getElementById("load-badge");
  if (loadBadge && c.load) {
    loadBadge.textContent = `${c.load.status} ${c.load.current}/${c.load.lightMax} 磅`;
  }
  const loadLight = document.getElementById("load-light");
  if (loadLight && c.load) loadLight.textContent = c.load.lightMax;
  const loadMed = document.getElementById("load-med");
  if (loadMed && c.load) loadMed.textContent = c.load.medMax;
  const loadHeavy = document.getElementById("load-heavy");
  if (loadHeavy && c.load) loadHeavy.textContent = c.load.heavyMax;

  // 技能列表
  const skillsList = document.getElementById("skills-list");
  skillsList.innerHTML = "";
  Object.keys(c.skills).forEach(skName => {
    const sk = c.skills[skName];
    const attrMod = calcMod(c.abilities[sk.attr] || 10);
    let totalMod = attrMod + (sk.ranks || 0);
    let isClass = sk.isClass;
    if (skName === "察觉" && c.trait && c.trait.type === "perception") {
      isClass = true;
      totalMod += 1;
    }
    if (isClass && sk.ranks > 0) totalMod += 3;
    // ACP 扣减
    const skDef = PF1E_RULES.skills.find(s => s.name === skName);
    if (skDef && skDef.acp) {
      totalMod += (c.ac.acp || 0);
    }

    const li = document.createElement("li");
    li.className = "skill-row";
    li.innerHTML = `
      <span class="skill-name ${isClass ? 'is-class' : ''}">${skName} (${sk.attr})</span>
      <span class="skill-mod">${fmtMod(totalMod)}</span>
    `;
    skillsList.appendChild(li);
  });

  // 联动刷新右栏行囊与装备快照、全量 35 项技能矩阵与道法天书
  if (typeof renderInventorySummaryCard === "function") {
    renderInventorySummaryCard();
  }
  if (typeof renderSkillsMatrix === "function") {
    renderSkillsMatrix();
  }
  if (typeof renderSpellsCard === "function") {
    renderSpellsCard();
  }
}


// =========================================================
// =========================================================
// 5. 索骰/变卦双轨拦截器 (Regex & Natural Language Fallback)
// =========================================================

// 容错暗号正则：支持冒号(中英文)、竖线(中英文)、加粗星号、缺少REASON
const FLEXIBLE_CHECK_REGEX = /(?:\*{1,2})?\[\s*CHECK\s*[:：]\s*([^\|｜]+?)\s*[\|｜]\s*DC\s*[:：]\s*(\d+)(?:\s*[\|｜]\s*REASON\s*[:：]\s*([^\]]+))?\s*\](?:\*{1,2})?/i;

// 常见检定与豁免判据关键词表
const KNOWN_CHECK_KEYWORDS = [
  "强韧", "反射", "意志",
  "先攻", "CMB", "CMD", "战系机动", "冲撞", "摔绊", "擒抱", "卸除武器",
  "察觉", "隐匿", "交涉", "欺骗", "威吓", "察言观色", "解除装置", "手上功夫",
  "杂技", "攀爬", "游泳", "脱逃", "飞行", "骑术", "医疗", "生存", "法术辨识",
  "估价", "易容", "语言学", "表演", "专业",
  "知识(神秘)", "知识(地下城)", "知识(自然)", "知识(宗教)", "知识(地方)", "知识(历史)", "知识(位面)", "知识(贵族)", "知识(工程)", "知识(地理)",
  "神秘知识", "地下城知识", "自然知识", "宗教知识", "地方知识", "历史知识",
  "攻击", "挥斩", "命中", "近战", "射击",
  "力量", "敏捷", "体质", "智力", "感知", "魅力"
];

// 自然语言语义保底扫描器：当大模型漏掉 [CHECK: ...] 时，自动从文本中提取检定名目与难度
function scanNaturalLanguageForCheck(text) {
  if (!text) return null;

  // 1. 优先扫描明确技能/豁免名目：例如“请进行一次【隐匿】检定(DC 12)”、“需要进行强韧豁免”
  for (const name of KNOWN_CHECK_KEYWORDS) {
    const pattern = new RegExp(`(?:请|需|需要|进行|尝试|做一次|投掷|掷一次|来一次|通过)?[^。！？\n]{0,12}?(?:【|“|")?(${name})(?:】|”|")?[^。！？\n]{0,8}?(?:检定|豁免|判定)`, "i");
    const m = text.match(pattern);
    if (m) {
      const checkType = m[1];
      // 提取同一文本中的 DC 难度数值
      const dcMatch = text.match(/(?:DC|难度|目标)\s*[:：为是]?\s*(\d+)/i);
      const dc = dcMatch ? parseInt(dcMatch[1], 10) : 12; // 默认 PF1e 1级常规标准难度 DC 12
      return {
        type: checkType,
        dc: dc,
        reason: `剧情推演要求通过【${checkType}】判定`
      };
    }
  }

  // 2. 泛化保底：文本中明确出现了“请投骰”或“需要进行检定”
  const genericMatch = text.match(/(?:请|需要|进行|尝试|通过)[^。！？\n]{0,12}?(?:检定|豁免|投骰)(?:[，,\s]*(?:DC|难度)\s*[:：]?\s*(\d+))?/i);
  if (genericMatch) {
    const dc = genericMatch[1] ? parseInt(genericMatch[1], 10) : 12;
    return {
      type: "命途机缘",
      dc: dc,
      reason: "司命要求进行临场天数裁定"
    };
  }

  return null;
}

// 全面核算角色在此项检定中的总加值与加减值明细 (含穿甲减值 ACP、本职+3、特征)
function getCheckBonusDetail(checkType) {
  const c = state.character;
  if (!c) {
    return { bonus: 0, detail: "未构建人物卡 (修正 0)" };
  }

  const norm = (checkType || "").toLowerCase();

  // 1. 先攻判定
  if (norm.includes("先攻") || norm.includes("init")) {
    const dexMod = calcMod(c.abilities.DEX);
    const traitBonus = (c.trait && c.trait.type === "init") ? c.trait.bonus : 0;
    const total = c.initiative ?? (dexMod + traitBonus);
    const parts = [`敏捷修正(${fmtMod(dexMod)})`];
    if (traitBonus) parts.push(`命格特质(${fmtMod(traitBonus)})`);
    return { bonus: total, detail: parts.join(" + ") };
  }

  // 2. 战系机动 (CMB / CMD)
  if (norm.includes("cmb") || norm.includes("战系机动") || norm.includes("冲撞") || norm.includes("摔绊") || norm.includes("擒抱") || norm.includes("卸除武器")) {
    const bab = c.bab || 0;
    const strMod = calcMod(c.abilities.STR);
    const traitBonus = (c.trait && c.trait.type === "cmb") ? c.trait.bonus : 0;
    const total = c.cmb ?? (bab + strMod + traitBonus);
    return { bonus: total, detail: `BAB(${bab}) + 力量(${fmtMod(strMod)})` + (traitBonus ? ` + 特质(${fmtMod(traitBonus)})` : "") };
  }
  if (norm.includes("cmd") || norm.includes("机动防御")) {
    const bab = c.bab || 0;
    const strMod = calcMod(c.abilities.STR);
    const dexMod = calcMod(c.abilities.DEX);
    const total = c.cmd ?? (10 + bab + strMod + dexMod);
    return { bonus: total, detail: `基准(10) + BAB(${bab}) + 力量(${fmtMod(strMod)}) + 敏捷(${fmtMod(dexMod)})` };
  }

  // 3. 豁免判定
  if (norm.includes("强韧")) {
    const total = c.saves.fort || 0;
    const conMod = calcMod(c.abilities.CON);
    const baseFort = total - conMod;
    return { bonus: total, detail: `体质修正(${fmtMod(conMod)}) + 职业基础强韧(${baseFort >= 0 ? '+' + baseFort : baseFort})` };
  }
  if (norm.includes("反射")) {
    const total = c.saves.ref || 0;
    const dexMod = calcMod(c.abilities.DEX);
    const baseRef = total - dexMod;
    return { bonus: total, detail: `敏捷修正(${fmtMod(dexMod)}) + 职业基础反射(${baseRef >= 0 ? '+' + baseRef : baseRef})` };
  }
  if (norm.includes("意志")) {
    const total = c.saves.will || 0;
    const wisMod = calcMod(c.abilities.WIS);
    const baseWill = total - wisMod;
    return { bonus: total, detail: `感知修正(${fmtMod(wisMod)}) + 职业基础意志(${baseWill >= 0 ? '+' + baseWill : baseWill})` };
  }

  // 4. 技能判定 (精准映射 35 项 PF1e 技能及其日常俗称)
  for (const skName of Object.keys(c.skills)) {
    const skLower = skName.toLowerCase();
    const isMatched = norm.includes(skLower) || 
      (skName === "察觉" && (norm.includes("侦查") || norm.includes("聆听") || norm.includes("观察") || norm.includes("寻找"))) ||
      (skName === "隐匿" && (norm.includes("潜行") || norm.includes("躲藏") || norm.includes("匿踪"))) ||
      (skName === "解除装置" && (norm.includes("开锁") || norm.includes("拆除陷阱") || norm.includes("排险"))) ||
      (skName === "察言观色" && (norm.includes("识破") || norm.includes("洞察") || norm.includes("读心"))) ||
      (skName === "交涉" && (norm.includes("说服") || norm.includes("谈判") || norm.includes("安抚"))) ||
      (skName === "欺骗" && (norm.includes("谎言") || norm.includes("诳骗") || norm.includes("伪装"))) ||
      (skName === "威吓" && (norm.includes("恐吓") || norm.includes("震慑"))) ||
      (skName === "手上功夫" && (norm.includes("扒窃") || norm.includes("藏匿") || norm.includes("戏法")));

    if (isMatched) {
      const sk = c.skills[skName];
      const attrMod = calcMod(c.abilities[sk.attr] || 10);
      const ranks = sk.ranks || 0;
      let isClass = sk.isClass;
      let traitBonus = 0;
      if (skName === "察觉" && c.trait && c.trait.type === "perception") {
        isClass = true;
        traitBonus = 1;
      }
      const classBonus = (isClass && ranks > 0) ? 3 : 0;
      
      const skDef = PF1E_RULES.skills.find(s => s.name === skName);
      const acpPenalty = (skDef && skDef.acp) ? (c.ac.acp || 0) : 0;
      
      const total = attrMod + ranks + classBonus + traitBonus + acpPenalty;
      const parts = [`${sk.attr}修正(${fmtMod(attrMod)})`];
      if (ranks > 0) parts.push(`技能点(${ranks})`);
      if (classBonus > 0) parts.push(`本职专修(+3)`);
      if (traitBonus > 0) parts.push(`特质加成(+${traitBonus})`);
      if (acpPenalty !== 0) parts.push(`穿甲减值(${acpPenalty})`);

      return { bonus: total, detail: parts.join(" + ") };
    }
  }

  // 5. 六维纯属性调整值判定
  if (norm.includes("力量")) return { bonus: calcMod(c.abilities.STR), detail: `力量调整值(${fmtMod(calcMod(c.abilities.STR))})` };
  if (norm.includes("敏捷")) return { bonus: calcMod(c.abilities.DEX), detail: `敏捷调整值(${fmtMod(calcMod(c.abilities.DEX))})` };
  if (norm.includes("体质")) return { bonus: calcMod(c.abilities.CON), detail: `体质调整值(${fmtMod(calcMod(c.abilities.CON))})` };
  if (norm.includes("智力")) return { bonus: calcMod(c.abilities.INT), detail: `智力调整值(${fmtMod(calcMod(c.abilities.INT))})` };
  if (norm.includes("感知")) return { bonus: calcMod(c.abilities.WIS), detail: `感知调整值(${fmtMod(calcMod(c.abilities.WIS))})` };
  if (norm.includes("魅力")) return { bonus: calcMod(c.abilities.CHA), detail: `魅力调整值(${fmtMod(calcMod(c.abilities.CHA))})` };

  // 6. 兵刃近战与远程攻击判定
  if (norm.includes("攻击") || norm.includes("挥斩") || norm.includes("命中") || norm.includes("近战") || norm.includes("射击")) {
    const atk = c.weapon.attackBonus || 0;
    return { bonus: atk, detail: `BAB(${c.bab}) + 力量/敏捷修正 + 兵刃特性 = ${fmtMod(atk)}` };
  }

  return { bonus: 0, detail: "纯运机缘 (修正 0)" };
}

// 智能核算角色在此项检定中的总加值
function computePlayerBonusForCheck(checkType) {
  return getCheckBonusDetail(checkType).bonus;
}

// 索骰指令解析器（双轨：机器标记优先，自然语言保底）
function parseAndHandleCheckDirective(rawText) {
  let matchedCheck = null;
  let cleanText = rawText;

  // 1. 尝试结构化机器标记匹配
  const match = rawText.match(FLEXIBLE_CHECK_REGEX);
  if (match) {
    matchedCheck = {
      type: match[1].trim(),
      dc: parseInt(match[2].trim(), 10),
      reason: match[3] ? match[3].trim() : "剧情临场推演"
    };
    cleanText = rawText.replace(match[0], "").trim();
  } else {
    // 2. 结构化标记缺失时：启动自然语言语义保底扫描器
    const naturalFound = scanNaturalLanguageForCheck(rawText);
    if (naturalFound) {
      matchedCheck = naturalFound;
    }
  }

  if (matchedCheck) {
    const bonusInfo = getCheckBonusDetail(matchedCheck.type);
    state.pendingCheck = {
      type: matchedCheck.type,
      dc: matchedCheck.dc,
      reason: matchedCheck.reason,
      bonus: bonusInfo.bonus,
      bonusDetail: bonusInfo.detail
    };

    // 呼出金色脉冲横幅
    showPendingCheckBanner(state.pendingCheck);
    audio.playAlert();
  }

  return cleanText;
}

function showPendingCheckBanner(check) {
  const banner = document.getElementById("banner-check");
  document.getElementById("check-type-label").textContent = `【${check.type}检定】`;
  document.getElementById("check-dc-value").textContent = check.dc;
  document.getElementById("check-reason-text").textContent = `判据：${check.reason}`;
  document.getElementById("check-bonus-preview").textContent = fmtMod(check.bonus);

  const detailElem = document.getElementById("check-bonus-detail");
  if (detailElem) {
    detailElem.textContent = `加值核算：${check.bonusDetail || '属性与专修修正'} (总计 ${fmtMod(check.bonus)})`;
  }

  banner.classList.remove("hidden");
}

function hidePendingCheckBanner() {
  const banner = document.getElementById("banner-check");
  banner.classList.add("hidden");
  state.pendingCheck = null;
}


// =========================================================
// 6. 3D 拟真物理投骰与重击确认
// =========================================================

function performDiceRoll(type, bonus, dc, callback) {
  const overlay = document.getElementById("overlay-dice");
  const cube = document.getElementById("dice-cube");
  const resultBanner = document.getElementById("dice-result-banner");
  const critBadge = document.getElementById("dice-crit-badge");
  const calcRow = document.getElementById("dice-calc-row");
  const vsRow = document.getElementById("dice-vs-row");

  resultBanner.classList.add("hidden");
  overlay.classList.remove("hidden");
  cube.classList.add("rolling");

  audio.playDiceRoll();

  // 随机生成 D20 骰目
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + bonus;
  const isSuccess = total >= dc;

  setTimeout(() => {
    cube.classList.remove("rolling");

    // 拟真重击与失误检测
    let critText = "";
    critBadge.className = "dice-crit-badge";

    if (d20 === 20) {
      critBadge.textContent = "★ 绝境大成功 (Natural 20) ★";
      critBadge.classList.add("crit-success");
      audio.playNat20();
      if (typeof ParticleFX !== "undefined") ParticleFX.burst("gold", 80);
    } else if (d20 === 1) {
      critBadge.textContent = "☠ 绝境大失败 (Natural 1) ☠";
      critBadge.classList.add("crit-fail");
      audio.playNat1();
    } else {
      critBadge.textContent = isSuccess ? "对抗成功" : "局势恶化 (对抗受挫)";
      critBadge.classList.add(isSuccess ? "crit-success" : "crit-fail");
      if (isSuccess && typeof ParticleFX !== "undefined") ParticleFX.burst("gold", 35);
    }

    calcRow.textContent = `D20 (${d20}) + 加值 (${fmtMod(bonus)}) = 总值 ${total}`;
    vsRow.textContent = `对抗目标 DC ${dc} —— ${isSuccess ? "【胜出】" : "【受挫】"}`;
    resultBanner.classList.remove("hidden");

    document.getElementById("btn-close-dice").onclick = () => {
      overlay.classList.add("hidden");
      if (callback) callback({ d20, bonus, total, isSuccess });
    };
  }, 1200);
}


// =========================================================
// 7. 剧情流与 API 通信 (DeepSeek / SSE)
// =========================================================

// 轻量化 HTML 实体安全转义，防止 XSS 注入
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function appendNarrativeEntry(role, text) {
  const stream = document.getElementById("narrative-stream");
  const entry = document.createElement("div");
  entry.className = `narrative-entry ${role === 'user' ? 'entry-player' : 'entry-dm'}`;

  const seal = document.createElement("div");
  seal.className = "speaker-seal";
  seal.textContent = role === 'user' ? '我' : '司命';

  const content = document.createElement("div");
  content.className = "entry-content";

  // 格式化文本段落（用户发言严格转义防止 XSS）
  const paragraphs = text.split("\n\n").filter(p => p.trim());
  paragraphs.forEach(p => {
    const pElem = document.createElement("p");
    if (p.includes("你接下来要干嘛？")) {
      pElem.className = "narrative-question";
    }
    const safeText = (role === 'user') ? escapeHtml(p) : p;
    pElem.innerHTML = safeText.replace(/\n/g, "<br>");
    content.appendChild(pElem);
  });

  entry.appendChild(seal);
  entry.appendChild(content);
  stream.appendChild(entry);
  stream.scrollTop = stream.scrollHeight;

  state.history.push({ role, content: text });
}


// 向后端发送行动意图
async function sendPlayerAction(actionText) {
  if (!actionText || !actionText.trim()) return;

  const rawText = actionText.trim();

  // 若战役尚未正式选定切入点分支（未正式开幕），允许自由更新与覆盖题材
  const isBranchChoice = ["分支一", "分支二", "分支三", "分支四"].some(b => rawText.includes(b));
  if (!state.hasStartedFirstAct && !isBranchChoice && !rawText.startsWith("【")) {
    state.theme = rawText;
    const subTitleElem = document.getElementById("campaign-theme-subtitle");
    if (subTitleElem) subTitleElem.textContent = `${state.theme} · 全题材叙事引擎`;
    const themeDescElem = document.getElementById("current-theme-desc");
    if (themeDescElem) themeDescElem.textContent = state.theme;
  }
  if (isBranchChoice) {
    state.hasStartedFirstAct = true;
  }

  // 检查并扣除消耗道具（若通过行囊按钮使用）
  if (state.pendingUsedItem) {
    if (typeof consumeInventoryItem === "function") {
      consumeInventoryItem(state.pendingUsedItem);
    }
    state.pendingUsedItem = null;
  }

  // 呈现玩家行动
  appendNarrativeEntry("user", rawText);

  // 创建 DM 的待接收容器 (植入实时状态机与计时器)
  const stream = document.getElementById("narrative-stream");
  const dmEntry = document.createElement("div");
  dmEntry.className = "narrative-entry entry-dm";

  const timerStart = Date.now();
  let timerInterval = null;

  dmEntry.innerHTML = `
    <div class="speaker-seal">司命</div>
    <div class="entry-content">
      <div class="narrative-status-box">
        <div class="status-header-row">
          <span class="status-text-pulse"><span class="pulse-dot"></span><span class="status-title-text">司命运筹推演中...</span></span>
          <span class="status-timer-badge" id="active-timer-badge">0.0s</span>
        </div>
        <div class="status-stage-msg" id="active-stage-msg">正在构思因果局势与阻力...</div>
      </div>
    </div>
  `;
  stream.appendChild(dmEntry);
  stream.scrollTop = stream.scrollHeight;

  const contentElem = dmEntry.querySelector(".entry-content");
  const timerBadge = dmEntry.querySelector("#active-timer-badge");
  const stageMsg = dmEntry.querySelector("#active-stage-msg");

  const stagePrompts = [
    { at: 0, text: "正在构思因果局势与环境阻力..." },
    { at: 2200, text: "正在检索 PF1e 规则库并测算因果..." },
    { at: 5000, text: "正在推演敌我战术博弈与走位..." },
    { at: 8500, text: "正在雕琢小说级临场对白与感官细节..." },
    { at: 14000, text: "司命神思宏阔，全速编织万字风云..." }
  ];

  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - timerStart) / 1000;
    if (timerBadge) timerBadge.textContent = `${elapsed.toFixed(1)}s`;
    const curStage = [...stagePrompts].reverse().find(s => (Date.now() - timerStart) >= s.at);
    if (stageMsg && curStage) stageMsg.textContent = curStage.text;
  }, 100);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: state.history,
        character_info: state.character,
        theme: state.theme,
        chronicles: state.chronicles || [],
        campaign_arc: state.campaignArc || null,
        time_of_day: state.time_of_day || "晨光熹微 / 07:30",
        npc_roster: state.npc_roster || [],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`服务器响应异常: ${response.status}`);
    }

    let hasReceivedFirstChunk = false;
    let accumulatedText = "";
    let sseBuffer = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split("\n");
      // 将最后一个可能被网络分包截断的未闭合行留在缓冲区中等待后续拼合
      sseBuffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.content) {
              if (!hasReceivedFirstChunk) {
                hasReceivedFirstChunk = true;
                if (timerInterval) {
                  clearInterval(timerInterval);
                  timerInterval = null;
                }
                contentElem.innerHTML = "";
              }
              accumulatedText += parsed.content;
              // 彻底过滤已闭合及正在输出中未闭合的后台标记，防止文本“先显示后回弹抽走”
              const displayHtml = accumulatedText
                .replace(/\[(?:REWARD|CHECK|QUEST|ARC|COMBAT|COMBAT_UPDATE|COMBAT_END|TIME|NPC|SUGGESTIONS)[\s\S]*?\]/gi, "")
                .replace(/\[(?:REWARD|CHECK|QUEST|ARC|COMBAT|COMBAT_UPDATE|COMBAT_END|TIME|NPC|SUGGESTIONS)[^\]]*$/gi, "")
                .replace(/\n\n+/g, "</p><p>")
                .replace(/\n/g, "<br>");
              contentElem.innerHTML = displayHtml;
              stream.scrollTop = stream.scrollHeight;
            }
          } catch (e) {
            // 继续解析后续数据包
          }
        }
      }
    }


    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // 后处理：解析主线任务指令、时间流转、人物谱、建议胶囊、战利品、索骰与战斗指令
    let processedText = accumulatedText;

    // 1. 时间流转解析 [TIME: "时辰/时间"]
    const timeMatch = processedText.match(/\[TIME:\s*["“']?([^"”'\]]+)["”']?\]/i);
    if (timeMatch) {
      const newTime = timeMatch[1].trim();
      updateTimeDisplay(newTime);
      processedText = processedText.replace(timeMatch[0], "").trim();
    }

    // 2. 结缘人物谱更新解析 [NPC: {"name": "...", "role": "...", "attitude": "...", "relation": "..."}]
    const npcMatches = processedText.matchAll(/\[NPC:\s*(\{.*?\})\]/gi);
    for (const match of npcMatches) {
      try {
        const npcData = JSON.parse(match[1]);
        addOrUpdateNpc(npcData);
      } catch (e) {
        console.warn("解析 NPC 标记失败:", e);
      }
      processedText = processedText.replace(match[0], "").trim();
    }

    // 3. 突破行动智能建议胶囊 [SUGGESTIONS: ["...", "..."]]
    const suggMatch = processedText.match(/\[SUGGESTIONS:\s*(\[.*?\])\]/i);
    if (suggMatch) {
      try {
        const suggestions = JSON.parse(suggMatch[1]);
        renderActionSuggestions(suggestions);
      } catch (e) {
        console.warn("解析建议胶囊失败:", e);
      }
      processedText = processedText.replace(suggMatch[0], "").trim();
    } else {
      renderActionSuggestions([]);
    }

    // 战利品与经验/金钱奖励解析 [REWARD: {"xp": 100, "gp": 30, "items": [...], "reason": "..."}]
    const rewardMatch = processedText.match(/\[REWARD:\s*(\{.*?\})\]/i);
    if (rewardMatch) {
      try {
        const rewardData = JSON.parse(rewardMatch[1]);
        if (rewardData.xp && typeof addCharacterXP === "function") {
          addCharacterXP(Number(rewardData.xp), rewardData.reason || "战斗/探险历练");
        }
        if (rewardData.gp) {
          state.character.currency = (state.character.currency || 0) + Number(rewardData.gp);
        }
        if (Array.isArray(rewardData.items) && rewardData.items.length > 0) {
          if (!state.character.inventory) state.character.inventory = [];
          rewardData.items.forEach(item => {
            const existing = state.character.inventory.find(i => i.name === item.name);
            if (existing) {
              existing.qty = (existing.qty || 1) + (Number(item.qty) || 1);
            } else {
              state.character.inventory.push({
                name: item.name,
                category: item.category || "gear",
                price: Number(item.price) || 5,
                weight: Number(item.weight) || 1,
                qty: Number(item.qty) || 1,
                desc: item.desc || "探险搜获"
              });
            }
          });
        }
        if (typeof showRewardToast === "function") {
          showRewardToast(rewardData);
        }
        renderTacticalPanel();
      } catch (e) {
        console.warn("解析战利品指令失败:", e);
      }
      processedText = processedText.replace(rewardMatch[0], "").trim();
    }

    // 战役主线与暗络支线解析
    const arcMatch = processedText.match(/\[ARC:\s*(\{.*?\})\]/i);
    if (arcMatch) {
      try {
        state.campaignArc = JSON.parse(arcMatch[1]);
      } catch (e) {
        console.warn("解析战役暗络失败:", e);
      }
      processedText = processedText.replace(arcMatch[0], "").trim();
    }

    const questMatch = processedText.match(/\[QUEST:\s*([^\]]+)\]/i);
    if (questMatch) {
      const questContent = questMatch[1].trim();
      state.quest = questContent;
      if (!state.campaignArc) {
        state.campaignArc = {
          main_quest: questContent,
          side_a: "查清牵扯当年的宿怨密辛",
          side_b: "获取关键物证或特殊机缘",
          side_c: "暗处潜伏的猜忌与危机"
        };
      }
      const themeDescElem = document.getElementById("current-theme-desc");
      if (themeDescElem) {
        themeDescElem.innerHTML = `<strong>【核心使命/主线】：</strong>${questContent}`;
      }
      processedText = processedText.replace(questMatch[0], "").trim();
    }

    // 战斗模式开启 (唯在战斗时自动呼出沙盘)
    const combatMatch = processedText.match(/\[COMBAT:\s*(\{.*?\})\]/i);
    if (combatMatch) {
      try {
        const combatData = JSON.parse(combatMatch[1]);
        if (typeof CombatGrid !== "undefined") {
          CombatGrid.startCombat(combatData);
        }
      } catch (e) {
        console.warn("解析战术沙盘指令失败:", e);
      }
      processedText = processedText.replace(combatMatch[0], "").trim();
    }

    // 战斗走位与气血更新
    const combatUpdateMatch = processedText.match(/\[COMBAT_UPDATE:\s*(\{.*?\})\]/i);
    if (combatUpdateMatch) {
      try {
        const updateData = JSON.parse(combatUpdateMatch[1]);
        if (typeof CombatGrid !== "undefined") {
          CombatGrid.updateCombat(updateData);
        }
      } catch (e) {
        console.warn("解析战斗更新指令失败:", e);
      }
      processedText = processedText.replace(combatUpdateMatch[0], "").trim();
    }

    // 战斗结束 (威胁解除，沙盘自动收起)
    if (processedText.includes("[COMBAT_END]")) {
      if (typeof CombatGrid !== "undefined") {
        CombatGrid.endCombat();
      }
      processedText = processedText.replace(/\[COMBAT_END\]/gi, "").trim();
    }

    let cleanFinalText = parseAndHandleCheckDirective(processedText);
    cleanFinalText = cleanFinalText
      .replace(/\[(?:REWARD|CHECK|QUEST|ARC|COMBAT|COMBAT_UPDATE|COMBAT_END|TIME|NPC|SUGGESTIONS)[\s\S]*?\]/gi, "")
      .replace(/\[(?:REWARD|CHECK|QUEST|ARC|COMBAT|COMBAT_UPDATE|COMBAT_END|TIME|NPC|SUGGESTIONS)[^\]]*$/gi, "")
      .trim();

    contentElem.innerHTML = cleanFinalText
      .replace(/\n\n+/g, "</p><p>")
      .replace(/\n/g, "<br>");

    state.history.push({ role: "assistant", content: cleanFinalText });

    // 提炼本回合高密度纪事存入长程风云编年史 (限 30 字，彻底避免上千回合失忆)
    const rawPlain = cleanFinalText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (rawPlain) {
      if (!state.chronicles) state.chronicles = [];
      const brief = rawPlain.slice(0, 30);
      state.chronicles.push(`第${state.chronicles.length + 1}幕: ${brief}...`);
      if (state.chronicles.length > 50) state.chronicles.shift(); // 保持最新的 50 条纪事
    }

    // 自动保存本地存档
    saveGameToServer();

  } catch (err) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    contentElem.innerHTML = `
      <div class="narrative-error-card">
        <div class="error-title">⚠️ 司命通传受阻 (推演中断或网络异常)</div>
        <div class="error-desc">${err.message || '网络连接超时或后端响应异常，请检查网络或后端容器运行状态。'}</div>
        <button class="btn btn-retry-action" id="btn-retry-${timerStart}">🔄 重新推演此步</button>
      </div>
    `;
    const retryBtn = contentElem.querySelector(`#btn-retry-${timerStart}`);
    if (retryBtn) {
      retryBtn.onclick = () => {
        dmEntry.remove();
        state.history.pop();
        sendPlayerAction(rawText);
      };
    }
  }
}


// =========================================================
// 8. 司命问询式降噪车卡向导 (Wizard Controller)
// =========================================================

// 本地常驻 100 项天命神技真典 (彻底解决外部 talents.js 404 或网络延迟导致的静默失效)
const DEFAULT_DESTINY_TALENTS = [
  {
    "id": 1,
    "name": "心声窃听",
    "category": "神念窥天",
    "icon": "👂",
    "desc": "近身三尺或对视凝神时，可强制窃听对方此刻内心最真实隐秘的碎碎念。",
    "trigger": "察言观色/心声"
  },
  {
    "id": 2,
    "name": "恶意雷达",
    "category": "神念窥天",
    "icon": "🚨",
    "desc": "方圆十丈内若有人对你动了杀心、暗算或栽赃念头，脑海自动预警并锁定凶徒方位。",
    "trigger": "察觉/防暗算"
  },
  {
    "id": 3,
    "name": "谎言自燃",
    "category": "神念窥天",
    "icon": "🔥",
    "desc": "凡对你当面撒谎者，其耳垂或喉节将微红发烫，你瞬间能分辨其句句真伪。",
    "trigger": "察言观色/识破"
  },
  {
    "id": 4,
    "name": "黑料窥镜",
    "category": "神念窥天",
    "icon": "📖",
    "desc": "注视任何一人十息，眼前浮现其生平最羞于启齿或最恐惧的一件致命把柄。",
    "trigger": "知识/挖把柄"
  },
  {
    "id": 5,
    "name": "预知三秒",
    "category": "神念窥天",
    "icon": "⏳",
    "desc": "致命危险或刺杀降临前 3 秒，眼前自动浮现慢放残影，使你料敌先机。",
    "trigger": "先攻/闪避"
  },
  {
    "id": 6,
    "name": "物品溯源",
    "category": "神念窥天",
    "icon": "🔍",
    "desc": "触摸任何凶器、药包或密信，脑中回溯物主最后一次接触它时的短暂声画。",
    "trigger": "调查/物证"
  },
  {
    "id": 7,
    "name": "好感视界",
    "category": "神念窥天",
    "icon": "💖",
    "desc": "所有人的头顶都实时浮现对你的好感数值与阵营倾向，利用或提防一目了然。",
    "trigger": "交涉/社交"
  },
  {
    "id": 8,
    "name": "天机谶语",
    "category": "神念窥天",
    "icon": "📜",
    "desc": "每日拂晓自生一道今日凶吉卦象，指明避祸与发财的具体时辰与方位。",
    "trigger": "运势/趋吉"
  },
  {
    "id": 9,
    "name": "微表情读心",
    "category": "神念窥天",
    "icon": "👁️",
    "desc": "任何微弱的眼皮跳动、呼吸滞缓都逃不过你的眼，能精准还原其真实心理活动。",
    "trigger": "察言观色/心理"
  },
  {
    "id": 10,
    "name": "暗语破译",
    "category": "神念窥天",
    "icon": "🗝️",
    "desc": "任何黑话、密信切口、摩斯密码或药房切口，在你眼中如同白话一目了然。",
    "trigger": "语言/破译"
  },
  {
    "id": 11,
    "name": "命数探针",
    "category": "神念窥天",
    "icon": "🧭",
    "desc": "手触任何岔路或选择，直觉立刻提示哪条路会遇险，哪条路有贵人接应。",
    "trigger": "抉择/指路"
  },
  {
    "id": 12,
    "name": "密谋共鸣",
    "category": "神念窥天",
    "icon": "🌐",
    "desc": "隔墙听音如临其境，任何掩门密谋或窃窃私语在你耳中纤毫毕现。",
    "trigger": "察觉/偷听"
  },
  {
    "id": 13,
    "name": "生死簿残页",
    "category": "神念窥天",
    "icon": "☠️",
    "desc": "看一眼濒危或重伤之人，能精准知晓其剩余寿数、病灶根源与续命药方。",
    "trigger": "医疗/诊断"
  },
  {
    "id": 14,
    "name": "宿敌标记",
    "category": "神念窥天",
    "icon": "🎯",
    "desc": "可将一人标记为宿敌，无论其换装易容成谁，只要出现你必能瞬间识破伪装。",
    "trigger": "识破/伪装"
  },
  {
    "id": 15,
    "name": "因果丝线",
    "category": "神念窥天",
    "icon": "🧶",
    "desc": "视野中可看见人与人之间纠缠的暗线（红线为情仇、金线为利益、黑线为主从）。",
    "trigger": "人际/暗线"
  },
  {
    "id": 16,
    "name": "神思过载",
    "category": "神念窥天",
    "icon": "🧠",
    "desc": "瞬间思考速度提升十倍，眨眼之间推演对方下一步动作并制定三套应对策。",
    "trigger": "智谋/推演"
  },
  {
    "id": 17,
    "name": "绝对潜匿",
    "category": "神隐戏法",
    "icon": "👤",
    "desc": "只要贴近阴影或背靠墙壁屏息，哪怕搜查者近在咫尺亦将你视作空气。",
    "trigger": "隐匿/潜行"
  },
  {
    "id": 18,
    "name": "金蝉脱壳",
    "category": "神隐戏法",
    "icon": "🪞",
    "desc": "危急关头留下一具惟妙惟肖的幻影假身在原地，真身已悄然移位三丈之外。",
    "trigger": "脱身/替身"
  },
  {
    "id": 19,
    "name": "千面百变",
    "category": "神隐戏法",
    "icon": "🎭",
    "desc": "只要换上一套衣衫，脸部骨骼与嗓音立刻自然化作对应身份的相貌，毫无破绽。",
    "trigger": "伪装/易容"
  },
  {
    "id": 20,
    "name": "开锁鬼手",
    "category": "神隐戏法",
    "icon": "🔑",
    "desc": "无论古代铜锁、铁锁暗锁，还是现代电子门禁，一根细铁丝三秒内无声必开。",
    "trigger": "巧手/破门"
  },
  {
    "id": 21,
    "name": "寸步穿墙",
    "category": "神隐戏法",
    "icon": "🚪",
    "desc": "身体可短暂虚化一瞬，穿透三尺厚度的实心墙壁或紧锁门窗。",
    "trigger": "逃脱/遁形"
  },
  {
    "id": 22,
    "name": "无声落步",
    "category": "神隐戏法",
    "icon": "🐾",
    "desc": "行走奔跑脚底如踏棉絮，踩碎瓦片干枝亦绝不发出半分声响。",
    "trigger": "特技/轻功"
  },
  {
    "id": 23,
    "name": "瞒天过海",
    "category": "神隐戏法",
    "icon": "🌫️",
    "desc": "当面被人搜身时，可将违禁品瞬间藏入虚空夹层，任凭如何翻找两手空空。",
    "trigger": "巧手/藏物"
  },
  {
    "id": 24,
    "name": "盲视迷雾",
    "category": "神隐戏法",
    "icon": "💨",
    "desc": "挥袖可掷出一团遮蔽五步范围的呛鼻浓烟，趁乱换位或顺走关键物证。",
    "trigger": "障眼法"
  },
  {
    "id": 25,
    "name": "影子潜伏",
    "category": "神隐戏法",
    "icon": "🌑",
    "desc": "可化为薄影潜伏在别人影子里随其移动，不被察觉地进出严密封锁的禁地。",
    "trigger": "潜伏/附影"
  },
  {
    "id": 26,
    "name": "飞檐走壁",
    "category": "神隐戏法",
    "icon": "🧗",
    "desc": "十指与脚尖能吸附于光滑立柱与屋顶，倒挂梁上听取密信如履平地。",
    "trigger": "攀爬/特技"
  },
  {
    "id": 27,
    "name": "气息全无",
    "category": "神隐戏法",
    "icon": "🧊",
    "desc": "彻底收敛心跳、体温与气味，即便是最灵敏的猎犬亦无法闻到你的踪迹。",
    "trigger": "隐匿/匿迹"
  },
  {
    "id": 28,
    "name": "移形换位",
    "category": "神隐戏法",
    "icon": "⚡",
    "desc": "与十步以内任何体量相近的死物（如花瓶、衣架）瞬间对调位置。",
    "trigger": "闪烁换位"
  },
  {
    "id": 29,
    "name": "破妄明眸",
    "category": "神隐戏法",
    "icon": "✨",
    "desc": "任何易容术、幻术、障眼法在你的双眸之下皆化为虚妄，直视本尊面目。",
    "trigger": "破幻/直觉"
  },
  {
    "id": 30,
    "name": "空手入白刃",
    "category": "绝顶身手",
    "icon": "🗡️",
    "desc": "无论暗处刺来的飞刃或近身劈砍，双指一夹必定稳稳截停夺下。",
    "trigger": "近战反制"
  },
  {
    "id": 31,
    "name": "踏雪无痕",
    "category": "绝顶身手",
    "icon": "❄️",
    "desc": "掠过泥泞或雪地不留任何脚印痕迹，追踪高手亦无法推演你的去向。",
    "trigger": "踪迹全消"
  },
  {
    "id": 32,
    "name": "凌波微步",
    "category": "绝顶身手",
    "icon": "🌀",
    "desc": "在刀光剑影的围攻中如闲庭信步，所有针对你的远程暗器命中率强行减半。",
    "trigger": "闪避特技"
  },
  {
    "id": 33,
    "name": "百毒不侵",
    "category": "肉身神异",
    "icon": "🧪",
    "desc": "吞服世间剧毒皆如甘露琼浆，不仅毫发无损，更能逼出毒液反噬仇敌。",
    "trigger": "强韧/嚼毒反噬"
  },
  {
    "id": 34,
    "name": "龟息假死",
    "category": "肉身神异",
    "icon": "💀",
    "desc": "心跳骤停体表冰凉，御医法医验尸皆断定气绝，半个时辰后破棺自醒。",
    "trigger": "假死脱身"
  },
  {
    "id": 35,
    "name": "寸劲碎石",
    "category": "肉身神异",
    "icon": "👊",
    "desc": "掌指蕴含暗劲，轻拍门闩桌角可在内部震碎锁芯，外表却完好无损。",
    "trigger": "暗劲破坏"
  },
  {
    "id": 36,
    "name": "千杯不倒",
    "category": "肉身神异",
    "icon": "🍶",
    "desc": "海量烈酒入腹顺指尖蒸发，在酒局暗算与灌酒套话中永远保持绝对清醒。",
    "trigger": "酒局套话"
  },
  {
    "id": 37,
    "name": "铜皮铁骨",
    "category": "肉身神异",
    "icon": "🛡️",
    "desc": "暗处飞刃袭身入肉即弹开，外表柔美实则肌体坚如磐石，免疫轻伤。",
    "trigger": "护体防御"
  },
  {
    "id": 38,
    "name": "灵血救赎",
    "category": "肉身神异",
    "icon": "🩸",
    "desc": "自身一滴指尖血便是万能吊命灵丹，喂给濒死重伤者可强行续命一炷香。",
    "trigger": "圣血续命"
  },
  {
    "id": 39,
    "name": "大力伏虎",
    "category": "肉身神异",
    "icon": "🏋️",
    "desc": "看似纤弱清瘦，单手却能掀翻实木桌榻或悄然搬开数百斤石狮暗道。",
    "trigger": "怪力破关"
  },
  {
    "id": 40,
    "name": "回天自愈",
    "category": "肉身神异",
    "icon": "🩹",
    "desc": "刀伤擦伤在半炷香内止血结痂愈合且不留任何伤疤，毫无破绽可寻。",
    "trigger": "自愈消痕"
  },
  {
    "id": 41,
    "name": "气味辨药",
    "category": "肉身神异",
    "icon": "👃",
    "desc": "轻嗅即可辨析三丈内任何茶水、熏香或胭脂中的细微下毒成分。",
    "trigger": "嗅辨毒理"
  },
  {
    "id": 42,
    "name": "明目夜视",
    "category": "肉身神异",
    "icon": "💡",
    "desc": "伸手不见五指的黑夜密室视物如白昼，地上的暗痕发丝纤毫毕现。",
    "trigger": "夜视侦察"
  },
  {
    "id": 43,
    "name": "血气如虹",
    "category": "肉身神异",
    "icon": "🫀",
    "desc": "生机底蕴极为浑厚，生命上限额外翻倍，只要一息尚存便绝无昏死之虞。",
    "trigger": "顽强生机"
  },
  {
    "id": 44,
    "name": "起死回生",
    "category": "造化神技",
    "icon": "🕊️",
    "desc": "死者咽气未过一刻钟，施展一针或一指即可强行还魂回阳，救活关键人证！",
    "trigger": "逆转生死"
  },
  {
    "id": 45,
    "name": "武道极境 (一剑破万法)",
    "category": "绝顶神技",
    "icon": "⚔️",
    "desc": "暗藏三百年精纯内力，抬手剑气横扫当场震飞围攻凶徒，绝对武力碾压！",
    "trigger": "剑气横扫"
  },
  {
    "id": 46,
    "name": "如影随形 (影卫死士)",
    "category": "守护神技",
    "icon": "🥷",
    "desc": "暗处永远潜伏一名顶尖死士影卫，遇刺不仅替死格挡，更将刺客生擒献上！",
    "trigger": "影卫反杀"
  },
  {
    "id": 47,
    "name": "神针封脉",
    "category": "医道绝技",
    "icon": "🪡",
    "desc": "指间银针一闪刺入要穴，可令狂暴对手瞬间四肢麻痹、动弹不得。",
    "trigger": "截穴定身"
  },
  {
    "id": 48,
    "name": "百炼金丹胃",
    "category": "肉身神异",
    "icon": "🔥",
    "desc": "腹内如丹炉真火，任何毒菌、蛊虫吞下瞬间被胃火炼化为澎湃精气！",
    "trigger": "炼蛊化精"
  },
  {
    "id": 49,
    "name": "金口玉言 (帝王威压)",
    "category": "至尊权柄",
    "icon": "👑",
    "desc": "上位者威压全开，无论对方官阶多高或骨头多硬，受质问者心胆俱裂当场招供！",
    "trigger": "威严震慑/必破防"
  },
  {
    "id": 50,
    "name": "祸水倾国 (绝代风华)",
    "category": "至尊魅力",
    "icon": "🌸",
    "desc": "容颜气质摄人心魄，所有阵营掌权者初见你极度倾慕偏袒，主动替你脱罪开脱！",
    "trigger": "倾城偏袒/开脱"
  },
  {
    "id": 51,
    "name": "富可敌国 (散财通天)",
    "category": "通天财力",
    "icon": "💰",
    "desc": "掌控天下第一钱庄金印，挥金如土，任何打点买命、眼线调遣无往不利！",
    "trigger": "重金买通/破关"
  },
  {
    "id": 52,
    "name": "假节钺 (先斩后奏)",
    "category": "特权神物",
    "icon": "📜",
    "desc": "随身持有最高特权密令或丹书铁券，可当场宣判并当众处置忤逆反派！",
    "trigger": "特权宣判"
  },
  {
    "id": 53,
    "name": "权谋翻手 (党羽连坐)",
    "category": "弄权奇谋",
    "icon": "♟️",
    "desc": "三言两语罗织罪名，令对手阵营内部互相猜忌、当场倒戈攻讦彼此！",
    "trigger": "挑拨内讧"
  },
  {
    "id": 54,
    "name": "八面玲珑 (黑白通吃)",
    "category": "名宿手腕",
    "icon": "🏮",
    "desc": "无论官府名宿还是绿林强梁皆欠你一份重大人情，见你信物皆需退避三舍。",
    "trigger": "人脉人情"
  },
  {
    "id": 55,
    "name": "后宫独宠 (枕边天风)",
    "category": "至尊权柄",
    "icon": "🪭",
    "desc": "一颦一笑皆牵动君王心神，一句看似无意的耳语便能定夺一位重臣的前途生死。",
    "trigger": "借刀弄权"
  },
  {
    "id": 56,
    "name": "号令群雄 (掌门金印)",
    "category": "名宿威仪",
    "icon": "🚩",
    "desc": "亮出金令大印，在场同一阵营江湖豪杰或门徒属下立刻俯首听令调遣。",
    "trigger": "号令门徒"
  },
  {
    "id": 57,
    "name": "资本绞杀 (商业巨鳄)",
    "category": "现代商战",
    "icon": "📊",
    "desc": "看穿对手资金链命门，调动万亿资本瞬息封死其退路，让其当场破产清算。",
    "trigger": "商业压制"
  },
  {
    "id": 58,
    "name": "军阀威临 (铁血军威)",
    "category": "一方霸主",
    "icon": "🎖️",
    "desc": "一身戎马杀气凛然，挥手间荷枪实弹卫队清场，任何宵小当场伏诛不敢妄动。",
    "trigger": "铁血镇压"
  },
  {
    "id": 59,
    "name": "暗桩遍天下",
    "category": "情报霸主",
    "icon": "🕸️",
    "desc": "各茶楼客栈、后宫深巷皆有你密探眼线，任何针对你的阴谋皆被提前截获。",
    "trigger": "提前破局"
  },
  {
    "id": 60,
    "name": "反客为主",
    "category": "心理制霸",
    "icon": "🛋️",
    "desc": "踏入他人主场审讯，三言两语反向主导问询节奏，让审问者反成答话下属。",
    "trigger": "心理制霸"
  },
  {
    "id": 61,
    "name": "金蝉代罪",
    "category": "弄权奇谋",
    "icon": "🎭",
    "desc": "遇到重大纰漏，自会有替死鬼属下主动出面扛下所有罪责，你毫发无损。",
    "trigger": "替罪脱身"
  },
  {
    "id": 62,
    "name": "倾城笑靥",
    "category": "至尊魅力",
    "icon": "😊",
    "desc": "淡淡一笑便能化解满堂杀气，让拔刀相向的仇敌不由自主放下兵刃愿听你讲理。",
    "trigger": "化干戈为玉帛"
  },
  {
    "id": 63,
    "name": "名满天下",
    "category": "声望光环",
    "icon": "🌟",
    "desc": "走到任何州府城镇，只要自报家门，地方权贵或江湖名宿必扫榻以最高规格相迎。",
    "trigger": "声望礼遇"
  },
  {
    "id": 64,
    "name": "空城退兵",
    "category": "至尊权谋",
    "icon": "🏯",
    "desc": "面临大队人马抄家时神态自若煮茶弹琴，令带头搜查者惊疑不定主动撤兵。",
    "trigger": "疑兵吓退"
  },
  {
    "id": 65,
    "name": "丹书铁券",
    "category": "特权免死",
    "icon": "🏅",
    "desc": "随身持有免死御敕，哪怕犯下抄家大罪，亦能当堂亮出强行免罪开脱。",
    "trigger": "免死御敕"
  },
  {
    "id": 66,
    "name": "暗度陈仓",
    "category": "运筹帷幄",
    "icon": "📦",
    "desc": "明面上被严密封锁软禁，暗中关键物资与核心人马早已通过地下渠道转移完毕。",
    "trigger": "暗道转移"
  },
  {
    "id": 67,
    "name": "妙手空空",
    "category": "奇门把戏",
    "icon": "🪶",
    "desc": "十步之内无需触碰，指尖微引即可将对方腰间钥匙、账本或信物无声摄入袖中。",
    "trigger": "巧手/隔空"
  },
  {
    "id": 68,
    "name": "倒霉厄运",
    "category": "奇门把戏",
    "icon": "🍌",
    "desc": "只要你暗中诅咒一人，半刻钟内其必当众踩滑倒地、汤汁泼身出尽洋相。",
    "trigger": "出丑恶作剧"
  },
  {
    "id": 69,
    "name": "颠倒黑白",
    "category": "奇门把戏",
    "icon": "🎩",
    "desc": "被当场抓现行时胡扯一句荒诞借口，在场众人三分钟内会莫名觉得‘言之有理’。",
    "trigger": "欺骗脱罪"
  },
  {
    "id": 70,
    "name": "祸水东引",
    "category": "奇门把戏",
    "icon": "👉",
    "desc": "搜捕赃物临身时，袖底暗劲可让赃物在眨眼间悄无声息滑入反派自己的荷包中！",
    "trigger": "栽赃反杀"
  },
  {
    "id": 71,
    "name": "天降横财",
    "category": "奇门把戏",
    "icon": "🪙",
    "desc": "低头总能捡到碎金叶子或前人遗落的暗格钥匙，资财奇物永不匮乏。",
    "trigger": "气运捡漏"
  },
  {
    "id": 72,
    "name": "借刀杀人",
    "category": "奇门把戏",
    "icon": "⚔️",
    "desc": "在两人之间轻声叹息挑拨半句，即可让本来结盟的两个仇家当场反目拔刀相向。",
    "trigger": "反目借刀"
  },
  {
    "id": 73,
    "name": "顺手牵羊",
    "category": "奇门把戏",
    "icon": "🧤",
    "desc": "与人擦身而过的一瞬，无论其怀揣何等严密物证，皆能如同取自家物件般顺走。",
    "trigger": "神偷物证"
  },
  {
    "id": 74,
    "name": "顺水推舟",
    "category": "奇门把戏",
    "icon": "⛵",
    "desc": "对方设下的构陷圈套，你可以原封不动顺着其势头转变成彻底扳倒对方的陷阱。",
    "trigger": "将计就计"
  },
  {
    "id": 75,
    "name": "巧合之王",
    "category": "奇门把戏",
    "icon": "🎲",
    "desc": "看似走投无路时，总会有打翻的烛台或受惊的野兽等巧合事件替你遮掩过关。",
    "trigger": "幸运脱险"
  },
  {
    "id": 76,
    "name": "以假乱真",
    "category": "奇门把戏",
    "icon": "💎",
    "desc": "随手捡一块顽石，在普通人眼中能维持一炷香时间的‘绝世重宝’假象。",
    "trigger": "幻象伪物"
  },
  {
    "id": 77,
    "name": "引火烧身",
    "category": "奇门把戏",
    "icon": "🕯️",
    "desc": "指尖微弹火星，令远处反派的锦袍或帘幕微火自燃，制造混乱趁机破局。",
    "trigger": "引火制造混乱"
  },
  {
    "id": 78,
    "name": "字迹通灵",
    "category": "伪造神技",
    "icon": "✍️",
    "desc": "看一眼他人笔迹，便能提笔100%仿写出真假难辨的亲笔密信与官府印章。",
    "trigger": "笔迹仿造"
  },
  {
    "id": 79,
    "name": "心魔引燃",
    "category": "言语攻心",
    "icon": "👿",
    "desc": "精准戳中对方心底最嫉恨之痛处，令其在君王或长官面前失控破防露馅。",
    "trigger": "激将失控"
  },
  {
    "id": 80,
    "name": "传音入密",
    "category": "密谋绝招",
    "icon": "💬",
    "desc": "十步内声音直接送入特定同盟耳中，身旁敌手即便贴面亦听不到半点声响。",
    "trigger": "暗中串供"
  },
  {
    "id": 81,
    "name": "无赖诈疯",
    "category": "奇门把戏",
    "icon": "🤡",
    "desc": "一旦对簿公堂受罚，只要假装抽搐发癫，对方只能认定你中邪而暂停问罪。",
    "trigger": "避难缓兵"
  },
  {
    "id": 82,
    "name": "隔岸观火",
    "category": "奇谋智计",
    "icon": "🔥",
    "desc": "引爆两派势力的生死决斗，自己坐在一旁品茶看戏，坐收渔翁之利。",
    "trigger": "坐收渔利"
  },
  {
    "id": 83,
    "name": "百兽通音",
    "category": "通灵驭兽",
    "icon": "🦅",
    "desc": "房梁雀鸟与庭院飞猫皆是你的情报眼线，可向其打探谁深夜进过密室。",
    "trigger": "兽类密报"
  },
  {
    "id": 84,
    "name": "言灵摄心",
    "category": "摄魄通灵",
    "icon": "🗣️",
    "desc": "言语自带神魂律动，对方会不由自主点头应允你一个不过分的请求（如借钥匙）。",
    "trigger": "言灵应允"
  },
  {
    "id": 85,
    "name": "梦魇编织",
    "category": "神魂咒术",
    "icon": "🛌",
    "desc": "夜半吹一口轻气，令目标整夜梦见罪证败露，翌日神思恍惚当众失言。",
    "trigger": "梦魇破防"
  },
  {
    "id": 86,
    "name": "摄魂遗忘",
    "category": "记忆操纵",
    "icon": "💫",
    "desc": "折扇一合，令对视之人短暂停滞五秒心神恍惚，彻底忘记刚才听到的一句话。",
    "trigger": "删除记忆"
  },
  {
    "id": 87,
    "name": "神魂出窍",
    "category": "通灵探密",
    "icon": "👻",
    "desc": "肉身静坐，神识化作无形游魂飘入深殿巡视，查清暗格账册再归体。",
    "trigger": "出窍探密"
  },
  {
    "id": 88,
    "name": "强制噤声",
    "category": "因果神术",
    "icon": "🤐",
    "desc": "打个响指，对方想在众人面前指证你的嘴巴在三分钟内张口无声！",
    "trigger": "强行闭嘴"
  },
  {
    "id": 89,
    "name": "时光倒流一分钟",
    "category": "天道因果",
    "icon": "⏪",
    "desc": "一旦说错话、选错分支或被抓，立即时光倒流一分钟，带着记忆重新抉择！",
    "trigger": "时空回溯"
  },
  {
    "id": 90,
    "name": "气运逆转 (天命改骰)",
    "category": "天道因果",
    "icon": "🌟",
    "desc": "每日可强行将自己的一次大挫败篡改为‘大成功’，或让对手关键检定必定大失败！",
    "trigger": "改天换命"
  },
  {
    "id": 91,
    "name": "难度减半 (绝处逢生)",
    "category": "天道因果",
    "icon": "📉",
    "desc": "在面临砍头、毒发等生死绝境时，所有破局检定 DC 难度直接强行减半！",
    "trigger": "绝境减半"
  },
  {
    "id": 92,
    "name": "伤害转嫁 (反噬因果)",
    "category": "天道因果",
    "icon": "🪞",
    "desc": "受到的皮肉杖刑或暗算，痛苦伤害全数悄然反弹转嫁到下令施暴的主使身上！",
    "trigger": "反伤惩戒"
  },
  {
    "id": 93,
    "name": "假戏真做 (谎言成真)",
    "category": "天道因果",
    "icon": "🎬",
    "desc": "一旦谎称自己是某位大人物的救命恩人或私生贵胄，天下巧合会自动填补证据使其成真！",
    "trigger": "大荒谬成真"
  },
  {
    "id": 94,
    "name": "逢凶化吉",
    "category": "天道因果",
    "icon": "🍀",
    "desc": "越是九死一生的逆境，事后反扑的收获越是丰厚十倍，因祸得福必定上位！",
    "trigger": "因祸得福"
  },
  {
    "id": 95,
    "name": "天道庇佑 (保命金牌)",
    "category": "天道因果",
    "icon": "🛡️",
    "desc": "遭遇必死杀局时，上天必定降下一道天雷、走水或急报打断行刑，强保不死！",
    "trigger": "天命免死"
  },
  {
    "id": 96,
    "name": "言出法随 (小许愿术)",
    "category": "天道因果",
    "icon": "🪄",
    "desc": "每日可许下一个合乎情理的小愿望（如‘来个公公叫走掌事姑姑’），必定灵验！",
    "trigger": "心想事成"
  },
  {
    "id": 97,
    "name": "万象通晓 (秒成宗师)",
    "category": "天道因果",
    "icon": "📚",
    "desc": "从未接触过的领域（古籍药方、异域番话、机密机关），看一眼直接秒入化境！",
    "trigger": "全知通晓"
  },
  {
    "id": 98,
    "name": "记忆篡改 (颠倒因果)",
    "category": "天道因果",
    "icon": "🧠",
    "desc": "在关键目标脑海里微调记忆，让其确信你昨晚一直在其身边从未出门。",
    "trigger": "不在场证明"
  },
  {
    "id": 99,
    "name": "主角光环压制",
    "category": "天道因果",
    "icon": "👑",
    "desc": "反派在你面前智商与气场自动衰减，容易急躁动怒自乱阵脚，暴露出致命把柄。",
    "trigger": "逼其破防"
  },
  {
    "id": 100,
    "name": "天命大圆满 (全维共鸣)",
    "category": "天道因果",
    "icon": "🌌",
    "desc": "前世宿慧觉醒，集全天道异数微光，所有智斗判定自带 +5 天道胜任碾压加值！",
    "trigger": "天道大圆满"
  }
];
window.DESTINY_TALENTS = DEFAULT_DESTINY_TALENTS;


// 核心沉浸式人名库 (男女分题材丰富人名库，彻底杜绝女叫男名与单调无味)
const IMMERSIVE_NAMES = {
  "女": {
    "古代宫闱": ["沈宛清", "苏玉漱", "陆微芷", "姜雪瑶", "赵语嫣", "温幼宜", "顾采薇", "叶绾绾", "崔令仪", "谢兰舟", "薛宝仪", "柳如烟", "江挽月", "云姝"],
    "江湖草莽": ["凌霜", "燕小满", "柳寄奴", "萧竹", "叶红鱼", "南宫玥", "唐雪见", "秦弄玉", "楚雁栖"],
    "现代都市": ["许知微", "林夏", "程晚", "宋以宁", "安然", "乔楚", "夏木青", "温凉", "简安", "裴轻语"],
    "末世废土": ["艾莉", "寒露", "零夏", "林鹿", "白鸦", "简星", "苏芒", "黎明之歌", "叶落"],
    "民国悬疑": ["白曼丽", "周若虚", "阮梦蝶", "孟青青", "沈织云", "徐佩安", "宋曼青"],
    "诡秘异闻": ["阿弱", "苏离", "阴秀儿", "纸月", "槐生", "沈轻墨", "幽兰"],
    "通用": ["清沅", "知许", "念慈", "望舒", "沐雪", "若华", "静姝", "语嫣", "采薇"]
  },
  "男": {
    "古代宫闱": ["沈策", "裴敬", "陆巡", "卫衡", "楚修", "萧景琰", "萧无咎", "霍云深", "谢渊", "顾长风"],
    "江湖草莽": ["江舟", "叶孤风", "厉沧海", "莫寻欢", "谢凌云", "冷青锋", "陆平川", "司马随风"],
    "现代都市": ["陆川", "陈默", "周衍", "顾淮", "宋闻璟", "程述", "纪廷", "林修齐"],
    "末世废土": ["铁砧", "灰隼", "雷诺", "柯林", "老九", "荒石", "破晓"],
    "民国悬疑": ["沈云鹤", "方克明", "陆少廷", "顾廷均", "程砚秋", "谢景行"],
    "诡秘异闻": ["陈瞎子", "陆玄机", "封不平", "阴九烛", "墨砚", "守夜人"],
    "通用": ["行者", "临渊", "承风", "守拙", "子昂", "秉德", "子瞻"]
  }
};

function getRandomImmersiveName(gender, world) {
  const g = (gender === "女") ? "女" : "男";
  const pool = IMMERSIVE_NAMES[g];
  let matchedKey = "通用";
  for (const k in pool) {
    if (world && world.includes(k)) {
      matchedKey = k;
      break;
    }
  }
  const list = (pool[matchedKey] && pool[matchedKey].length > 0) ? pool[matchedKey] : pool["通用"];
  return list[Math.floor(Math.random() * list.length)];
}


// =========================================================
// 8 大千世界 · 320+ 项专属男女全阶层高阶身份宝库
// =========================================================
const WORLD_IDENTITIES = {
  "古代宫闱 · 深宫弄权": {
    "女": [
      "母仪天下正宫皇后 (统摄六宫/凤仪天下)",
      "协理六宫掌印华妃 (将门出身/盛气凌人)",
      "独得圣眷的江南绝色宠妃 (才貌双绝/宠冠后宫)",
      "权倾内廷的监国长公主 (手握先帝密旨/辅佐幼帝)",
      "避世清修的掌权太妃 (深不可测/手握暗卫)",
      "尚宫局统管六局掌印大姑姑 (深谙宫中隐秘/宫人敬畏)",
      "司药司首席御医女官 (通晓奇毒妙方/救人杀人一念间)",
      "内廷织造坊首领女史 (织绣通神/耳目通达各宫)",
      "太后身旁近侍掌印尚仪 (深得老佛爷信赖/传旨重臣)",
      "将门世家待选入宫第一嫡女 (身负家族重望/弓马娴熟)",
      "当朝宰辅跋扈嫡长女 (贵不可言/目无余子)",
      "番邦入关和亲的倾国大公主 (异域秘法/图谋复国)",
      "冷宫绝境求生翻盘的废妃 (心机深沉/誓死复仇)",
      "御膳房天下第一点心御厨娘 (毒理精研/各宫争相拉拢)",
      "锦衣卫暗桩潜伏的女百户 (潜伏御前/探查谋逆)",
      "精通苗疆蛊术的后宫南疆贡女 (玩蛊通神/神秘莫测)",
      "司礼监大太监的义女 (内廷暗探首领/黑白通吃)",
      "东宫太子青梅竹马的正室太子妃 (贤良温顺/内藏机锋)",
      "太医院世家罪臣之女 (隐姓埋名/潜入深宫查冤案)",
      "掌管内廷库银的司库女官 (算无遗策/掌控各宫用度)"
    ],
    "男": [
      "少年天子 (九五之尊/隐忍待发谋夺实权)",
      "权倾朝野的九千岁摄政王 (手握天下重兵/废立由心)",
      "御前带刀锦衣卫指挥使 (掌管诏狱巡捕/生杀予夺)",
      "司礼监秉笔掌印大太监 (批红掌印/内廷巨擘)",
      "当朝连中三元的户部尚书 (财赋国之重器/心机深似海)",
      "兵临城下的抚远大将军 (手握三十万铁骑/功高震主)",
      "太医院之首院使神医 (医道圣手/探查帝王隐疾)",
      "韬光养晦的残疾皇子 (坐轮椅弄权/天下暗桩之主)",
      "御前第一带刀侍卫统领 (武功冠绝京华/贴身护卫)",
      "大理寺少卿 (断案如神/铁面无私纠察百官)",
      "东宫皇太子 (结交天下豪杰/防备父皇猜忌)",
      "内廷司天监正钦天监 (洞察天象星宿/言动天下大乱)",
      "西厂提督秘密特使 (阴鸷狠绝/专门清剿异己)",
      "天下第一商贾皇商大东家 (采买内廷/富可敌国)",
      "番邦入质的异域皇子 (质子潜伏/伺机而动)",
      "冷宫长大的落魄皇子 (隐忍十年/暗中收买死士)",
      "羽林禁卫军前锋营骁骑统领 (甲胄在身/宿卫宫禁)",
      "翰林院侍读兼帝师之子 (文坛领袖/清流魁首)",
      "御用监匠造大师 (精研奇门机关暗道/通晓皇城死穴)",
      "天牢死囚营特赦刺客总教头 (以身涉险/专办脏活)"
    ]
  },
  "江湖草莽 · 市井奇谋": {
    "女": [
      "龙门客栈八面玲珑女老板娘 (黑白通吃/风情万种下毒如麻)",
      "塞外万毒魔教当代圣姑 (号令塞外群魔/冷艳孤傲)",
      "天下第一镖局红衣少总镖头 (一柄柳叶刀/走遍十三省无阻)",
      "江南三千连环坞漕运总舵主 (执掌万里水路/千帆顺逆由我)",
      "药王谷闭门不世出的小医仙 (活死人肉白骨/亦正亦邪)",
      "六扇门第一追风夺命女神捕 (七窍玲珑心/天下巨盗克星)",
      "天下第一杀手楼‘暗月’王牌女刺客 (出鞘见血/从无失手)",
      "江南第一销金窟画舫大当家 (掌管天下秘闻/幕后红颜)",
      "易容千面妙手空空的女盗圣 (盗亦有道/偷龙转凤神乎其神)",
      "蜀中唐门掌毒少主 (千机暗器毒绝天下/娇蛮凌厉)",
      "峨眉派首席掌门大弟子 (清冷高洁/剑法通灵)",
      "算尽天机铁口直断的江湖盲女相士 (神算无漏/知晓各派命脉)",
      "塞外马贼‘血罗刹’大首领 (纵马狂沙/劫富济贫)",
      "天下第一神兵铸剑坊女庄主 (精通百兵机关/手握斩天神剑)",
      "百花门幻术宗师 (一舞迷众生/幻境杀敌于无形)",
      "丐帮传功女长老 (打狗棒法炉火纯青/义薄云天)",
      "朝廷钦犯遗孤 (隐姓埋名酒肆/一剑霜寒十四州)",
      "江湖顶级当铺大朝奉 (眼毒心明/过手奇珍不计其数)",
      "销魂窟赌坊幕后美艳大当家 (千术登峰造极/逢赌必胜)",
      "天下第一快剑客传人 (一剑既出绝不回鞘/冷血如霜)"
    ],
    "男": [
      "天下第一庄大东家 (财力通神/网罗四海宗师)",
      "正道武林盟主 (德高望重/号令天下群雄)",
      "魔教教主 (唯我独尊/武功臻至化境)",
      "天下第一快剑浪子 (一人一剑一壶酒/快如雷霆)",
      "丐帮执掌打狗棒的九袋长老 (帮众十万/消息最灵通)",
      "藏剑山庄少庄主 (剑意通神/名动九州)",
      "六扇门金牌总捕头 (铁腕缉凶/令江湖闻风丧胆)",
      "镇远镖局总镖头 (铁塔横空/横练金钟罩无敌)",
      "神偷门当代门主盗圣 (出入皇宫如探囊取物)",
      "通吃黑白两道的黑市大当家 (只要出得起价/万物皆可买)",
      "塞外嗜酒如命的霸刀狂客 (一刀断浪/豪迈不羁)",
      "少林还俗金刚罗汉 (内力雄浑/万邪不侵)",
      "药王谷当代首座 (药毒双绝/天下豪杰皆欠我命)",
      "杀手楼楼主幽冥鬼手 (行走阴影之间/帝王亦可刺)",
      "漕运水寨总把头 (掌管天下粮道/麾下猛汉如云)",
      "逍遥派入世传人 (琴棋书画武道全通/风流倜傥)",
      "天下第一赌庄幕后庄主 (赌尽天下命数/玩弄人心)",
      "落魄王侯流落江湖的剑客 (身怀前朝密宝/剑法通天)",
      "锦衣卫潜伏江湖的暗桩指挥 (代天巡狩/布下惊天杀局)",
      "隐世刀宗闭门关门弟子 (出山即无敌/寻觅至强一战)"
    ]
  },
  "现代都市 · 职场商战": {
    "女": [
      "千亿跨国集团冷艳女总裁 (雷厉风行/执掌资本生杀大权)",
      "顶级红圈律所高级创始合伙人 (胜率百分百/言辞如利刃)",
      "顶级私立医院第一天才外科圣手 (手术刀下夺命/背景深不可测)",
      "掌控全网舆论的危机公关女王 (翻云覆雨/一夜平息滔天风浪)",
      "顶级跨国投行明星操盘手 (百亿资金调动自如/击溃做空鳄鱼)",
      "顶级家族财阀第一顺位女继承人 (名门千金/深藏商业机锋)",
      "特聘跨国商业间谍总调查员 (伪装入职/专挖对手命门死穴)",
      "国际拍卖行首席鉴宝鉴定师 (金睛火眼/断定十亿奇珍)",
      "顶级猎头集团创始人 (手握各行核心大佬秘密人脉网)",
      "黑白两道通吃的高端会所女老板 (八面玲珑/听遍内幕消息)"
    ],
    "男": [
      "资本界呼风唤雨幕后大鳄 (翻手为云覆手为雨/玩弄资本)",
      "顶级家族财阀第一继承人 (商战无敌/狠辣果决)",
      "垄断级医药科技集团创始人 (身价千亿/权贵保驾护航)",
      "顶级地下国际安保集团总顾问 (特种兵王/战力天花板)",
      "顶级投行并购狂人 (吃人不吐骨头/吞并数十家巨头)",
      "刑辩界不败神话大律师 (洞悉人性与法理/翻盘无解死局)"
    ]
  },
  "末世废土 · 秩序崩塌": {
    "女": [
      "地下方舟庇护城铁血女执政官 (掌控全城水源能源/手握重兵)",
      "废土最大中立黑市贸易大领主 (军火粮食充沛/无人敢造次)",
      "变异基因生物首席科研所长 (研制万能净化抗体/各大军阀争夺)",
      "王牌机甲荒野女猎杀队长 (单兵斩杀三级变异兽/威震废土)",
      "末世反抗军‘黎明’女统领 (身手矫健/誓死打破旧财阀垄断)"
    ],
    "男": [
      "废土最强雇佣军军阀总司令 (钢铁洪流铁甲战团/称霸一方)",
      "地下核动力掩体城最高指挥官 (严密秩序铁血统御/手握核弹开关)",
      "顶级军火武器改装狂人大师 (手搓电磁炮等离子刃/军火抢手)",
      "荒野独行终极猎头行者 (赏金百万/从无失手)"
    ]
  },
  "民国悬疑 · 谍海迷雾": {
    "女": [
      "百乐门风华绝代幕后女老板 (风情万种黑白通吃/听遍各派密谋)",
      "伪装成名媛贵妇的双面红色女间谍 (步步惊心/暗送无价军情)",
      "督军军政公馆少帅机要女秘书 (冰雪聪明/掌控全部机要密电)",
      "法租界巡捕房首席女法医 (解剖死因/让尸骨当堂吐露真凶)",
      "青帮地下龙头坐馆太爷义女 (手握堂口三千门徒/杀伐果断)"
    ],
    "男": [
      "军统/中统王牌特工行动组长 (代号幽灵/枪法如神冷血无情)",
      "上海滩法租界巡捕房总督察长 (手眼通天/巡捕巡捕皆听命)",
      "青帮地下三大亨之首龙头 (一言断人生死/租界官商皆敬畏)",
      "铁血独立旅少帅旅长 (戎马少帅/兵强马壮敢跟强敌硬碰硬)"
    ]
  },
  "诡秘异闻 · 中式微恐": {
    "女": [
      "苗疆本命蛊当代女巫仙 (千虫共主/驭蛊杀敌防不胜防)",
      "出马仙胡黄柳白灰通灵大当家 (通晓阴阳因果/驱邪断煞无双)",
      "龙虎山天师府下山历练天师小师妹 (金光神咒护体/五雷正法荡妖)",
      "黄泉扎纸点睛还魂女掌柜 (扎纸人如活生人/通晓地府秘闻)",
      "百年古老凶宅第十三代守夜女主人 (幽魂退避/手握祖传封印)"
    ],
    "男": [
      "茅山正宗当代执牛耳掌教 (一剑诛邪/九字真言荡平妖氛)",
      "黄泉阴阳两界通吃鬼市之主 (生人死魂皆做买卖/阎罗亦礼让)",
      "朝廷镇邪司百户斩妖校尉 (佩带破邪绣春刀/专斩凶孽)",
      "湘西赶尸门掌门大宗师 (铜锣一响群尸听令/赶尸千里避祸)"
    ]
  },
  "大学校园 · 青春解谜": {
    "女": [
      "名校最高名誉理事长千金 (掌控全校资源与人脉/深藏名门手腕)",
      "国家重点科研所领衔特聘女教授 (年轻天才/手握重大科研底密)",
      "校学生会最高执行常务主席 (八面玲珑/组织统筹全校风云)",
      "国家级重点实验室带组学姐 (逻辑严密/勘破校园离奇悬案)"
    ],
    "男": [
      "全校顶级辩论队金牌主力 (言辞机锋如刀/心理战无懈可击)",
      "计算机科学系黑客技术狂人 (攻破一切安全防火墙/数据侦探)",
      "神秘隐世家族送进名校历练的继承人 (低调内敛/财力通天)"
    ]
  },
  "科幻星际 · 赛博底层": {
    "女": [
      "掌控全城深层算力的垄断财阀女 CEO (意识上传云端/俯瞰众生)",
      "轨道深空战列巡洋星舰女舰长 (统领万名舰员/舰炮毁天灭地)",
      "赛博地下义体黑市主理人 (过手最尖端违禁义体/黑客尊崇)",
      "仿生人解放反抗军领袖 (统领数万义军/瓦解机械霸权)"
    ],
    "男": [
      "赛博世界第一传奇网络行者 (Netrunner/意识漫游数据深海)",
      "轨道舰队总司令官 (掌管行星防御系统/军令如山)",
      "顶级地下人体义体改装宗师 (重构肉身潜能/创造半神战体)"
    ]
  }
};

function getRandomIdentity(gender, world) {
  const g = (gender === "男") ? "男" : "女";
  const w = WORLD_IDENTITIES[world] || WORLD_IDENTITIES["古代宫闱 · 深宫弄权"];
  const list = w[g] || w["女"];
  if (!list || list.length === 0) return "母仪天下正宫皇后";
  return list[Math.floor(Math.random() * list.length)];
}

function initCharacterWizard() {
  const wizardModal = document.getElementById("modal-wizard");
  const btnOpen = document.getElementById("btn-open-wizard");
  const btnClose = document.getElementById("btn-close-wizard");
  const btnFinish = document.getElementById("btn-wizard-finish");
  const btnRollScores = document.getElementById("btn-roll-4d6k3");
  const btnRerollTalent = document.getElementById("btn-reroll-talent");
  const selectTalent = document.getElementById("select-destiny-talent");
  const genderBtns = document.querySelectorAll("#gender-pill-group .gender-pill-btn");
  const nameInput = document.getElementById("wizard-char-name");
  const btnRollName = document.getElementById("btn-roll-name");
  const identityInput = document.getElementById("wizard-char-identity");
  const btnRollIdentity = document.getElementById("btn-roll-identity");

  if (!wizardModal) return;

  // 默认选中的大千世界、性别与当前抽中的天命神技
  let selectedWorld = "古代宫闱 · 深宫弄权";
  let selectedGender = "女"; // 默认女号，契合宫闱大观
  let currentTalent = (window.DESTINY_TALENTS && window.DESTINY_TALENTS.length > 0)
    ? window.DESTINY_TALENTS[34] // 默认第35个：百毒不侵
    : { id: 35, name: "百毒不侵", category: "肉身神异", icon: "🧪", desc: "吞服砒霜、断肠草等世间剧毒皆如甘露，不仅无恙，更能从指甲逼出毒液反噬他人。", trigger: "强韧/嚼毒反噬" };

  // 1. 性别切换管理与人名自适应
  function updateGenderUI(gender) {
    selectedGender = gender;
    if (genderBtns && genderBtns.length > 0) {
      genderBtns.forEach(btn => {
        const g = btn.dataset.gender;
        if (g === gender) {
          btn.classList.add("active", "btn-gold");
          btn.classList.remove("btn-silver");
          btn.style.fontWeight = "bold";
          btn.style.color = "#1a202c";
        } else {
          btn.classList.remove("active", "btn-gold");
          btn.classList.add("btn-silver");
          btn.style.fontWeight = "normal";
          btn.style.color = (g === "随缘") ? "#a0aec0" : "#cbd5e0";
        }
      });
    }

    // 切换性别时，若当前名字与新性别明显冲突或为默认值，自动重摇一个契合新性别的美名
    const actualG = (gender === "随缘") ? (Math.random() > 0.5 ? "女" : "男") : gender;
    if (nameInput) {
      nameInput.value = getRandomImmersiveName(actualG, selectedWorld);
    }
    if (identityInput) {
      identityInput.value = getRandomIdentity(actualG, selectedWorld);
    }
  }

  if (genderBtns && genderBtns.length > 0) {
    genderBtns.forEach(btn => {
      btn.onclick = () => {
        updateGenderUI(btn.dataset.gender || "女");
        audio.playAlert();
      };
    });
  }

  // 2. 随心赐名按钮
    // 随心摇身份按钮绑定
  function rollRandomIdentity() {
    audio.playDiceRoll();
    const g = (selectedGender === "随缘") ? (Math.random() > 0.5 ? "女" : "男") : selectedGender;
    if (identityInput) {
      identityInput.value = getRandomIdentity(g, selectedWorld);
      identityInput.style.transform = "scale(1.03)";
      identityInput.style.borderColor = "#f6d365";
      setTimeout(() => { if (identityInput) identityInput.style.transform = "scale(1)"; }, 180);
    }
  }
  if (btnRollIdentity) {
    btnRollIdentity.onclick = rollRandomIdentity;
  }

  if (btnRollName && nameInput) {
    btnRollName.onclick = () => {
      audio.playDiceRoll();
      const g = (selectedGender === "随缘") ? (Math.random() > 0.5 ? "女" : "男") : selectedGender;
      nameInput.value = getRandomImmersiveName(g, selectedWorld);
        if (identityInput) identityInput.value = getRandomIdentity(g, selectedWorld);
      nameInput.style.transform = "scale(1.05)";
      nameInput.style.borderColor = "#f6d365";
      setTimeout(() => { if (nameInput) nameInput.style.transform = "scale(1)"; }, 180);
    };
  }

  // 3. 装填 100 种天命神技自选下拉列表（首项提供“随缘盲盒”）
  function populateTalentSelect() {
    if (!selectTalent || !window.DESTINY_TALENTS || window.DESTINY_TALENTS.length === 0) return;
    if (selectTalent.children.length > 0) return; // 已装填则不重复装填

    const groups = {};
    window.DESTINY_TALENTS.forEach(t => {
      const cat = t.category || "神异流派";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    });

    let html = `<option value="random">🎲 随缘盲盒 · 天道随机摇号</option>`;
    for (const cat in groups) {
      html += `<optgroup label="── 【${cat}】 ──">`;
      groups[cat].forEach(t => {
        html += `<option value="${t.id}">${t.icon || '✨'} #${t.id} ${t.name}</option>`;
      });
      html += `</optgroup>`;
    }
    selectTalent.innerHTML = html;
  }

  // 立即预热装填一次
  populateTalentSelect();

  // 更新神技展示卡片并同步下拉选单
  function updateTalentCard(talent) {
    if (!talent) return;
    currentTalent = talent;
    const iconEl = document.getElementById("wizard-talent-icon");
    const nameEl = document.getElementById("wizard-talent-name");
    const catEl = document.getElementById("wizard-talent-cat");
    const descEl = document.getElementById("wizard-talent-desc");
    const trigEl = document.getElementById("wizard-talent-trigger");
    const cardEl = document.getElementById("talent-card-display");

    if (iconEl) iconEl.textContent = talent.icon || "✨";
    if (nameEl) nameEl.textContent = `天命神技 · ${talent.name}`;
    if (catEl) catEl.textContent = `${talent.category}流派 · 编号 #${talent.id}`;
    if (descEl) descEl.textContent = talent.desc || "";
    if (trigEl) trigEl.textContent = `🎯 专属判定：${talent.trigger || '神技碾压'} (+8 碾压)`;

    if (selectTalent && selectTalent.value != talent.id) {
      selectTalent.value = talent.id;
    }

    if (cardEl) {
      cardEl.style.transform = "scale(1.03)";
      cardEl.style.borderColor = "#f6d365";
      setTimeout(() => { if (cardEl) cardEl.style.transform = "scale(1)"; }, 200);
    }
  }

  // 下拉选框变更联动（支持选随机盲盒，也支持具体指定）
  if (selectTalent) {
    selectTalent.onchange = () => {
      if (selectTalent.value === "random") {
        rollRandomTalent();
        return;
      }
      const tid = parseInt(selectTalent.value, 10);
      const found = window.DESTINY_TALENTS && window.DESTINY_TALENTS.find(t => t.id === tid);
      if (found) {
        updateTalentCard(found);
        audio.playAlert();
      }
    };
  }

  // 随机抽取天命神技（严格去重循环，确保每次点击必定变幻一个全新神技，绝无静默失效）
  function rollRandomTalent() {
    audio.playDiceRoll();
    const list = (window.DESTINY_TALENTS && window.DESTINY_TALENTS.length > 0)
      ? window.DESTINY_TALENTS
      : DEFAULT_DESTINY_TALENTS;
    if (list && list.length > 0) {
      let nextTalent = currentTalent;
      if (list.length > 1) {
        let attempts = 0;
        while ((!nextTalent || nextTalent.id === currentTalent?.id) && attempts < 30) {
          const idx = Math.floor(Math.random() * list.length);
          nextTalent = list[idx];
          attempts++;
        }
      } else {
        nextTalent = list[0];
      }
      updateTalentCard(nextTalent);
      if (selectTalent) selectTalent.value = nextTalent.id;
    }
  }

  // 摇取 6 组纯净点数
  function rollScores() {
    audio.playDiceRoll();
    const scores = [];
    for (let i = 0; i < 6; i++) {
      const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      scores.push(rolls[0] + rolls[1] + rolls[2]);
    }
    scores.sort((a, b) => b - a);
    state.wizard.rolledScores = scores;

    const chipsBox = document.getElementById("dice-pool-chips");
    if (chipsBox) {
      chipsBox.innerHTML = scores.map(score => `
        <span class="dice-chip" style="background:#2d3748; padding:4px 12px; border-radius:6px; font-weight:bold; color:#f6d365; border:1px solid rgba(212,175,55,0.4);">
          ${score}
        </span>
      `).join("");
    }
  }

  if (btnOpen) {
    btnOpen.onclick = () => {
      wizardModal.classList.remove("hidden");
      populateTalentSelect();
      updateGenderUI(selectedGender);
      rollScores();
      rollRandomTalent();
      if (identityInput) {
        const g = (selectedGender === "随缘") ? (Math.random() > 0.5 ? "女" : "男") : selectedGender;
        identityInput.value = getRandomIdentity(g, selectedWorld);
      }
    };
  }
  if (btnClose) btnClose.onclick = () => wizardModal.classList.add("hidden");

  // 绑定 8 个大千世界卡片点击
  document.querySelectorAll(".world-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".world-card").forEach(c => {
        c.classList.remove("active");
        c.style.borderColor = "rgba(255,255,255,0.1)";
        const titleEl = c.querySelector("div:nth-child(2)");
        if (titleEl) titleEl.style.color = "#cbd5e0";
      });
      card.classList.add("active");
      card.style.borderColor = "#f6d365";
      const titleEl = card.querySelector("div:nth-child(2)");
      if (titleEl) titleEl.style.color = "#f6d365";

      selectedWorld = card.dataset.world || "古代宫闱 · 深宫弄权";
      const badge = document.getElementById("selected-theme-badge");
      if (badge) badge.textContent = selectedWorld;

      // 古代宫闱默认推荐女身入局
      if (selectedWorld.includes("古代宫闱") && selectedGender !== "男") {
        updateGenderUI("女");
      } else if (nameInput) {
        // 题材切换时，推荐一个贴合该题材的美名
        const g = (selectedGender === "随缘") ? (Math.random() > 0.5 ? "女" : "男") : selectedGender;
        nameInput.value = getRandomImmersiveName(g, selectedWorld);
      }
      audio.playAlert();
    };
  });

  // 绑定摇骰与重抽神技 (双保险挂载)
  if (btnRollScores) btnRollScores.onclick = rollScores;
  if (btnRerollTalent) {
    btnRerollTalent.onclick = rollRandomTalent;
    btnRerollTalent.addEventListener("click", rollRandomTalent);
  }


  // 绑定【🌌 睁眼入世 · 踏入大千】
  if (btnFinish) {
    btnFinish.onclick = () => {
      wizardModal.classList.add("hidden");
      audio.playNat20();

      // 1. 确定最终角色性别、真实尊讳与外貌底模
      let finalGender = selectedGender;
      if (finalGender === "随缘") {
        finalGender = (Math.random() > 0.5) ? "女" : "男";
      }

      // 获取命讳（若为空则自动补填一个好听名字）
      let chosenName = (nameInput && nameInput.value.trim())
        ? nameInput.value.trim()
        : getRandomImmersiveName(finalGender, selectedWorld);

      state.character.profile.name = chosenName;
      state.character.profile.gender = finalGender;
      state.wizard.name = chosenName;
      state.wizard.gender = finalGender;

      if (finalGender === "女") {
        state.character.profile.looks = "墨发如瀑，眼眸明澈清亮，身形纤巧素雅，虽处泥淖亦难掩周身清华风骨";
      } else {
        state.character.profile.looks = "发髻整肃，神采沉静从容，面容坚毅端方，身着寻常布衣亦自有一番沉静定力";
      }

      // 2. 确定六维分配（按点数从高到低自动赋给角色）
      const scores = state.wizard.rolledScores || [16, 14, 13, 12, 10, 8];
      state.theme = selectedWorld;
      state.character.talent = currentTalent;
      state.character.abilities = {
        STR: scores[3] || 12,
        DEX: scores[0] || 16,
        CON: scores[2] || 13,
        INT: scores[1] || 14,
        WIS: scores[4] || 10,
        CHA: scores[5] || 8
      };

      // 3. 刷新顶栏题材
      const subTitleElem = document.getElementById("campaign-theme-subtitle");
      if (subTitleElem) subTitleElem.textContent = `${selectedWorld} · 纯文字独立引擎`;

      // 4. 刷新命盘抽屉（展现天命神技卡片、真实姓名与性别）
      renderTacticalPanel();

      // 5. 清空流并直接触发破幕开局
      const stream = document.getElementById("narrative-stream");
      if (stream) stream.innerHTML = "";

      // 读取身份 (如贵妃娘娘、客栈老板娘、武林盟主、女总裁等)
      let chosenIdentity = (identityInput && identityInput.value.trim())
        ? identityInput.value.trim()
        : getRandomIdentity(finalGender, selectedWorld);
      state.character.profile.identity = chosenIdentity;
      state.character.profile.background = chosenIdentity;

      // 入局故事：纯小说电影感破幕，完美结合尊崇身份与天命神技
      const startPrompt = `破幕开局。我是【${chosenName}】（${finalGender}性），当下的真实显赫/掌权身份是【${chosenIdentity}】。此刻刚刚在【${selectedWorld}】的风云变幻或惊险危机中睁开双眼！
请司命立即展开至少 500 字的生动第一幕小说正文：
- 【绝对禁令】：严禁输出任何类似“【天命降临】”、“时代世界：”、“角色性别：”、“身份：”等标题、冒号标签或公文列表！
- 第一个字必须直接切入电影镜头般的现场小说描写：刺骨真实的声色细节、周围侍从/敌手/下属对我的态度与神情、契合我【${chosenIdentity}】尊贵或险要地位的紧迫突发局势；
- 紧扣我的真实尊名【${chosenName}】与尊崇身份【${chosenIdentity}】展开，绝不可强行贬为小厮宫女杂役！若我是娘娘则展现凤仪威仪与后宫杀机，若我是客栈老板娘则展现风情万种与江湖对峙，若我是掌权者则展现上位者决断；
- 天命神技【${currentTalent.name}】（${currentTalent.desc}）作为我暗藏在袖中的绝密翻盘底牌，神技与故事自然交融，不影响世界原汁原味的沉浸感；
- 在小说正文最末尾附带 3 个横排智斗谋策胶囊，供我决断出招。`;

      appendNarrativeEntry("user", `【破幕入局】：${chosenName} (${finalGender}) 睁开双眼，降临于【${selectedWorld}】。`);
      sendPlayerAction(startPrompt);
    };
  }
}


function showWizardStep(step) {
  state.wizard.currentStep = step;

  // 更新步骤圆点
  document.querySelectorAll(".step-dot").forEach(dot => {
    const s = parseInt(dot.getAttribute("data-step"), 10);
    dot.classList.toggle("active", s === step);
  });

  // 更新页面显隐
  for (let i = 1; i <= 5; i++) {
    const page = document.getElementById(`wizard-step-${i}`);
    if (page) page.classList.toggle("active", i === step);
  }

  // 更新底部按钮状态
  const btnPrev = document.getElementById("btn-wizard-prev");
  const btnNext = document.getElementById("btn-wizard-next");
  const btnFinish = document.getElementById("btn-wizard-finish");

  btnPrev.disabled = (step === 1);
  if (step === 5) {
    btnNext.classList.add("hidden");
    btnFinish.classList.remove("hidden");
    renderWizardFinalPreview();
  } else {
    btnNext.classList.remove("hidden");
    btnFinish.classList.add("hidden");
  }

  if (step === 3) {
    renderSubclassSelector();
  } else if (step === 4) {
    renderFeatSelector();
    renderSkillAllocator();
  }
}

// 核心门派点数池契合推荐规则表
// 核心门派点数池契合推荐规则表 (覆盖全部主流流派)
const CLASS_RECOMMEND_RULES = [
  {
    name: "法师",
    tier: "S级 · 奥术博学",
    primaryAttr: "INT",
    priority: ["INT", "DEX", "CON", "WIS", "CHA", "STR"],
    reason: "高智力决定法术环阶与豁免难度，奥术博学执掌天地造化，智者策士与学者之首选！"
  },
  {
    name: "术士",
    tier: "S级 · 血脉觉醒",
    primaryAttr: "CHA",
    priority: ["CHA", "DEX", "CON", "WIS", "INT", "STR"],
    reason: "高魅力主导超凡血脉，无需晨间背诵备法，心念所动即可自发施法，风华绝代！"
  },
  {
    name: "游荡者",
    tier: "S级 · 暗影巧手",
    primaryAttr: "DEX",
    priority: ["DEX", "INT", "CON", "WIS", "CHA", "STR"],
    reason: "高敏捷决定先攻与闪避，偷袭暗算刀刀致命，海量技能点解机关、刺探情报无所不能！"
  },
  {
    name: "战士",
    tier: "S级 · 铁壁挥斩",
    primaryAttr: "STR",
    priority: ["STR", "CON", "DEX", "WIS", "INT", "CHA"],
    reason: "高力量带来刀刀见血的近战挥斩，高体质筑牢气血壁垒，精通百般神兵甲胄！"
  },
  {
    name: "野蛮人",
    tier: "S级 · 狂暴巨力",
    primaryAttr: "STR",
    priority: ["STR", "CON", "DEX", "WIS", "CHA", "INT"],
    reason: "全游最高 d12 生命骰，狂暴战力全开，肉搏反击刚猛绝伦，单人面对群敌极具威慑！"
  },
  {
    name: "牧师",
    tier: "A+级 · 神圣牧者",
    primaryAttr: "WIS",
    priority: ["WIS", "CON", "CHA", "STR", "DEX", "INT"],
    reason: "高感知决定神术环阶，引导神力群体治疗与破魔，身披重铠亦可施法，单人探险极稳健！"
  },
  {
    name: "游侠",
    tier: "A+级 · 荒野狙杀",
    primaryAttr: "DEX",
    priority: ["DEX", "STR", "CON", "WIS", "INT", "CHA"],
    reason: "高敏远距长弓狙杀避开肉搏反伤，荒野追踪与先攻优秀，兼通战斗机动与自保。"
  },
  {
    name: "圣武士",
    tier: "A+级 · 神圣独行",
    primaryAttr: "STR",
    priority: ["STR", "CHA", "CON", "WIS", "DEX", "INT"],
    reason: "力量近战杀伐与魅力全豁免神恩护体，独行能抗能打能圣疗自保，破邪斩克制邪魔！"
  },
  {
    name: "武僧",
    tier: "A级 · 拳法通神",
    primaryAttr: "WIS",
    priority: ["WIS", "DEX", "STR", "CON", "INT", "CHA"],
    reason: "感知与敏捷双重叠加 AC 防御，肉身如钢铁，拳脚连击疾如骤雨！"
  },
  {
    name: "吟游诗人",
    tier: "A级 · 风雅万象",
    primaryAttr: "CHA",
    priority: ["CHA", "DEX", "INT", "CON", "WIS", "STR"],
    reason: "魅力主导诗篇旋律与交涉，技能广泛万象精通，周旋于各大势力与红尘俗世游刃有余。"
  }
];

function renderClassRecommendations(scores, activePresetKey = null) {
  const panel = document.getElementById("class-recommend-panel");
  const container = document.getElementById("recommend-cards-container");
  if (!panel || !container || !scores || scores.length < 6) return;

  panel.classList.remove("hidden");
  container.innerHTML = "";

  const currentAbilities = state.wizard.assignedAbilities || {};
  const sortedScores = [...scores].sort((a, b) => b - a);

  // 动态加权计算：根据当前六维高低与选定志向匹配职业
  const scoredClasses = CLASS_RECOMMEND_RULES.map(cls => {
    const pri0 = currentAbilities[cls.priority[0]] || 10;
    const pri1 = currentAbilities[cls.priority[1]] || 10;
    const pri2 = currentAbilities[cls.priority[2]] || 10;

    let fitScore = pri0 * 5 + pri1 * 3 + pri2 * 1.5;

    // 志向加权倾斜
    if (activePresetKey) {
      if (activePresetKey === "scholar" && cls.name === "法师") fitScore += 120;
      else if (activePresetKey === "noble" && (cls.name === "术士" || cls.name === "吟游诗人")) fitScore += 120;
      else if (activePresetKey === "artisan" && cls.name === "游荡者") fitScore += 120;
      else if (activePresetKey === "warrior" && (cls.name === "战士" || cls.name === "野蛮人")) fitScore += 120;
      else if (activePresetKey === "balanced" && (cls.name === "游侠" || cls.name === "战士")) fitScore += 90;
    }

    return { cls, fitScore };
  });

  // 按综合匹配得分降序排序，取前 3 名
  scoredClasses.sort((a, b) => b.fitScore - a.fitScore);
  const topClasses = scoredClasses.slice(0, 3).map(item => item.cls);

  topClasses.forEach((cls, rankIdx) => {
    const card = document.createElement("div");
    card.className = `recommend-card ${rankIdx === 0 ? 'top-recommend' : ''}`;

    const plan = {};
    cls.priority.forEach((attr, idx) => {
      plan[attr] = sortedScores[idx];
    });

    const isTop = (rankIdx === 0);
    const crownBadge = isTop ? `<span style="background:linear-gradient(135deg, #d4af37, #f6d365); color:#111; font-weight:bold; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:6px;">👑 志向/命格首选</span>` : "";

    card.innerHTML = `
      <div class="rec-card-top">
        <span class="rec-class-name">门派推荐：${cls.name} ${crownBadge}</span>
        <span class="rec-badge">${cls.tier}</span>
      </div>
      <div class="rec-reason">${cls.reason}</div>
      <div class="rec-stats-preview">
        <strong>契合规划：</strong>力量 ${plan.STR} / 敏捷 ${plan.DEX} / 体质 ${plan.CON} / 智力 ${plan.INT} / 感知 ${plan.WIS} / 魅力 ${plan.CHA}
      </div>
      <button class="btn btn-gold btn-apply-rec" data-class="${cls.name}">★ 采纳【${cls.name}】并一键归位</button>
    `;

    card.querySelector(".btn-apply-rec").onclick = () => {
      state.wizard.assignedAbilities = { ...plan };
      state.wizard.selectedClass = cls.name;

      Object.keys(plan).forEach(attrCode => {
        const sel = document.querySelector(`.slot-select[data-attr="${attrCode}"]`);
        if (sel) sel.value = plan[attrCode];
        const valElem = document.getElementById(`slot-val-${attrCode}`);
        if (valElem) valElem.textContent = plan[attrCode];
      });

      renderClassCards();
      audio.playAlert();
      alert(`已成功采纳【${cls.name}】最优属性规划！六维点数已一键归位，门派已自动选定为【${cls.name}】。点击【下一步】即可继续定制血脉与绝活！`);
    };

    container.appendChild(card);
  });
}

// =========================================================
// 全题材/流派一键志向配点预设 (彻底破除力量最高偏见)
// =========================================================

const ARCHETYPE_PRESETS = {
  scholar: {
    name: "文曲博学",
    targetClass: "法师",
    desc: "智力第一，体质第二，敏捷第三 (适合高考考清华、学者博士、军师策士、科学发明家)",
    priority: ["INT", "CON", "DEX", "WIS", "CHA", "STR"]
  },
  noble: {
    name: "倾城名流",
    targetClass: "术士",
    desc: "魅力第一，感知第二，敏捷第三 (适合后宫宠妃争宠、商界老板、名流社交、谈单融资)",
    priority: ["CHA", "WIS", "DEX", "CON", "INT", "STR"]
  },
  artisan: {
    name: "巧手神匠",
    targetClass: "游荡者",
    desc: "敏捷第一，感知第二，体质第三 (适合金牌神厨颠勺、潜伏暗哨、市井手工艺人)",
    priority: ["DEX", "WIS", "CON", "STR", "INT", "CHA"]
  },
  warrior: {
    name: "沙场骁勇",
    targetClass: "战士",
    desc: "力量第一，体质第二，敏捷第三 (适合古代战将、近战肉搏硬汉、贴身护卫保镖)",
    priority: ["STR", "CON", "DEX", "WIS", "CHA", "INT"]
  },
  balanced: {
    name: "凡人百态",
    targetClass: "游侠",
    desc: "体质第一，敏捷第二，力量第三 (普通人的一生，均衡无短板)",
    priority: ["CON", "DEX", "STR", "INT", "WIS", "CHA"]
  }
};

function applyArchetypePreset(presetKey) {
  const preset = ARCHETYPE_PRESETS[presetKey];
  if (!preset || !state.wizard.rolledScores || state.wizard.rolledScores.length < 6) return;

  const sorted = [...state.wizard.rolledScores].sort((a, b) => b - a);
  const plan = {};
  preset.priority.forEach((attr, idx) => {
    plan[attr] = sorted[idx];
  });

  state.wizard.assignedAbilities = { ...plan };

  // 关键联动：根据志向一键选定并高亮门派职业！
  if (preset.targetClass) {
    state.wizard.selectedClass = preset.targetClass;
    renderClassCards();
  }

  // 更新所有槽位 UI
  Object.keys(plan).forEach(attrCode => {
    const sel = document.querySelector(`.slot-select[data-attr="${attrCode}"]`);
    if (sel) sel.value = plan[attrCode];
    const valElem = document.getElementById(`slot-val-${attrCode}`);
    if (valElem) valElem.textContent = plan[attrCode];
  });

  // 更新预设按钮高亮状态
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-preset") === presetKey);
  });

  // 关键联动：依据所选志向实时动态重排并刷新下方的职业推荐卡片！
  renderClassRecommendations(state.wizard.rolledScores, presetKey);

  audio.playAlert();
}

function initArchetypePresets() {
  const panel = document.getElementById("archetype-presets-panel");
  if (!panel) return;
  panel.classList.remove("hidden");

  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.onclick = () => {
      const presetKey = btn.getAttribute("data-preset");
      applyArchetypePreset(presetKey);
    };
  });
}

function renderAbilityAssignmentGrid() {
  const container = document.getElementById("ability-assignment-grid");
  container.innerHTML = "";
  const attrs = [
    { code: "STR", name: "力量 (伤害/负重)" },
    { code: "DEX", name: "敏捷 (命中/闪避)" },
    { code: "CON", name: "体质 (气血/强韧)" },
    { code: "INT", name: "智力 (技能/学识/法术)" },
    { code: "WIS", name: "感知 (察觉/意志/洞察)" },
    { code: "CHA", name: "魅力 (交涉/气魄/风度)" }
  ];

  attrs.forEach((attr, idx) => {
    const slot = document.createElement("div");
    slot.className = "assign-slot";
    const currentVal = state.wizard.assignedAbilities[attr.code] || state.wizard.rolledScores[idx] || 10;
    state.wizard.assignedAbilities[attr.code] = currentVal;

    slot.innerHTML = `
      <div class="slot-title">
        <span>${attr.name}</span>
        <strong class="gold-text" id="slot-val-${attr.code}">${currentVal}</strong>
      </div>
      <select class="slot-select" data-attr="${attr.code}">
        ${state.wizard.rolledScores.map(s => `
          <option value="${s}" ${s === currentVal ? 'selected' : ''}>天命出目: ${s}</option>
        `).join('')}
      </select>
    `;
    container.appendChild(slot);
  });

  // 绑定下拉修改事件：支持智能两两互换，杜绝重复点数冲突
  container.querySelectorAll(".slot-select").forEach(sel => {
    sel.onchange = (e) => {
      const targetAttr = e.target.getAttribute("data-attr");
      const newVal = parseInt(e.target.value, 10);
      const oldVal = state.wizard.assignedAbilities[targetAttr];

      // 寻找当前持有该 newVal 的另一个属性（若有则互换）
      let swappedAttr = null;
      for (const [code, val] of Object.entries(state.wizard.assignedAbilities)) {
        if (code !== targetAttr && val === newVal) {
          swappedAttr = code;
          break;
        }
      }

      if (swappedAttr) {
        state.wizard.assignedAbilities[swappedAttr] = oldVal;
        const otherSel = document.querySelector(`.slot-select[data-attr="${swappedAttr}"]`);
        if (otherSel) otherSel.value = oldVal;
        const otherValElem = document.getElementById(`slot-val-${swappedAttr}`);
        if (otherValElem) otherValElem.textContent = oldVal;
      }

      state.wizard.assignedAbilities[targetAttr] = newVal;
      document.getElementById(`slot-val-${targetAttr}`).textContent = newVal;

      // 任何手动微调后取消预设按钮独占高亮
      document.querySelectorAll(".preset-btn").forEach(btn => btn.classList.remove("active"));

      // 实时动态分析：根据用户手动微调后的最新六维属性，重新测算并刷新门派推荐！
      renderClassRecommendations(state.wizard.rolledScores, null);
    };
  });
}

function renderRaceCards() {
  const container = document.getElementById("race-cards-grid");
  container.innerHTML = "";
  Object.keys(PF1E_RULES.races).forEach(raceName => {
    const r = PF1E_RULES.races[raceName];
    const card = document.createElement("div");
    card.className = `choice-card ${state.wizard.selectedRace === raceName ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="choice-card-title">
        <span>${raceName}</span>
        <span class="choice-card-tag">${r.size} / ${r.speed}尺</span>
      </div>
      <div class="choice-card-desc">${r.traits}</div>
    `;
    card.onclick = () => {
      state.wizard.selectedRace = raceName;
      container.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
    };
    container.appendChild(card);
  });
}

function renderClassCards() {
  const container = document.getElementById("class-cards-grid");
  container.innerHTML = "";
  Object.keys(PF1E_RULES.classes).forEach(clsName => {
    const c = PF1E_RULES.classes[clsName];
    const card = document.createElement("div");
    card.className = `choice-card ${state.wizard.selectedClass === clsName ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="choice-card-title">
        <span>${clsName}</span>
        <span class="choice-card-tag">生命骰: d${c.hd}</span>
      </div>
      <div class="choice-card-desc">优豁免: ${c.goodSaves.map(s => s.toUpperCase()).join(', ')} | 技能基数: ${c.skillPoints}点/级</div>
    `;
    card.onclick = () => {
      state.wizard.selectedClass = clsName;
      container.querySelectorAll(".choice-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      renderSubclassSelector();
    };
    container.appendChild(card);
  });
}

// 渲染宗门道途/血脉/学派选项
function renderSubclassSelector() {
  const section = document.getElementById("wizard-subclass-section");
  const optionsBox = document.getElementById("wizard-subclass-options");
  const header = document.getElementById("wizard-subclass-header");
  if (!section || !optionsBox) return;

  const clsName = state.wizard.selectedClass || "战士";
  const list = CLASS_SUBCLASSES[clsName];
  if (!list || list.length === 0) {
    section.classList.add("hidden");
    state.wizard.selectedSubclass = null;
    return;
  }

  section.classList.remove("hidden");
  if (header) {
    header.textContent = `★ 【${clsName}】专属血脉/领域/道途选择：`;
  }

  if (!state.wizard.selectedSubclass || !list.some(s => s.name === state.wizard.selectedSubclass.name)) {
    state.wizard.selectedSubclass = list[0];
  }

  optionsBox.innerHTML = list.map(item => {
    const isSel = (state.wizard.selectedSubclass && state.wizard.selectedSubclass.name === item.name);
    return `
      <div class="subclass-card ${isSel ? 'selected' : ''}" style="flex:1; min-width:200px; padding:10px; border-radius:6px; cursor:pointer; background:${isSel ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.3)'}; border:1px solid ${isSel ? '#d4af37' : 'rgba(255,255,255,0.1)'}; transition:all 0.2s;" data-name="${item.name}">
        <div style="font-weight:bold; color:${isSel ? '#f6d365' : '#e2e8f0'}; margin-bottom:4px;">${item.name}</div>
        <div style="font-size:0.8rem; color:#a0aec0; line-height:1.4;">${item.desc}</div>
      </div>
    `;
  }).join("");

  optionsBox.querySelectorAll(".subclass-card").forEach((card, idx) => {
    card.onclick = () => {
      state.wizard.selectedSubclass = list[idx];
      renderSubclassSelector();
    };
  });
}

// 计算可选专长总数 (1级基准1，人类+1，战士额外战斗专长+1)
function getWizardMaxFeats() {
  const race = state.wizard.selectedRace || "人类";
  const cls = state.wizard.selectedClass || "战士";
  let max = 1;
  if (race === "人类") max += 1;
  if (cls === "战士") max += 1;
  return max;
}

// 渲染 CRB 核心专长挑选面板
function renderFeatSelector() {
  const grid = document.getElementById("feat-cards-grid");
  const hint = document.getElementById("feat-select-hint");
  if (!grid) return;

  const maxFeats = getWizardMaxFeats();
  if (!state.wizard.selectedFeats) {
    state.wizard.selectedFeats = [];
  }

  // 首次若未选择，默认预选适配当前职业的专长
  if (state.wizard.selectedFeats.length === 0) {
    const cls = state.wizard.selectedClass || "战士";
    if (cls === "法师" || cls === "术士") {
      state.wizard.selectedFeats = ["健壮 (Toughness)", "法术专攻 (Spell Focus)"].slice(0, maxFeats);
    } else if (cls === "游侠" || cls === "游荡者") {
      state.wizard.selectedFeats = ["近距离射击 (Point-Blank Shot)", "闪避 (Dodge)"].slice(0, maxFeats);
    } else {
      state.wizard.selectedFeats = ["猛力攻击 (Power Attack)", "精通先攻 (Improved Initiative)", "健壮 (Toughness)"].slice(0, maxFeats);
    }
  }

  if (state.wizard.selectedFeats.length > maxFeats) {
    state.wizard.selectedFeats = state.wizard.selectedFeats.slice(0, maxFeats);
  }

  if (hint) {
    const isHuman = (state.wizard.selectedRace === "人类");
    const isFighter = (state.wizard.selectedClass === "战士");
    let extraDesc = "";
    if (isHuman && isFighter) extraDesc = " (人类+1，战士额外战斗专长+1，共3项)";
    else if (isHuman) extraDesc = " (人类特性额外+1，共2项)";
    else if (isFighter) extraDesc = " (战士宗门额外战斗专长+1，共2项)";
    else extraDesc = " (标准1级自选1项)";
    hint.textContent = `已选 ${state.wizard.selectedFeats.length} / ${maxFeats} 项${extraDesc}`;
  }

  grid.innerHTML = CRB_CORE_FEATS.map(f => {
    const isSelected = state.wizard.selectedFeats.includes(f.name);
    return `
      <div class="feat-card ${isSelected ? 'selected' : ''}" style="padding:8px 10px; border-radius:6px; cursor:pointer; background:${isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(0,0,0,0.35)'}; border:1px solid ${isSelected ? '#d4af37' : 'rgba(255,255,255,0.1)'}; transition:all 0.2s;" data-name="${f.name}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:bold; color:${isSelected ? '#f6d365' : '#e2e8f0'}; font-size:0.86rem;">${isSelected ? '✓ ' : ''}${f.name}</span>
          <span style="font-size:0.75rem; color:#a0aec0;">${f.req}</span>
        </div>
        <div style="font-size:0.78rem; color:#cbd5e0; line-height:1.4;">${f.desc}</div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".feat-card").forEach(card => {
    card.onclick = () => {
      const featName = card.getAttribute("data-name");
      const idx = state.wizard.selectedFeats.indexOf(featName);
      if (idx >= 0) {
        state.wizard.selectedFeats.splice(idx, 1);
      } else {
        if (state.wizard.selectedFeats.length >= maxFeats) {
          state.wizard.selectedFeats.shift();
        }
        state.wizard.selectedFeats.push(featName);
      }
      renderFeatSelector();
    };
  });
}

// 渲染技能分配器 (全量22项标准技能，解开截断)
function renderSkillAllocator() {
  const container = document.getElementById("wizard-skills-allocator");
  if (!container) return;
  container.innerHTML = "";

  const clsData = PF1E_RULES.classes[state.wizard.selectedClass] || PF1E_RULES.classes["战士"];
  const intMod = calcMod(state.wizard.assignedAbilities.INT || 10);

  // 天赋职业奖励 FCB
  const fcbRadios = document.querySelectorAll('input[name="wizard-fcb"]');
  let fcbChoice = "hp";
  fcbRadios.forEach(r => { if (r.checked) fcbChoice = r.value; });
  state.wizard.fcbChoice = fcbChoice;
  const fcbBonus = (fcbChoice === "skill") ? 1 : 0;
  const humanBonus = (state.wizard.selectedRace === "人类") ? 1 : 0;

  // 1级可用总技能点 (最低1点)
  const totalPoints = Math.max(1, clsData.skillPoints + intMod + humanBonus + fcbBonus);

  // 计算当前消耗点数
  let usedPoints = 0;
  Object.values(state.wizard.skillRanks).forEach(r => { usedPoints += r; });
  state.wizard.availableSkillPoints = Math.max(0, totalPoints - usedPoints);
  const leftElem = document.getElementById("wizard-skill-points-left");
  if (leftElem) leftElem.textContent = state.wizard.availableSkillPoints;

  // 遍历全部技能 (全量 22 项，解除 slice 截断)
  PF1E_RULES.skills.forEach(sk => {
    const isClass = clsData.classSkills.includes(sk.name);
    const ranks = state.wizard.skillRanks[sk.name] || 0;

    const row = document.createElement("div");
    row.className = "skill-alloc-row";
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.padding = "4px 8px";
    row.style.borderBottom = "1px solid rgba(255,255,255,0.05)";

    row.innerHTML = `
      <span class="${isClass ? 'gold-text' : ''}" style="font-size:0.86rem;">${isClass ? '★ ' : ''}${sk.name} <small style="color:#a0aec0;">(${sk.attr})</small></span>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="alloc-btn btn-minus" ${ranks <= 0 ? 'disabled' : ''} style="width:24px; height:24px; line-height:1; cursor:pointer;">-</button>
        <strong style="width:16px; text-align:center; font-size:0.9rem; color:${ranks > 0 ? '#f6d365' : '#cbd5e0'};">${ranks}</strong>
        <button class="alloc-btn btn-plus" ${(state.wizard.availableSkillPoints <= 0 || ranks >= 1) ? 'disabled' : ''} style="width:24px; height:24px; line-height:1; cursor:pointer;">+</button>
      </div>
    `;

    row.querySelector(".btn-plus").onclick = () => {
      // 核心规则：1 级技能 rank 上限为 1
      if (state.wizard.availableSkillPoints > 0 && (state.wizard.skillRanks[sk.name] || 0) < 1) {
        state.wizard.skillRanks[sk.name] = (state.wizard.skillRanks[sk.name] || 0) + 1;
        renderSkillAllocator();
      }
    };

    row.querySelector(".btn-minus").onclick = () => {
      if ((state.wizard.skillRanks[sk.name] || 0) > 0) {
        state.wizard.skillRanks[sk.name]--;
        renderSkillAllocator();
      }
    };

    container.appendChild(row);
  });
}

// 🌟 一键门派智能技能点分配
function quickAllocSkills() {
  const cls = state.wizard.selectedClass || "战士";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];
  const intMod = calcMod(state.wizard.assignedAbilities.INT || 10);
  const fcbBonus = (state.wizard.fcbChoice === "skill") ? 1 : 0;
  const humanBonus = (state.wizard.selectedRace === "人类") ? 1 : 0;
  const totalPoints = Math.max(1, clsData.skillPoints + intMod + humanBonus + fcbBonus);

  state.wizard.skillRanks = {};

  const CLASS_SKILL_PRIORITIES = {
    "术士": ["辨识法术", "使用魔法装置", "交涉", "知识(神秘)", "察觉", "唬骗"],
    "法师": ["辨识法术", "知识(神秘)", "知识(位面)", "知识(地城)", "察觉", "语言学"],
    "牧师": ["医疗", "知识(宗教)", "辨识法术", "交涉", "察觉", "察言观色"],
    "德鲁伊": ["生存", "知识(自然)", "驯养动物", "察觉", "医疗", "攀爬"],
    "游荡者": ["隐匿", "解除装置", "特技", "察觉", "手上功夫", "脱逃", "察言观色", "唬骗"],
    "游侠": ["生存", "察觉", "隐匿", "知识(自然)", "攀爬", "游泳", "驯养动物"],
    "武僧": ["特技", "察觉", "察言观色", "脱逃", "攀爬", "游泳", "隐匿"],
    "圣武士": ["交涉", "察言观色", "医疗", "知识(宗教)", "骑术"],
    "野蛮人": ["威吓", "生存", "察觉", "攀爬", "游泳", "特技"],
    "吟游诗人": ["交涉", "表演", "辨识法术", "使用魔法装置", "察言观色", "隐匿", "知识(本地)"],
    "战士": ["威吓", "攀爬", "游泳", "骑术", "察觉", "生存"]
  };

  const priorityList = CLASS_SKILL_PRIORITIES[cls] || clsData.classSkills;
  let remaining = totalPoints;

  for (const skName of priorityList) {
    if (remaining <= 0) break;
    state.wizard.skillRanks[skName] = 1;
    remaining--;
  }

  if (remaining > 0) {
    for (const skName of clsData.classSkills) {
      if (remaining <= 0) break;
      if (!state.wizard.skillRanks[skName]) {
        state.wizard.skillRanks[skName] = 1;
        remaining--;
      }
    }
  }

  renderSkillAllocator();
}

// 🔄 重置技能点分配
function resetAllocSkills() {
  state.wizard.skillRanks = {};
  renderSkillAllocator();
}

// 预览生成卡片
function renderWizardFinalPreview() {
  const preview = document.getElementById("wizard-final-preview");
  if (!preview) return;

  const cls = state.wizard.selectedClass || "战士";
  const race = state.wizard.selectedRace || "人类";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];
  const conMod = calcMod(state.wizard.assignedAbilities.CON || 10);
  const dexMod = calcMod(state.wizard.assignedAbilities.DEX || 10);
  const wisMod = calcMod(state.wizard.assignedAbilities.WIS || 10);

  const fcbChoice = state.wizard.fcbChoice || "hp";
  const fcbHpBonus = (fcbChoice === "hp") ? 1 : 0;
  const feats = state.wizard.selectedFeats || [];
  const hasToughness = feats.some(f => f.includes("健壮"));
  const hpMax = Math.max(1, clsData.hd + conMod + fcbHpBonus + (hasToughness ? 3 : 0));

  const traitSelect = document.getElementById("wizard-trait-select");
  const traitVal = traitSelect ? traitSelect.value : (state.wizard.selectedTrait || "反制者");

  const nameVal = document.getElementById("input-char-name")?.value.trim() || "行者";
  const genderVal = document.getElementById("input-char-gender")?.value || "男";
  const ageVal = document.getElementById("input-char-age")?.value || "20";
  const heightVal = document.getElementById("input-char-height")?.value || "178";
  const weightVal = document.getElementById("input-char-weight")?.value || "68";
  const buildVal = document.getElementById("input-char-build")?.value || "修长匀称";
  const looksVal = document.getElementById("input-char-looks")?.value || "墨发束冠，眼眸清朗，身着素青道袍";
  const backstoryVal = document.getElementById("input-char-backstory")?.value || "自幼求索大道与身世真相";
  const tokenVal = document.getElementById("input-char-token")?.value.trim() || "家传断佩";

  const subclassInfo = state.wizard.selectedSubclass ? `【${state.wizard.selectedSubclass.name}】` : "";
  const equip = CLASS_STARTING_EQUIPMENT[cls] || CLASS_STARTING_EQUIPMENT["战士"];

  let acTotal = 10;
  let armorDesc = equip.armor.name;
  if (cls === "武僧") {
    const monkWis = (wisMod > 0 ? wisMod : 0);
    acTotal = 10 + dexMod + monkWis + (feats.some(f => f.includes("闪避")) ? 1 : 0);
    armorDesc = `无相金刚体 (无甲: 10 + 敏捷${dexMod} + 感知${monkWis}) → AC ${acTotal}`;
  } else {
    const appliedDex = Math.min(dexMod, equip.armor.maxDex);
    acTotal = 10 + equip.armor.bonus + appliedDex + (feats.some(f => f.includes("闪避")) ? 1 : 0);
    armorDesc = `${equip.armor.name} + 敏捷修正 → AC ${acTotal} (施法失败率: ${equip.armor.spellFail})`;
  }

  preview.innerHTML = `
    <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(212,175,55,0.3); padding:14px; border-radius:6px; font-size:13px; line-height:1.7;">
      <p><strong>尊号形貌：</strong>${nameVal} (${genderVal}，${ageVal}岁) · 身高 ${heightVal}cm / 体重 ${weightVal}kg · 【${buildVal}】</p>
      <p><strong>外形肖像：</strong>${looksVal} <span style="color:#f6d365;">(纯正人类神采，绝无异形异化)</span></p>
      <p><strong>随身信物：</strong>${tokenVal} <span style="color:#f6d365;">(宿命之宝 · 渊源羁绊)</span></p>
      <p><strong>宗门命盘：</strong>${race} · ${cls} 1级 ${subclassInfo}</p>
      <p><strong>气血根基 (HP)：</strong><strong style="color:#48bb78;">${hpMax} 点</strong> (满额HD: d${clsData.hd} + 体质${conMod}${fcbHpBonus ? ' + 天赋奖励1' : ''}${hasToughness ? ' + 健壮3' : ''})</p>
      <p><strong>身世专长：</strong>${feats.join('、') || '暂无'} | 特性: ${traitVal}</p>
      <p><strong>正统佩装：</strong>${equip.weapon.name} (${equip.weapon.damageDice} ${equip.weapon.damageType})</p>
      <p><strong>防备装束：</strong>${armorDesc}</p>
      <p><strong>生平缘起：</strong>${backstoryVal}</p>
    </div>
  `;
}

// 🔮 AI 智能分析提炼人设并自动填满表单
function initAiProfileGenerator() {
  const btn = document.getElementById("btn-generate-ai-profile");
  const inputIdea = document.getElementById("input-ai-profile-idea");
  const hint = document.getElementById("ai-profile-loading-hint");

  if (!btn || !inputIdea) return;

  btn.onclick = async () => {
    const idea = inputIdea.value.trim();
    if (!idea) {
      alert("请先输入您心中的人设灵感或脑洞片语！");
      inputIdea.focus();
      return;
    }

    btn.disabled = true;
    if (hint) hint.classList.remove("hidden");

    try {
      const localKey = localStorage.getItem("paotuan_deepseek_key") || "";
      const resp = await fetch("/api/character/generate_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: idea,
          race: state.wizard.selectedRace || "人类",
          cls: state.wizard.selectedClass || "战士",
          char_class: state.wizard.selectedClass || "战士",
          theme: state.theme || "开放自由题材",
          api_key: localKey
        })
      });


      if (!resp.ok) {
        throw new Error(`网络响应错误 (${resp.status})`);
      }

      const data = await resp.json();
      if (data.name && document.getElementById("input-char-name")) {
        document.getElementById("input-char-name").value = data.name;
      }
      if (data.gender && document.getElementById("input-char-gender")) {
        document.getElementById("input-char-gender").value = data.gender;
      }
      if (data.age && document.getElementById("input-char-age")) {
        document.getElementById("input-char-age").value = data.age;
      }
      if (data.height && document.getElementById("input-char-height")) {
        document.getElementById("input-char-height").value = data.height;
      }
      if (data.weight && document.getElementById("input-char-weight")) {
        document.getElementById("input-char-weight").value = data.weight;
      }
      if (data.build && document.getElementById("input-char-build")) {
        document.getElementById("input-char-build").value = data.build;
      }
      if (data.looks && document.getElementById("input-char-looks")) {
        document.getElementById("input-char-looks").value = data.looks;
      }
      if (data.backstory && document.getElementById("input-char-backstory")) {
        document.getElementById("input-char-backstory").value = data.backstory;
      }
      if (data.token && document.getElementById("input-char-token")) {
        document.getElementById("input-char-token").value = data.token;
      }

      // 自动触发底部预览卡片实时同步更新
      renderWizardFinalPreview();
    } catch (err) {
      console.error("AI 提炼人设失败:", err);
      alert("AI 提炼人设暂未响应，请稍后重试或手动输入。");
    } finally {
      btn.disabled = false;
      if (hint) hint.classList.add("hidden");
    }
  };
}


// 终局封缄角色卡 (Finalize)
function finalizeCharacterCreation() {
  const nameInput = document.getElementById("input-char-name")?.value.trim() || "行者";
  const genderInput = document.getElementById("input-char-gender")?.value || "男";
  const ageInput = parseInt(document.getElementById("input-char-age")?.value, 10) || 20;
  const heightInput = parseInt(document.getElementById("input-char-height")?.value, 10) || 178;
  const weightInput = parseInt(document.getElementById("input-char-weight")?.value, 10) || 68;
  const buildInput = document.getElementById("input-char-build")?.value.trim() || "修长匀称";
  const looksInput = document.getElementById("input-char-looks")?.value.trim() || "墨发束冠，眼眸清朗，面容端方沉静，身着素青道袍";
  const backstoryInput = document.getElementById("input-char-backstory")?.value.trim() || "自幼求索大道与身世真相";
  const tokenInput = document.getElementById("input-char-token")?.value.trim() || "家传断佩";
  const traitSelect = document.getElementById("wizard-trait-select")?.value || "反制者";

  const race = state.wizard.selectedRace || "人类";
  const cls = state.wizard.selectedClass || "战士";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];

  const abilities = { ...state.wizard.assignedAbilities };
  // 应用种族属性修正
  const raceData = PF1E_RULES.races[race];
  if (raceData) {
    Object.keys(raceData.attrMods).forEach(k => {
      abilities[k] = (abilities[k] || 10) + raceData.attrMods[k];
    });
    if (raceData.freeBonus) {
      const bonusAttr = state.wizard.selectedRaceBonusAttr || "STR";
      abilities[bonusAttr] = (abilities[bonusAttr] || 10) + raceData.freeBonus;
    }
  }

  const conMod = calcMod(abilities.CON);
  const dexMod = calcMod(abilities.DEX);
  const strMod = calcMod(abilities.STR);
  const wisMod = calcMod(abilities.WIS);

  // 天赋职业奖励与专长加值
  const fcbChoice = state.wizard.fcbChoice || "hp";
  const fcbHpBonus = (fcbChoice === "hp") ? 1 : 0;
  const feats = (state.wizard.selectedFeats && state.wizard.selectedFeats.length > 0)
    ? [...state.wizard.selectedFeats]
    : ["猛力攻击 (Power Attack)"];

  const hasToughness = feats.some(f => f.includes("健壮"));
  const hasDodge = feats.some(f => f.includes("闪避"));
  const hasImprovedInit = feats.some(f => f.includes("精通先攻"));
  const hasIronWill = feats.some(f => f.includes("钢铁意志"));
  const hasGreatFortitude = feats.some(f => f.includes("强韧加强"));
  const hasLightningReflexes = feats.some(f => f.includes("闪电反射"));
  const hasWeaponFocus = feats.some(f => f.includes("武器专攻"));

  const hpMax = Math.max(1, clsData.hd + conMod + fcbHpBonus + (hasToughness ? 3 : 0));

  // 获取背景特性
  const traitData = PF1E_TRAITS[traitSelect] || PF1E_TRAITS["反制者"];

  // 豁免基准 (含专长与特性)
  let willBonus = (traitData.type === "will" ? traitData.bonus : 0) + (hasIronWill ? 2 : 0);
  let fortBonus = (traitData.type === "fort" ? traitData.bonus : 0) + (hasGreatFortitude ? 2 : 0);
  let refBonus = (traitData.type === "ref" ? traitData.bonus : 0) + (hasLightningReflexes ? 2 : 0);

  const saves = {
    fort: (clsData.goodSaves.includes("fort") ? 2 : 0) + conMod + fortBonus,
    ref: (clsData.goodSaves.includes("ref") ? 2 : 0) + dexMod + refBonus,
    will: (clsData.goodSaves.includes("will") ? 2 : 0) + wisMod + willBonus
  };

  const bab = (clsData.babType === "full") ? 1 : 0;
  const size = raceData ? raceData.size : "中型";
  const sizeModCMB = (size === "小型") ? -1 : 0;
  const sizeModAC = (size === "小型") ? 1 : 0;

  // 先攻计算 (敏捷 + 特性 + 精通先攻专长)
  let initTraitBonus = (traitData.type === "init") ? traitData.bonus : 0;
  const initiative = dexMod + initTraitBonus + (hasImprovedInit ? 4 : 0);

  // CMB / CMD
  let cmbTraitBonus = (traitData.type === "cmb") ? traitData.bonus : 0;
  const cmb = bab + strMod + sizeModCMB + cmbTraitBonus;
  const cmd = 10 + bab + strMod + dexMod + sizeModCMB;

  // 负重梯度
  const loadLimits = getLoadThresholds(abilities.STR, size);

  // 职业专属开局正统装备与防御结算 (杜绝术士穿链甲衫！)
  const equipData = CLASS_STARTING_EQUIPMENT[cls] || CLASS_STARTING_EQUIPMENT["战士"];
  let armorBonus = equipData.armor.bonus || 0;
  let maxDex = equipData.armor.maxDex ?? 99;
  let acp = equipData.armor.acp || 0;
  let spellFail = equipData.armor.spellFail || "0%";
  let dodgeBonus = hasDodge ? 1 : 0;

  let acTotal = 10;
  let acTouch = 10;
  let acFlat = 10;

  if (cls === "武僧") {
    // PF1e CRB 核心：武僧无甲 AC = 10 + 敏捷修正 + (感知修正 > 0 ? 感知修正 : 0) + 体型 + 闪避
    const monkWis = Math.max(0, wisMod);
    acTotal = 10 + dexMod + monkWis + sizeModAC + dodgeBonus;
    acTouch = 10 + dexMod + monkWis + sizeModAC + dodgeBonus;
    acFlat = 10 + monkWis + sizeModAC;
    maxDex = 99;
    acp = 0;
    spellFail = "0%";
  } else {
    const appliedDex = Math.min(dexMod, maxDex);
    acTotal = 10 + armorBonus + appliedDex + sizeModAC + dodgeBonus;
    acTouch = 10 + appliedDex + sizeModAC + dodgeBonus;
    acFlat = 10 + armorBonus + sizeModAC;
  }

  // 武器命中加值结算
  let weaponAb = bab + strMod + sizeModAC + (hasWeaponFocus ? 1 : 0);
  if (cls === "法师" || cls === "术士") {
    weaponAb = bab + dexMod + sizeModAC;
  }

  const subclassTitle = state.wizard.selectedSubclass ? state.wizard.selectedSubclass.name : "";

  state.character = {
    profile: {
      name: nameInput,
      gender: genderInput,
      age: ageInput,
      height: heightInput,
      weight: weightInput,
      build: buildInput,
      looks: looksInput,
      backstory: backstoryInput,
      race: race,
      class: cls,
      subclass: subclassTitle,
      level: 1,
      alignment: "守序中立",
      modernToken: tokenInput
    },
    racialTraits: raceData ? raceData.traits : "",
    abilities: abilities,
    hp: { current: hpMax, max: hpMax, temp: 0 },
    ac: {
      total: acTotal,
      touch: acTouch,
      flatFooted: acFlat,
      armor: armorBonus,
      shield: 0,
      dex: Math.min(dexMod, maxDex),
      maxDex: maxDex,
      acp: acp,
      spellFail: spellFail
    },
    speed: raceData ? raceData.speed : 30,
    bab: bab,
    initiative: initiative,
    cmb: cmb,
    cmd: cmd,
    saves: saves,
    trait: traitData,
    feats: feats,
    feat: {
      name: feats.join("、"),
      desc: `已习得核心专长：${feats.join("、")}`
    },
    skills: {},
    weapon: {
      name: equipData.weapon.name,
      threatRange: equipData.weapon.threatRange,
      critMultiplier: equipData.weapon.critMultiplier,
      damageDice: equipData.weapon.damageDice,
      damageType: equipData.weapon.damageType,
      attackBonus: weaponAb
    },
    inventory: equipData.inventory ? JSON.parse(JSON.stringify(equipData.inventory)) : [],
    load: {
      current: equipData.inventory ? equipData.inventory.reduce((sum, item) => sum + (item.weight * (item.qty || 1)), 0) : 15,
      lightMax: loadLimits.light,
      medMax: loadLimits.med,
      heavyMax: loadLimits.heavy,
      status: "轻载"
    }
  };

  // 装填分配的技能
  Object.keys(state.wizard.skillRanks).forEach(skName => {
    const ranks = state.wizard.skillRanks[skName];
    if (ranks > 0) {
      const skDef = PF1E_RULES.skills.find(s => s.name === skName);
      state.character.skills[skName] = {
        ranks: ranks,
        isClass: clsData.classSkills.includes(skName),
        attr: skDef ? skDef.attr : "STR"
      };
    }
  });

  // 若无额外分配，默认触发一键智能门派技能分配
  if (Object.keys(state.character.skills).length === 0) {
    quickAllocSkills();
    Object.keys(state.wizard.skillRanks).forEach(skName => {
      const ranks = state.wizard.skillRanks[skName];
      if (ranks > 0) {
        const skDef = PF1E_RULES.skills.find(s => s.name === skName);
        state.character.skills[skName] = {
          ranks: ranks,
          isClass: clsData.classSkills.includes(skName),
          attr: skDef ? skDef.attr : "STR"
        };
      }
    });
  }

  // 刷新左侧战术面板与法术/绝技卡片
  renderTacticalPanel();
  if (typeof renderSpellsCard === "function") {
    renderSpellsCard();
  }

  // 若为传奇继承者（前人陨落，后人接力），保留世界观题材、暗络大纲与编年史
  if (state.isLegacySuccession) {
    state.isLegacySuccession = false;
    const legacyIntro = `【传奇继承者破局入局】：前代行者虽已长眠，但因果未断、主线犹存！新一代行者【${nameInput}】（时年 ${ageInput} 岁，${race}${cls}${subclassTitle ? '·' + subclassTitle : ''}）身携【${tokenInput}】，追寻前代遗留的蛛丝马迹与未竟之局正式入局！\n\n请司命以此全新视角，紧密承接前代行者的故事线索展开推演！`;
    appendNarrativeEntry("assistant", legacyIntro);
    state.history.push({ role: "assistant", content: legacyIntro });
    sendPlayerAction(`我（${nameInput}，${ageInput}岁，${race}${cls}）手持【${tokenInput}】，来到了前代行者留有最后音讯的这片天地，收敛心神、探查四周局势。`);
    saveGameToServer();
    return;
  }

  // 常规新开局：重置题材状态与历史，发起新世界观发问
  state.theme = null;
  state.history = [];
  state.chronicles = [];
  state.campaignArc = null;

  const stream = document.getElementById("narrative-stream");
  if (stream) stream.innerHTML = "";

  const tokenDesc = (tokenInput && tokenInput !== "无") ? `，随身佩带信物【${tokenInput}】` : "，孑然一身独步江湖";
  const promptText = `【印契定魄】：行者【${nameInput}】（${genderInput}，${ageInput}岁，身高${heightInput}cm/体重${weightInput}kg，${race}${cls}${subclassTitle ? '·' + subclassTitle : ''}）乾坤命格已凝结定魄！手持【${equipData.weapon.name}】，${tokenDesc}。\n\n命盘已开，风云待定。请阁下以故事背景告知你想玩一个什么样的故事？（可自由打字描写你心仪的故事背景与世界观，司命将据此展开专属单人跑团！）`;
  appendNarrativeEntry("assistant", promptText);

  saveGameToServer();
}


// =========================================================
// 9. API 设置与存档管理 (Settings & Persistence)
// =========================================================

async function loadAndRenderSuggestions() {
  const box = document.getElementById("suggestions-list-box");
  if (!box) return;
  try {
    const res = await fetch("/api/suggestions");
    const json = await res.json();
    const list = json.suggestions || [];
    if (list.length === 0) {
      box.innerHTML = `<div class="empty-tip">暂无暂存建议，在主界面输入框勾选【💡 记为迭代建议】即可随时收录。</div>`;
      return;
    }
    box.innerHTML = "";
    list.forEach(item => {
      const el = document.createElement("div");
      el.className = "suggestion-item";
      el.innerHTML = `
        <span class="sugg-time">[${item.time}]</span>
        <span class="sugg-text">${item.content}</span>
      `;
      box.appendChild(el);
    });
  } catch (e) {
    box.innerHTML = `<div class="danger-text">读取建议失败: ${e.message}</div>`;
  }
}

function initSettingsModal() {
  const modal = document.getElementById("modal-settings");
  const btnOpen = document.getElementById("btn-open-settings");
  const btnClose = document.getElementById("btn-close-settings");
  const btnSave = document.getElementById("btn-save-settings");
  const btnTest = document.getElementById("btn-test-api");
  const btnCopySugg = document.getElementById("btn-copy-suggestions");
  const btnClearSugg = document.getElementById("btn-clear-suggestions");

  btnOpen.onclick = async () => {
    modal.classList.remove("hidden");
    loadAndRenderSuggestions();
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      const localKey = localStorage.getItem("paotuan_deepseek_key");
      if (data.masked_api_key) {
        document.getElementById("cfg-api-key").placeholder = `已配置 (${data.masked_api_key})，留空则不修改`;
      } else if (localKey) {
        document.getElementById("cfg-api-key").value = localKey;
      }
      document.getElementById("cfg-base-url").value = data.base_url || "https://api.deepseek.com";
      document.getElementById("cfg-model").value = data.model || "deepseek-flash";
      document.getElementById("cfg-extra-prompt").value = data.system_prompt_extra || "";
    } catch (e) {}
  };

  btnClose.onclick = () => modal.classList.add("hidden");

  btnSave.onclick = async () => {
    const key = document.getElementById("cfg-api-key").value.trim();
    const baseUrl = document.getElementById("cfg-base-url").value.trim();
    const model = document.getElementById("cfg-model").value.trim();
    const extra = document.getElementById("cfg-extra-prompt").value.trim();

    const payload = {
      base_url: baseUrl,
      model: model,
      system_prompt_extra: extra
    };
    if (key) {
      payload.api_key = key;
      localStorage.setItem("paotuan_deepseek_key", key);
    }

    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("司命心印设置保存成功！API 密钥已双重永久锁定。");
      modal.classList.add("hidden");
    } catch (e) {
      alert("保存失败：" + e.message);
    }
  };

  btnTest.onclick = async () => {
    btnTest.textContent = "测试中...";
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.has_api_key) {
        alert("API 配置连接正常！已装载 API 密钥。");
      } else {
        alert("尚未检测到有效 API 密钥，当前将运行在本地内置测试模式。");
      }
    } catch (e) {
      alert("检测异常: " + e.message);
    } finally {
      btnTest.textContent = "🔗 连通性测试";
    }
  };

  if (btnCopySugg) {
    btnCopySugg.onclick = async () => {
      try {
        const res = await fetch("/api/suggestions");
        const json = await res.json();
        const list = json.suggestions || [];
        if (list.length === 0) {
          alert("当前暂无暂存建议可供复制。");
          return;
        }
        let formatted = "### 跑团迭代建议清单 (来自玩家实测灵感)：\n\n";
        list.forEach((item, idx) => {
          formatted += `${idx + 1}. [${item.time}] ${item.content}\n`;
        });
        await navigator.clipboard.writeText(formatted);
        alert("【建议已复制到剪贴板】！\n您可以直接在当前与 AI 助手的对话框中按 Ctrl+V 粘贴发给 Antigravity，开始下一轮系统升级！");
      } catch (e) {
        alert("复制失败: " + e.message);
      }
    };
  }

  if (btnClearSugg) {
    btnClearSugg.onclick = async () => {
      if (!confirm("确定要清空所有已暂存的建议吗？")) return;
      try {
        await fetch("/api/suggestions", { method: "DELETE" });
        loadAndRenderSuggestions();
        alert("建议灵感录已清空。");
      } catch (e) {
        alert("清空失败: " + e.message);
      }
    };
  }
}

// =========================================================
// 9.1 行商大集 · 万象货栈商铺系统 (Marketplace Controller)
// =========================================================

const MARKET_CATALOG = [
  // ⚔️ 兵刃武器 (按 PF1e 核心装备规范)
  { id: "w_dagger", name: "精工匕首", category: "weapon", price: 2, weight: 1, stats: "1d4 (19-20/×2)", desc: "轻巧锋利，易于隐匿携带，近战刺击或投掷皆宜。" },
  { id: "w_sword", name: "精工长剑", category: "weapon", price: 15, weight: 4, stats: "1d8 (19-20/×2)", desc: "开刃雪亮，重心平衡极佳的单手百兵之君。" },
  { id: "w_shortbow", name: "猎手短弓与箭囊", category: "weapon", price: 30, weight: 2, stats: "1d6 (×3)", desc: "配有20支鸣镝长箭，远距离狙杀与荒野涉猎利器。" },
  { id: "w_greatsword", name: "淬火斩马重剑", category: "weapon", price: 50, weight: 8, stats: "2d6 (19-20/×2)", desc: "双手重型破阵巨兵，力拔山兮气盖世。" },
  { id: "w_revolver", name: "精制钢轮转左轮", category: "weapon", price: 150, weight: 3, stats: "1d8 (×4)", desc: "现代/火器自卫兵刃，近距离穿透极强。" },

  // 🛡️ 防具护甲
  { id: "a_leather", name: "熟鞣硬皮甲", category: "armor", price: 10, weight: 15, stats: "AC +2 (ACP 0)", desc: "柔韧坚韧，完全不影响特技翻滚与隐匿行动。" },
  { id: "a_chainshirt", name: "精工锁子链甲衫", category: "armor", price: 100, weight: 25, stats: "AC +4 (ACP -1)", desc: "密织细钢环覆于锦袍之下，防护与灵巧兼具。" },
  { id: "a_breastplate", name: "锻打熟铁胸甲", category: "armor", price: 200, weight: 30, stats: "AC +6 (ACP -3)", desc: "整体冲压钢板护住前后要害，箭矢难伤。" },
  { id: "a_shield", name: "镶铜重钢方盾", category: "armor", price: 20, weight: 15, stats: "AC +2 (ACP -2)", desc: "立于身前坚不可摧，抵挡飞矢与重击。" },

  // 🎒 探险与生活道具
  { id: "g_backpack", name: "结实粗帆布行囊", category: "gear", price: 2, weight: 2, stats: "行囊容积 30磅", desc: "双肩背负，分层清晰耐磨防水。" },
  { id: "g_rope", name: "特制浸油细麻绳 (50尺)", category: "gear", price: 1, weight: 10, stats: "承重 500磅", desc: "攀爬悬崖、捆绑俘虏与扎营必备。" },
  { id: "g_torch", name: "树脂火把 (3支装)", category: "gear", price: 1, weight: 3, stats: "照亮 20尺", desc: "风雨不熄，提供长达数个时辰的黑暗洞穴照明。" },
  { id: "g_rations", name: "高能干粮行军袋", category: "gear", price: 5, weight: 7, stats: "7日份给养", desc: "肉干、炒面与耐存放硬饼，果腹充饥防虚脱。" },
  { id: "g_tools", name: "精密机关锁具暗撬套组", category: "gear", price: 30, weight: 1, stats: "解除装置 +2", desc: "精钢探针与回旋扳子，游荡者与破局神兵。" },
  { id: "g_notebook", name: "硬皮记事薄与炭精笔", category: "gear", price: 2, weight: 1, stats: "文具/情报", desc: "高考攻坚计算或地下潜伏记录暗号密码。" },

  // 🧪 灵药与急救
  { id: "p_heal", name: "朱砂提气九转还魂露", category: "potion", price: 50, weight: 0.5, stats: "恢复 1d8+1 HP", desc: "纯阳灵药，饮下后迅速止血生肌，抚平创伤。" },
  { id: "p_antidote", name: "雪魄辟毒散", category: "potion", price: 50, weight: 0.5, stats: "强韧豁免 +5", desc: "含于舌下可化解百般瘴气与烈性暗毒。" },
  { id: "p_bandage", name: "无菌急救创伤绷带包", category: "potion", price: 10, weight: 1, stats: "医疗检定 +2", desc: "迅速压迫止血包扎，防止失血休克。" }
];

function initMarketplaceModal() {
  const modal = document.getElementById("modal-market");
  const btnOpen = document.getElementById("btn-open-market");
  const btnClose = document.getElementById("btn-close-market");
  const btnDone = document.getElementById("btn-done-market");
  const walletElem = document.getElementById("market-wallet-amount");
  const itemsContainer = document.getElementById("market-items-grid");

  let currentCategory = "all";

  function refreshMarket() {
    if (state.character.currency === undefined || state.character.currency === null) {
      state.character.currency = 150;
    }
    const currStr = `${state.character.currency} GP`;
    if (walletElem) walletElem.textContent = currStr;
    const dispCurr = document.getElementById("display-currency");
    if (dispCurr) dispCurr.textContent = currStr;
    const dispSub = document.getElementById("display-currency-sub");
    if (dispSub) dispSub.textContent = `折合 ${state.character.currency * 10} 银两 / 现金`;

    renderMarketItems(currentCategory);
  }

  function renderMarketItems(cat) {
    if (!itemsContainer) return;
    itemsContainer.innerHTML = "";

    const filtered = (cat === "all") ? MARKET_CATALOG : MARKET_CATALOG.filter(it => it.category === cat);

    filtered.forEach(it => {
      const card = document.createElement("div");
      card.className = "market-item-card";
      card.innerHTML = `
        <div class="market-item-top">
          <span class="market-item-name">${it.name}</span>
          <span class="market-item-price">${it.price} GP</span>
        </div>
        <div class="market-item-stats">${it.stats} · 重 ${it.weight} 磅</div>
        <div class="market-item-desc">${it.desc}</div>
        <button class="btn btn-gold btn-buy-item">购入此物 (${it.price} GP)</button>
      `;

      card.querySelector(".btn-buy-item").onclick = () => {
        if (state.character.currency < it.price) {
          audio.playAlert();
          alert(`囊中资财不足！当前可用 ${state.character.currency} GP，购入【${it.name}】需 ${it.price} GP。`);
          return;
        }

        // 扣除货币
        state.character.currency -= it.price;
        if (!state.character.inventory) state.character.inventory = [];

        // 消耗品或已有物品：优先增加数量 qty
        const existing = state.character.inventory.find(inv => inv.name === it.name);
        if (existing) {
          existing.qty = (existing.qty || 1) + 1;
        } else {
          state.character.inventory.push({ ...it, qty: 1 });
        }

        // 如果购买的是武器且玩家需要更新
        if (it.category === "weapon" && (!state.character.weapon || confirm(`已购入【${it.name}】，是否将其设为当前主要佩兵？`))) {
          state.character.weapon.name = it.name;
        }

        // 重新计算并联动负重
        if (!state.character.load) state.character.load = { current: 35, lightMax: 66, medMax: 133, heavyMax: 200, status: "轻载" };
        state.character.load.current = Math.round((state.character.load.current + it.weight) * 10) / 10;
        const limits = getLoadThresholds(state.character.abilities.STR, "中型");
        state.character.load.lightMax = limits.light;
        state.character.load.medMax = limits.medium;
        state.character.load.heavyMax = limits.heavy;
        if (state.character.load.current <= limits.light) state.character.load.status = "轻载";
        else if (state.character.load.current <= limits.medium) state.character.load.status = "中载";
        else state.character.load.status = "重载";

        renderTacticalPanel();
        renderInventorySummaryCard();
        refreshMarket();
        audio.playNat20();
        alert(`采办成功！成功购入【${it.name}】，消耗 ${it.price} GP。物品已存入行囊，负重增至 ${state.character.load.current} 磅！`);
        saveGameToServer();
      };

      itemsContainer.appendChild(card);
    });
  }

  if (btnOpen) {
    btnOpen.onclick = () => {
      modal.classList.remove("hidden");
      refreshMarket();
    };
  }
  if (btnClose) btnClose.onclick = () => modal.classList.add("hidden");
  if (btnDone) btnDone.onclick = () => modal.classList.add("hidden");

  // Tab 切换
  document.querySelectorAll(".market-tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".market-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-cat");
      renderMarketItems(currentCategory);
    };
  });
}


// =========================================================
// 8. 随身行囊与装备全景管理器 (Inventory & Equipment Manager)
// =========================================================

function renderInventorySummaryCard() {
  const card = document.getElementById("card-inventory-summary");
  if (!card) return;
  const c = state.character;
  if (!c) return;

  const summaryWeapon = document.getElementById("summary-weapon");
  const summaryArmor = document.getElementById("summary-armor");
  const summaryItemCount = document.getElementById("summary-item-count");

  // 1. 兵刃展示
  if (summaryWeapon) {
    if (c.weapon) {
      summaryWeapon.textContent = `${c.weapon.name} (${c.weapon.damageDice || '1d8'}, ${c.weapon.threatRange ? c.weapon.threatRange.join('-') : '19-20'}/x${c.weapon.critMultiplier || 2})`;
    } else {
      summaryWeapon.textContent = "空手 / 贴身防卫";
    }
  }

  // 2. 甲胄展示
  if (summaryArmor) {
    const armorItem = (c.inventory || []).find(it => it.category === "armor");
    if (armorItem) {
      summaryArmor.textContent = `${armorItem.name} (AC+${c.ac?.armor || 4}, 检定${c.ac?.acp || -2})`;
    } else {
      summaryArmor.textContent = "无甲 / 常服";
    }
  }

  // 3. 道具收纳概览
  if (summaryItemCount) {
    const items = (c.inventory || []).filter(it => it.category !== "armor" && it.category !== "weapon");
    if (items.length === 0) {
      summaryItemCount.textContent = "空空如也，可至货栈采办";
    } else {
      const names = items.slice(0, 3).map(it => `${it.name}${it.qty > 1 ? 'x' + it.qty : ''}`).join(", ");
      summaryItemCount.textContent = items.length > 3 ? `${names}... 等${items.length}件` : names;
    }
  }
}

// =========================================================
// 8.1 右栏 35 项核心技能全景矩阵 (一排 3 个)
// =========================================================

function renderSkillsMatrix() {
  const container = document.getElementById("skills-matrix-grid");
  if (!container) return;
  const c = state.character;
  if (!c) return;

  container.innerHTML = "";

  const SKILL_ICONS = {
    "杂技": "🤸", "估价": "🪙", "欺骗": "🎭", "攀爬": "🧗", "交涉": "🗣️",
    "解除装置": "🗝️", "易容": "🥸", "脱逃": "⛓️", "飞行": "🪽", "医疗": "🩹",
    "威吓": "😠", "知识(神秘)": "🔮", "知识(地下城)": "🏰", "知识(工程)": "⚙️", "知识(地理)": "🗺️",
    "知识(历史)": "📜", "知识(地方)": "🏘️", "知识(自然)": "🌿", "知识(贵族)": "👑", "知识(位面)": "🌌",
    "知识(宗教)": "⛪", "语言学": "🔤", "察觉": "👁️", "表演": "🪕", "专业": "⚒️",
    "骑术": "🐎", "察言观色": "🔍", "手上功夫": "🤹", "法术辨识": "✨", "隐匿": "🐾",
    "生存": "🏕️", "游泳": "🏊", "使用魔法装置": "🪄"
  };

  PF1E_RULES.skills.forEach(sk => {
    const bonusInfo = getCheckBonusDetail(sk.name);
    const skData = c.skills ? c.skills[sk.name] : null;
    const isClass = skData?.isClass;
    const ranks = skData?.ranks || 0;
    const hasPenalty = (sk.acp && (c.ac?.acp || 0) < 0);

    const btn = document.createElement("button");
    btn.className = `skill-matrix-btn ${isClass && ranks > 0 ? 'is-class-trained' : ''} ${hasPenalty ? 'has-penalty' : ''}`;
    btn.title = `【${sk.name}】(${sk.attr})\n点击查阅技能详细规则与加值构成！`;

    const icon = SKILL_ICONS[sk.name] || "🎯";
    let displayName = sk.name.replace("知识(", "").replace(")", "知");
    if (displayName.length > 4) displayName = displayName.slice(0, 4);

    btn.innerHTML = `
      <span class="sk-name">${icon} ${displayName}</span>
      <span class="sk-mod">${fmtMod(bonusInfo.bonus)}</span>
    `;

    // 关键改造：点击绝不直接投骰！而是安全打开技能规则详查卡片，查看用途后再决定是否投骰
    btn.onclick = () => {
      openSkillDetailModal(sk, bonusInfo, icon);
    };

    container.appendChild(btn);
  });
}

// 技能详细规则与用途字典
const SKILL_RULES_DESC = {
  "特技": "用于在狭窄表面走独木桥、贴地翻滚穿过敌人借机威胁区、减免高处坠落伤害等。",
  "估价": "用于鉴定古董珠宝、宝物真实价值与品质，识别赝品与真品。",
  "唬骗": "用于说谎、佯攻欺敌、传递暗号、隐瞒真实意图与假传军情。",
  "攀爬": "用于攀登陡峭岩壁、城墙、树木或沿绳索垂直行进。",
  "交涉": "用于以理服人、平息干戈、改善NPC态度、谈判议价与结交盟友。",
  "解除装置": "用于解除复杂机关、拆除致命陷阱、开锁破门（受训专属技能）。",
  "伪装": "用于易容改扮、乔装潜伏、改换身份与避人耳目。",
  "脱逃": "用于从绳索捆绑、手铐镣铐或敌人的擒抱压制中挣脱逃生。",
  "飞行": "用于在空中振翅滑翔或受法术飞行时的空中机动与对抗气流。",
  "驯养动物": "用于驯服野兽、指挥战宠行动、安抚受惊坐骑（受训专属技能）。",
  "医疗": "用于战地急救稳定濒死者伤势、治疗致命毒伤与疾病护理。",
  "威吓": "用于以杀气或威势震慑敌胆、逼问口供、令敌方陷入战栗。",
  "察觉": "用于耳听八方眼观六路、识破潜伏敌人、发现隐藏密门与暗藏陷阱。",
  "表演": "用于奏乐吟诗、街头卖艺、博取达官显贵好感、唤起群体共鸣。",
  "骑术": "用于骑马控缰、马上控箭开弓、驾驭战马涉险。",
  "察言观色": "用于洞察对方面部微表情、识破谎言、感知是否身中惑控法术。",
  "手上功夫": "用于近身探囊取物(顺手牵羊)、摸尸顺宝、藏匿暗器暗桩(受训专属)。",
  "辨识法术": "用于辨识敌人正在吟唱的咒诀、鉴定魔法奇物与药水功效(受训专属)。",
  "隐匿": "用于借阴影潜伏行迹、静步潜行、避开敌方守卫巡查与侦察。",
  "生存": "用于野外追踪足迹、辨识方向、捕猎取水生火、预测恶劣天候。",
  "游泳": "用于在汹涌波涛、暗河水潭或激流中泅渡前行。",
  "使用魔法装置": "用于非本职者跨职业激活法术卷轴、魔杖或充能魔法奇物(受训专属)。"
};

// 技能规则详查模态框呼出与二次确认投骰
function openSkillDetailModal(sk, bonusInfo, icon) {
  const modal = document.getElementById("modal-skill-detail");
  if (!modal) return;

  const c = state.character;
  const skData = c?.skills ? c.skills[sk.name] : null;
  const isClass = !!skData?.isClass;
  const ranks = skData?.ranks || 0;
  const attrMod = calcMod(c?.abilities[sk.attr] || 10);
  const classBonus = (isClass && ranks > 0) ? 3 : 0;
  const acpPenalty = sk.acp ? (c?.ac?.acp || 0) : 0;
  const desc = SKILL_RULES_DESC[sk.name] || `${sk.name}相关的探险应对与环境判定。`;

  const titleElem = document.getElementById("skill-detail-title");
  if (titleElem) titleElem.innerHTML = `${icon} 【${sk.name}】技能规则详查`;

  const bodyElem = document.getElementById("skill-detail-body");
  if (bodyElem) {
    bodyElem.innerHTML = `
      <div class="skill-detail-card">
        <div class="sk-badge-row">
          <span class="badge badge-gold">关键属性: ${sk.attr} (${fmtMod(attrMod)})</span>
          <span class="badge ${isClass ? 'badge-gold' : 'badge-dim'}">${isClass ? '★ 本职技能' : '非本职技能'}</span>
          <span class="badge ${ranks > 0 ? 'badge-gold' : 'badge-dim'}">投入点数: ${ranks} 级</span>
          <span class="badge ${sk.acp ? 'badge-danger' : 'badge-dim'}">${sk.acp ? `受甲胄拖累 (ACP ${acpPenalty})` : '不受甲胄拖累'}</span>
        </div>

        <div class="sk-rule-box">
          <strong>📖 规则用途与考量：</strong><br>
          ${desc}
        </div>

        <div class="sk-calc-breakdown">
          <div style="font-weight:bold; color:#d4af37; margin-bottom:6px;">📊 检定修正值计算公式明细：</div>
          <table>
            <tr><td>关键属性调整值 (${sk.attr}):</td><td class="val">${fmtMod(attrMod)}</td></tr>
            <tr><td>技能投入级数 (Ranks):</td><td class="val">+${ranks}</td></tr>
            <tr><td>本职受训加值 (本职且点数>0):</td><td class="val">+${classBonus}</td></tr>
            ${sk.acp && acpPenalty < 0 ? `<tr><td>防具穿甲减值扣减 (ACP):</td><td class="val" style="color:#f56565;">${acpPenalty}</td></tr>` : ''}
            <tr class="sk-calc-total-row"><td>终道检定总加值:</td><td class="val">${fmtMod(bonusInfo.bonus)}</td></tr>
          </table>
        </div>
      </div>
    `;
  }

  modal.classList.remove("hidden");
  audio.playAlert();

  const btnClose = document.getElementById("btn-close-skill-detail");
  const btnCancel = document.getElementById("btn-cancel-skill-roll");
  const btnConfirm = document.getElementById("btn-confirm-skill-roll");

  const closeModal = () => modal.classList.add("hidden");
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;

  // 唯有玩家明确点击“确认检定”时才投骰！
  if (btnConfirm) {
    btnConfirm.onclick = () => {
      closeModal();
      performDiceRoll(`${sk.name}检定`, bonusInfo.bonus, 12, (result) => {
        const sendText = `【玩家主动发起 · ${sk.name}检定】：投出 D20 (${result.d20}) + 修正总加值 (${fmtMod(result.bonus)}) [${bonusInfo.detail}] = 终值 ${result.total}（请司命依此推演判定后果与局势变化）`;
        sendPlayerAction(sendText);
      });
    };
  }
}

// =========================================================
// 8.2 掌中秘术 · 道法天书专区 (Spells & Combat Arts)
// =========================================================

const CLASS_SPELL_PRESETS = {
  "术士": {
    isCaster: true,
    title: "🔮 超凡血脉 · 术道天书",
    slots: { current: 4, max: 4 },
    spells: [
      { name: "酸液飞溅", level: "0环戏法", school: "咒法", desc: "指尖凝出高腐蚀性强酸飞矢，远程魔法接触命中造成 1d3 强酸伤害 (无限施展)" },
      { name: "光亮术", level: "0环戏法", school: "塑能", desc: "引动明澈灵光附着法杖，照亮方圆20尺黑暗 (无限施展)" },
      { name: "法师之手", level: "0环戏法", school: "变化", desc: "隔空念力搬运移送5磅以内的未被握持之物 (无限施展)" },
      { name: "侦测魔法", level: "0环戏法", school: "预言", desc: "察知方圆60尺内的奥术灵光与魔法陷阱 (无限施展)" },
      { name: "魔法飞弹", level: "1环法术", school: "塑能", isSlot: true, desc: "发射1枚必中力场飞弹，无视闪避护甲强制定点打击造成 1d4+1 力场伤害" },
      { name: "燃烧之手", level: "1环法术", school: "塑能", isSlot: true, desc: "双掌喷涌扇形锥面烈焰，对范围内所有敌人造成 1d4 火焰真伤" },
      { name: "奥术护盾术", level: "1环法术", school: "防护", isSlot: true, desc: "唤出悬浮隐形力场巨盾，提供 AC+4 防御且免疫魔法飞弹" },
      { name: "催眠沉睡术", level: "1环法术", school: "惑控", isSlot: true, desc: "引导梦魇灵光，令最多 4HD 的敌对杂兵瞬间陷入深度沉睡" }
    ]
  },
  "法师": {
    isCaster: true,
    title: "📖 奥术真解 · 每日秘术",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "光亮术", level: "0环戏法", school: "塑能", desc: "指尖燃起明澈温光，照亮方圆20尺 (无限施展)" },
      { name: "法师之手", level: "0环戏法", school: "变化", desc: "隔空念力搬运移送5磅以内的未被握持之物 (无限施展)" },
      { name: "侦测魔法", level: "0环戏法", school: "预言", desc: "察知方圆60尺内的奥术灵光与魔法陷阱 (无限施展)" },
      { name: "魔法飞弹", level: "1环法术", school: "塑能", isSlot: true, desc: "发射1枚必中力场飞弹，必中造成 1d4+1 伤害" },
      { name: "法师护甲", level: "1环法术", school: "咒法", isSlot: true, desc: "唤出隐形力场盔甲护体，提供 AC+4 防御" },
      { name: "睡眠术", level: "1环法术", school: "惑控", isSlot: true, desc: "令最多4HD敌对目标陷入沉睡（意志豁免）" }
    ]
  },
  "牧师": {
    isCaster: true,
    title: "📖 神圣法典 · 天恩神术",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "神导术", level: "0环神术", school: "预言", desc: "祈求神恩，令下一次检定或攻击获得 +1 幸运加值 (无限施展)" },
      { name: "稳定伤势", level: "0环神术", school: "咒法", desc: "立止濒死者流血，使其伤势稳定不再失血 (无限施展)" },
      { name: "引导神力", level: "神恩", school: "正能量", isSlot: true, desc: "爆发出 30 尺神圣正能量光环，全体友方回复 1d6 生命 (或重创不死生物)" },
      { name: "治疗轻伤", level: "1环神术", school: "咒法", isSlot: true, desc: "灌注神圣生机，回复 1d8+1 点生命值" },
      { name: "祝福术", level: "1环神术", school: "惑控", isSlot: true, desc: "神圣庇佑，全体友方攻击命中与恐慌豁免+1" }
    ]
  },
  "德鲁伊": {
    isCaster: true,
    title: "🌿 自然律法 · 荒野真言",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "神导术", level: "0环神术", school: "预言", desc: "自然之灵指引，下一次检定获得 +1 幸运加值 (无限施展)" },
      { name: "造水术", level: "0环神术", school: "咒法", desc: "引动天地甘霖，创造2加仑纯净饮用水 (无限施展)" },
      { name: "纠缠术", level: "1环神术", school: "变化", isSlot: true, desc: "令方圆40尺内的杂草藤蔓疯长缠绕敌人脚步，阻滞行动" },
      { name: "长角冲撞", level: "1环神术", school: "变化", isSlot: true, desc: "额生苍劲兽角，近战冲锋爆发致命穿刺伤害" },
      { name: "治疗轻伤", level: "1环神术", school: "咒法", isSlot: true, desc: "呼唤甘霖滋润伤躯，恢复 1d8+1 点生命" }
    ]
  },
  "野蛮人": {
    isCaster: false,
    title: "🔥 蛮血狂暴 · 怒意狂涛",
    slots: { current: 4, max: 4 },
    spells: [
      { name: "激活狂暴 (Rage)", level: "本能", school: "怒气", isSlot: true, desc: "激发狂暴本能，力量+4、体质+4、意志+2，气血上限激增，战力毁天灭地" },
      { name: "狂暴巨刃劈斩", level: "战技", school: "近战", isSlot: true, desc: "借狂暴巨力横斩敌手，伤害额外追加 +3 暴力碾压" },
      { name: "战吼威吓", level: "战威", school: "音波", desc: "发出震耳欲聋的蛮荒咆哮，令心虚之敌战栗胆寒" }
    ]
  },
  "圣武士": {
    isCaster: false,
    title: "✨ 神圣誓约 · 破邪裁决",
    slots: { current: 2, max: 2 },
    spells: [
      { name: "神圣破邪斩 (Smite Evil)", level: "裁决", school: "誓约", isSlot: true, desc: "唤起圣光裁决恶首，命中检定加入魅力加值，对恶徒伤害翻倍且无视伤害减免" },
      { name: "圣疗神迹 (Lay on Hands)", level: "神愈", school: "神圣", isSlot: true, desc: "手抚伤躯释放纯净圣光，即刻回复 1d6 生命并止血" },
      { name: "侦测邪恶光环", level: "洞悉", school: "预言", desc: "双眸洞察世间人心，精准识别周遭是否隐匿邪煞与魔道奸细" }
    ]
  },
  "游侠": {
    isCaster: false,
    title: "🏹 荒野游侠 · 猎杀印记",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "宿敌猎杀标记", level: "战法", school: "追踪", isSlot: true, desc: "锁定第一宿敌气机，对其发起的所有攻击命中与伤害检定+2" },
      { name: "远距专注狙杀", level: "射术", school: "远程", isSlot: true, desc: "凝神拉满长弓，长距射击不受射程罚值，额外附带致命穿刺" },
      { name: "疾风步 (轻灵)", level: "身法", school: "移速", desc: "步履轻盈如风，单回合移速提升 20 尺穿梭树冠险境" }
    ]
  },
  "武僧": {
    isCaster: false,
    title: "🥋 禅宗古武 · 气宗连击",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "疾风连击 (Flurry)", level: "武道", school: "近战", isSlot: true, desc: "电光石火间连环轰出双拳/棍术，单回合连续发动两次高命中打击" },
      { name: "震慑快拳 (Stunning Fist)", level: "秘孔", school: "点穴", isSlot: true, desc: "重点击中敌方气穴，敌方强韧豁免失败将陷入眩晕 1 轮无法行动" },
      { name: "禅宗吐纳守心", level: "守心", school: "防御", desc: "凝神吐纳沉稳下盘，豁免抗性全面提升" }
    ]
  },
  "吟游诗人": {
    isCaster: true,
    title: "📖 狂想诗篇 · 音律秘咒",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "激发勇气 (演奏)", level: "表演", school: "音律", isSlot: true, desc: "拨动琴弦引亢高歌，全场友方命中检定与伤害检定各获 +1 士气加值" },
      { name: "舞光术", level: "0环戏法", school: "塑能", desc: "编织四团若隐若现的灵动光球引路 (无限施展)" },
      { name: "轻风术", level: "0环戏法", school: "变化", desc: "凭空生出拂面清风，熄灭火烛或吹散烟雾 (无限施展)" },
      { name: "魅惑人类", level: "1环法术", school: "惑控", isSlot: true, desc: "言语与音律直抵心扉，化敌为友（意志豁免）" },
      { name: "脚底抹油", level: "1环法术", school: "变化", isSlot: true, desc: "足生疾风，基础陆地移速提升30尺" }
    ]
  },
  "战士": {
    isCaster: false,
    title: "⚔️ 破军战技 · 兵刃专修",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "猛力挥砍", level: "战技", school: "近战", isSlot: true, desc: "放弃少许命中，换取伤害 +2~3 点爆发撕裂" },
      { name: "顺势横扫", level: "战技", school: "群攻", isSlot: true, desc: "劈倒前敌后借势旋身对身侧第二名敌人连斩" },
      { name: "全防御架势", level: "战法", school: "防守", desc: "双手持兵全力招架格挡，单轮 AC+4" }
    ]
  },
  "游荡者": {
    isCaster: false,
    title: "🗡️ 暗影绝技 · 刺客秘传",
    slots: { current: 3, max: 3 },
    spells: [
      { name: "阴影突刺 (偷袭)", level: "绝活", school: "刺杀", isSlot: true, desc: "借助潜行或夹击，额外爆发 +1d6 致命偷袭伤害" },
      { name: "烟幕隐遁", level: "脱身", school: "遁术", isSlot: true, desc: "撒出细沙石灰迷盲敌人，无损后撤脱战" },
      { name: "轻巧翻滚", level: "身法", school: "特技", desc: "贴地翻滚穿过敌人威胁范围，免受借机攻击" }
    ]
  }
};

// 异步预载项目内置纯正 CRB 核心真典
async function loadCrbCatalog() {
  if (state.crbCatalog) return state.crbCatalog;
  try {
    const res = await fetch("/api/rules/crb_catalog");
    const data = await res.json();
    if (data && data.actions) {
      state.crbCatalog = data;
    }
  } catch (e) {
    console.warn("加载 CRB 核心典籍失败，启用前端离线应急备用:", e);
  }
  return state.crbCatalog;
}

// 秘术与战技权威规则详查与二次确认弹窗 (绝不盲点盲选，看清说明才施展)
function openActionDetailModal(spell, preset) {
  const modal = document.getElementById("modal-action-detail");
  if (!modal) return;

  const c = state.character;
  const isCaster = !!preset.isCaster;
  const crbData = state.crbCatalog?.actions ? state.crbCatalog.actions[spell.name] : null;

  const titleElem = document.getElementById("action-detail-title");
  const badgeElem = document.getElementById("action-detail-badge");
  const bodyElem = document.getElementById("action-detail-body");

  if (titleElem) {
    const orig = crbData?.original_name ? ` (${crbData.original_name})` : '';
    titleElem.innerHTML = `${isCaster ? '🔮' : '⚔️'} 【${spell.name}】${orig}`;
  }

  if (badgeElem) {
    badgeElem.textContent = crbData ? `${crbData.level} · ${crbData.school}` : `${spell.level} · ${spell.school || '招式'}`;
  }

  // 槽位消耗预警提示
  let slotTipHtml = '';
  if (spell.isSlot) {
    const slotsLeft = state.spellSlots ? state.spellSlots.current : 0;
    const slotsMax = state.spellSlots ? state.spellSlots.max : 0;
    const isOutOfSlots = (slotsLeft <= 0);
    slotTipHtml = `
      <div style="background:${isOutOfSlots ? 'rgba(229,62,62,0.2)' : 'rgba(212,175,55,0.15)'}; border:1px solid ${isOutOfSlots ? '#e53e3e' : '#d4af37'}; border-radius:6px; padding:8px 12px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.86rem; color:${isOutOfSlots ? '#feb2b2' : '#f6d365'};">
          ${isOutOfSlots ? '⚠️ 当前可用名额已耗尽，需安歇长休/冥想方可恢复！' : `⚡ 本次施展将消耗 1 次名额（当前剩余：<strong>${slotsLeft} / ${slotsMax}</strong>）`}
        </span>
      </div>
    `;
  } else {
    slotTipHtml = `
      <div style="background:rgba(72,187,120,0.15); border:1px solid #48bb78; border-radius:6px; padding:8px 12px; margin-bottom:12px;">
        <span style="font-size:0.86rem; color:#9ae6b4;">
          ✨ 此项为 0 环核心戏法 / 基础常备战法，<strong>无需消耗法术位，可无限次自由施展</strong>！
        </span>
      </div>
    `;
  }

  // 规则参数明细
  let paramsTable = '';
  if (crbData) {
    paramsTable = `
      <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:10px 14px; margin-bottom:12px; font-size:0.82rem; line-height:1.6;">
        <div style="color:#d4af37; font-weight:bold; margin-bottom:4px;">📊 《Pathfinder v2.01简体》CRB 官方正规施法参数：</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px 16px; color:#cbd5e0;">
          <div>• 施法时间：<strong>${crbData.cast_time || '1个标准动作'}</strong></div>
          <div>• 施法成分：<strong>${crbData.components || '言语, 姿势'}</strong></div>
          <div>• 施展距离：<strong>${crbData.range || '近距 (25尺+5尺/2级)'}</strong></div>
          <div>• 持续时间：<strong>${crbData.duration || '立即'}</strong></div>
          <div>• 豁免检定：<strong>${crbData.saving_throw || '无'}</strong></div>
          <div>• 法术抗力：<strong>${crbData.spell_res || '不可'}</strong></div>
        </div>
      </div>
    `;
  }

  const crbDescText = crbData?.crb_desc || spell.desc;
  const subtleText = crbData?.subtle_action || (isCaster ? "广袖轻掩，指尖暗掐灵诀，于无声无息间引动法力。" : "身随意动，敛气凝神，以迅雷之势施展绝技。");
  const intentText = crbData?.intent_summary || "探查环境、暗中自保或巧破难关，符合社会常理与人物身份。";

  if (bodyElem) {
    bodyElem.innerHTML = `
      ${slotTipHtml}
      ${paramsTable}
      <div style="background:rgba(20,24,35,0.7); border:1px solid rgba(212,175,55,0.25); border-radius:6px; padding:10px 14px; margin-bottom:12px;">
        <div style="color:#f6d365; font-weight:bold; margin-bottom:4px;">📖 核心真典官方正统规则解释：</div>
        <div style="font-size:0.85rem; color:#e2e8f0; line-height:1.6;">${crbDescText}</div>
      </div>
      <div style="background:rgba(0,0,0,0.25); border-left:3px solid #63b3ed; border-radius:4px; padding:8px 12px; margin-bottom:12px;">
        <div style="color:#63b3ed; font-weight:bold; font-size:0.85rem; margin-bottom:2px;">🎭 凡俗/深宫日常情境动作示范：</div>
        <div style="font-size:0.84rem; color:#cbd5e0; line-height:1.5;">${subtleText}</div>
      </div>
      <div style="background:rgba(0,0,0,0.25); border-left:3px solid #48bb78; border-radius:4px; padding:8px 12px;">
        <div style="color:#48bb78; font-weight:bold; font-size:0.85rem; margin-bottom:2px;">🎯 预期核心意图与达成目的：</div>
        <div style="font-size:0.84rem; color:#cbd5e0; line-height:1.5;">${intentText}</div>
      </div>
    `;
  }

  modal.classList.remove("hidden");
  if (typeof audio !== "undefined" && audio.playAlert) audio.playAlert();

  const btnClose = document.getElementById("btn-close-action-detail");
  const btnCancel = document.getElementById("btn-cancel-action-execute");
  const btnConfirm = document.getElementById("btn-confirm-action-execute");

  const closeModal = () => modal.classList.add("hidden");
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;

  if (btnConfirm) {
    btnConfirm.onclick = () => {
      if (spell.isSlot) {
        if (state.spellSlots.current <= 0) {
          alert(`${isCaster ? '今日法术位已用尽，需安歇冥想方可恢复！' : '当前战气已耗尽，需稍作喘息！'}`);
          return;
        }
        state.spellSlots.current -= 1;
        renderSpellsCard();
      }

      closeModal();

      // 触发酷炫灵光粒子动效
      if (typeof ParticleFX !== "undefined") {
        ParticleFX.burst(isCaster ? "magic" : "gold", 70);
      }

      const actionText = `【行者程序权威动作 · CRB 核心真典】：我（${c?.profile?.name || '行者'}）遵循《Pathfinder 核心规则书 (CRB)》施展【${spell.name}】（${spell.level}）。\n【生活化隐秘动作】：${subtleText}\n【行动意图】：${intentText}\n【CRB 判定基准】：${crbDescText}（请司命据此严格遵循规则与人际常理展开真实文学推演）`;
      sendPlayerAction(actionText);
    };
  }
}

function renderSpellsCard() {
  const container = document.getElementById("spells-list-container");
  const slotsBadge = document.getElementById("spell-slots-badge");
  if (!container) return;
  const c = state.character;
  if (!c) return;

  const className = c.profile?.class || "战士";
  const preset = CLASS_SPELL_PRESETS[className] || CLASS_SPELL_PRESETS["战士"];

  // 初始化槽位状态
  if (!state.spellSlots || state.spellSlots.className !== className) {
    state.spellSlots = { current: preset.slots.current, max: preset.slots.max, className: className };
  }

  if (slotsBadge) {
    if (preset.isCaster) {
      slotsBadge.textContent = `1环法术位: ${state.spellSlots.current}/${state.spellSlots.max}`;
      slotsBadge.className = state.spellSlots.current > 0 ? "badge badge-gold" : "badge badge-dim";
    } else {
      slotsBadge.textContent = `战气点数: ${state.spellSlots.current}/${state.spellSlots.max}`;
      slotsBadge.className = "badge badge-gold";
    }
  }

  container.innerHTML = "";
  preset.spells.forEach(spell => {
    const row = document.createElement("div");
    row.className = "spell-item-row";
    row.style.cursor = "pointer";
    row.title = "点击查阅正统规则与意图，二次确认后施展";
    row.innerHTML = `
      <div class="spell-info">
        <div class="spell-name-row">
          <span class="spell-name">${spell.name}</span>
          <span class="spell-level-badge">${spell.level}</span>
        </div>
        <div class="spell-desc">${spell.desc}</div>
      </div>
      <button class="btn btn-cast-spell" title="查阅说明并确认施展">📖 详查 · 施展</button>
    `;

    // 整行以及按钮均挂载详查弹窗，绝不直接盲发动作
    row.onclick = () => openActionDetailModal(spell, preset);
    const castBtn = row.querySelector(".btn-cast-spell");
    if (castBtn) {
      castBtn.onclick = (e) => {
        e.stopPropagation();
        openActionDetailModal(spell, preset);
      };
    }

    container.appendChild(row);
  });
}

function initInventoryModal() {
  const modal = document.getElementById("modal-inventory");
  const btnOpen = document.getElementById("btn-open-inventory");
  const cardSummary = document.getElementById("card-inventory-summary");
  const btnClose = document.getElementById("btn-close-inventory");
  const btnDone = document.getElementById("btn-done-inventory");

  if (!modal) return;

  const openModal = () => {
    modal.classList.remove("hidden");
    renderInventoryModal();
  };

  if (btnOpen) btnOpen.onclick = (e) => { e.stopPropagation(); openModal(); };
  if (cardSummary) cardSummary.onclick = openModal;
  if (btnClose) btnClose.onclick = () => modal.classList.add("hidden");
  if (btnDone) btnDone.onclick = () => modal.classList.add("hidden");
}

function renderInventoryModal() {
  const c = state.character;
  if (!c) return;

  // 资财与负重
  const walletElem = document.getElementById("inv-modal-wallet");
  if (walletElem) walletElem.textContent = `${c.currency || 0} GP`;

  const weightBadge = document.getElementById("inv-weight-badge");
  if (weightBadge && c.load) {
    weightBadge.textContent = `负重: ${c.load.status} (${c.load.current}/${c.load.lightMax} 磅)`;
  }

  // 穿戴槽位
  const wName = document.getElementById("equipped-weapon-name");
  const wStats = document.getElementById("equipped-weapon-stats");
  if (wName && c.weapon) {
    wName.textContent = c.weapon.name || "长剑";
    wStats.textContent = `${c.weapon.damageDice || '1d8'} ${c.weapon.damageType || '挥砍'} · 暴击 ${c.weapon.threatRange ? c.weapon.threatRange.join('-') : '19-20'}/x${c.weapon.critMultiplier || 2} · 命中加值 +${c.weapon.attackBonus || 3}`;
  }

  const aName = document.getElementById("equipped-armor-name");
  const aStats = document.getElementById("equipped-armor-stats");
  const armorItem = (c.inventory || []).find(it => it.category === "armor");
  if (aName) {
    aName.textContent = armorItem ? armorItem.name : "常服 / 无甲";
    aStats.textContent = armorItem ? (armorItem.desc || `AC+${c.ac?.armor || 4}, 穿甲罚值 ${c.ac?.acp || -2}`) : "未装备防具，基础闪避完全依赖敏捷";
  }

  // 道具明细列表
  const listContainer = document.getElementById("inv-items-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  const items = c.inventory || [];
  if (items.length === 0) {
    listContainer.innerHTML = `<div class="empty-tip">行囊内空无一物，可点击左栏资财前往【市集货栈】采办！</div>`;
    return;
  }

  items.forEach(it => {
    const row = document.createElement("div");
    row.className = "inv-item-row";

    const isPotionOrConsumable = it.category === "potion" || it.consumable || /药|水|绷带|干粮|卷轴|草|酒/.test(it.name);
    const isEquipable = it.category === "weapon" || it.category === "armor" || /剑|刀|枪|弓|斧|杖|锤|刃|弩|甲|袍|衫|铠/.test(it.name);
    const isEquipped = !!it.equipped;
    const qty = it.qty || 1;

    let actionBtnHtml = `<span class="dim-text">常驻携带</span>`;
    if (isPotionOrConsumable) {
      actionBtnHtml = `<button class="btn btn-use-item" data-item="${it.name}">🎯 声明使用</button>`;
    } else if (isEquipable) {
      actionBtnHtml = isEquipped
        ? `<button class="btn btn-equip-toggle equipped" data-item="${it.name}">🛡️ 已佩戴</button>`
        : `<button class="btn btn-equip-toggle" data-item="${it.name}">⚔️ 装配切换</button>`;
    }

    row.innerHTML = `
      <div class="inv-item-main">
        <span class="inv-item-name">${it.name} ${isEquipped ? '<span style="color:#d4af37;font-size:11px;">[佩戴中]</span>' : ''}</span>
        <span class="inv-item-qty">x${qty}</span>
        <span class="inv-item-weight">${Math.round((it.weight || 1) * qty * 10) / 10} 磅</span>
      </div>
      <div class="inv-item-actions">
        ${actionBtnHtml}
      </div>
    `;

    if (isPotionOrConsumable) {
      const btn = row.querySelector(".btn-use-item");
      if (btn) btn.onclick = () => triggerUseItemAction(it);
    } else if (isEquipable) {
      const btn = row.querySelector(".btn-equip-toggle");
      if (btn) btn.onclick = () => toggleEquipItem(it);
    }

    listContainer.appendChild(row);
  });
}

// 动态换装逻辑：实时联动主手兵刃与护甲，更新 AC、命中与 ACP
function toggleEquipItem(item) {
  const c = state.character;
  if (!c || !c.inventory) return;

  if (item.category === "weapon" || /剑|刀|枪|弓|斧|杖|锤|刃|弩/.test(item.name)) {
    const isNowEquipped = !item.equipped;
    c.inventory.forEach(i => {
      if (i.category === "weapon" || /剑|刀|枪|弓|斧|杖|锤|刃|弩/.test(i.name)) {
        i.equipped = false;
      }
    });
    item.equipped = isNowEquipped;

    const strMod = calcMod(c.abilities.STR);
    if (isNowEquipped) {
      let dice = "1d8";
      let type = "挥砍";
      let range = [19, 20];
      let mult = 2;
      if (/长剑|太刀/.test(item.name)) { dice = "1d8"; type = "挥砍"; range = [19, 20]; mult = 2; }
      else if (/巨剑|大剑/.test(item.name)) { dice = "2d6"; type = "挥砍"; range = [19, 20]; mult = 2; }
      else if (/短剑|匕首/.test(item.name)) { dice = "1d4"; type = "穿刺"; range = [19, 20]; mult = 2; }
      else if (/长弓|短弓|轻弩|重弩/.test(item.name)) { dice = "1d8"; type = "穿刺"; range = [20]; mult = 3; }
      else if (/战斧|手斧/.test(item.name)) { dice = "1d8"; type = "挥砍"; range = [20]; mult = 3; }
      else if (/重锤|铁棍|木杖/.test(item.name)) { dice = "1d6"; type = "钝击"; range = [20]; mult = 2; }

      c.weapon = {
        name: item.name,
        threatRange: range,
        critMultiplier: mult,
        damageDice: dice,
        damageType: type,
        attackBonus: c.bab + strMod
      };
    } else {
      c.weapon = {
        name: "徒手空拳",
        threatRange: [20],
        critMultiplier: 2,
        damageDice: "1d3",
        damageType: "钝击",
        attackBonus: c.bab + strMod
      };
    }
  } else if (item.category === "armor" || /甲|袍|衫|铠|盾/.test(item.name)) {
    const isNowEquipped = !item.equipped;
    c.inventory.forEach(i => {
      if (i.category === "armor" || /甲|袍|衫|铠/.test(i.name)) {
        i.equipped = false;
      }
    });
    item.equipped = isNowEquipped;

    let armorBonus = 0;
    let acp = 0;
    let maxDex = 99;

    if (isNowEquipped) {
      if (/链甲衫/.test(item.name)) { armorBonus = 4; acp = -1; maxDex = 4; }
      else if (/皮甲|皮袍/.test(item.name)) { armorBonus = 2; acp = 0; maxDex = 6; }
      else if (/板甲|全身甲|鳞甲/.test(item.name)) { armorBonus = 6; acp = -4; maxDex = 2; }
      else { armorBonus = 3; acp = -1; maxDex = 4; }
    }

    const dexMod = calcMod(c.abilities.DEX);
    const appliedDex = Math.min(dexMod, maxDex);
    c.ac.armor = armorBonus;
    c.ac.acp = acp;
    c.ac.maxDex = maxDex;
    c.ac.dex = appliedDex;
    c.ac.total = 10 + armorBonus + (c.ac.shield || 0) + appliedDex;
    c.ac.touch = 10 + appliedDex;
    c.ac.flatFooted = 10 + armorBonus + (c.ac.shield || 0);
  }

  audio.playAlert();
  renderTacticalPanel();
  renderInventoryModal();
}

function triggerUseItemAction(item) {
  const modal = document.getElementById("modal-inventory");
  if (modal) modal.classList.add("hidden");

  // 记录待扣除的消耗道具
  state.pendingUsedItem = item.name;

  // 构造生动的对白动作填入输入框
  const inputElem = document.getElementById("input-action");
  if (inputElem) {
    let actionStr = "";
    if (/药水|灵液|露|散|丸/.test(item.name)) {
      actionStr = `我从随身行囊中取出【${item.name}】，拔开瓶塞一饮而尽！`;
    } else if (/绷带|急救|草/.test(item.name)) {
      actionStr = `我迅速从行囊中翻出【${item.name}】，利落地处理伤口并包扎止血！`;
    } else {
      actionStr = `我迅速从行囊中取出【${item.name}】，立即展开使用！`;
    }
    inputElem.value = actionStr;
    inputElem.focus();
  }

  audio.playAlert();
}

function consumeInventoryItem(itemName) {
  const c = state.character;
  if (!c || !c.inventory) return;

  const itemIdx = c.inventory.findIndex(it => it.name === itemName);
  if (itemIdx === -1) return;

  const it = c.inventory[itemIdx];
  const itemWeight = it.weight || 1;

  if (it.qty && it.qty > 1) {
    it.qty -= 1;
  } else {
    c.inventory.splice(itemIdx, 1);
  }

  // 扣减当前负重
  if (c.load) {
    c.load.current = Math.max(0, Math.round(((c.load.current || 0) - itemWeight) * 10) / 10);
    const limits = getLoadThresholds(c.abilities.STR, "中型");
    if (c.load.current <= limits.light) c.load.status = "轻载";
    else if (c.load.current <= limits.medium) c.load.status = "中载";
    else c.load.status = "重载";
  }

  renderTacticalPanel();
  renderInventorySummaryCard();
  saveGameToServer();
}

async function saveGameToServer() {
  try {
    const notesElem = document.getElementById("player-notes");
    const payload = {
      data: {
        character: state.character,
        theme: state.theme,
        history: state.history,
        time_of_day: state.time_of_day,
        npc_roster: state.npc_roster,
        chronicles: state.chronicles,
        campaignArc: state.campaignArc,
        notes: notesElem ? notesElem.value : (localStorage.getItem("pf1e_player_notes") || "")
      }
    };
    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("自动存档失败:", e);
  }
}

async function loadGameFromServer() {
  try {
    const res = await fetch("/api/load");
    if (!res.ok) return;
    const json = await res.json();
    if (json.data) {
      if (json.data.character) state.character = json.data.character;
      if (json.data.history) state.history = json.data.history;
      if (json.data.time_of_day) {
        state.time_of_day = json.data.time_of_day;
        updateTimeDisplay(state.time_of_day);
      }
      if (json.data.npc_roster) {
        state.npc_roster = json.data.npc_roster;
        updateNpcCountBadge();
      }
      if (json.data.chronicles) state.chronicles = json.data.chronicles;
      if (json.data.campaignArc) state.campaignArc = json.data.campaignArc;

      if (json.data.notes) {
        const notesElem = document.getElementById("player-notes");
        if (notesElem) notesElem.value = json.data.notes;
        localStorage.setItem("pf1e_player_notes", json.data.notes);
      }
      if (json.data.theme) {
        state.theme = json.data.theme;
        const subTitleElem = document.getElementById("campaign-theme-subtitle");
        if (subTitleElem) subTitleElem.textContent = `${state.theme} · 全题材通用叙事引擎`;
        const themeDescElem = document.getElementById("current-theme-desc");
        if (themeDescElem) themeDescElem.textContent = state.theme;
      }

      renderTacticalPanel();
      // 重新渲染中栏历史
      const stream = document.getElementById("narrative-stream");
      stream.innerHTML = "";
      state.history.forEach(item => {
        appendNarrativeEntry(item.role, item.content);
      });
    }
  } catch (e) {
    console.warn("加载历史存档失败或无历史存档:", e);
  }
}


// =========================================================
// 10. PF1e 5 尺战术战棋沙盘控制器 (Tactical Grid Combat)
// =========================================================

const CombatGrid = {
  panel: null,
  board: null,
  meter: null,
  gridSize: 10, // 10x10 网格 (每格 5 尺)

  // 战棋沙盘当前状态
  state: {
    player: { id: "player", name: "我", x: 2, y: 5, speedFt: 30 },
    enemies: [
      { id: "enemy_1", name: "刺客", x: 7, y: 5, hp: 12, maxHp: 12 }
    ],
    covers: [
      { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 5, y: 4 }
    ],
    selectedPawn: null
  },

  init() {
    this.panel = document.getElementById("combat-grid-panel");
    this.board = document.getElementById("tactical-board");
    this.meter = document.getElementById("grid-distance-meter");

    if (!this.panel || !this.board) return;

    const btnClose = document.getElementById("btn-close-grid");
    if (btnClose) btnClose.onclick = () => this.hide();

    const btnToggle = document.getElementById("btn-toggle-grid");
    if (btnToggle) btnToggle.onclick = () => this.toggle();

    const btnReset = document.getElementById("btn-reset-grid-pos");
    if (btnReset) btnReset.onclick = () => this.resetPositions();

    this.render();
  },

  show() {
    if (this.panel) {
      this.panel.classList.remove("hidden");
      this.render();
    }
  },

  hide() {
    if (this.panel) this.panel.classList.add("hidden");
  },

  toggle() {
    if (!this.panel) return;
    this.panel.classList.toggle("hidden");
    if (!this.panel.classList.contains("hidden")) {
      this.render();
    }
  },

  // 跑团 V1.0：全面转向纯文字智斗与技能对抗，不再切入 5 尺战棋沙盘
  startCombat(combatData) {
    this.initOrUpdate(combatData);
    // 彻底静默战棋网格面板展示，仅保留数据支持
    this.hide();
    audio.playAlert();
  },

  // 战斗回合更新 (走位与气血实时同步)
  updateCombat(updateData) {
    if (updateData.player) {
      if (typeof updateData.player.x === "number") this.state.player.x = updateData.player.x;
      if (typeof updateData.player.y === "number") this.state.player.y = updateData.player.y;
    }
    if (updateData.enemies && Array.isArray(updateData.enemies)) {
      updateData.enemies.forEach(upEnemy => {
        const existing = this.state.enemies.find(e => e.name === upEnemy.name || e.id === upEnemy.id);
        if (existing) {
          if (typeof upEnemy.x === "number") existing.x = upEnemy.x;
          if (typeof upEnemy.y === "number") existing.y = upEnemy.y;
          if (typeof upEnemy.hp === "number") existing.hp = upEnemy.hp;
          if (typeof upEnemy.maxHp === "number") existing.maxHp = upEnemy.maxHp;
        } else {
          this.state.enemies.push({
            id: `enemy_${this.state.enemies.length + 1}`,
            name: upEnemy.name || "敌人",
            x: upEnemy.x ?? 7,
            y: upEnemy.y ?? 5,
            hp: upEnemy.hp ?? 10,
            maxHp: upEnemy.maxHp ?? 10
          });
        }
      });
    }
    this.render();
    this.calcInitialDistance();
  },

  // 战斗结束 (威胁平息，自动收起沙盘)
  endCombat() {
    this.updateMeter("✨ 【战局平息】：威胁已化解，沙盘已收起……");
    audio.playAlert();
    setTimeout(() => {
      this.hide();
    }, 1800);
  },

  resetPositions() {
    this.state.player.x = 2;
    this.state.player.y = 5;
    if (this.state.enemies[0]) {
      this.state.enemies[0].x = 7;
      this.state.enemies[0].y = 5;
    }
    this.state.selectedPawn = null;
    this.render();
    this.updateMeter("已复位站位：我与前方目标相距 25 尺 (5 格)");
  },

  initOrUpdate(combatData) {
    if (combatData.player) {
      this.state.player.x = combatData.player.x ?? 2;
      this.state.player.y = combatData.player.y ?? 5;
      if (combatData.player.name) this.state.player.name = combatData.player.name;
    }
    if (combatData.enemies && Array.isArray(combatData.enemies)) {
      this.state.enemies = combatData.enemies.map((e, idx) => ({
        id: `enemy_${idx + 1}`,
        name: e.name || `敌方${idx + 1}`,
        x: e.x ?? (7 + idx),
        y: e.y ?? 5,
        hp: e.hp || 10,
        maxHp: e.maxHp || 10
      }));
    }
    this.render();
    this.calcInitialDistance();
  },

  calcInitialDistance() {
    if (!this.state.enemies || this.state.enemies.length === 0) return;
    const p = this.state.player;
    const e = this.state.enemies[0];
    const gridDist = Math.max(Math.abs(p.x - e.x), Math.abs(p.y - e.y));
    const ftDist = gridDist * 5;
    this.updateMeter(`战术测距：我与 [${e.name}] 相距 ${ftDist} 尺 (${gridDist} 格) · HP: ${e.hp}/${e.maxHp}`);
  },

  updateMeter(text) {
    if (this.meter) {
      this.meter.innerHTML = `<span>${text}</span>`;
    }
  },

  render() {
    if (!this.board) return;
    this.board.innerHTML = "";

    const p = this.state.player;
    const maxMoveGrids = Math.floor(p.speedFt / 5); // 30尺 = 6格

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.x = x;
        cell.dataset.y = y;

        // 障碍掩体
        const isCover = this.state.covers.some(c => c.x === x && c.y === y);
        if (isCover) {
          cell.classList.add("cell-cover");
          cell.title = `障碍掩体 (坐标: ${x}, ${y})`;
        }

        // 若选中了玩家，标示可走位范围
        if (this.state.selectedPawn === "player" && !isCover) {
          const dist = Math.max(Math.abs(p.x - x), Math.abs(p.y - y));
          if (dist <= maxMoveGrids) {
            cell.classList.add("cell-reachable");
            cell.title = `可走位：需消耗 ${dist * 5} 尺移动力`;
          }
        }

        // 放置玩家棋子
        if (p.x === x && p.y === y) {
          const pawn = document.createElement("div");
          pawn.className = "grid-pawn pawn-player";
          pawn.textContent = "我";
          pawn.title = "【我】(点击高亮 30 尺移速范围)";
          pawn.onclick = (ev) => {
            ev.stopPropagation();
            this.handlePawnClick("player");
          };
          cell.appendChild(pawn);
        }

        // 放置敌方棋子
        this.state.enemies.forEach(enemy => {
          if (enemy.x === x && enemy.y === y) {
            const pawn = document.createElement("div");
            pawn.className = "grid-pawn pawn-enemy";
            pawn.textContent = enemy.name.slice(0, 1) || "敌";
            pawn.title = `【${enemy.name}】(HP: ${enemy.hp}/${enemy.maxHp})`;
            pawn.onclick = (ev) => {
              ev.stopPropagation();
              this.handleEnemyClick(enemy);
            };
            cell.appendChild(pawn);
          }
        });

        cell.onclick = () => this.handleCellClick(x, y, isCover);
        this.board.appendChild(cell);
      }
    }
  },

  handlePawnClick(id) {
    if (this.state.selectedPawn === id) {
      this.state.selectedPawn = null;
      this.updateMeter("已取消选中。");
    } else {
      this.state.selectedPawn = id;
      this.updateMeter("已选中【我】：半透明高亮格为一轮 30 尺（6 格）标准移速，点击高亮格可进行走位。");
    }
    this.render();
  },

  handleEnemyClick(enemy) {
    const p = this.state.player;
    const gridDist = Math.max(Math.abs(p.x - enemy.x), Math.abs(p.y - enemy.y));
    const ftDist = gridDist * 5;
    let desc = `与 [${enemy.name}] 距离 ${ftDist} 尺 (${gridDist} 格)`;
    if (gridDist <= 1) {
      desc += " —— 【近身接战中（近战触及 5 尺）】";
    } else if (gridDist <= 6) {
      desc += " —— 【冲锋攻击或一轮移动可达】";
    } else {
      desc += " —— 【需消耗全力奔跑或属于远程射程】";
    }
    this.updateMeter(desc);
  },

  handleCellClick(x, y, isCover) {
    if (isCover) return;
    if (this.state.selectedPawn === "player") {
      const p = this.state.player;
      const maxMoveGrids = Math.floor(p.speedFt / 5);
      const dist = Math.max(Math.abs(p.x - x), Math.abs(p.y - y));
      if (dist <= maxMoveGrids) {
        p.x = x;
        p.y = y;
        this.state.selectedPawn = null;
        this.render();

        if (this.state.enemies[0]) {
          const e = this.state.enemies[0];
          const newDist = Math.max(Math.abs(p.x - e.x), Math.abs(p.y - e.y)) * 5;
          this.updateMeter(`【战术走位】：你移动了 ${dist * 5} 尺，现与 [${e.name}] 相距 ${newDist} 尺。可直接在下方打字声明行动！`);
        } else {
          this.updateMeter(`【战术走位】：你移动了 ${dist * 5} 尺至坐标 (${x}, ${y})。`);
        }
      }
    }
  }
};


// =========================================================
// 11. 开启新故事与世界观重置 (New Story Controller)
// =========================================================

function initNewStoryButton() {
  const btn = document.getElementById("btn-new-story");
  if (!btn) return;

  btn.onclick = async () => {
    const confirmed = confirm("确定要开启一段全新的故事吗？\n\n当前战役历史将被清空，您可以重新输入任何题材（如古代后宫宠妃、高三考清华、现代底层创业、地下党谍战、餐馆开业等），由司命为您量身推演开局切入点！");
    if (!confirmed) return;

    state.history = [];
    state.theme = "待行者定夺……";
    state.quest = "";
    state.hasStartedFirstAct = false;
    state.pendingCheck = null;

    // 彻底清除上一局结缘人物谱、编年史、主线暗络与时间状态，绝不串场
    state.npc_roster = [];
    updateNpcCountBadge();
    renderNpcRosterModal();

    state.chronicles = [];
    state.campaignArc = null;
    updateTimeDisplay("晨光熹微 / 07:30");

    const stream = document.getElementById("narrative-stream");
    stream.innerHTML = "";

    const subTitleElem = document.getElementById("campaign-theme-subtitle");
    if (subTitleElem) subTitleElem.textContent = "全自由题材叙事引擎";
    const themeDescElem = document.getElementById("current-theme-desc");
    if (themeDescElem) themeDescElem.textContent = "待定夺……";


    const charName = state.character?.profile?.name || "行者";
    const newStoryIntro = `【万象新启 · 乾坤重开】\n\n旧岁已逝，风云重开。当前命格：【${charName}】。\n\n请问这次你想体验怎样的人生或故事？（无论古代后宫、现代高考、底层打工经商、还是谍战末世，皆可直接打字告知你的题材背景设想，若有长期追求可说“主线是……”，由司命为你定制专属切入点！）\n\n你接下来要干嘛？`;
    appendNarrativeEntry("assistant", newStoryIntro);

    CombatGrid.hide();
    hidePendingCheckBanner();

    await saveGameToServer();
  };
}


// =========================================================
// 12. 自主掷骰 · 命途加值自选台 (Manual Roll Controller)
// =========================================================

function initManualRollModal() {
  const modal = document.getElementById("modal-manual-roll");
  const btnOpen = document.getElementById("btn-open-manual-roll");
  const btnClose = document.getElementById("btn-close-manual-roll");
  const btnCancel = document.getElementById("btn-cancel-manual-roll");

  if (!modal || !btnOpen) return;

  btnOpen.onclick = () => {
    renderManualRollGrid();
    modal.classList.remove("hidden");
  };

  const closeModal = () => modal.classList.add("hidden");
  if (btnClose) btnClose.onclick = closeModal;
  if (btnCancel) btnCancel.onclick = closeModal;
}

function renderManualRollGrid() {
  const c = state.character;
  if (!c) return;

  // 1. 三大豁免
  const savesContainer = document.getElementById("manual-roll-saves");
  if (savesContainer) {
    const saveItems = [
      { name: "强韧豁免", key: "强韧", icon: "🛡️" },
      { name: "反射豁免", key: "反射", icon: "⚡" },
      { name: "意志豁免", key: "意志", icon: "🧘" }
    ];
    savesContainer.innerHTML = saveItems.map(item => {
      const info = getCheckBonusDetail(item.key);
      return `
        <button class="btn-manual-roll-item" data-type="${item.name}" data-key="${item.key}" style="background: rgba(30,35,48,0.9); border: 1px solid rgba(212,175,55,0.35); border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; color: #fff; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f6d365; font-size: 0.88rem;">${item.icon} ${item.name}</strong>
            <span style="font-weight: bold; color: ${info.bonus >= 0 ? '#48bb78' : '#f56565'}; font-size: 0.95rem;">${fmtMod(info.bonus)}</span>
          </div>
          <div style="font-size: 0.72rem; color: #a0aec0; margin-top: 3px;">${info.detail}</div>
        </button>
      `;
    }).join("");
  }

  // 2. 战系杀伐
  const combatContainer = document.getElementById("manual-roll-combat");
  if (combatContainer) {
    const combatItems = [
      { name: "近战兵刃挥斩", key: "命中", icon: "⚔️" },
      { name: "迅捷先攻抢占", key: "先攻", icon: "🌪️" },
      { name: "战系机动 (CMB)", key: "CMB", icon: "🦶" }
    ];
    combatContainer.innerHTML = combatItems.map(item => {
      const info = getCheckBonusDetail(item.key);
      return `
        <button class="btn-manual-roll-item" data-type="${item.name}" data-key="${item.key}" style="background: rgba(30,35,48,0.9); border: 1px solid rgba(212,175,55,0.35); border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; color: #fff; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f6d365; font-size: 0.88rem;">${item.icon} ${item.name}</strong>
            <span style="font-weight: bold; color: ${info.bonus >= 0 ? '#48bb78' : '#f56565'}; font-size: 0.95rem;">${fmtMod(info.bonus)}</span>
          </div>
          <div style="font-size: 0.72rem; color: #a0aec0; margin-top: 3px;">${info.detail}</div>
        </button>
      `;
    }).join("");
  }

  // 3. 常用探险技能
  const skillsContainer = document.getElementById("manual-roll-skills");
  if (skillsContainer) {
    const popularSkills = [
      { name: "察觉", icon: "👁️" },
      { name: "隐匿", icon: "🐾" },
      { name: "察言观色", icon: "🔍" },
      { name: "解除装置", icon: "🗝️" },
      { name: "交涉", icon: "🗣️" },
      { name: "欺骗", icon: "🎭" },
      { name: "威吓", icon: "😠" },
      { name: "杂技", icon: "🤸" },
      { name: "攀爬", icon: "🧗" },
      { name: "医疗", icon: "🩹" },
      { name: "生存", icon: "🏕️" },
      { name: "知识(神秘)", icon: "🔮" }
    ];
    skillsContainer.innerHTML = popularSkills.map(item => {
      const info = getCheckBonusDetail(item.name);
      return `
        <button class="btn-manual-roll-item" data-type="${item.name}检定" data-key="${item.name}" style="background: rgba(30,35,48,0.9); border: 1px solid rgba(212,175,55,0.35); border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; color: #fff; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f6d365; font-size: 0.88rem;">${item.icon} ${item.name}</strong>
            <span style="font-weight: bold; color: ${info.bonus >= 0 ? '#48bb78' : '#f56565'}; font-size: 0.95rem;">${fmtMod(info.bonus)}</span>
          </div>
          <div style="font-size: 0.72rem; color: #a0aec0; margin-top: 3px;">${info.detail}</div>
        </button>
      `;
    }).join("");
  }

  // 4. 六维属性与纯运
  const abilitiesContainer = document.getElementById("manual-roll-abilities");
  if (abilitiesContainer) {
    const abils = [
      { name: "力量对抗", key: "力量", icon: "💪" },
      { name: "敏捷对抗", key: "敏捷", icon: "🏃" },
      { name: "体质对抗", key: "体质", icon: "❤️" },
      { name: "智力对抗", key: "智力", icon: "🧠" },
      { name: "感知对抗", key: "感知", icon: "🧘" },
      { name: "魅力对抗", key: "魅力", icon: "✨" },
      { name: "纯天运 D20", key: "纯运", icon: "🎲" }
    ];
    abilitiesContainer.innerHTML = abils.map(item => {
      const info = item.key === "纯运" ? { bonus: 0, detail: "无修正纯骰目" } : getCheckBonusDetail(item.key);
      return `
        <button class="btn-manual-roll-item" data-type="${item.name}" data-key="${item.key}" style="background: rgba(30,35,48,0.9); border: 1px solid rgba(212,175,55,0.35); border-radius: 6px; padding: 8px 12px; text-align: left; cursor: pointer; color: #fff; transition: all 0.2s;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #f6d365; font-size: 0.86rem;">${item.icon} ${item.name}</strong>
            <span style="font-weight: bold; color: ${info.bonus >= 0 ? '#48bb78' : '#f56565'}; font-size: 0.92rem;">${fmtMod(info.bonus)}</span>
          </div>
          <div style="font-size: 0.7rem; color: #a0aec0; margin-top: 3px;">${info.detail}</div>
        </button>
      `;
    }).join("");
  }

  // 绑定所有按钮的自主投骰事件
  document.querySelectorAll(".btn-manual-roll-item").forEach(btn => {
    btn.onclick = () => {
      const type = btn.getAttribute("data-type");
      const key = btn.getAttribute("data-key");
      const info = key === "纯运" ? { bonus: 0, detail: "纯净天数" } : getCheckBonusDetail(key);

      const modal = document.getElementById("modal-manual-roll");
      if (modal) modal.classList.add("hidden");

      // 执行拟真 3D 物理投骰
      performDiceRoll(type, info.bonus, 12, (result) => {
        const sendText = `【玩家自主发起 · ${type}】：投出 D20 (${result.d20}) + 修正总加值 (${fmtMod(result.bonus)}) [${info.detail}] = 终值 ${result.total}（请司命依此命数裁决判定后果并推进剧情）`;
        sendPlayerAction(sendText);
      });
    };
  });
}


// =========================================================
// 12.5 客栈长休与破境晋级系统 (Rest & Level Up)
// =========================================================

function initRestAndLevelUp() {
  const btnRest = document.getElementById("btn-inn-rest");
  const modalLevelUp = document.getElementById("modal-level-up");
  const btnRoll = document.getElementById("btn-lvl-roll-hp") || document.getElementById("btn-levelup-roll");
  const btnAvg = document.getElementById("btn-lvl-avg-hp") || document.getElementById("btn-levelup-avg");
  const btnClose = document.getElementById("btn-close-levelup");

  if (btnRest) {
    btnRest.onclick = () => {
      handleInnRestAction();
    };
  }

  if (btnRoll) {
    btnRoll.onclick = () => {
      applyLevelUp("roll");
    };
  }

  if (btnAvg) {
    btnAvg.onclick = () => {
      applyLevelUp("avg");
    };
  }

  if (btnClose && modalLevelUp) {
    btnClose.onclick = () => {
      modalLevelUp.classList.add("hidden");
    };
  }
}

// =========================================================
// 12.1 言行双枢 · 快捷对白与动作输入控制器 (Speech & Action Modals)
// =========================================================

function initSpeechAndActionModals() {
  const inputAction = document.getElementById("input-action");

  // --- 1. 快捷对白模态框 (说) ---
  const speechModal = document.getElementById("modal-speech-input");
  const btnOpenSpeech = document.getElementById("btn-open-speech-modal");
  const btnCloseSpeech = document.getElementById("btn-close-speech-modal");
  const btnCancelSpeech = document.getElementById("btn-cancel-speech");
  const btnAppendSpeech = document.getElementById("btn-append-speech");
  const btnSendSpeechDirect = document.getElementById("btn-send-speech-direct");
  const inputSpeechText = document.getElementById("input-speech-text");
  const toneBtns = document.querySelectorAll(".speech-tone-btn");

  let currentTone = "说";

  toneBtns.forEach(btn => {
    btn.onclick = () => {
      toneBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTone = btn.getAttribute("data-tone") || "说";
    };
  });

  const openSpeechModal = () => {
    if (!speechModal) return;
    speechModal.classList.remove("hidden");
    if (inputSpeechText) {
      inputSpeechText.value = "";
      setTimeout(() => inputSpeechText.focus(), 100);
    }
  };

  const closeSpeechModal = () => {
    if (speechModal) speechModal.classList.add("hidden");
  };

  if (btnOpenSpeech) btnOpenSpeech.onclick = openSpeechModal;
  if (btnCloseSpeech) btnCloseSpeech.onclick = closeSpeechModal;
  if (btnCancelSpeech) btnCancelSpeech.onclick = closeSpeechModal;

  const getFormattedSpeech = () => {
    if (!inputSpeechText) return "";
    const raw = inputSpeechText.value.trim();
    if (!raw) return "";
    const clean = raw.replace(/^["“'「]+|["”'」]+$/g, ''); // 清除多余引号
    if (currentTone === "说") {
      return `我说：“${clean}”`;
    } else {
      return `我${currentTone}：“${clean}”`;
    }
  };

  // 填入输入框（方便边说边做）
  if (btnAppendSpeech) {
    btnAppendSpeech.onclick = () => {
      const formatted = getFormattedSpeech();
      if (!formatted) return;
      closeSpeechModal();

      if (inputAction) {
        const cur = inputAction.value.trim();
        if (cur) {
          inputAction.value = `${cur} ${formatted}`;
        } else {
          inputAction.value = formatted;
        }
        inputAction.focus();
        inputAction.setSelectionRange(inputAction.value.length, inputAction.value.length);
      }
    };
  }

  // 直接发送
  if (btnSendSpeechDirect) {
    btnSendSpeechDirect.onclick = () => {
      const formatted = getFormattedSpeech();
      if (!formatted) return;
      closeSpeechModal();

      let finalText = formatted;
      if (inputAction && inputAction.value.trim()) {
        finalText = `${inputAction.value.trim()} ${formatted}`;
        inputAction.value = "";
      }
      sendPlayerAction(finalText);
    };
  }

  // 支持在对白输入框按 Enter 快捷填入
  if (inputSpeechText) {
    inputSpeechText.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (btnAppendSpeech) btnAppendSpeech.click();
      }
    };
  }

  // --- 2. 快捷举止动作模态框 (动作) ---
  const actionModal = document.getElementById("modal-action-input");
  const btnOpenAction = document.getElementById("btn-open-action-modal");
  const btnCloseAction = document.getElementById("btn-close-action-modal");
  const btnCancelAction = document.getElementById("btn-cancel-action-modal");
  const btnAppendAction = document.getElementById("btn-append-action");
  const btnSendActionDirect = document.getElementById("btn-send-action-direct");
  const inputActionText = document.getElementById("input-action-text");
  const prefixBtns = document.querySelectorAll(".action-prefix-btn");

  let currentPrefix = "我";

  prefixBtns.forEach(btn => {
    btn.onclick = () => {
      prefixBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPrefix = btn.getAttribute("data-prefix") || "我";
    };
  });

  const openActionModal = () => {
    if (!actionModal) return;
    actionModal.classList.remove("hidden");
    if (inputActionText) {
      inputActionText.value = "";
      setTimeout(() => inputActionText.focus(), 100);
    }
  };

  const closeActionModal = () => {
    if (actionModal) actionModal.classList.add("hidden");
  };

  if (btnOpenAction) btnOpenAction.onclick = openActionModal;
  if (btnCloseAction) btnCloseAction.onclick = closeActionModal;
  if (btnCancelAction) btnCancelAction.onclick = closeActionModal;

  const getFormattedAction = () => {
    if (!inputActionText) return "";
    let raw = inputActionText.value.trim();
    if (!raw) return "";

    // 智能去除重复前缀
    if (currentPrefix === "我" && raw.startsWith("我")) {
      return raw;
    } else if (currentPrefix !== "我" && raw.startsWith("我")) {
      raw = raw.replace(/^我\s*/, '');
    }
    return `${currentPrefix}${raw}`;
  };

  // 填入输入框（拼装发送）
  if (btnAppendAction) {
    btnAppendAction.onclick = () => {
      const formatted = getFormattedAction();
      if (!formatted) return;
      closeActionModal();

      if (inputAction) {
        const cur = inputAction.value.trim();
        if (cur) {
          inputAction.value = `${cur} ${formatted}`;
        } else {
          inputAction.value = formatted;
        }
        inputAction.focus();
        inputAction.setSelectionRange(inputAction.value.length, inputAction.value.length);
      }
    };
  }

  // 直接发送
  if (btnSendActionDirect) {
    btnSendActionDirect.onclick = () => {
      const formatted = getFormattedAction();
      if (!formatted) return;
      closeActionModal();

      let finalText = formatted;
      if (inputAction && inputAction.value.trim()) {
        finalText = `${inputAction.value.trim()} ${formatted}`;
        inputAction.value = "";
      }
      sendPlayerAction(finalText);
    };
  }

  // 支持在动作输入框按 Enter 快捷填入
  if (inputActionText) {
    inputActionText.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (btnAppendAction) btnAppendAction.click();
      }
    };
  }
}

function handleInnRestAction() {
  const c = state.character;
  if (!c) return;

  // 检查资财
  let restDesc = "";
  if ((c.currency || 0) >= 5) {
    c.currency -= 5;
    restDesc = "花费 5 GP 入住城镇客栈上房安歇调养，热水沐浴并饱餐一顿。";
  } else {
    restDesc = "在荒野安全处燃起篝火扎营轮流守夜，就着干粮调息打坐了一整夜。";
  }

  // 气血与自发法术位完全回满
  c.hp.current = c.hp.max;
  if (state.spellSlots) {
    state.spellSlots.current = state.spellSlots.max;
  }
  renderTacticalPanel();

  audio.playDiceRoll();

  // 若经验已满 2000 且当前为 1 级，唤出晋升弹窗
  if (c.xp && c.xp.current >= c.xp.next && (c.xp.level || 1) === 1) {
    openLevelUpModal();
  } else {
    appendNarrativeEntry("assistant", `【🏨 调息长休宿毕】：行者${restDesc} 经脉舒畅、暗伤尽褪，当前气血精力全然回满（HP: ${c.hp.current}/${c.hp.max}）！`);
  }
}

function openLevelUpModal() {
  const modal = document.getElementById("modal-level-up");
  if (!modal) return;

  const c = state.character;
  const cls = c?.profile?.class || "战士";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];
  const hd = clsData.hd || 10;
  const conMod = calcMod(c.abilities.CON);
  const avgGain = Math.max(1, Math.floor(hd / 2) + 1 + conMod);

  const preview = document.getElementById("levelup-stats-preview");
  if (preview) {
    preview.innerHTML = `
      <p><strong>当前阶位：</strong>1 级 ${cls} ➔ <span style="color:#d4af37;font-weight:bold;">2 级 ${cls}</span></p>
      <p><strong>天命气血：</strong>生命骰 d${hd} + 体质修正(${fmtMod(conMod)})</p>
      <p><strong>保底均值：</strong>稳定增长 +${avgGain} 点气血生命上限</p>
      <p><strong>战斗专精：</strong>基础攻击加值 (BAB) 与豁免阶位将同步提升！</p>
    `;
  }

  modal.classList.remove("hidden");
}

function applyLevelUp(mode) {
  const modal = document.getElementById("modal-level-up");
  if (modal) modal.classList.add("hidden");

  const c = state.character;
  if (!c) return;

  const cls = c.profile.class || "战士";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];
  const hd = clsData.hd || 10;
  const conMod = calcMod(c.abilities.CON);

  let hpGain = 0;
  let methodDesc = "";

  if (mode === "roll") {
    const rolled = Math.floor(Math.random() * hd) + 1;
    hpGain = Math.max(1, rolled + conMod);
    methodDesc = `🎲 天命摇骰 (1d${hd} 投出 ${rolled} + 体质 ${fmtMod(conMod)}) ➔ 气血上限激增 +${hpGain} 点`;
  } else {
    hpGain = Math.max(1, Math.floor(hd / 2) + 1 + conMod);
    methodDesc = `🛡️ 稳妥保底 (均值 ${Math.floor(hd / 2) + 1} + 体质 ${fmtMod(conMod)}) ➔ 气血上限稳健增长 +${hpGain} 点`;
  }

  // 晋升为 2 级
  c.profile.level = 2;
  c.xp.level = 2;
  c.xp.next = 5000;
  c.hp.max += hpGain;
  c.hp.current = c.hp.max;

  // 全 BAB 职业在 2 级 BAB 由 1 变 2
  if (clsData.babType === "full") {
    c.bab = 2;
    const strMod = calcMod(c.abilities.STR);
    if (c.weapon) c.weapon.attackBonus = c.bab + strMod;
    c.cmb = c.bab + strMod;
    c.cmd = 10 + c.bab + strMod + calcMod(c.abilities.DEX);
  }

  // 强豁免在 2 级 +1
  clsData.goodSaves.forEach(saveKey => {
    if (c.saves[saveKey] !== undefined) c.saves[saveKey] += 1;
  });

  audio.playNat20();
  renderTacticalPanel();
  saveGameToServer();

  appendNarrativeEntry("assistant", `【🌟 破境晋升 2 级】：行者在长休调息中参悟天道，正式晋升为【2 级 ${cls}】！\n${methodDesc}！当前气血上限提升至 ${c.hp.max} 点，战意澎湃！`);
}


// =========================================================
// 13. 事件绑定与初始化启动
// =========================================================

function initApp() {
  // 1. 初始化战术面板与随身行囊
  renderTacticalPanel();
  initInventoryModal();
  renderInventorySummaryCard();
  initManualRollModal();
  initRestAndLevelUp();

  // 2. 初始化战棋沙盘与新故事按钮
  CombatGrid.init();
  initNewStoryButton();

  // 2.5 初始化结缘人物谱与全屏酷炫粒子动效
  initNpcRosterModal();
  if (typeof ParticleFX !== "undefined") {
    ParticleFX.init();
  }

  // 2.6 初始化言行双枢快捷模态框 (说 / 动作)
  initSpeechAndActionModals();

  // 3. 初始化车卡向导与设置模态框
  initCharacterWizard();
  initSettingsModal();

  // 3. 跑团 V1.0 架构：左侧磁吸功能条 (Rail Nav) 与 覆盖式大抽屉管理
  const tacticalDrawer = document.getElementById("panel-tactical");
  const drawerBackdrop = document.getElementById("drawer-backdrop");
  const btnCloseDrawer = document.getElementById("btn-close-drawer");
  const drawerTitle = document.getElementById("drawer-title");
  const drawerTag = document.getElementById("drawer-tag");
  const subtabsRow = document.getElementById("drawer-subtabs-row");

  let currentActiveDrawer = null;

  function openDrawer(targetDrawer) {
    if (!tacticalDrawer) return;

    // 若再次点击已激活的抽屉，则收起 (Toggle 逻辑)
    if (currentActiveDrawer === targetDrawer && tacticalDrawer.classList.contains("drawer-open")) {
      closeDrawer();
      return;
    }

    currentActiveDrawer = targetDrawer;
    tacticalDrawer.classList.add("drawer-open");
    if (drawerBackdrop) drawerBackdrop.classList.add("active");

    // 更新磁吸条发光高亮 (点击背景高亮明确反馈)
    document.querySelectorAll(".rail-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.drawer === targetDrawer);
    });

    // 隐藏抽屉内部所有主页面与二级容器
    document.querySelectorAll(".drawer-subtab-page, .drawer-main-page").forEach(el => el.classList.add("hidden"));

    if (targetDrawer === "profile") {
      if (drawerTitle) drawerTitle.textContent = "行者命盘 · 战术面板";
      if (drawerTag) drawerTag.textContent = "PF1e 命契";
      if (subtabsRow) subtabsRow.classList.remove("hidden");
      switchSubtab("profile-stats");
    } else if (targetDrawer === "map") {
      if (drawerTitle) drawerTitle.textContent = "舆图沙盘 · 府邸全景";
      if (drawerTag) drawerTag.textContent = "地理虚实";
      if (subtabsRow) subtabsRow.classList.add("hidden");
      const page = document.getElementById("drawer-page-map");
      if (page) page.classList.remove("hidden");
    } else if (targetDrawer === "chronicles") {
      if (drawerTitle) drawerTitle.textContent = "纪事卷宗 · 夺权破局录";
      if (drawerTag) drawerTag.textContent = "主线纲要";
      if (subtabsRow) subtabsRow.classList.add("hidden");
      const page = document.getElementById("drawer-page-chronicles");
      if (page) page.classList.remove("hidden");
    } else if (targetDrawer === "hints") {
      if (drawerTitle) drawerTitle.textContent = "司命妙计 · 智囊参谋";
      if (drawerTag) drawerTag.textContent = "天道推演";
      if (subtabsRow) subtabsRow.classList.add("hidden");
      const page = document.getElementById("drawer-page-hints");
      if (page) page.classList.remove("hidden");
    }
  }

  function closeDrawer() {
    if (!tacticalDrawer) return;
    tacticalDrawer.classList.remove("drawer-open");
    if (drawerBackdrop) drawerBackdrop.classList.remove("active");
    document.querySelectorAll(".rail-btn").forEach(btn => btn.classList.remove("active"));
    currentActiveDrawer = null;
  }

  function switchSubtab(subtabKey) {
    document.querySelectorAll(".drawer-subtab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.subtab === subtabKey);
    });
    document.querySelectorAll(".drawer-subtab-page").forEach(el => el.classList.add("hidden"));
    const targetPage = document.getElementById(`subtab-page-${subtabKey}`);
    if (targetPage) targetPage.classList.remove("hidden");
  }

  // 绑定磁吸导航按钮
  document.querySelectorAll(".rail-btn").forEach(btn => {
    btn.onclick = () => {
      const drawerType = btn.dataset.drawer;
      if (drawerType === "settings") {
        const modal = document.getElementById("modal-settings");
        if (modal) modal.classList.remove("hidden");
      } else {
        openDrawer(drawerType);
      }
    };
  });

  // 绑定二级分段药丸按钮 (命格属性 / 随身锦囊 / 人脉把柄)
  document.querySelectorAll(".drawer-subtab-btn").forEach(btn => {
    btn.onclick = () => {
      switchSubtab(btn.dataset.subtab);
    };
  });

  // 绑定抽屉关闭与背景点击
  if (btnCloseDrawer) btnCloseDrawer.onclick = closeDrawer;
  if (drawerBackdrop) drawerBackdrop.onclick = closeDrawer;

  // 移动端兼容
  const btnToggleLeft = document.getElementById("btn-toggle-left");
  if (btnToggleLeft) btnToggleLeft.onclick = () => openDrawer("profile");
  const btnToggleRight = document.getElementById("btn-toggle-right");
  if (btnToggleRight) btnToggleRight.onclick = () => openDrawer("chronicles");

  // 4. 行动声明发送逻辑 (Enter 发送, Shift+Enter 换行) 与 建议即时收录
  const inputAction = document.getElementById("input-action");
  const btnSubmitAction = document.getElementById("btn-submit-action");
  const chkSuggestion = document.getElementById("chk-is-suggestion");
  const btnSendLabel = document.getElementById("btn-send-label");

  if (chkSuggestion && btnSendLabel) {
    chkSuggestion.onchange = () => {
      btnSendLabel.textContent = chkSuggestion.checked ? "记录建议" : "执笔行念";
    };
  }

  async function triggerSubmit() {
    const text = inputAction.value.trim();
    if (!text) return;

    // 判定是否勾选了“记为迭代建议”
    if (chkSuggestion && chkSuggestion.checked) {
      inputAction.value = "";
      chkSuggestion.checked = false;
      if (btnSendLabel) btnSendLabel.textContent = "执笔行念";

      try {
        const res = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text })
        });
        if (res.ok) {
          audio.playAlert();
          appendNarrativeEntry("assistant", `【司命灵感阁 · 建议收录】：已将您的迭代建议“${text}”收录至云端！此建议不会推进当前跑团剧情。您可随时在右上角【⚙️ 司命心印】中一键复制全部建议，直接发给 AI 助手协助代码升级。`);
        } else {
          alert("建议暂存失败，请检查网络或后端。");
        }
      } catch (err) {
        alert("建议存入异常: " + err.message);
      }
      return;
    }

    inputAction.value = "";
    sendPlayerAction(text);
  }

  btnSubmitAction.onclick = triggerSubmit;
  inputAction.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  // 5. 索骰横幅交互：【🎲 投骰对抗】 与 【↩️ 放弃变卦/改做他事】
  document.getElementById("btn-execute-check").onclick = () => {
    if (!state.pendingCheck) return;
    const check = state.pendingCheck;
    hidePendingCheckBanner();

    performDiceRoll(check.type, check.bonus, check.dc, (result) => {
      const outcomeText = `【${check.type}对抗结算】：投出 D20 (${result.d20}) + 修正总加值 (${fmtMod(result.bonus)}) [${check.bonusDetail || '命格专修'}] = 终值 ${result.total} vs 目标 DC ${check.dc} —— ${result.isSuccess ? '【成功】' : '【受挫/局势恶化】'}`;
      sendPlayerAction(outcomeText);
    });
  };

  document.getElementById("btn-cancel-check").onclick = () => {
    if (!state.pendingCheck) return;
    const check = state.pendingCheck;
    hidePendingCheckBanner();
    audio.playAlert();

    const cancelText = `【玩家变卦撤回】：行者察觉凶险，在动作爆发前一瞬稳住心神、收力回撤，并未进行该【${check.type}】冒险举动，亦未曾投骰。请司命描述局势暂缓或对峙现状，并询问行者另作何打算。`;
    sendPlayerAction(cancelText);
  };

  // 6. 初始化行商大集 · 万象货栈模态框 (替代生硬的兵刃挥斩宏)
  initMarketplaceModal();

  // 7. 顶部封存与读取档案按钮
  document.getElementById("btn-save").onclick = async () => {
    await saveGameToServer();
    alert("当前行者命契与风云纪事已封存完毕！");
  };

  document.getElementById("btn-load").onclick = async () => {
    await loadGameFromServer();
    alert("历史跑团纪事与命契档案已装载！");
  };

  // 8. 场外记事本本地防剧透自动保存
  const notesTextarea = document.getElementById("player-notes");
  if (notesTextarea) {
    notesTextarea.value = localStorage.getItem("pf1e_player_notes") || "";
    notesTextarea.oninput = () => {
      localStorage.setItem("pf1e_player_notes", notesTextarea.value);
    };
  }

  // 预载 CRB 核心规则真典
  loadCrbCatalog();

  // 尝试拉取历史存档
  loadGameFromServer();

  // 9. API Key 双保险静默同步：若本地有 Key 且后端未配置，自动静默同步补全
  (async () => {
    try {
      const localKey = localStorage.getItem("paotuan_deepseek_key");
      if (localKey) {
        const res = await fetch("/api/config");
        const data = await res.json();
        if (!data.has_api_key) {
          await fetch("/api/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: localKey })
          });
        }
      }
    } catch (e) {}
  })();
}

// 健壮启动：避免移动端 Safari因时序错过 DOMContentLoaded 事件
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
