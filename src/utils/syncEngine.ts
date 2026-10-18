import { getSupabaseClient } from './supabase';
import { StorageService } from './storage';
import { Logger } from './logger';

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error';
  lastSyncedAt: string | null;
  message: string;
}

let currentState: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  message: 'Local storage active',
};

const listeners: Array<(state: SyncState) => void> = [];

export function subscribeToSyncState(callback: (state: SyncState) => void) {
  listeners.push(callback);
  callback(currentState);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function updateState(newState: Partial<SyncState>) {
  currentState = { ...currentState, ...newState };
  listeners.forEach((cb) => cb(currentState));
}

export async function testDatabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const syncConfig = await StorageService.getSyncConfig();
    Logger.info('DatabaseTest', `Testing connection to Supabase: ${syncConfig.supabaseUrl}`);

    if (!syncConfig.supabaseAnonKey) {
      const msg = 'No publishable anon key configured. Offline-first local database active.';
      Logger.info('DatabaseTest', msg);
      return { connected: false, message: msg };
    }

    const supabase = getSupabaseClient(syncConfig.supabaseUrl, syncConfig.supabaseAnonKey);
    if (!supabase) {
      const msg = 'Failed to create Supabase client. Check URL and Key configuration.';
      Logger.warn('DatabaseTest', msg);
      return { connected: false, message: msg };
    }

    // Ping students table
    const { data, error } = await supabase.from('students').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205') {
        Logger.warn(
          'DatabaseTest',
          'Supabase is reachable! However, the tables (students, attendance_records, fee_payments) have not been created yet in your Supabase SQL Editor. Please run supabase/schema.sql.'
        );
        return {
          connected: false,
          message: 'Supabase connected, but tables need to be created in Supabase SQL editor.',
        };
      }
      Logger.error('DatabaseTest', `Supabase query returned error: ${error.message} (code: ${error.code})`);
      return { connected: false, message: `Database error: ${error.message}` };
    }

    Logger.info('DatabaseTest', 'Supabase connection verified successfully! Ready to sync.');
    return { connected: true, message: 'Supabase connected and verified.' };
  } catch (err: any) {
    Logger.error('DatabaseTest', 'Unexpected error while testing database:', err?.message || err);
    return { connected: false, message: `Connection failed: ${err?.message || 'Network error'}` };
  }
}

export async function triggerBackgroundSync(): Promise<SyncState> {
  const syncConfig = await StorageService.getSyncConfig();
  const supabase = getSupabaseClient(syncConfig.supabaseUrl, syncConfig.supabaseAnonKey);

  if (!supabase) {
    Logger.info('SyncEngine', 'Supabase client unavailable. Retaining data locally on phone.');
    updateState({
      status: 'offline',
      message: 'Offline (Data saved safely on phone)',
    });
    return currentState;
  }

  Logger.info('SyncEngine', 'Starting background synchronization with Supabase...');
  updateState({
    status: 'syncing',
    message: 'Syncing with cloud...',
  });

  try {
    // 1. Get all local records
    const localStudents = await StorageService.getAllStudentsIncludingDeleted();
    const localAttendance = await StorageService.getAllAttendance();
    const localPayments = await StorageService.getAllPayments();

    Logger.info(
      'SyncEngine',
      `Local payload: ${localStudents.length} students, ${localAttendance.length} attendance records, ${localPayments.length} fee payments`
    );

    // 2. Sync Students to Supabase
    if (localStudents.length > 0) {
      const { error: studentErr } = await supabase.from('students').upsert(
        localStudents.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          phone: s.phone,
          fee_amount: s.feeAmount,
          classes_per_cycle: s.classesPerCycle || 12,
          is_deleted: !!s.isDeleted,
          updated_at: s.updatedAt,
        }))
      );
      if (studentErr) {
        Logger.warn('SyncEngine', `Sync student upsert warning: ${studentErr.message}`);
      } else {
        Logger.info('SyncEngine', `Successfully synced ${localStudents.length} students.`);
      }
    }

    // 3. Sync Attendance to Supabase
    if (localAttendance.length > 0) {
      const { error: attErr } = await supabase.from('attendance_records').upsert(
        localAttendance.map((a) => ({
          id: a.id,
          student_id: a.studentId,
          date: a.date,
          start_time: a.startTime,
          end_time: a.endTime,
          duration_minutes: a.durationMinutes,
          is_deleted: !!a.isDeleted,
          created_at: a.createdAt,
        }))
      );
      if (attErr) {
        Logger.warn('SyncEngine', `Sync attendance upsert warning: ${attErr.message}`);
      } else {
        Logger.info('SyncEngine', `Successfully synced ${localAttendance.length} attendance records.`);
      }
    }

    // 4. Sync Fee Payments to Supabase
    if (localPayments.length > 0) {
      const { error: payErr } = await supabase.from('fee_payments').upsert(
        localPayments.map((p) => ({
          id: p.id,
          student_id: p.studentId,
          date: p.date,
          amount: p.amount,
          classes_settled: p.classesSettled,
          created_at: p.createdAt,
        }))
      );
      if (payErr) {
        Logger.warn('SyncEngine', `Sync payment upsert warning: ${payErr.message}`);
      } else {
        Logger.info('SyncEngine', `Successfully synced ${localPayments.length} fee payments.`);
      }
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateState({
      status: 'synced',
      lastSyncedAt: now,
      message: `Synced with cloud at ${now}`,
    });

    await StorageService.saveSyncConfig({
      ...syncConfig,
      lastSyncedAt: now,
    });
    Logger.info('SyncEngine', `Sync finished successfully at ${now}`);
  } catch (err: any) {
    Logger.warn('SyncEngine', 'Background sync encountered an issue (keeping local data safe):', err?.message);
    updateState({
      status: 'offline',
      message: 'Offline (Data saved safely on phone)',
    });
  }

  return currentState;
}
