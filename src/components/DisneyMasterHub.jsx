import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { toast } from 'sonner';
import {
  Sparkles, Timer, Play, RotateCcw, CheckCircle2, Circle, Map, Utensils,
  CloudRain, AlertTriangle, Users, Clock, ShieldCheck, Smartphone
} from 'lucide-react';
import { DISNEY_MASTER_STEPS } from '../data/tripData';
import {
  DISNEY_WAIT_CURVE,
  DISNEY_ATTRACTIONS,
  DISNEY_PRE_CHECKLIST,
  DISNEY_MOBILE_ORDER_SPOTS,
  DISNEY_CLOSURES_AND_25TH,
} from '../data/disneyAndSurvivalData';
import { useTripStore } from '../store/useTripStore';

function formatClock(ms) {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCountdown(diffMs) {
  if (diffMs <= 0) return '00:00';
  const totalSec = Math.floor(diffMs / 1000);
  const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function DisneyMasterHub({ onOpenMap }) {
  const disneyChecks = useTripStore((s) => s.disneyChecks);
  const toggleDisneyCheck = useTripStore((s) => s.toggleDisneyCheck);
  const disneyPreChecks = useTripStore((s) => s.disneyPreChecks);
  const toggleDisneyPreCheck = useTripStore((s) => s.toggleDisneyPreCheck);
  const dpaTimer = useTripStore((s) => s.dpaTimer);
  const startDpaTimer = useTripStore((s) => s.startDpaTimer);
  const updateDpaReturnTime = useTripStore((s) => s.updateDpaReturnTime);
  const resetDpaTimer = useTripStore((s) => s.resetDpaTimer);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [notifiedReady, setNotifiedReady] = useState(false);
  const [attrFilter, setAttrFilter] = useState('all'); // 'all' | 'dpa' | 'family' | 'thrill' | 'indoor'

  useEffect(() => {
    if (!dpaTimer.active) return;
    setNowMs(Date.now());
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [dpaTimer.active, dpaTimer.boughtAt]);

  // 2차 DPA 오픈 가능 시각 계산: (구매시각 + 60분) vs (예약 이용 시작 시각) 중 더 빠른 시각
  const timerStatus = useMemo(() => {
    if (!dpaTimer.active || !dpaTimer.boughtAt) {
      return { ready: false, targetMs: null, remainingMs: 0, reason: '' };
    }
    const sixtyMinMs = dpaTimer.boughtAt + 60 * 60 * 1000;
    let targetMs = sixtyMinMs;
    let reason = '구매 후 60분 경과 기준';

    if (dpaTimer.returnTime && /^\d{2}:\d{2}$/.test(dpaTimer.returnTime)) {
      const [rh, rm] = dpaTimer.returnTime.split(':').map(Number);
      const base = new Date(dpaTimer.boughtAt);
      const returnDate = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
        rh,
        rm,
        0,
        0
      );
      if (returnDate.getTime() >= dpaTimer.boughtAt && returnDate.getTime() < sixtyMinMs) {
        targetMs = returnDate.getTime();
        reason = `이용 시작 시각(${dpaTimer.returnTime}) 기준`;
      }
    }

    const remainingMs = Math.max(0, targetMs - nowMs);
    return {
      ready: remainingMs === 0,
      targetMs,
      remainingMs,
      reason,
    };
  }, [dpaTimer, nowMs]);

  useEffect(() => {
    if (dpaTimer.active && timerStatus.ready && !notifiedReady) {
      setNotifiedReady(true);
      toast.success('지금 2차 DPA(토이 스토리 매니아 등) 구매가 열렸습니다! 앱을 확인하세요.');
    }
    if (!dpaTimer.active || !timerStatus.ready) {
      setNotifiedReady(false);
    }
  }, [dpaTimer.active, timerStatus.ready, notifiedReady]);

  const preDoneCount = DISNEY_PRE_CHECKLIST.filter((c) => disneyPreChecks[c.id]).length;

  const filteredAttractions = useMemo(() => {
    if (attrFilter === 'all') return DISNEY_ATTRACTIONS;
    if (attrFilter === 'indoor') return DISNEY_ATTRACTIONS.filter((a) => a.indoor);
    return DISNEY_ATTRACTIONS.filter((a) => a.category === attrFilter);
  }, [attrFilter]);

  return (
    <div className="space-y-6">
      {/* 1. 상단 25주년 & 크리스마스 마스터 헤더 */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-blue-950 to-slate-900 text-white shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-indigo-700/40">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold">
              DAY 3 MASTER GUIDE · 2026.11.24 (화)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30 text-[11px] font-bold">
              25주년 스파클링 쥬빌리 & 크리스마스
            </span>
          </div>
          <h3 className="text-lg sm:text-2xl font-serif font-bold">
            도쿄 디즈니씨 초정밀 효율 관람 마스터 센터
          </h3>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-3xl">
            2026년 8월 말로 무료 40주년 패스가 종료되고, <b>판타지 스프링스는 일반 티켓으로 자유 입장</b>이 가능합니다. <b>DPA 60분 쿨다운 타이머</b>, <b>시간대별 대기 예측</b>, <b>모바일 오더</b>로 대기 시간을 절반 이하로 줄이세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenMap(5)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur transition"
          >
            <Map className="w-3.5 h-3.5" />
            <span>가는 길 계획표 (#5)</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenMap(6)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold shadow transition"
          >
            <Map className="w-3.5 h-3.5" />
            <span>파크 동선 약도 (#6)</span>
          </button>
        </div>
      </div>

      {/* 2. 실시간 DPA 60분 쿨다운 타이머 + 2차 구매 시각 계산기 */}
      <section className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-amber-300/80 dark:border-amber-800/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5" />
              REAL-TIME DPA 60-MIN COOLDOWN TIMER
            </span>
            <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-0.5">
              유료 DPA 60분 쿨다운 타이머 & 다음 구매 가능 시각 계산기
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              다음 DPA는 <b>「결제 후 60분 뒤」</b> 또는 <b>「예약한 탑승 시작 시각」</b> 중 더 빠른 시간에 열립니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                startDpaTimer('겨울왕국 (프로즌 저니)');
                toast.success('겨울왕국 DPA 60분 쿨다운 타이머를 시작했습니다!');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-extrabold shadow transition"
            >
              <Play className="w-3.5 h-3.5 text-amber-300" />
              <span>겨울왕국 DPA 구매 완료!</span>
            </button>
            <button
              type="button"
              onClick={() => {
                startDpaTimer('토이 스토리 매니아!');
                toast.success('토이 스토리 매니아 DPA 타이머를 시작했습니다!');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5" />
              <span>토이스토리 구매 완료</span>
            </button>
            {dpaTimer.active && (
              <button
                type="button"
                onClick={() => {
                  resetDpaTimer();
                  toast('DPA 타이머를 초기화했습니다.');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-bold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>초기화</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700">
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-300 block">
              예약된 탑승 시작 시각 (선택 입력 · 예: 11:15)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={dpaTimer.returnTime || ''}
                onChange={(e) => updateDpaReturnTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold"
              />
              <span className="text-[11px] text-stone-500">
                10:00 이전 슬롯이면 60분보다 더 빨리 열립니다
              </span>
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900 text-white">
            {dpaTimer.active && dpaTimer.boughtAt ? (
              <>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    기준: {dpaTimer.rideName} ({formatClock(dpaTimer.boughtAt)} 결제)
                  </span>
                  <strong className="text-sm sm:text-base font-bold block">
                    {timerStatus.ready
                      ? '🎉 2차 DPA 지금 바로 구매 가능!'
                      : `다음 구매 오픈 시각: ${formatClock(timerStatus.targetMs)}`}
                  </strong>
                  <span className="text-[11px] text-stone-400 block">{timerStatus.reason}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/10 text-center shrink-0">
                  <span className="text-[10px] text-stone-300 block">남은 시간</span>
                  <strong
                    className={`text-2xl font-mono font-black ${
                      timerStatus.ready ? 'text-emerald-400' : 'text-amber-300'
                    }`}
                  >
                    {timerStatus.ready ? 'OPEN' : formatCountdown(timerStatus.remainingMs)}
                  </strong>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-amber-300 block">타이머 대기 중</span>
                  <p className="text-xs text-stone-300">
                    입장 직후 겨울왕국 DPA를 결제한 뒤 위 버튼을 누르면 2차 DPA(토이스토리) 구매 시각을 자동 카운트다운합니다.
                  </p>
                </div>
                <Clock className="w-7 h-7 text-amber-400 shrink-0" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 전날 밤 5단계 앱·결제 사전 세팅 + Recharts 시간대별 예상 대기시간 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 전날 밤 5단계 사전 세팅 */}
        <section className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                NIGHT BEFORE · PRE-FLIGHT SETUP
              </span>
              <h4 className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                전날 밤(2일차) 필수 앱·결제 세팅 5단계
              </h4>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold shrink-0">
              {preDoneCount} / {DISNEY_PRE_CHECKLIST.length}
            </span>
          </div>

          <div className="space-y-2">
            {DISNEY_PRE_CHECKLIST.map((item) => {
              const done = Boolean(disneyPreChecks[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleDisneyPreCheck(item.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition flex items-start gap-2.5 ${
                    done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 opacity-75'
                      : 'bg-stone-50/70 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-700 hover:border-emerald-600'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-xs font-bold ${done ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recharts 시간대별 대기시간 예측 곡선 */}
        <section className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
                WAIT-TIME STRATEGY CHART (RECHARTS)
              </span>
              <h4 className="text-base font-bold text-stone-900 dark:text-white mt-0.5">
                주요 4대 어트랙션 시간대별 예상 대기시간 (평일 표준 모델)
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                09:05 직후 소어링이 45분 내외로 가장 짧고, 10시 이후부터 120분+로 급증하므로 <b>겨울왕국은 DPA · 소어링은 오픈런</b>이 가장 효율적입니다.
              </p>
            </div>
          </div>

          <div className="w-full h-64 pt-2" aria-label="디즈니씨 시간대별 예상 대기시간 차트">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DISNEY_WAIT_CURVE} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" opacity={0.45} />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#78716c' }} />
                <YAxis unit="분" tick={{ fontSize: 11, fill: '#78716c' }} />
                <Tooltip
                  formatter={(value, name) => [`약 ${value}분`, name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="frozen"
                  name="겨울왕국 (DPA 추천)"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="soaring"
                  name="소어링 (09:05 오픈런)"
                  stroke="#059669"
                  fill="#059669"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="toystory"
                  name="토이스토리 (2차 DPA)"
                  stroke="#d97706"
                  fill="#d97706"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="tower"
                  name="타워 오브 테러"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 4. 테마포트별 어트랙션 & 우선순위 공략 매트릭스 */}
      <section className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              ATTRACTION PRIORITY MATRIX
            </span>
            <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-0.5">
              어트랙션별 DPA 요금 · 신장 제한 · 우천 대응 & 생략 우선순위
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="어트랙션 필터">
            {[
              { id: 'all', label: `전체 (${DISNEY_ATTRACTIONS.length})` },
              { id: 'dpa', label: '핵심 DPA' },
              { id: 'family', label: '가족·아이 추천' },
              { id: 'thrill', label: '스릴 어트랙션' },
              { id: 'indoor', label: '우천·실내 가능' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={attrFilter === tab.id}
                onClick={() => setAttrFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  attrFilter === tab.id
                    ? 'bg-emerald-900 text-white shadow'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAttractions.map((attr) => (
            <div
              key={attr.id}
              className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-900 text-white text-[10px] font-extrabold">
                  {attr.priority}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-stone-200/80 dark:bg-stone-700 text-[10px] font-bold text-stone-700 dark:text-stone-200">
                    {attr.port}
                  </span>
                  {attr.indoor && (
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-[10px] font-bold">
                      실내 OK
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-bold text-sm text-stone-900 dark:text-white">{attr.name}</h5>
                <p className="text-[11px] text-stone-500">{attr.jpName}</p>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold">
                  DPA: {attr.dpaPrice}
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-semibold">
                  신장: {attr.height}
                </span>
                <span className="px-2 py-0.5 rounded bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-semibold">
                  {attr.thrill}
                </span>
              </div>

              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                ⏰ 추천 타이밍: {attr.bestTime}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{attr.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 디즈니 모바일 오더 + 25주년 쇼 · 우천 플랜 B · 운휴 & 미아 합류 안내 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 모바일 오더 4단계 & 식당 3선 */}
        <section className="lg:col-span-6 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
            <Utensils className="w-4 h-4" />
            <h4 className="font-bold text-base text-stone-900 dark:text-white">
              식당 줄 0분! 디즈니 모바일 오더 활용법
            </h4>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            공식 앱 메인 <b>[Disney Mobile Order]</b> → 식당·방문 시간 선택 → 메뉴 결제(신용카드) → 도착 후 <b>[상품 받기(I&apos;m Here)]</b> 버튼을 누르면 대기 줄 없이 카운터에서 바로 픽업합니다.
          </p>

          <div className="space-y-2.5">
            {DISNEY_MOBILE_ORDER_SPOTS.map((spot) => (
              <div
                key={spot.name}
                className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900/50 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-xs sm:text-sm text-stone-900 dark:text-white">{spot.name}</strong>
                  <span className="px-2 py-0.5 rounded bg-orange-600 text-white text-[10px] font-bold shrink-0">
                    {spot.timing}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-orange-900 dark:text-orange-300">{spot.menu}</p>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{spot.tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 25주년 쇼 · 운휴 · 우천 플랜 B · 미아 합류 지점 */}
        <section className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                {DISNEY_CLOSURES_AND_25TH.anniversary.title}
              </h4>
            </div>
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside leading-relaxed">
              {DISNEY_CLOSURES_AND_25TH.anniversary.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200/80 dark:border-rose-900/50 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>방문 당일(2026.11.24) 운휴 시설 주의</span>
            </div>
            {DISNEY_CLOSURES_AND_25TH.closures.map((c) => (
              <p key={c.name} className="text-xs text-stone-700 dark:text-stone-300">
                • <b>{c.name}:</b> {c.note}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-950/25 border border-sky-200/80 dark:border-sky-900/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold text-xs">
                <CloudRain className="w-4 h-4" />
                <span>우천 시 실내 플랜 B</span>
              </div>
              {DISNEY_CLOSURES_AND_25TH.rainPlanB.map((r, i) => (
                <p key={i} className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  • {r}
                </p>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <Users className="w-4 h-4" />
                <span>가족 길 잃었을 때 합류 지점</span>
              </div>
              <p className="text-xs font-bold text-stone-900 dark:text-white leading-relaxed">
                {DISNEY_CLOSURES_AND_25TH.lostChildSpot}
              </p>
              <p className="text-[11px] text-stone-600 dark:text-stone-300">
                입구 진입 직후 하버 크리스마스 트리 앞에서 한 번 위치를 눈으로 맞추고 시작하세요.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 6. 당일 시간대별 9단계 실전 체크보드 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <h4 className="font-bold text-base text-stone-900 dark:text-white">
              당일 현장 9단계 실행 타임보드 (체크 자동 저장)
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            {DISNEY_MASTER_STEPS.filter((_, idx) => disneyChecks[`disney-step-${idx}`]).length} / {DISNEY_MASTER_STEPS.length} 완료
          </span>
        </div>

        <div className="space-y-2.5">
          {DISNEY_MASTER_STEPS.map((step, idx) => {
            const stepId = `disney-step-${idx}`;
            const done = !!disneyChecks[stepId];
            const isCritical = step.type === 'critical';
            return (
              <div
                key={stepId}
                onClick={() => toggleDisneyCheck(stepId)}
                className={`cursor-pointer p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                  done
                    ? 'bg-stone-100/80 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 opacity-75'
                    : isCritical
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-sm'
                    : 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 shadow-sm hover:border-emerald-600'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0"
                  aria-label={`${step.title} 완료 체크`}
                >
                  {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-stone-400" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-stone-900 text-white dark:bg-stone-700">
                      {step.time}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>
                  <h5 className={`font-bold text-sm sm:text-base mt-1.5 ${done ? 'line-through text-stone-400' : 'text-stone-900 dark:text-white'}`}>
                    {step.title}
                  </h5>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
