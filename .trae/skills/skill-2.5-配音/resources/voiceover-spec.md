# 配音规格（Voiceover Spec）
# PRD v13.0 §15

## 质量指标（硬性）
| 指标 | 目标 |
|---|---|
| 语速 | 150—170 wpm；复杂制度段 150—155；叙事段最高 170 |
| 响度 | -14 LUFS ± 1 dB |
| 峰值 | ≤ -1 dBTP |
| SRT 偏差 | < 100ms |
| 专名 | 100% 按 `assets/pronunciation-dict.json` |
| voice ID | 全片统一 |

## 停顿规则
| 位置 | 时长 |
|---|---|
| 句号后 | 0.5s |
| 段落结束 | 1.2s |
| 中文专有名词后 | 0.25s |
| 逗号/从句 | 自然停顿，不硬编码 |

## 语气纪律
- 冷静中性教育类历史旁白
- **禁止**：戏剧表演、煽情、悬疑、说书语调、过度强调
- 标准：像一个懂行的人在跟你解释，不是在给你演
- 钩子段可稍微提升张力，但不可猎奇
- 代价段语速稍慢，音量稍低，但不做夸张渲染

## SSML 结构示例
```xml
<speak version="1.0" xml:lang="en-US">
  <voice id="{fixed_voice_id}">
    <break time="500ms"/>
    <prosody rate="medium" volume="medium">
      [段落正文...]
    </prosody>
    <break time="1200ms"/>
  </voice>
</speak>
```

## 中文专有名词标记
```
在 SSML 中用 <phoneme alphabet="ipa" ph="{ipa}"> 中文词</phoneme>
例：<phoneme alphabet="ipa" ph="wuː dzəˈtjɛn">武则天</phoneme>
```

## 关键段（人类必须试听）
1. **钩子** 0:00—0:30 — 前 3 秒兑现感、节奏
2. **代价** 5:30—7:30 — 语速/音量/停顿是否让代价"有分量但不渲染"
3. **结尾** 7:30—8:00 — 开放问题的语气（开放而非说教）

## 禁用
- 添加背景音乐
- 自动决定"哪段该煽情"
- 自行推断未登记的专有名词读法
- 克隆可识别真人声音
