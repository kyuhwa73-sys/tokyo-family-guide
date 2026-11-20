import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone, QrCode, Copy, Check, ExternalLink, Wifi, Globe, X,
  Download, Share2, Sparkles, ShieldCheck, MessageCircle
} from 'lucide-react';

export const DEFAULT_PUBLIC_URL = 'https://kyuhwa73-sys.github.io/tokyo-family-guide/';
export const DEFAULT_WIFI_URL = 'http://172.30.1.42:4317';

/**
 * 카카오톡 인앱 브라우저 등 Clipboard API가 제한된 환경에서도
 * 안정적으로 텍스트를 복사할 수 있는 범용 클립보드 복사 헬퍼
 */
export async function copyTextWithFallback(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 인앱 브라우저 등 권한 제한 환경에서는 아래 폴백 실행
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) return true;
    } catch {
      // 폴백 실패 시 false 반환
    }
  }

  return false;
}

function getInitialPublicUrl() {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin, pathname } = window.location;
    if (protocol === 'https:' && !/^(localhost|127\.0\.0\.1)$/i.test(hostname)) {
      const normalizedPath = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '/');
      return `${origin}${normalizedPath}`;
    }
  }
  return DEFAULT_PUBLIC_URL;
}

function getDynamicWifiUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    if (/^(192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|10\.)/.test(hostname)) {
      return `http://${hostname}:${port || '4317'}`;
    }
  }
  return DEFAULT_WIFI_URL;
}

export default function MobileAccessModal({ isOpen, onClose, deferredPrompt, onInstallPwa }) {
  const [mode, setMode] = useState('public'); // 'public' | 'wifi'
  const [customUrl, setCustomUrl] = useState(getInitialPublicUrl);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const wifiUrl = getDynamicWifiUrl();
  const activeUrl = mode === 'public' ? customUrl : wifiUrl;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(activeUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#133933',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activeUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const ok = await copyTextWithFallback(activeUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="핸드폰 접속 QR 코드 및 모바일 앱 설치 안내"
    >
      <div
        className="max-w-2xl w-full rounded-3xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-950 to-stone-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 block">
                24H PERMANENT HTTPS · QR & PWA APP
              </span>
              <h3 className="text-lg sm:text-xl font-serif font-bold">
                핸드폰으로 바로 열기 & 홈 화면 앱 설치
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 접속 방식 탭 전환 */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setMode('public')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                mode === 'public'
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-white/60'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>24시간 영구 접속 (한국·도쿄)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('wifi')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                mode === 'wifi'
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-white/60'
              }`}
            >
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>집 Wi-Fi 비상용 (PC 서버)</span>
            </button>
          </div>

          {/* QR 코드 & URL 복사 메인 영역 */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-stone-50 dark:bg-stone-800/50 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-700">
            {/* QR 이미지 */}
            <div className="sm:col-span-5 flex flex-col items-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-emerald-900/15">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="핸드폰 접속 QR 코드"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-stone-400">
                    QR 생성 중…
                  </div>
                )}
              </div>
              <span className="mt-2 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                핸드폰 기본 카메라로 스캔하세요
              </span>
            </div>

            {/* 우측 안내 및 링크 복사 */}
            <div className="sm:col-span-7 space-y-3.5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold">
                  {mode === 'public' ? '추천 · PC 꺼져도 24시간 접속 · 카톡 공유' : '보조 · 집 공유기 로컬 서버 실행 시'}
                </span>
                <h4 className="font-bold text-base mt-1.5 text-stone-900 dark:text-white">
                  {mode === 'public'
                    ? '1초 스캔으로 핸드폰에서 바로 열립니다'
                    : '집 Wi-Fi에 연결된 핸드폰에서 빠르게 열립니다'}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {mode === 'public'
                    ? '24시간 영구 보안 HTTPS 웹 호스팅 — PC가 꺼져 있어도 한국·도쿄 현지 어디서나 Wi-Fi/LTE/5G/eSIM으로 즉시 접속되며, 가족 단톡방에 주소를 보내 공유할 수 있습니다.'
                    : '인터넷 없이 집에서 테스트할 때 PC에서 [핸드폰_접속_서버실행.bat]을 실행한 뒤 같은 Wi-Fi 공유기에서 접속하는 로컬 백업 주소입니다.'}
                </p>
              </div>

              {/* 주소 표시 및 복사 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-500 block">
                  핸드폰 접속 주소 (URL)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={activeUrl}
                    onChange={(e) => mode === 'public' && setCustomUrl(e.target.value)}
                    readOnly={mode === 'wifi'}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 inline-flex items-center gap-1.5 shadow transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '복사됨!' : '주소 복사'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-100 text-xs font-bold transition"
                >
                  <span>새 창에서 링크 테스트</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download="도쿄여행가이드_핸드폰접속_QR.png"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-700 hover:bg-stone-300 text-stone-800 dark:text-stone-100 text-xs font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>QR 이미지 저장 (카톡 공유용)</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 카카오톡 인앱 브라우저 안내 박스 */}
          <div className="p-3.5 rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300/70 dark:border-yellow-800/60 flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-200">
            <MessageCircle className="w-4 h-4 text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <b>카카오톡 인앱 브라우저 팁:</b> 카카오톡 단톡방에서 링크를 열었을 때 홈 화면 추가가 안 보이면, 화면 우측 하단 <b>[⋯]</b> 메뉴 → <b>[다른 브라우저로 열기(Safari / Chrome)]</b> 후 추가하세요.
            </p>
          </div>

          {/* 핸드폰 홈 화면에 진짜 앱처럼 추가하는 방법 (PWA 가이드) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                <Share2 className="w-4 h-4 shrink-0" />
                <h5>아이폰 (iPhone · Safari) 앱 설치법</h5>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                1. 핸드폰 카메라로 위 QR을 찍어 <b>Safari</b>로 접속<br />
                2. 화면 하단 가운데 <b>[공유 ⬆️]</b> 버튼 터치<br />
                3. <b>[홈 화면에 추가]</b>를 누르면 바탕화면에 전용 앱 아이콘이 생성됩니다!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 shrink-0" />
                <h5>갤럭시 (Android · Chrome) 앱 설치법</h5>
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                1. QR을 찍어 <b>Chrome</b> 또는 <b>삼성 인터넷</b>으로 접속<br />
                2. 우측 상단 <b>[메뉴 ⋮]</b> (또는 하단 <b>[≡]</b>) 터치<br />
                3. <b>[앱 설치]</b> 또는 <b>[홈 화면에 추가]</b>를 누르면 진짜 앱처럼 전체화면으로 실행됩니다!
              </p>
            </div>
          </div>

          {/* 도쿄 현지 오프라인 팁 */}
          <div className="p-3.5 rounded-2xl bg-stone-900 text-white flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                핸드폰으로 접속한 뒤 상단의 <b>[오프라인 저장]</b>을 한 번 눌러두면, 비행기 안이나 데이터 로밍이 끊긴 지하철에서도 일정과 지도 6장이 그대로 열립니다!
              </span>
            </div>
            {deferredPrompt && (
              <button
                type="button"
                onClick={onInstallPwa}
                className="px-3.5 py-2 rounded-xl bg-amber-400 text-stone-950 font-extrabold shrink-0"
              >
                앱 바로 설치
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
