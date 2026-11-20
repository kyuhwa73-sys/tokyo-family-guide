import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  PhoneCall, ShieldAlert, Car, Maximize2, Volume2, X, Copy, Check,
  Receipt, Train, PlugZap
} from 'lucide-react';
import {
  EMERGENCY_CONTACTS,
  TAXI_EMERGENCY_CARD,
  FIRST_TIME_SURVIVAL_CARDS,
} from '../data/disneyAndSurvivalData';
import { copyTextWithFallback } from './MobileAccessModal';

function renderBoldText(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={idx} className="font-bold text-stone-900 dark:text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export default function SurvivalGuide({ onSpeakJp }) {
  const [taxiModalOpen, setTaxiModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const handleCopyNumber = async (id, num) => {
    const ok = await copyTextWithFallback(num);
    if (ok) {
      setCopiedId(id);
      toast.success(`전화번호 ${num} 을(를) 복사했습니다.`);
      setTimeout(() => setCopiedId(''), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 SOS 배너 & 긴급 택시 복귀 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-950 via-red-950 to-stone-900 text-white shadow-lg space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[11px] font-extrabold">
              <ShieldAlert className="w-3.5 h-3.5" />
              FIRST-TIME TOKYO SURVIVAL &amp; SOS
            </span>
            <h3 className="text-lg sm:text-2xl font-serif font-bold mt-2">
              도쿄 첫 방문 가족 생존 · 매너 · 긴급 SOS 센터
            </h3>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-1 leading-relaxed">
              낯선 도쿄에서 길을 잃거나 여권 분실·발열 등 긴급 상황이 생겨도 당황하지 마세요. 24시간 한국어 상담 번호와 택시 복귀 포인팅 카드가 바로 열립니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EMERGENCY_CONTACTS.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-rose-200 block truncate">{c.label}</span>
                  <strong className="text-base font-mono font-extrabold text-white block">{c.number}</strong>
                  <span className="text-[10px] text-rose-100/80 block leading-snug">{c.desc}</span>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <a
                    href={`tel:${c.number.replace(/[^0-9+]/g, '')}`}
                    className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center transition"
                    title={`${c.number} 전화 걸기`}
                    aria-label={`${c.label} 전화 걸기`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(c.id, c.number)}
                    className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition"
                    title="번호 복사"
                    aria-label={`${c.label} 번호 복사`}
                  >
                    {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 긴급 택시 기사님 보여주기 카드 */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border-2 border-amber-400/80 dark:border-amber-600/60 shadow-md flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[11px] font-extrabold">
                <Car className="w-3.5 h-3.5" />
                긴급 택시 복귀 카드
              </span>
              <span className="text-[11px] font-bold text-stone-400">T-CAT · 스이텐구마에역</span>
            </div>
            <h4 className="font-bold text-base sm:text-lg text-stone-900 dark:text-white">
              {TAXI_EMERGENCY_CARD.title}
            </h4>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              “{TAXI_EMERGENCY_CARD.korean}”
            </p>
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <p className="text-base sm:text-lg font-extrabold text-stone-900 dark:text-white leading-snug">
                {TAXI_EMERGENCY_CARD.japanese}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">{TAXI_EMERGENCY_CARD.romaji}</p>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              💡 {TAXI_EMERGENCY_CARD.tip}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => onSpeakJp(TAXI_EMERGENCY_CARD.japanese)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>음성 재생</span>
            </button>
            <button
              type="button"
              onClick={() => setTaxiModalOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow transition"
            >
              <Maximize2 className="w-4 h-4 text-amber-300" />
              <span>기사님께 크게 보여주기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 2026년 11월 신 면세 환급제 4단계 안내 */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 text-[11px] font-extrabold">
              <Receipt className="w-3.5 h-3.5" />
              {FIRST_TIME_SURVIVAL_CARDS.taxFree2026.badge}
            </span>
            <h4 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white mt-1.5">
              {FIRST_TIME_SURVIVAL_CARDS.taxFree2026.title}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FIRST_TIME_SURVIVAL_CARDS.taxFree2026.steps.map((step, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/50 space-y-2"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-900 text-white text-xs font-extrabold">
                {idx + 1}
              </span>
              <p className="text-xs text-stone-700 dark:text-stone-200 leading-relaxed">
                {renderBoldText(step)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 도쿄 지하철 초보자 5대 함정 + 현지 생활 생존 팁 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-6 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400">
            <Train className="w-5 h-5" />
            <h4 className="font-bold text-base text-stone-900 dark:text-white">
              처음 도쿄 가면 꼭 실수하는 지하철 5대 함정
            </h4>
          </div>
          <div className="space-y-2.5">
            {FIRST_TIME_SURVIVAL_CARDS.subwayTraps.map((trap) => (
              <div
                key={trap.title}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700 space-y-1"
              >
                <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">{trap.title}</h5>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{trap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-6 p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <PlugZap className="w-5 h-5" />
            <h4 className="font-bold text-base text-stone-900 dark:text-white">
              출국 전·현지 필수 생활 팁 (전압 · ATM · 배터리 · eSIM)
            </h4>
          </div>
          <div className="space-y-2.5">
            {FIRST_TIME_SURVIVAL_CARDS.dailyTips.map((tip) => (
              <div
                key={tip.title}
                className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-1"
              >
                <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white">{tip.title}</h5>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 전체화면 택시 기사님 포인팅 모달 */}
      {taxiModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setTaxiModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="택시 기사님께 보여주기"
        >
          <div
            className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white text-stone-900 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-extrabold">
                택시 기사님께 보여주세요 · TAXI POINTING CARD
              </span>
              <button
                type="button"
                onClick={() => setTaxiModalOpen(false)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border-2 border-emerald-800/20 text-center space-y-4">
              <p className="text-2xl sm:text-4xl font-extrabold text-stone-950 leading-snug break-keep">
                {TAXI_EMERGENCY_CARD.japanese}
              </p>
              <p className="text-sm sm:text-base text-emerald-800 font-bold">
                {TAXI_EMERGENCY_CARD.romaji}
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-base font-bold text-stone-700">“{TAXI_EMERGENCY_CARD.korean}”</p>
              <p className="text-xs text-stone-500">{TAXI_EMERGENCY_CARD.tip}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onSpeakJp(TAXI_EMERGENCY_CARD.japanese)}
                className="flex-1 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <Volume2 className="w-5 h-5" />
                <span>일본어 음성 크게 재생</span>
              </button>
              <button
                type="button"
                onClick={() => setTaxiModalOpen(false)}
                className="px-6 py-3 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
