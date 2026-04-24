import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const STORAGE_PRESET = "pfd-date-preset";
const STORAGE_START = "pfd-date-custom-start";
const STORAGE_END = "pfd-date-custom-end";

function toISODateUTC(y, monthIndex0, day) {
  return new Date(Date.UTC(y, monthIndex0, day)).toISOString().slice(0, 10);
}

export function thisMonthBounds() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m0 = now.getUTCMonth();
  const month = m0 + 1;
  const lastDay = new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
  return {
    startDate: toISODateUTC(y, m0, 1),
    endDate: toISODateUTC(y, m0, lastDay),
    month,
    year: y,
  };
}

export function lastMonthBounds() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m0 = now.getUTCMonth();
  const prevM0 = m0 === 0 ? 11 : m0 - 1;
  const prevY = m0 === 0 ? y - 1 : y;
  const month = prevM0 + 1;
  const lastDay = new Date(Date.UTC(prevY, prevM0 + 1, 0)).getUTCDate();
  return {
    startDate: toISODateUTC(prevY, prevM0, 1),
    endDate: toISODateUTC(prevY, prevM0, lastDay),
    month,
    year: prevY,
  };
}

export function getPreviousAdjacentRange(startDateStr, endDateStr) {
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T23:59:59.999Z`);
  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - spanMs);
  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

const DateRangeContext = createContext(null);

export function DateRangeProvider({ children }) {
  const [preset, setPresetState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PRESET);
      if (
        stored === "this_month" ||
        stored === "last_month" ||
        stored === "custom"
      ) {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return "this_month";
  });

  const tm = thisMonthBounds();

  const [customStart, setCustomStart] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_START) || tm.startDate;
    } catch {
      return tm.startDate;
    }
  });

  const [customEnd, setCustomEnd] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_END) || tm.endDate;
    } catch {
      return tm.endDate;
    }
  });

  const setPreset = useCallback((next) => {
    setPresetState(next);
    try {
      localStorage.setItem(STORAGE_PRESET, next);
    } catch {
      /* ignore */
    }
  }, []);

  const setCustomRange = useCallback((start, end) => {
    let a = start;
    let b = end;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    setCustomStart(a);
    setCustomEnd(b);
    try {
      localStorage.setItem(STORAGE_START, a);
      localStorage.setItem(STORAGE_END, b);
    } catch {
      /* ignore */
    }
  }, []);

  const range = useMemo(() => {
    if (preset === "this_month") return thisMonthBounds();
    if (preset === "last_month") return lastMonthBounds();
    const sd = new Date(`${customStart}T00:00:00.000Z`);
    return {
      startDate: customStart,
      endDate: customEnd,
      month: sd.getUTCMonth() + 1,
      year: sd.getUTCFullYear(),
    };
  }, [preset, customStart, customEnd]);

  const comparisonRange = useMemo(
    () => getPreviousAdjacentRange(range.startDate, range.endDate),
    [range.startDate, range.endDate],
  );

  const label = useMemo(() => {
    if (preset === "this_month") return "This month";
    if (preset === "last_month") return "Last month";
    return "Custom";
  }, [preset]);

  const value = useMemo(
    () => ({
      preset,
      setPreset,
      customStart,
      customEnd,
      setCustomRange,
      startDate: range.startDate,
      endDate: range.endDate,
      budgetMonth: range.month,
      budgetYear: range.year,
      comparisonRange,
      label,
    }),
    [
      preset,
      setPreset,
      customStart,
      customEnd,
      setCustomRange,
      range.startDate,
      range.endDate,
      range.month,
      range.year,
      comparisonRange,
      label,
    ],
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) {
    throw new Error("useDateRange must be used within DateRangeProvider");
  }
  return ctx;
}
