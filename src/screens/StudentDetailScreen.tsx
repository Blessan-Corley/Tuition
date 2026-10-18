import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Student, AttendanceRecord, FeePayment } from '../types';
import { StorageService } from '../utils/storage';
import {
  calculateCycleStatus,
  formatClassCount,
  formatClassDurationLabel,
} from '../utils/cycleCalculator';
import {
  getTodayDateString,
  formatReadableDate,
  getDefaultTimeWindow,
} from '../utils/dateUtils';
import { generateAttendanceReportText, formatWhatsAppUrl } from '../utils/whatsapp';
import { triggerBackgroundSync } from '../utils/syncEngine';
import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { AddAttendanceModal } from '../components/AddAttendanceModal';
import { FeeCollectedModal } from '../components/FeeCollectedModal';
import { Toast } from '../components/Toast';
import { THEME } from '../constants/theme';

interface StudentDetailScreenProps {
  student: Student;
  onBack: () => void;
  onEditStudent: () => void;
}

export const StudentDetailScreen: React.FC<StudentDetailScreenProps> = ({
  student,
  onBack,
  onEditStudent,
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayDateString());
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [feeModalVisible, setFeeModalVisible] = useState(false);

  const todayStr = getTodayDateString();

  const loadData = async () => {
    const records = await StorageService.getAttendanceForStudent(student.id);
    const pays = await StorageService.getPaymentsForStudent(student.id);
    setAttendance(records);
    setPayments(pays);
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const cycleStatus = calculateCycleStatus(attendance, payments, student.classesPerCycle || 12);
  const isMarkedToday = attendance.some((r) => r.date === todayStr && !r.isDeleted);

  // Quick mark today
  const handleQuickMarkToday = async () => {
    if (isMarkedToday) {
      const rec = attendance.find((r) => r.date === todayStr && !r.isDeleted);
      setSelectedCalendarDate(todayStr);
      setSelectedRecord(rec || null);
      setCalendarModalVisible(true);
      return;
    }

    const timeWindow = getDefaultTimeWindow(60);
    const newRecord: AttendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      date: todayStr,
      startTime: timeWindow.startTime,
      endTime: timeWindow.endTime,
      durationMinutes: 60,
      createdAt: new Date().toISOString(),
    };

    await StorageService.addAttendanceRecord(newRecord);
    await loadData();
    triggerBackgroundSync();

    setToastMessage(`Marked present for ${student.name} (1 class)`);
    setToastVisible(true);
  };

  // Calendar date clicked
  const handleSelectCalendarDate = (dateString: string) => {
    const existing = attendance.find((r) => r.date === dateString && !r.isDeleted);
    setSelectedCalendarDate(dateString);
    setSelectedRecord(existing || null);
    setCalendarModalVisible(true);
  };

  // Save attendance from modal
  const handleSaveAttendance = async (data: {
    date: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }) => {
    const record: AttendanceRecord = {
      id: selectedRecord ? selectedRecord.id : `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      createdAt: selectedRecord ? selectedRecord.createdAt : new Date().toISOString(),
    };

    await StorageService.addAttendanceRecord(record);
    await loadData();
    triggerBackgroundSync();

    const durationLabel = formatClassDurationLabel(data.durationMinutes);
    setToastMessage(`Marked present for ${student.name} (${durationLabel})`);
    setToastVisible(true);
  };

  // Delete attendance record
  const handleDeleteAttendance = async (recordId: string) => {
    await StorageService.deleteAttendanceRecord(recordId);
    await loadData();
    triggerBackgroundSync();

    setToastMessage(`Attendance record removed.`);
    setToastVisible(true);
  };

  // Record fee payment (deducts 12 classes)
  const handleConfirmFeeCollected = async (data: {
    amount: number;
    date: string;
    classesSettled: number;
  }) => {
    const payment: FeePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: student.id,
      date: data.date,
      amount: data.amount,
      classesSettled: data.classesSettled,
      createdAt: new Date().toISOString(),
    };

    await StorageService.addFeePayment(payment);
    await loadData();
    triggerBackgroundSync();

    setToastMessage(`Fee recorded. 12 classes settled!`);
    setToastVisible(true);
  };

  // WhatsApp share
  const handleShareWhatsApp = async () => {
    const reportText = generateAttendanceReportText(student, attendance, cycleStatus);
    const url = formatWhatsAppUrl(student.phone, reportText);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`);
      }
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Please ensure WhatsApp is installed on this device.');
    }
  };

  const sortedRecords = [...attendance]
    .filter((r) => !r.isDeleted)
    .sort((a, b) => b.date.localeCompare(a.date));

  const remainingInCycle = Math.max(0, cycleStatus.classesPerCycle - cycleStatus.currentCycleClasses);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Short Toast Feedback */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{student.name}</Text>
          {student.grade ? <Text style={styles.headerGrade}>{student.grade}</Text> : null}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={onEditStudent}
          accessibilityLabel="Edit student details"
        >
          <Feather name="edit-2" size={18} color={THEME.colors.textPrimary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active 12-Class Cycle Card */}
        <View style={[styles.cycleCard, cycleStatus.isDue && styles.cycleCardDue]}>
          <View style={styles.cycleHeader}>
            <Text style={styles.cycleLabel}>Active Tuition Cycle</Text>
            {cycleStatus.isDue ? (
              <View style={styles.dueTag}>
                <Text style={styles.dueTagText}>Fee Due</Text>
              </View>
            ) : (
              <View style={styles.progressTag}>
                <Text style={styles.progressTagText}>
                  {formatClassCount(remainingInCycle)} classes left in cycle
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.cycleCounterText}>
            {formatClassCount(cycleStatus.currentCycleClasses)}
            <Text style={styles.cycleTotalFraction}> / 12 classes</Text>
          </Text>

          <View style={styles.progressBarBg}>
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

          <Text style={styles.cycleExplanation}>
            {cycleStatus.isDue
              ? `${formatClassCount(cycleStatus.currentCycleClasses)} classes completed. Tap below when fee is collected to settle 12 classes and roll over excess.`
              : `Total completed since enrollment: ${formatClassCount(cycleStatus.totalClasses)} classes (${payments.length} past payments settled).`}
          </Text>

          {/* Settle Fee Button */}
          {cycleStatus.isDue && (
            <TouchableOpacity
              style={styles.collectFeeButton}
              onPress={() => setFeeModalVisible(true)}
              activeOpacity={0.8}
            >
              <Feather name="check-square" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.collectFeeButtonText}>Mark Fee Collected (Deduct 12 Classes)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, isMarkedToday && styles.actionBtnDone]}
            onPress={handleQuickMarkToday}
            activeOpacity={0.8}
          >
            <Feather
              name={isMarkedToday ? 'check-circle' : 'plus-circle'}
              size={20}
              color={isMarkedToday ? THEME.colors.successBadgeText : '#FFFFFF'}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.actionBtnText, isMarkedToday && styles.actionBtnTextDone]}>
              {isMarkedToday ? 'Marked Today' : "Mark Today's Class"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsAppBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.8}
          >
            <Feather name="share-2" size={18} color={THEME.colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.whatsAppBtnText}>Share Report (WhatsApp)</Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Month Calendar */}
        <Text style={styles.sectionTitle}>Attendance Calendar</Text>
        <Text style={styles.sectionSubtitle}>
          Tap any date to log or view class attendance.
        </Text>
        <AttendanceCalendar
          attendanceRecords={attendance}
          onSelectDate={handleSelectCalendarDate}
        />

        {/* Recent Classes Log */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Class History ({sortedRecords.length})</Text>
        </View>

        {sortedRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No classes recorded yet.</Text>
          </View>
        ) : (
          sortedRecords.slice(0, 10).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyRow}
              onPress={() => {
                setSelectedCalendarDate(item.date);
                setSelectedRecord(item);
                setCalendarModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.historyLeft}>
                <View style={styles.historyDot} />
                <View>
                  <Text style={styles.historyDate}>{formatReadableDate(item.date)}</Text>
                  <Text style={styles.historyTime}>
                    {item.startTime} – {item.endTime} ({formatClassDurationLabel(item.durationMinutes)})
                  </Text>
                </View>
              </View>

              <Feather name="chevron-right" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          ))
        )}

        {/* Past Fee Payments Log */}
        {payments.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionTitle}>Past Settlements ({payments.length})</Text>
            {payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentAmount}>Rs. {p.amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.paymentMeta}>
                    Settled {p.classesSettled} classes on {formatReadableDate(p.date)}
                  </Text>
                </View>
                <View style={styles.settledBadge}>
                  <Text style={styles.settledBadgeText}>12 Classes</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Attendance Modal */}
      <AddAttendanceModal
        visible={calendarModalVisible}
        dateString={selectedCalendarDate}
        studentName={student.name}
        existingRecord={selectedRecord}
        onClose={() => setCalendarModalVisible(false)}
        onSave={handleSaveAttendance}
        onDelete={handleDeleteAttendance}
      />

      {/* Fee Settlement Modal */}
      <FeeCollectedModal
        visible={feeModalVisible}
        studentName={student.name}
        defaultFeeAmount={student.feeAmount}
        cycleStatus={cycleStatus}
        onClose={() => setFeeModalVisible(false)}
        onConfirm={handleConfirmFeeCollected}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  headerGrade: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginLeft: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  cycleCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  cycleCardDue: {
    borderColor: THEME.colors.dueBadgeBorder,
    backgroundColor: '#FFFDF7',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dueTag: {
    backgroundColor: THEME.colors.dueBadgeBg,
    borderColor: THEME.colors.dueBadgeBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.dueBadgeText,
  },
  progressTag: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  progressTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  cycleCounterText: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  cycleTotalFraction: {
    fontSize: 18,
    fontWeight: '500',
    color: THEME.colors.textMuted,
  },
  progressBarBg: {
    height: 9,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  cycleExplanation: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  collectFeeButton: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  collectFeeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionGrid: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.primary,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDone: {
    backgroundColor: THEME.colors.successBadgeBg,
    borderWidth: 1,
    borderColor: THEME.colors.successBadgeBorder,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnTextDone: {
    color: THEME.colors.successBadgeText,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.borderStrong,
    minHeight: THEME.touchTarget.minHeight,
    borderRadius: THEME.touchTarget.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsAppBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginVertical: 4,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
    marginRight: 12,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  historyTime: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginVertical: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  paymentMeta: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  settledBadge: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  settledBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
});
