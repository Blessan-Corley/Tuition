import { describe, test, expect } from '@jest/globals';
import { calculateCycleStatus, getRemainingClassesAfterSettlement } from '../src/utils/cycleCalculator';
import { AttendanceRecord, FeePayment } from '../src/types';

describe('cycleCalculator (12-class rolling cycle logic)', () => {
  const createMockAttendance = (count: number): AttendanceRecord[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `att-${i + 1}`,
      studentId: 'student-1',
      date: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`,
      startTime: '05:00 PM',
      endTime: '06:00 PM',
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    }));
  };

  test('should return 0 classes for empty attendance', () => {
    const status = calculateCycleStatus([], [], 12);
    expect(status.totalClasses).toBe(0);
    expect(status.settledClasses).toBe(0);
    expect(status.currentCycleClasses).toBe(0);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('0 of 12 classes');
  });

  test('should track classes within the first cycle before reaching 12', () => {
    const records = createMockAttendance(7);
    const status = calculateCycleStatus(records, [], 12);
    expect(status.totalClasses).toBe(7);
    expect(status.settledClasses).toBe(0);
    expect(status.currentCycleClasses).toBe(7);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('Class 7 of 12');
  });

  test('should mark fee as due when exactly 12 classes are completed', () => {
    const records = createMockAttendance(12);
    const status = calculateCycleStatus(records, [], 12);
    expect(status.totalClasses).toBe(12);
    expect(status.currentCycleClasses).toBe(12);
    expect(status.isDue).toBe(true);
    expect(status.unpaidCyclesCount).toBe(1);
    expect(status.displayStatus).toBe('12 of 12 completed (Fee Due)');
  });

  test('should allow exceeding 12 classes (e.g. 14 classes) without blocking', () => {
    const records = createMockAttendance(14);
    const status = calculateCycleStatus(records, [], 12);
    expect(status.totalClasses).toBe(14);
    expect(status.currentCycleClasses).toBe(14);
    expect(status.isDue).toBe(true);
    expect(status.displayStatus).toBe('14 classes completed (Fee Due for 12)');
  });

  test('should deduct 12 classes when fee is marked collected and carry over excess (e.g. 14 - 12 = 2)', () => {
    const records = createMockAttendance(14);
    const payment: FeePayment = {
      id: 'pay-1',
      studentId: 'student-1',
      date: '2026-10-15',
      amount: 5000,
      classesSettled: 12,
      createdAt: new Date().toISOString(),
    };

    const status = calculateCycleStatus(records, [payment], 12);
    expect(status.totalClasses).toBe(14);
    expect(status.settledClasses).toBe(12);
    expect(status.currentCycleClasses).toBe(2);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('Class 2 of 12');
  });

  test('should handle multiple consecutive cycles and settlements properly', () => {
    const records = createMockAttendance(27);
    const payments: FeePayment[] = [
      {
        id: 'pay-1',
        studentId: 'student-1',
        date: '2026-08-30',
        amount: 5000,
        classesSettled: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pay-2',
        studentId: 'student-1',
        date: '2026-09-30',
        amount: 5000,
        classesSettled: 12,
        createdAt: new Date().toISOString(),
      },
    ];

    // 27 attended - 24 settled = 3 in current cycle
    const status = calculateCycleStatus(records, payments, 12);
    expect(status.totalClasses).toBe(27);
    expect(status.settledClasses).toBe(24);
    expect(status.currentCycleClasses).toBe(3);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('Class 3 of 12');
  });

  test('should ignore soft-deleted attendance records', () => {
    const records = createMockAttendance(5);
    records[0].isDeleted = true;
    records[1].isDeleted = true;

    const status = calculateCycleStatus(records, [], 12);
    expect(status.totalClasses).toBe(3);
    expect(status.currentCycleClasses).toBe(3);
  });

  test('getRemainingClassesAfterSettlement helper returns correct carryover', () => {
    expect(getRemainingClassesAfterSettlement(14, 12)).toBe(2);
    expect(getRemainingClassesAfterSettlement(12, 12)).toBe(0);
    expect(getRemainingClassesAfterSettlement(10, 12)).toBe(0);
    expect(getRemainingClassesAfterSettlement(15, 12)).toBe(3);
    expect(getRemainingClassesAfterSettlement(13.5, 12)).toBe(1.5);
  });

  test('should credit fractional classes properly: 1h=1, 1.5h=1.5, 2h=2', () => {
    const records: AttendanceRecord[] = [
      {
        id: 'att-1',
        studentId: 'student-1',
        date: '2026-10-01',
        startTime: '05:00 PM',
        endTime: '06:00 PM',
        durationMinutes: 60, // 1 class
        createdAt: new Date().toISOString(),
      },
      {
        id: 'att-2',
        studentId: 'student-1',
        date: '2026-10-03',
        startTime: '05:00 PM',
        endTime: '06:30 PM',
        durationMinutes: 90, // 1.5 classes
        createdAt: new Date().toISOString(),
      },
      {
        id: 'att-3',
        studentId: 'student-1',
        date: '2026-10-05',
        startTime: '04:00 PM',
        endTime: '06:00 PM',
        durationMinutes: 120, // 2 classes
        createdAt: new Date().toISOString(),
      },
    ];

    // 1 + 1.5 + 2 = 4.5 classes
    const status = calculateCycleStatus(records, [], 12);
    expect(status.totalClasses).toBe(4.5);
    expect(status.currentCycleClasses).toBe(4.5);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('Class 4.5 of 12');
  });

  test('should handle fee settlement with fractional classes (e.g. 13.5 - 12 = 1.5 classes in next cycle)', () => {
    const records: AttendanceRecord[] = [
      ...createMockAttendance(12), // 12 classes (60 min each)
      {
        id: 'att-extra',
        studentId: 'student-1',
        date: '2026-10-20',
        startTime: '05:00 PM',
        endTime: '06:30 PM',
        durationMinutes: 90, // 1.5 classes -> Total 13.5
        createdAt: new Date().toISOString(),
      },
    ];

    const payment: FeePayment = {
      id: 'pay-1',
      studentId: 'student-1',
      date: '2026-10-21',
      amount: 5000,
      classesSettled: 12,
      createdAt: new Date().toISOString(),
    };

    // 13.5 - 12 = 1.5
    const status = calculateCycleStatus(records, [payment], 12);
    expect(status.totalClasses).toBe(13.5);
    expect(status.settledClasses).toBe(12);
    expect(status.currentCycleClasses).toBe(1.5);
    expect(status.isDue).toBe(false);
    expect(status.displayStatus).toBe('Class 1.5 of 12');
  });
});
