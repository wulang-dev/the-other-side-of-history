# 发布后聚合清单（手动）
# 第四轮审计 WARN-17 修复
# 发布后 48 小时 + 每周 + 每月 需要手动填写的聚合资产

---

## 发布后 48 小时（必填）
打开 YouTube Studio → Analytics → 记录以下数据并手动更新对应 JSON：

| 资产文件 | 字段 | 怎么取 |
|---|---|---|
| `assets/retention-log.json` | slug, published_at, retention_30s, avd_pct, dropoff_peak_at | Studio → Analytics → Audience retention |
| `assets/outlier-log.json` | slug, outlier_multiple (vs 前一条) | Studio → Analytics → 与频道均值对比 |
| `assets/topic-index.json` | slug, performance.avd_pct, performance.retention_30s | 同上 |

### 判定规则
- 冷启动期（1-5 条）AVD < 35% → WARN（不自动失败，判断钩子弱还是叙事拖）
- 前 10 条无任何 ≥ 2x 离群值 → 触发结构性复盘（PRD §28.3.4）

## 每周（选填但建议做）
打开 YouTube Studio → Comments → 手动更新：

| 资产文件 | 字段 | 怎么取 |
|---|---|---|
| `assets/comment-log.json` | slug, top_comments (前20条), negative_ratio, ai_questions_count | Studio → Comments → 筛选 |
| `assets/health-metrics.json` | slug, report_count, opposite_opinion_count | Studio → 社区指导问题 |

### 负面监控阈值
- 举报率 > 0.5% → 重点关注（可能被标记）
- 对立言论占比 > 20% → 思考是否选题有争议
- AI 质疑占比 > 15% → 检查 AI 披露声明是否清晰

## 每月（复盘用）
- 留存曲线趋势：上升/平稳/下降 → 记录
- 爆款离群值趋势：有没有越来越好 → 记录
- 英文质量趋势：可读性指标 → 跑 readability.mjs 取平均
