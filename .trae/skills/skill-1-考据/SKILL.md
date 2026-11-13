# skill-1 考据整理（Source Boundary）
# PRD v13.0 §8 + §23

---

## 定位
在 Gate 1 通过后，AI 执行爬取、总结、三栏表初稿和来源台账的自动化生成。人类做 Gate 2 逐条裁决 known/unknown/inference。

## 前置依赖
- `preflight-research.md` 的 `gateStatus` 必须是 `"passed"`（Gate 1 已通过）
- 人物、问题框架、风险等级、叙事逻辑转换方案已由人类选定

## 输入
- Gate 1 选定的人物 + 问题框架
- 相关正史原文 / 文献列表
- CBDB 查询结果（如可用）

## 输出
- `episodes/{slug}/source-ledger.json` — 三栏考据表 + 来源台账
- `episodes/{slug}/evidence-table.md` — 人类可读的三栏表
- 文件 frontmatter：`gateStatus: "pending"`

### source-ledger.json schema
```json
{
  "_schema": "source-ledger.json v1",
  "_source": "PRD §8.3",
  "gateStatus": "pending",
  "entries": [
    {
      "claim": "Wu Zetian entered Ganye Temple in 649 CE",
      "bucket": "known | unknown | inference",
      "source": "Old Book of Tang, Biography of Empress Wu",
      "url": "https://...",
      "license": "public-domain | cc-by | [TBD 待 Gate 2 确认]",
      "capturedAt": "2026-11-13",
      "chgisLayer": null,
      "tgazCoord": null,
      "notes": "[Gate 2 需确认权利状态]"
    }
  ]
}
```

## 流程
1. 读取 Gate 1 选定的人物和问题框架
2. 执行爬取（正史原文、CBDB、预调研标记的公开数据源）
3. 自动对每条 claim 做初始三栏分类（known/unknown/inference，标注置信度）
4. 自动抓取 URL、许可状态、抓取时间
5. 生成来源台账
6. **输出后立即暂停**，等待人类 Gate 2 裁决

## 人类阻塞点
Gate 2 必须逐条裁决 known/unknown/inference。**无法确认权利状态的来源必须排除**。`source-ledger.json` 的 `gateStatus` 由 `"pending"` 改为 `"passed"` 后方可进入 skill-2。

## 纪律
- 来源台账即考据表（PRD §8.3）
- 无法确认权利状态的来源默认排除
- AI 初始分类是建议，不是决定
