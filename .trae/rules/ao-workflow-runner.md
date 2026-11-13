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

### 4.2 Trae 内置模型切换纪律

Trae 内置模型在 IDE 右下角点模型名切换，**不是脚本调用 API**。纪律：
1. **skill-0 预调研 / skill-2 英文生成前**：切换到 MODEL_A（Seed-2.1-Pro 或 DeepSeek-V4-Pro）
2. **skill-2 中英对照 / skill-5 自检 / skill-4 QA 前**：切换到 MODEL_B（GLM-5.3 或 Kimi-K3）
3. **skill-1 考据爬取前**：切换到 MODEL_RESEARCH（Kimi-K3 或 MiMo）
4. 违反自动隔离：如果 skill-2 生成和 skill-5 自检在**同一次 Trae 会话**、**同一个模型**下完成，等于自审自判 → **该条视频自检报告作废，Gate 3 重审**

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
