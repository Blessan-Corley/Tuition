import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, AttendanceRecord, FeePayment, AppData } from '../types';
import { Logger } from './logger';

const STORAGE_KEYS = {
  STUDENTS: '@allwyn_students_v1',
  ATTENDANCE: '@allwyn_attendance_v1',
  PAYMENTS: '@allwyn_payments_v1',
  SYNC_CONFIG: '@allwyn_sync_config_v1',
};

export const StorageService = {
  // --- Students ---
  async getStudents(): Promise<Student[]> {
    try {
      Logger.debug('Storage', 'Reading students from AsyncStorage...');
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (!data) {
        Logger.info('Storage', 'No existing students in local database. Returning empty list.');
        return [];
      }
      const parsed: Student[] = JSON.parse(data);
      const active = parsed.filter((s) => !s.isDeleted);
      Logger.info('Storage', `Retrieved ${active.length} active students (${parsed.length} total stored).`);
      return active;
    } catch (e: any) {
      Logger.error('Storage', 'Failed to get students from storage:', e?.message || e);
      return [];
    }
  },

  async getAllStudentsIncludingDeleted(): Promise<Student[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveStudent(student: Student): Promise<void> {
    try {
      Logger.info('Storage', `Saving student: ${student.name} (id: ${student.id})`);
      const all = await this.getAllStudentsIncludingDeleted();
      const existingIdx = all.findIndex((s) => s.id === student.id);
      if (existingIdx >= 0) {
        all[existingIdx] = { ...student, updatedAt: new Date().toISOString() };
        Logger.info('Storage', `Updated student ${student.name}.`);
      } else {
        all.unshift({
          ...student,
          createdAt: student.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        Logger.info('Storage', `Created new student ${student.name}.`);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(all));
    } catch (e: any) {
      Logger.error('Storage', 'Failed to save student:', e?.message || e);
      throw e;
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    try {
      Logger.info('Storage', `Soft-deleting student (id: ${studentId})`);
      const all = await this.getAllStudentsIncludingDeleted();
      const target = all.find((s) => s.id === studentId);
      if (target) {
        target.isDeleted = true;
        target.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(all));
        Logger.info('Storage', `Student ${target.name} soft-deleted safely.`);
      }
    } catch (e: any) {
      Logger.error('Storage', 'Failed to delete student:', e?.message || e);
      throw e;
    }
  },

  // --- Attendance ---
  async getAttendanceForStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (!data) return [];
      const parsed: AttendanceRecord[] = JSON.parse(data);
      const studentRecords = parsed.filter((r) => r.studentId === studentId && !r.isDeleted);
      Logger.debug('Storage', `Loaded ${studentRecords.length} attendance records for student ${studentId}`);
      return studentRecords;
    } catch (e: any) {
      Logger.error('Storage', 'Failed to get attendance records:', e?.message || e);
      return [];
    }
  },

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addAttendanceRecord(record: AttendanceRecord): Promise<void> {
    try {
      Logger.info('Storage', `Logging attendance for date: ${record.date} (duration: ${record.durationMinutes}m)`);
      const all = await this.getAllAttendance();
      const existingIdx = all.findIndex((r) => r.id === record.id);
      if (existingIdx >= 0) {
        all[existingIdx] = record;
      } else {
        all.push(record);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
      Logger.info('Storage', `Attendance recorded. Total attendance records stored: ${all.length}`);
    } catch (e: any) {
      Logger.error('Storage', 'Failed to save attendance record:', e?.message || e);
      throw e;
    }
  },

  async deleteAttendanceRecord(recordId: string): Promise<void> {
    try {
      Logger.info('Storage', `Deleting attendance record (id: ${recordId})`);
      const all = await this.getAllAttendance();
      const target = all.find((r) => r.id === recordId);
      if (target) {
        target.isDeleted = true;
        await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(all));
        Logger.info('Storage', 'Attendance record deleted.');
      }
    } catch (e: any) {
      Logger.error('Storage', 'Failed to delete attendance record:', e?.message || e);
      throw e;
    }
  },

  // --- Fee Payments ---
  async getPaymentsForStudent(studentId: string): Promise<FeePayment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) return [];
      const parsed: FeePayment[] = JSON.parse(data);
      return parsed.filter((p) => p.studentId === studentId);
    } catch (e: any) {
      Logger.error('Storage', 'Failed to get fee payments:', e?.message || e);
      return [];
    }
  },

  async getAllPayments(): Promise<FeePayment[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addFeePayment(payment: FeePayment): Promise<void> {
    try {
      Logger.info('Storage', `Recording fee payment of Rs. ${payment.amount} (Settling ${payment.classesSettled} classes)`);
      const all = await this.getAllPayments();
      all.push(payment);
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(all));
      Logger.info('Storage', `Payment recorded. Total payments: ${all.length}`);
    } catch (e: any) {
      Logger.error('Storage', 'Failed to record fee payment:', e?.message || e);
      throw e;
    }
  },

  // --- Backup & Restore ---
  async exportFullBackupJson(): Promise<string> {
    Logger.info('Storage', 'Generating full JSON backup...');
    const students = await this.getAllStudentsIncludingDeleted();
    const attendance = await this.getAllAttendance();
    const payments = await this.getAllPayments();
    const syncConfig = await this.getSyncConfig();

    const backupData: AppData = {
      students,
      attendance,
      payments,
      lastSyncTimestamp: new Date().toISOString(),
      supabaseUrl: syncConfig.supabaseUrl,
    };

    return JSON.stringify(backupData, null, 2);
  },

  async importFullBackupJson(jsonString: string): Promise<boolean> {
    try {
      Logger.info('Storage', 'Importing full JSON backup...');
      const parsed = JSON.parse(jsonString) as AppData;
      if (!parsed || !Array.isArray(parsed.students)) {
        throw new Error('Invalid backup data format');
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(parsed.students || []));
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(parsed.attendance || []));
      await AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(parsed.payments || []));

      Logger.info('Storage', 'Backup imported successfully!');
      return true;
    } catch (e: any) {
      Logger.error('Storage', 'Failed to import backup:', e?.message || e);
      return false;
    }
  },

  // --- Sync Configuration ---
  async getSyncConfig(): Promise<{ supabaseUrl: string; supabaseAnonKey: string; lastSyncedAt?: string }> {
    let storedConfig: any = {};
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
      if (data) storedConfig = JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      supabaseUrl:
        storedConfig.supabaseUrl ||
        process.env.EXPO_PUBLIC_SUPABASE_URL ||
        'https://ajgyovcfoaqubippqioi.supabase.co',
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_KEY || storedConfig.supabaseAnonKey || '',
      lastSyncedAt: storedConfig.lastSyncedAt,
    };
  },

  async saveSyncConfig(config: { supabaseUrl: string; supabaseAnonKey: string; lastSyncedAt?: string }): Promise<void> {
    try {
      Logger.info('Storage', `Saving sync config (URL: ${config.supabaseUrl}, Key length: ${config.supabaseAnonKey?.length || 0})`);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(config));
    } catch (e: any) {
      Logger.error('Storage', 'Failed to save sync config:', e?.message || e);
    }
  },
};
