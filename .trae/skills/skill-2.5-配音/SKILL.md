# skill-2.5 配音（Voiceover）
# PRD v13.0 §15 + §16 + §23

---

## 定位与先行理由
配音 Skill 是整条流水线的主时钟和接口定义者，**先行开发**。产出的 QA 报告和发音备注是"人类创作投入"证据链的起点。视觉时长服从配音实测时长。

## 目标与边界
- ✅ 把定稿英文旁白转化为风格一致、发音可控、响度标准化、时间轴准确的旁白音频和 SRT 字幕
- ✅ 产出词级时间戳（`voiceover-manifest.json`），供视觉流水线对齐
- ❌ 不修改脚本内容
- ❌ 不改变叙事语气（"冷静中性教育类"，禁止煽情/悬疑/说书语调）
- ❌ 不克隆可识别真人声音
- ❌ 不自动决定"哪一段该煽情"

## 前置依赖（Gate 3 通过）
- `script.md` 需同时满足：
  ```yaml
  gateStatus: "passed"
  narrativeLogicCheck: "passed"
  valuesCheck: "passed"
  englishQualityCheck: "passed"
  ```
- `.env` 已配置 TTS API Key（火山引擎 或 阿里百炼）
- `assets/pronunciation-dict.json` 可用

## 输入
- 定稿英文旁白（`script.md` 中的英文正文，含分段标记）
- 固定 voice ID（第一期由人类选定）
- `assets/pronunciation-dict.json`
- 目标语速 150—170 wpm，段落波动 ≤ 10 wpm
- SSML 停顿：句号后 0.5s；段落结束 1.2s；中文专有名词后 0.25s
- 响度目标 -14 LUFS，真峰值 ≤ -1 dBTP

## 输出
- `episodes/{slug}/audio/segments/` — 分段旁白音频
- `episodes/{slug}/audio/full.wav` — 完整旁白轨
- `episodes/{slug}/subtitles/voiceover.srt` — SRT 英文字幕（仅音轨转写，不含视觉提示）
- `episodes/{slug}/voiceover-manifest.json` — 词级时间戳 + QA 报告 + 发音词典新增项

### voiceover-manifest.json schema
```json
{
  "episodeSlug": "wu-zetian-ganye-temple",
  "voiceId": "{fixed_voice_id}",
  "segments": [
    {"id": 1, "startMs": 0, "endMs": 18200, "durationSec": 18.2}
  ],
  "srtPath": "subtitles/voiceover.srt",
  "wordTimestamps": [],
  "measuredWpm": 156,
  "measuredLuFS": -14.1,
  "pronunciationDictAdditions": [
    {"term": "Ganye Temple", "ipa": "ɡɑːn jɛn ˈtɛmpl", "confirmedBy": "human", "confirmedAt": "2026-11-15"}
  ],
  "qaReport": {
    "peakDbTP": -1.2,
    "srtMaxOffsetMs": 42,
    "issues": []
  }
}
```

## 流程
1. 文本预处理（分段、专有名词标记、SSML 插入停顿）
2. 🔒 **WARN-19 自动标记 IPA 需求**：扫描脚本里所有**不在 pronunciation-dict.json 里的大写专有名词**（朝代/人物/地名/官职）→ 自动标注 `[NEEDS IPA: "Word"]`，一次性列给人类确认，不是一个个暂停
3. 发音词典应用；人类一次性确认所有 `[NEEDS IPA]` 标记后继续
4. 按段落生成 TTS 旁白
5. 词级时间戳提取；段落累计时长计算
5. 人类试听关键段（钩子 0:00—0:30、代价 5:30—7:30、结尾 7:30—8:00）→ 签字后继续
6. 完整音频混音标准化（响度、峰值）
7. QA 报告生成

## 人类阻塞点（不可跳过）
- [ ] 声音定调（第一期决定 voice ID，之后锁定）
- [ ] 新专有名词读法确认（暂停等待，不自行推断）
- [ ] 钩子 / 代价 / 结尾 三段试听签字
- [ ] 语气最终裁决（如"像在念论文"→ 退回 Gate 3 重写 E1/E2）

## 合规
- 不克隆可识别真人声音
- 通用 TTS 旁白不触发 YouTube 强制披露
- 简介保留 "AI 辅助制作，人类负责判断" 声明
- 发音词典 + QA 报告纳入来源台账

## 异常处理
| 情况 | 处理 |
|---|---|
| 专名读错 | 加入词典重新生成该段 |
| 语气不对 | 调 SSML 或人类重录关键段 |
| 时间轴漂移 | 重新对齐时间戳 |
| 爆音截断 | 重新生成 |
| 脚本拗口 | 回到脚本修改（触发 Gate 3 重审 E1/E2） |
| 新词条无法确认 | 暂停等待人类输入 |
| TTS API 故障 | 切换备选厂商；不行则暂停制作 |

## 质量指标（硬性）
- 语速 150—170 wpm
- 段落间波动 ≤ 10 wpm
- 响度约 -14 LUFS，真峰值 ≤ -1 dBTP
- 字幕偏差 < 100ms
- 专名 100% 按词典
- 全片同一 voice ID
- 无爆音、截断、突然变速

## 提示词（见 `resources/voiceover-prompt.txt`）
SSML 结构已在附录 A-7 给出。

## 模型配置
- **角色**：MODEL_TTS 配音（`.env` → `VOLC_TTS_APPID` + `VOLC_TTS_ACCESS_TOKEN`）
- **为什么**：TTS 是音频生成，Trae 内置模型不覆盖。火山引擎支持 SSML 停顿/中英混读，成本可控（~10 元/条）。
- **成本**：~10 元/条（8 分钟旁白约 8000 字 × 1.3 元/千字）
- **凭据**：AppId + AccessToken 两个都要（按火山引擎官方文档，不同接口鉴权方案不同，不能混用）。
- **降级**：火山引擎不可用时切 Edge-TTS（本地免费 Windows 语音合成）。
- **纪律**：voice ID 首条视频前由人类在火山控制台试听选定并锁定；新专名读法暂停等人类确认，不自行推断。
