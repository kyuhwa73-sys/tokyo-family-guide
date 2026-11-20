import React from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './index.css';

function AppErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1] text-stone-900 p-6">
      <div className="max-w-md w-full p-6 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-4 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
          일시적인 화면 오류 안내
        </span>
        <h1 className="text-xl font-bold">여행 가이드를 불러오는 중 문제가 발생했습니다</h1>
        <p className="text-xs text-stone-600 leading-relaxed">
          저장된 체크리스트·메모·가계부 기록은 그대로 유지됩니다. 아래 버튼을 눌러 화면을 다시 열어주세요.
        </p>
        {error?.message && (
          <pre className="p-2.5 rounded-xl bg-stone-100 text-[11px] text-stone-600 overflow-x-auto text-left">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 justify-center pt-1">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="px-4 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold transition"
          >
            다시 시도하기
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController && !reloading) {
        reloading = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        reg.update().catch(() => {});
      })
      .catch(() => {});
  });
}

const container = document.getElementById('root');
createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
