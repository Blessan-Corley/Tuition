import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getMonthMatrix, CalendarDay } from '../utils/dateUtils';
import { AttendanceRecord } from '../types';
import { THEME } from '../constants/theme';

interface AttendanceCalendarProps {
  attendanceRecords: AttendanceRecord[];
  onSelectDate: (dateString: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendanceRecords,
  onSelectDate,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth());

  // Map marked dates for fast O(1) lookup
  const markedDatesMap = new Map<string, AttendanceRecord>();
  attendanceRecords
    .filter((r) => !r.isDeleted)
    .forEach((r) => {
      markedDatesMap.set(r.date, r);
    });

  const matrix: CalendarDay[] = getMonthMatrix(currentYear, currentMonthIndex);

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Group matrix into weeks (chunks of 7)
  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < matrix.length; i += 7) {
    weeks.push(matrix.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonthIndex]} {currentYear}
        </Text>
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevMonth}
            accessibilityLabel="Previous month"
          >
            <Feather name="chevron-left" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextMonth}
            accessibilityLabel="Next month"
          >
            <Feather name="chevron-right" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weekday Labels */}
      <View style={styles.weekdayRow}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={styles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {weeks.map((week, wIndex) => (
          <View key={wIndex} style={styles.weekRow}>
            {week.map((cell) => {
              const isMarked = markedDatesMap.has(cell.dateString);
              return (
                <TouchableOpacity
                  key={cell.dateString}
                  style={[
                    styles.dayCell,
                    cell.isToday && styles.todayCell,
                    isMarked && styles.markedCell,
                  ]}
                  onPress={() => onSelectDate(cell.dateString)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !cell.isCurrentMonth && styles.dayTextOtherMonth,
                      cell.isToday && styles.todayText,
                      isMarked && styles.markedText,
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>
                  {isMarked ? (
                    <View style={styles.markedDot} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.colors.primary }]} />
          <Text style={styles.legendText}>Class Conducted</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { borderColor: THEME.colors.accent, borderWidth: 1.5, backgroundColor: 'transparent' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceSubtle,
    marginLeft: 8,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    width: 38,
    textAlign: 'center',
  },
  grid: {
    marginTop: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 3,
  },
  dayCell: {
    width: 38,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 1.5,
    borderColor: THEME.colors.accent,
  },
  markedCell: {
    backgroundColor: THEME.colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: THEME.colors.textPrimary,
  },
  dayTextOtherMonth: {
    color: '#CBD5E1', // Dimmed slate 300
  },
  todayText: {
    fontWeight: '700',
    color: THEME.colors.accent,
  },
  markedText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  markedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
});
