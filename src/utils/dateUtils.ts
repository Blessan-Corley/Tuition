/**
 * Zero-emoji date utility helpers for tuition attendance management.
 */

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime12h(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

export function getDefaultTimeWindow(durationMinutes: number = 60): { startTime: string; endTime: string } {
  const now = new Date();
  // Round to nearest 15 mins for neat default
  const remainder = now.getMinutes() % 15;
  now.setMinutes(now.getMinutes() - remainder);
  now.setSeconds(0);

  const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

  return {
    startTime: formatTime12h(now),
    endTime: formatTime12h(end),
  };
}

export function calculateEndTime(startTimeStr: string, durationMinutes: number): string {
  try {
    const parts = startTimeStr.trim().split(' ');
    if (parts.length !== 2) return startTimeStr;
    const [time, ampm] = parts;
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;

    const base = new Date();
    base.setHours(h, m, 0, 0);
    const end = new Date(base.getTime() + durationMinutes * 60 * 1000);
    return formatTime12h(end);
  } catch {
    return startTimeStr;
  }
}

export interface CalendarDay {
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getMonthMatrix(year: number, monthIndex: number): CalendarDay[] {
  const firstDay = new Date(year, monthIndex, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayStr = getTodayDateString();

  const days: CalendarDay[] = [];

  // Previous month offset days
  const prevMonthDays = new Date(year, monthIndex, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = monthIndex === 0 ? 12 : monthIndex;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dateString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
    });
  }

  // Next month fill days (complete rows to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dateString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  return days;
}
