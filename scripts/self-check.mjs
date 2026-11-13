#!/usr/bin/env node
// self-check.mjs — 成片自动自检（A1—A37 + 审计修复项）
// PRD v13.0 §17.2 + 第三轮审计 FAIL-6/WARN-11/WARN-12
// 运行：node scripts/self-check.mjs --episode <slug>

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const epDir = slug => path.join(ROOT, 'episodes', slug);

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) =>
    a.startsWith('--') ? [a.slice(2), arr[i + 1]] : null
  ).filter(Boolean)
);
const slug = args.episode || args.e;
if (!slug) {
  console.error('用法: node self-check.mjs --episode <slug>');
  process.exit(1);
}

console.log(`🔍 成片自检 — episode: ${slug}\n`);

// === 加载审计黑名单（审计 FAIL-6 修复）===
const BLACKLIST_RESIDUE = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'assets', 'narrative-residue-blacklist.json'), 'utf-8'));
const BLACKLIST_CE = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'assets', 'chinese-english-interference-dictionary.json'), 'utf-8'));

// === AI 披露固定模板（RULES §10.1 + WARN-11 修复）===
const AI_DISCLOSURE_TEMPLATE = `🎓 History videos made by a human creator with AI assistance for research, visuals, and voiceover. All historical judgments, framing, and narrative structure are decided by the human creator before publication. Voiceover uses a commercial text-to-speech service with a custom voice profile.`;

// === 加载 episode 文件 ===
function readEpFile(slug, filename) {
  const f = path.join(epDir(slug), filename);
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf-8');
}

// 从 script.md 里提取英文正文（跳过 frontmatter 和章节标记）
function extractEnglishBody(mdContent) {
  if (!mdContent) return '';
  // 去掉 frontmatter（---...---）
  let body = mdContent.replace(/^---[\s\S]*?---/, '');
  // 去掉 markdown 标题标记，保留纯文本
  body = body.replace(/^#{1,6}\s+/gm, '');
  return body.toLowerCase();
}

// 简易 PASS/WARN/FAIL 框架
const checkResults = [];
function check(id, label, fn) {
  const result = fn();
  checkResults.push({ id, label, result });
  const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
  console.log(`  ${icon} ${id} ${label}: ${result.status}${result.reason ? ` (${result.reason})` : ''}`);
}

// === A1: source-ledger.json 存在 ===
check('A1', '脚本 claim 可追溯', () => {
  return fs.existsSync(path.join(epDir(slug), 'source-ledger.json'))
    ? { status: 'PASS' }
    : { status: 'FAIL', reason: 'source-ledger.json 不存在' };
});

// === A2: script.md 存在 + gateStatus ===
check('A2', 'script.md gateStatus', () => {
  const content = readEpFile(slug, 'script.md');
  if (!content) return { status: 'FAIL', reason: 'script.md 不存在' };
  if (content.includes('gateStatus: "passed"')) return { status: 'PASS' };
  return { status: 'FAIL', reason: 'gateStatus 未通过' };
});

// === 🆕 WARN-12: source-ledger.json gateStatus 覆盖 ===
check('A2b', 'source-ledger.json gateStatus', () => {
  const content = readEpFile(slug, 'source-ledger.json');
  if (!content) return { status: 'WARN', reason: 'source-ledger.json 不存在（skill-1 未跑）' };
  try {
    const j = JSON.parse(content);
    if (j.gateStatus === 'passed') return { status: 'PASS' };
    return { status: 'FAIL', reason: `gateStatus: ${j.gateStatus ?? '未定义'}` };
  } catch {
    return { status: 'FAIL', reason: 'JSON 解析失败' };
  }
});

// === 🆕 WARN-12: preflight-research.md gateStatus ===
check('A2c', 'preflight-research.md gateStatus', () => {
  const content = readEpFile(slug, 'preflight-research.md');
  if (!content) return { status: 'WARN', reason: 'preflight-research.md 不存在' };
  if (content.includes('gateStatus: "passed"')) return { status: 'PASS' };
  return { status: 'FAIL', reason: 'gateStatus 未通过' };
});

// === A16: 软字幕 ===
check('A16', '软字幕上传状态', () => {
  const srtDir = path.join(epDir(slug), 'subtitles');
  const srtFile = path.join(srtDir, 'voiceover.srt');
  if (fs.existsSync(srtFile)) return { status: 'PASS' };
  return { status: 'WARN', reason: 'voiceover.srt 不存在' };
});

// === 🆕 A17: AI 披露（RULES §10.1 精确模板匹配 + WARN-11 更新）===
check('A17', 'AI 披露模板', () => {
  const descPath = path.join(epDir(slug), 'youtube-description.txt');
  const mdPath = path.join(epDir(slug), 'script.md');

  let descContent = readEpFile(slug, 'youtube-description.txt') || '';
  if (!descContent) {
    // 降级：尝试从 script.md 提取简介字段
    const mdContent = readEpFile(slug, 'script.md') || '';
    const match = mdContent.match(/youtube_description[:\s]*```([\s\S]*?)```/);
    if (match) descContent = match[1].trim();
  }
  if (!descContent) {
    return { status: 'WARN', reason: 'youtube-description.txt 不存在，跳过 AI 披露检查' };
  }

  if (descContent.includes(AI_DISCLOSURE_TEMPLATE)) return { status: 'PASS' };
  // 降级：至少有核心声明（不含 WARN-11 新增的 voiceover 句）
  const corePhrase = 'History videos made by a human creator with AI assistance for research, visuals, and voiceover';
  if (descContent.includes(corePhrase)) {
    return { status: 'WARN', reason: '核心声明存在但缺少 voiceover 说明（RULES §10.1 完整模板）' };
  }
  return { status: 'FAIL', reason: '简介开头缺少 AI 披露声明' };
});

// === 🆕 FAIL-6: A21 叙事逻辑残留（接入 narrative-residue-blacklist.json）===
check('A21', '叙事逻辑残留密度', () => {
  const content = readEpFile(slug, 'script.md');
  const body = extractEnglishBody(content);
  if (!body) return { status: 'WARN', reason: 'script.md 无英文正文' };

  const threshold = BLACKLIST_RESIDUE._threshold['每1000词出现次数'];
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const per1k = wordCount > 0 ? 1000 : 0;

  let totalMatches = 0;
  const details = [];
  for (const entry of BLACKLIST_RESIDUE.entries) {
    for (const phrase of entry.blacklist_en) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = body.match(re);
      if (matches && matches.length > 0) {
        // 简化：每匹配一次算一次残留（不做 safe_context 判断——M2 接 MODEL_B 语义理解时完善）
        totalMatches += matches.length;
        details.push(`${entry.id}(${entry.framework}): "${phrase}" × ${matches.length}`);
      }
    }
  }

  const density = wordCount > 0 ? (totalMatches / wordCount) * 1000 : 0;

  let status;
  if (density >= threshold.FAIL) status = 'FAIL';
  else if (density >= threshold.WARN) status = 'WARN';
  else status = 'PASS';

  const reason = details.length > 0
    ? `密度 ${density.toFixed(1)}/1000词, 命中 ${totalMatches} 处 (${details.slice(0, 3).join('; ')}${details.length > 3 ? '...' : ''})`
    : `密度 ${density.toFixed(1)}/1000词 (阈值: WARN=${threshold.WARN}, FAIL=${threshold.FAIL})`;

  return { status, reason };
});

// === 🆕 FAIL-6: A26 中式英语陷阱（接入 chinese-english-interference-dictionary.json）===
check('A26', '中式英语陷阱扫描', () => {
  const content = readEpFile(slug, 'script.md');
  const body = extractEnglishBody(content);
  if (!body) return { status: 'WARN', reason: 'script.md 无英文正文' };

  const priorityTraps = BLACKLIST_CE.scan_priority || [];
  const details = [];
  for (const trap of BLACKLIST_CE.traps) {
    if (trap.id === 'C5') continue; // C5 句长是本地脚本 readability.mjs 已处理
    if (trap.id === 'C8') continue; // C8 专有名词覆盖由 A26b 单独检查
    for (const wp of (trap.wrong_patterns || [])) {
      const wrongPhrase = wp.wrong.toLowerCase();
      if (body.includes(wrongPhrase)) {
        const isPriority = priorityTraps.includes(trap.id);
        details.push({
          id: trap.id,
          priority: isPriority,
          wrong: wp.wrong,
          right: wp.right,
          note: wp.note || ''
        });
      }
    }
  }

  const reason = details.length > 0
    ? `发现 ${details.length} 处 (${details.map(d => `${d.id}: ${d.wrong}→${d.right}`).slice(0, 4).join('; ')})`
    : '未匹配到常见中式英语陷阱';

  const priorityCount = details.filter(d => d.priority).length;
  let status;
  if (priorityCount >= 2) status = 'FAIL';
  else if (priorityCount >= 1 || details.length >= 3) status = 'WARN';
  else status = 'PASS';

  return { status, reason };
});

// === A33: 前 3 秒钩子兑现（占位）===
check('A33', '前 3 秒钩子兑现', () => {
  const content = readEpFile(slug, 'script.md');
  if (!content) return { status: 'FAIL', reason: 'script.md 不存在' };
  return { status: 'WARN', reason: '需音频转写比对（M2 完善）' };
});

// === A37: 结尾无总结信号 ===
check('A37', '结尾无总结信号', () => {
  const content = readEpFile(slug, 'script.md');
  if (!content) return { status: 'FAIL', reason: 'script.md 不存在' };
  const endSection = content.split('\n').slice(-30).join('\n').toLowerCase();
  const conclusionWords = ['in conclusion', 'to summarize', 'in summary', 'to wrap up', 'let us recap', 'so to speak'];
  const found = conclusionWords.filter(w => endSection.includes(w));
  if (found.length > 0) return { status: 'FAIL', reason: `结尾出现总结词: ${found.join(', ')}` };
  return { status: 'PASS' };
});

// === 汇总 ===
const nP = checkResults.filter(r => r.result.status === 'PASS').length;
const nF = checkResults.filter(r => r.result.status === 'FAIL').length;
const nW = checkResults.filter(r => r.result.status === 'WARN').length;

console.log(`\n${'='.repeat(50)}`);
console.log(`📊 自检汇总: ${nP} PASS / ${nW} WARN / ${nF} FAIL`);
console.log(`\n🆕 审计修复项已接入:`);
console.log(`   - A21 叙事残留: 引用 narrative-residue-blacklist.json (10个框架)`);
console.log(`   - A26 中式英语: 引用 chinese-english-interference-dictionary.json (10个陷阱)`);
console.log(`   - A17 AI 披露: RULES §10.1 精确模板匹配`);
console.log(`   - A2b/A2c: source-ledger + preflight gateStatus 覆盖`);
console.log(`\n⚠️  M0 骨架限制：`);
console.log(`   - A21 safe_context 判断需 MODEL_B 语义理解（M2 完善）`);
console.log(`   - A33 钩子兑现需音频转写（M2 完善）`);

process.exit(nF > 0 ? 1 : 0);
