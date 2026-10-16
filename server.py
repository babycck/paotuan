"""
《神都风云 · 问道大唐》PF1e 跑团系统后端服务
采用 FastAPI + Uvicorn + httpx 架构
提供 API 转发、进度持久化与 PF1e 规则校验支持
"""

import os
import json
import random
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 初始化 FastAPI 应用
app = FastAPI(
    title="神都风云 · 问道大唐 PF1e 跑团引擎",
    description="基于开拓者一版 (PF1e) 规则与全自由题材的纯文字独立跑团系统",
    version="1.1.0"
)

# 允许跨域请求以支持局域网或内网穿透访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
SAVES_DIR = os.path.join(BASE_DIR, "saves")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(SAVES_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)


def load_config() -> Dict[str, Any]:
    """读取配置文件"""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "api_key": "",
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-flash",
        "port": 5432,
        "system_prompt_extra": ""
    }


def save_config(cfg: Dict[str, Any]) -> None:
    """写入配置文件"""
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)


# 请求与响应模型定义
class ConfigUpdateRequest(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    port: Optional[int] = None
    system_prompt_extra: Optional[str] = None


class SaveDataRequest(BaseModel):
    data: Dict[str, Any]
    filename: Optional[str] = "default_save.json"


class DiceRollRequest(BaseModel):
    dice_type: str = "d20"
    count: int = 1
    modifier: int = 0
    keep_highest: Optional[int] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    character_info: Optional[Dict[str, Any]] = None
    theme: Optional[str] = None
    stream: Optional[bool] = True


@app.get("/")
async def root_redirect():
    """根路径自动跳转至静态游戏主页"""
    return RedirectResponse(url="/static/index.html")


@app.get("/api/config")
async def get_config_endpoint():
    """获取当前服务配置（对 API Key 进行脱敏展示）"""
    cfg = load_config()
    raw_key = cfg.get("api_key", "")
    masked_key = ""
    if raw_key:
        if len(raw_key) > 8:
            masked_key = raw_key[:4] + "*" * (len(raw_key) - 8) + raw_key[-4:]
        else:
            masked_key = "***"
    return {
        "has_api_key": bool(raw_key.strip()),
        "masked_api_key": masked_key,
        "base_url": cfg.get("base_url", "https://api.deepseek.com"),
        "model": cfg.get("model", "deepseek-flash"),
        "port": cfg.get("port", 5432),
        "system_prompt_extra": cfg.get("system_prompt_extra", "")
    }


@app.post("/api/config")
async def update_config_endpoint(req: ConfigUpdateRequest):
    """更新服务配置"""
    cfg = load_config()
    if req.api_key is not None and req.api_key.strip() != "":
        cfg["api_key"] = req.api_key.strip()
    if req.base_url is not None and req.base_url.strip() != "":
        cfg["base_url"] = req.base_url.strip().rstrip("/")
    if req.model is not None and req.model.strip() != "":
        cfg["model"] = req.model.strip()
    if req.port is not None:
        cfg["port"] = req.port
    if req.system_prompt_extra is not None:
        cfg["system_prompt_extra"] = req.system_prompt_extra
    save_config(cfg)
    return {"status": "ok", "message": "配置更新成功"}


@app.post("/api/save")
async def save_game_endpoint(req: SaveDataRequest):
    """保存跑团档案"""
    filename = req.filename or "default_save.json"
    if not filename.endswith(".json"):
        filename += ".json"
    save_path = os.path.join(SAVES_DIR, filename)
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(req.data, f, ensure_ascii=False, indent=2)
    return {"status": "ok", "message": "档案保存成功"}


@app.get("/api/load")
async def load_game_endpoint(filename: str = "default_save.json"):
    """读取跑团档案"""
    if not filename.endswith(".json"):
        filename += ".json"
    save_path = os.path.join(SAVES_DIR, filename)
    if not os.path.exists(save_path):
        raise HTTPException(status_code=404, detail="未找到对应存档文件")
    with open(save_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {"status": "ok", "data": data}


@app.post("/api/roll")
async def roll_dice_endpoint(req: DiceRollRequest):
    """
    通用 PF1e 投骰接口
    支持 4d6k3（属性生成）、d20 检定及各类伤害骰
    """
    results = []
    dice_sides = {
        "d4": 4, "d6": 6, "d8": 8, "d10": 10, "d12": 12, "d20": 20, "d100": 100
    }.get(req.dice_type.lower(), 20)

    for _ in range(req.count):
        results.append(random.randint(1, dice_sides))

    if req.keep_highest and req.keep_highest < len(results):
        sorted_res = sorted(results, reverse=True)
        kept = sorted_res[:req.keep_highest]
        dropped = sorted_res[req.keep_highest:]
        total = sum(kept) + req.modifier
        return {
            "rolls": results,
            "kept": kept,
            "dropped": dropped,
            "modifier": req.modifier,
            "total": total
        }
    else:
        total = sum(results) + req.modifier
        return {
            "rolls": results,
            "modifier": req.modifier,
            "total": total
        }


def build_system_prompt(character_info: Optional[Dict[str, Any]] = None, theme: Optional[str] = None) -> str:
    """构建严格遵循《Pathfinder v2.01简体》规则、文风铁律与动态题材的司命 (DM) 系统提示词"""
    char_desc = "暂未建立人物卡"
    if character_info:
        char_desc = json.dumps(character_info, ensure_ascii=False, indent=2)

    theme_context = theme if theme and theme.strip() else "尚未定夺（等待玩家以故事背景告知）"

    prompt = f"""你是一位精通《开拓者一版》（Pathfinder 1e / 核心规则书《Pathfinder v2.01简体》）规则的传奇跑团地下城主（DM，司命）。
当前战役处于开放自选题材天下，本场跑团锚定的背景题材为：【{theme_context}】。

【当前玩家 PF1e 人物卡数据】：
```json
{char_desc}
```

【核心工作流三阶段总纲】：
阶段一：【遵守《Pathfinder v2.01简体》的问询式车卡】
若玩家尚未定夺完整人物卡（或正在车卡交流）：
你须以沉稳古雅、严谨精确的口吻，严格遵守《Pathfinder v2.01简体》规则体系，通过逐步问询引导玩家车卡：
1. 问天命六维：指导以 4d6k3（4d6 剔除最低 1 枚）摇骰并归位力量 (STR)、敏捷 (DEX)、体质 (CON)、智力 (INT)、感知 (WIS)、魅力 (CHA)，准确推导修正值。
2. 问天生血脉：从核心7族（人类、矮人、精灵、侏儒、半身人、半精灵、半兽人）中选择，应用精准属性修正与种族特性（体型、移速、视觉等）。
3. 问仗剑门派：从11大核心职业（野蛮人、吟游诗人、牧师、德鲁伊、战士、武僧、圣武士、游侠、游荡者、术士、法师）中选择，按1级满额HD配置HP、满/中/慢BAB、优良豁免与本职技能。
4. 问身世绝活：挑选身世背景特性（如反制者：先攻+2；老练佣兵：意志+1等），配置入门专长（如猛力攻击），分配1级技能点并核算本职+3胜任加值与防具检定减值 (ACP)。
5. 问信物定魄：定夺名号尊称、性别年龄、形象外貌与前尘携带之信物道具。
每次提问务必克制聚焦，待玩家回应后再推进，直至命契圆满。

阶段二：【故事题材定位与开局切入点三分支（★全篇唯此一处提供选项★）】
当车卡定魄完成后，玩家会以自己的语言输入他想玩的故事世界（如“我想玩一个穿越到古代的故事”、“宋末边关谍战”、“唐代武周诡案”等，可能较宽泛或模糊）。
此时，你必须深刻理解该题材，并【量身提炼设计 3 个风格迥异、极具戏剧张力的开局切入点情境分支】供玩家抉择，外加 1 个自由拟定项：
- 【分支一 · 绝境喋血 / 生死逃亡】：具象描摹刀架在脖子上、身陷大狱或被追杀至死角的突发危局，开场即是生死博弈。
- 【分支二 · 诡案悬疑 / 幽夜惊魂】：具象描摹诡异凶杀案、深邃古宅秘辛或暗流涌动的谜团漩涡，开场即是查验线索。
- 【分支三 · 豪门权谋 / 密谋暗战】：具象描摹高门贵府、权贵夜宴或深宫密探的契约杀机，开场即是身份周旋。
- 【分支四 · 自由定夺】：若上述分支皆非所愿，行者亦可直接打字描述你想置身的第一幕开局现场。
结尾必须明确发问：“请问行者意欲从哪一个开局分支破局而入？”

★全篇唯一选项铁律★：
全篇单人跑团故事中，【唯独在开局定夺切入点时有且仅有这一次选项分支】！
一旦玩家选定某一分支（或自拟进入），第一幕大戏即刻正式拉开。
【后续全篇跑团彻底、永久封印任何预设选项（严禁再出 ABCD 选择题）】，后续一切推进全部由玩家在输入框中完全自由打字输出行动与真实台词！

阶段三：【硬核单人跑团实装与意图声明/索骰变卦闭环】
第一幕拉开后，严格执行【五大文风铁律】与【跑团检定判定铁律】进行单人推演。

【核心文风与感官摹写五大铁律（绝对严格遵循）】：
1. 严禁宏大抒情与空洞形容词：禁止使用“极其恐怖”、“神秘莫测”、“英勇非凡”、“杀气腾腾”、“极其危险”等一切空洞抽象虚词。一切气氛必须通过客观、可感的感官细节呈现——声响、气味、冷热、光影、触觉与身体生理反应（如：生锈铁甲摩擦的滞涩钝响、雨水混着马粪与湿泥的酸馊味、地窖油灯爆开的灯花与焦油烟气、冰冷刀刃贴在颈侧皮肉上的寒战、喉管里泛起的血腥甜味、藤条倒刺带着的血腥气与管事嘴里的蒜臭味）。
2. 刀笔凝练，留白克制：语言要有唐宋传奇、魏晋志怪与硬派武侠的冷硬筋骨，句式长短相间。多用具象动词与短名词，严禁堆砌无意义的冗长修饰定语。单次情境描写严格控制在 150 到 350 字之间，节奏如弓弦绷紧，绝不拖泥带水。
3. 动态物理细节与交互阻力：战斗、格斗、潜行或环境动作必须呈现真实的物理阻力与环境反馈：写出刀锋砍在坚硬皮甲上的反弹滑脱、脚底踩碎枯枝烂草的细微动静、泥水飞溅在眼皮上的刺痛、冷风灌进衣领的刺骨感、拉满弓弦时弓梢的轻颤与手指勒痕。
4. 绝对零说教、零总结、零旁白复盘：描写结束立刻刹车！严禁在结尾出现“这意味着……”、“这不仅是一场……”、“宿命的齿轮……”、“此时此刻你明白……”等任何居高临下的旁白复盘与主观总结。
5. 永远停在临界点：描写的最后一句话永远是将刀锋、脚步、呼吸或悬念悬在半空，紧接着必须且唯一地抛出收束句：“你接下来要干嘛？”

【核心跑团检定：意图声明与索骰确认/变卦闭环铁律（跑团灵魂所在）】：
跑团的核心精髓就是：声明意图 -> 裁定检定 -> 索骰确认/允许变卦 -> 投骰裁决。司命必须严格遵循以下执行程序：
1. 绝对严禁提前判定成败（No Premature Outcome）：
   当玩家声明行动（如“我要用铁棒砸他手腕”、“我拔刀偷袭他”、“我翻窗逃跑”）时，【绝对严禁在玩家投骰前描写动作是否命中或是否成功的实际结果】！绝对不可擅自替骰子做主！
2. 定格临界一瞬并索骰确认：
   司命仅可描写动作发起、双方气机交锋、兵刃破空将至未至、环境骤然紧绷的临界画面。随后必须立刻刹车，向玩家索取检定并确认意图：
   必须在描写末尾输出标准的机器标记：
   [CHECK: 检定名称 | DC: 难度数值 | REASON: 简要判据]
   并在其后明确问询玩家：
   “此举需进行【检定名称】检定（DC: XX），你是执意掷骰，还是暂避锋芒另谋他法？”
3. 两大赛道闭环（掷骰 vs 变卦）：
   - 赛道 A · 执意掷骰并结算：
     当玩家点击投骰，前端传入诸如 `【XXX检定对抗结算】：投出 D20 (X) + 加值 (X) = 总计 X vs 目标 DC XX —— 【成功/受挫】` 的结算指令时，司命方可在新一轮回复中，根据实际出目成败冷峻刻画物理后果：
     若成功：刀刃切入皮肉、骨裂脆响、敌手惨嚎后退或机敏脱险；
     若失败：贯彻“失败推进（Fail Forward）”哲学，动作受阻、兵器被格开震麻虎口、险象环生或招致反击，局势恶化但永远保留应变破局之机。
   - 赛道 B · 放弃变卦与改弦易辙：
     若玩家看到检定难度（DC）过高，或在输入框中明确表示变卦（例如“那我先不砸了，我偷袭他” / “那我改口求饶麻痹他” / “那我往后翻滚拉开距离”）：
     司命必须【100% 允许玩家无损撤销变卦，严禁惩罚】！司命应即刻描写玩家收敛动作、撤回原势的凝滞瞬间，并针对玩家变卦后的全新行动，重新评估新行动对应的检定（如将力量/攻击检定转为欺骗、隐匿或特技检定），重新输出新的 `[CHECK: ...]` 标记并再次发问确认！
"""
    return prompt


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    核心对话流转接口
    连接 DeepSeek / OpenAI 兼容接口，并支持流式生成与模拟测试模式
    默认选用 deepseek-flash 高性能模型
    """
    import httpx
    cfg = load_config()
    api_key = cfg.get("api_key", "").strip()
    base_url = cfg.get("base_url", "https://api.deepseek.com").rstrip("/")
    model = cfg.get("model", "deepseek-flash")

    # 构建完整的消息链，将系统提示词置顶
    sys_prompt = build_system_prompt(req.character_info, req.theme)
    if cfg.get("system_prompt_extra"):
        sys_prompt += "\n" + cfg["system_prompt_extra"]

    full_messages = [{"role": "system", "content": sys_prompt}]
    for msg in req.messages:
        full_messages.append({"role": msg.role, "content": msg.content})

    # 若未配置 API 密钥，提供离线测试模式
    if not api_key:
        async def mock_stream():
            last_msg = req.messages[-1].content if req.messages else ""
            char_name = (req.character_info or {}).get("profile", {}).get("name", "行者")
            theme_choice = req.theme or "开放自由题材"

            # 场景 1：如果收到检定结算
            if "对抗结算" in last_msg or "D20" in last_msg:
                is_win = "【成功】" in last_msg
                if is_win:
                    mock_text = (
                        "【司命裁决】（离线模拟推演）：\n\n"
                        "骰锋定势，力透寸劲！你手腕猛然一抖，劲力顺着臂膀疾吐而出，破空声尖啸炸裂。\n\n"
                        "对手显然未料到你变招如此果决，面颊肌肉猛然抽搐，身形狼狈地向侧方踉跄退开两步，后背重重撞在斑驳的土墙上，震落一蓬簌簌尘土。周围原本嘈杂的声响瞬间窒息了一瞬。\n\n"
                        "你接下来要干嘛？"
                    )
                else:
                    mock_text = (
                        "【司命裁决】（离线模拟推演）：\n\n"
                        "势道稍逊！你的动作方才展开半寸，脚底湿滑的青苔骤然滑脱，重心蓦地一晃。\n\n"
                        "对方眼中凶光暴涨，狞笑一声，手中带刺的藤条挟着腥臭的厉风横扫而来，狠狠抽打在门柱上，木屑四溅！局面骤然紧绷到了极点。\n\n"
                        "[CHECK: 特技 | DC: 13 | REASON: 借势后空翻脱出藤条反击笼罩范围]\n\n"
                        "此举需进行【特技】检定（DC: 13），你是执意掷骰，还是暂避锋芒另谋他法？"
                    )
            # 场景 2：玩家提出故事题材或开局模糊设想
            elif ("古代" in last_msg or "穿越" in last_msg or "想玩" in last_msg or len(req.messages) <= 2) and not any(k in last_msg for k in ["分支一", "分支二", "分支三", "选", "砸", "偷袭", "做"]):
                mock_text = (
                    f"【司命立卷 · 开局切入点抉择】（当前运行于离线测试模式）：\n\n"
                    f"天地苍茫，依行者所愿，大幕徐徐向【{theme_choice}】垂落。针对阁下所设之宏阔天下，司命特提炼出三大最具戏剧张力之开局切入点情境分支：\n\n"
                    "◆【分支一 · 绝境喋血 / 生死逃亡】：\n"
                    "你从刺骨冰冷的血泊泥泞中惊醒，后脑剧痛，双手被浸油麻绳反绑在柴房木桩上。门外传来管事恶狠狠的咒骂与磨刀石霍霍的刺耳尖响，距离他们推门灭口只剩数息。\n\n"
                    "◆【分支二 · 诡案悬疑 / 幽夜惊魂】：\n"
                    "暴雨狂倾的破旧驿站内，通判大人暴毙在锁死的账房之中，胸口插着一柄无柄短刃，七窍流出的黑血正顺着地板裂隙蜿蜒渗向你的脚边。门外捕快撞门的巨响越来越急。\n\n"
                    "◆【分支三 · 豪门权谋 / 密谋暗战】：\n"
                    "高门王府夜宴笙歌，你作为贴身随侍执壶侍立屏风之后。你袖中正暗藏着一纸能颠覆整个朝野的绝密通敌密函，而座上的王爷刚刚将冰冷探究的目光落在了你的指尖上。\n\n"
                    "◆【分支四 · 自由定夺】：若上述分支皆非所愿，行者亦可直接打字描述你想置身的第一幕开局现场！\n\n"
                    "（★全篇单人跑团中，唯独此处提供开局选项分支；选定之后，后续全篇将彻底封印任何选项，转入纯自然语言与真实台词博弈★）\n\n"
                    "请问行者意欲从哪一个开局分支破局而入？"
                )
            # 场景 3：玩家声明了攻击或动作意图（如“我要砸他”、“偷袭他”）
            elif any(w in last_msg for w in ["砸", "打", "杀", "偷袭", "砍", "冲", "夺", "推"]):
                mock_text = (
                    "【意图定格 · 临界瞬息】（离线模拟推演）：\n\n"
                    "杀机陡生！你指节发白，猛然暴起发力，浑身筋肉骤然如满月硬弓般绷紧，手中物什挟着呼啸风声直奔对方面门疾砸而去！\n\n"
                    "对方瞳孔骤然收缩，嘴里的恶骂戛然而止，本能地抬臂想要护住面门，双方距离不过半尺，破空脆响一触即发！\n\n"
                    "[CHECK: 攻击 | DC: 13 | REASON: 猝然暴起近身挥砸敌手面门]\n\n"
                    "此举需进行【攻击】检定（DC: 13），你是执意掷骰，还是暂避锋芒另谋他法？"
                )
            # 场景 4：其他常规推演
            else:
                mock_text = (
                    "【司命定格】（离线模拟推演）：\n\n"
                    "藤条的倒刺还带着血腥气，管事那张干瘪蜡黄的脸几乎贴到你鼻尖上，嘴里喷着刺鼻的蒜臭味，恶狠狠地等着你反应。\n\n"
                    "周围几个伙夫死死低着头剁肉，笃笃笃的声音越来越急，谁也不敢往这边看一眼。脚边木桶里，两条两尺多长的肥大黑鲤鱼正拼命拍打着尾巴，浑浊的水花溅在你破烂的草鞋上。\n\n"
                    "管事的藤条再次抬起，在半空中虚抽了一下，发出呼呼的破风声：\n"
                    "“装聋作哑的贼胚，真当爷不敢拿你填灶膛？！回话！”\n\n"
                    "你接下来要干嘛？"
                )
            for chunk in mock_text:
                yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    # 已配置 API Key，发起异步流式请求
    client = httpx.AsyncClient(timeout=60.0)

    async def event_generator():
        try:
            url = f"{base_url}/chat/completions"
            payload = {
                "model": model,
                "messages": full_messages,
                "stream": True,
                "temperature": 0.7
            }
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                if resp.status_code != 200:
                    err_body = await resp.aread()
                    err_msg = f"\n[API 错误 ({resp.status_code})]: {err_body.decode('utf-8', errors='ignore')}"
                    yield f"data: {json.dumps({'content': err_msg}, ensure_ascii=False)}\n\n"
                    yield "data: [DONE]\n\n"
                    return

                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        raw_data = line[6:].strip()
                        if raw_data == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                        try:
                            parsed = json.loads(raw_data)
                            delta = parsed.get("choices", [{}])[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                yield f"data: {json.dumps({'content': content}, ensure_ascii=False)}\n\n"
                        except Exception:
                            continue
        except Exception as e:
            err_msg = f"\n[请求异常]: {str(e)}"
            yield f"data: {json.dumps({'content': err_msg}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        finally:
            await client.aclose()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# 静态文件挂载
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if __name__ == "__main__":
    import uvicorn
    cfg = load_config()
    port = int(cfg.get("port", 5432))
    print(f"《神都风云 · 问道大唐》跑团引擎启动中... 访问地址: http://127.0.0.1:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
