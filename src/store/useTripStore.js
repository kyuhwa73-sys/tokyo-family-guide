import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_EXPENSES } from '../data/tripData';

const LEGACY_STORAGE_KEY = 'tokyo-trip-journal-v1';
const STORE_KEY = 'tokyo-trip-store-v3';

function mergeSkytreeExpenseIfNeeded(expenses, alreadyMerged) {
  if (!Array.isArray(expenses)) return DEFAULT_EXPENSES;
  if (alreadyMerged || expenses.some((e) => e.id === 'e3b')) {
    return expenses;
  }
  const skytreePreset = DEFAULT_EXPENSES.find((e) => e.id === 'e3b');
  if (!skytreePreset) return expenses;

  const next = [...expenses];
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

function readLegacyState() {
  if (typeof window === 'undefined') return {};
  try {
    // v3 스토어가 이미 저장된 경우 레거시 읽기를 건너뜀
    if (localStorage.getItem(STORE_KEY)) return {};
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const legacy = readLegacyState();

const DEFAULT_DPA_TIMER = {
  active: false,
  boughtAt: null,
  returnTime: '',
  rideName: '겨울왕국 (프로즌 저니)',
};

export const useTripStore = create(
  persist(
    (set) => ({
      completed: legacy.completed || {},
      checks: legacy.checks || {},
      notes: legacy.notes || {},
      hotelMemo: legacy.hotelMemo || { name: '', note: '' },
      disneyChecks: legacy.disneyChecks || {},
      disneyPreChecks: {},
      dpaTimer: DEFAULT_DPA_TIMER,
      customChecklist: Array.isArray(legacy.customChecklist) ? legacy.customChecklist : [],
      expenses: mergeSkytreeExpenseIfNeeded(legacy.expenses, legacy.skytreeExpenseMerged),
      exchangeRate: legacy.exchangeRate || 910,
      darkMode: Boolean(legacy.darkMode),

      toggleCompleted: (itemId) =>
        set((state) => ({
          completed: { ...state.completed, [itemId]: !state.completed[itemId] },
        })),

      toggleCheck: (checkId) =>
        set((state) => ({
          checks: { ...state.checks, [checkId]: !state.checks[checkId] },
        })),

      setDayNote: (dayId, text) =>
        set((state) => ({
          notes: { ...state.notes, [dayId]: text },
        })),

      setHotelMemo: (memo) =>
        set({
          hotelMemo: {
            name: memo?.name ?? '',
            note: memo?.note ?? '',
          },
        }),

      toggleDisneyCheck: (stepId) =>
        set((state) => ({
          disneyChecks: { ...state.disneyChecks, [stepId]: !state.disneyChecks[stepId] },
        })),

      toggleDisneyPreCheck: (stepId) =>
        set((state) => ({
          disneyPreChecks: { ...state.disneyPreChecks, [stepId]: !state.disneyPreChecks[stepId] },
        })),

      startDpaTimer: (rideName = '겨울왕국 (프로즌 저니)') =>
        set((state) => ({
          dpaTimer: {
            ...state.dpaTimer,
            active: true,
            boughtAt: Date.now(),
            rideName,
          },
        })),

      updateDpaReturnTime: (returnTime) =>
        set((state) => ({
          dpaTimer: {
            ...state.dpaTimer,
            returnTime,
          },
        })),

      resetDpaTimer: () =>
        set({
          dpaTimer: DEFAULT_DPA_TIMER,
        }),

      addCustomCheck: (item) =>
        set((state) => ({
          customChecklist: [...state.customChecklist, item],
        })),

      deleteCustomCheck: (id) =>
        set((state) => ({
          customChecklist: state.customChecklist.filter((c) => c.id !== id),
        })),

      addExpense: (exp) =>
        set((state) => ({
          expenses: [exp, ...state.expenses],
        })),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      setExchangeRate: (rate) => set({ exchangeRate: Number(rate) || 910 }),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      importBackup: (parsed) =>
        set((state) => ({
          completed: parsed.completed ?? state.completed,
          checks: parsed.checks ?? state.checks,
          notes: parsed.notes ?? state.notes,
          hotelMemo: parsed.hotelMemo ?? state.hotelMemo,
          disneyChecks: parsed.disneyChecks ?? state.disneyChecks,
          disneyPreChecks: parsed.disneyPreChecks ?? state.disneyPreChecks,
          dpaTimer: parsed.dpaTimer ?? state.dpaTimer,
          customChecklist: parsed.customChecklist ?? state.customChecklist,
          expenses: Array.isArray(parsed.expenses)
            ? mergeSkytreeExpenseIfNeeded(parsed.expenses, true)
            : state.expenses,
          exchangeRate: parsed.exchangeRate ?? state.exchangeRate,
        })),
    }),
    {
      name: STORE_KEY,
      partialize: (state) => ({
        completed: state.completed,
        checks: state.checks,
        notes: state.notes,
        hotelMemo: state.hotelMemo,
        disneyChecks: state.disneyChecks,
        disneyPreChecks: state.disneyPreChecks,
        dpaTimer: state.dpaTimer,
        customChecklist: state.customChecklist,
        expenses: state.expenses,
        exchangeRate: state.exchangeRate,
        darkMode: state.darkMode,
      }),
    }
  )
);
