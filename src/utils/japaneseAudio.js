import { useEffect, useState } from 'react';
import { JAPANESE_AUDIO_MANIFEST } from '../data/audioManifest';

let currentAudio = null;
let currentText = null;
let fallbackUtteranceActive = false;
const listeners = new Set();

function notifyListeners() {
  for (const fn of listeners) {
    fn(currentText);
  }
}

/**
 * 현재 재생 중인 일본어 음성을 즉시 정지하고 상태를 초기화
 */
export function stopJapaneseAudio() {
  if (currentAudio) {
    try {
      currentAudio.onended = null;
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // 오디오 객체 정리 중 예외 무시
    }
    currentAudio = null;
  }

  if (
    fallbackUtteranceActive &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window
  ) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // speechSynthesis 정리 중 예외 무시
    }
    fallbackUtteranceActive = false;
  }

  if (currentText !== null) {
    currentText = null;
    notifyListeners();
  }
}

function getBundledAudioSrc(text) {
  if (!text) return null;
  if (JAPANESE_AUDIO_MANIFEST[text]) return JAPANESE_AUDIO_MANIFEST[text];
  const trimmed = String(text).trim();
  return JAPANESE_AUDIO_MANIFEST[trimmed] || null;
}

function tryWebSpeechFallback(text) {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ja-JP';
    utter.rate = 0.92;

    const voices = window.speechSynthesis.getVoices?.() || [];
    const jpVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja'));
    if (jpVoice) {
      utter.voice = jpVoice;
    }

    fallbackUtteranceActive = true;
    currentText = text;
    notifyListeners();

    utter.onend = () => {
      fallbackUtteranceActive = false;
      if (currentText === text) {
        currentText = null;
        notifyListeners();
      }
    };
    utter.onerror = () => {
      fallbackUtteranceActive = false;
      if (currentText === text) {
        currentText = null;
        notifyListeners();
      }
    };

    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    fallbackUtteranceActive = false;
    return false;
  }
}

/**
 * 일본어 음성 재생 (1순위: 앱 내장 MP3 HTML5 Audio -> 2순위: 브라우저 Web Speech API)
 * 이미 같은 문구가 재생 중이면 정지(토글)합니다.
 */
export async function playJapaneseAudio(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return { ok: false, reason: 'empty' };

  // 동일 항목 재클릭 시 정지
  if (currentText === text) {
    stopJapaneseAudio();
    return { ok: true, stopped: true };
  }

  stopJapaneseAudio();

  const bundledSrc = getBundledAudioSrc(text);
  if (bundledSrc && typeof Audio !== 'undefined') {
    try {
      const audio = new Audio(bundledSrc);
      audio.preload = 'auto';
      audio.volume = 1.0;

      currentAudio = audio;
      currentText = text;
      notifyListeners();

      audio.onended = () => {
        if (currentAudio === audio) {
          currentAudio = null;
          currentText = null;
          notifyListeners();
        }
      };

      audio.onerror = () => {
        if (currentAudio === audio) {
          currentAudio = null;
          currentText = null;
          notifyListeners();
        }
      };

      await audio.play();
      return { ok: true, mode: 'mp3', src: bundledSrc };
    } catch {
      if (currentAudio) {
        currentAudio = null;
      }
      currentText = null;
      notifyListeners();
      // HTML5 Audio 재생 실패 시 Web Speech API 2순위 폴백 시도
    }
  }

  if (tryWebSpeechFallback(text)) {
    return { ok: true, mode: 'speechSynthesis' };
  }

  return {
    ok: false,
    reason: '현재 기기에서 오디오 재생이 제한되었습니다. 볼륨을 확인하거나 [크게 보여주기] 카드를 보여주세요.',
  };
}

/**
 * 현재 재생 중인 일본어 문구 상태와 제어 함수를 제공하는 공용 React 훅
 */
export function useJapaneseAudio() {
  const [playingText, setPlayingText] = useState(currentText);

  useEffect(() => {
    const onChange = (next) => setPlayingText(next);
    listeners.add(onChange);
    setPlayingText(currentText);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return {
    playingText,
    speak: playJapaneseAudio,
    stop: stopJapaneseAudio,
  };
}
