# 《问道大唐》PF1e 纯文字独立跑团系统

> **Pathfinder 1st Edition 规则引擎 · 开放自选多题材天下 · 纯自然语言沉浸式文字跑团**

---

## 📖 项目简介

《问道大唐》是一款基于 **开拓者一版 (Pathfinder 1st Edition, 简称 PF1e)** 核心规则打造的纯文字独立跑团系统。

系统融合古典硬核文字冒险与现代大语言模型技术，由 AI 担当传奇地下城主（DM/司命）。它彻底摆脱传统文字游戏中生硬的预设 ABCD 选项，为玩家提供完全自由的自然语言交互环境，并实现了世界观题材的开放解耦——无论你想体验大唐武周悬疑、宋末边关谍战、明末辽东血战，抑或是赛博朋克修真与废土探险，皆可一键起步，推演属于你的天命传奇。

---

## ⚔️ 核心规则与系统特色

### 1. 标准 PF1e 战术卡与计算引擎
- **核心 7 大种族**：人类、矮人、精灵、侏儒、半身人、半精灵、半兽人，完整支持种族属性加减值、体型（小型/中型）、速度、视觉特性与专有被动。
- **核心 11 大职业**：野蛮人、吟游诗人、牧师、德鲁伊、战士、武僧、圣武士、游侠、游荡者、术士、法师，自动配置 HD 生命骰、优良豁免与本职技能表。
- **完整战系机动对抗**：
  - **先攻 (Initiative)**：敏捷修正 + 背景特性（如【反制者】+2）。
  - **基础攻击加值 (BAB)**：区分满 BAB、中 BAB 与慢 BAB 阶梯。
  - **战系机动加值 (CMB)** 与 **机动防御 (CMD)**：精准结合体型修正与力量/敏捷修正。
- **AC 矩阵与防具惩罚**：标准 AC、接触 AC (Touch)、措手不及 AC (Flat-Footed)、最大敏捷限制、护甲检定减值 (ACP) 穿透扣减、奥术失败率。
- **致命重击确认机制 (Critical Hit)**：支持武器 19-20 / ×2 威胁区间；出目命中威胁区间时自动执行二次确重投骰与倍数伤害结算。
- **真实负重阶梯表**：依据 PF1e 力量承重标准计算轻载、中载、重载阈值。
- **气血与阵亡机制**：0 点瘫痪，负生命昏迷濒死，负值达体质属性极限方为阵亡。

### 2. 文风与感官摹写五大铁律
由 AI 司命执掌的核心 Prompt 深度注入了严苛的文学铁律：
1. **严禁宏大抒情与空洞形容词**：禁止使用“极其恐怖”、“神秘莫测”等虚词，一切气氛由具体声响、气味、冷热、光影呈现。
2. **刀笔凝练，留白克制**：唐宋传奇与硬派武侠筋骨，句式长短相间，单次描写控制在 150～350 字。
3. **动态物理细节与阻力**：战斗与环境充满阻力反馈（甲片摩擦钝响、刀刃卡在肋骨的凝滞、泥水飞溅眼皮的刺痛）。
4. **绝对零说教、零旁白总结**：客观描写外部演变，绝不进行居高临下的复盘与总结。
5. **永远停在临界点**：刀锋悬在半空，末尾唯一抛出收束金句：“**你接下来要干嘛？**”。

### 3. 创新交互体验
- **解耦自由题材天下**：车卡定魄后由司命发问选择世界观，输入任意题材即刻生成第一幕危机。
- **索骰机器标记**：智能输出 `[CHECK: 检定名称 | DC: 难度数值 | REASON: 判据]`，前端拦截解析呼出金色脉冲横幅。
- **失败推进 (Fail Forward)**：检定受挫转化为局势恶化、消耗资源或时间紧迫，保留破局生路。
- **知难变卦机制**：索骰横幅弹出后，玩家可随时无损取消变卦，换用其他智谋脱困。
- **零外部资源依赖物理音效**：基于 Web Audio API 纯代码程序化合成骰子碰撞声、自然 20 胜利和弦与警示弦音。

---

## 🛠️ 技术架构

- **后端**：Python 3.9+ / FastAPI / Uvicorn / HTTPX 异步流式客户端 (SSE)
- **前端**：Vanilla JavaScript (ES6+) / HTML5 / CSS3（古风水墨暗金响应式布局）
- **通信与持久化**：Server-Sent Events (SSE) 流式传输 / 本地 JSON 档案存取
- **默认服务端口**：`5432`

---

## 🚀 快速上手与本地运行

### 1. 克隆代码仓库
```bash
git clone https://github.com/babycck/paotuan.git
cd paotuan
```

### 2. 安装 Python 依赖
```bash
pip install -r requirements.txt
```

### 3. 启动本地服务
```bash
python server.py
```
控制台将输出启动信息，在浏览器中访问：
👉 **http://127.0.0.1:5432**

> **提示**：系统默认附带离线模拟推演模式。如需接入大语言模型，点击右上角【⚙️ 司命心印】填入您的 DeepSeek API Key（或兼容 OpenAI 协议的 API Key）即可。

---

## 🐳 Docker 容器化部署

本项目已提供生产级 Dockerfile，可在 Linux 服务器上一键打包与运行：

```bash
# 1. 构建 Docker 镜像
docker build -t paotuan:latest .

# 2. 运行容器 (映射 5432 端口并挂载存档目录)
docker run -d \
  --name paotuan \
  -p 5432:5432 \
  -v $(pwd)/saves:/app/saves \
  --restart unless-stopped \
  paotuan:latest
```

---

## 🐧 Linux 云服务器后台部署 (Systemd 守护)

若在 Linux 服务器（如 Ubuntu / Debian / CentOS）原生运行，推荐使用 Systemd 管理常驻服务：

### 1. 创建服务文件
```bash
sudo nano /etc/systemd/system/paotuan.service
```

### 2. 写入配置内容
```ini
[Unit]
Description=Paotuan PF1e Game Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/paotuan
ExecStart=/usr/bin/python3 /var/www/paotuan/server.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3. 启动并启用开机自启
```bash
sudo systemctl daemon-reload
sudo systemctl start paotuan
sudo systemctl enable paotuan
sudo systemctl status paotuan
```

---

## 📂 项目结构说明

```
paotuan/
├── config.json          # 核心配置文件 (端口 5432、API 密钥与基址)
├── server.py            # FastAPI 核心服务、PF1e 规则系统提示词与 API 代理
├── requirements.txt     # Python 依赖清单
├── Dockerfile           # 容器化构建脚本
├── .gitignore           # Git 忽略文件
├── saves/               # 跑团进度与人物卡持久化存档目录
└── static/              # 前端单页应用
    ├── index.html       # 战术三栏工作台骨架 (PF1e 模版规范)
    ├── style.css        # 水墨武侠玄黑暗金样式表
    └── app.js           # PF1e 规则计算引擎、Web Audio 合成器与交互状态机
```

---

## 📜 许可协议

本项目遵循 MIT 开源许可协议。欢迎跑团爱好者与开发者提出 Issue 与 Pull Request！
