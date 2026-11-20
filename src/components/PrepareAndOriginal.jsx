import React, { useState } from 'react';
import {
  CheckCircle2, Circle, Plus, Trash2, Download, Upload, ShieldAlert,
  Sparkles, BookOpen, Search, FileText, CheckSquare
} from 'lucide-react';
import { TRIP_DATA } from '../data/tripData';

export function PrepareView({
  checks,
  customChecklist,
  onToggleCheck,
  onAddCustomCheck,
  onDeleteCustomCheck,
  onExportBackup,
  onImportBackup,
  onSaveOffline
}) {
  const [newLabel, setNewLabel] = useState('');
  const [newDay, setNewDay] = useState(1);
  const [filterDay, setFilterDay] = useState('all');

  const allChecklist = [
    ...TRIP_DATA.checklist.map(c => ({ ...c, isCustom: false })),
    ...customChecklist.map(c => ({ ...c, isCustom: true }))
  ];

  const filteredList = filterDay === 'all'
    ? allChecklist
    : allChecklist.filter(c => c.day === Number(filterDay));

  const checkedCount = allChecklist.filter(c => checks[c.id]).length;
  const progressPct = allChecklist.length ? Math.round((checkedCount / allChecklist.length) * 100) : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onAddCustomCheck({
      id: `custom-${Date.now()}`,
      label: newLabel.trim(),
      day: Number(newDay),
      category: '가족 추가',
    });
    setNewLabel('');
  };

  return (
    <div className="space-y-6">
      {/* 상단 진행률 배너 */}
      <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            PRE-TRIP & DAILY CHECKLIST
          </span>
          <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mt-1">
            가볍고 든든하게 떠나는 가족 여행 준비
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            원문 일정에서 추출한 {TRIP_DATA.checklist.length}개 필수 점검 항목과 우리 가족만의 추가 준비물을 관리하세요.
          </p>
        </div>

        <div className="min-w-[220px] p-4 rounded-2xl bg-emerald-950 text-white">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-emerald-200 font-semibold">전체 준비 달성률</span>
            <strong className="text-amber-300 font-extrabold">{checkedCount} / {allChecklist.length} ({progressPct}%)</strong>
          </div>
          <div className="w-full h-2.5 rounded-full bg-emerald-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 체크리스트 */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h4 className="font-bold text-base text-stone-900 dark:text-white">일차별 필수 준비 체크리스트</h4>
            </div>

            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {[
                { id: 'all', label: '전체' },
                { id: '1', label: '1일차' },
                { id: '2', label: '2일차' },
                { id: '3', label: '3일차' },
                { id: '4', label: '4일차' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterDay(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    filterDay === t.id
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-stone-600 dark:text-stone-300 hover:bg-stone-200/70'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* 새 체크리스트 항목 추가 */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
            >
              <option value={1}>DAY 1</option>
              <option value={2}>DAY 2</option>
              <option value={3}>DAY 3</option>
              <option value={4}>DAY 4</option>
            </select>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="추가할 준비물 입력 (예: 110V 돼지코 어댑터, 상비약, 동전지갑)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>추가</span>
            </button>
          </form>

          <div className="space-y-2">
            {filteredList.map((item) => {
              const isDone = !!checks[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleCheck(item.id)}
                  className={`cursor-pointer p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50 text-stone-400'
                      : 'bg-stone-50/70 dark:bg-stone-800/40 border-stone-200/70 dark:border-stone-800 hover:border-emerald-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-bold ${isDone ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-100'}`}>
                        {item.label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                          DAY {item.day}
                        </span>
                        {item.category && (
                          <span className="text-[11px] text-stone-400">{item.category}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustomCheck(item.id);
                      }}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 우측: 가족 여행의 약속(플랜 B) & 데이터 백업/오프라인 */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="font-bold text-base text-stone-900 dark:text-white">가족 여행의 {TRIP_DATA.notes.length}가지 작은 약속 (플랜 B)</h4>
            </div>
            <p className="text-xs text-stone-500">
              피곤하거나 식당 대기가 길어질 때 당황하지 않도록 원문 일정에 준비된 대안입니다.
            </p>
            <div className="space-y-2.5">
              {TRIP_DATA.notes.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300">
                      DAY {n.day} · {n.badge || '원문 기준'}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">{n.title}</h5>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">{n.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 오프라인 저장 및 가족 스마트폰 간 기록 공유 */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">OFFLINE & FAMILY SYNC</span>
              <h4 className="font-bold text-base mt-0.5">오프라인 보관 & 가족 기기 간 기록 백업</h4>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                여행 중 비행기 안이나 지하철에서도 일정과 고해상도 지도 6장을 볼 수 있도록 오프라인 저장을 지원하며, 기록(체크·메모·가계부)을 파일로 내보내 가족과 공유할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={onSaveOffline}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>오프라인용 전체 일정 · 지도 6장 브라우저 저장</span>
            </button>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-700">
              <button
                type="button"
                onClick={onExportBackup}
                className="py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>기록 내보내기(JSON)</span>
              </button>
              <label className="cursor-pointer py-2 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>기록 불러오기</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OriginalDocumentView() {
  const [docQuery, setDocQuery] = useState('');
  const q = docQuery.trim().toLowerCase();

  const filteredParagraphs = TRIP_DATA.rawParagraphs.map((p, idx) => ({ text: p, idx })).filter(({ text }) =>
    !q || text.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            THE ORIGINAL ITINERARY ARCHIVE
          </span>
          <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mt-1">
            작성한 원본 일정표 (전체 {TRIP_DATA.rawParagraphs.length}문단 완벽 보존)
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            제공된 Word 문서(<b>{TRIP_DATA.sourceFile}</b>)의 모든 문구를 한 글자도 바꾸지 않고 그대로 보존한 화면입니다.
          </p>
        </div>

        <a
          href={`assets/${encodeURIComponent(TRIP_DATA.sourceFile)}`}
          download={TRIP_DATA.sourceFile}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow shrink-0 transition"
        >
          <FileText className="w-4 h-4" />
          <span>원본 Word(.docx) 다운로드</span>
        </a>
      </div>

      {/* 문서 내 키워드 빠른 필터 */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-sm">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="search"
          value={docQuery}
          onChange={(e) => setDocQuery(e.target.value)}
          placeholder="원문 문단 내 키워드 검색 (예: 스카이트리, 전망대, 리무진, PASMO, DPA, 면세)..."
          className="w-full bg-transparent text-xs sm:text-sm focus:outline-none"
        />
        {docQuery && (
          <span className="text-xs font-bold text-emerald-700 shrink-0">
            {filteredParagraphs.length}개 문단 일치
          </span>
        )}
      </div>

      {/* 에디토리얼 페이퍼 스타일 원문 뷰어 */}
      <article className="p-6 sm:p-10 rounded-3xl bg-[#FCFBF7] dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-inner space-y-2.5 max-w-4xl mx-auto">
        {filteredParagraphs.map(({ text, idx }) => {
          const isTitle = idx === 0;
          const isSubtitle = idx === 1;
          const isDayHeader = text.startsWith('■');
          const isSectionHeader = text.startsWith('□');

          if (isTitle) {
            return (
              <h2 key={idx} className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white pb-1">
                {text}
              </h2>
            );
          }
          if (isSubtitle) {
            return (
              <p key={idx} className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-400 pb-4 border-b border-stone-200 dark:border-stone-800">
                {text}
              </p>
            );
          }
          if (isDayHeader) {
            return (
              <h3 key={idx} className="pt-6 pb-2 text-base sm:text-lg font-serif font-bold text-emerald-950 dark:text-emerald-300 border-t border-stone-200/70 dark:border-stone-800 first:border-t-0">
                {text}
              </h3>
            );
          }
          if (isSectionHeader) {
            return (
              <h4 key={idx} className="pt-2 text-sm sm:text-base font-bold text-stone-800 dark:text-stone-100">
                {text}
              </h4>
            );
          }
          return (
            <p key={idx} className="pl-3 sm:pl-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              {text}
            </p>
          );
        })}
      </article>
    </div>
  );
}
