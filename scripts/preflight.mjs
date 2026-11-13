#!/usr/bin/env node
// preflight.mjs — skill-0 预调研自动执行骨架
// PRD v13.0 §6 + §19.3 降级方案
// 运行：node scripts/preflight.mjs --figure <中文名> --stage <prelaunch/growth/mature> [--source-level <direct/degraded/manual>]
// 产出：episodes/{slug}/preflight-research.md（十部分结构 + gateStatus: pending）
// 注意：M0 先实现骨架结构生成 + 降级标记 + 候选占位；AI 调研调用延后到 M1（等 MODEL_A API Key）

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => {
    if (!a.startsWith('--')) return null;
    const v = arr[i + 1];
    return [a.slice(2), v && !v.startsWith('--') ? v : true];
  }).filter(Boolean)
);

const figure = args.figure || args.f;
const figureId = args.figureId || args['figure-id'];
const angleKey = args.angleKey || args['angle-key'];
const stage = args.stage || args.s || 'prelaunch';
const sourceLevel = args['source-level'] || args.source || 'direct';

if (!figure) {
  console.error('用法: node preflight.mjs --figure <中文名> [--figureId <slug>] [--angleKey <angle-slug>] --stage <prelaunch|growth|mature>');
  process.exit(1);
}

// slug 优先级：angleKey > figureId > 自动生成
// angleKey 是 JSON 里预定义的（如 confucius-lifelong-failure），最干净
// 否则用 figureId（如 confucius），都没有才 fallback 到自动生成
let slug;
if (angleKey) {
  slug = angleKey;
} else if (figureId) {
  slug = figureId;
} else {
  slug = figure
    .replace(/[\u4e00-\u9fa5]/g, 'figure')
    .replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 30);
}
const epDir = path.join(ROOT, 'episodes', slug);
fs.mkdirSync(epDir, { recursive: true });

console.log(`🔍 skill-0 预调研启动`);
console.log(`   人物: ${figure}  阶段: ${stage}  数据源: ${sourceLevel}  slug: ${slug}`);

// === M0 骨架：生成十部分 markdown，占位符标记 AI 调研延后 ===
// M1 接入 MODEL_A 后，把每部分 [TBD] 替换为真实 AI 调研输出
const nowISO = new Date().toISOString();

const preflightMd = `# 预调研报告 — ${figure}
> gateStatus: pending
> generatedAt: ${nowISO}
> model: HISTORY_MODEL_A (预调研角色)
> sourceLevel: ${sourceLevel}
> stage: ${stage}

---

## 1. 史料可得性
[TBD M1 接入 MODEL_A 后填充]
- 正史原文：[TBD — 哪部正史哪几卷可直连]
- 方志：[TBD]
- 考古：[TBD]
- 史料可得性评级：✅ 充足 / ⚠️ 有部分空白 / ❌ 严重空白

## 2. 欧美认知度
[TBD M1 接入 MODEL_A 后填充]
- 英文维基词条长度：[TBD]
- YouTube 同类视频播放量估算：[TBD]
- Google Trends 相关搜索热度：[TBD ${sourceLevel === 'degraded' ? '降级估算：用英文维基词条长度 + YouTube 第三方估算' : '直连'}]
- 欧美认知度评级：✅ 高（有认知基础）/ ⚠️ 中（冷启动需解释）/ ❌ 低（几乎没人知道）

## 3. 竞争分析与赞助兼容性
[TBD M1 接入 MODEL_A 后填充]
- 同类选题视频：[TBD]
- 差异化空间：[TBD]
- 赞助兼容性：✅ 适合 / ⚠️ 需谨慎 / ❌ 不适合
  - 理由：[TBD]（§26.3 赞助适合的话题类型判定）

## 4. 问题框架 + 候选标题 + 缩略图建议
[TBD M1 接入 MODEL_A 后填充]

### 候选问题框架（2-3 个）
1. [TBD] — 钩子强度：高/中/低
2. [TBD] — 钩子强度：高/中/低
3. [TBD] — 钩子强度：高/中/低

### 候选标题（§11.3 模板）
| # | 标题 | 模板 | 淘汰理由（如被淘汰） |
|---|---|---|---|
| 1 | [TBD] | T1/T2/T3/T4/T5 | |
| 2 | [TBD] | T1/T2/T3/T4/T5 | |
| 3 | [TBD] | T1/T2/T3/T4/T5 | |

### 候选缩略图（§12 五种类型）
| # | 类型 | 视觉焦点 | 淘汰理由（如被淘汰） |
|---|---|---|---|
| 1 | [单剪影/单物件/地图局部] | [TBD] | |
| 2 | [单剪影/单物件/地图局部] | [TBD] | |

## 5. 叙事逻辑与价值观风险
[TBD M1 接入 MODEL_A 后填充]

### N1-N10 依赖程度
| # | 依赖程度 | 理由 |
|---|---|---|
| N1 道德史观 | 低/中/高 | [TBD] |
| N2 成王败寇 | 低/中/高 | [TBD] |
| N3 明君/昏君 | 低/中/高 | [TBD] |
| N4 忠奸对立 | 低/中/高 | [TBD] |
| N5 大一统叙事 | 低/中/高 | [TBD] |
| N6 华夷之辨 | 低/中/高 | [TBD] |
| N7 兴亡周期 | 低/中/高 | [TBD] |
| N8 英雄/人民史观 | 低/中/高 | [TBD] |
| N9 春秋笔法/为尊者讳 | 低/中/高 | [TBD] |
| N10 因果报应/道德补偿 | 低/中/高 | [TBD] |

### V1-V10 价值观风险
| # | 风险等级 | 边界建议 |
|---|---|---|
| V1 不美化专制 | 低/中/高 | [TBD] |
| V2 不娱乐化暴力 | 低/中/高 | [TBD] |
| V3 不漠视个体生命 | 低/中/高 | [TBD] |
| V4 不性别歧视 | 低/中/高 | [TBD] |
| V5 不民族主义化 | 低/中/高 | [TBD] |
| V6 不宗教嘲讽 | 低/中/高 | [TBD] |
| V7 不碰当代政治 | 低/中/高 | [TBD] |
| V8 不做道德辩护 | 低/中/高 | [TBD] |
| V9 不做道德相对主义 | 低/中/高 | [TBD] |
| V10 不制造虚假争议 | 低/中/高 | [TBD] |

## 6. 潜在争议点
[TBD M1 接入 MODEL_A 后填充]
- 学术界争议：[TBD]
- 评论区高争议预判：[TBD]

## 7. 地图需求评估
[TBD M1 接入 MODEL_A 后填充]
- 是否需要 CHGIS：是/否
- 需要哪些年份图层：[TBD]
- 范围：[TBD]
- 坐标查询量估算：低/中/高

## 8. 风险分级
[TBD M1 接入 MODEL_A 后填充]
- 综合风险评级：🟢 低 / 🟡 中 / 🔴 高
- 理由：[TBD]

## 9. 数据源与降级记录
| 数据源 | 直连可用性 | 实际使用 | 降级说明 |
|---|---|---|---|
| CBDB | ✅ 通常可访问 | 直连 | |
| 正史原文 | ✅ 通常可访问 | 直连 | |
| Google Trends | ⚠️ 受限 | ${sourceLevel === 'degraded' ? '降级：英文维基词条长度 + 第三方估算' : '直连'} | |
| YouTube 公开数据 | ⚠️ 部分受限 | ${sourceLevel === 'degraded' ? '降级：第三方统计站点 + 人工抽样' : '直连'} | |
| 竞品分析 | ⚠️ 部分受限 | ${sourceLevel === 'degraded' ? '降级：本地快照 + 人工抽样 5-10 同类' : '直连'} | |
- 注意：不引入未经授权爬取服务；人工补充最低标准 5 个同类 + 2 个社群讨论 + 1 份维基评估

## 10. 留存结构与系列格式预判
[TBD M1 接入 MODEL_A 后填充]
- 前 3 秒钩子：[TBD]
- 30 秒开环：[TBD]
- 60-90 秒 re-hook 位置：[TBD]
- 代价碎片预置位置（2:30-3:30）：[TBD]
- 可归入的系列格式：[TBD] 或 [新建]
- 系列问题格式（§28.3.5）：[TBD]

---

## Gate 1 人类裁决（预调研报告是材料，不是决定）
- [ ] 选定人物: __________
- [ ] 选定问题框架: __________
- [ ] 选定候选标题（需先过 §11.4 自检）: __________
- [ ] 选定候选缩略图（需先过 §12.4 自检）: __________
- [ ] 接受的风险等级: __________（即使 AI 建议高风险，理由要记）
- [ ] 选定叙事逻辑转换方案: __________（比如 N1 道德史观 → 结构分析）
- [ ] 选定价值观边界: __________
- [ ] 选定赞助兼容性: 适合 / 不适合 / 需谨慎 → __________
- [ ] 选定留存结构方案: __________
- [ ] 选定系列问题格式: __________
- [ ] Gate 1 理由写入 assets/gate-log.json

签字: __________  日期: __________
`;

fs.writeFileSync(path.join(epDir, 'preflight-research.md'), preflightMd, 'utf-8');

console.log(`\n✅ preflight-research.md 已生成 → episodes/${slug}/`);
console.log(`\n📝 Gate 1 清单已附在报告末尾。下一步：人工审核 + 签字。`);
console.log(`   自动化预检可跑: node scripts/preflight-gate-check.mjs --episode ${slug}`);
console.log(`\n⚠️  M0 骨架：10 部分内容里 [TBD] 占位符需要 M1 接入 MODEL_A 后填充真实 AI 调研。`);
console.log(`   gateStatus: pending（Gate 1 通过后改为 passed）`);

// 同步创建 episode 目录结构
fs.mkdirSync(path.join(epDir, 'audio'), { recursive: true });
fs.mkdirSync(path.join(epDir, 'audio', 'segments'), { recursive: true });
fs.mkdirSync(path.join(epDir, 'subtitles'), { recursive: true });
fs.mkdirSync(path.join(epDir, 'maps'), { recursive: true });
fs.mkdirSync(path.join(epDir, 'raw'), { recursive: true });

process.exit(0);
