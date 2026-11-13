#!/usr/bin/env node
// topic-discovery.mjs — skill-0 选题发现模式（--discover）
// 冷启动阶段主动推荐 5-10 个选题，带真实数据支撑
// 运行：node scripts/topic-discovery.mjs [--stage prelaunch|growth|mature] [--count 8]

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

const stage = args.stage || 'prelaunch';  // prelaunch | growth | mature
const count = parseInt(args.count) || 8;

console.log(`\n🔍 skill-0 选题发现模式 --discover`);
console.log(`   阶段: ${stage}  目标推荐数: ${count}`);

// === 1. 加载洋人感兴趣的名人清单 ===
const FIGURE_LIST_PATH = path.join(ROOT, 'assets', 'western-audience-figure-list.json');
if (!fs.existsSync(FIGURE_LIST_PATH)) {
  console.error('❌ western-audience-figure-list.json 不存在！');
  process.exit(1);
}
const figureData = JSON.parse(fs.readFileSync(FIGURE_LIST_PATH, 'utf-8'));
const FIGURES = figureData.figures;

console.log(`   ✅ 名人清单: ${FIGURES.length} 个人物 (S=${FIGURES.filter(f=>f.westernNotabilityTier==='S').length}, A=${FIGURES.filter(f=>f.westernNotabilityTier==='A').length}, B=${FIGURES.filter(f=>f.westernNotabilityTier==='B').length}, C=${FIGURES.filter(f=>f.westernNotabilityTier==='C').length})`);

// === 2. 去重：扫描 episodes/ 里已完成的 ===
const DONE_ANGLES = new Map(); // figureId → Set of angleKeys
const DONE_FIGURES = new Set(); // figureIds where ALL angles are done

const EP_DIR = path.join(ROOT, 'episodes');
if (fs.existsSync(EP_DIR)) {
  const epSlugs = fs.readdirSync(EP_DIR).filter(d => {
    const full = path.join(EP_DIR, d);
    return fs.statSync(full).isDirectory() && !d.startsWith('_');
  });
  
  for (const slug of epSlugs) {
    // 优先读 episode.json 里的 dedup 标记
    const epJsonPath = path.join(EP_DIR, slug, 'episode.json');
    let figureId, angleKey;
    
    if (fs.existsSync(epJsonPath)) {
      try {
        const ep = JSON.parse(fs.readFileSync(epJsonPath, 'utf-8'));
        figureId = ep.figureId;
        angleKey = ep.angleKey;
      } catch {}
    }
    
    // 如果 episode.json 不完整，从 slug 推断
    if (!figureId) {
      figureId = slug.split('-').slice(0, -1).join('-');  // 假设格式: figureId-angleKey
    }
    if (!angleKey) {
      angleKey = slug.split('-').pop();
    }
    
    // 只有已完成/已发布的才算数
    if (fs.existsSync(epJsonPath)) {
      try {
        const ep = JSON.parse(fs.readFileSync(epJsonPath, 'utf-8'));
        const isDone = ep.gateStatus === 'passed' || ep.status === 'published' || ep.status === 'completed';
        if (!isDone) continue;
      } catch { continue; }
    }
    
    if (!DONE_ANGLES.has(figureId)) DONE_ANGLES.set(figureId, new Set());
    DONE_ANGLES.get(figureId).add(angleKey);
  }
}

// 也加载 JSON 里的 _dedupRegistry 里手动标记的
if (figureData._dedupRegistry) {
  for (const [figId, angles] of Object.entries(figureData._dedupRegistry)) {
    if (figId.startsWith('_')) continue;
    if (!DONE_ANGLES.has(figId)) DONE_ANGLES.set(figId, new Set());
    for (const a of angles) DONE_ANGLES.get(figId).add(a.angleKey);
  }
}

const totalDoneAngles = [...DONE_ANGLES.values()].reduce((s, set) => s + set.size, 0);
console.log(`   ✅ 去重: episodes/ 已完成 ${DONE_ANGLES.size} 个人物的 ${totalDoneAngles} 个角度`);

// === 3. 展平 + 评分 ===
// 6 个维度（观众视角）：
//   search_volume:        有多少人主动搜这个话题（冷启动核心流量来源）
//   competition_density:  已经有多少人专门做过这个角度（红海=必死）
//   angle_appeal:         钩子能不能让观众点（代价/悬念/悲剧关键词）
//   accessibility:        需不需要背景铺垫（3 秒看不懂就划走）
//   source_ready:         史料够不够撑 15 分钟（执行可行性）
//   risk_free:            会不会触发 YouTube 年龄限制（age-restricted 算法不推）

function tierToSearchVolume(tier, searchDemandDesc) {
  const base = { S: 5, A: 4, B: 3, C: 2 }[tier] || 2;
  if (searchDemandDesc) {
    if (/稳定|高|stable|high|Top/.test(searchDemandDesc)) return Math.min(5, base + 0.5);
    if (/低|low|极低/.test(searchDemandDesc)) return Math.max(1, base - 1);
  }
  return base;
}

// === 合并维度 1：competition_density + angle_differentiator → unique_positioning ===
// 不再相信 JSON 硬标 unique。真蓝海 vs 自封蓝海：
//   信号 1：badAngles 里说什么烂大街（generic biography 烂大街 → safeAngles 是真 unique）
//   信号 2：figure 级 youtubeTopViews 数量（越多 = 红海越重）
//   信号 3：safeAngle 的 competitionHint（保留但降级为 hint，不是定论）
// 5 分 = 真蓝海（badAngles 明确 generic 烂大街 + figure 级视频少）
// 3 分 = 自封蓝海（JSON 标 unique 但 figure 级视频多，badAngles 没证据）
// 1 分 = 红海（figure 级视频多 + badAngles 没有差异化证据）
function computeUniquePositioning(fig, angle) {
  let score = 3; // 默认自封蓝海
  
  const hasGenericBad = fig.badAngles?.some(b => /生平|传记|biography|introduction|overview|timeline/.test(b.toLowerCase()));
  const hasUniqueBad = fig.badAngles?.some(b => /独特|零|无|unique|never|zero|none/.test(b.toLowerCase()));
  const existingVideos = fig.evidence?.youtubeTopViews?.length || 0;
  
  // 强证据：badAngles 明确说 generic 烂大街 → safeAngles 是真 unique
  if (hasGenericBad) score += 1.5;
  // 强证据：figure 级零现有视频
  if (existingVideos === 0) score += 1;
  // figure 级视频少（≤2）→ 蓝海可能性高
  else if (existingVideos <= 2) score += 0.5;
  // figure 级视频多（≥4）→ 红海信号
  else if (existingVideos >= 4) score -= 1;
  
  // 有 "unique_angle_evidence" 明确声明零专门视频 → 强力加分
  if (hasUniqueBad) score += 0.5;
  
  return Math.max(1, Math.min(5, Math.round(score)));
}

// === 合并维度 2：angle_appeal → hook_strength（更严格）===
// 不是所有问号都算强钩子。信号要"让观众停下来"：
// 5 分 = 让你停下来的钩子：有问号 + 有数字 + 短（10-18 词）
// 4 分 = 还可以的钩子：有问号或有数字 + 短
// 3 分 = 普通钩子：只有问句结构或陈述句
// 1 分 = 差钩子：太长/没有问句/纯描述
function computeHookStrength(enHook) {
  const hook = (enHook || '').trim();
  const lower = hook.toLowerCase();
  let score = 2; // 基底 2 不是 3 — 让它能降到 1-2 分，不再全员 4-5
  
  const words = hook.split(' ').length;
  const hasQuestion = hook.includes('?');
  const hasNumber = /\d+/.test(hook);
  const hasContrast = / vs |versus|but|however|while|different/.test(lower);
  const startsWell = /^(what|how|why|did|has|can|which|who|where|when) /i.test(hook);
  
  // 核心：短钩子 + 有问号 = 观众能在 0.5 秒内决定
  if (hasQuestion && words >= 8 && words <= 18) score += 1.5; // 短问句 = 最佳
  else if (hasQuestion) score += 0.5;                        // 有问号但太长/太短
  
  // 数字加分：具体数字让观众预期内容
  if (hasNumber) score += 0.5;
  
  // 对比加分：X vs Y / Why A but B → 自带悬念
  if (hasContrast) score += 0.5;
  
  // 开头加分：what/how/why 开头 → 好奇
  if (startsWell) score += 0.5;
  
  // 长度惩罚：太长（>22 词）= 不是钩子是半句话
  if (words > 22) score -= 1;
  if (words < 5) score -= 0.5;
  
  // 无问号也无数字 = 纯描述 → 降分
  if (!hasQuestion && !hasNumber) score -= 0.5;
  
  return Math.max(1, Math.min(5, Math.round(score)));
}

// === accessibility：观众能不能在不知道背景的情况下理解钩子？===
// 核心判断：钩子里有多少个需要观众认知的英文专有名词（人名/地名/朝代名）
// 1 个 = 门槛友好（China, Confucius, Alexander）
// 2+ 个 = 门槛高（Mao + Confucius, Wu Zetian + Tang Dynasty）
// 0 个 = 最友好（"one emperor", "a rebel", "one monk" — 用泛指）
function computeAccessibility(zhAngle, angleKey, enHook) {
  const hook = enHook || '';
  
  // 5 分 = 完全自包含：钩子不依赖任何背景知识
  //   "Why did one emperor bury 8,000 soldiers with him?" → 0 个专有名词
  //   "1/3 of China's population died. How did one rebel end a golden age?" → 仅 China（universal）
  
  let score = 4; // 默认较高
  
  // === 核心信号：专有名词数量 ===
  // 思路：把钩子按句号拆成句子，每句开头的功能词（Why/How/What...）跳过
  // 剩下的首字母大写且不在 UNIVERSAL 列表的 = 需要观众认知的专有名词
  const SENTENCE_STARTERS = /^(Why|How|What|Did|Does|Has|Have|Is|Are|Was|Were|Can|Could|His|Her|He|She|They|It|This|That|One|The|A|An|Which|Who|Whom|When|Where|Because|But|However|While|If|Then|So)$/i;
  const UNIVERSAL_SET = new Set(['china','chinese','asia','rome','roman','greek','egypt','persian','mongol','europe','european','america','alexander','genghis','khan','great wall','yellow river','silk road','buddhist','christian','muslim','emperor','empire','dynasty']);
  
  const properNouns = [];
  // 按句号拆句，逐句分析
  const sentences = hook.split(/[.!?]\s+/);
  for (const sent of sentences) {
    const tokens = sent.trim().split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i].replace(/[^a-zA-Z]/g, '');
      if (!t || t.length < 2) continue;
      const isCapitalized = t[0] === t[0].toUpperCase() && t[0] !== t[0].toLowerCase();
      // 跳过句首功能词
      const isSentenceStart = i === 0 && SENTENCE_STARTERS.test(t);
      if (isCapitalized && !isSentenceStart) {
        properNouns.push(t);
      }
    }
  }
  const hardProperNouns = properNouns.filter(n => !UNIVERSAL_SET.has(n.toLowerCase()));
  
  if (hardProperNouns.length === 0) {
    score += 1;   // 0 个专有名词 → 完全自包含
  } else if (hardProperNouns.length === 1) {
    // 1 个专有名词 → 门槛友好，微调
    score += 0;
  } else if (hardProperNouns.length === 2) {
    score -= 1;   // 2 个专有名词 → 门槛偏高
  } else {
    score -= 2;   // 3+ 个 → 几乎不可能看懂
  }
  
  // === 辅助信号 ===
  // 信号 A：钩子里有对比或因果关系 → 观众能脑补故事结构
  if (hook.includes('.') || hook.includes('but') || hook.includes('how did') || hook.includes('why did')) {
    score += 0.5;
  }
  
  // 信号 B：钩子提到了数字 → 具体 = 好理解
  if (/\d+/.test(hook)) score += 0.5;
  
  // 信号 C：钩子太短（<5 词）→ 没背景就看不懂
  const words = hook.split(' ').length;
  if (words < 6) score -= 0.5;
  
  return Math.max(1, Math.min(5, Math.round(score)));
}

function computeRiskFree(riskLevel, angleKey, zhAngle) {
  let score = 6 - riskLevel;
  const riskWords = /凌迟|酷刑|屠杀|斩首|massacre|torture|beheaded|genocide|鸦片战争|Opium/i;
  if (riskWords.test(zhAngle || '') || riskWords.test(angleKey || '')) score = Math.max(1, score - 1);
  return Math.round(score);
}

// === 深度因子：这个角度是"有深度的历史思考"还是"猎奇快消"？===
// 深度钩子 = 观众看完会想 "哦原来可以这么看历史"
// 猎奇钩子 = 观众看完会想 "哇好惨/好酷"，然后划走
// 5 分 = 深度优先（why/cost/consequence/impact/what if）
// 3 分 = 混合（有猎奇成分也有思考成分）
// 1 分 = 纯猎奇（killed/buried/tortured/massacre — 吸引眼球但无深度）
function computeDepthFactor(enHook, zhAngle, angleKey) {
  const hook = (enHook || '').toLowerCase();
  const zh = (zhAngle || '');
  
  let score = 3; // 默认中等
  
  // === 深度关键词（有思考空间） ===
  const DEPTH_WORDS = [
    'why', 'what if', 'how did', 'consequence', 'impact', 'legacy', 'cost of',
    'price of', 'meaning', 'significance', 'why did', 'how did',
    'ended', 'vanish', 'vanished', 'collapse', 'collapsed', 'destroyed',
    'fail', 'failed', 'failure', 'lose', 'lost', 'loss',
    'betrayal', 'betrayed', 'secret', 'mystery', 'truth',
    'actually', 'really', 'power', 'corruption', 'ambition',
    'revolution', 'reform', 'change', 'choice', 'decision',
    'not to die', 'trying not', 'what did', 'what if'
  ];
  // === 猎奇关键词（低质量快消：暴力/杀戮/酷刑的主动行为） ===
  // 注意：die/died/death 不算（太通用，"40 million deaths — why?" 也是深度钩子）
  const SENSATIONAL_WORDS = [
    'bury', 'buried', 'buried alive', 'execute', 'executed',
    'kill', 'killed', 'murder', 'murdered',
    'torture', 'tortured', 'massacre', 'massacred', 'genocide',
    'behead', 'beheaded', 'crucify', 'crucified', 'slaughter',
    'starve', 'starved', 'hang', 'hanged', 'blood', 'bloody',
    'live burial', '活体', '活埋'
  ];
  
  const depthHits = DEPTH_WORDS.filter(w => hook.includes(w)).length;
  const sensationalHits = SENSATIONAL_WORDS.filter(w => hook.includes(w)).length;
  
  // 中文辅助：zhAngle 里的深度词 vs 猎奇词
  const zhDepth = /代价|之谜|悲剧|为什么|真相|失败|影响|意义|后果|隐藏/.test(zh);
  const zhSensational = /死|杀|屠|凌迟|酷刑|活埋|斩首/.test(zh);
  
  if (depthHits >= 2 && sensationalHits === 0) score = 5;
  else if (depthHits >= 1 && sensationalHits === 0) score = 4.5;
  else if (depthHits >= 1 && sensationalHits >= 1) score = 3;  // 混合
  else if (depthHits === 0 && sensationalHits >= 1) score = 1.5;
  else score = 3;
  
  // 中文辅助调整
  if (zhDepth && !zhSensational) score = Math.min(5, score + 0.5);
  else if (zhSensational && !zhDepth) score = Math.max(1, score - 0.5);
  
  return Math.round(score);
}

// === channel_fit：这个选题天然契合"权力的代价"叙事框架吗？===
// MOD_A 会话专门指出的缺失维度——频道核心是 "what they lost to get there"
// 5 分 = 钩子直接有代价/失去/悲剧结构词（lost/castrated/recalled from victory but killed）
// 3 分 = 有代价暗示但钩子没直接说（failed/vanished/collapsed）
// 1 分 = 纯事实/统计钩子，没有代价叙事空间（How many soldiers, When did it start）
function computeChannelFit(enHook, zhAngle) {
  const hook = (enHook || '').toLowerCase();
  const zh = (zhAngle || '');
  
  // 频道核心：代价/失去/悲剧/意外结局
  const COST_WORDS = [
    'lost', 'lose', 'loss', 'sacrifice', 'cost of', 'price of',
    'castrated', 'recalled', 'betrayed', 'betrayal', 'exile', 'exiled',
    'imprisoned', 'executed', 'purged', 'suicide', 'starved', 'murdered',
    'tragedy', 'tragic', 'disaster', 'collapse', 'collapsed', 'destroyed',
    'failed', 'failure', 'fool', 'underdog', 'against all odds',
    'became', 'ended', 'vanished', 'vanished', 'fell apart'
  ];
  
  // 钩子有对比/意外结构（"He did A. But B." / "X ruled for Y years. Why Z?"）
  const CONTRAST_WORDS = ['. but ', '. yet ', '. however ', ', but ',
    'why did ', 'why was ', 'how did ', 'what did '];
  
  const costHits = COST_WORDS.filter(w => hook.includes(w)).length;
  const contrastHits = CONTRAST_WORDS.filter(w => hook.includes(w)).length;
  
  const zhCost = /代价|失去|悲剧|失败|冤案|流放|被迫|却|意外/.test(zh);
  
  let score = 3; // 默认：有基础叙事空间
  
  if (costHits >= 2) score = 5;      // 直接带代价叙事词
  else if (costHits >= 1 && contrastHits >= 1) score = 4.5; // 代价词+对比结构
  else if (costHits >= 1) score = 4; // 有代价词
  else if (contrastHits >= 1) score = 3.5; // 只有对比结构
  
  // 中文辅助
  if (zhCost && costHits === 0) score = Math.min(4, score + 0.5);
  
  return Math.round(score);
}

// === 合规硬筛（前置，违反 V2/V7 边界的角度直接过滤）===
// 不是打分，是 return null → 不进 CANDIDATES
// 筛选条件（任何一个命中就过滤）：
//   1. 含当代政治词（Xi/CCP/Taiwan/Hong Kong/Xinjiang/Tibet/Tiananmen）
//   2. 含极端暴力猎奇词（buried alive/tortured alive/massacre 且是钩子核心）
function complianceGate(fig, angle) {
  const text = `${angle.enHook} ${angle.zhAngle} ${angle.angleKey} ${fig.zhName}`.toLowerCase();
  
  // V7 边界：当代政治人物/地名（PRD §20 硬禁止）
  const V7_POLITICAL = /\b(xi|ccp|taiwan|hong.?kong|xinjiang|tibet|tiananmen|mao zedong|deng xiaoping|jiang zemin|hu jintao|xi jinping)\b/i;
  if (V7_POLITICAL.test(text)) {
    return { pass: false, reason: 'V7 边界：含当代政治人物/地名', blockedBy: 'V7_POLITICAL' };
  }
  
  // V2 边界：极端暴力猎奇（"活埋/屠杀/酷刑" 作为钩子核心卖点）
  // 注意："40 million deaths" 作为统计数字是可以的，但 "buried alive alive! inside!" 不行
  const SENSATIONAL_VIOLENCE = /buried alive|tortured alive|massacre of|genocide of|beheaded|crucified|slaughtered|活埋|大屠杀|集体屠杀/i;
  const violenceHits = (text.match(SENSATIONAL_VIOLENCE) || []).length;
  if (violenceHits >= 1 && fig.riskLevel >= 3) {
    return { pass: false, reason: 'V2 边界：极端暴力猎奇钩子', blockedBy: 'V2_VIOLENCE' };
  }
  
  return { pass: true };
}

// === angle_differentiator：这个视角够不够独特？（跟 appeal 信号完全分离）===
// 核心信号：competitionHint（有没有人做过这个角度）
// 辅助信号：badAngles 有没有说 generic 角度烂大街 → 暗示独特角度是蓝海
// 不扫 why/cost/mystery（那是 appeal 的事）
// === 展平所有候选（5 维评分 + 2 个 gate）===
const CANDIDATES = [];
const BLOCKED = []; // 被合规硬筛掉的角度（用于报告展示）
for (const fig of FIGURES) {
  const doneAngles = DONE_ANGLES.get(fig.figureId) || new Set();
  
  for (const angle of fig.safeAngles) {
    if (doneAngles.has(angle.angleKey)) continue;
    
    // === Gate 1：合规硬筛 ===
    const gate = complianceGate(fig, angle);
    if (!gate.pass) {
      BLOCKED.push({ fig, angle, gate });
      continue;
    }
    
    // === Gate 2：史料硬筛（source_ready < 4 直接不进候选）===
    // MOD_B 审计建议：sr ≥ 4 做硬门槛，史料不够不该被高分赎买
    if (fig.sourceAvailability < 4) {
      BLOCKED.push({ fig, angle, gate: { pass: false, reason: `史料不足（source_ready=${fig.sourceAvailability}，需要 ≥4）` } });
      continue;
    }
    
    // === Gate 3：饱和度 gate（unique_positioning ≤ 2 = 太饱和，不进候选）===
    // 三路共识：unique_positioning 当前测量还有问题，但先做 gate 兜底
    const positioning = computeUniquePositioning(fig, angle);
    if (positioning <= 2) {
      BLOCKED.push({ fig, angle, gate: { pass: false, reason: `饱和度太高（unique_positioning=${positioning}，蓝海信号弱）` } });
      continue;
    }
    
    // === Gate 4：风险硬筛（rf < 3 = 风险过高，直接 block）===
    // MOD_B 审计建议：rf ≥ 3 做硬门槛，安全不该被高分赎买
    const rf = computeRiskFree(fig.riskLevel, angle.angleKey, angle.zhAngle);
    if (rf < 3) {
      BLOCKED.push({ fig, angle, gate: { pass: false, reason: `风险过高（risk_free=${rf}，需要 ≥3）` } });
      continue;
    }
    
    // === 5 维真实评分（观众视角，三路审计后的最终版）===
    const search_volume = tierToSearchVolume(fig.westernNotabilityTier, fig.evidence?.searchDemand);
    const hook_strength = computeHookStrength(angle.enHook);
    const depth_factor = computeDepthFactor(angle.enHook, angle.zhAngle, angle.angleKey);
    const channel_fit = computeChannelFit(angle.enHook, angle.zhAngle);
    const accessibility = computeAccessibility(angle.zhAngle, angle.angleKey, angle.enHook);
    
    CANDIDATES.push({
      figureId: fig.figureId,
      zhFigure: fig.zhName,
      enFigure: fig.enName,
      zhAngle: angle.zhAngle,
      angleKey: angle.angleKey,
      enHook: angle.enHook,
      timePeriod: fig.timePeriod,
      tier: fig.westernNotabilityTier,
      
      scores: {
        search_volume,       // 名字认知度（冷启动靠搜索，但是 tier 代理）
        hook_strength,       // 钩子能不能让观众停下来（基底已降到 2）
        depth_factor,        // 深度 vs 猎奇（唯一区分度最好的维度）
        channel_fit,         // 契合"权力的代价"叙事框架吗？（MOD_A 专门指出的缺失）
        accessibility,       // 需要背景铺垫吗？
      },
      
      evidence: fig.evidence,
      riskLevel: fig.riskLevel,
      sourceAvailability: fig.sourceAvailability,
      _gates: { positioning, rf }, // gate 结果保留用于报告
    });
  }
}

// === 4. 计算综合得分（观众视角权重） ===
// 先算 raw 分（每个候选项的原始加权总分），再用实际候选项的 min/max 归一化
// 这样不管维度值怎么变化（比如全部 unique），永远有区分度
function computeRawScore(c) {
  const s = c.scores;
  const isCold = stage === 'prelaunch';
  
  // 5 维权重（三路审计后的最终版）：
  // depth_factor: MOD_B 审计发现这是唯一区分度好的维度（sd=0.94），直接对应 AVD/留存结构
  // channel_fit: 新增维度，MOD_A 专门指出频道核心"代价叙事"没被量化
  // search_volume: 冷启动靠搜索，但 MOD_B 指出它是 tier 代理（S 级被双重加分）
  // hook_strength: MOD_B 说公式只有两档，先修权重保持概念重要性
  // accessibility: 区分力弱，降权
  // unique_positioning: 已转 gate（≤2 block），不加权
  const weights = isCold ? {
    depth_factor: 3.0,         // 最高权重：唯一区分度好 + 深度 > 猎奇
    channel_fit: 2.5,         // 新：代价叙事契合度（频道核心框架）
    search_volume: 2.0,        // 冷启动靠搜索，但承认是 tier 代理
    hook_strength: 2.0,        // 概念重要，公式待修（基底已降到 2）
    accessibility: 1.5,        // 区分力弱，降权
  } : {
    depth_factor: 2.5,
    channel_fit: 2.5,
    search_volume: 2.5,
    hook_strength: 2.5,
    accessibility: 2.0,
  };
  
  let raw = 0;
  for (const [k, w] of Object.entries(weights)) {
    raw += s[k] * w;
  }
  return raw;
}

// === 算 raw 分 → 归一化到 0-97（永远不出现完美分）===
// 理论 max=55（全 5 分），但哲学上没有完美选题，所以把天花板设成 56（+1 分 buffer）
// 这样即使某个选题碰巧全 5 分，归一化后也只有 97 分，永远有上升空间
const THEORETICAL_MAX = 56; // 55 + 1 buffer（没有完美选题）
const THEORETICAL_MIN = 11;  // 全 1 分
const THEORETICAL_RANGE = THEORETICAL_MAX - THEORETICAL_MIN;

CANDIDATES.forEach(c => c.raw_score = computeRawScore(c));
CANDIDATES.forEach(c => {
  c.overall_score = Math.round(Math.min(97, ((c.raw_score - THEORETICAL_MIN) / THEORETICAL_RANGE) * 100));
});
const sorted = [...CANDIDATES].sort((a, b) => b.overall_score - a.overall_score);
const selected = sorted.slice(0, count);

// === 生成报告 ===
const now = new Date().toISOString().slice(0, 10);
let report = `# 选题发现报告（Topic Discovery）
> generatedAt: ${now}
> stage: ${stage}
> figureList: assets/western-audience-figure-list.json （${FIGURES.length} 个人物）
> dedup: 扫描 episodes/ + _dedupRegistry 已排除 ${totalDoneAngles} 个已完成角度

---

## 🏆 TOP ${selected.length} 推荐（按综合得分排序）

`;

if (selected.length === 0) {
  report += `**❌ 无可用候选！** 清单里所有人物的所有角度都已做过，或者清单本身需要扩充。\n`;
}

selected.forEach((c, i) => {
  report += `### ${i + 1}. **${c.zhFigure} — ${c.zhAngle}**
> \`figureId: ${c.figureId}\` · \`angleKey: ${c.angleKey}\` · \`${c.tier} 级\` · ${c.timePeriod}
**综合得分**: ${c.overall_score}/100

| 维度 | 权重 | 评分 | 为什么 |
|---|---|---|---|
| 🔍 搜索量 search_volume | ×2.5 | ${c.scores.search_volume}/5 | ${c.tier} 级 tier → ${c.scores.search_volume === 5 ? '高搜索量' : c.scores.search_volume >= 4 ? '稳定搜索' : '较低'} |
| 🔴 竞品 competition ↓ | ×-4 | ${c.scores.competition_density}/5 | ${c.scores.competition_density <= 2 ? '蓝海（1-2 个现有视频）' : c.scores.competition_density <= 3 ? '中等' : '红海'} |
| 🪝 钩子 appeal | ×2.5 | ${c.scores.angle_appeal}/5 | ${c.scores.angle_appeal >= 4 ? '强钩子（代价/悬念词命中）' : c.scores.angle_appeal >= 3 ? '中钩子' : '弱钩子'} |
| ⭐ **差异化 differentiator** | **×3** | **${c.scores.angle_differentiator}/5** | ${c.scores.angle_differentiator >= 4 ? '独特角度（新频道差异化机会）' : c.scores.angle_differentiator <= 2 ? '烂大街角度（慎做）' : '常规但有价值'} |
| 📖 可读性 access. | ×2 | ${c.scores.accessibility}/5 | ${c.scores.accessibility >= 4 ? '自包含故事，3 秒能懂' : c.scores.accessibility >= 3 ? '需要一点背景' : '需要大量铺垫'} |
| 📚 史料 ready | ×1.5 | ${c.scores.source_ready}/5 | figure.sourceAvailability=${c.sourceAvailability} |
| 🛡️ 安全 risk_free | ×2 | ${c.scores.risk_free}/5 | ${c.scores.risk_free >= 4 ? '安全，无年龄限制风险' : c.scores.risk_free >= 3 ? '需注意暴力/政治词' : '有风险，需 Gate 3 审查'} |

**英文钩子（Hook）**: "${c.enHook}"

**现有英文视频证据**:
${c.evidence.youtubeTopViews?.map(v => '- ' + v).join('\n') ?? '- 无数据'}

**英文维基质量**: ${c.evidence.wikiQuality ?? '- 无数据'}

---

`;
});

report += `## 📊 候选池全景

| # | 人物 | 角度 | 等级 | 得分 | 淘汰理由 |
|---|---|---|---|---|---|
${sorted.map((c, i) => `| ${i+1} | ${c.zhFigure} | ${c.zhAngle} | ${c.tier} | ${c.overall_score} | ${i < count ? '✅ 入选' : '得分较低/候选过多'} |`).join('\n')}

${DONE_ANGLES.size > 0 ? `
## 🗑️ 去重排除

以下 figureId + angleKey 已在 episodes/ 或 _dedupRegistry 里标记为完成，自动排除：

${[...DONE_ANGLES.entries()].map(([figId, angles]) => `- **${figId}**: ${[...angles].join(', ')}`).join('\n')}
` : ''}

---

## 🎯 推荐行动

**第 1 条视频（推荐）**: ${selected[0] ? `${selected[0].zhFigure} — ${selected[0].zhAngle}` : 'N/A'}
- figureId: \`${selected[0]?.figureId}\`
- angleKey: \`${selected[0]?.angleKey}\`
- 下一步: \`node scripts/preflight.mjs --figure ${selected[0]?.zhFigure} --angleKey ${selected[0]?.angleKey} --stage ${stage}\`
- 然后 Gate 1 人类裁决

**备选**: ${selected[1] ? `${selected[1].zhFigure}（${selected[1].overall_score}分）` : 'N/A'} / ${selected[2] ? `${selected[2].zhFigure}（${selected[2].overall_score}分）` : 'N/A'}

## 📝 完成后记得

每条视频 Gate 3 通过后，在 \`episodes/<slug>/episode.json\` 写入：
\`\`\`json
{
  "figureId": "${selected[0]?.figureId}",
  "angleKey": "${selected[0]?.angleKey}",
  "gateStatus": "passed"
}
\`\`\`
下次 topic-discovery 会自动读取去重。

## ⚠️ 数据说明

本报告数据来源：
1. ✅ assets/western-audience-figure-list.json 里的 tier（S/A/B/C）+ evidence 字段
2. ✅ episodes/ 目录 + _dedupRegistry 去重（基于 gateStatus/status 字段）
3. ⚠️ competition_density 评分基于 badAngles 推断（"生平传记"被标记为竞品多时，独特角度自动降低）
4. ⚠️ narrative_tension 统一给 4（safeAngles 已预筛）
5. ⚠️ 归一化公式权重按 stage 区分（prelaunch 零竞品优先）
`;

// === 保存 ===
const epDir = path.join(ROOT, 'episodes', '_topic-discovery');
fs.mkdirSync(epDir, { recursive: true });
const reportPath = path.join(epDir, `discovery-${now}.md`);
fs.writeFileSync(reportPath, report, 'utf-8');

console.log(`\n✅ 选题发现报告 → ${reportPath}`);
console.log(`\n🏆 TOP ${selected.length} 推荐:`);
selected.forEach((c, i) => {
  console.log(`   ${i + 1}. [${c.overall_score}分][${c.tier}] ${c.zhFigure} — ${c.zhAngle.slice(0, 30)}...`);
  console.log(`      en: "${c.enHook.slice(0, 70)}..."`);
});
console.log(`\n💡 下一步：选定一条 → 跑 preflight.mjs 深度调研 → Gate 1`);
console.log(`   或者告诉我你不感兴趣，我再加更多候选（霍去病、李清照、岳飞、乾隆...）`);
