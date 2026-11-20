import React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { ROUTE_MAPS } from '../data/tripData';

export default function DeepZoomMapModal({ activeMapId, onClose, onSelectMap }) {
  const currentMap = ROUTE_MAPS.find(m => m.id === activeMapId);
  if (!currentMap) return null;

  const currentIndex = ROUTE_MAPS.findIndex(m => m.id === activeMapId);
  const prevMap = ROUTE_MAPS[(currentIndex - 1 + ROUTE_MAPS.length) % ROUTE_MAPS.length];
  const nextMap = ROUTE_MAPS[(currentIndex + 1) % ROUTE_MAPS.length];

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex flex-col animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`${currentMap.title} 고해상도 동선지도 뷰어`}
    >
      {/* 상단 툴바 */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-stone-900/90 border-b border-stone-800 text-white">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-xs font-bold tracking-wide">
            DAY {currentMap.day} · {currentMap.type}
          </span>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">{currentMap.title}</h3>
            <p className="text-xs text-stone-400 hidden sm:block">{currentMap.subtitle}</p>
          </div>
        </div>

        {/* 6장 지도 빠른 전환 탭 */}
        <div className="hidden lg:flex items-center gap-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
          {ROUTE_MAPS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMap(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                m.id === currentMap.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/60'
              }`}
            >
              #{m.id} ({m.day}일차 {m.type})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href={currentMap.src}
            download={`${currentMap.title}.png`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>원본 저장</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-stone-800 hover:bg-rose-600 text-white border border-stone-700 transition"
            aria-label="지도 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 메인 딥줌 뷰포트 */}
      <TransformWrapper
        key={currentMap.id}
        initialScale={1}
        minScale={0.5}
        maxScale={5}
        centerOnInit={true}
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn', step: 0.7 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="relative flex-1 overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing">
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img
                  src={currentMap.src}
                  alt={`${currentMap.title}: ${currentMap.subtitle}`}
                  className="max-h-[82vh] max-w-[94vw] object-contain rounded-lg shadow-2xl bg-white"
                />
              </TransformComponent>

              {/* 좌우 이전/다음 지도 버튼 */}
              <button
                type="button"
                onClick={() => onSelectMap(prevMap.id)}
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-700 text-white border border-stone-700 flex items-center justify-center shadow-lg transition"
                title={`이전: ${prevMap.title}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectMap(nextMap.id)}
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-stone-900/80 hover:bg-emerald-700 text-white border border-stone-700 flex items-center justify-center shadow-lg transition"
                title={`다음: ${nextMap.title}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 하단 플로팅 줌 컨트롤 독 */}
            <footer className="px-4 py-3 bg-stone-900/95 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-300">
              <div className="flex items-center gap-2 overflow-x-auto">
                <Map className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-stone-400">마우스 휠 · 두 손가락 핀치 · 더블클릭으로 최대 500%까지 선명하게 확대하고 드래그하여 이동하세요.</span>
              </div>

              <div className="flex items-center gap-2 mx-auto sm:mx-0">
                <button
                  type="button"
                  onClick={() => zoomOut()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold border border-stone-700 transition"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>축소</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetTransform()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold border border-stone-700 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>화면 맞춤</span>
                </button>
                <button
                  type="button"
                  onClick={() => zoomIn()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold shadow transition"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>확대</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
