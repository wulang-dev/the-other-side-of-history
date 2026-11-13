# Trae 工作流执行纪律
# PRD v13.0 §20 + §21.2 + §18.1
# 本文件是项目级规则，只在本项目 .trae/rules/ 下生效，不进入全局 Rules

---

## 1. 三道门硬暂停纪律

### 1.1 Gate 1 — 选题裁决
**暂停条件**：skill-0 预调研输出 `preflight-research.md` 后立即暂停。  
**不可自动化**：人物、问题框架、候选标题、候选缩略图、风险等级、叙事逻辑转换方案、价值观边界、赞助兼容性、留存结构方案、系列格式归属 — 全部人类裁决。  
**通过条件**：人类在 Gate 1 打印版（`templates/gates/gate-1-topic.md`）逐项签字，`preflight-research.md` 的 `gateStatus` 字段由 `"pending"` 改为 `"passed"`。  
**标题/缩略图硬约束**：候选标题必须通过 §11.4 自检清单；候选缩略图必须通过 §12.4 自检清单。任何一项未过，Gate 1 不通过。

### 1.2 Gate 2 — 史料边界裁决
**暂停条件**：skill-1 考据输出 `source-ledger.json` 和三栏表后立即暂停。  
**不可自动化**：每条 claim 的 known/unknown/inference 由人类逐条裁决。  
**通过条件**：`source-ledger.json` 的 `gateStatus` 字段改为 `"passed"`，无法确认权利状态的来源全部排除。

### 1.3 Gate 3 — 综合审查
**暂停条件**：skill-2 脚本生成英文旁白初稿后立即暂停。  
**不可自动化**：
- 代价段重写（必须是"一个具体的人在一个具体时刻失去的具体东西"）
- 叙事逻辑审查（N1—N10 逐项检查，至少对照样例库 2 个最相关项）
- 价值观红线审查（V1—V10 逐项检查）
- 英文脚本质量审查（E1—E5 + C1—C10，附至少 3 处修改前后对照）
- 留存结构审查（A33—A37 逐项确认）
- 系列格式判断
- 标题定稿（必须再次通过 §11.4）
- 缩略图定稿（必须再次通过 §12.4）

**通过条件**：`script.md` 同时满足：
```yaml
gateStatus: "passed"
narrativeLogicCheck: "passed"
valuesCheck: "passed"
englishQualityCheck: "passed"
```
且上述字段的审查备注不为空。

---

## 2. 文件状态检查规则

每个 Skill 在执行前必须检查上游产出物的 `gateStatus`：
- `preflight-research.md` → Gate 1 检查 `gateStatus === "passed"`
- `source-ledger.json` → Gate 2 检查 `gateStatus === "passed"`
- `script.md` → skill-2.5 检查 `gateStatus === "passed"` 且三个 check 字段全部 passed
- `self-check-report.md` → skill-4 QA 检查 `gateStatus === "passed"` 且 H1—H10 全部签字

**规则**：上游 `gateStatus` 不是 `"passed"` 时，下游 Skill 必须拒绝执行，输出阻塞原因。

---

## 3. 自检纪律

- 自动自检 A1—A37 的 **任何 FAIL** 阻止进入人工自检（§17.4）
- 人工自检 H1—H10 的 **任何一项未签字** 阻止发布（§18.1）
- 自检报告 `self-check-report.md` 纳入 `episodes/<slug>/` 归档，随 Git 提交

---

## 4. Skill 间模型隔离 + 模型角色硬编码（§21.2 硬约束）

### 4.1 角色绑定表（路径 A：Trae 内置文本 + 火山引擎 TTS）

| 角色 | `.env` 变量 | 用在 | 模型名 | Provider | 成本 |
|---|---|---|---|---|---|
| **MODEL_A 生成** | `HISTORY_MODEL_A` | skill-0 预调研、skill-2 英文生成 | Seed-2.1-Pro-0915 或 DeepSeek-V4-Pro | **Trae 内置**（字节/DeepSeek） | Trae 积分（免费版每月 500） |
| **MODEL_B 审计** | `HISTORY_MODEL_B` | skill-2 中英对照、skill-5 A21-A37、skill-4 QA | GLM-5.3 或 Kimi-K3 | **Trae 内置**（智谱/Moonshot） | Trae 积分 |
| **MODEL_RESEARCH 考据** | `HISTORY_MODEL_RESEARCH` | skill-1 考据爬取+三栏初始分类 | Kimi-K3 或 MiMo-V2.6-Pro | **Trae 内置**（Moonshot/小米） | Trae 积分 |
| **MODEL_TTS 配音** | `VOLC_TTS_*` | skill-2.5 配音 | 火山引擎 OpenSpeech | **外部（付费）** | ~10 元/条 |
| ~~MODEL_VQA 视觉 QA~~ | 跳过 | skill-3 地图预筛、skill-5 A8/A9 | 已取消，降级为 H3 人类自检签字 | — | — |

**MODEL_A ↔ MODEL_B 隔离硬约束**：Trae 内置模型全部是不同 Provider，隔离自动满足（字节豆包 / DeepSeek → 智谱 GLM / Kimi Moonshot，完全独立）。

### 4.2 Trae 内置模型切换纪律（硬暂停级要求）

Trae 内置模型在 IDE 右下角点模型名切换，**不是脚本调用 API**。以下是**会话级隔离**要求，不只是"切一下模型"：

#### 会话 A（MODEL_A 生成角色）
处理 skill-0 预调研 + skill-2 英文生成。完成后**关闭 Trae 会话**。

#### 会话 B（MODEL_RESEARCH 考据角色）
新开 Trae 会话，切到 Kimi-K3 或 MiMo。处理 skill-1 考据爬取。完成后关闭。

#### 会话 C（MODEL_B 审计角色）⚠️ 自审自判硬禁区
**必须新开 Trae 会话、切到不同 Provider 的 MODEL_B**。处理：skill-2 中英对照自检 + skill-5 A21-A37 成片自检 + skill-4 QA 最终检查。

#### skill-2.5 配音（独立 API 调用，不占 Trae 会话）
skill-2.5 是**火山引擎 OpenSpeech API 调用**，不依赖 Trae 文本模型。所以：
- **不需要模型隔离**（不做文本生成/审计，只做语音合成）
- **人类阻塞点**（音色试听 + 新专名读法 + 钩子/代价/结尾三段签字）可以在任何 Trae 会话里完成
- 实操上建议放在 **会话 B（考据会话）之后**、**会话 C（审计会话）之前**——因为配音需要 Gate 3 通过后的最终脚本，不需要审核上下文
- 🔒 WARN-15：新专名 IPA 确认用**当前会话任意模型均可**（IPA 是事实性查询，不涉及叙事判断。可以让 Trae 当前模型查 IPA 推荐，或手动查）

**🔴 违规后果（硬暂停级）**：如果 skill-2 英文生成（会话 A）和 skill-5 自检（会话 C）在**同一次 Trae 会话**、**同一个模型**下完成 → 自审自判 → **该条视频自检报告作废，Gate 3 重审，脚本重写**。

**为什么这么重**：PRD §21.2 模型隔离硬约束的本质是"让两个独立的 AI 实例各自判断，避免同一个模型的盲区"。Trae 内置模型切换如果只在 IDE 右下角点一下，**无法 100% 确认模型实例真的换了**——关闭会话 + 新开是唯一可靠的"模型上下文清零"方式。

### 4.3 硬约束

1. **MODEL_A 和 MODEL_B 必须是不同 Provider 的不同实例**（Trae 内置选不同厂商即满足：字节 vs 智谱 / DeepSeek vs Kimi 等）。禁止同一个模型既生成又自检。
2. **TTS 是唯一外部付费项**。`.env` 里只有 `VOLC_TTS_*` 是外部 Key。禁止偷偷加新的外部 API Key。
3. **每个 SKILL.md 末尾必须有 `## 模型配置` 章节**，写明：用哪个角色、模型名（Trae 内置名称）、为什么。
4. **禁止在 Skill 脚本里写死外部 Provider 名称**。TTS 是例外（火山引擎），其他文本模型全部走 Trae 内置。
5. **禁止 Skill 脚本里写 `process.env.DEFAULT_MODEL`** 这类模糊引用。

### 4.4 典型违规示例

| 违规 | 正确 |
|---|---|
| skill-2 和 skill-5 都用 Seed-2.1-Pro（同一个模型） | skill-2 用 Seed-2.1-Pro（MODEL_A），skill-5 用 GLM-5.3（MODEL_B） |
| 在 `.env` 里给所有 Provider 都配 Key，脚本里随意切 | TTS 只保留 VOLC_TTS_*；其他模型用 Trae 内置 |
| skill-1 考据用 MODEL_A（和 skill-2 生成同一个模型） | skill-1 用 MODEL_RESEARCH（Kimi-K3，长上下文） |
| 一次 Trae 会话跑完 skill-2 生成 + skill-5 自检 | 会话 1：skill-2 生成（MODEL_A）→ 保存脚本；会话 2：skill-5 自检（MODEL_B）→ 读脚本审计 |

---

## 5. Trae HITL 非物理挂起

- 全链路必须在人在场的会话中执行
- 三道门通过 `AskUserQuestion` 或明确的对话指令触发人类确认
- 自动化任务只用于 Gate 之后的纯执行段（skill-2.5 配音、skill-3 视觉流水线）
- 禁止无人值守跑完整个视频制作流程

---

## 6. 禁用行为

- 不让 Skill 批量生成叙事骨架
- 不让视觉流水线自行估算时长（时长由配音实测决定）
- 不用"加时长"降低完播率分母
- 不在标题/缩略图/简介首句用"AI"做卖点
- 不绕过 `gateStatus` 检查直接产出下游 Skill
- 不引入未经授权的爬取服务或代理

---

## 7. 分阶段留存目标（冷启动容错硬约束）

**🔴 为什么必须分阶段**：新频道的 YouTube Algorithm Penalty 极强——前 10 条视频的推荐权重比成熟频道低 60-70%，AVD 天然偏低。如果第一条就要求 AVD ≥ 50%，等于直接否定整条流水线。

### 7.1 四阶段目标

| 阶段 | 视频序号 | AVD% 目标 | 30 秒留存目标 | 说明 |
|---|---|---|---|---|
| 冷启动 | 第 1-5 条 | ≥ 35% | ≥ 55% | YouTube 对新频道推荐极少，主要靠订阅者 + 搜索 |
| 推荐起步 | 第 6-10 条 | ≥ 40% | ≥ 60% | Algorithm 开始识别频道方向，推荐量逐步上升 |
| 稳定推荐 | 第 11-20 条 | ≥ 45% | ≥ 65% | 有稳定订阅基 + Algorithm 正向反馈 |
| 成熟期 | 第 21+ 条 | ≥ 50% | ≥ 70% | 可作为长期目标 |

### 7.2 判定规则

- 单条视频 AVD% 低于目标值 → **WARN**，不自动失败。人类判断：是标题/缩略图钩子弱？还是叙事结构拖了？
- **连续 3 条**低于阶段目标 → **FAIL**，触发结构性复盘（PRD §28.3）
- 前 10 条**无任何 ≥ 2x 离群值** → 触发结构性复盘（PRD §28.3.4）

### 7.3 留存结构的阶段不变性

A33-A37（前 3 秒钩子兑现 / 30 秒开环 / 60-90 秒 re-hook / 代价碎片预置 / 结尾无总结）**在所有阶段都是硬约束**。即使冷启动阶段完播率低，结构完整性不能牺牲。

---

## 8. V7 当代政治红线执行（审计修复项）

详见 `assets/v7-political-boundary.md`。三条硬禁止 + 固定回复模板 + Gate 3 检查方式：

1. **脚本 + 标题 + 缩略图 + 简介**：严禁出现 Xi, CCP, Taiwan, Hong Kong, Xinjiang, Tibet, Tiananmen 等 2020 年后当代领导人/地名
2. **严禁任何当代类比句型**（"similar to today's...", "parallels modern..."）
3. **地图只画历史边界**，不叠当代国家轮廓
4. 评论区出现当代政治关联 → 用固定英文回复模板，不辩论不延伸

---

## 9. V2 暴力呈现边界（审计 WARN-6 修复项）

详见 `assets/v2-violence-boundary.md`。核心规则：
1. **脚本里暴力词黑名单**（屠杀/massacre、酷刑/torture、斩首/beheaded 等）→ 必须替换为中性描述
2. **标题/缩略图绝对禁止任何暴力词**作为卖点
3. **画面禁止清单**：不拍斩首/尸体/酷刑器具特写，用地标空镜+史料文字+数据图表替代
4. 目标：**所有视频保持全年龄可看（13+）**，不触发 YouTube 年龄限制

---

## 10. AI 披露 + 标题缩略图 A/B（审计 WARN-7 + WARN-9 修复项）

### 10.1 AI 披露固定模板（A17 机械检查依据 + WARN-11 修复）

YouTube Studio 视频简介**开头必须**包含以下声明（精确文本，不增不减）：

```
🎓 History videos made by a human creator with AI assistance for research, visuals, and voiceover. All historical judgments, framing, and narrative structure are decided by the human creator before publication. Voiceover uses a commercial text-to-speech service with a custom voice profile.
```

**为什么加 "Voiceover uses a commercial text-to-speech service with a custom voice profile"**（WARN-11）：
1. 明确不是 AI 克隆某个人的声音——你在火山引擎选定的音色是商业 TTS 提供的预设音色，不是模仿真人
2. 回应 YouTube 审核对 "AI voiceover" 的追问——如果只有 "voiceover" 没有说明，审核可能标记为未披露 AI 语音

**纪律**：
- 放在简介**第一行**，不是中间或末尾
- 标题/缩略图**严禁**出现 "AI" / "GPT" / "ChatGPT" 作为卖点（与 §11.4 一致）
- skill-5 A17 自动检查简介开头是否有这段文本 → 没有则 FAIL；只有核心声明缺 voiceover 句 → WARN

### 10.2 标题 + 缩略图同时 A/B 测试

前 20 条视频**每条做 2 标题 × 2 缩略图 = 4 组 A/B 测试**：

| 视频序号 | A/B 组 | 说明 |
|---|---|---|
| 1-20 | 2 标题 × 2 缩略图 = 4 组 | YouTube Studio 原生支持，成本为零 |
| 21+ | 优胜组合直接上 | 用前 20 条跑出的最优标题结构 + 缩略图版式 |

**为什么加标题 A/B**：标题和缩略图对 CTR 的影响是 50/50。只测缩略图等于浪费了一半的数据量。

---

## 11. 专有名词首次出现模板（审计 WARN-8 修复项）

详见 `assets/proper-noun-intro-templates.md`。四类模板（朝代/人物/地名/官职）首次出现必须用括号解释：

| 类型 | 格式 | 示例 |
|---|---|---|
| 朝代 | `Name (ruling house, YYYY–ZZZZ CE)` | "Tang Dynasty (618–907 CE)" |
| 人物 | `Name (role, YYYY–ZZZZ CE)` | "Wu Zetian (empress regnant, 624–705 CE)" |
| 地名 | `Name (modern equivalent, 方位)` | "Chang'an (modern Xi'an)" |
| 官职 | 意译 + 简短解释 | "chancellor (top civil official)" |

**skill-2 prompt 强制纪律**：MODEL_A 生成英文旁白时自动应用，Gate 3 覆盖率 < 70% → FAIL。

---

## 12. Gate 1 前预检（审计 WARN-10 修复项）

skill-0 `preflight-research.md` 里**所有 [TBD] 占位符必须在 Gate 1 前替换完成**。

**preflight-gate-check.mjs 新增检查**：
- 扫描 `preflight-research.md` 是否仍有 `[TBD` 或 `[待填充]` 标记
- 发现任何未替换占位符 → **硬拒绝进入 Gate 1**，脚本 exit code = 1
- 输出："preflight-research.md 里还有 N 个 [TBD] 未替换，Gate 1 暂停"

**为什么重要**：如果人类 Gate 1 签字前忘了替换占位符就签字，整条预调研报告是假的，后续所有决策基于空信息。
