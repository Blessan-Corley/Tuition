import { Student, AttendanceRecord, CycleStatus } from '../types';
import { formatReadableDate } from './dateUtils';
import { formatClassCount, formatClassDurationLabel } from './cycleCalculator';

export function generateAttendanceReportText(
  student: Student,
  records: AttendanceRecord[],
  cycleStatus: CycleStatus
): string {
  // Sort records in chronological order
  const sorted = [...records]
    .filter((r) => !r.isDeleted)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Determine current month/period
  const latestDate = sorted.length > 0 ? sorted[sorted.length - 1].date : '';
  const periodLabel = latestDate
    ? new Date(latestDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recent Sessions';

  let text = `ALLWYN MATHS TUITION\nAttendance & Session Summary\n`;
  text += `------------------------------------\n`;
  text += `Student: ${student.name}\n`;
  if (student.grade) {
    text += `Standard/Class: ${student.grade}\n`;
  }
  text += `Period: ${periodLabel}\n`;
  text += `Total Classes Conducted: ${formatClassCount(cycleStatus.totalClasses)} classes\n`;
  text += `Current Cycle: ${formatClassCount(cycleStatus.currentCycleClasses)} of ${cycleStatus.classesPerCycle} classes\n`;
  
  if (cycleStatus.isDue) {
    text += `Status: Cycle Milestone Reached (Fee Due)\n`;
    if (student.feeAmount > 0) {
      text += `Tuition Fee Amount: Rs. ${student.feeAmount.toLocaleString('en-IN')}\n`;
    }
  } else {
    const remaining = Math.max(0, cycleStatus.classesPerCycle - cycleStatus.currentCycleClasses);
    text += `Status: ${formatClassCount(remaining)} classes remaining in current cycle\n`;
  }

  text += `------------------------------------\n`;
  text += `Session Log (${sorted.length} recorded dates):\n`;

  if (sorted.length === 0) {
    text += `No classes recorded yet.\n`;
  } else {
    // List the last 15 classes or all if fewer
    const displayList = sorted.slice(-15);
    displayList.forEach((item, index) => {
      const idx = sorted.length - displayList.length + index + 1;
      const formattedDate = formatReadableDate(item.date);
      const timeWindow = item.startTime && item.endTime ? ` (${item.startTime} - ${item.endTime})` : '';
      const durationCredit = formatClassDurationLabel(item.durationMinutes);
      text += `${idx}. ${formattedDate}${timeWindow} - ${durationCredit}\n`;
    });
    if (sorted.length > 15) {
      text += `[Showing recent 15 classes out of ${sorted.length} total]\n`;
    }
  }

  text += `------------------------------------\n`;
  text += `Thank you.\nAllwyn Maths Tuition`;

  return text;
}

export function formatWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  // Clean phone number: remove non-digits
  const clean = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
  
  if (clean) {
    // Prefix with country code 91 if 10 digits
    const phoneWithCode = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${phoneWithCode}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}
