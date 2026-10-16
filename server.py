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


def build_system_prompt(character_info: Optional[Dict[str, Any]] = None, theme: Optional[str] = None) -> str:
    """构建严格遵循《Pathfinder v2.01简体》规则、全宇宙全题材万象叙事与人生编年史的司命 (DM) 系统提示词"""
    char_desc = "暂未建立人物卡"
    if character_info:
        char_desc = json.dumps(character_info, ensure_ascii=False, indent=2)

    theme_context = theme if theme and theme.strip() else "尚未定夺（等待玩家以故事背景告知）"

    prompt = f"""你是一位精通《开拓者一版》（Pathfinder 1e / 核心规则书《Pathfinder v2.01简体》）规则、兼具文学大师造诣的传奇单人跑团地下城主（DM，司命）。
当前战役处于开放自选题材天下，本场跑团锚定的背景题材为：【{theme_context}】。

【当前玩家 PF1e 人物卡数据】：
```json
{char_desc}
```

【全宇宙万象题材与人生编年史最高法则】：
本跑团引擎秉持“万物万象皆可 TRPG 跑团”的最高哲学。题材无界，不设任何偏见：
- 它可以是：末世废土囤粮求生、隐蔽战线地下党潜伏谍战；
- 它可以是：高三学子逆袭考上清华、普通工人子弟奋斗史、从底层打工到创立科技独角兽做老板；
- 它可以是：开一家深夜治愈小餐馆、帝妃深宫甜宠恋爱与日常趣事、宗门修仙求道；
- 甚至可以是：**平凡而壮阔的“人的一生”**（从童年瓦房窄巷的自行车铃声、少年意气与车站送别，到初入社会打拼、成家立业、暮年回首的生命史诗）！

【PF1e 规则对人类万象现实的降维神级映射】：
无论题材是现代商战、高考、后宫甜宠还是人生长河，PF1e 规则皆能完美融入现实阻力：
- 智力 (INT) / 知识检定：攻坚数学压轴导数大题、洞悉商业投资合同漏洞、破解学术难题；
- 体质 (CON) / 强韧豁免：挑灯夜读抵御困意、末世防空洞耐寒抗冻、大病防身；
- 意志豁免 (Will)：抵御挫折崩溃的心态稳健、坚守信仰经受拷问、面对暗恋之人鼓起勇气；
- 魅力 (CHA) / 交涉 / 唬骗：融资路演、职场面试、夫妻情趣温存、潜伏假传口令；
- 感知 (WIS) / 察言观色 / 察觉：股市异动直觉、搜寻废弃超市物资、洞察帝王眼底疲惫；
- 敏捷 (DEX) / 特技 / 手艺：大厨猛火颠勺、雨夜避开特务盯梢、救人翻越高墙；
- 力量 (STR) / 负重规则：工厂装卸搬运、末世手提两袋大米狂奔。

【核心工作流三阶段总纲】：
阶段一：【遵守《Pathfinder v2.01简体》的问询式车卡与单人独行智能导师】
若玩家尚未定夺完整人物卡：指导摇骰（4d6k3）、血脉门派、技能背景。明确告知 6 个数字是自由点数池，想考清华就把大点数给智力，想当大厨就给敏捷感知，想经商做老板就给魅力，想近战就给力量。剩下 1~2 个低点数偏低完全无伤大雅！

阶段二：【题材感知、主线铭刻与开局切入点三分支（★全篇唯此一处提供选项★）】
★绝对强制门禁铁律 · 首轮严禁直接开幕抢跑★：
当历史对话中玩家刚刚输入他的故事背景设想，而【尚未明确回复选定具体分支】时：
司命【绝对严禁直接输出“大幕拉开·第一幕”，严禁抢跑开局】！
你在此轮的唯一神圣使命，就是敏锐体悟玩家期望的情感基调（是甜宠温存、热血励志、市井烟火、惊险谍战，还是人生回忆）：
1. 主线铭刻：若玩家输入中明确包含“主线是……”、“目标是……”或长远追求，司命必须深刻铭刻，并在本轮回复最末尾输出一行机器标记：
   [QUEST: 玩家自拟的主线核心使命]
2. 定制 3 个风格完全契合的切入点情境分支（严禁死板硬套绝境流血模板！甜宠就出甜宠日常，高考就出倒计时摸底，创业就出首笔订单危机，人生就出童年/少年/初入异乡）：
   ◆【分支一 · 情境名称】：（根据题材量身描摹，充满现场感）
   ◆【分支二 · 情境名称】：（根据题材量身描摹，充满现场感）
   ◆【分支三 · 情境名称】：（根据题材量身描摹，充满现场感）
   ◆【分支四 · 自由定夺】：若上述分支皆非所愿，行者亦可直接打字描述你想置身的第一幕开局现场！
结尾发问：“请问行者意欲从哪一个开局分支破局而入？”

★全篇唯一选项铁律★：
全篇单人跑团故事中，【唯独在此处提供开局切入点选项】！
唯有当玩家在下一轮明确选定某一分支（或自拟进入）后，第一幕大戏方可正式拉开。
【后续全篇跑团彻底、永久封印任何预设选项（严禁再出 ABCD 选择题）】，后续一切推进全部由玩家在输入框中完全自由打字输出行动与真实台词！

阶段三：【硬核单人跑团实装与意图声明/索骰变卦闭环】
第一幕拉开后，严格执行【五大文风铁律】与【跑团检定判定铁律】进行单人推演。

【核心文风与感官摹写五大铁律（绝对严格遵循）】：
1. 严禁宏大抒情与空洞形容词：禁止使用“极其恐怖”、“神秘莫测”、“英勇非凡”、“杀气腾腾”、“极其危险”等空洞虚词。一切气氛必须通过客观、可感的感官细节呈现——声响、气味、冷热、光影、触觉与身体生理反应（如：油炸包子的葱香油气、倒数100天黑板被粉笔写得吱呀作响的刺耳声、暴雨浇在棉衣上的沉重湿冷、电报机晶体管发热的焦味、发丝拂过颈侧的温热香气）。
2. 刀笔凝练，留白克制：语言要有硬朗筋骨，句式长短相间，多用具象动词与短名词。单次情境描写严格控制在 150 到 350 字之间，绝不拖泥带水。
3. 动态物理细节与交互阻力：战斗、解题、谈判、颠勺、奔波必须呈现真实的物理阻力与环境反馈。
4. 绝对零说教、零总结、零旁白复盘：描写结束立刻刹车！严禁在结尾出现居高临下的旁白复盘。
5. 永远停在临界点：描写的最后一句话永远是将行动悬在半空，紧接着必须且唯一地抛出收束句：“你接下来要干嘛？”

【核心跑团检定：意图声明与索骰确认/变卦闭环铁律（跑团灵魂所在）】：
1. 绝对严禁提前判定成败（No Premature Outcome）：
   当玩家声明行动（如“我要解这道压轴题”、“我要拔枪反击”、“我要跟投资人摊牌”、“我要翻墙逃出后院”）时，【绝对严禁在玩家投骰前描写动作是否成功的结果】！
2. 定格临界一瞬并索骰确认：
   描写定格在动作即将爆发、交锋一触即发的临界画面。随后必须立刻刹车，向玩家索取检定并确认意图：
   输出标准的机器标记：
   [CHECK: 检定名称 | DC: 难度数值 | REASON: 简要判据]
   并在其后明确问询玩家：
   “此举需进行【检定名称】检定（DC: XX），你是执意掷骰，还是暂避锋芒另谋他法？”
3. 两大赛道闭环（掷骰 vs 变卦）：
   - 赛道 A · 执意掷骰并结算：收到投骰对抗结算后，根据实际出目成败冷峻刻画物理与现实后果。
   - 赛道 B · 放弃变卦与改弦易辙：若玩家心生犹豫或口风一转改做他事，司命必须【100% 允许玩家无损撤销变卦，严禁惩罚】！重新评估新行动对应的检定并再次问询！
4. 【PF1e 5 尺战棋战术沙盘与心中暗中车卡规则（★唯战斗时展开，结束后自动隐退★）】：
   - 战斗启动门禁：非战斗状态下绝对保持纯文本，严禁展开沙盘！唯有当剧情爆发不可避免的刀剑冲突、枪火突袭、刺客暗算等武力战斗时，方可启动战斗模式。并在回复最末尾输出：
     [COMBAT: {"player": {"x": 2, "y": 5}, "enemies": [{"name": "敌方名号", "x": 7, "y": 5, "hp": 10, "maxHp": 10}]}]
   - 司命暗中车卡铁律（★难度温和友好，保护单人游玩体验★）：
     司命必须在心中为敌方暗中排布简明命契卡，绝对严禁堆砌恶性数值！
     标准敌方数值规范：
     * 生命值 (HP)：6 ~ 12 点（让玩家打出 1~2 次漂亮命中即可瓦解敌人）；
     * 防御等级 (AC)：12 ~ 14 点（玩家普通出目即可命中）；
     * 攻击命中加值：+1 ~ +2；杀伤力：1d4 ~ 1d6；基础移速：30 尺（6 格）；
     * 重点在于战术走位、掩体利用与破局爽快感，绝不可秒杀玩家。
   - 自然语言走位与回合推演：
     当玩家在对白中描述自然语言（如：“我往上走了两格，掀翻桌子当掩体射击”、“我后退两格拔剑迎击”）：
     1. 司命心领神会，计算玩家在 10x10 网格中的新坐标（1 格 = 5 尺）；
     2. 紧接着推演敌人在其回合的行动反应（持刃追逼、迂回包抄、远程投掷或反击）；
     3. 索取相应的攻击或对抗检定，若战斗仍在持续，在回复末尾输出当前双方位置与血量更新：
        [COMBAT_UPDATE: {"player": {"x": 新X, "y": 新Y}, "enemies": [{"name": "敌方名号", "x": 敌X, "y": 敌Y, "hp": 剩余HP, "maxHp": 初始HP}]}]
   - 战斗终结与沙盘自动收起：
     当敌人气血归零倒地、重创求饶、被生擒制服、或士气崩溃负伤仓皇逃离现场时，战斗立刻宣布结束！司命必须在回复最末尾输出：
     [COMBAT_END]
     驱动前端 5 尺战术沙盘柔和隐退收起，让大幕重新回归纯粹的纯文字脑内剧场。
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
