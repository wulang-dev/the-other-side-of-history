#!/usr/bin/env node
// check-env.mjs — 环境可达性检查
// PRD v13.0 §21.4 + §19.1
// 运行：node scripts/check-env.mjs
// 检查内容：.env 存在性、关键 Key 是否配置、目录完整性

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🔍 The Other Side of History — 环境检查\n');

// 1. 目录完整性
const requiredDirs = [
  '.trae/rules', '.trae/skills/skill-0-预调研', '.trae/skills/skill-1-考据',
  '.trae/skills/skill-2-脚本', '.trae/skills/skill-2.5-配音',
  '.trae/skills/skill-3-视觉', '.trae/skills/skill-4-QA', '.trae/skills/skill-5-成片自检',
  'workflows', 'assets', 'scripts', 'templates'
];

let dirOk = 0, dirFail = 0;
for (const d of requiredDirs) {
  const full = path.join(ROOT, d);
  if (fs.existsSync(full)) { dirOk++; }
  else { console.log(`  ❌ 目录缺失: ${d}`); dirFail++; }
}
console.log(`📁 目录检查: ${dirOk}/${requiredDirs.length} 存在\n`);

// 2. .env 检查
const envPath = path.join(ROOT, '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env 不存在（预期，生产配置）');
} else {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const placeholders = envContent.split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=')[0].trim());
  const missing = placeholders.filter(
    k => !envContent.match(new RegExp(`^${k}=.+`, 'm'))
  );
  if (missing.length) {
    console.log(`⚠️  .env 中以下 Key 尚未配置值: ${missing.join(', ')}`);
  } else {
    console.log('✅ .env 存在且所有 Key 已配置');
  }
}

// 3. 必需文件
const requiredFiles = [
  'PRD.md',
  'workflows/history-video.yaml',
  '.trae/rules/ao-workflow-runner.md',
  'assets/pronunciation-dict.json',
  'assets/narrative-logic-handbook.md',
];
let fileOk = 0, fileFail = 0;
for (const f of requiredFiles) {
  if (fs.existsSync(path.join(ROOT, f))) { fileOk++; }
  else { console.log(`  ❌ 文件缺失: ${f}`); fileFail++; }
}
console.log(`📄 核心文件: ${fileOk}/${requiredFiles.length} 存在\n`);

console.log('✅ 环境检查完成。');
process.exit(dirFail + fileFail === 0 ? 0 : 1);
