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
    load: { current: 35, lightMax: 66, medMax: 133, heavyMax: 200, status: "轻载" }
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

  // 武器与致命重击
  document.getElementById("weapon-name").textContent = c.weapon.name;
  document.getElementById("weapon-ab").textContent = fmtMod(c.weapon.attackBonus);
  const strMod = calcMod(c.abilities.STR);
  document.getElementById("weapon-damage").textContent = `${c.weapon.damageDice}${fmtMod(strMod)}`;
  const weaponTypeElem = document.getElementById("weapon-type");
  if (weaponTypeElem) weaponTypeElem.textContent = c.weapon.damageType || "挥砍";
  const threatBadge = document.getElementById("weapon-threat-badge");
  if (threatBadge) {
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
  seal.textContent = role === 'user' ? '行者' : '司命';

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

  // 若战役尚未定夺题材且输入为纯自然语言，定夺当前题材
  if (!state.theme && !rawText.startsWith("【") && !rawText.startsWith("我拔出")) {
    state.theme = rawText;
    const subTitleElem = document.getElementById("campaign-theme-subtitle");
    if (subTitleElem) subTitleElem.textContent = `${state.theme} · Pathfinder 1e 叙事引擎`;
    const themeDescElem = document.getElementById("current-theme-desc");
    if (themeDescElem) themeDescElem.textContent = state.theme;
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

    // 后处理：解析索骰指令
    const cleanFinalText = parseAndHandleCheckDirective(accumulatedText);
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
  const tokenInput = document.getElementById("input-char-token").value.trim() || "防风打火机";
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

  const promptText = `【印契定魄】：行者【${nameInput}】乾坤命格已凝结定魄！佩剑在腰，寒甲覆身，随身秘物【${tokenInput}】已藏入袖中。\n\n命盘已开，风云待定。阁下此番历练，想踏入何种题材的风云天下？（可自由输入：如唐代武周悬疑、宋末边关谍战、明末辽东血战、赛博朋克修真等任何世界观）`;
  appendNarrativeEntry("assistant", promptText);

  saveGameToServer();
}


// =========================================================
// 9. API 设置与存档管理 (Settings & Persistence)
// =========================================================

function initSettingsModal() {
  const modal = document.getElementById("modal-settings");
  const btnOpen = document.getElementById("btn-open-settings");
  const btnClose = document.getElementById("btn-close-settings");
  const btnSave = document.getElementById("btn-save-settings");
  const btnTest = document.getElementById("btn-test-api");

  btnOpen.onclick = async () => {
    modal.classList.remove("hidden");
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.masked_api_key) {
        document.getElementById("cfg-api-key").placeholder = `已配置 (${data.masked_api_key})，留空则不修改`;
      }
      document.getElementById("cfg-base-url").value = data.base_url || "https://api.deepseek.com";
      document.getElementById("cfg-model").value = data.model || "deepseek-chat";
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
    if (key) payload.api_key = key;

    try {
      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      alert("司命心印设置保存成功！");
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
// 10. 事件绑定与初始化启动
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // 1. 初始化战术面板
  renderTacticalPanel();

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

  // 4. 行动声明发送逻辑 (Enter 发送, Shift+Enter 换行)
  const inputAction = document.getElementById("input-action");
  const btnSubmitAction = document.getElementById("btn-submit-action");

  function triggerSubmit() {
    const text = inputAction.value.trim();
    if (!text) return;
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

  // 6. 快捷兵刃挥斩宏 (支持 19-20 重击威胁与自动确重判定)
  document.getElementById("btn-roll-weapon").onclick = () => {
    const c = state.character;
    const ab = c.weapon.attackBonus || 0;
    const strMod = calcMod(c.abilities.STR);
    const threatRange = c.weapon.threatRange || [19, 20];
    const dmgType = c.weapon.damageType || "挥砍";

    performDiceRoll(c.weapon.name + " 攻击", ab, 15, (res) => {
      let isThreat = threatRange.includes(res.d20);

      if (isThreat) {
        // 触发致命重击威胁，自动执行二次确重投骰
        const confirmD20 = Math.floor(Math.random() * 20) + 1;
        const confirmTotal = confirmD20 + ab;
        const confirmSuccess = confirmTotal >= 15;

        if (confirmSuccess) {
          audio.playNat20();
          const baseDmg1 = Math.floor(Math.random() * 8) + 1;
          const baseDmg2 = Math.floor(Math.random() * 8) + 1;
          const totalCritDmg = baseDmg1 + baseDmg2 + strMod * 2;
          const critMsg = `我拔出腰间【${c.weapon.name}】，凌厉斩击而出！\n【首击命中】：出目 D20 (${res.d20}) + 命中加值 ${fmtMod(ab)} = ${res.total}（触发 ${threatRange[0]}-${threatRange[threatRange.length - 1]} 致命重击威胁！）\n【确重投骰】：出目 D20 (${confirmD20}) + ${fmtMod(ab)} = ${confirmTotal} vs DC 15 —— ★【致命重击确认成功 (Critical Hit Confirmed)】★！\n造成 ×2 致命破坏伤害：2d8 (${baseDmg1}+${baseDmg2}) + 力量双倍加值 (${strMod * 2}) = 【${totalCritDmg} 点${dmgType}伤害】！`;
          sendPlayerAction(critMsg);
        } else {
          const dmg = Math.floor(Math.random() * 8) + 1 + strMod;
          const normalMsg = `我拔出腰间【${c.weapon.name}】，凌厉斩击而出！\n【首击命中】：出目 D20 (${res.d20}) + 命中加值 ${fmtMod(ab)} = ${res.total}（触发重击威胁，但确重投骰 D20(${confirmD20})+${fmtMod(ab)}=${confirmTotal} 未能达成重击）。\n造成普通破坏伤害：1d8+${strMod} = 【${dmg} 点${dmgType}伤害】！`;
          sendPlayerAction(normalMsg);
        }
      } else if (res.d20 === 1) {
        audio.playNat1();
        sendPlayerAction(`我拔出腰间【${c.weapon.name}】仓促挥击！[出目 D20 (1) ☠ 绝境大失误 (Natural 1) ☠！剑刃脱手击空磕在坚石上，火星迸溅，腕骨震颤麻木！]`);
      } else {
        const dmg = Math.floor(Math.random() * 8) + 1 + strMod;
        const hitResult = res.total >= 15 ? `【精准命中】造成伤害 1d8+${strMod} = 【${dmg} 点${dmgType}伤害】！` : `【挥击偏斜】未能穿透目标坚甲防备。`;
        sendPlayerAction(`我拔出腰间【${c.weapon.name}】，凌厉斩击而出！[出目 D20 (${res.d20}) + 命中加值 ${fmtMod(ab)} = 命中值 ${res.total} vs 预估防备 AC 15 —— ${hitResult}]`);
      }
    });
  };

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
});
