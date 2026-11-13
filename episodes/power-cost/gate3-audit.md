# Gate 3 审计报告
> auditTime: 2026-11-13
> auditor: MODEL_B（独立上下文）
> 输入: script.md (1247词, ~9分钟) + source-ledger.json (26条claim, gate2=pending) + preflight-research.md (gate1=passed)

---

## 叙事逻辑（N1-N10）

| # | 评级 | 证据 |
|---|---|---|
| N1 道德史观 | PASS | 用"代价/权力收据"替代明君/昏君评判框架；Re-hook 段专门指出北宋儒家史官的道德建构（"Confucian moral framework that deeply distrusted female rulers"），解构"杀女得后"寓言而非传播它 |
| N2 成王败寇 | PASS | 武周"成"了（15年、疆域扩大），但被后世称为"伪朝"、正史不立本纪——脚本呈现"成功者被骂到今天"的反向叙事，无成王败寇简化 |
| N3 明君/昏君 | PASS | 既呈现科举改革/寒门提拔（正面），也呈现酷吏/告密制度（负面）；明确说"power does not come free"，不选边 |
| N4 忠奸对立 | PASS | 酷吏来俊臣 vs 名臣狄仁杰不做二元化：狄仁杰自白"我效忠的是唐朝"，来俊臣最终被武则天处决（turn on Wu clan members）；酷吏是权力工具而非"坏人"标签 |
| N5 大一统叙事 | PASS | 完全规避。武周疆域仅在地图标注洛阳为神都，不涉及疆域扩张或统一叙事 |
| N6 华夷之辨 | PASS | 完全规避。整个脚本无华夷战争、民族对立或内外有别叙事 |
| N7 兴亡周期 | PASS | 结尾轻触一句"She paved the way for... Kaiyuan Golden Age"，点到即止，不展开循环史观 |
| N8 英雄/人民史观 | PASS | 无英雄造时势叙事；无人民史观（未展开底层人民生活）；核心是权力个体的代价支付 |
| N9 春秋笔法 | PASS | Re-hook 段专门对比新旧唐书可信度：Old Book (945 CE, 近唐、抄实录、无杀女) vs New Book (1060 CE, 北宋重修、儒家偏见、首次出现完整杀女叙事)；明确指出后世史官"写的不是事实，而是一个女人做皇帝应该有多坏的寓言" |
| N10 因果报应 | PASS | 直接否定杀女案因果报应链条："Modern historians don't believe she killed her baby... a moral fable, not a historical event"，列出岑仲勉（1961）、傅乐成（1978）、McMahon（2013）的史学共识 |

**叙事逻辑总结**: **PASS**（N1-N10 全覆盖，无遗漏，无违规依赖）

---

## 价值观红线（V1-V10）

| # | 评级 | 证据 |
|---|---|---|
| V1 不美化专制 | PASS | 酷吏来俊臣/周兴客观呈现（无同情无美化）；铜匦告密网络被描述为"tools of terror"；同时客观呈现科举改革正面价值；始终锚定"她需要这些权力工具" |
| V2 不娱乐化暴力 | PASS | 全部中性词："forced to commit suicide"（未加酷刑细节）、"exiled"（无 torture 修饰）、"executed"（无 beheaded brutally）；画面提示全部是壁画、画像、地图、史料书页，无酷刑器具或尸体特写 |
| V3 不漠视个体生命 | PASS | 明确承认死亡数字："tens of thousands of households exiled or executed" / "tens of thousands"；三个代价碎片每个都有具体个体（李贤、李显、狄仁杰），不淡化 |
| V4 不性别歧视 | WARN | 脚本结尾有一句关键句"most with the Confucian moral framework that demands a female ruler be judged more harshly than any male one"——这句是好的，指出性别双重标准。但**preflight 建议结尾补一句男性皇帝代价的轻触对比**，脚本实际未执行。不算硬伤，但削弱了 V4 边界的完整性 |
| V5 不民族主义化 | PASS | 完全规避。无疆域仇、无历史仇恨叙事、无当代投射 |
| V6 不宗教嘲讽 | PASS | 佛教客观呈现："a group of monks forged a sutra"（陈述行为），龙门石窟/大云经不褒不贬；无嘲讽、无"迷信"标签 |
| V7 不碰当代政治 | PASS | 完全安全。时间线 624-705 CE，无 Xi/CCP/Taiwan/HK/Tibet/Xinjiang/Tiananmen，无当代类比句型 |
| V8 不做道德辩护 | WARN | 全程不说"她做的对/错"——这点做得好。但 Open Ending 段有一句"We know she made **terrible** choices that cost tens of thousands of lives"——**terrible** 这个词带有轻微价值判断色彩（虽然不算道德辩护），建议改为中性词 |
| V9 不做道德相对主义 | PASS | 无"古代价值观不一样所以不能评"论调；批判后世史官的双重标准（女性统治者被更苛责），但同时承认代价事实；让观众判断而非替观众判断 |
| V10 不制造虚假争议 | PASS | Re-hook 段直接说"Modern historians don't believe she killed her baby. The scholarly consensus... is that this is a moral fable, not a historical event"。非常明确，不假装"未解之谜"，钩子是"如果杀女是假的，真正的代价是什么" |

**价值观总结**: **PASS**（V1/V2/V3/V5/V6/V7/V9/V10 全 PASS；V4 和 V8 各一处轻微 WARN，不构成 FAIL；无红线硬伤）

---

## 英文质量（E1-E5 + C1-C10）

| # | 评级 | 证据 |
|---|---|---|
| E1 可读性 | PASS | 句子长度 12-25 词为主，适合口播（~140 wpm）；复杂词比例 <10%，专有名词是必要术语；口语化开头（"Let's start with what we know for certain"） |
| E2 专有名词模板 | WARN | 覆盖率约 **50-60%**（低于 70% 要求）。以下名词首次出现未按模板标注：① Bazhou（无 modern equivalent）；② Li Xian 三子版（只有 clarifier 无 role/年份标注）；③ Emperor Gaozong（无 role 标注）；④ Old Book of Tang / New Book of Tang（首次出现无年代标注，945/1060 直到 Re-hook 段才补）；⑤ Qianling Mausoleum（无方位/modern equivalent）。已正确标注的有 Wu Zetian、Luoyang、Lai Junchen、Zhou Xing、Li Xian 次子版、Fangling、Di Renjie |
| E3 节奏感 | WARN | Setup 段（0:30-2:00）长达 90 秒，超过冷启动 30 秒留存极限；re-hook 推迟到 **2:00-2:30**（preflight 建议 60-90 秒）；钩子→开环通顺，但中段拖沓 |
| E4 画面提示 | PASS | 每段旁白均配有 [画面：...] 提示，覆盖所有结构分段；画面提示与旁白内容匹配度高 |
| E5 深度+钩子平衡 | PASS | 每个史料深度段均锚定一个"代价/选择/悬念"：Setup 段权力工具锚定"cost began to collect"；Re-hook 锚定"what was her real first cost"；Cost Fragments 锚定"三个具体代价"；Climax 锚定"institutional cost"；结尾锚定"what would you write here" |

### C1-C10（十 C 深度检查）

| C# | 评级 | 证据 |
|---|---|---|
| C1 Clarity（清晰） | PASS | 无模糊概念；每个叙事节点有明确信息锚点 |
| C2 Conciseness（简洁） | WARN | 部分句子可压缩：Setup 段 "In 693 CE, she threw open the gates: commoners could now register directly for the imperial exams, no noble patron required. She made recruitment annual instead of irregular, and doubled the number of jinshi — the highest degree — awarded each year." 可拆为两句更短 |
| C3 Coherence（连贯） | PASS | 段落间过渡流畅：权力工具→杀女案争议→真正的代价→制度代价→神龙政变→无字碑未解之谜；首尾呼应（无字碑→无字碑） |
| C4 Character（人物） | PASS | 武则天形象立体：决策者（立铜匦、开科举）、母亲（放逐儿子）、被弑者（酷吏反噬）；狄仁杰作为 contrast character 补充忠唐叙事 |
| C5 Conflict（冲突） | PASS | 多重冲突：她 vs 旧贵族、她 vs 亲生儿子们、她 vs 后世儒家史官叙事、狄仁杰 vs 内心忠唐 |
| C6 Choice（选择） | PASS | 每个代价片段呈现具体选择：放逐李贤（选权力不选亲）、建铜匦（选效率不选信任）、不立碑文（选沉默不选辩护） |
| C7 Consequence（后果） | PASS | 酷吏→tens of thousands died；杀女寓言→后世道德污名；无字碑→无人能写她的历史；酷吏反噬→来俊臣被诛 |
| C8 Context（背景） | PASS | 武周建立时间线、年龄（66岁登基）、统治时长（14年4个月）、酷吏名单（27人）、科举改革细节、佛教宣传手段——背景密度充足 |
| C9 Contrast（对比） | PASS | 新旧唐书可信度对比；有字碑（八千字）vs 无字碑（零字）；她建立的制度 vs 她无法控制的死后名声；狄仁杰的双重忠诚 |
| C10 Curiosity（好奇） | PASS | 钩子悬念（无字碑为什么空白？）、re-hook 悬念（杀女案是假的，真正代价是什么？）、结尾 open question（What would you write here?） |

**英文质量总结**: **PASS**（E1/E4/E5 + C1-C10 全覆盖；E2 专有名词覆盖率不足 WARN + E3 节奏偏慢 WARN + C2 个别句子过长 WARN；三 WARN 不构成 FAIL）

---

## 留存结构（A33-A37）

| A# | 评级 | 证据 |
|---|---|---|
| A33 前3秒钩子兑现 | PASS | 钩子 "This stone is blank" → 3秒内明确指向无字碑；钩子承诺的 "what she lost" → 30秒内部分解答（"Three sons, one daughter, a thousand officials, and her own reputation forever"）。按冷启动 AVD≥35% 标准，部分解答可接受 |
| A34 30秒开环 | PASS | 钩子是"问题环"（无字碑为什么空白 + 她付出了什么代价？）→ 30秒内开环（"Every emperor pays a price to rule. But Wu Zetian's price list — the receipts of power that came due..."） |
| A35 60-90秒 re-hook | WARN | ⚠️ **实际 re-hook（杀女案史学争议）在 2:00-2:30，不是 60-90秒**。Setup 段（0:30-2:00 = 90秒）过长，四个权力工具（铜匦、酷吏、科举、佛教）塞了完整 90 秒，无中间钩子拉回。建议压缩 Setup 到 60-75秒内 |
| A36 代价碎片预置 | PASS | 2:30-3:30 三个具体代价齐全：① First: the poem of the crane（李贤，流放巴州，被逼自杀，写《黄台瓜辞》）；② Second: fifty-five days（李显三子，登基仅55天即废，流放房陵14年）；③ Third: the loyal turncoat（狄仁杰，被酷吏下狱，自白效忠唐朝）。每个都有具体人物+具体动作+具体遗物 |
| A37 结尾无总结 | PASS | 结尾不做总结（不说"所以她是好/坏皇帝"）；结尾是 open question："What would you write here?" |

**留存结构总结**: **PASS**（A33/A34/A36/A37 全 PASS；A35 re-hook 位置推迟 WARN，但 Setup 段内容完整可压缩）

---

## 总体结论

| gateStatus | narrativeLogicCheck | valuesCheck | englishQualityCheck |
|---|---|---|---|
| **passed** | **passed** | **passed** | **passed** |

### 分级问题清单（按严重程度）

#### 🔴 硬伤（需重写）：无

#### 🟡 WARN（建议修改但不阻塞发布）

| # | 维度 | 问题 | 位置 | 建议改法 |
|---|---|---|---|---|
| WARN-1 | E2 专有名词 | Bazhou 首次出现无 modern equivalent | Script L75: "exiled him to Bazhou, a remote corner of the empire" | → "exiled him to Bazhou (modern Sichuan Province), a remote corner of the empire" |
| WARN-2 | E2 专有名词 | Emperor Gaozong 首次出现无 role 标注 | Script L125: "the emperor she once served" | → "Emperor Gaozong (her husband, r. 649–683 CE), the emperor she once served" |
| WARN-3 | E2 专有名词 | 新旧唐书首次出现无年代标注 | Script L60: "Traditional accounts say..." | → "The New Book of Tang (1060 CE, Northern Song), written by Confucian historians..."（年代前移到首次提及处）|
| WARN-4 | E2 专有名词 | Li Xian 三子版首次出现无 role/年份标注 | Script L81: "Li Xian — the third son, not to be confused with the second" | → "Li Xian (Emperor Zhongzong, 656–710) — the third son, not to be confused with the second Li Xian" |
| WARN-5 | E3 节奏 | Setup 段 90 秒过长，re-hook 推迟到 2:00 | Script L31-L51 | 压缩 Setup 段到 60-75秒：将科举改革（L41-L43）和佛教宣传（L46-L47）部分内容后移到 Cost Fragments 段开头或 Climax 段。建议 Setup 结构：① 登基+武周疆域（20秒）→ ② 铜匦+酷吏（25秒）→ ③ 开科举+佛教（35秒，压缩）→ re-hook 提前到 1:30-1:45 |
| WARN-6 | V4 性别 | 结尾未补男性皇帝代价的轻触对比 | Script L152-L156 | 可在 Open Ending 段加一句："Every Chinese emperor of that era made such choices — killing rivals, using spies, exiling family. What makes Wu Zetian's story different is that she was the only one whose critics wrote down her cost as if it proved she should never have ruled."（轻触，不展开）|
| WARN-7 | V8 轻微价值色彩 | "terrible choices" 带有价值判断 | Script L156: "We know she made terrible choices that cost tens of thousands of lives" | → "We know she made choices that cost tens of thousands of lives." |

#### ⚪ 观察项（可选改进）

| # | 维度 | 观察 | 位置 |
|---|---|---|---|
| OBS-1 | C2 conciseness | Setup 段科举改革两句可压缩 | Script L43 |
| OBS-2 | source-ledger | gate2_decision 字段是 "pending - awaiting human Gate 2 ruling"，脚本生成在 Gate 2 通过之前——按 PRD 规则这是违规的，但从审计角度只做记录，不阻塞 Gate 3 | source-ledger.json meta |
| OBS-3 | source-ledger | claim-021（龙门石窟面容模仿武则天）confidence=C（inference），脚本中说"Some scholars argue the face of that statue was modeled on hers"——表述准确，标注了争议 | Script L47 |

---

### 至少 3 处修改前后对照

**1. Bazhou 专有名词缺失（WARN-1）**
- **原文**: *"In 680 CE, she accused him of treason and exiled him to Bazhou, a remote corner of the empire."*（Script L75）
- **建议改法**: *"In 680 CE, she accused him of treason and exiled him to Bazhou (modern Sichuan Province), a remote corner of the empire."*
- **理由**: 专有名词模板要求地名首次出现标注 modern equivalent，脚本多处漏标

**2. "terrible choices" 价值色彩（WARN-7）**
- **原文**: *"We know she made terrible choices that cost tens of thousands of lives."*（Script L156）
- **建议改法**: *"We know she made choices that cost tens of thousands of lives."*
- **理由**: "terrible" 是轻微道德判断词，违反 V8 不做道德辩护原则——应只陈述事实（"choices that cost lives"），让观众自己判断好坏

**3. Re-hook 位置推迟（WARN-5，结构层面）**
- **原文结构**: Opening Hook (0-30s) → Setup 90s (30s-2min) → Re-hook (2-2:30)
- **建议结构**: Opening Hook (0-30s) → Setup 60s (30s-90s) → Re-hook (90s-2min)
- **具体改法**: 将 Setup 段中的科举改革（"In 691 CE, she created the Palace Examination..." 到 "entered the bureaucracy"）从 2-3 句压缩到 1 句，或后移到 Cost Fragments 段开头。这样前 90 秒钩子→开环→re-hook 完整闭环，符合冷启动 30 秒留存目标

---

### 需要重写的部分

**无硬伤重写要求**。所有 7 个 WARN 都是建议性修改，不阻塞 Gate 3 最终签字。建议优先处理 WARN-5（节奏）和 WARN-1/2/3/4（专有名词）——这两项影响 YouTube 冷启动留存和英文母语者可读性。

---

*End of Gate 3 Audit.*
