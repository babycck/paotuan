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
    currency: 150, // 初始随身资财 150 GP (可自适应兑换银两/现金)
    inventory: [
      { name: "精工长剑", category: "weapon", price: 15, weight: 4, desc: "1d8伤害, 19-20/×2" },
      { name: "精工链甲衫", category: "armor", price: 100, weight: 25, desc: "AC +4, ACP -1" },
      { name: "探险者背包", category: "gear", price: 2, weight: 2, desc: "随身装具" }
    ]
  },

  // 当前世界观题材 (待玩家自由定夺)
  theme: null,

  // 对话历史
  history: [],

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
    selectedTrait: "反制者",
    skillRanks: {},
    availableSkillPoints: 4,
    token: "防风打火机",
    name: "行者",
    gender: "男",
    age: 20
  }
};


// =========================================================
// 4. 战术面板视图同步 (Tactical Panel Rendering)
// =========================================================

function renderTacticalPanel() {
  const c = state.character;
  if (!c) return;

  // 身份与气血
  document.getElementById("char-name").textContent = c.profile.name || "行者";
  document.getElementById("char-alignment").textContent = c.profile.alignment || "守序中立";
  document.getElementById("char-race").textContent = c.profile.race || "人类";
  document.getElementById("char-class").textContent = c.profile.class || "战士";
  document.getElementById("char-level").textContent = c.profile.level || 1;
  const genderElem = document.getElementById("char-gender");
  if (genderElem) genderElem.textContent = c.profile.gender || "男";
  const ageElem = document.getElementById("char-age");
  if (ageElem) ageElem.textContent = c.profile.age || "20";
  document.getElementById("char-token").textContent = c.profile.modernToken || "无";

  document.getElementById("hp-current").textContent = c.hp.current;
  document.getElementById("hp-max").textContent = c.hp.max;
  const hpPercent = Math.max(0, Math.min(100, (c.hp.current / c.hp.max) * 100));
  const hpBar = document.getElementById("hp-bar");
  hpBar.style.width = `${hpPercent}%`;

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
}


// =========================================================
// 5. 索骰/变卦双轨拦截器 (Regex & Check Mechanics)
// =========================================================

// 正则式：捕获 [CHECK: 检定名称 | DC: 数值 | REASON: 判据]
const CHECK_REGEX = /\[CHECK:\s*([^\|]+)\s*\|\s*DC:\s*(\d+)\s*\|\s*REASON:\s*([^\]]+)\]/i;

function parseAndHandleCheckDirective(rawText) {
  const match = rawText.match(CHECK_REGEX);
  if (match) {
    const checkType = match[1].trim();
    const dcValue = parseInt(match[2].trim(), 10);
    const reasonText = match[3].trim();

    // 剔除机器标记，呈现纯净剧情
    const cleanText = rawText.replace(match[0], "").trim();

    // 计算角色对应的修正值
    const bonus = computePlayerBonusForCheck(checkType);

    state.pendingCheck = {
      type: checkType,
      dc: dcValue,
      reason: reasonText,
      bonus: bonus
    };

    // 呼出金色脉冲横幅
    showPendingCheckBanner(state.pendingCheck);
    audio.playAlert();

    return cleanText;
  }
  return rawText;
}

// 智能核算角色在此项检定中的总加值
function computePlayerBonusForCheck(checkType) {
  const c = state.character;
  if (!c) return 0;

  // 1. 先攻判定
  if (checkType.includes("先攻") || checkType.toLowerCase().includes("init")) {
    return c.initiative ?? (calcMod(c.abilities.DEX) + (c.trait && c.trait.type === "init" ? c.trait.bonus : 0));
  }

  // 2. 战系机动 (CMB / CMD) 判定
  if (checkType.includes("CMB") || checkType.includes("战系机动") || checkType.includes("冲撞") || checkType.includes("摔绊") || checkType.includes("擒抱") || checkType.includes("卸除武器")) {
    return c.cmb ?? (c.bab + calcMod(c.abilities.STR) + (c.trait && c.trait.type === "cmb" ? c.trait.bonus : 0));
  }
  if (checkType.includes("CMD") || checkType.includes("机动防御")) {
    return c.cmd ?? (10 + c.bab + calcMod(c.abilities.STR) + calcMod(c.abilities.DEX));
  }

  // 3. 豁免判定
  if (checkType.includes("强韧")) return c.saves.fort || 0;
  if (checkType.includes("反射")) return c.saves.ref || 0;
  if (checkType.includes("意志")) return c.saves.will || 0;

  // 4. 技能判定
  for (const skName of Object.keys(c.skills)) {
    if (checkType.includes(skName)) {
      const sk = c.skills[skName];
      const attrMod = calcMod(c.abilities[sk.attr] || 10);
      let total = attrMod + (sk.ranks || 0);
      let isClass = sk.isClass;
      if (skName === "察觉" && c.trait && c.trait.type === "perception") {
        isClass = true;
        total += 1;
      }
      if (isClass && sk.ranks > 0) total += 3;
      const skDef = PF1E_RULES.skills.find(s => s.name === skName);
      if (skDef && skDef.acp) total += (c.ac.acp || 0);
      return total;
    }
  }

  // 5. 基础属性判定
  if (checkType.includes("力量")) return calcMod(c.abilities.STR);
  if (checkType.includes("敏捷")) return calcMod(c.abilities.DEX);
  if (checkType.includes("体质")) return calcMod(c.abilities.CON);
  if (checkType.includes("智力")) return calcMod(c.abilities.INT);
  if (checkType.includes("感知")) return calcMod(c.abilities.WIS);
  if (checkType.includes("魅力")) return calcMod(c.abilities.CHA);

  // 6. 近战命中判定
  if (checkType.includes("攻击") || checkType.includes("挥斩") || checkType.includes("命中") || checkType.includes("近战")) {
    return c.weapon.attackBonus || 0;
  }

  return 0;
}

function showPendingCheckBanner(check) {
  const banner = document.getElementById("banner-check");
  document.getElementById("check-type-label").textContent = `【${check.type}检定】`;
  document.getElementById("check-dc-value").textContent = check.dc;
  document.getElementById("check-reason-text").textContent = `判据：${check.reason}`;
  document.getElementById("check-bonus-preview").textContent = fmtMod(check.bonus);
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
    } else if (d20 === 1) {
      critBadge.textContent = "☠ 绝境大失败 (Natural 1) ☠";
      critBadge.classList.add("crit-fail");
      audio.playNat1();
    } else {
      critBadge.textContent = isSuccess ? "对抗成功" : "局势恶化 (对抗受挫)";
      critBadge.classList.add(isSuccess ? "crit-success" : "crit-fail");
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

function appendNarrativeEntry(role, text) {
  const stream = document.getElementById("narrative-stream");
  const entry = document.createElement("div");
  entry.className = `narrative-entry ${role === 'user' ? 'entry-player' : 'entry-dm'}`;

  const seal = document.createElement("div");
  seal.className = "speaker-seal";
  seal.textContent = role === 'user' ? '我' : '司命';

  const content = document.createElement("div");
  content.className = "entry-content";

  // 格式化文本段落
  const paragraphs = text.split("\n\n").filter(p => p.trim());
  paragraphs.forEach(p => {
    const pElem = document.createElement("p");
    if (p.includes("你接下来要干嘛？")) {
      pElem.className = "narrative-question";
    }
    pElem.innerHTML = p.replace(/\n/g, "<br>");
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

  // 呈现玩家行动
  appendNarrativeEntry("user", rawText);

  // 创建 DM 的待接收容器
  const stream = document.getElementById("narrative-stream");
  const dmEntry = document.createElement("div");
  dmEntry.className = "narrative-entry entry-dm";
  dmEntry.innerHTML = `
    <div class="speaker-seal">司命</div>
    <div class="entry-content"><p class="loading-pulse">司命运筹推演中……</p></div>
  `;
  stream.appendChild(dmEntry);
  stream.scrollTop = stream.scrollHeight;

  const contentElem = dmEntry.querySelector(".entry-content");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: state.history,
        character_info: state.character,
        theme: state.theme,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`服务器响应异常: ${response.status}`);
    }

    contentElem.innerHTML = "";
    let accumulatedText = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.content) {
              accumulatedText += parsed.content;
              contentElem.innerHTML = accumulatedText
                .replace(/\[CHECK:.*?\]/g, "")
                .replace(/\n\n/g, "</p><p>")
                .replace(/\n/g, "<br>");
              stream.scrollTop = stream.scrollHeight;
            }
          } catch (e) {
            // 继续解析后续数据包
          }
        }
      }
    }

    // 后处理：解析主线任务指令与索骰指令
    let processedText = accumulatedText;
    const questMatch = processedText.match(/\[QUEST:\s*([^\]]+)\]/i);
    if (questMatch) {
      const questContent = questMatch[1].trim();
      state.quest = questContent;
      const themeDescElem = document.getElementById("current-theme-desc");
      if (themeDescElem) {
        themeDescElem.innerHTML = `<strong>【核心使命/主线】：</strong>${questContent}`;
      }
      processedText = processedText.replace(questMatch[0], "").trim();
    }

    const combatMatch = processedText.match(/\[COMBAT:\s*(\{.*?\})\]/i);
    if (combatMatch) {
      try {
        const combatData = JSON.parse(combatMatch[1]);
        if (typeof CombatGrid !== "undefined") {
          CombatGrid.initOrUpdate(combatData);
          CombatGrid.show();
        }
      } catch (e) {
        console.warn("解析战术沙盘指令失败:", e);
      }
      processedText = processedText.replace(combatMatch[0], "").trim();
    }

    const cleanFinalText = parseAndHandleCheckDirective(processedText);
    contentElem.innerHTML = cleanFinalText
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    state.history.push({ role: "assistant", content: cleanFinalText });

    // 自动保存本地存档
    saveGameToServer();

  } catch (err) {
    contentElem.innerHTML = `<p class="danger-text">【通传受阻】：${err.message}</p>`;
  }
}


// =========================================================
// 8. 司命问询式降噪车卡向导 (Wizard Controller)
// =========================================================

function initCharacterWizard() {
  const wizardModal = document.getElementById("modal-wizard");
  const btnOpen = document.getElementById("btn-open-wizard");
  const btnClose = document.getElementById("btn-close-wizard");
  const btnNext = document.getElementById("btn-wizard-next");
  const btnPrev = document.getElementById("btn-wizard-prev");
  const btnFinish = document.getElementById("btn-wizard-finish");

  btnOpen.onclick = () => {
    wizardModal.classList.remove("hidden");
    showWizardStep(1);
  };
  btnClose.onclick = () => wizardModal.classList.add("hidden");

  // Step 1: 4d6k3 摇骰
  document.getElementById("btn-roll-4d6k3").onclick = () => {
    audio.playDiceRoll();
    const scores = [];
    for (let i = 0; i < 6; i++) {
      const rolls = [1, 2, 3, 4].map(() => Math.floor(Math.random() * 6) + 1);
      rolls.sort((a, b) => b - a);
      const sum = rolls[0] + rolls[1] + rolls[2];
      scores.push(sum);
    }
    state.wizard.rolledScores = scores.sort((a, b) => b - a);
    renderAbilityAssignmentGrid();
    renderClassRecommendations(state.wizard.rolledScores);
  };

  // 切换步骤
  btnNext.onclick = () => {
    if (state.wizard.currentStep < 5) {
      showWizardStep(state.wizard.currentStep + 1);
    }
  };
  btnPrev.onclick = () => {
    if (state.wizard.currentStep > 1) {
      showWizardStep(state.wizard.currentStep - 1);
    }
  };

  // 完成车卡
  btnFinish.onclick = () => {
    finalizeCharacterCreation();
    wizardModal.classList.add("hidden");
  };

  // 初始化向导初始渲染
  renderRaceCards();
  renderClassCards();
  renderAbilityAssignmentGrid();
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

  if (step === 4) {
    renderSkillAllocator();
  }
}

// 核心门派点数池契合推荐规则表
const CLASS_RECOMMEND_RULES = [
  {
    name: "战士",
    tier: "S级 · 铁壁挥斩",
    priority: ["STR", "CON", "DEX", "WIS", "INT", "CHA"],
    reason: "高力量带来刀刀见血的近战挥斩，高体质筑牢1级气血壁垒；智力魅力仅8~10点完全无碍大局！"
  },
  {
    name: "野蛮人",
    tier: "S级 · 狂暴巨力",
    priority: ["STR", "CON", "DEX", "WIS", "CHA", "INT"],
    reason: "1级满额 12+体质点满血，狂暴战力全开，单人面对小怪围攻容错率极高！"
  },
  {
    name: "圣武士",
    tier: "S级 · 神圣独行",
    priority: ["STR", "CHA", "CON", "WIS", "DEX", "INT"],
    reason: "近战杀伐与魅力神恩全豁免加身，独行能抗能打能圣疗自保，单人无短板。"
  },
  {
    name: "游侠",
    tier: "A+级 · 荒野射手",
    priority: ["DEX", "STR", "CON", "WIS", "INT", "CHA"],
    reason: "高敏远距长弓狙杀避开肉搏反击，本职技能全面，荒野追踪与先攻优秀。"
  },
  {
    name: "法师",
    tier: "A级 · 奥术博学",
    priority: ["INT", "DEX", "CON", "WIS", "CHA", "STR"],
    reason: "最高大点直接给智力（决定法术环阶与豁免难度），敏体保命，力量仅8点无伤大雅。"
  },
  {
    name: "游荡者",
    tier: "A级 · 暗影巧手",
    priority: ["DEX", "INT", "CON", "WIS", "CHA", "STR"],
    reason: "敏捷决定先攻与闪避，智力提供海量技能点，借阴影暗算破局。"
  },
  {
    name: "牧师",
    tier: "A+级 · 神圣牧者",
    priority: ["WIS", "CON", "CHA", "STR", "DEX", "INT"],
    reason: "高感知决定神术环阶，引导神力群体治疗，重甲自保，单人稳健。"
  }
];

function renderClassRecommendations(scores) {
  const panel = document.getElementById("class-recommend-panel");
  const container = document.getElementById("recommend-cards-container");
  if (!panel || !container || !scores || scores.length < 6) return;

  panel.classList.remove("hidden");
  container.innerHTML = "";

  const sorted = [...scores].sort((a, b) => b - a);
  const topClasses = [];

  if (sorted[0] >= 14 && sorted[1] >= 13) {
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "战士"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "野蛮人"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "圣武士"));
  } else if (sorted[0] >= 15) {
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "法师"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "游侠"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "游荡者"));
  } else {
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "战士"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "游侠"));
    topClasses.push(CLASS_RECOMMEND_RULES.find(c => c.name === "牧师"));
  }

  topClasses.filter(Boolean).forEach(cls => {
    const card = document.createElement("div");
    card.className = "recommend-card";

    const plan = {};
    cls.priority.forEach((attr, idx) => {
      plan[attr] = sorted[idx];
    });

    card.innerHTML = `
      <div class="rec-card-top">
        <span class="rec-class-name">门派：${cls.name}</span>
        <span class="rec-badge">${cls.tier}</span>
      </div>
      <div class="rec-reason">${cls.reason}</div>
      <div class="rec-stats-preview">
        <strong>最优配点：</strong>力量 ${plan.STR} / 敏捷 ${plan.DEX} / 体质 ${plan.CON} / 智力 ${plan.INT} / 感知 ${plan.WIS} / 魅力 ${plan.CHA}
      </div>
      <button class="btn btn-gold btn-apply-rec">★ 采纳此门派并一键归位</button>
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

function renderAbilityAssignmentGrid() {
  const container = document.getElementById("ability-assignment-grid");
  container.innerHTML = "";
  const attrs = [
    { code: "STR", name: "力量 (伤害/负重)" },
    { code: "DEX", name: "敏捷 (命中/闪避)" },
    { code: "CON", name: "体质 (气血/强韧)" },
    { code: "INT", name: "智力 (技能/法术)" },
    { code: "WIS", name: "感知 (察觉/意志)" },
    { code: "CHA", name: "魅力 (交涉/气魄)" }
  ];

  attrs.forEach((attr, idx) => {
    const slot = document.createElement("div");
    slot.className = "assign-slot";
    const defaultVal = state.wizard.rolledScores[idx] || 10;
    slot.innerHTML = `
      <div class="slot-title">
        <span>${attr.name}</span>
        <strong class="gold-text" id="slot-val-${attr.code}">${defaultVal}</strong>
      </div>
      <select class="slot-select" data-attr="${attr.code}">
        ${state.wizard.rolledScores.map((s, sIdx) => `
          <option value="${s}" ${sIdx === idx ? 'selected' : ''}>天命出目: ${s}</option>
        `).join('')}
      </select>
    `;
    container.appendChild(slot);
  });

  container.querySelectorAll(".slot-select").forEach(sel => {
    sel.onchange = (e) => {
      const code = e.target.getAttribute("data-attr");
      const val = parseInt(e.target.value, 10);
      state.wizard.assignedAbilities[code] = val;
      document.getElementById(`slot-val-${code}`).textContent = val;
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
    };
    container.appendChild(card);
  });
}

function renderSkillAllocator() {
  const container = document.getElementById("wizard-skills-allocator");
  container.innerHTML = "";
  const clsData = PF1E_RULES.classes[state.wizard.selectedClass] || PF1E_RULES.classes["战士"];
  const intMod = calcMod(state.wizard.assignedAbilities.INT || 10);
  const totalPoints = Math.max(1, clsData.skillPoints + intMod + (state.wizard.selectedRace === "人类" ? 1 : 0));

  // 计算当前消耗的点数
  let usedPoints = 0;
  Object.values(state.wizard.skillRanks).forEach(r => { usedPoints += r; });
  state.wizard.availableSkillPoints = Math.max(0, totalPoints - usedPoints);
  document.getElementById("wizard-skill-points-left").textContent = state.wizard.availableSkillPoints;

  PF1E_RULES.skills.slice(0, 14).forEach(sk => {
    const isClass = clsData.classSkills.includes(sk.name);
    const ranks = state.wizard.skillRanks[sk.name] || 0;

    const row = document.createElement("div");
    row.className = "skill-alloc-row";
    row.innerHTML = `
      <span class="${isClass ? 'gold-text' : ''}">${isClass ? '★ ' : ''}${sk.name} (${sk.attr})</span>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="alloc-btn btn-minus" ${ranks <= 0 ? 'disabled' : ''}>-</button>
        <strong>${ranks}</strong>
        <button class="alloc-btn btn-plus" ${state.wizard.availableSkillPoints <= 0 ? 'disabled' : ''}>+</button>
      </div>
    `;

    row.querySelector(".btn-plus").onclick = () => {
      if (state.wizard.availableSkillPoints > 0) {
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

function renderWizardFinalPreview() {
  const preview = document.getElementById("wizard-final-preview");
  const cls = state.wizard.selectedClass || "战士";
  const race = state.wizard.selectedRace || "人类";
  const clsData = PF1E_RULES.classes[cls] || PF1E_RULES.classes["战士"];
  const conMod = calcMod(state.wizard.assignedAbilities.CON || 10);
  const hpMax = clsData.hd + conMod;
  const traitSelect = document.getElementById("wizard-trait-select");
  const traitVal = traitSelect ? traitSelect.value : "反制者";

  preview.innerHTML = `
    <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:6px; font-size:13px; line-height:1.7;">
      <p><strong>血脉门派：</strong>${race} · ${cls} (1级)</p>
      <p><strong>满额气血 (HP)：</strong>${hpMax} 点 (1级满额 HD: d${clsData.hd} + 体质修正 ${conMod})</p>
      <p><strong>身世特性：</strong>${traitVal}</p>
      <p><strong>标准防备：</strong>精工链甲衫 + 敏捷修正 → AC 16 (ACP -2)</p>
      <p><strong>佩刃兵戈：</strong>精工长剑 (19-20 / ×2 致命重击威胁)</p>
    </div>
  `;
}

function finalizeCharacterCreation() {
  const nameInput = document.getElementById("input-char-name").value.trim() || "行者";
  const genderInput = document.getElementById("input-char-gender").value || "男";
  const ageInput = parseInt(document.getElementById("input-char-age").value, 10) || 20;
  const tokenInput = document.getElementById("input-char-token").value.trim() || "家传断佩";
  const traitSelect = document.getElementById("wizard-trait-select").value || "反制者";

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
  const hpMax = Math.max(1, clsData.hd + conMod);

  // 获取背景特性
  const traitData = PF1E_TRAITS[traitSelect] || PF1E_TRAITS["反制者"];

  // 豁免基准
  let willBonus = (traitData.type === "will") ? traitData.bonus : 0;
  const saves = {
    fort: (clsData.goodSaves.includes("fort") ? 2 : 0) + conMod,
    ref: (clsData.goodSaves.includes("ref") ? 2 : 0) + dexMod,
    will: (clsData.goodSaves.includes("will") ? 2 : 0) + wisMod + willBonus
  };

  const bab = (clsData.babType === "full") ? 1 : 0;
  const size = raceData ? raceData.size : "中型";
  const sizeModCMB = (size === "小型") ? -1 : 0;
  const sizeModAC = (size === "小型") ? 1 : 0;

  // 先攻计算
  let initTraitBonus = (traitData.type === "init") ? traitData.bonus : 0;
  const initiative = dexMod + initTraitBonus;

  // CMB / CMD
  let cmbTraitBonus = (traitData.type === "cmb") ? traitData.bonus : 0;
  const cmb = bab + strMod + sizeModCMB + cmbTraitBonus;
  const cmd = 10 + bab + strMod + dexMod + sizeModCMB;

  // 负重梯度
  const loadLimits = getLoadThresholds(abilities.STR, size);

  // 防御等级
  const armorBonus = 4; // 精工链甲衫
  const maxDex = 4;
  const appliedDex = Math.min(dexMod, maxDex);
  const acTotal = 10 + armorBonus + appliedDex + sizeModAC;
  const acTouch = 10 + appliedDex + sizeModAC;
  const acFlat = 10 + armorBonus + sizeModAC;

  const weaponAb = bab + strMod + sizeModAC;

  state.character = {
    profile: {
      name: nameInput,
      gender: genderInput,
      age: ageInput,
      race: race,
      class: cls,
      level: 1,
      alignment: "守序中立",
      modernToken: tokenInput
    },
    abilities: abilities,
    hp: { current: hpMax, max: hpMax, temp: 0 },
    ac: {
      total: acTotal,
      touch: acTouch,
      flatFooted: acFlat,
      armor: armorBonus,
      shield: 0,
      dex: appliedDex,
      maxDex: maxDex,
      acp: -2,
      spellFail: "20%"
    },
    speed: raceData ? raceData.speed : 30,
    bab: bab,
    initiative: initiative,
    cmb: cmb,
    cmd: cmd,
    saves: saves,
    trait: traitData,
    feat: {
      name: "猛力攻击 (入门专长)",
      desc: "以 -1 近战命中换取 +2 近战伤害加值。"
    },
    skills: {},
    weapon: {
      name: "精工长剑",
      threatRange: [19, 20],
      critMultiplier: 2,
      damageDice: "1d8",
      damageType: "挥砍",
      attackBonus: weaponAb
    },
    load: {
      current: 35,
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

  // 若无额外分配，默认预填代表性冒险技能
  if (Object.keys(state.character.skills).length === 0) {
    ["特技", "察觉", "隐匿", "攀爬", "威吓"].forEach((skName, idx) => {
      const skDef = PF1E_RULES.skills.find(s => s.name === skName);
      state.character.skills[skName] = {
        ranks: idx === 0 ? 0 : 1,
        isClass: clsData.classSkills.includes(skName),
        attr: skDef ? skDef.attr : "STR"
      };
    });
  }

  renderTacticalPanel();

  // 重置题材状态与历史，发起新世界观发问
  state.theme = null;
  state.history = [];

  const stream = document.getElementById("narrative-stream");
  stream.innerHTML = "";

  const tokenDesc = (tokenInput && tokenInput !== "无") ? `，随身佩带信物【${tokenInput}】` : "，孑然一身独步江湖";
  const promptText = `【印契定魄】：行者【${nameInput}】乾坤命格已凝结定魄！佩剑在腰，寒甲覆身${tokenDesc}。\n\n命盘已开，风云待定。请阁下以故事背景告知你想玩一个什么样的故事？（可自由打字描写你心仪的故事背景与世界观，司命将以此展开专属单人跑团！）`;
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
        state.character.inventory.push({ ...it });

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

async function saveGameToServer() {
  try {
    const payload = {
      data: {
        character: state.character,
        theme: state.theme,
        history: state.history,
        notes: document.getElementById("player-notes").value
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
      if (json.data.notes) document.getElementById("player-notes").value = json.data.notes;
      if (json.data.theme) {
        state.theme = json.data.theme;
        const subTitleElem = document.getElementById("campaign-theme-subtitle");
        if (subTitleElem) subTitleElem.textContent = `${state.theme} · Pathfinder 1e 叙事引擎`;
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
    this.updateMeter(`战术测距：我与 [${e.name}] 相距 ${ftDist} 尺 (${gridDist} 格) · 处于近战触及之外`);
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
// 12. 事件绑定与初始化启动
// =========================================================

function initApp() {
  // 1. 初始化战术面板
  renderTacticalPanel();

  // 2. 初始化战棋沙盘与新故事按钮
  CombatGrid.init();
  initNewStoryButton();

  // 2. 初始化车卡向导与设置模态框
  initCharacterWizard();
  initSettingsModal();

  // 3. 移动端抽屉开关
  const leftPanel = document.getElementById("panel-tactical");
  const rightPanel = document.getElementById("panel-codex");
  const btnToggleLeft = document.getElementById("btn-toggle-left");
  const btnToggleRight = document.getElementById("btn-toggle-right");
  const btnCloseLeft = document.getElementById("btn-close-left");
  const btnCloseRight = document.getElementById("btn-close-right");

  if (btnToggleLeft) btnToggleLeft.onclick = () => leftPanel.classList.toggle("open");
  if (btnToggleRight) btnToggleRight.onclick = () => rightPanel.classList.toggle("open");
  if (btnCloseLeft) btnCloseLeft.onclick = () => leftPanel.classList.remove("open");
  if (btnCloseRight) btnCloseRight.onclick = () => rightPanel.classList.remove("open");

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
      const outcomeText = `【${check.type}对抗结算】：投出 D20 (${result.d20}) + 加值 (${fmtMod(result.bonus)}) = 总计 ${result.total} vs 目标 DC ${check.dc} —— ${result.isSuccess ? '【成功】' : '【受挫/局势恶化】'}`;
      sendPlayerAction(outcomeText);
    });
  };

  document.getElementById("btn-cancel-check").onclick = () => {
    if (!state.pendingCheck) return;
    hidePendingCheckBanner();
    audio.playAlert();

    appendNarrativeEntry("assistant", `【变卦心决】：你权衡凶险，决意放弃原定行动，未曾掷骰，亦无损耗。你定住心神，暂避锋芒，可另谋破局生路。\n\n你接下来要干嘛？`);
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
  notesTextarea.value = localStorage.getItem("pf1e_player_notes") || "";
  notesTextarea.oninput = () => {
    localStorage.setItem("pf1e_player_notes", notesTextarea.value);
  };

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
