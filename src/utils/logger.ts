/**
 * Comprehensive terminal and diagnostic logger for Allwyn Tuition Attendance.
 * Outputs detailed, clean logs into the Expo / Metro terminal.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const Logger = {
  info(category: string, message: string, data?: any) {
    const time = formatTimestamp();
    if (data !== undefined) {
      console.log(`[${time}] [${category}] ${message}`, data);
    } else {
      console.log(`[${time}] [${category}] ${message}`);
    }
  },

  warn(category: string, message: string, data?: any) {
    const time = formatTimestamp();
    if (data !== undefined) {
      console.warn(`[${time}] [${category}] [WARN] ${message}`, data);
    } else {
      console.warn(`[${time}] [${category}] [WARN] ${message}`);
    }
  },

  error(category: string, message: string, error?: any) {
    const time = formatTimestamp();
    if (error !== undefined) {
      console.error(`[${time}] [${category}] [ERROR] ${message}`, error);
    } else {
      console.error(`[${time}] [${category}] [ERROR] ${message}`);
    }
  },

  debug(category: string, message: string, data?: any) {
    const time = formatTimestamp();
    if (data !== undefined) {
      console.log(`[${time}] [${category}] [DEBUG] ${message}`, data);
    } else {
      console.log(`[${time}] [${category}] [DEBUG] ${message}`);
    }
  },
};
