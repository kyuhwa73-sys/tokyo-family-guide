import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { toast } from 'sonner';
import {
  Volume2, Maximize2, X, Train, Sparkles, Calculator, MessageSquare,
  Plus, Trash2, Info, ShieldCheck, Ticket, ArrowRightLeft, ShieldAlert
} from 'lucide-react';
import { PHRASE_CARDS, SUBWAY_GUIDE } from '../data/tripData';
import DisneyMasterHub from './DisneyMasterHub';
import SurvivalGuide from './SurvivalGuide';
import { useTripStore } from '../store/useTripStore';
import { useJapaneseAudio } from '../utils/japaneseAudio';

export default function ConciergeToolkit({
  activeSubTab,
  setActiveSubTab,
  onOpenMap,
}) {
  const expenses = useTripStore((s) => s.expenses);
  const addExpense = useTripStore((s) => s.addExpense);
  const deleteExpense = useTripStore((s) => s.deleteExpense);
  const exchangeRate = useTripStore((s) => s.exchangeRate);
  const setExchangeRate = useTripStore((s) => s.setExchangeRate);

  const [pointingCard, setPointingCard] = useState(null);
  const [phraseFilter, setPhraseFilter] = useState('전체');
  const [jpyInput, setJpyInput] = useState('5000');
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDay, setNewExpDay] = useState(1);
  const [newExpCat, setNewExpCat] = useState('food');

  const { playingText, speak } = useJapaneseAudio();

  const handleSpeakJapanese = async (text) => {
    const res = await speak(text);
    if (!res?.ok && res?.reason) {
      toast.error(res.reason);
    }
  };

  const categories = [
    '전체',
    '교통 · 공항',
    '식당 · 주문',
    '쇼핑 · 면세',
    '관광 · 전망대',
    '숙소 · 체크인',
    '디즈니씨 · 현장',
    '사진 · 길찾기',
    '긴급 · 택시',
  ];

  const filteredPhrases = phraseFilter === '전체'
    ? PHRASE_CARDS
    : PHRASE_CARDS.filter((p) => p.category === phraseFilter);

  const krwConverted = Math.round((Number(jpyInput || 0) * exchangeRate) / 100);
  const totalJpy = expenses.reduce((acc, cur) => acc + (Number(cur.amountJpy) || 0), 0);
  const totalKrw = Math.round((totalJpy * exchangeRate) / 100);

  const dailyBudgetChartData = useMemo(() => {
    const totals = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const exp of expenses) {
      const d = Number(exp.day);
      if (totals[d] !== undefined) {
        totals[d] += Number(exp.amountJpy) || 0;
      }
    }
    return [1, 2, 3, 4].map((d) => ({
      dayLabel: `${d}일차`,
      jpy: totals[d],
      krw: Math.round((totals[d] * exchangeRate) / 100),
    }));
  }, [expenses, exchangeRate]);

  const catMeta = {
    transport: { label: '교통 · 버스 · 전철', color: '#0284c7' },
    food: { label: '식사 · 카페 · 간식', color: '#ea580c' },
    shopping: { label: '쇼핑 · 캐릭터 굿즈', color: '#db2777' },
    sightseeing: { label: '전망대 · 관광 입장', color: '#d97706' },
    themepark: { label: '디즈니씨 · DPA', color: '#7c3aed' },
  };

  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount) return;
    addExpense({
      id: `exp-${Date.now()}`,
      day: Number(newExpDay),
      title: newExpTitle.trim(),
      category: newExpCat,
      amountJpy: Number(newExpAmount),
      isPreset: false,
    });
    toast.success('가계부에 새 지출 내역이 추가되었습니다.');
    setNewExpTitle('');
    setNewExpAmount('');
  };

  return (
    <div className="space-y-6">
      {/* 서브 탭 네비게이션 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-stone-200/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
        {[
          { id: 'disney', label: '디즈니씨 마스터 공략', icon: Sparkles },
          { id: 'survival', label: '도쿄 생존 · 긴급 SOS', icon: ShieldAlert },
          { id: 'phrases', label: `일본어 회화 (${PHRASE_CARDS.length})`, icon: MessageSquare },
          { id: 'subway', label: '지하철 5대 노선 · 신 면세', icon: Train },
          { id: 'budget', label: '환율 · 가계부 차트', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                active
                  ? 'bg-emerald-900 text-white shadow-md'
                  : 'text-stone-600 dark:text-stone-300 hover:bg-white/60 dark:hover:bg-stone-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. 도쿄 디즈니씨 25주년 & 크리스마스 마스터 공략 센터 */}
      {activeSubTab === 'disney' && <DisneyMasterHub onOpenMap={onOpenMap} />}

      {/* 2. 도쿄 첫 방문 생존 · 매너 · 긴급 SOS 가이드 */}
      {activeSubTab === 'survival' && (
        <SurvivalGuide onSpeakJp={handleSpeakJapanese} playingText={playingText} />
      )}

      {/* 3. 일본어 회화 & 포인팅 카드 탭 (16장) */}
      {activeSubTab === 'phrases' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-lg space-y-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                FIRST-TIME TOKYO SURVIVAL · {PHRASE_CARDS.length} CARDS
              </span>
              <h3 className="text-lg sm:text-xl font-serif font-bold mt-1">
                현장에서 바로 보여주고 들려주는 가족 회화 카드
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
                일본어를 몰라도 걱정 마세요. <b>[발음 듣기]</b>를 누르면 원어민 음성이 재생되고, <b>[크게 보여주기]</b>를 누르면 점원·기사님께 바로 보여줄 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPhraseFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    phraseFilter === cat
                      ? 'bg-amber-400 text-stone-950 shadow'
                      : 'bg-white/10 text-emerald-100 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPhrases.map((card) => (
              <article
                key={card.id}
                className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {card.category}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium text-right">
                      {card.situation}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-bold text-stone-800 dark:text-stone-200">
                    “{card.korean}”
                  </p>

                  <div className="mt-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/60 dark:border-stone-700">
                    <p className="text-lg sm:text-xl font-bold text-emerald-950 dark:text-emerald-200 tracking-tight leading-snug">
                      {card.japanese}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                      발음: {card.romaji}
                    </p>
                  </div>

                  <p className="mt-2.5 text-xs text-stone-500 dark:text-stone-400 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{card.tip}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSpeakJapanese(card.japanese)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      playingText === card.japanese
                        ? 'bg-emerald-700 text-white shadow'
                        : 'bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${playingText === card.japanese ? 'text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}`} />
                    <span>{playingText === card.japanese ? '재생 중… (정지)' : '일본어 발음 듣기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointingCard(card)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold transition"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>크게 보여주기</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 4. 도쿄 지하철 5대 노선 & PASMO & 2026년 11월 신 면세 환급제 가이드 */}
      {activeSubTab === 'subway' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  TOKYO SUBWAY CHEATSHEET
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                  우리 가족이 타는 5개 핵심 노선 &amp; 역 번호 완벽 정리
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  도쿄 지하철은 <b>‘알파벳 노선 기호 + 숫자(역 번호)’</b>와 <b>‘노선 색상’</b>만 따라가면 처음 방문해도 절대 길을 잃지 않습니다.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                1·2일차 전 구간 무환승 직통!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SUBWAY_GUIDE.map((line) => (
                <div
                  key={line.code}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700 flex items-start gap-3.5"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shrink-0 shadow-md"
                    style={{ backgroundColor: line.color }}
                  >
                    {line.code}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">{line.name}</h4>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{line.usage}</p>
                    <p className="text-xs text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-200/60 dark:border-stone-700 font-medium">
                      {line.route}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
                      💡 {line.tip}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-sm">
                <Ticket className="w-4 h-4" />
                <h4>무기명 PASMO 구매 &amp; 사용 4단계 (1일차 16:40)</h4>
              </div>
              <ol className="space-y-2 text-xs text-stone-700 dark:text-stone-300 list-decimal list-inside leading-relaxed">
                <li><b>스이텐구마에역(Z10)</b> 개찰구 옆 분홍색/파란색 자동발매기 화면 우측 상단에서 <b>[한국어]</b>를 터치합니다.</li>
                <li><b>[PASMO 구입] → [무기명 PASMO]</b>를 선택하고 금액 <b>[3,000엔]</b>(보증금 500엔 + 충전 2,500엔)을 누릅니다.</li>
                <li>엔화 현금을 투입해 가족 인원수대로 카드를 발급받습니다(1인 1장 필수).</li>
                <li>3일차 디즈니 리조트라인(왕복 600엔)까지 모두 PASMO로 찍고 타며, 4일차 남은 잔액은 편의점·공항 매점에서 사용할 수 있습니다.</li>
              </ol>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <h4>2026년 11월 신(新) 면세 환급제 &amp; 11월 말 복장 안내</h4>
              </div>
              <ul className="space-y-2 text-xs text-stone-700 dark:text-stone-300 list-disc list-inside leading-relaxed">
                <li><b>매장 결제 후 공항 사후 환급:</b> 2026.11부터 매장에서는 소비세 포함 금액을 그대로 결제하고 여권으로 면세 등록(한 매장·하루 세전 5,000엔 이상)합니다.</li>
                <li><b>밀봉 봉투 폐지 · 미사용 유지:</b> 빨간 밀봉 봉투는 폐지되었지만 <b>출국 전까지 개봉·섭취·사용은 금지</b>됩니다. 4일차 나리타 T3에서 <b>수하물 위탁 전</b> 면세 단말기에 여권을 스캔해 세금을 돌려받으세요.</li>
                <li><b>11월 하순 날씨(9°C~16°C):</b> 저녁 스카이트리·디즈니씨 하버 쇼 대기 시 바닷바람이 차가우므로 <b>경량 패딩·방풍 자켓·핫팩</b>을 권장합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. 스마트 환율 계산기 & 가족 가계부 + Recharts 일차별 차트 */}
      {activeSubTab === 'budget' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 좌측: 엔화 <-> 원화 즉시 계산기 */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 h-fit">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                  QUICK CURRENCY CONVERTER
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                  엔화(JPY) ↔ 원화(KRW) 계산기
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/70 dark:border-stone-700 space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-500 dark:text-stone-400 block mb-1">
                    엔화 금액 입력 (¥ JPY)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-400">¥</span>
                    <input
                      type="number"
                      value={jpyInput}
                      onChange={(e) => setJpyInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 font-bold text-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      placeholder="예: 5000"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center text-stone-400">
                  <ArrowRightLeft className="w-4 h-4 rotate-90" />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-900 text-white flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-200">원화 환산 금액</span>
                  <strong className="text-xl font-extrabold tracking-tight">
                    약 {krwConverted.toLocaleString('ko-KR')}원
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-500 block mb-2">여행 중 자주 쓰는 기준 금액 터치:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5">
                  {[
                    { jpy: 300, label: '300엔 (리조트라인)' },
                    { jpy: 2000, label: '2,000엔 (토이스토리 DPA)' },
                    { jpy: 2300, label: '2,300엔 (스카이트리 350m)' },
                    { jpy: 2500, label: '2,500엔 (겨울왕국 DPA)' },
                    { jpy: 3000, label: '3,000엔 (PASMO 1인)' },
                    { jpy: 3100, label: '3,100엔 (리무진 1인)' },
                    { jpy: 3400, label: '3,400엔 (스카이트리 세트)' },
                    { jpy: 5000, label: '5,000엔 (면세 최소기준)' },
                  ].map((btn) => (
                    <button
                      key={btn.jpy}
                      type="button"
                      onClick={() => setJpyInput(String(btn.jpy))}
                      className="px-2.5 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-[11px] font-semibold text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700 transition text-left"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
                  <span>적용 환율 (100엔 기준)</span>
                  <strong className="text-emerald-800 dark:text-emerald-300">{exchangeRate}원 / 100¥</strong>
                </div>
                <input
                  type="range"
                  min="850"
                  max="1050"
                  step="5"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  className="w-full accent-emerald-800"
                />
              </div>
            </div>

            {/* 우측: 가족 여행 가계부 + 일차별 Recharts 차트 */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      FAMILY EXPENSE TRACKER
                    </span>
                    <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white mt-0.5">
                      우리 가족 도쿄 여행 예산 &amp; 지출 기록장
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-500 block">총 기록 금액 (4인 가족 기준)</span>
                    <strong className="text-lg font-extrabold text-emerald-900 dark:text-emerald-300">
                      ¥{totalJpy.toLocaleString()} <small className="text-xs font-semibold text-stone-500">(약 {totalKrw.toLocaleString()}원)</small>
                    </strong>
                  </div>
                </div>

                {/* 일차별 예산 분포 차트 (Recharts) */}
                <div className="w-full h-48 pt-1" aria-label="일차별 여행 지출 분포 차트">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyBudgetChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d6d3d1" opacity={0.45} />
                      <XAxis dataKey="dayLabel" tick={{ fontSize: 12, fill: '#78716c' }} />
                      <YAxis
                        tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                        tick={{ fontSize: 11, fill: '#78716c' }}
                      />
                      <Tooltip
                        formatter={(val, _name, item) => [
                          `¥${Number(val).toLocaleString()} (약 ${item.payload.krw.toLocaleString()}원)`,
                          '일차 합계',
                        ]}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="jpy" name="엔화 지출" fill="#133933" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 새 지출 추가 폼 */}
                <form
                  onSubmit={handleCreateExpense}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700"
                >
                  <select
                    value={newExpDay}
                    onChange={(e) => setNewExpDay(e.target.value)}
                    className="sm:col-span-2 px-2.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                  >
                    <option value={1}>1일차</option>
                    <option value={2}>2일차</option>
                    <option value={3}>3일차</option>
                    <option value={4}>4일차</option>
                  </select>
                  <select
                    value={newExpCat}
                    onChange={(e) => setNewExpCat(e.target.value)}
                    className="sm:col-span-3 px-2.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                  >
                    <option value="food">식사 · 간식</option>
                    <option value="shopping">쇼핑 · 굿즈</option>
                    <option value="sightseeing">전망대 · 관광</option>
                    <option value="transport">교통 · 버스</option>
                    <option value="themepark">디즈니씨</option>
                  </select>
                  <input
                    type="text"
                    value={newExpTitle}
                    onChange={(e) => setNewExpTitle(e.target.value)}
                    placeholder="지출 내역 (예: 소라마치 포켓몬센터)"
                    className="sm:col-span-4 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs"
                  />
                  <div className="sm:col-span-3 flex gap-1.5">
                    <input
                      type="number"
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      placeholder="엔(¥)"
                      className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>추가</span>
                    </button>
                  </div>
                </form>

                {/* 지출 목록 */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {expenses.map((exp) => {
                    const meta = catMeta[exp.category] || catMeta.food;
                    const krw = Math.round((exp.amountJpy * exchangeRate) / 100);
                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50/80 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shrink-0"
                            style={{ backgroundColor: meta.color }}
                          >
                            DAY {exp.day}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
                              {exp.title}
                            </p>
                            <span className="text-[11px] text-stone-400">{meta.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <strong className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-white block">
                              ¥{Number(exp.amountJpy).toLocaleString()}
                            </strong>
                            <span className="text-[11px] text-stone-500">약 {krw.toLocaleString()}원</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteExpense(exp.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="항목 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전체화면 포인팅 카드 모달 */}
      {pointingCard && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPointingCard(null)}
        >
          <div
            className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-white text-stone-900 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                점원에게 화면을 보여주세요 · POINTING CARD
              </span>
              <button
                type="button"
                onClick={() => setPointingCard(null)}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border-2 border-emerald-800/20 text-center space-y-4">
              <p className="text-2xl sm:text-4xl font-extrabold text-stone-950 leading-snug break-keep">
                {pointingCard.japanese}
              </p>
              <p className="text-sm sm:text-base text-emerald-800 font-bold">
                {pointingCard.romaji}
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-base font-bold text-stone-700">“{pointingCard.korean}”</p>
              <p className="text-xs text-stone-500">{pointingCard.tip}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSpeakJapanese(pointingCard.japanese)}
                className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                  playingText === pointingCard.japanese
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-800 hover:bg-emerald-700'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span>
                  {playingText === pointingCard.japanese ? '재생 중… (터치 시 정지)' : '일본어 음성 크게 재생'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPointingCard(null)}
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
