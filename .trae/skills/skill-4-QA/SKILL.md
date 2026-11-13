# skill-4 QA（Final Quality Assurance）
# PRD v13.0 §18 + §23

---

## 定位
最后一个 Skill，在人工自检 H1—H10 全部签字后执行。整合检查所有 `gateStatus` 和 `check` 字段，确认"从 Gate 1 到 H10 没有遗漏的阻塞点"。**QA 未通过阻止发布**。

## 前置依赖
- H1—H10 全部签字（`self-check-report.md` 人工自检栏完整）
- 成片、字幕、配音归档完成

## 输入
- `preflight-research.md`
- `source-ledger.json`
- `script.md`
- `voiceover-manifest.json`
- `self-check-report.md`

## 输出
- `episodes/{slug}/qa-report.md`
- 文件 frontmatter：`gateStatus: "passed"`（只写 PASS 的场景）

## 执行项（逐项检查文件状态字段）
```
preflight-research.md   → gateStatus === "passed" ?
source-ledger.json      → gateStatus === "passed" ?
script.md               → gateStatus === "passed" ?
                       → narrativeLogicCheck === "passed" ?
                       → valuesCheck === "passed" ?
                       → englishQualityCheck === "passed" ?
self-check-report.md    → A1—A37 无 FAIL 项 ?
                       → H1—H10 全部有人类签字 ?
```

## 检查脚本
`scripts/qa.mjs` 实现上述逐项检查，任何一项失败立即返回 FAIL 并标注哪个文件哪个字段。

## 纪律
- QA 是流程的最后一关；QA 失败不回退 skill-4 本身，而是要求回到对应 Gate 重新做
- `qa-report.md` 归档，随 Git 提交

## 模型配置
- **角色**：MODEL_B（`HISTORY_MODEL_B_*`）— 审计角色，与生成模型隔离
- **为什么**：QA 是"审计"，必须用独立实例。虽然 QA 主要是字段比对（本地脚本 `scripts/qa.mjs` 即可完成），但如果未来加"语义一致性检查"，直接复用 MODEL_B。
- **降级**：MODEL_B 不可用时切本地脚本纯字段比对（无模型）
- **成本估算**：纯字段比对 → 0 元；语义检查 → < 1 元
