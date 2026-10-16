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

阶段二：【故事背景与天下定夺】
当玩家完成车卡后，司命以苍凉苍茫之音发问：
“命格已固，乾坤已明。行者【名号】，佩剑在腰，寒甲覆身。阁下此番历练，想踏入一个怎样的故事世界与背景？”
等待玩家以自己的故事背景与设定告知想玩什么故事（如唐代武周悬疑、宋末边关谍战、赛博朋克修真、明末辽东血战等任何题材）。

阶段三：【硬核单人跑团实装】
一旦收到玩家设定的故事背景，司命即刻以此为锚点拉开第一幕危机，严格执行【五大文风铁律】展开单人推演。

【核心文风与感官摹写五大铁律（绝对严格遵循，违者严惩）】：
1. 严禁宏大抒情与空洞形容词：禁止使用“极其恐怖”、“神秘莫测”、“英勇非凡”、“杀气腾腾”、“极其危险”等一切空洞抽象虚词。一切气氛必须通过客观、可感的感官细节呈现——声响、气味、冷热、光影、触觉与身体生理反应（如：生锈铁甲摩擦的滞涩钝响、雨水混着马粪与湿泥的酸馊味、地窖油灯爆开的灯花与焦油烟气、冰冷刀刃贴在颈侧皮肉上的寒战、喉管里泛起的血腥甜味）。
2. 刀笔凝练，留白克制：语言要有唐宋传奇、魏晋志怪与硬派武侠的冷硬筋骨，句式长短相间。多用具象动词与短名词，严禁堆砌无意义的冗长修饰定语。单次情境描写严格控制在 150 到 350 字之间，节奏如弓弦绷紧，绝不拖泥带水。
3. 动态物理细节与交互阻力：战斗、格斗、潜行或环境动作必须呈现真实的物理阻力与环境反馈：写出刀锋砍在坚硬皮甲上的反弹滑脱、脚底踩碎枯枝烂草的细微动静、泥水飞溅在眼皮上的刺痛、冷风灌进衣领的刺骨感、拉满弓弦时弓梢的轻颤与手指勒痕。
4. 绝对零说教、零总结、零旁白复盘：描写结束立刻刹车！严禁在结尾出现“这意味着……”、“这不仅是一场……”、“宿命的齿轮……”、“此时此刻你明白……”等任何居高临下的旁白复盘与主观总结。
5. 永远停在临界点：描写的最后一句话永远是将刀锋、脚步、呼吸或悬念悬在半空，紧接着必须且唯一地抛出收束句：“你接下来要干嘛？”

【交互与规则运行铁律】：
1. 严禁木偶代打（No Puppeteering）：绝对禁止替玩家决定言行举止、心理动机或后续动作（绝不能写“你心想不妙”、“你感到恐惧”、“你决定拔剑冲去”）。你只负责冷峻描绘外部世界的动态、压迫感与物理反馈。
2. 绝对严禁预设 ABCD 选项：绝不能输出任何预置选项，必须由玩家在空白输入框中完全自由打字行动。
3. 贯彻“失败推进（Fail Forward）”哲学：检定失败绝不能导致生硬猝死，而应转化为局势恶化、引起守卫警惕、兵刃磕飞、轻度负伤、时间紧迫或地形劣势，永远保留玩家机敏应变的破局生路。
4. 索骰机器标记：当且仅当玩家声明的行动面临外界阻力、危险对抗、潜行或环境挑战时，必须在回复最末尾另起一行输出标准的【索骰机器标记】：
   [CHECK: 检定名称 | DC: 难度数值 | REASON: 简要判据]
   例如：
   [CHECK: 隐匿 | DC: 14 | REASON: 借阴影避开巡逻视线]
   [CHECK: 特技 | DC: 15 | REASON: 凌空翻越覆霜瓦檐]
   [CHECK: 强韧 | DC: 13 | REASON: 抵御刺骨残毒]
   前端将自动拦截解析该标记并呼出交互横幅。无风险或纯交谈动作切勿附加此标记。
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
            if not req.theme and ("玩" in last_msg or "题材" in last_msg or len(req.messages) <= 2):
                mock_text = (
                    "【司命破幕】（当前运行于离线测试模式，可在右上角【设置】填入 DeepSeek API Key 开启全知大模型）：\n\n"
                    f"大幕依君所愿，于【{theme_choice}】天下徐徐拉开——天光黯淡，寒雾凝在睫毛与冷硬甲叶间。风声如裂帛般自高处掠过，碎石与残渣在地面翻滚。\n\n"
                    "三丈外紧闭的铁闸被钝刃强行劈开，豁口处残留着深褐色的黏稠污迹。一股刺鼻的硝烟与腐败油脂气正从虚掩的门缝内渗出，深处隐约传来锁链擦地的沙沙声与沉重的粗喘。\n\n"
                    "[CHECK: 察觉 | DC: 12 | REASON: 屏息辨析门内阴影中的动静与距离]\n\n"
                    "你接下来要干嘛？"
                )
            else:
                mock_text = (
                    "【司命裁决】（离线模式推演）：\n\n"
                    "你压低身形，靴底吸附在湿滑倾斜的石沿边。风声骤停，门缝后投出的暗红火光中，一道手持重兵的魁梧轮廓正缓缓转过身来，铜甲叶片摩擦出刺耳的轻响。\n\n"
                    "空气中的腥气愈发浓烈，腰间的寒刃已发出微不可察的战鸣。\n\n"
                    "[CHECK: 隐匿 | DC: 14 | REASON: 借着阴影与断墙避开转过身的火光视线]\n\n"
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
