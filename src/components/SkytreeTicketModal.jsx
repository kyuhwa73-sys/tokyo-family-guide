import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Ticket, ExternalLink, X, CheckCircle2, Circle, Sparkles, Calculator,
  QrCode, Copy, Check, ShieldCheck, AlertCircle, Clock, Users, Minus, Plus,
  Wallet, Info
} from 'lucide-react';
import {
  SKYTREE_TICKET_PLANS,
  SKYTREE_BOOKING_CHANNELS,
  SKYTREE_OFFICIAL_HELP_LINKS,
  SKYTREE_TIME_SLOTS,
  SKYTREE_IMPORTANT_NOTES,
  normalizeSafeHttpUrl,
} from '../data/skytreeTicketData';
import { useTripStore, DEFAULT_SKYTREE_TICKET } from '../store/useTripStore';
import { copyTextWithFallback } from './MobileAccessModal';

function Stepper({ label, subLabel, value, min = 0, max = 10, onChange }) {
  return (
    <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <span className="text-xs font-bold text-stone-900 dark:text-white block">{label}</span>
        {subLabel && (
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">{subLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-40 flex items-center justify-center text-stone-700 dark:text-stone-200 transition"
          aria-label={`${label} 인원 감소`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center text-xs font-extrabold font-mono text-stone-900 dark:text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-7 h-7 rounded-lg bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center transition"
          aria-label={`${label} 인원 증가`}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SkytreeTicketModal({ isOpen, onClose, initialTab = 'buy' }) {
  const skytreeTicket = useTripStore((s) => s.skytreeTicket) || DEFAULT_SKYTREE_TICKET;
  const setSkytreeTicket = useTripStore((s) => s.setSkytreeTicket);
  const checks = useTripStore((s) => s.checks);
  const setCheck = useTripStore((s) => s.setCheck);
  const exchangeRate = useTripStore((s) => s.exchangeRate);
  const upsertExpense = useTripStore((s) => s.upsertExpense);

  const [tab, setTab] = useState(initialTab);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab || 'buy');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ticket = { ...DEFAULT_SKYTREE_TICKET, ...skytreeTicket };
  const selectedPlan = SKYTREE_TICKET_PLANS[ticket.ticketType] || SKYTREE_TICKET_PLANS.deck350;
  const paidPeopleCount = Math.max(0, Number(ticket.adults || 0)) + Math.max(0, Number(ticket.children || 0));
  const estimatedMinJpy =
    Math.max(0, Number(ticket.adults || 0)) * selectedPlan.adultMinJpy +
    Math.max(0, Number(ticket.children || 0)) * selectedPlan.childMinJpy;
  const estimatedMinKrw = Math.round((estimatedMinJpy * exchangeRate) / 100);
  const onsiteSavedJpy = paidPeopleCount * selectedPlan.onsiteSurchargeJpy;
  const onsiteSavedKrw = Math.round((onsiteSavedJpy * exchangeRate) / 100);

  const safeTicketUrl = normalizeSafeHttpUrl(ticket.ticketUrl);
  const hasRawUrl = Boolean(ticket.ticketUrl && ticket.ticketUrl.trim());
  const isInvalidUrl = hasRawUrl && !safeTicketUrl;

  const handleApplyEstimatedToBudget = () => {
    if (estimatedMinJpy <= 0) {
      toast.error('유료 입장 인원을 1명 이상 선택해 주세요.');
      return;
    }
    const labelParts = [];
    if (ticket.adults > 0) labelParts.push(`어른 ${ticket.adults}`);
    if (ticket.children > 0) labelParts.push(`어린이 ${ticket.children}`);
    if (ticket.infants > 0) labelParts.push(`유아 ${ticket.infants}`);
    upsertExpense({
      id: 'e3b',
      day: 1,
      title: `도쿄 스카이트리 전망대 입장권 (${selectedPlan.shortName} · ${labelParts.join('·')} 예상)`,
      category: 'sightseeing',
      amountJpy: estimatedMinJpy,
      isPreset: true,
    });
    toast.success(`가계부에 스카이트리 예상 금액(¥${estimatedMinJpy.toLocaleString()})을 반영했습니다.`);
  };

  const handleApplyPaidToBudget = () => {
    const paid = Number(ticket.paidAmountJpy);
    if (!paid || paid <= 0) {
      toast.error('실제 결제하신 엔화 금액을 먼저 입력해 주세요.');
      return;
    }
    upsertExpense({
      id: 'e3b',
      day: 1,
      title: `도쿄 스카이트리 전망대 입장권 (${selectedPlan.shortName} · ${ticket.timeSlot} 확정)`,
      category: 'sightseeing',
      amountJpy: paid,
      isPreset: true,
    });
    toast.success(`실제 결제 금액(¥${paid.toLocaleString()})을 가계부에 저장했습니다.`);
  };

  const handleToggleBooked = (nextBooked) => {
    setSkytreeTicket({ booked: nextBooked });
    if (nextBooked) {
      if (!checks['skytree-ticket']) {
        setCheck('skytree-ticket', true);
      }
      toast.success('스카이트리 예매 완료 처리 및 준비 체크리스트에 자동 체크되었습니다!');
    } else {
      toast('예매 상태를 [사전예매 필요]로 변경했습니다.');
    }
  };

  const handleCopyReservationCode = async () => {
    if (!ticket.reservationCode?.trim()) return;
    const ok = await copyTextWithFallback(ticket.reservationCode.trim());
    if (ok) {
      setCopiedCode(true);
      toast.success('예약번호·바우처 코드를 복사했습니다.');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="도쿄 스카이트리 전망대 입장권 구매 및 예매 관리"
    >
      <div
        className="max-w-3xl w-full rounded-3xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 헤더 */}
        <header className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 text-white flex items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shadow-lg shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200">
                  TOKYO SKYTREE · 2026.11.22 (일) 1일차 야경
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    ticket.booked
                      ? 'bg-emerald-400 text-stone-950'
                      : 'bg-amber-400 text-stone-950'
                  }`}
                >
                  {ticket.booked ? `예매 완료 · ${ticket.timeSlot}` : '사전예매 필요'}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-serif font-bold mt-0.5 truncate">
                스카이트리 전망대 입장권 구매 &amp; QR 관리
              </h3>
              <p className="text-[11px] sm:text-xs text-sky-100/85 mt-0.5">
                권장 입장 <b>{ticket.timeSlot} 슬롯</b> · 4F 입구 · 최종 입장 21:00 (폐장 22:00)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
            aria-label="창 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 탭 전환 바 */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200/80 dark:border-stone-800 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'buy'}
              onClick={() => setTab('buy')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
                tab === 'buy'
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-700'
              }`}
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>입장권 바로 구매</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'my-ticket'}
              onClick={() => setTab('my-ticket')}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition ${
                tab === 'my-ticket'
                  ? 'bg-emerald-900 text-white shadow'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-700'
              }`}
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>내 예매 · QR 보관함</span>
            </button>
          </div>
        </div>

        {/* 스크롤 본문 */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {tab === 'buy' ? (
            <>
              {/* 핵심 절약 & QR 바로 입장 배너 */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/60 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-stone-700 dark:text-stone-200 space-y-1">
                  <strong className="text-amber-950 dark:text-amber-200 block text-xs sm:text-sm">
                    온라인 사전 예매 시 1장당 ¥500 현장 수수료 면제 + 4F 전용 레인 QR 바로 입장!
                  </strong>
                  <p>
                    일요일 저녁(11.22 · 19:30 전후)은 현장 매표소 대기가 길고 1인당 +500엔 추가 요금이 붙습니다. 아래 공식 한국어 스토어 또는 원화 간편결제 예매처에서 미리 구매하시면 스마트폰 QR만으로 교환 없이 바로 입장할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 1. 공식 한국어 E-티켓 권종별 바로 구매 카드 */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      OFFICIAL KOREAN E-TICKET DIRECT
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                      1. 공식 한국어 E-티켓 권종 선택 및 바로 구매
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                    만 5세 이하(미취학) 무료
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {Object.values(SKYTREE_TICKET_PLANS).map((plan) => {
                    const isPicked = ticket.ticketType === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          isPicked
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-700 ring-1 ring-emerald-700/30 shadow-sm'
                            : 'bg-stone-50/70 dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-700'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                plan.id === 'deck350'
                                  ? 'bg-amber-400 text-stone-950'
                                  : 'bg-indigo-700 text-white'
                              }`}
                            >
                              {plan.badge}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSkytreeTicket({ ticketType: plan.id })}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
                                isPicked
                                  ? 'bg-emerald-900 text-white'
                                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                              }`}
                            >
                              {isPicked ? '계산기 선택됨 ✓' : '이 권종 계산'}
                            </button>
                          </div>

                          <div>
                            <h5 className="font-bold text-sm text-stone-900 dark:text-white">
                              {plan.name}
                            </h5>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400">{plan.jpName}</p>
                          </div>

                          <div className="flex items-baseline gap-3 text-xs">
                            <span className="font-extrabold text-emerald-900 dark:text-emerald-300">
                              어른 ¥{plan.adultMinJpy.toLocaleString()}~
                            </span>
                            <span className="font-bold text-stone-600 dark:text-stone-300">
                              어린이(6~14세) ¥{plan.childMinJpy.toLocaleString()}~
                            </span>
                          </div>

                          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                            {plan.summary}
                          </p>

                          <ul className="space-y-1 pt-1">
                            {plan.highlights.map((h, idx) => (
                              <li key={idx} className="text-[11px] text-stone-600 dark:text-stone-300 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                <span>{h}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <a
                          href={plan.buyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <span>{plan.ctaLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. 인원 구성별 예상 요금 & 절약 계산기 */}
              <section className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                      2. 우리 가족 인원별 최저 예상 요금 &amp; 절약액 계산기
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-700">
                    {Object.values(SKYTREE_TICKET_PLANS).map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSkytreeTicket({ ticketType: plan.id })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                          ticket.ticketType === plan.id
                            ? 'bg-emerald-900 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        {plan.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Stepper
                    label="어른 (15세~)"
                    subLabel={`1인 ¥${selectedPlan.adultMinJpy.toLocaleString()}~`}
                    value={ticket.adults}
                    onChange={(v) => setSkytreeTicket({ adults: v })}
                  />
                  <Stepper
                    label="어린이 (6~14세)"
                    subLabel={`1인 ¥${selectedPlan.childMinJpy.toLocaleString()}~`}
                    value={ticket.children}
                    onChange={(v) => setSkytreeTicket({ children: v })}
                  />
                  <Stepper
                    label="유아 (만 5세 이하)"
                    subLabel="무료 입장"
                    value={ticket.infants}
                    onChange={(v) => setSkytreeTicket({ infants: v })}
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-emerald-200 font-semibold block">
                      {selectedPlan.shortName} · 유료 {paidPeopleCount}명 기준 사전예매 최저 예상
                    </span>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <strong className="text-lg sm:text-xl font-extrabold text-amber-300">
                        ¥{estimatedMinJpy.toLocaleString()}~
                      </strong>
                      <span className="text-xs text-emerald-100">
                        (약 {estimatedMinKrw.toLocaleString('ko-KR')}원 · 적용환율 {exchangeRate}원)
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-bold block">
                      💡 4F 현장 구매 대비 ¥{onsiteSavedJpy.toLocaleString()} (약 {onsiteSavedKrw.toLocaleString('ko-KR')}원) 절약!
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyEstimatedToBudget}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold shrink-0 shadow transition"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>가계부 예산에 반영</span>
                  </button>
                </div>
              </section>

              {/* 3. 예매처별 선택 (공식 + 원화 간편결제 OTA) */}
              <section className="space-y-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                    BOOKING PLATFORMS
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white">
                    3. 결제 수단·편의에 따라 예매처 선택하기
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SKYTREE_BOOKING_CHANNELS.map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                        ch.recommended
                          ? 'bg-sky-50/70 dark:bg-sky-950/25 border-sky-300 dark:border-sky-800'
                          : 'bg-white dark:bg-stone-800/50 border-stone-200/80 dark:border-stone-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              ch.recommended
                                ? 'bg-sky-700 text-white'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200'
                            }`}
                          >
                            {ch.badge}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-stone-900 dark:text-white">{ch.name}</h5>
                        <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                          {ch.paymentNote}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                          {ch.desc}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {ch.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-700 text-[10px] font-bold text-stone-600 dark:text-stone-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
                          ch.recommended
                            ? 'bg-sky-700 hover:bg-sky-600 text-white shadow'
                            : 'bg-stone-900 dark:bg-stone-700 hover:bg-emerald-800 text-white'
                        }`}
                      >
                        <span>{ch.ctaLabel}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. 공식 안내 바로가기 & 규정 주의사항 */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-stone-500 mr-1 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    공식 참고 링크:
                  </span>
                  {SKYTREE_OFFICIAL_HELP_LINKS.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 text-stone-700 dark:text-stone-200 text-[11px] font-bold border border-stone-200/80 dark:border-stone-700 transition"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 text-sky-600" />
                    </a>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-100">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>예매 전 꼭 확인할 규정 안내</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] sm:text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {SKYTREE_IMPORTANT_NOTES.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    이미 예매를 완료하셨나요?
                  </span>
                  <button
                    type="button"
                    onClick={() => setTab('my-ticket')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>예약번호 · 모바일 QR 등록하기 →</span>
                  </button>
                </div>
              </section>
            </>
          ) : (
            <>
              {/* 내 예매 · QR 보관함 탭 */}
              {/* 예매 완료 상태 전환 카드 */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  ticket.booked
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                    : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {ticket.booked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <strong className="text-sm text-stone-900 dark:text-white block">
                      {ticket.booked
                        ? `예매 완료 상태 (${selectedPlan.shortName} · ${ticket.timeSlot} 슬롯)`
                        : '아직 예매 완료 전 상태입니다'}
                    </strong>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      {ticket.booked
                        ? '일정 카드와 준비 체크리스트에 예매 완료로 표시됩니다.'
                        : '입장권을 구매한 뒤 아래 버튼을 누르면 체크리스트에도 자동 반영됩니다.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleBooked(!ticket.booked)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 transition shadow-sm ${
                    ticket.booked
                      ? 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-600 hover:bg-stone-100'
                      : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {ticket.booked ? '미예매 상태로 되돌리기' : '예매 완료로 표시'}
                </button>
              </div>

              {/* 등록된 안전한 모바일 QR 링크가 있을 때 상단 대형 바로 열기 버튼 */}
              {safeTicketUrl && (
                <a
                  href={safeTicketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 hover:from-emerald-800 hover:to-teal-800 text-white shadow-lg flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <strong className="text-sm block">내 모바일 QR 티켓 바로 열기 ↗</strong>
                      <span className="text-[11px] text-emerald-100/90 truncate block">
                        {safeTicketUrl}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-amber-300 shrink-0" />
                </a>
              )}

              {/* 예매 상세 정보 입력 폼 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    예매 정보 보관함 (이 기기에 자동 저장됨)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    방문일 {ticket.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                      예매처
                    </label>
                    <select
                      value={ticket.provider}
                      onChange={(e) => setSkytreeTicket({ provider: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                    >
                      {SKYTREE_BOOKING_CHANNELS.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name}
                        </option>
                      ))}
                      <option value="other">기타 여행사 / 호텔 / 편의점</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                      예매 권종
                    </label>
                    <select
                      value={ticket.ticketType}
                      onChange={(e) => setSkytreeTicket({ ticketType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                    >
                      {Object.values(SKYTREE_TICKET_PLANS).map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 입장 슬롯 시각 */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    예약 입장 시각 (19:30 슬롯 권장)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SKYTREE_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSkytreeTicket({ timeSlot: slot })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold transition ${
                          ticket.timeSlot === slot
                            ? 'bg-emerald-900 text-white shadow'
                            : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-emerald-600'
                        }`}
                      >
                        {slot}{slot === '19:30' ? ' (권장)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 인원 수정 */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    예매 인원
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Stepper
                      label="어른 (15세~)"
                      value={ticket.adults}
                      onChange={(v) => setSkytreeTicket({ adults: v })}
                    />
                    <Stepper
                      label="어린이 (6~14세)"
                      value={ticket.children}
                      onChange={(v) => setSkytreeTicket({ children: v })}
                    />
                    <Stepper
                      label="유아 (~5세)"
                      value={ticket.infants}
                      onChange={(v) => setSkytreeTicket({ infants: v })}
                    />
                  </div>
                </div>

                {/* 예약번호 & 실제 결제금액 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                      예약번호 / 바우처 코드
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={ticket.reservationCode}
                        onChange={(e) => setSkytreeTicket({ reservationCode: e.target.value })}
                        placeholder="예: SKY-20261122-1234"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleCopyReservationCode}
                        disabled={!ticket.reservationCode?.trim()}
                        className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 disabled:opacity-40 text-stone-800 dark:text-stone-100 text-xs font-bold shrink-0 inline-flex items-center gap-1 transition"
                        title="예약번호 복사"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>복사</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                      실제 결제 금액 (엔 ¥ · 가계부 연동)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={ticket.paidAmountJpy}
                        onChange={(e) => setSkytreeTicket({ paidAmountJpy: e.target.value })}
                        placeholder="예: 12000"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPaidToBudget}
                        className="px-3 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition"
                      >
                        가계부 반영
                      </button>
                    </div>
                  </div>
                </div>

                {/* 모바일 E-티켓 QR 링크 */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                    모바일 E-티켓 / QR 바우처 링크 (https://...)
                  </label>
                  <input
                    type="url"
                    value={ticket.ticketUrl}
                    onChange={(e) => setSkytreeTicket({ ticketUrl: e.target.value })}
                    placeholder="예: https://global-official-ticket.tokyo-skytree.jp/... (이메일/앱 바우처 주소 붙여넣기)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono"
                  />
                  {isInvalidUrl && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                      보안을 위해 https:// 또는 http:// 로 시작하는 올바른 웹 주소만 링크 버튼으로 열 수 있습니다.
                    </p>
                  )}
                </div>

                {/* 메모 */}
                <div>
                  <label className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block mb-1">
                    가족 참고 메모 (좌석/입장/스크린샷 보관 위치 등)
                  </label>
                  <textarea
                    rows={2}
                    value={ticket.memo}
                    onChange={(e) => setSkytreeTicket({ memo: e.target.value })}
                    placeholder="예: 아빠 폰 사진첩에 QR 4장 스크린샷 저장 완료, 19:15 소라마치 4층 실내 통로로 이동"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
                  />
                </div>
              </div>

              {/* 현장 4F 입장 4단계 체크 안내 */}
              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200/80 dark:border-sky-800/60 space-y-2.5">
                <h5 className="font-bold text-xs sm:text-sm text-sky-950 dark:text-sky-200">
                  당일 스카이트리 4F 현장 입장 4단계
                </h5>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 dark:text-stone-300">
                  <li className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/70 border border-sky-200/60 dark:border-sky-900/50">
                    <b className="text-sky-800 dark:text-sky-300 block">1. 19:15 식사 마감</b>
                    소라마치 식당에서 바깥으로 나가지 말고 4층 실내 연결 통로로 이동합니다.
                  </li>
                  <li className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/70 border border-sky-200/60 dark:border-sky-900/50">
                    <b className="text-sky-800 dark:text-sky-300 block">2. 사전 구입 전용 레인</b>
                    4층 매표소 줄에 서지 말고 QR 사전 구입자 전용 입장 레인으로 직행합니다.
                  </li>
                  <li className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/70 border border-sky-200/60 dark:border-sky-900/50">
                    <b className="text-sky-800 dark:text-sky-300 block">3. 화면 밝기 최대 + QR 스캔</b>
                    캡처해 둔 모바일 QR 코드 화면 밝기를 높여 게이트에 바로 스캔합니다.
                  </li>
                  <li className="p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/70 border border-sky-200/60 dark:border-sky-900/50">
                    <b className="text-sky-800 dark:text-sky-300 block">4. 보안검색 &amp; 50초 엘리베이터</b>
                    가방 보안검색을 거친 뒤 고속 엘리베이터를 타고 350m 덴보 데크로 올라갑니다.
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
