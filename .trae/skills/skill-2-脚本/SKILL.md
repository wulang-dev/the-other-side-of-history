# skill-2 脚本生成（Script）
# PRD v13.0 §7 + §9 + §10 + §23

---

## 定位
在 Gate 2 通过后，生成英文旁白初稿。叙事逻辑必须是结构分析（N1—N10 转换后），价值观必须不违反 V1—V10 红线，英文质量必须符合 E1—E5 + C1—C10。AI 优先生成英文脚本按 §10.9 四层防护执行。

## 前置依赖
- `source-ledger.json` 的 `gateStatus` 必须是 `"passed"`（Gate 2 已通过）
- Gate 1 选定的叙事逻辑转换方案、价值观边界、留存结构方案、系列格式归属
- `assets/narrative-logic-handbook.md` 可用
- `.env` 已配置文本模型 API Key

## 输入
- Gate 2 裁决后的三栏表（known/unknown/inference）
- 叙事逻辑转换方案（Gate 1 决定）
- 价值观边界（Gate 1 决定）
- 留存结构方案（前 3 秒、30 秒开环、代价碎片位置）
- 系列问题格式

## 输出
- `episodes/{slug}/script.md` — 英文旁白定稿稿 + 分段标记 + 视觉单元标记 + 地图年份标记
- 文件 frontmatter：
  ```yaml
  gateStatus: "pending"
  narrativeLogicCheck: ""
  valuesCheck: ""
  englishQualityCheck: ""
  ```

### script.md 结构
```markdown
# English Narration — {episode-slug}
> gateStatus: pending
> narrativeLogicCheck: ""
> valuesCheck: ""
> englishQualityCheck: ""
> Visual Unit markers: [MAP] [TIMELINE] [SOURCE_CARD] [SILHOUETTE]
> Map years: [MAP-649] [MAP-655] [MAP-690]

## Section 1 — Hook (0:00–0:30)
> [MAP] year=649
> Map requirement: CHGIS 649 CE 河南道 + 长安周边
> 留存: 前 3 秒兑现钩子 / 5-30 秒开环

[英文旁白正文...]

## Section 2 — The Existing Situation (0:30–2:30)
...

## Section 3 — The Choice (2:30–5:30)
> 留存: 2:30–3:30 代价碎片预置

...

## Section 4 — The Cost (5:30–7:30)
...

## Section 5 — Open Question + End Screen (7:30–8:00)
> 留存: 结尾无总结信号 / 指向播放列表

...
```

## 流程
1. 基于三栏表和 Gate 1 方案，AI 先生成**中文逻辑脚本**（`cn-logic-template.md` 结构）
2. AI 优先生成英文（§10.9 四层防护）
3. 模型 A 生成英文旁白，严格用 E1—E5 约束
4. **模型 B 中英对照自检**（另一个模型实例，禁止自审自判），检查立场偏移、因果简化、道德史观残留
5. 生成 `script.md`，标记视觉单元、地图年份、留存节点
6. **输出后立即暂停**，等待 Gate 3 综合审查

## 四层防护（§10.9）
1. Gate 3 之前中文逻辑脚本定稿，N1—N10 / V1—V10 全部审查
2. 模型 A 用标准化约束提示词生成英文（强制口语、短句、禁止新增评价）
3. 模型 B 执行中英对照 + 关键句回译（检测立场偏移）
4. H9 签字依据：AI 自检报告 + 关键句回译 + TTS 听感

## 英文质量约束（硬性）
| 指标 | 目标 |
|---|---|
| Flesch-Kincaid Grade Level | 7—9 |
| 平均句长 | 12—18 词 |
| 被动语态占比 | < 15% |
| 抽象名词密度 | ≤ 8 / 100 词 |
| 伪正式表达密度 | ≤ 3 / 100 词 |

## 降级方案（§10.5 L1—L4）
创作者英文薄弱时：L1 自助优化 → L2 AI 辅助重写 → L3 母语审校 → L4 长期积累。L3 审校只改英文表达，不改叙事判断。

## 人类阻塞点（Gate 3）
- 代价段重写（必须是具体的人 / 时刻 / 东西）
- 叙事逻辑审查（N1—N10 + 对照样例库 2 项）
- 价值观红线审查（V1—V10）
- 英文质量审查（E1—E5 + C1—C10 + 至少 3 处修改对照）
- 留存结构审查（A33—A37）
- 系列格式判断
- 标题定稿 + 缩略图定稿

## 模型隔离硬约束
skill-2 生成英文用**模型 A**（如 DeepSeek V4-Pro），skill-5 自检 A21/A25/A26 用**模型 B**（GLM-4.1V-Thinking-Flash 或不同 Provider）。**禁止同一个模型既生成又自检**。

## 模型配置
- **生成旁白**：MODEL_A 生成（Trae 内置 Seed-2.1-Pro-0915 或 DeepSeek-V4-Pro）
- **中英对照自检**：MODEL_B 审计（Trae 内置 GLM-5.3 或 Kimi-K3）
- **为什么**：英文生成是"产出高质量口语旁白"，指令遵循好。中英对照是"审计"，必须独立 Provider 保证隔离。
- **成本**：全部 Trae 积分，零外部成本
- **切换纪律**：
  - 生成旁白前，切到 MODEL_A（Seed-2.1-Pro）
  - 中英对照自检前，切到 MODEL_B（GLM-5.3）
  - **禁止在同一次 Trae 会话、同一个模型下完成生成和自检** → 自检作废，Gate 3 重审
- **四层防护纪律**（§10.9）：Gate 3 中文逻辑稿定稿 → MODEL_A 生成英文 → MODEL_B 中英对照 → H9 签字。禁止跳过任何一层。
