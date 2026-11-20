import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Calendar, Map as MapIcon, Briefcase, BookOpen, Compass, Search, Download,
  CheckCircle2, Circle, ExternalLink, Volume2, Sparkles, Sun, Moon, Wifi,
  WifiOff, Clock, MapPin, ChevronRight, Plane, Hotel, StickyNote, Smartphone,
  QrCode, X, Copy, Check
} from 'lucide-react';
import { TRIP_DATA, ROUTE_MAPS, DEFAULT_EXPENSES } from './data/tripData';
import InteractiveMap from './components/InteractiveMap';
import DeepZoomMapModal from './components/DeepZoomMapModal';
import ConciergeToolkit from './components/ConciergeToolkit';
import { PrepareView, OriginalDocumentView } from './components/PrepareAndOriginal';
import MobileAccessModal, {
  DEFAULT_PUBLIC_URL,
  copyTextWithFallback,
} from './components/MobileAccessModal';

const STORAGE_KEY = 'tokyo-trip-journal-v1';

function getInitialExpenses(savedState) {
  if (!Array.isArray(savedState.expenses)) {
    return DEFAULT_EXPENSES;
  }
  if (savedState.skytreeExpenseMerged || savedState.expenses.some((e) => e.id === 'e3b')) {
    return savedState.expenses;
  }
  const skytreePreset = DEFAULT_EXPENSES.find((e) => e.id === 'e3b');
  if (!skytreePreset) return savedState.expenses;

  const next = [...savedState.expenses];
  const e3Index = next.findIndex((e) => e.id === 'e3');
  if (e3Index !== -1) {
    next.splice(e3Index + 1, 0, skytreePreset);
  } else {
    const lastDay1Index = next.reduce((acc, item, idx) => (item.day === 1 ? idx : acc), -1);
    if (lastDay1Index !== -1) {
      next.splice(lastDay1Index + 1, 0, skytreePreset);
    } else {
      next.unshift(skytreePreset);
    }
  }
  return next;
}

const CATEGORY_STYLES = {
  transport: { label: '이동 · 교통', bg: 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-300', dot: 'bg-sky-600' },
  shopping: { label: '쇼핑 · 캐릭터', bg: 'bg-pink-100 text-pink-900 dark:bg-pink-950/70 dark:text-pink-300', dot: 'bg-pink-600' },
  food: { label: '식사 · 맛집', bg: 'bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-300', dot: 'bg-orange-600' },
  sightseeing: { label: '산책 · 야경 · 관광', bg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300', dot: 'bg-amber-600' },
  stay: { label: '숙소 · 휴식', bg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300', dot: 'bg-emerald-600' },
  themepark: { label: '도쿄 디즈니씨', bg: 'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300', dot: 'bg-purple-600' },
};

export default function App() {
  const [savedState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  const [view, setView] = useState('schedule'); // 'schedule' | 'maps' | 'concierge' | 'prepare' | 'original'
  const [conciergeSubTab, setConciergeSubTab] = useState('phrases');
  const [day, setDay] = useState(1);
  const [query, setQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sidebarMapTab, setSidebarMapTab] = useState('interactive'); // 'interactive' | 'original'
  const [activeDeepZoomMapId, setActiveDeepZoomMapId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => Boolean(savedState.darkMode));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [toastMsg, setToastMsg] = useState('');
  const [tokyoWeather, setTokyoWeather] = useState({ temp: 14, desc: '현재 도쿄 실시간 기온' });

  // 모바일 QR 모달 & 플로팅 QR 위젯 상태
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [floatingQrVisible, setFloatingQrVisible] = useState(true);
  const [miniQrDataUrl, setMiniQrDataUrl] = useState('');
  const [copiedQuick, setCopiedQuick] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // 사용자 기록 상태
  const [completed, setCompleted] = useState(() => savedState.completed || {});
  const [checks, setChecks] = useState(() => savedState.checks || {});
  const [notes, setNotes] = useState(() => savedState.notes || {});
  const [disneyChecks, setDisneyChecks] = useState(() => savedState.disneyChecks || {});
  const [customChecklist, setCustomChecklist] = useState(() => savedState.customChecklist || []);
  const [expenses, setExpenses] = useState(() => getInitialExpenses(savedState));
  const [exchangeRate, setExchangeRate] = useState(() => savedState.exchangeRate || 910);

  const showToast = (msg) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(''), 3400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // 미니 QR 코드 생성
  useEffect(() => {
    QRCode.toDataURL(DEFAULT_PUBLIC_URL, {
      width: 180,
      margin: 1,
      color: { dark: '#133933', light: '#FFFFFF' },
    })
      .then((url) => setMiniQrDataUrl(url))
      .catch(() => {});
  }, []);

  // PWA 설치 프롬프트 감지
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      setMobileModalOpen(true);
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  // LocalStorage 자동 저장
  useEffect(() => {
    try {
      const payload = {
        completed,
        checks,
        notes,
        disneyChecks,
        customChecklist,
        expenses,
        skytreeExpenseMerged: true,
        exchangeRate,
        darkMode,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [completed, checks, notes, disneyChecks, customChecklist, expenses, exchangeRate, darkMode]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true')
      .then(r => r.json())
      .then(data => {
        if (data?.current_weather?.temperature !== undefined) {
          setTokyoWeather({
            temp: Math.round(data.current_weather.temperature),
            desc: '현재 도쿄 실시간 기온',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !activeDeepZoomMapId && !mobileModalOpen) {
        e.preventDefault();
        setView('schedule');
        document.getElementById('global-schedule-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDeepZoomMapId, mobileModalOpen]);

  const currentDayData = useMemo(
    () => TRIP_DATA.days.find(d => d.id === day) || TRIP_DATA.days[0],
    [day]
  );

  const dayMaps = useMemo(
    () => ROUTE_MAPS.filter(m => m.day === day),
    [day]
  );

  const totalItemsCount = useMemo(
    () => TRIP_DATA.days.reduce((acc, d) => acc + d.items.length, 0),
    []
  );
  const totalCompletedCount = useMemo(
    () => TRIP_DATA.days.reduce((acc, d) => acc + d.items.filter(i => completed[i.id]).length, 0),
    [completed]
  );

  const dayCompletedCount = currentDayData.items.filter(i => completed[i.id]).length;
  const nextPendingItem = currentDayData.items.find(i => !completed[i.id]);

  const dDayLabel = useMemo(() => {
    const start = new Date('2026-11-22T00:00:00+09:00');
    const end = new Date('2026-11-25T23:59:59+09:00');
    const now = new Date();
    if (now >= start && now <= end) return '여행 진행 중 ✈️';
    const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0) return `설레는 출발 D-${diff}`;
    return '추억이 된 도쿄 여행';
  }, []);

  const toggleCompleteItem = (itemId) => {
    setCompleted(prev => {
      const nextVal = !prev[itemId];
      const updated = { ...prev, [itemId]: nextVal };
      if (nextVal) {
        const allDoneForDay = currentDayData.items.every(i => updated[i.id]);
        if (allDoneForDay) {
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
          showToast(`🎉 ${day}일차의 모든 일정을 완료했습니다! 멋진 가족 여행이에요!`);
        } else {
          showToast('일정 방문 체크가 저장되었습니다.');
        }
      }
      return updated;
    });
  };

  const toggleCheck = (checkId) => {
    setChecks(prev => {
      const nextVal = !prev[checkId];
      const updated = { ...prev, [checkId]: nextVal };
      if (nextVal) {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
      }
      return updated;
    });
  };

  const speakJp = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  const handleSaveOffline = async () => {
    if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
      showToast('오프라인 저장은 웹 서버 주소로 열었을 때 동작합니다.');
      return;
    }
    showToast('일정과 원본 동선지도 6장을 오프라인 캐시에 저장하는 중입니다…');
    try {
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await navigator.serviceWorker.register('sw.js');
      }
      const readyReg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('sw-ready-timeout')), 15000)),
      ]);
      const worker = readyReg?.active || reg?.active || reg?.waiting || reg?.installing;
      if (!worker) throw new Error('No SW');
      await new Promise((resolve, reject) => {
        const ch = new MessageChannel();
        const timer = setTimeout(() => reject(new Error('timeout')), 60000);
        ch.port1.onmessage = (e) => {
          clearTimeout(timer);
          e.data?.ok ? resolve() : reject(new Error('fail'));
        };
        worker.postMessage({ type: 'CACHE_TRIP' }, [ch.port2]);
      });
      showToast('✅ 오프라인 저장 완료! 인터넷 없이도 일정과 원본 지도 6장을 열 수 있습니다.');
    } catch {
      showToast('브라우저 캐시에 기본 일정이 저장되었습니다. 잠시 후 다시 한 번 눌러주세요.');
    }
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(
      { completed, checks, notes, disneyChecks, customChecklist, expenses, exchangeRate },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `도쿄가족여행-기록백업-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('가족 여행 기록 백업 파일(.json)을 내려받았습니다.');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.completed) setCompleted(parsed.completed);
        if (parsed.checks) setChecks(parsed.checks);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.disneyChecks) setDisneyChecks(parsed.disneyChecks);
        if (parsed.customChecklist) setCustomChecklist(parsed.customChecklist);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
        showToast('✅ 가족 여행 기록을 성공적으로 불러왔습니다!');
      } catch {
        showToast('올바른 백업 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleQuickCopyUrl = async () => {
    const ok = await copyTextWithFallback(DEFAULT_PUBLIC_URL);
    if (ok) {
      setCopiedQuick(true);
      showToast('📱 24시간 영구 접속 주소가 복사되었습니다! 카카오톡에 붙여넣어 보세요.');
      setTimeout(() => setCopiedQuick(false), 2200);
    } else {
      setMobileModalOpen(true);
    }
  };

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return TRIP_DATA.days.flatMap(d =>
      d.items
        .filter(item =>
          `${item.title} ${item.jpTitle || ''} ${item.detail} ${item.time} ${item.familyTip || ''}`
            .toLowerCase()
            .includes(q)
        )
        .map(item => ({ item, dayObj: d }))
    );
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8F6F1] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* 좌측 에디토리얼 브랜드 사이드바 */}
      <aside className="hidden lg:flex lg:w-80 xl:w-84 shrink-0 bg-brand-900 text-white flex-col justify-between p-7 sticky top-0 h-screen overflow-y-auto border-r border-brand-800/60 select-none">
        <div className="space-y-5">
          {/* 브랜드 헤더 */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setView('schedule'); setDay(1); }}
              className="flex items-center gap-3 text-left group"
            >
              <span className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center font-serif text-xl font-bold text-amber-300 group-hover:scale-105 transition">
                旅
              </span>
              <div>
                <span className="font-bold text-base tracking-tight block text-white">함께 걷기</span>
                <small className="text-[10px] tracking-widest uppercase text-emerald-300/80 block">
                  TOKYO FAMILY CONCIERGE
                </small>
              </div>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold">
              {dDayLabel}
            </span>
          </div>

          {/* 타이틀 & 설명 */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-semibold text-emerald-200 mb-2.5">
              <span>가족 여행 노트</span>
              <span className="text-amber-300 font-bold">2026.11.22 – 11.25</span>
            </div>
            <h1 className="text-3xl font-serif font-bold leading-tight tracking-tight text-white">
              도쿄,<br />함께 걷기<span className="text-amber-400">.</span>
            </h1>
            <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
              처음 만나는 도쿄의 골목도, 반짝이는 스카이트리와 디즈니씨의 밤도 우리 가족의 속도로 편안하게.
            </p>
          </div>

          {/* 항공·숙소 요약 미니 카드 */}
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <Plane className="w-3.5 h-3.5 text-amber-300" /> 출국 · 귀국
              </span>
              <span className="font-bold text-white">인천 T1 ↔ 나리타 T3</span>
            </div>
            <div className="flex items-center justify-between text-emerald-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <Hotel className="w-3.5 h-3.5 text-amber-300" /> 베이스캠프
              </span>
              <span className="font-bold text-white">T-CAT 도보 3분 숙소</span>
            </div>
            <div className="flex items-center justify-between text-emerald-200 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sun className="w-3.5 h-3.5 text-amber-300" /> {tokyoWeather.desc}
              </span>
              <span className="font-bold text-amber-300">{tokyoWeather.temp}°C</span>
            </div>
          </div>

          {/* 5대 메인 네비게이션 */}
          <nav className="space-y-1.5" aria-label="주요 메뉴">
            {[
              { id: 'schedule', label: '여행 일정 & 타임라인', badge: '4일', icon: Calendar },
              { id: 'maps', label: '인터랙티브 & 동선지도', badge: 'GPS+6장', icon: MapIcon },
              { id: 'concierge', label: '첫 방문 가족 컨시어지', badge: '회화·환율', icon: Compass },
              { id: 'prepare', label: '여행 준비 & 플랜 B', badge: '체크', icon: Briefcase },
              { id: 'original', label: '원본 일정 문서', badge: `${TRIP_DATA.rawParagraphs.length}문단`, icon: BookOpen },
            ].map((nav) => {
              const Icon = nav.icon;
              const active = view === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => { setView(nav.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
                    active
                      ? 'bg-amber-400 text-stone-950 shadow-lg'
                      : 'text-emerald-100/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-stone-950/15 text-stone-950' : 'bg-white/10 text-emerald-200'
                    }`}
                  >
                    {nav.badge}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* 사이드바 내장 핸드폰 즉시 접속 QR 카드 */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-amber-300/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                핸드폰 카메라로 바로 열기
              </span>
              <button
                type="button"
                onClick={() => setMobileModalOpen(true)}
                className="text-[11px] font-bold text-white underline hover:text-amber-300"
              >
                크게 보기 ↗
              </button>
            </div>
            <div className="flex items-center gap-3">
              {miniQrDataUrl && (
                <button
                  type="button"
                  onClick={() => setMobileModalOpen(true)}
                  className="p-1.5 bg-white rounded-xl shrink-0 shadow hover:scale-105 transition"
                  title="QR 코드 크게 보기"
                >
                  <img src={miniQrDataUrl} alt="핸드폰 접속 QR" className="w-16 h-16" />
                </button>
              )}
              <div className="space-y-1.5 min-w-0 flex-1">
                <p className="text-[11px] text-emerald-100 leading-snug">
                  스마트폰 카메라로 스캔하면 LTE/5G/Wi-Fi 어디서나 즉시 접속됩니다.
                </p>
                <button
                  type="button"
                  onClick={handleQuickCopyUrl}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-extrabold flex items-center justify-center gap-1 transition"
                >
                  {copiedQuick ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQuick ? '링크 복사 완료!' : '카톡 공유용 주소 복사'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 사이드바 하단 전체 진행률 */}
        <div className="pt-4 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-200 font-medium">전체 여정 진행률</span>
            <strong className="text-amber-300 font-bold">{totalCompletedCount} / {totalItemsCount} 구간</strong>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${(totalCompletedCount / totalItemsCount) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-emerald-200/70 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            체크·메모·가계부는 기기에 자동 저장됩니다
          </p>
        </div>
      </aside>

      {/* 우측 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
        {/* 상단 글래스모피즘 탑바 */}
        <header className="sticky top-0 z-30 bg-[#F8F6F1]/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800 px-3.5 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => { setView('schedule'); setDay(1); }}
              className="lg:hidden inline-flex items-center gap-2 font-bold text-sm text-emerald-950 dark:text-emerald-300 truncate"
            >
              <span className="w-7 h-7 rounded-lg bg-emerald-900 text-amber-300 font-serif flex items-center justify-center text-sm shrink-0">
                旅
              </span>
              <span className="truncate">도쿄, 함께 걷기</span>
            </button>
            <span className="lg:hidden px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[10px] font-extrabold shrink-0">
              {tokyoWeather.temp}°C
            </span>
            <span className="hidden lg:inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-stone-500 dark:text-stone-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              TOKYO FAMILY TRAVEL COMPANION · MOBILE & WEB EDITION
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 핸드폰 접속 QR & 앱 설치 모달 열기 버튼 */}
            <button
              type="button"
              onClick={() => setMobileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>핸드폰으로 열기 (QR)</span>
            </button>

            {/* 빠른 일본어 회화 바로가기 버튼 */}
            <button
              type="button"
              onClick={() => { setView('concierge'); setConciergeSubTab('phrases'); }}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold hover:bg-amber-200/80 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>현지 회화 카드</span>
            </button>

            {/* 온라인/오프라인 배지 */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                isOnline
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? '온라인' : '오프라인'}</span>
            </span>

            {/* 오프라인 저장 버튼 */}
            <button
              type="button"
              onClick={handleSaveOffline}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-200 hover:bg-stone-100 transition shadow-sm"
              title="오프라인 저장"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden sm:inline">오프라인 저장</span>
            </button>

            {/* 다크 모드(야경 모드) 토글 */}
            <button
              type="button"
              onClick={() => setDarkMode(d => !d)}
              className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-700 text-stone-700 dark:text-amber-300 hover:bg-stone-100 transition shadow-sm"
              aria-label="테마 전환"
              title={darkMode ? '낮 테마로 전환' : '야경(다크) 테마로 전환'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* 메인 컨텐츠 컨테이너 */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
          {/* 상단 핸드폰 즉시 접속 안내 배너 (모바일은 1~2줄 콤팩트 카드, PC는 QR 포함 풀 배너) */}
          <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border border-emerald-700/40">
            <div className="flex items-center gap-3.5 min-w-0">
              {miniQrDataUrl && (
                <button
                  type="button"
                  onClick={() => setMobileModalOpen(true)}
                  className="hidden sm:block p-1.5 bg-white rounded-2xl shrink-0 shadow-md hover:scale-105 transition"
                  title="클릭하여 QR 코드 크게 보기"
                >
                  <img src={miniQrDataUrl} alt="핸드폰 접속 QR" className="w-16 h-16" />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-extrabold uppercase shrink-0">
                    24H MOBILE READY
                  </span>
                  <span className="text-[11px] sm:text-xs text-emerald-200 font-semibold font-mono truncate max-w-[210px] sm:max-w-none">
                    {DEFAULT_PUBLIC_URL}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-bold mt-1 truncate sm:whitespace-normal">
                  핸드폰·카톡 어디서나 24시간 바로 열리는 영구 가이드 주소
                </h3>
                <p className="hidden sm:block text-xs text-emerald-100/85 mt-0.5">
                  아이폰·갤럭시 어디서든 설치 없이 바로 열리며, <b>[홈 화면에 추가]</b>를 누르면 스마트폰 전용 앱처럼 전체화면으로 동작합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickCopyUrl}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur transition"
              >
                {copiedQuick ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span>{copiedQuick ? '복사됨!' : '접속 주소 복사'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold shadow transition"
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>QR & 앱 설치법</span>
              </button>
            </div>
          </div>

          {/* 페이지 히어로 배너 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-stone-200/80 dark:border-stone-800">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                {view === 'schedule' && 'FOUR DAYS, A THOUSAND MEMORIES'}
                {view === 'maps' && 'INTERACTIVE GPS & ORIGINAL ROUTE MAPS'}
                {view === 'concierge' && 'FIRST-TIME TOKYO FAMILY TOOLKIT'}
                {view === 'prepare' && 'SMART CHECKLIST & PLAN B'}
                {view === 'original' && 'COMPLETE SOURCE DOCUMENT ARCHIVE'}
              </span>
              <h2 className="text-xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                {view === 'schedule' && '우리 가족의 도쿄 여행 일정'}
                {view === 'maps' && '길 위에서 만나는 도쿄 동선 센터'}
                {view === 'concierge' && '도쿄 첫 방문 가족 실전 컨시어지'}
                {view === 'prepare' && '가볍게 떠나기 위한 준비와 약속'}
                {view === 'original' && '처음 적어 둔 여행 계획 원본'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
                {view === 'schedule' && '시간대별 동선, 지하철 노선 색상, 현지 일본어 지명과 플랜 B까지 한눈에 확인하세요.'}
                {view === 'maps' && '실시간 GPS 인터랙티브 지도와 직접 제작한 6장의 고해상도 원본 동선지도를 함께 제공합니다.'}
                {view === 'concierge' && '원어민 음성 회화 카드, 지하철 5대 노선 가이드, 디즈니씨 DPA 공략, 엔화 가계부를 활용하세요.'}
                {view === 'prepare' && '일차별 필수 체크리스트와 현지 상황별 대안(플랜 B)을 점검하세요.'}
                {view === 'original' && `원본 Word 문서의 ${TRIP_DATA.rawParagraphs.length}개 문단 전체를 생략 없이 그대로 열람하고 내려받을 수 있습니다.`}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-3 self-start md:self-auto">
              <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 border-emerald-900/20 dark:border-emerald-400/20 bg-white/70 dark:bg-stone-900/70 text-emerald-950 dark:text-emerald-300 rotate-3 shadow-sm">
                <span className="text-[9px] font-extrabold tracking-widest">TOKYO</span>
                <strong className="text-lg font-serif leading-none my-0.5">東京</strong>
                <span className="text-[8px] font-bold text-stone-500">11.22–25</span>
              </div>
            </div>
          </div>

          {/* 1~4일차 날짜 선택 탭 (일정 및 지도 뷰에서 표시) */}
          {(view === 'schedule' || view === 'maps') && (
            <div
              role="tablist"
              aria-label="여행 날짜 선택"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5"
            >
              {TRIP_DATA.days.map((d) => {
                const isSelected = day === d.id;
                const dDone = d.items.filter(i => completed[i.id]).length;
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setDay(d.id);
                      setSelectedItemId(null);
                      setQuery('');
                    }}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-lg scale-[1.01]'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200/80 dark:border-stone-800 hover:border-emerald-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-amber-400 text-stone-950' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        DAY 0{d.id}
                      </span>
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                        {dDone}/{d.items.length} 완료
                      </span>
                    </div>
                    <div className="mt-2">
                      <strong className="text-sm sm:text-base font-bold block">{d.shortDate}</strong>
                      <span className={`text-xs block mt-0.5 truncate ${isSelected ? 'text-emerald-100' : 'text-stone-500 dark:text-stone-400'}`}>
                        {d.dayTheme}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ==================== VIEW 1: 여행 일정 & 타임라인 ==================== */}
          {view === 'schedule' && (
            <div className="space-y-5 sm:space-y-6">
              {/* 검색창 & 하루 경유지 브레드크럼 */}
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <label className="relative flex-1 flex items-center">
                  <Search className="w-4 h-4 text-stone-400 absolute left-4 pointer-events-none" />
                  <input
                    id="global-schedule-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="전체 4일 일정·장소·지하철 노선·팁 검색 (단축키 /)"
                    className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <kbd className="hidden sm:inline-block absolute right-3.5 px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 rounded border border-stone-200 dark:border-stone-700">
                    /
                  </kbd>
                </label>

                <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1">
                  {currentDayData.route.map((stop, idx) => (
                    <React.Fragment key={stop}>
                      <span className="shrink-0 px-2.5 py-1 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-sm">
                        {stop}
                      </span>
                      {idx < currentDayData.route.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {query.trim() ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-emerald-900 text-white text-xs sm:text-sm">
                    <span>
                      전체 4일 일정에서 <b>‘{query}’</b> 검색 결과 <b>{searchMatches.length}건</b>을 찾았습니다.
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-bold text-xs"
                    >
                      검색 초기화
                    </button>
                  </div>

                  {searchMatches.length === 0 ? (
                    <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-2">
                      <Search className="w-8 h-8 text-stone-400 mx-auto" />
                      <h3 className="font-bold text-base">일치하는 일정이 없습니다</h3>
                      <p className="text-xs text-stone-500">스카이트리, 전망대, 소라마치, PASMO, 한조몬선, 아사쿠사, DPA 등 다른 단어로 검색해 보세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {searchMatches.map(({ item, dayObj }) => (
                        <div
                          key={item.id}
                          className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold">
                              DAY {dayObj.id} ({dayObj.shortDate}) · {item.time}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDay(dayObj.id);
                                setQuery('');
                                setSelectedItemId(item.id);
                              }}
                              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                            >
                              <span>해당 날짜 일정으로 이동</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h4 className="font-bold text-base">{item.title}</h4>
                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                            {item.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  {/* 좌측 7컬럼: 상세 타임라인 */}
                  <div className="xl:col-span-7 space-y-4 sm:space-y-5">
                    {/* 선택된 날짜 요약 카드 */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold">
                            DAY 0{currentDayData.id} · {currentDayData.label}
                          </span>
                          <span className="text-xs text-emerald-200 font-medium">
                            {currentDayData.weatherHint}
                          </span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-serif font-bold">{currentDayData.title}</h3>
                        <p className="text-xs sm:text-sm text-emerald-100/90">{currentDayData.summary}</p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
                        <span className="text-[11px] text-emerald-200 font-semibold">오늘의 진행</span>
                        <strong className="text-lg font-extrabold text-amber-300">
                          {dayCompletedCount} / {currentDayData.items.length} 완료
                        </strong>
                      </div>
                    </div>

                    {/* 1일차 스카이트리 전망대 야경 특별 배너 */}
                    {currentDayData.id === 1 && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 text-white shadow-md flex flex-wrap items-center justify-between gap-3 border border-sky-700/40">
                        <div className="flex items-center gap-3 min-w-0">
                          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm">
                              1일차 하이라이트 · 도쿄 스카이트리 전망대 야경 관람 (19:20~20:40)
                            </h4>
                            <p className="text-xs text-sky-100/90 mt-0.5">
                              4F 입구 · 19:30 사전예약 QR 권장(현장 구매 시 +500엔) · 350m 덴보 데크 / 450m 덴보 회랑 · 최종 입장 21:00
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemId('d1-sky');
                              document.getElementById('item-d1-sky')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold transition"
                          >
                            전망대 일정 보기 →
                          </button>
                          <button
                            type="button"
                            onClick={() => { setView('concierge'); setConciergeSubTab('phrases'); }}
                            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
                          >
                            입장 일본어 회화
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 3일차 디즈니씨 특별 배너 */}
                    {currentDayData.id === 3 && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white shadow-md flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">도쿄 디즈니씨 25주년 · 시간대별 DPA 공략 보드가 준비되어 있습니다!</h4>
                            <p className="text-xs text-indigo-100">09:00 입장 즉시 겨울왕국 DPA 결제부터 야간 쇼까지 세부 체크리스트를 열어보세요.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setView('concierge'); setConciergeSubTab('disney'); }}
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold shrink-0 transition"
                        >
                          디즈니 마스터 공략 열기 →
                        </button>
                      </div>
                    )}

                    {/* 타임라인 아이템 리스트 */}
                    <div className="space-y-4">
                      {currentDayData.items.map((item, idx) => {
                        const isDone = !!completed[item.id];
                        const isSelected = selectedItemId === item.id;
                        const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.sightseeing;

                        return (
                          <motion.article
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: idx * 0.04 }}
                            id={`item-${item.id}`}
                            className={`rounded-3xl bg-white dark:bg-stone-900 border transition-all p-4 sm:p-6 shadow-sm ${
                              isSelected
                                ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                                : isDone
                                ? 'border-emerald-200/70 dark:border-emerald-900/40 opacity-80'
                                : 'border-stone-200/80 dark:border-stone-800 hover:border-emerald-700/50'
                            }`}
                          >
                            {/* 카드 상단: 시간, 카테고리, 방문 체크 */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-900 dark:bg-stone-800 text-white font-mono text-xs font-extrabold">
                                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                                  {item.time}
                                </span>
                                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${catStyle.bg}`}>
                                  {catStyle.label}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCompleteItem(item.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                  isDone
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                <span>{isDone ? '방문 완료' : '방문 체크'}</span>
                              </button>
                            </div>

                            {/* 제목 및 일본어 표기 + 발음 듣기 */}
                            <div className="mt-3.5 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className={`text-base sm:text-lg font-bold ${isDone ? 'line-through text-stone-400' : 'text-stone-900 dark:text-white'}`}>
                                  <span className="text-emerald-800 dark:text-emerald-400 mr-1.5 font-mono text-sm">
                                    0{idx + 1}.
                                  </span>
                                  {item.title}
                                </h4>
                                {item.jpTitle && (
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                                      {item.jpTitle}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => speakJp(item.jpTitle)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition"
                                      title="일본어 지명 음성으로 듣기"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                      <span>발음</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* 지하철/교통 컬러 배지 */}
                            {item.transitBadges && item.transitBadges.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {item.transitBadges.map((tb, bIdx) => (
                                  <span
                                    key={bIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-stone-800 dark:text-stone-200"
                                  >
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-white shrink-0"
                                      style={{ backgroundColor: tb.color }}
                                    >
                                      {tb.line}
                                    </span>
                                    <span>{tb.text}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 원문 상세 내용 불릿 */}
                            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                              {(item.bullets || [item.detail]).map((bullet, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 dark:bg-emerald-400 mt-2 shrink-0" />
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>

                            {/* 도쿄 첫 방문 가족 컨시어지 팁 */}
                            {item.familyTip && (
                              <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2.5">
                                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
                                  <strong className="font-bold text-amber-900 dark:text-amber-300 mr-1">첫 방문 가족 팁:</strong>
                                  {item.familyTip}
                                </p>
                              </div>
                            )}

                            {/* 카드 하단 액션 버튼 바 */}
                            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSidebarMapTab('interactive');
                                    setSelectedItemId(item.id);
                                    document.getElementById('day-smart-map-center')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-300 text-xs font-bold transition"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>동선 맵 위치 보기</span>
                                </button>

                                {item.mapIds && item.mapIds.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setActiveDeepZoomMapId(item.mapIds[0])}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold transition"
                                  >
                                    <MapIcon className="w-3.5 h-3.5 text-amber-600" />
                                    <span>원본 동선지도 확대</span>
                                  </button>
                                )}
                              </div>

                              {item.placeQuery && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeQuery)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                                >
                                  <span>Google 지도 길찾기</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>

                    {/* 날짜별 가족 여행 메모장 */}
                    <section className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StickyNote className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <h4 className="font-bold text-sm sm:text-base">{currentDayData.id}일차 우리 가족 여행 메모</h4>
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          이 기기에 자동 저장됨
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={notes[currentDayData.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [currentDayData.id]: e.target.value }))}
                        placeholder={`${currentDayData.id}일차에 기억하고 싶은 순간이나 예약 번호, 산 물건 등을 자유롭게 적어보세요…`}
                        className="w-full p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      />
                    </section>
                  </div>

                  {/* 우측 5컬럼: 스티키 듀얼 맵 & 진행 브리핑 사이드바 */}
                  <aside id="day-smart-map-center" className="xl:col-span-5 xl:sticky xl:top-20 space-y-5">
                    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>DAY {currentDayData.id} 스마트 동선 센터</span>
                        </h3>

                        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setSidebarMapTab('interactive')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              sidebarMapTab === 'interactive'
                                ? 'bg-emerald-800 text-white shadow'
                                : 'text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            실시간 지도
                          </button>
                          <button
                            type="button"
                            onClick={() => setSidebarMapTab('original')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              sidebarMapTab === 'original'
                                ? 'bg-emerald-800 text-white shadow'
                                : 'text-stone-600 dark:text-stone-300'
                            }`}
                          >
                            원본 약도 ({dayMaps.length})
                          </button>
                        </div>
                      </div>

                      {sidebarMapTab === 'interactive' ? (
                        <InteractiveMap
                          dayData={currentDayData}
                          completed={completed}
                          selectedItemId={selectedItemId}
                          onSelectItem={(id) => {
                            setSelectedItemId(id);
                            document.getElementById(`item-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        />
                      ) : dayMaps.length > 0 ? (
                        <div className="space-y-3">
                          {dayMaps.map((m) => (
                            <div
                              key={m.id}
                              className="group relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                            >
                              <button
                                type="button"
                                onClick={() => setActiveDeepZoomMapId(m.id)}
                                className="w-full text-left block"
                              >
                                <img
                                  src={m.src}
                                  alt={m.title}
                                  className="w-full h-56 object-cover object-top group-hover:scale-[1.02] transition duration-300"
                                  loading="lazy"
                                />
                                <div className="p-3.5 bg-white dark:bg-stone-900 flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                                      {m.type}
                                    </span>
                                    <h4 className="font-bold text-xs sm:text-sm">{m.title}</h4>
                                    <p className="text-[11px] text-stone-500">{m.subtitle}</p>
                                  </div>
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-900 text-white text-xs font-bold shrink-0">
                                    딥줌 확대 ↗
                                  </span>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-stone-50 dark:bg-stone-800/50 text-center space-y-2">
                          <MapIcon className="w-7 h-7 text-stone-400 mx-auto" />
                          <h4 className="font-bold text-sm">4일차는 원본 동선지도가 없습니다</h4>
                          <p className="text-xs text-stone-500">
                            [실시간 지도] 탭에서 T-CAT 및 나리타 공항 위치를 확인하실 수 있습니다.
                          </p>
                        </div>
                      )}

                      {dayMaps.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {dayMaps.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setActiveDeepZoomMapId(m.id)}
                              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-bold text-stone-700 dark:text-stone-200 flex items-center justify-between transition"
                            >
                              <span>{m.type} 크게 보기</span>
                              <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 다음 미완료 일정 & 원문 플랜 B 브리핑 카드 */}
                    <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                          NEXT UP ON DAY {currentDayData.id}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base mt-1">
                          {nextPendingItem ? nextPendingItem.title : '오늘의 모든 일정을 완료했습니다!'}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {nextPendingItem
                            ? `${nextPendingItem.time} · ${nextPendingItem.locationLabel || ''}`
                            : '아래 메모장에 오늘 가족과 함께한 소중한 순간을 남겨보세요.'}
                        </p>
                      </div>

                      {TRIP_DATA.notes
                        .filter(n => n.day === currentDayData.id)
                        .map(n => (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-1"
                          >
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-300">
                              TRAVEL NOTE · {n.badge || '플랜 B'}
                            </span>
                            <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">{n.title}</h5>
                            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{n.text}</p>
                          </div>
                        ))}
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

          {/* ==================== VIEW 2: 인터랙티브 & 원본 동선지도 센터 ==================== */}
          {view === 'maps' && (
            <div className="space-y-8">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-serif font-bold">
                      {currentDayData.id}일차 실시간 GPS 인터랙티브 지도 ({currentDayData.shortDate})
                    </h3>
                    <p className="text-xs text-stone-500">
                      번호가 적힌 핀을 누르면 해당 시간의 일정 요약과 Google 지도 내비게이션 바로가기가 열립니다.
                    </p>
                  </div>
                </div>
                <InteractiveMap
                  dayData={currentDayData}
                  completed={completed}
                  selectedItemId={selectedItemId}
                  onSelectItem={setSelectedItemId}
                />
              </section>

              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      ORIGINAL HIGH-RESOLUTION ROUTE MAPS
                    </span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold mt-0.5">
                      원본 동선지도 6장 전체 아카이브 (딥줌 뷰어 지원)
                    </h3>
                    <p className="text-xs text-stone-500">
                      카드를 누르면 마우스 휠·두 손가락 핀치로 500%까지 확대 가능한 전용 딥줌(Deep-Zoom) 뷰어가 열립니다.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {ROUTE_MAPS.map((m) => (
                    <article
                      key={m.id}
                      className={`rounded-3xl bg-white dark:bg-stone-900 border overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between ${
                        m.day === day
                          ? 'border-emerald-700 ring-2 ring-emerald-700/20'
                          : 'border-stone-200/80 dark:border-stone-800'
                      }`}
                    >
                      <div>
                        <button
                          type="button"
                          onClick={() => setActiveDeepZoomMapId(m.id)}
                          className="w-full relative group overflow-hidden bg-stone-100 block"
                        >
                          <img
                            src={m.src}
                            alt={m.title}
                            className="w-full h-56 object-cover object-top group-hover:scale-105 transition duration-500"
                            loading="lazy"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-stone-900/85 text-white text-[11px] font-extrabold backdrop-blur">
                            DAY {m.day} · {m.type}
                          </span>
                          <span className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-emerald-800/95 text-white text-xs font-bold shadow-lg">
                            클릭하여 딥줌 확대 ↗
                          </span>
                        </button>

                        <div className="p-5 space-y-2.5">
                          <h4 className="font-bold text-base text-stone-900 dark:text-white">{m.title}</h4>
                          <p className="text-xs text-stone-500 dark:text-stone-400">{m.subtitle}</p>
                          <ul className="space-y-1 pt-1">
                            {m.highlights.map((h, i) => (
                              <li key={i} className="text-xs text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDeepZoomMapId(m.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition"
                        >
                          원본 크게 보기
                        </button>
                        <a
                          href={m.src}
                          download={`${m.title}.png`}
                          className="py-2.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold transition"
                        >
                          PNG 저장 ↓
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ==================== VIEW 3: 도쿄 첫 방문 가족 컨시어지 ==================== */}
          {view === 'concierge' && (
            <ConciergeToolkit
              activeSubTab={conciergeSubTab}
              setActiveSubTab={setConciergeSubTab}
              disneyChecks={disneyChecks}
              onToggleDisneyCheck={(stepId) =>
                setDisneyChecks(prev => ({ ...prev, [stepId]: !prev[stepId] }))
              }
              expenses={expenses}
              onAddExpense={(exp) => {
                setExpenses(prev => [exp, ...prev]);
                showToast('가계부에 새 지출 내역이 추가되었습니다.');
              }}
              onDeleteExpense={(id) => {
                setExpenses(prev => prev.filter(e => e.id !== id));
              }}
              exchangeRate={exchangeRate}
              setExchangeRate={setExchangeRate}
              onOpenMap={(mapId) => setActiveDeepZoomMapId(mapId)}
            />
          )}

          {/* ==================== VIEW 4: 여행 준비 & 체크리스트 ==================== */}
          {view === 'prepare' && (
            <PrepareView
              checks={checks}
              customChecklist={customChecklist}
              onToggleCheck={toggleCheck}
              onAddCustomCheck={(item) => {
                setCustomChecklist(prev => [...prev, item]);
                showToast('우리 가족 추가 준비물이 등록되었습니다.');
              }}
              onDeleteCustomCheck={(id) => {
                setCustomChecklist(prev => prev.filter(c => c.id !== id));
              }}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onSaveOffline={handleSaveOffline}
            />
          )}

          {/* ==================== VIEW 5: 원본 일정 문서 아카이브 ==================== */}
          {view === 'original' && <OriginalDocumentView />}

          {/* 푸터 */}
          <footer className="pt-8 pb-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
            <span>도쿄, 함께 걷기 · 우리 가족 여행 컨시어지 (2026.11.22 – 11.25)</span>
            <span>원문 일정 {TRIP_DATA.rawParagraphs.length}문단 & 원본 동선지도 6장 100% 보존 · Mobile & Web Ready</span>
          </footer>
        </main>
      </div>

      {/* 모바일 하단 고정 5탭 네비게이션 독 (아이폰/갤럭시 한 손 조작 최적화) */}
      <nav
        aria-label="모바일 하단 메뉴"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200/90 dark:border-stone-800 grid grid-cols-5 px-1.5 pt-1.5 safe-bottom shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
      >
        {[
          { id: 'schedule', label: '여행일정', icon: Calendar },
          { id: 'maps', label: '동선지도', icon: MapIcon },
          { id: 'concierge', label: '컨시어지', icon: Compass },
          { id: 'prepare', label: '준비·체크', icon: Briefcase },
          { id: 'original', label: '원본문서', icon: BookOpen },
        ].map((nav) => {
          const Icon = nav.icon;
          const active = view === nav.id;
          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => { setView(nav.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl text-[11px] font-extrabold transition ${
                active
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-amber-300' : ''}`} />
              <span>{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 고해상도 원본 동선지도 딥줌 모달 */}
      {activeDeepZoomMapId && (
        <DeepZoomMapModal
          activeMapId={activeDeepZoomMapId}
          onClose={() => setActiveDeepZoomMapId(null)}
          onSelectMap={(id) => setActiveDeepZoomMapId(id)}
        />
      )}

      {/* 핸드폰 접속 QR 코드 & 모바일 앱 설치 안내 모달 */}
      <MobileAccessModal
        isOpen={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* 토스트 알림 */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-md px-4 py-3 rounded-2xl bg-stone-900 text-white text-xs sm:text-sm font-semibold shadow-2xl border border-stone-700 flex items-center gap-2.5"
            role="status"
            aria-live="polite"
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
