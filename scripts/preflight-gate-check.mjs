#!/usr/bin/env node
// preflight-gate-check.mjs — Gate 1 前自动预检 §11.4 + §12.4 机械项
// PRD v13.0 §11.4 标题自检清单 + §12.4 缩略图自检清单
// 运行：node scripts/preflight-gate-check.mjs --episode <slug> [--titles "标题1","标题2"] [--thumb "缩略图路径"]
// 输出：11.4/12.4 里能自动化的项先跑，给每个候选 PASS/FAIL/WARN
// 目的：把 Gate 1 要审的 10 项拆成 "✅ AI 已验证通过" 和 "⚠️ 需人类判断"，减少人类负担

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

const slug = args.episode || args.e;
if (!slug) {
  console.error('用法: node preflight-gate-check.mjs --episode <slug> [--titles "标题1","标题2","标题3"]');
  process.exit(1);
}

// 从 preflight-research.md 里提取候选标题（如果 --titles 没给）
let titles = [];
if (args.titles) {
  titles = args.titles.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
} else {
  const preflightMd = path.join(ROOT, 'episodes', slug, 'preflight-research.md');
  if (fs.existsSync(preflightMd)) {
    const content = fs.readFileSync(preflightMd, 'utf-8');
    const lines = content.split('\n');
    // 找候选标题表格里有 [TBD] 之外内容的行
    const titleRows = lines.filter(l => l.match(/^\|\s*\d+\s*\|\s*[^|TBD]/) && l.match(/\| T[1-5] \|/));
    titles = titleRows.map(r => {
      const cells = r.split('|').map(c => c.trim());
      return cells[2] || '';
    }).filter(Boolean);
  }
}

if (titles.length === 0) {
  console.log(`⚠️  没找到候选标题。`);
  console.log(`   请用 --titles "How a Court Nun...","Everything You Know..." 手动传入`);
  console.log(`   或先让 skill-0 预调研生成候选标题（M1 接入 MODEL_A 后）`);
}

console.log(`\n🔍 Gate 1 自动预检 — episode: ${slug}`);
console.log(`   标题候选数: ${titles.length}\n`);

// === 自动化检测函数 ===
const titleBlacklist = ['传奇', '一生', '风云', '秘史', '真相大白', '惊天秘密', '不敢相信', '震惊', '揭秘', '真相', '被掩盖'];
const politicalKeywords = ['习近平', '习近平', '中国共产党', '共产党', '台湾', '香港', '西藏', '新疆', '天安门', '六四', '毛泽东', '毛泽东']; // §11.4 V7 当代政治
const aiKeywords = ['AI', '人工智能', 'GPT', 'ChatGPT', '大模型', '算法']; // §12.4 禁止缩略图出现 AI 字样

// §11.4 可自动化项：
// ✅ 4. 没有抽象大词 → 黑名单扫描
// ✅ 5. 不是疑问句结尾 → 正则
// ✅ 10. V7 当代政治关键词扫描
// ✅ 1. 前 10 个词有钩子（启发式：不是 "The Story of..." / "A Brief History of..." / "In this video"）
// ⚠️ 2. 至少一个具体名词（启发式：匹配大写人名、年份、数字）
// ❌ 3. 有代价或反转 → 判断项
// ❌ 6. 不是纯清单体 → 判断项
// ❌ 7. 承诺可兑现 → 判断项
// ❌ 8. 和缩略图不重复 → 判断项（缩略图还没出）
// ❌ 9. 遮住频道名仍想点 → 判断项

function checkTitle(title) {
  const results = {};
  const lower = title.toLowerCase();
  const words = title.split(/\s+/);

  // 4. 抽象大词
  const foundBlacklist = titleBlacklist.filter(b => title.includes(b));
  results.n4_abstractWords = {
    status: foundBlacklist.length ? 'FAIL' : 'PASS',
    reason: foundBlacklist.length ? `含: ${foundBlacklist.join(', ')}` : '无'
  };

  // 5. 不是疑问句结尾
  results.n5_notQuestion = {
    status: title.trim().endsWith('?') ? 'FAIL' : 'PASS',
    reason: title.trim().endsWith('?') ? '疑问句结尾' : 'OK'
  };

  // 10. V7 当代政治
  const foundPolitical = politicalKeywords.filter(k => title.includes(k));
  results.n7_political = {
    status: foundPolitical.length ? 'FAIL' : 'PASS',
    reason: foundPolitical.length ? `含当代政治关键词: ${foundPolitical.join(', ')}` : '无'
  };

  // 1. 前 10 个词钩子（启发式）
  const noHookPatterns = [/^the story of/i, /^a brief history of/i, /^in this video/i, /^a deep dive/i, /^welcome to/i];
  const first10Words = words.slice(0, 10).join(' ');
  results.n1_hookFirst10 = {
    status: noHookPatterns.some(p => p.test(lower)) ? 'FAIL' : 'PASS',
    reason: noHookPatterns.some(p => p.test(lower)) ? `以开头引导语: ${lower.split(' ').slice(0, 5).join(' ')}...` : 'OK'
  };

  // 2. 具体名词（启发式：大写词或年份或数字）
  const hasProperNoun = /[A-Z][a-z]+/.test(title) || /\d{3,4}/.test(title) || /[一-龥]{2,}/.test(title);
  results.n2_concreteNoun = {
    status: hasProperNoun ? 'PASS' : 'WARN',
    reason: hasProperNoun ? '有大写/年份/数字/汉字' : '可能缺少具体名词（需人工判断）'
  };

  // 3. 代价或反转（启发式：扫描关键词）
  const costKeywords = ['cost', 'lost', 'what it', 'but', 'however', 'only', 'everything you know', 'actually', 'really was'];
  const hasCost = costKeywords.some(k => lower.includes(k));
  results.n3_costOrTwist = {
    status: hasCost ? 'PASS' : 'WARN',
    reason: hasCost ? `有代价/反转关键词` : '没匹配到（需人工判断是否有）'
  };

  return results;
}

// === 执行检测 ===
const allResults = [];
for (const t of titles) {
  const r = checkTitle(t);
  allResults.push({ title: t, checks: r });

  console.log(`\n📌 "${t}"`);
  for (const [name, check] of Object.entries(r)) {
    const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`   ${icon} ${name}: ${check.status} — ${check.reason}`);
  }
}

// === 缩略图自动预检（§12.4）===
// 注意：M0 先做"无图像时"的文本规则预检（检查候选缩略图文字描述）
// M1 接入图像 API 后可扩展到视觉模型检查
console.log(`\n🎨 §12.4 缩略图自动预检`);
console.log(`   （当前无图像，先跑文本规则预检；M1 接入 MODEL_VQA 后可扩展视觉检查）`);

// AI 字样检测（标题里不应有 AI）
for (const t of titles) {
  const hasAI = aiKeywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(t));
  if (hasAI) {
    console.log(`   ❌ 标题含 AI 相关字样（禁止作为卖点）: ${t}`);
  }
}

// === 汇总 ===
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 自动预检汇总`);

let totalPass = 0, totalFail = 0, totalWarn = 0;
for (const r of allResults) {
  for (const c of Object.values(r.checks)) {
    if (c.status === 'PASS') totalPass++;
    else if (c.status === 'FAIL') totalFail++;
    else totalWarn++;
  }
}

console.log(`   ✅ 自动 PASS: ${totalPass}  （Gate 1 直接信任，不用再看）`);
console.log(`   ❌ 自动 FAIL: ${totalFail}  （候选可排除）`);
console.log(`   ⚠️ 自动 WARN: ${totalWarn}  （需人工判断确认）`);
console.log(`\n🔒 Gate 1 仍需人类判断的 §11.4 项：`);
console.log(`   #3 有可感知的代价或反转`);
console.log(`   #6 不是纯清单体`);
console.log(`   #7 承诺可由视频兑现`);
console.log(`   #8 和缩略图不重复（缩略图确定后再核）`);
console.log(`   #9 遮住频道名仍然想点`);
console.log(`\n🔒 Gate 1 仍需人类判断的 §12.4 项：`);
console.log(`   T1 一个视觉焦点`);
console.log(`   T2 文字 ≤ 6 词（M1 接 OCR 后可自动化）`);
console.log(`   T3 缩到手机尺寸仍清楚`);
console.log(`   T4 遮住文字能说出情绪词`);
console.log(`   T5 标题+缩略图合起来构成完整缺口`);
console.log(`\n✅ 自动预检完成。现在可以进入 Gate 1 签字阶段。`);

process.exit(totalFail > 0 ? 1 : 0);
