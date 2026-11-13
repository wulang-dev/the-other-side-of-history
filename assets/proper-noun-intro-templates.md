# 专有名词首次出现英文解释模板
# 审计 WARN-8 + WARN-13 修复项
# 欧美观众读 "Wu Zetian" 没概念，但读带解释的就能接上。
# 这些模板必须写进 skill-2 的 prompt，确保 MODEL_A 生成英文旁白时自动应用。
#
# ⚠️ WARN-13 统一规定：所有年份用 **CE**（Common Era）表示公元后，**BCE** 表示公元前。
# 不用 AD/BC（涉及宗教暗示；CE/BCE 是学术圈中性通用标准）。

---

## 四类模板

### 1. 朝代（Dynasties）
**格式**：`Name (a ruling house that lasted X years, YYYY–ZZZZ CE)` 或 `Name Dynasty (YYYY–ZZZZ CE)`

> ✅ "Tang Dynasty (618–907 CE), a golden-age Chinese ruling house"  
> ✅ "Han Dynasty (206 BCE–220 CE)"  
> ❌ "Tang Dynasty" （首次出现没有解释）

### 2. 人物（Historical Figures）
**格式**：`Name (role, YYYY–ZZZZ CE)` 

> ✅ "Wu Zetian (empress regnant, 624–705 CE)"  
> ✅ "Emperor Taizong (second Tang ruler, 598–649 CE)"  
> ✅ "Di Renjie (chancellor under Empress Wu, 630–700 CE)"

**注意**：如果人物生卒年不详，只写角色：`Name (role in the Tang court)`

### 3. 地名（Geographic Names）
**格式**：`Name (modern equivalent, 方位 of modern 城市)` 或 `Name (in today's 省份)`

> ✅ "Chang'an (modern Xi'an, capital of the Tang Dynasty)"  
> ✅ "Luoyang (in today's Henan province)"  
> ✅ "The Yellow River (China's second-longest river, flowing 5,464 km east)"

### 4. 官职/制度（Titles & Institutions）
**格式**：尽量意译 + 简短解释，避免拼音

> ✅ "chancellor (top civil official, roughly equivalent to a prime minister)"  
> ✅ "imperial examination (a civil service test for government positions)"  
> ✅ "Six Ministries (the central administrative bodies of the Tang court)"  
> ❌ "zizhi tongjian" （直接拼音，无解释）  
> ❌ "yamen" （直接拼音）

---

## skill-2 prompt 强制纪律

```
在生成英文旁白时：
1. 每个朝代、人物、地名、官职/制度在脚本里**首次出现时必须用上述格式解释**
2. 同一专有名词在后续出现时**可以直接用名字**，不必重复解释
3. 如果专有名词在段落开头首次出现，解释紧跟在括号里，不影响句子流畅度
4. 禁止用拼音代替意译（除了人名/地名本身无英文对应）
```

---

##  Gate 3 检查方式

MODEL_B（审计角色）：
1. 统计专有名词总数
2. 统计首次出现时有解释的数量
3. 覆盖率 < 90% → WARN（人类补漏）
4. 覆盖率 < 70% → FAIL（重写）
