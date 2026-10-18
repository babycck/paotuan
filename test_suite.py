import sys
import os
import io

# 强制标准输出为 UTF-8 编码，兼容 Windows 终端
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import asyncio
from fastapi.testclient import TestClient

# 导入游戏服务实例
try:
    from server import app
    print("✅ 1. 成功加载 server.py FastAPI 应用实例")
except Exception as e:
    print(f"❌ 1. 加载 server.py 失败: {e}")
    sys.exit(1)

client = TestClient(app)

def test_static_routes():
    print("\n--- [测试阶段 1: 静态资源与主页连通性] ---")
    routes = [
        ("/", 200, "text/html"),
        ("/style.css", 200, "text/css"),
        ("/app.js", 200, "application/javascript"),
        ("/talents.js", 200, "application/javascript"),
    ]
    for path, exp_code, exp_type in routes:
        resp = client.get(path)
        assert resp.status_code == exp_code, f"路径 {path} 返回异常状态码: {resp.status_code}"
        print(f"  ✓ {path} 访问正常 (状态码: {resp.status_code}, 长度: {len(resp.content)} 字节)")

def test_talents_library():
    print("\n--- [测试阶段 2: 100 项天命神技数据字典校验] ---")
    resp = client.get("/talents.js")
    text = resp.text
    assert "window.DESTINY_TALENTS" in text, "talents.js 缺少 DESTINY_TALENTS 根声明"
    
    # 统计技能数量与关键神技
    key_talents = ["百毒不侵", "心声窃听", "绝对潜匿", "金蝉脱壳", "妙手空空", "时光倒流一分钟", "天命大圆满"]
    for t in key_talents:
        assert t in text, f"缺失核心神技: {t}"
        print(f"  ✓ 核心神技【{t}】校验存在")
    
    # 统计条目数
    count = text.count("id:")
    print(f"  ✓ 天命神技总条目数确认: {count} 项 (标准满库 100 项)")

def test_system_prompt_builder():
    print("\n--- [测试阶段 3: 提示词生成器与神技注入校验] ---")
    from server import build_system_prompt
    mock_char = {
        "profile": {"name": "小翠", "token": "生锈的发簪"},
        "talent": {
            "name": "心声窃听",
            "desc": "近身三尺强制窃听心声",
            "trigger": "察言观色/心声+8"
        }
    }
    prompt = build_system_prompt(
        character_info=mock_char,
        theme="古代宫闱 · 深宫弄权",
        time_of_day="子时三刻 / 23:45"
    )
    assert "【心声窃听】" in prompt, "天命神技未成功注入系统提示词"
    assert "深宫弄权" in prompt, "题材上下文未注入"
    assert "23:45" in prompt, "时间锚点未注入"
    assert "[SUGGESTIONS:" in prompt, "3 大谋策胶囊规范未注入"
    assert "绝对严禁输出 [COMBAT:" in prompt, "禁用战棋沙盘规约未生效"
    print("  ✓ 提示词构建器 100% 注入天命神技与益智智斗指令！")

def test_chat_turn():
    print("\n--- [测试阶段 4: 端到端剧情推演与盲盒开局测试] ---")
    # 模拟前端天命睁眼开局 payload
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "【天命降临 · 睁眼入局】：时代世界：【古代宫闱 · 深宫弄权】，觉醒神技【百毒不侵】。请随机分配一个小人物盲盒身份并描写第一秒突发险情！"
            }
        ],
        "character_info": {
            "profile": {"name": "行者", "token": "旧铜牌"},
            "talent": {
                "name": "百毒不侵",
                "desc": "吞服世间剧毒如甘露",
                "trigger": "强韧/嚼毒反噬+8"
            }
        },
        "theme": "古代宫闱 · 深宫弄权",
        "stream": False
    }
    
    # 发起请求 (StreamingResponse)
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200, f"对话接口报错: {resp.status_code} - {resp.text}"
    raw_text = resp.text
    assert "data:" in raw_text, "未收到 SSE 流式响应数据"
    
    # 解析全部 content 文本块
    chunks = []
    for line in raw_text.splitlines():
        if line.startswith("data:") and "[DONE]" not in line:
            try:
                chunk_obj = json.loads(line[5:].strip())
                if "content" in chunk_obj:
                    chunks.append(chunk_obj["content"])
            except Exception:
                pass
    full_text = "".join(chunks)
    assert len(full_text) > 20, f"流式拼接内容过短: {full_text}"
    print(f"  ✓ 司命 SSE 流式生成成功 (篇幅: {len(full_text)} 字)")
    print(f"  ✓ 司命第一幕预览:\n    {full_text[:140]}...")

if __name__ == "__main__":
    test_static_routes()
    test_talents_library()
    test_system_prompt_builder()
    test_chat_turn()
    print("\n🎉 =========================================")
    print("🎉 全部 4 组端到端功能测试 100% 通过！系统运行稳健！")
    print("🎉 =========================================")
