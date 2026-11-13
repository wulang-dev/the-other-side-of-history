#!/usr/bin/env node
// readability.mjs — 英文脚本可读性指标（A25）
// PRD v13.0 §17.2 A25 + §10.4
// 运行：node scripts/readability.mjs <file.md|file.txt|--text "inline text">

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// === 简易英文分词 + 句长计算 ===
function tokenize(text) {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
}

function countSyllables(word) {
  // 简易：按元音组计数，尾 silent e 不计
  const w = word.toLowerCase();
  if (w.length <= 3) return 1;
  let count = 0;
  let lastWasVowel = false;
  for (const c of w) {
    const isV = 'aeiouy'.includes(c);
    if (isV && !lastWasVowel) count++;
    lastWasVowel = isV;
  }
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);
}

function fleschKincaid(sentences, words, totalSyllables) {
  if (sentences === 0 || words === 0) return null;
  const asl = words / sentences;
  const asw = totalSyllables / words;
  const fk = 0.39 * asl + 11.8 * asw - 15.59;
  return {
    gradeLevel: Math.round(fk * 10) / 10,
    asl: Math.round(asl * 10) / 10,  // 平均句长
    asw: Math.round(asw * 100) / 100 // 平均每词音节
  };
}

function passiveVoiceRatio(words) {
  // 简易：被动语态 be + 过去分词（-ed / -en）出现在助动词后
  // 这里只做粗估：统计 -ed / -en 结尾词占比（不是精确值）
  const passiveMarkers = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'is being', 'are being', 'was being', 'were being',
    'has been', 'have been', 'had been'];
  return passiveMarkers.length ? '（粗估，需文本上下文分析）' : '—';
}

function abstractNounDensity(words) {
  const abstractSuffixes = /(tion|ment|ness|ity|ance|ence|ism|hood|ship|age)$/i;
  const abstractCount = words.filter(w => abstractSuffixes.test(w)).length;
  return Math.round((abstractCount / words.length) * 1000) / 10; // / 100 词
}

// === 主函数 ===
const args = process.argv.slice(2);
let text = '';

if (args[0] === '--text') {
  text = args.slice(1).join(' ');
} else if (args[0]) {
  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }
  text = fs.readFileSync(filePath, 'utf-8');
} else {
  console.error('用法: node readability.mjs <file> 或 node readability.mjs --text "..."');
  process.exit(1);
}

// 过滤 markdown 代码块、引用块、标题行
text = text
  .replace(/```[\s\S]*?```/g, '')
  .replace(/^#{1,6}\s+/gm, '')
  .replace(/^>\s+/gm, '')
  .replace(/[|`*_]/g, '');

const tokens = tokenize(text);
const sentences = splitSentences(text);
const syllables = tokens.reduce((acc, w) => acc + countSyllables(w), 0);
const fk = fleschKincaid(sentences.length, tokens.length, syllables);

console.log('📖 英文脚本可读性分析（PRD §17.2 A25 + §10.4）\n');
console.log(`  总词数:           ${tokens.length}`);
console.log(`  句子数:           ${sentences.length}`);
console.log(`  总音节数:         ${syllables}`);
console.log(`  平均句长 (ASL):   ${fk?.asl ?? 'N/A'} 词`);
console.log(`  Flesch-Kincaid:   Grade ${fk?.gradeLevel ?? 'N/A'}`);
console.log(`  抽象名词密度:     ${abstractNounDensity(tokens)} / 100 词`);
console.log('');
console.log('🎯 目标范围 (PRD §10.4):');
console.log(`  FK Grade:         7—9  → ${fk ? (fk.gradeLevel >= 7 && fk.gradeLevel <= 9 ? '✅' : '⚠️') : '—'}`);
console.log(`  平均句长:         12—18 → ${fk ? (fk.asl >= 12 && fk.asl <= 18 ? '✅' : '⚠️') : '—'}`);
console.log(`  抽象名词 ≤ 8/100:  ≤ 8  → ${abstractNounDensity(tokens) <= 8 ? '✅' : '⚠️'}`);
console.log(`  被动语态:         < 15% → 需 AI 语义扫描`);
