#!/usr/bin/env node
// qa.mjs — 最终 QA：检查所有 gateStatus === "passed"
// PRD v13.0 §23 skill-4 QA
// 运行：node scripts/qa.mjs --episode <slug>

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
  console.error('用法: node qa.mjs --episode <slug>');
  process.exit(1);
}

const epDir = path.join(ROOT, 'episodes', slug);
console.log(`🔗 QA 最终检查 — episode: ${slug}\n`);

const checks = [
  { file: 'preflight-research.md', field: 'gateStatus', expect: 'passed' },
  { file: 'source-ledger.json', field: 'gateStatus', expect: 'passed' },
  { file: 'script.md', field: 'gateStatus', expect: 'passed' },
  { file: 'script.md', field: 'narrativeLogicCheck', expect: 'passed' },
  { file: 'script.md', field: 'valuesCheck', expect: 'passed' },
  { file: 'script.md', field: 'englishQualityCheck', expect: 'passed' },
];

let allPass = true;
for (const c of checks) {
  const f = path.join(epDir, c.file);
  if (!fs.existsSync(f)) {
    console.log(`  ❌ ${c.file} 不存在 → gateStatus 检查跳过（episode 目录尚未创建）`);
    allPass = false;
    continue;
  }
  const content = fs.readFileSync(f, 'utf-8');
  const match = content.match(new RegExp(`${c.field}\\s*:\\s*"?([^\\s"]+)"?`));
  const val = match ? match[1] : null;
  if (val === c.expect) {
    console.log(`  ✅ ${c.file} → ${c.field}: ${val}`);
  } else {
    console.log(`  ❌ ${c.file} → ${c.field}: ${val ?? '(未找到)'}  期望: ${c.expect}`);
    allPass = false;
  }
}

console.log(`\n${allPass ? '✅ QA 通过，可发布' : '❌ QA 未通过，回到对应 Gate'}`);
process.exit(allPass ? 0 : 1);
