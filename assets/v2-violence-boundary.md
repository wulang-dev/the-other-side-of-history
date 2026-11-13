# V2 暴力呈现量化标准
# 审计 WARN-6 修复项
# YouTube 对暴力内容有明确的年龄分级和推荐限制政策。
# 历史视频里"战争/处决/酷刑"是历史事实，但呈现方式决定是否触发平台限制。

---

## 1. 文本黑名单词（脚本正文 + 标题 + 缩略图文字）

### 🔴 绝对禁止（直接替换为中性描述）

| 禁止词 | 替换为 | 理由 |
|---|---|---|
| 屠杀 / massacre | "造成大规模死亡" / "thousands died" | massacre 暗示无差别杀戮，屠杀是中式煽情词 |
| 酷刑 / torture | "严刑审问" / "harsh interrogation" | torture 有强烈情绪化暗示 |
| 焚城 / burned the city | "城池沦陷" / "the city fell" | 不渲染破坏细节 |
| 血流成河 / rivers of blood | "伤亡惨重" / "heavy casualties" | 夸张修辞，历史视频要客观 |
| 斩首 / beheaded | "处决" / "executed" | beheaded 是视觉暴力词 |
| 凌迟 / slow slicing | "公开处决" / "public execution" | 凌迟是中式特有酷刑词，对欧美观众无认知且有渲染风险 |
| 活埋 / buried alive | 必须交代"被处决"，不描述方式 | 同上 |
| 满门抄斩 / entire family executed | "家族被牵连" / "his relatives were also punished" | 减少集体惩罚的冲击力 |

### 🟡 可使用但需控制（单条视频 ≤ 1 次，且必须放在因果语境中）

- 处死 / put to death → 可以用，但前面必须有"为什么"的语境
- 战争 / war → 可以用，但避免在标题/缩略图里做卖点
- 叛乱 / rebellion → 可以用，中性词

### ❌ 绝对禁止出现在标题/缩略图里

任何暴力词，包括但不限于：massacre, torture, behead, execute, kill, blood, death 作为标题或缩略图卖点。

> ❌ "The Massacre That Ended a Dynasty Forever"  
> ✅ "How a Single Battle Reshaped China for 300 Years"

---

## 2. 画面禁止清单

| 禁止画面 | 允许替代 |
|---|---|
| 斩首的图像/动画/符号 | 处决的文字记录 + 地图标出地点 |
| 尸体/残骸的特写 | 战场遗址的空镜 |
| 酷刑器具的特写 | 史料记载文字 + 年代地图 |
| 火烧城市的 CG 动画 | 城市沦陷后的人口数据变化 |

---

## 3. Gate 3 检查方式

MODEL_B（审计角色）扫描：
1. 脚本里有没有 1.1 节黑名单词 → 每个出现 → WARN（人类判断是否可替换）
2. 标题/缩略图里有没有任何暴力词 → FAIL（必须改）
3. 单条视频暴力词总次数 → ≥ 3 次 → FAIL

---

## 4. 合规价值

YouTube 的暴力内容分级：
- 有明确死亡/酷刑画面 → 年龄限制（18+），推荐流降权
- 有暴力词但无画面 → 可能触发有限推荐
- 中性描述+无画面 → 正常推荐

目标：**所有视频保持全年龄可看（Made for Everyone 或 13+）**，这样才能进入青少年推荐池。
