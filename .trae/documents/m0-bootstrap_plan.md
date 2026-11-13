# The Other Side of History — M0 基建实施计划

> 本计划覆盖 PRD v13.0 第 21 节（项目隔离）、第 20 节（Trae 编排）、第 23 节（Skill 拆分）、附录 A（模板资产）的全部落地事项。
> 目标：把"只有 PRD.md 的空白项目"变成"能跑通第一条视频的完整基础设施"。
> 不覆盖 M1 及之后的视频制作流水线执行。

---

## Repository Research

**当前状态**：工作区 `e:\TRAE-SOLO-PROJECT\The Other Side of History\` 仅包含 PRD.md + PRD.html，无任何子目录、无 `.trae/`、无 Git 仓库。

**PRD 定义的落地范围**（从文档抽出的可执行清单）：

| PRD 章节 | 要落地的东西 |
|---|---|
| §21 项目隔离 | 完整目录结构 + Skill 安装在 `.trae/skills/` + Rules 在 `.trae/rules/` + `.env` + `.gitignore` |
| §20 Trae 编排 | `.trae/rules/ao-workflow-runner.md`（三道门 + `gateStatus` 检查 + 自检纪律） + `workflows/history-video.yaml` |
| §23 Skill 拆分 | skill-0 预调研、skill-1 考据、skill-2 脚本、skill-2.5 配音、skill-3 视觉、skill-4 QA、skill-5 自检 |
| 附录 A 模板 | pronunciation-dict.json、thumbnail-ab-log.json、中文逻辑脚本模板、AI 英文提示词、中英对照自检提示词、母语审校提示词、TTS 提示词、Gate 检查清单 |
| §13 Style Guide | 色板、字体、视觉单元规范 |
| §9 叙事逻辑/价值观 | N1—N10 正反样例库 `narrative-logic-handbook.md`、V1—V10 红线 |
| §10 英文规范 | `english-patterns.md` 初始化、E1—E5 + C1—C10 |
| §17 自检 | A1—A37 模板、self-check-report.md |
| §25 评论区 | `comment-response-playbook.md` |
| §26.5 赞助 | `sponsorship-boundary.md` |

**依赖约束**：PRD §23.2 明确 Skill 开发顺序：
> skill-2.5（配音）先行 → skill-0 → skill-1 → skill-2 → skill-3 → skill-5 → skill-4

理由（PRD §15.1）：配音是整条流水线的主时钟、接口定义者，最低成本最快验证。

**参考实现**：同工作区 `BrineCry Sim` 项目已有完整的 `.trae/{skills,documents,rules,specs,handoff,agents}` 结构，可参照其 SKILL.md 和 rules 文件的实际写法，避免格式踩坑。

---

## Files and Modules

### A. 项目隔离目录（§21）

| 路径 | 说明 |
|---|---|
| `.trae/rules/` | 工作流规则，含 `ao-workflow-runner.md` |
| `.trae/skills/skill-*/` | 7 个 Skill，各含 `SKILL.md` 和可选 `resources/` |
| `workflows/` | 含 `history-video.yaml` |
| `episodes/` | 存放每条视频的中间产物 |
| `assets/` | 跨视频资产（JSON 索引、手册、日志） |
| `templates/` | 提示词、模板、检查清单 |
| `scripts/` | 可脚本化执行的自检、TTS 调用、可读性计算等 |
| `.env` | API Key（不进 Git） |
| `.gitignore` | 忽略 `.env`、`episodes/` 中临时产物、模型缓存等 |

### B. 规则文件（§20）

| 文件 | 核心内容 |
|---|---|
| `.trae/rules/ao-workflow-runner.md` | 三道门硬暂停纪律、`gateStatus` 字段检查规则、自检 FAIL 阻止进入人工自检、人工自检未签字阻止发布、Skill 间模型隔离（生成和自检用不同实例） |

### C. Skill 包（§23）

每个 Skill 目录下至少有一个 `SKILL.md`（Skill 元数据 + 执行流程 + 人类阻塞点 + 输出 schema + 异常处理）。

| Skill | 开发优先级 | 必须产出的附加文件 |
|---|---|---|
| skill-2.5 配音 | 1 先行 | `resources/voiceover-spec.md` + `scripts/tts-call.mjs` + 调用火山/Qwen-TTS 的 HTTP 示例 |
| skill-0 预调研 | 2 | `resources/preflight-template.md`（十部分结构） |
| skill-1 考据 | 3 | （纯 Skill 描述，无脚本） |
| skill-2 脚本 | 4 | `resources/cn-logic-template.md` + `resources/prompt-english.txt` + `resources/prompt-bilingual-check.txt` |
| skill-3 视觉 | 5 | （依赖 CHGIS/QGIS/Remotion，先写 Skill 规范，脚本化延后） |
| skill-5 自检 | 6 | `scripts/self-check.mjs`（A1—A37 执行逻辑）+ `scripts/readability.mjs`（A25） |
| skill-4 QA | 7 | （最后收尾，整合所有 gateStatus 检查） |

### D. 跨视频资产（§21.5 / 附录 A）

全部在 `assets/` 下，JSON 文件直接给空 schema + 注释，Markdown 文件给骨架：

| 文件 | Schema / 内容来源 |
|---|---|
| `pronunciation-dict.json` | 附录 A-1 |
| `thumbnail-ab-log.json` | 附录 A-2 |
| `topic-index.json` | §21.5 提到的跨视频选题库（title, slug, risk, narrativeLogicSummary, sponsorshipFit, retentionSummary, seriesFormat） |
| `source-index.json` | 来源查重索引 |
| `gate-log.json` | 三道门审核记录（每次 Gate 通过的决策摘要） |
| `selfcheck-history.json` | A1—A37 自检历史通过率 |
| `narrative-logic-handbook.md` | §9.5 正反样例库框架（N1—N10 每项至少 1 正 + 2 反） |
| `english-patterns.md` | §10.5 L4 长期积累（空骨架，待首条视频回填） |
| `comment-log.json` | §25.4 评论反馈回流 |
| `health-metrics.json` | §28.2 负面监控指标 |
| `retention-log.json` | §28.3.3 留存曲线诊断 |
| `outlier-log.json` | §28.3.4 爆款离群值 |
| `sponsorship-boundary.md` | §26.5 赞助边界文档骨架 |

### E. 模板资产（§24 模板资产清单 + 附录 A）

全部在 `templates/` 下：

| 文件 | 来源 |
|---|---|
| `title-candidates.md` | §11.3 五套通用标题模板 + §11.5 淘汰机制 |
| `title-checklist.md` | §11.4 十项自检清单 |
| `thumbnail-checklist.md` | §12.4 十二项自检清单 |
| `comment-response-playbook.md` | §25.2 评论分类处理策略骨架 |
| `gates/gate-1-topic.md` | Gate 1 打印版（附录 B1） |
| `gates/gate-2-source-boundary.md` | Gate 2 打印版（附录 B2） |
| `gates/gate-3-narrative-rewrite.md` | Gate 3 打印版（附录 B3） |
| `gates/tts-delivery.md` | TTS 交付清单（附录 B4） |
| `gates/final-release.md` | 发布前总校验（附录 B5） |

### F. 脚本骨架（§23.4 Trae 可接手）

| 文件 | 职责 | 复杂度 |
|---|---|---|
| `scripts/check-env.mjs` | 检查 `.env` 是否存在、API Key 是否配置、模型端点可达性 | 低 |
| `scripts/tts-call.mjs` | 封装火山引擎 / 阿里百炼 TTS HTTP 调用，输入英文文本输出音频 + SRT | 中 |
| `scripts/readability.mjs` | 对英文脚本跑 Flesch-Kincaid、句长、被动语态占比等指标（A25） | 中 |
| `scripts/self-check.mjs` | A1—A37 执行器，读取相关文件逐项检查输出 PASS/FAIL/WARN | 高（但可骨架化） |
| `scripts/qa.mjs` | 最终集成所有 gateStatus 检查 | 低 |

### G. 工作流声明（§20.3）

| 文件 | 说明 |
|---|---|
| `workflows/history-video.yaml` | PRD §20.3 的 DAG 完整拷贝（已在 PRD 里给了 YAML 示例） |

---

## Implementation Steps

按依赖顺序执行，每个步骤内部可并行：

### Step 1：初始化 + 项目隔离骨架
1. `git init`（当前目录）
2. 创建目录树：`.trae/rules/`、`.trae/skills/{skill-0..skill-5}`、`workflows/`、`episodes/`、`assets/`、`templates/gates/`、`scripts/`
3. 写 `.gitignore`（忽略 `.env`、`episodes/*/raw/`、模型缓存、临时音频）
4. 写 `.env` 骨架（列出所有需要的 Key 占位，不填值）
5. 写 `workflows/history-video.yaml`（从 PRD §20.3 原样写入）

### Step 2：Rules + 跨资产模板
6. 写 `.trae/rules/ao-workflow-runner.md` — 三道门硬暂停、`gateStatus` 检查规则、模型隔离纪律
7. 写 `assets/` 下全部 JSON 骨架和 Markdown 手册（narrative-logic-handbook.md、sponsorship-boundary.md、english-patterns.md 等）
8. 写 `templates/` 下全部模板（标题模板、缩略图自检、评论区手册、Gate 打印版）

### Step 3：Skill 包（按开发顺序）
9. **skill-2.5 配音** — SKILL.md 完整写（输入/输出/流程/阻塞点/异常处理/质量指标） + voiceover-spec.md + tts-call.mjs 骨架
10. **skill-0 预调研** — SKILL.md + preflight-template.md（十部分结构）
11. **skill-1 考据** — SKILL.md（相对简单，输出 `source-ledger.json`）
12. **skill-2 脚本** — SKILL.md + cn-logic-template.md + prompt-english.txt + prompt-bilingual-check.txt
13. **skill-3 视觉** — SKILL.md（规范层，脚本化延后到 M2）
14. **skill-5 自检** — SKILL.md + self-check.mjs 骨架（A1—A37 每项检查逻辑写注释，脚本实现简化）+ readability.mjs 骨架
15. **skill-4 QA** — SKILL.md + qa.mjs 骨架

### Step 4：剩余脚本 + 环境验证
16. 写 `scripts/check-env.mjs`（环境可达性检查）
17. 写 `scripts/self-check.mjs`（简化版可跑，先覆盖 A16 软字幕、A17 AI 披露、A18 来源台账等机械项；A33—A37 留存结构检查用时间戳比对逻辑占位）
18. 写 `scripts/readability.mjs`（调用 readability 库或简易分词计算）
19. 写 `scripts/qa.mjs`（检查所有 `gateStatus === "passed"`）
20. 本地验证：`node scripts/check-env.mjs` 不报错、`node scripts/readability.mjs "Hello world this is a test"` 不崩

### Step 5：首次 Git 提交
21. `git add -A` + `git commit -m "M0 bootstrap: project isolation, rules, 7 skills, templates, workflow"`

---

## Dependencies and Considerations

- **TTS API Key 暂不填入 `.env`**（§21.4 凭证隔离）。tts-call.mjs 脚本示例保留 HTTP 调用代码，但实际 API Key 待 M1 首条视频前配置。
- **视觉流水线（skill-3）的 CHGIS/QGIS/Remotion 依赖**是 M1 之后才要实际安装的。M0 只写 Skill 规范，不跑通。
- **Python readability 库**（Flesch-Kincaid 计算）。已在本环境验证 `python -m pip install markdown` 可用，readability 同样 pip install。
- **Node.js 环境**。自检脚本用 `.mjs` 后缀确认 ESM 模式；需要验证 node/npm 可用。
- **Windows PowerShell 5 与 Node 脚本**。自检脚本不要用 `#!/usr/bin/env node` shebang，直接 `node scripts/xxx.mjs` 调用。
- **Skill 间模型隔离**（§21.2）。`ao-workflow-runner.md` 必须写死：skill-2 生成英文脚本用模型 A，skill-5 自检 A25/A26 用模型 B（或同一 Provider 的不同端点）。
- **PRD 中的 YAML 已是完整 DAG**，但 `.trae/rules/ao-workflow-runner.md` 需要定义"哪些条件触发硬暂停"，不能只依赖 YAML。
- **episodes/ 下首集 slug 暂不创建**，留给 M1。

---

## Validation

实施完成后逐项验证：

1. `Get-ChildItem -Recurse .` 目录结构与 PRD §21.1 一致
2. 7 个 Skill 目录下都有 `SKILL.md`，且都包含 PRD 要求的输入/输出/阻塞点
3. `ao-workflow-runner.md` 明确列出 Gate 1/2/3 的暂停条件和 `gateStatus` 检查纪律
4. `history-video.yaml` 可被 yaml lint 正确解析（无语法错误）
5. `node scripts/check-env.mjs` 至少能执行完不崩（即使报 "API Key 未配置" 也是预期行为）
6. `scripts/readability.mjs` 跑一段测试文本能输出 Flesch-Kincaid 分数
7. `assets/` 下 JSON 文件能被 JSON 解析器正确解析（空 schema 也是合法 JSON）
8. Skill 中"生成英文脚本的 Skill 与自检 Skill 必须使用不同模型实例"这条约束在 rules 或至少一个 Skill 里被显式写入
9. `.gitignore` 里有 `.env`，且 `.env` 文件本身不进 Git
10. 所有模板文件里的"待回填"位置被标注 `[TBD]` 或明确写"首条视频后回填"

---

## Risks

- **Skill SKILL.md 写了但 Trae 不识别**：Trae 需要重启或重新加载 Skill 列表。fallback：重启 Trae 后在新会话里 `List Skills` 验证。
- **tts-call.mjs 写了但实际 API 端点在国内不可达**：§19.3 已经有降级方案。fallback：先手动生成首条配音，Skill 在 M2 再完善。
- **readability.mjs 的 Flesch-Kincaid 计算用英文分词器**：中文逻辑脚本不需要读分性指标，A25 只针对英文脚本。fallback：`scripts/readability.mjs` 只处理英文，中文输入直接跳过。
- **PRD 中 YAML 与 Skill 描述的对应关系可能有轻微不一致**：以 SKILL.md 内的"执行顺序"为准，YAML 是声明层，SKILL.md 是实际执行指南。
- **一次性基建量较大（20+ 文件）**：每个文件都相对简单，主要是骨架而非深度逻辑。如果执行时间过长可拆成两个 commit（Step 1-4 一次，Step 5 一次）。
