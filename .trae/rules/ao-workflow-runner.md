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

## 4. Skill 间模型隔离（§21.2 硬约束）

**生成英文脚本的 Skill 与自检 Skill 必须使用不同模型实例，禁止自审自判。**
- skill-2 生成英文脚本 → 模型 A（DeepSeek V4-Pro）
- skill-5 自检 A21（叙事语义扫描）+ A25—A28（英文质量）→ 模型 B（GLM-4.1V-Thinking-Flash 或同一 Provider 的不同端点）
- skill-2 英文脚本 AI 优先生成（§10.9 四层防护）的双模型隔离同样适用：模型 A 生成、模型 B 中英对照自检

**例外**：当预算紧张时，同一 Provider 的不同模型端点（如 DeepSeek-V3 vs DeepSeek-V4-Pro）也算不同实例；但**不能同一个模型既生成又自检**。

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
