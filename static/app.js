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
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`服务器响应异常: ${response.status}`);
    }

    let hasReceivedFirstChunk = false;
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
              if (!hasReceivedFirstChunk) {
                hasReceivedFirstChunk = true;
                if (timerInterval) {
                  clearInterval(timerInterval);
                  timerInterval = null;
                }
                contentElem.innerHTML = "";
              }
              accumulatedText += parsed.content;
              contentElem.innerHTML = accumulatedText
                .replace(/\[REWARD:.*?\]/g, "")
                .replace(/\[CHECK:.*?\]/g, "")
                .replace(/\[QUEST:.*?\]/g, "")
                .replace(/\[COMBAT:.*?\]/g, "")
                .replace(/\[COMBAT_UPDATE:.*?\]/g, "")
                .replace(/\[COMBAT_END\]/g, "")
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

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // 后处理：解析主线任务指令、战利品、索骰与战斗指令
    let processedText = accumulatedText;

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

    const cleanFinalText = parseAndHandleCheckDirective(processedText);
    contentElem.innerHTML = cleanFinalText
      .replace(/\n\n/g, "</p><p>")
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

    // 智能依据当前世界观题材初选志向（彻底破除无脑塞给力量最高的偏见）
    let defaultPreset = "balanced";
    const theme = (state.theme || "").toLowerCase();
    if (/考|清华|学|题|谋|文|书|策|智/.test(theme)) {
      defaultPreset = "scholar";
    } else if (/妃|宠|宫|商|老板|谈|社交|美|情|爱/.test(theme)) {
      defaultPreset = "noble";
    } else if (/厨|餐馆|菜|饭|潜|影|贼|偷|刺客/.test(theme)) {
      defaultPreset = "artisan";
    } else if (/战|杀|武|砍|霸|士|军/.test(theme)) {
      defaultPreset = "warrior";
    }

    renderAbilityAssignmentGrid();
    initArchetypePresets();
    applyArchetypePreset(defaultPreset);
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

  // 若为传奇继承者（前人陨落，后人接力），保留世界观题材、暗络大纲与编年史
  if (state.isLegacySuccession) {
    state.isLegacySuccession = false;
    const legacyIntro = `【传奇继承者破局入局】：前代行者虽已长眠，但因果未断、主线犹存！新一代行者【${nameInput}】（时年 ${ageInput} 岁，${race}${cls}）身携【${tokenInput}】，追寻前代遗留的蛛丝马迹与未竟之局正式入局！\n\n请司命以此全新视角，紧密承接前代行者的故事线索展开推演！`;
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
    btn.title = `【${sk.name}】(${sk.attr})\n${bonusInfo.detail}\n点击直接带加值投骰对抗！`;

    const icon = SKILL_ICONS[sk.name] || "🎯";
    let displayName = sk.name.replace("知识(", "").replace(")", "知");
    if (displayName.length > 4) displayName = displayName.slice(0, 4);

    btn.innerHTML = `
      <span class="sk-name">${icon} ${displayName}</span>
      <span class="sk-mod">${fmtMod(bonusInfo.bonus)}</span>
    `;

    btn.onclick = () => {
      performDiceRoll(`${sk.name}检定`, bonusInfo.bonus, 12, (result) => {
        const sendText = `【玩家主动发起 · ${sk.name}检定】：投出 D20 (${result.d20}) + 修正总加值 (${fmtMod(result.bonus)}) [${bonusInfo.detail}] = 终值 ${result.total}（请司命依此推演判定后果与局势变化）`;
        sendPlayerAction(sendText);
      });
    };

    container.appendChild(btn);
  });
}

// =========================================================
// 8.2 掌中秘术 · 道法天书专区 (Spells & Combat Arts)
// =========================================================

const CLASS_SPELL_PRESETS = {
  "法师": {
    isCaster: true,
    title: "📖 奥术真解 · 每日秘术",
    slots: { current: 2, max: 2 },
    spells: [
      { name: "光亮术", level: "0环戏法", school: "塑能", desc: "指尖燃起明澈温光，照亮方圆20尺" },
      { name: "法师之手", level: "0环戏法", school: "变化", desc: "隔空念力搬运移送5磅以内的未被握持之物" },
      { name: "侦测魔法", level: "0环戏法", school: "预言", desc: "察知方圆60尺内的奥术灵光与魔法陷阱" },
      { name: "魔法飞弹", level: "1环法术", school: "塑能", isSlot: true, desc: "发射1枚必中力场飞弹，必中造成 1d4+1 伤害" },
      { name: "法师护甲", level: "1环法术", school: "咒法", isSlot: true, desc: "唤出隐形力场盔甲护体，提供 AC+4 防御" },
      { name: "睡眠术", level: "1环法术", school: "惑控", isSlot: true, desc: "令最多4HD敌对目标陷入沉睡（意志豁免）" }
    ]
  },
  "牧师": {
    isCaster: true,
    title: "📖 神圣法典 · 天恩神术",
    slots: { current: 2, max: 2 },
    spells: [
      { name: "神导术", level: "0环神术", school: "预言", desc: "祈求神恩，令下一次检定或攻击获得 +1 幸运加值" },
      { name: "稳定伤势", level: "0环神术", school: "咒法", desc: "立止濒死者流血，使其伤势稳定不再失血" },
      { name: "治疗轻伤", level: "1环神术", school: "咒法", isSlot: true, desc: "灌注神圣生机，回复 1d8+1 点生命值" },
      { name: "祝福术", level: "1环神术", school: "惑控", isSlot: true, desc: "神圣庇佑，全体友方攻击命中与恐慌豁免+1" }
    ]
  },
  "吟游诗人": {
    isCaster: true,
    title: "📖 狂想诗篇 · 音律秘咒",
    slots: { current: 2, max: 2 },
    spells: [
      { name: "舞光术", level: "0环戏法", school: "塑能", desc: "编织四团若隐若现的灵动光球引路" },
      { name: "轻风术", level: "0环戏法", school: "变化", desc: "凭空生出拂面清风，熄灭火烛或吹散烟雾" },
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
    row.innerHTML = `
      <div class="spell-info">
        <div class="spell-name-row">
          <span class="spell-name">${spell.name}</span>
          <span class="spell-level-badge">${spell.level}</span>
        </div>
        <div class="spell-desc">${spell.desc}</div>
      </div>
      <button class="btn btn-cast-spell" title="一键施展并将动作代入对白">${preset.isCaster ? '✨ 念咒施展' : '⚡ 施展'}</button>
    `;

    const castBtn = row.querySelector(".btn-cast-spell");
    castBtn.onclick = () => {
      if (spell.isSlot) {
        if (state.spellSlots.current <= 0) {
          alert(`${preset.isCaster ? '今日1环法术位已用尽，需安歇冥想方可恢复！' : '当前战气已耗尽，需稍作喘息！'}`);
          return;
        }
        state.spellSlots.current -= 1;
        renderSpellsCard();
      }

      const actionText = preset.isCaster
        ? `【行者起手施法】：我屏气凝神，指捏法印低诵玄真咒诀，调动奥术/神圣灵光，全力施展【${spell.name}】（${spell.desc}）！`
        : `【行者爆发战技】：我身形如电，步踏中宫，全力施展【${spell.name}】（${spell.desc}）！`;

      sendPlayerAction(actionText);
    };

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
      if (json.data.notes) {
        const notesElem = document.getElementById("player-notes");
        if (notesElem) notesElem.value = json.data.notes;
        localStorage.setItem("pf1e_player_notes", json.data.notes);
      }
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

  // 战斗开启 (唯战斗触发时自动展开沙盘)
  startCombat(combatData) {
    this.initOrUpdate(combatData);
    this.show();
    audio.playDiceRoll();
    this.updateMeter(`⚔️ 【交锋打响】：遭遇 [${this.state.enemies[0]?.name || '敌手'}]！可在下方打字描述你的战术走位与出手动作。`);
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
  const btnRoll = document.getElementById("btn-levelup-roll");
  const btnAvg = document.getElementById("btn-levelup-avg");
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

  // 3. 初始化车卡向导与设置模态框
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
