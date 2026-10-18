import { describe, test, expect } from '@jest/globals';
import {
  getTodayDateString,
  formatReadableDate,
  formatShortDate,
  calculateEndTime,
  getMonthMatrix,
  getDefaultTimeWindow,
} from '../src/utils/dateUtils';

describe('dateUtils (Date calculations and formatting)', () => {
  test('getTodayDateString returns YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('formatReadableDate returns formatted string without emojis', () => {
    const formatted = formatReadableDate('2026-10-17');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('17');
    // Ensure zero emoji
    expect(/[\u{1F300}-\u{1F6FF}]/u.test(formatted)).toBe(false);
  });

  test('formatShortDate returns short month and day', () => {
    const short = formatShortDate('2026-10-17');
    expect(short).toContain('Oct');
    expect(short).toContain('17');
  });

  test('calculateEndTime adds duration correctly', () => {
    expect(calculateEndTime('05:00 PM', 60)).toBe('06:00 PM');
    expect(calculateEndTime('05:00 PM', 90)).toBe('06:30 PM');
    expect(calculateEndTime('11:30 AM', 60)).toBe('12:30 PM');
    expect(calculateEndTime('11:30 PM', 60)).toBe('12:30 AM');
  });

  test('getDefaultTimeWindow returns 60-minute interval by default', () => {
    const { startTime, endTime } = getDefaultTimeWindow(60);
    expect(startTime).toBeTruthy();
    expect(endTime).toBeTruthy();
    expect(startTime).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
    expect(endTime).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
  });

  test('getMonthMatrix generates 35 or 42 calendar grid cells', () => {
    // October 2026 (month index 9)
    const days = getMonthMatrix(2026, 9);
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(28);

    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    // October has 31 days
    expect(currentMonthDays.length).toBe(31);
    expect(currentMonthDays[0].dateString).toBe('2026-10-01');
    expect(currentMonthDays[30].dateString).toBe('2026-10-31');
  });
});
