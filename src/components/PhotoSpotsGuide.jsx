import React, { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import {
  Camera, Search, Volume2, MapPin, Navigation, ExternalLink, Maximize2,
  X, ChevronLeft, ChevronRight, Sparkles, Hotel, Calendar, Info, CheckCircle2
} from 'lucide-react';
import { PHOTO_CATEGORIES, PHOTO_SPOTS } from '../data/photoSpotsData';

/**
 * 데이터 문자열 내 **강조** 구문을 JSX <strong> 태그로 변환해 가독성을 높이는 헬퍼
 */
function renderBoldText(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-stone-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function PhotoLightboxModal({
  activeSpotId,
  onClose,
  onSelectSpot,
  onSpeakJp,
  onJumpToSchedule,
}) {
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const currentIndex = PHOTO_SPOTS.findIndex((s) => s.id === activeSpotId);
  const spot = currentIndex >= 0 ? PHOTO_SPOTS[currentIndex] : null;

  useEffect(() => {
    setActiveSubIdx(0);
  }, [activeSpotId]);

  useEffect(() => {
    if (!spot) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        const prev = PHOTO_SPOTS[(currentIndex - 1 + PHOTO_SPOTS.length) % PHOTO_SPOTS.length];
        onSelectSpot(prev.id);
      } else if (e.key === 'ArrowRight') {
        const next = PHOTO_SPOTS[(currentIndex + 1) % PHOTO_SPOTS.length];
        onSelectSpot(next.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spot, currentIndex, onClose, onSelectSpot]);

  if (!spot) return null;

  const gallery = spot.extraImages?.length
    ? spot.extraImages
    : [{ label: spot.pointType, src: spot.image, alt: spot.imageAlt || spot.title }];
  const activeImg = gallery[activeSubIdx] || gallery[0];
  const prevSpot = PHOTO_SPOTS[(currentIndex - 1 + PHOTO_SPOTS.length) % PHOTO_SPOTS.length];
  const nextSpot = PHOTO_SPOTS[(currentIndex + 1) % PHOTO_SPOTS.length];
  const gmapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.placeQuery || spot.title)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${spot.title} 현장 실물사진 크게 보기`}
    >
      <div
        className="max-w-4xl w-full rounded-3xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <header className="px-4 sm:px-6 py-3.5 bg-stone-900 text-white flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-stone-950 text-[11px] font-extrabold shrink-0">
              DAY {spot.day} · #{String(spot.order).padStart(2, '0')}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-800 text-emerald-100 text-[11px] font-bold shrink-0">
              {spot.pointType}
            </span>
            <span className="text-xs text-stone-300 font-mono truncate">{spot.time}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-rose-600 flex items-center justify-center text-white transition shrink-0"
            aria-label="사진 창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 실물사진 뷰포트 */}
        <div className="relative bg-stone-950 flex items-center justify-center">
          <img
            src={activeImg.src}
            alt={activeImg.alt || spot.imageAlt || spot.title}
            className="w-full max-h-[54vh] object-contain"
          />

          <button
            type="button"
            onClick={() => onSelectSpot(prevSpot.id)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-700 text-white border border-white/15 flex items-center justify-center shadow-lg transition"
            title={`이전: ${prevSpot.title}`}
            aria-label="이전 현장 사진"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectSpot(nextSpot.id)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-700 text-white border border-white/15 flex items-center justify-center shadow-lg transition"
            title={`다음: ${nextSpot.title}`}
            aria-label="다음 현장 사진"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-stone-950/75 text-white text-[11px] font-bold">
            {currentIndex + 1} / {PHOTO_SPOTS.length}
          </span>
        </div>

        {/* 멀티 사진 각도 전환 바 */}
        {gallery.length > 1 && (
          <div className="px-4 sm:px-6 py-2.5 bg-stone-900/95 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-300 mr-1">
              실물 {gallery.length}컷 전환:
            </span>
            {gallery.map((g, idx) => (
              <button
                key={g.src}
                type="button"
                onClick={() => setActiveSubIdx(idx)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  idx === activeSubIdx
                    ? 'bg-amber-400 text-stone-950 shadow'
                    : 'bg-white/10 text-stone-200 hover:bg-white/20'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        {/* 상세 안내 내용 */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[42vh] overflow-y-auto">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
              {spot.title}
            </h3>
            {spot.jpSign && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                  {spot.jpSign}
                </span>
                {onSpeakJp && (
                  <button
                    type="button"
                    onClick={() => onSpeakJp(spot.jpSign)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>일본어 발음</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {spot.photoNote && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/50 flex items-start gap-2 text-xs text-sky-950 dark:text-sky-200">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <span>{spot.photoNote}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block text-emerald-900 dark:text-emerald-300 mb-0.5">
                현장에서 찾는 표지판 · 위치
              </strong>
              <span className="text-stone-700 dark:text-stone-200">{renderBoldText(spot.whereToFind)}</span>
            </div>
          </div>

          <ol className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
            {spot.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-900 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{renderBoldText(step)}</span>
              </li>
            ))}
          </ol>

          {spot.proTip && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2 text-xs text-stone-700 dark:text-stone-200">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong className="text-amber-900 dark:text-amber-300 mr-1">실전 팁:</strong>
                {renderBoldText(spot.proTip)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {onJumpToSchedule && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onJumpToSchedule(spot.day, spot.itemId);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{spot.day}일차 일정으로 이동</span>
                </button>
              )}
              <a
                href={gmapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
              >
                <span>Google 지도 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <a
              href={spot.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-stone-400 hover:text-emerald-700 underline"
            >
              사진 출처: {spot.credit}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhotoSpotsGuide({
  dayFilter,
  setDayFilter,
  focusedSpotId,
  onClearFocus,
  onSpeakJp,
  onJumpToSchedule,
  onOpenLightbox,
  hotelMemo,
  onChangeHotelMemo,
}) {
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const [selectedImgBySpot, setSelectedImgBySpot] = useState({});

  // 타임라인에서 [실물사진 가이드]를 눌러 넘어온 경우 해당 카드로 자동 스크롤
  useEffect(() => {
    if (!focusedSpotId) return;
    const t = setTimeout(() => {
      document.getElementById(`photo-spot-${focusedSpotId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 120);
    return () => clearTimeout(t);
  }, [focusedSpotId, dayFilter]);

  const spotFuse = useMemo(
    () =>
      new Fuse(PHOTO_SPOTS, {
        keys: ['title', 'jpSign', 'whereToFind', 'pointType', 'category', 'proTip', 'steps'],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    []
  );

  const filteredSpots = useMemo(() => {
    const q = query.trim();
    const base = q ? spotFuse.search(q).map((r) => r.item) : PHOTO_SPOTS;
    return base.filter((spot) => {
      if (dayFilter !== 'all' && spot.day !== Number(dayFilter)) return false;
      if (category !== '전체' && spot.category !== category) return false;
      return true;
    });
  }, [dayFilter, category, query, spotFuse]);

  const dayCounts = useMemo(() => {
    const counts = { all: PHOTO_SPOTS.length, 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const s of PHOTO_SPOTS) {
      counts[s.day] = (counts[s.day] || 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 상단 소개 배너 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold">
            <Camera className="w-3.5 h-3.5" />
            REAL FIELD PHOTO GUIDE · 총 {PHOTO_SPOTS.length}곳 실물사진
          </span>
          <h3 className="text-lg sm:text-2xl font-serif font-bold">
            사진으로 먼저 익히는 도쿄 현장 실전 가이드
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
            나리타공항 리무진 매표소·승강장·T-CAT 하차장부터 숙소 체크인, PASMO 발매기, 탑승·하차 전철역, 스카이트리 4층 입구와 디즈니씨 게이트까지 실제 현장 사진을 보며 단계별로 따라가세요.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 shrink-0 text-center">
          <div className="px-3 py-2.5 rounded-2xl bg-white/10 border border-white/10">
            <strong className="text-base sm:text-lg font-extrabold text-amber-300 block">
              {PHOTO_SPOTS.length}곳
            </strong>
            <span className="text-[11px] text-emerald-100">현장 실물사진</span>
          </div>
          <div className="px-3 py-2.5 rounded-2xl bg-white/10 border border-white/10">
            <strong className="text-base sm:text-lg font-extrabold text-amber-300 block">
              오프라인
            </strong>
            <span className="text-[11px] text-emerald-100">앱 내장 저장</span>
          </div>
          <div className="px-3 py-2.5 rounded-2xl bg-white/10 border border-white/10">
            <strong className="text-base sm:text-lg font-extrabold text-amber-300 block">
              1~4일차
            </strong>
            <span className="text-[11px] text-emerald-100">일정 연동</span>
          </div>
        </div>
      </div>

      {/* 일차 필터 탭 + 검색창 + 카테고리 필터 */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
          {/* 일차 선택 */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="실물사진 일차 필터">
            {[
              { id: 'all', label: `전체 (${dayCounts.all})` },
              { id: 1, label: `1일차 (${dayCounts[1]})` },
              { id: 2, label: `2일차 (${dayCounts[2]})` },
              { id: 3, label: `3일차 (${dayCounts[3]})` },
              { id: 4, label: `4일차 (${dayCounts[4]})` },
            ].map((tab) => {
              const active = dayFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setDayFilter(tab.id);
                    if (onClearFocus) onClearFocus();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                    active
                      ? 'bg-emerald-900 text-white shadow'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 키워드 검색 */}
          <label className="relative md:w-72 flex items-center">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (onClearFocus) onClearFocus();
              }}
              placeholder="리무진, T-CAT, PASMO, 역 이름 검색..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </label>
        </div>

        {/* 카테고리 칩 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {PHOTO_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  if (onClearFocus) onClearFocus();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                  active
                    ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-50 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 border-stone-200/80 dark:border-stone-700 hover:border-emerald-700/40'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 포토 카드 그리드 */}
      {filteredSpots.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-center space-y-2">
          <Camera className="w-8 h-8 text-stone-400 mx-auto" />
          <h4 className="font-bold text-base">조건에 맞는 현장 사진이 없습니다</h4>
          <p className="text-xs text-stone-500">전체 일차나 다른 카테고리를 선택해 보세요.</p>
          <button
            type="button"
            onClick={() => { setDayFilter('all'); setCategory('전체'); setQuery(''); }}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-900 text-white text-xs font-bold"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredSpots.map((spot) => {
            const isFocused = focusedSpotId === spot.id;
            const gmapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.placeQuery || spot.title)}`;
            const gallery = spot.extraImages?.length
              ? spot.extraImages
              : [{ label: spot.pointType, src: spot.image, alt: spot.imageAlt || spot.title }];
            const selectedIdx = selectedImgBySpot[spot.id] ?? 0;
            const activeImg = gallery[selectedIdx] || gallery[0];

            return (
              <article
                key={spot.id}
                id={`photo-spot-${spot.id}`}
                className={`rounded-3xl bg-white dark:bg-stone-900 border overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  isFocused
                    ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-lg'
                    : 'border-stone-200/80 dark:border-stone-800'
                }`}
              >
                <div>
                  {/* 상단 실물사진 */}
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(spot.id)}
                    className="w-full relative group overflow-hidden bg-stone-200 dark:bg-stone-800 block aspect-[16/10]"
                    title="클릭하여 크게 보기"
                  >
                    <img
                      src={activeImg.src}
                      alt={activeImg.alt || spot.imageAlt || spot.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-2 bg-gradient-to-b from-black/55 via-black/20 to-transparent">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-stone-950 text-[11px] font-extrabold shadow">
                          DAY {spot.day} · #{String(spot.order).padStart(2, '0')}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-stone-950/80 text-white text-[11px] font-bold backdrop-blur">
                          {spot.pointType}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-stone-950/75 text-stone-100 font-mono text-[11px] font-bold backdrop-blur">
                        {spot.time}
                      </span>
                    </div>

                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-950/80 group-hover:bg-emerald-800 text-white text-[11px] font-bold backdrop-blur shadow transition">
                      <Maximize2 className="w-3 h-3" />
                      <span>확대 보기</span>
                    </span>
                  </button>

                  {/* 멀티 사진 각도 전환 바 */}
                  {gallery.length > 1 && (
                    <div className="px-4 py-2 bg-stone-100/90 dark:bg-stone-800/80 border-b border-stone-200/70 dark:border-stone-700 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mr-1">
                        실물 {gallery.length}컷:
                      </span>
                      {gallery.map((g, idx) => (
                        <button
                          key={g.src}
                          type="button"
                          onClick={() => setSelectedImgBySpot((prev) => ({ ...prev, [spot.id]: idx }))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                            idx === selectedIdx
                              ? 'bg-emerald-900 text-white shadow-sm'
                              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 hover:border-emerald-600'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 본문 */}
                  <div className="p-5 space-y-3.5">
                    {spot.photoNote && (
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50 flex items-start gap-2 text-[11px] text-sky-950 dark:text-sky-200 leading-relaxed">
                        <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                        <span>{spot.photoNote}</span>
                      </div>
                    )}

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-snug">
                        {spot.title}
                      </h4>
                      {spot.jpSign && (
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                            {spot.jpSign}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSpeakJp(spot.jpSign)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 transition"
                            title="일본어 표지판 음성으로 듣기"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>발음</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 현장에서 찾는 표지판/위치 */}
                    <div className="p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <strong className="text-emerald-900 dark:text-emerald-300 mr-1">
                          현장 위치·표지판:
                        </strong>
                        <span className="text-stone-700 dark:text-stone-200">
                          {renderBoldText(spot.whereToFind)}
                        </span>
                      </div>
                    </div>

                    {/* 단계별 이용 방법 */}
                    <ol className="space-y-2 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                      {spot.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-900 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{renderBoldText(step)}</span>
                        </li>
                      ))}
                    </ol>

                    {/* 실전 팁 */}
                    {spot.proTip && (
                      <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
                          <strong className="font-bold text-amber-900 dark:text-amber-300 mr-1">
                            가족 실전 팁:
                          </strong>
                          {renderBoldText(spot.proTip)}
                        </p>
                      </div>
                    )}

                    {/* 숙소 카드 전용: 우리 가족 예약번호 · 객실/조식 메모 */}
                    {spot.allowCustomHotelMemo && (
                      <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            <Hotel className="w-3.5 h-3.5" />
                            <span>우리 가족 예약번호 · 객실/조식 메모</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>기기 자동 저장</span>
                          </span>
                        </div>
                        <input
                          type="text"
                          value={hotelMemo?.name || ''}
                          onChange={(e) => onChangeHotelMemo({ ...hotelMemo, name: e.target.value })}
                          placeholder="예약 호텔 확정: S-페리아 인 니혼바시 하코자키 (객실 타입/층수 메모)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                        <input
                          type="text"
                          value={hotelMemo?.note || ''}
                          onChange={(e) => onChangeHotelMemo({ ...hotelMemo, note: e.target.value })}
                          placeholder="예약번호 · 조식/체크인 메모 (예: 예약 #123456 · 조식 포함)"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 카드 하단 액션 바 & 출처 */}
                <div className="px-5 pb-4 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onJumpToSchedule(spot.day, spot.itemId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-300 text-xs font-bold transition"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>일정 보기</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLightbox(spot.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold transition"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>크게 보기</span>
                      </button>
                    </div>

                    <a
                      href={gmapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-emerald-800 text-white text-xs font-bold transition"
                    >
                      <span>Google 지도</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-end">
                    <a
                      href={spot.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-stone-400 hover:text-emerald-700 underline"
                    >
                      실물사진 출처: {spot.credit}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
