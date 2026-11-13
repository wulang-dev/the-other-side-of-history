# skill-3 视觉流水线（Visual Pipeline）
# PRD v13.0 §13 + §14 + §16 + §23

---

## 定位
把 Gate 3 通过的脚本、配音输出的 `voiceover-manifest.json`、地图需求，组合成时间轴 + 成片粗剪。**配音是主时钟，画面追声音**。

## 前置依赖
- `script.md` 的 `gateStatus` 必须是 `"passed"`，且三个 check 字段全部 passed
- `voiceover-manifest.json` 已生成（skill-2.5 输出）
- `.env` 已配置（如使用火山方舟视觉 QA）

## 输入
- `voiceover-manifest.json` — 分段音频 + 实测时长 + 词级时间戳
- `script.md` — 视觉单元标记 + 地图年份标记
- CHGIS 对应年份矢量图层（由人类从 QGIS 预处理导出）

## 输出
- `episodes/{slug}/timeline.json` — 逐场景时间轴（由配音实测驱动）
- `episodes/{slug}/rough-cut.mov` — 粗剪成片（不烧录字幕）
- `episodes/{slug}/maps/` — 地图片段
- AI 视觉 QA 预筛报告（标记可疑帧）

### timeline.json 结构
```json
{
  "episodeSlug": "wu-zetian-ganye-temple",
  "anchor": "voiceover-manifest.json",
  "scenes": [
    {
      "id": 1,
      "startMs": 0,
      "endMs": 18200,
      "type": "map" | "silhouette" | "timeline" | "source-card",
      "params": {"chgisYear": 649, "highlight": ["河南道", "长安"]},
      "durationSec": 18.2
    }
  ]
}
```

## 流程
1. 读取 `voiceover-manifest.json`，用实测时长锁定每段边界
2. 读取 `script.md` 的视觉单元和地图年份标记
3. 按 `max(视觉最短帧, 配音时长 + 40 帧)` 计算每场景帧数
4. 读取人类预处理的 CHGIS 地图片段
5. 生成时间轴 JSON
6. 程序化组装（Remotion 或 ffmpeg）
7. AI 视觉预筛（标记可疑帧：地图边界错误、年份标注遗漏）
8. 输出粗剪

## 视觉规范（§13 Style Guide）
- **色板**：背景米白 `#F5F2ED`，正文深灰 `#2B2B2B`，强调色低饱和赭石 `#A67C52` 或暗蓝 `#3A5A7A`
- **字体**：英文 Inter/Helvetica；中文思源黑体/Noto Sans SC（仅史料卡）
- **视觉单元**（仅允许五种）：全屏地图、左图右时间线、居中史料卡、极简剪影、静态图 + Ken Burns
- **转场**：硬切或极简淡入
- **字幕**：长视频不烧录；SRT 独立上传

## 地图准确性（§14）
- **源头**：CHGIS + TGAZ 坐标（不由 AI 生成地图形状）
- **生成前规格锁定**：每个地图镜头标注年份、来源台账记录 CHGIS 版本
- **多层校验**：AI 预筛 → 人工核对关键帧（第一帧、转折帧、高亮帧）
- **纪律**：地图从"生成任务"降级为"数据可视化任务"

## 人类阻塞点
- 地图年份和边界最终确认（H3 人工自检签字）
- AI 视觉预筛标记的可疑帧处理
- 关键帧校对

## 注意
- 本条 Skill 的脚本化（Remotion 参数化组件、QGIS 图层筛选、ffmpeg 对齐）**延后到 M2**。M0 只写 Skill 规范。
- 实际视觉生成由 Trae + ffmpeg + Remotion 完成，不是由 Skill 自动执行。

## 模型配置
- **AI 地图预筛**：~~MODEL_VQA~~ 已跳过，降级为 H3 人类自检签字（PRD §18.2 H3 强制"地图关键帧逐帧核对"）
- **为什么跳过**：Trae 内置模型不覆盖视频理解；外部 VQA API 成本 > 省下来的人工时间。PRD H3 本来就要求人类逐帧核对，AI 预筛只是可选加速项。
- **其他部分**：Remotion 组装、ffmpeg 对齐、CHGIS 图层读取全部是纯计算，不需要模型。
- **M2 可选升级**：如果后续发现地图核对重复劳动多，可加 VQA 预筛（外部付费），但当前优先级最低。
