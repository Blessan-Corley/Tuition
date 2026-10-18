import { describe, test, expect } from '@jest/globals';
import { generateAttendanceReportText, formatWhatsAppUrl } from '../src/utils/whatsapp';
import { Student, AttendanceRecord, CycleStatus } from '../src/types';

describe('whatsapp utils (Report generation and link creation)', () => {
  const student: Student = {
    id: 's1',
    name: 'Rahul Sharma',
    grade: '10th CBSE',
    phone: '9876543210',
    feeAmount: 5000,
    classesPerCycle: 12,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const records: AttendanceRecord[] = [
    {
      id: 'att-1',
      studentId: 's1',
      date: '2026-10-02',
      startTime: '05:00 PM',
      endTime: '06:00 PM',
      durationMinutes: 60,
      createdAt: '2026-10-02T12:00:00.000Z',
    },
    {
      id: 'att-2',
      studentId: 's1',
      date: '2026-10-05',
      startTime: '05:00 PM',
      endTime: '06:00 PM',
      durationMinutes: 60,
      createdAt: '2026-10-05T12:00:00.000Z',
    },
  ];

  const cycleStatus: CycleStatus = {
    totalClasses: 2,
    settledClasses: 0,
    currentCycleClasses: 2,
    classesPerCycle: 12,
    isDue: false,
    unpaidCyclesCount: 0,
    displayStatus: 'Class 2 of 12',
  };

  test('generateAttendanceReportText generates clear, zero-emoji summary', () => {
    const report = generateAttendanceReportText(student, records, cycleStatus);

    expect(report).toContain('ALLWYN MATHS TUITION');
    expect(report).toContain('Rahul Sharma');
    expect(report).toContain('10th CBSE');
    expect(report).toContain('Current Cycle: 2 of 12 classes');
    expect(report).toContain('Oct 2, 2026');
    expect(report).toContain('Oct 5, 2026');

    // Strict zero-emoji check:
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(report)).toBe(false);
  });

  test('generateAttendanceReportText mentions fee due when cycle is due', () => {
    const dueStatus: CycleStatus = {
      totalClasses: 12,
      settledClasses: 0,
      currentCycleClasses: 12,
      classesPerCycle: 12,
      isDue: true,
      unpaidCyclesCount: 1,
      displayStatus: '12 of 12 completed (Fee Due)',
    };

    const report = generateAttendanceReportText(student, records, dueStatus);
    expect(report).toContain('Status: Cycle Milestone Reached (Fee Due)');
    expect(report).toContain('Rs. 5,000');
  });

  test('formatWhatsAppUrl constructs valid free WhatsApp link', () => {
    const url = formatWhatsAppUrl('9876543210', 'Test message');
    expect(url).toContain('https://wa.me/919876543210?text=Test%20message');
  });

  test('formatWhatsAppUrl handles formatted numbers with spaces or dashes', () => {
    const url = formatWhatsAppUrl('+91 98765-43210', 'Hello');
    expect(url).toContain('wa.me/919876543210');
  });

  test('formatWhatsAppUrl handles empty phone number gracefully', () => {
    const url = formatWhatsAppUrl('', 'Generic share');
    expect(url).toContain('https://api.whatsapp.com/send?text=Generic%20share');
  });
});
