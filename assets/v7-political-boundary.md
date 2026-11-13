# V7 当代政治红线执行手册
# PRD v13.0 V7 + 审计修复项
# 问题：原 PRD 只说"不做当代类比"，没定义什么算类比、边界在哪

---

## 1. 三条硬禁止（脚本里绝对不能出现）

### 1.1 当代领导人姓名
脚本正文 + 标题 + 缩略图 + 简介，**严禁出现任何 2020 年后在任或卸任的国家元首姓名**：
> Xi, Xi Jinping, CCP, Chinese Communist Party, Taiwan, Taiwan Strait, Hong Kong, Xinjiang, Tibet, Tiananmen, June Fourth, Mao Zedong（已故领导人在历史语境中可出现，但**严禁做当代映射**）

### 1.2 当代国家/地区做类比
**严禁任何形式的当代映射句子**：
> ❌ "Wu Zetian's rise to power is similar to how [X leader] became president"  
> ❌ "Tang dynasty censorship is just like how [Country X] suppresses speech today"  
> ❌ "This is why we need to be careful of [Modern Issue X]"  
> ✅ 正确：独立陈述历史，不做类比

### 1.3 当代边界叠历史地图
CHGIS 历史地图**只画历史时期的边界**，绝不叠当代国家边界。比如：
> ❌ 690 年武周疆域图上标"这就是今天的中国"  
> ✅ 690 年武周疆域图只显示 CHGIS 690 年图层，不出现任何当代地图元素

---

## 2. 评论区回复模板（固定话术）

如果评论区出现当代政治关联，用以下固定回复，**不辩论、不延伸、不解释**：

### 2.1 当代领导人类比
> Thank you for sharing that thought. This channel covers historical events as independent phenomena and does not draw parallels to any modern political leaders or events.

### 2.2 台湾/香港/新疆/西藏相关
> Thank you for your comment. We focus on pre-20th century Chinese history in its own historical context. Topics involving modern politics fall outside this channel's scope.

### 2.3 CCP/独裁/民主相关
> Thank you for your perspective. This channel examines historical structures and individual choices without framing them through modern political lenses.

---

## 3. Gate 3 检查方式

Gate 3 审查时，MODEL_B（审计角色）用**关键词扫描** + **语义理解**双保险：
1. 关键词扫描：匹配上面 1.1 节黑名单词，任何出现 → FAIL
2. 语义理解：扫描是否有 "similar to today's...", "this reminds me of current events", "parallels modern..." 这类句型 → WARN，人类判断

---

## 4. 合规价值

一旦违反，YouTube 可能触发：
- 内容限制（年龄屏蔽 / 推荐流降权）
- 频道警告（第一次 7 天，第二次 30 天）
- 频道终止（重复或严重违规）

所以 V7 的执行不是"价值观选择"，是**频道生存底线**。
