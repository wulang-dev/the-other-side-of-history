#!/usr/bin/env node
// tts-call.mjs — 豆包语音合成 TTS 调用（skill-2.5）
// 新版控制台 API Key 鉴权（X-Api-Key）
// 接口: POST https://openspeech.bytedance.com/api/v3/tts/unidirectional
// 文档: https://docs.volcengine.com/docs/doubao-voice/unidirectional-streaming-text-to-speech-http
// 运行：node scripts/tts-call.mjs --text "Hello world this is a test." --out ./test.wav

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// === 加载 .env ===
function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 不存在');
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
const API_KEY = env.VOLC_TTS_API_KEY;
const VOICE_ID = env.VOLC_TTS_VOICE_ID;
const RESOURCE_ID = env.VOLC_TTS_RESOURCE_ID || 'seed-tts-2.0';

if (!API_KEY) {
  console.error('❌ VOLC_TTS_API_KEY 未配置');
  console.error('   获取：https://console.volcengine.com/speech/new/setting/apikeys?projectName=default');
  process.exit(1);
}
if (!VOICE_ID) {
  console.error('❌ VOLC_TTS_VOICE_ID 未配置');
  console.error('   音色库：https://console.volcengine.com/speech/new/voices?projectName=default');
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, arr) => {
    if (!a.startsWith('--')) return null;
    const v = arr[i + 1];
    return [a.slice(2), v && !v.startsWith('--') ? v : true];
  }).filter(Boolean)
);

const text = args.text || (args.file ? fs.readFileSync(path.resolve(args.file), 'utf-8') : null);
const outPath = args.out ? path.resolve(args.out) : path.join(ROOT, 'audio-test.wav');
const voiceId = args.voice || VOICE_ID;
const resourceId = args.resource || RESOURCE_ID;

if (!text) {
  console.error('用法: node tts-call.mjs --text "文字" --out ./out.wav');
  console.error('   或: node tts-call.mjs --file episodes/{slug}/script.md --out ./out.wav');
  process.exit(1);
}

// === 豆包语音合成 TTS ===
// 新版控制台: X-Api-Key 单头鉴权
// Resource-Id: seed-tts-2.0（豆包语音合成模型2.0）
async function callTTS(inputText, opts = {}) {
  const {
    speaker = VOICE_ID,
    resource_id = RESOURCE_ID,
    format = 'wav',
    sample_rate = 24000,
    speech_rate = 0,
    loudness_rate = 0,
    pitch_rate = 0,
    enable_subtitle = true
  } = opts;

  const endpoint = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

  const body = {
    req_params: {
      text: inputText,
      speaker,
      audio_params: {
        format,
        sample_rate,
        speech_rate,
        loudness_rate,
        pitch_rate,
        enable_subtitle
      }
    }
  };

  const requestId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  console.log(`🔊 豆包语音 TTS 调用中...`);
  console.log(`   端点: ${endpoint}`);
  console.log(`   Resource: ${resource_id}`);
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log(`   Voice ID: ${speaker}`);
  console.log(`   文本长度: ${inputText.length} 字符`);
  console.log(`   输出: ${format} @ ${sample_rate}Hz, subtitle=${enable_subtitle}`);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      'X-Api-Resource-Id': resource_id,
      'X-Api-Request-Id': requestId,
      'X-Control-Require-Usage-Tokens-Return': '*'
    },
    body: JSON.stringify(body)
  });

  // HTTP Chunked 流式响应 —— 多个 JSON 对象拼接（每个 chunk 是一段音频）
  const arrayBuf = await resp.arrayBuffer();
  const rawText = Buffer.from(arrayBuf).toString('utf-8');

  // 提取所有 JSON 对象（花括号匹配）
  const allChunks = extractAllJsonObjects(rawText);

  if (allChunks.length === 0) {
    throw new Error(`响应中没有找到任何 JSON 对象 (HTTP ${resp.status})`);
  }

  // 检查第一个 chunk 的错误码
  const firstChunk = allChunks[0];
  if (!resp.ok || (firstChunk.code !== undefined && firstChunk.code !== 0 && firstChunk.code !== 20000000)) {
    throw new Error(`HTTP ${resp.status} / code ${firstChunk.code}: ${firstChunk.message ?? resp.statusText}`);
  }

  // 把所有有 data 的 chunk 分别 base64 解码成二进制 Buffer，再拼接
  // ❌ 不能直接拼接 base64 字符串再解码 —— 每个 chunk 的 base64 有独立 padding
  const audioBuffers = [];
  let finalSentence = null;
  let usage = null;
  for (const chunk of allChunks) {
    if (chunk.data && chunk.data.length > 0) {
      audioBuffers.push(Buffer.from(chunk.data, 'base64'));
    }
    if (chunk.sentence) finalSentence = chunk.sentence;
    if (chunk.usage) usage = chunk.usage;
  }

  if (audioBuffers.length === 0) {
    throw new Error(`所有 chunk 都没有音频数据！共 ${allChunks.length} 个 chunk`);
  }

  const combinedBuffer = Buffer.concat(audioBuffers);

  return {
    code: 0,
    message: 'OK',
    _audioBuffer: combinedBuffer,
    sentence: finalSentence,
    usage,
    _chunkCount: allChunks.length
  };
}

// === 主执行 ===
try {
  console.log(`\n🚀 skill-2.5 配音启动`);
  console.log(`\n📝 输入文本:\n   "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"\n`);

  const result = await callTTS(text, { speaker: voiceId, resource_id: resourceId });

  // callTTS 已经把所有 chunk 的音频解码并拼接好了
  const audioBuffer = result._audioBuffer;

  if (!audioBuffer || audioBuffer.length < 44) {
    throw new Error(`音频 Buffer 太小: ${audioBuffer?.length ?? 0} bytes`);
  }

  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, audioBuffer);

  const stats = fs.statSync(outPath);
  const duration = result.sentence?.words?.length
    ? (result.sentence.words[result.sentence.words.length - 1].endTime).toFixed(1)
    : 'unknown';
  console.log(`\n✅ 音频已保存 → ${outPath}`);
  console.log(`   文件大小: ${(stats.size / 1024).toFixed(1)} KB (${result._chunkCount} chunks 拼接)`);
  console.log(`   预估时长: ~${duration}s`);
  console.log(`   计费字符数: ${result.usage?.text_words ?? 'N/A'}`);

  // 如果有字幕，也保存
  if (result.sentence?.words?.length) {
    const srtPath = outPath.replace(/\.(wav|mp3|pcm)$/, '.srt');
    const words = result.sentence.words;
    let srt = '';
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const start = formatSrtTime(w.startTime);
      const end = formatSrtTime(w.endTime);
      srt += `${i + 1}\n${start} --> ${end}\n${w.word}\n\n`;
    }
    fs.writeFileSync(srtPath, srt, 'utf-8');
    console.log(`   字幕已保存 → ${srtPath} (${words.length} 词)`);
  }

} catch (err) {
  console.error(`\n❌ TTS 调用失败: ${err.message}`);
  console.error(`\n排查清单：`);
  console.error(`   1. VOLC_TTS_API_KEY 是否填对（豆包语音控制台 API Key 管理页创建的）`);
  console.error(`   2. VOLC_TTS_VOICE_ID 是否在控制台真实存在`);
  console.error(`   3. 是否开通了"豆包语音合成模型2.0"服务`);
  console.error(`   4. 网络是否正常（openspeech.bytedance.com 可访问）`);
  process.exit(1);
}

// 从 HTTP Chunked 流式响应中提取**所有** JSON 对象
// 响应格式：{...chunk1...}{...chunk2...}{...chunk3...}（多个 JSON 拼接，无分隔符）
function extractAllJsonObjects(text) {
  let depth = 0;
  let start = -1;
  const results = [];
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        const jsonStr = text.slice(start, i + 1);
        try {
          results.push(JSON.parse(jsonStr));
        } catch { /* skip malformed */ }
        start = -1;
      }
    }
  }

  return results;
}

// SRT 时间格式化
function formatSrtTime(seconds) {
  if (!seconds) return '00:00:00,000';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
