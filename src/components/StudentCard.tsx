import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Student, AttendanceRecord, FeePayment } from '../types';
import { calculateCycleStatus, formatClassCount } from '../utils/cycleCalculator';
import { THEME } from '../constants/theme';

interface StudentCardProps {
  student: Student;
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  onPress: () => void;
  onQuickMarkToday: () => void;
  isMarkedToday: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  attendance,
  payments,
  onPress,
  onQuickMarkToday,
  isMarkedToday,
}) => {
  const cycleStatus = calculateCycleStatus(attendance, payments, student.classesPerCycle || 12);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.nameText}>{student.name}</Text>
          {student.grade ? <Text style={styles.gradeText}>{student.grade}</Text> : null}
        </View>

        {/* Milestone Badge */}
        {cycleStatus.isDue ? (
          <View style={styles.dueBadge}>
            <Text style={styles.dueBadgeText}>Fee Due</Text>
          </View>
        ) : (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{formatClassCount(cycleStatus.currentCycleClasses)}/12</Text>
          </View>
        )}
      </View>

      {/* Cycle Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, (cycleStatus.currentCycleClasses / 12) * 100)}%`,
                backgroundColor: cycleStatus.isDue ? THEME.colors.dueBadgeBorder : THEME.colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressStatusText}>{cycleStatus.displayStatus}</Text>
      </View>

      {/* Card Footer with Quick Action */}
      <View style={styles.footerRow}>
        <View style={styles.totalBlock}>
          <Text style={styles.totalLabel}>Total Classes</Text>
          <Text style={styles.totalValue}>{formatClassCount(cycleStatus.totalClasses)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.quickMarkButton, isMarkedToday && styles.quickMarkButtonDone]}
          onPress={onQuickMarkToday}
          activeOpacity={0.8}
        >
          <Feather
            name={isMarkedToday ? 'check-circle' : 'plus-circle'}
            size={18}
            color={isMarkedToday ? THEME.colors.successBadgeText : '#FFFFFF'}
          />
          <Text style={[styles.quickMarkText, isMarkedToday && styles.quickMarkTextDone]}>
            {isMarkedToday ? 'Marked Today' : 'Mark Today'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
    marginRight: 12,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  gradeText: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginTop: 3,
  },
  dueBadge: {
    backgroundColor: THEME.colors.dueBadgeBg,
    borderColor: THEME.colors.dueBadgeBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.dueBadgeText,
  },
  activeBadge: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  progressContainer: {
    marginTop: 14,
  },
  progressBarBackground: {
    height: 7,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStatusText: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginRight: 6,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  quickMarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
  },
  quickMarkButtonDone: {
    backgroundColor: THEME.colors.successBadgeBg,
    borderWidth: 1,
    borderColor: THEME.colors.successBadgeBorder,
  },
  quickMarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  quickMarkTextDone: {
    color: THEME.colors.successBadgeText,
  },
});
