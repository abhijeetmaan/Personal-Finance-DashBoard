/** @param {number} year @param {number} monthIndex 0-11 @param {number} day 1-31 */
export function clampDayInMonth(year, monthIndex, day) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  const d = Math.min(Math.max(Number(day) || 1, 1), 31);
  return new Date(year, monthIndex, Math.min(d, last));
}

/**
 * Current statement cycle [start, end] inclusive by calendar day for a billingCycleStart day (1-31).
 * @param {number} billingCycleStartDay
 * @param {Date} [ref=new Date()]
 * @returns {{ cycleStart: Date, cycleEnd: Date }}
 */
export function getCurrentBillingCycle(billingCycleStartDay, ref = new Date()) {
  const D = Math.min(Math.max(Number(billingCycleStartDay) || 1, 1), 31);
  const refY = ref.getFullYear();
  const refM = ref.getMonth();

  const startOfDay = (date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  const endOfDay = (date) => {
    const x = new Date(date);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  const refStart = startOfDay(ref);
  const thisMonthCycleStart = startOfDay(clampDayInMonth(refY, refM, D));
  const cycleStart =
    refStart >= thisMonthCycleStart
      ? thisMonthCycleStart
      : startOfDay(clampDayInMonth(refY, refM - 1, D));

  const csY = cycleStart.getFullYear();
  const csM = cycleStart.getMonth();
  const nextStart = startOfDay(clampDayInMonth(csY, csM + 1, D));
  const cycleEnd = endOfDay(new Date(nextStart.getTime() - 86400000));

  return { cycleStart, cycleEnd };
}

/**
 * Next calendar due date from due day (1-31) on or after `ref`.
 * @param {number} dueDay
 * @param {Date} [ref=new Date()]
 */
export function getNextDueDate(dueDay, ref = new Date()) {
  const D = Math.min(Math.max(Number(dueDay) || 1, 1), 31);
  const refY = ref.getFullYear();
  const refM = ref.getMonth();
  const refStart = new Date(refY, refM, ref.getDate());
  refStart.setHours(0, 0, 0, 0);

  let candidate = clampDayInMonth(refY, refM, D);
  candidate.setHours(0, 0, 0, 0);
  if (candidate < refStart) {
    candidate = clampDayInMonth(refY, refM + 1, D);
    candidate.setHours(0, 0, 0, 0);
  }
  return candidate;
}

export function daysBetween(from, to) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}
