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
> 完整 schema：`templates/schemas/source-ledger.schema.json`（第四轮审计 FAIL-9 修复）
> qa.mjs 和 self-check.mjs 按此 schema 读取 gateStatus 和每条 claim。

**顶层字段**（skill-1 必须严格遵循）：
| 字段 | 类型 | 说明 |
|---|---|---|
| `gateStatus` | string | `pending` / `passed` / `rejected`（qa.mjs 检查此字段 === `passed` 才放行） |
| `claims` | array | 三栏考据表。每条 claim 必须有 `claim_id`、`claim_zh`、`status`、`sources` |
| `meta` | object | 元数据（slug / figure / crawled_at / research_model） |

**每条 claim 必须有**：
| 字段 | 类型 | 说明 |
|---|---|---|
| `claim_id` | string | **锚点 ID**（格式 `claim-001`）。中文逻辑稿每段开头加 `[claim-001]`，英文脚本 MODEL_A 必须保留相同 ID，模型 B 按 claim_id 对齐中英对照（第四轮 FAIL-10 修复） |
| `claim_zh` | string | 中文 claim 原文 |
| `status` | enum | `known` / `unknown` / `inference` / `excluded` |
| `sources[].license_type` | enum | `public-domain` / `cc-by` / `cc-by-sa` / `restricted` / `unknown`。只有前 3 种可以直接引用 |
| `excluded_reason` | string | status === `excluded` 时必填 |

**不遵循此 schema 的后果**：qa.mjs 会读不到正确的 gateStatus，self-check.mjs 的 A21/A26 锚点对齐会错位。

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

## 模型配置
- **角色**：MODEL_RESEARCH 考据（`.env` → `HISTORY_MODEL_RESEARCH`）
- **Trae 内置模型名**：Kimi-K3 或 MiMo-V2.6-Pro
- **为什么**：考据需要长上下文处理整段正史、对比多来源。Kimi-K3 长上下文是 Trae 内置里成本最低的考据选择。
- **成本**：Trae 积分
- **切换纪律**：skill-1 执行前，在 Trae 右下角切到 Kimi-K3 或 MiMo。
- **隔离纪律**：与 MODEL_A（生成）不同 Provider（Moonshot/小米 vs 字节/DeepSeek），隔离自动满足。
