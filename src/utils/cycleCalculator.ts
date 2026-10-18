import { AttendanceRecord, FeePayment, CycleStatus } from '../types';

/**
 * Calculates credit for a session based on duration:
 * 60 minutes = 1 class
 * 75 minutes = 1.25 classes
 * 90 minutes = 1.5 classes
 * 120 minutes = 2 classes
 */
export function getClassCredit(durationMinutes?: number): number {
  if (!durationMinutes || durationMinutes <= 0) return 1;
  return Math.round((durationMinutes / 60) * 100) / 100;
}

export function formatClassCount(count: number): string {
  if (count % 1 === 0) return `${count}`;
  return `${parseFloat(count.toFixed(2))}`;
}

export function formatClassDurationLabel(durationMinutes?: number): string {
  const credit = getClassCredit(durationMinutes);
  if (credit === 1) return '1 class';
  if (credit === 1.5) return '1.5 classes';
  if (credit === 2) return '2 classes';
  return `${formatClassCount(credit)} classes`;
}

export function calculateCycleStatus(
  records: AttendanceRecord[],
  payments: FeePayment[],
  classesPerCycle: number = 12
): CycleStatus {
  // Filter active records
  const activeRecords = records.filter((r) => !r.isDeleted);

  // Sum class credits based on duration (1 hr = 1 class, 1.5 hr = 1.5 classes, 2 hr = 2 classes)
  const totalClassesRaw = activeRecords.reduce(
    (sum, r) => sum + getClassCredit(r.durationMinutes),
    0
  );
  const totalClasses = Math.round(totalClassesRaw * 100) / 100;

  // Calculate sum of classes settled across all past payments
  const settledClasses = payments.reduce((sum, p) => sum + (p.classesSettled || 0), 0);

  // Active classes in the current rolling cycle
  const currentCycleClassesRaw = Math.max(0, totalClasses - settledClasses);
  const currentCycleClasses = Math.round(currentCycleClassesRaw * 100) / 100;

  const isDue = currentCycleClasses >= classesPerCycle;
  const unpaidCyclesCount = Math.floor(currentCycleClasses / classesPerCycle);

  const formattedCurrent = formatClassCount(currentCycleClasses);

  let displayStatus = '';
  if (currentCycleClasses === 0) {
    displayStatus = `0 of ${classesPerCycle} classes`;
  } else if (currentCycleClasses < classesPerCycle) {
    displayStatus = `Class ${formattedCurrent} of ${classesPerCycle}`;
  } else if (currentCycleClasses === classesPerCycle) {
    displayStatus = `${classesPerCycle} of ${classesPerCycle} completed (Fee Due)`;
  } else {
    displayStatus = `${formattedCurrent} classes completed (Fee Due for ${classesPerCycle})`;
  }

  return {
    totalClasses,
    settledClasses,
    currentCycleClasses,
    classesPerCycle,
    isDue,
    unpaidCyclesCount,
    displayStatus,
  };
}

export function getRemainingClassesAfterSettlement(
  currentCycleClasses: number,
  classesPerCycle: number = 12
): number {
  return Math.max(0, Math.round((currentCycleClasses - classesPerCycle) * 100) / 100);
}
