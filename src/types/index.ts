export interface Student {
  id: string;
  name: string;
  grade: string;
  phone: string;
  feeAmount: number; // fee amount for 12 classes
  classesPerCycle: number; // default 12
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "05:00 PM"
  endTime: string; // e.g. "06:00 PM"
  durationMinutes: number; // default 60
  createdAt: string;
  isDeleted?: boolean;
}

export interface FeePayment {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  classesSettled: number; // default 12
  createdAt: string;
}

export interface CycleStatus {
  totalClasses: number;
  settledClasses: number;
  currentCycleClasses: number;
  classesPerCycle: number;
  isDue: boolean;
  unpaidCyclesCount: number;
  displayStatus: string;
}

export interface AppData {
  students: Student[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  lastSyncTimestamp?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
