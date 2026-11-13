#!/usr/bin/env python3
# tts-edge.py — Edge TTS 配音（skill-2.5）
# 微软 edge-tts 库，完全免费，纯英文母语者腔调
# 运行：python scripts/tts-edge.py --text "Hello world" --out ./test.mp3
import asyncio, argparse, os, sys
from pathlib import Path

# --- 加载 .env ---
def load_env():
    env_path = Path(__file__).resolve().parent.parent / '.env'
    env = {}
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
    return env

env = load_env()

# 默认音色（纪录片旁白首选）
DEFAULT_VOICE = env.get('EDGE_TTS_VOICE', 'en-US-EricNeural')
DEFAULT_RATE = env.get('EDGE_TTS_RATE', '+0%')      # 语速
DEFAULT_VOLUME = env.get('EDGE_TTS_VOLUME', '+0%')   # 音量
DEFAULT_PITCH = env.get('EDGE_TTS_PITCH', '+0Hz')    # 音调

parser = argparse.ArgumentParser(description='Edge TTS 配音')
parser.add_argument('--text', help='直接传入文本')
parser.add_argument('--file', help='从文件读取文本')
parser.add_argument('--out', help='输出音频文件路径（.mp3 或 .wav）')
parser.add_argument('--voice', default=DEFAULT_VOICE, help=f'音色 (默认 {DEFAULT_VOICE})')
parser.add_argument('--rate', default=DEFAULT_RATE, help=f'语速 (默认 {DEFAULT_RATE})')
parser.add_argument('--volume', default=DEFAULT_VOLUME, help=f'音量 (默认 {DEFAULT_VOLUME})')
parser.add_argument('--pitch', default=DEFAULT_PITCH, help=f'音调 (默认 {DEFAULT_PITCH})')
parser.add_argument('--list', action='store_true', help='列出所有可用英文男声')
args = parser.parse_args()

if args.list:
    try:
        import edge_tts
        async def show():
            voices = await edge_tts.list_voices()
            for v in voices:
                if v['ShortName'].startswith('en-') and v['Gender'] == 'Male':
                    print(f"  {v['ShortName']:30s} {v.get('FriendlyName','')}")
        asyncio.run(show())
    except Exception as e:
        print(f'❌ 无法列出音色: {e}')
    sys.exit(0)

text = args.text
if args.file:
    text = Path(args.file).resolve().read_text(encoding='utf-8')

if not text:
    print('❌ 需要 --text 或 --file 参数')
    print('用法: python tts-edge.py --text "文字" --out ./out.mp3')
    print('   或: python tts-edge.py --file script.md --out ./out.mp3')
    sys.exit(1)

out_path = Path(args.out) if args.out else Path('audio-test.mp3')
out_path = out_path.resolve()

# --- Edge TTS 合成 ---
import edge_tts

async def synthesize():
    communicate = edge_tts.Communicate(
        text,
        args.voice,
        rate=args.rate,
        volume=args.volume,
        pitch=args.pitch
    )

    print(f'\n🚀 skill-2.5 配音启动 (Edge TTS)')
    print(f'   音色: {args.voice}')
    print(f'   语速: {args.rate}  音量: {args.volume}  音调: {args.pitch}')
    print(f'   文本长度: {len(text)} 字符')
    print(f'   输出: {out_path}')

    # 收集音频 chunks（edge-tts 会自动处理字幕事件，但我们只存音频）
    audio_chunks = []
    sub_events = []  # word-level timestamps

    async for event in communicate.stream():
        if event['type'] == 'audio':
            audio_chunks.append(event['data'])
        elif event['type'] == 'WordBoundary':
            sub_events.append({
                'word': event['text'],
                'start': event['offset'] / 10000000,  # 100ns → 秒
                'duration': event['duration'] / 10000000,
                'end': (event['offset'] + event['duration']) / 10000000,
            })
        elif event['type'] == 'bookmark':
            pass  # SentenceBoundary 等

    if not audio_chunks:
        raise RuntimeError('Edge TTS 没返回任何音频数据')

    # 写入音频
    out_path.parent.mkdir(parents=True, exist_ok=True)
    audio_data = b''.join(audio_chunks)
    out_path.write_bytes(audio_data)

    size_kb = len(audio_data) / 1024
    duration = sub_events[-1]['end'] if sub_events else 0
    print(f'\n✅ 音频已保存 → {out_path}')
    print(f'   文件大小: {size_kb:.1f} KB')
    print(f'   预估时长: ~{duration:.1f}s')
    print(f'   词级时间戳: {len(sub_events)} 词')

    # 保存 SRT 字幕（如果有时间戳）
    if sub_events and len(sub_events) > 1:
        srt_path = out_path.with_suffix('.srt')
        srt = ''
        for i, ev in enumerate(sub_events):
            start_s = ev['start']
            end_s = ev['end']
            start_str = f'{int(start_s//3600):02d}:{int((start_s%3600)//60):02d}:{int(start_s%60):02d},{int((start_s%1)*1000):03d}'
            end_str = f'{int(end_s//3600):02d}:{int((end_s%3600)//60):02d}:{int(end_s%60):02d},{int((end_s%1)*1000):03d}'
            srt += f'{i+1}\n{start_str} --> {end_str}\n{ev["word"]}\n\n'
        srt_path.write_text(srt, encoding='utf-8')
        print(f'   字幕已保存 → {srt_path}')

try:
    asyncio.run(synthesize())
except Exception as e:
    print(f'\n❌ Edge TTS 调用失败: {e}')
    print('\n排查清单:')
    print('   1. 网络是否正常（edge.tts.speech.microsoft.com 可访问）')
    print('   2. Python edge-tts 包是否已安装: pip install edge-tts')
    print(f'   3. 音色 {args.voice} 是否有效（python tts-edge.py --list 查看）')
    sys.exit(1)
