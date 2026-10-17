"""
《神都风云 · 问道大唐》PF1e 跑团系统后端服务
采用 FastAPI + Uvicorn + httpx 架构
提供 API 转发、进度持久化与 PF1e 规则校验支持
"""

import os
import json
import random
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 初始化 FastAPI 应用
app = FastAPI(
    title="《蘑菇灯沉浸跑团》PF1e 纯文字独立跑团引擎",
    description="基于开拓者一版 (PF1e) 核心规范与全题材通用宇宙规则的纯文字独立跑团系统",
    version="2.0.0"
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
SAVES_DIR = os.path.join(BASE_DIR, "saves")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(SAVES_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

# 关键：配置文件优先持久化存入宿主机挂载卷 SAVES_DIR，防止容器重启销毁
CONFIG_PATH = os.path.join(SAVES_DIR, "config.json")
LEGACY_CONFIG_PATH = os.path.join(BASE_DIR, "config.json")


def load_config() -> Dict[str, Any]:
    """读取配置文件（双路径安全回落）"""
    for p in [CONFIG_PATH, LEGACY_CONFIG_PATH]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data.get("api_key"):
                        return data
                    # 如果找到了有效文件但 key 为空，先暂存
                    fallback_data = data
            except Exception:
                pass
    if 'fallback_data' in locals():
        return fallback_data
    return {
        "api_key": "",
        "base_url": "https://api.deepseek.com",
        "model": "deepseek-flash",
        "port": 5432,
        "system_prompt_extra": ""
    }


def save_config(cfg: Dict[str, Any]) -> None:
    """写入配置文件（双重持久化写入 saves 与根目录）"""
    for p in [CONFIG_PATH, LEGACY_CONFIG_PATH]:
        try:
            with open(p, "w", encoding="utf-8") as f:
                json.dump(cfg, f, ensure_ascii=False, indent=2)
        except Exception:
            pass


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
    chronicles: Optional[List[str]] = None
    campaign_arc: Optional[Dict[str, Any]] = None
    time_of_day: Optional[str] = None
    npc_roster: Optional[List[Dict[str, Any]]] = None
    stream: Optional[bool] = True


@app.get("/")
async def root_index():
    """根路径原生直接输出静态游戏主页，免除 307 重定向，解决移动端和非标端口白屏"""
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/style.css")
async def get_css_root():
    """兼容根路径直连 style.css 资源"""
    return FileResponse(os.path.join(STATIC_DIR, "style.css"))


@app.get("/app.js")
async def get_js_root():
    """兼容根路径直连 app.js 资源"""
    return FileResponse(os.path.join(STATIC_DIR, "app.js"))


@app.get("/favicon.ico")
async def favicon_endpoint():
    """消除浏览器默认请求网站图标的 404 报错"""
    return Response(status_code=204)


@app.get("/api/rules/crb_catalog")
async def get_crb_catalog_endpoint():
    """直接调取项目内内置的纯正 CRB 核心规则全书条目"""
    rules_path = os.path.join(BASE_DIR, "rules", "crb_core_rules.json")
    if os.path.exists(rules_path):
        try:
            with open(rules_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            return {"error": f"读取核心典籍失败: {str(e)}"}
    return {"error": "未找到 rules/crb_core_rules.json"}


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


class SuggestionRequest(BaseModel):
    content: str


SUGGESTIONS_FILE = os.path.join(SAVES_DIR, "suggestions.json")


def load_suggestions() -> List[Dict[str, Any]]:
    """加载暂存的玩家迭代建议"""
    if not os.path.exists(SUGGESTIONS_FILE):
        return []
    try:
        with open(SUGGESTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_suggestions(data: List[Dict[str, Any]]):
    """保存玩家迭代建议"""
    with open(SUGGESTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.get("/api/suggestions")
async def get_suggestions_endpoint():
    """获取所有暂存的迭代建议"""
    return {"status": "ok", "suggestions": load_suggestions()}


@app.post("/api/suggestions")
async def add_suggestion_endpoint(req: SuggestionRequest):
    """追加一条新的迭代建议"""
    content = req.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="建议内容不可为空")
    items = load_suggestions()
    import datetime
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    item = {
        "id": len(items) + 1,
        "time": now_str,
        "content": content
    }
    items.append(item)
    save_suggestions(items)
    return {"status": "ok", "message": "建议已成功存入云端灵感录", "item": item}


@app.delete("/api/suggestions")
async def clear_suggestions_endpoint():
    """清空迭代建议"""
    save_suggestions([])
    return {"status": "ok", "message": "建议灵感录已清空"}


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


def build_system_prompt(
    character_info: Optional[Dict[str, Any]] = None, 
    theme: Optional[str] = None,
    chronicles: Optional[List[str]] = None,
    campaign_arc: Optional[Dict[str, Any]] = None,
    time_of_day: Optional[str] = None,
    npc_roster: Optional[List[Dict[str, Any]]] = None
) -> str:
    """构建严格遵循《Pathfinder v2.01简体》规则、全宇宙全题材万象通用叙事与人生编年史的司命 (DM) 系统提示词"""
    char_desc = "暂未建立人物卡"
    token_desc = "宿命通灵信物（前世伴生之物）"
    if character_info:
        char_desc = json.dumps(character_info, ensure_ascii=False, indent=2)
        prof = character_info.get("profile", {})
        if prof.get("token"):
            token_desc = prof.get("token")

    theme_context = theme if theme and theme.strip() else "尚未定夺（由玩家在首轮以任意故事题材告知）"
    current_time_str = time_of_day if time_of_day and time_of_day.strip() else "晨光熹微 / 07:30"

    # 构建长程记忆纪事区块
    chronicles_block = "暂无往前回目纪事（初启征程）"
    if chronicles and len(chronicles) > 0:
        chronicles_lines = [f"{i+1}. {c}" for i, c in enumerate(chronicles)]
        chronicles_block = "\n".join(chronicles_lines)

    # 构建宏观剧情大纲暗络区块
    arc_block = ""
    if campaign_arc:
        arc_block = f"""
【战役核心暗络大纲（★直接作为眼前具体事件推进，绝不准空转挂机★）】：
- 核心主线总纲：{campaign_arc.get('main_quest', '探明乱局真相，了却宿命心愿')}
- 支线暗络 A (恩怨/旧案/嫌犯)：{campaign_arc.get('side_a', '牵扯往昔的宿怨密辛')}
- 支线暗络 B (秘宝/信物/关键物证)：{campaign_arc.get('side_b', '涉案绝密物证或宿命机缘')}
- 支线暗络 C (暗桩/潜伏危机/时限)：{campaign_arc.get('side_c', '暗处窥伺的眼线与突发阻力')}
【★眼前推进绝命铁律★】：
严禁将上述主线当作遥不可及的远期大纲！司命在每一次推演中，必须将上述主线或支线的【具体物证、涉案嫌疑人、突发危机】直接砸到玩家眼前！
第一回合直接翻出物证/嫌犯线索；第二回合立刻引爆危机或场景转折！绝对严禁让玩家在一个房间里写八个回合！
"""

    # 构建已结识人物谱记忆区块
    npc_block = "暂无结缘角色（等待推演相逢）"
    if npc_roster and len(npc_roster) > 0:
        npc_lines = [f"• {npc.get('name')}: 【{npc.get('role', '未知')}】 态度:{npc.get('attitude', '中立')} | 关系羁绊:{npc.get('relation', '初识')}" for npc in npc_roster]
        npc_block = "\n".join(npc_lines)

    prompt = """你是一位精通《开拓者一版》（Pathfinder 1e / 核心规则书《Pathfinder v2.01简体》）规则、兼具文学大师造诣的传奇单人跑团地下城主（DM，司命）。
游戏引擎：《蘑菇灯沉浸跑团》。
当前战役处于开放自选题材天下，本场跑团锚定的背景题材为：【__THEME_CONTEXT__】。
当前推演世界时间流转锚点：【__CURRENT_TIME__】（司命在剧情中必须时刻遵循当前时间、天色光暗与昼夜作息！）。

【当前玩家 PF1e 人物卡数据（程序权威驱动，含外貌、身高体重、生平、专长与血脉特性）】：
```json
__CHAR_DESC__
```

【★ 随身信物 · 宿命羁绊之宝（绝非平庸凡物）★】：
当前玩家随身信物为：【__TOKEN_DESC__】。
此物乃玩家前世带来、或是贯穿其人生命运的宿命通灵之宝（宛如贾宝玉降生口中所衔之通灵宝玉）。
无论在古代朝堂、江湖武侠、现代都市职场商战、高三校园、悬疑谍战、科幻赛博或末世废土中，此物皆承载隐秘身世因果、关键机缘感应或重大剧情转折契机！

【★ 全题材自适应与装备/法术降维映射最高铁律（必遵铁律）★】：
1. 【种族骨相与题材解耦】：
   - 人物卡上的种族（精灵、矮人、半兽人等）代表角色的天生骨相底模与抗性潜能；
   - 在人类社会题材（现代都市、商战、校园、古代历史、武侠、民国）中，【主角必须 100% 是正统自然的人类形象，严禁西幻异形怪异描写】！
   - “精灵”转换为：身姿优雅轻盈、气质卓绝出众、耳聪目明、对药物/熏香具敏锐抗力；
   - “半兽人”转换为：身形魁梧雄奇、眼眸刚毅坚毅、体魄强健能抗高压的硬汉英姿；
   - “矮人”转换为：下盘稳固坚实、骨骼如磐石、千杯不醉且体质抗毒的扎实汉子。
2. 【装备随题材表皮化】：
   - 现代职场/商战：轻甲/重甲转换为高定防风大衣、防弹轻质西服内衬；长剑/短刀转换为合金防身钢笔、战术折叠刀或手提箱；
   - 古代/武侠：防具转换为贴身金丝软甲、流云道袍与轻灵身法；武器转换为发间银簪、袖中暗刃、折扇；
   - 赛博朋克：防具转换为皮下碳纤维织物、战术风衣；武器转换为电磁震荡匕首、隐蔽神经脉冲笔；
   - 程序卡面上的 AC、武器攻击骰与加值 100% 权威生效！
3. 【法术/异能日常隐蔽性与“被识破风险”真实法则】：
   - 术士/法师的小法术或特殊异能必须融入生活举止（如指尖暗敛、微波拂面、借递物借机触碰、垂眸心神暗动）；
   - 普通凡人往往无法看见微光法术，通常只当作巧合、气场压制或莫名走神；
   - 【严禁无脑爽文，高手必定起疑】：若玩家频繁在同一人面前施法，或面对敏锐老辣的对手（精明的副总、刑侦经侦、老谋深算的宿敌、金丹修士），对方会敏锐察觉异样、起疑并暗中防备查探！

【结缘人物谱（短期记忆锚点，绝不混淆姓名与好感）】：
__NPC_BLOCK__
【★ 人物谱动态更新机制 ★】：
每当推演中出现有名有姓的重要 NPC、或者既有 NPC 对玩家的态度/好感/羁绊发生实质性转折时，司命在本次回复最末尾必须附带标准机器标记：
[NPC: {"name": "角色名", "role": "身份/阵营", "attitude": "友善/警惕/敌对/中立/利用/崇拜", "relation": "一句话关系与当下羁绊"}]

【行者历代风云编年史（真实长程记忆库，按时间线忠实记录，永不遗忘）】：
__CHRONICLES_BLOCK__
__ARC_BLOCK__

【核心文风与时空动能五大铁律（绝对严格遵循，违者重构）】：
1. 【单场景 2 回合强制转场令（严禁一室多磨，严禁一个房间写八个回合！）】：
   任何单一密闭环境（办公室、闺房、茶室、密室、街角），最多只允许 1~2 回合的处理！
   一旦该处动作或交谈交代完毕，司命必须主动使用电影剪辑手法推进时空与场景，将镜头坚决拉向充满新线索与新危机的新现场！绝对严禁让玩家原地打转！
2. 【主线与支线紧迫具象化（从后台摆设变成眼前推进器）】：
   司命在【每一个回合】的推演中，必须将主线或支线的核心线索、关键人物、冲突变故直接推到玩家眼前（如带血的单据残页、突然登门查验的涉案要员、隔壁传来的异动），让每一步都在推进破局！
3. 【严苛脱水与字数红线（150~220 字极速响应）】：
   单次情境描写严格控制在 150 到 220 字之间，杜绝注水网文，3~5 秒极速生成！
   - 静态环境描写不超过 1 句；
   - 严禁替玩家代入大段心理独白或感慨；
   - 硬朗叙事：动作结果（1句）+ 局势转折与新事件（1~2句）+ 眼前逼近的新抉择（1句）。
4. 【时间推进标记】：
   若本回合动作耗时明显或场景发生较大跨度转移，请在回复最末尾输出：
   [TIME: "更新后的时间/时辰"]（例如：[TIME: "辰时二刻 / 08:30"]）
5. 【收束悬念与行动启发建议（1~2个突破口）】：
   描写的最后一句话定格在紧迫关口，并抛出紧凑收束句：“局势已生转折，你接下来如何破局？”
   同时在末尾输出 1~2 个关键突破启发供前端呈现：
   [SUGGESTIONS: ["探查案桌暗格", "借故推脱离开"]]

【核心跑团检定：意图声明与索骰确认/变卦闭环铁律（跑团灵魂所在）】：
0. 【检定克制门禁与“信息增量检定”铁律】：
   常规交谈、日常闲聊喝茶、常识性查看周围等【绝对严禁索骰，直接顺畅生动地推进叙事】！
   - 深度探查/摸尸搜刮：成功得额外线索物证，未过仅是常物无获，剧情平稳继续，严禁乱扣血！
   - 唯有在面临实质性重大物理阻力、生死一线搏杀、极难说服等关头，方才索骰检定。
1. 绝对严禁提前判定成败（No Premature Outcome）：
   当玩家声明包含重大阻力的高危行动时，在投骰前绝对严禁描写是否成功的结果！
2. 定格临界一瞬并索骰确认：
   输出标准的机器标记：
   [CHECK: 检定名称 | DC: 难度数值 | REASON: 简要判据]
   并在其后明确问询玩家：
   “此举需进行【检定名称】检定（DC: XX），你是执意掷骰，还是暂避锋芒另谋他法？”
3. 两大赛道闭环（掷骰 vs 变卦）：
   - 赛道 A · 执意掷骰并结算：收到投骰对抗结算后，根据实际出目成败冷峻刻画物理与现实后果。
   - 赛道 B · 放弃变卦与改弦易辙：当收到【玩家变卦撤回】报文时，司命理解为行者在最后一瞬收力回撤、未触动机关或未激化局势，绝对严禁惩罚！生动描摹局势暂缓，并询问行者改作何打算。
4. 【PF1e 5 尺战棋战术沙盘（★唯致命交火/刺杀死斗时展开，平时保持纯文本★）】：
   仅在爆发不可避免的武力血战时展开：
   [COMBAT: {"player": {"x": 2, "y": 5}, "enemies": [{"name": "敌方名号", "x": 7, "y": 5, "hp": 10, "maxHp": 10}]}]
   战斗结束输出：[COMBAT_END]
5. 【战后结算与战利品入库】：
   [REWARD: {"xp": 经验值, "gp": 碎银或资金数, "items": [{"name": "物品名", "category": "gear/weapon/potion", "weight": 磅数, "desc": "说明"}], "reason": "结算事由"}]
6. 【天命继业 · 生死由命、落子无悔】：
   行者若力竭陨落，世界主线与历史编年史完好存续，后人以新行者之躯承接先人遗物与未竟之志再入大局！
"""
    return prompt.replace("__THEME_CONTEXT__", theme_context).replace("__CURRENT_TIME__", current_time_str).replace("__CHAR_DESC__", char_desc).replace("__TOKEN_DESC__", token_desc).replace("__CHRONICLES_BLOCK__", chronicles_block).replace("__ARC_BLOCK__", arc_block).replace("__NPC_BLOCK__", npc_block)


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    """
    核心对话流转接口
    连接 DeepSeek / OpenAI 兼容接口，并支持流式生成与模拟测试模式
    默认选用 deepseek-chat 高性能模型 (具备长程上下文支持)
    """
    import httpx
    cfg = load_config()
    api_key = cfg.get("api_key", "").strip()
    base_url = cfg.get("base_url", "https://api.deepseek.com").rstrip("/")
    model = cfg.get("model", "deepseek-chat")

    # 构建完整的消息链，将系统提示词置顶 (注入长程记忆、时间锚点与结缘人物谱)
    sys_prompt = build_system_prompt(
        character_info=req.character_info,
        theme=req.theme,
        chronicles=req.chronicles,
        campaign_arc=req.campaign_arc,
        time_of_day=req.time_of_day,
        npc_roster=req.npc_roster
    )
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

    # 已配置 API Key，发起异步流式请求 (扩容至 90 秒超时，保障大模型深思不中断)
    client = httpx.AsyncClient(timeout=90.0)

    async def event_generator():
        try:
            url = f"{base_url}/chat/completions"
            payload = {
                "model": model,
                "messages": full_messages,
                "stream": True,
                "temperature": 0.75,
                "max_tokens": 500,
                "presence_penalty": 0.45
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
