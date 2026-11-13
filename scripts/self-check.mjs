#!/usr/bin/env node
// self-check.mjs — 成片自动自检（A1—A37）
// PRD v13.0 §17.2
// 运行：node scripts/self-check.mjs --episode <slug>
// 输出：stdout 报告 + 可选写入 episodes/<slug>/self-check-report.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

const epDir = path.join(ROOT, 'episodes', slug);
console.log(`🔍 成片自检 — episode: ${slug}\n`);

// 简易 PASS / FAIL 框架（M0 骨架，每项检查逻辑后续迭代完善）
const checkResults = [];
function check(id, label, fn) {
  const result = fn();
  checkResults.push({ id, label, result });
  const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
  console.log(`  ${icon} ${id} ${label}: ${result.status}${result.reason ? ` (${result.reason})` : ''}`);
}

// A1: source-ledger.json 存在
check('A1', '脚本 claim 可追溯', () => {
  const f = path.join(epDir, 'source-ledger.json');
  if (fs.existsSync(f)) return { status: 'PASS' };
  return { status: 'FAIL', reason: 'source-ledger.json 不存在' };
});

// A2: script.md 存在且 gateStatus=passed
check('A2', '三幕四段完整性', () => {
  const f = path.join(epDir, 'script.md');
  if (!fs.existsSync(f)) return { status: 'FAIL', reason: 'script.md 不存在' };
  const content = fs.readFileSync(f, 'utf-8');
  if (content.includes('gateStatus: "passed"')) return { status: 'PASS' };
  return { status: 'FAIL', reason: 'gateStatus 未通过' };
});

// A33: 前 3 秒钩子兑现（占位，需实际音频）
check('A33', '前 3 秒钩子兑现', () => {
  // 简化：检查 script.md 是否明确标记了 "Hook" / "0:00–0:30" 段
  const f = path.join(epDir, 'script.md');
  if (!fs.existsSync(f)) return { status: 'FAIL', reason: 'script.md 不存在' };
  return { status: 'WARN', reason: '需音频转写比对（M2 完善）' };
});

// A37: 结尾无总结信号
check('A37', '结尾无总结信号', () => {
  const f = path.join(epDir, 'script.md');
  if (!fs.existsSync(f)) return { status: 'FAIL', reason: 'script.md 不存在' };
  return { status: 'WARN', reason: '需语义扫描 "conclusion/summarize/in the end"' };
});

// A16: 软字幕上传状态
check('A16', '软字幕上传状态', () => {
  const srtDir = path.join(epDir, 'subtitles');
  const srtFile = path.join(srtDir, 'voiceover.srt');
  if (fs.existsSync(srtFile)) return { status: 'PASS' };
  return { status: 'WARN', reason: 'SRT 不存在（上传前检查）' };
});

// A17: AI 披露
check('A17', 'AI 披露', () => {
  return { status: 'WARN', reason: '需 YouTube 简介检查' };
});

console.log(`\n📊 汇总: ${checkResults.filter(r => r.result.status === 'PASS').length} PASS, ${checkResults.filter(r => r.result.status === 'FAIL').length} FAIL, ${checkResults.filter(r => r.result.status === 'WARN').length} WARN`);
console.log('⚠️  M0 骨架仅覆盖 A1/A2/A16/A17/A33/A37 的文件存在性检查。完整 A1—A37 需 M2 迭代。');

const hasFail = checkResults.some(r => r.result.status === 'FAIL');
process.exit(hasFail ? 1 : 0);
