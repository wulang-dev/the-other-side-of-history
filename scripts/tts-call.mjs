#!/usr/bin/env node
// tts-call.mjs — 火山引擎 TTS 同步调用骨架（skill-2.5）
// PRD v13.0 §15 + 附录 A-7
// 运行：node scripts/tts-call.mjs --text "Hello world this is a test" --out ./test.wav
// 或：  node scripts/tts-call.mjs --file episodes/{slug}/script.md --out episodes/{slug}/audio/full.wav

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// === 加载 .env ===
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 不存在。请先配置 VOLC_TTS_APPID 和 VOLC_TTS_ACCESS_TOKEN');
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const env = {};
  for (const line of lines) {
    const eq = line.indexOf('=');
    if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnv();
const APPID = env.VOLC_TTS_APPID;
const TOKEN = env.VOLC_TTS_ACCESS_TOKEN;
const VOICE_ID = env.VOLC_TTS_VOICE_ID || 'tts-xxx';   // 首条视频前人类选定
const CLUSTER = env.VOLC_TTS_CLUSTER || 'volcano_tts';

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => {
    if (!a.startsWith('--')) return null;
    const v = arr[i + 1];
    return [a.slice(2), v && !v.startsWith('--') ? v : true];
  }).filter(Boolean)
);

if (!APPID || !TOKEN) {
  console.error('❌ 火山引擎 TTS 凭据未配置');
  console.error('   请在 .env 里填 VOLC_TTS_APPID 和 VOLC_TTS_ACCESS_TOKEN');
  console.error('   申请：https://console.volcengine.com/speech/service');
  process.exit(1);
}

const text = args.text || (args.file ? fs.readFileSync(path.resolve(args.file), 'utf-8') : null);
const outPath = args.out ? path.resolve(args.out) : path.join(ROOT, 'audio-test.wav');

if (!text) {
  console.error('用法: node tts-call.mjs --text "文字" --out ./out.wav');
  console.error('   或: node tts-call.mjs --file episodes/{slug}/script.md --out ./out.wav');
  process.exit(1);
}

// === 火山引擎 OpenSpeech 同步 TTS ===
// 文档：https://www.volcengine.com/docs/6561/1257584
// 鉴权：Authorization: Bearer;${token}  ← 注意是分号，不是空格！
//       （火山引擎的 Bearer 格式是 "Bearer;xxx"，不是标准的 "Bearer xxx"）
// 请求体含 app + user + audio + request 四部分
async function callTTS(inputText) {
  const body = {
    app: { appid: APPID, token: TOKEN, cluster: CLUSTER },
    user: { uid: 'the-other-side-of-history' },
    audio: {
      voice_type: VOICE_ID,
      encoding: 'wav',
      speed_ratio: 1.0,    // 语速倍率。目标 150-170 wpm，先用默认，实测后调
      volume_ratio: 1.0,
      pitch_ratio: 1.0
    },
    request: {
      reqid: `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: inputText,
      operation: 'query'
    }
  };

  console.log(`🔊 火山引擎 TTS 调用中...`);
  console.log(`   文本长度: ${inputText.length} 字符`);
  console.log(`   Voice ID: ${VOICE_ID}  输出: wav`);

  const resp = await fetch('https://openspeech.bytedance.com/api/v1/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // ⚠️ 火山引擎特殊格式：Bearer 后面是分号，不是空格
      'Authorization': `Bearer;${TOKEN}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errText}`);
  }

  const contentType = resp.headers.get('content-type') || '';

  // 成功时返回的是二进制音频；失败时返回 JSON 错误
  if (contentType.includes('audio') || contentType.includes('application/octet-stream')) {
    return Buffer.from(await resp.arrayBuffer());
  }

  // JSON 错误响应
  const json = await resp.json();
  throw new Error(`火山引擎 TTS 错误: ${JSON.stringify(json)}`);
}

// === 主执行 ===
try {
  console.log(`\n🚀 skill-2.5 配音启动`);
  console.log(`   AppId: ${APPID}  Cluster: ${CLUSTER}\n`);

  const audioBuffer = await callTTS(text);

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, audioBuffer);

  const stats = fs.statSync(outPath);
  console.log(`\n✅ 音频已保存 → ${outPath}`);
  console.log(`   文件大小: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`\n⚠️  M0 骨架：单次调用整段文本，后续完善：`);
  console.log(`   1. 分段生成（长文本避免超时）`);
  console.log(`   2. SSML 停顿标记（句号 0.5s，段落 1.2s）`);
  console.log(`   3. 词级时间戳提取`);
  console.log(`   4. SRT 字幕生成`);
  console.log(`   5. 响度标准化（-14 LUFS）`);
  console.log(`   6. 人类试听钩子/代价/结尾三段`);

} catch (err) {
  console.error(`\n❌ TTS 调用失败: ${err.message}`);
  console.error(`\n排查清单：`);
  console.error(`   1. VOLC_TTS_APPID 和 VOLC_TTS_ACCESS_TOKEN 是否填对`);
  console.error(`   2. Authorization 格式是 "Bearer;${TOKEN}" （分号不是空格）`);
  console.error(`   3. Voice ID 是否在火山控制台真实存在`);
  console.error(`   4. AppId 和 AccessToken 是否属于同一个服务`);
  console.error(`   5. Token 是否过期（AccessToken 有效期 24h，需定期刷新）`);
  process.exit(1);
}
