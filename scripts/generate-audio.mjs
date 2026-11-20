import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIP_DATA, PHRASE_CARDS } from '../src/data/tripData.js';
import { PHOTO_SPOTS } from '../src/data/photoSpotsData.js';
import { TAXI_EMERGENCY_CARD } from '../src/data/disneyAndSurvivalData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT_DIR, 'public', 'assets', 'audio');
const MANIFEST_PATH = path.join(ROOT_DIR, 'src', 'data', 'audioManifest.js');

/**
 * UI 표시용 원문은 보존한 채, 일본어 TTS가 자연스럽게 읽도록 발음 텍스트만 정제
 */
function cleanForJapaneseTts(raw) {
  let s = String(raw || '').trim();

  // 회화 카드 특화 발음 정제
  s = s.replace(/4人（よにん）/g, 'よにん');
  s = s.replace(/免税（めんぜい）/g, '免税');
  s = s.replace(/予約名は（名前）で、?/g, '予約名をお伝えします。');
  s = s.replace(/（カード／PASMOは使えますか？）/g, ' カードやパスモは使えますか？');
  s = s.replace(/チェックイン前（チェックアウト後）/g, 'チェックイン前、またはチェックアウト後');
  s = s.replace(/（チャージ）/g, '、チャージ');
  s = s.replace(/（救護室）/g, '、または救護室');

  // 영문 병기 및 숫자 주소·층수·시간 정제
  s = s.replace(/\s*\(S-PERIA INN NIHOMBASHI HAKOZAKI\)/gi, '');
  s = s.replace(/(\d+)-(\d+)/g, '$1の$2');
  s = s.replace(/(\d+)\s*[·・]\s*(\d+)F/gi, '$1階、$2階');
  s = s.replace(/(\d+)F/gi, '$1階');
  s = s.replace(/14:00\s*離陸/g, '14時離陸');

  // 일본에서 흔한 외래어·약어 발음 보정
  s = s.replace(/T-CAT/g, 'ティーキャット');
  s = s.replace(/PASMO/g, 'パスモ');
  s = s.replace(/\bQR\b/g, 'キューアール');
  s = s.replace(/\bT1\b/g, '第1ターミナル');
  s = s.replace(/\bT3\b/g, '第3ターミナル');

  // 기호·괄호를 자연스러운 쉼표(휴지)로 치환
  s = s.replace(/[→·・／～]/g, '、');
  s = s.replace(/[〈〉()（）]/g, '、');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/、+/g, '、');
  s = s.replace(/^、+|、+$/g, '').trim();
  s = s.replace(/、\s*([。？?！!])/g, '$1');

  return s;
}

/**
 * MP3 바이너리 헤더 및 최소 용량 검증
 */
function isValidMp3Buffer(buf) {
  if (!buf || buf.length < 2000) return false;
  const b0 = buf[0];
  const b1 = buf[1];
  const b2 = buf[2];
  // ID3 태그(0x49 0x44 0x33) 또는 MPEG Audio Sync (0xFF 0xE0 마스크)
  const hasId3 = b0 === 0x49 && b1 === 0x44 && b2 === 0x33;
  const hasMpegSync = b0 === 0xff && (b1 & 0xe0) === 0xe0;
  return hasId3 || hasMpegSync;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJapaneseTtsMp3(ttsText) {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ja&q=${encodeURIComponent(ttsText)}`;
  let lastErr = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const arr = await res.arrayBuffer();
      const buf = Buffer.from(arr);
      if (!isValidMp3Buffer(buf)) {
        throw new Error(`유효하지 않은 MP3 응답 (bytes=${buf.length}, head=${buf.subarray(0, 4).toString('hex')})`);
      }
      return buf;
    } catch (err) {
      lastErr = err;
      if (attempt < 3) {
        await sleep(500 * attempt);
      }
    }
  }
  throw lastErr;
}

function collectAllTargets() {
  const rawList = [];
  for (const p of PHRASE_CARDS) {
    rawList.push({ id: `phrase-${p.id}`, text: p.japanese });
  }
  rawList.push({ id: 'taxi-emergency', text: TAXI_EMERGENCY_CARD.japanese });
  for (const d of TRIP_DATA.days) {
    for (const item of d.items) {
      if (item.jpTitle) {
        rawList.push({ id: `item-${item.id}`, text: item.jpTitle });
      }
    }
  }
  for (const spot of PHOTO_SPOTS) {
    if (spot.jpSign) {
      rawList.push({ id: `spot-${spot.id}`, text: spot.jpSign });
    }
  }
  return rawList;
}

async function main() {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const targets = collectAllTargets();

  // 중복 텍스트는 먼저 등장한 id의 MP3 파일을 공용 참조
  const textToFileRel = new Map();
  const uniqueDownloads = [];

  for (const { id, text } of targets) {
    const key = text.trim();
    if (!textToFileRel.has(key)) {
      const fileName = `${id}.mp3`;
      const relPath = `assets/audio/${fileName}`;
      textToFileRel.set(key, relPath);
      uniqueDownloads.push({ id, fileName, relPath, rawText: key, ttsText: cleanForJapaneseTts(key) });
    }
  }

  console.log(`총 항목 ${targets.length}건 / 고유 음성 파일 ${uniqueDownloads.length}개 생성 시작...`);

  // 더 이상 매니페스트에 없는 잔여 mp3 파일이 있으면 정리
  const expectedFiles = new Set(uniqueDownloads.map((u) => u.fileName));
  for (const existing of fs.readdirSync(AUDIO_DIR)) {
    if (existing.endsWith('.mp3') && !expectedFiles.has(existing)) {
      fs.unlinkSync(path.join(AUDIO_DIR, existing));
    }
  }

  let totalBytes = 0;
  for (let i = 0; i < uniqueDownloads.length; i++) {
    const item = uniqueDownloads[i];
    const destPath = path.join(AUDIO_DIR, item.fileName);

    const buf = await fetchJapaneseTtsMp3(item.ttsText);
    fs.writeFileSync(destPath, buf);
    totalBytes += buf.length;
    console.log(`[${i + 1}/${uniqueDownloads.length}] ${item.fileName} (${buf.length} bytes) <= "${item.ttsText}"`);

    if (i < uniqueDownloads.length - 1) {
      await sleep(220);
    }
  }

  // 모든 파일 존재 및 유효성 최종 전수 검증
  for (const item of uniqueDownloads) {
    const destPath = path.join(AUDIO_DIR, item.fileName);
    const buf = fs.readFileSync(destPath);
    if (!isValidMp3Buffer(buf)) {
      throw new Error(`최종 검증 실패: ${destPath}`);
    }
  }

  // src/data/audioManifest.js 생성
  const manifestObj = {};
  for (const [key, rel] of textToFileRel.entries()) {
    manifestObj[key] = rel;
  }

  const manifestSource = `// 자동 생성 파일: node scripts/generate-audio.mjs\n// 앱 내 일본어 원어민 발음 MP3 매핑 (총 ${targets.length}건 / 고유 ${uniqueDownloads.length}개)\nexport const JAPANESE_AUDIO_MANIFEST = ${JSON.stringify(manifestObj, null, 2)};\n`;
  fs.writeFileSync(MANIFEST_PATH, manifestSource, 'utf-8');

  console.log(`✅ 생성 및 검증 완료: ${uniqueDownloads.length}개 MP3 (총 ${(totalBytes / 1024).toFixed(1)} KB) -> src/data/audioManifest.js`);
}

main().catch((err) => {
  console.error('❌ 음성 파일 생성 실패:', err);
  process.exit(1);
});
